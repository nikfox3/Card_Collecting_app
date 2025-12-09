#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// Pokémon TCG API configuration
const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY || ''; // Optional - for higher rate limits
const DELAY_BETWEEN_REQUESTS = API_KEY ? 100 : 1000; // With key: 10/sec, Without: 1/sec
const BATCH_SIZE = 10;

class PokemonTCGPricingCollector {
  constructor() {
    this.processedCount = 0;
    this.updatedCount = 0;
    this.errorCount = 0;
    this.notFoundCount = 0;
    this.priceUpdates = [];
    this.outputFile = `price-updates-pokemontcg-${new Date().toISOString().split('T')[0]}.csv`;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchWithRetry(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (API_KEY) {
          headers['X-Api-Key'] = API_KEY;
        }

        const response = await fetch(url, { headers });
        
        if (response.status === 429) {
          console.log(`⏳ Rate limited, waiting 10 seconds...`);
          await this.delay(10000);
          continue;
        }
        
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        return await response.json();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await this.delay(1000 * attempt);
      }
    }
  }

  // Convert our database card IDs to Pokémon TCG API format
  convertCardId(dbId, setName) {
    // Our format: "swsh7-95" or "base1-4"
    // API format: "swsh7-95" or "base1-4" (mostly the same!)
    // But some sets have different IDs
    
    const setMappings = {
      'base1': 'base1',
      'base2': 'base2', 
      'base3': 'base3',
      'base4': 'base4',
      'base5': 'base5',
      'gym1': 'gym1',
      'gym2': 'gym2',
      'neo1': 'neo1',
      'neo2': 'neo2',
      'neo3': 'neo3',
      'neo4': 'neo4',
      // Add more mappings as needed
    };
    
    return dbId; // Most IDs match directly
  }

  extractPrice(cardData) {
    try {
      if (!cardData || !cardData.tcgplayer) {
        return null;
      }

      const tcgplayer = cardData.tcgplayer;
      
      // Pokémon TCG API has prices organized by variant
      const prices = tcgplayer.prices || {};
      
      // Try different variants in order of preference
      const variants = ['holofoil', 'reverseHolofoil', 'normal', 'unlimited', '1stEdition'];
      
      for (const variant of variants) {
        if (prices[variant]) {
          const variantPrices = prices[variant];
          
          // Prefer market price, then mid, then average of low/high
          const market = variantPrices.market;
          const mid = variantPrices.mid;
          const low = variantPrices.low;
          const high = variantPrices.high;
          
          // Validation: Check if market price is reasonable
          if (market && low && mid) {
            if (market < low * 0.5) {
              console.log(`   ⚠️  Suspicious market ($${market}) < low ($${low}), using mid`);
              return { price: mid, variant, source: 'mid (validated)' };
            }
            return { price: market, variant, source: 'market' };
          }
          
          // Fallback logic
          if (market) return { price: market, variant, source: 'market' };
          if (mid) return { price: mid, variant, source: 'mid' };
          if (low && high) return { price: (low + high) / 2, variant, source: 'avg(low,high)' };
          if (low) return { price: low * 1.2, variant, source: 'low+20%' };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting price:', error.message);
      return null;
    }
  }

  async searchCard(dbCard) {
    try {
      // Try direct ID lookup first
      const cardId = this.convertCardId(dbCard.id, dbCard.set_name);
      let url = `${POKEMON_TCG_API_BASE}/cards/${cardId}`;
      
      let result = await this.fetchWithRetry(url);
      
      if (result && result.data) {
        return result.data;
      }
      
      // Fallback: Search by name and set
      if (dbCard.name && dbCard.set_name) {
        const query = `name:"${dbCard.name}" set.name:"${dbCard.set_name}"`;
        url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(query)}`;
        
        result = await this.fetchWithRetry(url);
        
        if (result && result.data && result.data.length > 0) {
          return result.data[0]; // Return first match
        }
      }
      
      // Fallback: Search by name only
      if (dbCard.name) {
        const query = `name:"${dbCard.name}"`;
        url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(query)}&pageSize=5`;
        
        result = await this.fetchWithRetry(url);
        
        if (result && result.data && result.data.length > 0) {
          // Try to find best match by set name
          const bestMatch = result.data.find(card => 
            card.set.name.toLowerCase().includes(dbCard.set_name?.toLowerCase() || '')
          );
          return bestMatch || result.data[0];
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error searching for card ${dbCard.id}:`, error.message);
      return null;
    }
  }

  async collectPrices() {
    try {
      console.log('🚀 Starting Pokémon TCG API price collection...');
      console.log('📋 Using pokemontcg.io with TCGPlayer prices');
      console.log(`⏱️  Rate limit: ${API_KEY ? '10 requests/sec (with key)' : '1 request/sec (no key)'}\n`);

      // Get ALL cards
      const cards = await all(`
        SELECT c.id, c.name, c.current_value, c.number, s.name as set_name, s.id as set_id
        FROM cards c
        LEFT JOIN sets s ON c.set_id = s.id
        ORDER BY c.current_value DESC NULLS LAST
      `);

      const totalCards = cards.length;
      console.log(`📊 Found ${totalCards} cards to process\n`);

      // Create CSV header
      this.priceUpdates.push('card_id,card_name,set_name,old_price,new_price,price_change,variant,source,update_timestamp');

      const startTime = Date.now();

      for (let i = 0; i < cards.length; i += BATCH_SIZE) {
        const batch = cards.slice(i, i + BATCH_SIZE);
        
        if (i % 100 === 0 && i > 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const avgTimePerCard = elapsed / i;
          const remainingCards = totalCards - i;
          const estimatedRemaining = (avgTimePerCard * remainingCards) / 60;
          
          console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(totalCards / BATCH_SIZE)}`);
          console.log(`   Progress: ${i}/${totalCards} (${((i/totalCards)*100).toFixed(1)}%)`);
          console.log(`   ⏱️  Elapsed: ${(elapsed/60).toFixed(1)}m | Remaining: ~${estimatedRemaining.toFixed(1)}m`);
        }

        for (const card of batch) {
          this.processedCount++;

          try {
            const apiCard = await this.searchCard(card);
            
            if (!apiCard) {
              this.notFoundCount++;
              continue;
            }

            const priceInfo = this.extractPrice(apiCard);
            
            if (!priceInfo || !priceInfo.price) {
              this.notFoundCount++;
              continue;
            }

            const newPrice = priceInfo.price;
            const oldPrice = card.current_value || 0;
            const priceChange = ((newPrice - oldPrice) / Math.max(oldPrice, 0.01) * 100).toFixed(2);

            // Add to CSV data
            this.priceUpdates.push([
              card.id,
              `"${card.name.replace(/"/g, '""')}"`,
              `"${(card.set_name || '').replace(/"/g, '""')}"`,
              oldPrice.toFixed(2),
              newPrice.toFixed(2),
              priceChange,
              priceInfo.variant || 'unknown',
              priceInfo.source || 'unknown',
              new Date().toISOString()
            ].join(','));

            this.updatedCount++;

            // Save periodically
            if (this.updatedCount % 100 === 0) {
              this.saveToFile();
            }

          } catch (error) {
            this.errorCount++;
            console.error(`❌ Error processing ${card.id}: ${error.message}`);
          }

          await this.delay(DELAY_BETWEEN_REQUESTS);
        }
      }

      // Final save
      this.saveToFile();

      const totalTime = (Date.now() - startTime) / 1000 / 60;

      console.log('\n\n🎉 Price collection complete!');
      console.log(`\n📊 Final Statistics:`);
      console.log(`   • Total cards: ${totalCards}`);
      console.log(`   • Cards processed: ${this.processedCount}`);
      console.log(`   • Prices collected: ${this.updatedCount}`);
      console.log(`   • Not found: ${this.notFoundCount}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${((this.updatedCount / this.processedCount) * 100).toFixed(1)}%`);
      console.log(`   • Total time: ${totalTime.toFixed(1)} minutes`);
      console.log(`\n💾 Results saved to: ${this.outputFile}`);
      console.log(`\n📤 Next steps:`);
      console.log(`   1. Open admin dashboard (http://localhost:3003/prices)`);
      console.log(`   2. Upload ${this.outputFile}`);
      console.log(`   3. Review and import`);

    } catch (error) {
      console.error('❌ Fatal error:', error);
    }
  }

  saveToFile() {
    try {
      const content = this.priceUpdates.join('\n');
      fs.writeFileSync(this.outputFile, content, 'utf8');
      if (this.updatedCount % 100 === 0) {
        console.log(`   💾 Saved ${this.updatedCount} price updates`);
      }
    } catch (error) {
      console.error('❌ Error saving file:', error.message);
    }
  }
}

// Main execution
async function main() {
  const collector = new PokemonTCGPricingCollector();
  
  try {
    await collector.collectPrices();
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    db.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interrupted by user');
  console.log('💾 Saving progress...');
  db.close();
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PokemonTCGPricingCollector;









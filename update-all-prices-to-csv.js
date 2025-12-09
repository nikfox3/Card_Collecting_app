#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en';
const DELAY_BETWEEN_REQUESTS = 500;
const BATCH_SIZE = 10;

class PricingCollector {
  constructor() {
    this.processedCount = 0;
    this.updatedCount = 0;
    this.errorCount = 0;
    this.notFoundCount = 0;
    this.priceUpdates = [];
    this.outputFile = `price-updates-${new Date().toISOString().split('T')[0]}.csv`;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchWithRetry(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.status === 429) {
          console.log(`⏳ Rate limited, waiting 5 seconds...`);
          await this.delay(5000);
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

  extractPrice(cardData) {
    try {
      // Strategy: Use TCGPlayer if available, but validate against other prices
      if (cardData.pricing && cardData.pricing.tcgplayer) {
        const tcp = cardData.pricing.tcgplayer;
        const variant = tcp.holofoil || tcp.normal;
        
        if (variant) {
          const { marketPrice, lowPrice, midPrice, highPrice } = variant;
          
          // Validation: If marketPrice seems wrong (too low compared to mid/low)
          // Use midPrice or average of low/high instead
          if (marketPrice && lowPrice && midPrice) {
            // If marketPrice is less than half of lowPrice, it's likely outdated
            if (marketPrice < lowPrice * 0.5) {
              console.log(`   ⚠️  Suspicious marketPrice ($${marketPrice}) < lowPrice ($${lowPrice}), using midPrice`);
              return midPrice || ((lowPrice + (highPrice || midPrice || lowPrice)) / 2);
            }
            
            // If marketPrice is available and reasonable, use it
            return marketPrice;
          }
          
          // Fallback: use what's available
          if (marketPrice) return marketPrice;
          if (midPrice) return midPrice;
          if (lowPrice && highPrice) return (lowPrice + highPrice) / 2;
          if (lowPrice) return lowPrice * 1.2; // Add 20% markup as estimate
        }
      }
      
      // Fallback to Cardmarket (EUR to USD)
      if (cardData.pricing && cardData.pricing.cardmarket) {
        const cm = cardData.pricing.cardmarket;
        const eurPrice = cm['avg1'] || cm['avg7'] || cm['avg30'] || cm.avg || cm.trend;
        if (eurPrice) {
          console.log(`   💶 Using Cardmarket: €${eurPrice} → $${(eurPrice * 1.10).toFixed(2)}`);
          return eurPrice * 1.10; // EUR to USD
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async collectPrices() {
    try {
      console.log('🚀 Starting comprehensive price collection...');
      console.log('📋 This will process ALL cards in the database');
      console.log('⏱️  Estimated time: 3-4 hours for 20,700 cards\n');

      // Get ALL cards
      const cards = await all(`
        SELECT c.id, c.name, c.current_value, s.name as set_name
        FROM cards c
        LEFT JOIN sets s ON c.set_id = s.id
        ORDER BY c.current_value DESC NULLS LAST
      `);

      const totalCards = cards.length;
      console.log(`📊 Found ${totalCards} cards to process\n`);

      // Create CSV header
      this.priceUpdates.push('card_id,card_name,set_name,old_price,new_price,price_change,update_timestamp');

      const startTime = Date.now();

      for (let i = 0; i < cards.length; i += BATCH_SIZE) {
        const batch = cards.slice(i, i + BATCH_SIZE);
        
        if (i % 100 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const avgTimePerCard = elapsed / Math.max(i, 1);
          const remainingCards = totalCards - i;
          const estimatedRemaining = (avgTimePerCard * remainingCards) / 60;
          
          console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(totalCards / BATCH_SIZE)}`);
          console.log(`   Progress: ${i}/${totalCards} (${((i/totalCards)*100).toFixed(1)}%)`);
          console.log(`   ⏱️  Elapsed: ${(elapsed/60).toFixed(1)}m | Remaining: ~${estimatedRemaining.toFixed(1)}m`);
        }

        for (const card of batch) {
          this.processedCount++;

          try {
            const url = `${TCGDEX_API_BASE}/cards/${card.id}`;
            const cardData = await this.fetchWithRetry(url);
            
            if (!cardData) {
              this.notFoundCount++;
              continue;
            }

            const newPrice = this.extractPrice(cardData);
            
            if (!newPrice) {
              this.notFoundCount++;
              continue;
            }

            const oldPrice = card.current_value || 0;
            const priceChange = ((newPrice - oldPrice) / Math.max(oldPrice, 0.01) * 100).toFixed(2);

            // Add to CSV data
            this.priceUpdates.push([
              card.id,
              `"${card.name.replace(/"/g, '""')}"`, // Escape quotes
              `"${(card.set_name || '').replace(/"/g, '""')}"`,
              oldPrice.toFixed(2),
              newPrice.toFixed(2),
              priceChange,
              new Date().toISOString()
            ].join(','));

            this.updatedCount++;

            // Save periodically (every 100 cards)
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
      console.log(`   1. Open admin dashboard (http://localhost:3003)`);
      console.log(`   2. Go to Import tab`);
      console.log(`   3. Upload ${this.outputFile}`);
      console.log(`   4. Review and confirm the price updates`);

    } catch (error) {
      console.error('❌ Fatal error:', error);
    }
  }

  saveToFile() {
    try {
      const content = this.priceUpdates.join('\n');
      fs.writeFileSync(this.outputFile, content, 'utf8');
      console.log(`   💾 Saved ${this.updatedCount} price updates to ${this.outputFile}`);
    } catch (error) {
      console.error('❌ Error saving file:', error.message);
    }
  }
}

// Main execution
async function main() {
  const collector = new PricingCollector();
  
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

export default PricingCollector;

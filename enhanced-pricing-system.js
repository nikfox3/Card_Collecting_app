#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'cards.db');

class EnhancedPricingSystem {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.stats = {
      cardsProcessed: 0,
      pricesUpdated: 0,
      errors: []
    };
  }

  async fetchPokemonTCGData(cardId) {
    try {
      // Try Pokemon TCG API first
      const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`);
      if (response.ok) {
        const data = await response.json();
        return {
          source: 'Pokemon TCG API',
          data: data.data,
          success: true
        };
      }
    } catch (error) {
      console.log(`Pokemon TCG API failed for ${cardId}: ${error.message}`);
    }

    try {
      // Fallback to TCGdx API
      const response = await fetch(`https://api.tcgdx.net/v2/en/cards/${cardId}`);
      if (response.ok) {
        const data = await response.json();
        return {
          source: 'TCGdx API',
          data: data,
          success: true
        };
      }
    } catch (error) {
      console.log(`TCGdx API failed for ${cardId}: ${error.message}`);
    }

    return {
      source: 'None',
      data: null,
      success: false
    };
  }

  async updateCardPricing(cardId) {
    try {
      const result = await this.fetchPokemonTCGData(cardId);
      
      if (!result.success || !result.data) {
        console.log(`❌ No pricing data found for ${cardId}`);
        return false;
      }

      const card = result.data;
      let currentValue = 0;

      // Extract pricing data based on source
      if (result.source === 'Pokemon TCG API') {
        // Pokemon TCG API pricing structure
        if (card.tcgplayer?.prices?.holofoil?.market) {
          currentValue = card.tcgplayer.prices.holofoil.market;
        } else if (card.tcgplayer?.prices?.normal?.market) {
          currentValue = card.tcgplayer.prices.normal.market;
        } else if (card.tcgplayer?.prices?.reverseHolofoil?.market) {
          currentValue = card.tcgplayer.prices.reverseHolofoil.market;
        }
      } else if (result.source === 'TCGdx API') {
        // TCGdx API pricing structure
        if (card.prices?.tcgplayer?.holofoil?.market) {
          currentValue = card.prices.tcgplayer.holofoil.market;
        } else if (card.prices?.tcgplayer?.normal?.market) {
          currentValue = card.prices.tcgplayer.normal.market;
        }
      }

      if (currentValue > 0) {
        // Update price history
        await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT OR REPLACE INTO price_history (product_id, date, price, source)
             VALUES (?, ?, ?, ?)`,
            [cardId, new Date().toISOString().split('T')[0], currentValue, result.source],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        // Update current value in cards table
        await new Promise((resolve, reject) => {
          this.db.run(
            `UPDATE cards SET current_value = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [currentValue, cardId],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        console.log(`✅ Updated ${cardId}: $${currentValue} (${result.source})`);
        this.stats.pricesUpdated++;
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error updating pricing for ${cardId}:`, error.message);
      this.stats.errors.push({ cardId, error: error.message });
      return false;
    }
  }

  async updateAllCardPricing() {
    console.log('🚀 Starting enhanced pricing update...\n');

    try {
      // Get all cards that need pricing updates
      const cards = await new Promise((resolve, reject) => {
        this.db.all(
          `SELECT id, name, current_value, updated_at 
           FROM cards 
           WHERE current_value IS NULL OR current_value = 0 OR updated_at < date('now', '-7 days')
           ORDER BY updated_at ASC
           LIMIT 100`,
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      console.log(`Found ${cards.length} cards needing pricing updates`);

      if (cards.length === 0) {
        console.log('✅ All cards have recent pricing data');
        return;
      }

      // Process cards in batches
      const batchSize = 10;
      for (let i = 0; i < cards.length; i += batchSize) {
        const batch = cards.slice(i, i + batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(cards.length/batchSize)}`);
        
        const promises = batch.map(card => this.updateCardPricing(card.id));
        await Promise.all(promises);
        
        this.stats.cardsProcessed += batch.length;
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < cards.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('\n✅ Enhanced pricing update completed!');
      this.printStats();

    } catch (error) {
      console.error('❌ Enhanced pricing update failed:', error.message);
      this.stats.errors.push({ error: error.message });
    }
  }

  async validatePricingData() {
    console.log('🔍 Validating pricing data...\n');

    try {
      // Check for suspicious prices
      const suspiciousPrices = await new Promise((resolve, reject) => {
        this.db.all(
          `SELECT id, name, current_value, s.name as set_name
           FROM cards c
           JOIN sets s ON c.set_id = s.id
           WHERE c.current_value > 10000
           ORDER BY c.current_value DESC
           LIMIT 20`,
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      if (suspiciousPrices.length > 0) {
        console.log(`⚠️  Found ${suspiciousPrices.length} cards with prices over $10,000:`);
        suspiciousPrices.forEach(card => {
          console.log(`  - ${card.name} (${card.set_name}): $${card.current_value.toLocaleString()}`);
        });
      } else {
        console.log('✅ No suspicious high prices found');
      }

      // Check pricing coverage
      const coverage = await new Promise((resolve, reject) => {
        this.db.get(
          `SELECT 
             COUNT(*) as total_cards,
             COUNT(CASE WHEN current_value > 0 THEN 1 END) as cards_with_prices,
             ROUND(AVG(current_value), 2) as avg_price,
             MIN(current_value) as min_price,
             MAX(current_value) as max_price
           FROM cards`,
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const coveragePercent = Math.round((coverage.cards_with_prices / coverage.total_cards) * 100);
      
      console.log('\n📊 Pricing Coverage:');
      console.log(`  Total cards: ${coverage.total_cards.toLocaleString()}`);
      console.log(`  Cards with prices: ${coverage.cards_with_prices.toLocaleString()} (${coveragePercent}%)`);
      console.log(`  Average price: $${coverage.avg_price}`);
      console.log(`  Price range: $${coverage.min_price} - $${coverage.max_price.toLocaleString()}`);

    } catch (error) {
      console.error('❌ Pricing validation failed:', error.message);
    }
  }

  printStats() {
    console.log('\n📊 Pricing Update Statistics:');
    console.log(`  Cards processed: ${this.stats.cardsProcessed}`);
    console.log(`  Prices updated: ${this.stats.pricesUpdated}`);
    console.log(`  Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.slice(0, 10).forEach((error, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(error)}`);
      });
      
      if (this.stats.errors.length > 10) {
        console.log(`  ... and ${this.stats.errors.length - 10} more errors`);
      }
    }
  }

  close() {
    this.db.close();
  }
}

// Main execution
async function main() {
  const pricingSystem = new EnhancedPricingSystem();
  
  try {
    // Update pricing data
    await pricingSystem.updateAllCardPricing();
    
    // Validate the results
    await pricingSystem.validatePricingData();
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    pricingSystem.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default EnhancedPricingSystem;








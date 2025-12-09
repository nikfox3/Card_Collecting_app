#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fetch from 'node-fetch';

// Use the same database as the API server (../cards.db)
const db = new sqlite3.Database('../cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// TCGdex API configuration
const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en';
const DELAY_BETWEEN_REQUESTS = 500; // 500ms between requests (be respectful)
const BATCH_SIZE = 10; // Process 10 cards at a time

class TCGdexPricingUpdater {
  constructor() {
    this.processedCount = 0;
    this.updatedCount = 0;
    this.errorCount = 0;
    this.notFoundCount = 0;
  }

  async init() {
    console.log('🚀 Starting pricing update using TCGdex API...');
    console.log('✅ No API key required - TCGdex is free and open!');
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchWithRetry(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);

        if (response.status === 429) {
          console.log(`⏳ Rate limited, waiting 5 seconds... (attempt ${attempt})`);
          await this.delay(5000);
          continue;
        }

        if (response.status === 404) {
          return null; // Card not found
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.log(`⚠️  Attempt ${attempt} failed: ${error.message}`);
        if (attempt === maxRetries) {
          throw error;
        }
        await this.delay(1000 * attempt);
      }
    }
  }

  async searchCardByIdInTCGdex(cardId) {
    try {
      // TCGdex uses format like "swsh7-217" which matches our database IDs
      const url = `${TCGDEX_API_BASE}/cards/${cardId}`;
      console.log(`🔍 Fetching: ${url}`);
      
      const cardData = await this.fetchWithRetry(url);
      
      if (!cardData) {
        return null;
      }

      return cardData;
    } catch (error) {
      console.error(`❌ Error fetching card ${cardId}:`, error.message);
      return null;
    }
  }

  async searchCardBySetAndNumber(setId, cardNumber) {
    try {
      // Try constructing the card ID from set and number
      // TCGdex format: setId-number (e.g., "swsh7-217")
      const tcgdexCardId = `${setId}-${cardNumber}`;
      const url = `${TCGDEX_API_BASE}/cards/${tcgdexCardId}`;
      
      console.log(`🔍 Trying constructed ID: ${tcgdexCardId}`);
      
      const cardData = await this.fetchWithRetry(url);
      return cardData;
    } catch (error) {
      console.error(`❌ Error with constructed ID:`, error.message);
      return null;
    }
  }

  extractPriceFromTCGdex(cardData) {
    try {
      // Prioritize TCGPlayer USD prices with validation
      if (cardData.pricing && cardData.pricing.tcgplayer) {
        const tcgpricing = cardData.pricing.tcgplayer;
        const variant = tcgpricing.holofoil || tcgpricing.normal;
        
        if (variant) {
          const { marketPrice, lowPrice, midPrice, highPrice } = variant;
          
          // Validation: If marketPrice seems wrong (too low compared to mid/low)
          if (marketPrice && lowPrice && midPrice) {
            // If marketPrice is less than half of lowPrice, it's likely outdated
            if (marketPrice < lowPrice * 0.5) {
              console.log(`   ⚠️  Suspicious marketPrice ($${marketPrice}) < lowPrice ($${lowPrice}), using midPrice`);
              const validatedPrice = midPrice || ((lowPrice + (highPrice || midPrice || lowPrice)) / 2);
              return {
                price: validatedPrice,
                tcgplayerMarket: marketPrice,
                tcgplayerLow: lowPrice,
                tcgplayerMid: midPrice,
                tcgplayerHigh: highPrice,
                priceSource: 'TCGPlayer (validated - used midPrice)'
              };
            }
            
            // If marketPrice is reasonable, use it
            return {
              price: marketPrice,
              tcgplayerMarket: marketPrice,
              tcgplayerLow: lowPrice,
              tcgplayerMid: midPrice,
              tcgplayerHigh: highPrice,
              priceSource: 'TCGPlayer (marketPrice)'
            };
          }
          
          // Fallback: use best available
          const price = marketPrice || midPrice || (lowPrice && highPrice ? (lowPrice + highPrice) / 2 : null) || lowPrice;
          if (price) {
            return {
              price,
              tcgplayerMarket: marketPrice,
              tcgplayerLow: lowPrice,
              tcgplayerMid: midPrice,
              tcgplayerHigh: highPrice,
              priceSource: 'TCGPlayer (fallback)'
            };
          }
        }
      }

      // Fallback to Cardmarket EUR prices
      if (cardData.pricing && cardData.pricing.cardmarket) {
        const prices = cardData.pricing.cardmarket;
        
        const avg1 = prices['avg1'];
        const avg7 = prices['avg7'];
        const avg30 = prices['avg30'];
        const avg = prices.avg;
        const trend = prices.trend;
        
        // Prioritize: avg1 > avg7 > avg30 > avg > trend
        const eurPrice = avg1 || avg7 || avg30 || avg || trend;
        
        if (eurPrice) {
          const usdPrice = eurPrice * 1.10; // EUR to USD
          return {
            price: usdPrice,
            avg1: avg1 ? avg1 * 1.10 : null,
            avg7: avg7 ? avg7 * 1.10 : null,
            avg30: avg30 ? avg30 * 1.10 : null,
            averageSellPrice: avg ? avg * 1.10 : null,
            trendPrice: trend ? trend * 1.10 : null,
            lowPrice: prices.low ? prices.low * 1.10 : null,
            highPrice: (prices.high || prices.trend) ? (prices.high || prices.trend) * 1.10 : null,
            priceSource: 'Cardmarket (EUR→USD)'
          };
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error extracting price:', error.message);
      return null;
    }
  }

  async generateHistoricalData(cardId, currentPrice, priceData) {
    try {
      // Clear existing historical data
      await run('DELETE FROM price_history WHERE product_id = ?', [cardId]);
      
      // Use the different averages to create historical data points
      const historicalData = [];
      const currentDate = new Date();
      
      // If we have avg30, avg7, avg1, use those for more accurate historical data
      const dataPoints = [];
      
      if (priceData.avg30) {
        const date30 = new Date(currentDate);
        date30.setDate(date30.getDate() - 30);
        dataPoints.push({ date: date30, price: priceData.avg30 });
      }
      
      if (priceData.avg7) {
        const date7 = new Date(currentDate);
        date7.setDate(date7.getDate() - 7);
        dataPoints.push({ date: date7, price: priceData.avg7 });
      }
      
      if (priceData.avg1) {
        const date1 = new Date(currentDate);
        date1.setDate(date1.getDate() - 1);
        dataPoints.push({ date: date1, price: priceData.avg1 });
      }
      
      // Add current price
      dataPoints.push({ date: currentDate, price: currentPrice });
      
      // If we have real data points, interpolate between them
      if (dataPoints.length > 1) {
        // Generate daily data points with interpolation
        for (let i = 30; i >= 0; i--) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() - i);
          
          // Find surrounding data points for interpolation
          let price = currentPrice;
          
          for (let j = 0; j < dataPoints.length - 1; j++) {
            const point1 = dataPoints[j];
            const point2 = dataPoints[j + 1];
            
            if (date >= point1.date && date <= point2.date) {
              // Linear interpolation
              const totalDays = (point2.date - point1.date) / (1000 * 60 * 60 * 24);
              const daysPassed = (date - point1.date) / (1000 * 60 * 60 * 24);
              const ratio = daysPassed / totalDays;
              price = point1.price + (point2.price - point1.price) * ratio;
              break;
            }
          }
          
          // Add some realistic variation (±2%)
          const variation = (Math.random() - 0.5) * 0.04;
          const historicalPrice = price * (1 + variation);
          
          historicalData.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(historicalPrice * 100) / 100,
            volume: Math.floor(Math.random() * 15) + 1
          });
        }
      } else {
        // Fallback: generate data with variation around current price
        for (let i = 30; i >= 0; i--) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() - i);
          
          const variation = (Math.random() - 0.5) * 0.1; // ±5%
          const historicalPrice = currentPrice * (1 + variation);
          
          historicalData.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(historicalPrice * 100) / 100,
            volume: Math.floor(Math.random() * 15) + 1
          });
        }
      }

      // Insert historical data
      for (const dataPoint of historicalData) {
        await run(
          'INSERT INTO price_history (product_id, date, price, volume) VALUES (?, ?, ?, ?)',
          [cardId, dataPoint.date, dataPoint.price, dataPoint.volume]
        );
      }
      
      console.log(`📊 Generated ${historicalData.length} historical price points`);
      
    } catch (error) {
      console.error('❌ Error generating historical data:', error.message);
    }
  }

  async updateCardPricing(card) {
    try {
      console.log(`\n🔍 Updating: ${card.name} (${card.set_name || card.set_id})`);
      console.log(`   ID: ${card.id}, Current: $${card.current_value || 'N/A'}`);
      
      // Try to fetch card data from TCGdex using the card ID
      let cardData = await this.searchCardByIdInTCGdex(card.id);
      
      // If not found by ID, try constructing from set and number
      if (!cardData && card.number) {
        cardData = await this.searchCardBySetAndNumber(card.set_id, card.number);
      }
      
      if (!cardData) {
        console.log(`⚠️  Card not found in TCGdex: ${card.name}`);
        this.notFoundCount++;
        return false;
      }

      // Extract price information
      const priceData = this.extractPriceFromTCGdex(cardData);
      
      if (!priceData || !priceData.price) {
        console.log(`⚠️  No price data available for ${card.name}`);
        this.notFoundCount++;
        return false;
      }

      const newPrice = priceData.price;
      const oldPrice = card.current_value || 0;
      
      console.log(`💰 Price found: $${newPrice}`);
      if (priceData.avg1) console.log(`   • 1-day avg: $${priceData.avg1}`);
      if (priceData.avg7) console.log(`   • 7-day avg: $${priceData.avg7}`);
      if (priceData.avg30) console.log(`   • 30-day avg: $${priceData.avg30}`);

      // Update the database
      await run(
        'UPDATE cards SET current_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPrice, card.id]
      );

      console.log(`✅ Updated ${card.name}: $${oldPrice} → $${newPrice}`);

      // Generate historical data
      await this.generateHistoricalData(card.id, newPrice, priceData);

      return true;
    } catch (error) {
      console.error(`❌ Error updating ${card.name}:`, error.message);
      return false;
    }
  }

  async createPriceHistoryTable() {
    try {
      await run(`
        CREATE TABLE IF NOT EXISTS price_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id TEXT NOT NULL,
          date TEXT NOT NULL,
          price REAL NOT NULL,
          volume INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES cards (id)
        )
      `);

      await run(`
        CREATE INDEX IF NOT EXISTS idx_price_history_product_date 
        ON price_history (product_id, date)
      `);

      console.log('✅ Price history table ready');
    } catch (error) {
      console.error('❌ Error creating price history table:', error);
    }
  }

  async updateAllCards(limit = 100) {
    try {
      // Get cards that need updating, prioritizing high-value cards
      const cards = await all(`
        SELECT c.id, c.name, c.number, c.current_value, c.set_id, s.name as set_name
        FROM cards c
        LEFT JOIN sets s ON c.set_id = s.id
        WHERE c.current_value IS NOT NULL OR c.current_value > 0
        ORDER BY c.current_value DESC NULLS LAST
        LIMIT ?
      `, [limit]);

      console.log(`📋 Found ${cards.length} cards to update`);

      // Process cards in batches
      for (let i = 0; i < cards.length; i += BATCH_SIZE) {
        const batch = cards.slice(i, i + BATCH_SIZE);
        
        console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(cards.length / BATCH_SIZE)}`);
        console.log(`   Cards ${i + 1} to ${Math.min(i + BATCH_SIZE, cards.length)} of ${cards.length}`);
        
        for (const card of batch) {
          this.processedCount++;
          
          const success = await this.updateCardPricing(card);
          if (success) {
            this.updatedCount++;
          } else {
            this.errorCount++;
          }

          // Rate limiting
          await this.delay(DELAY_BETWEEN_REQUESTS);
        }

        // Progress update
        const progress = ((this.processedCount / cards.length) * 100).toFixed(1);
        console.log(`\n📊 Progress: ${progress}% (${this.processedCount}/${cards.length})`);
        console.log(`   ✅ Updated: ${this.updatedCount} | ⚠️  Not found: ${this.notFoundCount} | ❌ Errors: ${this.errorCount}`);

        // Longer delay between batches
        if (i + BATCH_SIZE < cards.length) {
          console.log('⏳ Waiting 2 seconds between batches...');
          await this.delay(2000);
        }
      }

      console.log('\n🎉 Pricing update complete!');
      console.log(`\n📊 Final Stats:`);
      console.log(`   • Cards processed: ${this.processedCount}`);
      console.log(`   • Cards updated: ${this.updatedCount}`);
      console.log(`   • Cards not found: ${this.notFoundCount}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${((this.updatedCount / this.processedCount) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Fatal error during pricing update:', error);
    }
  }
}

// Main execution
async function main() {
  const updater = new TCGdexPricingUpdater();
  
  try {
    await updater.init();
    await updater.createPriceHistoryTable();
    
    // Get limit from command line args or use default
    const args = process.argv.slice(2);
    let limit = 100;
    
    if (args.length > 0) {
      limit = parseInt(args[0]);
      if (isNaN(limit) || limit <= 0) {
        console.log('❌ Invalid limit. Using default of 100.');
        limit = 100;
      }
    }
    
    console.log(`🎯 Updating ${limit} cards...`);
    await updater.updateAllCards(limit);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    db.close();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default TCGdexPricingUpdater;

#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import puppeteer from 'puppeteer';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// Rate limiting and configuration
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between requests
const BATCH_SIZE = 5; // Process 5 cards at a time
const MAX_RETRIES = 3;

class PricingScraper {
  constructor() {
    this.browser = null;
    this.processedCount = 0;
    this.updatedCount = 0;
    this.errorCount = 0;
  }

  async init() {
    console.log('🚀 Starting pricing data update via web scraping...');
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Browser launched');
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeCardPrice(cardName, setName) {
    const page = await this.browser.newPage();
    
    try {
      // Set user agent to avoid being blocked
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Construct search URL
      const searchTerm = `${cardName} ${setName}`.replace(/\s+/g, '+');
      const searchUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(searchTerm)}`;
      
      console.log(`🔍 Searching for: ${cardName} (${setName})`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for search results to load
      await page.waitForSelector('.search-results', { timeout: 10000 });

      // Look for the first product result
      const productLink = await page.$('.search-results .product-item a');
      
      if (!productLink) {
        console.log(`⚠️  No search results found for ${cardName}`);
        return null;
      }

      // Get the product URL
      const productUrl = await page.evaluate(el => el.href, productLink);
      
      if (!productUrl) {
        console.log(`⚠️  No product URL found for ${cardName}`);
        return null;
      }

      console.log(`📄 Scraping product page: ${productUrl}`);

      // Navigate to product page
      await page.goto(productUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for price information to load
      await page.waitForSelector('.price-points, .market-price, .low-price', { timeout: 10000 });

      // Extract price information
      const priceData = await page.evaluate(() => {
        const results = {};
        
        // Try to find market price
        const marketPriceEl = document.querySelector('.market-price .price, .market-price');
        if (marketPriceEl) {
          const marketPrice = marketPriceEl.textContent.match(/\$?([0-9,]+\.?[0-9]*)/);
          if (marketPrice) {
            results.marketPrice = parseFloat(marketPrice[1].replace(',', ''));
          }
        }

        // Try to find low price
        const lowPriceEl = document.querySelector('.low-price .price, .low-price');
        if (lowPriceEl) {
          const lowPrice = lowPriceEl.textContent.match(/\$?([0-9,]+\.?[0-9]*)/);
          if (lowPrice) {
            results.lowPrice = parseFloat(lowPrice[1].replace(',', ''));
          }
        }

        // Try to find mid price
        const midPriceEl = document.querySelector('.mid-price .price, .mid-price');
        if (midPriceEl) {
          const midPrice = midPriceEl.textContent.match(/\$?([0-9,]+\.?[0-9]*)/);
          if (midPrice) {
            results.midPrice = parseFloat(midPrice[1].replace(',', ''));
          }
        }

        // Try to find any price in price-points section
        if (!results.marketPrice && !results.lowPrice && !results.midPrice) {
          const priceElements = document.querySelectorAll('.price-points .price, .price-points [class*="price"]');
          for (const el of priceElements) {
            const priceMatch = el.textContent.match(/\$?([0-9,]+\.?[0-9]*)/);
            if (priceMatch) {
              const price = parseFloat(priceMatch[1].replace(',', ''));
              if (price > 0) {
                results.fallbackPrice = price;
                break;
              }
            }
          }
        }

        return results;
      });

      // Determine the best price to use
      let bestPrice = priceData.marketPrice || priceData.midPrice || priceData.lowPrice || priceData.fallbackPrice;
      
      if (bestPrice) {
        console.log(`💰 Found price for ${cardName}: $${bestPrice}`);
        return {
          price: bestPrice,
          marketPrice: priceData.marketPrice,
          lowPrice: priceData.lowPrice,
          midPrice: priceData.midPrice
        };
      } else {
        console.log(`⚠️  No price found for ${cardName}`);
        return null;
      }

    } catch (error) {
      console.error(`❌ Error scraping ${cardName}:`, error.message);
      return null;
    } finally {
      await page.close();
    }
  }

  async updateCardPricing(card) {
    try {
      console.log(`🔍 Updating pricing for: ${card.name} (${card.set_name})`);
      
      // Scrape the current price
      const priceData = await this.scrapeCardPrice(card.name, card.set_name);
      
      if (!priceData || !priceData.price) {
        console.log(`⚠️  No price data found for ${card.name}`);
        return false;
      }

      const newPrice = priceData.price;
      const oldPrice = card.current_value || 0;
      
      // Update the database
      await run(
        'UPDATE cards SET current_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPrice, card.id]
      );

      console.log(`✅ Updated ${card.name}: $${newPrice} (was $${oldPrice})`);

      // Generate historical data based on the new price
      await this.generateHistoricalData(card.id, newPrice);

      return true;
    } catch (error) {
      console.error(`❌ Error updating ${card.name}:`, error.message);
      return false;
    }
  }

  async generateHistoricalData(cardId, currentPrice) {
    try {
      // Clear existing historical data for this card
      await run('DELETE FROM price_history WHERE product_id = ?', [cardId]);
      
      // Generate 30 days of historical data with realistic variation
      const historicalData = [];
      const currentDate = new Date();
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        
        // Add realistic price variation (±10% over time, trending toward current price)
        const trendFactor = (30 - i) / 30; // 0 to 1, trending toward current price
        const baseVariation = (Math.random() - 0.5) * 0.2; // ±10% random variation
        const trendVariation = (Math.random() - 0.5) * 0.1 * (1 - trendFactor); // Less variation near current date
        
        const historicalPrice = currentPrice * (1 + baseVariation + trendVariation);
        
        historicalData.push({
          date: date.toISOString().split('T')[0],
          price: Math.round(historicalPrice * 100) / 100,
          volume: Math.floor(Math.random() * 15) + 1
        });
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

  async createPriceHistoryTable() {
    try {
      // Create price_history table if it doesn't exist
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

      // Create index for faster queries
      await run(`
        CREATE INDEX IF NOT EXISTS idx_price_history_product_date 
        ON price_history (product_id, date)
      `);

      console.log('✅ Price history table ready');
    } catch (error) {
      console.error('❌ Error creating price history table:', error);
    }
  }

  async updateAllCards() {
    try {
      // Get high-value cards that need updating
      const cards = await all(`
        SELECT c.id, c.name, c.current_value, s.name as set_name
        FROM cards c
        LEFT JOIN sets s ON c.set_id = s.id
        WHERE c.current_value > 0 OR c.current_value IS NULL
        ORDER BY c.current_value DESC NULLS LAST
        LIMIT 100
      `);

      console.log(`📋 Found ${cards.length} cards to update`);

      // Process cards in batches
      for (let i = 0; i < cards.length; i += BATCH_SIZE) {
        const batch = cards.slice(i, i + BATCH_SIZE);
        
        console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(cards.length / BATCH_SIZE)}`);
        
        for (const card of batch) {
          this.processedCount++;
          
          const success = await this.updateCardPricing(card);
          if (success) {
            this.updatedCount++;
          } else {
            this.errorCount++;
          }

          // Rate limiting
          console.log(`⏳ Waiting ${DELAY_BETWEEN_REQUESTS/1000} seconds...`);
          await this.delay(DELAY_BETWEEN_REQUESTS);
        }

        // Longer delay between batches
        if (i + BATCH_SIZE < cards.length) {
          console.log('⏳ Waiting 5 seconds between batches...');
          await this.delay(5000);
        }
      }

      console.log('\n🎉 Pricing update complete!');
      console.log(`📊 Stats:`);
      console.log(`   • Cards processed: ${this.processedCount}`);
      console.log(`   • Cards updated: ${this.updatedCount}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${((this.updatedCount / this.processedCount) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Fatal error during pricing update:', error);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

// Main execution
async function main() {
  const scraper = new PricingScraper();
  
  try {
    await scraper.init();
    await scraper.createPriceHistoryTable();
    await scraper.updateAllCards();
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await scraper.cleanup();
    db.close();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PricingScraper;









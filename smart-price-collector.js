#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// API Configuration
const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2';
const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en';
const DELAY_BETWEEN_REQUESTS = 1000; // Increased for stability
const MAX_RETRIES = 2; // Reduced retries to fail faster
const BATCH_SIZE = 20; // Process in smaller batches

class SmartPriceCollector {
  constructor() {
    this.stats = {
      totalCards: 0,
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      pokemonTcgApi: 0,
      tcgdxApi: 0,
      fallbackUsed: 0
    };
    
    this.outputFile = `price-updates-${new Date().toISOString().split('T')[0]}.csv`;
    this.logFile = `logs/price-collection-${new Date().toISOString().split('T')[0]}.log`;
    
    // Ensure logs directory exists
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchWithTimeout(url, timeout = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Pokemon-Card-Collector/1.0',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') || 5;
        this.log(`⏳ Rate limited, waiting ${retryAfter} seconds...`);
        await this.delay(retryAfter * 1000);
        return null; // Return null to try again
      }
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async getPokemonTcgApiPrice(cardId) {
    try {
      // Try direct ID lookup first
      let url = `${POKEMON_TCG_API_BASE}/cards/${cardId}`;
      let data = await this.fetchWithTimeout(url);
      
      if (!data || !data.data) {
        // If direct lookup fails, try searching by name
        const cardInfo = await this.getCardInfo(cardId);
        if (cardInfo && cardInfo.name) {
          url = `${POKEMON_TCG_API_BASE}/cards?q=name:"${encodeURIComponent(cardInfo.name)}"`;
          const searchData = await this.fetchWithTimeout(url);
          if (searchData && searchData.data && searchData.data.length > 0) {
            data = searchData;
          }
        }
      }

      if (!data || !data.data) {
        return null;
      }

      const card = Array.isArray(data.data) ? data.data[0] : data.data;
      
      if (!card.tcgplayer || !card.tcgplayer.prices) {
        return null;
      }

      // Priority order: market, mid, low, high
      const prices = card.tcgplayer.prices;
      const variants = ['holofoil', 'normal', 'reverseHolofoil', '1stEditionHolofoil'];
      
      for (const variant of variants) {
        if (prices[variant]) {
          const variantPrices = prices[variant];
          
          // TCGplayer pricing priority: market > mid > average of low/high
          if (variantPrices.market && variantPrices.market > 0) {
            this.stats.pokemonTcgApi++;
            return {
              price: variantPrices.market,
              source: 'Pokemon TCG API (TCGplayer Market)',
              variant: variant
            };
          }
          
          if (variantPrices.mid && variantPrices.mid > 0) {
            this.stats.pokemonTcgApi++;
            return {
              price: variantPrices.mid,
              source: 'Pokemon TCG API (TCGplayer Mid)',
              variant: variant
            };
          }
          
          if (variantPrices.low && variantPrices.high && variantPrices.low > 0 && variantPrices.high > 0) {
            this.stats.pokemonTcgApi++;
            return {
              price: (variantPrices.low + variantPrices.high) / 2,
              source: 'Pokemon TCG API (TCGplayer Average)',
              variant: variant
            };
          }
        }
      }

      return null;
    } catch (error) {
      // Don't log every timeout as error, just return null
      return null;
    }
  }

  async getTcgdxApiPrice(cardId) {
    try {
      const url = `${TCGDEX_API_BASE}/cards/${cardId}`;
      const data = await this.fetchWithTimeout(url);
      
      if (!data || !data.pricing) {
        return null;
      }

      // Priority: TCGplayer > Cardmarket
      if (data.pricing.tcgplayer) {
        const tcp = data.pricing.tcgplayer;
        const variant = tcp.holofoil || tcp.normal;
        
        if (variant) {
          const { marketPrice, midPrice, lowPrice, highPrice } = variant;
          
          if (marketPrice && marketPrice > 0) {
            this.stats.tcgdxApi++;
            return {
              price: marketPrice,
              source: 'TCGdx API (TCGplayer Market)',
              variant: 'tcgplayer'
            };
          }
          
          if (midPrice && midPrice > 0) {
            this.stats.tcgdxApi++;
            return {
              price: midPrice,
              source: 'TCGdx API (TCGplayer Mid)',
              variant: 'tcgplayer'
            };
          }
          
          if (lowPrice && highPrice && lowPrice > 0 && highPrice > 0) {
            this.stats.tcgdxApi++;
            return {
              price: (lowPrice + highPrice) / 2,
              source: 'TCGdx API (TCGplayer Average)',
              variant: 'tcgplayer'
            };
          }
        }
      }

      // Fallback to Cardmarket
      if (data.pricing.cardmarket) {
        const cm = data.pricing.cardmarket;
        const eurPrice = cm['avg1'] || cm['avg7'] || cm['avg30'] || cm.avg || cm.trend;
        
        if (eurPrice && eurPrice > 0) {
          this.stats.tcgdxApi++;
          this.stats.fallbackUsed++;
          return {
            price: eurPrice * 1.10, // EUR to USD conversion
            source: 'TCGdx API (Cardmarket)',
            variant: 'cardmarket'
          };
        }
      }

      return null;
    } catch (error) {
      // Don't log every timeout as error, just return null
      return null;
    }
  }

  async getCardInfo(cardId) {
    try {
      const result = await get('SELECT c.name, s.name as set_name FROM cards c LEFT JOIN sets s ON c.set_id = s.id WHERE c.id = ?', [cardId]);
      return result;
    } catch (error) {
      this.log(`❌ Database error getting card info: ${error.message}`);
      return null;
    }
  }

  validatePrice(price, card, oldPrice) {
    if (!price || price <= 0) return { valid: false, reason: 'Invalid price' };

    // More lenient validation rules
    const maxPrice = 15000; // Increased limit
    const minPrice = 0.01;
    const maxPriceChange = 2000; // Increased to 2000% change

    if (price > maxPrice) {
      return { valid: false, reason: `Price too high: $${price}` };
    }

    if (price < minPrice) {
      return { valid: false, reason: `Price too low: $${price}` };
    }

    // Check for extreme price changes
    if (oldPrice > 0) {
      const changePercent = Math.abs((price - oldPrice) / oldPrice) * 100;
      if (changePercent > maxPriceChange) {
        return { valid: false, reason: `Extreme price change: ${changePercent.toFixed(1)}%` };
      }
    }

    return { valid: true };
  }

  async collectPricesInBatches() {
    this.log('🚀 Starting smart price collection...');
    this.log('📋 Using Pokemon TCG API as primary source with TCGdx fallback\n');

    // Get cards that need pricing (prioritize those without prices)
    const cards = await all(`
      SELECT c.id, c.name, c.current_value, c.rarity, s.name as set_name
      FROM cards c
      LEFT JOIN sets s ON c.set_id = s.id
      WHERE c.current_value = 0 OR c.current_value IS NULL
      ORDER BY c.current_value ASC NULLS FIRST
      LIMIT 1000
    `);

    this.stats.totalCards = cards.length;
    this.log(`📊 Found ${cards.length} cards without prices to process\n`);

    if (cards.length === 0) {
      this.log('✅ All cards already have prices!');
      return;
    }

    // Create CSV header
    const csvData = ['card_id,card_name,set_name,old_price,new_price,price_change,source,variant,update_timestamp'];

    const startTime = Date.now();

    // Process in batches
    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const batch = cards.slice(i, i + BATCH_SIZE);
      
      this.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(cards.length / BATCH_SIZE)}`);
      this.log(`   Cards ${i + 1}-${Math.min(i + BATCH_SIZE, cards.length)} of ${cards.length}`);

      for (const card of batch) {
        this.stats.processed++;

        try {
          let priceData = null;

          // Try Pokemon TCG API first
          priceData = await this.getPokemonTcgApiPrice(card.id);
          
          // Fallback to TCGdx API if Pokemon TCG API fails
          if (!priceData) {
            priceData = await this.getTcgdxApiPrice(card.id);
          }

          if (!priceData) {
            this.stats.skipped++;
            this.log(`   ⏭️  ${card.name}: No price data available`);
            continue;
          }

          const oldPrice = card.current_value || 0;
          const validation = this.validatePrice(priceData.price, card, oldPrice);

          if (!validation.valid) {
            this.stats.skipped++;
            this.log(`   ❌ ${card.name}: ${validation.reason} ($${priceData.price})`);
            continue;
          }

          // Price is valid, update database
          const priceChange = oldPrice > 0 ? ((priceData.price - oldPrice) / oldPrice * 100).toFixed(2) : '0';
          
          // Update current price
          await run(
            'UPDATE cards SET current_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [priceData.price, card.id]
          );

          // Add new price to history
          await run(
            'INSERT OR REPLACE INTO price_history (product_id, date, price, volume) VALUES (?, ?, ?, 0)',
            [card.id, '2025-10-15', priceData.price]
          );

          this.stats.updated++;
          this.log(`   ✅ ${card.name}: $${oldPrice} → $${priceData.price} (${priceData.source})`);

          // Add to CSV
          csvData.push([
            card.id,
            `"${card.name}"`,
            `"${card.set_name || 'Unknown'}"`,
            oldPrice,
            priceData.price,
            priceChange,
            priceData.source,
            priceData.variant,
            new Date().toISOString()
          ].join(','));

          await this.delay(DELAY_BETWEEN_REQUESTS);

        } catch (error) {
          this.stats.errors++;
          this.log(`   ❌ Error processing ${card.name}: ${error.message}`);
        }
      }

      // Log batch progress
      const elapsed = (Date.now() - startTime) / 1000;
      const successRate = ((this.stats.updated / this.stats.processed) * 100).toFixed(1);
      
      this.log(`\n📊 Batch Summary:`);
      this.log(`   ✅ Updated: ${this.stats.updated}`);
      this.log(`   ⏭️  Skipped: ${this.stats.skipped}`);
      this.log(`   ❌ Errors: ${this.stats.errors}`);
      this.log(`   📈 Success Rate: ${successRate}%`);
      this.log(`   ⏱️  Elapsed: ${(elapsed/60).toFixed(1)}m`);
    }

    // Save results
    fs.writeFileSync(this.outputFile, csvData.join('\n'));
    this.log(`\n💾 Results saved to: ${this.outputFile}`);

    // Update database with collection stats
    await run(
      'INSERT OR REPLACE INTO price_collection_stats (date, total_cards, updated, skipped, errors, pokemon_tcg_api, tcgdx_api, fallback_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        new Date().toISOString().split('T')[0],
        this.stats.totalCards,
        this.stats.updated,
        this.stats.skipped,
        this.stats.errors,
        this.stats.pokemonTcgApi,
        this.stats.tcgdxApi,
        this.stats.fallbackUsed
      ]
    );

    await this.generateSummary();
  }

  async generateSummary() {
    this.log('\n📊 COLLECTION SUMMARY');
    this.log('='.repeat(50));
    this.log(`📦 Total cards processed: ${this.stats.totalCards}`);
    this.log(`✅ Prices updated: ${this.stats.updated}`);
    this.log(`⏭️  Cards skipped: ${this.stats.skipped}`);
    this.log(`❌ Errors encountered: ${this.stats.errors}`);
    this.log(`📈 Success rate: ${((this.stats.updated / this.stats.totalCards) * 100).toFixed(1)}%`);
    this.log(`\n🔍 API USAGE:`);
    this.log(`   Pokemon TCG API: ${this.stats.pokemonTcgApi} cards`);
    this.log(`   TCGdx API: ${this.stats.tcgdxApi} cards`);
    this.log(`   Fallback used: ${this.stats.fallbackUsed} cards`);
  }
}

// Create price collection stats table if it doesn't exist
const createStatsTable = async () => {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS price_collection_stats (
        date TEXT PRIMARY KEY,
        total_cards INTEGER,
        updated INTEGER,
        skipped INTEGER,
        errors INTEGER,
        pokemon_tcg_api INTEGER,
        tcgdx_api INTEGER,
        fallback_used INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Error creating stats table:', error);
  }
};

// Run the collection
const main = async () => {
  await createStatsTable();
  const collector = new SmartPriceCollector();
  await collector.collectPricesInBatches();
  process.exit(0);
};

main().catch((error) => {
  console.error('❌ Collection failed:', error);
  process.exit(1);
});








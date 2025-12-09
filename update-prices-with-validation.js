#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

const TCGDEX_API_BASE = 'https://api.tcgdx.net/v2/en';
const DELAY_BETWEEN_REQUESTS = 500;

class ValidatedPricingCollector {
  constructor() {
    this.processedCount = 0;
    this.updatedCount = 0;
    this.rejectedCount = 0;
    this.errorCount = 0;
    this.priceUpdates = [];
    this.outputFile = `price-updates-${new Date().toISOString().split('T')[0]}.csv`;
    
    // Validation rules
    this.validationRules = {
      maxPrice: 10000,
      minPrice: 0.01,
      maxPriceChange: 1000, // 1000% change
      maxStarCardPrice: 5000,
      suspiciousRoundNumbers: [1000, 2000, 3000, 4000, 5000, 10000, 20000, 50000]
    };
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

  validatePrice(price, card, oldPrice) {
    if (!price || price <= 0) return { valid: false, reason: 'Invalid price' };

    // Check absolute limits
    if (price > this.validationRules.maxPrice) {
      // Special case for Star cards
      if (card.rarity && card.rarity.includes('★') && price <= this.validationRules.maxStarCardPrice) {
        return { valid: true };
      }
      return { valid: false, reason: `Price too high: $${price}` };
    }

    if (price < this.validationRules.minPrice) {
      return { valid: false, reason: `Price too low: $${price}` };
    }

    // Check for suspicious round numbers
    if (this.validationRules.suspiciousRoundNumbers.includes(price)) {
      return { valid: false, reason: `Suspicious round number: $${price}` };
    }

    // Check for retail-style pricing (.99 endings)
    if (price > 100 && price.toString().endsWith('.99')) {
      return { valid: false, reason: `Retail-style pricing: $${price}` };
    }

    // Check for extreme price changes
    if (oldPrice > 0) {
      const changePercent = Math.abs((price - oldPrice) / oldPrice) * 100;
      if (changePercent > this.validationRules.maxPriceChange) {
        return { valid: false, reason: `Extreme price change: ${changePercent.toFixed(1)}%` };
      }
    }

    return { valid: true };
  }

  extractPrice(cardData) {
    try {
      // Strategy: Use TCGPlayer if available, with validation
      if (cardData.pricing && cardData.pricing.tcgplayer) {
        const tcp = cardData.pricing.tcgplayer;
        const variant = tcp.holofoil || tcp.normal;
        
        if (variant) {
          const { marketPrice, lowPrice, midPrice, highPrice } = variant;
          
          // Prefer marketPrice if available and reasonable
          if (marketPrice && marketPrice > 0) {
            return marketPrice;
          }
          
          // Fallback to midPrice
          if (midPrice && midPrice > 0) {
            return midPrice;
          }
          
          // Fallback to average of low/high
          if (lowPrice && highPrice && lowPrice > 0 && highPrice > 0) {
            return (lowPrice + highPrice) / 2;
          }
          
          // Last resort: lowPrice with markup
          if (lowPrice && lowPrice > 0) {
            return lowPrice * 1.2;
          }
        }
      }
      
      // Fallback to Cardmarket (EUR to USD)
      if (cardData.pricing && cardData.pricing.cardmarket) {
        const cm = cardData.pricing.cardmarket;
        const eurPrice = cm['avg1'] || cm['avg7'] || cm['avg30'] || cm.avg || cm.trend;
        if (eurPrice && eurPrice > 0) {
          return eurPrice * 1.10; // EUR to USD
        }
      }
      
      return null;
    } catch (error) {
      console.error(`   ❌ Error extracting price: ${error.message}`);
      return null;
    }
  }

  async collectPrices() {
    console.log('🚀 Starting validated price collection...');
    console.log('📋 This will process ALL cards with validation\n');

    // Get all cards
    const cards = await all(`
      SELECT c.id, c.name, c.current_value, c.rarity, s.name as set_name
      FROM cards c
      LEFT JOIN sets s ON c.set_id = s.id
      WHERE c.current_value > 0
      ORDER BY c.current_value DESC
    `);

    const totalCards = cards.length;
    console.log(`📊 Found ${totalCards} cards to process\n`);

    // Create CSV header
    this.priceUpdates.push('card_id,card_name,set_name,old_price,new_price,price_change,update_timestamp,validation_status');

    const startTime = Date.now();

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      this.processedCount++;

      if (i % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const avgTimePerCard = elapsed / Math.max(i, 1);
        const remainingCards = totalCards - i;
        const estimatedRemaining = (avgTimePerCard * remainingCards) / 60;
        
        console.log(`\n📦 Progress: ${i}/${totalCards} (${((i/totalCards)*100).toFixed(1)}%)`);
        console.log(`   ⏱️  Elapsed: ${(elapsed/60).toFixed(1)}m | Remaining: ~${estimatedRemaining.toFixed(1)}m`);
        console.log(`   ✅ Updated: ${this.updatedCount} | ❌ Rejected: ${this.rejectedCount} | ⚠️  Errors: ${this.errorCount}`);
      }

      try {
        const url = `${TCGDEX_API_BASE}/cards/${card.id}`;
        const cardData = await this.fetchWithRetry(url);
        
        if (!cardData) {
          this.errorCount++;
          continue;
        }

        const newPrice = this.extractPrice(cardData);
        
        if (!newPrice) {
          this.errorCount++;
          continue;
        }

        const oldPrice = card.current_value || 0;
        const validation = this.validatePrice(newPrice, card, oldPrice);

        if (!validation.valid) {
          console.log(`   ❌ ${card.name}: ${validation.reason} ($${newPrice})`);
          this.rejectedCount++;
          
          // Still add to CSV but mark as rejected
          const priceChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice * 100).toFixed(2) : '0';
          this.priceUpdates.push([
            card.id,
            `"${card.name}"`,
            `"${card.set_name || 'Unknown'}"`,
            oldPrice,
            newPrice,
            priceChange,
            new Date().toISOString(),
            `REJECTED: ${validation.reason}`
          ].join(','));
          
          continue;
        }

        // Price is valid, proceed with update
        const priceChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice * 100).toFixed(2) : '0';
        
        // Archive old price to history
        if (oldPrice > 0) {
          await run(
            'INSERT OR IGNORE INTO price_history (product_id, date, price, volume) VALUES (?, ?, ?, 0)',
            [card.id, '2025-10-14', oldPrice]
          );
        }

        // Update current price
        await run(
          'UPDATE cards SET current_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newPrice, card.id]
        );

        // Add new price to history
        await run(
          'INSERT OR REPLACE INTO price_history (product_id, date, price, volume) VALUES (?, ?, ?, 0)',
          [card.id, '2025-10-15', newPrice]
        );

        this.updatedCount++;
        console.log(`   ✅ ${card.name}: $${oldPrice} → $${newPrice} (${priceChange}%)`);

        // Add to CSV
        this.priceUpdates.push([
          card.id,
          `"${card.name}"`,
          `"${card.set_name || 'Unknown'}"`,
          oldPrice,
          newPrice,
          priceChange,
          new Date().toISOString(),
          'VALID'
        ].join(','));

        await this.delay(DELAY_BETWEEN_REQUESTS);

      } catch (error) {
        console.error(`   ❌ Error processing ${card.name}: ${error.message}`);
        this.errorCount++;
      }
    }

    await this.saveResults();
    await this.generateSummary();
  }

  async saveResults() {
    const csvContent = this.priceUpdates.join('\n');
    fs.writeFileSync(this.outputFile, csvContent);
    console.log(`\n💾 Results saved to: ${this.outputFile}`);
  }

  async generateSummary() {
    console.log('\n📊 COLLECTION SUMMARY');
    console.log('='.repeat(50));
    console.log(`📦 Total cards processed: ${this.processedCount}`);
    console.log(`✅ Prices updated: ${this.updatedCount}`);
    console.log(`❌ Prices rejected: ${this.rejectedCount}`);
    console.log(`⚠️  Errors encountered: ${this.errorCount}`);
    console.log(`📈 Success rate: ${((this.updatedCount / this.processedCount) * 100).toFixed(1)}%`);
    console.log(`🛡️  Validation rate: ${(((this.updatedCount + this.rejectedCount) / this.processedCount) * 100).toFixed(1)}%`);
  }
}

// Run the collection
const collector = new ValidatedPricingCollector();
collector.collectPrices()
  .then(() => {
    console.log('\n✅ Price collection complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Collection failed:', error);
    process.exit(1);
  });








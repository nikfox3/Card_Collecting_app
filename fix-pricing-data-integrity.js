#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'cards.db');

// Known bad prices that need correction
const KNOWN_BAD_PRICES = {
  'ex7-108': 8700.00, // Torchic Star - correct market price
  // Add more cards with known bad prices here
};

// Price validation rules
const PRICE_VALIDATION_RULES = {
  maxReasonablePrice: 50000, // No card should cost more than $50k
  maxDailyIncrease: 500, // No card should increase more than $500 in one day
  maxDailyDecrease: 1000, // No card should decrease more than $1000 in one day
  minReasonablePrice: 0.01, // Minimum reasonable price
};

async function fixPricingDataIntegrity() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔍 Analyzing pricing data integrity...');
  
  try {
    // 1. Fix known bad prices
    console.log('\n📝 Fixing known bad prices...');
    for (const [cardId, correctPrice] of Object.entries(KNOWN_BAD_PRICES)) {
      console.log(`   Fixing ${cardId}: $${correctPrice}`);
      
      // Update current_value in cards table
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE cards SET current_value = ? WHERE id = ?',
          [correctPrice, cardId],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      // Update the most recent price_history entry
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE price_history 
           SET price = ? 
           WHERE product_id = ? 
           AND date = (SELECT MAX(date) FROM price_history WHERE product_id = ?)`,
          [correctPrice, cardId, cardId],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    // 2. Find other suspicious prices
    console.log('\n🔍 Finding other suspicious prices...');
    
    // Find cards with prices over $10,000
    const suspiciousHighPrices = await new Promise((resolve, reject) => {
      db.all(
        `SELECT c.id, c.name, c.current_value, s.name as set_name
         FROM cards c
         JOIN sets s ON c.set_id = s.id
         WHERE c.current_value > 10000
         ORDER BY c.current_value DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    if (suspiciousHighPrices.length > 0) {
      console.log(`   Found ${suspiciousHighPrices.length} cards with prices over $10,000:`);
      suspiciousHighPrices.forEach(card => {
        console.log(`   - ${card.name} (${card.set_name}): $${card.current_value.toLocaleString()}`);
      });
    }
    
    // 3. Find cards with impossible price jumps
    console.log('\n🔍 Finding impossible price jumps...');
    
    const priceJumps = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           ph1.product_id,
           c.name,
           s.name as set_name,
           ph1.price as old_price,
           ph2.price as new_price,
           ph2.price - ph1.price as price_change,
           ph1.date as old_date,
           ph2.date as new_date
         FROM price_history ph1
         JOIN price_history ph2 ON ph1.product_id = ph2.product_id
         JOIN cards c ON ph1.product_id = c.id
         JOIN sets s ON c.set_id = s.id
         WHERE ph2.date > ph1.date
         AND ph2.price - ph1.price > 500
         AND ph1.date >= date('now', '-7 days')
         ORDER BY ph2.price - ph1.price DESC
         LIMIT 20`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    if (priceJumps.length > 0) {
      console.log(`   Found ${priceJumps.length} cards with suspicious price jumps:`);
      priceJumps.forEach(jump => {
        console.log(`   - ${jump.name} (${jump.set_name}): $${jump.old_price} → $${jump.new_price} (+$${jump.price_change.toLocaleString()})`);
      });
    }
    
    // 4. Generate integrity report
    console.log('\n📊 Pricing Data Integrity Report:');
    
    const totalCards = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM cards', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    const cardsWithPrices = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM cards WHERE current_value > 0', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    const avgPrice = await new Promise((resolve, reject) => {
      db.get('SELECT AVG(current_value) as avg FROM cards WHERE current_value > 0', (err, row) => {
        if (err) reject(err);
        else resolve(row.avg);
      });
    });
    
    const maxPrice = await new Promise((resolve, reject) => {
      db.get('SELECT MAX(current_value) as max FROM cards WHERE current_value > 0', (err, row) => {
        if (err) reject(err);
        else resolve(row.max);
      });
    });
    
    console.log(`   Total cards: ${totalCards.toLocaleString()}`);
    console.log(`   Cards with prices: ${cardsWithPrices.toLocaleString()} (${Math.round((cardsWithPrices/totalCards)*100)}%)`);
    console.log(`   Average price: $${avgPrice.toFixed(2)}`);
    console.log(`   Highest price: $${maxPrice.toLocaleString()}`);
    
    // 5. Recommendations
    console.log('\n💡 Recommendations:');
    console.log('   1. Implement price validation in collection scripts');
    console.log('   2. Add daily price change limits (e.g., max 50% increase)');
    console.log('   3. Cross-reference prices with multiple sources');
    console.log('   4. Flag cards with prices over $10,000 for manual review');
    console.log('   5. Set up alerts for impossible price jumps');
    
    console.log('\n✅ Pricing data integrity analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during pricing data integrity analysis:', error);
  } finally {
    db.close();
  }
}

// Run the analysis
fixPricingDataIntegrity().catch(console.error);








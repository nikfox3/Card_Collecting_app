#!/usr/bin/env node

/**
 * Query Price History
 * 
 * Usage: node query-price-history.js <card-id> [variant]
 * Example: node query-price-history.js swsh7-95
 * Example: node query-price-history.js base1-4 holofoil
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database/cards.db');
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

const cardId = process.argv[2];
const variant = process.argv[3] || 'normal';

if (!cardId) {
  console.log('Usage: node query-price-history.js <card-id> [variant]');
  console.log('Example: node query-price-history.js swsh7-95');
  console.log('Example: node query-price-history.js base1-4 holofoil');
  process.exit(1);
}

console.log(`\n📊 Price History for: ${cardId} (${variant})\n`);
console.log('='.repeat(80) + '\n');

try {
  // Get card info
  const card = await get(`
    SELECT c.*, s.name as set_name 
    FROM cards c 
    LEFT JOIN sets s ON c.set_id = s.id 
    WHERE c.id = ?
  `, [cardId]);

  if (!card) {
    console.log('❌ Card not found');
    process.exit(1);
  }

  console.log(`Card: ${card.name}`);
  console.log(`Set: ${card.set_name}`);
  console.log(`Current Value: $${card.current_value || 0}\n`);

  // Get price history (using existing schema)
  const productId = variant === 'normal' ? cardId : `${cardId}-${variant}`;
  const history = await all(`
    SELECT 
      date,
      price,
      volume
    FROM price_history
    WHERE product_id = ?
    ORDER BY date DESC
    LIMIT 30
  `, [productId]);

  if (history.length === 0) {
    console.log('⚠️  No price history found for this card/variant');
  } else {
    console.log('Date'.padEnd(15) + 'Price'.padEnd(12) + 'Volume'.padEnd(10) + 'Change');
    console.log('-'.repeat(60));

    let prevPrice = null;
    for (const record of history) {
      const date = record.date || 'N/A';
      const price = record.price ? `$${record.price.toFixed(2)}` : 'N/A';
      const volume = record.volume || '-';
      
      let change = '';
      if (prevPrice && record.price) {
        const diff = record.price - prevPrice;
        const pct = ((diff / prevPrice) * 100);
        change = `${diff >= 0 ? '+' : ''}$${diff.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`;
      }
      prevPrice = record.price;

      console.log(
        date.padEnd(15) + 
        price.padEnd(12) + 
        volume.toString().padEnd(10) + 
        change
      );
    }

    console.log('\n📈 Statistics:');
    const prices = history.map(h => h.price).filter(p => p > 0);
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const change = prices[0] - prices[prices.length - 1];
      const changePercent = ((change / prices[prices.length - 1]) * 100);

      console.log(`   Lowest: $${min.toFixed(2)}`);
      console.log(`   Highest: $${max.toFixed(2)}`);
      console.log(`   Average: $${avg.toFixed(2)}`);
      console.log(`   Change: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%)`);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

} catch (error) {
  console.error('❌ Error:', error.message);
}

db.close();

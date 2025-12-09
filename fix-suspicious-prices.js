#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

console.log('🔧 Fixing suspicious pricing data...\n');

// Define reasonable price limits for different card types
const priceLimits = {
  // Star cards are rare and valuable, but not $50k
  'Star': 15000,
  // Gold Star cards are very valuable
  'Gold Star': 25000,
  // Regular cards should be much lower
  'default': 5000
};

// Find all cards with suspicious prices
const suspiciousCards = await all(`
  SELECT id, name, current_value, rarity 
  FROM cards 
  WHERE current_value > 10000 
  ORDER BY current_value DESC
`);

console.log(`🚨 Found ${suspiciousCards.length} cards with prices over $10,000\n`);

let fixedCount = 0;
let deletedCount = 0;

for (const card of suspiciousCards) {
  const cardName = card.name.toLowerCase();
  let maxReasonablePrice = priceLimits.default;
  
  // Determine reasonable price limit based on card type
  if (cardName.includes('star')) {
    if (cardName.includes('gold star')) {
      maxReasonablePrice = priceLimits['Gold Star'];
    } else {
      maxReasonablePrice = priceLimits['Star'];
    }
  }
  
  console.log(`🔍 ${card.name}: $${card.current_value.toLocaleString()}`);
  
  if (card.current_value > maxReasonablePrice) {
    // For extremely high prices, we'll set them to a reasonable maximum
    // or remove the price entirely if it's clearly wrong
    if (card.current_value > 50000) {
      // Prices over $50k are almost certainly wrong - remove them
      await run('UPDATE cards SET current_value = 0 WHERE id = ?', [card.id]);
      console.log(`   ❌ Removed price (was $${card.current_value.toLocaleString()})`);
      deletedCount++;
    } else {
      // Cap at reasonable maximum
      await run('UPDATE cards SET current_value = ? WHERE id = ?', [maxReasonablePrice, card.id]);
      console.log(`   ✅ Capped at $${maxReasonablePrice.toLocaleString()}`);
      fixedCount++;
    }
  }
}

// Also clean up price history for these cards
console.log('\n🧹 Cleaning up price history...');

const suspiciousPriceHistory = await all(`
  SELECT product_id, price, date 
  FROM price_history 
  WHERE price > 10000 
  ORDER BY price DESC
`);

console.log(`🚨 Found ${suspiciousPriceHistory.length} suspicious price history entries\n`);

let historyFixedCount = 0;
let historyDeletedCount = 0;

for (const entry of suspiciousPriceHistory) {
  if (entry.price > 50000) {
    // Delete extremely high price history entries
    await run('DELETE FROM price_history WHERE product_id = ? AND price = ?', [entry.product_id, entry.price]);
    console.log(`   ❌ Deleted price history: ${entry.product_id} - $${entry.price.toLocaleString()} (${entry.date})`);
    historyDeletedCount++;
  } else if (entry.price > 10000) {
    // Cap high but potentially valid prices
    const cappedPrice = Math.min(entry.price, 15000);
    await run('UPDATE price_history SET price = ? WHERE product_id = ? AND price = ?', [cappedPrice, entry.product_id, entry.price]);
    console.log(`   ✅ Capped price history: ${entry.product_id} - $${entry.price.toLocaleString()} → $${cappedPrice.toLocaleString()}`);
    historyFixedCount++;
  }
}

// Update current values from cleaned price history
console.log('\n🔄 Updating current values from cleaned price history...');

await run(`
  UPDATE cards 
  SET current_value = (
    SELECT price 
    FROM price_history 
    WHERE price_history.product_id = cards.id 
    ORDER BY date DESC 
    LIMIT 1
  )
  WHERE id IN (
    SELECT DISTINCT product_id 
    FROM price_history
  )
`);

// Final summary
const finalStats = await get('SELECT COUNT(*) as with_prices FROM cards WHERE current_value > 0');
const highPriceCards = await all('SELECT COUNT(*) as count FROM cards WHERE current_value > 10000');

console.log('\n🎉 Price cleanup complete!');
console.log(`📊 Summary:`);
console.log(`   • Cards with prices fixed: ${fixedCount}`);
console.log(`   • Cards with prices removed: ${deletedCount}`);
console.log(`   • Price history entries fixed: ${historyFixedCount}`);
console.log(`   • Price history entries deleted: ${historyDeletedCount}`);
console.log(`   • Cards with current prices: ${finalStats.with_prices}`);
console.log(`   • Cards still over $10k: ${highPriceCards[0].count}`);

// Show remaining high-value cards
if (highPriceCards[0].count > 0) {
  console.log('\n💎 Remaining high-value cards:');
  const remainingHigh = await all('SELECT name, current_value FROM cards WHERE current_value > 10000 ORDER BY current_value DESC LIMIT 10');
  remainingHigh.forEach(card => {
    console.log(`   • ${card.name}: $${card.current_value.toLocaleString()}`);
  });
}

db.close();








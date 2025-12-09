#!/usr/bin/env node

/**
 * Import Prices With History
 * 
 * This script:
 * 1. Archives current prices to price_history table
 * 2. Imports new prices from CSV
 * 3. Updates current_value in cards table
 * 4. Maintains variant-specific pricing
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

const CSV_FILE = './public/Pokemon database files/pokemon-price-history.csv';

// Simple CSV parser
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

console.log('📊 IMPORTING PRICES WITH HISTORY\n');
console.log('='.repeat(80) + '\n');

// Step 1: Archive current prices to history
console.log('1️⃣  Archiving current prices to history...\n');

try {
  // Get yesterday's date (or last recorded date)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

  // Archive current prices for cards that have pricing
  const cardsWithPricing = await all(`
    SELECT id, current_value, variant 
    FROM cards 
    WHERE current_value > 0
  `);

  console.log(`   Found ${cardsWithPricing.length} cards with current pricing`);
  
  let archivedCount = 0;
  for (const card of cardsWithPricing) {
    // Check if we already have a record for yesterday
    const existing = await get(`
      SELECT id FROM price_history 
      WHERE product_id = ? AND date = ?
    `, [card.id, yesterdayStr]);

    if (!existing) {
      await run(`
        INSERT INTO price_history (product_id, date, price)
        VALUES (?, ?, ?)
      `, [card.id, yesterdayStr, card.current_value]);
      archivedCount++;
    }
  }

  console.log(`   ✅ Archived ${archivedCount} price records to history\n`);

} catch (error) {
  console.error('   ⚠️  Error archiving prices:', error.message);
  console.log('   Continuing with import...\n');
}

// Step 2: Read and parse CSV
console.log('2️⃣  Reading CSV file...\n');

const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
const records = parseCSV(csvContent);

console.log(`   ✅ Found ${records.length} price records in CSV\n`);

// Step 3: Import new prices
console.log('3️⃣  Importing new prices...\n');

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

let updatedCards = 0;
let addedHistoryRecords = 0;
let skippedRecords = 0;
let errorCount = 0;

// Group records by card_id to handle multiple variants
const cardPriceMap = new Map();

for (const record of records) {
  const cardId = record['Card ID'];
  const variant = record['Variant']?.toLowerCase() || 'normal';
  
  if (!cardId) {
    skippedRecords++;
    continue;
  }

  // Normalize variant names
  let normalizedVariant = 'normal';
  if (variant.includes('holo') && variant.includes('reverse')) {
    normalizedVariant = 'reverseHolofoil';
  } else if (variant.includes('holo')) {
    normalizedVariant = 'holofoil';
  } else if (variant.includes('1st') || variant.includes('first')) {
    normalizedVariant = '1stEdition';
  }

  const key = `${cardId}-${normalizedVariant}`;
  
  if (!cardPriceMap.has(key)) {
    cardPriceMap.set(key, {
      cardId,
      variant: normalizedVariant,
      marketPrice: parseFloat(record['Market Price']) || 0,
      lowPrice: parseFloat(record['Low Price']) || 0,
      midPrice: parseFloat(record['Mid Price']) || 0,
      highPrice: parseFloat(record['High Price']) || 0,
      directLow: parseFloat(record['Direct Low']) || 0,
      sourceUrl: record['TCGPlayer URL'] || '',
      sourceDate: record['Price Source Timestamp'] || today
    });
  }
}

console.log(`   Processing ${cardPriceMap.size} unique card-variant combinations...\n`);

let progressCount = 0;
for (const [key, priceData] of cardPriceMap) {
  progressCount++;
  
  try {
    // Check if card exists
    const card = await get('SELECT id, current_value FROM cards WHERE id = ?', [priceData.cardId]);
    
    if (!card) {
      skippedRecords++;
      continue;
    }

    // Insert into price_history (using existing schema: product_id, date, price)
    // Use market price, or mid if market is 0
    const priceToStore = priceData.marketPrice > 0 ? priceData.marketPrice : priceData.midPrice;
    
    if (priceToStore > 0) {
      // Create a composite product_id for variants
      const productId = priceData.variant === 'normal' ? priceData.cardId : `${priceData.cardId}-${priceData.variant}`;
      
      await run(`
        INSERT INTO price_history (product_id, date, price)
        VALUES (?, ?, ?)
      `, [productId, today, priceToStore]);
      addedHistoryRecords++;
    }

    // Update current_value in cards table (use market price, or mid if market is 0)
    const newPrice = priceData.marketPrice > 0 ? priceData.marketPrice : priceData.midPrice;
    
    if (newPrice > 0 && priceData.variant === 'normal') {
      // Only update current_value for normal variant to avoid overwriting
      await run(`
        UPDATE cards 
        SET current_value = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [newPrice, priceData.cardId]);
      updatedCards++;
    }

    // Progress indicator
    if (progressCount % 1000 === 0) {
      console.log(`   Progress: ${progressCount}/${cardPriceMap.size} (${((progressCount/cardPriceMap.size)*100).toFixed(1)}%)`);
    }

  } catch (error) {
    console.error(`   ❌ Error processing ${priceData.cardId}:`, error.message);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(80));
console.log('📊 IMPORT SUMMARY\n');
console.log(`Total CSV records: ${records.length}`);
console.log(`Unique card-variants: ${cardPriceMap.size}`);
console.log(`Cards updated: ${updatedCards}`);
console.log(`History records added: ${addedHistoryRecords}`);
console.log(`Skipped: ${skippedRecords}`);
console.log(`Errors: ${errorCount}`);

// Get final stats
const totalHistory = await get('SELECT COUNT(*) as count FROM price_history');
const cardsWithPricing = await get('SELECT COUNT(*) as count FROM cards WHERE current_value > 0');

console.log('\n📈 Database Stats:');
console.log(`   Total price history records: ${totalHistory.count}`);
console.log(`   Cards with current pricing: ${cardsWithPricing.count}`);

console.log('\n' + '='.repeat(80));
console.log('✅ Price import complete!\n');

console.log('💡 Next steps:');
console.log('   1. Refresh admin dashboard to see updated prices');
console.log('   2. Check main app for price history charts');
console.log('   3. Run: node query-price-history.js <card-id> to view history\n');

db.close();

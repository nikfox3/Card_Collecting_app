#!/usr/bin/env node

/**
 * Create Price History Table
 * 
 * This script creates a price_history table to store historical pricing data
 * for trending analysis and price charts.
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

console.log('📊 Creating Price History Table\n');
console.log('='.repeat(80) + '\n');

try {
  // Check if table already exists
  const tableExists = await get(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='price_history'
  `);

  if (tableExists) {
    console.log('⚠️  Table price_history already exists.');
    console.log('   Skipping creation.\n');
  } else {
    // Create price_history table
    await run(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        variant VARCHAR(50) DEFAULT 'normal',
        market_price DECIMAL(10,2),
        low_price DECIMAL(10,2),
        mid_price DECIMAL(10,2),
        high_price DECIMAL(10,2),
        direct_low DECIMAL(10,2),
        price_source VARCHAR(100) DEFAULT 'TCGPlayer',
        source_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (card_id) REFERENCES cards(id)
      )
    `);

    console.log('✅ Created price_history table\n');

    // Create indexes for performance
    await run(`
      CREATE INDEX IF NOT EXISTS idx_price_history_card_date 
      ON price_history(card_id, date DESC)
    `);
    console.log('✅ Created index: idx_price_history_card_date\n');

    await run(`
      CREATE INDEX IF NOT EXISTS idx_price_history_date 
      ON price_history(date DESC)
    `);
    console.log('✅ Created index: idx_price_history_date\n');

    await run(`
      CREATE INDEX IF NOT EXISTS idx_price_history_variant 
      ON price_history(card_id, variant, date DESC)
    `);
    console.log('✅ Created index: idx_price_history_variant\n');
  }

  // Create a view for easy querying of latest prices
  await run(`
    CREATE VIEW IF NOT EXISTS latest_prices AS
    SELECT 
      ph.*,
      c.name as card_name,
      s.name as set_name
    FROM price_history ph
    INNER JOIN cards c ON ph.card_id = c.id
    INNER JOIN sets s ON c.set_id = s.id
    WHERE ph.date = (
      SELECT MAX(date) 
      FROM price_history ph2 
      WHERE ph2.card_id = ph.card_id 
        AND ph2.variant = ph.variant
    )
  `);

  console.log('✅ Created view: latest_prices\n');

  // Get current stats
  const cardCount = await get('SELECT COUNT(*) as count FROM cards');
  const priceHistoryCount = await get('SELECT COUNT(*) as count FROM price_history');

  console.log('📊 Current Database Stats:');
  console.log(`   Total cards: ${cardCount.count}`);
  console.log(`   Price history records: ${priceHistoryCount.count}`);
  console.log();

  console.log('='.repeat(80));
  console.log('✅ Price history system ready!\n');
  console.log('Next step: Run import-prices-with-history.js to import your CSV');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

db.close();

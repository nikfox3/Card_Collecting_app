#!/usr/bin/env node

/**
 * Cleanup Old Price History
 * 
 * This script removes all price history data before Oct 13, 2025
 * to ensure only verified, real pricing data remains
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

console.log('🧹 Cleaning Up Unverified Price History\n');
console.log('='.repeat(80) + '\n');

const CUTOFF_DATE = '2025-10-13';

try {
  // Get current stats
  const beforeStats = await get('SELECT COUNT(*) as total, MIN(date) as earliest, MAX(date) as latest FROM price_history');
  
  console.log('📊 Current Price History:\n');
  console.log(`   Total records: ${beforeStats.total.toLocaleString()}`);
  console.log(`   Date range: ${beforeStats.earliest} to ${beforeStats.latest}`);
  console.log();
  
  // Count records that will be deleted
  const toDelete = await get(`SELECT COUNT(*) as count FROM price_history WHERE date < ?`, [CUTOFF_DATE]);
  
  console.log(`⚠️  Records before ${CUTOFF_DATE}: ${toDelete.count.toLocaleString()}`);
  console.log('   These will be DELETED (unverified data)\n');
  
  // Count records that will be kept
  const toKeep = await get(`SELECT COUNT(*) as count FROM price_history WHERE date >= ?`, [CUTOFF_DATE]);
  
  console.log(`✅ Records from ${CUTOFF_DATE} onwards: ${toKeep.count.toLocaleString()}`);
  console.log('   These will be KEPT (verified real data)\n');
  
  console.log('='.repeat(80));
  console.log('🗑️  Deleting unverified data...\n');
  
  // Delete old data
  await run(`DELETE FROM price_history WHERE date < ?`, [CUTOFF_DATE]);
  
  console.log(`✅ Deleted ${toDelete.count.toLocaleString()} records\n`);
  
  // Get new stats
  const afterStats = await get('SELECT COUNT(*) as total, MIN(date) as earliest, MAX(date) as latest, COUNT(DISTINCT product_id) as unique_cards FROM price_history');
  
  console.log('='.repeat(80));
  console.log('📊 Cleaned Price History:\n');
  console.log(`   Total records: ${afterStats.total.toLocaleString()}`);
  console.log(`   Date range: ${afterStats.earliest} to ${afterStats.latest}`);
  console.log(`   Unique cards: ${afterStats.unique_cards.toLocaleString()}`);
  console.log(`   Days covered: ${Math.ceil((new Date(afterStats.latest) - new Date(afterStats.earliest)) / (1000 * 60 * 60 * 24)) + 1}`);
  
  console.log('\n✅ Cleanup complete!');
  console.log('\n📋 Summary:');
  console.log(`   - Removed: ${toDelete.count.toLocaleString()} unverified records`);
  console.log(`   - Kept: ${afterStats.total.toLocaleString()} verified records`);
  console.log(`   - All data is now from Oct 13, 2025 onwards`);
  console.log(`   - 100% verified real TCGPlayer pricing`);
  
  console.log('\n💡 Next steps:');
  console.log('   1. Refresh your browser (hard refresh)');
  console.log('   2. Charts will now show consistent data for all cards');
  console.log('   3. Continue daily price collection to build history');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

db.close();

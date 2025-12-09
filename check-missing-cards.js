#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import csv from 'csv-parser';

const db = new sqlite3.Database('./database/cards.db');
const all = promisify(db.all.bind(db));

const csvFile = './dist/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv';

console.log('🔍 Analyzing missing cards...\n');

// Get all card IDs from database
const dbCards = await all('SELECT id, name, set_id FROM cards');
const dbCardIds = new Set(dbCards.map(c => c.id));

console.log(`📊 Database has ${dbCardIds.size} cards\n`);

// Get all card IDs from CSV
const csvCardIds = new Set();
const records = [];

await new Promise((resolve, reject) => {
  fs.createReadStream(csvFile)
    .pipe(csv())
    .on('data', (row) => {
      const id = row.id || row.card_id;
      if (id) {
        csvCardIds.add(id);
        records.push(row);
      }
    })
    .on('end', resolve)
    .on('error', reject);
});

console.log(`📊 CSV has ${csvCardIds.size} cards\n`);

// Find cards in database but not in CSV
const inDbNotInCsv = [...dbCardIds].filter(id => !csvCardIds.has(id));
console.log(`❌ Cards in database but NOT in CSV: ${inDbNotInCsv.length}\n`);

if (inDbNotInCsv.length > 0) {
  console.log('Sample cards not in CSV (first 20):');
  for (let i = 0; i < Math.min(20, inDbNotInCsv.length); i++) {
    const card = dbCards.find(c => c.id === inDbNotInCsv[i]);
    console.log(`   • ${card.id}: ${card.name} (${card.set_id})`);
  }
  
  // Group by set to find patterns
  const setBuckets = {};
  for (const id of inDbNotInCsv) {
    const card = dbCards.find(c => c.id === id);
    const setId = card?.set_id || 'unknown';
    setBuckets[setId] = (setBuckets[setId] || 0) + 1;
  }
  
  console.log('\n📊 Missing cards by set (top 10):');
  const sortedSets = Object.entries(setBuckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  for (const [setId, count] of sortedSets) {
    console.log(`   • ${setId}: ${count} cards`);
  }
}

// Find cards in CSV but not in database
const inCsvNotInDb = [...csvCardIds].filter(id => !dbCardIds.has(id));
console.log(`\n\n✅ Cards in CSV but NOT in database: ${inCsvNotInDb.length}\n`);

if (inCsvNotInDb.length > 0) {
  console.log('Sample new cards in CSV (first 20):');
  for (let i = 0; i < Math.min(20, inCsvNotInDb.length); i++) {
    const row = records.find(r => (r.id || r.card_id) === inCsvNotInDb[i]);
    console.log(`   • ${inCsvNotInDb[i]}: ${row?.name} (${row?.set_name})`);
  }
}

console.log('\n\n💡 Summary:');
console.log(`   • Database cards: ${dbCardIds.size}`);
console.log(`   • CSV cards: ${csvCardIds.size}`);
console.log(`   • In DB but not CSV: ${inDbNotInCsv.length} (these didn't get updated)`);
console.log(`   • In CSV but not DB: ${inCsvNotInDb.length} (these could be added)`);
console.log(`   • Matched and updated: ${dbCardIds.size - inDbNotInCsv.length}`);

db.close();









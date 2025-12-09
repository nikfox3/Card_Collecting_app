#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import csv from 'csv-parser';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));

const csvFile = './dist/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv';

let updatedCount = 0;

console.log('📊 Updating printed_total from CSV...\n');

const records = [];

fs.createReadStream(csvFile)
  .pipe(csv())
  .on('data', (row) => {
    records.push(row);
  })
  .on('end', async () => {
    console.log(`Found ${records.length} records\n`);
    
    for (const [index, row] of records.entries()) {
      if (index % 1000 === 0 && index > 0) {
        console.log(`Progress: ${index}/${records.length} - Updated: ${updatedCount}`);
      }

      try {
        const cardId = row.id || row.card_id;
        const printedTotal = row.printed_total || row.total_in_set || row.official_card_count;
        
        if (cardId && printedTotal && printedTotal !== 'null' && printedTotal !== '') {
          await run('UPDATE cards SET printed_total = ? WHERE id = ?', [parseInt(printedTotal), cardId]);
          updatedCount++;
        }
      } catch (error) {
        // Skip errors
      }
    }

    console.log(`\n✅ Updated ${updatedCount} cards with printed_total`);
    db.close();
  })
  .on('error', (error) => {
    console.error('Error:', error);
    db.close();
  });










#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import csv from 'csv-parser';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

const csvFile = './dist/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv';

let updatedCount = 0;
let notFoundCount = 0;
let errorCount = 0;
let processedCount = 0;

console.log('📂 Importing abilities and attacks from TCGdex CSV...');
console.log(`📄 File: ${csvFile}\n`);

const records = [];

fs.createReadStream(csvFile)
  .pipe(csv())
  .on('data', (row) => {
    records.push(row);
  })
  .on('end', async () => {
    console.log(`📊 Found ${records.length} records\n`);
    
    for (const [index, row] of records.entries()) {
      try {
        processedCount++;
        
        if (index % 100 === 0 && index > 0) {
          console.log(`\n📦 Progress: ${index}/${records.length} (${((index/records.length)*100).toFixed(1)}%)`);
          console.log(`   ✅ Updated: ${updatedCount} | ⚠️  Not found: ${notFoundCount} | ❌ Errors: ${errorCount}`);
        }

        const cardId = row.id || row.card_id;
        
        if (!cardId) {
          errorCount++;
          continue;
        }

        // Check if card exists
        const card = await get('SELECT id, name, abilities, attacks FROM cards WHERE id = ?', [cardId]);
        
        if (!card) {
          notFoundCount++;
          continue;
        }

        const updates = [];
        const values = [];

        // Update abilities if provided and currently NULL/empty
        if (row.abilities && row.abilities !== 'null' && row.abilities !== '' && (!card.abilities || card.abilities === '')) {
          updates.push('abilities = ?');
          values.push(row.abilities);
        }

        // Update attacks if provided and currently NULL/empty or different
        if (row.attacks && row.attacks !== 'null' && row.attacks !== '') {
          updates.push('attacks = ?');
          values.push(row.attacks);
        }

        // Update other useful fields
        const fieldMappings = {
          hp: 'hp',
          types: 'types',
          subtypes: 'subtypes',
          weaknesses: 'weaknesses',
          resistances: 'resistances',
          retreat_cost: 'retreat',
          evolves_from: 'evolves_from',
          artist: 'illustrator',
          rarity: 'rarity'
        };

        for (const [dbField, csvField] of Object.entries(fieldMappings)) {
          if (row[csvField] && row[csvField] !== 'null' && row[csvField] !== '') {
            updates.push(`${dbField} = ?`);
            values.push(row[csvField]);
          }
        }

        if (updates.length === 0) {
          continue;
        }

        // Execute update
        values.push(cardId);
        const sql = `UPDATE cards SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        
        await run(sql, values);
        updatedCount++;

        if (index % 1000 === 999) {
          console.log(`   ✅ Updated: ${card.name}`);
        }

      } catch (error) {
        console.error(`❌ Error at row ${index}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n\n🎉 Import complete!');
    console.log(`\n📊 Final Statistics:`);
    console.log(`   • Records processed: ${processedCount}`);
    console.log(`   • Cards updated: ${updatedCount}`);
    console.log(`   • Cards not found: ${notFoundCount}`);
    console.log(`   • Errors: ${errorCount}`);
    console.log(`   • Success rate: ${((updatedCount / processedCount) * 100).toFixed(1)}%`);
    
    db.close();
  })
  .on('error', (error) => {
    console.error('❌ CSV parsing error:', error);
    db.close();
  });









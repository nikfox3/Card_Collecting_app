#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import csv from 'csv-parser';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

const csvFile = './dist/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv';

let processedCount = 0;
let errorCount = 0;

console.log('🎴 Importing Pokemon card data...');
console.log(`📄 File: ${csvFile}\n`);

// Check if file exists
if (!fs.existsSync(csvFile)) {
  console.error('❌ CSV file not found:', csvFile);
  process.exit(1);
}

const records = [];

fs.createReadStream(csvFile)
  .pipe(csv())
  .on('data', (row) => {
    records.push(row);
  })
  .on('end', async () => {
    console.log(`📊 Found ${records.length} records\n`);
    
    try {
      // First, import sets
      console.log('📦 Importing sets...');
      const sets = new Map();
      
      for (const record of records) {
        if (record.set_id && record.set_name && !sets.has(record.set_id)) {
          sets.set(record.set_id, {
            id: record.set_id,
            name: record.set_name,
            series: record.series || null,
            printed_total: record.printed_total ? parseInt(record.printed_total) : null,
            total: record.total_in_set ? parseInt(record.total_in_set) : null,
            release_date: record.release_date || null,
            ptcgo_code: record.set || null,
            legalities: record.legalities ? JSON.stringify(JSON.parse(record.legalities)) : null,
            images: record.set_symbol_url ? JSON.stringify({ symbol: record.set_symbol_url }) : null
          });
        }
      }
      
      // Insert sets
      for (const [setId, setData] of sets) {
        try {
          await run(`
            INSERT OR REPLACE INTO sets (
              id, name, series, printed_total, total, release_date, 
              ptcgo_code, legalities, images
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            setData.id, setData.name, setData.series, setData.printed_total,
            setData.total, setData.release_date, setData.ptcgo_code,
            setData.legalities, setData.images
          ]);
        } catch (err) {
          console.error(`Error inserting set ${setId}:`, err.message);
        }
      }
      
      console.log(`✅ Imported ${sets.size} sets`);
      
      // Now import cards
      console.log('🃏 Importing cards...');
      
      for (const record of records) {
        try {
          // Parse JSON fields
          const subtypes = record.subtypes ? JSON.parse(record.subtypes) : [];
          const types = record.types ? JSON.parse(record.types) : [];
          const attacks = record.attacks ? JSON.parse(record.attacks) : [];
          const weaknesses = record.weaknesses ? JSON.parse(record.weaknesses) : [];
          const resistances = record.resistances ? JSON.parse(record.resistances) : [];
          const retreat_cost = record.retreat ? JSON.parse(record.retreat) : [];
          const legalities = record.legalities ? JSON.parse(record.legalities) : {};
          const images = record.image_url ? JSON.stringify({ 
            small: record.image_small,
            large: record.image_large,
            high_res: record.image_high_res
          }) : null;
          
          // Calculate current value from TCGPlayer data
          let current_value = 0;
          if (record.tcgplayer_normal_market) {
            current_value = parseFloat(record.tcgplayer_normal_market);
          } else if (record.tcgplayer_holofoil_market) {
            current_value = parseFloat(record.tcgplayer_holofoil_market);
          }
          
          await run(`
            INSERT OR REPLACE INTO cards (
              id, name, supertype, subtypes, level, hp, types, evolves_from,
              attacks, weaknesses, resistances, retreat_cost, converted_retreat_cost,
              set_id, number, artist, rarity, national_pokedex_numbers,
              legalities, images, current_value, regulation, format
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            record.card_id || record.id,
            record.name,
            record.supertype,
            JSON.stringify(subtypes),
            record.level,
            record.hp,
            JSON.stringify(types),
            record.evolves_from,
            JSON.stringify(attacks),
            JSON.stringify(weaknesses),
            JSON.stringify(resistances),
            JSON.stringify(retreat_cost),
            record.converted_retreat_cost ? parseInt(record.converted_retreat_cost) : null,
            record.set_id,
            record.number,
            record.artist,
            record.rarity,
            record.national_pokedex_numbers ? JSON.stringify(JSON.parse(record.national_pokedex_numbers)) : null,
            JSON.stringify(legalities),
            images,
            current_value,
            record.regulation_mark || 'A',
            'Standard'
          ]);
          
          processedCount++;
          
          if (processedCount % 1000 === 0) {
            console.log(`📊 Processed ${processedCount} cards...`);
          }
          
        } catch (err) {
          errorCount++;
          if (errorCount < 10) { // Only show first 10 errors
            console.error(`Error processing card ${record.name}:`, err.message);
          }
        }
      }
      
      console.log(`\n✅ Import complete!`);
      console.log(`📊 Processed: ${processedCount} cards`);
      console.log(`❌ Errors: ${errorCount} cards`);
      
      // Update set card counts
      console.log('🔄 Updating set card counts...');
      await run(`
        UPDATE sets SET total = (
          SELECT COUNT(*) FROM cards WHERE cards.set_id = sets.id
        )
      `);
      
      console.log('✅ Database import complete!');
      
    } catch (err) {
      console.error('❌ Import failed:', err);
    } finally {
      db.close();
    }
  })
  .on('error', (err) => {
    console.error('❌ Error reading CSV:', err);
    db.close();
  });








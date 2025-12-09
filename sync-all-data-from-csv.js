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
let newCardsCount = 0;

console.log('🔄 Syncing ALL card data from complete CSV...');
console.log(`📄 File: ${csvFile}\n`);

const records = [];

fs.createReadStream(csvFile)
  .pipe(csv())
  .on('data', (row) => {
    records.push(row);
  })
  .on('end', async () => {
    console.log(`📊 Found ${records.length} records in CSV\n`);
    
    for (const [index, row] of records.entries()) {
      try {
        processedCount++;
        
        if (index % 500 === 0 && index > 0) {
          console.log(`\n📦 Progress: ${index}/${records.length} (${((index/records.length)*100).toFixed(1)}%)`);
          console.log(`   ✅ Updated: ${updatedCount} | 🆕 New: ${newCardsCount} | ⚠️  Not found: ${notFoundCount} | ❌ Errors: ${errorCount}`);
        }

        const cardId = row.id || row.card_id;
        
        if (!cardId) {
          errorCount++;
          continue;
        }

        // Check if card exists
        const existingCard = await get('SELECT id FROM cards WHERE id = ?', [cardId]);
        
        if (!existingCard) {
          notFoundCount++;
          continue; // Skip new cards for now (can add them later if needed)
        }

        // Build comprehensive update
        const updates = [];
        const values = [];

        // Map CSV columns to database columns
        const fieldMappings = {
          // Basic info
          'name': 'name',
          'hp': 'hp',
          'level': 'level',
          'artist': 'illustrator',
          'rarity': 'rarity',
          'number': 'local_id',
          'supertype': 'supertype',
          'evolves_from': 'evolves_from',
          
          // JSON fields
          'types': 'types',
          'subtypes': 'subtypes',
          'abilities': 'abilities',
          'attacks': 'attacks',
          'weaknesses': 'weaknesses',
          'resistances': 'resistances',
          'retreat_cost': 'retreat',
          'national_pokedex_numbers': 'dex_id',
          
          // Variant flags
          'variant_normal': 'variant_normal',
          'variant_reverse': 'variant_reverse',
          'variant_holo': 'variant_holo',
          'variant_first_edition': 'variant_first_edition',
          
          // Images (assuming it's a JSON object)
          'images': 'image',
          
          // Pricing - we'll use the tcgplayer_holofoil_market as current_value
          'current_value': 'tcgplayer_holofoil_market'
        };

        for (const [dbField, csvField] of Object.entries(fieldMappings)) {
          if (row[csvField] !== undefined && row[csvField] !== null && row[csvField] !== '' && row[csvField] !== 'null') {
            let value = row[csvField];
            
            // Convert boolean strings to integers for variant flags
            if (['variant_normal', 'variant_reverse', 'variant_holo', 'variant_first_edition'].includes(dbField)) {
              value = (value === 'true' || value === '1' || value === 1) ? 1 : 0;
            }
            
            // Keep JSON fields as strings (they're already properly formatted in the CSV)
            if (['types', 'subtypes', 'abilities', 'attacks', 'weaknesses', 'resistances', 'retreat_cost', 'national_pokedex_numbers'].includes(dbField)) {
              // Validate JSON before saving
              if (typeof value === 'string' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
                try {
                  JSON.parse(value); // Validate
                  // Keep as-is if valid
                } catch (e) {
                  continue; // Skip if invalid JSON
                }
              } else if (value && !value.startsWith('[') && !value.startsWith('{')) {
                // Convert simple values to JSON arrays
                value = JSON.stringify([value]);
              }
            }
            
            // Special handling for retreat cost field name
            if (dbField === 'retreat_cost' && csvField === 'retreat') {
              updates.push('retreat_cost = ?');
              values.push(value);
            } else {
              updates.push(`${dbField} = ?`);
              values.push(value);
            }
          }
        }

        // Also update pricing from TCGPlayer columns
        if (row.tcgplayer_holofoil_market && row.tcgplayer_holofoil_market !== 'null' && row.tcgplayer_holofoil_market !== '') {
          updates.push('current_value = ?');
          values.push(parseFloat(row.tcgplayer_holofoil_market));
        } else if (row.tcgplayer_normal_market && row.tcgplayer_normal_market !== 'null' && row.tcgplayer_normal_market !== '') {
          updates.push('current_value = ?');
          values.push(parseFloat(row.tcgplayer_normal_market));
        } else if (row.cardmarket_avg1 && row.cardmarket_avg1 !== 'null' && row.cardmarket_avg1 !== '') {
          // Convert EUR to USD
          updates.push('current_value = ?');
          values.push(parseFloat(row.cardmarket_avg1) * 1.10);
        } else if (row.cardmarket_avg && row.cardmarket_avg !== 'null' && row.cardmarket_avg !== '') {
          // Convert EUR to USD
          updates.push('current_value = ?');
          values.push(parseFloat(row.cardmarket_avg) * 1.10);
        }

        if (updates.length === 0) {
          continue; // Nothing to update
        }

        // Execute update
        values.push(cardId);
        const sql = `UPDATE cards SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        
        await run(sql, values);
        updatedCount++;

        if (index % 1000 === 999) {
          const cardName = row.name || 'Unknown';
          console.log(`   ✅ Updated: ${cardName}`);
        }

      } catch (error) {
        console.error(`❌ Error at row ${index}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n\n🎉 Complete data sync finished!');
    console.log(`\n📊 Final Statistics:`);
    console.log(`   • Records processed: ${processedCount}`);
    console.log(`   • Cards updated: ${updatedCount}`);
    console.log(`   • Cards not in DB: ${notFoundCount}`);
    console.log(`   • Errors: ${errorCount}`);
    console.log(`   • Success rate: ${((updatedCount / processedCount) * 100).toFixed(1)}%`);
    
    console.log(`\n✅ Updated fields for each card:`);
    console.log(`   • Basic info: name, HP, level, artist, rarity, number`);
    console.log(`   • Card details: supertype, stage, evolves_from`);
    console.log(`   • Abilities: name, type, description`);
    console.log(`   • Attacks: name, cost, damage, effects`);
    console.log(`   • Stats: types, weaknesses, resistances, retreat cost`);
    console.log(`   • Variants: normal, reverse, holo, 1st edition flags`);
    console.log(`   • Pricing: TCGPlayer market prices (holofoil or normal)`);
    console.log(`   • Images: card image URLs`);
    
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Check admin dashboard - all cards should have complete data`);
    console.log(`   2. Check main app - abilities and attacks should display`);
    console.log(`   3. Verify pricing is updated and accurate`);
    
    db.close();
  })
  .on('error', (error) => {
    console.error('❌ CSV parsing error:', error);
    db.close();
  });

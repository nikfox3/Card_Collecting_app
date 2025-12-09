#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

class AbilitiesAttacksImporter {
  constructor(csvFile) {
    this.csvFile = csvFile;
    this.updatedCount = 0;
    this.errorCount = 0;
    this.notFoundCount = 0;
  }

  async importFromCSV() {
    try {
      console.log('📂 Reading CSV file:', this.csvFile);
      
      const fileContent = fs.readFileSync(this.csvFile, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true
      });

      console.log(`📊 Found ${records.length} records in CSV\n`);

      for (const [index, record] of records.entries()) {
        try {
          // Show progress every 100 records
          if (index % 100 === 0 && index > 0) {
            console.log(`\n📦 Progress: ${index}/${records.length} (${((index/records.length)*100).toFixed(1)}%)`);
            console.log(`   ✅ Updated: ${this.updatedCount} | ⚠️  Not found: ${this.notFoundCount} | ❌ Errors: ${this.errorCount}`);
          }

          // Identify card by id, name, or other unique field
          const cardId = record.id || record.card_id || record.ID;
          const cardName = record.name || record.card_name || record.Name;
          
          if (!cardId && !cardName) {
            console.log(`⚠️  Skipping record ${index}: No ID or name found`);
            this.errorCount++;
            continue;
          }

          // Find card in database
          let card;
          if (cardId) {
            card = await get('SELECT id, name FROM cards WHERE id = ?', [cardId]);
          }
          if (!card && cardName) {
            card = await get('SELECT id, name FROM cards WHERE name = ? LIMIT 1', [cardName]);
          }

          if (!card) {
            this.notFoundCount++;
            continue;
          }

          // Prepare update fields
          const updates = [];
          const values = [];

          // Handle abilities
          if (record.abilities || record.Abilities) {
            let abilities = record.abilities || record.Abilities;
            
            // If it's already a JSON string, validate it
            if (typeof abilities === 'string' && abilities.trim().startsWith('[')) {
              try {
                JSON.parse(abilities); // Validate
                updates.push('abilities = ?');
                values.push(abilities);
              } catch (e) {
                console.log(`   ⚠️  Invalid abilities JSON for ${card.name}`);
              }
            } else if (abilities && abilities !== 'null' && abilities !== 'NULL') {
              // Try to convert to JSON array
              updates.push('abilities = ?');
              values.push(JSON.stringify([{ name: abilities, type: 'Ability', text: abilities }]));
            }
          }

          // Handle attacks
          if (record.attacks || record.Attacks) {
            let attacks = record.attacks || record.Attacks;
            
            if (typeof attacks === 'string' && attacks.trim().startsWith('[')) {
              try {
                JSON.parse(attacks); // Validate
                updates.push('attacks = ?');
                values.push(attacks);
              } catch (e) {
                console.log(`   ⚠️  Invalid attacks JSON for ${card.name}`);
              }
            } else if (attacks && attacks !== 'null' && attacks !== 'NULL') {
              updates.push('attacks = ?');
              values.push(JSON.stringify([{ name: attacks, damage: '', text: attacks }]));
            }
          }

          // Handle other fields that might be in the CSV
          const fieldMappings = {
            hp: ['hp', 'HP'],
            types: ['types', 'Types', 'type', 'Type'],
            subtypes: ['subtypes', 'Subtypes', 'subtype', 'Subtype'],
            weaknesses: ['weaknesses', 'Weaknesses'],
            resistances: ['resistances', 'Resistances'],
            retreat_cost: ['retreat_cost', 'retreatCost', 'Retreat'],
            evolves_from: ['evolves_from', 'evolvesFrom', 'Evolves From'],
            artist: ['artist', 'Artist', 'illustrator', 'Illustrator'],
            rarity: ['rarity', 'Rarity'],
            current_value: ['current_value', 'price', 'Price', 'market_price']
          };

          for (const [dbField, csvFields] of Object.entries(fieldMappings)) {
            for (const csvField of csvFields) {
              if (record[csvField] !== undefined && record[csvField] !== null && record[csvField] !== '') {
                let value = record[csvField];
                
                // Try to parse JSON fields
                if (['types', 'subtypes', 'weaknesses', 'resistances', 'retreat_cost'].includes(dbField)) {
                  if (typeof value === 'string' && value.trim().startsWith('[')) {
                    try {
                      JSON.parse(value); // Validate
                      // Keep as JSON string
                    } catch (e) {
                      value = JSON.stringify([value]);
                    }
                  } else if (value !== 'null' && value !== 'NULL') {
                    value = JSON.stringify([value]);
                  }
                }
                
                updates.push(`${dbField} = ?`);
                values.push(value);
                break; // Found the field, stop checking other names
              }
            }
          }

          if (updates.length === 0) {
            continue; // Nothing to update
          }

          // Build and execute UPDATE query
          values.push(card.id);
          const sql = `UPDATE cards SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
          
          await run(sql, values);
          this.updatedCount++;

          if (index % 100 === 99) {
            console.log(`   Updated: ${card.name}`);
          }

        } catch (error) {
          console.error(`❌ Error processing record ${index}:`, error.message);
          this.errorCount++;
        }
      }

      console.log('\n\n🎉 Import complete!');
      console.log(`\n📊 Final Statistics:`);
      console.log(`   • Records processed: ${records.length}`);
      console.log(`   • Cards updated: ${this.updatedCount}`);
      console.log(`   • Cards not found: ${this.notFoundCount}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${((this.updatedCount / records.length) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Fatal error:', error);
    } finally {
      db.close();
    }
  }
}

// Main execution
const csvFile = process.argv[2];

if (!csvFile) {
  console.log('❌ Please provide CSV file path');
  console.log('Usage: node import-abilities-attacks-csv.js <csv-file>');
  console.log('Example: node import-abilities-attacks-csv.js pokemon_cards.csv');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.log(`❌ File not found: ${csvFile}`);
  process.exit(1);
}

const importer = new AbilitiesAttacksImporter(csvFile);
importer.importFromCSV();









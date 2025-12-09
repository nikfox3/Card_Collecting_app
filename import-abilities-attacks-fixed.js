#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const db = new sqlite3.Database('./cards.db');
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
          // Show progress every 1000 records
          if (index % 1000 === 0 && index > 0) {
            console.log(`\n📦 Progress: ${index}/${records.length} (${((index/records.length)*100).toFixed(1)}%)`);
            console.log(`   ✅ Updated: ${this.updatedCount} | ⚠️  Not found: ${this.notFoundCount} | ❌ Errors: ${this.errorCount}`);
          }

          // Get card name from CSV
          const cardName = record.name || record.card_name || record.Name;
          
          if (!cardName) {
            this.errorCount++;
            continue;
          }

          // Find matching product by name
          const existingProduct = await get(
            'SELECT product_id, name FROM products WHERE name = ? LIMIT 1',
            [cardName]
          );

          if (!existingProduct) {
            this.notFoundCount++;
            continue;
          }

          // Extract abilities and attacks from CSV
          const abilities = record.abilities || record.Abilities || '';
          const attacks = record.attacks || record.Attacks || '';
          const cardText = record.card_text || record.Card_Text || record.text || '';

          // Update the product with abilities and attacks
          await run(
            `UPDATE products SET 
             ext_card_text = ?,
             ext_attack1 = ?,
             ext_attack2 = ?
             WHERE product_id = ?`,
            [cardText, attacks, '', existingProduct.product_id]
          );

          this.updatedCount++;
          
          if (index % 100 === 0) {
            console.log(`   Updated: ${cardName}`);
          }

        } catch (error) {
          console.error(`❌ Error processing record ${index}:`, error.message);
          this.errorCount++;
        }
      }

      console.log('\n🎉 Import complete!\n');
      console.log('📊 Final Statistics:');
      console.log(`   • Records processed: ${records.length}`);
      console.log(`   • Cards updated: ${this.updatedCount}`);
      console.log(`   • Cards not found: ${this.notFoundCount}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${((this.updatedCount / records.length) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Import failed:', error.message);
    } finally {
      db.close();
    }
  }
}

// Run the import
const csvFile = process.argv[2];
if (!csvFile) {
  console.error('❌ Please provide CSV file path');
  console.log('Usage: node import-abilities-attacks-fixed.js <csv-file>');
  console.log('Example: node import-abilities-attacks-fixed.js pokemon_cards.csv');
  process.exit(1);
}

const importer = new AbilitiesAttacksImporter(csvFile);
importer.importFromCSV();





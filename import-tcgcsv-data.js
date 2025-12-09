#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'cards.db');

class TCGCSVImporter {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.stats = {
      groupsImported: 0,
      productsImported: 0,
      errors: []
    };
  }

  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const records = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      parser.on('readable', function() {
        let record;
        while (record = parser.read()) {
          records.push(record);
        }
      });

      parser.on('error', function(err) {
        reject(err);
      });

      parser.on('end', function() {
        resolve(records);
      });

      createReadStream(filePath).pipe(parser);
    });
  }

  async importGroups() {
    console.log('🎯 Importing groups...');
    
    try {
      const groups = await this.parseCSV('pokemon_data/Groups.csv');
      console.log(`Found ${groups.length} groups`);
      
      for (const group of groups) {
        try {
          await new Promise((resolve, reject) => {
            this.db.run(
              `INSERT INTO groups (group_id, name, category_id, url, modified_on)
               VALUES (?, ?, ?, ?, ?)`,
              [
                parseInt(group.groupId),
                group.name,
                parseInt(group.categoryId),
                group.url || null,
                group.modifiedOn || null
              ],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          this.stats.groupsImported++;
        } catch (error) {
          console.error(`Error importing group ${group.groupId}:`, error.message);
          this.stats.errors.push({ groupId: group.groupId, error: error.message });
        }
      }
      
      console.log(`✅ Imported ${this.stats.groupsImported} groups`);
    } catch (error) {
      console.error('Error importing groups:', error.message);
      this.stats.errors.push({ error: error.message });
    }
  }

  async importProducts() {
    console.log('🃏 Importing products...');
    
    try {
      const products = await this.parseCSV('pokemon_data/pokemon_prices_full.csv');
      console.log(`Found ${products.length} products`);
      
      let imported = 0;
      for (const product of products) {
        try {
          await new Promise((resolve, reject) => {
            this.db.run(
              `INSERT INTO products (
                product_id, name, clean_name, image_url, category_id, group_id, url, modified_on, image_count,
                ext_number, ext_rarity, ext_card_type, ext_hp, ext_stage, ext_card_text,
                ext_attack1, ext_attack2, ext_weakness, ext_resistance, ext_retreat_cost,
                low_price, mid_price, high_price, market_price, direct_low_price, sub_type_name
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                parseInt(product.productId),
                product.name,
                product.cleanName || null,
                product.imageUrl || null,
                parseInt(product.categoryId),
                parseInt(product.groupId),
                product.url || null,
                product.modifiedOn || null,
                parseInt(product.imageCount) || 1,
                
                // Extended data
                product.extNumber || null,
                product.extRarity || null,
                product.extCardType || null,
                product.extHP ? parseInt(product.extHP) : null,
                product.extStage || null,
                product.extCardText || null,
                product.extAttack1 || null,
                product.extAttack2 || null,
                product.extWeakness || null,
                product.extResistance || null,
                product.extRetreatCost ? parseInt(product.extRetreatCost) : null,
                
                // Pricing data
                product.lowPrice ? parseFloat(product.lowPrice) : null,
                product.midPrice ? parseFloat(product.midPrice) : null,
                product.highPrice ? parseFloat(product.highPrice) : null,
                product.marketPrice ? parseFloat(product.marketPrice) : null,
                product.directLowPrice ? parseFloat(product.directLowPrice) : null,
                product.subTypeName || null
              ],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          imported++;
          
          if (imported % 5000 === 0) {
            console.log(`  Imported ${imported} products...`);
          }
        } catch (error) {
          console.error(`Error importing product ${product.productId}:`, error.message);
          this.stats.errors.push({ productId: product.productId, error: error.message });
        }
      }
      
      this.stats.productsImported = imported;
      console.log(`✅ Imported ${imported} products`);
    } catch (error) {
      console.error('Error importing products:', error.message);
      this.stats.errors.push({ error: error.message });
    }
  }

  async generateStatistics() {
    console.log('\n📊 Database Statistics:');
    
    try {
      // Groups statistics
      const groupStats = await new Promise((resolve, reject) => {
        this.db.get('SELECT COUNT(*) as count FROM groups', (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      // Products statistics
      const productStats = await new Promise((resolve, reject) => {
        this.db.get(`
          SELECT 
            COUNT(*) as total_products,
            COUNT(CASE WHEN market_price > 0 THEN 1 END) as products_with_prices,
            COUNT(CASE WHEN ext_card_type = 'Trainer' THEN 1 END) as trainer_cards,
            COUNT(CASE WHEN ext_card_type != 'Trainer' AND ext_card_type != 'Basic Energy' THEN 1 END) as pokemon_cards,
            COUNT(CASE WHEN ext_card_type = 'Basic Energy' THEN 1 END) as energy_cards,
            COUNT(CASE WHEN sub_type_name LIKE '%Holofoil%' THEN 1 END) as holofoil_cards,
            COUNT(CASE WHEN sub_type_name LIKE '%1st Edition%' THEN 1 END) as first_edition_cards
          FROM products
        `, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      console.log(`  Groups: ${groupStats.count}`);
      console.log(`  Total Products: ${productStats.total_products}`);
      console.log(`  Products with Prices: ${productStats.products_with_prices}`);
      console.log(`  Pokemon Cards: ${productStats.pokemon_cards}`);
      console.log(`  Trainer Cards: ${productStats.trainer_cards}`);
      console.log(`  Energy Cards: ${productStats.energy_cards}`);
      console.log(`  Holofoil Cards: ${productStats.holofoil_cards}`);
      console.log(`  First Edition Cards: ${productStats.first_edition_cards}`);
      
    } catch (error) {
      console.error('Error generating statistics:', error.message);
    }
  }

  printStats() {
    console.log('\n📊 Import Statistics:');
    console.log(`  Groups imported: ${this.stats.groupsImported}`);
    console.log(`  Products imported: ${this.stats.productsImported}`);
    console.log(`  Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(error)}`);
      });
      
      if (this.stats.errors.length > 5) {
        console.log(`  ... and ${this.stats.errors.length - 5} more errors`);
      }
    }
  }

  close() {
    this.db.close();
  }
}

// Main execution
async function main() {
  const importer = new TCGCSVImporter();
  
  try {
    console.log('🚀 Starting TCGCSV Data Import...\n');
    
    // Import groups
    await importer.importGroups();
    
    // Import products
    await importer.importProducts();
    
    // Generate statistics
    await importer.generateStatistics();
    
    console.log('\n✅ TCGCSV Data Import completed!');
    importer.printStats();
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  } finally {
    importer.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default TCGCSVImporter;








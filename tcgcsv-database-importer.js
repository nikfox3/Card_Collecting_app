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

class TCGCSVDatabaseImporter {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.stats = {
      groupsProcessed: 0,
      productsProcessed: 0,
      priceHistoryProcessed: 0,
      errors: []
    };
  }

  async parseCSV(filePath, headers = true) {
    return new Promise((resolve, reject) => {
      const records = [];
      const parser = parse({
        columns: headers,
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

  async createNewSchema() {
    console.log('🏗️  Creating new TCGCSV database schema...');
    
    try {
      const schemaSQL = fs.readFileSync(join(__dirname, 'server/migrations/create-tcgcsv-schema.sql'), 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await new Promise((resolve, reject) => {
            this.db.exec(statement, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      }
      
      console.log('✅ New database schema created successfully');
    } catch (error) {
      console.error('❌ Error creating schema:', error.message);
      throw error;
    }
  }

  async importGroups(csvPath) {
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️  Groups CSV not found: ${csvPath}`);
      return [];
    }

    console.log(`🎯 Importing groups from: ${csvPath}`);
    
    try {
      const groups = await this.parseCSV(csvPath);
      const pokemonGroups = groups.filter(group => group.categoryId === '3');
      
      console.log(`Found ${groups.length} total groups, ${pokemonGroups.length} Pokemon groups`);
      
      let imported = 0;
      for (const group of pokemonGroups) {
        try {
          await new Promise((resolve, reject) => {
            this.db.run(
              `INSERT OR REPLACE INTO groups (group_id, name, category_id, url, modified_on)
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
          imported++;
          
          if (imported % 100 === 0) {
            console.log(`  Imported ${imported} groups...`);
          }
        } catch (error) {
          console.error(`Error importing group ${group.groupId}:`, error.message);
          this.stats.errors.push({ groupId: group.groupId, error: error.message });
        }
      }
      
      this.stats.groupsProcessed = imported;
      console.log(`✅ Imported ${imported} Pokemon groups`);
      return pokemonGroups;
    } catch (error) {
      console.error(`Error importing groups:`, error.message);
      this.stats.errors.push({ file: csvPath, error: error.message });
      return [];
    }
  }

  async importProducts(csvPath) {
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️  Products CSV not found: ${csvPath}`);
      return [];
    }

    console.log(`🃏 Importing products from: ${csvPath}`);
    
    try {
      const products = await this.parseCSV(csvPath);
      const pokemonProducts = products.filter(product => product.categoryId === '3');
      
      console.log(`Found ${products.length} total products, ${pokemonProducts.length} Pokemon products`);
      
      let imported = 0;
      for (const product of pokemonProducts) {
        try {
          await new Promise((resolve, reject) => {
            this.db.run(
              `INSERT OR REPLACE INTO products (
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
          
          if (imported % 1000 === 0) {
            console.log(`  Imported ${imported} products...`);
          }
        } catch (error) {
          console.error(`Error importing product ${product.productId}:`, error.message);
          this.stats.errors.push({ productId: product.productId, error: error.message });
        }
      }
      
      this.stats.productsProcessed = imported;
      console.log(`✅ Imported ${imported} Pokemon products`);
      return pokemonProducts;
    } catch (error) {
      console.error(`Error importing products:`, error.message);
      this.stats.errors.push({ file: csvPath, error: error.message });
      return [];
    }
  }

  async importPriceHistory(products) {
    console.log(`💰 Creating price history entries...`);
    
    try {
      let imported = 0;
      const today = new Date().toISOString().split('T')[0];
      
      for (const product of products) {
        // Only create price history if we have pricing data
        if (product.marketPrice || product.lowPrice || product.midPrice || product.highPrice) {
          try {
            await new Promise((resolve, reject) => {
              this.db.run(
                `INSERT OR REPLACE INTO price_history (
                  product_id, sub_type_name, date, low_price, mid_price, high_price, market_price, direct_low_price, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  parseInt(product.productId),
                  product.subTypeName || null,
                  today,
                  product.lowPrice ? parseFloat(product.lowPrice) : null,
                  product.midPrice ? parseFloat(product.midPrice) : null,
                  product.highPrice ? parseFloat(product.highPrice) : null,
                  product.marketPrice ? parseFloat(product.marketPrice) : null,
                  product.directLowPrice ? parseFloat(product.directLowPrice) : null,
                  'TCGCSV'
                ],
                function(err) {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
            imported++;
            
            if (imported % 1000 === 0) {
              console.log(`  Created ${imported} price history entries...`);
            }
          } catch (error) {
            console.error(`Error creating price history for product ${product.productId}:`, error.message);
            this.stats.errors.push({ productId: product.productId, error: error.message });
          }
        }
      }
      
      this.stats.priceHistoryProcessed = imported;
      console.log(`✅ Created ${imported} price history entries`);
    } catch (error) {
      console.error(`Error creating price history:`, error.message);
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
      
      // Price statistics
      const priceStats = await new Promise((resolve, reject) => {
        this.db.get(`
          SELECT 
            COUNT(*) as total_price_entries,
            AVG(market_price) as avg_market_price,
            MIN(market_price) as min_market_price,
            MAX(market_price) as max_market_price
          FROM price_history
          WHERE market_price > 0
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
      console.log(`  Price History Entries: ${priceStats.total_price_entries}`);
      console.log(`  Average Market Price: $${priceStats.avg_market_price?.toFixed(2) || 'N/A'}`);
      console.log(`  Price Range: $${priceStats.min_market_price?.toFixed(2) || 'N/A'} - $${priceStats.max_market_price?.toFixed(2) || 'N/A'}`);
      
    } catch (error) {
      console.error('Error generating statistics:', error.message);
    }
  }

  printStats() {
    console.log('\n📊 Import Statistics:');
    console.log(`  Groups processed: ${this.stats.groupsProcessed}`);
    console.log(`  Products processed: ${this.stats.productsProcessed}`);
    console.log(`  Price history entries: ${this.stats.priceHistoryProcessed}`);
    console.log(`  Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.slice(0, 10).forEach((error, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(error)}`);
      });
      
      if (this.stats.errors.length > 10) {
        console.log(`  ... and ${this.stats.errors.length - 10} more errors`);
      }
    }
  }

  close() {
    this.db.close();
  }
}

// Main execution
async function main() {
  const importer = new TCGCSVDatabaseImporter();
  
  try {
    console.log('🚀 Starting TCGCSV Database Import...\n');
    
    // Step 1: Create new schema
    await importer.createNewSchema();
    
    // Step 2: Import groups (if available)
    const groupsPath = 'pokemon_data/Groups.csv';
    if (fs.existsSync(groupsPath)) {
      await importer.importGroups(groupsPath);
    } else {
      console.log('⚠️  Groups.csv not found, skipping groups import');
    }
    
    // Step 3: Import products
    const productsPath = 'pokemon_data/pokemon_prices_full.csv';
    if (fs.existsSync(productsPath)) {
      const products = await importer.importProducts(productsPath);
      
      // Step 4: Create price history entries
      await importer.importPriceHistory(products);
    } else {
      console.log('⚠️  pokemon_prices_full.csv not found');
      console.log('Please run the Python collector first: python3 tcgcsv_collector.py full');
    }
    
    // Step 5: Generate statistics
    await importer.generateStatistics();
    
    console.log('\n✅ TCGCSV Database Import completed!');
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

export default TCGCSVDatabaseImporter;








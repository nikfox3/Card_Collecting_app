#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'cards.db');

class JapaneseSetsImporter {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.stats = {
      groupsProcessed: 0,
      productsProcessed: 0,
      priceHistoryProcessed: 0,
      errors: []
    };
  }

  async addLanguageColumn() {
    console.log('🔧 Adding language column to groups and products tables...');
    
    try {
      // Add language column to groups table if it doesn't exist
      await new Promise((resolve, reject) => {
        this.db.run(
          `ALTER TABLE groups ADD COLUMN language VARCHAR(10) DEFAULT 'en'`,
          (err) => {
            if (err && !err.message.includes('duplicate column')) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
      
      // Add language column to products table if it doesn't exist
      await new Promise((resolve, reject) => {
        this.db.run(
          `ALTER TABLE products ADD COLUMN language VARCHAR(10) DEFAULT 'en'`,
          (err) => {
            if (err && !err.message.includes('duplicate column')) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
      
      console.log('✅ Language columns added successfully');
    } catch (error) {
      console.error('❌ Error adding language columns:', error.message);
      throw error;
    }
  }

  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const records = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true
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

  async makeRequest(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        console.log(`   ⚠️  Attempt ${attempt} failed, retrying... (${error.message})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async importGroup(groupId, groupName, productsUrl, pricesUrl) {
    try {
      // Insert or update group with Japanese language
      await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT OR REPLACE INTO groups (group_id, name, category_id, url, language, modified_on, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            parseInt(groupId),
            groupName,
            3, // Pokemon category
            productsUrl,
            'ja', // Japanese language
            new Date().toISOString(),
            new Date().toISOString()
          ],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      this.stats.groupsProcessed++;
      return true;
    } catch (error) {
      console.error(`Error importing group ${groupId}:`, error.message);
      this.stats.errors.push({ groupId, error: error.message });
      return false;
    }
  }

  async importProductsForGroup(groupId, productsUrl) {
    try {
      console.log(`   📦 Fetching products from ${productsUrl}...`);
      const productsData = await this.makeRequest(productsUrl);
      
      if (!productsData.success || !productsData.results || productsData.results.length === 0) {
        console.log(`   ⚠️  No products found for group ${groupId}`);
        return 0;
      }

      let imported = 0;
      for (const product of productsData.results) {
        try {
          await new Promise((resolve, reject) => {
            // Extract fields from extendedData array if available
            let extNumber = product.extNumber || null;
            let extHP = product.extHP || null;
            let extCardType = product.extCardType || null;
            let extStage = product.extStage || null;
            let extWeakness = product.extWeakness || null;
            let extResistance = product.extResistance || null;
            let extRetreatCost = product.extRetreatCost || null;
            let extRarity = product.extRarity || null;
            let extAttack1 = product.extAttack1 || null;
            let extAttack2 = product.extAttack2 || null;
            let cardText = product.extCardText || product.extDescription || null;
            let artist = product.artist || null;
            let regulation = product.extRegulation || null;
            let legalities = product.legalities || null;
            
            // Parse extendedData array to extract card information
            if (product.extendedData && Array.isArray(product.extendedData)) {
              for (const item of product.extendedData) {
                const name = (item.name || item.displayName || '').toLowerCase().trim();
                const value = item.value;
                
                // Map extendedData fields to database columns (case-insensitive matching)
                // Check both direct field names and display names
                // For number: check exact match first, then includes (to avoid matching "card number" when we want just "number")
                if (!extNumber && (name === 'number' || name === 'no' || name === 'card number' || 
                    (name.includes('number') && !name.includes('card number')))) {
                  extNumber = String(value).trim();
                }
                if (name === 'hp' && !extHP) extHP = value;
                if ((name === 'cardtype' || name === 'card type' || name === 'type') && !extCardType) extCardType = value;
                if (name === 'stage' && !extStage) extStage = value;
                if (name === 'weakness' && !extWeakness) extWeakness = value;
                if (name === 'resistance' && !extResistance) extResistance = value;
                if ((name === 'retreatcost' || name === 'retreat cost' || name === 'retreat') && !extRetreatCost) extRetreatCost = value;
                if (name === 'rarity' && !extRarity) {
                  const rarityValue = String(value).trim();
                  // Handle "None" rarity - infer Common for Pokemon cards
                  if (rarityValue.toLowerCase() === 'none') {
                    // If it's a Pokemon card (has HP or card type indicates Pokemon), use Common
                    if (extHP || (extCardType && (extCardType.toLowerCase().includes('pokemon') || extCardType.toLowerCase().includes('pokémon')))) {
                      extRarity = 'Common';
                    } else {
                      // For Trainers/Energy, leave as null (they don't have rarity)
                      extRarity = null;
                    }
                  } else if (rarityValue && rarityValue.toLowerCase() !== 'unconfirmed' && rarityValue.toLowerCase() !== 'null') {
                    extRarity = rarityValue;
                  }
                }
                if ((name === 'attack 1' || name === 'attack1' || (name.includes('attack') && name.includes('1'))) && !extAttack1) extAttack1 = value;
                if ((name === 'attack 2' || name === 'attack2' || (name.includes('attack') && name.includes('2'))) && !extAttack2) extAttack2 = value;
                if ((name === 'cardtext' || name === 'card text' || name === 'description' || name.includes('ability')) && !cardText) cardText = value;
                if ((name === 'artist' || name === 'illustrator') && !artist) artist = value;
                if (name === 'regulation' && !regulation) regulation = value;
                if ((name === 'legalities' || name === 'legal' || name === 'format')) {
                  if (!legalities) {
                    legalities = typeof value === 'string' ? value : JSON.stringify(value);
                  }
                }
              }
            }
            
            this.db.run(
              `INSERT OR REPLACE INTO products (
                product_id, name, clean_name, image_url, category_id, group_id, url,
                modified_on, image_count, ext_number, ext_rarity, ext_card_type,
                ext_hp, ext_stage, ext_card_text, ext_attack1, ext_attack2,
                ext_weakness, ext_resistance, ext_retreat_cost, sub_type_name,
                low_price, mid_price, high_price, market_price,
                artist, ext_regulation, legalities,
                language, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                parseInt(product.productId),
                product.name || null,
                product.cleanName || null,
                product.imageUrl || null,
                3, // Pokemon category
                parseInt(groupId),
                product.url || null,
                product.modifiedOn || null,
                parseInt(product.imageCount) || 1,
                extNumber,
                extRarity,
                extCardType,
                extHP ? parseInt(extHP) : null,
                extStage,
                cardText,
                extAttack1,
                extAttack2,
                extWeakness,
                extResistance,
                extRetreatCost,
                product.subTypeName || null,
                product.lowPrice ? parseFloat(product.lowPrice) : null,
                product.midPrice ? parseFloat(product.midPrice) : null,
                product.highPrice ? parseFloat(product.highPrice) : null,
                product.marketPrice ? parseFloat(product.marketPrice) : null,
                artist,
                regulation,
                legalities,
                'ja', // Japanese language
                new Date().toISOString()
              ],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          imported++;
          
          // Import price history if pricing data exists
          // Use market_price as primary price, fallback to mid_price
          const priceValue = product.marketPrice || product.midPrice || product.lowPrice || 0;
          if (priceValue > 0) {
            const today = new Date().toISOString().split('T')[0];
            await new Promise((resolve, reject) => {
              this.db.run(
                `INSERT OR REPLACE INTO price_history (
                  product_id, sub_type_name, date, price, condition, source
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  String(product.productId), // product_id is TEXT in price_history
                  product.subTypeName || null,
                  today,
                  parseFloat(priceValue),
                  'Near Mint', // Default condition
                  'TCGCSV-JA'
                ],
                function(err) {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
            this.stats.priceHistoryProcessed++;
          }
          
          if (imported % 100 === 0) {
            console.log(`     Imported ${imported} products...`);
          }
        } catch (error) {
          console.error(`     Error importing product ${product.productId}:`, error.message);
          this.stats.errors.push({ productId: product.productId, error: error.message });
        }
      }
      
      this.stats.productsProcessed += imported;
      return imported;
    } catch (error) {
      console.error(`   Error fetching products for group ${groupId}:`, error.message);
      this.stats.errors.push({ groupId, error: error.message });
      return 0;
    }
  }

  async importPricesForGroup(groupId, pricesUrl) {
    try {
      console.log(`   💰 Fetching prices from ${pricesUrl}...`);
      const pricesData = await this.makeRequest(pricesUrl);
      
      if (!pricesData.success || !pricesData.results || pricesData.results.length === 0) {
        console.log(`   ⚠️  No prices found for group ${groupId}`);
        return 0;
      }

      const today = new Date().toISOString().split('T')[0];
      let imported = 0;
      
      for (const price of pricesData.results) {
        try {
          // Use market_price as primary price, fallback to mid_price
          const priceValue = price.marketPrice || price.midPrice || price.lowPrice || 0;
          
          if (priceValue > 0) {
            await new Promise((resolve, reject) => {
              this.db.run(
                `INSERT OR REPLACE INTO price_history (
                  product_id, sub_type_name, date, price, condition, source
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  String(price.productId), // product_id is TEXT in price_history
                  price.subTypeName || null,
                  today,
                  parseFloat(priceValue),
                  'Near Mint', // Default condition
                  'TCGCSV-JA'
                ],
                function(err) {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
            imported++;
          }
          
          // Also update the product's current pricing
          await new Promise((resolve, reject) => {
            this.db.run(
              `UPDATE products SET
                low_price = ?,
                mid_price = ?,
                high_price = ?,
                market_price = ?,
                updated_at = ?
              WHERE product_id = ?`,
              [
                price.lowPrice ? parseFloat(price.lowPrice) : null,
                price.midPrice ? parseFloat(price.midPrice) : null,
                price.highPrice ? parseFloat(price.highPrice) : null,
                price.marketPrice ? parseFloat(price.marketPrice) : null,
                new Date().toISOString(),
                parseInt(price.productId)
              ],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          
          if (imported % 100 === 0) {
            console.log(`     Imported ${imported} price entries...`);
          }
        } catch (error) {
          console.error(`     Error importing price for product ${price.productId}:`, error.message);
          this.stats.errors.push({ productId: price.productId, error: error.message });
        }
      }
      
      return imported;
    } catch (error) {
      console.error(`   Error fetching prices for group ${groupId}:`, error.message);
      this.stats.errors.push({ groupId, error: error.message });
      return 0;
    }
  }

  async importFromCSV(csvPath) {
    console.log(`📚 Reading Japanese sets from: ${csvPath}`);
    
    const sets = await this.parseCSV(csvPath);
    console.log(`✅ Found ${sets.length} Japanese sets to import\n`);
    
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      const groupId = set['Group ID'];
      const groupName = set['Group Name'];
      const productsUrl = set['Products'];
      const pricesUrl = set['Prices'];
      
      if (!groupId || !groupName || !productsUrl || !pricesUrl) {
        console.log(`⚠️  Skipping invalid row ${i + 1}`);
        continue;
      }
      
      console.log(`\n[${i + 1}/${sets.length}] Processing: ${groupName} (ID: ${groupId})`);
      
      // Import group
      await this.importGroup(groupId, groupName, productsUrl, pricesUrl);
      
      // Import products
      const productsCount = await this.importProductsForGroup(groupId, productsUrl);
      console.log(`   ✅ Imported ${productsCount} products`);
      
      // Import prices
      const pricesCount = await this.importPricesForGroup(groupId, pricesUrl);
      console.log(`   ✅ Imported ${pricesCount} price entries`);
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
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
  const importer = new JapaneseSetsImporter();
  
  try {
    console.log('🚀 Starting Japanese Sets Import...\n');
    
    // Step 1: Add language column
    await importer.addLanguageColumn();
    
    // Step 2: Import from CSV
    const csvPath = 'public/Pokemon database files/tcgcsv-set-products-prices/Japanese-Table 1.csv';
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }
    
    await importer.importFromCSV(csvPath);
    
    console.log('\n✅ Japanese Sets Import completed!');
    importer.printStats();
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error.stack);
  } finally {
    importer.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default JapaneseSetsImporter;


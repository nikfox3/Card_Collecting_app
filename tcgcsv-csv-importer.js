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
      categoriesProcessed: 0,
      groupsProcessed: 0,
      productsProcessed: 0,
      pricesProcessed: 0,
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

  async importCategories(csvPath) {
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️  Categories CSV not found: ${csvPath}`);
      return [];
    }

    console.log(`📋 Importing categories from: ${csvPath}`);
    
    try {
      const categories = await this.parseCSV(csvPath);
      console.log(`Found ${categories.length} categories`);
      
      // Find Pokemon category
      const pokemonCategory = categories.find(cat => 
        cat.categoryId === '3' || 
        cat.name?.toLowerCase().includes('pokemon') ||
        cat.name?.toLowerCase().includes('pokémon')
      );
      
      if (pokemonCategory) {
        console.log(`✅ Found Pokemon category: ${pokemonCategory.name} (ID: ${pokemonCategory.categoryId})`);
        this.stats.categoriesProcessed = 1;
      }
      
      return categories;
    } catch (error) {
      console.error(`Error importing categories:`, error.message);
      this.stats.errors.push({ file: csvPath, error: error.message });
      return [];
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
      
      // Show some examples
      pokemonGroups.slice(0, 5).forEach(group => {
        console.log(`  - ${group.name} (ID: ${group.groupId})`);
      });
      
      if (pokemonGroups.length > 5) {
        console.log(`  ... and ${pokemonGroups.length - 5} more Pokemon sets`);
      }
      
      this.stats.groupsProcessed = pokemonGroups.length;
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
      const pokemonProducts = products.filter(product => {
        // Filter for Pokemon products (categoryId = 3)
        return product.categoryId === '3' || 
               product.groupId?.startsWith('3') ||
               product.name?.toLowerCase().includes('pokemon') ||
               product.name?.toLowerCase().includes('pokémon');
      });
      
      console.log(`Found ${products.length} total products, ${pokemonProducts.length} Pokemon products`);
      
      // Show some examples
      pokemonProducts.slice(0, 5).forEach(product => {
        console.log(`  - ${product.name} (ID: ${product.productId})`);
      });
      
      if (pokemonProducts.length > 5) {
        console.log(`  ... and ${pokemonProducts.length - 5} more Pokemon products`);
      }
      
      this.stats.productsProcessed = pokemonProducts.length;
      return pokemonProducts;
    } catch (error) {
      console.error(`Error importing products:`, error.message);
      this.stats.errors.push({ file: csvPath, error: error.message });
      return [];
    }
  }

  async importPrices(csvPath) {
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️  Prices CSV not found: ${csvPath}`);
      return [];
    }

    console.log(`💰 Importing prices from: ${csvPath}`);
    
    try {
      const prices = await this.parseCSV(csvPath);
      console.log(`Found ${prices.length} price entries`);
      
      // Show price structure
      if (prices.length > 0) {
        const price = prices[0];
        console.log(`  Price structure:`, Object.keys(price));
        
        // Show a sample price entry
        console.log(`  Sample entry:`, {
          productId: price.productId,
          marketPrice: price.marketPrice,
          lowPrice: price.lowPrice,
          midPrice: price.midPrice,
          highPrice: price.highPrice
        });
      }
      
      this.stats.pricesProcessed = prices.length;
      return prices;
    } catch (error) {
      console.error(`Error importing prices:`, error.message);
      this.stats.errors.push({ file: csvPath, error: error.message });
      return [];
    }
  }

  async importPricesToDatabase(prices) {
    if (!prices || prices.length === 0) return;
    
    console.log(`💾 Importing ${prices.length} price entries to database...`);
    
    let imported = 0;
    let errors = 0;
    
    for (const price of prices) {
      try {
        // Insert or update price in price_history table
        await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT OR REPLACE INTO price_history (product_id, date, price, low_price, mid_price, high_price, source)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              price.productId,
              price.date || new Date().toISOString().split('T')[0],
              price.marketPrice || price.lowPrice || 0,
              price.lowPrice || 0,
              price.midPrice || 0,
              price.highPrice || 0,
              'TCGCSV'
            ],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        
        // Update current_value in cards table
        await new Promise((resolve, reject) => {
          this.db.run(
            `UPDATE cards SET current_value = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [price.marketPrice || price.lowPrice || 0, price.productId],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        
        imported++;
        
        if (imported % 1000 === 0) {
          console.log(`  Imported ${imported} prices...`);
        }
        
      } catch (error) {
        errors++;
        if (errors <= 5) { // Only show first 5 errors
          console.error(`Error importing price for product ${price.productId}:`, error.message);
        }
        this.stats.errors.push({ productId: price.productId, error: error.message });
      }
    }
    
    console.log(`✅ Imported ${imported} prices, ${errors} errors`);
  }

  async testWithSampleData() {
    console.log('🚀 Testing TCGCSV CSV import with sample data...\n');
    
    try {
      // Test with sample CSV files (if they exist)
      const sampleFiles = {
        categories: 'sample-categories.csv',
        groups: 'sample-groups.csv', 
        products: 'sample-products.csv',
        prices: 'sample-prices.csv'
      };
      
      // Check if sample files exist
      const existingFiles = Object.entries(sampleFiles).filter(([name, path]) => 
        fs.existsSync(path)
      );
      
      if (existingFiles.length === 0) {
        console.log('📝 No sample CSV files found. Creating sample data structure...');
        this.createSampleDataStructure();
        return;
      }
      
      console.log(`Found ${existingFiles.length} sample files:`, existingFiles.map(([name]) => name));
      
      // Import each type of data
      for (const [type, path] of existingFiles) {
        switch (type) {
          case 'categories':
            await this.importCategories(path);
            break;
          case 'groups':
            await this.importGroups(path);
            break;
          case 'products':
            await this.importProducts(path);
            break;
          case 'prices':
            const prices = await this.importPrices(path);
            await this.importPricesToDatabase(prices);
            break;
        }
      }
      
      console.log('\n✅ TCGCSV CSV import test completed!');
      this.printStats();
      
    } catch (error) {
      console.error('❌ TCGCSV CSV import test failed:', error.message);
      this.printStats();
    }
  }

  createSampleDataStructure() {
    console.log('\n📋 TCGCSV Data Structure:');
    console.log('To use TCGCSV data, you need to download these CSV files:');
    console.log('1. Categories.csv - List of all categories (Pokemon = categoryId: 3)');
    console.log('2. Groups.csv - List of all sets/groups');
    console.log('3. Products.csv - List of all individual cards/products');
    console.log('4. Prices.csv - Current pricing data for all products');
    console.log('\n📥 Download URLs (example):');
    console.log('- https://tcgcsv.com/Categories.csv');
    console.log('- https://tcgcsv.com/Groups.csv');
    console.log('- https://tcgcsv.com/Products.csv');
    console.log('- https://tcgcsv.com/Prices.csv');
    console.log('\n💡 Note: You may need to manually download these files or use a different access method.');
  }

  printStats() {
    console.log('\n📊 Import Statistics:');
    console.log(`  Categories processed: ${this.stats.categoriesProcessed}`);
    console.log(`  Groups processed: ${this.stats.groupsProcessed}`);
    console.log(`  Products processed: ${this.stats.productsProcessed}`);
    console.log(`  Prices processed: ${this.stats.pricesProcessed}`);
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
  const importer = new TCGCSVImporter();
  
  try {
    await importer.testWithSampleData();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    importer.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default TCGCSVImporter;








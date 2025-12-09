#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'cards.db');

// TCGCSV API endpoints
const TCGCSV_BASE_URL = 'https://tcgcsv.com';
const POKEMON_CATEGORY_ID = 3;

class TCGCSVIntegration {
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

  async fetchData(endpoint) {
    try {
      console.log(`Fetching: ${TCGCSV_BASE_URL}${endpoint}`);
      const response = await fetch(`${TCGCSV_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.message);
      this.stats.errors.push({ endpoint, error: error.message });
      return null;
    }
  }

  async getCategories() {
    console.log('📋 Fetching categories...');
    const categories = await this.fetchData('/categories');
    
    if (categories) {
      console.log(`Found ${categories.length} categories`);
      for (const category of categories) {
        if (category.categoryId === POKEMON_CATEGORY_ID) {
          console.log(`✅ Found Pokemon category: ${category.name} (ID: ${category.categoryId})`);
          this.stats.categoriesProcessed++;
        }
      }
    }
    
    return categories;
  }

  async getPokemonGroups() {
    console.log('🎯 Fetching Pokemon groups (sets)...');
    const groups = await this.fetchData(`/groups?categoryId=${POKEMON_CATEGORY_ID}`);
    
    if (groups) {
      console.log(`Found ${groups.length} Pokemon groups/sets`);
      this.stats.groupsProcessed = groups.length;
      
      // Show some examples
      groups.slice(0, 5).forEach(group => {
        console.log(`  - ${group.name} (ID: ${group.groupId})`);
      });
      
      if (groups.length > 5) {
        console.log(`  ... and ${groups.length - 5} more sets`);
      }
    }
    
    return groups;
  }

  async getProductsForGroup(groupId, limit = 10) {
    console.log(`🃏 Fetching products for group ${groupId} (limit: ${limit})...`);
    const products = await this.fetchData(`/products?groupId=${groupId}&limit=${limit}`);
    
    if (products) {
      console.log(`Found ${products.length} products in this group`);
      this.stats.productsProcessed += products.length;
      
      // Show some examples
      products.slice(0, 3).forEach(product => {
        console.log(`  - ${product.name} (ID: ${product.productId})`);
      });
    }
    
    return products;
  }

  async getPricesForProduct(productId) {
    console.log(`💰 Fetching prices for product ${productId}...`);
    const prices = await this.fetchData(`/prices?productId=${productId}`);
    
    if (prices) {
      console.log(`Found ${prices.length} price entries for this product`);
      this.stats.pricesProcessed += prices.length;
      
      // Show price structure
      if (prices.length > 0) {
        const price = prices[0];
        console.log(`  Price structure:`, Object.keys(price));
      }
    }
    
    return prices;
  }

  async importPricesToDatabase(prices) {
    if (!prices || prices.length === 0) return;
    
    console.log(`💾 Importing ${prices.length} price entries to database...`);
    
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
        
      } catch (error) {
        console.error(`Error importing price for product ${price.productId}:`, error.message);
        this.stats.errors.push({ productId: price.productId, error: error.message });
      }
    }
  }

  async testIntegration() {
    console.log('🚀 Testing TCGCSV integration...\n');
    
    try {
      // Step 1: Get categories
      const categories = await this.getCategories();
      if (!categories) {
        console.log('❌ Failed to fetch categories. TCGCSV might be down or access restricted.');
        return false;
      }
      
      // Step 2: Get Pokemon groups
      const groups = await this.getPokemonGroups();
      if (!groups || groups.length === 0) {
        console.log('❌ Failed to fetch Pokemon groups.');
        return false;
      }
      
      // Step 3: Test with first group
      const firstGroup = groups[0];
      const products = await this.getProductsForGroup(firstGroup.groupId, 5);
      if (!products || products.length === 0) {
        console.log('❌ Failed to fetch products.');
        return false;
      }
      
      // Step 4: Test with first product
      const firstProduct = products[0];
      const prices = await this.getPricesForProduct(firstProduct.productId);
      if (!prices || prices.length === 0) {
        console.log('❌ Failed to fetch prices.');
        return false;
      }
      
      // Step 5: Test database import
      await this.importPricesToDatabase(prices);
      
      console.log('\n✅ TCGCSV integration test completed successfully!');
      this.printStats();
      return true;
      
    } catch (error) {
      console.error('❌ TCGCSV integration test failed:', error.message);
      this.printStats();
      return false;
    }
  }

  printStats() {
    console.log('\n📊 Integration Statistics:');
    console.log(`  Categories processed: ${this.stats.categoriesProcessed}`);
    console.log(`  Groups processed: ${this.stats.groupsProcessed}`);
    console.log(`  Products processed: ${this.stats.productsProcessed}`);
    console.log(`  Prices processed: ${this.stats.pricesProcessed}`);
    console.log(`  Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(error)}`);
      });
    }
  }

  close() {
    this.db.close();
  }
}

// Main execution
async function main() {
  const integration = new TCGCSVIntegration();
  
  try {
    const success = await integration.testIntegration();
    
    if (success) {
      console.log('\n🎉 TCGCSV integration is ready!');
      console.log('Next steps:');
      console.log('1. Set up daily data collection');
      console.log('2. Update pricing collection scripts');
      console.log('3. Test with full dataset');
    } else {
      console.log('\n⚠️  TCGCSV integration needs attention.');
      console.log('Check the errors above and verify TCGCSV access.');
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    integration.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default TCGCSVIntegration;








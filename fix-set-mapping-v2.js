#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

class SetMappingFixV2 {
  constructor() {
    this.updatedCount = 0;
    this.errorCount = 0;
  }

  async fix() {
    try {
      console.log('🔄 Fixing Set Mapping V2...\n');

      // First, let's get all the set mappings from the original cards table
      const setMappings = await all(`
        SELECT DISTINCT c.set_id, s.name as set_name
        FROM cards c
        LEFT JOIN sets s ON c.set_id = s.id
        WHERE c.set_id IS NOT NULL
        ORDER BY s.name
      `);

      console.log(`📚 Found ${setMappings.length} unique sets to map\n`);

      // Create a mapping of set_id to group_id
      const setToGroupMap = new Map();
      
      for (const [index, mapping] of setMappings.entries()) {
        const groupId = index + 1; // Start from 1
        setToGroupMap.set(mapping.set_id, groupId);
        
        // Insert or update the group
        await run(`
          INSERT OR REPLACE INTO groups (group_id, name, category_id, published_on) 
          VALUES (?, ?, 3, ?)
        `, [
          groupId,
          mapping.set_name,
          '1996-01-01' // Default date
        ]);
        
        if (index < 10) { // Show first 10 mappings
          console.log(`✅ Mapped ${mapping.set_id} -> ${mapping.set_name} (group_id: ${groupId})`);
        }
      }

      console.log(`\n📊 Updating products with correct group_id mappings...\n`);

      // Now update all products by matching card names and getting their set_id
      const products = await all(`
        SELECT p.product_id, p.name
        FROM products p
        WHERE p.group_id = 1 OR p.group_id IS NULL
        LIMIT 1000
      `);

      console.log(`📦 Found ${products.length} products to update\n`);

      for (const [index, product] of products.entries()) {
        try {
          // Find the card with the same name and get its set_id
          const cardData = await get(`
            SELECT set_id FROM cards 
            WHERE name = ? 
            LIMIT 1
          `, [product.name]);
          
          if (cardData && cardData.set_id) {
            const groupId = setToGroupMap.get(cardData.set_id);
            
            if (groupId) {
              await run(`
                UPDATE products 
                SET group_id = ?
                WHERE product_id = ?
              `, [groupId, product.product_id]);
              
              this.updatedCount++;
              
              if (index % 100 === 0 && index > 0) {
                console.log(`📦 Progress: ${index}/${products.length} (${((index/products.length)*100).toFixed(1)}%)`);
                console.log(`   ✅ Updated: ${this.updatedCount} | ❌ Errors: ${this.errorCount}`);
              }
            } else {
              console.log(`⚠️  No mapping found for set_id: ${cardData.set_id} (card: ${product.name})`);
              this.errorCount++;
            }
          } else {
            console.log(`⚠️  No card found for: ${product.name}`);
            this.errorCount++;
          }
        } catch (error) {
          console.error(`❌ Error updating product ${product.product_id}:`, error.message);
          this.errorCount++;
        }
      }

      console.log('\n🎉 Set mapping fix complete!\n');
      console.log('📊 Final Statistics:');
      console.log(`   • Products updated: ${this.updatedCount}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${((this.updatedCount / products.length) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Set mapping fix failed:', error.message);
    } finally {
      db.close();
    }
  }
}

// Run the fix
const fixer = new SetMappingFixV2();
fixer.fix();





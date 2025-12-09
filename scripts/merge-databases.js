// Merge local database (./cards.db) into API database (../cards.db)
// Strategy:
// 1. Add cards from local DB that don't exist in API DB
// 2. Update pricing from local DB if it's better/newer
// 3. Preserve hashes from API DB (it has more)
// 4. Handle conflicts intelligently

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDbPath = path.resolve(__dirname, '../cards.db');
const apiDbPath = path.resolve(__dirname, '../../cards.db');

// Backup API database first
const backupPath = path.resolve(__dirname, `../../cards_backup_before_merge_${Date.now()}.db`);
console.log(`📦 Creating backup: ${backupPath}`);
fs.copyFileSync(apiDbPath, backupPath);
console.log('✅ Backup created\n');

// Open both databases with WAL mode and busy timeout
const apiDb = new sqlite3.Database(apiDbPath);
const localDb = new sqlite3.Database(localDbPath);

// Enable WAL mode for better concurrency
apiDb.run('PRAGMA journal_mode = WAL;');
apiDb.run('PRAGMA busy_timeout = 30000;'); // 30 second timeout
localDb.run('PRAGMA journal_mode = WAL;');
localDb.run('PRAGMA busy_timeout = 30000;');

const apiRun = promisify(apiDb.run.bind(apiDb));
const apiGet = promisify(apiDb.get.bind(apiDb));
const apiAll = promisify(apiDb.all.bind(apiDb));

const localGet = promisify(localDb.get.bind(localDb));
const localAll = promisify(localDb.all.bind(localDb));

async function mergeDatabases() {
  try {
    console.log('🔄 Starting database merge...\n');
    console.log(`📊 Local DB: ${localDbPath}`);
    console.log(`📊 API DB: ${apiDbPath}\n`);

    // Step 1: Find cards in local DB that don't exist in API DB
    console.log('📋 Step 1: Finding cards to add...');
    
    // Get all product_ids from API DB first
    const apiProductIds = await apiAll(`
      SELECT product_id FROM products WHERE category_id = 3
    `);
    const apiIdSet = new Set(apiProductIds.map(r => r.product_id));
    console.log(`   API DB has ${apiIdSet.size} cards\n`);
    
    // Get all cards from local DB
    const allLocalCards = await localAll(`
      SELECT * FROM products WHERE category_id = 3
    `);
    console.log(`   Local DB has ${allLocalCards.length} cards\n`);
    
    // Filter to only cards not in API DB
    const cardsToAdd = allLocalCards.filter(card => !apiIdSet.has(card.product_id));
    console.log(`   Found ${cardsToAdd.length} new cards to add\n`);

    // Step 2: Find cards that exist in both (for pricing updates)
    console.log('📋 Step 2: Finding cards to update pricing...');
    const cardsToUpdate = await localAll(`
      SELECT 
        p.product_id,
        p.market_price,
        p.mid_price,
        p.low_price,
        p.high_price
      FROM products p
      WHERE p.category_id = 3
        AND p.market_price > 0
        AND EXISTS (
          SELECT 1 FROM products p2 
          WHERE p2.product_id = p.product_id
        )
    `);
    console.log(`   Found ${cardsToUpdate.length} cards with pricing to potentially update\n`);

    // Step 3: Get API DB schema to only insert valid columns
    console.log('📋 Step 3: Getting API database schema...');
    const apiColumns = await apiAll(`PRAGMA table_info(products)`);
    const apiColumnSet = new Set(apiColumns.map(c => c.name));
    console.log(`   API DB has ${apiColumnSet.size} columns\n`);
    
    // Step 4: Add new cards
    let added = 0;
    let skipped = 0;
    let errors = 0;
    
    if (cardsToAdd.length > 0) {
      console.log(`📥 Step 4: Adding ${cardsToAdd.length} new cards...`);
      
      for (const card of cardsToAdd) {
        try {
          // Only include columns that exist in API database
          const validColumns = Object.keys(card).filter(
            k => k !== 'product_id' && apiColumnSet.has(k)
          );
          const placeholders = validColumns.map(() => '?').join(', ');
          const values = validColumns.map(col => card[col]);
          
          if (validColumns.length === 0) {
            console.error(`\n   ⚠️  Card ${card.product_id} has no valid columns to insert`);
            errors++;
            continue;
          }
          
          await apiRun(`
            INSERT INTO products (product_id, ${validColumns.join(', ')})
            VALUES (?, ${placeholders})
          `, [card.product_id, ...values]);
          
          added++;
          
          if (added % 100 === 0) {
            process.stdout.write(`   ✅ Added ${added}/${cardsToAdd.length} cards...\r`);
          }
        } catch (error) {
          if (error.message.includes('UNIQUE constraint')) {
            skipped++;
          } else {
            errors++;
            if (errors <= 10) {
              console.error(`\n   ❌ Error adding card ${card.product_id}:`, error.message);
            } else if (errors === 11) {
              console.error(`\n   ⚠️  Suppressing further error messages...`);
            }
          }
        }
      }
      
      console.log(`\n   ✅ Added ${added} cards, skipped ${skipped} duplicates, ${errors} errors\n`);
    }

    // Step 5: Update pricing (only if local DB has better/newer pricing)
    let pricingUpdated = 0;
    let pricingSkipped = 0;
    
    if (cardsToUpdate.length > 0) {
      console.log(`💰 Step 4: Updating pricing for ${cardsToUpdate.length} cards...`);
      
      for (const localCard of cardsToUpdate) {
        try {
          // Get current pricing from API DB
          const apiCard = await apiGet(`
            SELECT market_price, mid_price, low_price, high_price
            FROM products
            WHERE product_id = ?
          `, [localCard.product_id]);
          
          // Handle case where card doesn't exist in API DB (shouldn't happen in this step, but be safe)
          if (!apiCard) {
            pricingSkipped++;
            continue;
          }
          
          // Update if local DB has pricing and API DB doesn't, or if local pricing is significantly different
          const shouldUpdate = 
            (!apiCard.market_price && localCard.market_price) ||
            (localCard.market_price && apiCard.market_price && 
             Math.abs(localCard.market_price - apiCard.market_price) > 0.01);
          
          if (shouldUpdate) {
            await apiRun(`
              UPDATE products
              SET 
                market_price = COALESCE(?, market_price),
                mid_price = COALESCE(?, mid_price),
                low_price = COALESCE(?, low_price),
                high_price = COALESCE(?, high_price)
              WHERE product_id = ?
            `, [
              localCard.market_price || null,
              localCard.mid_price || null,
              localCard.low_price || null,
              localCard.high_price || null,
              localCard.product_id
            ]);
            
            pricingUpdated++;
          } else {
            pricingSkipped++;
          }
          
          if ((pricingUpdated + pricingSkipped) % 100 === 0) {
            process.stdout.write(`   ✅ Processed ${pricingUpdated + pricingSkipped}/${cardsToUpdate.length}...\r`);
          }
        } catch (error) {
          console.error(`\n   ❌ Error updating pricing for ${localCard.product_id}:`, error.message);
        }
      }
      
      console.log(`\n   ✅ Updated ${pricingUpdated} cards, skipped ${pricingSkipped} (no change needed)\n`);
    }

    // Step 6: Summary
    console.log('📊 Final Summary:');
    console.log(`   ✅ Cards added: ${added}`);
    console.log(`   ⏭️  Cards skipped: ${skipped}`);
    console.log(`   💰 Pricing updated: ${pricingUpdated}`);
    console.log(`   ⏭️  Pricing skipped: ${pricingSkipped}`);
    
    // Final counts
    const finalStats = await apiGet(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN market_price > 0 THEN 1 END) as with_pricing,
        COUNT(CASE WHEN image_hash_perceptual IS NOT NULL THEN 1 END) as with_hashes
      FROM products
      WHERE category_id = 3
    `);
    
    console.log(`\n📊 API Database Final Stats:`);
    console.log(`   Total cards: ${finalStats.total}`);
    console.log(`   With pricing: ${finalStats.with_pricing}`);
    console.log(`   With hashes: ${finalStats.with_hashes}`);
    
    console.log(`\n✅ Merge complete!`);
    console.log(`💾 Backup saved at: ${backupPath}`);
    console.log(`\n⚠️  You can now safely remove ./cards.db if desired`);
    
  } catch (error) {
    console.error('❌ Error during merge:', error);
    console.error(`\n💾 Backup available at: ${backupPath}`);
    process.exit(1);
  } finally {
    apiDb.close();
    localDb.close();
  }
}

mergeDatabases();


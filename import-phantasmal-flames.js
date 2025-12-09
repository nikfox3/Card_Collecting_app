#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { query, run, get } from './server/utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the CSV file
const CSV_FILE = '/Users/NikFox/Downloads/ME02PhantasmalFlamesProductsAndPrices.csv';

// Group information for Phantasmal Flames
const GROUP_INFO = {
  group_id: 24448,
  name: 'Mega Evolution-Phantasmal Flames',
  abbreviation: 'ME02',
  category_id: 3, // Pokemon
  published_on: '2025-11-14',
  modified_on: '2025-11-14'
};

async function ensureGroupExists() {
  console.log('🔍 Checking if group exists...');
  
  const existing = await get('SELECT * FROM groups WHERE group_id = ?', [GROUP_INFO.group_id]);
  
  if (existing) {
    console.log(`✅ Group ${GROUP_INFO.group_id} (${GROUP_INFO.name}) already exists`);
    // Update modified_on, published_on, and abbreviation if they're missing
    await run(
      `UPDATE groups 
       SET modified_on = COALESCE(modified_on, ?), 
           published_on = COALESCE(published_on, ?),
           abbreviation = COALESCE(abbreviation, ?),
           updated_at = CURRENT_TIMESTAMP 
       WHERE group_id = ?`,
      [GROUP_INFO.modified_on, GROUP_INFO.published_on, GROUP_INFO.abbreviation, GROUP_INFO.group_id]
    );
    return;
  }
  
  console.log(`➕ Creating group ${GROUP_INFO.group_id} (${GROUP_INFO.name})...`);
  
  // Ensure category exists
  const categoryExists = await get('SELECT * FROM categories WHERE category_id = ?', [GROUP_INFO.category_id]);
  if (!categoryExists) {
    console.log(`➕ Creating category ${GROUP_INFO.category_id} (Pokémon)...`);
    await run(
      'INSERT INTO categories (category_id, name) VALUES (?, ?)',
      [GROUP_INFO.category_id, 'Pokémon']
    );
  }
  
  // Create the group
  await run(
    `INSERT INTO groups (group_id, name, abbreviation, category_id, published_on, modified_on)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      GROUP_INFO.group_id,
      GROUP_INFO.name,
      GROUP_INFO.abbreviation,
      GROUP_INFO.category_id,
      GROUP_INFO.published_on,
      GROUP_INFO.modified_on
    ]
  );
  
  console.log(`✅ Group created successfully`);
}

async function parseCSVFile() {
  console.log(`📄 Reading CSV file: ${CSV_FILE}...`);
  const content = await fs.readFile(CSV_FILE, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  console.log(`✅ Found ${records.length} products in CSV`);
  return records;
}

function parsePrice(value) {
  if (!value || value === '' || value === 'null') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function parseInteger(value) {
  if (!value || value === '' || value === 'null') return null;
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

async function importProducts(products) {
  console.log(`📥 Importing ${products.length} products...`);
  
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];
  
  for (const product of products) {
    try {
      // Check if product already exists
      const existing = await get('SELECT product_id FROM products WHERE product_id = ?', [
        parseInt(product.productId)
      ]);
      
      const values = [
        parseInt(product.productId),
        product.name || null,
        product.cleanName || null,
        product.imageUrl || null,
        parseInt(product.categoryId) || GROUP_INFO.category_id,
        parseInt(product.groupId) || GROUP_INFO.group_id,
        product.url || null,
        product.modifiedOn || null,
        parseInteger(product.imageCount) || 1,
        
        // Extended data
        product.extNumber || null,
        product.extRarity || null,
        product.extCardType || null,
        parseInteger(product.extHP),
        product.extStage || null,
        product.extCardText || null,
        product.extAttack1 || null,
        product.extAttack2 || null,
        product.extWeakness || null,
        product.extResistance || null,
        parseInteger(product.extRetreatCost),
        
        // Pricing data
        parsePrice(product.lowPrice),
        parsePrice(product.midPrice),
        parsePrice(product.highPrice),
        parsePrice(product.marketPrice),
        parsePrice(product.directLowPrice),
        product.subTypeName || null
      ];
      
      if (existing) {
        // Update existing product
        await run(
          `UPDATE products SET
            name = ?, clean_name = ?, image_url = ?, category_id = ?, group_id = ?,
            url = ?, modified_on = ?, image_count = ?,
            ext_number = ?, ext_rarity = ?, ext_card_type = ?, ext_hp = ?, ext_stage = ?,
            ext_card_text = ?, ext_attack1 = ?, ext_attack2 = ?, ext_weakness = ?,
            ext_resistance = ?, ext_retreat_cost = ?,
            low_price = ?, mid_price = ?, high_price = ?, market_price = ?,
            direct_low_price = ?, sub_type_name = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ?`,
          [...values.slice(1), values[0]]
        );
        updated++;
      } else {
        // Insert new product
        await run(
          `INSERT INTO products (
            product_id, name, clean_name, image_url, category_id, group_id, url, modified_on, image_count,
            ext_number, ext_rarity, ext_card_type, ext_hp, ext_stage, ext_card_text,
            ext_attack1, ext_attack2, ext_weakness, ext_resistance, ext_retreat_cost,
            low_price, mid_price, high_price, market_price, direct_low_price, sub_type_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values
        );
        imported++;
      }
      
      // Insert or update price history if pricing data exists
      if (product.marketPrice && parsePrice(product.marketPrice)) {
        const today = new Date().toISOString().split('T')[0];
        const subTypeName = product.subTypeName || null;
        try {
          // Check if price history entry already exists for today (with sub_type_name)
          const existingPrice = await get(
            'SELECT id FROM price_history WHERE product_id = ? AND date = ? AND (sub_type_name = ? OR (sub_type_name IS NULL AND ? IS NULL))',
            [parseInt(product.productId), today, subTypeName, subTypeName]
          );
          
          if (existingPrice) {
            // Update existing price history
            await run(
              `UPDATE price_history SET
                low_price = ?, mid_price = ?, high_price = ?, market_price = ?,
                direct_low_price = ?
               WHERE product_id = ? AND date = ? AND (sub_type_name = ? OR (sub_type_name IS NULL AND ? IS NULL))`,
              [
                parsePrice(product.lowPrice),
                parsePrice(product.midPrice),
                parsePrice(product.highPrice),
                parsePrice(product.marketPrice),
                parsePrice(product.directLowPrice),
                parseInt(product.productId),
                today,
                subTypeName,
                subTypeName
              ]
            );
          } else {
            // Insert new price history entry
            await run(
              `INSERT INTO price_history (product_id, sub_type_name, date, low_price, mid_price, high_price, market_price, direct_low_price, source)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                parseInt(product.productId),
                subTypeName,
                today,
                parsePrice(product.lowPrice),
                parsePrice(product.midPrice),
                parsePrice(product.highPrice),
                parsePrice(product.marketPrice),
                parsePrice(product.directLowPrice),
                'TCGCSV'
              ]
            );
          }
        } catch (priceError) {
          // Silently continue if price history insert fails
          console.warn(`⚠️  Could not insert price history for product ${product.productId}:`, priceError.message);
        }
      }
      
      if ((imported + updated) % 50 === 0) {
        console.log(`  Progress: ${imported + updated}/${products.length}...`);
      }
      
    } catch (error) {
      console.error(`❌ Error importing product ${product.productId}:`, error.message);
      errors.push({ productId: product.productId, error: error.message });
      skipped++;
    }
  }
  
  console.log(`\n📊 Import Summary:`);
  console.log(`  ✅ New products: ${imported}`);
  console.log(`  🔄 Updated products: ${updated}`);
  console.log(`  ⚠️  Skipped/Errors: ${skipped}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered (showing first 5):`);
    errors.slice(0, 5).forEach((err, idx) => {
      console.log(`  ${idx + 1}. Product ${err.productId}: ${err.error}`);
    });
  }
}

async function showSummary() {
  console.log('\n📊 Final Summary:');
  
  const groupStats = await get(
    'SELECT COUNT(*) as count FROM products WHERE group_id = ?',
    [GROUP_INFO.group_id]
  );
  
  const priceStats = await get(
    'SELECT COUNT(*) as count FROM price_history WHERE product_id IN (SELECT product_id FROM products WHERE group_id = ?)',
    [GROUP_INFO.group_id]
  );
  
  console.log(`  Products in ${GROUP_INFO.name}: ${groupStats.count}`);
  console.log(`  Price history entries: ${priceStats.count}`);
}

async function main() {
  console.log('🚀 Starting Phantasmal Flames Import...\n');
  
  try {
    // Step 1: Ensure group exists
    await ensureGroupExists();
    
    // Step 2: Parse CSV file
    const products = await parseCSVFile();
    
    // Step 3: Import products
    await importProducts(products);
    
    // Step 4: Show summary
    await showSummary();
    
    console.log('\n✅ Import completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}


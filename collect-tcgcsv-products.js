#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import fetch from 'node-fetch';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

class TCGCSVProductCollector {
  constructor() {
    this.collectedProducts = 0;
    this.collectedPrices = 0;
    this.errorCount = 0;
    this.sets = [];
  }

  async loadTCGCSVSets() {
    try {
      console.log('📚 Loading TCGCSV sets from CSV files...');
      
      // Load English sets
      const englishCsvPath = 'public/Pokemon database files/tcgcsv-set-products-prices.csv';
      if (fs.existsSync(englishCsvPath)) {
        const csvContent = fs.readFileSync(englishCsvPath, 'utf8');
        const lines = csvContent.split('\n');
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const [groupId, groupName, productsUrl, pricesUrl] = lines[i].split(',');
            if (groupId && groupName && productsUrl && pricesUrl) {
              this.sets.push({
                groupId: parseInt(groupId),
                groupName: groupName.trim(),
                productsUrl: productsUrl.trim(),
                pricesUrl: pricesUrl.trim(),
                language: 'en'
              });
            }
          }
        }
        console.log(`✅ Loaded ${this.sets.length} English sets`);
      }
      
      // Load Japanese sets
      const japaneseCsvPath = 'public/Pokemon database files/tcgcsv-set-products-prices/Japanese-Table 1.csv';
      if (fs.existsSync(japaneseCsvPath)) {
        const csvContent = fs.readFileSync(japaneseCsvPath, 'utf8');
        const lines = csvContent.split('\n');
        
        // Skip header row
        let japaneseCount = 0;
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const [groupId, groupName, productsUrl, pricesUrl] = lines[i].split(',');
            if (groupId && groupName && productsUrl && pricesUrl) {
              this.sets.push({
                groupId: parseInt(groupId),
                groupName: groupName.trim(),
                productsUrl: productsUrl.trim(),
                pricesUrl: pricesUrl.trim(),
                language: 'ja'
              });
              japaneseCount++;
            }
          }
        }
        console.log(`✅ Loaded ${japaneseCount} Japanese sets`);
      }

      console.log(`✅ Total: ${this.sets.length} TCGCSV sets loaded\n`);
      return true;
    } catch (error) {
      console.error('❌ Error loading TCGCSV sets:', error.message);
      return false;
    }
  }

  async makeRequest(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.text();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        console.log(`   ⚠️  Attempt ${attempt} failed, retrying... (${error.message})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async collectProductsForSet(set) {
    try {
      console.log(`📦 Collecting products for ${set.groupName} (ID: ${set.groupId})`);
      
      // Fetch products data
      const productsData = await this.makeRequest(set.productsUrl);
      const productsJson = JSON.parse(productsData);
      
      if (!productsJson.success || !productsJson.results || productsJson.results.length === 0) {
        console.log(`   ⚠️  No products found for ${set.groupName}`);
        return { products: 0, prices: 0 };
      }

      let productsAdded = 0;
      let pricesAdded = 0;

      // Process each product
      for (const product of productsJson.results) {
        try {
          // Extract fields from extendedData array if available
          let extNumber = product.extNumber || null;
          let extHP = product.extHP || product.extHp || null;
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
          
          // Insert or update product (with language support)
          await run(`
            INSERT OR REPLACE INTO products (
              product_id, name, clean_name, image_url, category_id, group_id,
              url, modified_on, image_count, ext_number, ext_rarity, 
              ext_card_type, ext_hp, ext_stage, ext_card_text, ext_attack1, ext_attack2,
              ext_weakness, ext_resistance, ext_retreat_cost, sub_type_name,
              artist, ext_regulation, legalities,
              market_price, low_price, mid_price, high_price,
              language, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            product.productId,
            product.name,
            product.cleanName || product.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
            product.imageUrl || '',
            product.categoryId || 3,
            set.groupId,
            product.url || '',
            product.modifiedOn || null,
            product.imageCount || 1,
            extNumber || '',
            extRarity || '',
            extCardType || '',
            extHP || null,
            extStage || '',
            cardText || '',
            extAttack1 || '',
            extAttack2 || '',
            extWeakness || '',
            extResistance || '',
            extRetreatCost || null,
            product.subTypeName || null,
            artist || '',
            regulation || null,
            legalities || null,
            product.marketPrice || 0,
            product.lowPrice || 0,
            product.midPrice || 0,
            product.highPrice || 0,
            set.language || 'en', // Use language from set
            new Date().toISOString(),
            new Date().toISOString()
          ]);

          productsAdded++;

          // If we have pricing data in the product, add it to price_history
          if (product.marketPrice && product.marketPrice > 0) {
            const source = set.language === 'ja' ? 'TCGCSV-JA' : 'TCGCSV';
            await run(`
              INSERT OR REPLACE INTO price_history (
                product_id, sub_type_name, date, low_price, mid_price, high_price,
                market_price, direct_low_price, source
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              product.productId,
              product.subTypeName || null,
              new Date().toISOString().split('T')[0],
              product.lowPrice || null,
              product.midPrice || null,
              product.highPrice || null,
              product.marketPrice || null,
              product.directLowPrice || null,
              source
            ]);
            pricesAdded++;
          }

        } catch (error) {
          console.error(`   ❌ Error processing product ${product.productId}: ${error.message}`);
          this.errorCount++;
        }
      }

      console.log(`   ✅ Added ${productsAdded} products, ${pricesAdded} price records`);
      return { products: productsAdded, prices: pricesAdded };

    } catch (error) {
      console.error(`❌ Error collecting products for ${set.groupName}: ${error.message}`);
      return { products: 0, prices: 0 };
    }
  }

  async collectPricesForSet(set) {
    try {
      console.log(`💰 Collecting prices for ${set.groupName} (ID: ${set.groupId})`);
      
      // Fetch prices data
      const pricesData = await this.makeRequest(set.pricesUrl);
      const pricesJson = JSON.parse(pricesData);
      
      if (!pricesJson.success || !pricesJson.results || pricesJson.results.length === 0) {
        console.log(`   ⚠️  No prices found for ${set.groupName}`);
        return 0;
      }

      let pricesAdded = 0;
      const today = new Date().toISOString().split('T')[0];

      // Process each price record
      for (const priceRecord of pricesJson.results) {
        try {
          // Insert price history (with source indicating language)
          const source = set.language === 'ja' ? 'TCGCSV-JA' : 'TCGCSV';
          await run(`
            INSERT OR REPLACE INTO price_history (
              product_id, sub_type_name, date, low_price, mid_price, high_price,
              market_price, direct_low_price, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            priceRecord.productId,
            priceRecord.subTypeName || null,
            today,
            priceRecord.lowPrice || null,
            priceRecord.midPrice || null,
            priceRecord.highPrice || null,
            priceRecord.marketPrice || null,
            priceRecord.directLowPrice || null,
            source
          ]);

          // Update current prices in products table
          await run(`
            UPDATE products SET 
              market_price = ?, 
              low_price = ?, 
              mid_price = ?, 
              high_price = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ?
          `, [
            priceRecord.marketPrice || 0,
            priceRecord.lowPrice || 0,
            priceRecord.midPrice || 0,
            priceRecord.highPrice || 0,
            priceRecord.productId
          ]);

          pricesAdded++;

        } catch (error) {
          console.error(`   ❌ Error processing price for product ${priceRecord.productId}: ${error.message}`);
          this.errorCount++;
        }
      }

      console.log(`   ✅ Added ${pricesAdded} price records`);
      return pricesAdded;

    } catch (error) {
      console.error(`❌ Error collecting prices for ${set.groupName}: ${error.message}`);
      return 0;
    }
  }

  async collectAllData() {
    try {
      console.log('🔄 Starting TCGCSV data collection...\n');

      // Ensure groups table is populated (with language support)
      for (const set of this.sets) {
        await run(`
          INSERT OR REPLACE INTO groups (group_id, name, category_id, url, language, published_on, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          set.groupId,
          set.groupName,
          3,
          set.productsUrl || null,
          set.language || 'en',
          null,
          new Date().toISOString()
        ]);
      }

      // Process each set
      for (const [index, set] of this.sets.entries()) {
        console.log(`\n📊 Processing set ${index + 1}/${this.sets.length}: ${set.groupName}`);
        
        // Collect products
        const productsResult = await this.collectProductsForSet(set);
        this.collectedProducts += productsResult.products;
        this.collectedPrices += productsResult.prices;

        // Collect additional prices (if products didn't have pricing)
        if (productsResult.prices === 0) {
          const pricesResult = await this.collectPricesForSet(set);
          this.collectedPrices += pricesResult;
        }

        // Progress update
        if ((index + 1) % 10 === 0) {
          console.log(`\n📈 Progress: ${index + 1}/${this.sets.length} sets processed`);
          console.log(`   📦 Products collected: ${this.collectedProducts}`);
          console.log(`   💰 Price records: ${this.collectedPrices}`);
          console.log(`   ❌ Errors: ${this.errorCount}`);
        }

        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('\n🎉 TCGCSV data collection complete!\n');
      console.log('📊 Final Statistics:');
      console.log(`   • Sets processed: ${this.sets.length}`);
      console.log(`   • Products collected: ${this.collectedProducts}`);
      console.log(`   • Price records: ${this.collectedPrices}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${((this.collectedProducts / (this.collectedProducts + this.errorCount)) * 100).toFixed(1)}%`);

      // Show breakdown by product type
      const breakdown = await all(`
        SELECT 
          CASE 
            WHEN ext_card_type LIKE '%Sealed%' OR ext_card_type LIKE '%Booster%' OR ext_card_type LIKE '%Box%' THEN 'Sealed Products'
            WHEN ext_card_type LIKE '%Pokemon%' OR ext_card_type LIKE '%Trainer%' OR ext_card_type LIKE '%Energy%' THEN 'Cards'
            ELSE 'Other'
          END as product_type,
          COUNT(*) as count
        FROM products 
        GROUP BY product_type
        ORDER BY count DESC
      `);
      
      console.log('\n📊 Product Type Breakdown:');
      for (const item of breakdown) {
        console.log(`   ${item.product_type}: ${item.count} products`);
      }

      // Show image coverage
      const imageStats = await all(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as with_images,
          COUNT(CASE WHEN image_url IS NULL OR image_url = '' THEN 1 END) as without_images
        FROM products
      `);

      console.log('\n📊 Image Coverage:');
      console.log(`   • Total products: ${imageStats[0].total_products}`);
      console.log(`   • With images: ${imageStats[0].with_images}`);
      console.log(`   • Without images: ${imageStats[0].without_images}`);
      console.log(`   • Image coverage: ${((imageStats[0].with_images / imageStats[0].total_products) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ TCGCSV data collection failed:', error.message);
    } finally {
      db.close();
    }
  }

  async run() {
    const loaded = await this.loadTCGCSVSets();
    if (loaded) {
      await this.collectAllData();
    }
  }
}

// Run the collector
const collector = new TCGCSVProductCollector();
collector.run();

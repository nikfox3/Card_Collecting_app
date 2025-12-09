import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56';
const DB_PATH = path.join(__dirname, 'cards.db');

async function collectIndividualCardPricing() {
  console.log('🚀 Starting individual card pricing collection...');
  
  const db = new sqlite3.Database(DB_PATH);
  const today = new Date().toISOString().split('T')[0];
  
  // Get cards that don't have Pokemon Price Tracker data yet
  const cards = await getCardsToCollect(db, 1000); // Start with 1000 cards
  
  console.log(`📊 Found ${cards.length} cards to collect pricing for`);
  
  let totalRecords = 0;
  let apiErrors = 0;
  let successCount = 0;
  let skippedCount = 0;
  
  try {
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      console.log(`\n[${i + 1}/${cards.length}] Processing: ${card.name} (${card.product_id})`);
      
      try {
        const result = await collectCardPricing(card.product_id, today, db);
        
        if (result.skipped) {
          skippedCount++;
          console.log(`  ⏭️  Skipped - no API data`);
        } else {
          successCount++;
          totalRecords += result.collectedCount;
          console.log(`  ✅ Collected ${result.collectedCount} records`);
        }
        
        // Adaptive delay based on success/error rate
        let delay = 200; // Base delay
        if (result.skipped) {
          delay = 100; // Shorter delay for skipped cards
        } else if (apiErrors > 10) {
          delay = 500; // Longer delay if many errors
        } else if (apiErrors > 20) {
          delay = 1000; // Even longer delay if many errors
        }
        
        console.log(`  ⏳ Waiting ${delay}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Progress update every 50 cards
        if ((i + 1) % 50 === 0) {
          console.log(`\n📈 Progress Update:`);
          console.log(`  ✅ Cards processed: ${successCount}/${i + 1}`);
          console.log(`  ⏭️  Cards skipped: ${skippedCount}`);
          console.log(`  ❌ API errors: ${apiErrors}`);
          console.log(`  📊 Total records: ${totalRecords}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing ${card.name}:`, error.message);
        apiErrors++;
        
        // Longer delay on error
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n🎉 Collection Complete!`);
    console.log(`📈 Final Summary:`);
    console.log(`✅ Cards processed: ${successCount}/${cards.length}`);
    console.log(`⏭️  Cards skipped: ${skippedCount}`);
    console.log(`❌ API errors: ${apiErrors}`);
    console.log(`📊 Total records collected: ${totalRecords}`);
    console.log(`💰 Estimated credits used: ~${successCount} (1 credit per successful card)`);
    
  } catch (error) {
    console.error('❌ Collection failed:', error);
  } finally {
    db.close();
  }
}

async function getCardsToCollect(db, limit = 1000) {
  return new Promise((resolve, reject) => {
    const today = new Date().toISOString().split('T')[0];
    
    db.all(`
      SELECT DISTINCT
        p.product_id,
        p.name,
        p.ext_rarity,
        p.market_price,
        g.name as set_name
      FROM products p
      JOIN groups g ON p.group_id = g.group_id
      WHERE p.product_id IS NOT NULL
        AND p.ext_rarity IS NOT NULL
        AND p.ext_rarity != ''
        AND p.market_price > 10  -- Focus on cards worth more than $10
        AND p.name NOT LIKE '%Box%'  -- Exclude booster boxes
        AND p.name NOT LIKE '%Pack%'  -- Exclude booster packs
        AND p.name NOT LIKE '%Bundle%'  -- Exclude bundles
        AND p.name NOT LIKE '%Collection%'  -- Exclude collections
        AND p.name NOT LIKE '%Tin%'  -- Exclude tins
        AND p.name NOT LIKE '%Case%'  -- Exclude cases
        AND p.name NOT LIKE '%Display%'  -- Exclude display cases
        AND p.name NOT LIKE '%Elite Trainer%'  -- Exclude ETBs
        AND p.name NOT LIKE '%Premium%'  -- Exclude premium products
        AND p.product_id NOT IN (
          SELECT DISTINCT product_id
          FROM price_history
          WHERE source LIKE 'pokemonpricetracker-%'
            AND date = ?
        )
        AND (
          p.ext_rarity LIKE '%Holo%' OR
          p.ext_rarity LIKE '%Rare%' OR
          p.ext_rarity LIKE '%Secret%' OR
          p.ext_rarity LIKE '%Ultra%' OR
          p.ext_rarity LIKE '%Promo%' OR
          p.ext_rarity LIKE '%Star%' OR
          p.ext_rarity LIKE '%Gold%' OR
          p.ext_rarity LIKE '%Rainbow%'
        )
      ORDER BY p.market_price DESC
      LIMIT ?
    `, [today, limit], (err, rows) => {
      if (err) {
        console.error('Error getting cards:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

async function collectCardPricing(productId, today, db) {
  try {
    console.log(`  🔍 Fetching data for product ${productId}...`);
    
    const response = await fetch(`${API_BASE_URL}/cards?tcgPlayerId=${productId}&includeBoth=true`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ⚠️  No data found for product ${productId}`);
        return { productId, collectedCount: 0, skipped: true };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const cardData = await response.json();
    
    if (!cardData || !cardData.data || cardData.data.length === 0) {
      console.log(`  ⚠️  No data found for product ${productId}`);
      return { productId, collectedCount: 0, skipped: true };
    }
    
    const card = cardData.data;
    
    if (!card.prices) {
      console.log(`  ⚠️  No pricing data available`);
      return { productId, collectedCount: 0, cardName: card.name, skipped: true };
    }
    
    let collectedCount = 0;
    
    // 1. Store basic market price
    if (card.prices.market) {
      await db.run(`
        INSERT OR REPLACE INTO price_history (
          product_id, date, price, volume, condition, grade, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        productId,
        today,
        card.prices.market,
        card.prices.listings || 0,
        'Market',
        null,
        'pokemonpricetracker-market'
      ]);
      collectedCount++;
    }
    
    // 2. Store condition-specific pricing
    if (card.prices.conditions) {
      for (const [condition, pricing] of Object.entries(card.prices.conditions)) {
        if (pricing && pricing.price) {
          await db.run(`
            INSERT OR REPLACE INTO price_history (
              product_id, date, price, volume, condition, grade, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            today,
            pricing.price,
            pricing.listings || 0,
            condition,
            null,
            `pokemonpricetracker-${condition.toLowerCase().replace(/\s+/g, '-')}`
          ]);
          collectedCount++;
        }
      }
    }
    
    // 3. Store variant-specific pricing
    if (card.prices.variants) {
      for (const [variantName, variantConditions] of Object.entries(card.prices.variants)) {
        for (const [condition, pricing] of Object.entries(variantConditions)) {
          if (pricing && pricing.price) {
            await db.run(`
              INSERT OR REPLACE INTO price_history (
                product_id, date, price, volume, condition, grade, source
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              productId,
              today,
              pricing.price,
              pricing.listings || 0,
              condition,
              null,
              `pokemonpricetracker-${variantName.toLowerCase().replace(/\s+/g, '-')}-${condition.toLowerCase().replace(/\s+/g, '-')}`
            ]);
            collectedCount++;
          }
        }
      }
    }
    
    // 4. Store PSA grading data if available
    if (card.ebay && card.ebay.salesByGrade) {
      for (const [grade, gradeData] of Object.entries(card.ebay.salesByGrade)) {
        if (gradeData && gradeData.marketPrice7Day) {
          await db.run(`
            INSERT OR REPLACE INTO price_history (
              product_id, date, price, volume, condition, grade, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            today,
            gradeData.marketPrice7Day,
            gradeData.count || 0,
            'Graded',
            grade.replace('psa', 'PSA '),
            `pokemonpricetracker-${grade}-graded`
          ]);
          collectedCount++;
        }
      }
    }
    
    return { productId, collectedCount, cardName: card.name };
    
  } catch (error) {
    console.error(`  ❌ Error collecting pricing for ${productId}:`, error.message);
    throw error;
  }
}

// Run the collection
collectIndividualCardPricing().catch(console.error);

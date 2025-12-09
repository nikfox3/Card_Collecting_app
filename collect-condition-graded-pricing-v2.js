import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.POKEMON_PRICE_TRACKER_API_KEY || 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56';
const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';

// Database path
const DB_PATH = path.join(__dirname, 'cards.db');

/**
 * Make API request to Pokemon Price Tracker v2 API
 */
async function makeAPIRequest(endpoint, params = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url.toString(), { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${error.message}`);
    return null;
  }
}

/**
 * Collect comprehensive pricing for a card
 */
async function collectCardPricing(db, productId) {
  try {
    console.log(`\n📊 Collecting pricing for card ${productId}...`);
    
    const today = new Date().toISOString().split('T')[0];
    let collectedCount = 0;
    
    // Get comprehensive pricing with conditions, PSA grades, and eBay data
    const cardData = await makeAPIRequest('/cards', {
      tcgPlayerId: productId,
      includeBoth: 'true',
      includeHistory: 'false',
      includeEbay: 'true'
    });
    
    if (!cardData || !cardData.data || cardData.data.length === 0) {
      console.log(`  ⚠️  No data found for product ${productId}`);
      return { productId, collectedCount: 0, skipped: true };
    }
    
    const card = cardData.data;
    console.log(`  ✅ Found: ${card.name || 'Unknown'}`);
    
    // Check if prices exist
    if (!card.prices) {
      console.log(`  ⚠️  No pricing data available`);
      return { productId, collectedCount: 0, cardName: card.name, skipped: true };
    }
    
    // 1. Store Near Mint (raw) pricing from main price
    if (card.prices.market) {
      await db.run(`
        INSERT OR REPLACE INTO price_history (
          product_id, date, price, volume, condition, source
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        productId,
        today,
        card.prices.market,
        0,
        'Near Mint',
        'pokemonpricetracker-raw'
      ]);
      collectedCount++;
      console.log(`    ✅ Near Mint: $${card.prices.market.toFixed(2)}`);
    }
    
    // 2. Store condition-based pricing
    if (card.prices.conditions) {
      for (const [condition, pricing] of Object.entries(card.prices.conditions)) {
        if (pricing && pricing.price) {
          await db.run(`
            INSERT OR REPLACE INTO price_history (
              product_id, date, price, volume, condition, source
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            productId,
            today,
            pricing.price,
            pricing.listings || 0,
            condition,
            `pokemonpricetracker-${condition.toLowerCase().replace(/\s+/g, '-')}`
          ]);
          collectedCount++;
          console.log(`    ✅ ${condition}: $${pricing.price.toFixed(2)} (${pricing.listings || 0} listings)`);
        }
      }
    }
    
    // 3. Store variant-specific pricing
    if (card.prices.variants) {
      for (const [variantName, variantConditions] of Object.entries(card.prices.variants)) {
        console.log(`    📦 Processing ${variantName} variant...`);
        
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
              null, // No grade for raw cards
              `pokemonpricetracker-${variantName.toLowerCase().replace(/\s+/g, '-')}-${condition.toLowerCase().replace(/\s+/g, '-')}`
            ]);
            collectedCount++;
            console.log(`      ✅ ${variantName} ${condition}: $${pricing.price.toFixed(2)} (${pricing.listings || 0} listings)`);
          }
        }
      }
    }

    // 4. Store PSA graded prices (from eBay sales data)
    if (card.ebay && card.ebay.salesByGrade) {
      for (const [gradeKey, gradeData] of Object.entries(card.ebay.salesByGrade)) {
        // Extract grade number from key (e.g., "psa10" -> "10")
        const grade = gradeKey.replace('psa', '').replace('PSA', '');
        
        // Use market price (7-day average) or average price
        const gradePrice = gradeData.marketPrice7Day || gradeData.averagePrice || gradeData.medianPrice || 0;
        const population = gradeData.count || 0;
        
        if (gradePrice > 0) {
          await db.run(`
            INSERT OR REPLACE INTO price_history (
              product_id, date, price, volume, grade, condition, population, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            today,
            gradePrice,
            0,
            grade,
            'Graded',
            population,
            `pokemonpricetracker-psa-${grade}`
          ]);
          collectedCount++;
          console.log(`    ✅ PSA ${grade}: $${gradePrice.toFixed(2)} (pop: ${population}, trend: ${gradeData.marketTrend || 'N/A'})`);
        }
      }
    }
    
    return { productId, collectedCount, cardName: card.name };
  } catch (error) {
    console.error(`Error collecting pricing for ${productId}:`, error);
    return { productId, collectedCount: 0 };
  }
}

/**
 * Get cards to collect pricing for
 */
async function getCardsToCollect(db, limit = 50) {
  try {
    const cards = await db.all(`
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
            AND date = (SELECT MAX(date) FROM price_history WHERE source LIKE 'pokemonpricetracker-%')
        )
        AND (
          p.ext_rarity LIKE '%Holo%' OR 
          p.ext_rarity LIKE '%Rare%' OR 
          p.ext_rarity LIKE '%Secret%' OR
          p.ext_rarity LIKE '%Ultra%' OR
          p.ext_rarity LIKE '%Promo%'
        )
      ORDER BY p.market_price DESC
      LIMIT ?
    `, [limit]);

    return cards;
  } catch (error) {
    console.error('Error getting cards:', error);
    console.error('SQL:', error.sql);
    return [];
  }
}

/**
 * Main collection function
 */
async function collectConditionAndGradedPricing() {
  console.log('🚀 Starting Condition & Graded Pricing Collection (v2 API)...\n');
  console.log(`Date: ${new Date().toISOString().split('T')[0]}\n`);

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  try {
    // Get cards to collect
    console.log('📊 Getting cards to collect...');
    const cards = await getCardsToCollect(db, 1000); // Collect 1000 individual cards
    console.log(`Found ${cards.length} cards to update\n`);

    let successCount = 0;
    let totalRecords = 0;
    let apiErrors = 0;
    let skippedCount = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      console.log(`\n[${i + 1}/${cards.length}] ${card.name}`);
      
      const result = await collectCardPricing(db, card.product_id);
      
      if (result && result.collectedCount > 0) {
        successCount++;
        totalRecords += result.collectedCount;
      } else if (result && result.skipped) {
        skippedCount++;
      } else {
        apiErrors++;
      }
      
      // Adaptive rate limiting based on results
      let delay = 500; // Reduced base delay
      if (result && result.skipped) {
        delay = 200; // Even shorter delay for skipped cards
      } else if (apiErrors > 10) {
        delay = 1000; // Increase to 1 second if many errors
      } else if (apiErrors > 20) {
        delay = 2000; // Increase to 2 seconds if many errors
      }
      
      // Rate limit: adaptive delay between requests
      if (i < cards.length - 1) {
        console.log(`  ⏳ Waiting ${delay}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`✅ Cards processed: ${successCount}/${cards.length}`);
    console.log(`⏭️  Cards skipped (no API data): ${skippedCount}`);
    console.log(`❌ API errors: ${apiErrors}`);
    console.log(`📈 Total records collected: ${totalRecords}`);
    
    // Database stats
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT product_id) as unique_cards,
        COUNT(DISTINCT date) as unique_dates,
        COUNT(DISTINCT grade) as unique_grades,
        COUNT(DISTINCT condition) as unique_conditions,
        MAX(date) as latest_date
      FROM price_history
      WHERE source LIKE 'pokemonpricetracker-%'
    `);

    console.log(`\n📊 Database Stats:`);
    console.log(`   Total records: ${stats.total_records}`);
    console.log(`   Unique cards: ${stats.unique_cards}`);
    console.log(`   Unique dates: ${stats.unique_dates}`);
    console.log(`   Unique grades: ${stats.unique_grades}`);
    console.log(`   Unique conditions: ${stats.unique_conditions}`);
    console.log(`   Latest date: ${stats.latest_date}`);

  } finally {
    await db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collectConditionAndGradedPricing()
    .then(() => {
      console.log('\n✅ Pricing collection complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Collection failed:', error);
      process.exit(1);
    });
}

export { collectConditionAndGradedPricing };


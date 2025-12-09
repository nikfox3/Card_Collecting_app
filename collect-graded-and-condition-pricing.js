import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.POKEMON_PRICE_TRACKER_API_KEY || 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56';
const API_BASE_URL = 'https://pokemonpricetracker.com/api';

// Database path
const DB_PATH = path.join(__dirname, 'cards.db');

// Conditions to collect
const CONDITIONS = ['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played'];

// PSA Grades to collect
const PSA_GRADES = ['10', '9', '8', '7', '6', '5'];

/**
 * Make API request to Pokemon Price Tracker
 */
async function makeAPIRequest(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${error.message}`);
    return null;
  }
}

/**
 * Collect pricing for a card including RAW, PSA grades, and conditions
 */
async function collectCardPricing(db, productId) {
  try {
    console.log(`\n📊 Collecting pricing for card ${productId}...`);
    
    const today = new Date().toISOString().split('T')[0];
    let collectedCount = 0;
    
    // 1. Collect RAW price (Near Mint)
    console.log('  • RAW (Near Mint)...');
    const rawPrice = await makeAPIRequest(`/prices/raw/${productId}`);
    
    if (rawPrice && rawPrice.mid) {
      await db.run(`
        INSERT OR REPLACE INTO price_history (
          product_id, date, price, volume, condition, source
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        productId,
        today,
        rawPrice.mid || rawPrice.low || 0,
        0,
        'Near Mint',
        'pokemonpricetracker-raw'
      ]);
      collectedCount++;
      console.log('    ✅ RAW price collected');
    }
    
    // 2. Collect PSA graded prices
    console.log('  • PSA Graded prices...');
    const psaPrices = await makeAPIRequest(`/prices/psa/${productId}`);
    
    if (psaPrices && typeof psaPrices === 'object') {
      for (const grade in psaPrices) {
        const gradeData = psaPrices[grade];
        if (gradeData && gradeData.mid) {
          await db.run(`
            INSERT OR REPLACE INTO price_history (
              product_id, date, price, volume, grade, condition, population, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            today,
            gradeData.mid || gradeData.low || 0,
            0,
            grade,
            'Graded',
            gradeData.population || 0,
            `pokemonpricetracker-psa-${grade}`
          ]);
          collectedCount++;
          console.log(`    ✅ PSA ${grade} collected (population: ${gradeData.population || 'N/A'})`);
        }
      }
    }
    
    // Note: The API may not support multiple conditions yet
    // This is a placeholder for when the API adds condition support
    // For now, we're collecting RAW (Near Mint) and PSA graded prices
    
    return { productId, collectedCount };
  } catch (error) {
    console.error(`Error collecting pricing for ${productId}:`, error);
    return null;
  }
}

/**
 * Get top cards that need pricing updates
 */
async function getTopCards(db, limit = 50) {
  try {
    // Get individual cards only (not products/cases/boxes)
    const cards = await db.all(`
      SELECT DISTINCT 
        p.product_id,
        p.name,
        p.ext_rarity
      FROM products p
      WHERE p.product_id IS NOT NULL
        AND p.ext_rarity IS NOT NULL
        AND p.ext_rarity != ''
      ORDER BY p.market_price DESC
      LIMIT ?
    `, [limit]);

    return cards;
  } catch (error) {
    console.error('Error getting top cards:', error);
    return [];
  }
}

/**
 * Main collection function
 */
async function collectGradedAndConditionPricing() {
  console.log('🚀 Starting Graded & Condition Pricing Collection...\n');
  console.log(`Date: ${new Date().toISOString().split('T')[0]}\n`);

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  try {
    // Get top cards
    console.log('📊 Getting top cards...');
    const cards = await getTopCards(db, 50);
    console.log(`Found ${cards.length} cards to update\n`);

    let successCount = 0;
    let totalRecords = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      console.log(`\n[${i + 1}/${cards.length}] ${card.name}`);
      
      const result = await collectCardPricing(db, card.product_id);
      
      if (result) {
        successCount++;
        totalRecords += result.collectedCount;
      }
      
      // Rate limit: 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`✅ Cards processed: ${successCount}/${cards.length}`);
    console.log(`📈 Total records collected: ${totalRecords}`);
    
    // Database stats
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT product_id) as unique_cards,
        COUNT(DISTINCT date) as unique_dates,
        COUNT(DISTINCT grade) as unique_grades,
        MAX(date) as latest_date
      FROM price_history
      WHERE source LIKE 'pokemonpricetracker-%'
    `);

    console.log(`\n📊 Database Stats:`);
    console.log(`   Total records: ${stats.total_records}`);
    console.log(`   Unique cards: ${stats.unique_cards}`);
    console.log(`   Unique dates: ${stats.unique_dates}`);
    console.log(`   Unique grades: ${stats.unique_grades}`);
    console.log(`   Latest date: ${stats.latest_date}`);

  } finally {
    await db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collectGradedAndConditionPricing()
    .then(() => {
      console.log('\n✅ Pricing collection complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Collection failed:', error);
      process.exit(1);
    });
}

export { collectGradedAndConditionPricing };


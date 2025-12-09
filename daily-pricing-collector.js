import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.POKEMON_PRICE_TRACKER_API_KEY || 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56';
const API_BASE_URL = 'https://pokemonpricetracker.com/api';

// Database path - use same as API server (../cards.db)
const DB_PATH = path.join(__dirname, '../cards.db');

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
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Collect pricing data for a single card
 */
async function collectCardPricing(db, productId) {
  try {
    console.log(`Collecting pricing for card ${productId}...`);
    
    // Get comprehensive pricing (RAW + all PSA grades)
    const [rawPrice, psaPrices] = await Promise.all([
      makeAPIRequest(`/prices/raw/${productId}`).catch(err => {
        console.error(`Raw pricing failed for ${productId}:`, err.message);
        return null;
      }),
      makeAPIRequest(`/prices/psa/${productId}`).catch(err => {
        console.error(`PSA pricing failed for ${productId}:`, err.message);
        return null;
      })
    ]);

    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    // Store RAW price
    if (rawPrice) {
      await db.run(`
        INSERT OR REPLACE INTO price_history (
          product_id, date, price, volume, source, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        productId,
        today,
        rawPrice.mid || rawPrice.price || 0,
        0,
        'pokemonpricetracker-raw',
        timestamp
      ]);
    }

    // Store PSA prices for all grades
    if (psaPrices && typeof psaPrices === 'object') {
      for (const grade in psaPrices) {
        const gradeData = psaPrices[grade];
        if (gradeData && typeof gradeData === 'object') {
          await db.run(`
            INSERT OR REPLACE INTO price_history (
              product_id, date, price, volume, grade, source, population, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            today,
            gradeData.mid || gradeData.price || 0,
            0,
            grade,
            `pokemonpricetracker-psa-${grade}`,
            gradeData.population || 0,
            timestamp
          ]);
        }
      }
    }

    return { productId, raw: rawPrice, psa: psaPrices };
  } catch (error) {
    console.error(`Error collecting pricing for ${productId}:`, error);
    return null;
  }
}

/**
 * Get top cards that need pricing updates
 */
async function getTopCards(db, limit = 100) {
  try {
    const cards = await db.all(`
      SELECT DISTINCT 
        p.product_id,
        p.name,
        p.set_name
      FROM products p
      WHERE p.product_id IS NOT NULL
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
async function collectDailyPricing() {
  console.log('🚀 Starting daily pricing collection...\n');
  console.log(`Date: ${new Date().toISOString().split('T')[0]}\n`);

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  try {
    // Get top cards to collect pricing for
    console.log('📊 Getting top cards...');
    const cards = await getTopCards(db, 100);
    console.log(`Found ${cards.length} cards to update\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      console.log(`\n[${i + 1}/${cards.length}] Processing: ${card.name} (${card.product_id})`);
      
      const result = await collectCardPricing(db, card.product_id);
      
      if (result) {
        successCount++;
        console.log('✅ Collected pricing');
      } else {
        errorCount++;
        console.log('❌ Failed to collect pricing');
      }

      // Rate limit: sleep 1 second between requests (20k credits/day = ~288 requests/hour max)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`✅ Successfully collected: ${successCount} cards`);
    console.log(`❌ Failed: ${errorCount} cards`);
    console.log(`📈 Total processed: ${cards.length} cards`);

    // Get database stats
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT date) as unique_dates,
        MAX(date) as latest_date
      FROM price_history
      WHERE source LIKE 'pokemonpricetracker-%'
    `);

    console.log(`\n📊 Database stats for Pokemon Price Tracker:`);
    console.log(`   Total records: ${stats.total_records}`);
    console.log(`   Unique dates: ${stats.unique_dates}`);
    console.log(`   Latest date: ${stats.latest_date}`);

  } catch (error) {
    console.error('❌ Collection error:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collectDailyPricing()
    .then(() => {
      console.log('\n✅ Daily pricing collection complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Collection failed:', error);
      process.exit(1);
    });
}

export { collectDailyPricing };




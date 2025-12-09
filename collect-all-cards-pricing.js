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
async function collectCardPricing(db, productId, isDryRun = false) {
  try {
    const today = new Date().toISOString().split('T')[0];
    let collectedCount = 0;
    
    // Get comprehensive pricing with conditions, PSA grades, and eBay data
    const cardData = await makeAPIRequest('/cards', {
      tcgPlayerId: productId,
      includeBoth: 'true',
      includeHistory: 'false',
      includeEbay: 'true'
    });
    
    if (!cardData || !cardData.data) {
      return { productId, collectedCount: 0, error: 'No data' };
    }

    const card = cardData.data;
    
    if (isDryRun) {
      // Just count what would be collected
      let count = 0;
      
      // Count conditions
      if (card.prices && card.prices.conditions) {
        count += Object.keys(card.prices.conditions).length;
      }
      
      // Count PSA grades
      if (card.ebay && card.ebay.salesByGrade) {
        count += Object.keys(card.ebay.salesByGrade).length;
      }
      
      return { productId, cardName: card.name, collectedCount: count };
    }
    
    // 1. Store RAW condition pricing
    if (card.prices && card.prices.conditions) {
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
            `pokemonpricetracker-raw`
          ]);
          collectedCount++;
        }
      }
    }
    
    // 2. Store PSA graded prices (from eBay sales data)
    if (card.ebay && card.ebay.salesByGrade) {
      for (const [gradeKey, gradeData] of Object.entries(card.ebay.salesByGrade)) {
        const grade = gradeKey.replace('psa', '').replace('PSA', '');
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
        }
      }
    }
    
    return { productId, collectedCount, cardName: card.name };
  } catch (error) {
    return { productId, collectedCount: 0, error: error.message };
  }
}

/**
 * Get all cards to collect
 */
async function getAllCards(db, limit = null) {
  try {
    // Get all cards (English and Japanese) for pricing collection
    // Note: This includes cards from both language='en' and language='ja'
    let query = `
      SELECT DISTINCT product_id, name, ext_rarity, market_price
      FROM products
      WHERE ext_rarity IS NOT NULL 
        AND ext_rarity != ''
        AND product_id IS NOT NULL
        AND category_id = 3
      ORDER BY market_price DESC
    `;
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    const cards = await db.all(query);
    return cards;
  } catch (error) {
    console.error('Error getting cards:', error);
    return [];
  }
}

/**
 * Estimate collection time
 */
function estimateTime(totalCards, rateLimitMs = 1000) {
  const timeMs = totalCards * rateLimitMs;
  const hours = Math.floor(timeMs / 3600000);
  const minutes = Math.floor((timeMs % 3600000) / 60000);
  return { hours, minutes };
}

/**
 * Main collection function
 */
async function collectAllCardsPricing() {
  console.log('🚀 Starting Complete Card Collection...\n');
  console.log(`Date: ${new Date().toISOString().split('T')[0]}\n`);

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  try {
    // Get total count
    console.log('📊 Getting cards to collect...');
    const allCards = await getAllCards(db);
    console.log(`Found ${allCards.length} total cards in database\n`);
    
    // Get command line args
    const args = process.argv.slice(2);
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const offsetArg = args.find(arg => arg.startsWith('--offset='));
    const dryRunArg = args.find(arg => arg === '--dry-run');
    const creditLimitArg = args.find(arg => arg.startsWith('--credit-limit='));
    
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : allCards.length;
    const offset = offsetArg ? parseInt(offsetArg.split('=')[1]) : 0;
    const isDryRun = dryRunArg !== undefined;
    const creditLimit = creditLimitArg ? parseInt(creditLimitArg.split('=')[1]) : null;
    
    // Apply credit limit if specified
    const effectiveLimit = creditLimit ? Math.min(limit, creditLimit) : limit;
    
    const cards = allCards.slice(offset, offset + effectiveLimit);
    
    console.log('📋 Collection Parameters:');
    console.log(`   Total cards: ${allCards.length}`);
    console.log(`   Processing: ${cards.length} cards (offset: ${offset})`);
    console.log(`   Dry run: ${isDryRun ? 'YES (no data written)' : 'NO (writing to database)'}`);
    if (creditLimit) {
      console.log(`   Credit limit: ${creditLimit} (${cards.length} cards will use ${cards.length} credits)`);
    }
    
    if (!isDryRun) {
      const { hours, minutes } = estimateTime(cards.length, 1000);
      console.log(`   Estimated time: ${hours}h ${minutes}m (at 1 req/sec)`);
    }
    console.log('');
    
    if (isDryRun) {
      // Quick dry run on first 10 cards
      console.log('🔍 Running dry run on first 10 cards...\n');
      const sampleCards = cards.slice(0, 10);
      let totalRecords = 0;
      
      for (const card of sampleCards) {
        const result = await collectCardPricing(db, card.product_id, true);
        totalRecords += result.collectedCount;
      }
      
      console.log(`\n📊 Sample Results (10 cards):`);
      console.log(`   Total records: ${totalRecords}`);
      console.log(`   Avg per card: ${(totalRecords / sampleCards.length).toFixed(1)}`);
      console.log(`\n💡 Estimated total for ${cards.length} cards: ~${Math.round(totalRecords / sampleCards.length * cards.length)} records\n`);
      
      console.log('Run without --dry-run to start collection.');
      return;
    }
    
    // Ask for confirmation
    if (!process.stdin.isTTY) {
      console.log('⚠️  Non-interactive mode. Proceeding...\n');
    } else {
      // Pause for confirmation if in terminal
      console.log('⚠️  This will make ~' + cards.length + ' API calls and take ~' + Math.floor(cards.length / 3600) + ' hours.');
      console.log('Press Ctrl+C to cancel, or Enter to continue...');
      await new Promise(resolve => process.stdin.once('data', resolve));
    }
    
    let successCount = 0;
    let totalRecords = 0;
    const errors = [];
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      if (i % 100 === 0 && i > 0) {
        console.log(`\n✅ Progress: ${i}/${cards.length} (${((i / cards.length) * 100).toFixed(1)}%)`);
        console.log(`   Records collected so far: ${totalRecords}`);
      }
      
      const result = await collectCardPricing(db, card.product_id, false);
      
      if (result && result.collectedCount > 0) {
        successCount++;
        totalRecords += result.collectedCount;
      }
      
      if (result.error) {
        errors.push({ productId: card.product_id, error: result.error });
      }
      
      // Rate limit: 1 second between requests
      if (i < cards.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Collection Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Cards processed: ${successCount}/${cards.length}`);
    console.log(`📈 Total records collected: ${totalRecords}`);
    console.log(`❌ Errors: ${errors.length}`);
    
    // Show database stats
    const stats = await db.get(`
      SELECT 
        COUNT(DISTINCT product_id) as unique_cards,
        COUNT(*) as total_records,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
      FROM price_history
      WHERE source LIKE 'pokemonpricetracker-%'
    `);
    
    console.log('\n📊 Database Stats:');
    console.log(`   Unique cards: ${stats.unique_cards}`);
    console.log(`   Total records: ${stats.total_records}`);
    console.log(`   Date range: ${stats.earliest_date} to ${stats.latest_date}`);
    
    console.log('\n✅ Collection complete!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collectAllCardsPricing();
}

export { collectAllCardsPricing, collectCardPricing, getAllCards };


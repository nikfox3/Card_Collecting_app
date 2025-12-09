import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56';
const DB_PATH = path.join(__dirname, 'cards.db');

// Sets that we know work well based on our previous testing
const WORKING_SETS = [
  'temporal',           // Temporal Forces (2024) - worked great
  'crown-zenith',       // Crown Zenith (2023) - worked great
  'celebrations',       // Celebrations (2021) - worked great
  'evolving-skies',     // Evolving Skies (2021) - popular set
  'brilliant-stars',    // Brilliant Stars (2022)
  'astral-radiance',    // Astral Radiance (2022)
  'lost-origin',        // Lost Origin (2022)
  'silver-tempest',     // Silver Tempest (2022)
  'paldea-evolved',     // Paldea Evolved (2023)
  'scarlet-violet',     // Scarlet & Violet (2023)
];

async function collectWithBulkFetching() {
  console.log('🚀 Starting optimized bulk fetching collection...');
  console.log('💰 Credits available: ~16,477');
  console.log('⚡ Using fetchAllInSet=true for rate limit optimization');
  
  const db = new sqlite3.Database(DB_PATH);
  const today = new Date().toISOString().split('T')[0];
  
  let totalCards = 0;
  let totalRecords = 0;
  let apiErrors = 0;
  let successfulSets = 0;
  let rateLimitHits = 0;
  
  try {
    for (let i = 0; i < WORKING_SETS.length; i++) {
      const setName = WORKING_SETS[i];
      console.log(`\n📦 [${i + 1}/${WORKING_SETS.length}] Processing set: ${setName}`);
      
      try {
        // Use bulk fetching with rate limit optimization
        const response = await fetch(`${API_BASE_URL}/cards?set=${setName}&fetchAllInSet=true&limit=300`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        
        // Check rate limit headers
        const minuteRemaining = response.headers.get('X-RateLimit-Minute-Remaining');
        const dailyRemaining = response.headers.get('X-RateLimit-Daily-Remaining');
        const callsConsumed = response.headers.get('X-API-Calls-Consumed');
        
        console.log(`  📊 Rate Limit Status:`);
        console.log(`    • Minute remaining: ${minuteRemaining || 'Unknown'}`);
        console.log(`    • Daily remaining: ${dailyRemaining || 'Unknown'}`);
        console.log(`    • Calls consumed: ${callsConsumed || 'Unknown'}`);
        
        if (!response.ok) {
          if (response.status === 403 || response.status === 429) {
            console.log(`  ⚠️  Rate limited for set ${setName} - waiting 2 minutes...`);
            rateLimitHits++;
            await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes
            continue;
          }
          console.log(`  ❌ Failed to fetch set ${setName}: ${response.status}`);
          apiErrors++;
          continue;
        }
        
        const setData = await response.json();
        
        if (!setData.data || setData.data.length === 0) {
          console.log(`  ⚠️  No cards found for set ${setName}`);
          continue;
        }
        
        console.log(`  📊 Found ${setData.data.length} cards in ${setName}`);
        totalCards += setData.data.length;
        successfulSets++;
        
        // Process each card in the set
        let setRecords = 0;
        for (const card of setData.data) {
          if (!card.tcgPlayerId || !card.prices) {
            continue;
          }
          
          const recordsCollected = await processCardPricing(db, card, today);
          setRecords += recordsCollected;
          totalRecords += recordsCollected;
        }
        
        console.log(`  ✅ Completed ${setName} - ${setData.data.length} cards, ${setRecords} records`);
        
        // Longer delay between sets to respect rate limits
        console.log(`  ⏳ Waiting 30 seconds before next set...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Stop if we hit too many rate limits
        if (rateLimitHits > 3) {
          console.log(`\n⚠️  Too many rate limit hits (${rateLimitHits}). Stopping collection.`);
          break;
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing set ${setName}:`, error.message);
        apiErrors++;
      }
    }
    
    console.log(`\n🎉 Collection Complete!`);
    console.log(`📈 Final Summary:`);
    console.log(`✅ Sets processed: ${successfulSets}/${WORKING_SETS.length}`);
    console.log(`📦 Total cards: ${totalCards}`);
    console.log(`📊 Total records collected: ${totalRecords}`);
    console.log(`⚠️  Rate limit hits: ${rateLimitHits}`);
    console.log(`❌ API errors: ${apiErrors}`);
    console.log(`💰 Estimated credits used: ~${totalCards} (1 credit per card)`);
    
  } catch (error) {
    console.error('❌ Collection failed:', error);
  } finally {
    db.close();
  }
}

async function processCardPricing(db, card, today) {
  const productId = card.tcgPlayerId;
  let collectedCount = 0;
  
  try {
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
    
  } catch (error) {
    console.error(`    ❌ Error processing ${card.name}:`, error.message);
  }
  
  return collectedCount;
}

// Run the collection
collectWithBulkFetching().catch(console.error);



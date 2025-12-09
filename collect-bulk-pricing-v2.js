import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56';
const DB_PATH = path.join(__dirname, 'cards.db');

// Recent sets with good coverage (based on API docs)
const RECENT_SETS = [
  'temporal',           // Temporal Forces (2024)
  'surging-sparks',     // Surging Sparks (2024)
  'stellar-crown',      // Stellar Crown (2024)
  'shrouded-fable',     // Shrouded Fable (2024)
  'celebrations',       // Celebrations (2021) - known to work
  'crown-zenith',       // Crown Zenith (2023)
  'paldea-evolved',     // Paldea Evolved (2023)
  'scarlet-violet',     // Scarlet & Violet (2023)
];

async function collectBulkPricing() {
  console.log('🚀 Starting bulk pricing collection for recent sets...');
  
  const db = new sqlite3.Database(DB_PATH);
  const today = new Date().toISOString().split('T')[0];
  
  let totalCards = 0;
  let totalRecords = 0;
  let apiErrors = 0;
  
  try {
    for (const setName of RECENT_SETS) {
      console.log(`\n📦 Processing set: ${setName}`);
      
      try {
        // Fetch all cards in the set
        const response = await fetch(`${API_BASE_URL}/cards?set=${setName}&fetchAllInSet=true&limit=200`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        
        if (!response.ok) {
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
        
        // Process each card in the set
        for (const card of setData.data) {
          if (!card.tcgPlayerId || !card.prices) {
            console.log(`  ⚠️  Skipping ${card.name} - no pricing data`);
            continue;
          }
          
          const productId = card.tcgPlayerId;
          const recordsCollected = await processCardPricing(db, card, today);
          totalRecords += recordsCollected;
          
          // Small delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`  ✅ Completed ${setName} - ${setData.data.length} cards processed`);
        
        // Longer delay between sets
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ❌ Error processing set ${setName}:`, error.message);
        apiErrors++;
      }
    }
    
    console.log(`\n📈 Collection Summary:`);
    console.log(`✅ Sets processed: ${RECENT_SETS.length}`);
    console.log(`📦 Total cards: ${totalCards}`);
    console.log(`📊 Total records collected: ${totalRecords}`);
    console.log(`❌ API errors: ${apiErrors}`);
    
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
    
    console.log(`    ✅ ${card.name}: ${collectedCount} records`);
    
  } catch (error) {
    console.error(`    ❌ Error processing ${card.name}:`, error.message);
  }
  
  return collectedCount;
}

// Run the collection
collectBulkPricing().catch(console.error);

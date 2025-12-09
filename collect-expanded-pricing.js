import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56';
const DB_PATH = path.join(__dirname, 'cards.db');

// Expanded set list - focusing on popular and recent sets
const EXPANDED_SETS = [
  // Recent sets (2024-2025)
  'temporal',           // Temporal Forces (2024)
  'surging-sparks',     // Surging Sparks (2024) 
  'stellar-crown',      // Stellar Crown (2024)
  'shrouded-fable',     // Shrouded Fable (2024)
  'destined-rivals',    // Destined Rivals (2025)
  'journey-together',   // Journey Together (2025)
  'prismatic-evolutions', // Prismatic Evolutions (2025)
  
  // Popular modern sets (2023-2024)
  'crown-zenith',       // Crown Zenith (2023)
  'paldea-evolved',     // Paldea Evolved (2023)
  'scarlet-violet',     // Scarlet & Violet (2023)
  'obsidian-flames',    // Obsidian Flames (2023)
  'paldean-fates',      // Paldean Fates (2024)
  'temporal-forces',    // Temporal Forces (2024)
  
  // Special/Anniversary sets
  'celebrations',       // Celebrations (2021)
  'shining-fates',      // Shining Fates (2021)
  'chilling-reign',     // Chilling Reign (2021)
  'battle-styles',      // Battle Styles (2021)
  
  // Popular older sets
  'evolving-skies',     // Evolving Skies (2021)
  'fusion-strike',      // Fusion Strike (2021)
  'brilliant-stars',    // Brilliant Stars (2022)
  'astral-radiance',    // Astral Radiance (2022)
  'lost-origin',        // Lost Origin (2022)
  'silver-tempest',     // Silver Tempest (2022)
  
  // Vintage/Classic sets
  'base-set',           // Base Set (1999)
  'jungle',             // Jungle (1999)
  'fossil',             // Fossil (1999)
  'base-set-2',         // Base Set 2 (2000)
  'team-rocket',        // Team Rocket (2000)
  'gym-heroes',         // Gym Heroes (2000)
  'gym-challenge',      // Gym Challenge (2000)
  'neo-genesis',        // Neo Genesis (2000)
  'neo-discovery',      // Neo Discovery (2001)
  'neo-revelation',     // Neo Revelation (2001)
  'neo-destiny',        // Neo Destiny (2001)
  
  // EX Series
  'ruby-sapphire',      // Ruby & Sapphire (2003)
  'sandstorm',          // Sandstorm (2003)
  'dragon',             // Dragon (2003)
  'team-magma-vs-team-aqua', // Team Magma vs Team Aqua (2004)
  'hidden-legends',     // Hidden Legends (2004)
  'fire-red-leaf-green', // FireRed & LeafGreen (2004)
  'team-rocket-returns', // Team Rocket Returns (2004)
  'deoxys',             // Deoxys (2004)
  'emerald',            // Emerald (2005)
  'unseen-forces',      // Unseen Forces (2005)
  'delta-species',      // Delta Species (2005)
  'legend-maker',       // Legend Maker (2006)
  'holon-phantoms',     // Holon Phantoms (2006)
  'crystal-guardians',  // Crystal Guardians (2006)
  'dragon-frontiers',   // Dragon Frontiers (2006)
  'power-keepers',      // Power Keepers (2007)
];

async function collectExpandedPricing() {
  console.log('🚀 Starting expanded pricing collection...');
  console.log(`📊 Target: ${EXPANDED_SETS.length} sets`);
  
  const db = new sqlite3.Database(DB_PATH);
  const today = new Date().toISOString().split('T')[0];
  
  let totalCards = 0;
  let totalRecords = 0;
  let apiErrors = 0;
  let successfulSets = 0;
  
  try {
    for (let i = 0; i < EXPANDED_SETS.length; i++) {
      const setName = EXPANDED_SETS[i];
      console.log(`\n📦 [${i + 1}/${EXPANDED_SETS.length}] Processing set: ${setName}`);
      
      try {
        // Fetch all cards in the set
        const response = await fetch(`${API_BASE_URL}/cards?set=${setName}&fetchAllInSet=true&limit=300`, {
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
          
          // Small delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log(`  ✅ Completed ${setName} - ${setData.data.length} cards, ${setRecords} records`);
        
        // Progress update every 5 sets
        if ((i + 1) % 5 === 0) {
          console.log(`\n📈 Progress Update:`);
          console.log(`  ✅ Sets completed: ${i + 1}/${EXPANDED_SETS.length}`);
          console.log(`  📦 Total cards: ${totalCards}`);
          console.log(`  📊 Total records: ${totalRecords}`);
          console.log(`  ❌ API errors: ${apiErrors}`);
        }
        
        // Longer delay between sets
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`  ❌ Error processing set ${setName}:`, error.message);
        apiErrors++;
      }
    }
    
    console.log(`\n🎉 Collection Complete!`);
    console.log(`📈 Final Summary:`);
    console.log(`✅ Sets processed: ${successfulSets}/${EXPANDED_SETS.length}`);
    console.log(`📦 Total cards: ${totalCards}`);
    console.log(`📊 Total records collected: ${totalRecords}`);
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
collectExpandedPricing().catch(console.error);



const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');

const DB_PATH = path.join(__dirname, '../database/cards_backup_20251002_182725.db');

console.log('💰 Automated Price Update Script');
console.log('📊 Database:', DB_PATH);
console.log('');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Fetch from pokemontcg.io API
function fetchPokemonTCGPrices(setId, limit = 250) {
  return new Promise((resolve, reject) => {
    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=${limit}`;
    
    https.get(url, {
      headers: {
        'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
      }
    }, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Fetch from TCGdex API
function fetchTCGdexPrices(setId, cardNumber) {
  return new Promise((resolve, reject) => {
    const url = `https://api.tcgdex.net/v2/en/cards/${setId}-${cardNumber}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Update prices for a set
async function updateSetPrices(setId) {
  console.log(`\n📦 Processing set: ${setId}`);
  
  try {
    // Try pokemontcg.io first
    console.log('  🔍 Fetching from pokemontcg.io...');
    const cards = await fetchPokemonTCGPrices(setId);
    
    if (cards.length === 0) {
      console.log('  ⚠️  No cards found on pokemontcg.io, trying TCGdex...');
      return updateSetPricesFromTCGdex(setId);
    }
    
    console.log(`  ✅ Found ${cards.length} cards with pricing`);
    
    let updatedCount = 0;
    
    for (const card of cards) {
      const cardId = card.id;
      const tcgplayer = card.tcgplayer?.prices || {};
      const cardmarket = card.cardmarket?.prices || {};
      
      // Extract best price
      let currentValue = 0;
      if (tcgplayer.normal?.market) currentValue = tcgplayer.normal.market;
      else if (tcgplayer.holofoil?.market) currentValue = tcgplayer.holofoil.market;
      else if (tcgplayer.reverseHolofoil?.market) currentValue = tcgplayer.reverseHolofoil.market;
      else if (cardmarket.averageSellPrice) currentValue = cardmarket.averageSellPrice;
      
      if (currentValue > 0) {
        await new Promise((resolve) => {
          db.run(
            `UPDATE cards 
             SET current_value = ?, 
                 tcgplayer = ?, 
                 cardmarket = ?,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [currentValue, JSON.stringify(tcgplayer), JSON.stringify(cardmarket), cardId],
            (err) => {
              if (!err && this && this.changes > 0) {
                updatedCount++;
              }
              resolve();
            }
          );
        });
      }
    }
    
    console.log(`  💰 Updated ${updatedCount} cards with new pricing`);
    return updatedCount;
    
  } catch (error) {
    console.error(`  ❌ Error updating set ${setId}:`, error.message);
    return 0;
  }
}

// Update from TCGdex as fallback
async function updateSetPricesFromTCGdex(setId) {
  console.log('  🔍 Using TCGdex fallback...');
  // This would require iterating through card numbers
  // For now, return 0 (can be expanded later)
  return 0;
}

// Main execution
async function main() {
  console.log('🚀 Starting automated price updates...');
  console.log('');
  
  // Get list of sets to update (focus on recent sets)
  const setsToUpdate = [
    'sv10',  // Destined Rivals
    'sv9',   // Surging Sparks
    'sv8',   // Stellar Crown
    'sv7',   // Twilight Masquerade
    'sv6',   // Shrouded Fable
    'sv5',   // Temporal Forces
    'sv4',   // Paradox Rift
    'sv3',   // Obsidian Flames
    'sv2',   // Paldea Evolved
    'sv1',   // Scarlet & Violet Base
    'swsh12', // Silver Tempest
    'swsh11', // Lost Origin
    'swsh10', // Astral Radiance
  ];
  
  let totalUpdated = 0;
  
  for (const setId of setsToUpdate) {
    const count = await updateSetPrices(setId);
    totalUpdated += count;
    
    // Rate limiting - wait 2 seconds between sets
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('');
  console.log('═'.repeat(50));
  console.log('🎉 Price update complete!');
  console.log(`💰 Total cards updated: ${totalUpdated}`);
  console.log('═'.repeat(50));
  
  db.close();
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled error:', err);
  db.close();
  process.exit(1);
});

// Run it
main();











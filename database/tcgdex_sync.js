const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const fs = require('fs');

// TCGdex API integration for comprehensive card data
class TCGdexSync {
  constructor() {
    this.db = new sqlite3.Database('./cards.db');
    this.baseUrl = 'https://api.tcgdex.net/v2/en';
    this.languages = ['en', 'ja', 'fr', 'de', 'es', 'it', 'pt', 'ko', 'zh-cn'];
    this.syncLog = [];
  }
  
  // Fetch data from TCGdex API
  async fetchAPI(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }
  
  // Get all sets from TCGdex
  async getAllSets() {
    try {
      console.log('🔄 Fetching all sets from TCGdex...');
      const sets = await this.fetchAPI('/sets');
      console.log(`✅ Found ${sets.length} sets`);
      return sets;
    } catch (error) {
      console.error('❌ Error fetching sets:', error);
      return [];
    }
  }
  
  // Get set details including all cards
  async getSetDetails(setId) {
    try {
      const set = await this.fetchAPI(`/sets/${setId}`);
      return set;
    } catch (error) {
      console.error(`❌ Error fetching set ${setId}:`, error);
      return null;
    }
  }
  
  // Get card details
  async getCardDetails(setId, cardId) {
    try {
      const card = await this.fetchAPI(`/cards/${setId}-${cardId}`);
      return card;
    } catch (error) {
      console.error(`❌ Error fetching card ${setId}-${cardId}:`, error);
      return null;
    }
  }
  
  // Check if set exists in database
  async setExists(setId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT id FROM sets WHERE id = ?', [setId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });
  }
  
  // Check if card exists in database
  async cardExists(cardId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT id FROM cards WHERE id = ?', [cardId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });
  }
  
  // Insert or update set
  async upsertSet(set) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO sets (
          id, name, series, printed_total, total, 
          legalities, ptcgo_code, release_date, updated_at, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `;
      
      const values = [
        set.id,
        set.name,
        set.series || null,
        set.printedTotal || null,
        set.total || set.cardCount?.total || null,
        JSON.stringify(set.legal || {}),
        set.tcgOnline || null,
        set.releaseDate || null,
        JSON.stringify(set.logo || {})
      ];
      
      this.db.run(query, values, (err) => {
        if (err) {
          console.error(`❌ Error inserting set ${set.id}:`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  // Insert or update card
  async upsertCard(card, setId) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO cards (
          id, name, supertype, subtypes, level, hp, types,
          evolves_from, attacks, weaknesses, resistances, retreat_cost,
          converted_retreat_cost, set_id, number, artist, rarity,
          national_pokedex_numbers, legalities, images, tcgplayer, cardmarket,
          current_value, language, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      // Extract image URLs (TCGdex provides direct URLs)
      const images = {
        small: card.image?.small || card.image?.lowRes || null,
        large: card.image?.large || card.image?.highRes || null,
        high: card.image?.highRes || card.image?.large || null
      };
      
      const values = [
        `${setId}-${card.localId}`,
        card.name,
        card.category || 'Pokémon',
        JSON.stringify(card.types || []),
        card.stage || null,
        card.hp || null,
        JSON.stringify(card.types || []),
        card.evolveFrom || null,
        JSON.stringify(card.attacks || []),
        JSON.stringify(card.weaknesses || []),
        JSON.stringify(card.resistances || []),
        JSON.stringify(card.retreat ? Array(card.retreat).fill('Colorless') : []),
        card.retreat || 0,
        setId,
        card.localId || card.id,
        card.illustrator || null,
        card.rarity || null,
        JSON.stringify(card.dexId ? [card.dexId] : []),
        JSON.stringify(card.legal || {}),
        JSON.stringify(images),
        null, // TCGPlayer data (will be fetched separately)
        null, // CardMarket data (will be fetched separately)
        0, // current_value (will be updated by price sync)
        'en' // default language
      ];
      
      this.db.run(query, values, (err) => {
        if (err) {
          console.error(`❌ Error inserting card ${card.name}:`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  // Sync a specific set
  async syncSet(setId) {
    try {
      console.log(`\n🔄 Syncing set: ${setId}`);
      
      const setDetails = await this.getSetDetails(setId);
      if (!setDetails) {
        console.log(`   ⚠️  Set ${setId} not found`);
        return;
      }
      
      // Insert/update set
      await this.upsertSet(setDetails);
      console.log(`   ✅ Set "${setDetails.name}" synced`);
      
      // Sync all cards in the set
      if (setDetails.cards && setDetails.cards.length > 0) {
        console.log(`   📦 Syncing ${setDetails.cards.length} cards...`);
        
        let syncedCount = 0;
        for (const card of setDetails.cards) {
          try {
            await this.upsertCard(card, setId);
            syncedCount++;
            
            if (syncedCount % 50 === 0) {
              console.log(`      ... ${syncedCount}/${setDetails.cards.length} cards synced`);
            }
          } catch (error) {
            console.error(`      ❌ Failed to sync card: ${card.name}`);
          }
        }
        
        console.log(`   ✅ ${syncedCount}/${setDetails.cards.length} cards synced`);
      }
      
      this.syncLog.push({
        setId,
        setName: setDetails.name,
        cardCount: setDetails.cards?.length || 0,
        success: true
      });
      
    } catch (error) {
      console.error(`❌ Error syncing set ${setId}:`, error);
      this.syncLog.push({
        setId,
        success: false,
        error: error.message
      });
    }
  }
  
  // Sync all sets
  async syncAllSets() {
    try {
      const sets = await this.getAllSets();
      
      console.log(`\n🚀 Starting sync of ${sets.length} sets from TCGdex\n`);
      
      for (let i = 0; i < sets.length; i++) {
        console.log(`[${i + 1}/${sets.length}]`);
        await this.syncSet(sets[i].id);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('\n✅ All sets synced!');
      this.printSyncSummary();
      
    } catch (error) {
      console.error('❌ Error during sync:', error);
    } finally {
      this.db.close();
    }
  }
  
  // Sync specific sets (Japanese, Promos, etc.)
  async syncMissingSets() {
    try {
      console.log('🔄 Fetching Japanese and special sets...\n');
      
      const allSets = await this.getAllSets();
      
      // Filter for Japanese, Promos, and Trainer sets
      const prioritySets = allSets.filter(set => 
        set.name.includes('Promo') ||
        set.name.includes('Trainer') ||
        set.name.includes('Japanese') ||
        set.series?.includes('Promo') ||
        set.id.startsWith('sm') && set.id.includes('p') ||
        set.id.startsWith('sv') && set.id.includes('p')
      );
      
      console.log(`📋 Found ${prioritySets.length} priority sets to sync:\n`);
      prioritySets.forEach((set, i) => {
        console.log(`   ${i + 1}. ${set.name} (${set.id})`);
      });
      
      console.log(`\n🚀 Starting sync...\n`);
      
      for (let i = 0; i < prioritySets.length; i++) {
        console.log(`[${i + 1}/${prioritySets.length}]`);
        await this.syncSet(prioritySets[i].id);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('\n✅ Priority sets synced!');
      this.printSyncSummary();
      
    } catch (error) {
      console.error('❌ Error during sync:', error);
    } finally {
      this.db.close();
    }
  }
  
  // Print sync summary
  printSyncSummary() {
    console.log('\n📊 Sync Summary:');
    console.log('═══════════════════════════════════════\n');
    
    const successful = this.syncLog.filter(s => s.success);
    const failed = this.syncLog.filter(s => !s.success);
    
    console.log(`✅ Successfully synced: ${successful.length} sets`);
    console.log(`❌ Failed: ${failed.length} sets`);
    
    const totalCards = successful.reduce((sum, s) => sum + s.cardCount, 0);
    console.log(`📦 Total cards synced: ${totalCards.toLocaleString()}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed sets:');
      failed.forEach(f => {
        console.log(`   - ${f.setId}: ${f.error}`);
      });
    }
    
    // Save log to file
    fs.writeFileSync(
      `sync_log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      JSON.stringify(this.syncLog, null, 2)
    );
    console.log('\n📄 Detailed log saved to sync_log_*.json');
  }
}

// Export the class
module.exports = TCGdexSync;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const syncer = new TCGdexSync();
  
  if (args[0] === 'all') {
    console.log('🌐 Syncing ALL sets from TCGdex...');
    syncer.syncAllSets();
  } else if (args[0] === 'missing') {
    console.log('🎯 Syncing missing sets (Promos, Japanese, Trainers)...');
    syncer.syncMissingSets();
  } else if (args[0]) {
    console.log(`🎯 Syncing specific set: ${args[0]}`);
    syncer.syncSet(args[0]).then(() => {
      syncer.printSyncSummary();
      syncer.db.close();
    });
  } else {
    console.log('Usage:');
    console.log('  node tcgdex_sync.js all           - Sync all sets');
    console.log('  node tcgdex_sync.js missing       - Sync missing sets (promos, etc.)');
    console.log('  node tcgdex_sync.js <set-id>      - Sync specific set');
    process.exit(1);
  }
}





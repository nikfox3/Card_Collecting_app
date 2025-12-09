const sqlite3 = require('sqlite3').verbose();
const https = require('https');

// Multi-source price updater - tries multiple APIs for best coverage
class MultiSourcePriceUpdater {
  constructor() {
    this.db = new sqlite3.Database('./cards.db');
    this.updated = 0;
    this.failed = 0;
    this.skipped = 0;
  }
  
  // Source 1: Pokemon TCG API (pokemontcg.io)
  async fetchPokemonTCGAPI(cardId) {
    return new Promise((resolve, reject) => {
      const url = `https://api.pokemontcg.io/v2/cards/${cardId}`;
      
      https.get(url, {
        headers: {
          'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.data);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }
  
  // Source 2: TCGdex API
  async fetchTCGdexAPI(setId, cardNumber) {
    return new Promise((resolve, reject) => {
      // Try to match set ID format for TCGdex
      const tcgdexSetId = this.convertToTCGdexSetId(setId);
      const url = `https://api.tcgdex.net/v2/en/cards/${tcgdexSetId}-${cardNumber}`;
      
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
  
  // Source 3: TCGPlayer direct API (requires API key)
  async fetchTCGPlayerAPI(productId) {
    return new Promise((resolve, reject) => {
      if (!process.env.TCGPLAYER_API_KEY) {
        reject(new Error('TCGPlayer API key not set'));
        return;
      }
      
      const url = `https://api.tcgplayer.com/pricing/product/${productId}`;
      
      https.get(url, {
        headers: {
          'Authorization': `Bearer ${process.env.TCGPLAYER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }, (res) => {
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
  
  // Convert set ID to TCGdex format
  convertToTCGdexSetId(setId) {
    // TCGdex uses different set ID formats
    // e.g., sv10 stays sv10, base1 stays base1
    return setId.toLowerCase().replace(/-/g, '');
  }
  
  // Extract price from Pokemon TCG API data
  extractPriceFromPokemonTCG(card) {
    if (!card.tcgplayer?.prices) return null;
    
    const prices = card.tcgplayer.prices;
    const priceTypes = [
      'holofoil',
      'normal',
      'reverseHolofoil',
      'unlimitedHolofoil',
      'unlimitedNormal',
      '1stEditionHolofoil',
      '1stEditionNormal'
    ];
    
    for (const type of priceTypes) {
      if (prices[type]?.market && prices[type].market > 0) {
        return {
          price: prices[type].market,
          source: 'pokemontcg.io',
          priceData: card.tcgplayer,
          cardmarketData: card.cardmarket || null
        };
      }
    }
    
    return null;
  }
  
  // Extract price from TCGdex API data
  extractPriceFromTCGdex(card) {
    // TCGdex provides market prices in different formats
    if (card.tcgplayer?.prices) {
      const prices = card.tcgplayer.prices;
      
      // Check various price types
      if (prices.normal?.market && prices.normal.market > 0) {
        return {
          price: prices.normal.market,
          source: 'tcgdex',
          priceData: card.tcgplayer,
          cardmarketData: null
        };
      }
      
      if (prices.holofoil?.market && prices.holofoil.market > 0) {
        return {
          price: prices.holofoil.market,
          source: 'tcgdex',
          priceData: card.tcgplayer,
          cardmarketData: null
        };
      }
    }
    
    return null;
  }
  
  // Try all sources for a card
  async fetchPriceFromAllSources(card) {
    const results = {
      price: null,
      source: null,
      priceData: null,
      cardmarketData: null,
      artist: null
    };
    
    // Try Pokemon TCG API first
    try {
      const pokemonTCGData = await this.fetchPokemonTCGAPI(card.id);
      const priceResult = this.extractPriceFromPokemonTCG(pokemonTCGData);
      
      if (priceResult) {
        results.price = priceResult.price;
        results.source = priceResult.source;
        results.priceData = priceResult.priceData;
        results.cardmarketData = priceResult.cardmarketData;
      }
      
      // Also extract artist if missing
      if (pokemonTCGData.artist && (!card.artist || card.artist === '')) {
        results.artist = pokemonTCGData.artist;
      }
      
      if (results.price) {
        return results;
      }
    } catch (error) {
      // Continue to next source
    }
    
    // Try TCGdex API if Pokemon TCG API failed
    try {
      const tcgdexData = await this.fetchTCGdexAPI(card.set_id, card.number);
      const priceResult = this.extractPriceFromTCGdex(tcgdexData);
      
      if (priceResult) {
        results.price = priceResult.price;
        results.source = priceResult.source;
        results.priceData = priceResult.priceData;
      }
      
      // Extract artist from TCGdex
      if (tcgdexData.illustrator && (!card.artist || card.artist === '')) {
        results.artist = tcgdexData.illustrator;
      }
      
      if (results.price) {
        return results;
      }
    } catch (error) {
      // Continue
    }
    
    return results;
  }
  
  // Get cards needing updates
  async getCardsNeedingUpdate(limit = 100, setId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT id, name, set_id, number, current_value, artist, updated_at
        FROM cards 
        WHERE (current_value = 0 OR current_value IS NULL OR updated_at < datetime('now', '-7 days'))
      `;
      
      const params = [];
      
      if (setId) {
        query += ' AND set_id = ?';
        params.push(setId);
      }
      
      query += ` 
        ORDER BY 
          CASE 
            WHEN current_value IS NULL THEN 1
            WHEN current_value = 0 THEN 2
            ELSE 3
          END,
          updated_at ASC
        LIMIT ?
      `;
      
      params.push(limit);
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  // Update card in database
  async updateCard(cardId, price, artist, tcgplayerData, cardmarketData) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE cards 
        SET current_value = ?,
            artist = COALESCE(NULLIF(?, ''), artist),
            tcgplayer = ?,
            cardmarket = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      this.db.run(
        query,
        [
          price || 0,
          artist,
          JSON.stringify(tcgplayerData || {}),
          JSON.stringify(cardmarketData || {}),
          cardId
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
  
  // Update batch
  async updateBatch(cards) {
    console.log(`\n🔄 Processing batch of ${cards.length} cards...\n`);
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      try {
        const results = await this.fetchPriceFromAllSources(card);
        
        if (results.price && results.price > 0) {
          await this.updateCard(
            card.id,
            results.price,
            results.artist,
            results.priceData,
            results.cardmarketData
          );
          
          const artistInfo = results.artist ? ` + Artist: ${results.artist}` : '';
          console.log(`   ✅ [${i + 1}/${cards.length}] ${card.name} - $${results.price.toFixed(2)} (${results.source})${artistInfo}`);
          this.updated++;
        } else if (results.artist) {
          // Update artist even if no price found
          await this.updateCard(card.id, 0, results.artist, null, null);
          console.log(`   📝 [${i + 1}/${cards.length}] ${card.name} - Artist updated: ${results.artist}`);
          this.updated++;
        } else {
          console.log(`   ⚠️  [${i + 1}/${cards.length}] ${card.name} - No data available`);
          this.skipped++;
        }
        
        // Rate limiting - be nice to APIs
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.log(`   ❌ [${i + 1}/${cards.length}] ${card.name} - Error: ${error.message}`);
        this.failed++;
      }
    }
  }
  
  // Update all cards
  async updateAll(batchSize = 50, maxBatches = null) {
    try {
      console.log('🚀 Starting multi-source price/artist update...\n');
      console.log('📡 Using sources: Pokemon TCG API, TCGdex API\n');
      
      let batchCount = 0;
      let hasMore = true;
      
      while (hasMore) {
        const cards = await this.getCardsNeedingUpdate(batchSize);
        
        if (cards.length === 0) {
          console.log('\n✅ No more cards need updating!');
          hasMore = false;
          break;
        }
        
        batchCount++;
        console.log(`📦 Batch ${batchCount} - ${cards.length} cards`);
        
        await this.updateBatch(cards);
        
        if (maxBatches && batchCount >= maxBatches) {
          console.log(`\n⏸️  Reached maximum batch limit (${maxBatches})`);
          hasMore = false;
        }
      }
      
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Error during update:', error);
    } finally {
      this.db.close();
    }
  }
  
  // Update specific set
  async updateSet(setId) {
    try {
      console.log(`🎯 Updating set: ${setId}\n`);
      console.log('📡 Using sources: Pokemon TCG API, TCGdex API\n');
      
      const cards = await this.getCardsNeedingUpdate(1000, setId);
      
      if (cards.length === 0) {
        console.log('⚠️  No cards in this set need updating');
        return;
      }
      
      console.log(`📦 Found ${cards.length} cards to update\n`);
      
      await this.updateBatch(cards);
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Error updating set:', error);
    } finally {
      this.db.close();
    }
  }
  
  // Print summary
  printSummary() {
    console.log('\n═══════════════════════════════════════');
    console.log('📊 Update Summary');
    console.log('═══════════════════════════════════════\n');
    
    console.log(`✅ Updated: ${this.updated.toLocaleString()} cards`);
    console.log(`⏭️  Skipped: ${this.skipped.toLocaleString()} (no data available)`);
    console.log(`❌ Failed: ${this.failed.toLocaleString()}`);
    
    const total = this.updated + this.skipped + this.failed;
    const successRate = total > 0 ? ((this.updated / total) * 100).toFixed(1) : 0;
    
    console.log(`\n📈 Success rate: ${successRate}%`);
  }
}

// Export
module.exports = MultiSourcePriceUpdater;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const updater = new MultiSourcePriceUpdater();
  
  if (args[0] === 'all') {
    const batchSize = parseInt(args[1]) || 50;
    const maxBatches = args[2] ? parseInt(args[2]) : null;
    
    console.log(`🌐 Updating ALL cards using multiple sources\n`);
    console.log(`   Batch size: ${batchSize}`);
    if (maxBatches) console.log(`   Max batches: ${maxBatches}`);
    console.log('');
    
    updater.updateAll(batchSize, maxBatches);
    
  } else if (args[0] === 'set' && args[1]) {
    console.log(`🎯 Updating set: ${args[1]}\n`);
    updater.updateSet(args[1]);
    
  } else {
    console.log('Multi-Source Price & Artist Updater');
    console.log('Uses Pokemon TCG API and TCGdex API for maximum coverage\n');
    console.log('Usage:');
    console.log('  node multi_source_price_updater.js all [batchSize] [maxBatches]');
    console.log('  node multi_source_price_updater.js set <set-id>');
    console.log('');
    console.log('Examples:');
    console.log('  node multi_source_price_updater.js all 50 10  - Update 10 batches of 50 cards');
    console.log('  node multi_source_price_updater.js set sv10   - Update Destined Rivals');
    console.log('  node multi_source_price_updater.js set me01   - Update Mega Evolution');
    process.exit(1);
  }
}










const sqlite3 = require('sqlite3').verbose();
const https = require('https');

// Complete data updater - uses pokemontcg.io for pricing and tcgdex for everything
class CompleteDataUpdater {
  constructor() {
    this.db = new sqlite3.Database('./cards.db');
    this.pricesUpdated = 0;
    this.artistsUpdated = 0;
    this.bothUpdated = 0;
    this.failed = 0;
    this.skipped = 0;
  }
  
  // Fetch from Pokemon TCG API (pokemontcg.io) - best for pricing
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
            if (response.data) {
              resolve(response.data);
            } else {
              reject(new Error('No data in response'));
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }
  
  // Fetch from TCGdex API - comprehensive, includes new sets
  async fetchTCGdexAPI(setId, cardNumber) {
    return new Promise((resolve, reject) => {
      // TCGdex uses format: sv10-001, base1-1, etc.
      const cleanSetId = setId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanNumber = cardNumber.replace(/[^0-9]/g, '').padStart(3, '0');
      const url = `https://api.tcgdex.net/v2/en/cards/${cleanSetId}-${cleanNumber}`;
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.id) {
              resolve(response);
            } else {
              reject(new Error('Card not found'));
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }
  
  // Extract best price from Pokemon TCG API
  extractPrice(card) {
    if (!card.tcgplayer?.prices) return null;
    
    const prices = card.tcgplayer.prices;
    
    // Priority order for most accurate pricing
    const priceTypes = [
      'holofoil',
      'normal', 
      'reverseHolofoil',
      'unlimitedHolofoil',
      'unlimitedNormal',
      '1stEditionHolofoil',
      '1stEditionNormal',
      'unlimited'
    ];
    
    for (const type of priceTypes) {
      if (prices[type]?.market && prices[type].market > 0) {
        return {
          price: prices[type].market,
          priceData: card.tcgplayer,
          cardmarketData: card.cardmarket || null
        };
      }
    }
    
    return null;
  }
  
  // Extract price from TCGdex (fallback for newer sets)
  extractPriceFromTCGdex(card) {
    // TCGdex sometimes has cardmarket pricing
    if (card.cardmarket?.prices) {
      const prices = card.cardmarket.prices;
      
      // Use average sell price as most reliable
      if (prices.averageSellPrice && prices.averageSellPrice > 0) {
        return {
          price: prices.averageSellPrice,
          priceData: null,
          cardmarketData: card.cardmarket
        };
      }
      
      // Fallback to trend price
      if (prices.trendPrice && prices.trendPrice > 0) {
        return {
          price: prices.trendPrice,
          priceData: null,
          cardmarketData: card.cardmarket
        };
      }
    }
    
    return null;
  }
  
  // Get comprehensive data for a card
  async getCompleteCardData(card) {
    const result = {
      price: null,
      artist: null,
      priceData: null,
      cardmarketData: null,
      source: null
    };
    
    // Step 1: Try Pokemon TCG API for pricing (most reliable)
    try {
      const ptcgData = await this.fetchPokemonTCGAPI(card.id);
      
      // Extract price
      const priceResult = this.extractPrice(ptcgData);
      if (priceResult) {
        result.price = priceResult.price;
        result.priceData = priceResult.priceData;
        result.cardmarketData = priceResult.cardmarketData;
        result.source = 'pokemontcg.io';
      }
      
      // Extract artist if missing
      if (ptcgData.artist && (!card.artist || card.artist === '')) {
        result.artist = ptcgData.artist;
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      // Pokemon TCG API failed or card not found (likely newer set)
      // Continue to TCGdex
    }
    
    // Step 2: Try TCGdex for missing data or newer sets
    if (!result.price || !result.artist) {
      try {
        const tcgdexData = await this.fetchTCGdexAPI(card.set_id, card.number);
        
        // Extract price if still missing
        if (!result.price) {
          const priceResult = this.extractPriceFromTCGdex(tcgdexData);
          if (priceResult) {
            result.price = priceResult.price;
            result.priceData = priceResult.priceData;
            result.cardmarketData = priceResult.cardmarketData;
            result.source = 'tcgdex (cardmarket)';
          }
        }
        
        // Extract artist if still missing
        if (!result.artist && tcgdexData.illustrator) {
          result.artist = tcgdexData.illustrator;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        // Both APIs failed
      }
    }
    
    return result;
  }
  
  // Get cards needing updates
  async getCardsNeedingUpdate(limit = 100, setId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT id, name, set_id, number, current_value, artist, supertype, updated_at
        FROM cards 
        WHERE (
          (current_value = 0 OR current_value IS NULL) OR
          (artist IS NULL OR artist = '') OR
          updated_at < datetime('now', '-30 days')
        )
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
            WHEN artist IS NULL OR artist = '' THEN 3
            ELSE 4
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
        SET current_value = COALESCE(?, current_value),
            artist = COALESCE(NULLIF(?, ''), artist),
            tcgplayer = COALESCE(?, tcgplayer),
            cardmarket = COALESCE(?, cardmarket),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      this.db.run(
        query,
        [
          price,
          artist,
          tcgplayerData ? JSON.stringify(tcgplayerData) : null,
          cardmarketData ? JSON.stringify(cardmarketData) : null,
          cardId
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
  
  // Update batch of cards
  async updateBatch(cards) {
    console.log(`\n🔄 Processing batch of ${cards.length} cards...\n`);
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const needsPrice = !card.current_value || card.current_value === 0;
      const needsArtist = !card.artist || card.artist === '';
      
      try {
        const result = await this.getCompleteCardData(card);
        
        const hasPrice = result.price && result.price > 0;
        const hasArtist = result.artist && result.artist.trim() !== '';
        
        if (hasPrice || hasArtist) {
          await this.updateCard(
            card.id,
            result.price,
            result.artist,
            result.priceData,
            result.cardmarketData
          );
          
          // Track what was updated
          if (hasPrice && hasArtist) {
            this.bothUpdated++;
            console.log(`   ✅ [${i + 1}/${cards.length}] ${card.name} - $${result.price.toFixed(2)} + Artist: ${result.artist} (${result.source})`);
          } else if (hasPrice) {
            this.pricesUpdated++;
            console.log(`   💰 [${i + 1}/${cards.length}] ${card.name} - $${result.price.toFixed(2)} (${result.source})`);
          } else if (hasArtist) {
            this.artistsUpdated++;
            console.log(`   🎨 [${i + 1}/${cards.length}] ${card.name} - Artist: ${result.artist}`);
          }
        } else {
          this.skipped++;
          const missing = [];
          if (needsPrice) missing.push('price');
          if (needsArtist) missing.push('artist');
          console.log(`   ⚠️  [${i + 1}/${cards.length}] ${card.name} - No ${missing.join(' or ')} available`);
        }
        
        // Rate limiting - be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        this.failed++;
        console.log(`   ❌ [${i + 1}/${cards.length}] ${card.name} - Error: ${error.message}`);
      }
    }
  }
  
  // Update all cards
  async updateAll(batchSize = 50, maxBatches = null) {
    try {
      console.log('🚀 Starting complete data update...\n');
      console.log('📡 Primary source: pokemontcg.io (pricing)');
      console.log('📡 Fallback source: tcgdex.dev (pricing + artists)\n');
      
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
        
        // Longer pause between batches
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
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
      console.log('📡 Primary source: pokemontcg.io (pricing)');
      console.log('📡 Fallback source: tcgdex.dev (pricing + artists)\n');
      
      const cards = await this.getCardsNeedingUpdate(1000, setId);
      
      if (cards.length === 0) {
        console.log('✅ All cards in this set are up to date!');
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
    console.log('📊 Complete Update Summary');
    console.log('═══════════════════════════════════════\n');
    
    console.log(`✅ Price + Artist: ${this.bothUpdated.toLocaleString()} cards`);
    console.log(`💰 Price only: ${this.pricesUpdated.toLocaleString()} cards`);
    console.log(`🎨 Artist only: ${this.artistsUpdated.toLocaleString()} cards`);
    console.log(`⏭️  Skipped: ${this.skipped.toLocaleString()} (no data available)`);
    console.log(`❌ Failed: ${this.failed.toLocaleString()}`);
    
    const totalUpdated = this.bothUpdated + this.pricesUpdated + this.artistsUpdated;
    const total = totalUpdated + this.skipped + this.failed;
    const successRate = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : 0;
    
    console.log(`\n📈 Total updated: ${totalUpdated.toLocaleString()} cards`);
    console.log(`📈 Success rate: ${successRate}%`);
  }
}

// Export
module.exports = CompleteDataUpdater;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const updater = new CompleteDataUpdater();
  
  if (args[0] === 'all') {
    const batchSize = parseInt(args[1]) || 50;
    const maxBatches = args[2] ? parseInt(args[2]) : null;
    
    console.log(`🌐 Updating ALL cards to 100% coverage\n`);
    console.log(`   Batch size: ${batchSize}`);
    if (maxBatches) console.log(`   Max batches: ${maxBatches}`);
    console.log('');
    
    updater.updateAll(batchSize, maxBatches);
    
  } else if (args[0] === 'set' && args[1]) {
    updater.updateSet(args[1]);
    
  } else {
    console.log('Complete Data Updater - Get to 100% Coverage!');
    console.log('Uses pokemontcg.io + tcgdex.dev for complete data\n');
    console.log('Usage:');
    console.log('  node complete_data_updater.js all [batchSize] [maxBatches]');
    console.log('  node complete_data_updater.js set <set-id>');
    console.log('');
    console.log('Examples:');
    console.log('  node complete_data_updater.js all 50 10  - Update 500 cards');
    console.log('  node complete_data_updater.js set sv10   - Update Destined Rivals');
    console.log('  node complete_data_updater.js set me01   - Update Mega Evolution');
    console.log('  node complete_data_updater.js all 100    - Update all missing data');
    process.exit(1);
  }
}










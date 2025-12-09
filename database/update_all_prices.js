const sqlite3 = require('sqlite3').verbose();
const https = require('https');

// Comprehensive price update for all cards
class PriceUpdater {
  constructor() {
    this.db = new sqlite3.Database('./cards.db');
    this.updated = 0;
    this.failed = 0;
    this.skipped = 0;
  }
  
  // Fetch prices from TCGPlayer API via pokemontcg.io proxy
  async fetchPriceData(cardId) {
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
  
  // Get all cards needing price updates
  async getCardsNeedingUpdate(limit = 100) {
    return new Promise((resolve, reject) => {
      // Prioritize cards with no prices or old prices
      const query = `
        SELECT id, name, set_id, current_value, updated_at
        FROM cards 
        WHERE 
          (current_value = 0 OR current_value IS NULL OR updated_at < datetime('now', '-7 days'))
          AND is_digital_only != 1
        ORDER BY 
          CASE 
            WHEN current_value IS NULL THEN 1
            WHEN current_value = 0 THEN 2
            ELSE 3
          END,
          updated_at ASC
        LIMIT ?
      `;
      
      this.db.all(query, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  // Extract market price from TCGPlayer data
  extractPrice(card) {
    if (!card.tcgplayer?.prices) return null;
    
    const prices = card.tcgplayer.prices;
    
    // Priority order for price extraction
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
        return prices[type].market;
      }
    }
    
    return null;
  }
  
  // Update card price in database
  async updateCardPrice(cardId, price, tcgplayerData, cardmarketData) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE cards 
        SET current_value = ?,
            tcgplayer = ?,
            cardmarket = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      this.db.run(
        query,
        [price, JSON.stringify(tcgplayerData), JSON.stringify(cardmarketData), cardId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
  
  // Update prices for a batch of cards
  async updateBatch(cards) {
    console.log(`\n🔄 Processing batch of ${cards.length} cards...`);
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      try {
        // Fetch latest data from API
        const cardData = await this.fetchPriceData(card.id);
        
        if (!cardData) {
          console.log(`   ⏭️  [${i + 1}/${cards.length}] ${card.name} - No data found`);
          this.skipped++;
          continue;
        }
        
        // Extract price
        const price = this.extractPrice(cardData);
        
        if (price && price > 0) {
          // Update in database
          await this.updateCardPrice(
            card.id,
            price,
            cardData.tcgplayer || {},
            cardData.cardmarket || {}
          );
          
          console.log(`   ✅ [${i + 1}/${cards.length}] ${card.name} - $${price.toFixed(2)}`);
          this.updated++;
        } else {
          console.log(`   ⚠️  [${i + 1}/${cards.length}] ${card.name} - No price available`);
          
          // Still update the tcgplayer/cardmarket data even if no price
          await this.updateCardPrice(
            card.id,
            0,
            cardData.tcgplayer || {},
            cardData.cardmarket || {}
          );
          
          this.skipped++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ [${i + 1}/${cards.length}] ${card.name} - Error: ${error.message}`);
        this.failed++;
      }
    }
  }
  
  // Update all cards
  async updateAll(batchSize = 100, maxBatches = null) {
    try {
      console.log('🚀 Starting comprehensive price update...\n');
      
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
        console.log(`\n📦 Batch ${batchCount} - ${cards.length} cards`);
        
        await this.updateBatch(cards);
        
        // Check if we've reached max batches
        if (maxBatches && batchCount >= maxBatches) {
          console.log(`\n⏸️  Reached maximum batch limit (${maxBatches})`);
          hasMore = false;
        }
      }
      
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Error during price update:', error);
    } finally {
      this.db.close();
    }
  }
  
  // Update specific set
  async updateSet(setId) {
    try {
      console.log(`🔄 Updating prices for set: ${setId}\n`);
      
      const cards = await new Promise((resolve, reject) => {
        this.db.all(
          'SELECT id, name, set_id, current_value FROM cards WHERE set_id = ?',
          [setId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      
      if (cards.length === 0) {
        console.log('⚠️  No cards found in this set');
        return;
      }
      
      console.log(`📦 Found ${cards.length} cards in set ${setId}\n`);
      
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
    console.log('📊 Price Update Summary');
    console.log('═══════════════════════════════════════\n');
    
    console.log(`✅ Updated: ${this.updated.toLocaleString()} cards`);
    console.log(`⏭️  Skipped: ${this.skipped.toLocaleString()} cards (no price available)`);
    console.log(`❌ Failed: ${this.failed.toLocaleString()} cards`);
    
    const total = this.updated + this.skipped + this.failed;
    const successRate = total > 0 ? ((this.updated / total) * 100).toFixed(1) : 0;
    
    console.log(`\n📈 Success rate: ${successRate}%`);
  }
}

// Export the class
module.exports = PriceUpdater;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const updater = new PriceUpdater();
  
  if (args[0] === 'all') {
    const batchSize = parseInt(args[1]) || 100;
    const maxBatches = args[2] ? parseInt(args[2]) : null;
    
    console.log(`🌐 Updating ALL cards (batch size: ${batchSize}${maxBatches ? `, max batches: ${maxBatches}` : ''})...\n`);
    updater.updateAll(batchSize, maxBatches);
    
  } else if (args[0] === 'set' && args[1]) {
    console.log(`🎯 Updating set: ${args[1]}\n`);
    updater.updateSet(args[1]);
    
  } else {
    console.log('Usage:');
    console.log('  node update_all_prices.js all [batchSize] [maxBatches]');
    console.log('  node update_all_prices.js set <set-id>');
    console.log('');
    console.log('Examples:');
    console.log('  node update_all_prices.js all 50      - Update all, 50 cards per batch');
    console.log('  node update_all_prices.js all 100 10  - Update 10 batches of 100 cards');
    console.log('  node update_all_prices.js set sv10    - Update only Destined Rivals set');
    process.exit(1);
  }
}





const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const fs = require('fs');

// Price sync service to keep card prices up to date
class PriceSyncService {
  constructor(dbPath = './cards.db') {
    this.db = new sqlite3.Database(dbPath);
    this.apiKey = process.env.TCGPLAYER_API_KEY || 'your-api-key-here';
    this.lastSync = null;
    this.syncInterval = 24 * 60 * 60 * 1000; // 24 hours
  }
  
  // Get cards that need price updates
  async getCardsNeedingUpdate() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, name, set_id, current_value, updated_at
        FROM cards 
        WHERE updated_at < datetime('now', '-24 hours')
        ORDER BY updated_at ASC
        LIMIT 100
      `;
      
      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  // Fetch price data from TCGPlayer API
  async fetchTCGPlayerPrices(cardIds) {
    return new Promise((resolve, reject) => {
      const url = `https://api.tcgplayer.com/pricing/product/${cardIds.join(',')}`;
      
      const options = {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      https.get(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.results || []);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }
  
  // Update card prices in database
  async updateCardPrices(priceData) {
    return new Promise((resolve, reject) => {
      const updateQuery = `
        UPDATE cards 
        SET current_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      let completed = 0;
      const total = priceData.length;
      
      priceData.forEach((price) => {
        const marketPrice = price.marketPrice || price.midPrice || 0;
        
        this.db.run(updateQuery, [marketPrice, price.productId], (err) => {
          if (err) {
            console.error(`❌ Error updating price for card ${price.productId}:`, err);
          } else {
            completed++;
            if (completed === total) {
              resolve();
            }
          }
        });
      });
    });
  }
  
  // Log price changes
  async logPriceChanges(priceData) {
    return new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO price_history (card_id, price, source, updated_at)
        VALUES (?, ?, 'tcgplayer', CURRENT_TIMESTAMP)
      `;
      
      let completed = 0;
      const total = priceData.length;
      
      priceData.forEach((price) => {
        const marketPrice = price.marketPrice || price.midPrice || 0;
        
        this.db.run(insertQuery, [price.productId, marketPrice], (err) => {
          if (err) {
            console.error(`❌ Error logging price for card ${price.productId}:`, err);
          } else {
            completed++;
            if (completed === total) {
              resolve();
            }
          }
        });
      });
    });
  }
  
  // Main sync function
  async syncPrices() {
    try {
      console.log('🔄 Starting price sync...');
      
      // Get cards that need updates
      const cardsToUpdate = await this.getCardsNeedingUpdate();
      
      if (cardsToUpdate.length === 0) {
        console.log('✅ All cards are up to date!');
        return;
      }
      
      console.log(`📊 Found ${cardsToUpdate.length} cards needing price updates`);
      
      // Fetch prices from TCGPlayer
      const cardIds = cardsToUpdate.map(card => card.id);
      const priceData = await this.fetchTCGPlayerPrices(cardIds);
      
      if (priceData.length === 0) {
        console.log('⚠️ No price data received from TCGPlayer');
        return;
      }
      
      console.log(`💰 Received prices for ${priceData.length} cards`);
      
      // Update prices in database
      await this.updateCardPrices(priceData);
      
      // Log price changes
      await this.logPriceChanges(priceData);
      
      console.log('✅ Price sync completed successfully!');
      
      // Update last sync time
      this.lastSync = new Date();
      
    } catch (error) {
      console.error('❌ Error during price sync:', error);
    }
  }
  
  // Start automatic syncing
  startAutoSync() {
    console.log('🚀 Starting automatic price sync service...');
    
    // Run initial sync
    this.syncPrices();
    
    // Set up interval for regular syncing
    setInterval(() => {
      this.syncPrices();
    }, this.syncInterval);
  }
  
  // Stop automatic syncing
  stopAutoSync() {
    console.log('⏹️ Stopping automatic price sync service...');
    // Note: In a real implementation, you'd store the interval ID and clear it
  }
  
  // Get sync status
  getSyncStatus() {
    return {
      lastSync: this.lastSync,
      nextSync: this.lastSync ? new Date(this.lastSync.getTime() + this.syncInterval) : null,
      syncInterval: this.syncInterval
    };
  }
  
  // Close database connection
  close() {
    this.db.close();
  }
}

// Export the service
module.exports = PriceSyncService;

// If run directly, start the sync service
if (require.main === module) {
  const syncService = new PriceSyncService();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down price sync service...');
    syncService.stopAutoSync();
    syncService.close();
    process.exit(0);
  });
  
  // Start the service
  syncService.startAutoSync();
}





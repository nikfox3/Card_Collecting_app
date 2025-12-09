const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Database improvement script
const improveDatabase = () => {
  const db = new sqlite3.Database('./cards.db');
  
  console.log('🔧 Starting database improvements...');
  
  // Create improved schema with better indexing
  const improvements = [
    // Add missing indexes for better performance
    {
      name: 'Add search indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
        CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards(set_id);
        CREATE INDEX IF NOT EXISTS idx_cards_current_value ON cards(current_value);
        CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
        CREATE INDEX IF NOT EXISTS idx_cards_supertype ON cards(supertype);
        CREATE INDEX IF NOT EXISTS idx_cards_number ON cards(number);
        CREATE INDEX IF NOT EXISTS idx_cards_collected ON cards(collected);
        CREATE INDEX IF NOT EXISTS idx_cards_language ON cards(language);
        CREATE INDEX IF NOT EXISTS idx_cards_variant ON cards(variant);
        CREATE INDEX IF NOT EXISTS idx_cards_updated_at ON cards(updated_at);
      `
    },
    
    // Add compound indexes for common queries
    {
      name: 'Add compound indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_cards_search ON cards(name, set_id, rarity);
        CREATE INDEX IF NOT EXISTS idx_cards_collection ON cards(collected, language, variant);
        CREATE INDEX IF NOT EXISTS idx_cards_pricing ON cards(current_value, updated_at);
        CREATE INDEX IF NOT EXISTS idx_cards_set_number ON cards(set_id, number);
      `
    },
    
    // Add full-text search capability
    {
      name: 'Add full-text search',
      sql: `
        CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
          name, 
          set_name, 
          artist, 
          types, 
          subtypes,
          content='cards',
          content_rowid='rowid'
        );
      `
    },
    
    // Add triggers to keep FTS in sync
    {
      name: 'Add FTS triggers',
      sql: `
        CREATE TRIGGER IF NOT EXISTS cards_fts_insert AFTER INSERT ON cards BEGIN
          INSERT INTO cards_fts(rowid, name, set_name, artist, types, subtypes)
          SELECT new.rowid, new.name, 
                 (SELECT name FROM sets WHERE id = new.set_id),
                 new.artist,
                 new.types,
                 new.subtypes;
        END;
        
        CREATE TRIGGER IF NOT EXISTS cards_fts_delete AFTER DELETE ON cards BEGIN
          DELETE FROM cards_fts WHERE rowid = old.rowid;
        END;
        
        CREATE TRIGGER IF NOT EXISTS cards_fts_update AFTER UPDATE ON cards BEGIN
          DELETE FROM cards_fts WHERE rowid = old.rowid;
          INSERT INTO cards_fts(rowid, name, set_name, artist, types, subtypes)
          SELECT new.rowid, new.name,
                 (SELECT name FROM sets WHERE id = new.set_id),
                 new.artist,
                 new.types,
                 new.subtypes;
        END;
      `
    },
    
    // Add price update tracking
    {
      name: 'Add price tracking',
      sql: `
        CREATE TABLE IF NOT EXISTS price_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          card_id VARCHAR(50) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          source VARCHAR(50) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_price_history_card_id ON price_history(card_id);
        CREATE INDEX IF NOT EXISTS idx_price_history_updated_at ON price_history(updated_at);
      `
    },
    
    // Add search analytics
    {
      name: 'Add search analytics',
      sql: `
        CREATE TABLE IF NOT EXISTS search_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT NOT NULL,
          result_count INTEGER NOT NULL,
          search_time_ms INTEGER NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
        CREATE INDEX IF NOT EXISTS idx_search_logs_timestamp ON search_logs(timestamp);
      `
    },
    
    // Add card popularity tracking
    {
      name: 'Add popularity tracking',
      sql: `
        CREATE TABLE IF NOT EXISTS card_popularity (
          card_id VARCHAR(50) PRIMARY KEY,
          view_count INTEGER DEFAULT 0,
          search_count INTEGER DEFAULT 0,
          last_viewed TIMESTAMP,
          last_searched TIMESTAMP
        );
      `
    }
  ];
  
  let completedCount = 0;
  
  const runImprovement = (improvement) => {
    return new Promise((resolve, reject) => {
      console.log(`🔄 ${improvement.name}...`);
      
      db.exec(improvement.sql, (err) => {
        if (err) {
          console.error(`❌ Error in ${improvement.name}:`, err);
          reject(err);
        } else {
          console.log(`✅ ${improvement.name} completed`);
          completedCount++;
          resolve();
        }
      });
    });
  };
  
  // Run all improvements sequentially
  const runAllImprovements = async () => {
    try {
      for (const improvement of improvements) {
        await runImprovement(improvement);
      }
      
      console.log(`\n🎉 Database improvements completed!`);
      console.log(`📊 ${completedCount}/${improvements.length} improvements applied`);
      
      // Run database analysis
      console.log('\n📈 Running database analysis...');
      
      db.get("SELECT COUNT(*) as total_cards FROM cards", (err, row) => {
        if (err) {
          console.error('❌ Error getting card count:', err);
        } else {
          console.log(`📦 Total cards: ${row.total_cards.toLocaleString()}`);
        }
      });
      
      db.get("SELECT COUNT(*) as total_sets FROM sets", (err, row) => {
        if (err) {
          console.error('❌ Error getting set count:', err);
        } else {
          console.log(`📚 Total sets: ${row.total_sets.toLocaleString()}`);
        }
      });
      
      db.get("SELECT COUNT(*) as cards_with_prices FROM cards WHERE current_value > 0", (err, row) => {
        if (err) {
          console.error('❌ Error getting price count:', err);
        } else {
          console.log(`💰 Cards with prices: ${row.cards_with_prices.toLocaleString()}`);
        }
      });
      
      // Show database file size
      const stats = fs.statSync('./cards.db');
      console.log(`💾 Database size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      console.log('\n🚀 Database is now optimized for better performance!');
      
    } catch (error) {
      console.error('❌ Error during improvements:', error);
    } finally {
      db.close();
    }
  };
  
  runAllImprovements();
};

// Run the improvements
improveDatabase();

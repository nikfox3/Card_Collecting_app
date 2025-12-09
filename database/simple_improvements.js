const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Simple database improvements that work with existing structure
const runSimpleImprovements = () => {
  const db = new sqlite3.Database('./cards.db');
  
  console.log('🔧 Running simple database improvements...');
  
  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name)',
    'CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards(set_id)',
    'CREATE INDEX IF NOT EXISTS idx_cards_current_value ON cards(current_value)',
    'CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity)',
    'CREATE INDEX IF NOT EXISTS idx_cards_supertype ON cards(supertype)',
    'CREATE INDEX IF NOT EXISTS idx_cards_number ON cards(number)',
    'CREATE INDEX IF NOT EXISTS idx_cards_collected ON cards(collected)',
    'CREATE INDEX IF NOT EXISTS idx_cards_language ON cards(language)',
    'CREATE INDEX IF NOT EXISTS idx_cards_variant ON cards(variant)',
    'CREATE INDEX IF NOT EXISTS idx_cards_updated_at ON cards(updated_at)',
    'CREATE INDEX IF NOT EXISTS idx_cards_search ON cards(name, set_id, rarity)',
    'CREATE INDEX IF NOT EXISTS idx_cards_collection ON cards(collected, language, variant)',
    'CREATE INDEX IF NOT EXISTS idx_cards_pricing ON cards(current_value, updated_at)',
    'CREATE INDEX IF NOT EXISTS idx_cards_set_number ON cards(set_id, number)'
  ];
  
  let completed = 0;
  const total = indexes.length;
  
  const createIndex = (indexSQL) => {
    return new Promise((resolve, reject) => {
      db.run(indexSQL, (err) => {
        if (err) {
          console.error(`❌ Error creating index:`, err.message);
          reject(err);
        } else {
          completed++;
          console.log(`✅ Index ${completed}/${total} created`);
          resolve();
        }
      });
    });
  };
  
  // Create all indexes
  const createAllIndexes = async () => {
    try {
      for (const indexSQL of indexes) {
        await createIndex(indexSQL);
      }
      
      console.log('\n🎉 All indexes created successfully!');
      
      // Show database statistics
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
      console.log('📈 Search queries should be significantly faster now.');
      
    } catch (error) {
      console.error('❌ Error during improvements:', error);
    } finally {
      db.close();
    }
  };
  
  createAllIndexes();
};

// Run the improvements
runSimpleImprovements();





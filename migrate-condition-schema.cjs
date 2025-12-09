const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔄 MIGRATING DATABASE SCHEMA FOR CONDITION & GRADED PRICING');
console.log('========================================================');

const dbPath = path.resolve(__dirname, './cards.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

async function runMigration() {
  try {
    console.log('\n📊 Step 1: Adding condition price columns to products table...');
    
    // Add condition price columns to products table
    const addConditionColumns = [
      'ALTER TABLE products ADD COLUMN nm_price DECIMAL(10,2)',
      'ALTER TABLE products ADD COLUMN lp_price DECIMAL(10,2)', 
      'ALTER TABLE products ADD COLUMN mp_price DECIMAL(10,2)',
      'ALTER TABLE products ADD COLUMN hp_price DECIMAL(10,2)',
      'ALTER TABLE products ADD COLUMN dmg_price DECIMAL(10,2)',
      'ALTER TABLE products ADD COLUMN condition_last_updated TIMESTAMP',
      'ALTER TABLE products ADD COLUMN graded_last_updated TIMESTAMP'
    ];

    for (const sql of addConditionColumns) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error(`❌ Error adding column: ${err.message}`);
            reject(err);
          } else {
            console.log(`✅ Added column: ${sql.split('ADD COLUMN ')[1]?.split(' ')[0] || 'unknown'}`);
            resolve();
          }
        });
      });
    }

    console.log('\n📊 Step 2: Creating graded_prices table...');
    
    const createGradedPricesTable = `
      CREATE TABLE IF NOT EXISTS graded_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        grading_service TEXT NOT NULL,
        grade TEXT NOT NULL,
        price DECIMAL(10,2),
        market_trend TEXT,
        sales_velocity DECIMAL(10,2),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, grading_service, grade),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      )
    `;

    await new Promise((resolve, reject) => {
      db.run(createGradedPricesTable, (err) => {
        if (err) {
          console.error('❌ Error creating graded_prices table:', err.message);
          reject(err);
        } else {
          console.log('✅ Created graded_prices table');
          resolve();
        }
      });
    });

    console.log('\n📊 Step 3: Updating price_history table for conditions...');
    
    // Add condition and grading columns to price_history
    const updatePriceHistoryColumns = [
      'ALTER TABLE price_history ADD COLUMN condition TEXT DEFAULT "Near Mint"',
      'ALTER TABLE price_history ADD COLUMN grading_service TEXT',
      'ALTER TABLE price_history ADD COLUMN grade TEXT'
    ];

    for (const sql of updatePriceHistoryColumns) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error(`❌ Error updating price_history: ${err.message}`);
            reject(err);
          } else {
            console.log(`✅ Updated price_history: ${sql.split('ADD COLUMN ')[1]?.split(' ')[0] || 'unknown'}`);
            resolve();
          }
        });
      });
    }

    console.log('\n📊 Step 4: Migrating existing market_price to nm_price...');
    
    const migrateMarketPrice = `
      UPDATE products 
      SET nm_price = market_price, 
          condition_last_updated = CURRENT_TIMESTAMP
      WHERE market_price > 0 AND nm_price IS NULL
    `;

    await new Promise((resolve, reject) => {
      db.run(migrateMarketPrice, function(err) {
        if (err) {
          console.error('❌ Error migrating market prices:', err.message);
          reject(err);
        } else {
          console.log(`✅ Migrated ${this.changes} market prices to Near Mint prices`);
          resolve();
        }
      });
    });

    console.log('\n📊 Step 5: Creating indexes for performance...');
    
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_graded_prices_product ON graded_prices(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_graded_prices_service_grade ON graded_prices(grading_service, grade)',
      'CREATE INDEX IF NOT EXISTS idx_price_history_condition ON price_history(condition)',
      'CREATE INDEX IF NOT EXISTS idx_price_history_grading ON price_history(grading_service, grade)'
    ];

    for (const sql of createIndexes) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) {
            console.error(`❌ Error creating index: ${err.message}`);
            reject(err);
          } else {
            console.log(`✅ Created index: ${sql.split('CREATE INDEX IF NOT EXISTS ')[1]?.split(' ')[0] || 'unknown'}`);
            resolve();
          }
        });
      });
    }

    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('✅ Added condition price columns to products table');
    console.log('✅ Created graded_prices table');
    console.log('✅ Updated price_history table for conditions');
    console.log('✅ Migrated existing market_price to nm_price');
    console.log('✅ Created performance indexes');
    console.log('\n💡 Next steps:');
    console.log('   1. Create Pokemon Price Tracker API service');
    console.log('   2. Create condition prices collection script');
    console.log('   3. Start collecting data for high-value cards');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

runMigration();







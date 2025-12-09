const sqlite3 = require('sqlite3').verbose();

// Data cleanup script
const cleanupData = () => {
  const db = new sqlite3.Database('./cards.db');
  
  console.log('🧹 Starting data cleanup...\n');
  
  const cleanups = [
    {
      name: 'Fix supertype inconsistency (Pokemon → Pokémon)',
      sql: `UPDATE cards SET supertype = 'Pokémon' WHERE supertype = 'Pokemon'`,
      validate: `SELECT COUNT(*) as count FROM cards WHERE supertype = 'Pokemon'`
    },
    {
      name: 'Add is_digital_only column',
      sql: `ALTER TABLE cards ADD COLUMN is_digital_only BOOLEAN DEFAULT 0`,
      skipIfExists: true
    },
    {
      name: 'Mark Pokémon TCG Pocket cards as digital-only',
      sql: `UPDATE cards SET is_digital_only = 1 WHERE set_id IN ('A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9')`,
      validate: `SELECT COUNT(*) as count FROM cards WHERE is_digital_only = 1`
    },
    {
      name: 'Add is_prerelease column',
      sql: `ALTER TABLE cards ADD COLUMN is_prerelease BOOLEAN DEFAULT 0`,
      skipIfExists: true
    },
    {
      name: 'Mark future release cards as pre-release',
      sql: `UPDATE cards SET is_prerelease = 1 WHERE set_id IN (SELECT id FROM sets WHERE release_date > date('now'))`,
      validate: `SELECT COUNT(*) as count FROM cards WHERE is_prerelease = 1`
    },
    {
      name: 'Add card_type classification column',
      sql: `ALTER TABLE cards ADD COLUMN card_type VARCHAR(20) DEFAULT 'physical'`,
      skipIfExists: true
    },
    {
      name: 'Set card type based on digital flag',
      sql: `UPDATE cards SET card_type = CASE WHEN is_digital_only = 1 THEN 'digital' WHEN is_prerelease = 1 THEN 'prerelease' ELSE 'physical' END`,
      validate: `SELECT card_type, COUNT(*) as count FROM cards GROUP BY card_type`
    }
  ];
  
  let completedCount = 0;
  
  const runCleanup = (cleanup) => {
    return new Promise((resolve, reject) => {
      console.log(`🔄 ${cleanup.name}...`);
      
      // Check if column exists for ALTER TABLE commands
      if (cleanup.skipIfExists) {
        db.all("PRAGMA table_info(cards)", (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          const columnName = cleanup.sql.match(/ADD COLUMN (\w+)/)?.[1];
          const columnExists = rows.some(row => row.name === columnName);
          
          if (columnExists) {
            console.log(`   ⏭️  Column '${columnName}' already exists, skipping`);
            completedCount++;
            resolve();
            return;
          }
          
          // Column doesn't exist, create it
          db.run(cleanup.sql, (err) => {
            if (err) {
              console.error(`   ❌ Error:`, err.message);
              reject(err);
            } else {
              console.log(`   ✅ Column '${columnName}' added`);
              completedCount++;
              resolve();
            }
          });
        });
      } else {
        // Regular SQL command
        db.run(cleanup.sql, function(err) {
          if (err) {
            console.error(`   ❌ Error:`, err.message);
            reject(err);
          } else {
            console.log(`   ✅ Completed (${this.changes} rows affected)`);
            
            // Run validation query if provided
            if (cleanup.validate) {
              db.all(cleanup.validate, (err, rows) => {
                if (err) {
                  console.error(`   ⚠️  Validation error:`, err.message);
                } else {
                  if (Array.isArray(rows) && rows.length > 1) {
                    console.log(`   📊 Results:`);
                    rows.forEach(row => {
                      console.log(`      - ${Object.values(row).join(': ')}`);
                    });
                  } else {
                    console.log(`   📊 Validation: ${JSON.stringify(rows[0])}`);
                  }
                }
              });
            }
            
            completedCount++;
            resolve();
          }
        });
      }
    });
  };
  
  // Run all cleanups sequentially
  const runAllCleanups = async () => {
    try {
      for (const cleanup of cleanups) {
        await runCleanup(cleanup);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for console output
      }
      
      console.log(`\n🎉 Data cleanup completed!`);
      console.log(`📊 ${completedCount}/${cleanups.length} operations completed\n`);
      
      // Show summary statistics
      console.log('📈 Database Summary:');
      
      db.get("SELECT COUNT(*) as total FROM cards", (err, row) => {
        if (!err) console.log(`   Total cards: ${row.total.toLocaleString()}`);
      });
      
      db.get("SELECT COUNT(*) as physical FROM cards WHERE card_type = 'physical'", (err, row) => {
        if (!err) console.log(`   Physical cards: ${row.physical.toLocaleString()}`);
      });
      
      db.get("SELECT COUNT(*) as digital FROM cards WHERE is_digital_only = 1", (err, row) => {
        if (!err) console.log(`   Digital-only cards: ${row.digital.toLocaleString()}`);
      });
      
      db.get("SELECT COUNT(*) as prerelease FROM cards WHERE is_prerelease = 1", (err, row) => {
        if (!err) console.log(`   Pre-release cards: ${row.prerelease.toLocaleString()}`);
      });
      
      db.get("SELECT COUNT(*) as with_prices FROM cards WHERE current_value > 0", (err, row) => {
        if (!err) console.log(`   Cards with prices: ${row.with_prices.toLocaleString()}`);
      });
      
      console.log('\n✨ Your database is now cleaner and better organized!');
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    } finally {
      setTimeout(() => db.close(), 500); // Give time for queries to complete
    }
  };
  
  runAllCleanups();
};

// Run the cleanup
cleanupData();





const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/cards_backup_20251002_182725.db');

console.log('🔧 Fix Set Release Dates Script');
console.log('📊 Database:', DB_PATH);
console.log('');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Fix release dates for sets that have cards but no release date
function fixSetReleaseDates() {
  return new Promise((resolve, reject) => {
    // Find sets that have cards but no release date, and find corresponding sets with release dates
    db.all(`
      SELECT 
        sets_with_cards.id as set_with_cards_id,
        sets_with_cards.name as set_name,
        sets_with_dates.id as set_with_dates_id,
        sets_with_dates.release_date
      FROM (
        SELECT DISTINCT s.id, s.name
        FROM sets s
        JOIN cards c ON s.id = c.set_id
        WHERE s.release_date IS NULL OR s.release_date = ''
      ) sets_with_cards
      JOIN (
        SELECT DISTINCT s.id, s.name, s.release_date
        FROM sets s
        WHERE s.release_date IS NOT NULL AND s.release_date != ''
      ) sets_with_dates ON sets_with_cards.name = sets_with_dates.name
      WHERE sets_with_cards.id != sets_with_dates.id
    `, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`📦 Found ${results.length} sets to update`);
      
      if (results.length === 0) {
        console.log('✅ No sets need updating');
        resolve();
        return;
      }
      
      let updatedCount = 0;
      let errorCount = 0;
      
      // Update each set
      const updatePromises = results.map(result => {
        return new Promise((resolveUpdate) => {
          console.log(`📝 Updating ${result.set_name}: ${result.set_with_cards_id} -> ${result.release_date}`);
          
          db.run(
            'UPDATE sets SET release_date = ? WHERE id = ?',
            [result.release_date, result.set_with_cards_id],
            function(err) {
              if (err) {
                console.error(`❌ Error updating ${result.set_name}:`, err);
                errorCount++;
              } else {
                updatedCount++;
              }
              resolveUpdate();
            }
          );
        });
      });
      
      Promise.all(updatePromises).then(() => {
        console.log('');
        console.log('✅ Set release dates fixed!');
        console.log(`   📝 Updated: ${updatedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        resolve({ updatedCount, errorCount });
      });
    });
  });
}

// Run the fix
fixSetReleaseDates()
  .then(() => {
    console.log('');
    console.log('🎉 All done!');
    db.close();
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    db.close();
    process.exit(1);
  });










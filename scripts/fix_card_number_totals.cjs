const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/cards_backup_20251002_182725.db');

console.log('🔧 Fix Card Number Totals Script');
console.log('📊 Database:', DB_PATH);
console.log('');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Fix card numbers that have "???" by looking up the correct total from sets
function fixCardNumberTotals() {
  return new Promise((resolve, reject) => {
    // Get all cards with "???" in their numbers
    db.all(`
      SELECT c.id, c.number, c.set_id, s.printed_total, s.total 
      FROM cards c 
      LEFT JOIN sets s ON c.set_id = s.id 
      WHERE c.number LIKE '%???%'
    `, (err, cards) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`📦 Found ${cards.length} cards with "???" to fix`);
      
      let updatedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      // Process each card
      const updatePromises = cards.map(card => {
        return new Promise((resolveCard) => {
          const originalNumber = card.number;
          
          // Extract the card number part (before /)
          const cardNum = originalNumber.split('/')[0];
          
          // Use printed_total if available, otherwise use total
          const total = card.printed_total || card.total;
          
          if (!total) {
            console.log(`⚠️  No total found for set ${card.set_id}, skipping ${originalNumber}`);
            skippedCount++;
            resolveCard();
            return;
          }
          
          const newNumber = `${cardNum}/${total.toString().padStart(3, '0')}`;
          
          // Skip if already correct
          if (originalNumber === newNumber) {
            skippedCount++;
            resolveCard();
            return;
          }
          
          // Update the card number
          db.run(
            'UPDATE cards SET number = ? WHERE id = ?',
            [newNumber, card.id],
            function(err) {
              if (err) {
                console.error(`❌ Error updating ${card.id}:`, err);
                errorCount++;
              } else {
                updatedCount++;
                if (updatedCount % 1000 === 0) {
                  console.log(`📝 Updated ${updatedCount} cards so far...`);
                }
              }
              resolveCard();
            }
          );
        });
      });
      
      Promise.all(updatePromises).then(() => {
        console.log('');
        console.log('✅ Card number totals fixed!');
        console.log(`   📝 Updated: ${updatedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        resolve({ updatedCount, skippedCount, errorCount });
      });
    });
  });
}

// Run the fix
fixCardNumberTotals()
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










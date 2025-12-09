const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/cards_backup_20251002_182725.db');

console.log('🔧 Card Number Standardization Script');
console.log('📊 Database:', DB_PATH);
console.log('');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Standardize card numbers to XXX/YYY format
function standardizeCardNumbers() {
  return new Promise((resolve, reject) => {
    // Get all cards with non-standard numbers
    db.all(`SELECT id, number FROM cards WHERE number IS NOT NULL AND number != ''`, (err, cards) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`📦 Found ${cards.length} cards to check`);
      
      let updatedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      // Process each card
      const updatePromises = cards.map(card => {
        return new Promise((resolveCard) => {
          const originalNumber = card.number;
          const standardized = standardizeNumber(originalNumber);
          
          // Skip if already in correct format
          if (originalNumber === standardized) {
            skippedCount++;
            resolveCard();
            return;
          }
          
          // Update the card number
          db.run(
            'UPDATE cards SET number = ? WHERE id = ?',
            [standardized, card.id],
            (err) => {
              if (err) {
                console.error(`❌ Error updating ${card.id}: ${err.message}`);
                errorCount++;
              } else {
                updatedCount++;
                if (updatedCount % 100 === 0) {
                  console.log(`  ⏳ Progress: ${updatedCount} updated...`);
                }
              }
              resolveCard();
            }
          );
        });
      });
      
      Promise.all(updatePromises).then(() => {
        console.log('');
        console.log('✅ Standardization complete!');
        console.log(`   📝 Updated: ${updatedCount}`);
        console.log(`   ⏭️  Skipped (already correct): ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        resolve({ updatedCount, skippedCount, errorCount });
      });
    });
  });
}

// Standardize a card number to XXX/YYY format
function standardizeNumber(number) {
  if (!number) return number;
  
  // Remove any whitespace
  number = number.trim();
  
  // If already in XXX/YYY format with proper padding, return as-is
  const standardMatch = number.match(/^(\d{3})\/(\d{3})$/);
  if (standardMatch) return number;
  
  // Extract numbers from various formats
  // Formats: "1/162", "001/162", "SV001/162", "SWSH001", etc.
  const match = number.match(/(\d+)\/(\d+)/);
  
  if (match) {
    const cardNum = match[1];
    const totalNum = match[2];
    
    // Pad to 3 digits
    const paddedCard = cardNum.padStart(3, '0');
    const paddedTotal = totalNum.padStart(3, '0');
    
    return `${paddedCard}/${paddedTotal}`;
  }
  
  // If no slash found, try to parse single number formats
  const singleMatch = number.match(/(\d+)/);
  if (singleMatch) {
    const cardNum = singleMatch[1].padStart(3, '0');
    return `${cardNum}/???`; // Unknown total, will need manual review
  }
  
  // If we can't parse it, return original
  return number;
}

// Run the script
console.log('🚀 Starting card number standardization...');
console.log('');

standardizeCardNumbers()
  .then(results => {
    console.log('');
    console.log('🎉 All done!');
    db.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    db.close();
    process.exit(1);
  });











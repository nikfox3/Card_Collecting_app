const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

// Database connection
const db = new sqlite3.Database('cards.db');

// Function to parse CSV data and update database
async function importPricingData() {
  console.log('🚀 Starting pricing data import...');
  
  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('price-updates-2025-10-15.csv')
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Extract data from CSV row
          const cardId = row['card_id'];
          const cardName = row['card_name'];
          const setName = row['set_name'];
          const newPrice = parseFloat(row['new_price']) || 0;
          
          // Use the new price as the current value
          const currentValue = newPrice;
          
          // Skip if no valid price
          if (!currentValue || currentValue <= 0) {
            return;
          }
          
          // First, archive the current price to history (if it exists and is different)
          const archiveQuery = `
            INSERT OR IGNORE INTO price_history (product_id, date, price, volume)
            SELECT id, '2025-10-14', current_value, 0
            FROM cards 
            WHERE id = ? AND current_value > 0 AND current_value != ?
          `;
          
          db.run(archiveQuery, [cardId, currentValue], function(err) {
            if (err) {
              console.error(`❌ Error archiving price for ${cardId}:`, err.message);
            }
          });
          
          // Add new price to history
          const historyQuery = `
            INSERT OR REPLACE INTO price_history (product_id, date, price, volume)
            VALUES (?, '2025-10-15', ?, 0)
          `;
          
          db.run(historyQuery, [cardId, currentValue], function(err) {
            if (err) {
              console.error(`❌ Error adding price history for ${cardId}:`, err.message);
            }
          });
          
          // Update the card in database
          const updateQuery = `
            UPDATE cards 
            SET 
              current_value = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          
          db.run(updateQuery, [
            currentValue,
            cardId
          ], function(err) {
            if (err) {
              console.error(`❌ Error updating card ${cardId}:`, err.message);
              errorCount++;
            } else if (this.changes > 0) {
              updatedCount++;
              if (updatedCount % 1000 === 0) {
                console.log(`📊 Updated ${updatedCount} cards so far...`);
              }
            }
          });
          
          processedCount++;
          
        } catch (error) {
          console.error(`❌ Error processing row:`, error);
          errorCount++;
        }
      })
      .on('end', () => {
        console.log('\n✅ Pricing data import completed!');
        console.log(`📊 Total cards processed: ${processedCount}`);
        console.log(`✅ Cards updated: ${updatedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        
        // Create summary report
        db.get(`
          SELECT 
            COUNT(*) as total_cards,
            COUNT(CASE WHEN current_value IS NOT NULL AND current_value > 0 THEN 1 END) as cards_with_pricing,
            AVG(CASE WHEN current_value > 0 THEN current_value END) as avg_price,
            MAX(current_value) as max_price
          FROM cards
        `, (err, row) => {
          if (err) {
            console.error('❌ Error getting summary:', err);
          } else {
            console.log('\n📈 Database Summary:');
            console.log(`   Total cards: ${row.total_cards}`);
            console.log(`   Cards with pricing: ${row.cards_with_pricing}`);
            console.log(`   Average price: $${row.avg_price?.toFixed(2) || 'N/A'}`);
            console.log(`   Highest price: $${row.max_price?.toFixed(2) || 'N/A'}`);
          }
          
          // Get price history statistics
          db.get(`
            SELECT 
              COUNT(*) as total_history_records,
              COUNT(DISTINCT product_id) as unique_cards_with_history,
              COUNT(CASE WHEN date = '2025-10-15' THEN 1 END) as oct15_records
            FROM price_history
          `, (err, historyStats) => {
            if (err) {
              console.error('❌ Error getting price history statistics:', err);
            } else {
              console.log('\n📊 Price History Summary:');
              console.log(`   Total history records: ${historyStats.total_history_records}`);
              console.log(`   Cards with history: ${historyStats.unique_cards_with_history}`);
              console.log(`   Oct 15 records: ${historyStats.oct15_records}`);
            }
            
            db.close((err) => {
              if (err) {
                console.error('❌ Error closing database:', err);
                reject(err);
              } else {
                console.log('\n🎉 Import completed successfully!');
                resolve();
              }
            });
          });
        });
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Run the import
importPricingData()
  .then(() => {
    console.log('✅ Pricing data import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });



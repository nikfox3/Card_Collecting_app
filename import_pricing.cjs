const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

console.log('🚀 Starting pricing data import...');

// Database connection
const db = new sqlite3.Database('./database/cards_backup_20251002_182725.db', (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

let processedCount = 0;
let updatedCount = 0;
let errorCount = 0;

// Test database connection first
db.get("SELECT COUNT(*) as count FROM cards", (err, row) => {
  if (err) {
    console.error('❌ Error testing database:', err.message);
    db.close();
    process.exit(1);
  }
  console.log(`📊 Database has ${row.count} cards`);
  
  // Start processing CSV
  fs.createReadStream('./database/pokemon-card-prices.csv')
    .pipe(csv())
    .on('data', (row) => {
      try {
        // Extract data from CSV row
        const cardId = row['Card ID'];
        const cardName = row['Card Name'];
        
        // TCGPlayer pricing data
        const tcgplayerNormal = {
          market: parseFloat(row['TCGPlayer Market (Normal)']) || null,
          low: parseFloat(row['TCGPlayer Low (Normal)']) || null,
          high: parseFloat(row['TCGPlayer High (Normal)']) || null
        };
        
        const tcgplayerHolofoil = {
          market: parseFloat(row['TCGPlayer Market (Holofoil)']) || null,
          low: parseFloat(row['TCGPlayer Low (Holofoil)']) || null,
          high: parseFloat(row['TCGPlayer High (Holofoil)']) || null
        };
        
        // Cardmarket pricing data
        const cardmarket = {
          average: parseFloat(row['Cardmarket Average']) || null,
          low: parseFloat(row['Cardmarket Low']) || null,
          trend: parseFloat(row['Cardmarket Trend']) || null
        };
        
        // Determine best current value (prioritize TCGPlayer Market Normal, then Holofoil, then Cardmarket)
        let currentValue = null;
        if (tcgplayerNormal.market && tcgplayerNormal.market > 0) {
          currentValue = tcgplayerNormal.market;
        } else if (tcgplayerHolofoil.market && tcgplayerHolofoil.market > 0) {
          currentValue = tcgplayerHolofoil.market;
        } else if (cardmarket.average && cardmarket.average > 0) {
          currentValue = cardmarket.average;
        }
        
        // Prepare TCGPlayer JSON data
        const tcgplayerData = {
          normal: tcgplayerNormal,
          holofoil: tcgplayerHolofoil,
          url: `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodeURIComponent(cardName)}`
        };
        
        // Update the card in database
        const updateQuery = `
          UPDATE cards 
          SET 
            current_value = ?,
            tcgplayer = ?,
            cardmarket = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        
        db.run(updateQuery, [
          currentValue,
          JSON.stringify(tcgplayerData),
          JSON.stringify(cardmarket),
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
        
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err);
          } else {
            console.log('\n🎉 Import completed successfully!');
          }
        });
      });
    })
    .on('error', (error) => {
      console.error('❌ Error reading CSV file:', error);
      db.close();
    });
});

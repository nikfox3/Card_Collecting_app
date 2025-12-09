const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

console.log('🚀 Importing pricing data (triggers disabled)...');

// Database connection
const db = new sqlite3.Database('./database/cards_backup_20251002_182725.db', (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Step 1: Drop ALL triggers
console.log('🔧 Dropping all triggers temporarily...');
db.serialize(() => {
  db.run("DROP TRIGGER IF EXISTS cards_ai");
  db.run("DROP TRIGGER IF EXISTS cards_au");
  db.run("DROP TRIGGER IF EXISTS cards_ad", (err) => {
    if (err) {
      console.error('❌ Error dropping triggers:', err.message);
      db.close();
      process.exit(1);
    }
    console.log('✅ All triggers dropped');
    
    // Step 2: Run the import
    importPricingData();
  });
});

function importPricingData() {
  let processedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  db.get("SELECT COUNT(*) as count FROM cards", (err, row) => {
    if (err) {
      console.error('❌ Error testing database:', err.message);
      db.close();
      process.exit(1);
    }
    console.log(`\n📊 Database has ${row.count} cards`);
    console.log('🔄 Starting pricing import...\n');
    
    // Prepare the update statement once
    const updateStmt = db.prepare(`
      UPDATE cards 
      SET 
        current_value = ?,
        tcgplayer = ?,
        cardmarket = ?
      WHERE id = ?
    `);
    
    // Start processing CSV
    fs.createReadStream('./database/pokemon-card-prices.csv')
      .pipe(csv())
      .on('data', (row) => {
        try {
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
          
          // Determine best current value
          let currentValue = null;
          if (tcgplayerNormal.market && tcgplayerNormal.market > 0) {
            currentValue = tcgplayerNormal.market;
          } else if (tcgplayerHolofoil.market && tcgplayerHolofoil.market > 0) {
            currentValue = tcgplayerHolofoil.market;
          } else if (cardmarket.average && cardmarket.average > 0) {
            currentValue = cardmarket.average;
          }
          
          // Skip if no pricing data
          if (!currentValue) {
            skippedCount++;
            processedCount++;
            return;
          }
          
          // Prepare TCGPlayer JSON data
          const tcgplayerData = {
            normal: tcgplayerNormal,
            holofoil: tcgplayerHolofoil,
            url: `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodeURIComponent(cardName)}`
          };
          
          // Update the card in database
          updateStmt.run(
            currentValue,
            JSON.stringify(tcgplayerData),
            JSON.stringify(cardmarket),
            cardId,
            function(err) {
              if (err) {
                console.error(`❌ Error updating card ${cardId}:`, err.message);
                errorCount++;
              } else if (this.changes > 0) {
                updatedCount++;
                if (updatedCount % 2000 === 0) {
                  console.log(`📊 Updated ${updatedCount} cards so far...`);
                }
              }
            }
          );
          
          processedCount++;
          
        } catch (error) {
          console.error(`❌ Error processing row:`, error);
          errorCount++;
        }
      })
      .on('end', () => {
        // Finalize the prepared statement
        updateStmt.finalize();
        
        // Wait for all updates to complete
        setTimeout(() => {
          console.log('\n✅ Pricing data import completed!');
          console.log(`📊 Total cards processed: ${processedCount}`);
          console.log(`✅ Cards updated: ${updatedCount}`);
          console.log(`⏭️  Cards skipped (no pricing): ${skippedCount}`);
          console.log(`❌ Errors: ${errorCount}`);
          
          // Recreate the triggers
          console.log('\n🔧 Recreating triggers...');
          
          db.run(`
            CREATE TRIGGER cards_ai AFTER INSERT ON cards BEGIN
              INSERT INTO cards_fts(rowid, name, set_name, rarity, types)
              VALUES (new.rowid, new.name, 
                      COALESCE((SELECT name FROM sets WHERE id = new.set_id), ''),
                      new.rarity, new.types);
            END;
          `, (err) => {
            if (err) console.error('❌ Error creating cards_ai:', err.message);
          });
          
          db.run(`
            CREATE TRIGGER cards_au AFTER UPDATE ON cards BEGIN
              UPDATE cards_fts SET 
                name = new.name,
                set_name = COALESCE((SELECT name FROM sets WHERE id = new.set_id), ''),
                rarity = new.rarity,
                types = new.types
              WHERE rowid = new.rowid;
            END;
          `, (err) => {
            if (err) console.error('❌ Error creating cards_au:', err.message);
          });
          
          db.run(`
            CREATE TRIGGER cards_ad AFTER DELETE ON cards BEGIN
              DELETE FROM cards_fts WHERE rowid = old.rowid;
            END;
          `, (err) => {
            if (err) {
              console.error('❌ Error creating cards_ad:', err.message);
            } else {
              console.log('✅ Triggers recreated');
            }
            
            // Create summary report
            db.get(`
              SELECT 
                COUNT(*) as total_cards,
                COUNT(CASE WHEN current_value IS NOT NULL AND current_value > 0 THEN 1 END) as cards_with_pricing,
                AVG(CASE WHEN current_value > 0 THEN current_value END) as avg_price,
                MAX(current_value) as max_price,
                MIN(CASE WHEN current_value > 0 THEN current_value END) as min_price
              FROM cards
            `, (err, row) => {
              if (err) {
                console.error('❌ Error getting summary:', err);
              } else {
                console.log('\n📈 Database Summary:');
                console.log(`   Total cards: ${row.total_cards}`);
                console.log(`   Cards with pricing: ${row.cards_with_pricing}`);
                console.log(`   Pricing coverage: ${((row.cards_with_pricing / row.total_cards) * 100).toFixed(1)}%`);
                console.log(`   Average price: $${row.avg_price?.toFixed(2) || 'N/A'}`);
                console.log(`   Min price: $${row.min_price?.toFixed(2) || 'N/A'}`);
                console.log(`   Max price: $${row.max_price?.toFixed(2) || 'N/A'}`);
              }
              
              db.close((err) => {
                if (err) {
                  console.error('❌ Error closing database:', err);
                } else {
                  console.log('\n🎉 Import completed successfully!');
                }
              });
            });
          });
        }, 3000); // Wait 3 seconds for async operations
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
        updateStmt.finalize();
        db.close();
      });
  });
}











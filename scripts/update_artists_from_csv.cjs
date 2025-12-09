const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/cards_backup_20251002_182725.db');
const CSV_PATH = path.join(__dirname, '../public/Pokemon database files/pokemon_Final_Master_List_Illustrators.csv');

console.log('🎨 Artist Update Script from CSV');
console.log('📊 Database:', DB_PATH);
console.log('📄 CSV File:', CSV_PATH);
console.log('');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Update artists from CSV data
function updateArtistsFromCSV() {
  return new Promise((resolve, reject) => {
    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    console.log('🔄 Starting artist update from CSV...\n');
    
    // Prepare the update statement
    const updateStmt = db.prepare('UPDATE cards SET artist = ? WHERE id = ?');
    
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const csvId = row.id;
          const cardName = row.card_name;
          const setName = row.set;
          const setNum = row.set_num;
          const artist = row.artist;
          
          if (!csvId || !cardName || !artist) {
            skippedCount++;
            processedCount++;
            return;
          }
          
          // Try to find matching card in database by multiple methods
          findMatchingCard(csvId, cardName, setName, setNum)
            .then(matchingCard => {
              if (matchingCard) {
                // Check if artist is already set and different
                if (matchingCard.artist !== artist) {
                  updateStmt.run(artist, matchingCard.id, function(err) {
                    if (err) {
                      console.error(`❌ Error updating ${matchingCard.id}:`, err.message);
                      errorCount++;
                    } else {
                      updatedCount++;
                      if (updatedCount % 1000 === 0) {
                        console.log(`📝 Updated ${updatedCount} artists so far...`);
                      }
                    }
                  });
                } else {
                  skippedCount++;
                }
              } else {
                skippedCount++;
              }
              
              processedCount++;
            })
            .catch(error => {
              console.error(`❌ Error processing ${csvId}:`, error);
              errorCount++;
              processedCount++;
            });
          
        } catch (error) {
          console.error(`❌ Error processing row:`, error);
          errorCount++;
          processedCount++;
        }
      })
      .on('end', () => {
        // Finalize the prepared statement
        updateStmt.finalize();
        
        // Wait for all async operations to complete
        setTimeout(() => {
          console.log('\n✅ Artist update completed!');
          console.log(`📊 Total records processed: ${processedCount}`);
          console.log(`🎨 Artists updated: ${updatedCount}`);
          console.log(`⏭️  Records skipped: ${skippedCount}`);
          console.log(`❌ Errors: ${errorCount}`);
          
          // Create summary report
          db.get(`
            SELECT 
              COUNT(*) as total_cards,
              COUNT(CASE WHEN artist IS NOT NULL AND artist != '' THEN 1 END) as cards_with_artist,
              COUNT(DISTINCT artist) as unique_artists
            FROM cards
          `, (err, row) => {
            if (err) {
              console.error('❌ Error getting summary:', err);
            } else {
              console.log('\n📈 Database Summary:');
              console.log(`   Total cards: ${row.total_cards}`);
              console.log(`   Cards with artist info: ${row.cards_with_artist}`);
              console.log(`   Artist coverage: ${((row.cards_with_artist / row.total_cards) * 100).toFixed(1)}%`);
              console.log(`   Unique artists: ${row.unique_artists}`);
            }
            
            db.close((err) => {
              if (err) {
                console.error('❌ Error closing database:', err);
              } else {
                console.log('\n🎉 All done!');
              }
            });
          });
        }, 5000); // Wait 5 seconds for async operations
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
        updateStmt.finalize();
        db.close();
      });
  });
}

// Find matching card in database using multiple strategies
function findMatchingCard(csvId, cardName, setName, setNum) {
  return new Promise((resolve) => {
    // Strategy 1: Try direct ID match (handle different ID formats)
    let dbQuery = `
      SELECT id, name, artist FROM cards 
      WHERE id = ? OR id LIKE ?
    `;
    
    // Convert CSV ID format to potential database formats
    const idVariations = generateIdVariations(csvId, setName);
    
    db.get(dbQuery, [csvId, ...idVariations], (err, card) => {
      if (err) {
        resolve(null);
        return;
      }
      
      if (card) {
        resolve(card);
        return;
      }
      
      // Strategy 2: Match by set name + card name + number
      const paddedSetNum = setNum.padStart(3, '0');
      db.get(`
        SELECT c.id, c.name, c.artist 
        FROM cards c 
        JOIN sets s ON c.set_id = s.id 
        WHERE s.name = ? AND c.name = ? AND c.number LIKE ?
      `, [setName, cardName, `%${paddedSetNum}%`], (err, card) => {
        if (err || !card) {
          resolve(null);
        } else {
          resolve(card);
        }
      });
    });
  });
}

// Generate possible ID variations for matching
function generateIdVariations(csvId, setName) {
  const variations = [];
  
  // Extract set prefix and number from CSV ID (e.g., "rsv10pt5-163" -> "rsv10pt5", "163")
  const parts = csvId.split('-');
  if (parts.length === 2) {
    const setPrefix = parts[0];
    const cardNum = parts[1];
    
    // Common ID format mappings
    const setMappings = {
      'rsv10pt5': ['sv10.5w'],  // White Flare
      'zsv10pt5': ['sv10.5b'],  // Black Bolt  
      'sv9': ['sv09'],          // Journey Together
      'me01': ['me01'],         // Mega Evolution
      'sv10': ['sv10'],         // Destined Rivals
    };
    
    // Generate variations based on mappings
    Object.entries(setMappings).forEach(([csvPrefix, dbPrefixes]) => {
      if (setPrefix === csvPrefix) {
        dbPrefixes.forEach(dbPrefix => {
          variations.push(`${dbPrefix}-${cardNum.padStart(3, '0')}`);
        });
      }
    });
  }
  
  return variations;
}

// Run the update
updateArtistsFromCSV()
  .then(() => {
    console.log('🎨 Artist update completed successfully!');
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    db.close();
    process.exit(1);
  });










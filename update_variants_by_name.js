import pkg from 'sqlite3';
const { Database } = pkg;
import csv from 'csv-parser';
import fs from 'fs';

// Database path
const dbPath = './database/cards.db';

// CSV file path
const csvPath = './public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv';

async function updateVariantsByName() {
  return new Promise((resolve, reject) => {
    const db = new Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to database');
    });

    const cards = [];
    let processed = 0;
    let updated = 0;

    console.log('Reading CSV file...');
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Only process rows that have a name
        if (row.name) {
          const variant_normal = row.variant_normal === 'True' || row.variant_normal === '1.0' || row.variant_normal === 1.0 || row.variant_normal === 'true' || row.variant_normal === true;
          const variant_reverse = row.variant_reverse === 'True' || row.variant_reverse === '1.0' || row.variant_reverse === 1.0 || row.variant_reverse === 'true' || row.variant_reverse === true;
          const variant_holo = row.variant_holo === 'True' || row.variant_holo === '1.0' || row.variant_holo === 1.0 || row.variant_holo === 'true' || row.variant_holo === true;
          const variant_first_edition = row.variant_first_edition === 'True' || row.variant_first_edition === '1.0' || row.variant_first_edition === 1.0 || row.variant_first_edition === 'true' || row.variant_first_edition === true;
          
          
          cards.push({
            name: row.name,
            variant_normal: variant_normal,
            variant_reverse: variant_reverse,
            variant_holo: variant_holo,
            variant_first_edition: variant_first_edition
          });
        }
      })
      .on('end', () => {
        console.log(`Read ${cards.length} cards from CSV with variant data`);
        console.log('Updating database with variant data by name...');
        
        // Update each card with variant data by name
        const updateSQL = `
          UPDATE cards 
          SET variant_normal = ?, 
              variant_reverse = ?, 
              variant_holo = ?, 
              variant_first_edition = ?
          WHERE name = ?
        `;
        
        let completed = 0;
        
        cards.forEach((card) => {
          db.run(updateSQL, [
            card.variant_normal ? 1 : 0,
            card.variant_reverse ? 1 : 0,
            card.variant_holo ? 1 : 0,
            card.variant_first_edition ? 1 : 0,
            card.name
          ], function(err) {
            if (err) {
              console.error(`Error updating card ${card.name}:`, err.message);
            } else if (this.changes > 0) {
              updated++;
              console.log(`Updated ${card.name}: Normal=${card.variant_normal}, Reverse=${card.variant_reverse}, Holo=${card.variant_holo}, 1stEd=${card.variant_first_edition}`);
            }
            
            completed++;
            
            if (completed % 1000 === 0) {
              console.log(`Processed ${completed}/${cards.length} cards...`);
            }
            
            if (completed === cards.length) {
              console.log(`\nCompleted! Updated ${updated} cards with variant data.`);
              db.close((err) => {
                if (err) {
                  console.error('Error closing database:', err);
                  reject(err);
                } else {
                  console.log('Database connection closed.');
                  resolve();
                }
              });
            }
          });
        });
      })
      .on('error', (err) => {
        console.error('Error reading CSV:', err);
        reject(err);
      });
  });
}

// Run the update
updateVariantsByName()
  .then(() => {
    console.log('Variant update by name completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Variant update by name failed:', err);
    process.exit(1);
  });

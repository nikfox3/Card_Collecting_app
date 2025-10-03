import pkg from 'sqlite3';
const { Database } = pkg;
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';

// Database path
const dbPath = './database/cards.db';

// CSV file path
const csvPath = './public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv';

async function updateDatabaseWithVariants() {
  return new Promise((resolve, reject) => {
    const db = new Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to database');
    });

    // First, add the variant boolean columns to the database
    const addColumnsSQL = `
      ALTER TABLE cards ADD COLUMN variant_normal BOOLEAN DEFAULT 0;
      ALTER TABLE cards ADD COLUMN variant_reverse BOOLEAN DEFAULT 0;
      ALTER TABLE cards ADD COLUMN variant_holo BOOLEAN DEFAULT 0;
      ALTER TABLE cards ADD COLUMN variant_first_edition BOOLEAN DEFAULT 0;
    `;

    console.log('Adding variant columns to database...');
    
    // Execute each ALTER TABLE statement
    const statements = addColumnsSQL.split(';').filter(stmt => stmt.trim());
    let completed = 0;
    
    statements.forEach((stmt, index) => {
      db.run(stmt.trim(), (err) => {
        if (err) {
          // Column might already exist, which is fine
          if (err.message.includes('duplicate column name')) {
            console.log(`Column already exists (${index + 1}/${statements.length})`);
          } else {
            console.error(`Error adding column ${index + 1}:`, err.message);
          }
        } else {
          console.log(`Added column ${index + 1}/${statements.length}`);
        }
        
        completed++;
        if (completed === statements.length) {
          console.log('All columns added. Starting CSV import...');
          importVariantData(db, resolve, reject);
        }
      });
    });
  });
}

function importVariantData(db, resolve, reject) {
  const cards = [];
  let processed = 0;
  let updated = 0;

  console.log('Reading CSV file...');
  
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      // Only process rows that have an ID (to match existing cards)
      if (row.id) {
        cards.push({
          id: row.id,
          variant_normal: row.variant_normal === 'true' || row.variant_normal === true,
          variant_reverse: row.variant_reverse === 'true' || row.variant_reverse === true,
          variant_holo: row.variant_holo === 'true' || row.variant_holo === true,
          variant_first_edition: row.variant_first_edition === 'true' || row.variant_first_edition === true
        });
      }
    })
    .on('end', () => {
      console.log(`Read ${cards.length} cards from CSV`);
      console.log('Updating database with variant data...');
      
      // Update each card with variant data
      const updateSQL = `
        UPDATE cards 
        SET variant_normal = ?, 
            variant_reverse = ?, 
            variant_holo = ?, 
            variant_first_edition = ?
        WHERE id = ?
      `;
      
      let completed = 0;
      
      cards.forEach((card) => {
        db.run(updateSQL, [
          card.variant_normal ? 1 : 0,
          card.variant_reverse ? 1 : 0,
          card.variant_holo ? 1 : 0,
          card.variant_first_edition ? 1 : 0,
          card.id
        ], function(err) {
          if (err) {
            console.error(`Error updating card ${card.id}:`, err.message);
          } else if (this.changes > 0) {
            updated++;
          }
          
          processed++;
          
          if (processed % 1000 === 0) {
            console.log(`Processed ${processed}/${cards.length} cards...`);
          }
          
          if (processed === cards.length) {
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
}

// Run the update
updateDatabaseWithVariants()
  .then(() => {
    console.log('Variant update completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Variant update failed:', err);
    process.exit(1);
  });

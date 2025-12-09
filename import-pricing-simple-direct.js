import fs from 'fs';
import csv from 'csv-parser';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'cards.db');
const db = new sqlite3.Database(dbPath);

const pricingFiles = [
  { file: join(__dirname, 'Pricing Data', 'pokemon-prices-2025-10-16.csv'), date: '2025-10-16' },
  { file: join(__dirname, 'Pricing Data', 'pokemon-prices-2025-10-18.csv'), date: '2025-10-18' },
  { file: join(__dirname, 'Pricing Data', 'pokemon-prices-2025-10-21.csv'), date: '2025-10-21' },
  { file: join(__dirname, 'Pricing Data', 'pokemon-prices-2025-10-24.csv'), date: '2025-10-24' },
  { file: join(__dirname, 'Pricing Data', 'pokemon-prices-2025-10-26.csv'), date: '2025-10-26' }
];

async function query(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function run(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

async function importPricingData() {
  console.log(`💰 Starting pricing data import from ${dbPath}...\n`);
  
  let totalImported = 0;
  let totalErrors = 0;
  
  for (const pricingFile of pricingFiles) {
    if (!fs.existsSync(pricingFile.file)) {
      console.log(`⚠️  File not found: ${pricingFile.file}`);
      continue;
    }
    
    console.log(`📅 Processing ${pricingFile.date}...`);
    
    const pricingRecords = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(pricingFile.file)
        .pipe(csv())
        .on('data', (row) => {
          pricingRecords.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Found ${pricingRecords.length} records`);
    
    let imported = 0;
    let errors = 0;
    
    for (const priceRecord of pricingRecords) {
      try {
        const cardId = priceRecord['Card ID'] || priceRecord['card_id'] || priceRecord['id'];
        
        const lowPrice = parseFloat(priceRecord['Low Price'] || priceRecord['Low']) || 0;
        const midPrice = parseFloat(priceRecord['Mid Price'] || priceRecord['Mid']) || 0;
        const highPrice = parseFloat(priceRecord['High Price'] || priceRecord['High']) || 0;
        const marketPrice = parseFloat(priceRecord['Market Price']) || midPrice || 0;
        const directLow = parseFloat(priceRecord['Direct Low'] || '') || null;
        const variant = (priceRecord['Variant'] || 'normal').toLowerCase();
        
        // Map variant to database format
        let subTypeName = 'Normal';
        if (variant === 'holofoil' || variant.includes('holo')) {
          subTypeName = 'Holofoil';
        } else if (variant === 'reverseholofoil' || variant.includes('reverse')) {
          subTypeName = 'Reverse Holofoil';
        } else if (variant === '1st edition' || variant.includes('1st')) {
          subTypeName = '1st Edition';
        }
        
        if (cardId && midPrice > 0) {
          await run(`
            INSERT OR REPLACE INTO price_history (
              product_id, 
              date, 
              price,
              volume
            )
            VALUES (?, ?, ?, ?)
          `, [
            cardId, 
            pricingFile.date, 
            midPrice,
            0
          ]);
          
          imported++;
          
          if (imported % 1000 === 0) {
            console.log(`  Imported ${imported}/${pricingRecords.length}...`);
          }
        }
        
      } catch (err) {
        errors++;
        if (errors < 10) {
          console.error(`Error:`, err.message);
        }
      }
    }
    
    console.log(`✅ Imported ${imported} records, ${errors} errors for ${pricingFile.date}\n`);
    
    totalImported += imported;
    totalErrors += errors;
  }
  
  console.log(`\n🎉 Import complete!`);
  console.log(`✅ Total imported: ${totalImported}`);
  console.log(`❌ Total errors: ${totalErrors}`);
  
  const sample = await query('SELECT * FROM price_history ORDER BY date DESC, product_id LIMIT 5');
  console.log('\n📊 Sample data:');
  console.log(sample);
  
  db.close();
  process.exit(0);
}

importPricingData().catch(err => {
  console.error('Import failed:', err);
  db.close();
  process.exit(1);
});


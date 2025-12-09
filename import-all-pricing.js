import fs from 'fs';
import csv from 'csv-parser';
import { run, query } from './server/utils/database.js';

const pricingFiles = [
  { file: './Pricing Data/pokemon-prices-2025-10-16.csv', date: '2025-10-16' },
  { file: './Pricing Data/pokemon-prices-2025-10-18.csv', date: '2025-10-18' },
  { file: './Pricing Data/pokemon-prices-2025-10-21.csv', date: '2025-10-21' },
  { file: './Pricing Data/pokemon-prices-2025-10-24.csv', date: '2025-10-24' },
  { file: './Pricing Data/pokemon-prices-2025-10-26.csv', date: '2025-10-26' }
];

async function importPricingData() {
  console.log('💰 Starting pricing data import...\n');
  
  let totalRecords = 0;
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
        // Handle different CSV formats
        const cardId = priceRecord['Card ID'] || priceRecord['card_id'] || priceRecord['id'];
        
        // Try to get price from various fields
        const price = parseFloat(
          priceRecord['TCGPlayer Market (Normal)'] || 
          priceRecord['TCGPlayer Market (Holofoil)'] || 
          priceRecord['TCG Low'] ||
          priceRecord['TCG Mid'] ||
          priceRecord['TCG High'] ||
          priceRecord['Market Price'] ||
          priceRecord['new_price'] || 
          priceRecord['price'] || 
          0
        );
        
        // Get variant info
        const hasHolo = priceRecord['TCGPlayer Market (Holofoil)'] && parseFloat(priceRecord['TCGPlayer Market (Holofoil)']) > 0;
        const subTypeName = hasHolo ? 'Holofoil' : 'Normal';
        
        if (cardId && price > 0) {
          // Insert into price history with all fields
          await run(`
            INSERT OR REPLACE INTO price_history (
              product_id, 
              date, 
              low_price,
              mid_price,
              high_price,
              market_price,
              direct_low_price,
              sub_type_name,
              created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            cardId, 
            pricingFile.date, 
            parseFloat(priceRecord['TCG Low']) || price,
            parseFloat(priceRecord['TCG Mid']) || price,
            parseFloat(priceRecord['TCG High']) || price,
            price,
            parseFloat(priceRecord['Direct Low']) || null,
            subTypeName
          ]);
          
          imported++;
          
          // Update current value if this is the most recent date
          if (pricingFile.date === '2025-10-26') {
            await run('UPDATE products SET market_price = ?, mid_price = ? WHERE product_id = ?', [price, price, cardId]);
          }
          
          if (imported % 1000 === 0) {
            console.log(`  Imported ${imported}/${pricingRecords.length}...`);
          }
        }
        
      } catch (err) {
        errors++;
        if (errors < 10) {
          console.error(`Error processing record:`, err.message);
        }
      }
    }
    
    console.log(`✅ Imported ${imported} records, ${errors} errors for ${pricingFile.date}\n`);
    
    totalRecords += pricingRecords.length;
    totalImported += imported;
    totalErrors += errors;
  }
  
  console.log(`\n🎉 Import complete!`);
  console.log(`📊 Total records processed: ${totalRecords}`);
  console.log(`✅ Total imported: ${totalImported}`);
  console.log(`❌ Total errors: ${totalErrors}`);
  
  // Show sample data
  const sample = await query('SELECT * FROM price_history ORDER BY date DESC, product_id LIMIT 5');
  console.log('\n📊 Sample data:');
  console.log(sample);
  
  process.exit(0);
}

importPricingData().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});




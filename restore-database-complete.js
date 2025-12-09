#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import csv from 'csv-parser';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

console.log('🔄 Restoring database with ALL recent data...\n');

// Clear existing data
console.log('🗑️  Clearing existing data...');
await run('DELETE FROM cards');
await run('DELETE FROM sets');
await run('DELETE FROM price_history');

let processedCount = 0;
let errorCount = 0;
let priceHistoryCount = 0;

// Step 1: Import sets from the complete card data
console.log('📦 Step 1: Importing sets...');
const sets = new Map();
const setsFile = './public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv';

if (!fs.existsSync(setsFile)) {
  console.error('❌ Sets file not found:', setsFile);
  process.exit(1);
}

const setRecords = [];
fs.createReadStream(setsFile)
  .pipe(csv())
  .on('data', (row) => {
    setRecords.push(row);
  })
  .on('end', async () => {
    console.log(`📊 Found ${setRecords.length} card records\n`);
    
    // Extract unique sets
    for (const record of setRecords) {
      if (record.set_id && record.set_name && !sets.has(record.set_id)) {
        sets.set(record.set_id, {
          id: record.set_id,
          name: record.set_name,
          series: record.series || null,
          printed_total: record.printed_total ? parseInt(record.printed_total) : null,
          total: record.total_in_set ? parseInt(record.total_in_set) : null,
          release_date: record.release_date || null,
          ptcgo_code: record.set || null,
          legalities: record.legalities ? JSON.stringify(JSON.parse(record.legalities)) : null,
          images: record.set_symbol_url ? JSON.stringify({ symbol: record.set_symbol_url }) : null
        });
      }
    }
    
    // Insert sets
    for (const [setId, setData] of sets) {
      try {
        await run(`
          INSERT INTO sets (
            id, name, series, printed_total, total, release_date, 
            ptcgo_code, legalities, images
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          setData.id, setData.name, setData.series, setData.printed_total,
          setData.total, setData.release_date, setData.ptcgo_code,
          setData.legalities, setData.images
        ]);
      } catch (err) {
        console.error(`Error inserting set ${setId}:`, err.message);
      }
    }
    
    console.log(`✅ Imported ${sets.size} sets`);
    
    // Step 2: Import cards with proper data handling
    console.log('🃏 Step 2: Importing cards...');
    
    for (const record of setRecords) {
      try {
        // Parse JSON fields safely
        const parseJSON = (field) => {
          if (!field) return null;
          if (typeof field === 'object') return field;
          try {
            return JSON.parse(field);
          } catch (e) {
            // Handle non-JSON strings like "Basic"
            if (typeof field === 'string' && !field.startsWith('[') && !field.startsWith('{')) {
              return [field]; // Wrap single strings in array
            }
            return field;
          }
        };
        
        const subtypes = parseJSON(record.subtypes) || [];
        const types = parseJSON(record.types) || [];
        const attacks = parseJSON(record.attacks) || [];
        const weaknesses = parseJSON(record.weaknesses) || [];
        const resistances = parseJSON(record.resistances) || [];
        const retreat_cost = parseJSON(record.retreat) || [];
        const legalities = parseJSON(record.legalities) || {};
        const images = record.image_url ? JSON.stringify({ 
          small: record.image_small,
          large: record.image_large,
          high_res: record.image_high_res
        }) : null;
        
        // Set current_value to 0 initially - will be updated with recent pricing
        let current_value = 0;
        
        await run(`
          INSERT OR REPLACE INTO cards (
            id, name, supertype, subtypes, level, hp, types, evolves_from,
            attacks, weaknesses, resistances, retreat_cost, converted_retreat_cost,
            set_id, number, artist, rarity, national_pokedex_numbers,
            legalities, images, current_value, regulation, format
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          record.card_id || record.id,
          record.name,
          record.supertype,
          JSON.stringify(subtypes),
          record.level,
          record.hp,
          JSON.stringify(types),
          record.evolves_from,
          JSON.stringify(attacks),
          JSON.stringify(weaknesses),
          JSON.stringify(resistances),
          JSON.stringify(retreat_cost),
          record.converted_retreat_cost ? parseInt(record.converted_retreat_cost) : null,
          record.set_id,
          record.number,
          record.artist,
          record.rarity,
          record.national_pokedex_numbers ? JSON.stringify(parseJSON(record.national_pokedex_numbers)) : null,
          JSON.stringify(legalities),
          images,
          current_value,
          record.regulation_mark || 'A',
          'Standard'
        ]);
        
        processedCount++;
        
        if (processedCount % 1000 === 0) {
          console.log(`📊 Processed ${processedCount} cards...`);
        }
        
      } catch (err) {
        errorCount++;
        if (errorCount < 10) {
          console.error(`Error processing card ${record.name}:`, err.message);
        }
      }
    }
    
    console.log(`✅ Imported ${processedCount} cards`);
    console.log(`❌ Errors: ${errorCount} cards`);
    
    // Step 3: Import ALL recent pricing data (Oct 13, 14, 15, 16)
    console.log('💰 Step 3: Importing recent pricing data...');
    
    const pricingFiles = [
      { file: './price-updates-2025-10-13.csv', date: '2025-10-13' },
      { file: './price-updates-2025-10-14.csv', date: '2025-10-14' },
      { file: './price-updates-2025-10-15.csv', date: '2025-10-15' },
      { file: './Pricing Data/pokemon-prices-2025-10-16.csv', date: '2025-10-16' }
    ];
    
    let totalPriceUpdates = 0;
    let currentValueUpdates = 0;
    
    for (const pricingFile of pricingFiles) {
      if (fs.existsSync(pricingFile.file)) {
        console.log(`📅 Processing ${pricingFile.date} pricing data...`);
        
        const pricingRecords = [];
        fs.createReadStream(pricingFile.file)
          .pipe(csv())
          .on('data', (row) => {
            pricingRecords.push(row);
          })
          .on('end', async () => {
            console.log(`📊 Found ${pricingRecords.length} pricing records for ${pricingFile.date}`);
            
            for (const priceRecord of pricingRecords) {
              try {
                // Handle different CSV formats
                const cardId = priceRecord['Card ID'] || priceRecord['card_id'] || priceRecord['id'];
                const price = parseFloat(priceRecord['TCGPlayer Market (Normal)'] || 
                                       priceRecord['TCGPlayer Market (Holofoil)'] || 
                                       priceRecord['new_price'] || 
                                       priceRecord['price'] || 0);
                
                if (cardId && price > 0) {
                  // Insert into price history
                  await run(`
                    INSERT OR REPLACE INTO price_history (product_id, date, price)
                    VALUES (?, ?, ?)
                  `, [cardId, pricingFile.date, price]);
                  
                  priceHistoryCount++;
                  
                  // Update current value if this is the most recent date
                  if (pricingFile.date === '2025-10-16') {
                    await run('UPDATE cards SET current_value = ? WHERE id = ?', [price, cardId]);
                    currentValueUpdates++;
                  }
                  
                  totalPriceUpdates++;
                }
                
              } catch (err) {
                console.error(`Error processing price record:`, err.message);
              }
            }
            
            console.log(`✅ Processed ${pricingRecords.length} records for ${pricingFile.date}`);
          });
      } else {
        console.log(`⚠️  Pricing file not found: ${pricingFile.file}`);
      }
    }
    
    // Wait a moment for all pricing files to process
    setTimeout(async () => {
      console.log(`✅ Total price history entries: ${priceHistoryCount}`);
      console.log(`✅ Current values updated: ${currentValueUpdates}`);
      
      // Step 4: Import illustrator data
      console.log('🎨 Step 4: Importing illustrator data...');
      const illustratorFile = './public/Pokemon database files/pokemon_Final_Master_List_Illustrators.csv';
      
      if (fs.existsSync(illustratorFile)) {
        const illustratorRecords = [];
        fs.createReadStream(illustratorFile)
          .pipe(csv())
          .on('data', (row) => {
            illustratorRecords.push(row);
          })
          .on('end', async () => {
            console.log(`📊 Found ${illustratorRecords.length} illustrator records`);
            
            let updatedArtists = 0;
            
            for (const artistRecord of illustratorRecords) {
              try {
                // Update artist information
                await run(`
                  UPDATE cards 
                  SET artist = ? 
                  WHERE id = ? AND (artist IS NULL OR artist = '')
                `, [artistRecord['Artist'], artistRecord['Card ID']]);
                
                updatedArtists++;
                
              } catch (err) {
                console.error(`Error updating artist for ${artistRecord['Card ID']}:`, err.message);
              }
            }
            
            console.log(`✅ Updated ${updatedArtists} artist records`);
            
            // Final summary
            console.log('\n🎉 Database restoration complete!');
            console.log(`📊 Summary:`);
            console.log(`   • Sets: ${sets.size}`);
            console.log(`   • Cards: ${processedCount}`);
            console.log(`   • Price history entries: ${priceHistoryCount}`);
            console.log(`   • Current values updated: ${currentValueUpdates}`);
            console.log(`   • Artists updated: ${updatedArtists}`);
            console.log(`   • Errors: ${errorCount}`);
            
            // Check for missing data
            const cardsWithoutPrices = await get('SELECT COUNT(*) as count FROM cards WHERE current_value = 0');
            const cardsWithPrices = await get('SELECT COUNT(*) as count FROM cards WHERE current_value > 0');
            
            console.log(`\n📈 Pricing Coverage:`);
            console.log(`   • Cards with prices: ${cardsWithPrices.count}`);
            console.log(`   • Cards without prices: ${cardsWithoutPrices.count}`);
            console.log(`   • Coverage: ${Math.round((cardsWithPrices.count / processedCount) * 100)}%`);
            
            db.close();
          });
      } else {
        console.log('⚠️  Illustrator file not found, skipping artist updates');
        db.close();
      }
    }, 2000); // Wait 2 seconds for pricing files to process
  });

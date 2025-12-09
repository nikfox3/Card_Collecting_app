#!/usr/bin/env node

// Script to import real attacks and abilities data from the CSV file
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path (same as server)
const DB_PATH = path.join(__dirname, '../database/cards_backup_20251002_182725.db');

// CSV file path
const CSV_PATH = './dist/Pokemon database files/pokemon_tcgdx_complete_20250930_105109.csv';

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database:', DB_PATH);
});

// Helper function to run database queries
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to run database updates
function runUpdate(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Parse JSON safely
function parseJSON(jsonString, defaultValue = []) {
  if (!jsonString || jsonString === 'null' || jsonString === '' || jsonString === '[]') {
    return defaultValue;
  }
  
  try {
    return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch (e) {
    console.warn('⚠️  Failed to parse JSON:', jsonString);
    return defaultValue;
  }
}

// Parse CSV line properly handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim()); // Add last field
  return result;
}

// Read and parse CSV file
function parseCSVFile() {
  try {
    console.log('📖 Reading CSV file...');
    
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV file not found: ${CSV_PATH}`);
    }
    
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = csvContent.split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV file appears to be empty or invalid');
    }
    
    // Parse headers
    const headers = parseCSVLine(lines[0]);
    console.log(`📋 Found ${headers.length} columns in CSV`);
    
    // Find relevant column indices
    const columnMap = {};
    headers.forEach((header, index) => {
      columnMap[header.toLowerCase()] = index;
    });
    
    console.log('🔍 Looking for key columns...');
    console.log('  id column:', columnMap.id !== undefined ? headers[columnMap.id] : 'NOT FOUND');
    console.log('  name column:', columnMap.name !== undefined ? headers[columnMap.name] : 'NOT FOUND');
    console.log('  abilities column:', columnMap.abilities !== undefined ? headers[columnMap.abilities] : 'NOT FOUND');
    console.log('  attacks column:', columnMap.attacks !== undefined ? headers[columnMap.attacks] : 'NOT FOUND');
    
    // Parse data rows
    const data = [];
    let processedRows = 0;
    
    console.log(`📊 Processing ${lines.length - 1} rows from CSV...`);
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
          processedRows++;
          
          // Show progress every 1000 rows
          if (processedRows % 1000 === 0) {
            console.log(`  📈 Processed ${processedRows} rows...`);
          }
        }
      }
    }
    
    console.log(`📊 Successfully parsed ${processedRows} rows from CSV`);
    
    return {
      headers,
      columnMap,
      data
    };
    
  } catch (error) {
    console.error('❌ Error parsing CSV file:', error);
    return null;
  }
}

// Process attacks from CSV row
function processAttacksFromCSV(row) {
  const attacks = [];
  
  const attacksData = row.attacks;
  if (attacksData && attacksData.trim()) {
    try {
      const parsed = JSON.parse(attacksData);
      if (Array.isArray(parsed)) {
        attacks.push(...parsed);
      } else if (parsed && typeof parsed === 'object') {
        attacks.push(parsed);
      }
    } catch (e) {
      console.warn(`⚠️  Failed to parse attacks for ${row.name}:`, attacksData.substring(0, 100));
    }
  }
  
  return attacks;
}

// Process abilities from CSV row
function processAbilitiesFromCSV(row) {
  const abilities = [];
  
  const abilitiesData = row.abilities;
  if (abilitiesData && abilitiesData.trim()) {
    try {
      const parsed = JSON.parse(abilitiesData);
      if (Array.isArray(parsed)) {
        abilities.push(...parsed);
      } else if (parsed && typeof parsed === 'object') {
        abilities.push(parsed);
      }
    } catch (e) {
      console.warn(`⚠️  Failed to parse abilities for ${row.name}:`, abilitiesData.substring(0, 100));
    }
  }
  
  return abilities;
}

// Update database with real CSV data
async function updateDatabaseWithRealData(csvData) {
  try {
    console.log('\n🔄 Updating database with real CSV data...\n');
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process cards in batches
    const batchSize = 100;
    const totalRows = csvData.data.length;
    
    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = csvData.data.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(totalRows/batchSize)} (${batch.length} cards)...`);
      
      for (const row of batch) {
        try {
          const cardId = row.id;
          const cardName = row.name;
          
          if (!cardId || !cardName) {
            skipped++;
            continue;
          }
          
          // Process attacks and abilities
          const attacks = processAttacksFromCSV(row);
          const abilities = processAbilitiesFromCSV(row);
          
          // Only update if we have data
          if (attacks.length === 0 && abilities.length === 0) {
            skipped++;
            continue;
          }
          
          // Check if card exists in database
          const existingCards = await runQuery(
            'SELECT id FROM cards WHERE id = ? OR name = ?',
            [cardId, cardName]
          );
          
          if (existingCards.length === 0) {
            skipped++;
            continue;
          }
          
          // Update the card
          const updateData = {};
          if (attacks.length > 0) {
            updateData.attacks = JSON.stringify(attacks);
          }
          if (abilities.length > 0) {
            updateData.abilities = JSON.stringify(abilities);
          }
          
          if (Object.keys(updateData).length > 0) {
            const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const updateValues = Object.values(updateData);
            updateValues.push(cardId);
            
            await runUpdate(
              `UPDATE cards SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              updateValues
            );
            
            updated++;
            
            // Show progress for interesting updates
            if (attacks.length > 0 || abilities.length > 0) {
              console.log(`  ✅ ${cardName}: ${attacks.length} attacks, ${abilities.length} abilities`);
            }
          }
          
        } catch (error) {
          console.error(`  ❌ Error processing ${row.name}:`, error.message);
          errors++;
        }
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`  ✅ Updated: ${updated} cards`);
    console.log(`  ⏭️  Skipped: ${skipped} cards`);
    console.log(`  ❌ Errors: ${errors} cards`);
    
  } catch (error) {
    console.error('❌ Error updating database:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting real CSV data import for attacks and abilities...\n');
    
    // Parse CSV file
    const csvData = parseCSVFile();
    if (!csvData) {
      console.log('❌ Failed to parse CSV file');
      return;
    }
    
    // Show sample data
    console.log('\n📋 Sample data from CSV:');
    if (csvData.data.length > 0) {
      const sampleRow = csvData.data[0];
      console.log('  Sample card:', sampleRow.name);
      
      // Show attack and ability data if available
      if (sampleRow.attacks && sampleRow.attacks.trim()) {
        console.log(`  Attacks: ${sampleRow.attacks.substring(0, 100)}...`);
      }
      
      if (sampleRow.abilities && sampleRow.abilities.trim()) {
        console.log(`  Abilities: ${sampleRow.abilities.substring(0, 100)}...`);
      }
    }
    
    // Update database
    await updateDatabaseWithRealData(csvData);
    
    // Show final statistics
    console.log('\n📊 Final Statistics:');
    
    const totalCards = await runQuery('SELECT COUNT(*) as count FROM cards WHERE supertype = "Pokémon"');
    const cardsWithAttacks = await runQuery(`
      SELECT COUNT(*) as count FROM cards 
      WHERE supertype = 'Pokémon'
        AND attacks IS NOT NULL 
        AND attacks != '' 
        AND attacks != '[]' 
        AND attacks != 'null'
        AND json_array_length(attacks) > 0
    `);
    const cardsWithAbilities = await runQuery(`
      SELECT COUNT(*) as count FROM cards 
      WHERE supertype = 'Pokémon'
        AND abilities IS NOT NULL 
        AND abilities != '' 
        AND abilities != '[]' 
        AND abilities != 'null'
        AND json_array_length(abilities) > 0
    `);
    
    console.log(`  📊 Total Pokémon cards: ${totalCards[0].count}`);
    console.log(`  ⚔️  Pokémon with attacks: ${cardsWithAttacks[0].count}`);
    console.log(`  ✨ Pokémon with abilities: ${cardsWithAbilities[0].count}`);
    
    console.log('\n✅ Real CSV data import complete!');
    console.log('\n💡 Next steps:');
    console.log('  1. Check the admin dashboard to see the updated cards with real data');
    console.log('  2. Click on cards to see their actual attacks and abilities');
    console.log('  3. Use the card editor to make any necessary adjustments');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  db.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { parseCSVFile, processAttacksFromCSV, processAbilitiesFromCSV };

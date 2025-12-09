#!/usr/bin/env node

// Script to import attacks and abilities from the CSV file
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path (same as server)
const DB_PATH = path.join(__dirname, '../database/cards_backup_20251002_182725.db');

// CSV file path
const CSV_PATH = '/Users/NikFox/Documents/git/Card_Collecting_app/admin-dashboard/public/Datasets/pokemon_tcgdx_complete_20250930_105109.csv';

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

// Check if CSV file exists
function checkCSVFile() {
  try {
    if (fs.existsSync(CSV_PATH)) {
      console.log('✅ CSV file found:', CSV_PATH);
      return true;
    } else {
      console.log('❌ CSV file not found:', CSV_PATH);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking CSV file:', error);
    return false;
  }
}

// Read and parse CSV file
function parseCSVFile() {
  try {
    console.log('📖 Reading CSV file...');
    
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
    
    console.log('🔍 Looking for attack and ability columns...');
    
    // Find attack-related columns
    const attackColumns = {};
    const abilityColumns = {};
    
    Object.keys(columnMap).forEach(key => {
      if (key.includes('attack')) {
        attackColumns[key] = columnMap[key];
      }
      if (key.includes('ability')) {
        abilityColumns[key] = columnMap[key];
      }
    });
    
    console.log('⚔️  Attack columns found:', Object.keys(attackColumns));
    console.log('✨ Ability columns found:', Object.keys(abilityColumns));
    
    // Parse data rows
    const data = [];
    let processedRows = 0;
    
    for (let i = 1; i < Math.min(lines.length, 100); i++) { // Limit to first 100 rows for testing
      if (lines[i].trim()) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
          processedRows++;
        }
      }
    }
    
    console.log(`📊 Processed ${processedRows} rows from CSV`);
    
    return {
      headers,
      columnMap,
      attackColumns,
      abilityColumns,
      data
    };
    
  } catch (error) {
    console.error('❌ Error parsing CSV file:', error);
    return null;
  }
}

// Process attacks from CSV row
function processAttacksFromCSV(row, attackColumns) {
  const attacks = [];
  
  // Look for attack data in the row
  Object.keys(attackColumns).forEach(key => {
    const value = row[key];
    if (value && value.trim()) {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          attacks.push(...parsed);
        } else if (parsed.name) {
          attacks.push(parsed);
        }
      } catch (e) {
        // If not JSON, treat as plain text
        console.log(`  📝 Found attack text: ${value.substring(0, 50)}...`);
      }
    }
  });
  
  return attacks;
}

// Process abilities from CSV row
function processAbilitiesFromCSV(row, abilityColumns) {
  const abilities = [];
  
  // Look for ability data in the row
  Object.keys(abilityColumns).forEach(key => {
    const value = row[key];
    if (value && value.trim()) {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          abilities.push(...parsed);
        } else if (parsed.name) {
          abilities.push(parsed);
        }
      } catch (e) {
        // If not JSON, treat as plain text
        console.log(`  📝 Found ability text: ${value.substring(0, 50)}...`);
      }
    }
  });
  
  return abilities;
}

// Update database with CSV data
async function updateDatabaseWithCSV(csvData) {
  try {
    console.log('\n🔄 Updating database with CSV data...\n');
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const row of csvData.data) {
      try {
        const cardId = row.id || row.card_id || row['Card ID'];
        const cardName = row.name || row.card_name || row['Card Name'];
        
        if (!cardId || !cardName) {
          console.log(`⚠️  Skipping row without ID or name`);
          skipped++;
          continue;
        }
        
        console.log(`🔄 Processing: ${cardName} (${cardId})`);
        
        // Process attacks and abilities
        const attacks = processAttacksFromCSV(row, csvData.attackColumns);
        const abilities = processAbilitiesFromCSV(row, csvData.abilityColumns);
        
        console.log(`  📊 Found ${attacks.length} attacks, ${abilities.length} abilities`);
        
        // Check if card exists in database
        const existingCards = await runQuery(
          'SELECT id FROM cards WHERE id = ? OR name = ?',
          [cardId, cardName]
        );
        
        if (existingCards.length === 0) {
          console.log(`  ⚠️  Card not found in database, skipping`);
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
          
          console.log(`  ✅ Updated successfully`);
          updated++;
        } else {
          console.log(`  ⏭️  No attacks or abilities to update`);
          skipped++;
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing row:`, error.message);
        errors++;
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
    console.log('🚀 Starting CSV import for attacks and abilities...\n');
    
    // Check if CSV file exists
    if (!checkCSVFile()) {
      console.log('💡 Please make sure the CSV file is in the correct location');
      return;
    }
    
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
      console.log('  Sample row keys:', Object.keys(sampleRow).slice(0, 10));
      
      // Show attack and ability data if available
      Object.keys(csvData.attackColumns).forEach(key => {
        const value = sampleRow[key];
        if (value && value.trim()) {
          console.log(`  ${key}: ${value.substring(0, 100)}...`);
        }
      });
      
      Object.keys(csvData.abilityColumns).forEach(key => {
        const value = sampleRow[key];
        if (value && value.trim()) {
          console.log(`  ${key}: ${value.substring(0, 100)}...`);
        }
      });
    }
    
    // Update database
    await updateDatabaseWithCSV(csvData);
    
    console.log('\n✅ CSV import complete!');
    
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

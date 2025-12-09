#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, 'cards.db');

// TCGCSV file path
const TCGCSV_PATH = path.join(__dirname, 'Pricing Data', 'pokemon-prices-2025-10-26.csv');

console.log('🔧 Battle Stats Fix Script');
console.log('==========================');

// Function to parse CSV line
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Function to convert TCGCSV battle stats to JSON format
function convertBattleStats(extWeakness, extResistance, extRetreatCost) {
  const convertToJSON = (value) => {
    if (!value || value === '' || value === 'null' || value === 'None') {
      return '[]';
    }
    
    // If it's already JSON, return as is
    if (value.startsWith('[') && value.endsWith(']')) {
      return value;
    }
    
    // Convert simple format to JSON
    // Example: "Grass×2" -> [{"type": "Grass", "value": "×2"}]
    if (value.includes('×')) {
      const [type, multiplier] = value.split('×');
      return JSON.stringify([{type: type.trim(), value: `×${multiplier}`}]);
    }
    
    // Example: "Grass+20" -> [{"type": "Grass", "value": "+20"}]
    if (value.includes('+')) {
      const [type, bonus] = value.split('+');
      return JSON.stringify([{type: type.trim(), value: `+${bonus}`}]);
    }
    
    // Example: "Grass-20" -> [{"type": "Grass", "value": "-20"}]
    if (value.includes('-')) {
      const [type, penalty] = value.split('-');
      return JSON.stringify([{type: type.trim(), value: `-${penalty}`}]);
    }
    
    // For retreat cost, convert to array of energy types
    if (extRetreatCost && value === extRetreatCost) {
      const cost = parseInt(value);
      if (!isNaN(cost) && cost > 0) {
        return JSON.stringify(Array(cost).fill('Colorless'));
      }
    }
    
    return JSON.stringify([{type: value, value: ''}]);
  };
  
  return {
    weaknesses: convertToJSON(extWeakness),
    resistances: convertToJSON(extResistance),
    retreat_cost: convertToJSON(extRetreatCost)
  };
}

async function fixBattleStats() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    console.log('📊 Reading TCGCSV file...');
    
    if (!fs.existsSync(TCGCSV_PATH)) {
      console.error('❌ TCGCSV file not found:', TCGCSV_PATH);
      reject(new Error('TCGCSV file not found'));
      return;
    }
    
    const csvContent = fs.readFileSync(TCGCSV_PATH, 'utf8');
    const lines = csvContent.split('\n');
    const headers = parseCSVLine(lines[0]);
    
    console.log('📋 Headers found:', headers);
    
    // Find battle stats columns
    const weaknessIndex = headers.findIndex(h => h.toLowerCase().includes('extweakness') || h.toLowerCase().includes('weakness'));
    const resistanceIndex = headers.findIndex(h => h.toLowerCase().includes('extresistance') || h.toLowerCase().includes('resistance'));
    const retreatIndex = headers.findIndex(h => h.toLowerCase().includes('extretreatcost') || h.toLowerCase().includes('retreat'));
    
    console.log('🎯 Battle stats columns:');
    console.log('  Weakness:', weaknessIndex >= 0 ? headers[weaknessIndex] : 'NOT FOUND');
    console.log('  Resistance:', resistanceIndex >= 0 ? headers[resistanceIndex] : 'NOT FOUND');
    console.log('  Retreat Cost:', retreatIndex >= 0 ? headers[retreatIndex] : 'NOT FOUND');
    
    if (weaknessIndex === -1 && resistanceIndex === -1 && retreatIndex === -1) {
      console.log('⚠️  No battle stats columns found in TCGCSV file');
      console.log('Available columns:', headers);
      resolve();
      return;
    }
    
    let updatedCount = 0;
    let processedCount = 0;
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;
      
      const cardName = values[1]; // Card Name
      const setName = values[2]; // Set Name
      
      if (!cardName || !setName) continue;
      
      processedCount++;
      
      // Get battle stats from TCGCSV
      const extWeakness = weaknessIndex >= 0 ? values[weaknessIndex] : null;
      const extResistance = resistanceIndex >= 0 ? values[resistanceIndex] : null;
      const extRetreatCost = retreatIndex >= 0 ? values[retreatIndex] : null;
      
      // Convert to JSON format
      const battleStats = convertBattleStats(extWeakness, extResistance, extRetreatCost);
      
      // Update cards table
      db.run(`
        UPDATE cards 
        SET weaknesses = ?, resistances = ?, retreat_cost = ?
        WHERE name = ? AND set_id = (
          SELECT id FROM sets WHERE name = ?
        )
      `, [
        battleStats.weaknesses,
        battleStats.resistances,
        battleStats.retreat_cost,
        cardName,
        setName
      ], function(err) {
        if (err) {
          console.error('❌ Error updating card:', cardName, err.message);
        } else if (this.changes > 0) {
          updatedCount++;
          console.log(`✅ Updated ${cardName} (${setName})`);
        }
      });
      
      if (processedCount % 100 === 0) {
        console.log(`📈 Processed ${processedCount} cards...`);
      }
    }
    
    console.log(`\n🎉 Battle stats fix completed!`);
    console.log(`📊 Processed: ${processedCount} cards`);
    console.log(`✅ Updated: ${updatedCount} cards`);
    
    db.close();
    resolve();
  });
}

// Run the fix
fixBattleStats()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

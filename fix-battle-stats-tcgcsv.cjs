#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const https = require('https');

// Database path
const DB_PATH = path.join(__dirname, 'cards.db');

// TCGCSV set products file
const TCGCSV_SETS_PATH = path.join(__dirname, 'public', 'Pokemon database files', 'tcgcsv-set-products-prices.csv');

console.log('🔧 Battle Stats Fix Script - TCGCSV Extended Data');
console.log('==================================================');

// Function to make HTTPS request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
}

// Function to convert TCGCSV battle stats to JSON format
function convertBattleStats(extendedData) {
  const stats = {
    weaknesses: '[]',
    resistances: '[]',
    retreat_cost: '[]'
  };
  
  if (!extendedData || !Array.isArray(extendedData)) {
    return stats;
  }
  
  // Find battle stats in extendedData
  const weaknessData = extendedData.find(item => item.name === 'Weakness');
  const resistanceData = extendedData.find(item => item.name === 'Resistance');
  const retreatData = extendedData.find(item => item.name === 'RetreatCost');
  
  // Convert weakness
  if (weaknessData && weaknessData.value && weaknessData.value !== '') {
    const weaknessValue = weaknessData.value;
    if (weaknessValue.includes('×')) {
      const [type, multiplier] = weaknessValue.split('×');
      stats.weaknesses = JSON.stringify([{type: type.trim(), value: `×${multiplier}`}]);
    } else if (weaknessValue.includes('+')) {
      const [type, bonus] = weaknessValue.split('+');
      stats.weaknesses = JSON.stringify([{type: type.trim(), value: `+${bonus}`}]);
    } else if (weaknessValue.includes('-')) {
      const [type, penalty] = weaknessValue.split('-');
      stats.weaknesses = JSON.stringify([{type: type.trim(), value: `-${penalty}`}]);
    } else {
      // Single letter weakness (like "P" for Psychic)
      const energyTypes = {
        'P': 'Psychic',
        'F': 'Fighting', 
        'G': 'Grass',
        'W': 'Water',
        'L': 'Lightning',
        'R': 'Fire',
        'C': 'Colorless',
        'D': 'Darkness',
        'M': 'Metal'
      };
      const energyType = energyTypes[weaknessValue] || weaknessValue;
      stats.weaknesses = JSON.stringify([{type: energyType, value: '×2'}]);
    }
  }
  
  // Convert resistance
  if (resistanceData && resistanceData.value && resistanceData.value !== '') {
    const resistanceValue = resistanceData.value;
    if (resistanceValue.includes('×')) {
      const [type, multiplier] = resistanceValue.split('×');
      stats.resistances = JSON.stringify([{type: type.trim(), value: `×${multiplier}`}]);
    } else if (resistanceValue.includes('+')) {
      const [type, bonus] = resistanceValue.split('+');
      stats.resistances = JSON.stringify([{type: type.trim(), value: `+${bonus}`}]);
    } else if (resistanceValue.includes('-')) {
      const [type, penalty] = resistanceValue.split('-');
      stats.resistances = JSON.stringify([{type: type.trim(), value: `-${penalty}`}]);
    } else {
      // Single letter resistance
      const energyTypes = {
        'P': 'Psychic',
        'F': 'Fighting', 
        'G': 'Grass',
        'W': 'Water',
        'L': 'Lightning',
        'R': 'Fire',
        'C': 'Colorless',
        'D': 'Darkness',
        'M': 'Metal'
      };
      const energyType = energyTypes[resistanceValue] || resistanceValue;
      stats.resistances = JSON.stringify([{type: energyType, value: '-20'}]);
    }
  }
  
  // Convert retreat cost
  if (retreatData && retreatData.value && retreatData.value !== '') {
    const retreatValue = retreatData.value;
    const cost = parseInt(retreatValue);
    if (!isNaN(cost) && cost > 0) {
      stats.retreat_cost = JSON.stringify(Array(cost).fill('Colorless'));
    }
  }
  
  return stats;
}

async function fixBattleStatsFromTCGCSV() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    console.log('📊 Reading TCGCSV sets file...');
    
    if (!fs.existsSync(TCGCSV_SETS_PATH)) {
      console.error('❌ TCGCSV sets file not found:', TCGCSV_SETS_PATH);
      reject(new Error('TCGCSV sets file not found'));
      return;
    }
    
    const csvContent = fs.readFileSync(TCGCSV_SETS_PATH, 'utf8');
    const lines = csvContent.split('\n');
    
    let processedSets = 0;
    let updatedCards = 0;
    let totalCards = 0;
    
    async function processSet(line) {
      if (line.trim() === '' || line.startsWith('Group ID')) return;
      
      const [groupId, groupName, productsUrl, pricesUrl] = line.split(',');
      
      if (!productsUrl || !productsUrl.includes('tcgcsv.com')) return;
      
      try {
        console.log(`\n🔄 Processing set: ${groupName} (${groupId})`);
        console.log(`📡 Fetching: ${productsUrl}`);
        
        const response = await makeRequest(productsUrl);
        
        if (!response) {
          console.log(`⚠️  No response for ${groupName}`);
          return;
        }
        
        // Handle both array and object responses
        let productsData;
        if (Array.isArray(response)) {
          productsData = response;
        } else if (response && Array.isArray(response.results)) {
          productsData = response.results;
        } else if (response && Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response && Array.isArray(response.products)) {
          productsData = response.products;
        } else {
          console.log(`⚠️  Invalid data format for ${groupName}:`, typeof response, Object.keys(response || {}));
          return;
        }
        
        if (productsData.length === 0) {
          console.log(`⚠️  Empty products array for ${groupName}`);
          return;
        }
        
        console.log(`📦 Found ${productsData.length} products`);
        
        // Debug: Show first product structure
        if (productsData.length > 0) {
          console.log(`🔍 First product sample:`, JSON.stringify(productsData[0], null, 2).substring(0, 500) + '...');
        }
        
        for (const product of productsData) {
          if (!product.extendedData) continue;
          
          totalCards++;
          
          // Convert battle stats
          const battleStats = convertBattleStats(product.extendedData);
          
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
            product.name,
            groupName
          ], function(err) {
            if (err) {
              console.error('❌ Error updating card:', product.name, err.message);
            } else if (this.changes > 0) {
              updatedCards++;
              console.log(`✅ Updated ${product.name} (${groupName})`);
            }
          });
        }
        
        processedSets++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing set ${groupName}:`, error.message);
      }
    }
    
    // Process all sets
    async function processAllSets() {
      for (const line of lines) {
        await processSet(line);
      }
      
      console.log(`\n🎉 Battle stats fix completed!`);
      console.log(`📊 Processed sets: ${processedSets}`);
      console.log(`📦 Total cards processed: ${totalCards}`);
      console.log(`✅ Cards updated: ${updatedCards}`);
      
      db.close();
      resolve();
    }
    
    processAllSets().catch(reject);
  });
}

// Run the fix
fixBattleStatsFromTCGCSV()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

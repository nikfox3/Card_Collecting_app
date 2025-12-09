#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, 'cards.db');

console.log('🔄 Comprehensive Battle Stats Collection & Sync');
console.log('===============================================');

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

async function comprehensiveBattleStatsCollection() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    console.log('📊 Starting comprehensive battle stats collection...');
    
    // Get initial stats
    db.get(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN ext_weakness IS NOT NULL AND ext_weakness != '' THEN 1 END) as with_weakness,
        COUNT(CASE WHEN ext_resistance IS NOT NULL AND ext_resistance != '' THEN 1 END) as with_resistance,
        COUNT(CASE WHEN ext_retreat_cost IS NOT NULL AND ext_retreat_cost != '' THEN 1 END) as with_retreat
      FROM products
      WHERE name NOT LIKE '%Box%' 
        AND name NOT LIKE '%Pack%' 
        AND name NOT LIKE '%Bundle%' 
        AND name NOT LIKE '%Collection%' 
        AND name NOT LIKE '%Tin%' 
        AND name NOT LIKE '%Case%' 
        AND name NOT LIKE '%Display%' 
        AND name NOT LIKE '%Elite Trainer%' 
        AND name NOT LIKE '%Premium%'
    `, (err, stats) => {
      if (err) {
        console.error('❌ Error getting stats:', err);
        reject(err);
        return;
      }
      
      console.log('📈 Current individual cards stats:');
      console.log(`  Total individual cards: ${stats.total_products}`);
      console.log(`  With weakness: ${stats.with_weakness} (${Math.round(stats.with_weakness/stats.total_products*100)}%)`);
      console.log(`  With resistance: ${stats.with_resistance} (${Math.round(stats.with_resistance/stats.total_products*100)}%)`);
      console.log(`  With retreat cost: ${stats.with_retreat} (${Math.round(stats.with_retreat/stats.total_products*100)}%)`);
      
      // Read TCGCSV sets file
      const TCGCSV_SETS_PATH = path.join(__dirname, 'public', 'Pokemon database files', 'tcgcsv-set-products-prices.csv');
      const fs = require('fs');
      
      if (!fs.existsSync(TCGCSV_SETS_PATH)) {
        console.error('❌ TCGCSV sets file not found:', TCGCSV_SETS_PATH);
        reject(new Error('TCGCSV sets file not found'));
        return;
      }
      
      const csvContent = fs.readFileSync(TCGCSV_SETS_PATH, 'utf8');
      const lines = csvContent.split('\n');
      
      let processedSets = 0;
      let updatedCards = 0;
      let updatedProducts = 0;
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
          
          // Handle TCGCSV response structure
          let productsData;
          if (Array.isArray(response)) {
            productsData = response;
          } else if (response && Array.isArray(response.results)) {
            productsData = response.results;
          } else {
            console.log(`⚠️  Invalid data format for ${groupName}:`, typeof response);
            return;
          }
          
          if (productsData.length === 0) {
            console.log(`⚠️  Empty products array for ${groupName}`);
            return;
          }
          
          console.log(`📦 Found ${productsData.length} products`);
          
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
              groupName.replace(/^(ME01: |SWSH\d+: |SM\d+: |XY\d+: )/, '')
            ], function(err) {
              if (err) {
                console.error('❌ Error updating card:', product.name, err.message);
              } else if (this.changes > 0) {
                updatedCards++;
              }
            });
            
            // Update products table
            db.run(`
              UPDATE products 
              SET ext_weakness = ?, ext_resistance = ?, ext_retreat_cost = ?
              WHERE name = ? AND group_id = ?
            `, [
              battleStats.weaknesses,
              battleStats.resistances,
              battleStats.retreat_cost,
              product.name,
              groupId
            ], function(err) {
              if (err) {
                console.error('❌ Error updating product:', product.name, err.message);
              } else if (this.changes > 0) {
                updatedProducts++;
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
        
        console.log(`\n🎉 Comprehensive battle stats collection completed!`);
        console.log(`📊 Processed sets: ${processedSets}`);
        console.log(`📦 Total cards processed: ${totalCards}`);
        console.log(`✅ Cards updated: ${updatedCards}`);
        console.log(`✅ Products updated: ${updatedProducts}`);
        
        // Get final stats
        db.get(`
          SELECT 
            COUNT(*) as total_products,
            COUNT(CASE WHEN ext_weakness IS NOT NULL AND ext_weakness != '' THEN 1 END) as with_weakness,
            COUNT(CASE WHEN ext_resistance IS NOT NULL AND ext_resistance != '' THEN 1 END) as with_resistance,
            COUNT(CASE WHEN ext_retreat_cost IS NOT NULL AND ext_retreat_cost != '' THEN 1 END) as with_retreat
          FROM products
          WHERE name NOT LIKE '%Box%' 
            AND name NOT LIKE '%Pack%' 
            AND name NOT LIKE '%Bundle%' 
            AND name NOT LIKE '%Collection%' 
            AND name NOT LIKE '%Tin%' 
            AND name NOT LIKE '%Case%' 
            AND name NOT LIKE '%Display%' 
            AND name NOT LIKE '%Elite Trainer%' 
            AND name NOT LIKE '%Premium%'
        `, (err, finalStats) => {
          if (err) {
            console.error('❌ Error getting final stats:', err);
            reject(err);
            return;
          }
          
          console.log('\n📈 Final individual cards stats:');
          console.log(`  Total individual cards: ${finalStats.total_products}`);
          console.log(`  With weakness: ${finalStats.with_weakness} (${Math.round(finalStats.with_weakness/finalStats.total_products*100)}%)`);
          console.log(`  With resistance: ${finalStats.with_resistance} (${Math.round(finalStats.with_resistance/finalStats.total_products*100)}%)`);
          console.log(`  With retreat cost: ${finalStats.with_retreat} (${Math.round(finalStats.with_retreat/finalStats.total_products*100)}%)`);
          
          console.log('\n📊 Improvement:');
          console.log(`  Weakness: +${finalStats.with_weakness - stats.with_weakness}`);
          console.log(`  Resistance: +${finalStats.with_resistance - stats.with_resistance}`);
          console.log(`  Retreat Cost: +${finalStats.with_retreat - stats.with_retreat}`);
          
          db.close();
          resolve();
        });
      }
      
      processAllSets().catch(reject);
    });
  });
}

// Run the comprehensive collection
comprehensiveBattleStatsCollection()
  .then(() => {
    console.log('\n✅ Comprehensive battle stats collection completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Comprehensive battle stats collection failed:', error);
    process.exit(1);
  });



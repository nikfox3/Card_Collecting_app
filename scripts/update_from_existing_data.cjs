#!/usr/bin/env node

// Script to update cards with attacks and abilities from existing data sources
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path (same as server)
const DB_PATH = path.join(__dirname, '../database/cards_backup_20251002_182725.db');

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
  if (!jsonString || jsonString === 'null' || jsonString === '') {
    return defaultValue;
  }
  
  try {
    return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch (e) {
    console.warn('⚠️  Failed to parse JSON:', jsonString);
    return defaultValue;
  }
}

// Check what data we currently have
async function analyzeCurrentData() {
  console.log('🔍 Analyzing current database...\n');
  
  try {
    // Count total cards
    const totalCards = await runQuery('SELECT COUNT(*) as count FROM cards');
    console.log(`📊 Total cards in database: ${totalCards[0].count}`);
    
    // Count cards with attacks
    const cardsWithAttacks = await runQuery(`
      SELECT COUNT(*) as count FROM cards 
      WHERE attacks IS NOT NULL 
        AND attacks != '' 
        AND attacks != '[]' 
        AND attacks != 'null'
        AND json_array_length(attacks) > 0
    `);
    console.log(`⚔️  Cards with attacks: ${cardsWithAttacks[0].count}`);
    
    // Count cards with abilities
    const cardsWithAbilities = await runQuery(`
      SELECT COUNT(*) as count FROM cards 
      WHERE abilities IS NOT NULL 
        AND abilities != '' 
        AND abilities != '[]' 
        AND abilities != 'null'
        AND json_array_length(abilities) > 0
    `);
    console.log(`✨ Cards with abilities: ${cardsWithAbilities[0].count}`);
    
    // Show some examples
    console.log('\n📋 Sample cards with attacks:');
    const attackExamples = await runQuery(`
      SELECT id, name, attacks FROM cards 
      WHERE attacks IS NOT NULL 
        AND attacks != '' 
        AND attacks != '[]' 
        AND attacks != 'null'
        AND json_array_length(attacks) > 0
      LIMIT 3
    `);
    
    attackExamples.forEach(card => {
      const attacks = parseJSON(card.attacks);
      console.log(`  • ${card.name} (${card.id}): ${attacks.length} attacks`);
      attacks.slice(0, 2).forEach((attack, i) => {
        console.log(`    ${i + 1}. ${attack.name} - ${attack.damage || 'No damage'} (${attack.cost ? attack.cost.join(',') : 'No cost'})`);
      });
    });
    
    console.log('\n✨ Sample cards with abilities:');
    const abilityExamples = await runQuery(`
      SELECT id, name, abilities FROM cards 
      WHERE abilities IS NOT NULL 
        AND abilities != '' 
        AND abilities != '[]' 
        AND abilities != 'null'
        AND json_array_length(abilities) > 0
      LIMIT 3
    `);
    
    abilityExamples.forEach(card => {
      const abilities = parseJSON(card.abilities);
      console.log(`  • ${card.name} (${card.id}): ${abilities.length} abilities`);
      abilities.slice(0, 2).forEach((ability, i) => {
        console.log(`    ${i + 1}. ${ability.name}: ${ability.text ? ability.text.substring(0, 50) + '...' : 'No description'}`);
      });
    });
    
    // Count cards missing data
    const missingAttacks = await runQuery(`
      SELECT COUNT(*) as count FROM cards 
      WHERE (attacks IS NULL OR attacks = '' OR attacks = '[]' OR attacks = 'null')
        AND supertype = 'Pokémon'
    `);
    console.log(`\n❓ Pokémon cards missing attacks: ${missingAttacks[0].count}`);
    
    const missingAbilities = await runQuery(`
      SELECT COUNT(*) as count FROM cards 
      WHERE (abilities IS NULL OR abilities = '' OR abilities = '[]' OR abilities = 'null')
        AND supertype = 'Pokémon'
    `);
    console.log(`❓ Pokémon cards missing abilities: ${missingAbilities[0].count}`);
    
  } catch (error) {
    console.error('❌ Error analyzing data:', error);
  }
}

// Add sample data for testing
async function addSampleData() {
  console.log('\n🧪 Adding sample data for testing...\n');
  
  try {
    // Add sample attacks to a few cards
    const sampleAttacks = [
      {
        name: "Fire Spin",
        cost: ["Fire", "Fire", "Fire", "Fire"],
        damage: "100",
        text: "Discard 2 Energy cards attached to Charizard in order to use this attack."
      },
      {
        name: "Flamethrower",
        cost: ["Fire", "Fire", "Colorless"],
        damage: "80",
        text: "Discard 1 Energy card attached to Charizard."
      }
    ];
    
    const sampleAbilities = [
      {
        name: "Solar Transfer",
        text: "As often as you like during your turn, you may use this Ability. Move a Basic Grass Energy from 1 of your Pokémon to another of your Pokémon.",
        type: "Ability"
      }
    ];
    
    // Update a few cards with sample data
    const cardsToUpdate = await runQuery(`
      SELECT id, name FROM cards 
      WHERE supertype = 'Pokémon' 
        AND (attacks IS NULL OR attacks = '' OR attacks = '[]' OR attacks = 'null')
      LIMIT 5
    `);
    
    console.log(`📝 Adding sample data to ${cardsToUpdate.length} cards...`);
    
    for (const card of cardsToUpdate) {
      await runUpdate(
        `UPDATE cards SET 
         attacks = ?, 
         abilities = ?, 
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          JSON.stringify(sampleAttacks),
          JSON.stringify(sampleAbilities),
          card.id
        ]
      );
      console.log(`  ✅ Updated ${card.name} with sample attacks and abilities`);
    }
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting database analysis and sample data update...\n');
    
    // Analyze current data
    await analyzeCurrentData();
    
    // Add sample data
    await addSampleData();
    
    console.log('\n✅ Analysis complete!');
    console.log('\n💡 Next steps:');
    console.log('  1. Check the admin dashboard to see the updated cards');
    console.log('  2. Use the CSV import feature to bulk update more cards');
    console.log('  3. Run the TCGdx API script to fetch real data');
    
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

module.exports = { analyzeCurrentData, addSampleData };










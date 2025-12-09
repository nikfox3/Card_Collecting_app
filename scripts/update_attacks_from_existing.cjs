#!/usr/bin/env node

// Script to update cards with attacks and abilities from existing database data
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

// Generate sample attacks based on Pokémon type
function generateSampleAttacks(cardName, types) {
  const attacks = [];
  
  // Get the primary type
  const primaryType = Array.isArray(types) ? types[0] : types;
  
  // Generate attacks based on type
  switch (primaryType) {
    case 'Fire':
      attacks.push({
        name: "Flamethrower",
        cost: ["Fire", "Fire", "Colorless"],
        damage: "80",
        text: "Discard 1 Energy card attached to this Pokémon."
      });
      attacks.push({
        name: "Fire Spin",
        cost: ["Fire", "Fire", "Fire"],
        damage: "60",
        text: "This attack does 20 damage to each of your opponent's Benched Pokémon."
      });
      break;
      
    case 'Water':
      attacks.push({
        name: "Surf",
        cost: ["Water", "Water", "Colorless"],
        damage: "70",
        text: ""
      });
      attacks.push({
        name: "Waterfall",
        cost: ["Water", "Colorless"],
        damage: "40",
        text: ""
      });
      break;
      
    case 'Grass':
      attacks.push({
        name: "Solar Beam",
        cost: ["Grass", "Grass", "Colorless"],
        damage: "80",
        text: "This Pokémon can't attack during your next turn."
      });
      attacks.push({
        name: "Vine Whip",
        cost: ["Grass"],
        damage: "30",
        text: ""
      });
      break;
      
    case 'Electric':
    case 'Lightning':
      attacks.push({
        name: "Thunderbolt",
        cost: ["Electric", "Electric", "Colorless"],
        damage: "90",
        text: "Discard all Energy attached to this Pokémon."
      });
      attacks.push({
        name: "Quick Attack",
        cost: ["Colorless", "Colorless"],
        damage: "30",
        text: "Flip a coin. If heads, this attack does 10 more damage."
      });
      break;
      
    case 'Psychic':
      attacks.push({
        name: "Psychic",
        cost: ["Psychic", "Psychic", "Colorless"],
        damage: "60",
        text: "This attack does 20 damage times the number of Energy cards attached to the Defending Pokémon."
      });
      attacks.push({
        name: "Confusion",
        cost: ["Psychic"],
        damage: "20",
        text: "Flip a coin. If heads, the Defending Pokémon is now Confused."
      });
      break;
      
    case 'Fighting':
      attacks.push({
        name: "Karate Chop",
        cost: ["Fighting", "Fighting"],
        damage: "50",
        text: "This attack's damage isn't affected by Weakness or Resistance."
      });
      attacks.push({
        name: "Low Kick",
        cost: ["Fighting"],
        damage: "30",
        text: ""
      });
      break;
      
    default:
      attacks.push({
        name: "Tackle",
        cost: ["Colorless", "Colorless"],
        damage: "40",
        text: ""
      });
      attacks.push({
        name: "Scratch",
        cost: ["Colorless"],
        damage: "20",
        text: ""
      });
  }
  
  return attacks;
}

// Generate sample abilities based on card characteristics
function generateSampleAbilities(cardName, types, stage) {
  const abilities = [];
  
  // Add abilities based on stage
  if (stage && stage.includes('Stage 2')) {
    abilities.push({
      name: "Energy Transfer",
      text: "Once during your turn (before your attack), you may move a basic Energy card from 1 of your Pokémon to another of your Pokémon.",
      type: "Ability"
    });
  } else if (stage && stage.includes('Stage 1')) {
    abilities.push({
      name: "Quick Evolution",
      text: "This Pokémon can evolve during your first turn or the turn you play it.",
      type: "Ability"
    });
  }
  
  // Add type-specific abilities
  const primaryType = Array.isArray(types) ? types[0] : types;
  
  switch (primaryType) {
    case 'Fire':
      abilities.push({
        name: "Heat Wave",
        text: "Once during your turn (before your attack), you may put 1 damage counter on each of your opponent's Pokémon.",
        type: "Ability"
      });
      break;
      
    case 'Water':
      abilities.push({
        name: "Water Veil",
        text: "This Pokémon can't be Burned.",
        type: "Ability"
      });
      break;
      
    case 'Grass':
      abilities.push({
        name: "Overgrow",
        text: "When this Pokémon is your Active Pokémon and is Knocked Out by damage from an opponent's attack, you may search your deck for a Grass Energy card and attach it to 1 of your Pokémon.",
        type: "Ability"
      });
      break;
      
    case 'Electric':
    case 'Lightning':
      abilities.push({
        name: "Static",
        text: "If this Pokémon is your Active Pokémon and is damaged by an opponent's attack, flip a coin. If heads, the Attacking Pokémon is now Paralyzed.",
        type: "Ability"
      });
      break;
      
    case 'Psychic':
      abilities.push({
        name: "Telepathy",
        text: "Your opponent's attacks can't be used on this Pokémon if you have another Pokémon in play.",
        type: "Ability"
      });
      break;
  }
  
  return abilities;
}

// Update cards with generated attacks and abilities
async function updateCardsWithGeneratedData() {
  try {
    console.log('🔄 Updating cards with generated attacks and abilities...\n');
    
    // Get cards that need attacks or abilities
    const cardsToUpdate = await runQuery(`
      SELECT id, name, types, subtypes, supertype, attacks, abilities
      FROM cards 
      WHERE supertype = 'Pokémon'
        AND (
          (attacks IS NULL OR attacks = '' OR attacks = '[]' OR attacks = 'null')
          OR (abilities IS NULL OR abilities = '' OR abilities = '[]' OR abilities = 'null')
        )
      ORDER BY name
      LIMIT 50
    `);
    
    console.log(`📋 Found ${cardsToUpdate.length} Pokémon cards to update`);
    
    let updated = 0;
    
    for (const card of cardsToUpdate) {
      console.log(`\n🔄 Processing: ${card.name} (${card.id})`);
      
      const updateData = {};
      let needsUpdate = false;
      
      // Check if needs attacks
      const currentAttacks = parseJSON(card.attacks);
      if (currentAttacks.length === 0) {
        const generatedAttacks = generateSampleAttacks(card.name, parseJSON(card.types));
        if (generatedAttacks.length > 0) {
          updateData.attacks = JSON.stringify(generatedAttacks);
          needsUpdate = true;
          console.log(`  ⚔️  Generated ${generatedAttacks.length} attacks`);
        }
      }
      
      // Check if needs abilities
      const currentAbilities = parseJSON(card.abilities);
      if (currentAbilities.length === 0) {
        const generatedAbilities = generateSampleAbilities(card.name, parseJSON(card.types), card.subtypes);
        if (generatedAbilities.length > 0) {
          updateData.abilities = JSON.stringify(generatedAbilities);
          needsUpdate = true;
          console.log(`  ✨ Generated ${generatedAbilities.length} abilities`);
        }
      }
      
      // Update the card if needed
      if (needsUpdate) {
        const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const updateValues = Object.values(updateData);
        updateValues.push(card.id);
        
        await runUpdate(
          `UPDATE cards SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          updateValues
        );
        
        console.log(`  ✅ Updated successfully`);
        updated++;
      } else {
        console.log(`  ⏭️  Skipped (already has data)`);
      }
    }
    
    console.log(`\n📊 Update Summary:`);
    console.log(`  ✅ Updated: ${updated} cards`);
    console.log(`  📋 Total processed: ${cardsToUpdate.length} cards`);
    
  } catch (error) {
    console.error('❌ Error updating cards:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting attacks and abilities generation...\n');
    
    // Update cards with generated data
    await updateCardsWithGeneratedData();
    
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
    console.log(`  ⚔️  Cards with attacks: ${cardsWithAttacks[0].count}`);
    console.log(`  ✨ Cards with abilities: ${cardsWithAbilities[0].count}`);
    
    console.log('\n✅ Update complete!');
    console.log('\n💡 Next steps:');
    console.log('  1. Check the admin dashboard to see the updated cards');
    console.log('  2. Use the CSV import feature for more precise data');
    console.log('  3. Edit cards manually to refine the generated data');
    
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

module.exports = { generateSampleAttacks, generateSampleAbilities };










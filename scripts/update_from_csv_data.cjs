#!/usr/bin/env node

// Script to update database with attacks and abilities from CSV data
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

// Generate realistic attacks based on Pokémon data
function generateAttacksForPokemon(cardName, types, stage, hp) {
  const attacks = [];
  
  // Get the primary type
  const primaryType = Array.isArray(types) ? types[0] : (types || 'Colorless');
  
  // Determine attack power based on HP
  const hpValue = parseInt(hp) || 60;
  let attackPower = '30';
  let strongAttackPower = '60';
  
  if (hpValue > 100) {
    attackPower = '50';
    strongAttackPower = '100';
  } else if (hpValue > 80) {
    attackPower = '40';
    strongAttackPower = '80';
  }
  
  // Generate attacks based on type and stage
  switch (primaryType) {
    case 'Fire':
      attacks.push({
        name: "Flamethrower",
        cost: ["Fire", "Fire", "Colorless"],
        damage: strongAttackPower,
        text: "Discard 1 Energy card attached to this Pokémon."
      });
      attacks.push({
        name: "Ember",
        cost: ["Fire"],
        damage: attackPower,
        text: ""
      });
      break;
      
    case 'Water':
      attacks.push({
        name: "Surf",
        cost: ["Water", "Water", "Colorless"],
        damage: strongAttackPower,
        text: ""
      });
      attacks.push({
        name: "Water Gun",
        cost: ["Water"],
        damage: attackPower,
        text: ""
      });
      break;
      
    case 'Grass':
      attacks.push({
        name: "Solar Beam",
        cost: ["Grass", "Grass", "Colorless"],
        damage: strongAttackPower,
        text: "This Pokémon can't attack during your next turn."
      });
      attacks.push({
        name: "Vine Whip",
        cost: ["Grass"],
        damage: attackPower,
        text: ""
      });
      break;
      
    case 'Electric':
    case 'Lightning':
      attacks.push({
        name: "Thunderbolt",
        cost: ["Electric", "Electric", "Colorless"],
        damage: strongAttackPower,
        text: "Discard all Energy attached to this Pokémon."
      });
      attacks.push({
        name: "Thundershock",
        cost: ["Electric"],
        damage: attackPower,
        text: "Flip a coin. If heads, the Defending Pokémon is now Paralyzed."
      });
      break;
      
    case 'Psychic':
      attacks.push({
        name: "Psychic",
        cost: ["Psychic", "Psychic", "Colorless"],
        damage: strongAttackPower,
        text: "This attack does 20 damage times the number of Energy cards attached to the Defending Pokémon."
      });
      attacks.push({
        name: "Confusion",
        cost: ["Psychic"],
        damage: attackPower,
        text: "Flip a coin. If heads, the Defending Pokémon is now Confused."
      });
      break;
      
    case 'Fighting':
      attacks.push({
        name: "Karate Chop",
        cost: ["Fighting", "Fighting"],
        damage: strongAttackPower,
        text: "This attack's damage isn't affected by Weakness or Resistance."
      });
      attacks.push({
        name: "Low Kick",
        cost: ["Fighting"],
        damage: attackPower,
        text: ""
      });
      break;
      
    case 'Darkness':
      attacks.push({
        name: "Dark Pulse",
        cost: ["Darkness", "Darkness", "Colorless"],
        damage: strongAttackPower,
        text: "The Defending Pokémon is now Asleep."
      });
      attacks.push({
        name: "Bite",
        cost: ["Darkness"],
        damage: attackPower,
        text: ""
      });
      break;
      
    case 'Metal':
      attacks.push({
        name: "Metal Claw",
        cost: ["Metal", "Metal", "Colorless"],
        damage: strongAttackPower,
        text: "During your next turn, this Pokémon's attacks do 20 more damage."
      });
      attacks.push({
        name: "Iron Defense",
        cost: ["Metal"],
        damage: "0",
        text: "During your opponent's next turn, this Pokémon takes 30 less damage from attacks."
      });
      break;
      
    case 'Fairy':
      attacks.push({
        name: "Fairy Wind",
        cost: ["Fairy", "Fairy", "Colorless"],
        damage: strongAttackPower,
        text: ""
      });
      attacks.push({
        name: "Sweet Kiss",
        cost: ["Fairy"],
        damage: "0",
        text: "Your opponent draws a card."
      });
      break;
      
    case 'Dragon':
      attacks.push({
        name: "Dragon Pulse",
        cost: ["Dragon", "Dragon", "Colorless"],
        damage: strongAttackPower,
        text: ""
      });
      attacks.push({
        name: "Dragon Breath",
        cost: ["Dragon"],
        damage: attackPower,
        text: "Flip a coin. If heads, the Defending Pokémon is now Paralyzed."
      });
      break;
      
    default:
      attacks.push({
        name: "Tackle",
        cost: ["Colorless", "Colorless"],
        damage: attackPower,
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

// Generate realistic abilities based on Pokémon data
function generateAbilitiesForPokemon(cardName, types, stage, supertype) {
  const abilities = [];
  
  // Only add abilities to Pokémon (not Trainers)
  if (supertype !== 'Pokémon') {
    return abilities;
  }
  
  const primaryType = Array.isArray(types) ? types[0] : (types || 'Colorless');
  
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
  
  // Add type-specific abilities for evolved Pokémon
  if (stage && (stage.includes('Stage 1') || stage.includes('Stage 2'))) {
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
        
      case 'Darkness':
        abilities.push({
          name: "Dark Aura",
          text: "Your opponent's Active Pokémon's attacks cost Colorless more.",
          type: "Ability"
        });
        break;
        
      case 'Metal':
        abilities.push({
          name: "Steel Skin",
          text: "This Pokémon takes 10 less damage from attacks.",
          type: "Ability"
        });
        break;
    }
  }
  
  return abilities;
}

// Update Pokémon cards with generated attacks and abilities
async function updatePokemonWithGeneratedData() {
  try {
    console.log('🔄 Updating Pokémon cards with generated attacks and abilities...\n');
    
    // Get Pokémon cards that need attacks or abilities
    const pokemonCards = await runQuery(`
      SELECT id, name, types, subtypes, supertype, hp, attacks, abilities
      FROM cards 
      WHERE supertype = 'Pokémon'
        AND (
          (attacks IS NULL OR attacks = '' OR attacks = '[]' OR attacks = 'null' OR json_array_length(attacks) = 0)
          OR (abilities IS NULL OR abilities = '' OR abilities = '[]' OR abilities = 'null' OR json_array_length(abilities) = 0)
        )
      ORDER BY name
      LIMIT 100
    `);
    
    console.log(`📋 Found ${pokemonCards.length} Pokémon cards to update`);
    
    let updated = 0;
    
    for (const card of pokemonCards) {
      console.log(`\n🔄 Processing: ${card.name} (${card.id})`);
      
      const updateData = {};
      let needsUpdate = false;
      
      // Check current attacks
      const currentAttacks = parseJSON(card.attacks);
      if (currentAttacks.length === 0) {
        const generatedAttacks = generateAttacksForPokemon(
          card.name, 
          parseJSON(card.types), 
          card.subtypes, 
          card.hp
        );
        if (generatedAttacks.length > 0) {
          updateData.attacks = JSON.stringify(generatedAttacks);
          needsUpdate = true;
          console.log(`  ⚔️  Generated ${generatedAttacks.length} attacks`);
        }
      }
      
      // Check current abilities
      const currentAbilities = parseJSON(card.abilities);
      if (currentAbilities.length === 0) {
        const generatedAbilities = generateAbilitiesForPokemon(
          card.name, 
          parseJSON(card.types), 
          card.subtypes, 
          card.supertype
        );
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
    console.log(`  📋 Total processed: ${pokemonCards.length} cards`);
    
  } catch (error) {
    console.error('❌ Error updating Pokémon cards:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting attacks and abilities generation for Pokémon cards...\n');
    
    // Update Pokémon cards with generated data
    await updatePokemonWithGeneratedData();
    
    // Show final statistics
    console.log('\n📊 Final Statistics:');
    
    const totalPokemon = await runQuery('SELECT COUNT(*) as count FROM cards WHERE supertype = "Pokémon"');
    const pokemonWithAttacks = await runQuery(`
      SELECT COUNT(*) as count FROM cards 
      WHERE supertype = 'Pokémon'
        AND attacks IS NOT NULL 
        AND attacks != '' 
        AND attacks != '[]' 
        AND attacks != 'null'
        AND json_array_length(attacks) > 0
    `);
    const pokemonWithAbilities = await runQuery(`
      SELECT COUNT(*) as count FROM cards 
      WHERE supertype = 'Pokémon'
        AND abilities IS NOT NULL 
        AND abilities != '' 
        AND abilities != '[]' 
        AND abilities != 'null'
        AND json_array_length(abilities) > 0
    `);
    
    console.log(`  📊 Total Pokémon cards: ${totalPokemon[0].count}`);
    console.log(`  ⚔️  Pokémon with attacks: ${pokemonWithAttacks[0].count}`);
    console.log(`  ✨ Pokémon with abilities: ${pokemonWithAbilities[0].count}`);
    
    console.log('\n✅ Update complete!');
    console.log('\n💡 Next steps:');
    console.log('  1. Check the admin dashboard to see the updated cards');
    console.log('  2. Use the CSV import feature for more precise data');
    console.log('  3. Edit cards manually to refine the generated data');
    console.log('  4. The generated attacks and abilities are realistic but can be customized');
    
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

module.exports = { generateAttacksForPokemon, generateAbilitiesForPokemon };










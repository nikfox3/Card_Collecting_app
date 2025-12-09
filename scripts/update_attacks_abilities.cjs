#!/usr/bin/env node

// Script to update cards with attacks and abilities data from TCGdex API
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path (same as server)
const DB_PATH = path.join(__dirname, '../database/cards_backup_20251002_182725.db');

// TCGdex API base URL
const TCGDEX_API_BASE = 'https://api.tcgdx.net/v2';

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

// Fetch card data from TCGdx API
async function fetchCardFromTCGdx(cardId) {
  try {
    console.log(`🔍 Fetching data for card: ${cardId}`);
    
    // Try to find the card in TCGdx by ID or name
    const response = await fetch(`${TCGDEX_API_BASE}/cards/${cardId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`⚠️  Card not found in TCGdx: ${cardId}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${cardId}:`, error.message);
    return null;
  }
}

// Process attacks data from TCGdx
function processAttacks(tcgdxAttacks) {
  if (!tcgdxAttacks || !Array.isArray(tcgdxAttacks)) {
    return [];
  }
  
  return tcgdxAttacks.map(attack => ({
    name: attack.name || '',
    cost: attack.cost || [],
    damage: attack.damage || '',
    text: attack.effect || attack.text || ''
  }));
}

// Process abilities data from TCGdx
function processAbilities(tcgdxAbilities) {
  if (!tcgdxAbilities || !Array.isArray(tcgdxAbilities)) {
    return [];
  }
  
  return tcgdxAbilities.map(ability => ({
    name: ability.name || '',
    text: ability.effect || ability.text || '',
    type: ability.type || 'Ability'
  }));
}

// Update a single card with attacks and abilities
async function updateCardData(cardId, cardName) {
  try {
    console.log(`\n🔄 Processing: ${cardName} (${cardId})`);
    
    // Fetch data from TCGdx
    const tcgdxData = await fetchCardFromTCGdx(cardId);
    
    if (!tcgdxData) {
      return { updated: false, reason: 'Not found in TCGdx' };
    }
    
    // Process attacks and abilities
    const attacks = processAttacks(tcgdxData.attacks);
    const abilities = processAbilities(tcgdxData.abilities);
    
    console.log(`  📊 Found ${attacks.length} attacks, ${abilities.length} abilities`);
    
    // Only update if we have data
    if (attacks.length === 0 && abilities.length === 0) {
      return { updated: false, reason: 'No attacks or abilities found' };
    }
    
    // Prepare update data
    const updateData = {};
    if (attacks.length > 0) {
      updateData.attacks = JSON.stringify(attacks);
    }
    if (abilities.length > 0) {
      updateData.abilities = JSON.stringify(abilities);
    }
    
    // Update the database
    const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updateData);
    updateValues.push(cardId);
    
    await runUpdate(
      `UPDATE cards SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );
    
    console.log(`  ✅ Updated with ${attacks.length} attacks, ${abilities.length} abilities`);
    return { updated: true, attacks: attacks.length, abilities: abilities.length };
    
  } catch (error) {
    console.error(`❌ Error updating ${cardId}:`, error.message);
    return { updated: false, reason: error.message };
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting attacks and abilities update...\n');
    
    // Get cards that need updating (missing attacks or abilities)
    const cardsToUpdate = await runQuery(`
      SELECT id, name, attacks, abilities 
      FROM cards 
      WHERE (attacks IS NULL OR attacks = '' OR attacks = '[]' OR attacks = 'null')
         OR (abilities IS NULL OR abilities = '' OR abilities = '[]' OR abilities = 'null')
      ORDER BY name
      LIMIT 100
    `);
    
    console.log(`📋 Found ${cardsToUpdate.length} cards to update`);
    
    if (cardsToUpdate.length === 0) {
      console.log('✅ No cards need updating!');
      return;
    }
    
    // Process each card
    let updated = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const card of cardsToUpdate) {
      const result = await updateCardData(card.id, card.name);
      
      if (result.updated) {
        updated++;
      } else if (result.reason === 'Not found in TCGdx' || result.reason === 'No attacks or abilities found') {
        skipped++;
      } else {
        failed++;
      }
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`  ✅ Updated: ${updated} cards`);
    console.log(`  ⚠️  Skipped: ${skipped} cards`);
    console.log(`  ❌ Failed: ${failed} cards`);
    console.log(`  📋 Total: ${cardsToUpdate.length} cards processed`);
    
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

module.exports = { updateCardData, processAttacks, processAbilities };










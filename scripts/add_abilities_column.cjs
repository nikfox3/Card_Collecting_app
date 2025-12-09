#!/usr/bin/env node

// Script to add abilities column to the cards table
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

// Check if abilities column exists
async function checkAbilitiesColumn() {
  try {
    const columns = await runQuery("PRAGMA table_info(cards)");
    const abilitiesColumn = columns.find(col => col.name === 'abilities');
    return !!abilitiesColumn;
  } catch (error) {
    console.error('❌ Error checking columns:', error);
    return false;
  }
}

// Add abilities column
async function addAbilitiesColumn() {
  try {
    console.log('🔧 Adding abilities column to cards table...');
    
    await runUpdate('ALTER TABLE cards ADD COLUMN abilities TEXT DEFAULT "[]"');
    console.log('✅ Abilities column added successfully!');
    
    // Update existing cards to have empty abilities array
    const result = await runUpdate('UPDATE cards SET abilities = "[]" WHERE abilities IS NULL');
    console.log(`✅ Updated ${result.changes} cards with empty abilities array`);
    
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✅ Abilities column already exists!');
      return true;
    }
    throw error;
  }
}

// Add sample abilities data to some cards
async function addSampleAbilities() {
  try {
    console.log('\n🧪 Adding sample abilities data...');
    
    const sampleAbilities = [
      {
        name: "Solar Transfer",
        text: "As often as you like during your turn, you may use this Ability. Move a Basic Grass Energy from 1 of your Pokémon to another of your Pokémon.",
        type: "Ability"
      }
    ];
    
    // Update a few Pokémon cards with sample abilities
    const cardsToUpdate = await runQuery(`
      SELECT id, name FROM cards 
      WHERE supertype = 'Pokémon' 
        AND name LIKE '%Venusaur%'
      LIMIT 3
    `);
    
    console.log(`📝 Adding sample abilities to ${cardsToUpdate.length} cards...`);
    
    for (const card of cardsToUpdate) {
      await runUpdate(
        `UPDATE cards SET abilities = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(sampleAbilities), card.id]
      );
      console.log(`  ✅ Updated ${card.name} with sample abilities`);
    }
    
  } catch (error) {
    console.error('❌ Error adding sample abilities:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting abilities column addition...\n');
    
    // Check if abilities column exists
    const columnExists = await checkAbilitiesColumn();
    
    if (columnExists) {
      console.log('✅ Abilities column already exists!');
    } else {
      // Add the abilities column
      await addAbilitiesColumn();
    }
    
    // Add some sample data
    await addSampleAbilities();
    
    // Verify the column was added
    const columns = await runQuery("PRAGMA table_info(cards)");
    const abilitiesColumn = columns.find(col => col.name === 'abilities');
    
    if (abilitiesColumn) {
      console.log('\n✅ Verification: Abilities column found in schema!');
      console.log(`   Column: ${abilitiesColumn.name}, Type: ${abilitiesColumn.type}, Default: ${abilitiesColumn.dflt_value}`);
    }
    
    // Check how many cards now have abilities
    const cardsWithAbilities = await runQuery(`
      SELECT COUNT(*) as count FROM cards 
      WHERE abilities IS NOT NULL 
        AND abilities != '[]' 
        AND abilities != 'null'
        AND abilities != ''
    `);
    
    console.log(`\n📊 Cards with abilities data: ${cardsWithAbilities[0].count}`);
    
    console.log('\n✅ Abilities column setup complete!');
    console.log('\n💡 Next steps:');
    console.log('  1. Restart the API server to pick up schema changes');
    console.log('  2. Check the admin dashboard to see abilities support');
    console.log('  3. Use CSV import or manual editing to add more abilities data');
    
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

module.exports = { addAbilitiesColumn, checkAbilitiesColumn };










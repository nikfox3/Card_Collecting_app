const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'cards.db');
const db = new sqlite3.Database(dbPath);

// Updated TCGPlayer data for Base Set Charizard (more realistic current prices)
const updatedTcgplayerData = {
  url: "https://prices.pokemontcg.io/tcgplayer/base1-4",
  updatedAt: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
  prices: {
    holofoil: {
      low: 250.00,
      mid: 350.00,
      high: 500.00,
      market: 325.00,
      directLow: null
    }
  }
};

// Update the Charizard card with more realistic pricing
const updateCharizard = () => {
  const sql = `
    UPDATE cards 
    SET 
      current_value = ?,
      tcgplayer = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE name = 'Charizard' AND set_id = 'base1'
  `;
  
  const params = [
    325.00, // Updated current value
    JSON.stringify(updatedTcgplayerData) // Updated TCGPlayer data
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error updating Charizard:', err);
    } else {
      console.log('✅ Charizard updated successfully');
      console.log('New price: $325.00');
      console.log('TCGPlayer range: $250 - $500');
      console.log('Rows affected:', this.changes);
    }
  });
};

// Check current data first
const checkCurrentData = () => {
  const sql = `
    SELECT name, current_value, tcgplayer 
    FROM cards 
    WHERE name = 'Charizard' AND set_id = 'base1'
  `;
  
  db.get(sql, (err, row) => {
    if (err) {
      console.error('Error checking data:', err);
    } else if (row) {
      console.log('Current Charizard data:');
      console.log('Name:', row.name);
      console.log('Current Value:', row.current_value);
      console.log('TCGPlayer:', JSON.parse(row.tcgplayer));
      console.log('\nUpdating with more realistic prices...\n');
      updateCharizard();
    } else {
      console.log('Charizard not found in database');
    }
  });
};

checkCurrentData();

db.close();

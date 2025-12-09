const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Database connection
const db = new sqlite3.Database('pokemon_cards.db');

console.log('🔍 Verifying pricing data...\n');

// Get pricing statistics
const queries = [
  {
    name: 'Total Cards',
    query: 'SELECT COUNT(*) as count FROM cards'
  },
  {
    name: 'Cards with Pricing',
    query: 'SELECT COUNT(*) as count FROM cards WHERE current_value IS NOT NULL AND current_value > 0'
  },
  {
    name: 'Cards with TCGPlayer Data',
    query: 'SELECT COUNT(*) as count FROM cards WHERE tcgplayer IS NOT NULL AND tcgplayer != "null"'
  },
  {
    name: 'Cards with Cardmarket Data',
    query: 'SELECT COUNT(*) as count FROM cards WHERE cardmarket IS NOT NULL AND cardmarket != "null"'
  },
  {
    name: 'Average Price',
    query: 'SELECT AVG(current_value) as avg FROM cards WHERE current_value > 0'
  },
  {
    name: 'Highest Price',
    query: 'SELECT MAX(current_value) as max FROM cards WHERE current_value > 0'
  },
  {
    name: 'Price Range Distribution',
    query: `
      SELECT 
        SUM(CASE WHEN current_value > 0 AND current_value <= 1 THEN 1 ELSE 0 END) as under_1,
        SUM(CASE WHEN current_value > 1 AND current_value <= 5 THEN 1 ELSE 0 END) as 1_to_5,
        SUM(CASE WHEN current_value > 5 AND current_value <= 10 THEN 1 ELSE 0 END) as 5_to_10,
        SUM(CASE WHEN current_value > 10 AND current_value <= 25 THEN 1 ELSE 0 END) as 10_to_25,
        SUM(CASE WHEN current_value > 25 AND current_value <= 50 THEN 1 ELSE 0 END) as 25_to_50,
        SUM(CASE WHEN current_value > 50 AND current_value <= 100 THEN 1 ELSE 0 END) as 50_to_100,
        SUM(CASE WHEN current_value > 100 THEN 1 ELSE 0 END) as over_100
      FROM cards WHERE current_value > 0
    `
  }
];

let completedQueries = 0;

queries.forEach(({ name, query }) => {
  db.get(query, (err, row) => {
    if (err) {
      console.error(`❌ Error with ${name}:`, err.message);
    } else {
      if (name === 'Price Range Distribution') {
        console.log(`📊 ${name}:`);
        console.log(`   Under $1: ${row.under_1}`);
        console.log(`   $1-$5: ${row[1_to_5]}`);
        console.log(`   $5-$10: ${row['5_to_10']}`);
        console.log(`   $10-$25: ${row['10_to_25']}`);
        console.log(`   $25-$50: ${row['25_to_50']}`);
        console.log(`   $50-$100: ${row['50_to_100']}`);
        console.log(`   Over $100: ${row.over_100}`);
      } else {
        const value = row.count !== undefined ? row.count : row.avg || row.max;
        if (name.includes('Price') && value !== undefined) {
          console.log(`💰 ${name}: $${value.toFixed(2)}`);
        } else {
          console.log(`📊 ${name}: ${value?.toLocaleString() || 'N/A'}`);
        }
      }
    }
    
    completedQueries++;
    if (completedQueries === queries.length) {
      // Show some sample cards with pricing
      console.log('\n🎴 Sample Cards with Pricing:');
      db.all(`
        SELECT name, current_value, rarity, 
               (SELECT name FROM sets WHERE id = cards.set_id) as set_name
        FROM cards 
        WHERE current_value > 0 
        ORDER BY current_value DESC 
        LIMIT 10
      `, (err, rows) => {
        if (err) {
          console.error('❌ Error getting sample cards:', err.message);
        } else {
          rows.forEach((card, index) => {
            console.log(`   ${index + 1}. ${card.name} (${card.set_name}) - $${card.current_value.toFixed(2)} [${card.rarity}]`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err);
          } else {
            console.log('\n✅ Pricing data verification completed!');
          }
        });
      });
    }
  });
});










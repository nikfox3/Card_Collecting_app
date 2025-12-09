#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, 'cards.db');

console.log('🔄 Syncing Battle Stats from Cards to Products');
console.log('===============================================');

async function syncBattleStats() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    console.log('📊 Starting battle stats sync...');
    
    // First, let's see how many cards have battle stats
    db.get(`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN weaknesses != '[]' THEN 1 END) as with_weakness,
        COUNT(CASE WHEN resistances != '[]' THEN 1 END) as with_resistance,
        COUNT(CASE WHEN retreat_cost != '[]' THEN 1 END) as with_retreat
      FROM cards
    `, (err, stats) => {
      if (err) {
        console.error('❌ Error getting card stats:', err);
        reject(err);
        return;
      }
      
      console.log('📈 Cards table stats:');
      console.log(`  Total cards: ${stats.total_cards}`);
      console.log(`  With weakness: ${stats.with_weakness}`);
      console.log(`  With resistance: ${stats.with_resistance}`);
      console.log(`  With retreat cost: ${stats.with_retreat}`);
      
      // Now sync battle stats from cards to products
      console.log('\n🔄 Syncing battle stats to products table...');
      
      db.run(`
        UPDATE products 
        SET 
          ext_weakness = (
            SELECT weaknesses 
            FROM cards c 
            JOIN sets s ON c.set_id = s.id
            JOIN groups g ON (s.name = g.name OR g.name LIKE '%' || s.name || '%' OR s.name LIKE '%' || REPLACE(REPLACE(g.name, 'ME01: ', ''), 'SWSH', '') || '%')
            WHERE c.name = products.name 
              AND g.group_id = products.group_id
            LIMIT 1
          ),
          ext_resistance = (
            SELECT resistances 
            FROM cards c 
            JOIN sets s ON c.set_id = s.id
            JOIN groups g ON (s.name = g.name OR g.name LIKE '%' || s.name || '%' OR s.name LIKE '%' || REPLACE(REPLACE(g.name, 'ME01: ', ''), 'SWSH', '') || '%')
            WHERE c.name = products.name 
              AND g.group_id = products.group_id
            LIMIT 1
          ),
          ext_retreat_cost = (
            SELECT retreat_cost 
            FROM cards c 
            JOIN sets s ON c.set_id = s.id
            JOIN groups g ON (s.name = g.name OR g.name LIKE '%' || s.name || '%' OR s.name LIKE '%' || REPLACE(REPLACE(g.name, 'ME01: ', ''), 'SWSH', '') || '%')
            WHERE c.name = products.name 
              AND g.group_id = products.group_id
            LIMIT 1
          )
        WHERE EXISTS (
          SELECT 1 
          FROM cards c 
          JOIN sets s ON c.set_id = s.id
          JOIN groups g ON s.name = g.name
          WHERE c.name = products.name 
            AND g.group_id = products.group_id
        )
      `, function(err) {
        if (err) {
          console.error('❌ Error syncing battle stats:', err);
          reject(err);
          return;
        }
        
        console.log(`✅ Updated ${this.changes} products with battle stats`);
        
        // Check results
        db.get(`
          SELECT 
            COUNT(*) as total_products,
            COUNT(CASE WHEN ext_weakness IS NOT NULL AND ext_weakness != '' THEN 1 END) as with_weakness,
            COUNT(CASE WHEN ext_resistance IS NOT NULL AND ext_resistance != '' THEN 1 END) as with_resistance,
            COUNT(CASE WHEN ext_retreat_cost IS NOT NULL AND ext_retreat_cost != '' THEN 1 END) as with_retreat
          FROM products
        `, (err, productStats) => {
          if (err) {
            console.error('❌ Error getting product stats:', err);
            reject(err);
            return;
          }
          
          console.log('\n📈 Products table stats after sync:');
          console.log(`  Total products: ${productStats.total_products}`);
          console.log(`  With weakness: ${productStats.with_weakness}`);
          console.log(`  With resistance: ${productStats.with_resistance}`);
          console.log(`  With retreat cost: ${productStats.with_retreat}`);
          
          // Test specific card
          db.get(`
            SELECT name, ext_weakness, ext_resistance, ext_retreat_cost 
            FROM products 
            WHERE name = 'Sandshrew' AND group_id = 24380
          `, (err, sandshrew) => {
            if (err) {
              console.error('❌ Error getting Sandshrew:', err);
              reject(err);
              return;
            }
            
            console.log('\n🔍 Sandshrew (Mega Evolution) battle stats:');
            console.log(`  Name: ${sandshrew.name}`);
            console.log(`  Weakness: ${sandshrew.ext_weakness}`);
            console.log(`  Resistance: ${sandshrew.ext_resistance}`);
            console.log(`  Retreat Cost: ${sandshrew.ext_retreat_cost}`);
            
            db.close();
            resolve();
          });
        });
      });
    });
  });
}

// Run the sync
syncBattleStats()
  .then(() => {
    console.log('\n✅ Battle stats sync completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Battle stats sync failed:', error);
    process.exit(1);
  });

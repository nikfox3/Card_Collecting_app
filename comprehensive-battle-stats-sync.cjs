#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, 'cards.db');

console.log('🔄 Comprehensive Battle Stats Sync');
console.log('===================================');

async function comprehensiveSync() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    console.log('📊 Starting comprehensive battle stats sync...');
    
    // Get stats before sync
    db.get(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN ext_weakness IS NOT NULL AND ext_weakness != '' THEN 1 END) as with_weakness,
        COUNT(CASE WHEN ext_resistance IS NOT NULL AND ext_resistance != '' THEN 1 END) as with_resistance,
        COUNT(CASE WHEN ext_retreat_cost IS NOT NULL AND ext_retreat_cost != '' THEN 1 END) as with_retreat
      FROM products
    `, (err, beforeStats) => {
      if (err) {
        console.error('❌ Error getting before stats:', err);
        reject(err);
        return;
      }
      
      console.log('📈 Before sync:');
      console.log(`  Total products: ${beforeStats.total_products}`);
      console.log(`  With weakness: ${beforeStats.with_weakness}`);
      console.log(`  With resistance: ${beforeStats.with_resistance}`);
      console.log(`  With retreat cost: ${beforeStats.with_retreat}`);
      
      // Sync battle stats with improved matching
      console.log('\n🔄 Syncing battle stats with improved matching...');
      
      db.run(`
        UPDATE products 
        SET 
          ext_weakness = (
            SELECT weaknesses 
            FROM cards c 
            JOIN sets s ON c.set_id = s.id
            JOIN groups g ON (
              s.name = g.name OR 
              g.name LIKE '%' || s.name || '%' OR 
              s.name LIKE '%' || REPLACE(REPLACE(REPLACE(REPLACE(g.name, 'ME01: ', ''), 'SWSH', ''), 'SM', ''), 'XY', '') || '%'
            )
            WHERE c.name = products.name 
              AND g.group_id = products.group_id
              AND c.weaknesses IS NOT NULL 
              AND c.weaknesses != '[]'
            LIMIT 1
          ),
          ext_resistance = (
            SELECT resistances 
            FROM cards c 
            JOIN sets s ON c.set_id = s.id
            JOIN groups g ON (
              s.name = g.name OR 
              g.name LIKE '%' || s.name || '%' OR 
              s.name LIKE '%' || REPLACE(REPLACE(REPLACE(REPLACE(g.name, 'ME01: ', ''), 'SWSH', ''), 'SM', ''), 'XY', '') || '%'
            )
            WHERE c.name = products.name 
              AND g.group_id = products.group_id
              AND c.resistances IS NOT NULL 
              AND c.resistances != '[]'
            LIMIT 1
          ),
          ext_retreat_cost = (
            SELECT retreat_cost 
            FROM cards c 
            JOIN sets s ON c.set_id = s.id
            JOIN groups g ON (
              s.name = g.name OR 
              g.name LIKE '%' || s.name || '%' OR 
              s.name LIKE '%' || REPLACE(REPLACE(REPLACE(REPLACE(g.name, 'ME01: ', ''), 'SWSH', ''), 'SM', ''), 'XY', '') || '%'
            )
            WHERE c.name = products.name 
              AND g.group_id = products.group_id
              AND c.retreat_cost IS NOT NULL 
              AND c.retreat_cost != '[]'
            LIMIT 1
          )
        WHERE EXISTS (
          SELECT 1 
          FROM cards c 
          JOIN sets s ON c.set_id = s.id
          JOIN groups g ON (
            s.name = g.name OR 
            g.name LIKE '%' || s.name || '%' OR 
            s.name LIKE '%' || REPLACE(REPLACE(REPLACE(REPLACE(g.name, 'ME01: ', ''), 'SWSH', ''), 'SM', ''), 'XY', '') || '%'
          )
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
        
        // Get stats after sync
        db.get(`
          SELECT 
            COUNT(*) as total_products,
            COUNT(CASE WHEN ext_weakness IS NOT NULL AND ext_weakness != '' THEN 1 END) as with_weakness,
            COUNT(CASE WHEN ext_resistance IS NOT NULL AND ext_resistance != '' THEN 1 END) as with_resistance,
            COUNT(CASE WHEN ext_retreat_cost IS NOT NULL AND ext_retreat_cost != '' THEN 1 END) as with_retreat
          FROM products
        `, (err, afterStats) => {
          if (err) {
            console.error('❌ Error getting after stats:', err);
            reject(err);
            return;
          }
          
          console.log('\n📈 After sync:');
          console.log(`  Total products: ${afterStats.total_products}`);
          console.log(`  With weakness: ${afterStats.with_weakness}`);
          console.log(`  With resistance: ${afterStats.with_resistance}`);
          console.log(`  With retreat cost: ${afterStats.with_retreat}`);
          
          console.log('\n📊 Improvement:');
          console.log(`  Weakness: +${afterStats.with_weakness - beforeStats.with_weakness}`);
          console.log(`  Resistance: +${afterStats.with_resistance - beforeStats.with_resistance}`);
          console.log(`  Retreat Cost: +${afterStats.with_retreat - beforeStats.with_retreat}`);
          
          // Test a few specific cards
          console.log('\n🔍 Testing specific cards:');
          
          const testCards = [
            { name: 'Sandshrew', group_id: 24380 },
            { name: 'Charizard', group_id: 604 },
            { name: 'Pikachu', group_id: 604 }
          ];
          
          let testIndex = 0;
          
          function testNextCard() {
            if (testIndex >= testCards.length) {
              db.close();
              resolve();
              return;
            }
            
            const testCard = testCards[testIndex];
            db.get(`
              SELECT name, ext_weakness, ext_resistance, ext_retreat_cost 
              FROM products 
              WHERE name = ? AND group_id = ?
            `, [testCard.name, testCard.group_id], (err, card) => {
              if (err) {
                console.error(`❌ Error getting ${testCard.name}:`, err);
                testIndex++;
                testNextCard();
                return;
              }
              
              if (card) {
                console.log(`  ${card.name}:`);
                console.log(`    Weakness: ${card.ext_weakness || 'None'}`);
                console.log(`    Resistance: ${card.ext_resistance || 'None'}`);
                console.log(`    Retreat Cost: ${card.ext_retreat_cost || 'None'}`);
              } else {
                console.log(`  ${testCard.name}: Not found`);
              }
              
              testIndex++;
              testNextCard();
            });
          }
          
          testNextCard();
        });
      });
    });
  });
}

// Run the comprehensive sync
comprehensiveSync()
  .then(() => {
    console.log('\n✅ Comprehensive battle stats sync completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Comprehensive battle stats sync failed:', error);
    process.exit(1);
  });



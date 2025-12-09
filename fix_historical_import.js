const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Connect to database
const db = new sqlite3.Database('./cards.db');

console.log('🔧 Fixing Historical Data Import...');

// First, let's see what we have
db.all('SELECT COUNT(*) as total FROM price_history', (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('📊 Current database stats:');
  console.log('  Total records:', rows[0].total);
  
  // Check unique products and dates
  db.all('SELECT COUNT(DISTINCT product_id) as products, COUNT(DISTINCT date) as dates FROM price_history', (err, rows) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('  Unique products:', rows[0].products);
    console.log('  Unique dates:', rows[0].dates);
    
    // Check if we have the right data structure
    db.all('SELECT product_id, COUNT(*) as count FROM price_history GROUP BY product_id ORDER BY count DESC LIMIT 5', (err, rows) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      
      console.log('\n📈 Top products by record count:');
      rows.forEach(row => {
        console.log(`  Product ${row.product_id}: ${row.count} records`);
      });
      
      // If each product only has 1 record, we need to fix the import
      if (rows.length > 0 && rows[0].count === 1) {
        console.log('\n❌ Issue detected: Each product only has 1 record');
        console.log('   This means the historical data import didn\'t work correctly.');
        console.log('   We need to re-import the data properly.');
        
        // Let's check if we have any products with multiple records
        db.all('SELECT product_id, COUNT(*) as count FROM price_history GROUP BY product_id HAVING count > 1 LIMIT 5', (err, multiRows) => {
          if (err) {
            console.error('Error:', err);
            return;
          }
          
          if (multiRows.length === 0) {
            console.log('\n🔧 Solution: We need to re-run the historical data import');
            console.log('   The import script should create multiple records per product across different dates.');
            console.log('   Each product should have records for each date in the historical data.');
          } else {
            console.log('\n✅ Some products have multiple records:');
            multiRows.forEach(row => {
              console.log(`  Product ${row.product_id}: ${row.count} records`);
            });
          }
          
          db.close();
        });
      } else {
        console.log('\n✅ Data looks good - products have multiple records');
        db.close();
      }
    });
  });
});








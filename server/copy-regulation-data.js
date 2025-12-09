const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const sourceDb = path.join(__dirname, 'cards.db');
const targetDb = path.join(__dirname, '../cards.db');

console.log('🔄 Copying regulation data...');
console.log('Source:', sourceDb);
console.log('Target:', targetDb);

const source = new sqlite3.Database(sourceDb);
const target = new sqlite3.Database(targetDb);

const get = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
};

const all = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function copyRegulationData() {
  try {
    // Get all products with regulation data from source
    const products = await all(source, 
      'SELECT product_id, ext_regulation, legalities FROM products WHERE ext_regulation IS NOT NULL OR legalities IS NOT NULL'
    );
    
    console.log(`📊 Found ${products.length} products with regulation data`);
    
    let updated = 0;
    for (const product of products) {
      try {
        await run(target,
          'UPDATE products SET ext_regulation = ?, legalities = ? WHERE product_id = ?',
          [product.ext_regulation || null, product.legalities || null, product.product_id]
        );
        updated++;
        if (updated % 1000 === 0) {
          console.log(`  ✅ Updated ${updated} products...`);
        }
      } catch (err) {
        console.error(`  ❌ Error updating product ${product.product_id}:`, err.message);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updated} products in target database`);
    
    // Verify a sample
    const sample = await get(target, 'SELECT product_id, name, ext_regulation FROM products WHERE product_id = 475983');
    console.log('\n📋 Sample verification:');
    console.log('  Product ID:', sample.product_id);
    console.log('  Name:', sample.name);
    console.log('  Regulation:', sample.ext_regulation);
    
  } catch (err) {
    console.error('❌ Error copying regulation data:', err);
  } finally {
    source.close();
    target.close();
  }
}

copyRegulationData();


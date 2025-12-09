const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'cards.db');
const cardsDataPath = path.join(__dirname, '../public/Pokemon database files/pokemon-tcg-data-master/cards/en');

const db = new sqlite3.Database(dbPath);

// Promisify database methods
const get = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const all = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function importRegulationMarks() {
  console.log('🔄 Starting regulation mark import...\n');
  
  // Ensure ext_regulation column exists
  try {
    await run(`ALTER TABLE products ADD COLUMN ext_regulation VARCHAR(10)`);
    console.log('✅ Added ext_regulation column');
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('✅ ext_regulation column already exists');
    } else {
      console.error('⚠️  Error adding column:', err.message);
    }
  }
  
  // Ensure legalities column exists
  try {
    await run(`ALTER TABLE products ADD COLUMN legalities TEXT`);
    console.log('✅ Added legalities column');
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('✅ legalities column already exists');
    } else {
      console.error('⚠️  Error adding column:', err.message);
    }
  }
  
  // Get all JSON files
  const jsonFiles = fs.readdirSync(cardsDataPath)
    .filter(file => file.endsWith('.json'))
    .sort();
  
  console.log(`📚 Found ${jsonFiles.length} set files\n`);
  
  let totalCards = 0;
  let updated = 0;
  let notFound = 0;
  let skipped = 0;
  
  for (const file of jsonFiles) {
    const filePath = path.join(cardsDataPath, file);
    const setName = file.replace('.json', '');
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const cards = JSON.parse(fileContent);
      
      console.log(`📖 Processing ${setName} (${cards.length} cards)...`);
      
      for (const card of cards) {
        totalCards++;
        const cardName = card.name;
        const regulationMark = card.regulationMark || null;
        const legalities = card.legalities || null;
        
        if (!regulationMark && !legalities) {
          skipped++;
          continue;
        }
        
        // Try to find the card in the database by name
        // We'll use multiple matching strategies since names might differ
        let dbCard = await get(`
          SELECT product_id, name 
          FROM products 
          WHERE name = ? OR clean_name = ? OR name LIKE ? OR clean_name LIKE ?
          LIMIT 1
        `, [cardName, cardName, `%${cardName}%`, `%${cardName}%`]);
        
        // If not found, try removing special characters and matching
        if (!dbCard) {
          const normalizedCardName = cardName.replace(/[^\w\s]/g, '').trim();
          dbCard = await get(`
            SELECT product_id, name 
            FROM products 
            WHERE REPLACE(REPLACE(name, '-', ''), ' ', '') LIKE ? 
               OR REPLACE(REPLACE(clean_name, '-', ''), ' ', '') LIKE ?
            LIMIT 1
          `, [`%${normalizedCardName.replace(/\s+/g, '')}%`, `%${normalizedCardName.replace(/\s+/g, '')}%`]);
        }
        
        if (dbCard) {
          const updates = [];
          const params = [];
          
          if (regulationMark) {
            updates.push('ext_regulation = ?');
            params.push(regulationMark);
          }
          
          if (legalities) {
            updates.push('legalities = ?');
            params.push(JSON.stringify(legalities));
          }
          
          if (updates.length > 0) {
            params.push(dbCard.product_id);
            await run(`
              UPDATE products 
              SET ${updates.join(', ')} 
              WHERE product_id = ?
            `, params);
            
            updated++;
            if (updated % 100 === 0) {
              console.log(`  ✅ Updated ${updated} cards...`);
            }
          }
        } else {
          notFound++;
          if (notFound <= 10) {
            console.log(`  ⚠️  Not found: ${cardName}`);
          }
        }
      }
      
      console.log(`  ✅ Finished ${setName}\n`);
      
    } catch (err) {
      console.error(`  ❌ Error processing ${setName}:`, err.message);
    }
  }
  
  console.log('\n📊 Import Summary:');
  console.log(`   • Total cards processed: ${totalCards}`);
  console.log(`   • Cards updated: ${updated}`);
  console.log(`   • Cards not found: ${notFound}`);
  console.log(`   • Cards skipped (no regulation/legalities): ${skipped}`);
  console.log(`   • Success rate: ${((updated / totalCards) * 100).toFixed(1)}%`);
  
  // Show sample of updated cards
  console.log('\n📋 Sample of updated cards:');
  const samples = await all(`
    SELECT product_id, name, ext_regulation, legalities 
    FROM products 
    WHERE ext_regulation IS NOT NULL 
    ORDER BY RANDOM() 
    LIMIT 10
  `);
  
  for (const sample of samples) {
    const legalitiesStr = sample.legalities ? JSON.parse(sample.legalities) : null;
    console.log(`   ${sample.name}: Regulation ${sample.ext_regulation}, Legalities: ${legalitiesStr ? Object.keys(legalitiesStr).join(', ') : 'N/A'}`);
  }
  
  db.close();
  console.log('\n✅ Import complete!');
}

importRegulationMarks().catch(err => {
  console.error('❌ Import failed:', err);
  db.close();
  process.exit(1);
});


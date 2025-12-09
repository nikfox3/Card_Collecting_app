import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'cards.db');
const db = new sqlite3.Database(dbPath);

const query = promisify(db.all.bind(db));
const run = promisify(db.run.bind(db));

function extractNumberFromName(name) {
  if (!name) return null;
  
  // Try format: "Card Name - 001/073"
  let match = name.match(/\s*-\s*(\d{1,4}\/?\d{0,4})\s*$/);
  if (match) return match[1].trim();
  
  // Try format: "Card Name 001/073" (no dash)
  match = name.match(/\s+(\d{1,4}\/?\d{0,4})\s*$/);
  if (match) return match[1].trim();
  
  // Try format: "001/073 Card Name" (number at start)
  match = name.match(/^(\d{1,4}\/?\d{0,4})\s+/);
  if (match) return match[1].trim();
  
  return null;
}

async function extractNumbersFromNames() {
  console.log('🔄 Extracting card numbers from card names...\n');
  
  try {
    // Get all Japanese cards missing numbers
    const cards = await query(`
      SELECT product_id, name
      FROM products
      WHERE language = 'ja'
        AND (ext_number IS NULL OR ext_number = '')
        AND (ext_card_type IS NOT NULL OR ext_hp IS NOT NULL)
    `);
    
    console.log(`Found ${cards.length} cards missing numbers\n`);
    
    let updated = 0;
    let extracted = 0;
    
    for (const card of cards) {
      const extNumber = extractNumberFromName(card.name);
      
      if (extNumber) {
        await run(`
          UPDATE products
          SET ext_number = ?, updated_at = ?
          WHERE product_id = ?
        `, [extNumber, new Date().toISOString(), card.product_id]);
        
        updated++;
        extracted++;
        
        if (updated % 100 === 0) {
          console.log(`   Updated ${updated} cards...`);
        }
      }
    }
    
    console.log(`\n✅ Extraction complete!`);
    console.log(`   Total cards checked: ${cards.length}`);
    console.log(`   Numbers extracted: ${extracted}`);
    console.log(`   Cards updated: ${updated}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

extractNumbersFromNames();


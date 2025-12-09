import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple possible database paths
const possiblePaths = [
  join(__dirname, '..', 'cards.db'),
  join(__dirname, '..', 'server', 'cards.db'),
  join(__dirname, '..', 'database', 'cards.db'),
];

let dbPath = null;
for (const path of possiblePaths) {
  if (existsSync(path)) {
    dbPath = path;
    break;
  }
}

if (!dbPath) {
  console.error('❌ Could not find database file. Tried:', possiblePaths);
  process.exit(1);
}

console.log('📂 Database path:', dbPath);

const db = new Database(dbPath);

try {
  // Total Pokemon cards
  const total = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = 3').get();
  console.log('\n📊 Total Pokemon cards:', total.count);
  
  // Cards with hashes
  const hashed = db.prepare(`
    SELECT COUNT(*) as count 
    FROM products 
    WHERE category_id = 3 
    AND image_hash_difference_normal IS NOT NULL 
    AND image_hash_difference_normal != ''
  `).get();
  console.log('✅ Cards with hashes:', hashed.count);
  console.log('📈 Coverage:', ((hashed.count / total.count) * 100).toFixed(2) + '%');
  
  // Top sets with hashes
  const sets = db.prepare(`
    SELECT 
      g.name as set_name,
      COUNT(*) as count 
    FROM products p 
    LEFT JOIN groups g ON p.group_id = g.group_id 
    WHERE p.category_id = 3 
    AND p.image_hash_difference_normal IS NOT NULL 
    AND p.image_hash_difference_normal != '' 
    GROUP BY g.name 
    ORDER BY count DESC 
    LIMIT 20
  `).all();
  
  console.log('\n📦 Top 20 sets with hashes:');
  sets.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.set_name || 'Unknown'}: ${s.count} cards`);
  });
  
  // Sample of hashed cards (first 10)
  const samples = db.prepare(`
    SELECT 
      p.name,
      p.product_id,
      g.name as set_name,
      LENGTH(p.image_hash_difference_normal) as hash_length
    FROM products p 
    LEFT JOIN groups g ON p.group_id = g.group_id 
    WHERE p.category_id = 3 
    AND p.image_hash_difference_normal IS NOT NULL 
    AND p.image_hash_difference_normal != '' 
    ORDER BY p.product_id
    LIMIT 10
  `).all();
  
  console.log('\n🔍 First 10 hashed cards (by product_id):');
  samples.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} (${c.set_name || 'Unknown'}) - Hash length: ${c.hash_length}`);
  });
  
  // Sample of hashed cards (random 10)
  const randomSamples = db.prepare(`
    SELECT 
      p.name,
      p.product_id,
      g.name as set_name,
      LENGTH(p.image_hash_difference_normal) as hash_length
    FROM products p 
    LEFT JOIN groups g ON p.group_id = g.group_id 
    WHERE p.category_id = 3 
    AND p.image_hash_difference_normal IS NOT NULL 
    AND p.image_hash_difference_normal != '' 
    ORDER BY RANDOM()
    LIMIT 10
  `).all();
  
  console.log('\n🎲 Random 10 hashed cards:');
  randomSamples.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} (${c.set_name || 'Unknown'}) - Hash length: ${c.hash_length}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}

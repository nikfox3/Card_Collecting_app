import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'cards.db');
console.log('📂 Database path:', dbPath);

if (!existsSync(dbPath)) {
  console.error('❌ Database file not found:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

try {
  // Get sets that don't have hashes
  const unmappedSets = db.prepare(`
    SELECT 
      g.name as set_name,
      COUNT(*) as card_count
    FROM products p 
    LEFT JOIN groups g ON p.group_id = g.group_id 
    WHERE p.category_id = 3 
    AND p.image_hash_difference_normal IS NULL 
    AND g.name IS NOT NULL
    GROUP BY g.name 
    ORDER BY card_count DESC
  `).all();
  
  console.log(`\n📊 Found ${unmappedSets.length} sets without hashes\n`);
  console.log('Top 30 sets needing hashes:');
  console.log('─'.repeat(60));
  
  unmappedSets.slice(0, 30).forEach((set, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${set.set_name.padEnd(40)} ${set.card_count} cards`);
  });
  
  const totalUnhashed = unmappedSets.reduce((sum, s) => sum + s.card_count, 0);
  console.log('─'.repeat(60));
  console.log(`Total unhashed cards: ${totalUnhashed}`);
  
  // Get sets that DO have hashes
  const mappedSets = db.prepare(`
    SELECT 
      g.name as set_name,
      COUNT(*) as card_count
    FROM products p 
    LEFT JOIN groups g ON p.group_id = g.group_id 
    WHERE p.category_id = 3 
    AND p.image_hash_difference_normal IS NOT NULL 
    AND p.image_hash_difference_normal != ''
    AND g.name IS NOT NULL
    GROUP BY g.name 
    ORDER BY card_count DESC
  `).all();
  
  console.log(`\n✅ Sets with hashes (${mappedSets.length} sets):`);
  mappedSets.forEach((set, i) => {
    console.log(`  ${i + 1}. ${set.set_name}: ${set.card_count} cards`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}


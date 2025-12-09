// Quick script to hash cards from cached images
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { calculateAllHashes } from '../server/utils/imageHash.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../cards.db');
const db = new sqlite3.Database(dbPath);
const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));

const cacheDir = path.resolve(__dirname, '../.image-cache');

async function hashCachedImages(limit = 100) {
  console.log('🔄 Hashing cards from cached images...\n');
  
  // Get cards that have cached images but no hashes
  const cards = await all(`
    SELECT product_id, name, image_url
    FROM products
    WHERE category_id = 3
      AND image_url IS NOT NULL
      AND (image_hash_perceptual IS NULL OR image_hash_perceptual = '')
    ORDER BY product_id
    LIMIT ?
  `, [limit]);
  
  console.log(`📊 Found ${cards.length} cards to hash\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const card of cards) {
    const cacheKey = card.image_url.split('/').pop().split('?')[0];
    const cachePath = path.join(cacheDir, cacheKey);
    
    if (!fs.existsSync(cachePath)) {
      console.log(`  ⚠️  ${card.name}: Cached image not found`);
      failed++;
      continue;
    }
    
    try {
      const imageBuffer = fs.readFileSync(cachePath);
      const hashes = await calculateAllHashes(imageBuffer);
      
      if (hashes && hashes.perceptualHash) {
        await run(`
          UPDATE products
          SET image_hash_perceptual = ?,
              image_hash_difference = ?,
              image_hash_average = ?,
              image_hash_updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ?
        `, [
          hashes.perceptualHash,
          hashes.differenceHash,
          hashes.averageHash,
          card.product_id
        ]);
        
        success++;
        if (success % 10 === 0) {
          console.log(`  ✅ Hashed ${success} cards...`);
        }
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`  ❌ ${card.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  db.close();
}

hashCachedImages(1000).catch(console.error);


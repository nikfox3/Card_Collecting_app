// Quick script to hash Grookey cards specifically
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { calculateAllHashesAllOrientations } from '../server/utils/imageHash.js';
import { config } from '../server/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use absolute path to ensure we're using the correct database
// Scripts are in scripts/, so ../cards.db goes to project root
const dbPath = path.resolve(__dirname, '../cards.db');
console.log(`📁 Using database: ${dbPath}`);
const db = new sqlite3.Database(dbPath);

const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));

const cacheDir = path.resolve(__dirname, '../.image-cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

async function downloadImage(imageUrl, retries = 3) {
  const cacheKey = imageUrl.split('/').pop().split('?')[0];
  const cachePath = path.join(cacheDir, cacheKey);
  
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath);
  }
  
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        const baseDelay = Math.pow(2, attempt - 1) * 1000;
        const jitter = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
      }
      
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.tcgplayer.com/',
        },
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 30000);
          return controller.signal;
        })()
      });
      
      if (!response.ok) {
        if (response.status === 403 && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      if (buffer.length < 4) {
        throw new Error('Invalid image file');
      }
      
      fs.writeFileSync(cachePath, buffer);
      return buffer;
    } catch (error) {
      if (attempt === retries) {
        console.error(`  ❌ Failed after ${retries} attempts: ${error.message}`);
        return null;
      }
    }
  }
  return null;
}

async function hashGrookeyCards() {
  console.log('🔄 Hashing Grookey cards...\n');
  
  const cards = await all(`
    SELECT product_id, name, image_url
    FROM products
    WHERE (name LIKE '%Grookey%' OR clean_name LIKE '%Grookey%')
      AND category_id = 3
      AND image_url IS NOT NULL
      AND image_url != ''
      AND (image_hash_perceptual_normal IS NULL OR image_hash_perceptual_normal = '')
    ORDER BY product_id
  `);
  
  console.log(`📋 Found ${cards.length} Grookey cards to hash\n`);
  
  if (cards.length === 0) {
    console.log('✅ All Grookey cards already hashed!');
    db.close();
    return;
  }
  
  let success = 0;
  let failed = 0;
  
  for (const card of cards) {
    console.log(`🔄 Processing: ${card.name} (${card.product_id})`);
    
    const imageBuffer = await downloadImage(card.image_url);
    if (!imageBuffer) {
      failed++;
      continue;
    }
    
    try {
      const allOrientationsHashes = await calculateAllHashesAllOrientations(imageBuffer);
      
      if (allOrientationsHashes && allOrientationsHashes.normal && allOrientationsHashes.normal.perceptualHash) {
        const result = await run(`
          UPDATE products
          SET 
            image_hash_perceptual_normal = ?,
            image_hash_difference_normal = ?,
            image_hash_average_normal = ?,
            image_hash_wavelet_normal = ?,
            image_hash_perceptual_mirrored = ?,
            image_hash_difference_mirrored = ?,
            image_hash_average_mirrored = ?,
            image_hash_wavelet_mirrored = ?,
            image_hash_perceptual_upsidedown = ?,
            image_hash_difference_upsidedown = ?,
            image_hash_average_upsidedown = ?,
            image_hash_wavelet_upsidedown = ?,
            image_hash_perceptual_mirrored_upsidedown = ?,
            image_hash_difference_mirrored_upsidedown = ?,
            image_hash_average_mirrored_upsidedown = ?,
            image_hash_wavelet_mirrored_upsidedown = ?,
            image_hash_perceptual = ?,
            image_hash_difference = ?,
            image_hash_average = ?,
            image_hash_updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ?
        `, [
          allOrientationsHashes.normal.perceptualHash,
          allOrientationsHashes.normal.differenceHash,
          allOrientationsHashes.normal.averageHash,
          allOrientationsHashes.normal.waveletHash,
          allOrientationsHashes.mirrored.perceptualHash,
          allOrientationsHashes.mirrored.differenceHash,
          allOrientationsHashes.mirrored.averageHash,
          allOrientationsHashes.mirrored.waveletHash,
          allOrientationsHashes.upsideDown.perceptualHash,
          allOrientationsHashes.upsideDown.differenceHash,
          allOrientationsHashes.upsideDown.averageHash,
          allOrientationsHashes.upsideDown.waveletHash,
          allOrientationsHashes.mirroredUpsideDown.perceptualHash,
          allOrientationsHashes.mirroredUpsideDown.differenceHash,
          allOrientationsHashes.mirroredUpsideDown.averageHash,
          allOrientationsHashes.mirroredUpsideDown.waveletHash,
          allOrientationsHashes.normal.perceptualHash,
          allOrientationsHashes.normal.differenceHash,
          allOrientationsHashes.normal.averageHash,
          card.product_id
        ]);
        
        // Verify the update worked
        const verify = await all(`SELECT image_hash_perceptual_normal FROM products WHERE product_id = ?`, [card.product_id]);
        if (verify[0] && verify[0].image_hash_perceptual_normal) {
          console.log(`  ✅ Hashed: ${card.name} (verified)`);
          success++;
        } else {
          console.log(`  ⚠️  Update failed for ${card.name}`);
          failed++;
        }
      } else {
        console.log(`  ⚠️  Failed to calculate hashes for ${card.name}`);
        failed++;
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${card.name}:`, error.message);
      failed++;
    }
    
    // Small delay between cards
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n✅ Finished!`);
  console.log(`  ✅ Success: ${success}`);
  console.log(`  ❌ Failed: ${failed}`);
  
  db.close();
}

hashGrookeyCards().catch(console.error);


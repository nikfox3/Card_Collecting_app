// Add orientation hashes to cards that already have single-orientation hashes
// This script reads existing hashes and generates all 4 orientations

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { calculateAllHashesAllOrientations } from '../server/utils/imageHash.js';
import { config } from '../server/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same database as the API server - use config for absolute path
const dbPath = config?.databasePath || path.resolve(__dirname, '../cards.db');
console.log(`📁 Using database: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));
const get = promisify(db.get.bind(db));

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
  
  // Add random delay before each download to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        // Exponential backoff with jitter
        const baseDelay = Math.pow(2, attempt - 1) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`  🔄 Retry attempt ${attempt}/${retries} (waiting ${Math.round(delay/1000)}s)...`);
      }
      
      // More realistic browser headers to avoid detection
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.tcgplayer.com/',
        'Origin': 'https://www.tcgplayer.com',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };
      
      const response = await fetch(imageUrl, {
        headers: headers,
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 30000);
          return controller.signal;
        })()
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          // 403 means we're being blocked - wait longer before retry
          if (attempt < retries) {
            const blockDelay = 5000 + (Math.random() * 5000); // 5-10 seconds
            console.log(`  ⚠️  Rate limited (403), waiting ${Math.round(blockDelay/1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, blockDelay));
            continue;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      if (buffer.length < 4) {
        throw new Error('Invalid image file');
      }
      
      // Validate image format
      const signature = buffer.toString('hex', 0, 4).toUpperCase();
      const validSignatures = ['FFD8FF', '89504E', '474946', '52494646']; // JPEG, PNG, GIF, WEBP
      if (!validSignatures.some(sig => signature.startsWith(sig))) {
        throw new Error('Invalid image format');
      }
      
      fs.writeFileSync(cachePath, buffer);
      return buffer;
    } catch (error) {
      if (attempt === retries) {
        console.error(`  ❌ Failed: ${error.message}`);
        return null;
      }
    }
  }
  return null;
}

async function addOrientationsToExistingHashes() {
  try {
    console.log('🔄 Adding orientation hashes to existing cards...\n');
    
    // Get cards that have hashes but missing orientation hashes
    // Process ALL remaining cards (no limit)
    const cards = await all(`
      SELECT product_id, name, image_url
      FROM products
      WHERE category_id = 3
        AND image_url IS NOT NULL
        AND image_url != ''
        AND image_hash_perceptual IS NOT NULL
        AND (
          image_hash_perceptual_normal IS NULL OR
          image_hash_wavelet_normal IS NULL OR
          image_hash_perceptual_mirrored IS NULL OR
          image_hash_perceptual_upsidedown IS NULL
        )
      ORDER BY product_id
    `);
    
    console.log(`📋 Found ${cards.length} cards needing orientation hashes\n`);
    
    if (cards.length === 0) {
      console.log('✅ All cards already have orientation hashes!');
      return;
    }
    
    let processed = 0;
    let success = 0;
    let failed = 0;
    
    for (const card of cards) {
      processed++;
      
      // Download image
      const imageBuffer = await downloadImage(card.image_url);
      if (!imageBuffer) {
        failed++;
        if (processed % 10 === 0) {
          process.stdout.write(`  ⚠️  Processed ${processed}/${cards.length} (${success} success, ${failed} failed)...\r`);
        }
        continue;
      }
      
      // Calculate hashes for all orientations
      try {
        const allOrientationsHashes = await calculateAllHashesAllOrientations(imageBuffer);
        
        if (allOrientationsHashes && allOrientationsHashes.normal && allOrientationsHashes.normal.perceptualHash) {
          // Update with all orientations
          // Use direct assignment (not COALESCE) to ensure values are set
          await run(`
            UPDATE products
            SET 
              -- Normal orientation
              image_hash_perceptual_normal = ?,
              image_hash_difference_normal = ?,
              image_hash_average_normal = ?,
              image_hash_wavelet_normal = ?,
              -- Mirrored orientation
              image_hash_perceptual_mirrored = ?,
              image_hash_difference_mirrored = ?,
              image_hash_average_mirrored = ?,
              image_hash_wavelet_mirrored = ?,
              -- Upside-down orientation
              image_hash_perceptual_upsidedown = ?,
              image_hash_difference_upsidedown = ?,
              image_hash_average_upsidedown = ?,
              image_hash_wavelet_upsidedown = ?,
              -- Mirrored + Upside-down orientation
              image_hash_perceptual_mirrored_upsidedown = ?,
              image_hash_difference_mirrored_upsidedown = ?,
              image_hash_average_mirrored_upsidedown = ?,
              image_hash_wavelet_mirrored_upsidedown = ?,
              image_hash_updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ?
          `, [
            // Normal
            allOrientationsHashes.normal.perceptualHash,
            allOrientationsHashes.normal.differenceHash,
            allOrientationsHashes.normal.averageHash,
            allOrientationsHashes.normal.waveletHash,
            // Mirrored
            allOrientationsHashes.mirrored?.perceptualHash || null,
            allOrientationsHashes.mirrored?.differenceHash || null,
            allOrientationsHashes.mirrored?.averageHash || null,
            allOrientationsHashes.mirrored?.waveletHash || null,
            // Upside-down
            allOrientationsHashes.upsideDown?.perceptualHash || null,
            allOrientationsHashes.upsideDown?.differenceHash || null,
            allOrientationsHashes.upsideDown?.averageHash || null,
            allOrientationsHashes.upsideDown?.waveletHash || null,
            // Mirrored + Upside-down
            allOrientationsHashes.mirroredUpsideDown?.perceptualHash || null,
            allOrientationsHashes.mirroredUpsideDown?.differenceHash || null,
            allOrientationsHashes.mirroredUpsideDown?.averageHash || null,
            allOrientationsHashes.mirroredUpsideDown?.waveletHash || null,
            card.product_id
          ]);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`\n  ❌ Error hashing ${card.name}:`, error.message);
        failed++;
      }
      
      // Progress update (more frequent for long runs)
      if (processed % 10 === 0 || processed === cards.length) {
        const percentage = Math.round((processed / cards.length) * 100);
        process.stdout.write(`  ✅ Processed ${processed}/${cards.length} (${percentage}%) - ${success} success, ${failed} failed...\r`);
      }
      
      // Detailed progress every 100 cards
      if (processed % 100 === 0) {
        console.log(`\n  📊 Progress: ${processed}/${cards.length} (${Math.round((processed / cards.length) * 100)}%) - ${success} success, ${failed} failed`);
      }
      
      // Increased delay with jitter to avoid rate limiting
      const baseDelay = 300;
      const jitter = Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
      
      // Longer pause every 50 cards to reduce rate limiting
      if (processed % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`  ⏸️  Pausing 2s after ${processed} cards to avoid rate limits...`);
      }
    }
    
    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Successfully updated: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📦 Total processed: ${processed}`);
    
    // Check remaining
    const remaining = await get(`
      SELECT COUNT(*) as count
      FROM products
      WHERE category_id = 3
        AND image_url IS NOT NULL
        AND image_hash_perceptual IS NOT NULL
        AND (
          image_hash_perceptual_normal IS NULL OR
          image_hash_wavelet_normal IS NULL OR
          image_hash_perceptual_mirrored IS NULL OR
          image_hash_perceptual_upsidedown IS NULL
        )
    `);
    
    if (remaining.count > 0) {
      console.log(`\n⚠️  ${remaining.count} cards still need orientation hashes.`);
      console.log(`💡 Some cards may have failed. Check the error messages above.`);
      console.log(`💡 You can run this script again to retry failed cards.`);
    } else {
      console.log(`\n🎉 All cards updated with complete orientation hashes!`);
      console.log(`✅ All cards now have:`);
      console.log(`   - Normal orientation (perceptual, difference, average, wavelet)`);
      console.log(`   - Mirrored orientation`);
      console.log(`   - Upside-down orientation`);
      console.log(`   - Mirrored+upside-down orientation`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

addOrientationsToExistingHashes();


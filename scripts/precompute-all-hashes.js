// Pre-compute image hashes for ALL cards in the database
// This is critical for scanner accuracy - we need all cards hashed!

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
  
      // Add much longer random delay before each download to avoid rate limiting
      // Very conservative delays to avoid 403 rate limits
      const initialDelay = Math.random() * 5000 + 5000; // 5-10 seconds
      await new Promise(resolve => setTimeout(resolve, initialDelay));
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
          if (attempt > 1) {
            // Exponential backoff with jitter - very long delays
            const baseDelay = Math.pow(2, attempt - 1) * 30000; // Start at 30s, then 60s, 120s
            const jitter = Math.random() * 20000; // Up to 20s jitter
            const delay = baseDelay + jitter;
            await new Promise(resolve => setTimeout(resolve, delay));
            console.log(`  🔄 Retry attempt ${attempt}/${retries} (waiting ${Math.round(delay/1000)}s)...`);
          }
      
      // More realistic browser headers to avoid detection
      // Rotate User-Agent to appear more like different browsers
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
      ];
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      
      const headers = {
        'User-Agent': randomUserAgent,
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
          // 403 means we're being blocked - wait much longer before retry
          if (attempt < retries) {
            // Progressive backoff: 30s, 60s, 120s (much longer)
            const blockDelay = (attempt * 30 * 1000) + (Math.random() * 20000); // 30-50s, 60-80s, 90-110s
            console.log(`  ⚠️  Rate limited (403), waiting ${Math.round(blockDelay/1000)}s before retry...`);
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
      
      // Validate it's actually an image (check file signature)
      const signature = buffer.toString('hex', 0, 4).toUpperCase();
      const validSignatures = ['FFD8FF', '89504E', '474946', '52494646']; // JPEG, PNG, GIF, WEBP
      if (!validSignatures.some(sig => signature.startsWith(sig))) {
        throw new Error('Invalid image format');
      }
      
      fs.writeFileSync(cachePath, buffer);
      return buffer;
    } catch (error) {
      if (attempt === retries) {
        console.error(`  ❌ Failed after ${retries} attempts: ${error.message}`);
        return null;
      }
      // Continue to next retry
    }
  }
  return null;
}

async function hashAllCards() {
  try {
    console.log('🔄 Starting hash computation for ALL cards...\n');
    
    // Get count of cards that need hashing
    const stats = await get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN image_hash_perceptual IS NOT NULL THEN 1 END) as hashed
      FROM products
      WHERE category_id = 3
        AND image_url IS NOT NULL
        AND image_url != ''
    `);
    
    console.log(`📊 Database Status:`);
    console.log(`   Total cards: ${stats.total}`);
    console.log(`   Already hashed: ${stats.hashed}`);
    console.log(`   Remaining: ${stats.total - stats.hashed}\n`);
    
    if (stats.hashed >= stats.total) {
      console.log('✅ All cards already hashed!');
      return;
    }
    
    // Get all cards that need hashing
    const cards = await all(`
      SELECT product_id, name, image_url
      FROM products
      WHERE category_id = 3
        AND image_url IS NOT NULL
        AND image_url != ''
        AND (image_hash_perceptual IS NULL OR image_hash_perceptual = '')
      ORDER BY product_id
    `);
    
    console.log(`📋 Processing ${cards.length} cards...\n`);
    
    let processed = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;
    let consecutiveFailures = 0; // Track consecutive failures to pause longer
    
    for (const card of cards) {
      processed++;
      
      // If we've had multiple consecutive failures, pause longer
      if (consecutiveFailures >= 3) {
        const cooldownDelay = 60000 + (Math.random() * 60000); // 60-120 seconds
        console.log(`\n  ⚠️  ${consecutiveFailures} consecutive failures detected. Cooling down for ${Math.round(cooldownDelay/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, cooldownDelay));
        consecutiveFailures = 0; // Reset counter after cooldown
      }
      
      // Check if already hashed (double-check)
      const existing = await get(`
        SELECT image_hash_perceptual
        FROM products
        WHERE product_id = ?
      `, [card.product_id]);
      
      if (existing && existing.image_hash_perceptual) {
        skipped++;
        if (processed % 100 === 0) {
          process.stdout.write(`  ⏭️  Skipped ${processed} cards (${success} hashed, ${failed} failed, ${skipped} skipped)...\r`);
        }
        continue;
      }
      
      // Download image
      const imageBuffer = await downloadImage(card.image_url);
      if (!imageBuffer) {
        failed++;
        consecutiveFailures++;
        if (processed % 10 === 0) {
          process.stdout.write(`  ⚠️  Processed ${processed}/${cards.length} (${success} success, ${failed} failed, ${consecutiveFailures} consecutive failures)...\r`);
        }
        // Add extra delay after failure
        await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
        continue;
      }
      
      // Reset consecutive failures on success
      consecutiveFailures = 0;
      
      // Calculate hashes for all orientations
      try {
        const allOrientationsHashes = await calculateAllHashesAllOrientations(imageBuffer);
        
        if (allOrientationsHashes && allOrientationsHashes.normal && allOrientationsHashes.normal.perceptualHash) {
          // Update with all orientations
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
              -- Backward compatibility (use normal orientation)
              image_hash_perceptual = ?,
              image_hash_difference = ?,
              image_hash_average = ?,
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
            // Backward compatibility
            allOrientationsHashes.normal.perceptualHash,
            allOrientationsHashes.normal.differenceHash,
            allOrientationsHashes.normal.averageHash,
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
      
      // Progress update
      if (processed % 10 === 0) {
        process.stdout.write(`  ✅ Processed ${processed}/${cards.length} (${success} hashed, ${failed} failed, ${skipped} skipped)...\r`);
      }
      
      // Increased delay to avoid rate limiting (especially after 403 errors)
      // Add random jitter to make requests less predictable
      const baseDelay = 2000; // Increased base delay to 2 seconds
      const jitter = Math.random() * 2000; // Random 0-2s jitter
      await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
      
      // Longer pause every 10 cards to reduce rate limiting (more frequent)
      if (processed % 10 === 0) {
        const pauseDelay = 5000 + (Math.random() * 3000); // 5-8 seconds
        await new Promise(resolve => setTimeout(resolve, pauseDelay));
        console.log(`  ⏸️  Pausing ${Math.round(pauseDelay/1000)}s after ${processed} cards to avoid rate limits...`);
      }
      
      // Extended pause every 50 cards (more frequent)
      if (processed % 50 === 0) {
        const longPause = 20000 + (Math.random() * 10000); // 20-30 seconds
        await new Promise(resolve => setTimeout(resolve, longPause));
        console.log(`  ⏸️  Extended pause ${Math.round(longPause/1000)}s after ${processed} cards...`);
      }
      
      // Very long pause every 200 cards
      if (processed % 200 === 0) {
        const veryLongPause = 60000 + (Math.random() * 30000); // 60-90 seconds (1-1.5 minutes)
        await new Promise(resolve => setTimeout(resolve, veryLongPause));
        console.log(`  ⏸️  Very long pause ${Math.round(veryLongPause/1000)}s after ${processed} cards to reset rate limit window...`);
      }
    }
    
    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Successfully hashed: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏭️  Skipped (already hashed): ${skipped}`);
    console.log(`   📦 Total processed: ${processed}`);
    
    // Final stats
    const finalStats = await get(`
      SELECT COUNT(*) as hashed
      FROM products
      WHERE category_id = 3
        AND image_url IS NOT NULL
        AND image_hash_perceptual IS NOT NULL
    `);
    
    console.log(`\n🎉 Total cards with hashes: ${finalStats.hashed}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

hashAllCards();


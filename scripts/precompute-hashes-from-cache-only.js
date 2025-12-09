// Pre-compute image hashes ONLY from cached images
// This avoids rate limiting by only using images we've already downloaded
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { calculateAllHashesAllOrientations } from '../server/utils/imageHash.js';
import { config } from '../server/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = config?.databasePath || path.resolve(__dirname, '../cards.db');
console.log(`📁 Using database: ${dbPath}`);
const db = new sqlite3.Database(dbPath);

const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));
const get = promisify(db.get.bind(db));

const cacheDir = path.resolve(__dirname, '../.image-cache');
if (!fs.existsSync(cacheDir)) {
  console.error('❌ Cache directory does not exist!');
  process.exit(1);
}

async function hashFromCacheOnly() {
  try {
    console.log('🔄 Starting hash computation from cached images only...\n');
    
    // Get all cached image files
    const cacheFiles = fs.readdirSync(cacheDir).filter(f => 
      f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp')
    );
    
    console.log(`📋 Found ${cacheFiles.length} cached images\n`);
    
    // Build a map of all cache files for faster lookup
    const cacheFileMap = new Map();
    for (const file of cacheFiles) {
      // Extract product ID from filename (e.g., "42346_200w.jpg" -> "42346")
      const match = file.match(/^(\d+)/);
      if (match) {
        const productId = parseInt(match[1], 10);
        if (!cacheFileMap.has(productId)) {
          cacheFileMap.set(productId, []);
        }
        cacheFileMap.get(productId).push(file);
      }
    }
    
    console.log(`📋 Built cache map: ${cacheFileMap.size} product IDs have cached images\n`);
    
    // Get all cards that need hashing (check new column format)
    const cards = await all(`
      SELECT product_id, name, image_url
      FROM products
      WHERE category_id = 3
        AND image_url IS NOT NULL
        AND image_url != ''
        AND (image_hash_perceptual_normal IS NULL OR image_hash_perceptual_normal = '')
      ORDER BY product_id
    `);
    
    console.log(`📋 Found ${cards.length} cards needing hashes\n`);
    
    let processed = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;
    let cached = 0;
    
    for (const card of cards) {
      processed++;
      
      // Check if already hashed (double-check)
      const existing = await get(`
        SELECT image_hash_perceptual_normal
        FROM products
        WHERE product_id = ?
      `, [card.product_id]);
      
      if (existing && existing.image_hash_perceptual_normal) {
        skipped++;
        continue;
      }
      
      // Check if image is cached using product_id lookup
      const cachedFiles = cacheFileMap.get(card.product_id);
      if (!cachedFiles || cachedFiles.length === 0) {
        // Image not cached, skip it (don't count as processed for progress)
        continue;
      }
      
      // Try to find a valid image file (prefer _200w.jpg format, fallback to others)
      let cacheKey = null;
      let cachePath = null;
      
      // Prefer _200w.jpg format
      const preferredFile = cachedFiles.find(f => f.includes('_200w.jpg'));
      if (preferredFile) {
        cacheKey = preferredFile;
        cachePath = path.join(cacheDir, cacheKey);
      } else {
        // Use first available file
        cacheKey = cachedFiles[0];
        cachePath = path.join(cacheDir, cacheKey);
      }
      
      cached++;
      
      // Read cached image
      try {
        const imageBuffer = fs.readFileSync(cachePath);
        
        // Validate image buffer
        if (!imageBuffer || imageBuffer.length === 0) {
          console.error(`\n  ⚠️  Empty cache file for ${card.name} (${cacheKey})`);
          failed++;
          continue;
        }
        
        // Validate it's actually an image (check file signature)
        const signature = imageBuffer.slice(0, 4).toString('hex').toUpperCase();
        const validSignatures = ['FFD8FF', '89504E', '474946', '52494646']; // JPEG, PNG, GIF, WEBP
        
        // Check for HTML error pages (common when CDN blocks requests)
        const textStart = imageBuffer.slice(0, 100).toString('utf-8', 0, 100).toLowerCase();
        if (textStart.includes('<html') || textStart.includes('<!doctype') || textStart.includes('403') || textStart.includes('forbidden')) {
          console.error(`\n  ⚠️  HTML error page (likely 403) for ${card.name} (${cacheKey}) - skipping`);
          failed++;
          // Delete invalid cache file so it can be re-downloaded later
          try {
            fs.unlinkSync(cachePath);
          } catch (e) {
            // Ignore deletion errors
          }
          continue;
        }
        
        if (!validSignatures.some(sig => signature.startsWith(sig))) {
          console.error(`\n  ⚠️  Invalid image format for ${card.name} (${cacheKey}): ${signature}`);
          failed++;
          // Delete invalid cache file
          try {
            fs.unlinkSync(cachePath);
          } catch (e) {
            // Ignore deletion errors
          }
          continue;
        }
        
        // Calculate hashes for all orientations
        let allOrientationsHashes;
        try {
          allOrientationsHashes = await calculateAllHashesAllOrientations(imageBuffer);
        } catch (hashError) {
          console.error(`\n  ❌ Hash calculation error for ${card.name} (${cacheKey}):`, hashError.message);
          failed++;
          continue;
        }
        
        if (allOrientationsHashes && allOrientationsHashes.normal && allOrientationsHashes.normal.perceptualHash) {
          // Update with all orientations
          await run(`
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
            allOrientationsHashes.mirrored?.perceptualHash || null,
            allOrientationsHashes.mirrored?.differenceHash || null,
            allOrientationsHashes.mirrored?.averageHash || null,
            allOrientationsHashes.mirrored?.waveletHash || null,
            allOrientationsHashes.upsideDown?.perceptualHash || null,
            allOrientationsHashes.upsideDown?.differenceHash || null,
            allOrientationsHashes.upsideDown?.averageHash || null,
            allOrientationsHashes.upsideDown?.waveletHash || null,
            allOrientationsHashes.mirroredUpsideDown?.perceptualHash || null,
            allOrientationsHashes.mirroredUpsideDown?.differenceHash || null,
            allOrientationsHashes.mirroredUpsideDown?.averageHash || null,
            allOrientationsHashes.mirroredUpsideDown?.waveletHash || null,
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
      if (processed % 100 === 0) {
        process.stdout.write(`  ✅ Processed ${processed}/${cards.length} (${success} hashed, ${cached} from cache, ${failed} failed, ${skipped} skipped)...\r`);
      }
    }
    
    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Successfully hashed: ${success}`);
    console.log(`   📦 Hashed from cache: ${cached}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏭️  Skipped (already hashed): ${skipped}`);
    console.log(`   📋 Total processed: ${processed}`);
    console.log(`\n💡 Tip: Run 'npm run hashes:precompute-all' to download and hash remaining images`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    db.close();
  }
}

hashFromCacheOnly().catch(console.error);


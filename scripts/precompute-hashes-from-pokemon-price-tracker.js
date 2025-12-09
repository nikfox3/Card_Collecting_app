// Pre-compute image hashes using Pokemon Price Tracker API
// This avoids TCGPlayer CDN rate limits by using the API to get image URLs
// The API provides higher quality images (800x800) and better rate limits

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
const imagesDir = path.resolve(__dirname, '../public/images/cards');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const API_KEY = config.pokemonPriceTrackerAPIKey;
const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';

if (!API_KEY) {
  console.error('❌ Pokemon Price Tracker API key not found!');
  console.error('💡 Set POKEMON_PRICE_TRACKER_API_KEY in server/.env');
  process.exit(1);
}

/**
 * Fetch card data from Pokemon Price Tracker API
 */
async function fetchCardFromAPI(tcgPlayerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/cards?tcgPlayerId=${tcgPlayerId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log(`  ⚠️  Rate limited (429), waiting 60 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
        return null;
      }
      if (response.status === 403) {
        console.log(`  ⚠️  Forbidden (403) - API key may be invalid or rate limited`);
        console.log(`  💡 Check your API key and credits remaining`);
        return null;
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      console.log(`  ⚠️  API returned ${response.status} for product ${tcgPlayerId}: ${errorText.substring(0, 100)}`);
      return null;
    }
    
    const data = await response.json();
    if (data && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error(`  ❌ API error for product ${tcgPlayerId}:`, error.message);
    return null;
  }
}

/**
 * Download image from URL with retry logic
 */
async function downloadImage(imageUrl, retries = 3) {
  const cacheKey = imageUrl.split('/').pop().split('?')[0];
  const cachePath = path.join(cacheDir, cacheKey);
  
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath);
  }
  
  // Add delay to respect rate limits (API has better limits than direct CDN)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)); // 1-2 seconds
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = Math.pow(2, attempt - 1) * 2000; // 2s, 4s, 8s
        console.log(`  🔄 Retry ${attempt}/${retries} (waiting ${delay/1000}s)...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.pokemonpricetracker.com/',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
        },
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 30000);
          return controller.signal;
        })()
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          // 403 from TCGPlayer CDN - this is expected, but we should skip this image
          // The API gave us the URL, but TCGPlayer is blocking direct downloads
          console.log(`  ⚠️  403 Forbidden from CDN for ${imageUrl} - TCGPlayer blocking downloads`);
          console.log(`  💡 This is expected - TCGPlayer CDN blocks automated downloads`);
          console.log(`  💡 Consider using cached images or waiting for rate limit reset`);
          // Don't retry - TCGPlayer will continue blocking
          return null;
        }
        if (response.status === 429) {
          console.log(`  ⚠️  Rate limited (429), waiting 60s...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Validate image
      if (buffer.length < 4) {
        throw new Error('Invalid image file');
      }
      
      const signature = buffer.slice(0, 4).toString('hex').toUpperCase();
      const validSignatures = ['FFD8FF', '89504E', '474946', '52494646'];
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
    }
  }
  return null;
}

async function hashCardsFromAPI() {
  try {
    console.log('🔄 Starting hash computation using Pokemon Price Tracker API...\n');
    
    // Get cards that need hashing
    const cards = await all(`
      SELECT product_id, name, image_url
      FROM products
      WHERE category_id = 3
        AND image_url IS NOT NULL
        AND image_url != ''
        AND (image_hash_perceptual_normal IS NULL OR image_hash_perceptual_normal = '')
      ORDER BY product_id
      LIMIT 1000
    `);
    
    console.log(`📋 Found ${cards.length} cards needing hashes\n`);
    console.log(`💡 Using Pokemon Price Tracker API to get high-quality image URLs\n`);
    console.log(`⚠️  Note: API has rate limits (20k credits/day for pro plan)\n`);
    
    let processed = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;
    let apiFailures = 0;
    
    for (const card of cards) {
      processed++;
      
      // Check if already hashed
      const existing = await get(`
        SELECT image_hash_perceptual_normal
        FROM products
        WHERE product_id = ?
      `, [card.product_id]);
      
      if (existing && existing.image_hash_perceptual_normal) {
        skipped++;
        continue;
      }
      
      // Fetch card data from API (includes image URLs)
      const apiData = await fetchCardFromAPI(card.product_id);
      
      if (!apiData) {
        apiFailures++;
        if (processed % 10 === 0) {
          process.stdout.write(`  ⚠️  Processed ${processed}/${cards.length} (${success} hashed, ${apiFailures} API failures)...\r`);
        }
        // Wait longer after API failure
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      // Get highest quality image URL (prefer 800x800, fallback to 400x400, then 200x200)
      const imageUrl = apiData.imageCdnUrl800 || 
                       apiData.imageCdnUrl400 || 
                       apiData.imageCdnUrl200 || 
                       apiData.imageUrl || 
                       null;
      
      if (!imageUrl) {
        console.log(`\n  ⚠️  No image URL in API response for ${card.name}`);
        failed++;
        continue;
      }
      
      // Download image
      const imageBuffer = await downloadImage(imageUrl);
      if (!imageBuffer) {
        failed++;
        if (processed % 10 === 0) {
          process.stdout.write(`  ⚠️  Processed ${processed}/${cards.length} (${success} hashed, ${failed} failed)...\r`);
        }
        continue;
      }
      
      // Save image to local storage (public/images/cards/)
      const imageFilename = `${card.product_id}.jpg`;
      const localImagePath = path.join(imagesDir, imageFilename);
      fs.writeFileSync(localImagePath, imageBuffer);
      
      // Update database with local image URL
      const localImageUrl = `/images/cards/${imageFilename}`;
      await run(`
        UPDATE products
        SET local_image_url = ?
        WHERE product_id = ?
      `, [localImageUrl, card.product_id]);
      
      // Calculate hashes for all orientations
      try {
        const allOrientationsHashes = await calculateAllHashesAllOrientations(imageBuffer);
        
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
          
          // Update image URL if API provided a better one
          if (imageUrl !== card.image_url) {
            await run(`
              UPDATE products
              SET image_url = ?
              WHERE product_id = ?
            `, [imageUrl, card.product_id]);
          }
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`\n  ❌ Error hashing ${card.name}:`, error.message);
        failed++;
      }
      
      // Progress update
      if (processed % 10 === 0) {
        process.stdout.write(`  ✅ Processed ${processed}/${cards.length} (${success} hashed, ${failed} failed, ${apiFailures} API failures)...\r`);
      }
      
      // Pause every 50 cards to respect API rate limits
      if (processed % 50 === 0) {
        console.log(`\n  ⏸️  Pausing 5s after ${processed} cards to respect API rate limits...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Successfully hashed: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️  API failures: ${apiFailures}`);
    console.log(`   ⏭️  Skipped (already hashed): ${skipped}`);
    console.log(`   📋 Total processed: ${processed}`);
    console.log(`\n💡 Tip: API provides higher quality images (800x800) than direct CDN access`);
    console.log(`💡 Tip: Run again to process more cards (limited to 1000 per run to respect API limits)`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    db.close();
  }
}

hashCardsFromAPI().catch(console.error);


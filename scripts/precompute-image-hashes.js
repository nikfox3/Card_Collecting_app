// Pre-compute image hashes for all cards in the database
// This enables visual card matching using image hashing
// Run this script after adding hash columns to the database

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { calculateAllHashes } from '../server/utils/imageHash.js';
import { config } from '../server/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path - use config for absolute path
const dbPath = config?.databasePath || path.resolve(__dirname, '../cards.db');
console.log(`📁 Using database: ${dbPath}`);

// Open database
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

// Cache directory for downloaded images
const cacheDir = path.resolve(__dirname, '../.image-cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

/**
 * Download image and return buffer with retry logic
 */
async function downloadImage(imageUrl, retries = 3) {
  // Check cache first
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
      } else {
        console.log(`  📥 Downloading: ${imageUrl.substring(0, 60)}...`);
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
        // Add timeout (use AbortController for better compatibility)
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 30000); // 30 second timeout
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
      
      // Validate it's actually an image (check file signature)
      if (buffer.length < 4) {
        throw new Error('Invalid image file (too small)');
      }
      
      // Validate image format
      const signature = buffer.toString('hex', 0, 4).toUpperCase();
      const validSignatures = ['FFD8FF', '89504E', '474946', '52494646']; // JPEG, PNG, GIF, WEBP
      if (!validSignatures.some(sig => signature.startsWith(sig))) {
        throw new Error('Invalid image format');
      }
      
      // Cache the image
      fs.writeFileSync(cachePath, buffer);
      
      return buffer;
    } catch (error) {
      if (attempt === retries) {
        // Last attempt failed
        console.error(`  ❌ Failed to download image: ${error.message}`);
        return null;
      }
      // Continue to next retry
      continue;
    }
  }
  
  return null;
}

/**
 * Pre-compute hashes for a single card
 */
async function computeHashesForCard(card) {
  if (!card.image_url) {
    return null;
  }
  
  try {
    const imageBuffer = await downloadImage(card.image_url);
    if (!imageBuffer) {
      return null;
    }
    
    const hashes = await calculateAllHashes(imageBuffer);
    return hashes;
  } catch (error) {
    console.error(`  ❌ Error computing hashes for ${card.name}:`, error.message);
    return null;
  }
}

/**
 * Main function to pre-compute all hashes
 */
async function precomputeHashes() {
  try {
    console.log('🔄 Starting image hash pre-computation...\n');
    
    // Check if hash columns exist
    const tableInfo = await all(`PRAGMA table_info(products)`);
    const hasHashColumns = tableInfo.some(col => col.name === 'image_hash_perceptual');
    
    if (!hasHashColumns) {
      console.log('⚠️  Hash columns not found. Running migration...');
      const migrationSQL = fs.readFileSync(
        path.resolve(__dirname, '../server/migrations/add-image-hashes.sql'),
        'utf-8'
      );
      
      // Execute migration (skip CREATE INDEX if exists)
      const statements = migrationSQL.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await run(statement);
          } catch (err) {
            if (!err.message.includes('duplicate column name') && 
                !err.message.includes('already exists')) {
              console.error(`❌ Migration error: ${err.message}`);
            }
          }
        }
      }
      console.log('✅ Migration complete\n');
    }
    
    // Get all cards with images that don't have hashes yet
    // Process more cards per run - can be overridden with LIMIT env var
    const limit = parseInt(process.env.LIMIT) || 5000; // Default 5000 cards per run
    const cards = await all(`
      SELECT product_id, name, image_url
      FROM products
      WHERE category_id = 3
        AND image_url IS NOT NULL
        AND image_url != ''
        AND (image_hash_perceptual IS NULL OR image_hash_perceptual = '')
      ORDER BY product_id
      LIMIT ?
    `, [limit]);
    
    console.log(`📊 Found ${cards.length} cards to process\n`);
    
    if (cards.length === 0) {
      console.log('✅ All cards already have hashes computed!');
      return;
    }
    
    let processed = 0;
    let success = 0;
    let failed = 0;
    
    // Process in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cards.length / batchSize)}`);
      
      for (const card of batch) {
        processed++;
        process.stdout.write(`  [${processed}/${cards.length}] ${card.name.substring(0, 40)}... `);
        
        const hashes = await computeHashesForCard(card);
        
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
          console.log('✅');
        } else {
          failed++;
          console.log('❌');
        }
        
        // Increased delay with jitter to avoid rate limiting
        const baseDelay = 300;
        const jitter = Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
        
        // Longer pause every 50 cards
        if (processed % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Success: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Progress: ${processed}/${cards.length}`);
    
    // Check if there are more cards to process
    const remaining = await get(`
      SELECT COUNT(*) as count
      FROM products
      WHERE category_id = 3
        AND image_url IS NOT NULL
        AND image_url != ''
        AND (image_hash_perceptual IS NULL OR image_hash_perceptual = '')
    `);
    
    if (remaining.count > 0) {
      console.log(`\n⚠️  ${remaining.count} cards remaining. Run this script again to continue.`);
    } else {
      console.log(`\n🎉 All cards processed!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
precomputeHashes()
  .then(() => {
    db.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    db.close();
    process.exit(1);
  });


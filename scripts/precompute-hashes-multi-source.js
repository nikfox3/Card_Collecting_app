// Pre-compute image hashes using MULTIPLE image sources
// Tries sources in order: Pokemon TCG API > TCGdx > Pokemon Price Tracker > TCGPlayer (fallback)
// This avoids TCGPlayer rate limits and uses better quality images

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { calculateAllHashesAllOrientations } from '../server/utils/imageHashFixed.js';
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

// Image source priorities (try in order)
const SOURCE_PRIORITY = [
  'pokemontcg',  // Pokemon TCG API - best quality, free
  'tcgdx',       // TCGdx - good quality, no rate limits
  'pokemonpricetracker', // Pokemon Price Tracker - high quality, API key required
  'tcgplayer'    // TCGPlayer - fallback only (heavily rate limited, use sparingly)
];

// Track rate limit failures globally
if (!global.tcgplayerRateLimitCount) {
  global.tcgplayerRateLimitCount = 0;
}

/**
 * Get Pokemon TCG API image URL
 */
function getPokemonTCGImageUrl(card) {
  // Map set names to Pokemon TCG API set IDs
  // Expanded mapping for better coverage
  const setCodeMap = {
    // Scarlet & Violet era
    '151': 'sv12',
    'Black Bolt': 'sv13',
    'Destined Rivals': 'sv14',
    'Journey Together': 'sv15',
    'White Flare': 'sv16',
    'Mega Evolution': 'sv17',
    'Obsidian Flames': 'sv11',
    'Scarlet & Violet': 'sv1',
    'Paldea Evolved': 'sv2',
    // Sword & Shield era
    'Crown Zenith': 'swsh12pt5',
    'Silver Tempest': 'swsh12',
    'Lost Origin': 'swsh11',
    'Astral Radiance': 'swsh10',
    'Brilliant Stars': 'swsh9',
    'Fusion Strike': 'swsh8',
    'Evolving Skies': 'swsh7',
    'Chilling Reign': 'swsh6',
    'Battle Styles': 'swsh5',
    'Vivid Voltage': 'swsh4',
    'Darkness Ablaze': 'swsh3',
    'Rebel Clash': 'swsh2',
    'Sword & Shield': 'swsh1',
    // Classic sets
    'Base Set': 'base1',
    'Jungle': 'jungle',
    'Fossil': 'fossil',
    // Note: Many older sets and promo sets may not be available in Pokemon TCG API
  };
  
  const setName = card.set_name || '';
  // Try exact match first
  let setId = setCodeMap[setName];
  
  // Try case-insensitive match
  if (!setId) {
    const lowerName = setName.toLowerCase();
    for (const [key, value] of Object.entries(setCodeMap)) {
      if (key.toLowerCase() === lowerName) {
        setId = value;
        break;
      }
    }
  }
  
  // Try partial match (e.g., "Scarlet & Violet Base Set" -> "sv1")
  if (!setId && setName) {
    if (setName.toLowerCase().includes('scarlet') || setName.toLowerCase().includes('violet')) {
      setId = 'sv1';
    } else if (setName.toLowerCase().includes('paldea')) {
      setId = 'sv2';
    } else if (setName.toLowerCase().includes('obsidian')) {
      setId = 'sv11';
    } else if (setName.toLowerCase().includes('crown zenith')) {
      setId = 'swsh12pt5';
    }
  }
  
  if (!setId) return null;
  
  // Extract card number (remove leading zeros, handle formats like "001/102")
  let cardNumber = card.ext_number || '';
  if (cardNumber.includes('/')) {
    cardNumber = cardNumber.split('/')[0];
  }
  cardNumber = cardNumber.replace(/^0+/, '') || '1'; // Remove leading zeros
  
  return `https://images.pokemontcg.io/${setId}/${cardNumber}_hires.png`;
}

/**
 * Get TCGdx image URL
 */
function getTCGdxImageUrl(card) {
  const setCodeMap = {
    // Scarlet & Violet era
    '151': 'sv12',
    'Black Bolt': 'sv13',
    'Destined Rivals': 'sv14',
    'Journey Together': 'sv15',
    'White Flare': 'sv16',
    'Mega Evolution': 'sv17',
    'Obsidian Flames': 'sv11',
    'Scarlet & Violet': 'sv1',
    'Paldea Evolved': 'sv2',
    // Sword & Shield era
    'Crown Zenith': 'swsh12pt5',
    'Silver Tempest': 'swsh12',
    'Lost Origin': 'swsh11',
    'Astral Radiance': 'swsh10',
    'Brilliant Stars': 'swsh9',
    'Fusion Strike': 'swsh8',
    'Evolving Skies': 'swsh7',
    'Chilling Reign': 'swsh6',
    'Battle Styles': 'swsh5',
    'Vivid Voltage': 'swsh4',
    'Darkness Ablaze': 'swsh3',
    'Rebel Clash': 'swsh2',
    'Sword & Shield': 'swsh1',
    // Classic sets
    'Base Set': 'base1',
    'Jungle': 'jungle1',
    'Fossil': 'fossil1',
    'Team Rocket': 'tr1',
    'Gym Heroes': 'gym1',
    'Gym Challenge': 'gym2',
    // Note: TCGdx has better coverage than Pokemon TCG API
  };
  
  const setName = card.set_name || '';
  // Try exact match first
  let setCode = setCodeMap[setName];
  
  // Try case-insensitive match
  if (!setCode) {
    const lowerName = setName.toLowerCase();
    for (const [key, value] of Object.entries(setCodeMap)) {
      if (key.toLowerCase() === lowerName) {
        setCode = value;
        break;
      }
    }
  }
  
  // Try partial match
  if (!setCode && setName) {
    const lowerName = setName.toLowerCase();
    if (lowerName.includes('scarlet') || lowerName.includes('violet')) {
      setCode = 'sv1';
    } else if (lowerName.includes('paldea')) {
      setCode = 'sv2';
    } else if (lowerName.includes('obsidian')) {
      setCode = 'sv11';
    } else if (lowerName.includes('crown zenith')) {
      setCode = 'swsh12pt5';
    } else if (lowerName.includes('base set')) {
      setCode = 'base1';
    }
  }
  
  if (!setCode) return null;
  
  let cardNumber = card.ext_number || '1';
  if (cardNumber.includes('/')) {
    cardNumber = cardNumber.split('/')[0];
  }
  cardNumber = cardNumber.replace(/^0+/, '') || '1';
  
  return `https://assets.tcgdx.net/en/${setCode}/${cardNumber}/high.webp`;
}

/**
 * Get Pokemon Price Tracker image URL
 */
async function getPokemonPriceTrackerImageUrl(card) {
  if (!config.pokemonPriceTrackerAPIKey) return null;
  
  try {
    const productId = card.product_id;
    if (!productId) return null;
    
    const response = await fetch(`https://www.pokemonpricetracker.com/api/v2/cards?tcgPlayerId=${productId}`, {
      headers: {
        'Authorization': `Bearer ${config.pokemonPriceTrackerAPIKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data?.data?.[0]?.imageUrl) {
      return data.data[0].imageUrl;
    }
  } catch (error) {
    // Silent fail - try next source
  }
  
  return null;
}

/**
 * Download image from URL with retry logic
 */
async function downloadImage(imageUrl, source, retries = 2) {
  // Check cache first - try both source-specific and generic cache keys
  const urlFilename = imageUrl.split('/').pop().split('?')[0];
  const cacheKeys = [
    `${source}_${urlFilename}`,  // Source-specific cache
    urlFilename                   // Generic cache (from previous TCGPlayer downloads)
  ];
  
  for (const cacheKey of cacheKeys) {
    const cachePath = path.join(cacheDir, cacheKey);
    if (fs.existsSync(cachePath)) {
      const buffer = fs.readFileSync(cachePath);
      // Validate it's actually an image
      if (buffer.length > 100) {
        const signature = buffer.toString('hex', 0, 4).toUpperCase();
        if (signature.startsWith('FFD8FF') || signature.startsWith('89504E') || signature.startsWith('474946')) {
          console.log(`  ✅ Using cached image: ${cacheKey}`);
          return buffer;
        }
      }
    }
  }
  
  // No valid cache found, download fresh
  const cacheKey = `${source}_${urlFilename}`;
  const cachePath = path.join(cacheDir, cacheKey);
  
  // Different delays for different sources
  const delays = {
    pokemontcg: 500 + Math.random() * 500,      // 0.5-1s
    tcgdx: 300 + Math.random() * 300,           // 0.3-0.6s
    pokemonpricetracker: 1000 + Math.random() * 1000, // 1-2s (API rate limits)
    tcgplayer: 10000 + Math.random() * 10000     // 10-20s (very slow, heavily rate limited)
  };
  
  // Skip TCGPlayer if we've hit rate limits too many times
  if (source === 'tcgplayer' && global.tcgplayerRateLimitCount > 5) {
    console.log(`  ⚠️  TCGPlayer: Skipping due to persistent rate limits`);
    return null;
  }
  
  await new Promise(resolve => setTimeout(resolve, delays[source] || 1000));
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = Math.pow(2, attempt - 1) * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          // Rate limited - skip this source
          console.log(`  ⚠️  ${source}: Rate limited (${response.status})`);
          if (source === 'tcgplayer') {
            global.tcgplayerRateLimitCount = (global.tcgplayerRateLimitCount || 0) + 1;
          }
          return null;
        }
        if (response.status === 404) {
          console.log(`  ⚠️  ${source}: Image not found (404)`);
          return null;
        }
        console.log(`  ⚠️  ${source}: HTTP ${response.status}`);
        if (attempt < retries) {
          continue; // Try again
        }
        return null;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      if (buffer.length < 100) {
        continue; // Too small, probably error page
      }
      
      // Validate image signature
      const signature = buffer.toString('hex', 0, 4).toUpperCase();
      if (!signature.startsWith('FFD8FF') && !signature.startsWith('89504E') && !signature.startsWith('474946')) {
        continue; // Not a valid image
      }
      
      // Cache the image
      fs.writeFileSync(cachePath, buffer);
      return buffer;
    } catch (error) {
      if (attempt === retries) {
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Try to get image from multiple sources
 */
async function getImageFromMultipleSources(card) {
  // Try sources in priority order
  for (const source of SOURCE_PRIORITY) {
    let imageUrl = null;
    
    try {
      switch (source) {
        case 'pokemontcg':
          imageUrl = getPokemonTCGImageUrl(card);
          if (!imageUrl) {
            console.log(`  ⚠️  Pokemon TCG API: No set mapping for "${card.set_name}"`);
          }
          break;
        case 'tcgdx':
          imageUrl = getTCGdxImageUrl(card);
          if (!imageUrl) {
            console.log(`  ⚠️  TCGdx: No set mapping for "${card.set_name}"`);
          }
          break;
        case 'pokemonpricetracker':
          imageUrl = await getPokemonPriceTrackerImageUrl(card);
          if (!imageUrl) {
            console.log(`  ⚠️  Pokemon Price Tracker: Card not found or no API key`);
          }
          break;
        case 'tcgplayer':
          imageUrl = card.image_url; // Use existing URL
          break;
      }
      
      if (!imageUrl) {
        continue; // Skip to next source
      }
      
      console.log(`  🔍 Trying ${source}: ${imageUrl.substring(0, 80)}...`);
      const imageBuffer = await downloadImage(imageUrl, source);
      
      if (imageBuffer) {
        console.log(`  ✅ Successfully downloaded from ${source} (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
        return { buffer: imageBuffer, source };
      } else {
        console.log(`  ❌ ${source}: Download failed`);
      }
    } catch (error) {
      console.log(`  ⚠️  ${source} error: ${error.message}`);
      continue;
    }
  }
  
  console.log(`  ❌ All sources failed for this card`);
  return null;
}

/**
 * Main hashing function
 */
async function hashAllCards() {
  console.log('🔄 Starting multi-source hash computation...\n');

  try {
    // Get count of cards that need hashing
    const stats = await get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN image_hash_difference_normal IS NOT NULL AND image_hash_difference_normal != '' THEN 1 END) as hashed
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

    // Select cards that need hashing
    const cardsToHash = await all(`
      SELECT 
        p.product_id, 
        p.name, 
        p.image_url,
        p.ext_number,
        g.name as set_name
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.category_id = 3
        AND p.image_url IS NOT NULL
        AND p.image_url != ''
        AND (p.image_hash_difference_normal IS NULL OR p.image_hash_difference_normal = '')
      ORDER BY p.product_id
      LIMIT ${process.env.LIMIT || '1000'}
    `);

    console.log(`📋 Found ${cardsToHash.length} cards needing hashes\n`);

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const sourceStats = {};

    for (const [index, card] of cardsToHash.entries()) {
      // Progress reporting
      if (index > 0 && index % 10 === 0) {
        console.log(`\n📊 Progress: ${index}/${cardsToHash.length} (${((index / cardsToHash.length) * 100).toFixed(0)}%)`);
        console.log(`   ✅ Success: ${successCount}, ❌ Failed: ${failedCount}, ⏭️  Skipped: ${skippedCount}`);
        console.log(`   📊 Sources: ${JSON.stringify(sourceStats)}\n`);
      }

      try {
        // Check if already hashed
        const existing = await get(`
          SELECT image_hash_difference_normal
          FROM products
          WHERE product_id = ?
        `, [card.product_id]);

        if (existing && existing.image_hash_difference_normal) {
          skippedCount++;
          continue;
        }

        console.log(`\n[${index + 1}/${cardsToHash.length}] Processing: ${card.name} (${card.set_name || 'Unknown Set'})`);

        // Try to get image from multiple sources
        const imageResult = await getImageFromMultipleSources(card);
        
        if (!imageResult) {
          console.log(`  ❌ Failed to download image from any source`);
          failedCount++;
          continue;
        }

        // Track source statistics
        sourceStats[imageResult.source] = (sourceStats[imageResult.source] || 0) + 1;

        // Calculate hashes
        const allOrientationHashes = await calculateAllHashesAllOrientations(imageResult.buffer);

        // Save to database (using fixed implementation - only dHash)
        await run(`
          UPDATE products
          SET
            image_hash_difference_normal = ?,
            image_hash_difference_mirrored = ?,
            image_hash_difference_upsidedown = ?,
            image_hash_difference_mirrored_upsidedown = ?,
            image_hash_updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ?
        `, [
          allOrientationHashes.normal?.differenceHash || null,
          allOrientationHashes.mirrored?.differenceHash || null,
          allOrientationHashes.upsideDown?.differenceHash || null,
          allOrientationHashes.mirroredUpsideDown?.differenceHash || null,
          card.product_id
        ]);

        successCount++;
        console.log(`  ✅ Hashed successfully (source: ${imageResult.source})`);

      } catch (error) {
        console.error(`  ❌ Error processing card ${card.product_id}:`, error.message);
        failedCount++;
      }
    }

    console.log(`\n✅ Finished hashing cards.`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully hashed: ${successCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   ⏭️  Skipped (already hashed): ${skippedCount}`);
    console.log(`   📊 Sources used: ${JSON.stringify(sourceStats)}`);

  } catch (error) {
    console.error('Fatal error during hash computation:', error);
  } finally {
    db.close();
    console.log('🗄️  Database connection closed.');
  }
}

hashAllCards();


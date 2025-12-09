// Pre-compute image hashes using Pokemon TCG API images (RECOMMENDED)
// Uses official Pokemon TCG API images as reference - clean, consistent, high quality
// URL format: https://images.pokemontcg.io/{setId}/{number}_hires.png

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { calculateAllHashesAllOrientations } from '../server/utils/imageHashFixed.js';
import { config } from '../server/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Format time in seconds to human-readable string
 */
function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
    return 'calculating...';
  }
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

const dbPath = config?.databasePath || path.resolve(__dirname, '../cards.db');
console.log(`📁 Using database: ${dbPath}`);
const db = new sqlite3.Database(dbPath);

const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));
const get = promisify(db.get.bind(db));

const cacheDir = path.resolve(__dirname, '../.image-cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY || '';

/**
 * Map set names to Pokemon TCG API set IDs
 * Comprehensive mapping for all major sets
 */
function getPokemonTCGSetId(setName) {
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
    'Paldea Evolved': 'sv2',
    'Paradox Rift': 'sv3',
    'Temporal Forces': 'sv4',
    'Twilight Masquerade': 'sv5',
    'Shrouded Fable': 'sv6',
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
    'Sword & Shield Base Set': 'swsh1',
    // Sun & Moon era
    'Cosmic Eclipse': 'sm12',
    'Hidden Fates': 'sm11',
    'Unified Minds': 'sm11',
    'Unbroken Bonds': 'sm10',
    'Detective Pikachu': 'det1',
    'Team Up': 'sm9',
    'Lost Thunder': 'sm8',
    'Celestial Storm': 'sm7',
    'Forbidden Light': 'sm6',
    'Ultra Prism': 'sm5',
    'Crimson Invasion': 'sm4',
    'Burning Shadows': 'sm3',
    'Guardians Rising': 'sm2',
    'Sun & Moon': 'sm1',
    // XY era
    'Evolutions': 'xy12',
    'Steam Siege': 'xy11',
    'Fates Collide': 'xy10',
    'Generations': 'g1',
    'BREAKpoint': 'xy9',
    'BREAKthrough': 'xy8',
    'Ancient Origins': 'xy7',
    'Roaring Skies': 'xy6',
    'Primal Clash': 'xy5',
    'Phantom Forces': 'xy4',
    'Furious Fists': 'xy3',
    'Flashfire': 'xy2',
    'XY': 'xy1',
    'Kalos Starter Set': 'xy1',
    // Classic sets
    'Base Set': 'base1',
    'Base Set 2': 'base4',
    'Jungle': 'jungle',
    'Fossil': 'fossil',
    'Team Rocket': 'base6',
    'Gym Heroes': 'gym1',
    'Gym Challenge': 'gym2',
    'Neo Genesis': 'neo1',
    'Neo Discovery': 'neo2',
    'Neo Revelation': 'neo3',
    'Neo Destiny': 'neo4',
    // Promos and special sets
    'Black Star Promos': 'basep',
    'Wizards Black Star Promos': 'basep',
  };
  
  const cleanName = (setName || '').trim();
  
  // Remove common prefixes (e.g., "SV01:", "SV2a:", "SWSH08:", "SM-P:", etc.)
  let processedName = cleanName
    .replace(/^[A-Z0-9]+[a-z]?\d*[a-z]?[:\-]\s*/i, '') // Remove "SV01:", "SV2a:", "SWSH08:", etc.
    .replace(/^[A-Z]+[:\-]\s*/i, '') // Remove "SM-P:", "S-P:", etc.
    .replace(/^[A-Z]+\s*[:\-]\s*/i, '') // Remove "SM -", "S -", etc.
    .trim();
  
  // If prefix removal didn't help, use original name
  if (!processedName) {
    processedName = cleanName;
  }
  
  // Try exact match first (with processed name)
  let setId = setCodeMap[processedName] || setCodeMap[cleanName];
  
  // Try case-insensitive match
  if (!setId) {
    const lowerName = processedName.toLowerCase();
    const lowerOriginal = cleanName.toLowerCase();
    for (const [key, value] of Object.entries(setCodeMap)) {
      if (key.toLowerCase() === lowerName || key.toLowerCase() === lowerOriginal) {
        setId = value;
        break;
      }
    }
  }
  
  // Try partial match for common patterns
  if (!setId && processedName) {
    const lowerName = processedName.toLowerCase();
    
    // Scarlet & Violet patterns
    if (lowerName.includes('scarlet') && lowerName.includes('violet') && !lowerName.includes('paldea')) {
      setId = 'sv1';
    } else if (lowerName.includes('paldea evolved') || lowerName.includes('paldea')) {
      setId = 'sv2';
    } else if (lowerName.includes('obsidian flames') || lowerName.includes('obsidian')) {
      setId = 'sv11';
    } else if (lowerName.includes('151') || lowerName.includes('pokemon card 151')) {
      setId = 'sv12';
    } else if (lowerName.includes('sv2a') || (lowerName.includes('sv') && lowerName.includes('151'))) {
      // Handle "SV2a: Pokemon Card 151" format
      setId = 'sv12';
    } else if (lowerName.includes('paradox rift') || lowerName.includes('paradox')) {
      setId = 'sv3';
    } else if (lowerName.includes('temporal forces') || lowerName.includes('temporal')) {
      setId = 'sv4';
    } else if (lowerName.includes('twilight masquerade') || lowerName.includes('twilight')) {
      setId = 'sv5';
    } else if (lowerName.includes('shrouded fable') || lowerName.includes('shrouded')) {
      setId = 'sv6';
    } else if (lowerName.includes('terastal fest') || lowerName.includes('terastal')) {
      setId = 'sv8a'; // Japanese set
    } else if (lowerName.includes('shiny treasure') || lowerName.includes('shiny star')) {
      setId = 'sv4a'; // Japanese set
    } else if (lowerName.includes('black bolt')) {
      setId = 'sv13';
    } else if (lowerName.includes('white flare')) {
      setId = 'sv16';
    } else if (lowerName.includes('destined rivals')) {
      setId = 'sv14';
    } else if (lowerName.includes('journey together')) {
      setId = 'sv15';
    } else if (lowerName.includes('mega evolution')) {
      setId = 'sv17';
    } else if (lowerName.includes('prismatic evolutions')) {
      setId = 'sv6'; // Or appropriate set
    }
    
    // Sword & Shield patterns
    else if (lowerName.includes('crown zenith')) {
      setId = 'swsh12pt5';
    } else if (lowerName.includes('silver tempest')) {
      setId = 'swsh12';
    } else if (lowerName.includes('lost origin')) {
      setId = 'swsh11';
    } else if (lowerName.includes('astral radiance')) {
      setId = 'swsh10';
    } else if (lowerName.includes('brilliant stars')) {
      setId = 'swsh9';
    } else if (lowerName.includes('fusion strike') || lowerName.includes('fusion')) {
      setId = 'swsh8';
    } else if (lowerName.includes('champions path') || lowerName.includes('champion')) {
      setId = 'swsh35'; // Special set
    } else if (lowerName.includes('shining fates') || lowerName.includes('shining')) {
      setId = 'swsh35sv'; // Special set
    } else if (lowerName.includes('celebrations')) {
      setId = 'swsh12pt5'; // Or celebrations set
    } else if (lowerName.includes('vmax climax')) {
      setId = 'swsh8b'; // Japanese set
    } else if (lowerName.includes('vstar universe')) {
      setId = 'swsh12a'; // Japanese set
    } else if (lowerName.includes('tag all stars') || lowerName.includes('tag team')) {
      setId = 'sm12a'; // Japanese set
    } else if (lowerName.includes('gx ultra shiny')) {
      setId = 'sm8b'; // Japanese set
    } else if (lowerName.includes('evolving skies')) {
      setId = 'swsh7';
    } else if (lowerName.includes('chilling reign')) {
      setId = 'swsh6';
    } else if (lowerName.includes('battle styles')) {
      setId = 'swsh5';
    } else if (lowerName.includes('vivid voltage')) {
      setId = 'swsh4';
    } else if (lowerName.includes('darkness ablaze')) {
      setId = 'swsh3';
    } else if (lowerName.includes('rebel clash')) {
      setId = 'swsh2';
    } else if (lowerName.includes('sword') && lowerName.includes('shield') && !lowerName.includes('base')) {
      setId = 'swsh1';
    }
    
    // Classic patterns
    else if (lowerName.includes('base set') && !lowerName.includes('2') && !lowerName.includes('shadowless')) {
      setId = 'base1';
    } else if (lowerName.includes('base set 2') || lowerName.includes('base set2')) {
      setId = 'base4';
    } else if (lowerName.includes('jungle')) {
      setId = 'jungle';
    } else if (lowerName.includes('fossil')) {
      setId = 'fossil';
    }
    
    // Promos and special sets
    else if (lowerName.includes('promo') || lowerName.includes('promotional')) {
      // Try to match specific promo sets
      if (lowerName.includes('sun') && lowerName.includes('moon')) {
        setId = 'smp'; // Sun & Moon Promos
      } else if (lowerName.includes('sword') && lowerName.includes('shield')) {
        setId = 'swshp'; // Sword & Shield Promos
      } else if (lowerName.includes('black star')) {
        setId = 'basep'; // Black Star Promos
      }
      // Generic promo - might not have API images, but try
    }
    
    // Japanese sets and special collections (many may not be in Pokemon TCG API)
    // These are noted but may return null
  }
  
  return setId;
}

/**
 * Get Pokemon TCG API image URL
 * Format: https://images.pokemontcg.io/{setId}/{number}_hires.png
 */
function getPokemonTCGImageUrl(card) {
  const setId = getPokemonTCGSetId(card.set_name);
  if (!setId) {
    return null;
  }
  
  // Extract card number (remove leading zeros, handle formats like "001/102")
  let cardNumber = card.ext_number || '';
  if (cardNumber.includes('/')) {
    cardNumber = cardNumber.split('/')[0];
  }
  // Remove leading zeros
  cardNumber = cardNumber.replace(/^0+/, '') || '1';
  
  // Use high-resolution image
  return `https://images.pokemontcg.io/${setId}/${cardNumber}_hires.png`;
}

/**
 * Download image with caching
 */
async function downloadImage(imageUrl, source = 'pokemontcg') {
  const urlHash = Buffer.from(imageUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  const cacheKey = `${source}_${urlHash}`;
  const cachePath = path.join(cacheDir, `${cacheKey}.jpg`);
  
  // Check cache first
  if (fs.existsSync(cachePath)) {
    try {
      const cached = fs.readFileSync(cachePath);
      // Validate it's a valid image (at least 1KB)
      if (cached.length > 1024) {
        return cached;
      }
    } catch (e) {
      // Cache file corrupted, continue to download
    }
  }
  
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.pokemontcg.com/'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ⚠️  Image not found (404): ${imageUrl}`);
      } else {
        console.log(`  ⚠️  HTTP ${response.status}: ${imageUrl}`);
      }
      return null;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Validate image (at least 1KB)
    if (buffer.length < 1024) {
      console.log(`  ⚠️  Image too small (${buffer.length} bytes), skipping`);
      return null;
    }
    
    // Cache the image
    try {
      fs.writeFileSync(cachePath, buffer);
    } catch (e) {
      // Cache write failed, but continue
    }
    
    return buffer;
  } catch (error) {
    console.log(`  ⚠️  Download error: ${error.message}`);
    return null;
  }
}

/**
 * Hash cards using Pokemon TCG API images
 */
async function hashCardsFromPokemonTCGAPI() {
  try {
    console.log('🔄 Starting hash computation using Pokemon TCG API images...\n');
    console.log('💡 Using official Pokemon TCG API images - clean, consistent, high quality\n');
    console.log('📋 URL format: https://images.pokemontcg.io/{setId}/{number}_hires.png\n');
    
    // Get cards that need hashing (or all cards if re-hashing)
    const cards = await all(`
      SELECT 
        p.product_id,
        p.name,
        p.ext_number,
        p.image_url,
        p.image_hash_difference_normal,
        g.name as set_name,
        g.clean_name as clean_set_name
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.category_id = 3
        AND p.name IS NOT NULL
        AND p.name != ''
      ORDER BY p.product_id
      LIMIT 10000
    `);
    
    console.log(`📊 Found ${cards.length} cards to process\n`);
    
    // Check how many already have hashes (for progress tracking)
    const alreadyHashed = cards.filter(c => c.image_hash_difference_normal).length;
    console.log(`📈 Already hashed: ${alreadyHashed} cards`);
    console.log(`🔄 Need to hash: ${cards.length - alreadyHashed} cards\n`);
    
    const startTime = Date.now();
    let hashedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;
    let alreadyHashedCount = 0;
    
    // Progress logging interval (every 10 cards)
    const PROGRESS_INTERVAL = 10;
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const progress = i + 1;
      const percentage = ((progress / cards.length) * 100).toFixed(1);
      
      // Skip if already hashed with NEW format (5696 bits = 64x89) unless forced
      // Old format hashes (1024 bits = 32x32) should be re-hashed
      const hashLength = card.image_hash_difference_normal?.length || 0;
      const isNewFormatHash = hashLength >= 5000; // New format is ~5696 bits
      const isOldFormatHash = hashLength > 0 && hashLength < 2000; // Old format is 1024 bits
      
      if (card.image_hash_difference_normal && isNewFormatHash && !process.env.FORCE_REHASH) {
        alreadyHashedCount++;
        if (progress % PROGRESS_INTERVAL === 0 || progress === cards.length) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = hashedCount / elapsed;
          const remaining = cards.length - progress;
          const eta = remaining / rate;
          console.log(`\n📊 Progress: ${progress}/${cards.length} (${percentage}%) | ✅ Hashed: ${hashedCount} | ⏭️  Skipped: ${skippedCount} | ⏭️  Already hashed: ${alreadyHashedCount} | ❌ Errors: ${errorCount} | 🔍 Not Found: ${notFoundCount} | ⏱️  ETA: ${formatTime(eta)}`);
        }
        continue;
      }
      
      // Log if re-hashing old format
      if (isOldFormatHash && (progress % PROGRESS_INTERVAL === 0 || progress === cards.length || progress <= 5)) {
        console.log(`  🔄 Re-hashing old format (${hashLength} bits → 5696 bits)`);
      }
      
      // Detailed logging every card, summary every PROGRESS_INTERVAL
      if (progress % PROGRESS_INTERVAL === 0 || progress === cards.length || progress <= 5) {
        console.log(`\n[${progress}/${cards.length}] (${percentage}%) Processing: ${card.name} (${card.set_name || 'Unknown Set'})`);
      }
      
      // Get Pokemon TCG API image URL
      const imageUrl = getPokemonTCGImageUrl(card);
      
      if (!imageUrl) {
        if (progress % PROGRESS_INTERVAL === 0 || progress === cards.length || progress <= 5) {
          console.log(`  ⚠️  No Pokemon TCG API set mapping for "${card.set_name}"`);
        }
        skippedCount++;
        continue;
      }
      
      if (progress % PROGRESS_INTERVAL === 0 || progress === cards.length || progress <= 5) {
        console.log(`  🔍 Image URL: ${imageUrl}`);
      }
      
      // Download image
      const imageBuffer = await downloadImage(imageUrl, 'pokemontcg');
      
      if (!imageBuffer) {
        if (progress % PROGRESS_INTERVAL === 0 || progress === cards.length || progress <= 5) {
          console.log(`  ❌ Failed to download image`);
        }
        notFoundCount++;
        continue;
      }
      
      if (progress % PROGRESS_INTERVAL === 0 || progress === cards.length || progress <= 5) {
        console.log(`  ✅ Downloaded: ${(imageBuffer.length / 1024).toFixed(1)}KB`);
      }
      
      // Calculate hashes for all orientations
      try {
        const hashes = await calculateAllHashesAllOrientations(imageBuffer);
        
        if (!hashes) {
          if (progress % PROGRESS_INTERVAL === 0 || progress === cards.length || progress <= 5) {
            console.log(`  ❌ Failed to calculate hashes`);
          }
          errorCount++;
          continue;
        }
        
        // Update database with new hashes (using fixed implementation - 64x89 aspect ratio)
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
          hashes.normal?.differenceHash || null,
          hashes.mirrored?.differenceHash || null,
          hashes.upsideDown?.differenceHash || null,
          hashes.mirroredUpsideDown?.differenceHash || null,
          card.product_id
        ]);
        
        hashedCount++;
        if (progress % PROGRESS_INTERVAL === 0 || progress === cards.length || progress <= 5) {
          console.log(`  ✅ Hashed successfully (dHash only, 64x89 aspect ratio)`);
        }
        
        // Progress update every PROGRESS_INTERVAL cards
        if (progress % PROGRESS_INTERVAL === 0 || progress === cards.length) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = hashedCount / elapsed;
          const remaining = cards.length - progress;
          const eta = remaining / rate;
          console.log(`\n📊 Progress: ${progress}/${cards.length} (${percentage}%) | ✅ Hashed: ${hashedCount} | ⏭️  Skipped: ${skippedCount} | ❌ Errors: ${errorCount} | 🔍 Not Found: ${notFoundCount} | ⏱️  ETA: ${formatTime(eta)}`);
        }
        
        // Rate limiting - Pokemon TCG API is free but be respectful
        if (i < cards.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300)); // 0.2-0.5s delay
        }
        
      } catch (hashError) {
        console.error(`  ❌ Hash error: ${hashError.message}`);
        errorCount++;
      }
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    const avgTime = hashedCount > 0 ? totalTime / hashedCount : 0;
    
    console.log(`\n\n✅ Hash computation complete!`);
    console.log(`   📊 Processed: ${cards.length} cards`);
    console.log(`   ✅ Hashed: ${hashedCount} cards`);
    console.log(`   ⏭️  Skipped: ${skippedCount} cards (no set mapping)`);
    console.log(`   ⏭️  Already hashed: ${alreadyHashedCount} cards`);
    console.log(`   ❌ Errors: ${errorCount} cards`);
    console.log(`   🔍 Not found: ${notFoundCount} cards (404 or download failed)`);
    console.log(`   ⏱️  Total time: ${formatTime(totalTime)}`);
    console.log(`   ⚡ Average: ${avgTime.toFixed(2)}s per card`);
    console.log(`\n💡 Tip: Pokemon TCG API images are official and consistent - perfect for matching!`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    db.close();
  }
}

hashCardsFromPokemonTCGAPI().catch(console.error);


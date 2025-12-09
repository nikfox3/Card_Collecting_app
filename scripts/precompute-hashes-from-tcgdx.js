// Pre-compute image hashes using TCGdx (assets.tcgdx.net)
// TCGdx is more permissive than TCGPlayer CDN and doesn't have strict rate limits
// URL format: https://assets.tcgdx.net/{language}/{series}/{set}/{cardNumber}/{quality}.{extension}

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

/**
 * Map set names to TCGdex set codes
 * TCGdex uses set IDs from their database - we need to map our set names to their IDs
 */
function getTCGdexSetCode(setName, groupId, extNumber) {
  const setCodeMap = {
    '151': 'sv12',
    'Black Bolt': 'sv13',
    'Destined Rivals': 'sv14',
    'Journey Together': 'sv15',
    'White Flare': 'sv16',
    'Mega Evolution': 'sv17',
    'Obsidian Flames': 'sv11',
    'Silver Tempest': 'swsh12',
    'Crown Zenith': 'swsh12pt5',
    'Paldea Evolved': 'sv2',
    'Scarlet & Violet': 'sv1',
    'Brilliant Stars': 'swsh9',
    'Astral Radiance': 'swsh10',
    'Lost Origin': 'swsh11',
    'Fusion Strike': 'swsh8',
    'Evolving Skies': 'swsh7',
    'Chilling Reign': 'swsh6',
    'Battle Styles': 'swsh5',
    'Vivid Voltage': 'swsh4',
    'Darkness Ablaze': 'swsh3',
    'Rebel Clash': 'swsh2',
    'Sword & Shield': 'swsh1',
    'Cosmic Eclipse': 'sm12',
    'Hidden Fates': 'sm11',
    'Unified Minds': 'sm10',
    'Detective Pikachu': 'det1',
    'Sun & Moon': 'sm1',
    'XY': 'xy1',
    'Black & White': 'bw1',
    'HeartGold & SoulSilver': 'hgss1',
    'Platinum': 'pl1',
    'Diamond & Pearl': 'dp1',
    'EX': 'ex1',
    'Neo': 'neo1',
    'Gym': 'gym1',
    'Team Rocket': 'tr1',
    'Fossil': 'fossil1',
    'Jungle': 'jungle1',
    'Base Set': 'base1'
  };
  
  // Try set name first (exact match)
  if (setName && setCodeMap[setName]) {
    return setCodeMap[setName];
  }
  
  // Try to extract from set name patterns (handle prefixes like "SV01: Scarlet & Violet Base Set")
  if (setName) {
    const lowerName = setName.toLowerCase();
    
    // Extract set code prefix (e.g., "SV01:", "SV2a:", "SWSH07:")
    const prefixMatch = setName.match(/^([a-z]+[0-9]+[a-z]?):/i);
    if (prefixMatch) {
      const extractedCode = prefixMatch[1].toLowerCase();
      // Validate it looks like a set code (e.g., sv1, sv2a, swsh7)
      if (/^[a-z]+[0-9]+[a-z]?$/.test(extractedCode)) {
        return extractedCode;
      }
    }
    
    // SV series patterns
    if (lowerName.includes('scarlet') || lowerName.includes('violet') || lowerName.startsWith('sv')) {
      // Try to extract SV code (e.g., "SV1", "SV2", "SV1a", "SV01")
      const svMatch = setName.match(/sv[0-9]+[a-z]?/i);
      if (svMatch) {
        const code = svMatch[0].toLowerCase();
        // Remove leading zeros (sv01 -> sv1)
        return code.replace(/sv0+/, 'sv');
      }
      // Default to sv1 for Scarlet & Violet sets
      if (lowerName.includes('scarlet') && lowerName.includes('violet') && lowerName.includes('base')) {
        return 'sv1';
      }
    }
    
    // SWSH series patterns
    if (lowerName.includes('sword') || lowerName.includes('shield') || lowerName.startsWith('swsh')) {
      const swshMatch = setName.match(/swsh[0-9]+/i);
      if (swshMatch) {
        return swshMatch[0].toLowerCase();
      }
      // Default to swsh1 for Sword & Shield sets
      if (lowerName.includes('sword') && lowerName.includes('shield') && lowerName.includes('base')) {
        return 'swsh1';
      }
    }
    
    // SM series patterns
    if (lowerName.includes('sun') && lowerName.includes('moon')) {
      const smMatch = setName.match(/sm[0-9]+/i);
      if (smMatch) {
        return smMatch[0].toLowerCase();
      }
      if (lowerName.includes('base')) {
        return 'sm1';
      }
    }
  }
  
  // Fallback: try to construct from group_id or other patterns
  // This is a last resort - may not work for all cards
  return null;
}

/**
 * Construct TCGdex image URL
 * Format: https://assets.tcgdex.net/{language}/{setCode}/{cardNumber}/{quality}.{extension}
 */
function constructTCGdexImageUrl(card, quality = 'high', extension = 'webp') {
  const setCode = getTCGdexSetCode(card.set_name, card.group_id, card.ext_number);
  if (!setCode) {
    return null;
  }
  
  // Extract card number (remove leading zeros, handle formats like "001", "1", "1/102")
  let cardNumber = card.ext_number || '1';
  cardNumber = cardNumber.split('/')[0].trim(); // Take first part if "1/102" format
  cardNumber = cardNumber.replace(/^0+/, '') || '1'; // Remove leading zeros
  
  const baseUrl = 'https://assets.tcgdex.net/en';
  return `${baseUrl}/${setCode}/${cardNumber}/${quality}.${extension}`;
}

/**
 * Download image from TCGdex with retry logic
 * TCGdex is more permissive than TCGPlayer CDN
 */
async function downloadImage(imageUrl, retries = 3) {
  const cacheKey = imageUrl.split('/').pop() + '_' + imageUrl.split('/').slice(-3, -1).join('_');
  const cachePath = path.join(cacheDir, cacheKey.replace(/[^a-zA-Z0-9._-]/g, '_'));
  
  if (fs.existsSync(cachePath)) {
    const buffer = fs.readFileSync(cachePath);
    if (buffer.length > 0) {
      return buffer;
    }
  }
  
  // TCGdx is more permissive, but still add small delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500)); // 0.5-1 second
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`  🔄 Retry ${attempt}/${retries} (waiting ${delay/1000}s)...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/webp,image/*,*/*;q=0.8',
          'Referer': 'https://www.tcgdx.net/'
        },
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 30000);
          return controller.signal;
        })()
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Card not found in TCGdx - try different quality or skip
          return null;
        }
        if (response.status === 429) {
          console.log(`  ⚠️  Rate limited (429), waiting 10s...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
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
      const validSignatures = ['FFD8FF', '89504E', '474946', '52494646']; // JPEG, PNG, GIF, WEBP
      if (!validSignatures.some(sig => signature.startsWith(sig))) {
        throw new Error('Invalid image format');
      }
      
      // Cache the image
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

async function hashCardsFromTCGdx() {
  try {
    console.log('🔄 Starting hash computation using TCGdx images...\n');
    console.log('💡 TCGdx is more permissive than TCGPlayer CDN\n');
    
    // Get cards that need hashing
    const cards = await all(`
      SELECT 
        p.product_id, 
        p.name, 
        p.ext_number,
        p.image_url,
        g.name as set_name,
        g.group_id
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.category_id = 3
        AND p.image_url IS NOT NULL
        AND p.image_url != ''
        AND (p.image_hash_perceptual_normal IS NULL OR p.image_hash_perceptual_normal = '')
      ORDER BY p.product_id
      LIMIT 1000
    `);
    
    console.log(`📋 Found ${cards.length} cards needing hashes\n`);
    
    let processed = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;
    let noSetCode = 0;
    
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
      
      // Construct TCGdex URL
      const tcgdexUrl = constructTCGdexImageUrl(card);
      if (!tcgdexUrl) {
        noSetCode++;
        if (processed % 100 === 0) {
          process.stdout.write(`  ⏭️  Processed ${processed}/${cards.length} (${success} hashed, ${noSetCode} no set code)...\r`);
        }
        continue;
      }
      
      // Download image from TCGdex
      const imageBuffer = await downloadImage(tcgdexUrl);
      if (!imageBuffer) {
        failed++;
        if (processed % 10 === 0) {
          process.stdout.write(`  ⚠️  Processed ${processed}/${cards.length} (${success} hashed, ${failed} failed)...\r`);
        }
        continue;
      }
      
      // Save image to local storage
      const imageFilename = `${card.product_id}.webp`;
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
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`\n  ❌ Error hashing ${card.name}:`, error.message);
        failed++;
      }
      
      // Progress update
      if (processed % 10 === 0) {
        process.stdout.write(`  ✅ Processed ${processed}/${cards.length} (${success} hashed, ${failed} failed, ${noSetCode} no set code)...\r`);
      }
      
      // Pause every 50 cards to be respectful
      if (processed % 50 === 0) {
        console.log(`\n  ⏸️  Pausing 2s after ${processed} cards...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Successfully hashed: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏭️  No set code (can't construct URL): ${noSetCode}`);
    console.log(`   ⏭️  Skipped (already hashed): ${skipped}`);
    console.log(`   📋 Total processed: ${processed}`);
    console.log(`\n💡 Tip: TCGdx is more permissive - you can run this multiple times`);
    console.log(`💡 Tip: Run again to process more cards (limited to 1000 per run)`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    db.close();
  }
}

hashCardsFromTCGdx().catch(console.error);


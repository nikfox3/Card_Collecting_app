// Pre-compute image hashes using Pokemon TCG API (api.pokemontcg.io)
// This API provides free access to card images without strict rate limits
// URL format: https://images.pokemontcg.io/{setId}/{number}_hires.png

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

const API_BASE_URL = 'https://api.pokemontcg.io/v2';

/**
 * Map set names to Pokemon TCG API set IDs
 */
function getPokemonTCGSetId(setName) {
  const setCodeMap = {
    // Base Set
    'Base Set': 'base1',
    'Jungle': 'jungle',
    'Fossil': 'fossil',
    'Base Set 2': 'base2',
    'Team Rocket': 'team-rocket',
    'Gym Heroes': 'gym-heroes',
    'Gym Challenge': 'gym-challenge',
    
    // Neo Series
    'Neo Genesis': 'neo-genesis',
    'Neo Discovery': 'neo-discovery',
    'Neo Revelation': 'neo-revelation',
    'Neo Destiny': 'neo-destiny',
    
    // EX Series
    'EX Ruby & Sapphire': 'ex-ruby-and-sapphire',
    'EX Sandstorm': 'ex-sandstorm',
    'EX Dragon': 'ex-dragon',
    'EX Team Magma vs Team Aqua': 'ex-team-magma-vs-team-aqua',
    'EX Hidden Legends': 'ex-hidden-legends',
    'EX FireRed & LeafGreen': 'ex-firered-and-leafgreen',
    'EX Team Rocket Returns': 'ex-team-rocket-returns',
    'EX Deoxys': 'ex-deoxys',
    'EX Emerald': 'ex-emerald',
    'EX Unseen Forces': 'ex-unseen-forces',
    'EX Delta Species': 'ex-delta-species',
    'EX Legend Maker': 'ex-legend-maker',
    'EX Holon Phantoms': 'ex-holon-phantoms',
    'EX Crystal Guardians': 'ex-crystal-guardians',
    'EX Dragon Frontiers': 'ex-dragon-frontiers',
    'EX Power Keepers': 'ex-power-keepers',
    
    // Diamond & Pearl
    'Diamond & Pearl': 'diamond-and-pearl',
    'Mysterious Treasures': 'mysterious-treasures',
    'Secret Wonders': 'secret-wonders',
    'Great Encounters': 'great-encounters',
    'Majestic Dawn': 'majestic-dawn',
    'Legends Awakened': 'legends-awakened',
    'Stormfront': 'stormfront',
    
    // Platinum
    'Platinum': 'platinum',
    'Rising Rivals': 'rising-rivals',
    'Supreme Victors': 'supreme-victors',
    'Arceus': 'arceus',
    
    // HeartGold & SoulSilver
    'HeartGold & SoulSilver': 'heartgold-soulsilver',
    'Unleashed': 'unleashed',
    'Undaunted': 'undaunted',
    'Triumphant': 'triumphant',
    'Call of Legends': 'call-of-legends',
    
    // Black & White
    'Black & White': 'black-and-white',
    'Emerging Powers': 'emerging-powers',
    'Noble Victories': 'noble-victories',
    'Next Destinies': 'next-destinies',
    'Dark Explorers': 'dark-explorers',
    'Dragons Exalted': 'dragons-exalted',
    'Boundaries Crossed': 'boundaries-crossed',
    'Plasma Storm': 'plasma-storm',
    'Plasma Freeze': 'plasma-freeze',
    'Plasma Blast': 'plasma-blast',
    'Legendary Treasures': 'legendary-treasures',
    
    // XY Series
    'XY': 'xy',
    'Flashfire': 'flashfire',
    'Furious Fists': 'furious-fists',
    'Phantom Forces': 'phantom-forces',
    'Primal Clash': 'primal-clash',
    'Roaring Skies': 'roaring-skies',
    'Ancient Origins': 'ancient-origins',
    'BREAKthrough': 'breakthrough',
    'BREAKpoint': 'breakpoint',
    'Fates Collide': 'fates-collide',
    'Steam Siege': 'steam-siege',
    'Evolutions': 'evolutions',
    
    // Sun & Moon
    'Sun & Moon': 'sun-and-moon',
    'Guardians Rising': 'guardians-rising',
    'Burning Shadows': 'burning-shadows',
    'Crimson Invasion': 'crimson-invasion',
    'Ultra Prism': 'ultra-prism',
    'Forbidden Light': 'forbidden-light',
    'Celestial Storm': 'celestial-storm',
    'Lost Thunder': 'lost-thunder',
    'Team Up': 'team-up',
    'Detective Pikachu': 'detective-pikachu',
    'Unbroken Bonds': 'unbroken-bonds',
    'Unified Minds': 'unified-minds',
    'Hidden Fates': 'hidden-fates',
    'Cosmic Eclipse': 'cosmic-eclipse',
    
    // Sword & Shield
    'Sword & Shield': 'sword-and-shield',
    'Rebel Clash': 'rebel-clash',
    'Darkness Ablaze': 'darkness-ablaze',
    'Champions Path': 'champions-path',
    'Vivid Voltage': 'vivid-voltage',
    'Shining Fates': 'shining-fates',
    'Battle Styles': 'battle-styles',
    'Chilling Reign': 'chilling-reign',
    'Evolving Skies': 'evolving-skies',
    'Celebrations': 'celebrations',
    'Fusion Strike': 'fusion-strike',
    'Brilliant Stars': 'brilliant-stars',
    'Astral Radiance': 'astral-radiance',
    'Lost Origin': 'lost-origin',
    'Silver Tempest': 'silver-tempest',
    'Crown Zenith': 'crown-zenith',
    
    // Scarlet & Violet
    'Scarlet & Violet': 'scarlet-and-violet',
    'Paldea Evolved': 'paldea-evolved',
    'Obsidian Flames': 'obsidian-flames',
    '151': '151',
    'Paradox Rift': 'paradox-rift',
    'Paldean Fates': 'paldean-fates',
    'Temporal Forces': 'temporal-forces',
    'Twilight Masquerade': 'twilight-masquerade',
    'Shrouded Fable': 'shrouded-fable',
    'Stellar Crown': 'stellar-crown',
    'Surging Sparks': 'surging-sparks',
    'Destined Rivals': 'destined-rivals',
    'Journey Together': 'journey-together',
    'Prismatic Evolutions': 'prismatic-evolutions',
    'Black Bolt': 'black-bolt',
    'White Flare': 'white-flare',
    'Mega Evolution': 'mega-evolution'
  };
  
  // Try exact match first
  if (setName && setCodeMap[setName]) {
    return setCodeMap[setName];
  }
  
  // Try to extract from set name patterns (handle prefixes like "SV01: Scarlet & Violet Base Set")
  if (setName) {
    const lowerName = setName.toLowerCase();
    
    // Remove prefix (e.g., "SV01: " -> "")
    const cleanedName = setName.replace(/^[A-Z0-9]+[a-z]?\d*[a-z]?:\s*/i, '').trim();
    if (cleanedName !== setName && setCodeMap[cleanedName]) {
      return setCodeMap[cleanedName];
    }
    
    // Try partial matches
    for (const [key, value] of Object.entries(setCodeMap)) {
      if (lowerName.includes(key.toLowerCase()) || cleanedName.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Search for card in Pokemon TCG API by name and set
 */
async function searchCardInAPI(cardName, setId, cardNumber) {
  try {
    // Clean card name (remove parenthetical info, numbers, etc.)
    const cleanName = cardName
      .replace(/\s*\([^)]*\)/g, '') // Remove (text)
      .replace(/\s*-\s*\d+.*$/, '') // Remove "- 081/198"
      .replace(/\s+\d+\/\d+.*$/, '') // Remove " 081/198"
      .trim();
    
    // Build search query - start simple with just name and set
    let query = `name:"${cleanName}"`;
    if (setId) {
      query += ` set.id:${setId}`;
    }
    // Don't include card number if it looks like a promo number (contains letters)
    // Only include if it's a numeric card number
    if (cardNumber && /^\d+$/.test(cardNumber)) {
      query += ` number:${cardNumber}`;
    }
    
    const url = `${API_BASE_URL}/cards?q=${encodeURIComponent(query)}&pageSize=1`;
    
    // Add small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300)); // 200-500ms
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log(`  ⚠️  Rate limited (429), waiting 5s...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return null;
      }
      return null;
    }
    
    const data = await response.json();
    if (data && data.data && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`  ❌ API search timeout after 10s`);
    } else {
      console.error(`  ❌ API search error:`, error.message);
    }
    return null;
  }
}

/**
 * Download image from Pokemon TCG API
 */
async function downloadImage(imageUrl, retries = 3) {
  const cacheKey = imageUrl.split('/').pop();
  const cachePath = path.join(cacheDir, cacheKey);
  
  if (fs.existsSync(cachePath)) {
    const buffer = fs.readFileSync(cachePath);
    if (buffer.length > 0) {
      return buffer;
    }
  }
  
  // Add delay to respect rate limits
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200)); // 300-500ms
  
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
          'Referer': 'https://www.pokemontcg.com/'
        },
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 30000);
          return controller.signal;
        })()
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          console.log(`  ⚠️  Rate limited (429), waiting 5s...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
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

async function hashCardsFromPokemonTCGAPI() {
  try {
    console.log('🔄 Starting hash computation using Pokemon TCG API...\n');
    console.log('💡 Pokemon TCG API provides free access with reasonable rate limits\n');
    
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
      ${process.env.LIMIT ? `LIMIT ${parseInt(process.env.LIMIT)}` : ''}
    `);
    
    console.log(`📋 Found ${cards.length} cards needing hashes\n`);
    
    let processed = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;
    let noSetId = 0;
    let notFound = 0;
    
    console.log(`\n🚀 Starting to process cards...\n`);
    
    for (const card of cards) {
      processed++;
      
      // Log first few cards to see what's happening
      if (processed <= 5) {
        console.log(`\n📋 Processing card ${processed}/${cards.length}: ${card.name} (Set: ${card.set_name || 'N/A'})`);
      }
      
      // Check if already hashed
      const existing = await get(`
        SELECT image_hash_perceptual_normal
        FROM products
        WHERE product_id = ?
      `, [card.product_id]);
      
      if (existing && existing.image_hash_perceptual_normal) {
        skipped++;
        if (processed <= 5) {
          console.log(`  ⏭️  Already hashed, skipping...`);
        }
        continue;
      }
      
      // Get Pokemon TCG API set ID
      const setId = getPokemonTCGSetId(card.set_name);
      if (processed <= 5) {
        console.log(`  🔍 Set ID: ${setId || 'NOT FOUND'}`);
      }
      if (!setId) {
        noSetId++;
        if (processed % 100 === 0) {
          console.log(`  ⏭️  Processed ${processed}/${cards.length} (${success} hashed, ${noSetId} no set ID)...`);
        }
        continue;
      }
      
      // Extract card number (remove leading zeros, handle formats like "001", "1", "1/102")
      let cardNumber = card.ext_number || '1';
      cardNumber = cardNumber.split('/')[0].trim();
      cardNumber = cardNumber.replace(/^0+/, '') || '1';
      
      // Search for card in API
      if (processed <= 10) {
        console.log(`  🔍 Searching API for: "${card.name}" in set "${setId}" number "${cardNumber}"`);
      }
      
      let apiCard;
      try {
        apiCard = await searchCardInAPI(card.name, setId, cardNumber);
      } catch (error) {
        console.error(`  ❌ API search error for ${card.name}:`, error.message);
        failed++;
        continue;
      }
      
      if (!apiCard || !apiCard.images || !apiCard.images.large) {
        notFound++;
        if (processed <= 10) {
          console.log(`  ⚠️  Card not found in API`);
        }
        if (processed % 50 === 0) {
          console.log(`  ⚠️  Processed ${processed}/${cards.length} (${success} hashed, ${notFound} not found)...`);
        }
        continue;
      }
      
      if (processed <= 10) {
        console.log(`  ✅ Found card in API, downloading image...`);
      }
      
      // Download image
      const imageUrl = apiCard.images.large; // Use high-res image
      if (processed <= 10) {
        console.log(`  📥 Downloading from: ${imageUrl}`);
      }
      
      let imageBuffer;
      try {
        imageBuffer = await downloadImage(imageUrl);
      } catch (error) {
        console.error(`  ❌ Download error for ${card.name}:`, error.message);
        failed++;
        continue;
      }
      
      if (!imageBuffer) {
        failed++;
        if (processed <= 10) {
          console.log(`  ⚠️  Download failed`);
        }
        if (processed % 10 === 0) {
          console.log(`  ⚠️  Processed ${processed}/${cards.length} (${success} hashed, ${failed} failed)...`);
        }
        continue;
      }
      
      if (processed <= 10) {
        console.log(`  ✅ Image downloaded, computing hashes...`);
      }
      
      // Save image to local storage
      const imageFilename = `${card.product_id}.png`;
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
        console.log(`  ✅ Processed ${processed}/${cards.length} (${success} hashed, ${failed} failed, ${notFound} not found, ${noSetId} no set ID)...`);
      }
      
      // Log every card that succeeds
      if (success > 0 && success % 10 === 0) {
        console.log(`  🎉 Successfully hashed ${success} cards so far!`);
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
    console.log(`   ⏭️  Not found in API: ${notFound}`);
    console.log(`   ⏭️  No set ID (can't map): ${noSetId}`);
    console.log(`   ⏭️  Skipped (already hashed): ${skipped}`);
    console.log(`   📋 Total processed: ${processed}`);
    console.log(`\n💡 Tip: Pokemon TCG API has reasonable rate limits - you can run this multiple times`);
    console.log(`💡 Tip: Run again to process more cards (limited to 500 per run)`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    db.close();
  }
}

hashCardsFromPokemonTCGAPI().catch(console.error);


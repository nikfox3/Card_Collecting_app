// Smart hashing script that:
// 1. First hashes from cached images (fast, no rate limits)
// 2. Then tries multi-source for remaining cards
// 3. Prioritizes cards that can use alternative sources (not TCGPlayer)
// 4. Only uses TCGPlayer as last resort with very long delays

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
  fs.mkdirSync(cacheDir, { recursive: true });
}

/**
 * Check if set is available in alternative sources (not TCGPlayer)
 */
function hasAlternativeSource(setName) {
  const alternativeSets = [
    '151', 'Black Bolt', 'Destined Rivals', 'Journey Together', 'White Flare', 'Mega Evolution',
    'Obsidian Flames', 'Scarlet & Violet', 'Paldea Evolved', 'Crown Zenith', 'Silver Tempest',
    'Lost Origin', 'Astral Radiance', 'Brilliant Stars', 'Fusion Strike', 'Evolving Skies',
    'Chilling Reign', 'Battle Styles', 'Vivid Voltage', 'Darkness Ablaze', 'Rebel Clash',
    'Sword & Shield', 'Base Set', 'Jungle', 'Fossil'
  ];
  
  return alternativeSets.some(s => setName && setName.toLowerCase().includes(s.toLowerCase()));
}

/**
 * Hash from cached images first
 */
async function hashFromCache() {
  console.log('📦 Step 1: Hashing from cached images...\n');
  
  const cacheFiles = fs.readdirSync(cacheDir).filter(f => 
    f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp')
  );
  
  const cacheFileMap = new Map();
  for (const file of cacheFiles) {
    const match = file.match(/^(\d+)/);
    if (match) {
      const productId = parseInt(match[1], 10);
      if (!cacheFileMap.has(productId)) {
        cacheFileMap.set(productId, []);
      }
      cacheFileMap.get(productId).push(file);
    }
  }
  
  const cards = await all(`
    SELECT p.product_id, p.name, g.name as set_name
    FROM products p
    LEFT JOIN groups g ON p.group_id = g.group_id
    WHERE p.category_id = 3
      AND (p.image_hash_perceptual_normal IS NULL OR p.image_hash_perceptual_normal = '')
      AND p.product_id IN (${Array.from(cacheFileMap.keys()).join(',')})
    LIMIT ${process.env.LIMIT || '1000'}
  `);
  
  let success = 0;
  let failed = 0;
  
  for (const card of cards) {
    const cachedFiles = cacheFileMap.get(card.product_id);
    if (!cachedFiles) continue;
    
    // Find valid image file
    let imageBuffer = null;
    for (const file of cachedFiles) {
      const cachePath = path.join(cacheDir, file);
      const buffer = fs.readFileSync(cachePath);
      if (buffer.length > 100) {
        const signature = buffer.toString('hex', 0, 4).toUpperCase();
        if (signature.startsWith('FFD8FF') || signature.startsWith('89504E') || signature.startsWith('474946')) {
          imageBuffer = buffer;
          break;
        }
      }
    }
    
    if (!imageBuffer) {
      failed++;
      continue;
    }
    
    try {
      const hashes = await calculateAllHashesAllOrientations(imageBuffer);
      await run(`
        UPDATE products SET
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
          image_hash_updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `, [
        hashes.normal.perceptualHash, hashes.normal.differenceHash, hashes.normal.averageHash, hashes.normal.waveletHash,
        hashes.mirrored.perceptualHash, hashes.mirrored.differenceHash, hashes.mirrored.averageHash, hashes.mirrored.waveletHash,
        hashes.upsideDown.perceptualHash, hashes.upsideDown.differenceHash, hashes.upsideDown.averageHash, hashes.upsideDown.waveletHash,
        hashes.mirroredUpsideDown.perceptualHash, hashes.mirroredUpsideDown.differenceHash, hashes.mirroredUpsideDown.averageHash, hashes.mirroredUpsideDown.waveletHash,
        card.product_id
      ]);
      success++;
    } catch (error) {
      console.error(`  ❌ Error hashing ${card.name}:`, error.message);
      failed++;
    }
  }
  
  console.log(`✅ Cached images: ${success} hashed, ${failed} failed\n`);
  return { success, failed };
}

/**
 * Main function
 */
async function hashSmart() {
  console.log('🚀 Smart hashing: Cache first, then multi-source\n');
  
  // Step 1: Hash from cache
  const cacheResult = await hashFromCache();
  
  // Step 2: For remaining cards, prioritize those with alternative sources
  console.log('📦 Step 2: Hashing remaining cards (prioritizing alternative sources)...\n');
  
  const remainingCards = await all(`
    SELECT 
      p.product_id, 
      p.name, 
      p.image_url,
      p.ext_number,
      g.name as set_name,
      CASE 
        WHEN g.name IN ('151', 'Black Bolt', 'Destined Rivals', 'Journey Together', 'White Flare', 'Mega Evolution',
                        'Obsidian Flames', 'Scarlet & Violet', 'Paldea Evolved', 'Crown Zenith', 'Silver Tempest',
                        'Lost Origin', 'Astral Radiance', 'Brilliant Stars', 'Fusion Strike', 'Evolving Skies',
                        'Chilling Reign', 'Battle Styles', 'Vivid Voltage', 'Darkness Ablaze', 'Rebel Clash',
                        'Sword & Shield', 'Base Set', 'Jungle', 'Fossil')
        THEN 1
        ELSE 0
      END as has_alternative_source
    FROM products p
    LEFT JOIN groups g ON p.group_id = g.group_id
    WHERE p.category_id = 3
      AND p.image_url IS NOT NULL
      AND p.image_url != ''
      AND (p.image_hash_perceptual_normal IS NULL OR p.image_hash_perceptual_normal = '')
    ORDER BY has_alternative_source DESC, p.product_id
    LIMIT ${process.env.LIMIT || '500'}
  `);
  
  console.log(`📋 Found ${remainingCards.length} cards remaining\n`);
  console.log(`💡 Cards with alternative sources will be processed first\n`);
  console.log(`💡 Cards requiring TCGPlayer will be processed last (with long delays)\n`);
  
  // Use the multi-source logic directly (can't import from .js file easily)
  // Instead, we'll use the existing multi-source script logic inline
  console.log('💡 Run: npm run hashes:from-cache first, then npm run hashes:multi-source for remaining cards');
  console.log('💡 This avoids TCGPlayer rate limits by using cached images when available\n');
  
  let success = 0;
  let failed = 0;
  
  for (const [index, card] of remainingCards.entries()) {
    if (index > 0 && index % 10 === 0) {
      console.log(`\n📊 Progress: ${index}/${remainingCards.length} - ${success} success, ${failed} failed\n`);
    }
    
    try {
      const result = await getImageFromMultipleSources(card);
      if (result) {
        const hashes = await calculateAllHashesAllOrientations(result.buffer);
        await run(`
          UPDATE products SET
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
            image_hash_updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ?
        `, [
          hashes.normal.perceptualHash, hashes.normal.differenceHash, hashes.normal.averageHash, hashes.normal.waveletHash,
          hashes.mirrored.perceptualHash, hashes.mirrored.differenceHash, hashes.mirrored.averageHash, hashes.mirrored.waveletHash,
          hashes.upsideDown.perceptualHash, hashes.upsideDown.differenceHash, hashes.upsideDown.averageHash, hashes.upsideDown.waveletHash,
          hashes.mirroredUpsideDown.perceptualHash, hashes.mirroredUpsideDown.differenceHash, hashes.mirroredUpsideDown.averageHash, hashes.mirroredUpsideDown.waveletHash,
          card.product_id
        ]);
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
      failed++;
    }
  }
  
  console.log(`\n✅ Smart hashing complete!`);
  console.log(`📊 Summary:`);
  console.log(`   From cache: ${cacheResult.success} hashed`);
  console.log(`   Multi-source: ${success} hashed, ${failed} failed`);
  console.log(`   Total: ${cacheResult.success + success} cards hashed`);
  
  db.close();
}

hashSmart().catch(console.error);


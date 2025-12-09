// Verify hash coverage and integrity
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../cards.db');
const db = new sqlite3.Database(dbPath);

const all = promisify(db.all.bind(db));
const get = promisify(db.get.bind(db));

async function verifyHashes() {
  console.log('🔍 Verifying hash coverage and integrity...\n');
  
  // Overall statistics
  const stats = await get(`
    SELECT 
      COUNT(*) as total_cards,
      COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as cards_with_images,
      COUNT(CASE WHEN image_hash_perceptual_normal IS NOT NULL AND image_hash_perceptual_normal != '' THEN 1 END) as has_normal_hash,
      COUNT(CASE WHEN image_hash_wavelet_normal IS NOT NULL AND image_hash_wavelet_normal != '' THEN 1 END) as has_wavelet_hash,
      COUNT(CASE WHEN image_hash_perceptual_mirrored IS NOT NULL AND image_hash_perceptual_mirrored != '' THEN 1 END) as has_mirrored_hash,
      COUNT(CASE WHEN image_hash_perceptual_upsidedown IS NOT NULL AND image_hash_perceptual_upsidedown != '' THEN 1 END) as has_upsidedown_hash,
      COUNT(CASE WHEN image_hash_perceptual IS NOT NULL AND image_hash_perceptual != '' THEN 1 END) as has_old_hash
    FROM products 
    WHERE category_id = 3
  `);
  
  console.log('📊 Overall Statistics:');
  console.log(`   Total cards: ${stats.total_cards}`);
  console.log(`   Cards with images: ${stats.cards_with_images}`);
  console.log(`   Cards with normal hash: ${stats.has_normal_hash} (${((stats.has_normal_hash / stats.cards_with_images) * 100).toFixed(1)}%)`);
  console.log(`   Cards with wavelet hash: ${stats.has_wavelet_hash} (${((stats.has_wavelet_hash / stats.cards_with_images) * 100).toFixed(1)}%)`);
  console.log(`   Cards with mirrored hash: ${stats.has_mirrored_hash} (${((stats.has_mirrored_hash / stats.cards_with_images) * 100).toFixed(1)}%)`);
  console.log(`   Cards with upside-down hash: ${stats.has_upsidedown_hash} (${((stats.has_upsidedown_hash / stats.cards_with_images) * 100).toFixed(1)}%)`);
  console.log(`   Cards with old hash: ${stats.has_old_hash} (${((stats.has_old_hash / stats.cards_with_images) * 100).toFixed(1)}%)`);
  console.log(`   Cards missing hashes: ${stats.cards_with_images - stats.has_normal_hash} (${(((stats.cards_with_images - stats.has_normal_hash) / stats.cards_with_images) * 100).toFixed(1)}%)\n`);
  
  // Check hash format integrity
  const hashSamples = await all(`
    SELECT 
      product_id,
      name,
      LENGTH(image_hash_perceptual_normal) as perceptual_length,
      LENGTH(image_hash_wavelet_normal) as wavelet_length,
      LENGTH(image_hash_difference_normal) as difference_length,
      LENGTH(image_hash_average_normal) as average_length,
      SUBSTR(image_hash_perceptual_normal, 1, 20) || '...' as perceptual_preview
    FROM products 
    WHERE category_id = 3 
      AND image_hash_perceptual_normal IS NOT NULL
      AND image_hash_perceptual_normal != ''
    LIMIT 10
  `);
  
  console.log('🔍 Hash Format Sample:');
  hashSamples.forEach(card => {
    console.log(`   ${card.name} (ID: ${card.product_id}):`);
    console.log(`     Perceptual: ${card.perceptual_length} chars, preview: ${card.perceptual_preview}`);
    console.log(`     Wavelet: ${card.wavelet_length} chars`);
    console.log(`     Difference: ${card.difference_length} chars`);
    console.log(`     Average: ${card.average_length} chars`);
  });
  
  // Check for incomplete hashes
  const incomplete = await get(`
    SELECT COUNT(*) as count
    FROM products
    WHERE category_id = 3
      AND image_url IS NOT NULL
      AND image_url != ''
      AND (
        (image_hash_perceptual_normal IS NOT NULL AND image_hash_wavelet_normal IS NULL) OR
        (image_hash_perceptual_normal IS NOT NULL AND image_hash_perceptual_mirrored IS NULL) OR
        (image_hash_perceptual_normal IS NOT NULL AND image_hash_perceptual_upsidedown IS NULL)
      )
  `);
  
  console.log(`\n⚠️  Cards with incomplete hash sets: ${incomplete.count}`);
  
  // Check for cards that should have hashes but don't
  const missingHashes = await all(`
    SELECT product_id, name, image_url
    FROM products
    WHERE category_id = 3
      AND image_url IS NOT NULL
      AND image_url != ''
      AND (image_hash_perceptual_normal IS NULL OR image_hash_perceptual_normal = '')
    ORDER BY product_id
    LIMIT 20
  `);
  
  console.log(`\n📋 Sample of cards missing hashes (showing first 20):`);
  missingHashes.forEach(card => {
    console.log(`   ${card.product_id}: ${card.name}`);
  });
  
  if (missingHashes.length === 20) {
    console.log(`   ... and ${stats.cards_with_images - stats.has_normal_hash - 20} more`);
  }
  
  db.close();
}

verifyHashes().catch(console.error);


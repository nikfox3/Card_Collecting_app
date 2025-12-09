// Copy image hashes from parent database to project database
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source: parent database (where hashes were written)
const sourceDbPath = path.resolve(__dirname, '../../cards.db');
// Target: project database (where app reads from)
const targetDbPath = path.resolve(__dirname, '../cards.db');

console.log('📁 Source database:', sourceDbPath);
console.log('📁 Target database:', targetDbPath);

const sourceDb = new sqlite3.Database(sourceDbPath);
const targetDb = new sqlite3.Database(targetDbPath);

const sourceAll = promisify(sourceDb.all.bind(sourceDb));
const sourceGet = promisify(sourceDb.get.bind(sourceDb));
const targetRun = promisify(targetDb.run.bind(targetDb));
const targetAll = promisify(targetDb.all.bind(targetDb));

async function copyHashes() {
  try {
    console.log('\n🔄 Copying hashes from source to target database...\n');
    
    // Get all cards with hashes from source database
    const cardsWithHashes = await sourceAll(`
      SELECT 
        product_id,
        image_hash_perceptual_normal,
        image_hash_difference_normal,
        image_hash_average_normal,
        image_hash_wavelet_normal,
        image_hash_perceptual_mirrored,
        image_hash_difference_mirrored,
        image_hash_average_mirrored,
        image_hash_wavelet_mirrored,
        image_hash_perceptual_upsidedown,
        image_hash_difference_upsidedown,
        image_hash_average_upsidedown,
        image_hash_wavelet_upsidedown,
        image_hash_perceptual_mirrored_upsidedown,
        image_hash_difference_mirrored_upsidedown,
        image_hash_average_mirrored_upsidedown,
        image_hash_wavelet_mirrored_upsidedown,
        image_hash_perceptual,
        image_hash_difference,
        image_hash_average,
        image_hash_updated_at
      FROM products
      WHERE category_id = 3
        AND image_hash_perceptual_normal IS NOT NULL
        AND image_hash_perceptual_normal != ''
      ORDER BY product_id
    `);
    
    console.log(`📋 Found ${cardsWithHashes.length} cards with hashes in source database\n`);
    
    if (cardsWithHashes.length === 0) {
      console.log('⚠️  No cards with hashes found in source database');
      return;
    }
    
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const [index, card] of cardsWithHashes.entries()) {
      // Check if card exists in target database
      const targetCard = await targetAll(`
        SELECT product_id 
        FROM products 
        WHERE product_id = ?
      `, [card.product_id]);
      
      if (targetCard.length === 0) {
        skipped++;
        if (index % 1000 === 0) {
          console.log(`  ⏭️  Skipped ${index}/${cardsWithHashes.length} (card ${card.product_id} not in target DB)...`);
        }
        continue;
      }
      
      // Update target database with hashes
      try {
        await targetRun(`
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
            image_hash_updated_at = ?
          WHERE product_id = ?
        `, [
          card.image_hash_perceptual_normal,
          card.image_hash_difference_normal,
          card.image_hash_average_normal,
          card.image_hash_wavelet_normal,
          card.image_hash_perceptual_mirrored,
          card.image_hash_difference_mirrored,
          card.image_hash_average_mirrored,
          card.image_hash_wavelet_mirrored,
          card.image_hash_perceptual_upsidedown,
          card.image_hash_difference_upsidedown,
          card.image_hash_average_upsidedown,
          card.image_hash_wavelet_upsidedown,
          card.image_hash_perceptual_mirrored_upsidedown,
          card.image_hash_difference_mirrored_upsidedown,
          card.image_hash_average_mirrored_upsidedown,
          card.image_hash_wavelet_mirrored_upsidedown,
          card.image_hash_perceptual,
          card.image_hash_difference,
          card.image_hash_average,
          card.image_hash_updated_at,
          card.product_id
        ]);
        
        updated++;
        
        if (updated % 1000 === 0) {
          console.log(`  ✅ Updated ${updated}/${cardsWithHashes.length} cards...`);
        }
      } catch (error) {
        console.error(`  ❌ Error updating card ${card.product_id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n✅ Copy complete!`);
    console.log(`   ✅ Updated: ${updated} cards`);
    console.log(`   ⏭️  Skipped: ${skipped} cards (not in target DB)`);
    console.log(`   ❌ Failed: ${failed} cards`);
    
    // Verify the copy
    const verify = await targetAll(`
      SELECT COUNT(*) as count
      FROM products
      WHERE category_id = 3
        AND image_hash_perceptual_normal IS NOT NULL
        AND image_hash_perceptual_normal != ''
        AND image_hash_wavelet_normal IS NOT NULL
        AND image_hash_wavelet_normal != ''
    `);
    
    console.log(`\n🔍 Verification:`);
    console.log(`   Cards with complete hashes in target DB: ${verify[0].count}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    sourceDb.close();
    targetDb.close();
    console.log('\n🗄️  Database connections closed');
  }
}

copyHashes().catch(console.error);


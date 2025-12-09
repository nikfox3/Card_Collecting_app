// Migration script to add orientation hash columns
import { query, run } from '../server/utils/database.js';

async function migrateOrientationHashes() {
  try {
    console.log('🔄 Starting orientation hash migration...\n');
    
    const migrations = [
      // Normal orientation (migrate existing hashes)
      'ALTER TABLE products ADD COLUMN image_hash_perceptual_normal TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_difference_normal TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_average_normal TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_wavelet_normal TEXT',
      
      // Mirrored orientation
      'ALTER TABLE products ADD COLUMN image_hash_perceptual_mirrored TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_difference_mirrored TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_average_mirrored TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_wavelet_mirrored TEXT',
      
      // Upside-down orientation
      'ALTER TABLE products ADD COLUMN image_hash_perceptual_upsidedown TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_difference_upsidedown TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_average_upsidedown TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_wavelet_upsidedown TEXT',
      
      // Mirrored + Upside-down orientation
      'ALTER TABLE products ADD COLUMN image_hash_perceptual_mirrored_upsidedown TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_difference_mirrored_upsidedown TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_average_mirrored_upsidedown TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_wavelet_mirrored_upsidedown TEXT'
    ];
    
    for (const sql of migrations) {
      try {
        await run(sql);
        const columnName = sql.split('ADD COLUMN ')[1]?.split(' ')[0] || 'column';
        console.log(`✅ ${columnName} added`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          const columnName = sql.split('ADD COLUMN ')[1]?.split(' ')[0] || 'unknown';
          console.log(`⚠️  Column already exists: ${columnName}`);
        } else {
          throw error;
        }
      }
    }
    
    // Migrate existing hashes to normal orientation columns
    console.log('\n📊 Migrating existing hashes to normal orientation...');
    try {
      await run(`
        UPDATE products
        SET image_hash_perceptual_normal = image_hash_perceptual,
            image_hash_difference_normal = image_hash_difference,
            image_hash_average_normal = image_hash_average
        WHERE image_hash_perceptual IS NOT NULL
          AND image_hash_perceptual_normal IS NULL
      `);
      console.log('✅ Existing hashes migrated to normal orientation');
    } catch (error) {
      console.warn(`⚠️  Hash migration: ${error.message}`);
    }
    
    // Create indexes
    console.log('\n📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_products_hash_perceptual_normal ON products(image_hash_perceptual_normal)',
      'CREATE INDEX IF NOT EXISTS idx_products_hash_difference_normal ON products(image_hash_difference_normal)',
      'CREATE INDEX IF NOT EXISTS idx_products_hash_average_normal ON products(image_hash_average_normal)',
      'CREATE INDEX IF NOT EXISTS idx_products_hash_wavelet_normal ON products(image_hash_wavelet_normal)'
    ];
    
    for (const sql of indexes) {
      try {
        await run(sql);
        console.log(`✅ Index created`);
      } catch (error) {
        console.warn(`⚠️  Index creation: ${error.message}`);
      }
    }
    
    console.log('\n✅ Migration complete!');
    console.log('\n💡 Next step: Run npm run hashes:precompute-all to generate hashes for all orientations');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateOrientationHashes();


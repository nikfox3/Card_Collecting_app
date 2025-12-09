// Migration script to add image hash columns to products table
import { query, run } from '../server/utils/database.js';

async function migrateImageHashes() {
  try {
    console.log('🔄 Starting image hash migration...\n');
    
    const migrations = [
      'ALTER TABLE products ADD COLUMN image_hash_perceptual TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_difference TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_average TEXT',
      'ALTER TABLE products ADD COLUMN image_hash_updated_at TIMESTAMP'
    ];
    
    for (const sql of migrations) {
      try {
        await run(sql);
        console.log(`✅ ${sql.split('ADD COLUMN ')[1]?.split(' ')[0] || 'column'} added`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`⚠️  Column already exists: ${sql.split('ADD COLUMN ')[1]?.split(' ')[0] || 'unknown'}`);
        } else {
          throw error;
        }
      }
    }
    
    // Create indexes
    console.log('\n📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_products_image_hash_perceptual ON products(image_hash_perceptual)',
      'CREATE INDEX IF NOT EXISTS idx_products_image_hash_difference ON products(image_hash_difference)',
      'CREATE INDEX IF NOT EXISTS idx_products_image_hash_average ON products(image_hash_average)'
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
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateImageHashes();


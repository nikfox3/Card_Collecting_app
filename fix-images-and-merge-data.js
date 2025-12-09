#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));

console.log('🔧 Fixing images and ensuring data integrity...\n');

// Fix images - convert URL strings to proper JSON format
const cards = await all('SELECT id, images FROM cards WHERE images NOT LIKE \'%"small"%\' AND images IS NOT NULL AND images != ""');

console.log(`📊 Found ${cards.length} cards with incorrect image format\n`);

let fixedCount = 0;

for (const card of cards) {
  if (fixedCount % 500 === 0 && fixedCount > 0) {
    console.log(`   Fixed ${fixedCount}/${cards.length} images...`);
  }
  
  try {
    const imageUrl = card.images;
    
    // If it's a base URL like "https://assets.tcgdex.net/en/swsh/swsh7/95"
    // Convert to proper JSON format
    if (imageUrl && !imageUrl.startsWith('{') && !imageUrl.startsWith('[')) {
      const imageJson = JSON.stringify({
        small: `${imageUrl}/low.webp`,
        large: `${imageUrl}/high.webp`,
        high: `${imageUrl}/high.webp`
      });
      
      await run('UPDATE cards SET images = ? WHERE id = ?', [imageJson, card.id]);
      fixedCount++;
    }
  } catch (error) {
    console.error(`Error fixing image for ${card.id}:`, error.message);
  }
}

console.log(`\n✅ Fixed ${fixedCount} card images\n`);

// Verify a sample card
const sample = await all('SELECT id, name, images FROM cards WHERE id IN (\'swsh7-95\', \'base1-4\') LIMIT 2');

console.log('📋 Sample cards after fix:');
for (const card of sample) {
  console.log(`   • ${card.name}:`);
  console.log(`     Images: ${card.images.substring(0, 100)}...`);
}

db.close();
console.log('\n🎉 Image fix complete!');









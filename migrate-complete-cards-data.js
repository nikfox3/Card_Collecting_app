#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

class CompleteCardsMigration {
  constructor() {
    this.migratedCount = 0;
    this.errorCount = 0;
    this.updatedCount = 0;
  }

  async migrate() {
    try {
      console.log('🔄 Starting Complete Cards Data Migration...\n');

      // First, let's populate the groups table with actual sets
      console.log('📚 Populating groups table with actual sets...');
      const sets = await all('SELECT id, name FROM sets ORDER BY name');
      
      for (const set of sets) {
        await run(`
          INSERT OR IGNORE INTO groups (group_id, name, category_id, published_on) 
          VALUES (?, ?, 3, ?)
        `, [
          parseInt(set.id.replace(/\D/g, '')) || Math.floor(Math.random() * 1000000),
          set.name,
          '1996-01-01' // Default date, will be updated with actual dates
        ]);
      }

      console.log(`✅ Populated ${sets.length} sets in groups table\n`);

      // Get all cards with complete data
      const cards = await all(`
        SELECT c.id, c.name, c.supertype, c.subtypes, c.level, c.hp, c.types, 
               c.evolves_from, c.attacks, c.abilities, c.rarity, c.set_id, c.number, 
               c.artist, c.images, s.name as set_name
        FROM cards c
        LEFT JOIN sets s ON c.set_id = s.id
        WHERE c.attacks IS NOT NULL OR c.abilities IS NOT NULL
        ORDER BY c.set_id, c.number
      `);

      console.log(`📊 Found ${cards.length} cards with complete data\n`);

      for (const [index, card] of cards.entries()) {
        try {
          // Show progress every 1000 cards
          if (index % 1000 === 0 && index > 0) {
            console.log(`📦 Progress: ${index}/${cards.length} (${((index/cards.length)*100).toFixed(1)}%)`);
            console.log(`   ✅ Migrated: ${this.migratedCount} | 🔄 Updated: ${this.updatedCount} | ❌ Errors: ${this.errorCount}`);
          }

          // Parse abilities and attacks from JSON
          let abilities = [];
          let attacks = [];
          let images = {};
          
          try {
            abilities = card.abilities ? JSON.parse(card.abilities) : [];
            attacks = card.attacks ? JSON.parse(card.attacks) : [];
            images = card.images ? JSON.parse(card.images) : {};
          } catch (parseError) {
            console.log(`⚠️  JSON parse error for ${card.name}: ${parseError.message}`);
            continue;
          }

          // Convert abilities to text format
          const abilitiesText = abilities.map(ability => 
            `${ability.name}: ${ability.text || ability.effect || ''}`
          ).join('\n');

          // Convert attacks to text format
          const attacksText = attacks.map(attack => {
            const cost = attack.cost ? attack.cost.join(' ') : '';
            const damage = attack.damage || '';
            const effect = attack.effect || '';
            return `${attack.name}${cost ? ` (${cost})` : ''}${damage ? ` - ${damage}` : ''}${effect ? `: ${effect}` : ''}`;
          }).join('\n');

          // Extract first attack for ext_attack1
          const firstAttack = attacks.length > 0 ? attacks[0] : null;
          const firstAttackText = firstAttack ? 
            `${firstAttack.name}${firstAttack.cost ? ` (${firstAttack.cost.join(' ')})` : ''}${firstAttack.damage ? ` - ${firstAttack.damage}` : ''}${firstAttack.effect ? `: ${firstAttack.effect}` : ''}` : '';

          // Extract second attack for ext_attack2
          const secondAttack = attacks.length > 1 ? attacks[1] : null;
          const secondAttackText = secondAttack ? 
            `${secondAttack.name}${secondAttack.cost ? ` (${secondAttack.cost.join(' ')})` : ''}${secondAttack.damage ? ` - ${secondAttack.damage}` : ''}${secondAttack.effect ? `: ${secondAttack.effect}` : ''}` : '';

          // Get the group_id for this set
          const setGroupId = parseInt(card.set_id?.replace(/\D/g, '')) || 1;
          
          // Get image URL from images JSON
          const imageUrl = images.small || images.large || images.symbol || '';

          // Check if product already exists
          const existingProduct = await get(
            'SELECT product_id FROM products WHERE product_id = ?',
            [parseInt(card.id) || Math.floor(Math.random() * 1000000)]
          );

          if (existingProduct) {
            // Update existing product
            await run(`
              UPDATE products SET 
                name = ?, ext_hp = ?, ext_card_type = ?, ext_card_text = ?, 
                ext_attack1 = ?, ext_attack2 = ?, ext_rarity = ?, group_id = ?,
                ext_number = ?, artist = ?, image_url = ?
              WHERE product_id = ?
            `, [
              card.name,
              card.hp ? parseInt(card.hp) : null,
              card.supertype,
              abilitiesText,
              firstAttackText,
              secondAttackText,
              card.rarity,
              setGroupId,
              card.number,
              card.artist,
              imageUrl,
              parseInt(card.id) || Math.floor(Math.random() * 1000000)
            ]);
            this.updatedCount++;
          } else {
            // Insert new product
            await run(`
              INSERT INTO products (
                product_id, name, ext_hp, ext_card_type, ext_card_text, 
                ext_attack1, ext_attack2, ext_rarity, group_id, ext_number, 
                artist, image_url
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              parseInt(card.id) || Math.floor(Math.random() * 1000000),
              card.name,
              card.hp ? parseInt(card.hp) : null,
              card.supertype,
              abilitiesText,
              firstAttackText,
              secondAttackText,
              card.rarity,
              setGroupId,
              card.number,
              card.artist,
              imageUrl
            ]);
            this.migratedCount++;
          }

          if (index % 500 === 0) {
            console.log(`   Processed: ${card.name} (${card.set_name})`);
          }

        } catch (error) {
          console.error(`❌ Error processing ${card.name}:`, error.message);
          this.errorCount++;
        }
      }

      console.log('\n🎉 Migration complete!\n');
      console.log('📊 Final Statistics:');
      console.log(`   • Cards processed: ${cards.length}`);
      console.log(`   • Cards migrated: ${this.migratedCount}`);
      console.log(`   • Cards updated: ${this.updatedCount}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${(((this.migratedCount + this.updatedCount) / cards.length) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
    } finally {
      db.close();
    }
  }
}

// Run the migration
const migrator = new CompleteCardsMigration();
migrator.migrate();





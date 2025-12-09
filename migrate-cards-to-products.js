#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

class CardsToProductsMigration {
  constructor() {
    this.migratedCount = 0;
    this.errorCount = 0;
  }

  async migrate() {
    try {
      console.log('🔄 Starting Cards to Products Migration...\n');

      // First, create the products table if it doesn't exist
      await run(`
        CREATE TABLE IF NOT EXISTS products (
          product_id INTEGER PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          clean_name VARCHAR(255),
          image_url TEXT,
          category_id INTEGER DEFAULT 3,
          group_id INTEGER DEFAULT 1,
          url TEXT,
          modified_on TIMESTAMP,
          image_count INTEGER DEFAULT 1,
          ext_number VARCHAR(20),
          ext_rarity VARCHAR(50),
          ext_card_type VARCHAR(50),
          ext_hp INTEGER,
          ext_stage VARCHAR(50),
          ext_card_text TEXT,
          ext_attack1 TEXT,
          ext_attack2 TEXT,
          market_price REAL DEFAULT 0,
          low_price REAL DEFAULT 0,
          mid_price REAL DEFAULT 0,
          high_price REAL DEFAULT 0,
          artist VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get all cards with abilities and attacks
      const cards = await all(`
        SELECT id, name, supertype, subtypes, level, hp, types, 
               evolves_from, attacks, abilities, rarity
        FROM cards 
        WHERE attacks IS NOT NULL OR abilities IS NOT NULL
      `);

      console.log(`📊 Found ${cards.length} cards with abilities/attacks\n`);

      for (const [index, card] of cards.entries()) {
        try {
          // Show progress every 100 cards
          if (index % 100 === 0 && index > 0) {
            console.log(`📦 Progress: ${index}/${cards.length} (${((index/cards.length)*100).toFixed(1)}%)`);
            console.log(`   ✅ Migrated: ${this.migratedCount} | ❌ Errors: ${this.errorCount}`);
          }

          // Parse abilities and attacks from JSON
          let abilities = [];
          let attacks = [];
          
          try {
            abilities = card.abilities ? JSON.parse(card.abilities) : [];
            attacks = card.attacks ? JSON.parse(card.attacks) : [];
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

          // Insert into products table
          await run(`
            INSERT INTO products (
              product_id, name, ext_hp, ext_card_type, 
              ext_card_text, ext_attack1, ext_attack2, ext_rarity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            parseInt(card.id) || Math.floor(Math.random() * 1000000), // Convert to integer or generate random ID
            card.name,
            card.hp ? parseInt(card.hp) : null,
            card.supertype,
            abilitiesText,
            firstAttackText,
            secondAttackText,
            card.rarity
          ]);

          this.migratedCount++;

          if (index % 50 === 0) {
            console.log(`   Migrated: ${card.name}`);
          }

        } catch (error) {
          console.error(`❌ Error migrating ${card.name}:`, error.message);
          this.errorCount++;
        }
      }

      console.log('\n🎉 Migration complete!\n');
      console.log('📊 Final Statistics:');
      console.log(`   • Cards processed: ${cards.length}`);
      console.log(`   • Cards migrated: ${this.migratedCount}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${((this.migratedCount / cards.length) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
    } finally {
      db.close();
    }
  }
}

// Run the migration
const migrator = new CardsToProductsMigration();
migrator.migrate();

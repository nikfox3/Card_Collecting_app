#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'cards.db');
const backupPath = join(__dirname, 'cards_backup.db');

class TCGCSVMigration {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.stats = {
      usersMigrated: 0,
      collectionsMigrated: 0,
      decksMigrated: 0,
      errors: []
    };
  }

  async backupDatabase() {
    console.log('💾 Creating database backup...');
    
    try {
      // Copy the current database to backup
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupPath);
        console.log(`✅ Database backed up to: ${backupPath}`);
      } else {
        console.log('⚠️  No existing database found, skipping backup');
      }
    } catch (error) {
      console.error('❌ Error creating backup:', error.message);
      throw error;
    }
  }

  async migrateUsers() {
    console.log('👥 Migrating users...');
    
    try {
      // Check if old users table exists
      const oldUsersExists = await new Promise((resolve, reject) => {
        this.db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
          (err, row) => {
            if (err) reject(err);
            else resolve(!!row);
          }
        );
      });

      if (!oldUsersExists) {
        console.log('⚠️  No old users table found, skipping user migration');
        return;
      }

      // Get all users from old table
      const oldUsers = await new Promise((resolve, reject) => {
        this.db.all('SELECT * FROM users', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      console.log(`Found ${oldUsers.length} users to migrate`);

      for (const user of oldUsers) {
        try {
          await new Promise((resolve, reject) => {
            this.db.run(
              `INSERT OR REPLACE INTO users (id, username, email, password_hash, full_name, profile_image, cover_image, is_pro, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                user.id,
                user.username,
                user.email,
                user.password_hash,
                user.full_name,
                user.profile_image,
                user.cover_image,
                user.is_pro || false,
                user.created_at,
                user.updated_at
              ],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          this.stats.usersMigrated++;
        } catch (error) {
          console.error(`Error migrating user ${user.id}:`, error.message);
          this.stats.errors.push({ userId: user.id, error: error.message });
        }
      }

      console.log(`✅ Migrated ${this.stats.usersMigrated} users`);
    } catch (error) {
      console.error('Error migrating users:', error.message);
      this.stats.errors.push({ error: error.message });
    }
  }

  async migrateCollections() {
    console.log('📚 Migrating user collections...');
    
    try {
      // Check if old user_collections table exists
      const oldCollectionsExists = await new Promise((resolve, reject) => {
        this.db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='user_collections'",
          (err, row) => {
            if (err) reject(err);
            else resolve(!!row);
          }
        );
      });

      if (!oldCollectionsExists) {
        console.log('⚠️  No old user_collections table found, skipping collection migration');
        return;
      }

      // Get all collections from old table
      const oldCollections = await new Promise((resolve, reject) => {
        this.db.all('SELECT * FROM user_collections', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      console.log(`Found ${oldCollections.length} collection entries to migrate`);

      for (const collection of oldCollections) {
        try {
          // Try to find matching product by name (this is a best-effort migration)
          const matchingProduct = await new Promise((resolve, reject) => {
            this.db.get(
              `SELECT product_id FROM products WHERE name = ? LIMIT 1`,
              [collection.card_name],
              (err, row) => {
                if (err) reject(err);
                else resolve(row);
              }
            );
          });

          if (matchingProduct) {
            await new Promise((resolve, reject) => {
              this.db.run(
                `INSERT OR REPLACE INTO user_collections (id, user_id, product_id, sub_type_name, quantity, condition, purchase_price, purchase_date, notes, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  collection.id,
                  collection.user_id,
                  matchingProduct.product_id,
                  collection.variant || 'Normal', // Default to Normal if no variant specified
                  collection.quantity || 1,
                  collection.condition || 'Near Mint',
                  collection.purchase_price,
                  collection.purchase_date,
                  collection.notes,
                  collection.created_at,
                  collection.updated_at
                ],
                function(err) {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
            this.stats.collectionsMigrated++;
          } else {
            console.log(`⚠️  Could not find matching product for: ${collection.card_name}`);
            this.stats.errors.push({ 
              collectionId: collection.id, 
              cardName: collection.card_name,
              error: 'No matching product found' 
            });
          }
        } catch (error) {
          console.error(`Error migrating collection ${collection.id}:`, error.message);
          this.stats.errors.push({ collectionId: collection.id, error: error.message });
        }
      }

      console.log(`✅ Migrated ${this.stats.collectionsMigrated} collection entries`);
    } catch (error) {
      console.error('Error migrating collections:', error.message);
      this.stats.errors.push({ error: error.message });
    }
  }

  async migrateDecks() {
    console.log('🃏 Migrating decks...');
    
    try {
      // Check if old decks table exists
      const oldDecksExists = await new Promise((resolve, reject) => {
        this.db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='decks'",
          (err, row) => {
            if (err) reject(err);
            else resolve(!!row);
          }
        );
      });

      if (!oldDecksExists) {
        console.log('⚠️  No old decks table found, skipping deck migration');
        return;
      }

      // Get all decks from old table
      const oldDecks = await new Promise((resolve, reject) => {
        this.db.all('SELECT * FROM decks', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      console.log(`Found ${oldDecks.length} decks to migrate`);

      for (const deck of oldDecks) {
        try {
          await new Promise((resolve, reject) => {
            this.db.run(
              `INSERT OR REPLACE INTO decks (id, user_id, name, format, deck_mode, description, is_public, allow_cloning, total_cards, is_valid, validation_issues, win_count, loss_count, draw_count, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                deck.id,
                deck.user_id,
                deck.name,
                deck.format || 'standard',
                deck.deck_mode || 'casual',
                deck.description,
                deck.is_public || false,
                deck.allow_cloning || false,
                deck.total_cards || 0,
                deck.is_valid || false,
                deck.validation_issues,
                deck.win_count || 0,
                deck.loss_count || 0,
                deck.draw_count || 0,
                deck.created_at,
                deck.updated_at
              ],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          this.stats.decksMigrated++;
        } catch (error) {
          console.error(`Error migrating deck ${deck.id}:`, error.message);
          this.stats.errors.push({ deckId: deck.id, error: error.message });
        }
      }

      console.log(`✅ Migrated ${this.stats.decksMigrated} decks`);
    } catch (error) {
      console.error('Error migrating decks:', error.message);
      this.stats.errors.push({ error: error.message });
    }
  }

  async generateMigrationReport() {
    console.log('\n📊 Migration Report:');
    console.log(`  Users migrated: ${this.stats.usersMigrated}`);
    console.log(`  Collections migrated: ${this.stats.collectionsMigrated}`);
    console.log(`  Decks migrated: ${this.stats.decksMigrated}`);
    console.log(`  Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Migration errors:');
      this.stats.errors.slice(0, 10).forEach((error, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(error)}`);
      });
      
      if (this.stats.errors.length > 10) {
        console.log(`  ... and ${this.stats.errors.length - 10} more errors`);
      }
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Run the TCGCSV importer to populate the new database');
    console.log('2. Update API endpoints to use the new schema');
    console.log('3. Test the application with the new data structure');
    console.log('4. If everything works, you can delete the backup file');
  }

  close() {
    this.db.close();
  }
}

// Main execution
async function main() {
  const migration = new TCGCSVMigration();
  
  try {
    console.log('🔄 Starting TCGCSV Migration...\n');
    
    // Step 1: Backup existing database
    await migration.backupDatabase();
    
    // Step 2: Migrate users
    await migration.migrateUsers();
    
    // Step 3: Migrate collections
    await migration.migrateCollections();
    
    // Step 4: Migrate decks
    await migration.migrateDecks();
    
    // Step 5: Generate report
    await migration.generateMigrationReport();
    
    console.log('\n✅ Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔄 To restore from backup, run:');
    console.log(`cp ${backupPath} ${dbPath}`);
  } finally {
    migration.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default TCGCSVMigration;








import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../cards.db');
const db = new sqlite3.Database(dbPath);

const run = promisify(db.run.bind(db));

async function addOAuthSupport() {
  try {
    console.log('🔧 Adding OAuth support to users table...\n');
    
    // Check if columns already exist
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const hasGoogleId = tableInfo.some(col => col.name === 'google_id');
    const hasOAuthProvider = tableInfo.some(col => col.name === 'oauth_provider');
    const passwordHashNullable = tableInfo.find(col => col.name === 'password_hash')?.notnull === 0;
    
    if (hasGoogleId && hasOAuthProvider && passwordHashNullable) {
      console.log('✅ OAuth columns already exist, skipping migration');
      db.close();
      return;
    }
    
    // Drop views that depend on users table
    try {
      await run(`DROP VIEW IF EXISTS latest_prices`);
    } catch (e) {
      // View might not exist, continue
    }
    
    // Create new table with OAuth support
    await run(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        oauth_provider VARCHAR(50),
        full_name VARCHAR(100),
        profile_image TEXT,
        is_pro BOOLEAN DEFAULT 0,
        pro_expires_at TIMESTAMP NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Copy existing data
    await run(`
      INSERT INTO users_new (id, email, username, password_hash, full_name, profile_image, is_pro, pro_expires_at, joined_at, last_login, created_at, updated_at)
      SELECT id, email, username, password_hash, full_name, profile_image, is_pro, pro_expires_at, joined_at, last_login, created_at, updated_at
      FROM users
    `);
    
    // Drop old table and rename new one
    await run(`DROP TABLE users`);
    await run(`ALTER TABLE users_new RENAME TO users`);
    
    console.log('✅ Added google_id and oauth_provider columns');
    console.log('✅ Made password_hash nullable for OAuth users');
    console.log('\n✅ OAuth support added successfully!');
  } catch (error) {
    console.error('❌ Error adding OAuth support:', error);
    throw error;
  } finally {
    db.close();
  }
}

addOAuthSupport().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});


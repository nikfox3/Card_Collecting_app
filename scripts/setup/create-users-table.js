#!/usr/bin/env node

/**
 * Create Users Table
 * 
 * This script creates the users table for authentication and profile management
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import crypto from 'crypto';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

console.log('👤 Creating Users Table\n');
console.log('='.repeat(80) + '\n');

try {
  // Create users table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
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
  
  console.log('✅ Created users table\n');

  // Create user_auth_sessions table for managing login sessions
  await run(`
    CREATE TABLE IF NOT EXISTS user_auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  console.log('✅ Created user_auth_sessions table\n');

  // Create user_collections table to track which cards users have collected
  await run(`
    CREATE TABLE IF NOT EXISTS user_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_id VARCHAR(50) NOT NULL,
      variant VARCHAR(50) DEFAULT 'Normal',
      condition VARCHAR(20) DEFAULT 'Near Mint',
      is_graded BOOLEAN DEFAULT 0,
      grade_company VARCHAR(20),
      grade_value VARCHAR(10),
      purchase_price DECIMAL(10,2),
      purchase_date DATE,
      quantity INTEGER DEFAULT 1,
      notes TEXT,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, card_id, variant, condition, grade_company, grade_value)
    )
  `);
  
  console.log('✅ Created user_collections table\n');

  // Create user_wishlists table
  await run(`
    CREATE TABLE IF NOT EXISTS user_wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_id VARCHAR(50) NOT NULL,
      priority VARCHAR(20) DEFAULT 'Medium',
      max_price DECIMAL(10,2),
      notes TEXT,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, card_id)
    )
  `);
  
  console.log('✅ Created user_wishlists table\n');

  // Create indexes for better performance
  await run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  await run('CREATE INDEX IF NOT EXISTS idx_user_auth_sessions_token ON user_auth_sessions(session_token)');
  await run('CREATE INDEX IF NOT EXISTS idx_user_auth_sessions_user_id ON user_auth_sessions(user_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_user_collections_card_id ON user_collections(card_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_user_wishlists_user_id ON user_wishlists(user_id)');
  
  console.log('✅ Created indexes\n');

  // Create a demo user (optional - comment out if not needed)
  const demoPassword = 'demo123'; // In production, this should be more secure
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(demoPassword, salt, 1000, 64, 'sha512').toString('hex');
  const passwordHash = `${salt}:${hash}`;
  
  try {
    await run(`
      INSERT INTO users (email, username, password_hash, full_name, is_pro)
      VALUES (?, ?, ?, ?, ?)
    `, ['demo@example.com', 'demo', passwordHash, 'Demo User', 0]);
    
    console.log('✅ Created demo user');
    console.log('   Email: demo@example.com');
    console.log('   Password: demo123');
    console.log('   Username: @demo\n');
  } catch (e) {
    if (e.message.includes('UNIQUE constraint')) {
      console.log('ℹ️  Demo user already exists\n');
    } else {
      throw e;
    }
  }

  // Get stats
  const userCount = await get('SELECT COUNT(*) as count FROM users');
  
  console.log('='.repeat(80));
  console.log('📊 Summary\n');
  console.log(`Total users: ${userCount.count}`);
  console.log('\n✅ User system ready!');
  console.log('\n📋 Next steps:');
  console.log('   1. Update API routes for user authentication');
  console.log('   2. Create login/register UI in frontend');
  console.log('   3. Integrate user data with profile page');
  console.log('   4. Test authentication flow');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

db.close();

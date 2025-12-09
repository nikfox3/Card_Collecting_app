#!/usr/bin/env node

/**
 * Create Social Features Tables
 * 
 * This script creates tables for social features:
 * - User follows
 * - Profile visibility
 * - Activity feed
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

console.log('👥 Creating Social Features Tables\n');
console.log('='.repeat(80) + '\n');

try {
  // Create user_follows table
  await run(`
    CREATE TABLE IF NOT EXISTS user_follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(follower_id, following_id),
      CHECK(follower_id != following_id)
    )
  `);
  
  console.log('✅ Created user_follows table\n');

  // Create user_profile_settings table
  await run(`
    CREATE TABLE IF NOT EXISTS user_profile_settings (
      user_id INTEGER PRIMARY KEY,
      is_public BOOLEAN DEFAULT 1,
      show_collection BOOLEAN DEFAULT 1,
      show_wishlist BOOLEAN DEFAULT 1,
      show_followers BOOLEAN DEFAULT 1,
      show_collection_value BOOLEAN DEFAULT 1,
      bio TEXT,
      location VARCHAR(100),
      website VARCHAR(255),
      twitter VARCHAR(50),
      instagram VARCHAR(50),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  console.log('✅ Created user_profile_settings table\n');

  // Create user_activity table for feed
  await run(`
    CREATE TABLE IF NOT EXISTS user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_type VARCHAR(50) NOT NULL,
      card_id VARCHAR(50),
      metadata TEXT,
      is_public BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL
    )
  `);
  
  console.log('✅ Created user_activity table\n');

  // Create indexes for performance
  await run('CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id, created_at DESC)');
  await run('CREATE INDEX IF NOT EXISTS idx_user_activity_public ON user_activity(is_public, created_at DESC)');
  
  console.log('✅ Created indexes\n');

  // Create default profile settings for existing users
  const existingUsers = await get('SELECT COUNT(*) as count FROM users');
  if (existingUsers.count > 0) {
    await run(`
      INSERT OR IGNORE INTO user_profile_settings (user_id, is_public)
      SELECT id, 1 FROM users
    `);
    console.log(`✅ Created default profile settings for ${existingUsers.count} existing user(s)\n`);
  }

  // Get stats
  const stats = {
    users: await get('SELECT COUNT(*) as count FROM users'),
    follows: await get('SELECT COUNT(*) as count FROM user_follows'),
    activities: await get('SELECT COUNT(*) as count FROM user_activity')
  };

  console.log('='.repeat(80));
  console.log('📊 Summary\n');
  console.log(`Total users: ${stats.users.count}`);
  console.log(`Total follows: ${stats.follows.count}`);
  console.log(`Total activities: ${stats.activities.count}`);
  console.log('\n✅ Social features ready!');
  console.log('\n📋 Features enabled:');
  console.log('   ✅ Follow/unfollow users');
  console.log('   ✅ Public profile pages');
  console.log('   ✅ Privacy settings');
  console.log('   ✅ Activity feed');
  console.log('   ✅ Follower/following counts');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

db.close();









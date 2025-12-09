import sqlite3 from 'sqlite3';
import { config } from '../config.js';

// Create database connection
const db = new sqlite3.Database(config.databasePath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to database:', config.databasePath);
  }
});

// Promisify database queries
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes, lastID: this.lastID });
      }
    });
  });
};

// Initialize core database tables (users, sessions, etc.)
export const initializeCoreTables = async () => {
  try {
    // Create users table with OAuth support
    await run(`
      CREATE TABLE IF NOT EXISTS users (
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
    
    // Create user_auth_sessions table for OAuth sessions
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
    
    // Create indexes
    await run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await run('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_auth_sessions(session_token)');
    await run('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_auth_sessions(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_auth_sessions(expires_at)');
    
    console.log('✅ Core database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing core tables:', error.message);
    throw error; // Re-throw so server knows initialization failed
  }
};

// Initialize analytics tables
export const initializeAnalyticsTables = async () => {
  try {
    // Create analytics_events table
    await run(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type VARCHAR(50) NOT NULL,
        user_id VARCHAR(100),
        session_id VARCHAR(100),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        data JSON,
        user_agent TEXT,
        screen_size VARCHAR(20),
        referrer VARCHAR(255)
      )
    `);
    
    // Create indexes
    await run('CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type)');
    await run('CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp)');
    await run('CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id)');
    
    // Create user_sessions table
    await run(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(100) NOT NULL,
        session_id VARCHAR(100) NOT NULL UNIQUE,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        duration_seconds INTEGER,
        page_views INTEGER DEFAULT 0,
        cards_viewed INTEGER DEFAULT 0,
        searches INTEGER DEFAULT 0,
        device_type VARCHAR(20)
      )
    `);
    
    await run('CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_user_sessions_started ON user_sessions(started_at)');
    
    console.log('✅ Analytics tables initialized');
    
    // Initialize marketplace_config table
    try {
      await run(`
        CREATE TABLE IF NOT EXISTS marketplace_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          platform TEXT NOT NULL UNIQUE,
          enabled BOOLEAN DEFAULT 1,
          affiliate_link TEXT,
          affiliate_id TEXT,
          logo_path TEXT,
          display_name TEXT,
          commission_rate REAL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await run('CREATE INDEX IF NOT EXISTS idx_marketplace_platform ON marketplace_config(platform)');
      await run('CREATE INDEX IF NOT EXISTS idx_marketplace_enabled ON marketplace_config(enabled)');
      
      // Insert default platforms if they don't exist
      const existingCount = await get('SELECT COUNT(*) as count FROM marketplace_config');
      if (existingCount.count === 0) {
        await run(`INSERT OR IGNORE INTO marketplace_config (platform, enabled, affiliate_link, display_name, logo_path) VALUES
          ('TCGPlayer', 1, 'https://www.tcgplayer.com', 'TCGPlayer', '/Assets/TCGplayer_Logo 1.svg'),
          ('eBay', 1, 'https://www.ebay.com', 'eBay', NULL),
          ('Whatnot', 1, 'https://www.whatnot.com', 'Whatnot', NULL),
          ('Drip', 1, 'https://www.drip.com', 'Drip', NULL),
          ('Fanatics', 1, 'https://www.fanaticsollect.com', 'Fanatics', NULL)`);
      }
      
      console.log('✅ Marketplace config table initialized');
    } catch (error) {
      console.error('❌ Error initializing marketplace config table:', error.message);
    }
  } catch (error) {
    console.error('❌ Error initializing analytics tables:', error.message);
  }
};

export default db;











import { run, get } from './utils/database.js';
import crypto from 'crypto';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const username = 'testuser';
    const password = 'test123';
    const fullName = 'Test User';

    // Check if user already exists
    const existing = await get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing) {
      console.log('✅ Test user already exists!');
      console.log('Email:', email);
      console.log('Username:', username);
      console.log('Password:', password);
      return;
    }

    // Create user
    const passwordHash = hashPassword(password);
    const result = await run(`
      INSERT INTO users (email, username, password_hash, full_name, joined_at, last_login)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [email, username, passwordHash, fullName]);

    console.log('✅ Test user created successfully!');
    console.log('Email:', email);
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('User ID:', result.lastID);
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();

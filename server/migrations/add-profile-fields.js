import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../cards.db');
const db = new sqlite3.Database(dbPath);

const run = promisify(db.run.bind(db));

async function addProfileFields() {
  try {
    console.log('Adding profile fields to users table...');
    
    // Add new columns if they don't exist
    const columns = [
      { name: 'cover_image', type: 'TEXT' },
      { name: 'tagline', type: 'VARCHAR(255)' },
      { name: 'about_me', type: 'TEXT' },
      { name: 'social_links', type: 'TEXT' }, // JSON string
      { name: 'collecting_goals', type: 'TEXT' } // JSON string (array)
    ];
    
    for (const column of columns) {
      try {
        await run(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`⚠️  Column ${column.name} already exists, skipping.`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Profile fields added successfully');
  } catch (error) {
    console.error('❌ Error adding profile fields:', error);
    throw error;
  } finally {
    db.close();
  }
}

addProfileFields();


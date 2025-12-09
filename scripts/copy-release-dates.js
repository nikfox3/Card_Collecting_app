import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open both databases
const sourceDb = new sqlite3.Database(path.resolve(__dirname, '../server/cards.db'));
const targetDb = new sqlite3.Database(path.resolve(__dirname, '../cards.db'));

// Promisify database methods
const sourceGet = promisify(sourceDb.get.bind(sourceDb));
const targetRun = promisify(targetDb.run.bind(targetDb));
const sourceAll = promisify(sourceDb.all.bind(sourceDb));

async function copyReleaseDates() {
  try {
    console.log('📅 Starting release date copy process...\n');
    
    // Get all sets with release dates from source database
    const setsWithDates = await sourceAll(`
      SELECT group_id, name, published_on
      FROM groups
      WHERE category_id = 3
        AND published_on IS NOT NULL
        AND published_on != ''
    `);
    
    console.log(`Found ${setsWithDates.length} sets with release dates in source database\n`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Copy each release date
    for (const set of setsWithDates) {
      try {
        // Check if the set exists in target database
        const targetSet = await new Promise((resolve, reject) => {
          targetDb.get(
            'SELECT group_id, name, published_on FROM groups WHERE group_id = ?',
            [set.group_id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });
        
        if (!targetSet) {
          console.log(`⚠️  Set ${set.group_id} (${set.name}) not found in target database, skipping...`);
          skipped++;
          continue;
        }
        
        // Update if the date is missing or different
        if (targetSet.published_on !== set.published_on) {
          await targetRun(
            'UPDATE groups SET published_on = ? WHERE group_id = ?',
            [set.published_on, set.group_id]
          );
          console.log(`✅ Updated ${set.name} (${set.group_id}): ${targetSet.published_on || 'NULL'} → ${set.published_on}`);
          updated++;
        } else {
          console.log(`⏭️  Set ${set.name} (${set.group_id}) already has correct date: ${set.published_on}`);
        }
      } catch (error) {
        console.error(`❌ Error updating set ${set.group_id} (${set.name}):`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✅ Release date copy complete!`);
    
  } catch (error) {
    console.error('❌ Error copying release dates:', error);
  } finally {
    sourceDb.close();
    targetDb.close();
  }
}

copyReleaseDates();





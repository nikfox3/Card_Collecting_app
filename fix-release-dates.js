#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

class ReleaseDateFix {
  constructor() {
    this.updatedCount = 0;
    this.errorCount = 0;
  }

  async fix() {
    try {
      console.log('🔄 Fixing Release Dates...\n');

      // Get all sets with their release dates
      const sets = await all(`
        SELECT id, name, release_date
        FROM sets
        WHERE release_date IS NOT NULL
        ORDER BY name
      `);

      console.log(`📚 Found ${sets.length} sets with release dates\n`);

      // Create a mapping of set_id to release_date
      const setToDateMap = new Map();
      
      for (const set of sets) {
        // Convert date format from YYYY/MM/DD to YYYY-MM-DD
        const formattedDate = set.release_date.replace(/\//g, '-');
        setToDateMap.set(set.id, formattedDate);
        console.log(`📅 ${set.name}: ${set.release_date} -> ${formattedDate}`);
      }

      console.log(`\n📊 Updating groups table with correct release dates...\n`);

      // Update all groups with their correct release dates
      for (const [setId, releaseDate] of setToDateMap.entries()) {
        try {
          // Find the group_id for this set
          const groupData = await get(`
            SELECT group_id FROM groups 
            WHERE name = (
              SELECT name FROM sets WHERE id = ?
            )
          `, [setId]);
          
          if (groupData) {
            await run(`
              UPDATE groups 
              SET published_on = ?
              WHERE group_id = ?
            `, [releaseDate, groupData.group_id]);
            
            this.updatedCount++;
            console.log(`✅ Updated group_id ${groupData.group_id} with date ${releaseDate}`);
          } else {
            console.log(`⚠️  No group found for set_id: ${setId}`);
            this.errorCount++;
          }
        } catch (error) {
          console.error(`❌ Error updating set ${setId}:`, error.message);
          this.errorCount++;
        }
      }

      console.log('\n🎉 Release date fix complete!\n');
      console.log('📊 Final Statistics:');
      console.log(`   • Groups updated: ${this.updatedCount}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${((this.updatedCount / sets.length) * 100).toFixed(1)}%`);

      // Show some examples of updated dates
      console.log('\n📅 Sample of updated release dates:');
      const sampleGroups = await all(`
        SELECT group_id, name, published_on 
        FROM groups 
        WHERE published_on IS NOT NULL 
        ORDER BY published_on 
        LIMIT 10
      `);
      
      for (const group of sampleGroups) {
        console.log(`   ${group.name}: ${group.published_on}`);
      }

    } catch (error) {
      console.error('❌ Release date fix failed:', error.message);
    } finally {
      db.close();
    }
  }
}

// Run the fix
const fixer = new ReleaseDateFix();
fixer.fix();





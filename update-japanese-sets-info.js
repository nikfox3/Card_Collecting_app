import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the actual cards.db in the root directory
const dbPath = path.join(__dirname, 'cards.db');

// Create database connection
const db = new sqlite3.Database(dbPath);

// Promisify database queries
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
};

// Japanese set release dates and series information
// Based on Bulbapedia: https://bulbapedia.bulbagarden.net/wiki/List_of_Japanese_Pokémon_Trading_Card_Game_expansions
const japaneseSetsInfo = {
  // Scarlet & Violet Era
  'SV1S: Scarlet ex': { date: '2023-01-27', series: 'Scarlet & Violet Series' },
  'SV1V: Violet ex': { date: '2023-01-27', series: 'Scarlet & Violet Series' },
  'SV1a: Triplet Beat': { date: '2023-03-10', series: 'Scarlet & Violet Series' },
  'SV2D: Clay Burst': { date: '2023-04-14', series: 'Scarlet & Violet Series' },
  'SV2P: Snow Hazard': { date: '2023-06-09', series: 'Scarlet & Violet Series' },
  'SV2a: Pokemon Card 151': { date: '2023-06-16', series: 'Scarlet & Violet Series' },
  'SV3: Ruler of the Black Flame': { date: '2023-07-28', series: 'Scarlet & Violet Series' },
  'SV3a: Raging Surf': { date: '2023-09-08', series: 'Scarlet & Violet Series' },
  'SV4K: Ancient Roar': { date: '2023-10-27', series: 'Scarlet & Violet Series' },
  'SV4M: Future Flash': { date: '2023-10-27', series: 'Scarlet & Violet Series' },
  'SV4a: Shiny Treasure ex': { date: '2023-12-01', series: 'Scarlet & Violet Series' },
  'SV5K: Wild Force': { date: '2024-01-26', series: 'Scarlet & Violet Series' },
  'SV5M: Cyber Judge': { date: '2024-01-26', series: 'Scarlet & Violet Series' },
  'SV5a: Crimson Haze': { date: '2024-03-22', series: 'Scarlet & Violet Series' },
  'SV6: Transformation Mask': { date: '2024-04-26', series: 'Scarlet & Violet Series' },
  'SV6a: Night Wanderer': { date: '2024-06-07', series: 'Scarlet & Violet Series' },
  'SV7: Stellar Miracle': { date: '2024-07-26', series: 'Scarlet & Violet Series' },
  'SV7a: Paradise Dragona': { date: '2024-09-13', series: 'Scarlet & Violet Series' },
  
  // Sword & Shield Era
  'S1W: Sword': { date: '2019-12-06', series: 'Sword & Shield Series' },
  'S1H: Shield': { date: '2019-12-06', series: 'Sword & Shield Series' },
  'S1a: Alter Genesis': { date: '2020-02-07', series: 'Sword & Shield Series' },
  'S1: Miracle Twin': { date: '2020-03-06', series: 'Sword & Shield Series' },
  'S1a: Double Blaze': { date: '2020-05-22', series: 'Sword & Shield Series' },
  'S1a: Tag Bolt': { date: '2020-07-10', series: 'Sword & Shield Series' },
  'S2: Rebellion Crash': { date: '2020-08-07', series: 'Sword & Shield Series' },
  'S3: Infinity Zone': { date: '2020-09-11', series: 'Sword & Shield Series' },
  'S4: Amazing Volt Tackle': { date: '2020-11-20', series: 'Sword & Shield Series' },
  'S5I: Single Strike Master': { date: '2021-01-22', series: 'Sword & Shield Series' },
  'S5R: Rapid Strike Master': { date: '2021-01-22', series: 'Sword & Shield Series' },
  'S6H: Silver Lance': { date: '2021-03-19', series: 'Sword & Shield Series' },
  'S6K: Jet-Black Spirit': { date: '2021-03-19', series: 'Sword & Shield Series' },
  'S6a: Eevee Heroes': { date: '2021-05-28', series: 'Sword & Shield Series' },
  'S7D: Skyscraping Perfection': { date: '2021-06-25', series: 'Sword & Shield Series' },
  'S7R: Blue Sky Stream': { date: '2021-06-25', series: 'Sword & Shield Series' },
  'S8: Fusion Arts': { date: '2021-09-10', series: 'Sword & Shield Series' },
  'S8a: Space Juggler': { date: '2021-10-22', series: 'Sword & Shield Series' },
  'S8: Time Gazer': { date: '2021-10-22', series: 'Sword & Shield Series' },
  'S9: Star Birth': { date: '2021-12-03', series: 'Sword & Shield Series' },
  'S9a: Battle Region': { date: '2022-02-25', series: 'Sword & Shield Series' },
  'S9: Dark Phantasma': { date: '2022-05-27', series: 'Sword & Shield Series' },
  'S10: Incandescent Arcana': { date: '2022-07-15', series: 'Sword & Shield Series' },
  'S11: Lost Abyss': { date: '2022-09-09', series: 'Sword & Shield Series' },
  'S12: Paradigm Trigger': { date: '2022-11-11', series: 'Sword & Shield Series' },
  'S12a: VSTAR Universe': { date: '2022-12-02', series: 'Sword & Shield Series' },
  
  // Additional Sword & Shield sets
  'VMAX Rising': { date: '2020-11-20', series: 'Sword & Shield Series' },
  'Shiny Star V': { date: '2020-11-20', series: 'Sword & Shield Series' },
  'VMAX Climax': { date: '2021-12-03', series: 'Sword & Shield Series' },
  'S2a: Explosive Walker': { date: '2020-12-11', series: 'Sword & Shield Series' },
  'S3a: Legendary Heartbeat': { date: '2020-10-23', series: 'Sword & Shield Series' },
  'S5a: Peerless Fighters': { date: '2021-02-26', series: 'Sword & Shield Series' },
  'S8a: 25th Anniversary Collection': { date: '2021-10-22', series: 'Sword & Shield Series' },
  'S10b: Pokemon GO': { date: '2022-06-17', series: 'Sword & Shield Series' },
  'S12a: VSTAR Universe': { date: '2022-12-02', series: 'Sword & Shield Series' },
  
  // English set name variations (for sets that might be stored with English names)
  'SV01: Scarlet & Violet Base Set': { date: '2023-01-27', series: 'Scarlet & Violet Series' },
  'SV02: Paldea Evolved': { date: '2023-06-09', series: 'Scarlet & Violet Series' },
  'SV03: Obsidian Flames': { date: '2023-07-28', series: 'Scarlet & Violet Series' },
  'SV04: Paradox Rift': { date: '2023-10-27', series: 'Scarlet & Violet Series' },
  'SV05: Temporal Forces': { date: '2024-01-26', series: 'Scarlet & Violet Series' },
  'SV06: Twilight Masquerade': { date: '2024-04-26', series: 'Scarlet & Violet Series' },
  'SV07: Stellar Crown': { date: '2024-07-26', series: 'Scarlet & Violet Series' },
  
  // Sun & Moon Era (if needed)
  'SM1a: Collection Sun': { date: '2017-04-21', series: 'Sun & Moon Series' },
  'SM1V: Collection Moon': { date: '2017-04-21', series: 'Sun & Moon Series' },
  'SM1: Sun & Moon': { date: '2017-04-21', series: 'Sun & Moon Series' },
  
  // XY Era
  'XY': { date: '2013-12-13', series: 'XY Series' },
  'XY2: Wild Blaze': { date: '2014-03-15', series: 'XY Series' },
  'XY3: Rising Fist': { date: '2014-06-14', series: 'XY Series' },
  'XY4: Phantom Gate': { date: '2014-09-13', series: 'XY Series' },
  'XY5-Bg: Gaia Volcano': { date: '2014-12-13', series: 'XY Series' },
  'XY5-Bt: Tidal Storm': { date: '2014-12-13', series: 'XY Series' },
  'XY6: Emerald Break': { date: '2015-04-18', series: 'XY Series' },
  'XY7: Bandit Ring': { date: '2015-08-05', series: 'XY Series' },
  'XY8-Bb: Blue Shock': { date: '2015-12-11', series: 'XY Series' },
  'XY8-Br: Red Flash': { date: '2015-12-11', series: 'XY Series' },
  'XY9: Rage of the Broken Heavens': { date: '2016-03-18', series: 'XY Series' },
  'XY10: Awakening Psychic King': { date: '2016-06-17', series: 'XY Series' },
  'XY11-Bb: Fever-Burst Fighter': { date: '2016-09-16', series: 'XY Series' },
  'XY11-Br: Cruel Traitor': { date: '2016-09-16', series: 'XY Series' },
  'XY-Bx: Collection X': { date: '2013-12-13', series: 'XY Series' },
  'XY-By: Collection Y': { date: '2013-12-13', series: 'XY Series' },
  'XY-P: XY Promos': { date: '2013-12-13', series: 'XY Series' },
  
  // Black & White Era
  'BW1: Black Collection': { date: '2011-04-15', series: 'Black & White Series' },
  'BW1: White Collection': { date: '2011-04-15', series: 'Black & White Series' },
  'BW2: Red Collection': { date: '2011-06-17', series: 'Black & White Series' },
  'BW3: Psycho Drive': { date: '2011-09-16', series: 'Black & White Series' },
  'BW3: Hail Blizzard': { date: '2011-09-16', series: 'Black & White Series' },
  'BW4: Dark Rush': { date: '2011-12-16', series: 'Black & White Series' },
  'BW5: Dragon Blast': { date: '2012-03-16', series: 'Black & White Series' },
  'BW5: Dragon Blade': { date: '2012-03-16', series: 'Black & White Series' },
  'BW6: Freeze Bolt': { date: '2012-06-15', series: 'Black & White Series' },
  'BW6: Cold Flare': { date: '2012-06-15', series: 'Black & White Series' },
  'BW7: Plasma Gale': { date: '2012-09-14', series: 'Black & White Series' },
  'BW8: Spiral Force': { date: '2012-11-16', series: 'Black & White Series' },
  'BW8: Thunder Knuckle': { date: '2012-11-16', series: 'Black & White Series' },
  'BW9: Megalo Cannon': { date: '2013-03-15', series: 'Black & White Series' },
  'BW-P Promotional cards': { date: '2011-04-15', series: 'Black & White Series' },
  
  // Sun & Moon Era
  'SM1S: Collection Sun': { date: '2017-04-21', series: 'Sun & Moon Series' },
  'SM1M: Collection Moon': { date: '2017-04-21', series: 'Sun & Moon Series' },
  'SM2K: Islands Await You': { date: '2017-06-16', series: 'Sun & Moon Series' },
  'SM2L: Alolan Moonlight': { date: '2017-06-16', series: 'Sun & Moon Series' },
  'SM3H: To Have Seen the Battle Rainbow': { date: '2017-09-15', series: 'Sun & Moon Series' },
  'SM3N: Darkness that Consumes Light': { date: '2017-09-15', series: 'Sun & Moon Series' },
  'SM4S: Awakened Heroes': { date: '2017-12-08', series: 'Sun & Moon Series' },
  'SM4A: Ultradimensional Beasts': { date: '2017-12-08', series: 'Sun & Moon Series' },
  'SM5S: Ultra Sun': { date: '2018-02-02', series: 'Sun & Moon Series' },
  'SM5M: Ultra Moon': { date: '2018-02-02', series: 'Sun & Moon Series' },
  'SM6: Forbidden Light': { date: '2018-05-04', series: 'Sun & Moon Series' },
  'SM7: Sky-Splitting Charisma': { date: '2018-07-13', series: 'Sun & Moon Series' },
  'SM8: Super-Burst Impact': { date: '2018-09-07', series: 'Sun & Moon Series' },
  'SM9: Tag Bolt': { date: '2018-12-07', series: 'Sun & Moon Series' },
  'SM10: Double Blaze': { date: '2019-02-01', series: 'Sun & Moon Series' },
  'SM11: Miracle Twin': { date: '2019-05-31', series: 'Sun & Moon Series' },
  'SM12: Alter Genesis': { date: '2019-08-02', series: 'Sun & Moon Series' },
  'SM1+: Sun & Moon': { date: '2017-04-21', series: 'Sun & Moon Series' },
  'SM2+: Facing a New Trial': { date: '2017-06-16', series: 'Sun & Moon Series' },
  'SM3+: Shining Legends': { date: '2017-09-15', series: 'Sun & Moon Series' },
  'SM4+: GX Battle Boost': { date: '2017-12-08', series: 'Sun & Moon Series' },
  'SM5+: Ultra Force': { date: '2018-02-02', series: 'Sun & Moon Series' },
  'SM6a: Dragon Storm': { date: '2018-06-01', series: 'Sun & Moon Series' },
  'SM6b: Champion Road': { date: '2018-06-01', series: 'Sun & Moon Series' },
  'SM7a: Thunderclap Spark': { date: '2018-09-07', series: 'Sun & Moon Series' },
  'SM7b: Fairy Rise': { date: '2018-09-07', series: 'Sun & Moon Series' },
  'SM8a: Dark Order': { date: '2018-12-07', series: 'Sun & Moon Series' },
  'SM8b: GX Ultra Shiny': { date: '2018-12-07', series: 'Sun & Moon Series' },
  'SM9a: Night Unison': { date: '2019-02-01', series: 'Sun & Moon Series' },
  'SM9b: Full Metal Wall': { date: '2019-02-01', series: 'Sun & Moon Series' },
  'SM10a: GG End': { date: '2019-05-31', series: 'Sun & Moon Series' },
  'SM10b: Sky Legend': { date: '2019-05-31', series: 'Sun & Moon Series' },
  'SM11a: Remix Bout': { date: '2019-08-02', series: 'Sun & Moon Series' },
  'SM11b: Dream League': { date: '2019-08-02', series: 'Sun & Moon Series' },
  'SM12a: TAG TEAM GX: Tag All Stars': { date: '2019-10-04', series: 'Sun & Moon Series' },
  'SM0: Pikachu\'s New Friends': { date: '2016-12-09', series: 'Sun & Moon Series' },
  'SM-P: Sun & Moon Promos': { date: '2017-04-21', series: 'Sun & Moon Series' },
  
  // Additional sets
  'SV8: Super Electric Breaker': { date: '2024-10-11', series: 'Scarlet & Violet Series' },
  'SV8a: Terastal Fest ex': { date: '2024-11-08', series: 'Scarlet & Violet Series' },
  'SV9: Battle Partners': { date: '2024-12-06', series: 'Scarlet & Violet Series' },
  'SV9a: Heat Wave Arena': { date: '2025-01-10', series: 'Scarlet & Violet Series' },
  'SV10: The Glory of Team Rocket': { date: '2025-02-07', series: 'Scarlet & Violet Series' },
  'SV11B: Black Bolt': { date: '2025-03-07', series: 'Scarlet & Violet Series' },
  'SV11W: White Flare': { date: '2025-03-07', series: 'Scarlet & Violet Series' },
  'SV-P Promotional Cards': { date: '2023-01-27', series: 'Scarlet & Violet Series' },
  'SVM: Generations Start Decks': { date: '2023-01-27', series: 'Scarlet & Violet Series' },
  'Battle Academy': { date: '2020-07-31', series: 'Sword & Shield Series' },
  'Gym Challenge': { date: '2000-10-16', series: 'Base Series' },
  
  // Diamond & Pearl Era
  'DP1: Space-Time Creation': { date: '2007-02-08', series: 'Diamond & Pearl Series' },
  'DP2: Secret of the Lakes': { date: '2007-05-18', series: 'Diamond & Pearl Series' },
  'DP3: Shining Darkness': { date: '2007-08-03', series: 'Diamond & Pearl Series' },
  'DP4: Dawn Dash': { date: '2007-11-09', series: 'Diamond & Pearl Series' },
  'DP4: Moonlit Pursuit': { date: '2007-11-09', series: 'Diamond & Pearl Series' },
  'DP5: Temple of Anger': { date: '2008-02-08', series: 'Diamond & Pearl Series' },
  'DP5: Cry from the Mysterious': { date: '2008-02-08', series: 'Diamond & Pearl Series' },
  'DP-P Promotional cards': { date: '2007-02-08', series: 'Diamond & Pearl Series' },
  
  // Platinum Era
  'Pt1: Galactic\'s Conquest': { date: '2008-05-30', series: 'Platinum Series' },
  'Pt2: Bonds to the End of Time': { date: '2008-08-08', series: 'Platinum Series' },
  'Pt3: Beat of the Frontier': { date: '2008-11-14', series: 'Platinum Series' },
  'Pt4: Advent of Arceus': { date: '2009-02-11', series: 'Platinum Series' },
  'DPt-P Promotional cards': { date: '2008-05-30', series: 'Platinum Series' },
  
  // HeartGold & SoulSilver Era
  'L1: HeartGold Collection': { date: '2009-10-09', series: 'HeartGold & SoulSilver Series' },
  'L1: SoulSilver Collection': { date: '2009-10-09', series: 'HeartGold & SoulSilver Series' },
  'L2: Revival Legends': { date: '2010-02-11', series: 'HeartGold & SoulSilver Series' },
  'L2: Clash at the Summit': { date: '2010-05-12', series: 'HeartGold & SoulSilver Series' },
  'L3: Clash at the Summit': { date: '2010-05-12', series: 'HeartGold & SoulSilver Series' },
  'LL: Lost Link': { date: '2010-08-05', series: 'HeartGold & SoulSilver Series' },
  'L-P: Legends Promos': { date: '2009-10-09', series: 'HeartGold & SoulSilver Series' },
  
  // Note: Many older sets and promotional sets don't have specific release dates
  // These will remain without dates until more specific information is available
};

class JapaneseSetsUpdater {
  constructor() {
    this.stats = {
      updated: 0,
      notFound: 0,
      skipped: 0
    };
  }

  async updateSetInfo() {
    console.log('🔄 Starting Japanese sets information update...\n');
    
    try {
      // Get all Japanese sets from database using language field
      const sets = await query(`
        SELECT group_id, name, published_on
        FROM groups
        WHERE category_id = 3 AND language = 'ja'
        ORDER BY group_id
      `);
      
      console.log(`🔍 Sample Japanese sets found:`, sets.slice(0, 5).map(s => s.name));
      
      console.log(`📊 Found ${sets.length} Japanese sets in database\n`);
      
      for (const set of sets) {
        const setName = set.name || '';
        const cleanName = setName.replace(/^[A-Z0-9]+[a-z]?:\s*/i, '').trim();
        
        // Try to find matching info
        let setInfo = japaneseSetsInfo[setName] || 
                     japaneseSetsInfo[cleanName] ||
                     this.findPartialMatch(setName, cleanName);
        
        if (setInfo) {
          // Check if update is needed
          const needsUpdate = !set.published_on || set.published_on !== setInfo.date;
          
          if (needsUpdate) {
            await run(`
              UPDATE groups
              SET published_on = ?
              WHERE group_id = ?
            `, [setInfo.date, set.group_id]);
            
            console.log(`✅ Updated: ${setName}`);
            console.log(`   Release Date: ${setInfo.date}`);
            console.log(`   Series: ${setInfo.series}`);
            this.stats.updated++;
          } else {
            console.log(`⏭️  Skipped (already up to date): ${setName}`);
            this.stats.skipped++;
          }
        } else {
          console.log(`⚠️  No info found for: ${setName}`);
          this.stats.notFound++;
        }
      }
      
      console.log('\n📈 Update Summary:');
      console.log(`   ✅ Updated: ${this.stats.updated}`);
      console.log(`   ⏭️  Skipped: ${this.stats.skipped}`);
      console.log(`   ⚠️  Not Found: ${this.stats.notFound}`);
      console.log(`   📊 Total: ${sets.length}`);
      
    } catch (error) {
      console.error('❌ Error updating sets:', error);
      throw error;
    } finally {
      db.close();
    }
  }

  findPartialMatch(setName, cleanName) {
    // Try to match by partial name (e.g., "Eevee Heroes" matches "S6a: Eevee Heroes")
    for (const [key, value] of Object.entries(japaneseSetsInfo)) {
      const keyClean = key.replace(/^[A-Z0-9]+[a-z]?:\s*/i, '').trim();
      if (setName.includes(keyClean) || cleanName.includes(keyClean) || 
          keyClean.includes(setName) || keyClean.includes(cleanName)) {
        return value;
      }
    }
    return null;
  }
}

// Run the updater
const updater = new JapaneseSetsUpdater();
updater.updateSetInfo()
  .then(() => {
    console.log('\n✅ Update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });


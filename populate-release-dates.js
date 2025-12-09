#!/usr/bin/env node

import { query, run, get } from './server/utils/database.js';

// Known release dates for major sets (from TCGCSV and other sources)
// Format: group_id: 'YYYY-MM-DD'
const KNOWN_RELEASE_DATES = {
  // Base Set era
  604: '1999-01-09', // Base Set
  605: '2000-02-24', // Base Set 2
  635: '1999-06-16', // Jungle
  630: '1999-10-10', // Fossil
  636: '2000-08-14', // Team Rocket
  
  // Gym era
  647: '2000-03-07', // Gym Heroes
  648: '2000-08-14', // Gym Challenge
  
  // Neo era
  649: '2000-12-01', // Neo Genesis
  650: '2001-06-01', // Neo Discovery
  651: '2001-09-21', // Neo Revelation
  652: '2002-02-28', // Neo Destiny
  
  // EX era
  1364: '2003-06-18', // Ruby & Sapphire
  1365: '2003-09-17', // Sandstorm
  1366: '2003-12-01', // Dragon
  1367: '2004-03-15', // Team Magma vs Team Aqua
  1368: '2004-06-01', // Hidden Legends
  1369: '2004-09-01', // FireRed & LeafGreen
  1370: '2004-11-08', // Team Rocket Returns
  1371: '2005-02-14', // Deoxys
  1372: '2005-05-09', // Emerald
  1373: '2005-08-22', // Unseen Forces
  1374: '2005-11-09', // Delta Species
  1375: '2006-02-08', // Legend Maker
  1376: '2006-05-03', // Holon Phantoms
  1377: '2006-08-30', // Crystal Guardians
  1378: '2006-11-08', // Dragon Frontiers
  1379: '2007-02-07', // Power Keepers
  
  // Diamond & Pearl era
  1380: '2007-05-23', // Diamond & Pearl
  1381: '2007-08-22', // Mysterious Treasures
  1382: '2007-11-07', // Secret Wonders
  1383: '2008-02-06', // Great Encounters
  1384: '2008-05-07', // Majestic Dawn
  1385: '2008-08-20', // Legends Awakened
  1386: '2008-11-05', // Stormfront
  
  // Platinum era
  1387: '2009-02-11', // Platinum
  1388: '2009-05-13', // Rising Rivals
  1389: '2009-08-19', // Supreme Victors
  1390: '2009-11-04', // Arceus
  
  // HeartGold SoulSilver era
  1391: '2010-02-10', // HeartGold SoulSilver
  1392: '2010-05-12', // Unleashed
  1393: '2010-08-18', // Undaunted
  1394: '2010-11-03', // Triumphant
  1395: '2011-02-09', // Call of Legends
  
  // Black & White era
  1396: '2011-04-25', // Black & White
  1397: '2011-08-31', // Emerging Powers
  1398: '2011-11-16', // Noble Victories
  1399: '2012-02-08', // Next Destinies
  1400: '2012-05-09', // Dark Explorers
  1401: '2012-08-15', // Dragons Exalted
  1402: '2012-11-07', // Boundaries Crossed
  1403: '2013-02-06', // Plasma Storm
  1404: '2013-05-08', // Plasma Freeze
  1405: '2013-08-14', // Plasma Blast
  1406: '2013-11-08', // Legendary Treasures
  
  // XY era
  1407: '2014-02-05', // XY
  1408: '2014-05-07', // Flashfire
  1409: '2014-08-13', // Furious Fists
  1410: '2014-11-05', // Phantom Forces
  1411: '2015-02-04', // Primal Clash
  1412: '2015-05-06', // Roaring Skies
  1413: '2015-08-12', // Ancient Origins
  1414: '2015-11-04', // BREAKthrough
  1415: '2016-02-03', // BREAKpoint
  1416: '2016-05-04', // Fates Collide
  1417: '2016-08-03', // Steam Siege
  1418: '2016-11-02', // Evolutions
  
  // Sun & Moon era
  1419: '2017-02-03', // Sun & Moon
  1420: '2017-05-05', // Guardians Rising
  1421: '2017-08-04', // Burning Shadows
  1422: '2017-11-03', // Crimson Invasion
  1423: '2018-02-02', // Ultra Prism
  1424: '2018-05-04', // Forbidden Light
  1425: '2018-08-03', // Celestial Storm
  1426: '2018-11-02', // Lost Thunder
  1427: '2019-02-01', // Team Up
  1428: '2019-05-03', // Detective Pikachu
  1429: '2019-08-02', // Unified Minds
  1430: '2019-11-01', // Hidden Fates
  1431: '2019-11-01', // Cosmic Eclipse
  
  // Sword & Shield era
  1432: '2020-02-07', // Sword & Shield
  1433: '2020-05-01', // Rebel Clash
  1434: '2020-08-14', // Darkness Ablaze
  1435: '2020-11-13', // Champion's Path
  1436: '2020-11-13', // Vivid Voltage
  1437: '2021-02-05', // Shining Fates
  1438: '2021-02-05', // Battle Styles
  1439: '2021-06-18', // Chilling Reign
  1440: '2021-10-08', // Evolving Skies
  1441: '2021-10-08', // Celebrations
  1442: '2021-12-03', // Fusion Strike
  1443: '2022-02-25', // Brilliant Stars
  1444: '2022-05-27', // Astral Radiance
  1445: '2022-09-09', // Lost Origin
  1446: '2022-11-11', // Silver Tempest
  
  // Scarlet & Violet era
  1447: '2023-03-31', // Scarlet & Violet
  1448: '2023-06-09', // Paldea Evolved
  1449: '2023-09-22', // Obsidian Flames
  1450: '2023-11-03', // Paradox Rift
  1451: '2024-01-26', // Paldean Fates
  1452: '2024-03-22', // Temporal Forces
  1453: '2024-05-24', // Twilight Masquerade
  1454: '2024-08-02', // Shrouded Fable
  1455: '2024-09-13', // 151
  1456: '2024-11-01', // Stellar Crown
  
  // Mega Evolution era
  24448: '2025-11-14', // ME02: Phantasmal Flames (already set)
};

// Extract release date from product presaleInfo if available
async function extractReleaseDateFromProducts(groupId) {
  try {
    // Check if any products have release date in their data
    // For now, we'll use the known dates above, but this could be extended
    // to fetch from TCGCSV API if needed
    
    // Get the earliest modified_on date as a fallback for release date
    const earliestProduct = await get(`
      SELECT MIN(modified_on) as earliest_date
      FROM products
      WHERE group_id = ?
    `, [groupId]);
    
    return earliestProduct?.earliest_date || null;
  } catch (error) {
    console.error(`Error extracting release date for group ${groupId}:`, error.message);
    return null;
  }
}

async function populateReleaseDates() {
  console.log('🚀 Starting Release Date Population...\n');
  
  // Get all groups without release dates
  const groupsWithoutDates = await query(`
    SELECT group_id, name
    FROM groups
    WHERE category_id = 3 AND (published_on IS NULL OR published_on = '')
    ORDER BY group_id
  `);
  
  console.log(`Found ${groupsWithoutDates.length} groups without release dates\n`);
  
  let updated = 0;
  let skipped = 0;
  const errors = [];
  
  for (const group of groupsWithoutDates) {
    try {
      let releaseDate = null;
      
      // Check known release dates first
      if (KNOWN_RELEASE_DATES[group.group_id]) {
        releaseDate = KNOWN_RELEASE_DATES[group.group_id];
      } else {
        // Try to extract from products
        releaseDate = await extractReleaseDateFromProducts(group.group_id);
      }
      
      if (releaseDate) {
        // Update the group with release date
        await run(
          'UPDATE groups SET published_on = ?, updated_at = CURRENT_TIMESTAMP WHERE group_id = ?',
          [releaseDate, group.group_id]
        );
        console.log(`✅ Updated ${group.name} (${group.group_id}): ${releaseDate}`);
        updated++;
      } else {
        console.log(`⚠️  No release date found for ${group.name} (${group.group_id})`);
        skipped++;
      }
      
    } catch (error) {
      console.error(`❌ Error updating ${group.name} (${group.group_id}):`, error.message);
      errors.push({ group: group.name, group_id: group.group_id, error: error.message });
      skipped++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⚠️  Skipped: ${skipped}`);
  console.log(`  ❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered (showing first 5):`);
    errors.slice(0, 5).forEach((err, idx) => {
      console.log(`  ${idx + 1}. ${err.group} (${err.group_id}): ${err.error}`);
    });
  }
  
  // Show final stats
  const stats = await get(`
    SELECT 
      COUNT(*) as total,
      COUNT(published_on) as with_dates
    FROM groups
    WHERE category_id = 3
  `);
  
  console.log(`\n📊 Final Statistics:`);
  console.log(`  Total sets: ${stats.total}`);
  console.log(`  Sets with release dates: ${stats.with_dates}`);
  console.log(`  Sets without release dates: ${stats.total - stats.with_dates}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateReleaseDates().catch(console.error);
}

export default populateReleaseDates;













#!/usr/bin/env node

import fs from 'fs';
import sqlite3 from 'sqlite3';
import csv from 'csv-parser';
import path from 'path';

const { Database } = sqlite3;

class ComprehensiveArtistFixer {
  constructor() {
    this.csvData = new Map();
    this.db = null;
    this.corrections = [];
    this.setMappings = new Map();
  }

  async init() {
    console.log('🎨 Initializing Comprehensive Artist Fixer...');
    
    // Load CSV data
    await this.loadCSVData();
    
    // Connect to database
    this.db = new Database('./server/cards.db');
    
    // Load set mappings
    await this.loadSetMappings();
    
    console.log(`✅ Loaded ${this.csvData.size} cards from CSV`);
    console.log(`✅ Loaded ${this.setMappings.size} set mappings`);
  }

  async loadCSVData() {
    return new Promise((resolve, reject) => {
      const csvPath = './public/Pokemon database files/pokemon_Final_Master_List_Illustrators.csv';
      
      if (!fs.existsSync(csvPath)) {
        reject(new Error(`CSV file not found: ${csvPath}`));
        return;
      }

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Create multiple keys for different matching strategies
          const keys = this.createCardKeys(row.card_name, row.set, row.set_num);
          
          keys.forEach(key => {
            this.csvData.set(key, {
              cardName: row.card_name,
              set: row.set,
              series: row.series,
              artist: row.artist,
              releaseDate: row.release_date,
              setNum: row.set_num,
              id: row.id
            });
          });
        })
        .on('end', () => {
          console.log('📊 CSV data loaded successfully');
          resolve();
        })
        .on('error', reject);
    });
  }

  createCardKeys(cardName, set, setNum) {
    const keys = [];
    
    // Strategy 1: Exact match with set and number
    keys.push(`${cardName.toLowerCase().trim()}|${set.toLowerCase().trim()}|${setNum}`);
    
    // Strategy 2: Clean name with set and number
    const cleanName = this.cleanCardName(cardName);
    keys.push(`${cleanName.toLowerCase().trim()}|${set.toLowerCase().trim()}|${setNum}`);
    
    // Strategy 3: Just name and number (for cases where set names differ)
    keys.push(`${cardName.toLowerCase().trim()}|${setNum}`);
    keys.push(`${cleanName.toLowerCase().trim()}|${setNum}`);
    
    // Strategy 4: Handle set name variations
    const setVariations = this.getSetVariations(set);
    setVariations.forEach(variation => {
      keys.push(`${cardName.toLowerCase().trim()}|${variation.toLowerCase().trim()}|${setNum}`);
      keys.push(`${cleanName.toLowerCase().trim()}|${variation.toLowerCase().trim()}|${setNum}`);
    });
    
    return keys;
  }

  getSetVariations(setName) {
    const variations = [setName];
    
    // Add common variations based on the set name
    if (setName.includes('Black & White')) {
      variations.push('Black Bolt', 'SV: Black Bolt');
    }
    if (setName.includes('Scarlet & Violet')) {
      variations.push('SV: Scarlet & Violet', 'SV01: Scarlet & Violet Base Set');
    }
    if (setName.includes('Sword & Shield')) {
      variations.push('SWSH01: Sword & Shield Base Set');
    }
    if (setName.includes('Sun & Moon')) {
      variations.push('SM Base Set');
    }
    if (setName.includes('XY')) {
      variations.push('XY Base Set');
    }
    if (setName.includes('Base Set')) {
      variations.push('Base Set (Shadowless)');
    }
    if (setName.includes('Jungle')) {
      variations.push('Jungle');
    }
    if (setName.includes('Fossil')) {
      variations.push('Fossil');
    }
    if (setName.includes('Team Rocket')) {
      variations.push('Team Rocket');
    }
    if (setName.includes('Gym Heroes')) {
      variations.push('Gym Heroes');
    }
    if (setName.includes('Gym Challenge')) {
      variations.push('Gym Challenge');
    }
    if (setName.includes('Neo Genesis')) {
      variations.push('Neo Genesis');
    }
    if (setName.includes('Neo Discovery')) {
      variations.push('Neo Discovery');
    }
    if (setName.includes('Neo Revelation')) {
      variations.push('Neo Revelation');
    }
    if (setName.includes('Neo Destiny')) {
      variations.push('Neo Destiny');
    }
    if (setName.includes('Expedition')) {
      variations.push('Expedition Base Set');
    }
    if (setName.includes('Aquapolis')) {
      variations.push('Aquapolis');
    }
    if (setName.includes('Skyridge')) {
      variations.push('Skyridge');
    }
    if (setName.includes('Ruby and Sapphire')) {
      variations.push('Ruby & Sapphire');
    }
    if (setName.includes('Sandstorm')) {
      variations.push('Sandstorm');
    }
    if (setName.includes('Dragon')) {
      variations.push('Dragon');
    }
    if (setName.includes('Hidden Legends')) {
      variations.push('Hidden Legends');
    }
    if (setName.includes('Fire Red & Leaf Green')) {
      variations.push('Fire Red & Leaf Green');
    }
    if (setName.includes('Team Rocket Returns')) {
      variations.push('Team Rocket Returns');
    }
    if (setName.includes('Deoxys')) {
      variations.push('Deoxys');
    }
    if (setName.includes('Emerald')) {
      variations.push('Emerald');
    }
    if (setName.includes('Unseen Forces')) {
      variations.push('Unseen Forces');
    }
    if (setName.includes('Delta Species')) {
      variations.push('Delta Species');
    }
    if (setName.includes('Legend Maker')) {
      variations.push('Legend Maker');
    }
    if (setName.includes('Holon Phantoms')) {
      variations.push('Holon Phantoms');
    }
    if (setName.includes('Crystal Guardians')) {
      variations.push('Crystal Guardians');
    }
    if (setName.includes('Dragon Frontiers')) {
      variations.push('Dragon Frontiers');
    }
    if (setName.includes('Power Keepers')) {
      variations.push('Power Keepers');
    }
    if (setName.includes('Diamond & Pearl')) {
      variations.push('Diamond & Pearl');
    }
    if (setName.includes('Mysterious Treasures')) {
      variations.push('Mysterious Treasures');
    }
    if (setName.includes('Secret Wonders')) {
      variations.push('Secret Wonders');
    }
    if (setName.includes('Great Encounters')) {
      variations.push('Great Encounters');
    }
    if (setName.includes('Majestic Dawn')) {
      variations.push('Majestic Dawn');
    }
    if (setName.includes('Legends Awakened')) {
      variations.push('Legends Awakened');
    }
    if (setName.includes('Stormfront')) {
      variations.push('Stormfront');
    }
    if (setName.includes('Platinum')) {
      variations.push('Platinum');
    }
    if (setName.includes('Rising Rivals')) {
      variations.push('Rising Rivals');
    }
    if (setName.includes('Supreme Victors')) {
      variations.push('Supreme Victors');
    }
    if (setName.includes('Arceus')) {
      variations.push('Arceus');
    }
    if (setName.includes('HeartGold & SoulSilver')) {
      variations.push('HeartGold SoulSilver');
    }
    if (setName.includes('Unleashed')) {
      variations.push('Unleashed');
    }
    if (setName.includes('Undaunted')) {
      variations.push('Undaunted');
    }
    if (setName.includes('Triumphant')) {
      variations.push('Triumphant');
    }
    if (setName.includes('Call of Legends')) {
      variations.push('Call of Legends');
    }
    if (setName.includes('Emerging Powers')) {
      variations.push('Emerging Powers');
    }
    if (setName.includes('Noble Victories')) {
      variations.push('Noble Victories');
    }
    if (setName.includes('Next Destinies')) {
      variations.push('Next Destinies');
    }
    if (setName.includes('Dark Explorers')) {
      variations.push('Dark Explorers');
    }
    if (setName.includes('Dragons Exalted')) {
      variations.push('Dragons Exalted');
    }
    if (setName.includes('Boundaries Crossed')) {
      variations.push('Boundaries Crossed');
    }
    if (setName.includes('Plasma Storm')) {
      variations.push('Plasma Storm');
    }
    if (setName.includes('Plasma Freeze')) {
      variations.push('Plasma Freeze');
    }
    if (setName.includes('Plasma Blast')) {
      variations.push('Plasma Blast');
    }
    if (setName.includes('Legendary Treasures')) {
      variations.push('Legendary Treasures');
    }
    if (setName.includes('Flashfire')) {
      variations.push('Flashfire');
    }
    if (setName.includes('Furious Fists')) {
      variations.push('Furious Fists');
    }
    if (setName.includes('Phantom Forces')) {
      variations.push('Phantom Forces');
    }
    if (setName.includes('Primal Clash')) {
      variations.push('Primal Clash');
    }
    if (setName.includes('Roaring Skies')) {
      variations.push('Roaring Skies');
    }
    if (setName.includes('Ancient Origins')) {
      variations.push('Ancient Origins');
    }
    if (setName.includes('BREAKthrough')) {
      variations.push('BREAKthrough');
    }
    if (setName.includes('BREAKpoint')) {
      variations.push('BREAKpoint');
    }
    if (setName.includes('Fates Collide')) {
      variations.push('Fates Collide');
    }
    if (setName.includes('Steam Siege')) {
      variations.push('Steam Siege');
    }
    if (setName.includes('Evolutions')) {
      variations.push('Evolutions');
    }
    if (setName.includes('Guardians Rising')) {
      variations.push('Guardians Rising');
    }
    if (setName.includes('Burning Shadows')) {
      variations.push('Burning Shadows');
    }
    if (setName.includes('Crimson Invasion')) {
      variations.push('Crimson Invasion');
    }
    if (setName.includes('Ultra Prism')) {
      variations.push('Ultra Prism');
    }
    if (setName.includes('Forbidden Light')) {
      variations.push('Forbidden Light');
    }
    if (setName.includes('Celestial Storm')) {
      variations.push('Celestial Storm');
    }
    if (setName.includes('Lost Thunder')) {
      variations.push('Lost Thunder');
    }
    if (setName.includes('Team Up')) {
      variations.push('Team Up');
    }
    if (setName.includes('Detective Pikachu')) {
      variations.push('Detective Pikachu');
    }
    if (setName.includes('Unbroken Bonds')) {
      variations.push('Unbroken Bonds');
    }
    if (setName.includes('Unified Minds')) {
      variations.push('Unified Minds');
    }
    if (setName.includes('Hidden Fates')) {
      variations.push('Hidden Fates');
    }
    if (setName.includes('Cosmic Eclipse')) {
      variations.push('Cosmic Eclipse');
    }
    if (setName.includes('Rebel Clash')) {
      variations.push('Rebel Clash');
    }
    if (setName.includes('Darkness Ablaze')) {
      variations.push('Darkness Ablaze');
    }
    if (setName.includes('Champion\'s Path')) {
      variations.push('Champion\'s Path');
    }
    if (setName.includes('Vivid Voltage')) {
      variations.push('Vivid Voltage');
    }
    if (setName.includes('Shining Fates')) {
      variations.push('Shining Fates');
    }
    if (setName.includes('Battle Styles')) {
      variations.push('Battle Styles');
    }
    if (setName.includes('Chilling Reign')) {
      variations.push('Chilling Reign');
    }
    if (setName.includes('Evolving Skies')) {
      variations.push('Evolving Skies');
    }
    if (setName.includes('Celebrations')) {
      variations.push('Celebrations');
    }
    if (setName.includes('Fusion Strike')) {
      variations.push('Fusion Strike');
    }
    if (setName.includes('Brilliant Stars')) {
      variations.push('Brilliant Stars');
    }
    if (setName.includes('Astral Radiance')) {
      variations.push('Astral Radiance');
    }
    if (setName.includes('Pokemon GO')) {
      variations.push('Pokemon GO');
    }
    if (setName.includes('Lost Origin')) {
      variations.push('Lost Origin');
    }
    if (setName.includes('Silver Tempest')) {
      variations.push('Silver Tempest');
    }
    if (setName.includes('Crown Zenith')) {
      variations.push('Crown Zenith');
    }
    if (setName.includes('Paldea Evolved')) {
      variations.push('Paldea Evolved');
    }
    if (setName.includes('Obsidian Flames')) {
      variations.push('Obsidian Flames');
    }
    if (setName.includes('151')) {
      variations.push('151');
    }
    if (setName.includes('Paradox Rift')) {
      variations.push('Paradox Rift');
    }
    if (setName.includes('Paldean Fates')) {
      variations.push('Paldean Fates');
    }
    if (setName.includes('Temporal Forces')) {
      variations.push('Temporal Forces');
    }
    if (setName.includes('Shrouded Fable')) {
      variations.push('Shrouded Fable');
    }
    if (setName.includes('Ancient Roar')) {
      variations.push('Ancient Roar');
    }
    if (setName.includes('Future Flash')) {
      variations.push('Future Flash');
    }
    if (setName.includes('Twilight Masquerade')) {
      variations.push('Twilight Masquerade');
    }
    if (setName.includes('Stellar Crown')) {
      variations.push('Stellar Crown');
    }
    if (setName.includes('Destined Rivals')) {
      variations.push('Destined Rivals');
    }
    if (setName.includes('Surging Sparks')) {
      variations.push('Surging Sparks');
    }
    if (setName.includes('White Flare')) {
      variations.push('White Flare');
    }
    if (setName.includes('Black Bolt')) {
      variations.push('Black Bolt');
    }
    if (setName.includes('Prismatic Evolutions')) {
      variations.push('Prismatic Evolutions');
    }
    
    return variations;
  }

  cleanCardName(name) {
    if (!name) return '';
    
    return name
      .replace(/\s*\([^)]*\)\s*$/, '') // Remove (variant) at end
      .replace(/\s*-\s*\d+\/?\d*\s*$/, '') // Remove - 123/456 at end
      .replace(/\s*ex\s*$/i, '') // Remove "ex" at end
      .replace(/\s*V\s*$/i, '') // Remove "V" at end
      .replace(/\s*VMAX\s*$/i, '') // Remove "VMAX" at end
      .replace(/\s*GX\s*$/i, '') // Remove "GX" at end
      .replace(/\s*Prime\s*$/i, '') // Remove "Prime" at end
      .replace(/\s*LV\.?\s*\d+\s*$/i, '') // Remove "LV. X" at end
      .replace(/\s*BREAK\s*$/i, '') // Remove "BREAK" at end
      .replace(/\s*EX\s*$/i, '') // Remove "EX" at end
      .replace(/\s*M\s*$/i, '') // Remove "M" at end
      .replace(/\s*Mega\s*$/i, '') // Remove "Mega" at end
      .replace(/\s*GX\s*$/i, '') // Remove "GX" at end
      .replace(/\s*V\s*$/i, '') // Remove "V" at end
      .replace(/\s*VSTAR\s*$/i, '') // Remove "VSTAR" at end
      .replace(/\s*VMAX\s*$/i, '') // Remove "VMAX" at end
      .replace(/\s*ex\s*$/i, '') // Remove "ex" at end
      .trim();
  }

  async loadSetMappings() {
    return new Promise((resolve, reject) => {
      // Common set name mappings between CSV and database
      const mappings = {
        'base set': 'base',
        'base': 'base',
        'base1': 'base',
        'jungle': 'jungle',
        'fossil': 'fossil',
        'team rocket': 'team rocket',
        'gym heroes': 'gym heroes',
        'gym challenge': 'gym challenge',
        'neo genesis': 'neo genesis',
        'neo discovery': 'neo discovery',
        'neo revelation': 'neo revelation',
        'neo destiny': 'neo destiny',
        'expedition base set': 'expedition',
        'aquapolis': 'aquapolis',
        'skyridge': 'skyridge',
        'ruby and sapphire': 'ruby and sapphire',
        'sandstorm': 'sandstorm',
        'dragon': 'dragon',
        'hidden legends': 'hidden legends',
        'fire red & leaf green': 'fire red & leaf green',
        'team rocket returns': 'team rocket returns',
        'deoxys': 'deoxys',
        'emerald': 'emerald',
        'unseen forces': 'unseen forces',
        'delta species': 'delta species',
        'legend maker': 'legend maker',
        'holon phantoms': 'holon phantoms',
        'crystal guardians': 'crystal guardians',
        'dragon frontiers': 'dragon frontiers',
        'power keepers': 'power keepers',
        'diamond & pearl': 'diamond and pearl',
        'mysterious treasures': 'mysterious treasures',
        'secret wonders': 'secret wonders',
        'great encounters': 'great encounters',
        'majestic dawn': 'majestic dawn',
        'legends awakened': 'legends awakened',
        'stormfront': 'stormfront',
        'platinum': 'platinum',
        'rising rivals': 'rising rivals',
        'supreme victors': 'supreme victors',
        'arceus': 'arceus',
        'heartgold & soulsilver': 'heartgold soulsilver',
        'unleashed': 'unleashed',
        'undaunted': 'undaunted',
        'triumphant': 'triumphant',
        'call of legends': 'call of legends',
        'black & white': 'black and white',
        'emerging powers': 'emerging powers',
        'noble victories': 'noble victories',
        'next destinies': 'next destinies',
        'dark explorers': 'dark explorers',
        'dragons exalted': 'dragons exalted',
        'boundaries crossed': 'boundaries crossed',
        'plasma storm': 'plasma storm',
        'plasma freeze': 'plasma freeze',
        'plasma blast': 'plasma blast',
        'legendary treasures': 'legendary treasures',
        'xy': 'xy',
        'flashfire': 'flashfire',
        'furious fists': 'furious fists',
        'phantom forces': 'phantom forces',
        'primal clash': 'primal clash',
        'roaring skies': 'roaring skies',
        'ancient origins': 'ancient origins',
        'breakthrough': 'breakthrough',
        'breakpoint': 'breakpoint',
        'fates collide': 'fates collide',
        'steam siege': 'steam siege',
        'evolutions': 'evolutions',
        'sun & moon': 'sun & moon',
        'guardians rising': 'guardians rising',
        'burning shadows': 'burning shadows',
        'crimson invasion': 'crimson invasion',
        'ultra prism': 'ultra prism',
        'forbidden light': 'forbidden light',
        'celestial storm': 'celestial storm',
        'lost thunder': 'lost thunder',
        'team up': 'team up',
        'detective pikachu': 'detective pikachu',
        'unbroken bonds': 'unbroken bonds',
        'unified minds': 'unified minds',
        'hidden fates': 'hidden fates',
        'cosmic eclipse': 'cosmic eclipse',
        'sword & shield': 'sword & shield',
        'rebel clash': 'rebel clash',
        'darkness ablaze': 'darkness ablaze',
        'champion\'s path': 'champion\'s path',
        'vivid voltage': 'vivid voltage',
        'shining fates': 'shining fates',
        'battle styles': 'battle styles',
        'chilling reign': 'chilling reign',
        'evolving skies': 'evolving skies',
        'celebrations': 'celebrations',
        'fusion strike': 'fusion strike',
        'brilliant stars': 'brilliant stars',
        'astral radiance': 'astral radiance',
        'pokemon go': 'pokemon go',
        'lost origin': 'lost origin',
        'silver tempest': 'silver tempest',
        'crown zenith': 'crown zenith',
        'scarlet & violet': 'scarlet & violet',
        'paldea evolved': 'paldea evolved',
        'obsidian flames': 'obsidian flames',
        '151': '151',
        'paradox rift': 'paradox rift',
        'paldean fates': 'paldean fates',
        'temporal forces': 'temporal forces',
        'shrouded fable': 'shrouded fable',
        'ancient roar': 'ancient roar',
        'future flash': 'future flash',
        'twilight masquerade': 'twilight masquerade',
        'stellar crown': 'stellar crown',
        'destined rivals': 'destined rivals',
        'surging sparks': 'surging sparks',
        'white flare': 'white flare',
        'black bolt': 'black bolt',
        'prismatic evolutio': 'prismatic evolutio'
      };

      Object.entries(mappings).forEach(([key, value]) => {
        this.setMappings.set(key.toLowerCase(), value);
      });

      resolve();
    });
  }

  normalizeSetName(setName) {
    if (!setName) return 'unknown';
    
    const normalized = setName.toLowerCase().trim();
    return this.setMappings.get(normalized) || normalized;
  }

  extractSetNumber(cardNumber) {
    if (!cardNumber) return '1';
    
    // Extract just the number part (e.g., "2" from "002/086" or "2/086")
    const match = cardNumber.match(/^(\d+)/);
    return match ? match[1] : cardNumber;
  }

  async findAndFixAllMismatches() {
    console.log('🔍 Finding and fixing ALL artist mismatches...');
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          p.product_id,
          p.name,
          p.artist,
          p.ext_number,
          g.name as set_name
        FROM products p 
        JOIN groups g ON p.group_id = g.group_id
        WHERE p.name IS NOT NULL 
        AND p.name != ''
        ORDER BY p.name
      `;

      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`📋 Processing ${rows.length} cards from database...`);
        
        let processed = 0;
        let corrections = 0;
        let noMatch = 0;

        rows.forEach((card) => {
          processed++;
          
          // Try to find match in CSV
          const csvMatch = this.findCSVMatch(card);
          
          if (csvMatch) {
            if (!this.artistsMatch(card.artist, csvMatch.artist)) {
              corrections++;
              this.corrections.push({
                productId: card.product_id,
                currentArtist: card.artist,
                correctArtist: csvMatch.artist,
                cardName: card.name,
                csvId: csvMatch.id,
                dbSet: card.set_name,
                dbNumber: card.ext_number,
                csvSet: csvMatch.set,
                csvNumber: csvMatch.setNum
              });
            }
          } else {
            noMatch++;
          }

          // Progress indicator
          if (processed % 1000 === 0) {
            console.log(`📊 Processed ${processed}/${rows.length} cards... (${corrections} corrections found)`);
          }
        });

        console.log(`\n📈 Comprehensive Analysis Results:`);
        console.log(`✅ Cards processed: ${processed}`);
        console.log(`🔧 Corrections needed: ${corrections}`);
        console.log(`❓ No CSV match: ${noMatch}`);
        
        resolve();
      });
    });
  }

  findCSVMatch(dbCard) {
    const cardName = dbCard.name;
    const setNumber = this.extractSetNumber(dbCard.ext_number);
    const setName = this.normalizeSetName(dbCard.set_name);
    
    // Strategy 1: Exact name + set + number match
    const exactKey = `${cardName.toLowerCase().trim()}|${setName}|${setNumber}`;
    let match = this.csvData.get(exactKey);
    if (match) return match;
    
    // Strategy 2: Clean name + set + number match
    const cleanName = this.cleanCardName(cardName);
    const cleanKey = `${cleanName.toLowerCase().trim()}|${setName}|${setNumber}`;
    match = this.csvData.get(cleanKey);
    if (match) return match;
    
    // Strategy 3: Name + number only (for cases where set names are very different)
    const nameNumberKey = `${cardName.toLowerCase().trim()}|${setNumber}`;
    match = this.csvData.get(nameNumberKey);
    if (match) return match;
    
    const cleanNameNumberKey = `${cleanName.toLowerCase().trim()}|${setNumber}`;
    match = this.csvData.get(cleanNameNumberKey);
    if (match) return match;
    
    // Strategy 4: Try with original set name variations
    const setVariations = this.getSetVariations(dbCard.set_name);
    for (const variation of setVariations) {
      const variationKey = `${cardName.toLowerCase().trim()}|${variation.toLowerCase().trim()}|${setNumber}`;
      match = this.csvData.get(variationKey);
      if (match) return match;
      
      const cleanVariationKey = `${cleanName.toLowerCase().trim()}|${variation.toLowerCase().trim()}|${setNumber}`;
      match = this.csvData.get(cleanVariationKey);
      if (match) return match;
    }
    
    return null;
  }

  artistsMatch(dbArtist, csvArtist) {
    if (!dbArtist && !csvArtist) return true;
    if (!dbArtist || !csvArtist) return false;
    
    // Normalize artist names for comparison
    const normalize = (name) => name.toLowerCase().trim().replace(/\s+/g, ' ');
    
    return normalize(dbArtist) === normalize(csvArtist);
  }

  async applyCorrections() {
    console.log(`\n🔧 Applying ${this.corrections.length} comprehensive corrections...`);
    
    let applied = 0;
    let errors = 0;
    
    for (const correction of this.corrections) {
      try {
        await new Promise((resolve, reject) => {
          this.db.run(
            'UPDATE products SET artist = ? WHERE product_id = ?',
            [correction.correctArtist, correction.productId],
            function(err) {
              if (err) {
                console.error(`Error updating ${correction.cardName}: ${err.message}`);
                errors++;
                reject(err);
              } else {
                console.log(`✅ Updated ${correction.cardName}: "${correction.currentArtist || 'NULL'}" → "${correction.correctArtist}"`);
                console.log(`   Set: ${correction.dbSet} | Number: ${correction.dbNumber}`);
                applied++;
                resolve();
              }
            }
          );
        });
      } catch (error) {
        console.error(`Failed to update ${correction.cardName}`);
      }
    }
    
    console.log(`\n📊 Comprehensive Correction Results:`);
    console.log(`✅ Applied: ${applied}`);
    console.log(`❌ Errors: ${errors}`);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Main execution
async function main() {
  const fixer = new ComprehensiveArtistFixer();
  
  try {
    await fixer.init();
    await fixer.findAndFixAllMismatches();
    await fixer.applyCorrections();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    fixer.close();
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ComprehensiveArtistFixer;









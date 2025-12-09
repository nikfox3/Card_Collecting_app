#!/usr/bin/env node

import fs from 'fs';
import sqlite3 from 'sqlite3';
import csv from 'csv-parser';
import path from 'path';

const { Database } = sqlite3;

class FinalArtistFixer {
  constructor() {
    this.csvData = new Map();
    this.db = null;
    this.corrections = [];
  }

  async init() {
    console.log('🎨 Initializing Final Artist Fixer...');
    
    // Load CSV data
    await this.loadCSVData();
    
    // Connect to database
    this.db = new Database('./server/cards.db');
    
    console.log(`✅ Loaded ${this.csvData.size} cards from CSV`);
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
    
    // Strategy 3: Just name and number (for cases where set names are very different)
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
    
    // Add comprehensive set name variations
    const setMappings = {
      'black bolt': ['sv: black bolt', 'black bolt'],
      'scarlet & violet': ['sv: scarlet & violet', 'sv01: scarlet & violet base set', 'scarlet & violet'],
      'sword & shield': ['swsh01: sword & shield base set', 'sword & shield'],
      'sun & moon': ['sm base set', 'sun & moon'],
      'xy': ['xy base set', 'xy'],
      'base set': ['base set (shadowless)', 'base set'],
      'jungle': ['jungle'],
      'fossil': ['fossil'],
      'team rocket': ['team rocket'],
      'gym heroes': ['gym heroes'],
      'gym challenge': ['gym challenge'],
      'neo genesis': ['neo genesis'],
      'neo discovery': ['neo discovery'],
      'neo revelation': ['neo revelation'],
      'neo destiny': ['neo destiny'],
      'expedition base set': ['expedition'],
      'aquapolis': ['aquapolis'],
      'skyridge': ['skyridge'],
      'ruby and sapphire': ['ruby & sapphire'],
      'sandstorm': ['sandstorm'],
      'dragon': ['dragon'],
      'hidden legends': ['hidden legends'],
      'fire red & leaf green': ['fire red & leaf green'],
      'team rocket returns': ['team rocket returns'],
      'deoxys': ['deoxys'],
      'emerald': ['emerald'],
      'unseen forces': ['unseen forces'],
      'delta species': ['delta species'],
      'legend maker': ['legend maker'],
      'holon phantoms': ['holon phantoms'],
      'crystal guardians': ['crystal guardians'],
      'dragon frontiers': ['dragon frontiers'],
      'power keepers': ['power keepers'],
      'diamond & pearl': ['diamond and pearl'],
      'mysterious treasures': ['mysterious treasures'],
      'secret wonders': ['secret wonders'],
      'great encounters': ['great encounters'],
      'majestic dawn': ['majestic dawn'],
      'legends awakened': ['legends awakened'],
      'stormfront': ['stormfront'],
      'platinum': ['platinum'],
      'rising rivals': ['rising rivals'],
      'supreme victors': ['supreme victors'],
      'arceus': ['arceus'],
      'heartgold & soulsilver': ['heartgold soulsilver'],
      'unleashed': ['unleashed'],
      'undaunted': ['undaunted'],
      'triumphant': ['triumphant'],
      'call of legends': ['call of legends'],
      'black & white': ['black and white'],
      'emerging powers': ['emerging powers'],
      'noble victories': ['noble victories'],
      'next destinies': ['next destinies'],
      'dark explorers': ['dark explorers'],
      'dragons exalted': ['dragons exalted'],
      'boundaries crossed': ['boundaries crossed'],
      'plasma storm': ['plasma storm'],
      'plasma freeze': ['plasma freeze'],
      'plasma blast': ['plasma blast'],
      'legendary treasures': ['legendary treasures'],
      'flashfire': ['flashfire'],
      'furious fists': ['furious fists'],
      'phantom forces': ['phantom forces'],
      'primal clash': ['primal clash'],
      'roaring skies': ['roaring skies'],
      'ancient origins': ['ancient origins'],
      'breakthrough': ['breakthrough'],
      'breakpoint': ['breakpoint'],
      'fates collide': ['fates collide'],
      'steam siege': ['steam siege'],
      'evolutions': ['evolutions'],
      'guardians rising': ['guardians rising'],
      'burning shadows': ['burning shadows'],
      'crimson invasion': ['crimson invasion'],
      'ultra prism': ['ultra prism'],
      'forbidden light': ['forbidden light'],
      'celestial storm': ['celestial storm'],
      'lost thunder': ['lost thunder'],
      'team up': ['team up'],
      'detective pikachu': ['detective pikachu'],
      'unbroken bonds': ['unbroken bonds'],
      'unified minds': ['unified minds'],
      'hidden fates': ['hidden fates'],
      'cosmic eclipse': ['cosmic eclipse'],
      'rebel clash': ['rebel clash'],
      'darkness ablaze': ['darkness ablaze'],
      'champion\'s path': ['champion\'s path'],
      'vivid voltage': ['vivid voltage'],
      'shining fates': ['shining fates'],
      'battle styles': ['battle styles'],
      'chilling reign': ['chilling reign'],
      'evolving skies': ['evolving skies'],
      'celebrations': ['celebrations'],
      'fusion strike': ['fusion strike'],
      'brilliant stars': ['brilliant stars'],
      'astral radiance': ['astral radiance'],
      'pokemon go': ['pokemon go'],
      'lost origin': ['lost origin'],
      'silver tempest': ['silver tempest'],
      'crown zenith': ['crown zenith'],
      'paldea evolved': ['paldea evolved'],
      'obsidian flames': ['obsidian flames'],
      '151': ['151'],
      'paradox rift': ['paradox rift'],
      'paldean fates': ['paldean fates'],
      'temporal forces': ['temporal forces'],
      'shrouded fable': ['shrouded fable'],
      'ancient roar': ['ancient roar'],
      'future flash': ['future flash'],
      'twilight masquerade': ['twilight masquerade'],
      'stellar crown': ['stellar crown'],
      'destined rivals': ['destined rivals'],
      'surging sparks': ['surging sparks'],
      'white flare': ['white flare'],
      'prismatic evolutio': ['prismatic evolutio']
    };
    
    const normalizedSetName = setName.toLowerCase().trim();
    return setMappings[normalizedSetName] || [setName];
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
      .replace(/\s*VSTAR\s*$/i, '') // Remove "VSTAR" at end
      .trim();
  }

  async findAndFixAllMismatches() {
    console.log('🔍 Finding and fixing ALL remaining artist mismatches...');
    
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

        console.log(`\n📈 Final Analysis Results:`);
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

  normalizeSetName(setName) {
    if (!setName) return 'unknown';
    
    // Handle common set name variations
    const variations = {
      'sv: black bolt': 'black bolt',
      'sv: scarlet & violet': 'scarlet & violet',
      'sv01: scarlet & violet base set': 'scarlet & violet',
      'swsh01: sword & shield base set': 'sword & shield',
      'sm base set': 'sun & moon',
      'xy base set': 'xy',
      'base set (shadowless)': 'base set'
    };
    
    const normalized = setName.toLowerCase().trim();
    return variations[normalized] || normalized;
  }

  extractSetNumber(cardNumber) {
    if (!cardNumber) return '1';
    
    // Extract just the number part (e.g., "3" from "003/086" or "3/086")
    const match = cardNumber.match(/^(\d+)/);
    return match ? match[1] : cardNumber;
  }

  artistsMatch(dbArtist, csvArtist) {
    if (!dbArtist && !csvArtist) return true;
    if (!dbArtist || !csvArtist) return false;
    
    // Normalize artist names for comparison
    const normalize = (name) => name.toLowerCase().trim().replace(/\s+/g, ' ');
    
    return normalize(dbArtist) === normalize(csvArtist);
  }

  async applyCorrections() {
    console.log(`\n🔧 Applying ${this.corrections.length} final corrections...`);
    
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
    
    console.log(`\n📊 Final Correction Results:`);
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
  const fixer = new FinalArtistFixer();
  
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

export default FinalArtistFixer;

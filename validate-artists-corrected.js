#!/usr/bin/env node

import fs from 'fs';
import sqlite3 from 'sqlite3';
import csv from 'csv-parser';
import path from 'path';

const { Database } = sqlite3;

class CorrectedArtistValidator {
  constructor() {
    this.csvData = new Map();
    this.db = null;
    this.mismatches = [];
    this.missingArtists = [];
    this.exactMatches = 0;
    this.setMappings = new Map();
  }

  async init() {
    console.log('🎨 Initializing Corrected Artist Validator...');
    
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
    
    return keys;
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
        'ex ruby & sapphire': 'ex ruby & sapphire',
        'ex sandstorm': 'ex sandstorm',
        'ex dragon': 'ex dragon',
        'ex team magma vs team aqua': 'ex team magma vs team aqua',
        'ex hidden legends': 'ex hidden legends',
        'ex fire red & leaf green': 'ex fire red & leaf green',
        'ex team rocket returns': 'ex team rocket returns',
        'ex deoxys': 'ex deoxys',
        'ex emerald': 'ex emerald',
        'ex unseen forces': 'ex unseen forces',
        'ex delta species': 'ex delta species',
        'ex legend maker': 'ex legend maker',
        'ex holon phantoms': 'ex holon phantoms',
        'ex crystal guardians': 'ex crystal guardians',
        'ex dragon frontiers': 'ex dragon frontiers',
        'ex power keepers': 'ex power keepers',
        'diamond & pearl': 'diamond & pearl',
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
        'heartgold soulsilver': 'heartgold soulsilver',
        'unleashed': 'unleashed',
        'undauted': 'undauted',
        'triumphant': 'triumphant',
        'call of legends': 'call of legends',
        'black & white': 'black & white',
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
        'future flash': 'future flash'
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
    
    // Extract just the number part (e.g., "43" from "043/102" or "43/102")
    const match = cardNumber.match(/^(\d+)/);
    return match ? match[1] : cardNumber;
  }

  async validateArtists() {
    console.log('🔍 Starting corrected artist validation...');
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          p.product_id,
          p.name,
          p.artist,
          p.sub_type_name,
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

        console.log(`📋 Validating ${rows.length} cards from database...`);
        
        let processed = 0;
        let exactMatches = 0;
        let mismatches = 0;
        let noMatches = 0;

        rows.forEach((card) => {
          processed++;
          
          // Try to find exact match in CSV
          const csvMatch = this.findExactCSVMatch(card);
          
          if (csvMatch) {
            if (this.artistsMatch(card.artist, csvMatch.artist)) {
              exactMatches++;
            } else {
              mismatches++;
              this.mismatches.push({
                dbCard: card,
                csvCard: csvMatch,
                issue: 'artist_mismatch',
                confidence: 'high'
              });
            }
          } else {
            noMatches++;
            this.missingArtists.push({
              dbCard: card,
              issue: 'no_exact_csv_match'
            });
          }

          // Progress indicator
          if (processed % 1000 === 0) {
            console.log(`📊 Processed ${processed}/${rows.length} cards...`);
          }
        });

        console.log(`\n📈 Corrected Validation Results:`);
        console.log(`✅ Exact Matches: ${exactMatches}`);
        console.log(`❌ Mismatches: ${mismatches}`);
        console.log(`❓ No Match: ${noMatches}`);
        
        resolve();
      });
    });
  }

  findExactCSVMatch(dbCard) {
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
    
    return null;
  }

  artistsMatch(dbArtist, csvArtist) {
    if (!dbArtist && !csvArtist) return true;
    if (!dbArtist || !csvArtist) return false;
    
    // Normalize artist names for comparison
    const normalize = (name) => name.toLowerCase().trim().replace(/\s+/g, ' ');
    
    return normalize(dbArtist) === normalize(csvArtist);
  }

  generateReport() {
    console.log('\n📊 CORRECTED VALIDATION REPORT');
    console.log('='.repeat(50));
    
    if (this.mismatches.length > 0) {
      console.log(`\n❌ ARTIST MISMATCHES (${this.mismatches.length}):`);
      console.log('-'.repeat(30));
      
      this.mismatches.slice(0, 20).forEach((mismatch, index) => {
        console.log(`\n${index + 1}. ${mismatch.dbCard.name}`);
        console.log(`   Database Artist: "${mismatch.dbCard.artist || 'NULL'}"`);
        console.log(`   CSV Artist: "${mismatch.csvCard.artist || 'NULL'}"`);
        console.log(`   Set: ${mismatch.csvCard.set} | Number: ${mismatch.csvCard.setNum}`);
        console.log(`   Database Set: ${mismatch.dbCard.set_name} | Number: ${mismatch.dbCard.ext_number}`);
        console.log(`   CSV ID: ${mismatch.csvCard.id}`);
        console.log(`   Confidence: ${mismatch.confidence}`);
      });
      
      if (this.mismatches.length > 20) {
        console.log(`\n... and ${this.mismatches.length - 20} more mismatches`);
      }
    }
    
    if (this.missingArtists.length > 0) {
      console.log(`\n❓ CARDS WITHOUT EXACT CSV MATCH (${this.missingArtists.length}):`);
      console.log('-'.repeat(30));
      
      this.missingArtists.slice(0, 10).forEach((missing, index) => {
        console.log(`\n${index + 1}. ${missing.dbCard.name}`);
        console.log(`   Database Artist: "${missing.dbCard.artist || 'NULL'}"`);
        console.log(`   Set: ${missing.dbCard.set_name || 'Unknown'}`);
        console.log(`   Number: ${missing.dbCard.ext_number || 'Unknown'}`);
      });
      
      if (this.missingArtists.length > 10) {
        console.log(`\n... and ${this.missingArtists.length - 10} more cards without matches`);
      }
    }
  }

  async generateCorrectionScript() {
    console.log('\n🔧 Generating corrected artist correction script...');
    
    // Only include high-confidence corrections
    const corrections = this.mismatches
      .filter(m => m.confidence === 'high' && m.csvCard.artist && m.csvCard.artist.trim() !== '')
      .map(m => ({
        productId: m.dbCard.product_id,
        currentArtist: m.dbCard.artist,
        correctArtist: m.csvCard.artist,
        cardName: m.dbCard.name,
        csvId: m.csvCard.id,
        dbSet: m.dbCard.set_name,
        dbNumber: m.dbCard.ext_number,
        csvSet: m.csvCard.set,
        csvNumber: m.csvCard.setNum
      }));

    const script = `#!/usr/bin/env node

import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

const corrections = ${JSON.stringify(corrections, null, 2)};

async function applyCorrections() {
  const db = new Database('./server/cards.db');
  
  console.log('🔧 Applying corrected artist corrections...');
  console.log(\`📝 Found \${corrections.length} high-confidence corrections to apply\`);
  
  let applied = 0;
  let errors = 0;
  
  for (const correction of corrections) {
    try {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE products SET artist = ? WHERE product_id = ?',
          [correction.correctArtist, correction.productId],
          function(err) {
            if (err) {
              console.error(\`Error updating \${correction.cardName}: \${err.message}\`);
              errors++;
              reject(err);
            } else {
              console.log(\`✅ Updated \${correction.cardName}: "\${correction.currentArtist || 'NULL'}" → "\${correction.correctArtist}"\`);
              console.log(\`   Set: \${correction.dbSet} | Number: \${correction.dbNumber}\`);
              console.log(\`   CSV: \${correction.csvSet} | Number: \${correction.csvNumber}\`);
              applied++;
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.error(\`Failed to update \${correction.cardName}\`);
    }
  }
  
  console.log(\`\\n📊 Correction Results:\`);
  console.log(\`✅ Applied: \${applied}\`);
  console.log(\`❌ Errors: \${errors}\`);
  
  db.close();
}

applyCorrections().catch(console.error);
`;

    fs.writeFileSync('./apply-artist-corrections-corrected.js', script);
    console.log('✅ Corrected artist correction script saved as: apply-artist-corrections-corrected.js');
    console.log(`📝 Found ${corrections.length} high-confidence corrections to apply`);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Main execution
async function main() {
  const validator = new CorrectedArtistValidator();
  
  try {
    await validator.init();
    await validator.validateArtists();
    validator.generateReport();
    await validator.generateCorrectionScript();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    validator.close();
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default CorrectedArtistValidator;






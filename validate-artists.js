#!/usr/bin/env node

import fs from 'fs';
import sqlite3 from 'sqlite3';
import csv from 'csv-parser';
import path from 'path';

const { Database } = sqlite3;

class ArtistValidator {
  constructor() {
    this.csvData = new Map();
    this.db = null;
    this.mismatches = [];
    this.missingArtists = [];
    this.incorrectArtists = [];
  }

  async init() {
    console.log('🎨 Initializing Artist Validator...');
    
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
          // Create a unique key combining card name, set, and set number
          const key = this.createCardKey(row.card_name, row.set, row.set_num);
          this.csvData.set(key, {
            cardName: row.card_name,
            set: row.set,
            series: row.series,
            artist: row.artist,
            releaseDate: row.release_date,
            setNum: row.set_num,
            id: row.id
          });
        })
        .on('end', () => {
          console.log('📊 CSV data loaded successfully');
          resolve();
        })
        .on('error', reject);
    });
  }

  createCardKey(cardName, set, setNum) {
    // Normalize the key for matching
    return `${cardName.toLowerCase().trim()}|${set.toLowerCase().trim()}|${setNum}`;
  }

  async validateArtists() {
    console.log('🔍 Starting artist validation...');
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          product_id,
          name,
          artist,
          sub_type_name,
          ext_number,
          ext_rarity
        FROM products 
        WHERE name IS NOT NULL 
        AND name != ''
        ORDER BY name
      `;

      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`📋 Validating ${rows.length} cards from database...`);
        
        let processed = 0;
        let matches = 0;
        let mismatches = 0;

        rows.forEach((card) => {
          processed++;
          
          // Try to find matching card in CSV
          const csvMatch = this.findCSVMatch(card);
          
          if (csvMatch) {
            if (this.artistsMatch(card.artist, csvMatch.artist)) {
              matches++;
            } else {
              mismatches++;
              this.mismatches.push({
                dbCard: card,
                csvCard: csvMatch,
                issue: 'artist_mismatch'
              });
            }
          } else {
            this.missingArtists.push({
              dbCard: card,
              issue: 'no_csv_match'
            });
          }

          // Progress indicator
          if (processed % 1000 === 0) {
            console.log(`📊 Processed ${processed}/${rows.length} cards...`);
          }
        });

        console.log(`\n📈 Validation Results:`);
        console.log(`✅ Matches: ${matches}`);
        console.log(`❌ Mismatches: ${mismatches}`);
        console.log(`❓ No CSV match: ${this.missingArtists.length}`);
        
        resolve();
      });
    });
  }

  findCSVMatch(dbCard) {
    // Try multiple matching strategies
    const strategies = [
      // Strategy 1: Exact name match
      () => this.csvData.get(this.createCardKey(dbCard.name, this.extractSetFromCard(dbCard), this.extractSetNumFromCard(dbCard))),
      
      // Strategy 2: Clean name match
      () => this.csvData.get(this.createCardKey(this.cleanCardName(dbCard.name), this.extractSetFromCard(dbCard), this.extractSetNumFromCard(dbCard))),
      
      // Strategy 3: Partial name match
      () => this.findPartialMatch(dbCard.name, this.extractSetFromCard(dbCard), this.extractSetNumFromCard(dbCard)),
      
      // Strategy 4: Name without variant info
      () => this.findWithoutVariant(dbCard.name, this.extractSetFromCard(dbCard), this.extractSetNumFromCard(dbCard))
    ];

    for (const strategy of strategies) {
      const match = strategy();
      if (match) return match;
    }

    return null;
  }

  cleanCardName(name) {
    if (!name) return '';
    
    // Remove common suffixes and variants
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

  extractSetFromCard(card) {
    // Try to extract set name from sub_type_name or other fields
    if (card.sub_type_name) {
      return card.sub_type_name;
    }
    
    // You might need to add more logic here based on your data structure
    return 'Unknown';
  }

  extractSetNumFromCard(card) {
    // Try to extract set number from ext_number
    if (card.ext_number) {
      // Extract just the number part (e.g., "4" from "4/102")
      const match = card.ext_number.match(/^(\d+)/);
      return match ? match[1] : card.ext_number;
    }
    
    return '1';
  }

  findPartialMatch(cardName, set, setNum) {
    const cleanName = this.cleanCardName(cardName);
    
    for (const [key, csvCard] of this.csvData) {
      const [csvName, csvSet, csvSetNum] = key.split('|');
      
      if (csvName.includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(csvName)) {
        if (csvSet.toLowerCase().includes(set.toLowerCase()) || set.toLowerCase().includes(csvSet.toLowerCase())) {
          return csvCard;
        }
      }
    }
    
    return null;
  }

  findWithoutVariant(cardName, set, setNum) {
    const cleanName = this.cleanCardName(cardName);
    
    for (const [key, csvCard] of this.csvData) {
      const [csvName, csvSet, csvSetNum] = key.split('|');
      
      if (csvName === cleanName.toLowerCase()) {
        return csvCard;
      }
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

  generateReport() {
    console.log('\n📊 DETAILED VALIDATION REPORT');
    console.log('='.repeat(50));
    
    if (this.mismatches.length > 0) {
      console.log(`\n❌ ARTIST MISMATCHES (${this.mismatches.length}):`);
      console.log('-'.repeat(30));
      
      this.mismatches.slice(0, 20).forEach((mismatch, index) => {
        console.log(`\n${index + 1}. ${mismatch.dbCard.name}`);
        console.log(`   Database Artist: "${mismatch.dbCard.artist || 'NULL'}"`);
        console.log(`   CSV Artist: "${mismatch.csvCard.artist || 'NULL'}"`);
        console.log(`   Set: ${mismatch.csvCard.set} | Number: ${mismatch.csvCard.setNum}`);
        console.log(`   CSV ID: ${mismatch.csvCard.id}`);
      });
      
      if (this.mismatches.length > 20) {
        console.log(`\n... and ${this.mismatches.length - 20} more mismatches`);
      }
    }
    
    if (this.missingArtists.length > 0) {
      console.log(`\n❓ CARDS WITHOUT CSV MATCH (${this.missingArtists.length}):`);
      console.log('-'.repeat(30));
      
      this.missingArtists.slice(0, 10).forEach((missing, index) => {
        console.log(`\n${index + 1}. ${missing.dbCard.name}`);
        console.log(`   Database Artist: "${missing.dbCard.artist || 'NULL'}"`);
        console.log(`   Set: ${missing.dbCard.sub_type_name || 'Unknown'}`);
        console.log(`   Number: ${missing.dbCard.ext_number || 'Unknown'}`);
      });
      
      if (this.missingArtists.length > 10) {
        console.log(`\n... and ${this.missingArtists.length - 10} more cards without matches`);
      }
    }
  }

  async generateCorrectionScript() {
    console.log('\n🔧 Generating correction script...');
    
    const corrections = this.mismatches
      .filter(m => m.csvCard.artist && m.csvCard.artist.trim() !== '')
      .map(m => ({
        productId: m.dbCard.product_id,
        currentArtist: m.dbCard.artist,
        correctArtist: m.csvCard.artist,
        cardName: m.dbCard.name,
        csvId: m.csvCard.id
      }));

    const script = `#!/usr/bin/env node

import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

const corrections = ${JSON.stringify(corrections, null, 2)};

async function applyCorrections() {
  const db = new Database('./server/cards.db');
  
  console.log('🔧 Applying artist corrections...');
  
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
              console.log(\`✅ Updated \${correction.cardName}: "\${correction.currentArtist}" → "\${correction.correctArtist}"\`);
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

    fs.writeFileSync('./apply-artist-corrections.js', script);
    console.log('✅ Correction script saved as: apply-artist-corrections.js');
    console.log(`📝 Found ${corrections.length} corrections to apply`);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Main execution
async function main() {
  const validator = new ArtistValidator();
  
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

export default ArtistValidator;

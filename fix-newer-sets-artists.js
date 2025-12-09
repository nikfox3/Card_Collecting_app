#!/usr/bin/env node

import fs from 'fs';
import sqlite3 from 'sqlite3';
import csv from 'csv-parser';
import path from 'path';

const { Database } = sqlite3;

class NewerSetsArtistFixer {
  constructor() {
    this.csvData = new Map();
    this.db = null;
    this.corrections = [];
    this.setMappings = {
      'black bolt': ['sv: black bolt'],
      'white flare': ['sv: white flare'],
      'stellar crown': ['sv07: stellar crown'],
      'twilight masquerade': ['sv06: twilight masquerade'],
      'temporal forces': ['sv05: temporal forces'],
      'paradox rift': ['sv04: paradox rift'],
      'obsidian flames': ['sv03: obsidian flames'],
      'paldea evolved': ['sv02: paldea evolved'],
      'scarlet & violet': ['sv01: scarlet & violet base set'],
      '151': ['sv: scarlet & violet 151'],
      'paldean fates': ['sv: paldean fates'],
      'shrouded fable': ['sv: shrouded fable'],
      'prismatic evolutions': ['sv: prismatic evolutions'],
      'scarlet & violet black star promos': ['sv: scarlet & violet promo cards'],
      'scarlet & violet energies': ['sve: scarlet & violet energies']
    };
  }

  async init() {
    console.log('🎨 Initializing Newer Sets Artist Fixer...');
    
    // Load CSV data
    await this.loadCSVData();
    
    // Connect to database
    this.db = new Database('./server/cards.db');
    
    console.log(`✅ Loaded ${this.csvData.size} cards from CSV`);
  }

  async loadCSVData() {
    const csvFilePath = path.resolve(process.cwd(), 'public/Pokemon database files/pokemon_Final_Master_List_Illustrators.csv');
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          const key = `${row.card_name.toLowerCase()}||${row.set.toLowerCase()}||${row.set_num}`;
          this.csvData.set(key, row);
        })
        .on('end', () => {
          console.log('📊 CSV data loaded successfully');
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ Error loading CSV data:', error);
          reject(error);
        });
    });
  }

  findCsvMatch(dbCard) {
    const setName = dbCard.set_name || 'Unknown';
    const cardNumber = dbCard.ext_number || 'Unknown';
    const cardName = dbCard.name;

    // Clean card name for matching
    const cleanedCardName = cardName.replace(/\s*-\s*\d+\/?\d*$/, '').toLowerCase();
    const cleanedSetName = setName.toLowerCase();

    // Extract just the number part (e.g., "001/064" -> "1", "001" -> "1")
    const extractNumber = (numStr) => {
      if (!numStr) return '';
      const match = numStr.match(/^(\d+)/);
      return match ? parseInt(match[1], 10).toString() : numStr;
    };

    const cleanCardNumber = extractNumber(cardNumber);

    // Try direct match first
    let csvKey = `${cleanedCardName}||${cleanedSetName}||${cardNumber}`;
    let csvCard = this.csvData.get(csvKey);

    if (csvCard) {
      return csvCard;
    }

    // Try with cleaned card number
    csvKey = `${cleanedCardName}||${cleanedSetName}||${cleanCardNumber}`;
    csvCard = this.csvData.get(csvKey);

    if (csvCard) {
      return csvCard;
    }

    // Try with set mappings
    for (const [csvSet, dbSets] of Object.entries(this.setMappings)) {
      for (const dbSet of dbSets) {
        if (cleanedSetName.includes(dbSet)) {
          csvKey = `${cleanedCardName}||${csvSet}||${cardNumber}`;
          csvCard = this.csvData.get(csvKey);
          if (csvCard) {
            return csvCard;
          }
          
          csvKey = `${cleanedCardName}||${csvSet}||${cleanCardNumber}`;
          csvCard = this.csvData.get(csvKey);
          if (csvCard) {
            return csvCard;
          }
        }
      }
    }

    // Try without set number for special cases
    csvKey = `${cleanedCardName}||${cleanedSetName}||`;
    csvCard = this.csvData.get(csvKey);
    if (csvCard) {
      return csvCard;
    }

    return null;
  }

  async fixNewerSets() {
    console.log('🔍 Fixing newer sets...');
    
    const query = `
      SELECT 
        p.product_id, 
        p.name, 
        p.artist, 
        p.ext_number, 
        p.group_id,
        g.name as set_name
      FROM products p
      JOIN groups g ON p.group_id = g.group_id
      WHERE (g.name LIKE '%SV:%' OR g.name LIKE '%Scarlet%' OR g.name LIKE '%Violet%')
        AND p.name NOT LIKE '%Booster%'
        AND p.name NOT LIKE '%Box%'
        AND p.name NOT LIKE '%Blister%'
        AND p.name NOT LIKE '%Pack%'
        AND p.name NOT LIKE '%Collection%'
        AND p.name NOT LIKE '%Tin%'
        AND p.name NOT LIKE '%Display%'
        AND p.name NOT LIKE '%Case%'
        AND p.name NOT LIKE '%Build%'
        AND p.name NOT LIKE '%Battle%'
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows) => {
        if (err) {
          console.error('❌ Error querying database:', err);
          return reject(err);
        }

        console.log(`📋 Found ${rows.length} cards without artists in newer sets...`);

        for (const dbCard of rows) {
          const csvCard = this.findCsvMatch(dbCard);
          
          if (csvCard && csvCard.artist) {
            const dbArtist = dbCard.artist ? dbCard.artist.trim() : null;
            const csvArtist = csvCard.artist ? csvCard.artist.trim() : null;
            
            // Check if artist is missing or mismatched
            if (!dbArtist || dbArtist !== csvArtist) {
              this.corrections.push({
                productId: dbCard.product_id,
                currentArtist: dbArtist || 'NULL',
                correctArtist: csvArtist,
                cardName: dbCard.name,
                setName: dbCard.set_name,
                cardNumber: dbCard.ext_number,
                csvId: csvCard.id
              });
            }
          }
        }
        
        resolve();
      });
    });
  }

  async applyCorrections() {
    console.log('🔧 Applying artist corrections...');
    
    let applied = 0;
    let errors = 0;

    for (const correction of this.corrections) {
      const { productId, correctArtist, cardName, csvId } = correction;
      try {
        await new Promise((resolve, reject) => {
          this.db.run(
            `UPDATE products SET artist = ? WHERE product_id = ?`,
            [correctArtist, productId],
            function (err) {
              if (err) {
                console.error(`❌ Error updating artist for ${cardName} (ID: ${productId}, CSV ID: ${csvId}): ${err.message}`);
                errors++;
                reject(err);
              } else {
                console.log(`✅ Updated artist for ${cardName} (ID: ${productId}) to ${correctArtist}`);
                applied++;
                resolve();
              }
            }
          );
        });
      } catch (e) {
        // Error already logged
      }
    }

    console.log('\n✨ Correction process complete!');
    console.log(`✅ Successfully applied ${applied} corrections.`);
    console.log(`❌ Encountered ${errors} errors during correction.`);
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('Database connection closed.');
        }
      });
    }
  }
}

async function main() {
  const fixer = new NewerSetsArtistFixer();
  try {
    await fixer.init();
    await fixer.fixNewerSets();
    
    console.log(`\n📊 Found ${fixer.corrections.length} corrections to apply`);
    
    if (fixer.corrections.length > 0) {
      console.log('\n🔧 Sample corrections:');
      fixer.corrections.slice(0, 10).forEach((c, i) => {
        console.log(`${i + 1}. ${c.cardName} (${c.setName} ${c.cardNumber})`);
        console.log(`   Current: "${c.currentArtist}" → Correct: "${c.correctArtist}"`);
      });
      
      await fixer.applyCorrections();
    } else {
      console.log('✅ No corrections needed!');
    }

  } catch (error) {
    console.error('❌ An error occurred:', error);
  } finally {
    fixer.close();
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default NewerSetsArtistFixer;

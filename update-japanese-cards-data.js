import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'cards.db');
const db = new sqlite3.Database(dbPath);

const query = promisify(db.all.bind(db));
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

class JapaneseCardsDataUpdater {
  constructor() {
    this.updated = 0;
    this.errors = 0;
    this.sets = [];
  }

  async loadJapaneseSets() {
    try {
      const csvPath = 'public/Pokemon database files/tcgcsv-set-products-prices/Japanese-Table 1.csv';
      const csv = fs.readFileSync(csvPath, 'utf8');
      const lines = csv.split('\n').filter(l => l.trim());
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const [groupId, groupName, productsUrl, pricesUrl] = lines[i].split(',');
          if (groupId && groupName && productsUrl) {
            this.sets.push({
              groupId: parseInt(groupId),
              groupName: groupName.trim(),
              productsUrl: productsUrl.trim()
            });
          }
        }
      }
      console.log(`✅ Loaded ${this.sets.length} Japanese sets\n`);
      return true;
    } catch (error) {
      console.error('❌ Error loading Japanese sets:', error.message);
      return false;
    }
  }

  async makeRequest(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  extractCardData(product) {
    let extNumber = product.extNumber || null;
    let extRarity = product.extRarity || null;
    
    // Parse extendedData array
    if (product.extendedData && Array.isArray(product.extendedData)) {
      for (const item of product.extendedData) {
        const name = (item.name || item.displayName || '').toLowerCase().trim();
        const value = item.value;
        
        // Extract number
        if (!extNumber && (
            name === 'number' || 
            name === 'no' || 
            name === 'card number' ||
            name === 'card no' ||
            (name.includes('number') && !name.includes('card number') && !name.includes('image') && !name.includes('image number'))
        )) {
          extNumber = String(value).trim();
          // Format: ensure it's in format like "001/073" or "25"
          if (extNumber && !extNumber.match(/^\d+\/?\d*$/)) {
            const numMatch = extNumber.match(/(\d{1,4}\/?\d{0,4})/);
            if (numMatch) {
              extNumber = numMatch[1];
            } else {
              extNumber = null;
            }
          }
          if (extNumber && extNumber.length > 0) {
            // Don't break, continue to check for rarity
          } else {
            extNumber = null;
          }
        }
        
        // Extract rarity - be more flexible
        if (!extRarity && (
            name === 'rarity' ||
            name === 'card rarity' ||
            name.includes('rarity')
        )) {
          const rarityValue = String(value).trim();
          // Accept any non-empty value, but we'll handle "None" specially
          if (rarityValue && rarityValue.length > 0) {
            // If it's "None", try to infer from card characteristics
            if (rarityValue.toLowerCase() === 'none') {
              // For Japanese cards, "None" often means "Common" for basic cards
              // Check if it's a basic Pokemon (has HP but no Stage or Stage is Basic)
              const stageField = product.extendedData?.find(item => {
                const n = (item.name || item.displayName || '').toLowerCase();
                return n === 'stage';
              });
              const hpField = product.extendedData?.find(item => {
                const n = (item.name || item.displayName || '').toLowerCase();
                return n === 'hp';
              });
              
              // If it's a basic Pokemon card, "None" likely means "Common"
              if (hpField && (!stageField || stageField.value?.toLowerCase() === 'basic')) {
                extRarity = 'Common';
              } else if (product.extCardType) {
                // Check card type - Trainers and Energy often don't have rarity, but if it's a Pokemon, use Common
                const cardType = String(product.extCardType).toLowerCase();
                if (cardType.includes('pokemon') || cardType.includes('pokémon')) {
                  extRarity = 'Common';
                } else {
                  // For Trainers/Energy, leave as null
                  extRarity = null;
                }
              } else {
                // For other cards, leave as null to avoid overwriting with "None"
                extRarity = null;
              }
            } else if (rarityValue.toLowerCase() !== 'unconfirmed' && rarityValue.toLowerCase() !== 'null') {
              extRarity = rarityValue;
            }
          }
        }
      }
    }
    
    // If still not found, try to extract from card name
    if (!extNumber && product.name) {
      let nameMatch = product.name.match(/\s*-\s*(\d{1,4}\/?\d{0,4})\s*$/);
      if (!nameMatch) {
        nameMatch = product.name.match(/\s+(\d{1,4}\/?\d{0,4})\s*$/);
      }
      if (!nameMatch) {
        nameMatch = product.name.match(/^(\d{1,4}\/?\d{0,4})\s+/);
      }
      if (nameMatch) {
        extNumber = nameMatch[1].trim();
      }
    }
    
    return { extNumber, extRarity };
  }

  async updateCardsForSet(set) {
    try {
      // Get cards missing numbers or with bad rarity from this set
      const cardsNeedingUpdate = await query(`
        SELECT product_id, name, ext_number, ext_rarity
        FROM products
        WHERE group_id = ? 
          AND language = 'ja'
          AND (ext_card_type IS NOT NULL OR ext_hp IS NOT NULL)
          AND (
            (ext_number IS NULL OR ext_number = '') OR
            (ext_rarity IS NULL OR ext_rarity = '' OR LOWER(ext_rarity) IN ('none', 'unconfirmed', 'null'))
          )
        LIMIT 500
      `, [set.groupId]);
      
      if (cardsNeedingUpdate.length === 0) {
        return;
      }
      
      console.log(`📦 Processing ${set.groupName} (ID: ${set.groupId})...`);
      console.log(`   Found ${cardsNeedingUpdate.length} cards needing update`);
      
      // Fetch products from TCGCSV
      const productsData = await this.makeRequest(set.productsUrl);
      
      if (!productsData.success || !productsData.results || productsData.results.length === 0) {
        console.log(`   ⚠️  No products found in API response\n`);
        return;
      }
      
      // Create maps: by product_id and by name
      const productMapById = new Map();
      const productMapByName = new Map();
      productsData.results.forEach(p => {
        productMapById.set(parseInt(p.productId), p);
        const normalizedName = (p.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
        if (normalizedName) {
          productMapByName.set(normalizedName, p);
        }
      });
      
      let updatedCount = 0;
      let numbersUpdated = 0;
      let raritiesUpdated = 0;
      
      for (const card of cardsNeedingUpdate) {
        try {
          // Try to find by product_id first
          let product = productMapById.get(card.product_id);
          
          // If not found by ID, try to match by name
          if (!product) {
            const normalizedCardName = card.name.toLowerCase().trim().replace(/\s+/g, ' ');
            product = productMapByName.get(normalizedCardName);
          }
          
          if (!product) {
            continue;
          }
          
          const { extNumber, extRarity } = this.extractCardData(product);
          
          // Debug first few cards
          if (updatedCount < 3) {
            console.log(`   🔍 Debug card: ${card.name}`);
            console.log(`      Current: number="${card.ext_number || 'NULL'}", rarity="${card.ext_rarity || 'NULL'}"`);
            console.log(`      Extracted: number="${extNumber || 'NULL'}", rarity="${extRarity || 'NULL'}"`);
            if (product.extendedData) {
              const rarityField = product.extendedData.find(item => {
                const name = (item.name || item.displayName || '').toLowerCase();
                return name.includes('rarity');
              });
              if (rarityField) {
                console.log(`      Rarity field: "${rarityField.name || rarityField.displayName}" = "${rarityField.value}"`);
              }
            }
          }
          
          // Only update if we have new data
          const needsNumberUpdate = (!card.ext_number || card.ext_number === '') && extNumber;
          // Update rarity if it's missing, empty, or invalid (including "None")
          const currentRarity = (card.ext_rarity || '').toLowerCase();
          const needsRarityUpdate = (!card.ext_rarity || 
                                     card.ext_rarity === '' || 
                                     ['none', 'unconfirmed', 'null'].includes(currentRarity)) && 
                                    extRarity &&
                                    extRarity.toLowerCase() !== 'none'; // Don't update to "None"
          
          if (needsNumberUpdate || needsRarityUpdate) {
            const updates = [];
            const params = [];
            
            if (needsNumberUpdate) {
              updates.push('ext_number = ?');
              params.push(extNumber);
              numbersUpdated++;
            }
            
            if (needsRarityUpdate) {
              updates.push('ext_rarity = ?');
              params.push(extRarity);
              raritiesUpdated++;
            }
            
            if (updates.length > 0) {
              updates.push('updated_at = ?');
              params.push(new Date().toISOString());
              params.push(card.product_id);
              
              await run(`
                UPDATE products
                SET ${updates.join(', ')}
                WHERE product_id = ?
              `, params);
              
              this.updated++;
              updatedCount++;
            }
          }
        } catch (error) {
          console.error(`   ❌ Error updating card ${card.product_id}:`, error.message);
          this.errors++;
        }
      }
      
      if (updatedCount > 0) {
        console.log(`   ✅ Updated ${updatedCount} cards (${numbersUpdated} numbers, ${raritiesUpdated} rarities)\n`);
      } else {
        console.log(`   ⚠️  No updates needed\n`);
      }
    } catch (error) {
      console.error(`   ❌ Error processing set ${set.groupName}:`, error.message);
      this.errors++;
    }
  }

  async updateAll() {
    console.log('🔄 Starting update of Japanese cards data (numbers and rarity)...\n');
    
    if (!(await this.loadJapaneseSets())) {
      return;
    }
    
    // Find sets that have cards needing updates
    const setsNeedingUpdate = await query(`
      SELECT DISTINCT g.group_id, g.name
      FROM products p
      JOIN groups g ON p.group_id = g.group_id
      WHERE p.language = 'ja'
        AND (ext_card_type IS NOT NULL OR ext_hp IS NOT NULL)
        AND (
          (p.ext_number IS NULL OR p.ext_number = '') OR
          (p.ext_rarity IS NULL OR p.ext_rarity = '' OR LOWER(p.ext_rarity) IN ('none', 'unconfirmed', 'null'))
        )
      ORDER BY g.group_id
    `);
    
    console.log(`Found ${setsNeedingUpdate.length} sets with cards needing updates\n`);
    
    // Create a map of group_id to set info
    const setMap = new Map();
    this.sets.forEach(s => setMap.set(s.groupId, s));
    
    // Process only sets needing updates
    for (const setInfo of setsNeedingUpdate) {
      const set = setMap.get(setInfo.group_id);
      if (set) {
        await this.updateCardsForSet(set);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n✅ Update complete!`);
    console.log(`   Cards updated: ${this.updated}`);
    console.log(`   Errors: ${this.errors}`);
  }
}

const updater = new JapaneseCardsDataUpdater();
updater.updateAll().then(() => {
  db.close();
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  db.close();
  process.exit(1);
});


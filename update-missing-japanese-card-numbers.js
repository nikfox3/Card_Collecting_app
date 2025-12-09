import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'cards.db');
const db = new sqlite3.Database(dbPath);

const query = promisify(db.all.bind(db));
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

class JapaneseCardNumberUpdater {
  constructor() {
    this.updated = 0;
    this.errors = 0;
    this.sets = [];
  }

  async loadJapaneseSets() {
    try {
      const fs = await import('fs');
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

  extractCardNumber(product) {
    let extNumber = product.extNumber || null;
    
    // Parse extendedData array
    if (product.extendedData && Array.isArray(product.extendedData)) {
      for (const item of product.extendedData) {
        const name = (item.name || item.displayName || '').toLowerCase().trim();
        const value = item.value;
        
        // Check for number field - be more flexible
        // Match "Number" (capitalized) which is what TCGCSV uses
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
            // Try to extract number from the value if it contains other text
            const numMatch = extNumber.match(/(\d{1,4}\/?\d{0,4})/);
            if (numMatch) {
              extNumber = numMatch[1];
            } else {
              extNumber = null; // Invalid format
            }
          }
          if (extNumber && extNumber.length > 0) {
            break; // Found it, stop looking
          } else {
            extNumber = null; // Reset if invalid
          }
        }
      }
    }
    
    // If still not found, try to extract from card name (format: "Card Name - 001/073" or "Card Name 001/073")
    if (!extNumber && product.name) {
      // Try format: "Card Name - 001/073"
      let nameMatch = product.name.match(/\s*-\s*(\d{1,4}\/?\d{0,4})\s*$/);
      if (!nameMatch) {
        // Try format: "Card Name 001/073" (no dash)
        nameMatch = product.name.match(/\s+(\d{1,4}\/?\d{0,4})\s*$/);
      }
      if (!nameMatch) {
        // Try format: "001/073 Card Name" (number at start)
        nameMatch = product.name.match(/^(\d{1,4}\/?\d{0,4})\s+/);
      }
      if (nameMatch) {
        extNumber = nameMatch[1].trim();
      }
    }
    
    return extNumber || null;
  }

  async updateCardsForSet(set) {
    try {
      console.log(`📦 Processing ${set.groupName} (ID: ${set.groupId})...`);
      
      // Get cards missing numbers from this set
      const cardsMissingNumbers = await query(`
        SELECT product_id, name
        FROM products
        WHERE group_id = ? 
          AND language = 'ja'
          AND (ext_number IS NULL OR ext_number = '')
          AND (ext_card_type IS NOT NULL OR ext_hp IS NOT NULL)
        LIMIT 500
      `, [set.groupId]);
      
      if (cardsMissingNumbers.length === 0) {
        console.log(`   ✅ No cards missing numbers in this set\n`);
        return;
      }
      
      console.log(`   Found ${cardsMissingNumbers.length} cards missing numbers`);
      
      // Fetch products from TCGCSV
      const productsData = await this.makeRequest(set.productsUrl);
      
      if (!productsData.success || !productsData.results || productsData.results.length === 0) {
        console.log(`   ⚠️  No products found in API response\n`);
        return;
      }
      
      // Create maps: by product_id and by name (for fallback matching)
      const productMapById = new Map();
      const productMapByName = new Map();
      productsData.results.forEach(p => {
        productMapById.set(parseInt(p.productId), p);
        // Normalize name for matching (lowercase, remove extra spaces)
        const normalizedName = (p.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
        if (normalizedName) {
          productMapByName.set(normalizedName, p);
        }
      });
      
      // Update each card
      let foundInApi = 0;
      let extracted = 0;
      let notFound = 0;
      let matchedByName = 0;
      
      for (const card of cardsMissingNumbers) {
        try {
          // Try to find by product_id first
          let product = productMapById.get(card.product_id);
          
          // If not found by ID, try to match by name
          if (!product) {
            const normalizedCardName = card.name.toLowerCase().trim().replace(/\s+/g, ' ');
            product = productMapByName.get(normalizedCardName);
            if (product) {
              matchedByName++;
            }
          }
          
          if (!product) {
            notFound++;
            // Try to extract from card name in database as fallback
            const nameMatch = card.name.match(/\s*-\s*(\d{1,4}\/?\d{0,4})\s*$/) || 
                             card.name.match(/\s+(\d{1,4}\/?\d{0,4})\s*$/) ||
                             card.name.match(/^(\d{1,4}\/?\d{0,4})\s+/);
            if (nameMatch) {
              const extNumber = nameMatch[1].trim();
              await run(`
                UPDATE products
                SET ext_number = ?, updated_at = ?
                WHERE product_id = ?
              `, [extNumber, new Date().toISOString(), card.product_id]);
              this.updated++;
              extracted++;
            }
            continue;
          }
          
          foundInApi++;
          const extNumber = this.extractCardNumber(product);
          
          if (extNumber) {
            await run(`
              UPDATE products
              SET ext_number = ?, updated_at = ?
              WHERE product_id = ?
            `, [extNumber, new Date().toISOString(), card.product_id]);
            
            this.updated++;
            if (this.updated % 50 === 0) {
              console.log(`   Updated ${this.updated} cards so far...`);
            }
          } else if (foundInApi <= 5) {
            // Debug: show first few cards that didn't extract
            console.log(`   ⚠️  Could not extract number for: ${card.name} (ID: ${card.product_id})`);
            console.log(`      Product name: ${product.name}`);
            console.log(`      Product extNumber: ${product.extNumber || 'null'}`);
            if (product.extendedData && Array.isArray(product.extendedData)) {
              const numberField = product.extendedData.find(item => {
                const name = (item.name || item.displayName || '').toLowerCase();
                return name.includes('number');
              });
              if (numberField) {
                console.log(`      Found number field: "${numberField.name || numberField.displayName}" = "${numberField.value}"`);
                console.log(`      Extracted value: ${this.extractCardNumber(product)}`);
              } else {
                console.log(`      No number field found in extendedData`);
                console.log(`      ExtendedData fields: ${product.extendedData.map(item => item.name || item.displayName).join(', ')}`);
              }
            } else {
              console.log(`      No extendedData array`);
            }
          }
        } catch (error) {
          console.error(`   ❌ Error updating card ${card.product_id}:`, error.message);
          this.errors++;
        }
      }
      
      if (foundInApi > 0 || extracted > 0 || matchedByName > 0) {
        console.log(`   📊 Found by ID: ${foundInApi - matchedByName}, Found by name: ${matchedByName}, Extracted from names: ${extracted}, Not found: ${notFound}`);
      }
      
      console.log(`   ✅ Processed ${cardsMissingNumbers.length} cards\n`);
    } catch (error) {
      console.error(`   ❌ Error processing set ${set.groupName}:`, error.message);
      this.errors++;
    }
  }

  async updateAll() {
    console.log('🔄 Starting update of missing Japanese card numbers...\n');
    
    if (!(await this.loadJapaneseSets())) {
      return;
    }
    
    // Find sets that have cards missing numbers
    const setsWithMissingNumbers = await query(`
      SELECT DISTINCT g.group_id, g.name
      FROM products p
      JOIN groups g ON p.group_id = g.group_id
      WHERE p.language = 'ja'
        AND (p.ext_number IS NULL OR p.ext_number = '')
        AND (p.ext_card_type IS NOT NULL OR p.ext_hp IS NOT NULL)
      ORDER BY g.group_id
    `);
    
    console.log(`Found ${setsWithMissingNumbers.length} sets with cards missing numbers\n`);
    
    // Create a map of group_id to set info
    const setMap = new Map();
    this.sets.forEach(s => setMap.set(s.groupId, s));
    
    // Process only sets with missing numbers
    for (const setInfo of setsWithMissingNumbers) {
      const set = setMap.get(setInfo.group_id);
      if (set) {
        await this.updateCardsForSet(set);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n✅ Update complete!`);
    console.log(`   Updated: ${this.updated} cards`);
    console.log(`   Errors: ${this.errors}`);
  }
}

const updater = new JapaneseCardNumberUpdater();
updater.updateAll().then(() => {
  db.close();
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  db.close();
  process.exit(1);
});


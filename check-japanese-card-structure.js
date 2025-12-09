import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkCardStructure() {
  try {
    // Read Japanese CSV
    const csvPath = 'public/Pokemon database files/tcgcsv-set-products-prices/Japanese-Table 1.csv';
    const csv = fs.readFileSync(csvPath, 'utf8');
    const lines = csv.split('\n').filter(l => l.trim());
    
    // Get first set
    const [groupId, groupName, productsUrl] = lines[1].split(',');
    
    console.log(`Fetching products from: ${productsUrl.trim()}`);
    const response = await fetch(productsUrl.trim());
    const data = await response.json();
    
    if (data.success && data.results && data.results.length > 0) {
      // Find actual cards (not sealed products) with extendedData
      const cardsWithData = data.results.filter(p => {
        if (!p.extendedData || !Array.isArray(p.extendedData) || p.extendedData.length === 0) {
          return false;
        }
        // Check if it has card-specific fields (not sealed products)
        const hasCardFields = p.extendedData.some(item => {
          const name = (item.name || item.displayName || '').toLowerCase();
          return name.includes('hp') || name.includes('type') || name.includes('stage') || 
                 name.includes('attack') || name.includes('rarity');
        });
        return hasCardFields;
      });
      
      if (cardsWithData.length > 0) {
        const card = cardsWithData[0];
        console.log(`\nSample card: ${card.name}`);
        console.log(`\nDirect fields:`);
        console.log(`  - extNumber: ${card.extNumber || 'NOT FOUND'}`);
        console.log(`  - extHP: ${card.extHP || 'NOT FOUND'}`);
        console.log(`  - extRarity: ${card.extRarity || 'NOT FOUND'}`);
        
        console.log(`\nextendedData fields:`);
        card.extendedData.forEach(item => {
          const name = item.name || item.displayName || 'UNKNOWN';
          console.log(`  - "${name}": ${item.value}`);
        });
        
        // Check for number field specifically
        const numberField = card.extendedData.find(item => {
          const name = (item.name || item.displayName || '').toLowerCase();
          return name.includes('number') || name === 'number' || name === 'no' || name === 'card number';
        });
        
        if (numberField) {
          console.log(`\n✅ Found number field: "${numberField.name || numberField.displayName}" = ${numberField.value}`);
        } else {
          console.log(`\n❌ No number field found in extendedData`);
        }
      } else {
        console.log('No cards with extendedData found');
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
}

checkCardStructure();


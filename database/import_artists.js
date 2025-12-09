const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Import artist data from CSV file
class ArtistImporter {
  constructor(csvPath) {
    this.db = new sqlite3.Database('./cards.db');
    this.csvPath = csvPath;
    this.updated = 0;
    this.notFound = 0;
    this.skipped = 0;
  }
  
  // Parse CSV file
  parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return { headers, data };
  }
  
  // Parse a CSV line (handles quoted values with commas)
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values.map(v => v.replace(/^["']|["']$/g, ''));
  }
  
  // Update artist for a card
  async updateArtist(cardId, artist) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE cards SET artist = ? WHERE id = ?',
        [artist, cardId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
  
  // Find card by name and set
  async findCard(cardName, setId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM cards WHERE name = ? AND set_id = ?',
        [cardName, setId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
  
  // Import artists from CSV
  async import() {
    try {
      console.log('📄 Reading CSV file...');
      
      if (!fs.existsSync(this.csvPath)) {
        console.error(`❌ File not found: ${this.csvPath}`);
        console.log('\nPlease provide the path to your artist CSV file.');
        console.log('Usage: node import_artists.js <path-to-csv>');
        return;
      }
      
      const content = fs.readFileSync(this.csvPath, 'utf-8');
      const { headers, data } = this.parseCSV(content);
      
      console.log(`✅ Found ${data.length} records\n`);
      console.log(`📋 CSV Headers: ${headers.join(', ')}\n`);
      
      // Try to detect column names
      const cardIdCol = headers.find(h => h.toLowerCase().includes('id') || h.toLowerCase() === 'card_id');
      const cardNameCol = headers.find(h => h.toLowerCase().includes('name') || h.toLowerCase() === 'card_name');
      const setIdCol = headers.find(h => h.toLowerCase().includes('set'));
      const artistCol = headers.find(h => h.toLowerCase().includes('artist') || h.toLowerCase().includes('illustrator'));
      
      console.log('🔍 Detected columns:');
      console.log(`   Card ID: ${cardIdCol || 'NOT FOUND'}`);
      console.log(`   Card Name: ${cardNameCol || 'NOT FOUND'}`);
      console.log(`   Set ID: ${setIdCol || 'NOT FOUND'}`);
      console.log(`   Artist: ${artistCol || 'NOT FOUND'}\n`);
      
      if (!artistCol) {
        console.error('❌ Could not detect artist column!');
        console.log('\nAvailable columns:', headers.join(', '));
        console.log('\nPlease ensure your CSV has an "artist" or "illustrator" column.');
        return;
      }
      
      console.log('🚀 Starting import...\n');
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const artist = row[artistCol];
        
        if (!artist || artist.trim() === '') {
          this.skipped++;
          continue;
        }
        
        try {
          let changes = 0;
          
          // Try to update by card ID if available
          if (cardIdCol && row[cardIdCol]) {
            changes = await this.updateArtist(row[cardIdCol], artist);
          }
          // Otherwise try to find by name and set
          else if (cardNameCol && row[cardNameCol]) {
            const setId = setIdCol ? row[setIdCol] : null;
            const card = await this.findCard(row[cardNameCol], setId);
            
            if (card) {
              changes = await this.updateArtist(card.id, artist);
            }
          }
          
          if (changes > 0) {
            this.updated++;
            if (this.updated % 100 === 0) {
              console.log(`   ✅ Updated ${this.updated} cards...`);
            }
          } else {
            this.notFound++;
          }
          
        } catch (error) {
          console.error(`   ❌ Error updating record ${i + 1}:`, error.message);
        }
      }
      
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Error during import:', error);
    } finally {
      this.db.close();
    }
  }
  
  // Print summary
  printSummary() {
    console.log('\n═══════════════════════════════════════');
    console.log('📊 Artist Import Summary');
    console.log('═══════════════════════════════════════\n');
    
    console.log(`✅ Updated: ${this.updated.toLocaleString()} cards`);
    console.log(`⏭️  Skipped: ${this.skipped.toLocaleString()} (empty artist)`);
    console.log(`❌ Not found: ${this.notFound.toLocaleString()} (card not in database)`);
    
    const total = this.updated + this.skipped + this.notFound;
    const successRate = total > 0 ? ((this.updated / total) * 100).toFixed(1) : 0;
    
    console.log(`\n📈 Success rate: ${successRate}%`);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (!args[0]) {
    console.log('Usage: node import_artists.js <path-to-csv>');
    console.log('');
    console.log('CSV Format:');
    console.log('  Required columns: artist or illustrator');
    console.log('  Optional columns: id, card_id, name, card_name, set_id');
    console.log('');
    console.log('Example:');
    console.log('  node import_artists.js ./artists.csv');
    process.exit(1);
  }
  
  const csvPath = path.resolve(args[0]);
  const importer = new ArtistImporter(csvPath);
  importer.import();
}

module.exports = ArtistImporter;





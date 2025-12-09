const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class HistoricalPriceImporter {
  constructor(dbPath = './cards.db') {
    this.dbPath = dbPath;
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection error:', err);
          reject(err);
        } else {
          console.log('✅ Connected to database');
          resolve();
        }
      });
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err);
          } else {
            console.log('✅ Database connection closed');
          }
          resolve();
        });
      });
    }
  }

  async findProductId(productId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT product_id FROM products WHERE product_id = ?',
        [productId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.product_id : null);
          }
        }
      );
    });
  }

  async importFileData(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const records = JSON.parse(content);
      
      console.log(`📦 Processing: ${path.basename(filePath)}`);
      
      let imported = 0;
      let skipped = 0;
      
      for (const record of records) {
        try {
          const productId = await this.findProductId(record.productId);
          
          if (productId) {
            // Insert price history record
            await new Promise((resolve, reject) => {
              this.db.run(
                `INSERT OR REPLACE INTO price_history 
                 (product_id, date, market_price, low_price, mid_price, high_price, direct_low_price, sub_type_name)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  record.productId,
                  record.date,
                  record.marketPrice,
                  record.lowPrice,
                  record.midPrice,
                  record.highPrice,
                  record.directLowPrice,
                  record.subTypeName
                ],
                function(err) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                }
              );
            });
            
            imported++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.log(`❌ Error processing record: ${error.message}`);
          skipped++;
        }
      }
      
      console.log(`✅ Imported ${imported} records, skipped ${skipped}`);
      return { imported, skipped };
    } catch (error) {
      console.log(`❌ Error processing file ${filePath}: ${error.message}`);
      return { imported: 0, skipped: 0 };
    }
  }

  async importAllFiles() {
    const processedDir = path.join('price_history', 'processed');
    
    if (!fs.existsSync(processedDir)) {
      console.log('❌ No processed directory found');
      return;
    }
    
    const files = fs.readdirSync(processedDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(processedDir, file));
    
    console.log(`📁 Found ${files.length} processed files`);
    
    let totalImported = 0;
    let totalSkipped = 0;
    
    for (const file of files) {
      const result = await this.importFileData(file);
      totalImported += result.imported;
      totalSkipped += result.skipped;
    }
    
    console.log(`\n🎉 Import Complete!`);
    console.log(`📊 Total imported: ${totalImported}`);
    console.log(`⏭️  Total skipped: ${totalSkipped}`);
  }

  async getStats() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT COUNT(*) as total, COUNT(DISTINCT product_id) as products, COUNT(DISTINCT date) as dates FROM price_history',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const stats = rows[0];
            console.log('📊 Price History Database Stats:');
            console.log(`  Total Records: ${stats.total}`);
            console.log(`  Unique Products: ${stats.products}`);
            console.log(`  Unique Dates: ${stats.dates}`);
            resolve(stats);
          }
        }
      );
    });
  }
}

// Main execution
async function main() {
  const importer = new HistoricalPriceImporter();
  
  try {
    await importer.connect();
    
    if (process.argv[2] === 'stats') {
      await importer.getStats();
    } else {
      await importer.importAllFiles();
      await importer.getStats();
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await importer.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = HistoricalPriceImporter;
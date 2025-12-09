import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HistoricalPriceImporter {
  constructor(dbPath = './cards.db', processedDir = './price_history/processed') {
    this.dbPath = dbPath;
    this.processedDir = path.join(__dirname, processedDir);
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Error opening database:', err.message);
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
            console.error('❌ Error closing database:', err.message);
          } else {
            console.log('✅ Database connection closed');
          }
          resolve();
        });
      });
    }
  }

  async getProcessedFiles() {
    if (!fs.existsSync(this.processedDir)) {
      console.log('❌ Processed directory not found. Run the downloader first.');
      return [];
    }

    const files = fs.readdirSync(this.processedDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(this.processedDir, file))
      .sort();

    console.log(`📁 Found ${files.length} processed files`);
    return files;
  }

  async importHistoricalData() {
    console.log('🔄 Starting historical price import...');
    
    await this.connect();

    try {
      // Get all processed files
      const files = await this.getProcessedFiles();
      
      if (files.length === 0) {
        console.log('❌ No processed files found. Run the downloader first.');
        return;
      }

      let totalImported = 0;
      let totalSkipped = 0;

      for (const file of files) {
        console.log(`\n📦 Processing: ${path.basename(file)}`);
        
        try {
          const data = JSON.parse(fs.readFileSync(file, 'utf8'));
          const imported = await this.importFileData(data);
          totalImported += imported.imported;
          totalSkipped += imported.skipped;
          
          console.log(`✅ Imported ${imported.imported} records, skipped ${imported.skipped}`);
          
        } catch (error) {
          console.log(`❌ Error processing ${path.basename(file)}: ${error.message}`);
        }
      }

      console.log(`\n🎉 Import Complete!`);
      console.log(`📊 Total imported: ${totalImported}`);
      console.log(`⏭️  Total skipped: ${totalSkipped}`);

    } finally {
      await this.close();
    }
  }

  async importFileData(data) {
    let imported = 0;
    let skipped = 0;

    for (const record of data.records) {
      try {
        // Find the product ID
        const productId = await this.findProductId(record);
        
        if (!productId) {
          skipped++;
          continue;
        }

        // Map TCGCSV fields to our database schema
        const priceData = {
          product_id: productId,
          date: data.date,
          low_price: this.parsePrice(record.lowPrice),
          mid_price: this.parsePrice(record.midPrice),
          high_price: this.parsePrice(record.highPrice),
          market_price: this.parsePrice(record.marketPrice),
          direct_low_price: this.parsePrice(record.directLowPrice),
          sub_type_name: record.subTypeName || 'Normal'
        };

        // Check if record already exists
        const exists = await this.recordExists(priceData.product_id, priceData.date, priceData.sub_type_name);
        if (exists) {
          skipped++;
          continue;
        }

        // Insert new record
        await this.insertPriceRecord(priceData);
        imported++;

      } catch (error) {
        console.log(`❌ Error processing record: ${error.message}`);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async findProductId(record) {
    // Try to match by product ID first
    if (record.productId) {
      const productId = parseInt(record.productId);
      
      // Check if this product ID exists in our database
      return new Promise((resolve, reject) => {
          this.db.get(
            'SELECT product_id FROM products WHERE product_id = ?',
            [productId],
            (err, row) => {
              if (err) {
                reject(err);
              } else if (row) {
                resolve(productId);
              } else {
                resolve(null);
              }
            }
          );
        });
    }
    
    return null;
  }

  parsePrice(priceStr) {
    if (!priceStr || priceStr === '') return null;
    const price = parseFloat(priceStr);
    return isNaN(price) ? null : price;
  }

  async recordExists(productId, date, subType) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count 
        FROM price_history 
        WHERE product_id = ? AND date = ? AND sub_type_name = ?
      `;
      
      this.db.get(sql, [productId, date, subType], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  }

  async insertPriceRecord(priceData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO price_history (
          product_id, date, low_price, mid_price, high_price, 
          market_price, direct_low_price, sub_type_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        priceData.product_id,
        priceData.date,
        priceData.low_price,
        priceData.mid_price,
        priceData.high_price,
        priceData.market_price,
        priceData.direct_low_price,
        priceData.sub_type_name
      ];
      
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getImportStats() {
    await this.connect();
    
    try {
      const stats = await new Promise((resolve, reject) => {
        const sql = `
          SELECT 
            COUNT(*) as total_records,
            COUNT(DISTINCT product_id) as unique_products,
            COUNT(DISTINCT date) as unique_dates,
            MIN(date) as earliest_date,
            MAX(date) as latest_date
          FROM price_history
        `;
        
        this.db.get(sql, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });

      console.log('\n📊 Price History Database Stats:');
      console.log(`  Total Records: ${stats.total_records}`);
      console.log(`  Unique Products: ${stats.unique_products}`);
      console.log(`  Unique Dates: ${stats.unique_dates}`);
      console.log(`  Date Range: ${stats.earliest_date} to ${stats.latest_date}`);

      return stats;

    } finally {
      await this.close();
    }
  }
}

async function main() {
  const command = process.argv[2];
  const importer = new HistoricalPriceImporter();

  if (command === 'import') {
    await importer.importHistoricalData();
  } else if (command === 'stats') {
    await importer.getImportStats();
  } else {
    console.log('💡 Usage:');
    console.log('  node import_historical_prices.js import  # Import historical data');
    console.log('  node import_historical_prices.js stats   # Show database stats');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default HistoricalPriceImporter;

import sqlite3 from 'sqlite3';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'cards.db');
const db = new sqlite3.Database(dbPath);

async function run(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

async function query(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 404) {
        file.close();
        fs.unlinkSync(filename);
        resolve(null);
      } else {
        file.close();
        fs.unlinkSync(filename);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(filename);
      reject(err);
    });
  });
}

function decompress7z(filePath) {
  try {
    execSync(`7z e "${filePath}" -o"${filePath.replace('.ppmd.7z', '')}" -y`);
    return filePath.replace('.ppmd.7z', '');
  } catch (error) {
    console.error(`Error decompressing ${filePath}:`, error.message);
    return null;
  }
}

function readPPMD(filePath) {
  // PPMD files are compressed archives. For now, we'll try to read as CSV
  // You may need to install the 7z command-line tool
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

async function importArchiveData(csvPath, date) {
  console.log(`📅 Importing data for ${date}...`);
  
  // Read CSV file
  let lines;
  try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    lines = content.split('\n').filter(line => line.trim());
  } catch (error) {
    console.error(`Error reading ${csvPath}:`, error.message);
    return { imported: 0, errors: 0 };
  }
  
  let imported = 0;
  let errors = 0;
  const headers = lines[0].split(',');
  
  console.log(`Found ${lines.length - 1} records`);
  
  for (let i = 1; i < lines.length && i < 10000; i++) { // Limit to 10k for testing
    try {
      const values = lines[i].split(',');
      const record = {};
      
      headers.forEach((header, index) => {
        record[header.trim()] = values[index]?.trim();
      });
      
      const productId = record['product_id'] || record['Product ID'];
      const midPrice = parseFloat(record['mid_price'] || record['Mid Price'] || record['mid'] || 0);
      
      if (productId && midPrice > 0) {
        await run(`
          INSERT OR REPLACE INTO price_history (product_id, date, price, volume)
          VALUES (?, ?, ?, 0)
        `, [productId, date, midPrice]);
        
        imported++;
      }
      
    } catch (error) {
      errors++;
      if (errors < 10) {
        console.error(`Error processing line ${i}:`, error.message);
      }
    }
  }
  
  console.log(`✅ Imported ${imported} records, ${errors} errors\n`);
  return { imported, errors };
}

async function processDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  console.log(`📥 Processing ${dates.length} dates from ${dates[0]} to ${dates[dates.length - 1]}\n`);
  
  for (const date of dates) {
    const filename = `prices-${date}.ppmd.7z`;
    const filepath = join(__dirname, filename);
    const url = `https://tcgcsv.com/archive/tcgplayer/${filename}`;
    
    console.log(`⬇️  Downloading ${filename}...`);
    
    try {
      await downloadFile(url, filepath);
      
      if (fs.existsSync(filepath)) {
        console.log(`📦 Decompressing ${filename}...`);
        const extractedPath = decompress7z(filepath);
        
        if (extractedPath) {
          await importArchiveData(extractedPath, date);
          
          // Cleanup
          fs.unlinkSync(filepath);
          if (fs.existsSync(extractedPath)) {
            fs.unlinkSync(extractedPath);
          }
        }
      } else {
        console.log(`⚠️  File not found: ${filename}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${date}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 TCGCSV Archive Downloader\n');
  
  // Process a sample date range
  const endDate = '2025-10-26';
  const startDate = '2025-10-20'; // Start with recent dates for testing
  
  await processDateRange(startDate, endDate);
  
  console.log('\n✅ Import complete!');
  
  db.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  db.close();
  process.exit(1);
});




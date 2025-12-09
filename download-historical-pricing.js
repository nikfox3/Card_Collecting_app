import fs from 'fs';
import https from 'https';
import { execSync } from 'child_process';
import { join } from 'path';

const ARCHIVE_URL = 'https://tcgcsv.com/archive/tcgplayer/prices-{date}.ppmd.7z';
const ARCHIVE_DIR = join(process.cwd(), 'Pricing Data', 'Archives');
const EXTRACTED_DIR = join(process.cwd(), 'Pricing Data');

// Date range to download (from Feb 8, 2024 to current date)
function generateDates(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates.map(d => d.toISOString().split('T')[0]);
}

// Download a file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${filepath}`);
          resolve();
        });
      } else if (response.statusCode === 404) {
        console.log(`⚠️  Not found: ${url}`);
        file.close();
        fs.unlinkSync(filepath); // Remove empty file
        resolve(); // Not an error, just not available
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
      }
    }).on('error', (err) => {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

// Extract 7z file
function extractArchive(filepath, outputDir) {
  try {
    // Check if p7zip is installed
    execSync('which 7z', { stdio: 'ignore' });
    
    // Extract the file
    execSync(`7z x "${filepath}" -o"${outputDir}" -y`, { stdio: 'inherit' });
    console.log(`✅ Extracted: ${filepath}`);
    return true;
  } catch (error) {
    console.error(`❌ Extraction failed for ${filepath}:`, error.message);
    return false;
  }
}

// Import extracted CSV into database
async function importCSV(csvPath, date, db) {
  const csv = (await import('csv-parser')).default;
  const { default: dbImport } = await import('sqlite3');
  
  return new Promise((resolve, reject) => {
    const db = new dbImport.Database(join(process.cwd(), 'cards.db'));
    
    let count = 0;
    let errors = 0;
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          const cardId = row.product_id || row['Card ID'];
          const price = parseFloat(row.mid_price || row['Mid Price'] || row.price || 0);
          
          if (cardId && price > 0) {
            await new Promise((res, rej) => {
              db.run(
                `INSERT OR REPLACE INTO price_history (product_id, date, price, volume) VALUES (?, ?, ?, ?)`,
                [cardId, date, price, 0],
                (err) => err ? rej(err) : res()
              );
            });
            count++;
          }
        } catch (err) {
          errors++;
        }
      })
      .on('end', () => {
        db.close();
        resolve({ count, errors });
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('🚀 Starting historical pricing data download...\n');
  
  // Create directories
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
  
  // Get date range
  const today = new Date();
  const startDate = new Date('2024-02-08'); // TCGCSV starts from Feb 8, 2024
  const dates = generateDates(startDate, today);
  
  console.log(`📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.log(`📊 Total dates to check: ${dates.length}\n`);
  
  // Download archives for the last 30 days first (most recent data)
  const recentDates = dates.slice(-30);
  
  for (const date of recentDates) {
    const url = ARCHIVE_URL.replace('{date}', date);
    const filename = `prices-${date}.ppmd.7z`;
    const archivePath = join(ARCHIVE_DIR, filename);
    const extractedCSV = join(EXTRACTED_DIR, `pokemon-prices-${date}.csv`);
    
    // Skip if already extracted
    if (fs.existsSync(extractedCSV)) {
      console.log(`⏭️  Already exists: ${extractedCSV}`);
      continue;
    }
    
    // Skip if already downloaded
    if (!fs.existsSync(archivePath)) {
      try {
        await downloadFile(url, archivePath);
      } catch (error) {
        console.error(`❌ Failed to download ${date}:`, error.message);
        continue;
      }
    }
    
    // Extract if we have the archive
    if (fs.existsSync(archivePath)) {
      const success = extractArchive(archivePath, EXTRACTED_DIR);
      
      if (success && fs.existsSync(extractedCSV)) {
        console.log(`📈 Importing ${extractedCSV}...`);
        try {
          const result = await importCSV(extractedCSV, date);
          console.log(`✅ Imported ${result.count} records (${result.errors} errors) for ${date}\n`);
        } catch (error) {
          console.error(`❌ Import failed for ${date}:`, error.message);
        }
      }
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Historical pricing download complete!');
}

main().catch(console.error);




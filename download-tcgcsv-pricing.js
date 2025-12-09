import fs from 'fs';
import https from 'https';
import { execSync } from 'child_process';
import { join } from 'path';

const BASE_URL = 'https://tcgcsv.com/archive/tcgplayer/prices-{date}.ppmd.7z';
const ARCHIVE_DIR = join(process.cwd(), 'Pricing Data', 'Archives');
const OUTPUT_DIR = join(process.cwd(), 'Pricing Data');

// Create directories
if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

// Helper function to download a file
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
          resolve(true);
        });
      } else if (response.statusCode === 404) {
        console.log(`⚠️  Not found (404): ${url}`);
        file.close();
        resolve(false);
      } else {
        file.close();
        console.log(`❌ HTTP ${response.statusCode}: ${url}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error(`❌ Error downloading ${url}:`, err.message);
      resolve(false);
    });
  });
}

// Extract 7z archive
function extractArchive(filepath) {
  try {
    execSync('7z x "' + filepath + '" -o"' + OUTPUT_DIR + '" -y', { stdio: 'inherit' });
    console.log(`✅ Extracted: ${filepath}`);
    return true;
  } catch (error) {
    console.error(`❌ Extraction failed:`, error.message);
    return false;
  }
}

// Generate date range
function getDates(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Main function
async function downloadHistoricalPricing() {
  console.log('🚀 Starting TCGCSV historical pricing download...\n');
  
  // Get dates from Feb 8, 2024 to today
  const today = new Date();
  const startDate = new Date('2024-02-08');
  const dates = getDates(startDate, today);
  
  console.log(`📅 Checking ${dates.length} dates from ${dates[0]} to ${dates[dates.length - 1]}\n`);
  
  // Check which dates we already have
  const existingDates = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.startsWith('pokemon-prices-') && f.endsWith('.csv'))
    .map(f => f.replace('pokemon-prices-', '').replace('.csv', ''));
  
  console.log(`📊 Already have ${existingDates.length} CSV files\n`);
  
  let downloaded = 0;
  let extracted = 0;
  let failed = 0;
  
  // Download recent dates first (last 60 days for more complete coverage)
  const recentDates = dates.slice(-60);
  
  for (const date of recentDates) {
    // Skip if we already have this date
    if (existingDates.includes(date)) {
      console.log(`⏭️  Already have data for ${date}`);
      continue;
    }
    
    const url = BASE_URL.replace('{date}', date);
    const filename = `prices-${date}.ppmd.7z`;
    const archivePath = join(ARCHIVE_DIR, filename);
    
    // Download if we don't have the archive
    if (!fs.existsSync(archivePath)) {
      console.log(`📥 Downloading ${date}...`);
      const success = await downloadFile(url, archivePath);
      
      if (success) {
        downloaded++;
      } else {
        failed++;
        continue;
      }
    }
    
    // Extract if we have the archive
    if (fs.existsSync(archivePath)) {
      console.log(`📦 Extracting ${date}...`);
      const success = extractArchive(archivePath);
      
      if (success) {
        extracted++;
      } else {
        failed++;
      }
    }
    
    // Small delay to be nice to the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n✅ Complete!`);
  console.log(`📥 Downloaded: ${downloaded} archives`);
  console.log(`📦 Extracted: ${extracted} archives`);
  console.log(`❌ Failed: ${failed} archives`);
  console.log(`\n💡 Next step: Run 'node import-pricing-simple-direct.js' to import CSV files into database`);
}

// Run
downloadHistoricalPricing().catch(console.error);




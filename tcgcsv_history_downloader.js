import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TCGCSVHistoryDownloader {
  constructor(outputDir = 'price_history') {
    this.outputDir = path.join(__dirname, outputDir);
    this.archivesDir = path.join(this.outputDir, 'archives');
    this.extractedDir = path.join(this.outputDir, 'extracted');
    this.processedDir = path.join(this.outputDir, 'processed');
    
    // Create directories
    [this.outputDir, this.archivesDir, this.extractedDir, this.processedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    this.FIRST_AVAILABLE_DATE = new Date('2024-02-08');
  }

  async check7zipInstalled() {
    try {
      await execAsync('/Users/NikFox/Downloads/7z2501-mac/7zz');
      return true;
    } catch (error) {
      return false;
    }
  }

  getArchiveUrl(date) {
    const dateStr = date.toISOString().split('T')[0];
    return `https://tcgcsv.com/archive/tcgplayer/prices-${dateStr}.ppmd.7z`;
  }

  async downloadArchive(date) {
    if (date < this.FIRST_AVAILABLE_DATE) {
      console.log(`❌ Date ${date.toISOString().split('T')[0]} is before first available date (2024-02-08)`);
      return null;
    }

    const url = this.getArchiveUrl(date);
    const filename = `prices-${date.toISOString().split('T')[0]}.ppmd.7z`;
    const filepath = path.join(this.archivesDir, filename);

    // Skip if already downloaded
    if (fs.existsSync(filepath)) {
      console.log(`✓ Already have: ${filename}`);
      return filepath;
    }

    console.log(`📥 Downloading: ${filename}`);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`❌ Archive not available for ${date.toISOString().split('T')[0]}`);
        } else {
          console.log(`❌ Error downloading: HTTP ${response.status}`);
        }
        return null;
      }

      const buffer = await response.buffer();
      fs.writeFileSync(filepath, buffer);
      
      const sizeMB = buffer.length / 1024 / 1024;
      console.log(`✅ Downloaded: ${filename} (${sizeMB.toFixed(1)} MB)`);
      return filepath;

    } catch (error) {
      console.log(`❌ Error downloading: ${error.message}`);
      return null;
    }
  }

  async extractArchive(archivePath) {
    if (!(await this.check7zipInstalled())) {
      console.log('❌ 7zip not installed!');
      console.log('\nInstall 7zip:');
      console.log('  macOS: brew install p7zip');
      console.log('  Ubuntu: sudo apt-get install p7zip-full');
      console.log('  Windows: Download from https://www.7-zip.org/');
      return null;
    }

    // Check if already extracted
    const dateStr = path.basename(archivePath, '.ppmd.7z').replace('prices-', '');
    const dateDir = path.join(this.extractedDir, dateStr);
    
    if (fs.existsSync(dateDir)) {
      console.log(`✓ Already extracted: ${dateStr}`);
      return dateDir;
    }

    console.log(`📂 Extracting: ${path.basename(archivePath)}`);

    try {
      const command = `/Users/NikFox/Downloads/7z2501-mac/7zz x "${archivePath}" -o"${this.extractedDir}" -y`;
      await execAsync(command);

      // Find the extracted files (they're in date directories)
      if (fs.existsSync(dateDir)) {
        console.log(`✅ Extracted to: ${dateStr}`);
        return dateDir;
      }

      console.log(`❌ No extracted directory found after extraction`);
      return null;

    } catch (error) {
      console.log(`❌ Error extracting: ${error.message}`);
      return null;
    }
  }

  async downloadDateRange(startDate, endDate) {
    console.log('='.repeat(70));
    console.log('DOWNLOADING PRICE HISTORY');
    console.log(`From: ${startDate.toISOString().split('T')[0]}`);
    console.log(`To:   ${endDate.toISOString().split('T')[0]}`);
    console.log('='.repeat(70));

    const downloaded = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const archivePath = await this.downloadArchive(current);
      if (archivePath) {
        downloaded.push(archivePath);
      }
      current.setDate(current.getDate() + 1);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`Downloaded ${downloaded.length} archives`);
    console.log(`${'='.repeat(70)}`);

    return downloaded;
  }

  async downloadLastNDays(nDays = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - nDays);

    // Make sure we don't go before first available date
    if (startDate < this.FIRST_AVAILABLE_DATE) {
      startDate.setTime(this.FIRST_AVAILABLE_DATE.getTime());
    }

    return this.downloadDateRange(startDate, endDate);
  }

  listAvailableArchives() {
    const archives = fs.readdirSync(this.archivesDir)
      .filter(file => file.endsWith('.7z'))
      .map(file => path.join(this.archivesDir, file))
      .sort();
    return archives;
  }

  getArchiveInfo() {
    const archives = this.listAvailableArchives();

    if (archives.length === 0) {
      return {
        count: 0,
        totalSizeMB: 0,
        oldest: null,
        newest: null
      };
    }

    const totalSize = archives.reduce((sum, archive) => {
      return sum + fs.statSync(archive).size;
    }, 0);

    // Parse dates from filenames
    const dates = archives.map(archive => {
      const filename = path.basename(archive);
      const dateStr = filename.replace('prices-', '').replace('.ppmd.7z', '');
      return new Date(dateStr);
    }).filter(date => !isNaN(date.getTime()));

    return {
      count: archives.length,
      totalSizeMB: totalSize / 1024 / 1024,
      oldest: dates.length > 0 ? new Date(Math.min(...dates)) : null,
      newest: dates.length > 0 ? new Date(Math.max(...dates)) : null,
      dates: dates.sort()
    };
  }

  async processArchives() {
    console.log('🔄 Processing downloaded archives...');
    
    const archives = this.listAvailableArchives();
    let processed = 0;

    for (const archive of archives) {
      console.log(`\n📦 Processing: ${path.basename(archive)}`);
      
      // Extract archive
      const extractedFile = await this.extractArchive(archive);
      if (!extractedFile) {
        console.log(`❌ Failed to extract ${path.basename(archive)}`);
        continue;
      }

      // Process the extracted file
      const processedFile = await this.processPriceFile(extractedFile);
      if (processedFile) {
        processed++;
        console.log(`✅ Processed: ${path.basename(processedFile)}`);
      }

      // Keep extracted files for now (they contain valuable data)
      // fs.unlinkSync(extractedFile);
    }

    console.log(`\n🎉 Processed ${processed} archives`);
    return processed;
  }

  async processPriceFile(extractedDir) {
    try {
      // Process all price files in the extracted directory
      const allRecords = [];
      const dateStr = path.basename(extractedDir);
      
      console.log(`📊 Processing price files in ${dateStr}...`);
      
      // Find all price files recursively
      const findPriceFiles = (dir) => {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            files.push(...findPriceFiles(fullPath));
          } else if (item === 'prices') {
            files.push(fullPath);
          }
        }
        
        return files;
      };
      
      const priceFiles = findPriceFiles(extractedDir);
      console.log(`📁 Found ${priceFiles.length} price files`);
      
      for (const priceFile of priceFiles) {
        try {
          const content = fs.readFileSync(priceFile, 'utf8');
          const data = JSON.parse(content);
          
          if (data.success && data.results && Array.isArray(data.results)) {
            // Add date to each record
            const recordsWithDate = data.results.map(record => ({
              ...record,
              date: dateStr
            }));
            
            allRecords.push(...recordsWithDate);
          }
        } catch (error) {
          console.log(`⚠️  Error reading ${priceFile}: ${error.message}`);
        }
      }
      
      console.log(`📊 Total records found: ${allRecords.length}`);
      
      if (allRecords.length === 0) {
        console.log(`❌ No valid price records found in ${dateStr}`);
        return null;
      }

      // Create processed file
      const processedFile = path.join(this.processedDir, `prices-${dateStr}.json`);
      
      const processedData = {
        date: dateStr,
        totalRecords: allRecords.length,
        records: allRecords
      };

      fs.writeFileSync(processedFile, JSON.stringify(processedData, null, 2));
      return processedFile;

    } catch (error) {
      console.log(`❌ Error processing ${path.basename(extractedDir)}: ${error.message}`);
      return null;
    }
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('TCGCSV PRICE HISTORY DOWNLOADER');
  console.log('='.repeat(70));

  const downloader = new TCGCSVHistoryDownloader();

  // Check current archives
  const info = downloader.getArchiveInfo();
  console.log(`\n📊 Current Archives:`);
  console.log(`  Count: ${info.count}`);
  console.log(`  Total Size: ${info.totalSizeMB.toFixed(1)} MB`);
  if (info.oldest) {
    console.log(`  Date Range: ${info.oldest.toISOString().split('T')[0]} to ${info.newest.toISOString().split('T')[0]}`);
  }

  // Parse command line arguments
  const command = process.argv[2];

  if (command === 'today') {
    console.log('\n📥 Downloading today\'s prices...');
    await downloader.downloadArchive(new Date());
    
  } else if (command === 'week') {
    console.log('\n📥 Downloading last 7 days...');
    await downloader.downloadLastNDays(7);
    
  } else if (command === 'month') {
    console.log('\n📥 Downloading last 30 days...');
    await downloader.downloadLastNDays(30);
    
  } else if (command === 'all') {
    console.log('\n📥 Downloading ALL available history (since Feb 8, 2024)...');
    console.log('⚠️  This may take a while and use several GB of disk space!');
    console.log('Continuing automatically...');
    
    const start = new Date('2024-02-08');
    const end = new Date();
    await downloader.downloadDateRange(start, end);
    
  } else if (command === 'process') {
    console.log('\n🔄 Processing downloaded archives...');
    await downloader.processArchives();
    
  } else if (command === 'info') {
    // Already printed above
  } else {
    console.log('\n💡 Usage:');
    console.log('  node tcgcsv_history_downloader.js today    # Download today');
    console.log('  node tcgcsv_history_downloader.js week     # Last 7 days');
    console.log('  node tcgcsv_history_downloader.js month    # Last 30 days');
    console.log('  node tcgcsv_history_downloader.js all      # All history');
    console.log('  node tcgcsv_history_downloader.js process  # Process downloaded archives');
    console.log('  node tcgcsv_history_downloader.js info     # Show current archives');
  }

  // Show final summary
  const finalInfo = downloader.getArchiveInfo();
  console.log(`\n${'='.repeat(70)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(70)}`);
  console.log(`Total Archives: ${finalInfo.count}`);
  console.log(`Total Size: ${finalInfo.totalSizeMB.toFixed(1)} MB`);
  if (finalInfo.oldest) {
    console.log(`Date Range: ${finalInfo.oldest.toISOString().split('T')[0]} to ${finalInfo.newest.toISOString().split('T')[0]}`);
    console.log(`\n📁 Archives saved to: ${downloader.archivesDir}`);
  }

  console.log('\n⚠️  NOTE: Files are compressed .7z format');
  console.log('   Install 7zip to extract:');
  console.log('     macOS:   brew install p7zip');
  console.log('     Ubuntu:  sudo apt-get install p7zip-full');
  console.log('     Windows: Download from https://www.7-zip.org/');
  console.log(`${'='.repeat(70)}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default TCGCSVHistoryDownloader;

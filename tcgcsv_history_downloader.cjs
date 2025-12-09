const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class TCGCSVHistoryDownloader {
  constructor(outputDir = 'price_history') {
    this.outputDir = path.resolve(outputDir);
    this.archivesDir = path.join(this.outputDir, 'archives');
    this.extractedDir = path.join(this.outputDir, 'extracted');
    this.processedDir = path.join(this.outputDir, 'processed');
    
    // Create directories
    [this.outputDir, this.archivesDir, this.extractedDir, this.processedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async check7zipInstalled() {
    try {
      await execAsync('/Users/NikFox/Downloads/7z2501-mac/7zz');
      return true;
    } catch (error) {
      console.log('❌ 7zip not found at expected path');
      return false;
    }
  }

  async downloadArchive(date) {
    const dateStr = date.toISOString().split('T')[0];
    const url = `https://tcgcsv.com/archive/tcgplayer/prices-${dateStr}.ppmd.7z`;
    const filename = `prices-${dateStr}.ppmd.7z`;
    const filepath = path.join(this.archivesDir, filename);

    // Skip if already downloaded
    if (fs.existsSync(filepath)) {
      console.log(`✓ Already have: ${filename}`);
      return filepath;
    }

    console.log(`📥 Downloading: ${filename}`);
    
    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buffer = await response.buffer();
      fs.writeFileSync(filepath, buffer);
      
      const sizeMB = (fs.statSync(filepath).size / 1024 / 1024).toFixed(1);
      console.log(`✅ Downloaded: ${filename} (${sizeMB} MB)`);
      return filepath;
    } catch (error) {
      console.log(`❌ Error downloading ${filename}: ${error.message}`);
      return null;
    }
  }

  async extractArchive(archivePath) {
    const archiveName = path.basename(archivePath, '.7z');
    const extractPath = path.join(this.extractedDir, archiveName);
    
    // Skip if already extracted
    if (fs.existsSync(extractPath)) {
      console.log(`✓ Already extracted: ${archiveName}`);
      return extractPath;
    }

    console.log(`📂 Extracting: ${path.basename(archivePath)}`);
    
    try {
      await execAsync(`/Users/NikFox/Downloads/7z2501-mac/7zz x "${archivePath}" -o"${this.extractedDir}" -y`);
      
      // Find the extracted directory
      const extractedDirs = fs.readdirSync(this.extractedDir).filter(dir => {
        const fullPath = path.join(this.extractedDir, dir);
        return fs.statSync(fullPath).isDirectory() && dir.startsWith(archiveName.replace('prices-', ''));
      });
      
      if (extractedDirs.length > 0) {
        const extractedDir = path.join(this.extractedDir, extractedDirs[0]);
        console.log(`✅ Extracted to: ${extractedDirs[0]}`);
        return extractedDir;
      } else {
        console.log(`❌ No extracted directory found for ${archiveName}`);
        return null;
      }
    } catch (error) {
      console.log(`❌ Error extracting: ${error.message}`);
      return null;
    }
  }

  async processPriceFile(priceFilePath, date) {
    try {
      const content = fs.readFileSync(priceFilePath, 'utf8');
      const data = JSON.parse(content);
      
      // Process the price data
      const records = [];
      if (Array.isArray(data)) {
        data.forEach(record => {
          if (record.productId && record.marketPrice !== undefined) {
            records.push({
              productId: record.productId,
              date: date,
              marketPrice: record.marketPrice,
              lowPrice: record.lowPrice,
              midPrice: record.midPrice,
              highPrice: record.highPrice,
              directLowPrice: record.directLowPrice,
              subTypeName: record.subTypeName
            });
          }
        });
      }
      
      return records;
    } catch (error) {
      console.log(`❌ Error processing ${priceFilePath}: ${error.message}`);
      return [];
    }
  }

  async processExtractedDirectory(extractedDir) {
    const date = path.basename(extractedDir);
    console.log(`📊 Processing price files in ${date}...`);
    
    const records = [];
    
    // Find all price files recursively
    const findPriceFiles = (dir) => {
      const files = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...findPriceFiles(fullPath));
        } else if (item === 'prices' || item.endsWith('.json')) {
          files.push(fullPath);
        }
      }
      
      return files;
    };
    
    const priceFiles = findPriceFiles(extractedDir);
    console.log(`📁 Found ${priceFiles.length} price files`);
    
    for (const priceFile of priceFiles) {
      const fileRecords = await this.processPriceFile(priceFile, date);
      records.push(...fileRecords);
    }
    
    console.log(`📊 Total records found: ${records.length}`);
    
    // Save processed data
    const processedFile = path.join(this.processedDir, `prices-${date}.json`);
    fs.writeFileSync(processedFile, JSON.stringify(records, null, 2));
    console.log(`✅ Processed: ${path.basename(processedFile)}`);
    
    return processedFile;
  }

  async downloadDateRange(startDate, endDate) {
    console.log('='.repeat(70));
    console.log('DOWNLOADING PRICE HISTORY');
    console.log(`From: ${startDate.toISOString().split('T')[0]}`);
    console.log(`To: ${endDate.toISOString().split('T')[0]}`);
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
    
    console.log('='.repeat(70));
    console.log(`Downloaded ${downloaded.length} archives`);
    console.log('='.repeat(70));
    
    return downloaded;
  }

  async downloadLastNDays(nDays = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - nDays);
    
    return this.downloadDateRange(startDate, endDate);
  }
}

// Main execution
async function main() {
  console.log('='.repeat(70));
  console.log('TCGCSV PRICE HISTORY DOWNLOADER');
  console.log('='.repeat(70));
  
  const downloader = new TCGCSVHistoryDownloader();
  
  // Check 7zip
  if (!(await downloader.check7zipInstalled())) {
    console.log('❌ 7zip not installed!');
    console.log('Please install 7zip and update the path in the script.');
    return;
  }
  
  // Download last 7 days
  console.log('\n📥 Downloading last 7 days...');
  const archives = await downloader.downloadLastNDays(7);
  
  // Process archives
  console.log('\n🔄 Processing archives...');
  for (const archive of archives) {
    const extractedDir = await downloader.extractArchive(archive);
    if (extractedDir) {
      await downloader.processExtractedDirectory(extractedDir);
    }
  }
  
  console.log('\n🎉 Historical data download complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TCGCSVHistoryDownloader;
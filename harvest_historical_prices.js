import TCGCSVHistoryDownloader from './tcgcsv_history_downloader.js';
import HistoricalPriceImporter from './import_historical_prices.js';
import fs from 'fs';
import path from 'path';

class HistoricalPriceHarvester {
  constructor() {
    this.downloader = new TCGCSVHistoryDownloader();
    this.importer = new HistoricalPriceImporter();
  }

  async harvestLastNDays(nDays = 30) {
    console.log('🌾 HARVESTING HISTORICAL PRICE DATA');
    console.log('='.repeat(70));
    console.log(`📅 Last ${nDays} days`);
    console.log('='.repeat(70));

    try {
      // Step 1: Download archives
      console.log('\n📥 Step 1: Downloading archives...');
      const downloaded = await this.downloader.downloadLastNDays(nDays);
      
      if (downloaded.length === 0) {
        console.log('❌ No archives downloaded');
        return;
      }

      // Step 2: Process archives
      console.log('\n🔄 Step 2: Processing archives...');
      const processed = await this.downloader.processArchives();
      
      if (processed === 0) {
        console.log('❌ No archives processed');
        return;
      }

      // Step 3: Import to database
      console.log('\n💾 Step 3: Importing to database...');
      await this.importer.importHistoricalData();

      // Step 4: Show stats
      console.log('\n📊 Step 4: Final statistics...');
      await this.importer.getImportStats();

      console.log('\n🎉 Historical price harvest complete!');

    } catch (error) {
      console.error('❌ Error during harvest:', error.message);
    }
  }

  async harvestAll() {
    console.log('🌾 HARVESTING ALL HISTORICAL PRICE DATA');
    console.log('='.repeat(70));
    console.log('📅 From Feb 8, 2024 to present');
    console.log('⚠️  This will download and process ALL available data');
    console.log('='.repeat(70));

    try {
      // Step 1: Download all archives
      console.log('\n📥 Step 1: Downloading ALL archives...');
      const startDate = new Date('2024-02-08');
      const endDate = new Date();
      const downloaded = await this.downloader.downloadDateRange(startDate, endDate);
      
      if (downloaded.length === 0) {
        console.log('❌ No archives downloaded');
        return;
      }

      // Step 2: Process archives
      console.log('\n🔄 Step 2: Processing archives...');
      const processed = await this.downloader.processArchives();
      
      if (processed === 0) {
        console.log('❌ No archives processed');
        return;
      }

      // Step 3: Import to database
      console.log('\n💾 Step 3: Importing to database...');
      await this.importer.importHistoricalData();

      // Step 4: Show stats
      console.log('\n📊 Step 4: Final statistics...');
      await this.importer.getImportStats();

      console.log('\n🎉 Complete historical price harvest finished!');

    } catch (error) {
      console.error('❌ Error during harvest:', error.message);
    }
  }

  async showStatus() {
    console.log('📊 HISTORICAL PRICE DATA STATUS');
    console.log('='.repeat(70));

    // Show downloader status
    const archiveInfo = this.downloader.getArchiveInfo();
    console.log('\n📁 Downloaded Archives:');
    console.log(`  Count: ${archiveInfo.count}`);
    console.log(`  Total Size: ${archiveInfo.totalSizeMB.toFixed(1)} MB`);
    if (archiveInfo.oldest) {
      console.log(`  Date Range: ${archiveInfo.oldest.toISOString().split('T')[0]} to ${archiveInfo.newest.toISOString().split('T')[0]}`);
    }

    // Show database status
    console.log('\n💾 Database Status:');
    await this.importer.getImportStats();
  }

  async quickUpdate() {
    console.log('⚡ QUICK UPDATE - Last 7 days');
    console.log('='.repeat(70));
    
    await this.harvestLastNDays(7);
  }
}

async function main() {
  const command = process.argv[2];
  const harvester = new HistoricalPriceHarvester();

  switch (command) {
    case 'quick':
      await harvester.quickUpdate();
      break;
      
    case 'week':
      await harvester.harvestLastNDays(7);
      break;
      
    case 'month':
      await harvester.harvestLastNDays(30);
      break;
      
    case 'all':
      await harvester.harvestAll();
      break;
      
    case 'status':
      await harvester.showStatus();
      break;
      
    default:
      console.log('🌾 TCGCSV HISTORICAL PRICE HARVESTER');
      console.log('='.repeat(70));
      console.log('💡 Usage:');
      console.log('  node harvest_historical_prices.js quick   # Last 7 days (quick update)');
      console.log('  node harvest_historical_prices.js week    # Last 7 days');
      console.log('  node harvest_historical_prices.js month   # Last 30 days');
      console.log('  node harvest_historical_prices.js all     # All history (since Feb 2024)');
      console.log('  node harvest_historical_prices.js status  # Show current status');
      console.log('\n📋 Prerequisites:');
      console.log('  1. Install 7zip: brew install p7zip (macOS)');
      console.log('  2. Ensure database is accessible');
      console.log('  3. Have sufficient disk space (several GB for full history)');
      console.log('\n🎯 Recommended workflow:');
      console.log('  1. Start with: node harvest_historical_prices.js quick');
      console.log('  2. Check status: node harvest_historical_prices.js status');
      console.log('  3. If successful, try: node harvest_historical_prices.js month');
      console.log('  4. For complete history: node harvest_historical_prices.js all');
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default HistoricalPriceHarvester;









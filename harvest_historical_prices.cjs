const TCGCSVHistoryDownloader = require('./tcgcsv_history_downloader.js');
const HistoricalPriceImporter = require('./import_historical_prices.js');

class HistoricalPriceHarvester {
  constructor() {
    this.downloader = new TCGCSVHistoryDownloader();
    this.importer = new HistoricalPriceImporter();
  }

  async harvestQuick() {
    console.log('🌾 HARVESTING HISTORICAL PRICE DATA');
    console.log('='.repeat(70));
    console.log('📅 Last 7 days (quick update)');
    console.log('='.repeat(70));
    
    try {
      // Step 1: Download archives
      console.log('\n📥 Step 1: Downloading archives...');
      const archives = await this.downloader.downloadLastNDays(7);
      
      // Step 2: Process archives
      console.log('\n🔄 Step 2: Processing archives...');
      for (const archive of archives) {
        const extractedDir = await this.downloader.extractArchive(archive);
        if (extractedDir) {
          await this.downloader.processExtractedDirectory(extractedDir);
        }
      }
      
      // Step 3: Import to database
      console.log('\n💾 Step 3: Importing to database...');
      await this.importer.connect();
      await this.importer.importAllFiles();
      await this.importer.close();
      
      // Step 4: Show stats
      console.log('\n📊 Step 4: Final statistics...');
      await this.importer.connect();
      await this.importer.getStats();
      await this.importer.close();
      
      console.log('\n🎉 Historical price harvest complete!');
      
    } catch (error) {
      console.error('❌ Error during harvest:', error);
    }
  }

  async harvestWeek() {
    console.log('🌾 HARVESTING HISTORICAL PRICE DATA');
    console.log('='.repeat(70));
    console.log('📅 Last 7 days');
    console.log('='.repeat(70));
    
    try {
      // Step 1: Download archives
      console.log('\n📥 Step 1: Downloading archives...');
      const archives = await this.downloader.downloadLastNDays(7);
      
      // Step 2: Process archives
      console.log('\n🔄 Step 2: Processing archives...');
      for (const archive of archives) {
        const extractedDir = await this.downloader.extractArchive(archive);
        if (extractedDir) {
          await this.downloader.processExtractedDirectory(extractedDir);
        }
      }
      
      // Step 3: Import to database
      console.log('\n💾 Step 3: Importing to database...');
      await this.importer.connect();
      await this.importer.importAllFiles();
      await this.importer.close();
      
      // Step 4: Show stats
      console.log('\n📊 Step 4: Final statistics...');
      await this.importer.connect();
      await this.importer.getStats();
      await this.importer.close();
      
      console.log('\n🎉 Historical price harvest complete!');
      
    } catch (error) {
      console.error('❌ Error during harvest:', error);
    }
  }

  async harvestMonth() {
    console.log('🌾 HARVESTING HISTORICAL PRICE DATA');
    console.log('='.repeat(70));
    console.log('📅 Last 30 days');
    console.log('='.repeat(70));
    
    try {
      // Step 1: Download archives
      console.log('\n📥 Step 1: Downloading archives...');
      const archives = await this.downloader.downloadLastNDays(30);
      
      // Step 2: Process archives
      console.log('\n🔄 Step 2: Processing archives...');
      for (const archive of archives) {
        const extractedDir = await this.downloader.extractArchive(archive);
        if (extractedDir) {
          await this.downloader.processExtractedDirectory(extractedDir);
        }
      }
      
      // Step 3: Import to database
      console.log('\n💾 Step 3: Importing to database...');
      await this.importer.connect();
      await this.importer.importAllFiles();
      await this.importer.close();
      
      // Step 4: Show stats
      console.log('\n📊 Step 4: Final statistics...');
      await this.importer.connect();
      await this.importer.getStats();
      await this.importer.close();
      
      console.log('\n🎉 Historical price harvest complete!');
      
    } catch (error) {
      console.error('❌ Error during harvest:', error);
    }
  }

  async showStatus() {
    console.log('📊 HISTORICAL PRICE DATA STATUS');
    console.log('='.repeat(70));
    
    try {
      await this.importer.connect();
      await this.importer.getStats();
      await this.importer.close();
    } catch (error) {
      console.error('❌ Error getting status:', error);
    }
  }
}

// Main execution
async function main() {
  const harvester = new HistoricalPriceHarvester();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'quick':
      await harvester.harvestQuick();
      break;
    case 'week':
      await harvester.harvestWeek();
      break;
    case 'month':
      await harvester.harvestMonth();
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
      console.log('  node harvest_historical_prices.js month    # Last 30 days');
      console.log('  node harvest_historical_prices.js status   # Show current status');
      console.log('');
      console.log('📋 Prerequisites:');
      console.log('  1. Install 7zip: brew install p7zip (macOS)');
      console.log('  2. Ensure database is accessible');
      console.log('  3. Have sufficient disk space (several GB for full history)');
      console.log('');
      console.log('🎯 Recommended workflow:');
      console.log('  1. Start with: node harvest_historical_prices.js quick');
      console.log('  2. Check status: node harvest_historical_prices.js status');
      console.log('  3. If successful, try: node harvest_historical_prices.js month');
      console.log('  4. For complete history: node harvest_historical_prices.js all');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = HistoricalPriceHarvester;
#!/usr/bin/env node

/**
 * Setup script for TCGdex API price collection
 * This script will:
 * 1. Test TCGdex API connection
 * 2. Update a sample of cards with real pricing data
 * 3. Set up automated price collection
 */

import tcgdexService from './src/services/tcgdexService.js';
import priceUpdateService from './src/services/priceUpdateService.js';

async function setupPriceCollection() {
  console.log('🚀 Setting up TCGdex API price collection...\n');

  try {
    // Initialize TCGdex service
    console.log('1. Testing TCGdex API connection...');
    const isConnected = await tcgdexService.testConnection();
    
    if (!isConnected) {
      console.log('❌ TCGdex API is not accessible');
      console.log('   This could be due to:');
      console.log('   - Network connectivity issues');
      console.log('   - API rate limiting');
      console.log('   - Service maintenance');
      return;
    }
    
    console.log('✅ TCGdex API connection successful!\n');

    // Test with a sample card
    console.log('2. Testing with sample card data...');
    const sampleCard = await tcgdexService.getCardData('Pikachu');
    
    if (sampleCard) {
      console.log('✅ Sample card data retrieved:');
      console.log(`   Card: ${sampleCard.name}`);
      console.log(`   Set: ${sampleCard.setName}`);
      console.log(`   Price: $${sampleCard.currentValue || 'N/A'}`);
      console.log(`   Market Price: $${sampleCard.marketPrice || 'N/A'}`);
    } else {
      console.log('⚠️ No sample card data retrieved');
    }

    console.log('\n3. Initializing price update service...');
    await priceUpdateService.initializeTCGdexService();

    console.log('\n4. Running initial price update for trending cards...');
    const results = await priceUpdateService.updateAllPrices();
    
    console.log('✅ Price update completed!');
    console.log(`   Updated ${results.updated} cards`);
    console.log(`   Failed: ${results.failed} cards`);
    console.log(`   Skipped: ${results.skipped} cards`);

    console.log('\n🎉 TCGdex API setup complete!');
    console.log('\nNext steps:');
    console.log('1. Set up a cron job to run price updates daily');
    console.log('2. Monitor the price history in your database');
    console.log('3. Use the price data in your app\'s charts and analytics');

  } catch (error) {
    console.error('❌ Error setting up price collection:', error);
  }
}

// Run the setup
setupPriceCollection();

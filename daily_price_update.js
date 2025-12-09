#!/usr/bin/env node

/**
 * Daily price update script
 * Run this script daily to collect fresh pricing data from TCGdex API
 * 
 * Usage:
 * node daily_price_update.js
 * 
 * Or set up as a cron job:
 * 0 9 * * * cd /path/to/Card_Collecting_app && node daily_price_update.js
 */

import PriceUpdateService from './src/services/priceUpdateService.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runDailyPriceUpdate() {
  const timestamp = new Date().toISOString();
  console.log(`🔄 Starting daily price update - ${timestamp}`);

  try {
    const priceUpdateService = new PriceUpdateService();
    
    // Initialize TCGdex service
    await priceUpdateService.initializeTCGdexService();
    
    // Update all prices
    const results = await priceUpdateService.updateAllPrices();
    
    console.log(`✅ Daily price update completed - ${new Date().toISOString()}`);
    console.log(`📊 Results:`);
    console.log(`   - Updated: ${results.updated} cards`);
    console.log(`   - Failed: ${results.failed} cards`);
    console.log(`   - Skipped: ${results.skipped} cards`);
    console.log(`   - Total processed: ${results.total} cards`);
    
    // Log to file for monitoring
    const logEntry = `${timestamp} - Updated: ${results.updated}, Failed: ${results.failed}, Skipped: ${results.skipped}\n`;
    
    // You can uncomment this to log to a file
    // require('fs').appendFileSync('price_update.log', logEntry);
    
  } catch (error) {
    console.error(`❌ Daily price update failed - ${timestamp}:`, error);
    
    // Log error to file
    const errorLog = `${timestamp} - ERROR: ${error.message}\n`;
    // require('fs').appendFileSync('price_update_errors.log', errorLog);
  }
}

// Run the daily update
runDailyPriceUpdate();


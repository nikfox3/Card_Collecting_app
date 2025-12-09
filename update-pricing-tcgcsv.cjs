#!/usr/bin/env node

/**
 * TCGCSV Daily Pricing Update Script
 * 
 * This script:
 * 1. Reads the TCGCSV set list from CSV
 * 2. Downloads latest pricing data from TCGCSV
 * 3. Processes and imports the data into the database
 * 4. Updates price_history table with new data
 * 5. Sends notifications on completion
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

// Configuration
const CONFIG = {
  databasePath: './cards.db',
  csvPath: './public/Pokemon database files/tcgcsv-set-products-prices.csv',
  logPath: './logs',
  maxConcurrent: 5, // Limit concurrent downloads
  retryAttempts: 3,
  retryDelay: 2000, // 2 seconds
  timeout: 30000 // 30 seconds
};

// Ensure logs directory exists
if (!fs.existsSync(CONFIG.logPath)) {
  fs.mkdirSync(CONFIG.logPath, { recursive: true });
}

// Logging utility
const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // Also write to log file
  const logFile = path.join(CONFIG.logPath, `pricing-update-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage + '\n');
};

// Database connection
let db;
const connectDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(CONFIG.databasePath, (err) => {
      if (err) {
        log(`Database connection failed: ${err.message}`, 'ERROR');
        reject(err);
      } else {
        log('Connected to database successfully');
        resolve();
      }
    });
  });
};

// HTTP request utility with retry logic
const makeRequest = (url, retries = CONFIG.retryAttempts) => {
  return new Promise((resolve, reject) => {
    const attempt = (attemptNumber) => {
      const req = https.get(url, { timeout: CONFIG.timeout }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            const error = new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
            if (attemptNumber < retries) {
              log(`Request failed, retrying... (${attemptNumber + 1}/${retries})`, 'WARN');
              setTimeout(() => attempt(attemptNumber + 1), CONFIG.retryDelay);
            } else {
              reject(error);
            }
          }
        });
      });
      
      req.on('error', (err) => {
        if (attemptNumber < retries) {
          log(`Request error, retrying... (${attemptNumber + 1}/${retries}): ${err.message}`, 'WARN');
          setTimeout(() => attempt(attemptNumber + 1), CONFIG.retryDelay);
        } else {
          reject(err);
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        const error = new Error('Request timeout');
        if (attemptNumber < retries) {
          log(`Request timeout, retrying... (${attemptNumber + 1}/${retries})`, 'WARN');
          setTimeout(() => attempt(attemptNumber + 1), CONFIG.retryDelay);
        } else {
          reject(error);
        }
      });
    };
    
    attempt(1);
  });
};

// Parse CSV data
const parseCSVData = (csvData) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    const stream = fs.createReadStream(csvData)
      .pipe(csv())
      .on('data', (row) => {
        results.push({
          groupId: row['Group ID'],
          groupName: row['Group Name'],
          productsUrl: row['Products'],
          pricesUrl: row['Prices']
        });
      })
      .on('end', () => {
        log(`Loaded ${results.length} sets from CSV`);
        resolve(results);
      })
      .on('error', (err) => {
        log(`CSV parsing error: ${err.message}`, 'ERROR');
        reject(err);
      });
  });
};

// Download and parse pricing data for a set
const downloadSetPrices = async (set) => {
  try {
    log(`Downloading prices for ${set.groupName} (ID: ${set.groupId})`);
    
    const pricesData = await makeRequest(set.pricesUrl);
    const jsonData = JSON.parse(pricesData);
    
    if (!jsonData.success || !jsonData.results || jsonData.results.length === 0) {
      log(`No price data for ${set.groupName}`, 'WARN');
      return [];
    }
    
    // Transform JSON data to our format
    const priceRecords = jsonData.results.map(record => ({
      productId: record.productId,
      lowPrice: record.lowPrice,
      midPrice: record.midPrice,
      highPrice: record.highPrice,
      marketPrice: record.marketPrice,
      directLowPrice: record.directLowPrice,
      subTypeName: record.subTypeName,
      groupId: set.groupId,
      groupName: set.groupName
    }));
    
    log(`Downloaded ${priceRecords.length} price records for ${set.groupName}`);
    return priceRecords;
    
  } catch (error) {
    log(`Failed to download prices for ${set.groupName}: ${error.message}`, 'ERROR');
    return [];
  }
};

// Process and import pricing data
const importPricingData = async (priceRecords) => {
  if (!priceRecords || priceRecords.length === 0) {
    log('No pricing data to import');
    return;
  }
  
  log(`Processing ${priceRecords.length} price records...`);
  
  let imported = 0;
  let errors = 0;
  const today = new Date().toISOString().split('T')[0];
  
  for (const record of priceRecords) {
    try {
      // Extract relevant fields from TCGCSV JSON format
      const productId = record.productId;
      const marketPrice = parseFloat(record.marketPrice || 0);
      const lowPrice = parseFloat(record.lowPrice || 0);
      const midPrice = parseFloat(record.midPrice || 0);
      const highPrice = parseFloat(record.highPrice || 0);
      const subType = record.subTypeName || 'Normal';
      
      if (!productId || marketPrice <= 0) {
        continue; // Skip invalid records
      }
      
      // Insert/update price history
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO price_history 
           (product_id, date, price, volume, condition, source)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [productId, today, marketPrice, 0, 'Near Mint', 'TCGCSV'],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      // Update current_value in products table
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE products SET 
           market_price = ?, 
           low_price = ?, 
           mid_price = ?, 
           high_price = ?,
           updated_at = CURRENT_TIMESTAMP
           WHERE product_id = ?`,
          [marketPrice, lowPrice, midPrice, highPrice, productId],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      imported++;
      
      if (imported % 100 === 0) {
        log(`Imported ${imported} price records...`);
      }
      
    } catch (error) {
      errors++;
      if (errors <= 10) { // Only log first 10 errors
        log(`Error importing price record: ${error.message}`, 'ERROR');
      }
    }
  }
  
  log(`Import complete: ${imported} imported, ${errors} errors`);
  return { imported, errors };
};

// Process sets in batches to avoid overwhelming the server
const processSetsInBatches = async (sets) => {
  const batches = [];
  for (let i = 0; i < sets.length; i += CONFIG.maxConcurrent) {
    batches.push(sets.slice(i, i + CONFIG.maxConcurrent));
  }
  
  let totalImported = 0;
  let totalErrors = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    log(`Processing batch ${i + 1}/${batches.length} (${batch.length} sets)`);
    
    const batchPromises = batch.map(set => downloadSetPrices(set));
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Collect all price records from this batch
    const allPriceRecords = [];
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allPriceRecords.push(...result.value);
      } else {
        log(`Failed to process set ${batch[index].groupName}: ${result.reason}`, 'ERROR');
      }
    });
    
    // Import all price records from this batch
    if (allPriceRecords.length > 0) {
      const importResult = await importPricingData(allPriceRecords);
      totalImported += importResult.imported;
      totalErrors += importResult.errors;
    }
    
    // Small delay between batches to be respectful to the server
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { totalImported, totalErrors };
};

// Send desktop notification (macOS)
const sendNotification = (title, message) => {
  try {
    const { exec } = require('child_process');
    exec(`osascript -e 'display notification "${message}" with title "${title}"'`);
  } catch (error) {
    log(`Failed to send notification: ${error.message}`, 'WARN');
  }
};

// Main execution
const main = async () => {
  try {
    log('🚀 Starting TCGCSV daily pricing update...');
    
    // Connect to database
    await connectDatabase();
    
    // Load sets from CSV
    const sets = await parseCSVData(CONFIG.csvPath);
    
    if (sets.length === 0) {
      log('No sets found in CSV file', 'ERROR');
      process.exit(1);
    }
    
    // Process sets in batches
    const result = await processSetsInBatches(sets);
    
    // Final summary
    log(`✅ Pricing update complete!`);
    log(`📊 Total imported: ${result.totalImported} price records`);
    log(`❌ Total errors: ${result.totalErrors}`);
    
    // Send notification
    sendNotification(
      'TCGCSV Pricing Update Complete',
      `Imported ${result.totalImported} price records with ${result.totalErrors} errors`
    );
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'ERROR');
    sendNotification(
      'TCGCSV Pricing Update Failed',
      `Error: ${error.message}`
    );
    process.exit(1);
  } finally {
    if (db) {
      db.close();
      log('Database connection closed');
    }
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully...');
  if (db) {
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully...');
  if (db) {
    db.close();
  }
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = { main, downloadSetPrices, importPricingData };
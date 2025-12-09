#!/usr/bin/env node

/**
 * Test script for TCGCSV automation
 * This will test with just a few sets to verify the system works
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

// Test configuration
const CONFIG = {
  databasePath: './cards.db',
  csvPath: './public/Pokemon database files/tcgcsv-set-products-prices.csv',
  maxTestSets: 3 // Only test with first 3 sets
};

// Logging utility
const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
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

// HTTP request utility
const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
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
    return { imported: 0, errors: 0 };
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
           (product_id, date, market_price, low_price, mid_price, high_price, sub_type_name)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [productId, today, marketPrice, lowPrice, midPrice, highPrice, subType],
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
      
      if (imported % 10 === 0) {
        log(`Imported ${imported} price records...`);
      }
      
    } catch (error) {
      errors++;
      if (errors <= 5) { // Only log first 5 errors
        log(`Error importing price record: ${error.message}`, 'ERROR');
      }
    }
  }
  
  log(`Import complete: ${imported} imported, ${errors} errors`);
  return { imported, errors };
};

// Main test function
const testAutomation = async () => {
  try {
    log('🧪 Testing TCGCSV automation with sample data...');
    
    // Connect to database
    await connectDatabase();
    
    // Load sets from CSV
    const allSets = await parseCSVData(CONFIG.csvPath);
    const testSets = allSets.slice(0, CONFIG.maxTestSets);
    
    log(`Testing with ${testSets.length} sets: ${testSets.map(s => s.groupName).join(', ')}`);
    
    let totalImported = 0;
    let totalErrors = 0;
    
    for (const set of testSets) {
      const priceRecords = await downloadSetPrices(set);
      if (priceRecords.length > 0) {
        const result = await importPricingData(priceRecords);
        totalImported += result.imported;
        totalErrors += result.errors;
      }
      
      // Small delay between sets
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Final summary
    log(`✅ Test complete!`);
    log(`📊 Total imported: ${totalImported} price records`);
    log(`❌ Total errors: ${totalErrors}`);
    
    // Check if data was actually inserted
    const countResult = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM price_history WHERE date = ?', [new Date().toISOString().split('T')[0]], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    log(`📈 Total price records added today: ${countResult.count}`);
    
  } catch (error) {
    log(`Test failed: ${error.message}`, 'ERROR');
  } finally {
    if (db) {
      db.close();
      log('Database connection closed');
    }
  }
};

// Run the test
if (require.main === module) {
  testAutomation();
}

module.exports = { testAutomation };

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📥 DOWNLOADING MORE HISTORICAL DATA');
console.log('=====================================');

// Download archives for the last 6 months
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 6);

const endDate = new Date();

console.log(`📅 Downloading from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

// Create a simple download script
const downloadScript = `
#!/bin/bash
cd /Users/NikFox/Documents/git/Card_Collecting_app

# Download archives for the last 6 months
for i in {0..180}; do
  date=$(date -v-${i}d +%Y-%m-%d)
  url="https://tcgcsv.com/archive/tcgplayer/prices-${date}.ppmd.7z"
  filename="price_history/archives/prices-${date}.ppmd.7z"
  
  if [ ! -f "$filename" ]; then
    echo "📥 Downloading: prices-${date}.ppmd.7z"
    curl -L -o "$filename" "$url" || echo "❌ Failed to download $date"
  else
    echo "✓ Already have: prices-${date}.ppmd.7z"
  fi
done
`;

fs.writeFileSync('download_history.sh', downloadScript);
execSync('chmod +x download_history.sh');

console.log('🚀 Created download_history.sh');
console.log('💡 Run: ./download_history.sh');
console.log('💡 Then run: node import_historical_prices.cjs');







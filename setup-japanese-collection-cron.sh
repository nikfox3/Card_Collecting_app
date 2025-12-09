#!/bin/bash

# Setup Japanese Cards Collection Cron Job
# This ensures Japanese cards are collected via TCGCSV on a regular schedule

cd /Users/NikFox/Documents/git/Card_Collecting_app

echo "🔄 Setting up Japanese Cards Collection..."
echo ""

# Make script executable
chmod +x collect-tcgcsv-products.js
echo "✅ Made collect-tcgcsv-products.js executable"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "collect-tcgcsv-products.js"; then
  echo "⚠️  Japanese collection cron job already exists"
  crontab -l | grep "collect-tcgcsv-products.js"
else
  echo ""
  echo "📋 Adding Japanese cards collection cron job..."
  
  # Add cron job to run weekly on Sunday at 4 AM (after the daily pricing collection)
  # This collects products and prices from TCGCSV for both English and Japanese sets
  JAPANESE_JOB="0 4 * * 0 cd /Users/NikFox/Documents/git/Card_Collecting_app && /usr/local/bin/node collect-tcgcsv-products.js >> logs/tcgcsv-collection.log 2>&1"
  
  (crontab -l 2>/dev/null; echo "$JAPANESE_JOB") | crontab -
  echo "✅ Japanese cards collection cron job added"
fi

echo ""
echo "📊 Japanese Cards Collection Schedule:"
echo "   • Runs weekly on Sunday at 4 AM"
echo "   • Collects products and prices from TCGCSV"
echo "   • Includes both English and Japanese sets"
echo "   • Updates card information (HP, attacks, etc.)"
echo "   • Updates pricing data"
echo ""

# Verify the script includes Japanese sets
echo "🔍 Verifying Japanese sets are included..."
if grep -q "Japanese-Table 1.csv" collect-tcgcsv-products.js; then
  echo "✅ Japanese sets CSV file is referenced in the script"
else
  echo "⚠️  Warning: Japanese sets CSV file not found in script"
fi

echo ""
echo "✅ Japanese cards collection setup complete!"
echo ""
echo "📝 Summary:"
echo "   • Weekly collection: Sunday at 4 AM"
echo "   • Script: collect-tcgcsv-products.js"
echo "   • Logs: logs/tcgcsv-collection.log"
echo ""
echo "To run manually: node collect-tcgcsv-products.js"
echo "To check logs: tail -f logs/tcgcsv-collection.log"


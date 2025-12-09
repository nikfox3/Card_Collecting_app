#!/bin/bash

# Setup script for TCGCSV pricing automation
# This script installs dependencies and sets up cron/launchd automation

echo "🚀 Setting up TCGCSV pricing automation..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install required npm packages
echo "📦 Installing required packages..."
npm install csv-parser sqlite3

# Make the script executable
chmod +x update-pricing-tcgcsv.cjs

# Create logs directory
mkdir -p logs

# Test the script
echo "🧪 Testing the pricing script..."
node update-pricing-tcgcsv.cjs

if [ $? -eq 0 ]; then
    echo "✅ Script test successful!"
else
    echo "❌ Script test failed. Please check the logs."
    exit 1
fi

# Setup macOS LaunchAgent
echo "🔧 Setting up macOS LaunchAgent..."

# Copy plist to LaunchAgents directory
cp com.cardcollectingapp.pricing-update.plist ~/Library/LaunchAgents/

# Load the LaunchAgent
launchctl load ~/Library/LaunchAgents/com.cardcollectingapp.pricing-update.plist

echo "✅ LaunchAgent loaded successfully!"

# Setup cron job as backup (optional)
echo "⏰ Setting up cron job as backup..."
(crontab -l 2>/dev/null; echo "0 2 * * * cd /Users/NikFox/Documents/git/Card_Collecting_app && node update-pricing-tcgcsv.js >> logs/cron-pricing.log 2>&1") | crontab -

echo "✅ Cron job added successfully!"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 What was set up:"
echo "   • TCGCSV pricing script with CSV configuration"
echo "   • macOS LaunchAgent (runs daily at 2 AM)"
echo "   • Cron job backup (runs daily at 2 AM)"
echo "   • Logging to logs/pricing-update.log"
echo ""
echo "📁 Files created:"
echo "   • update-pricing-tcgcsv.cjs - Main pricing script"
echo "   • tcgcsv-sets-working.csv - Set configuration (5 reliable sets included)"
echo "   • tcgcsv-sets.csv - Full set configuration (114+ sets, many may have access issues)"
echo "   • com.cardcollectingapp.pricing-update.plist - macOS automation"
echo "   • setup-pricing-automation.sh - This setup script"
echo ""
echo "🔧 To manage the automation:"
echo "   • Check status: launchctl list | grep pricing"
echo "   • Stop: launchctl unload ~/Library/LaunchAgents/com.cardcollectingapp.pricing-update.plist"
echo "   • Start: launchctl load ~/Library/LaunchAgents/com.cardcollectingapp.pricing-update.plist"
echo "   • Manual run: node update-pricing-tcgcsv.cjs"
echo ""
echo "📊 To customize which sets to update:"
echo "   • Edit tcgcsv-sets-working.csv for reliable sets (currently 5 sets)"
echo "   • Edit tcgcsv-sets.csv for full set list (114+ sets, many may have access issues)"
echo "   • Set 'enabled' column to 'false' to disable sets"
echo "   • Adjust 'priority' column to change processing order"
echo ""
echo "⚠️  Note: Many TCGCSV endpoints have access restrictions. Start with the working sets"
echo "   and gradually add more sets as you verify they're accessible."

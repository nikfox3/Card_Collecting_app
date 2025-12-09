#!/bin/bash

echo "🔍 Checking TCGCSV Pricing Automation Status"
echo "=============================================="

# Check if LaunchAgent is loaded
echo "📋 LaunchAgent Status:"
launchctl list | grep pricing

echo ""
echo "📊 Recent Pricing Data:"
echo "----------------------"

# Check recent price history entries
sqlite3 cards.db "SELECT COUNT(*) as total_records FROM price_history WHERE date >= date('now', '-7 days');"

echo "📈 Price records added in last 7 days"

# Check today's entries
sqlite3 cards.db "SELECT COUNT(*) as today_records FROM price_history WHERE date = date('now');"

echo "📅 Price records added today"

# Check latest entries
echo ""
echo "🕒 Latest Price Updates:"
sqlite3 cards.db "SELECT date, COUNT(*) as records FROM price_history GROUP BY date ORDER BY date DESC LIMIT 5;"

echo ""
echo "✅ Automation Status Check Complete"







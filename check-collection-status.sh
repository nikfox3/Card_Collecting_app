#!/bin/bash

# Check Collection Progress

cd /Users/NikFox/Documents/git/Card_Collecting_app

echo "📊 Collection Progress Monitor"
echo "=============================="
echo ""

# Check if collection is running
PROCESS_COUNT=$(ps aux | grep "collect-all-cards-pricing.js" | grep -v grep | wc -l | xargs)

if [ "$PROCESS_COUNT" -gt 0 ]; then
    echo "✅ Collection is RUNNING"
    echo ""
    ps aux | grep "collect-all-cards-pricing.js" | grep -v grep | head -1
    echo ""
else
    echo "ℹ️  Collection is NOT running"
    echo ""
fi

# Check recent records
echo "📈 Database Status:"
TODAY_RECORDS=$(sqlite3 cards.db "SELECT COUNT(*) FROM price_history WHERE source LIKE 'pokemonpricetracker-%' AND date = date('now');" 2>/dev/null || echo "0")
TOTAL_RECORDS=$(sqlite3 cards.db "SELECT COUNT(*) FROM price_history WHERE source LIKE 'pokemonpricetracker-%';" 2>/dev/null || echo "0")
UNIQUE_CARDS=$(sqlite3 cards.db "SELECT COUNT(DISTINCT product_id) FROM price_history WHERE source LIKE 'pokemonpricetracker-%';" 2>/dev/null || echo "0")

echo "   Records collected today: $TODAY_RECORDS"
echo "   Total records in database: $TOTAL_RECORDS"
echo "   Unique cards in database: $UNIQUE_CARDS"
echo ""

# Check recent log
if [ -f "logs/manual-second-half-$(date +%Y%m%d).log" ]; then
    echo "📄 Recent Log Output:"
    tail -20 "logs/manual-second-half-$(date +%Y%m%d).log"
    echo ""
fi

# Estimate progress
if [ "$TODAY_RECORDS" -gt 49 ]; then
    ESTIMATED_CARDS=$((TODAY_RECORDS / 7))
    echo "📊 Estimated Progress:"
    echo "   Cards processed: ~$ESTIMATED_CARDS / 9,899"
    echo "   Progress: $((ESTIMATED_CARDS * 100 / 9899))%"
    echo ""
fi

echo "💡 Commands:"
echo "   Watch log: tail -f logs/manual-second-half-$(date +%Y%m%d).log"
echo "   Check status: ./check-collection-status.sh"
echo "   Kill process: pkill -f collect-all-cards-pricing.js"




#!/bin/bash

# Monitor Rolling Collection Status

cd /Users/NikFox/Documents/git/Card_Collecting_app

echo "🔄 Rolling Collection Monitor"
echo "============================"
echo ""

# Check cron job
echo "📋 Cron Job Status:"
if crontab -l 2>/dev/null | grep -q "rolling-collection.sh"; then
    echo "✅ Cron job is active"
    crontab -l | grep "rolling-collection.sh"
else
    echo "❌ No cron job found"
fi
echo ""

# Check today's schedule
echo "📅 Today's Schedule:"
TODAY=$(date +%A)
DAY_OF_WEEK=$(date +%u)
if [ $((DAY_OF_WEEK % 2)) -eq 1 ]; then
    echo "✅ Today ($TODAY): Collecting FIRST HALF (cards 1-9,899)"
else
    echo "✅ Today ($TODAY): Collecting SECOND HALF (cards 9,900-19,798)"
fi
echo ""

# Check recent logs
echo "📁 Recent Log Files:"
if [ -d "logs" ]; then
    ls -la logs/rolling-collection-*.log 2>/dev/null | tail -5 || echo "No log files found"
else
    echo "No logs directory found"
fi
echo ""

# Check database records
echo "📊 Database Status:"
TODAY_RECORDS=$(sqlite3 cards.db "SELECT COUNT(*) FROM price_history WHERE source LIKE 'pokemonpricetracker-%' AND date = date('now');" 2>/dev/null || echo "0")
TOTAL_RECORDS=$(sqlite3 cards.db "SELECT COUNT(*) FROM price_history WHERE source LIKE 'pokemonpricetracker-%';" 2>/dev/null || echo "0")
UNIQUE_CARDS=$(sqlite3 cards.db "SELECT COUNT(DISTINCT product_id) FROM price_history WHERE source LIKE 'pokemonpricetracker-%';" 2>/dev/null || echo "0")

echo "   Records today: $TODAY_RECORDS"
echo "   Total records: $TOTAL_RECORDS"
echo "   Unique cards: $UNIQUE_CARDS"
echo ""

# Check last collection date
echo "📈 Last Collection:"
LAST_DATE=$(sqlite3 cards.db "SELECT MAX(date) FROM price_history WHERE source LIKE 'pokemonpricetracker-%';" 2>/dev/null || echo "Never")
echo "   Last collection: $LAST_DATE"
echo ""

# Show next few days schedule
echo "📅 Upcoming Schedule:"
for i in {0..6}; do
    DATE=$(date -d "+$i days" +%Y-%m-%d)
    DAY=$(date -d "+$i days" +%A)
    DAY_NUM=$(date -d "+$i days" +%u)
    
    if [ $((DAY_NUM % 2)) -eq 1 ]; then
        HALF="First Half (1-9,899)"
    else
        HALF="Second Half (9,900-19,798)"
    fi
    
    if [ $i -eq 0 ]; then
        echo "   $DATE ($DAY): $HALF ← TODAY"
    else
        echo "   $DATE ($DAY): $HALF"
    fi
done
echo ""

echo "🔍 Monitor Commands:"
echo "   Watch logs: tail -f logs/rolling-collection-\$(date +%Y%m%d).log"
echo "   Run manually: ./rolling-collection.sh"
echo "   Check cron: crontab -l"




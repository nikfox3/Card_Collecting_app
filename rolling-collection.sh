#!/bin/bash

# Rolling Collection Script - 2-Day Cycle
# Collects half the cards each day to maximize coverage within credit limits

cd /Users/NikFox/Documents/git/Card_Collecting_app

# Configuration
TOTAL_CREDITS=19798
CARDS_PER_DAY=$((TOTAL_CREDITS / 2))  # 9,899 cards per day
LOG_DIR="logs"
mkdir -p "$LOG_DIR"

# Get current day of week (0=Sunday, 1=Monday, etc.)
DAY_OF_WEEK=$(date +%u)

# Determine which half to collect today
if [ $((DAY_OF_WEEK % 2)) -eq 1 ]; then
    # Odd days (Mon, Wed, Fri, Sun): First half
    OFFSET=0
    HALF="First Half"
    LOG_FILE="$LOG_DIR/rolling-collection-first-$(date +%Y%m%d).log"
else
    # Even days (Tue, Thu, Sat): Second half  
    OFFSET=$CARDS_PER_DAY
    HALF="Second Half"
    LOG_FILE="$LOG_DIR/rolling-collection-second-$(date +%Y%m%d).log"
fi

echo "🔄 Rolling Collection - $HALF" | tee -a "$LOG_FILE"
echo "Date: $(date)" | tee -a "$LOG_FILE"
echo "Day of week: $DAY_OF_WEEK" | tee -a "$LOG_FILE"
echo "Cards per day: $CARDS_PER_DAY" | tee -a "$LOG_FILE"
echo "Offset: $OFFSET" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Run the collection
/usr/local/bin/node collect-all-cards-pricing.js \
  --limit=$CARDS_PER_DAY \
  --offset=$OFFSET \
  --credit-limit=$TOTAL_CREDITS \
  >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ $HALF collection completed successfully" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    # Show summary
    /usr/bin/sqlite3 cards.db "
      SELECT 
        'Today' as period,
        COUNT(*) as records,
        COUNT(DISTINCT product_id) as unique_cards
      FROM price_history
      WHERE source LIKE 'pokemonpricetracker-%'
        AND date = date('now')
      UNION ALL
      SELECT 
        'Last 7 days' as period,
        COUNT(*) as records,
        COUNT(DISTINCT product_id) as unique_cards
      FROM price_history
      WHERE source LIKE 'pokemonpricetracker-%'
        AND date >= date('now', '-7 days')
      ORDER BY period;
    " >> "$LOG_FILE"
    
    echo "==========================================" | tee -a "$LOG_FILE"
else
    echo "" | tee -a "$LOG_FILE"
    echo "❌ $HALF collection failed with exit code $EXIT_CODE" | tee -a "$LOG_FILE"
fi

exit $EXIT_CODE


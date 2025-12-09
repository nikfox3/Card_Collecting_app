#!/bin/bash

# Daily Condition-Based Pricing Collection Script
# Collects condition pricing for top 50 cards and stores in database

cd /Users/NikFox/Documents/git/Card_Collecting_app

# Set up logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/condition-pricing-$(date +%Y%m%d).log"
ERROR_LOG="$LOG_DIR/condition-pricing-error-$(date +%Y%m%d).log"

echo "==========================================" | tee -a "$LOG_FILE"
echo "Daily Condition Pricing Collection" | tee -a "$LOG_FILE"
echo "Date: $(date)" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Run the collector
node collect-condition-graded-pricing-v2.js >> "$LOG_FILE" 2>> "$ERROR_LOG"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ Collection completed successfully" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    # Show summary
    sqlite3 cards.db "SELECT 
        date,
        condition,
        COUNT(*) as records,
        COUNT(DISTINCT product_id) as unique_cards
      FROM price_history
      WHERE source LIKE 'pokemonpricetracker-%'
        AND date = date('now')
      GROUP BY date, condition
      ORDER BY date DESC, records DESC
      LIMIT 20;" >> "$LOG_FILE"
    
    echo "==========================================" | tee -a "$LOG_FILE"
else
    echo "" | tee -a "$LOG_FILE"
    echo "❌ Collection failed with exit code $EXIT_CODE" | tee -a "$LOG_FILE"
    echo "Check $ERROR_LOG for details" | tee -a "$LOG_FILE"
fi

exit $EXIT_CODE




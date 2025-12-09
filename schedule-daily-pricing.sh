#!/bin/bash

# Daily Pokemon Price Tracker Collection Script
# Run this script daily via cron to collect pricing data

cd /Users/NikFox/Documents/git/Card_Collecting_app

# Set up logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/pricing-collector-$(date +%Y%m%d).log"

echo "==========================================" | tee -a "$LOG_FILE"
echo "Daily Pricing Collection - $(date)" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Run the collector
node daily-pricing-collector.js 2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ Collection completed successfully" | tee -a "$LOG_FILE"
else
    echo "" | tee -a "$LOG_FILE"
    echo "❌ Collection failed with exit code $EXIT_CODE" | tee -a "$LOG_FILE"
fi

echo "==========================================" | tee -a "$LOG_FILE"

exit $EXIT_CODE




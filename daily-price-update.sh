#!/bin/bash

################################################################################
# Daily Price Update Script
# 
# This script automatically:
# 1. Collects latest prices from Pokemon TCG API
# 2. Archives current prices to history
# 3. Imports new prices
# 4. Logs the results
#
# Usage: ./daily-price-update.sh
# Or set up as cron job: crontab -e
# Add: 0 2 * * * /path/to/daily-price-update.sh
################################################################################

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration
LOG_DIR="$SCRIPT_DIR/logs"
BACKUP_DIR="$SCRIPT_DIR/backups"
CSV_DIR="$SCRIPT_DIR/public/Pokemon database files"
LOG_FILE="$LOG_DIR/price-update-$(date +%Y%m%d).log"
DB_FILE="$SCRIPT_DIR/database/cards.db"

# Create directories if they don't exist
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "🚀 Starting Daily Price Update"
log "=========================================="

# Step 1: Backup current database
log "📦 Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/cards-$(date +%Y%m%d-%H%M%S).db"
cp "$DB_FILE" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    log "✅ Database backed up to: $BACKUP_FILE"
    
    # Keep only last 7 days of backups
    find "$BACKUP_DIR" -name "cards-*.db" -mtime +7 -delete
    log "🧹 Cleaned up old backups (>7 days)"
else
    log "❌ Database backup failed!"
    exit 1
fi

# Step 2: Collect latest prices
log ""
log "💰 Collecting latest prices from Pokemon TCG API..."

if [ -f "$SCRIPT_DIR/update-prices-with-validation.js" ]; then
    node "$SCRIPT_DIR/update-prices-with-validation.js" >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        log "✅ Price collection completed"
        
        # Check if CSV was created
        CSV_FILE="$SCRIPT_DIR/price-updates-$(date +%Y-%m-%d).csv"
        if [ -f "$CSV_FILE" ]; then
            CSV_SIZE=$(wc -l < "$CSV_FILE")
            log "📄 CSV created with $CSV_SIZE lines"
        else
            log "⚠️  CSV file not found, checking for alternative location..."
            CSV_FILE=$(find "$SCRIPT_DIR" -name "pokemon-price-*.csv" -mtime -1 | head -1)
            if [ -n "$CSV_FILE" ]; then
                log "✅ Found CSV: $CSV_FILE"
            else
                log "❌ No CSV file found!"
                exit 1
            fi
        fi
    else
        log "❌ Price collection failed!"
        exit 1
    fi
else
    log "⚠️  Price collection script not found, skipping..."
fi

# Step 3: Import prices with history preservation
log ""
log "📊 Importing prices with history preservation..."

if [ -f "$SCRIPT_DIR/import-prices-with-history.cjs" ]; then
    node "$SCRIPT_DIR/import-prices-with-history.cjs" >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        log "✅ Price import completed successfully"
        
        # Get import statistics from database
        TOTAL_HISTORY=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM price_history;")
        CARDS_WITH_PRICING=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM cards WHERE current_value > 0;")
        
        log "📈 Statistics:"
        log "   - Total price history records: $TOTAL_HISTORY"
        log "   - Cards with pricing: $CARDS_WITH_PRICING"
    else
        log "❌ Price import failed!"
        log "💡 Restoring from backup..."
        cp "$BACKUP_FILE" "$DB_FILE"
        log "✅ Database restored from backup"
        exit 1
    fi
else
    log "❌ Import script not found!"
    exit 1
fi

# Step 4: Restart API server (if running)
log ""
log "🔄 Checking if API server needs restart..."

SERVER_PID=$(pgrep -f "node server/server.js")
if [ -n "$SERVER_PID" ]; then
    log "🔄 Restarting API server (PID: $SERVER_PID)..."
    pkill -f "node server/server.js"
    sleep 2
    
    # Start server in background
    cd "$SCRIPT_DIR"
    nohup node server/server.js > "$LOG_DIR/server-$(date +%Y%m%d).log" 2>&1 &
    
    NEW_PID=$!
    log "✅ API server restarted (New PID: $NEW_PID)"
else
    log "ℹ️  API server not running, skipping restart"
fi

# Step 5: Send notification (optional - requires additional setup)
log ""
log "📧 Sending completion notification..."

# Uncomment and configure if you want email notifications
# echo "Daily price update completed successfully at $(date)" | mail -s "Pokemon Card Prices Updated" your-email@example.com

# Or use macOS notification
if command -v osascript &> /dev/null; then
    osascript -e "display notification \"Daily price update completed: $CARDS_WITH_PRICING cards updated\" with title \"Pokemon Card Collector\""
    log "✅ Desktop notification sent"
fi

# Step 6: Generate summary report
log ""
log "📝 Generating summary report..."

SUMMARY_FILE="$LOG_DIR/summary-$(date +%Y%m%d).txt"

cat > "$SUMMARY_FILE" << EOF
Daily Price Update Summary
==========================
Date: $(date +'%Y-%m-%d %H:%M:%S')

Statistics:
- Total price history records: $TOTAL_HISTORY
- Cards with current pricing: $CARDS_WITH_PRICING
- Database backup: $BACKUP_FILE
- Log file: $LOG_FILE

Status: SUCCESS ✅
EOF

log "✅ Summary report saved: $SUMMARY_FILE"

# Final summary
log ""
log "=========================================="
log "✅ Daily Price Update Complete!"
log "=========================================="
log ""
log "Summary:"
log "  📦 Database backed up"
log "  💰 Prices collected"
log "  📊 Prices imported with history"
log "  🔄 API server restarted (if running)"
log "  📧 Notification sent"
log ""
log "Next update: $(date -v+1d +'%Y-%m-%d %H:%M:%S')"
log ""

exit 0


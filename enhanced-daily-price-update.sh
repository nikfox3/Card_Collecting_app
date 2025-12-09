#!/bin/bash

################################################################################
# Enhanced Daily Price Update Script
# 
# This script provides robust, automated price collection with:
# 1. Primary: Pokemon TCG API (TCGplayer pricing)
# 2. Fallback: TCGdx API (TCGplayer + Cardmarket)
# 3. Comprehensive error handling and logging
# 4. Automatic retry mechanisms
# 5. Database backup and recovery
#
# Usage: ./enhanced-daily-price-update.sh
# Or set up as cron job: crontab -e
# Add: 0 2 * * * /path/to/enhanced-daily-price-update.sh
################################################################################

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration
LOG_DIR="$SCRIPT_DIR/logs"
BACKUP_DIR="$SCRIPT_DIR/backups"
DB_FILE="$SCRIPT_DIR/cards.db"
LOG_FILE="$LOG_DIR/price-update-$(date +%Y%m%d).log"
ERROR_LOG="$LOG_DIR/price-update-errors-$(date +%Y%m%d).log"

# Create directories if they don't exist
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to log errors
log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ERROR_LOG"
}

# Function to send notification (can be extended for email/Slack/etc.)
notify() {
    local message="$1"
    local level="$2"
    
    log "$message"
    
    # Add notification logic here (email, Slack, etc.)
    # Example: curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$message\"}" \
    #   "$SLACK_WEBHOOK_URL"
}

log "=========================================="
log "🚀 Starting Enhanced Daily Price Update"
log "=========================================="

# Step 1: Pre-flight checks
log "🔍 Running pre-flight checks..."

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    log_error "Database file not found: $DB_FILE"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed or not in PATH"
    exit 1
fi

# Check if required packages are installed
if [ ! -d "node_modules" ]; then
    log "📦 Installing required packages..."
    npm install sqlite3 node-fetch
    if [ $? -ne 0 ]; then
        log_error "Failed to install required packages"
        exit 1
    fi
fi

log "✅ Pre-flight checks passed"

# Step 2: Create database backup
log ""
log "📦 Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/cards-$(date +%Y%m%d-%H%M%S).db"
cp "$DB_FILE" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    log "✅ Database backed up to: $BACKUP_FILE"
    
    # Keep only last 14 days of backups
    find "$BACKUP_DIR" -name "cards-*.db" -mtime +14 -delete
    log "🧹 Cleaned up old backups (>14 days)"
else
    log_error "Database backup failed!"
    exit 1
fi

# Step 3: Test API connectivity
log ""
log "🌐 Testing API connectivity..."

# Test Pokemon TCG API
log "   Testing Pokemon TCG API..."
if curl -s --max-time 10 "https://api.pokemontcg.io/v2/cards/base1-1" > /dev/null; then
    log "   ✅ Pokemon TCG API is accessible"
else
    log_error "   ❌ Pokemon TCG API is not accessible"
    # Continue anyway, TCGdx API might work
fi

# Test TCGdx API
log "   Testing TCGdx API..."
if curl -s --max-time 10 "https://api.tcgdex.net/v2/en/cards/base1-1" > /dev/null; then
    log "   ✅ TCGdx API is accessible"
else
    log_error "   ❌ TCGdx API is not accessible"
    # This is critical - we need at least one API
    log_error "   🚨 No APIs are accessible! Aborting..."
    exit 1
fi

# Step 4: Run price collection
log ""
log "💰 Starting price collection..."

if [ -f "$SCRIPT_DIR/robust-price-collector.js" ]; then
    # Run the robust price collector
    node "$SCRIPT_DIR/robust-price-collector.js" >> "$LOG_FILE" 2>&1
    COLLECTION_EXIT_CODE=$?
    
    if [ $COLLECTION_EXIT_CODE -eq 0 ]; then
        log "✅ Price collection completed successfully"
        
        # Check if CSV was created
        CSV_FILE="$SCRIPT_DIR/price-updates-$(date +%Y-%m-%d).csv"
        if [ -f "$CSV_FILE" ]; then
            CSV_SIZE=$(wc -l < "$CSV_FILE")
            log "📄 CSV created with $CSV_SIZE lines"
            
            # Move CSV to backup directory
            mv "$CSV_FILE" "$BACKUP_DIR/"
            log "📁 CSV moved to backup directory"
        else
            log "⚠️  CSV file not found"
        fi
        
        # Get collection statistics
        if command -v sqlite3 &> /dev/null; then
            STATS=$(sqlite3 "$DB_FILE" "SELECT * FROM price_collection_stats WHERE date = '$(date +%Y-%m-%d)' ORDER BY created_at DESC LIMIT 1;")
            if [ ! -z "$STATS" ]; then
                log "📊 Collection statistics: $STATS"
            fi
        fi
        
    else
        log_error "❌ Price collection failed with exit code: $COLLECTION_EXIT_CODE"
        
        # Attempt recovery
        log "🔄 Attempting recovery..."
        
        # Restore from backup if collection failed
        if [ -f "$BACKUP_FILE" ]; then
            log "🔄 Restoring database from backup..."
            cp "$BACKUP_FILE" "$DB_FILE"
            if [ $? -eq 0 ]; then
                log "✅ Database restored from backup"
            else
                log_error "❌ Failed to restore database from backup"
            fi
        fi
        
        # Send notification about failure
        notify "Price collection failed! Database restored from backup." "ERROR"
        exit 1
    fi
    
else
    log_error "❌ Robust price collector script not found!"
    exit 1
fi

# Step 5: Post-collection validation
log ""
log "🔍 Running post-collection validation..."

# Check if any prices were updated
UPDATED_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM cards WHERE updated_at >= date('now', '-1 day');")
log "📊 Cards updated in last 24 hours: $UPDATED_COUNT"

# Check for cards without prices
NO_PRICE_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM cards WHERE current_value = 0 OR current_value IS NULL;")
log "📊 Cards without prices: $NO_PRICE_COUNT"

# Check price history
HISTORY_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM price_history WHERE date = '$(date +%Y-%m-%d)';")
log "📊 Price history records for today: $HISTORY_COUNT"

# Step 6: Generate summary report
log ""
log "📋 GENERATION SUMMARY REPORT"
log "=========================================="
log "📅 Date: $(date +'%Y-%m-%d %H:%M:%S')"
log "📦 Database backup: $BACKUP_FILE"
log "📄 Log file: $LOG_FILE"
log "✅ Collection status: SUCCESS"
log "📊 Cards updated: $UPDATED_COUNT"
log "📊 Cards without prices: $NO_PRICE_COUNT"
log "📊 Price history records: $HISTORY_COUNT"

# Step 7: Cleanup old logs
log ""
log "🧹 Cleaning up old logs..."
find "$LOG_DIR" -name "*.log" -mtime +30 -delete
log "✅ Cleaned up logs older than 30 days"

# Step 8: Send success notification
if [ $NO_PRICE_COUNT -gt 0 ]; then
    notify "Price collection completed with $NO_PRICE_COUNT cards still missing prices." "WARNING"
else
    notify "Price collection completed successfully! All cards have prices." "SUCCESS"
fi

log ""
log "🎉 Enhanced daily price update completed successfully!"
log "=========================================="

exit 0

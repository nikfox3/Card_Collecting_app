#!/bin/bash

# Simple file-based backup script
# Creates timestamped backups every 10 minutes

PROJECT_DIR="/Users/NikFox/Documents/git/Card_Collecting_app"
BACKUP_DIR="/Users/NikFox/Documents/git/Card_Collecting_app_backups"
BACKUP_INTERVAL=600  # 10 minutes

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting simple auto-backup..."
echo "Backup interval: $BACKUP_INTERVAL seconds"
echo "Backup directory: $BACKUP_DIR"

while true; do
    TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    BACKUP_NAME="Card_Collecting_app_backup_$TIMESTAMP"
    
    echo "$(date): Creating backup: $BACKUP_NAME"
    
    # Create backup
    cp -r "$PROJECT_DIR" "$BACKUP_DIR/$BACKUP_NAME"
    
    # Keep only the last 10 backups to save space
    cd "$BACKUP_DIR"
    ls -t | tail -n +11 | xargs -r rm -rf
    
    echo "$(date): Backup completed: $BACKUP_NAME"
    
    # Wait for next backup
    sleep $BACKUP_INTERVAL
done

#!/bin/bash

# Auto-backup script for Card Collecting App
# This script will automatically commit and push changes every 5 minutes

PROJECT_DIR="/Users/NikFox/Documents/git/Card_Collecting_app"
BACKUP_INTERVAL=300  # 5 minutes in seconds

echo "Starting auto-backup for Card Collecting App..."
echo "Backup interval: $BACKUP_INTERVAL seconds"
echo "Project directory: $PROJECT_DIR"

while true; do
    cd "$PROJECT_DIR"
    
    # Check if there are any changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "$(date): Changes detected, creating backup..."
        
        # Add all changes
        git add .
        
        # Create commit with timestamp
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        git commit -m "Auto-backup: $TIMESTAMP"
        
        # Push to remote (if configured)
        git push origin main 2>/dev/null || echo "No remote repository configured"
        
        echo "$(date): Backup completed"
    else
        echo "$(date): No changes detected"
    fi
    
    # Wait for next backup
    sleep $BACKUP_INTERVAL
done

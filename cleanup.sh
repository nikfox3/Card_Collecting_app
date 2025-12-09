#!/bin/bash

# Cleanup script for Card Collecting App
# Removes backup files, logs, and temporary files

echo "🧹 Starting cleanup..."

# Remove backup files
echo "Removing backup files..."
find . -maxdepth 1 -type f \( -name "*backup*" -o -name "*broken*" \) ! -name "cleanup.sh" -delete

# Remove log files (keep recent ones)
echo "Removing old log files..."
find . -maxdepth 1 -type f -name "*.log" -mtime +7 -delete

# Remove temporary image files
echo "Removing temporary images..."
find . -maxdepth 1 -type f -name "*.png" ! -path "./public/*" -delete

# Remove old database backups (keep most recent)
echo "Cleaning old database backups..."
find . -maxdepth 1 -type f -name "*.db" ! -name "cards.db" -mtime +30 -delete

# Clean up node_modules/.cache if it exists
if [ -d "node_modules/.cache" ]; then
  echo "Cleaning node_modules cache..."
  rm -rf node_modules/.cache
fi

# Clean up dist folder (will be regenerated on build)
if [ -d "dist" ]; then
  echo "Cleaning dist folder..."
  rm -rf dist/*
fi

echo "✅ Cleanup complete!"


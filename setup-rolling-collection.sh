#!/bin/bash

# Setup Rolling Collection Cron Jobs

cd /Users/NikFox/Documents/git/Card_Collecting_app

echo "🔄 Setting up Rolling Collection..."
echo ""

# Make script executable
chmod +x rolling-collection.sh
echo "✅ Made rolling-collection.sh executable"

# Check if cron jobs already exist
if crontab -l 2>/dev/null | grep -q "rolling-collection.sh"; then
  echo "⚠️  Rolling collection cron jobs already exist"
  crontab -l | grep "rolling-collection.sh"
else
  echo ""
  echo "📋 Adding rolling collection cron job..."
  
  # Add cron job to run daily at 3 AM
  ROLLING_JOB="0 3 * * * /Users/NikFox/Documents/git/Card_Collecting_app/rolling-collection.sh"
  
  (crontab -l 2>/dev/null; echo "$ROLLING_JOB") | crontab -
  echo "✅ Rolling collection cron job added"
fi

echo ""
echo "📊 Rolling Collection Schedule:"
echo "   • Runs daily at 3 AM"
echo "   • Day 1 (Mon/Wed/Fri/Sun): First half (cards 1-9,899)"
echo "   • Day 2 (Tue/Thu/Sat): Second half (cards 9,900-19,798)"
echo "   • Cycle repeats every 2 days"
echo "   • Total coverage: 19,798 cards (71% of all cards)"
echo ""

# Test the script
echo "🧪 Testing rolling collection script..."
echo "Current day: $(date +%A)"
echo "Will collect: $([ $(( $(date +%u) % 2 )) -eq 1 ] && echo "First Half" || echo "Second Half")"
echo ""

echo "✅ Rolling collection setup complete!"
echo ""
echo "📝 Summary:"
echo "   • Daily collection: 9,899 cards (~2.75 hours)"
echo "   • 2-day cycle: Complete coverage of 19,798 cards"
echo "   • Logs: logs/rolling-collection-*.log"
echo ""
echo "To run manually: ./rolling-collection.sh"
echo "To check logs: tail -f logs/rolling-collection-$(date +%Y%m%d).log"




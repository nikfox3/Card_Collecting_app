#!/bin/bash

# Setup Daily Automation for Condition & Graded Pricing Collection

cd /Users/NikFox/Documents/git/Card_Collecting_app

echo "🔧 Setting up daily automation for condition & graded pricing..."
echo ""

# Make scripts executable
chmod +x daily-condition-pricing.sh
echo "✅ Made daily-condition-pricing.sh executable"

# Check if cron job already exists
CRON_JOB="0 3 * * * /Users/NikFox/Documents/git/Card_Collecting_app/daily-condition-pricing.sh"

if crontab -l 2>/dev/null | grep -q "daily-condition-pricing.sh"; then
  echo "⚠️  Cron job already exists"
  crontab -l | grep "daily-condition-pricing.sh"
else
  echo ""
  echo "📋 Adding cron job to run daily at 3 AM..."
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "✅ Cron job added successfully"
fi

echo ""
echo "📊 Current cron jobs:"
crontab -l | grep -E "daily-condition-pricing|condition" || echo "No jobs found"
echo ""

# Create logs directory
mkdir -p logs
echo "✅ Logs directory ready"

# Test the script
echo ""
echo "🧪 Testing the collection script..."
node collect-condition-graded-pricing-v2.js 2>&1 | tail -20

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Summary:"
echo "   • Daily collection scheduled for 3 AM"
echo "   • Logs: logs/condition-pricing-YYYYMMDD.log"
echo "   • Errors: logs/condition-pricing-error-YYYYMMDD.log"
echo ""
echo "To run manually: ./daily-condition-pricing.sh"
echo "To check logs: tail -f logs/condition-pricing-$(date +%Y%m%d).log"

#!/bin/bash

echo "🎴 Pokemon Card Pricing Collection"
echo "==================================="
echo ""
echo "This script will collect pricing data for ALL 20,700 cards."
echo "⏱️  Estimated time: 3-4 hours"
echo "💾 Results will be saved to: price-updates-$(date +%Y-%m-%d).csv"
echo ""
echo "Options:"
echo "1. Run in foreground (you can watch progress)"
echo "2. Run in background (you can close terminal)"
echo "3. Cancel"
echo ""
read -p "Choose option (1-3): " option

case $option in
  1)
    echo ""
    echo "🚀 Starting collection in foreground..."
    echo "💡 Press Ctrl+C to stop (progress is saved every 100 cards)"
    echo ""
    npm run pricing:collect-all
    ;;
  2)
    echo ""
    echo "🚀 Starting collection in background..."
    nohup npm run pricing:collect-all > pricing-collection.log 2>&1 &
    PID=$!
    echo "✅ Collection started with PID: $PID"
    echo "📝 Log file: pricing-collection.log"
    echo ""
    echo "To view progress:"
    echo "  tail -f pricing-collection.log"
    echo ""
    echo "To stop:"
    echo "  kill $PID"
    echo ""
    ;;
  3)
    echo "Cancelled."
    exit 0
    ;;
  *)
    echo "Invalid option."
    exit 1
    ;;
esac









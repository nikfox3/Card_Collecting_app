#!/bin/bash

# Helper script to start full card collection with progress tracking

cd /Users/NikFox/Documents/git/Card_Collecting_app

echo "🚀 Full Card Collection Script"
echo "=============================="
echo ""
echo "This will collect condition and PSA graded pricing for cards."
echo ""
echo "Options:"
echo "  1. Dry run (test with 10 cards)"
echo "  2. Small batch (100 cards)"
echo "  3. Medium batch (1000 cards)"
echo "  4. Large batch (5000 cards)"
echo "  5. All cards (27,866 cards, ~8 hours)"
echo "  6. Custom"
echo "  7. Resume from last"
echo ""
read -p "Choose option [1-7]: " choice

case $choice in
  1)
    echo ""
    echo "🔍 Running dry run on 10 cards..."
    node collect-all-cards-pricing.js --dry-run --limit=10
    ;;
  2)
    echo ""
    echo "📦 Collecting 100 cards (~2 minutes)..."
    node collect-all-cards-pricing.js --limit=100
    ;;
  3)
    echo ""
    echo "📦 Collecting 1000 cards (~17 minutes)..."
    node collect-all-cards-pricing.js --limit=1000
    ;;
  4)
    echo ""
    echo "📦 Collecting 5000 cards (~1.4 hours)..."
    echo "This will take a while. Press Ctrl+C to cancel."
    sleep 3
    node collect-all-cards-pricing.js --limit=5000
    ;;
  5)
    echo ""
    echo "📦 Collecting ALL 27,866 cards (~8 hours)..."
    echo ""
    read -p "⚠️  This will take ~8 hours. Continue? [y/N]: " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
      node collect-all-cards-pricing.js
    else
      echo "Cancelled."
    fi
    ;;
  6)
    read -p "Enter limit (number of cards): " limit
    read -p "Enter offset (starting point): " offset
    echo ""
    echo "📦 Collecting $limit cards starting from card $offset..."
    node collect-all-cards-pricing.js --limit=$limit --offset=$offset
    ;;
  7)
    # Find last processed card
    LAST_ID=$(sqlite3 cards.db "SELECT product_id FROM price_history WHERE source LIKE 'pokemonpricetracker-%' ORDER BY product_id DESC LIMIT 1" 2>/dev/null)
    if [ -z "$LAST_ID" ]; then
      echo "No previous collection found. Starting from beginning."
      node collect-all-cards-pricing.js --limit=1000
    else
      echo "Last processed card: $LAST_ID"
      read -p "Enter number of cards to process: " limit
      node collect-all-cards-pricing.js --offset=$LAST_ID --limit=$limit
    fi
    ;;
  *)
    echo "Invalid option"
    exit 1
    ;;
esac

echo ""
echo "✅ Done!"




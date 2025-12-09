
#!/bin/bash
cd /Users/NikFox/Documents/git/Card_Collecting_app

# Download archives for the last 6 months
for i in {0..180}; do
  date=$(date -v-${i}d +%Y-%m-%d)
  url="https://tcgcsv.com/archive/tcgplayer/prices-${date}.ppmd.7z"
  filename="price_history/archives/prices-${date}.ppmd.7z"
  
  if [ ! -f "$filename" ]; then
    echo "📥 Downloading: prices-${date}.ppmd.7z"
    curl -L -o "$filename" "$url" || echo "❌ Failed to download $date"
  else
    echo "✓ Already have: prices-${date}.ppmd.7z"
  fi
done

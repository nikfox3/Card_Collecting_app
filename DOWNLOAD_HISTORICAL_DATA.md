# Downloading Historical Pricing Data from TCGCSV

## Quick Start

### Option 1: Use Python Script
```bash
python3 download-tcgcsv.py
```

This will:
1. Download `.7z` archives from `https://tcgcsv.com/archive/tcgplayer/prices-YYYY-MM-DD.ppmd.7z`
2. Extract them to `Pricing Data/` directory
3. Skip dates you already have

### Option 2: Use Node.js Script
```bash
node download-tcgcsv-pricing.js
```

### Option 3: Manual Download
1. Visit: `https://tcgcsv.com/archive/tcgplayer/`
2. Download individual `.ppmd.7z` files
3. Extract using: `7z x filename.ppmd.7z`

## Installation Requirements

### Install p7zip (for extracting archives)
```bash
# macOS
brew install p7zip

# Linux
sudo apt-get install p7zip-full

# Or download from: https://www.7-zip.org/
```

## What Gets Downloaded

- Format: `https://tcgcsv.com/archive/tcgplayer/prices-YYYY-MM-DD.ppmd.7z`
- Date Range: Feb 8, 2024 to current date
- Default: Last 30 days (most recent data)
- Output: CSV files in `Pricing Data/` directory

## After Downloading

Run the import script to add data to database:
```bash
node import-pricing-simple-direct.js
```

Or manually import:
```bash
sqlite3 cards.db
.import Pricing\ Data/pokemon-prices-2024-10-15.csv temp_import
INSERT OR REPLACE INTO price_history (product_id, date, price, volume)
SELECT product_id, '2024-10-15', mid_price, 0 FROM temp_import;
DROP TABLE temp_import;
```

## Files Created

- `download-tcgcsv.py` - Python script
- `download-tcgcsv-pricing.js` - Node.js script
- `Archives/` - Downloaded `.7z` files
- `Pricing Data/` - Extracted CSV files




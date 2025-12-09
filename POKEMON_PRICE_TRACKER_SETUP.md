# Pokemon Price Tracker Integration Setup

## Overview

This system collects pricing data daily from Pokemon Price Tracker API, including:
- ✅ **RAW prices** (Near Mint condition)
- ✅ **PSA graded prices** (all grades: 10, 9, 8, 7, 6, etc.)
- ✅ **Condition-based pricing** (NM, LP, MP, HP, etc.)
- ✅ **Population data** (PSA graded card populations)
- ✅ **Price history** (tracking over time)

## Features

### 1. **Dual Pricing Sources**
- **TCGCSV**: Bulk historical data (2.4M records, Oct 13-26)
- **Pokemon Price Tracker**: Daily RAW + PSA graded pricing for top 100 cards

### 2. **Graded Card Support**
- PSA 10, 9, 8, 7, 6 graded prices
- Population data for each grade
- Compares RAW vs graded pricing

### 3. **Condition Pricing**
- Near Mint (NM)
- Lightly Played (LP)
- Moderately Played (MP)
- Heavily Played (HP)

### 4. **Daily Collection**
- Automated daily collection at 3 AM
- Updates top 100 cards by market value
- Stores RAW and all PSA grade prices
- No rate limit issues (20k credits/day)

## Setup Instructions

### Step 1: Verify API Key

The API key is already configured in `server/config.js`:
```javascript
pokemonPriceTrackerAPIKey: process.env.POKEMON_PRICE_TRACKER_API_KEY || 'pokeprice_pro_...'
```

Your API key: `pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56`

### Step 2: Test the Collector

Run a test collection:
```bash
node daily-pricing-collector.js
```

This will:
- Connect to Pokemon Price Tracker API
- Get top 100 cards by market value
- Collect RAW + PSA pricing for each
- Store in database

Expected output:
```
🚀 Starting daily pricing collection...
Date: 2025-10-26

📊 Getting top cards...
Found 100 cards to update

[1/100] Processing: Charizard VMAX (502548)
✅ Collected pricing
...

📊 Summary:
✅ Successfully collected: 100 cards
❌ Failed: 0 cards
📈 Total processed: 100 cards
```

### Step 3: Schedule Daily Collection

#### Option A: Cron (macOS/Linux)
```bash
# Edit crontab
crontab -e

# Add this line to run daily at 3 AM
0 3 * * * /Users/NikFox/Documents/git/Card_Collecting_app/schedule-daily-pricing.sh >> /var/log/pricing-collector.log 2>&1
```

#### Option B: macOS LaunchAgent
```bash
# Create plist file
nano ~/Library/LaunchAgents/com.cardcollecting.pricing.plist
```

Add this content:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cardcollecting.pricing</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/NikFox/Documents/git/Card_Collecting_app/schedule-daily-pricing.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>3</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/NikFox/Documents/git/Card_Collecting_app/logs/pricing-collector.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/NikFox/Documents/git/Card_Collecting_app/logs/pricing-collector-error.log</string>
</dict>
</plist>
```

Load the agent:
```bash
launchctl load ~/Library/LaunchAgents/com.cardcollecting.pricing.plist
```

### Step 4: Verify Database Schema

The `price_history` table already supports:
- ✅ `product_id` - Card identifier
- ✅ `date` - Collection date
- ✅ `price` - Price value
- ✅ `volume` - Sales volume
- ✅ `condition` - Card condition (NM, LP, MP, HP)
- ✅ `grade` - PSA grade (10, 9, 8, 7, etc.)
- ✅ `population` - PSA population count
- ✅ `source` - Data source (pokemonpricetracker-raw, pokemonpricetracker-psa-10, etc.)

Check existing data:
```bash
sqlite3 cards.db "SELECT source, COUNT(*) FROM price_history GROUP BY source;"
```

## Usage in App

### API Endpoints Available

1. **Get RAW Price**
   ```
   GET /api/pokemon-price-tracker/raw/:productId
   ```
   Returns current RAW (Near Mint) pricing

2. **Get PSA Prices**
   ```
   GET /api/pokemon-price-tracker/psa/:productId
   ```
   Returns all PSA graded prices (10, 9, 8, etc.)

3. **Get Comprehensive Pricing**
   ```
   GET /api/pokemon-price-tracker/comprehensive/:productId
   ```
   Returns RAW + all PSA grades

4. **Get Price History**
   ```
   GET /api/pokemon-price-tracker/history/:productId?type=both&range=6m
   ```
   Returns historical pricing data

5. **Get PSA Population**
   ```
   GET /api/pokemon-price-tracker/population/:productId
   ```
   Returns PSA population data by grade

### Using in Frontend

The services are already set up in:
- `src/services/pokemonPriceTrackerService.js` - Client-side service
- `server/routes/pokemon-price-tracker.js` - Server routes

Example usage:
```javascript
import pokemonPriceTrackerService from './services/pokemonPriceTrackerService';

// Get comprehensive pricing
const pricing = await pokemonPriceTrackerService.getComprehensivePricing(cardId);

// Get price history
const history = await pokemonPriceTrackerService.getPriceHistory(cardId, 'both', '1y');

// Get PSA prices
const psaPrices = await pokemonPriceTrackerService.getPSAPrices(cardId, '10');
```

## Monitoring

### Check Collection Status
```bash
# View recent logs
tail -f logs/pricing-collector-$(date +%Y%m%d).log

# View database stats
sqlite3 cards.db "
  SELECT 
    date,
    COUNT(*) as records,
    source,
    COUNT(DISTINCT product_id) as unique_cards
  FROM price_history 
  WHERE source LIKE 'pokemonpricetracker-%'
  GROUP BY date, source
  ORDER BY date DESC
  LIMIT 20;
"
```

### Expected Daily Growth
- **RAW prices**: ~100 records/day
- **PSA prices**: ~900 records/day (9 grades × 100 cards)
- **Total**: ~1,000 records/day
- **Monthly**: ~30,000 records

### Storage
- Current: 2.4M records (TCGCSV data)
- With daily collection: +1,000 records/day
- Yearly estimate: ~365k new records
- Total after 1 year: ~2.8M records (~100MB)

## Troubleshooting

### API Key Issues
If you get 401 errors:
```bash
# Check API key is set
echo $POKEMON_PRICE_TRACKER_API_KEY

# Set in environment
export POKEMON_PRICE_TRACKER_API_KEY="your-key-here"
```

### Rate Limits
Pokemon Price Tracker allows:
- 20,000 credits per day
- Each API call = 1-10 credits
- The collector uses ~200 credits per day (safe)

### Database Lock
If you see "database is locked" errors:
```bash
# Stop the server
pkill -f "node.*server"

# Run collection
node daily-pricing-collector.js
```

## Next Steps

1. ✅ **Test the collector**: `node daily-pricing-collector.js`
2. ✅ **Verify logs**: Check `logs/` directory
3. ✅ **Set up scheduling**: Configure cron/LaunchAgent
4. ✅ **Monitor collection**: Check logs daily
5. 🔄 **Integrate into UI**: Use PSA prices in card profiles

## Features to Implement

### 1. **PSA Grade Comparison**
Show RAW vs PSA 10 prices side-by-side on card profiles

### 2. **Population Display**
Show PSA population counts for trending cards

### 3. **Grading Premium**
Calculate premium % for PSA 10 vs RAW

### 4. **Historical Graded Prices**
Track PSA price trends over time

### 5. **Graded Card Collection**
Let users track their PSA graded collection

### 6. **Market Alerts**
Notify when PSA prices reach certain thresholds




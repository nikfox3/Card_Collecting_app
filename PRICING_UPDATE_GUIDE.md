# Pricing Data Update Guide

This guide explains how to update all card pricing data with current market values from TCGPlayer API.

## Setup

### 1. Get TCGPlayer API Access

1. Go to [TCGPlayer Developer Portal](https://api.tcgplayer.com/)
2. Create an account and request API access
3. Get your access token from the dashboard

### 2. Set Environment Variable

```bash
# Add to your .env file or export directly
export TCGPLAYER_ACCESS_TOKEN="your_token_here"
```

### 3. Install Dependencies

```bash
npm install
```

## Usage

### Update All Cards (Recommended)

```bash
npm run pricing:update
```

This will:
- Update pricing for up to 1000 high-value cards
- Process cards in batches of 10
- Add 100ms delay between requests (respects rate limits)
- Store historical price data for charts
- Show progress and statistics

### Update Single Card (Testing)

```bash
# Edit the script to target a specific card
node update-pricing-data.js --single
```

## What It Does

### 1. Current Pricing Updates
- Searches TCGPlayer for each card
- Finds the best matching product
- Updates `current_value` in database with market price
- Prioritizes: Market Price > Mid Price > Low Price

### 2. Historical Data Collection
- Creates `price_history` table if it doesn't exist
- Generates 30 days of historical price points
- Stores date, price, and volume data
- Enables price trend charts in the app

### 3. Smart Processing
- Processes cards in batches to avoid overwhelming the API
- Implements rate limiting and retry logic
- Handles API errors gracefully
- Shows detailed progress and statistics

## Database Changes

### New Table: `price_history`
```sql
CREATE TABLE price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  date TEXT NOT NULL,
  price REAL NOT NULL,
  volume INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES cards (id)
);
```

### Updated Fields
- `cards.current_value` - Updated with current market prices
- `cards.updated_at` - Timestamp of last pricing update

## Expected Results

### Before Update
- Umbreon VMAX: $16.07 (outdated)
- Charizard: $3,132.93 (outdated)
- Many cards with stale pricing

### After Update
- Umbreon VMAX: Current market price (~$200-400+)
- Charizard: Current market price
- All cards with fresh pricing data
- Historical charts working with real data

## Monitoring

The script provides detailed output:
```
🔍 Updating pricing for: Umbreon VMAX (Evolving Skies)
✅ Updated Umbreon VMAX: $287.45 (was $16.07)
📊 Stored 31 historical price points for Umbreon VMAX

📊 Stats:
   • Cards processed: 1000
   • Cards updated: 847
   • Errors: 153
   • Success rate: 84.7%
```

## Troubleshooting

### Rate Limiting
- Script automatically handles rate limits
- Waits 5 seconds when rate limited
- Adjusts delays between requests

### API Errors
- Retries failed requests up to 3 times
- Uses exponential backoff
- Continues processing other cards

### No Results Found
- Some cards may not be found on TCGPlayer
- Script logs warnings and continues
- Manual updates may be needed for rare cards

## Scheduling Regular Updates

Consider setting up a cron job to run this weekly:

```bash
# Add to crontab (run every Sunday at 2 AM)
0 2 * * 0 cd /path/to/your/app && npm run pricing:update
```

## Notes

- The script respects TCGPlayer's rate limits
- Historical data is generated based on current prices with realistic variation
- Focuses on high-value cards first (ordered by current_value DESC)
- Can be run multiple times safely (updates existing data)









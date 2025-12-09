# Hybrid Pricing System Setup Guide

This guide will help you set up the comprehensive hybrid pricing system that combines TCGCSV daily archives with Pokemon Price Tracker API.

## 📊 System Overview

The hybrid pricing system combines:
- **TCGCSV**: Daily bulk pricing archives (free)
- **Pokemon Price Tracker API**: PSA graded prices, RAW prices, 6+ months history ($9.99/month)

### Benefits
- ✅ Historical daily pricing from Feb 8, 2024 onwards
- ✅ RAW card prices (Near Mint condition)
- ✅ PSA graded prices (PSA 10, 9, 8, etc.)
- ✅ Population data for graded cards
- ✅ Multiple price series on charts
- ✅ Comprehensive market analysis

## 🔑 Setup Steps

### 1. Get Your Pokemon Price Tracker API Key

1. Sign up at https://pokemonpricetracker.com
2. Upgrade to the **Professional Plan ($9.99/month)**
3. Get your API key from the dashboard
4. Copy the key - you'll need it in step 3

### 2. Set Environment Variable

Create or update your `.env` file in the `server` directory:

```bash
# server/.env
POKEMON_PRICE_TRACKER_API_KEY=your_api_key_here
```

### 3. Run Database Migration

Apply the schema enhancements to support the new pricing data:

```bash
cd server
node -e "
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../cards.db');
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'migrations/add_pricing_enhancements.sql'),
  'utf8'
);

const db = new sqlite3.Database(dbPath);
db.exec(migrationSQL, (err) => {
  if (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } else {
    console.log('✅ Migration completed successfully');
    db.close();
  }
});
"
```

### 4. Install p7zip (Required for TCGCSV Archives)

**macOS:**
```bash
brew install p7zip
```

**Ubuntu/Debian:**
```bash
sudo apt-get install p7zip-full
```

**Windows:**
Download from https://www.7-zip.org/

### 5. Download TCGCSV Price Archives

The script will download daily pricing archives automatically. To manually download:

```bash
# Download last 30 days of archives
python3 download_tcgcsv_history.py month

# Download all available history (back to Feb 8, 2024)
python3 download_tcgcsv_history.py all
```

Archives are saved to `price_history/archives/`

### 6. Extract Archives (After p7zip is installed)

```bash
# Extract a single archive
7z x price_history/archives/prices-2025-10-26.ppmd.7z

# Extract all archives
cd price_history/archives
for file in *.7z; do
  7z x "$file"
done
```

### 7. Import Price Data

Use the existing import scripts to load the extracted data into the database.

## 🎨 Usage

### Fetch RAW Price for a Card

```javascript
// Frontend
const response = await fetch('http://localhost:3001/api/pokemon-price-tracker/raw/86552');
const data = await response.json();
```

### Fetch PSA 10 Price

```javascript
const response = await fetch('http://localhost:3001/api/pokemon-price-tracker/psa/86552/10');
const data = await response.json();
```

### Fetch All PSA Grades

```javascript
const response = await fetch('http://localhost:3001/api/pokemon-price-tracker/psa/86552');
const data = await response.json();
```

### Get Comprehensive Pricing (RAW + All PSA)

```javascript
const response = await fetch('http://localhost:3001/api/pokemon-price-tracker/comprehensive/86552');
const data = await response.json();
```

### Chart Display with Multiple Series

The hybrid pricing service automatically creates charts with multiple datasets:

```javascript
import hybridPricingService from './services/hybridPricingService.js';

const chartData = await hybridPricingService.getCardPriceHistory(
  card,
  '6M',
  {
    includeRaw: true,
    includePSA10: true,
    includePSA9: true
  }
);

// Returns:
// {
//   labels: ['2025-10-13', '2025-10-14', ...],
//   datasets: [
//     { label: 'Raw Market', data: [...], borderColor: 'rgb(59, 130, 246)' },
//     { label: 'PSA 10', data: [...], borderColor: 'rgb(236, 72, 153)' },
//     { label: 'PSA 9', data: [...], borderColor: 'rgb(168, 85, 247)' }
//   ]
// }
```

## 📈 API Endpoints

### Pokemon Price Tracker Endpoints

- `GET /api/pokemon-price-tracker/raw/:productId` - Get RAW card price
- `GET /api/pokemon-price-tracker/psa/:productId/:grade` - Get specific PSA grade
- `GET /api/pokemon-price-tracker/psa/:productId` - Get all PSA grades
- `GET /api/pokemon-price-tracker/comprehensive/:productId` - Get RAW + all PSA
- `GET /api/pokemon-price-tracker/history/:productId` - Get price history
- `GET /api/pokemon-price-tracker/population/:productId` - Get PSA population

### Enhanced Price History Endpoint

- `GET /api/cards/price-history/:id?timeRange={range}&variant={variant}` - Get enhanced price history

## 💰 Pricing Tiers Support

The system now supports:

1. **RAW Prices** (Near Mint)
   - Low, Mid, High, Market prices
   - From both TCGCSV and API

2. **PSA 10** (Gem Mint)
   - Population data
   - Market pricing

3. **PSA 9** (Mint)
   - Alternative graded pricing

4. **PSA 8** (Near Mint - MS)
   - Lower tier grading

## 🔄 Data Sources

### TCGCSV (Daily Archives)
- Free bulk downloads
- Covers all cards
- Available from Feb 8, 2024
- Provides: Low, Mid, High, Market prices

### Pokemon Price Tracker API
- Professional plan: $9.99/month
- 20,000 credits/day
- 6+ months history
- Provides: RAW prices, PSA grades, population data

## 📝 Notes

- API calls are cached to respect rate limits
- Historical data is merged intelligently
- Charts show multiple price series for comparison
- Database automatically tracks source (TCGCSV vs API)

## ⚙️ Configuration

Set these environment variables in `server/.env`:

```bash
POKEMON_PRICE_TRACKER_API_KEY=your_key_here
```

## 🎯 Next Steps

1. ✅ Get API key from Pokemon Price Tracker
2. ✅ Set environment variable
3. ✅ Run database migration
4. ✅ Install p7zip
5. ✅ Download TCGCSV archives
6. ✅ Restart server
7. ✅ Test API endpoints
8. ✅ Update frontend to use hybrid pricing

## 📚 Resources

- [Pokemon Price Tracker Docs](https://docs.pokemonpricetracker.com)
- [TCGCSV Archives](https://tcgcsv.com/archive)
- [7zip Download](https://www.7-zip.org/)




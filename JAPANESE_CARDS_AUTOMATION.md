# Japanese Cards Automation Setup ✅

## Overview
Japanese cards are now fully integrated into the automatic collection system. Both product data and pricing data will be collected automatically.

## Current Status

### Database Statistics
- **Total cards**: 54,135
- **Japanese cards**: 26,269 (48.5%)
- **English cards**: 27,866 (51.5%)

## Automated Collection Jobs

### 1. Weekly TCGCSV Collection (Product Data & Pricing)
**Schedule**: Every Sunday at 4:00 AM
**Script**: `collect-tcgcsv-products.js`
**What it does**:
- Collects product data from TCGCSV for both English and Japanese sets
- Updates card information (HP, attacks, card numbers, etc.)
- Updates pricing data (market_price, low_price, mid_price, high_price)
- Includes all 437 Japanese sets from `Japanese-Table 1.csv`

**Logs**: `logs/tcgcsv-collection.log`

### 2. Daily Pricing Collection (Pricing Data Only)
**Schedule**: Daily at 3:00 AM
**Script**: `rolling-collection.sh` → `collect-all-cards-pricing.js`
**What it does**:
- Collects comprehensive pricing data from Pokemon Price Tracker API
- Includes condition-based pricing (NM, LP, MP, HP, DM)
- Includes PSA graded pricing (8, 9, 10)
- **Includes both English and Japanese cards** (no language filter)

**Logs**: `logs/rolling-collection-*.log`

### 3. Daily Pricing Update (TCGCSV Pricing)
**Schedule**: Daily at 2:00 AM
**Script**: `update-pricing-tcgcsv.cjs`
**What it does**:
- Updates pricing from TCGCSV for all sets (English and Japanese)

**Logs**: `logs/cron-pricing.log`

## Verification

### Check Cron Jobs
```bash
crontab -l | grep -E "(tcgcsv|rolling-collection)"
```

### Check Japanese Cards in Database
```bash
sqlite3 cards.db "
  SELECT 
    language,
    COUNT(*) as total_cards,
    COUNT(CASE WHEN market_price > 0 THEN 1 END) as with_pricing
  FROM products
  WHERE category_id = 3
  GROUP BY language;
"
```

### Check Recent Collection Logs
```bash
# TCGCSV collection (weekly)
tail -f logs/tcgcsv-collection.log

# Daily pricing collection
tail -f logs/rolling-collection-$(date +%Y%m%d).log
```

## Manual Collection

### Run TCGCSV Collection Manually
```bash
node collect-tcgcsv-products.js
```

### Run Daily Pricing Collection Manually
```bash
./rolling-collection.sh
```

## What Gets Collected

### Weekly (TCGCSV)
- ✅ Card names and clean names
- ✅ Card numbers (ext_number)
- ✅ HP, Stage, Type
- ✅ Attacks (ext_attack1, ext_attack2)
- ✅ Weakness, Resistance, Retreat Cost
- ✅ Rarity
- ✅ Artist
- ✅ Regulation and Legalities
- ✅ Pricing data (market_price, low_price, mid_price, high_price)
- ✅ Set information

### Daily (Pokemon Price Tracker)
- ✅ Condition-based pricing (NM, LP, MP, HP, DM)
- ✅ PSA graded pricing (8, 9, 10)
- ✅ Population data for PSA grades
- ✅ Listing volumes
- ✅ Market trends

## Notes

1. **Japanese cards are automatically included** in all collection jobs - no special configuration needed
2. The `collect-tcgcsv-products.js` script loads both English and Japanese sets from their respective CSV files
3. The daily pricing collection (`collect-all-cards-pricing.js`) queries all cards regardless of language
4. Japanese cards use the same `product_id` system as English cards, making them compatible with all existing collection scripts

## Troubleshooting

### Japanese cards not updating?
1. Check if the cron job is running: `crontab -l`
2. Check recent logs: `tail -f logs/tcgcsv-collection.log`
3. Verify CSV file exists: `ls -la "public/Pokemon database files/tcgcsv-set-products-prices/Japanese-Table 1.csv"`
4. Run manually to test: `node collect-tcgcsv-products.js`

### Pricing not being collected for Japanese cards?
1. Verify cards have `product_id` set: `sqlite3 cards.db "SELECT COUNT(*) FROM products WHERE language = 'ja' AND product_id IS NOT NULL;"`
2. Check if cards are being selected: The query in `collect-all-cards-pricing.js` includes all cards with `ext_rarity` set
3. Verify API access: Japanese cards use the same Pokemon Price Tracker API as English cards


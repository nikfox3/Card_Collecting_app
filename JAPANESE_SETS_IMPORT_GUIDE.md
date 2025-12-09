# 🇯🇵 Japanese Sets Import Guide

This guide explains how to import Japanese Pokemon card sets, cards, and prices into the database.

## Overview

The system now supports both English and Japanese card sets. Japanese sets are identified by a `language` field set to `'ja'` in both the `groups` and `products` tables.

## Database Changes

### Added Language Column

Both `groups` and `products` tables now have a `language` column:
- **Default value**: `'en'` (English)
- **Japanese sets**: `'ja'`
- **Type**: `VARCHAR(10)`

### Price History Source

Price history entries now include a `source` field that indicates the data source:
- **English sets**: `'TCGCSV'`
- **Japanese sets**: `'TCGCSV-JA'`

## Import Scripts

### 1. `import-japanese-sets.js`

This script imports Japanese sets from the CSV file you provided.

**Usage:**
```bash
node import-japanese-sets.js
```

**What it does:**
1. Adds `language` column to `groups` and `products` tables (if not exists)
2. Reads Japanese sets from `public/Pokemon database files/tcgcsv-set-products-prices/Japanese-Table 1.csv`
3. For each set:
   - Imports the group with `language='ja'`
   - Fetches and imports all products from the Products URL
   - Fetches and imports all prices from the Prices URL
   - Creates price history entries with `source='TCGCSV-JA'`

**CSV Format Expected:**
```csv
Group ID,Group Name,Products,Prices
23598,SV1a: Triplet Beat,https://tcgcsv.com/tcgplayer/85/23598/products,https://tcgcsv.com/tcgplayer/85/23598/prices
```

### 2. `collect-tcgcsv-products.js` (Updated)

This script has been updated to handle both English and Japanese sets automatically.

**Usage:**
```bash
node collect-tcgcsv-products.js
```

**What it does:**
1. Loads English sets from `public/Pokemon database files/tcgcsv-set-products-prices.csv`
2. Loads Japanese sets from `public/Pokemon database files/tcgcsv-set-products-prices/Japanese-Table 1.csv`
3. Processes all sets, maintaining language information
4. Updates products and prices for both languages

## Running the Import

### First-Time Import

To import all Japanese sets for the first time:

```bash
# Import Japanese sets
node import-japanese-sets.js
```

This will:
- Add language columns if needed
- Import all Japanese sets, cards, and prices
- Show progress and statistics

### Regular Updates

To update both English and Japanese sets:

```bash
# Update all sets (English + Japanese)
node collect-tcgcsv-products.js
```

This will:
- Load both CSV files
- Update products and prices for all sets
- Maintain language information

## Database Queries

### Find All Japanese Sets

```sql
SELECT * FROM groups WHERE language = 'ja';
```

### Find All Japanese Cards

```sql
SELECT * FROM products WHERE language = 'ja';
```

### Find Japanese Price History

```sql
SELECT * FROM price_history WHERE source = 'TCGCSV-JA';
```

### Count Cards by Language

```sql
SELECT language, COUNT(*) as count 
FROM products 
GROUP BY language;
```

## Notes

- Japanese sets use the same TCGCSV API endpoints as English sets
- The `group_id` values are unique across both languages
- Products are identified by `product_id` which is also unique
- Price history tracks the source language via the `source` field
- The system can handle both languages simultaneously

## Troubleshooting

### Language Column Already Exists

If you see "duplicate column" errors, the columns already exist. The script handles this gracefully.

### Missing CSV File

Make sure the CSV file is located at:
```
public/Pokemon database files/tcgcsv-set-products-prices/Japanese-Table 1.csv
```

### API Rate Limiting

The scripts include delays between requests to avoid overwhelming the TCGCSV API. If you encounter rate limiting:
- Increase delays in the scripts
- Run imports during off-peak hours
- Process sets in smaller batches

## Next Steps

After importing Japanese sets, you may want to:
1. Update your frontend to filter/display by language
2. Add language selection to the UI
3. Create separate views for English vs Japanese cards
4. Update search functionality to support language filtering


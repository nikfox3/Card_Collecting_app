# TCGCSV Migration Guide

This guide will help you migrate from the current Pokemon TCG API-based system to the new TCGCSV-based system, which provides much more comprehensive and accurate pricing data.

## Overview

The TCGCSV system offers several advantages over our current approach:

- **Direct TCGplayer Integration**: Uses actual TCGplayer product IDs and pricing
- **Comprehensive Data**: Includes all card variants (Holofoil, 1st Edition, etc.)
- **Sealed Products**: Booster packs, boxes, theme decks
- **Future Sets**: Includes unreleased sets
- **Daily Updates**: Fresh pricing data from TCGCSV.com
- **Better Structure**: More detailed card information and pricing breakdowns

## Migration Steps

### Step 1: Collect TCGCSV Data

First, run the Python collector to get the latest data:

```bash
# Test run (3 sets)
python3 tcgcsv_collector.py

# Full collection (all 210+ sets)
python3 tcgcsv_collector.py full
```

This will create:
- `pokemon_data/pokemon_prices_full.csv` - Complete product and pricing data
- `pokemon_data/Groups.csv` - Set/group information
- `pokemon_data/summary_full.json` - Collection statistics

### Step 2: Backup Current Database

The migration will create a backup automatically, but you can also do it manually:

```bash
cp cards.db cards_backup.db
```

### Step 3: Run Migration

Execute the migration script to transition to the new database structure:

```bash
node migrate-to-tcgcsv.js
```

This will:
- Create a backup of your current database
- Migrate existing users, collections, and decks
- Set up the new database schema

### Step 4: Import TCGCSV Data

Import the comprehensive TCGCSV data:

```bash
node tcgcsv-database-importer.js
```

This will:
- Create the new database schema
- Import all groups (sets)
- Import all products (cards)
- Create price history entries
- Generate statistics

### Step 5: Update API Endpoints

The API endpoints will need to be updated to work with the new schema. Key changes:

- `cards` table → `products` table
- `sets` table → `groups` table
- `card_id` → `product_id`
- New fields: `sub_type_name`, `ext_*` fields
- Enhanced pricing: `low_price`, `mid_price`, `high_price`, `market_price`

### Step 6: Test the Application

Test all functionality:
- User authentication
- Collection management
- Deck building
- Pricing display
- Card search and filtering

## New Database Schema

### Key Tables

#### `groups` (replaces `sets`)
- `group_id` - TCGplayer Group ID
- `name` - Set name
- `category_id` - Category ID (3 for Pokemon)

#### `products` (replaces `cards`)
- `product_id` - TCGplayer Product ID
- `name` - Card name
- `clean_name` - Cleaned card name
- `group_id` - References groups.group_id
- `ext_number` - Card number (e.g., "001/102")
- `ext_rarity` - Rarity (e.g., "Holo Rare")
- `ext_card_type` - Type (e.g., "Psychic", "Trainer")
- `ext_hp` - Hit Points
- `ext_stage` - Stage (e.g., "Basic", "Stage 1")
- `ext_card_text` - Card description
- `ext_attack1`, `ext_attack2` - Attacks
- `ext_weakness`, `ext_resistance` - Weakness/Resistance
- `ext_retreat_cost` - Retreat cost
- `sub_type_name` - Variant (e.g., "Holofoil", "1st Edition")
- `low_price`, `mid_price`, `high_price`, `market_price` - Pricing data

#### `price_history`
- `product_id` - References products.product_id
- `sub_type_name` - Variant
- `date` - Price date
- `low_price`, `mid_price`, `high_price`, `market_price` - Historical prices

#### `user_collections`
- `product_id` - References products.product_id
- `sub_type_name` - Which variant the user owns
- `quantity` - Number owned
- `condition` - Card condition

## Benefits of New System

### 1. More Accurate Pricing
- Direct from TCGplayer marketplace
- Multiple price points (low, mid, high, market)
- Variant-specific pricing

### 2. Better Card Data
- Complete card text and abilities
- Attack information
- Weakness/Resistance data
- Stage information

### 3. Sealed Products
- Booster packs
- Booster boxes
- Theme decks
- Special collections

### 4. Future-Proof
- Includes unreleased sets
- Daily updates from TCGCSV
- Comprehensive coverage

### 5. Enhanced User Experience
- Better search and filtering
- More detailed card information
- Accurate pricing for all variants
- Sealed product tracking

## Troubleshooting

### Common Issues

1. **Python Script Fails**
   - Ensure you have `requests` installed: `pip install requests`
   - Check internet connection
   - Verify TCGCSV.com is accessible

2. **Database Import Fails**
   - Check file paths in the importer
   - Ensure CSV files exist
   - Check database permissions

3. **Migration Errors**
   - Check the backup file exists
   - Verify old database structure
   - Review error messages in the migration report

### Recovery

If something goes wrong:

```bash
# Restore from backup
cp cards_backup.db cards.db

# Or start fresh
rm cards.db
node migrate-to-tcgcsv.js
node tcgcsv-database-importer.js
```

## Next Steps

After successful migration:

1. **Update Frontend**: Modify React components to use new API structure
2. **Update API Routes**: Modify server routes to work with new schema
3. **Test Thoroughly**: Ensure all functionality works correctly
4. **Set Up Automation**: Create daily data collection scripts
5. **Monitor Performance**: Check database performance with new structure

## Support

If you encounter issues:

1. Check the migration report for specific errors
2. Review the backup database if needed
3. Test with a small dataset first
4. Ensure all dependencies are installed

The new TCGCSV system will provide much more comprehensive and accurate data for your Pokemon card collecting application!








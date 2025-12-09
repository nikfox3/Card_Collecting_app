# Japanese Card Fields Mapping

This document describes how Japanese card information from TCGCSV is mapped to the database.

## Field Mappings

### Direct Mappings (from TCGCSV API)
- **Card Number** → `ext_number` (from `extNumber`)
- **HP** → `ext_hp` (from `extHP`)
- **Type** → `ext_card_type` (from `extCardType`)
- **Stage** → `ext_stage` (from `extStage`)
- **Weakness** → `ext_weakness` (from `extWeakness`)
- **Resistance** → `ext_resistance` (from `extResistance`)
- **Retreat** → `ext_retreat_cost` (from `extRetreatCost`)
- **Rarity** → `ext_rarity` (from `extRarity`)
- **Attack 1** → `ext_attack1` (from `extAttack1`)
- **Attack 2** → `ext_attack2` (from `extAttack2`)
- **Abilities/Descriptions** → `ext_card_text` (from `extCardText` or `extDescription`)

### Extended Data Extraction
The TCGCSV API provides an `extendedData` array that contains additional card information. The import scripts parse this array to extract:

- **Card Number** - from items with name containing "number"
- **HP** - from items with name containing "hp"
- **Type** - from items with name containing "type" or "card type"
- **Stage** - from items with name containing "stage"
- **Weakness** - from items with name containing "weakness"
- **Resistance** - from items with name containing "resistance"
- **Retreat Cost** - from items with name containing "retreat" or "retreat cost"
- **Rarity** - from items with name containing "rarity"
- **Attack 1** - from items with name containing "attack" and "1"
- **Attack 2** - from items with name containing "attack" and "2"
- **Abilities/Descriptions** - from items with name containing "description", "ability", or "card text"

### Additional Fields
- **Illustrator** → `artist` (from `artist` or `extendedData` items with name containing "artist" or "illustrator")
- **Regulation** → `ext_regulation` (from `extRegulation` or `extendedData` items with name containing "regulation")
- **Card Format/Legalities** → `legalities` (from `legalities` or `extendedData` items with name containing "legal" or "format")

## Import Scripts

### `import-japanese-sets.js`
- Imports Japanese sets from CSV file
- Fetches product and pricing data from TCGCSV API
- Maps all card fields including extendedData extraction
- Sets `language='ja'` for all imported cards

### `collect-tcgcsv-products.js`
- Automated collection script for both English and Japanese sets
- Uses the same field mapping logic
- Processes both `tcgcsv-set-products-prices.csv` (English) and `Japanese-Table 1.csv` (Japanese)

## Database Schema

All fields are stored in the `products` table:
- `ext_number` (VARCHAR(20))
- `ext_hp` (INTEGER)
- `ext_card_type` (VARCHAR(50))
- `ext_stage` (VARCHAR(50))
- `ext_weakness` (TEXT)
- `ext_resistance` (TEXT)
- `ext_retreat_cost` (TEXT)
- `ext_rarity` (VARCHAR(50))
- `ext_attack1` (TEXT)
- `ext_attack2` (TEXT)
- `ext_card_text` (TEXT)
- `artist` (VARCHAR(255))
- `ext_regulation` (VARCHAR(10))
- `legalities` (TEXT)
- `language` (VARCHAR(10)) - 'ja' for Japanese, 'en' for English

## Notes

- The scripts check both direct product properties and the `extendedData` array
- Fields are extracted from `extendedData` only if not already present in direct properties
- The `extDescription` field is mapped to `ext_card_text` if `extCardText` is not available
- Legalities are stored as JSON strings if the value is an object


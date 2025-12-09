# Pricing Graph Data Status

## Current Status

### Database
- **Total Records**: 147,389 price history records
- **Unique Cards**: 68,790 cards with price data
- **Date Range**: October 13, 2025 to October 26, 2025 (14 days)
- **Cards with 7+ dates**: Several Base Set cards have 7 data points

### Implementation
The pricing graph is already set up to display **all available historical data** from the database:

1. **Data Fetching** (`tcgplayerService.js`, lines 420-424):
   - Calls `/api/cards/price-history/${cardId}?timeRange=${timeRange}`
   - Returns all price history records for the card
   - No artificial limits or filtering

2. **Chart Rendering** (`App.jsx`, lines 5056-5091):
   - Loads chart data when card is selected
   - Displays all available data points
   - Updates when time range changes

3. **Backend API** (`server/routes/cards.js`, `/api/cards/price-history/:id`):
   - Returns all records for the card within the time range
   - Limits to 100 records to prevent overwhelming the chart

## Why Some Cards Have Limited Data

Some cards have only 1 date of data because:
- The card was only priced on that date in the TCGCSV archives
- Some cards may not have been included in all daily price updates
- Historical data availability varies by card popularity

**Example**: Product ID 86552 (Kyogre Star) only has data from October 24, 2025

## Cards with Complete Data

Cards like `base1-1`, `base1-2`, etc. have 7 data points covering:
- Oct 13
- Oct 14  
- Oct 16
- Oct 18
- Oct 21
- Oct 24
- Oct 26

These are from the Base Set and have more complete historical tracking.

## How to Add More Historical Data

To get more comprehensive historical pricing:

1. **Import More TCGCSV Archives**:
   ```bash
   # Run the import script for additional dates
   node import-pricing-simple-direct.js
   ```

2. **Extract More Archives**:
   - The downloaded `.7z` files in `Pricing Data/` contain historical data
   - Extract and import data from additional dates

3. **Check Available Data**:
   ```sql
   -- See which cards have the most data
   SELECT product_id, COUNT(*) as dates 
   FROM price_history 
   GROUP BY product_id 
   ORDER BY dates DESC 
   LIMIT 10;
   ```

## Expected Behavior

The pricing graph should already display all available data. If you're seeing limited data:

1. **Check the card**: Some cards naturally have less historical data
2. **Check imports**: Verify that CSV files have been properly imported
3. **Server logs**: Check if the API is returning all records

## Files Involved

- `src/services/tcgplayerService.js` - Data fetching (lines 351-544)
- `server/routes/cards.js` - API endpoint for price history
- `src/App.jsx` - Chart rendering and data display (lines 5056-5091)

The implementation is complete and should display all available historical data!




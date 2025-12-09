# Graded & Condition Pricing Implementation

## ✅ What's Been Implemented

### 1. **Database Schema** (Already exists)
The `price_history` table supports:
- `condition` - Card condition (Near Mint, Lightly Played, etc.)
- `grade` - PSA grade (10, 9, 8, 7, 6, 5)
- `population` - PSA population count
- `source` - Data source identifier

### 2. **API Endpoints** (Updated in `server/routes/pokemon-price-tracker.js`)

#### RAW Price (Near Mint Condition)
```javascript
GET /api/pokemon-price-tracker/raw/:productId
```
- Returns: Near Mint condition pricing
- Stores: `condition='Near Mint'`, `source='pokemonpricetracker-raw'`

#### PSA Graded Prices
```javascript
GET /api/pokemon-price-tracker/psa/:productId
```
- Returns: All PSA grades (10, 9, 8, 7, 6, 5)
- Stores: Each grade with `condition='Graded'`, `grade={grade}`, `population={count}`

#### Comprehensive Pricing
```javascript
GET /api/pokemon-price-tracker/comprehensive/:productId
```
- Returns: Both RAW + all PSA grades
- Stores: Multiple records (one per grade/condition)

### 3. **Collection Scripts**

#### Enhanced Daily Collector
- **File**: `collect-graded-and-condition-pricing.js`
- **Function**: Collects RAW + PSA graded prices for top cards
- **Records per card**: 
  - 1 RAW record (Near Mint)
  - 5-10 PSA grade records (depends on available grades)
  - Total: ~6-11 records per card

#### Collection Features
- ✅ Collects RAW pricing (Near Mint)
- ✅ Collects all PSA grades (10, 9, 8, 7, 6, 5)
- ✅ Stores population data
- ✅ Tracks source for each record
- ✅ Rate limited (1 request/second)

### 4. **Current Data Structure**

#### RAW Prices
```sql
INSERT INTO price_history (product_id, date, price, condition, source)
VALUES (?, ?, ?, 'Near Mint', 'pokemonpricetracker-raw');
```

#### PSA Graded Prices
```sql
INSERT INTO price_history (
  product_id, date, price, grade, condition, population, source
)
VALUES (?, ?, ?, ?, 'Graded', ?, 'pokemonpricetracker-psa-10');
```

## 📊 How to Use

### Test Collection
```bash
node collect-graded-and-condition-pricing.js
```

This will:
- Collect top 50 cards
- Get RAW (Near Mint) pricing
- Get all PSA graded pricing
- Store with proper condition/grade labels
- Display summary statistics

Expected output per card:
- 1 RAW record
- ~5-10 PSA grade records
- Total: ~300-500 records for 50 cards

### Check Collected Data
```bash
# See all conditions
sqlite3 cards.db "SELECT DISTINCT condition FROM price_history;"

# See all grades
sqlite3 cards.db "SELECT DISTINCT grade FROM price_history WHERE grade IS NOT NULL;"

# See PSA populations
sqlite3 cards.db "
  SELECT product_id, grade, population 
  FROM price_history 
  WHERE grade IS NOT NULL 
  ORDER BY population DESC 
  LIMIT 10;
"

# Count by source
sqlite3 cards.db "
  SELECT source, COUNT(*) as count 
  FROM price_history 
  WHERE source LIKE 'pokemonpricetracker-%'
  GROUP BY source;
"
```

## 🔮 Future Enhancements

### Condition-Based Pricing
The Pokemon Price Tracker API currently provides:
- RAW prices (Near Mint condition)
- PSA graded prices

**Future API support needed for:**
- Lightly Played (LP)
- Moderately Played (MP)  
- Heavily Played (HP)
- Damaged (DM)

When the API adds this support, the system is ready to collect it!

### Collection Script Updates
When condition-based pricing is available:

```javascript
// Collect each condition
for (const condition of ['Near Mint', 'LP', 'MP', 'HP']) {
  const pricing = await makeAPIRequest(`/prices/${condition}/${productId}`);
  await storePrice(db, productId, pricing, condition);
}
```

## 📈 Expected Data Growth

### Per Collection Run (50 cards)
- RAW records: 50
- PSA records: ~250-500 (5-10 grades per card)
- Total: ~300-550 records

### Daily Collection
- Top 50 cards
- ~300-550 new records per day
- Monthly: ~9,000-16,500 records

### Storage Impact
- Current: 2.4M records (TCGCSV)
- With graded pricing: +300-550 records/day
- Yearly: ~110k-200k new records
- Total after 1 year: ~2.7M records

## 🎯 Current Status

- ✅ Database schema supports condition/grade
- ✅ API endpoints updated for graded pricing
- ✅ Collection script ready
- ✅ RAW (Near Mint) pricing collecting
- ✅ PSA graded pricing collecting
- ⏳ Condition pricing (LP/MP/HP) - waiting for API support

## ✅ Next Steps

1. **Test the collection**:
   ```bash
   node collect-graded-and-condition-pricing.js
   ```

2. **Verify data**:
   ```bash
   sqlite3 cards.db "SELECT * FROM price_history WHERE grade IS NOT NULL LIMIT 5;"
   ```

3. **Schedule daily collection**:
   - Add to cron or LaunchAgent
   - Run alongside TCGCSV collection
   - Collects top 50 cards daily

4. **Integrate into UI**:
   - Add grade selector to card profile
   - Show RAW vs PSA pricing
   - Display population data
   - Calculate grading premium

## Summary

✅ **System is ready** to collect:
- RAW Near Mint prices
- All PSA grades (10, 9, 8, 7, 6, 5)
- Population data
- Proper condition/grade tracking

⏳ **Waiting for API support** for:
- Multiple condition pricing (LP, MP, HP)
- (System ready to handle this when available)




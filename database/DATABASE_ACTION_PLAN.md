# Database Improvement Action Plan

**Created**: October 9, 2025  
**Status**: In Progress

---

## ✅ Completed Tasks

### 1. Remove TCG Pocket Cards
- ✅ Removed 973 digital-only cards
- ✅ Removed 48 empty sets
- ✅ **Result**: 20,700 cards remaining across 189 sets

### 2. Database Optimization
- ✅ Added 14 performance indexes
- ✅ Fixed supertype inconsistency (Pokemon → Pokémon)
- ✅ Added card classification flags

---

## 🎯 Immediate Actions Required

### Priority 1: Update Pricing (CRITICAL)
**Goal**: Get current, accurate prices for all 20,700 cards

**Steps**:
1. Test price update on Destined Rivals set
   ```bash
   cd database
   node update_all_prices.js set sv10
   ```

2. Update all cards with missing/old prices (batch approach)
   ```bash
   node update_all_prices.js all 50 20
   # Updates 20 batches of 50 cards = 1,000 cards
   ```

3. Schedule regular price updates
   - Run daily for cards updated > 7 days ago
   - Run weekly for all cards

**Expected Outcome**:
- 95%+ cards should have current prices
- Destined Rivals (sv10) should have full pricing
- Prices updated within last 7 days

---

### Priority 2: Import Artist Data
**Goal**: Fill 2,610 missing artist records

**Requirements**:
- Need path to your complete artist CSV file
- CSV should have columns: card_id/name, set_id (optional), artist/illustrator

**Steps**:
1. Place CSV file in database folder
2. Run import script
   ```bash
   node import_artists.js ./artists.csv
   ```

**Expected Outcome**:
- 90%+ cards should have artist information
- Complete metadata for card profiles

---

### Priority 3: Expand Card Database with TCGdex
**Goal**: Add missing Japanese, Promo, and Trainer cards

**Steps**:
1. Sync missing sets (Promos, Japanese exclusives)
   ```bash
   node tcgdex_sync.js missing
   ```

2. Optional: Sync all sets for complete coverage
   ```bash
   node tcgdex_sync.js all
   ```

**Expected Outcome**:
- Complete Promo coverage
- Japanese exclusive sets added
- Trainer Kit cards included
- Multi-language card data available

---

### Priority 4: Validate Image URLs
**Goal**: Ensure all cards have working image URLs

**Status**: Images are API URLs (no storage needed) ✅

**Action**:
- Images are dynamically loaded from:
  - pokemontcg.io
  - tcgdex.net
  - assets.tcgdex.net
- No validation needed unless URLs break

---

## 📊 Current Database Stats

```
Total Cards:       20,700
Total Sets:          189
Cards with Prices: 18,082 (87.4%)
Missing Prices:     2,618 (12.6%)
Missing Artists:    2,610 (12.6%)
Missing Images:       941 (4.5%)
```

---

## 🚀 Execution Timeline

### Day 1 (Today):
- ✅ Remove TCG Pocket cards
- 🔄 Test price update on sv10 (Destined Rivals)
- 🔄 Update 1,000 cards with missing prices

### Day 2:
- 🔄 Import artist CSV data
- 🔄 Continue price updates (batches of 1,000)

### Day 3:
- 🔄 Sync missing sets from TCGdex
- 🔄 Complete remaining price updates

### Day 4:
- 🔄 Validate data quality
- 🔄 Run final statistics report

---

## 📝 Scripts Created

### 1. `remove_tcg_pocket.js` ✅
- Removes digital-only TCG Pocket cards
- **Status**: Executed successfully

### 2. `update_all_prices.js`
- Updates card prices from Pokemon TCG API
- **Usage**:
  ```bash
  # Update specific set
  node update_all_prices.js set sv10
  
  # Update all cards (50 per batch, max 10 batches)
  node update_all_prices.js all 50 10
  ```

### 3. `tcgdex_sync.js`
- Syncs cards from TCGdex API
- **Usage**:
  ```bash
  # Sync missing sets (Promos, Japanese)
  node tcgdex_sync.js missing
  
  # Sync specific set
  node tcgdex_sync.js sv10
  
  # Sync everything
  node tcgdex_sync.js all
  ```

### 4. `import_artists.js`
- Imports artist data from CSV
- **Usage**:
  ```bash
  node import_artists.js ./path/to/artists.csv
  ```

### 5. `simple_improvements.js` ✅
- Adds performance indexes
- **Status**: Executed successfully

### 6. `cleanup_data.js` ✅
- Fixes data inconsistencies
- **Status**: Executed successfully

---

## 🔧 API Keys Needed

### Pokemon TCG API (for pricing)
- Get free key at: https://pokemontcg.io/
- Set environment variable:
  ```bash
  export POKEMON_TCG_API_KEY="your-key-here"
  ```

### TCGdex API
- No API key required
- Free public API
- Rate limit: ~500ms between requests

---

## 🎯 Success Metrics

### After Completion:
- ✅ 95%+ cards have current prices (updated within 7 days)
- ✅ 95%+ cards have artist information
- ✅ 100% coverage of English sets
- ✅ Japanese/International sets included
- ✅ All Promo sets added
- ✅ Image URLs validated
- ✅ Database size: ~30-35MB
- ✅ Query performance: <100ms for searches

---

## 📞 Next Steps

1. **Run Destined Rivals price update** (test)
2. **Provide artist CSV file location**
3. **Get Pokemon TCG API key** (for unlimited requests)
4. **Review sync strategy** for TCGdex

Once you provide the artist CSV location and API key, we can automate the entire process!

---

## 🔄 Maintenance Schedule

### Daily:
- Update prices for cards older than 7 days (automated)

### Weekly:
- Full price sync for all cards
- Sync new sets from TCGdex

### Monthly:
- Database backup
- Performance analysis
- Data quality report

---

## 📈 Expected Results

After completing all tasks:

```
Database Coverage:
├─ Pricing:     95%+ (19,665+ cards)
├─ Artists:     95%+ (19,665+ cards)
├─ Images:      96%+ (19,872+ cards)
├─ Metadata:    100% (all cards)
└─ Sets:        200+ (including Japanese/Promos)

Performance:
├─ Search:      <100ms
├─ Filters:     <50ms
├─ Sort:        <30ms
└─ Load time:   <200ms
```

Your app will have one of the most complete Pokemon card databases available! 🎉





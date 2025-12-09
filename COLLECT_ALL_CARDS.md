# Collect Pricing for ALL Cards

## 🎯 Overview

Collect condition and PSA graded pricing for **all 27,866 individual cards** in the database.

## 📊 Metrics

### Collection Scale
- **Total cards**: 27,866
- **Records per card**: ~7 (conditions + PSA grades)
- **Total records**: ~195,000 per day
- **API calls**: 27,866 requests
- **Time required**: ~7.7 hours (at 1 req/sec)

### Current Status
- ✅ Currently collecting: Top 50 cards daily
- ⏳ Ready to collect: All 27,866 cards

## 🚀 Quick Start

### 1. Test with Dry Run
```bash
# See what would be collected (no data written)
node collect-all-cards-pricing.js --dry-run --limit=100
```

### 2. Start Small Batch
```bash
# Collect first 100 cards
node collect-all-cards-pricing.js --limit=100
```

### 3. Collect All Cards
```bash
# Collect all 27,866 cards (takes ~8 hours)
node collect-all-cards-pricing.js
```

### 4. Resume from Offset
```bash
# Resume from card 1000
node collect-all-cards-pricing.js --offset=1000 --limit=1000
```

## ⚙️ Options

### Limit
```bash
# Process only 1000 cards
node collect-all-cards-pricing.js --limit=1000
```

### Offset
```bash
# Start from card 500
node collect-all-cards-pricing.js --offset=500 --limit=1000
```

### Dry Run
```bash
# Test without writing to database
node collect-all-cards-pricing.js --dry-run --limit=10
```

## 📈 Batching Strategy

### Recommended Approach

**Batch 1: Top 1000 cards** (High value)
```bash
node collect-all-cards-pricing.js --limit=1000
# Time: ~17 minutes
```

**Batch 2: Top 5000 cards** (Popular)
```bash
node collect-all-cards-pricing.js --limit=5000
# Time: ~1.4 hours
```

**Batch 3: All cards** (Complete)
```bash
node collect-all-cards-pricing.js
# Time: ~7.7 hours
```

## 🔄 Daily Incremental Collection

After the initial full collection, continue with:

### Option 1: Daily Full Refresh (8 hours)
```bash
# Add to crontab - runs daily at midnight
0 0 * * * cd /path/to/app && node collect-all-cards-pricing.js
```

### Option 2: Smart Incremental (Focus on High-Value)
```bash
# Top 500 cards daily (14 minutes)
0 3 * * * cd /path/to/app && node collect-all-cards-pricing.js --limit=500
```

### Option 3: Weekly Full + Daily Incremental
```bash
# Daily: Top 500 (14 minutes)
0 3 * * * cd /path/to/app && node collect-all-cards-pricing.js --limit=500

# Weekly: All cards (Sunday 2 AM)
0 2 * * 0 cd /path/to/app && node collect-all-cards-pricing.js
```

## 📊 Progress Tracking

### Monitor While Running
```bash
# Watch records being added
sqlite3 cards.db "
  SELECT 
    DATE(date) as day,
    COUNT(*) as records,
    COUNT(DISTINCT product_id) as unique_cards
  FROM price_history
  WHERE source LIKE 'pokemonpricetracker-%'
  GROUP BY day
  ORDER BY day DESC;
"
```

### Check Latest Status
```bash
sqlite3 cards.db "
  SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT product_id) as unique_cards,
    MAX(date) as latest_date
  FROM price_history
  WHERE source LIKE 'pokemonpricetracker-%';
"
```

## 💾 Storage Requirements

### Estimates
- **Per card**: ~0.05 MB (7 records)
- **Per day**: ~1.4 GB (27,866 cards)
- **Per month**: ~42 GB
- **Per year**: ~511 GB

### Database Size
```bash
# Check current size
ls -lh cards.db

# Check table sizes
sqlite3 cards.db "
  SELECT 
    name,
    COUNT(*) as rows,
    SUM(pgsize) as size_kb
  FROM sqlite_master, dbstat
  WHERE name = 'price_history'
  GROUP BY name;
"
```

## 🎯 Recommended Workflow

### Phase 1: Initial Collection (Week 1)
```bash
# Day 1: Top 1000
node collect-all-cards-pricing.js --limit=1000

# Day 2: Next 1000
node collect-all-cards-pricing.js --offset=1000 --limit=1000

# Continue until all collected
```

### Phase 2: Daily Collection
```bash
# Top 500 cards daily (high-value tracking)
# Add to crontab:
0 3 * * * cd /Users/NikFox/Documents/git/Card_Collecting_app && node collect-all-cards-pricing.js --limit=500
```

### Phase 3: Weekly Refresh
```bash
# All cards weekly (complete refresh)
# Add to crontab:
0 2 * * 0 cd /Users/NikFox/Documents/git/Card_Collecting_app && node collect-all-cards-pricing.js
```

## ✅ Expected Results

### Per Card Data
- **5 Conditions**: NM, LP, MP, HP, DM
- **3 PSA Grades**: 8, 9, 10
- **Market trends**: rising/falling/stable
- **Listing volumes**: Market depth data
- **Population data**: PSA card counts

### Total Database Growth
```
Initial: ~0 records
Week 1: ~195,000 records (initial full collection)
Daily: +1,750 records (top 500)
Weekly: +195,000 records (full refresh)
```

## 🔧 Troubleshooting

### Handle Interruptions
```bash
# Find last processed card
sqlite3 cards.db "
  SELECT MAX(product_id) as last_id
  FROM price_history
  WHERE source LIKE 'pokemonpricetracker-%';
"

# Resume from that point
node collect-all-cards-pricing.js --offset=LAST_ID
```

### Check Errors
```bash
# Test API for a specific card
curl -H "Authorization: Bearer $API_KEY" \
  "https://www.pokemonpricetracker.com/api/v2/cards?tcgPlayerId=89163"
```

### Monitor Rate Limits
```bash
# The script includes 1-second delays
# If you hit rate limits, increase the delay in collect-all-cards-pricing.js
```

## 🎉 Summary

**Yes, it's possible to collect pricing for all cards!**

- ✅ Script ready: `collect-all-cards-pricing.js`
- ✅ Dry run option: Test before committing
- ✅ Batch processing: Flexible limits/offsets
- ✅ Progress tracking: Real-time updates
- ✅ Rate limiting: Built-in delays
- ✅ Resume capability: Continue from any point

**Time Investment:**
- Initial collection: ~8 hours
- Daily updates: 14 minutes (top 500)
- Weekly refresh: ~8 hours

**Data Value:**
- Comprehensive pricing coverage
- Condition and graded prices
- Market trends and volumes
- Population data for PSA grades

Ready to start? Run:
```bash
node collect-all-cards-pricing.js --dry-run --limit=10
```




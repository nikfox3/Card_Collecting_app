# 🔄 Rolling Collection Strategy

## 🎯 Overview

A **2-day rolling collection** that maximizes card coverage within credit limits by collecting half the cards each day.

## 📊 Strategy Details

### Credit Management
- **Total credits**: 19,798
- **Cards per day**: 9,899 (half of available credits)
- **Total coverage**: 19,798 cards (71% of all 27,866 cards)
- **Cycle time**: 2 days

### Daily Schedule
```
Day 1 (Mon/Wed/Fri/Sun): Cards 1-9,899     (First Half)
Day 2 (Tue/Thu/Sat):     Cards 9,900-19,798 (Second Half)
```

### Collection Metrics
- **Time per day**: ~2.75 hours
- **Records per day**: ~69,000
- **API calls per day**: 9,899
- **Credits used per day**: 9,899

## 🚀 Setup

### 1. Install Rolling Collection
```bash
./setup-rolling-collection.sh
```

### 2. Manual Test
```bash
# Test which half will be collected today
./rolling-collection.sh
```

### 3. Monitor Progress
```bash
# Watch today's collection
tail -f logs/rolling-collection-$(date +%Y%m%d).log
```

## 📅 Schedule Examples

### Week 1
- **Monday**: First half (cards 1-9,899)
- **Tuesday**: Second half (cards 9,900-19,798)
- **Wednesday**: First half (cards 1-9,899)
- **Thursday**: Second half (cards 9,900-19,798)
- **Friday**: First half (cards 1-9,899)
- **Saturday**: Second half (cards 9,900-19,798)
- **Sunday**: First half (cards 1-9,899)

### Week 2
- **Monday**: Second half (cards 9,900-19,798)
- **Tuesday**: First half (cards 1-9,899)
- And so on...

## 📈 Data Coverage

### What You Get
- **19,798 cards** with complete pricing data
- **~138,000 records** per 2-day cycle
- **All high-value cards** included (top 18%)
- **Complete condition pricing** (NM, LP, MP, HP, DM)
- **PSA graded data** (grades 8, 9, 10)

### Coverage Analysis
```
Total cards in database: 27,866
Cards collected: 19,798
Coverage: 71%
Missing: 8,068 cards (29%)
```

## 🔄 Advantages

### 1. Maximum Coverage
- Uses all available credits
- Covers 71% of all cards
- Includes all high-value cards

### 2. Regular Updates
- Fresh pricing data every 2 days
- Consistent collection schedule
- Predictable resource usage

### 3. Credit Efficiency
- No wasted credits
- Optimal API usage
- Sustainable long-term

## 📊 Monitoring

### Daily Check
```bash
# See which half is being collected today
echo "Today: $(date +%A)"
if [ $(( $(date +%u) % 2 )) -eq 1 ]; then
  echo "Collecting: First Half (cards 1-9,899)"
else
  echo "Collecting: Second Half (cards 9,900-19,798)"
fi
```

### Progress Tracking
```bash
# Check records collected today
sqlite3 cards.db "
  SELECT 
    COUNT(*) as records,
    COUNT(DISTINCT product_id) as unique_cards
  FROM price_history
  WHERE source LIKE 'pokemonpricetracker-%'
    AND date = date('now');
"
```

### Weekly Summary
```bash
# Check last 7 days
sqlite3 cards.db "
  SELECT 
    DATE(date) as day,
    COUNT(*) as records,
    COUNT(DISTINCT product_id) as unique_cards
  FROM price_history
  WHERE source LIKE 'pokemonpricetracker-%'
    AND date >= date('now', '-7 days')
  GROUP BY day
  ORDER BY day DESC;
"
```

## ⚙️ Configuration

### Modify Collection Size
```bash
# Edit rolling-collection.sh
TOTAL_CREDITS=19798
CARDS_PER_DAY=$((TOTAL_CREDITS / 2))  # Change divisor for different splits
```

### Alternative Schedules
```bash
# 3-day cycle (6,599 cards per day)
CARDS_PER_DAY=$((TOTAL_CREDITS / 3))

# 4-day cycle (4,949 cards per day)  
CARDS_PER_DAY=$((TOTAL_CREDITS / 4))
```

## 🔧 Troubleshooting

### Check Cron Job
```bash
crontab -l | grep rolling-collection
```

### Manual Run
```bash
# Run today's collection manually
./rolling-collection.sh
```

### Check Logs
```bash
# View today's log
cat logs/rolling-collection-$(date +%Y%m%d).log

# View all rolling logs
ls -la logs/rolling-collection-*.log
```

## 📈 Expected Results

### Daily Output
- **9,899 cards** processed
- **~69,000 records** collected
- **~2.75 hours** runtime
- **9,899 credits** used

### 2-Day Cycle Output
- **19,798 cards** processed
- **~138,000 records** collected
- **Complete coverage** of available cards
- **All credits** utilized efficiently

## ✅ Files Created

1. ✅ `rolling-collection.sh` - Main rolling collection script
2. ✅ `setup-rolling-collection.sh` - Setup helper
3. ✅ `collect-all-cards-pricing.js` - Updated with credit limits
4. ✅ `CREDIT_LIMIT_STRATEGY.md` - Credit management guide

## 🎉 Summary

**Rolling collection maximizes your credit usage!**

✅ **19,798 cards** covered (71% of all cards)  
✅ **2-day cycle** for complete coverage  
✅ **~2.75 hours** per day  
✅ **All high-value cards** included  
✅ **Sustainable** long-term strategy  

### Start Rolling Collection

```bash
# Setup automation
./setup-rolling-collection.sh

# Or run manually
./rolling-collection.sh
```

**Perfect solution for credit-limited collection!** 🔄




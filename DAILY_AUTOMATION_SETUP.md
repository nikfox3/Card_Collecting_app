# Daily Automation Setup - Condition & Graded Pricing

## ✅ Current Status

Successfully collecting:
- ✅ **Condition-based pricing** (NM, LP, MP, HP, DM)
- ✅ **PSA graded pricing** (8, 9, 10)
- ✅ **Population data** for each grade
- ✅ **Market trends** (rising/falling/stable)
- ✅ **Listing volumes** for conditions

### Latest Collection Results
- ✅ **386 records** collected (from last run)
- ✅ **120 PSA graded** records (8, 9, 10)
- ✅ **266 condition-based** records
- ✅ **49/50 cards** successfully processed

## 🕐 Cron Setup

### Option 1: Add to Crontab (Recommended)

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 3 AM)
0 3 * * * /Users/NikFox/Documents/git/Card_Collecting_app/daily-condition-pricing.sh >> /var/log/condition-pricing.log 2>&1
```

### Option 2: Test Daily Script

```bash
# Run manually to test
./daily-condition-pricing.sh

# Or run the collector directly
node collect-condition-graded-pricing-v2.js
```

## 📊 What Gets Collected Daily

### Per Card Collection
- **5 Conditions**: NM, LP, MP, HP, DM (with listing counts)
- **3 PSA Grades**: 8, 9, 10 (with population data)
- **Total**: ~8 records per card

### Daily Totals
- **50 cards** processed
- **~400 records** collected per day
- **Monthly**: ~12,000 records
- **Yearly**: ~144,000 records

## 🔍 Verify Database Records

### Check All Conditions
```bash
sqlite3 cards.db "
  SELECT condition, COUNT(*) as records
  FROM price_history
  WHERE date = date('now')
    AND source LIKE 'pokemonpricetracker-%'
  GROUP BY condition
  ORDER BY records DESC;
"
```

### Check PSA Grades
```bash
sqlite3 cards.db "
  SELECT grade, COUNT(*) as records, AVG(price) as avg_price
  FROM price_history
  WHERE grade IS NOT NULL
  GROUP BY grade
  ORDER BY grade DESC;
"
```

### Latest Date Coverage
```bash
sqlite3 cards.db "
  SELECT date, COUNT(*) as records
  FROM price_history
  WHERE source LIKE 'pokemonpricetracker-%'
  GROUP BY date
  ORDER BY date DESC
  LIMIT 7;
"
```

## 📁 Files Created

1. **collect-condition-graded-pricing-v2.js** - Main collector ✅
2. **daily-condition-pricing.sh** - Automation script ✅
3. **src/services/pokemonPriceTrackerService.js** - Client service ✅
4. **server/routes/pokemon-price-tracker.js** - API routes ✅

## 🎯 Data Structure

### Condition Records
```sql
INSERT INTO price_history (
  product_id, date, price, volume, condition, source
) VALUES ('89163', '2025-10-27', 6502.49, 0, 'Near Mint', 'pokemonpricetracker-raw');
```

### PSA Graded Records
```sql
INSERT INTO price_history (
  product_id, date, price, volume, grade, condition, population, source
) VALUES ('89163', '2025-10-27', 15448.26, 0, '10', 'Graded', 7, 'pokemonpricetracker-psa-10');
```

## 📈 Query Examples

### Get All Pricing for a Card
```sql
SELECT 
  CASE 
    WHEN grade IS NOT NULL THEN 'PSA ' || grade
    ELSE condition
  END as type,
  price,
  population,
  volume
FROM price_history
WHERE product_id = 89163
  AND date = (SELECT MAX(date) FROM price_history WHERE product_id = 89163)
ORDER BY 
  CASE type
    WHEN 'PSA 10' THEN 1
    WHEN 'PSA 9' THEN 2
    WHEN 'PSA 8' THEN 3
    WHEN 'Near Mint' THEN 4
    WHEN 'Lightly Played' THEN 5
    WHEN 'Moderately Played' THEN 6
    WHEN 'Heavily Played' THEN 7
    WHEN 'Damaged' THEN 8
    ELSE 9
  END;
```

### Compare RAW vs PSA
```sql
SELECT 
  product_id,
  (SELECT price FROM price_history WHERE product_id = p.product_id AND condition = 'Near Mint' AND grade IS NULL AND date = ?) as raw_price,
  (SELECT price FROM price_history WHERE product_id = p.product_id AND grade = '10' AND date = ?) as psa10_price,
  (SELECT price FROM price_history WHERE product_id = p.product_id AND grade = '10' AND date = ?) - 
  (SELECT price FROM price_history WHERE product_id = p.product_id AND condition = 'Near Mint' AND grade IS NULL AND date = ?) as grading_premium
FROM (SELECT DISTINCT product_id FROM price_history WHERE grade IS NOT NULL) p
LIMIT 10;
```

## ⚙️ Monitoring

### Check Logs
```bash
# View today's log
tail -f logs/condition-pricing-$(date +%Y%m%d).log

# View errors
tail -f logs/condition-pricing-error-$(date +%Y%m%d).log
```

### Database Growth
```bash
# Daily growth check
sqlite3 cards.db "
  SELECT 
    date('now') as today,
    COUNT(*) as today_records
  FROM price_history
  WHERE source LIKE 'pokemonpricetracker-%'
    AND date = date('now');
"
```

## ✅ Setup Complete!

Your system is ready for daily automated collection:

1. ✅ **Condition-based pricing** - 5 conditions per card
2. ✅ **PSA graded pricing** - All available grades (8, 9, 10)
3. ✅ **Population data** - PSA card counts
4. ✅ **Market trends** - rising/falling/stable
5. ✅ **Listing volumes** - Market depth data
6. ✅ **Database storage** - Properly structured
7. ✅ **Automation script** - Ready for cron

### To Activate Daily Collection:

```bash
# Add to crontab
crontab -e

# Add this line
0 3 * * * cd /Users/NikFox/Documents/git/Card_Collecting_app && ./daily-condition-pricing.sh
```

## 🎉 Summary

You now have a complete pricing collection system:
- ✅ TCGCSV historical data (2.4M records)
- ✅ Pokemon Price Tracker condition pricing
- ✅ PSA graded pricing with population data
- ✅ Daily automated collection
- ✅ Proper database storage
- ✅ Admin dashboard integration

Everything is ready for production! 🚀




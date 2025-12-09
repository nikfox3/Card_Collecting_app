# 📊 Background Pricing Collection & Import Guide

## Overview

This system allows you to collect pricing data for **ALL 20,700 cards** in the background, save it to a CSV file, and then bulk import it via the admin dashboard.

---

## 🎯 Why Use This Approach?

### **Benefits:**
- ✅ **Run in background** - Can run overnight or while you work
- ✅ **Pauseable** - Press Ctrl+C to stop, data is saved periodically
- ✅ **Reviewable** - Check prices before importing
- ✅ **Safe** - No direct database updates until you approve
- ✅ **Complete** - Processes ALL 20,700 cards (not just 1,000)
- ✅ **CSV export** - Easy to review, edit, or share

### **Process:**
1. **Collect** pricing data to CSV file (3-4 hours)
2. **Review** the CSV file with all price updates
3. **Import** via admin dashboard with one click

---

## 🚀 Step-by-Step Instructions

### **Step 1: Start Background Collection**

```bash
# This will run for 3-4 hours to collect all 20,700 card prices
npm run pricing:collect-all
```

or run in the background:

```bash
# macOS/Linux - run in background
nohup npm run pricing:collect-all > pricing-collection.log 2>&1 &

# View progress
tail -f pricing-collection.log
```

### **Step 2: Monitor Progress**

The script will show:
- Current batch being processed
- Progress percentage
- Elapsed time vs remaining time
- Success/error counts

Example output:
```
📦 Batch 50/207
   Progress: 5000/20700 (24.2%)
   ⏱️  Elapsed: 45.2m | Remaining: ~141.5m
   💾 Saved 4,823 price updates to price-updates-2025-10-13.csv
```

### **Step 3: Collect Results**

When complete, you'll have a CSV file:
```
price-updates-2025-10-13.csv
```

The CSV contains:
- Card ID
- Card Name
- Set Name
- Old Price
- New Price
- Price Change %
- Update Timestamp

### **Step 4: Import via Admin Dashboard**

1. **Open Admin Dashboard**
   ```
   http://localhost:3003
   ```

2. **Navigate to "Price Importer"**
   - Click "Price Importer" in the left sidebar

3. **Upload CSV File**
   - Click "Select CSV File"
   - Choose your `price-updates-2025-10-13.csv` file

4. **Review Updates**
   - See statistics: total updates, increases, decreases
   - Preview changes before importing
   - Filter by price increases/decreases

5. **Import All**
   - Click "Import All" button
   - Confirm the import
   - Wait for completion (~2-5 minutes for 20,700 cards)

---

## 📊 Features

### **CSV Collector (`update-all-prices-to-csv.js`)**

**Features:**
- Processes ALL cards in database
- Saves progress every 100 cards
- Can be interrupted (Ctrl+C) without losing data
- Shows detailed progress and time estimates
- Handles rate limiting automatically
- Converts EUR prices to USD (1.10 multiplier)

**What it collects:**
- TCGPlayer prices (USD) - preferred
- Cardmarket prices (EUR → USD) - fallback
- 1-day, 7-day, 30-day averages when available

### **Admin Dashboard Price Importer**

**Features:**
- Upload CSV files
- Preview all changes before importing
- Statistics dashboard (increases, decreases, averages)
- Filter by price changes
- Bulk import in batches of 50
- Progress tracking during import
- Success/error reporting

---

## ⏱️ Time Estimates

| Task | Time | Notes |
|------|------|-------|
| Collect 20,700 prices | 3-4 hours | Can run in background |
| Review CSV | 5-10 min | Optional |
| Import to database | 2-5 min | Via admin dashboard |
| **Total** | **3-4 hours** | Most of it unattended |

---

## 💾 Data Format

### **CSV Structure:**
```csv
card_id,card_name,set_name,old_price,new_price,price_change,update_timestamp
swsh7-95,"Umbreon VMAX","Evolving Skies",16.07,111.00,590.48,2025-10-13T18:34:17.000Z
swsh7-217,"Rayquaza VMAX","Evolving Skies",5.21,3.87,-25.72,2025-10-13T18:27:10.000Z
base1-4,"Charizard","Base",305.88,144.50,-52.76,2025-10-13T18:22:38.000Z
```

### **Fields:**
- **card_id**: Unique card identifier (e.g., `swsh7-95`)
- **card_name**: Card name (quoted, handles special characters)
- **set_name**: Set name (quoted)
- **old_price**: Current price in database
- **new_price**: New price from TCGdex
- **price_change**: Percentage change
- **update_timestamp**: ISO 8601 timestamp

---

## 🔧 Advanced Options

### **Pause and Resume**

The collector saves every 100 cards, so you can:

1. **Stop the collector** (Ctrl+C)
2. **Check the CSV file** - see what's been collected
3. **Import partial data** - use what you have so far
4. **Resume later** - run again to collect remaining cards

### **Custom Processing**

Edit the CSV file before importing:
- Remove cards you don't want to update
- Manually adjust specific prices
- Filter by price change threshold

### **Batch Imports**

For very large files, the importer automatically:
- Processes in batches of 50 cards
- Shows progress during import
- Handles errors gracefully
- Continues even if some cards fail

---

## 🛡️ Safety Features

### **CSV Collection:**
- ✅ No direct database updates
- ✅ Progress saved periodically
- ✅ Can be interrupted safely
- ✅ All data reviewable before import

### **Admin Import:**
- ✅ Preview before importing
- ✅ Confirmation required
- ✅ Batch processing prevents timeouts
- ✅ Error handling and reporting

---

## 📈 Expected Results

### **Coverage:**
Based on our 1,000 card test:
- **Success rate**: ~99%
- **Cards found**: ~19,800 out of 20,700
- **Cards not found**: ~900 (very old/regional cards)

### **Price Updates:**
From our test batch:
- **Total updates**: 990
- **Price increases**: ~450
- **Price decreases**: ~540
- **Average change**: Varies by card age/rarity

---

## 🚨 Troubleshooting

### **Collection Issues:**

**Problem**: Script stops with "Rate limited"
- **Solution**: Script will automatically retry after 5 seconds

**Problem**: "Card not found" errors
- **Normal**: ~5% of cards (old/regional cards not in TCGdex)
- **Action**: These cards keep their current prices

**Problem**: Script is taking too long
- **Expected**: 3-4 hours for all 20,700 cards
- **Tip**: Run overnight or in background

### **Import Issues:**

**Problem**: CSV file won't upload
- **Check**: File must be `.csv` format
- **Check**: File size (should be ~2-5 MB)
- **Solution**: Re-download or re-generate the file

**Problem**: Import is slow
- **Normal**: Large imports take 2-5 minutes
- **Reason**: Processing 20,700 updates in batches

**Problem**: Some cards failed to import
- **Check**: Import completion message shows success/error counts
- **Action**: Review error log, re-run import for failed cards

---

## 📝 Quick Reference

### **Commands:**

```bash
# Collect all prices to CSV
npm run pricing:collect-all

# Collect in background (macOS/Linux)
nohup npm run pricing:collect-all > pricing.log 2>&1 &

# View progress
tail -f pricing.log

# Stop collection (if running in foreground)
Ctrl+C
```

### **Files Created:**

- `price-updates-YYYY-MM-DD.csv` - Price collection results
- `pricing-collection.log` - Log file (if run in background)

### **Admin Dashboard:**

- URL: `http://localhost:3003/prices`
- Login required (admin credentials)
- Upload CSV → Review → Import

---

## ✅ Verification

After importing, verify the updates:

### **1. Check Database:**
```bash
sqlite3 database/cards.db "SELECT COUNT(*) as updated FROM cards WHERE updated_at >= date('now');"
```

### **2. Check Admin Dashboard:**
- Browse cards, check prices are updated
- Sort by "Updated At" to see recent changes

### **3. Check Main App:**
- Open card profiles, verify prices match
- Check that charts have data

---

## 🎉 Success Criteria

After completing the full process:

- ✅ **~19,800 cards** with updated prices
- ✅ **CSV file** with all price changes
- ✅ **Admin dashboard** shows updated prices
- ✅ **Main app** displays new market values
- ✅ **Price history** data available for charts

---

## 💡 Pro Tips

1. **Run overnight** - Start before bed, wake up to completed collection
2. **Review big changes** - Check cards with >100% price changes
3. **Keep CSV files** - Archive for price history tracking
4. **Schedule regularly** - Monthly full updates recommended
5. **Backup first** - Always backup database before bulk imports

---

## 📞 Need Help?

If you encounter issues:

1. Check the log file for errors
2. Review the CSV file for data quality
3. Test with a small batch first (filter CSV to 10-20 cards)
4. Verify API server is running (`http://localhost:3001`)
5. Check admin dashboard connection

---

**Status:** ✅ Ready to use
**Estimated Total Time:** 3-4 hours (mostly unattended)
**Success Rate:** ~99% of cards









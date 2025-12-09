# 🤖 Automated Daily Price Updates - Complete Guide

**Last Updated:** October 14, 2025  
**Status:** Ready to Deploy

---

## 🎯 Overview

This system automatically collects Pokemon card prices daily and updates your database, ensuring your price history charts always have the latest data.

### **What It Does:**
1. ✅ Backs up database before making changes
2. ✅ Collects latest prices from Pokemon TCG API
3. ✅ Archives current prices to history table
4. ✅ Imports new prices
5. ✅ Updates current_value for all cards
6. ✅ Restarts API server (if running)
7. ✅ Sends desktop notification
8. ✅ Logs all activities
9. ✅ Automatically cleans up old backups

---

## 🚀 Quick Start

### **Option 1: Automated (Recommended)**

```bash
# 1. Make scripts executable
cd /Users/NikFox/Documents/git/Card_Collecting_app
chmod +x setup-daily-automation.sh
chmod +x daily-price-update.sh

# 2. Run setup wizard
./setup-daily-automation.sh

# 3. Follow prompts to choose:
#    - launchd (Recommended for macOS)
#    - cron (Traditional Unix)
#    - Manual (Run yourself)
```

### **Option 2: Manual Run**

```bash
# Run anytime manually
cd /Users/NikFox/Documents/git/Card_Collecting_app
./daily-price-update.sh
```

---

## 📋 Setup Methods

### **Method 1: launchd (macOS Recommended)** ⭐

**Best for:** macOS users who want reliable, system-integrated automation

**Advantages:**
- ✅ Runs even if you're not logged in
- ✅ Automatic restarts on failure
- ✅ Better system integration
- ✅ Easier to manage

**Setup:**
```bash
./setup-daily-automation.sh
# Choose option 1
```

**Commands:**
```bash
# Check status
launchctl list | grep pokemoncards

# Run immediately
launchctl start com.pokemoncards.dailyupdate

# Stop automation
launchctl stop com.pokemoncards.dailyupdate

# Disable permanently
launchctl unload ~/Library/LaunchAgents/com.pokemoncards.dailyupdate.plist

# Re-enable
launchctl load ~/Library/LaunchAgents/com.pokemoncards.dailyupdate.plist

# View logs
tail -f logs/launchd-stdout.log
tail -f logs/launchd-stderr.log
```

---

### **Method 2: cron (Traditional)**

**Best for:** Users familiar with cron, or non-macOS systems

**Setup:**
```bash
./setup-daily-automation.sh
# Choose option 2
```

**Commands:**
```bash
# View all cron jobs
crontab -l

# Edit cron jobs
crontab -e

# Remove this cron job
crontab -l | grep -v 'daily-price-update' | crontab -

# View logs
tail -f logs/cron.log
```

**Cron Schedule Format:**
```
0 2 * * *  → Runs daily at 2:00 AM
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, Sunday=0 or 7)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

**Custom Schedules:**
```bash
# Every 6 hours
0 */6 * * * /path/to/daily-price-update.sh

# Twice daily (2 AM and 2 PM)
0 2,14 * * * /path/to/daily-price-update.sh

# Every Monday at 3 AM
0 3 * * 1 /path/to/daily-price-update.sh

# First day of month at midnight
0 0 1 * * /path/to/daily-price-update.sh
```

---

### **Method 3: Manual Execution**

**Best for:** Testing, development, or when you want full control

**Usage:**
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
./daily-price-update.sh
```

---

## 📊 What Happens During Each Run

### **Step-by-Step Process:**

1. **Database Backup** (5-10 seconds)
   ```
   📦 Creates timestamped backup
   💾 Saved to: backups/cards-YYYYMMDD-HHMMSS.db
   🧹 Deletes backups older than 7 days
   ```

2. **Price Collection** (5-15 minutes depending on cards)
   ```
   💰 Runs update-all-prices-to-csv.js
   📄 Creates pokemon-price-history.csv
   📝 Logs progress and statistics
   ```

3. **Price Import** (30-60 seconds)
   ```
   📊 Archives yesterday's prices
   💾 Imports today's prices
   🔄 Updates current_value in cards table
   📈 Adds records to price_history table
   ```

4. **Server Restart** (2-3 seconds)
   ```
   🔄 Detects if server is running
   🛑 Gracefully stops old instance
   🚀 Starts new instance
   📝 Logs new process ID
   ```

5. **Notification** (instant)
   ```
   📧 Sends macOS desktop notification
   ✅ Shows success message
   ```

6. **Logging & Cleanup** (instant)
   ```
   📝 Saves detailed log
   📊 Generates summary report
   🧹 Cleans up old logs
   ```

**Total Time:** ~5-20 minutes (depending on API speed)

---

## 📁 File Structure

```
Card_Collecting_app/
├── daily-price-update.sh              # Main automation script
├── setup-daily-automation.sh          # Setup wizard
├── import-prices-with-history.js      # Import script
├── update-all-prices-to-csv.js        # Price collection script (optional)
│
├── logs/                              # Log files
│   ├── price-update-20251014.log     # Daily logs
│   ├── launchd-stdout.log            # launchd output
│   ├── launchd-stderr.log            # launchd errors
│   ├── cron.log                      # Cron output
│   └── summary-20251014.txt          # Daily summaries
│
├── backups/                           # Database backups
│   ├── cards-20251014-020000.db      # Timestamped backups
│   └── (kept for 7 days)
│
└── public/Pokemon database files/
    └── pokemon-price-history.csv      # Latest price data
```

---

## 📝 Logs & Monitoring

### **View Real-Time Progress:**
```bash
# Follow today's log
tail -f logs/price-update-$(date +%Y%m%d).log

# Watch for errors
tail -f logs/price-update-*.log | grep ERROR

# View last 50 lines
tail -50 logs/price-update-$(date +%Y%m%d).log
```

### **Check Summary Reports:**
```bash
# View latest summary
cat logs/summary-$(date +%Y%m%d).txt

# View all summaries
ls -lt logs/summary-*.txt | head -10
```

### **Log Format:**
```
[2025-10-14 02:00:01] 🚀 Starting Daily Price Update
[2025-10-14 02:00:02] 📦 Creating database backup...
[2025-10-14 02:00:05] ✅ Database backed up to: backups/cards-20251014-020000.db
[2025-10-14 02:00:05] 💰 Collecting latest prices...
[2025-10-14 02:15:30] ✅ Price collection completed
[2025-10-14 02:15:31] 📊 Importing prices with history preservation...
[2025-10-14 02:16:45] ✅ Price import completed successfully
[2025-10-14 02:16:45] 📈 Statistics:
[2025-10-14 02:16:45]    - Total price history records: 110815
[2025-10-14 02:16:45]    - Cards with pricing: 19450
[2025-10-14 02:16:47] ✅ Daily Price Update Complete!
```

---

## 🛠️ Troubleshooting

### **Problem: Script doesn't run automatically**

**launchd:**
```bash
# Check if loaded
launchctl list | grep pokemoncards

# View logs
tail -f logs/launchd-stderr.log

# Reload
launchctl unload ~/Library/LaunchAgents/com.pokemoncards.dailyupdate.plist
launchctl load ~/Library/LaunchAgents/com.pokemoncards.dailyupdate.plist
```

**cron:**
```bash
# Check if cron job exists
crontab -l | grep daily-price-update

# Check system logs
log show --predicate 'process == "cron"' --last 1h
```

---

### **Problem: Price collection fails**

**Check:**
1. Internet connection
2. Pokemon TCG API status
3. API rate limits
4. Script permissions

**Fix:**
```bash
# Test price collection manually
node update-all-prices-to-csv.js

# Check API key (if using one)
echo $POKEMON_TCG_API_KEY

# Verify script exists
ls -la update-all-prices-to-csv.js
```

---

### **Problem: Database locked**

**Cause:** Another process is using the database

**Fix:**
```bash
# Find processes using database
lsof database/cards.db

# Kill stuck processes
pkill -f "node server/server.js"
pkill -f "import-prices"

# Wait and retry
sleep 5
./daily-price-update.sh
```

---

### **Problem: Server doesn't restart**

**Check:**
```bash
# Is server running?
ps aux | grep "node server/server.js"

# Check server logs
tail -f server.log

# Manually restart
pkill -f "node server/server.js"
node server/server.js &
```

---

## 📊 Monitoring & Alerts

### **Setup Email Alerts (Optional)**

Edit `daily-price-update.sh` and uncomment:
```bash
# Line 122
echo "Daily price update completed at $(date)" | mail -s "Pokemon Prices Updated" your@email.com
```

**Or use a webhook (Slack, Discord, etc.):**
```bash
# Add after line 122
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Pokemon card prices updated: $CARDS_WITH_PRICING cards\"}"
```

---

### **Check Statistics**

```bash
# View database stats
sqlite3 database/cards.db "
  SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT product_id) as unique_cards,
    MIN(date) as earliest,
    MAX(date) as latest
  FROM price_history;
"

# Cards updated today
sqlite3 database/cards.db "
  SELECT COUNT(*) 
  FROM price_history 
  WHERE date = date('now');
"

# Price changes today
sqlite3 database/cards.db "
  SELECT 
    p1.product_id,
    p1.price as old_price,
    p2.price as new_price,
    (p2.price - p1.price) as change
  FROM price_history p1
  JOIN price_history p2 ON p1.product_id = p2.product_id
  WHERE p1.date = date('now', '-1 day')
    AND p2.date = date('now')
    AND ABS(p2.price - p1.price) > 5
  ORDER BY ABS(change) DESC
  LIMIT 10;
"
```

---

## 🎯 Best Practices

### **1. Regular Monitoring**
```bash
# Check logs daily for first week
tail -f logs/price-update-*.log

# Verify data is updating
node query-price-history.js swsh7-236
```

### **2. Backup Strategy**
- ✅ Automatic backups kept for 7 days
- 📝 Consider weekly off-site backups
- 💾 Database is ~50MB, easy to backup

### **3. Server Management**
- ✅ Auto-restart after updates
- 📝 Monitor server.log for errors
- 🔄 Consider PM2 for production

### **4. API Rate Limits**
- ⏱️ Pokemon TCG API has rate limits
- 📊 Script includes delays between requests
- 🛑 Don't run manually while auto-update runs

---

## 📈 Expected Results

### **After First Run:**
- ✅ Database backed up
- ✅ Latest prices imported
- ✅ Price history table updated
- ✅ Charts show new data point

### **After One Week:**
- ✅ 7 days of price history
- ✅ 7 database backups
- ✅ 7 daily logs
- ✅ Charts show weekly trends

### **After One Month:**
- ✅ 30 days of price history
- ✅ Rich trend data
- ✅ Meaningful price analytics
- ✅ Charts fully populated

---

## 🎉 Success Checklist

- [ ] Scripts are executable (`chmod +x`)
- [ ] Automation method chosen and configured
- [ ] Test run completed successfully
- [ ] Logs directory exists and is writable
- [ ] Backups directory exists
- [ ] First automated run completed
- [ ] Notification received
- [ ] Charts show new data
- [ ] Server restarted successfully

---

## 🚀 Next Steps

### **After Setup:**
1. ✅ Run test: `./daily-price-update.sh`
2. ✅ Verify logs: `tail -f logs/price-update-*.log`
3. ✅ Check charts: Open app and view card profile
4. ✅ Wait 24 hours for first automated run
5. ✅ Verify automated run worked

### **Ongoing:**
- 📊 Monitor logs weekly
- 💾 Check database backups monthly
- 📈 Review price trends
- 🔄 Update scripts as needed

---

## 📚 Related Files

- `daily-price-update.sh` - Main automation script
- `setup-daily-automation.sh` - Setup wizard
- `import-prices-with-history.js` - Import logic
- `query-price-history.js` - Query tool
- `PRICE_HISTORY_IMPORT_COMPLETE.md` - Import guide
- `PRICE_CHARTS_INTEGRATION_COMPLETE.md` - Charts guide

---

**🎊 Your Pokemon card prices will now update automatically every day!**

Set it and forget it - your price history charts will grow richer with each passing day.

**Happy automated tracking! 📈**









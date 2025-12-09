# Hashing Progress Guide

## Running in Background

### Start Background Process:
```bash
npm run hashes:pokemontcg-bg
```

This will:
- Start the hashing process in the background
- Log all output to `pokemontcg-hashing.log`
- Create a PID file (`pokemontcg-hashing.pid`) to track the process
- Continue running even if you close the terminal

### Monitor Progress:
```bash
tail -f pokemontcg-hashing.log
```

### Check Status:
```bash
# Check if process is running
ps aux | grep precompute-hashes-pokemontcg

# Or check PID file
cat pokemontcg-hashing.pid
```

### Stop Process:
```bash
kill `cat pokemontcg-hashing.pid`
```

Or manually:
```bash
kill <PID>
```

---

## Progress Logging

The script now includes:

### Progress Updates:
- **Every 10 cards:** Summary with percentage, ETA, and statistics
- **First 5 cards:** Detailed logging for initial verification
- **Final card:** Complete summary

### Progress Information:
- ✅ **Hashed:** Number of cards successfully hashed
- ⏭️ **Skipped:** Cards without set mapping
- ⏭️ **Already hashed:** Cards that already have hashes (skipped unless FORCE_REHASH=true)
- ❌ **Errors:** Cards that failed to hash
- 🔍 **Not found:** Cards with 404 or download failures
- ⏱️ **ETA:** Estimated time remaining
- ⚡ **Average:** Average time per card

### Example Output:
```
📊 Progress: 100/10000 (1.0%) | ✅ Hashed: 95 | ⏭️  Skipped: 3 | ❌ Errors: 2 | 🔍 Not Found: 0 | ⏱️  ETA: 2h 15m
```

---

## Resuming

The script automatically skips cards that already have hashes. To force re-hashing:

```bash
FORCE_REHASH=true npm run hashes:pokemontcg-fixed
```

---

## Performance

### Expected Speed:
- **Rate limiting:** 0.2-0.5s delay between requests
- **Average time per card:** ~0.5-1s (including download + hash)
- **10,000 cards:** ~1.5-3 hours

### Factors Affecting Speed:
- Network speed (downloading images)
- API response time
- Hash computation time
- Database write time

---

## Troubleshooting

### Process Already Running:
```bash
# Check PID file
cat pokemontcg-hashing.pid

# Kill existing process
kill `cat pokemontcg-hashing.pid`

# Remove PID file if process is dead
rm pokemontcg-hashing.pid
```

### Check Logs:
```bash
# View last 50 lines
tail -n 50 pokemontcg-hashing.log

# Search for errors
grep -i error pokemontcg-hashing.log

# Search for progress
grep "Progress:" pokemontcg-hashing.log | tail -20
```

### Common Issues:

1. **Rate Limiting:**
   - Script includes delays (0.2-0.5s)
   - If you see 429 errors, increase delay in script

2. **404 Errors:**
   - Some cards may not be in Pokemon TCG API
   - Check set mapping in script

3. **Database Locked:**
   - Make sure no other process is accessing database
   - Check for stale locks

---

## Monitoring Commands

### Real-time Progress:
```bash
# Watch log file
tail -f pokemontcg-hashing.log | grep -E "Progress:|Processing:|✅|❌"
```

### Statistics:
```bash
# Count hashed cards
grep "✅ Hashed successfully" pokemontcg-hashing.log | wc -l

# Count errors
grep "❌" pokemontcg-hashing.log | wc -l

# Count skipped
grep "⚠️  No Pokemon TCG API" pokemontcg-hashing.log | wc -l
```

### Check Database:
```bash
# Count cards with hashes
sqlite3 cards.db "SELECT COUNT(*) FROM products WHERE image_hash_difference_normal IS NOT NULL AND category_id = 3;"
```

---

## Completion

When complete, you'll see:
```
✅ Hash computation complete!
   📊 Processed: 10000 cards
   ✅ Hashed: 8500 cards
   ⏭️  Skipped: 1200 cards (no set mapping)
   ⏭️  Already hashed: 0 cards
   ❌ Errors: 50 cards
   🔍 Not found: 250 cards (404 or download failed)
   ⏱️  Total time: 2h 15m
   ⚡ Average: 0.81s per card
```

Then test consistency:
```bash
npm run hashes:test-consistency
```


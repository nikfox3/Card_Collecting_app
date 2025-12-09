# Scanning Feature Debug Guide

## Current Issue
Always showing same Base Set cards (Alakazam, Mewtwo, Lightning Energy, Psychic Energy, Water Energy) regardless of what card is scanned.

## What's Working ✅
- Hash length is correct: **5696 bits (64×89)** ✅
- Card extraction is working ✅
- Hash calculation is working ✅
- Hashes are different for different cards ✅

## What's Not Working ❌
- Only 5 matches returned (should be more)
- Always same Base Set cards
- Top similarity shows "N/A"

## Debugging Steps

### 1. Check Server Logs
When you scan a card, check the **SERVER terminal** (where API server is running) for:

```
📊 Comparing against X cards with hashes
📊 Total matches found: X
📊 Top 10 matches (before filtering):
  - Card name, set, similarity, hashDistance
```

### 2. Check Database
Run this to see how many cards have hashes:

```bash
sqlite3 cards.db "SELECT COUNT(*) FROM products WHERE category_id = 3 AND image_hash_difference_normal IS NOT NULL AND image_hash_difference_normal != '';"
```

### 3. Check Which Sets Have Hashes
```bash
sqlite3 cards.db "SELECT g.name as set_name, COUNT(*) as count FROM products p LEFT JOIN groups g ON p.group_id = g.group_id WHERE p.category_id = 3 AND p.image_hash_difference_normal IS NOT NULL AND p.image_hash_difference_normal != '' GROUP BY g.name ORDER BY count DESC LIMIT 10;"
```

## Possible Causes

1. **Database only has hashes for Base Set cards**
   - Solution: Run `npm run hashes:pokemontcg-fixed` to hash more cards

2. **Threshold too strict**
   - Current: 0.05 (95% similarity) - already very lenient
   - All matches might be below this threshold

3. **Similarity calculation bug**
   - Hash distances might be calculated incorrectly
   - Check server logs for hash distances

4. **Database query issue**
   - Query might be filtering incorrectly
   - Check server logs for "Comparing against X cards"

## Next Steps

1. **Check server logs** when scanning - look for similarity scores
2. **Check database** - how many cards have hashes?
3. **Share server logs** - the debug output will show what's happening

## Recent Fixes Applied

- ✅ Fixed hash length mismatch (5760 → 5696 bits)
- ✅ Lowered threshold to 0.05 (95% similarity)
- ✅ Added debug logging for all matches
- ✅ Fixed similarity score mapping

## Expected Behavior

After fixes, you should see:
- Hash length: 5696 bits ✅ (working)
- More matches returned (currently only 5)
- Different cards for different scans (currently always same)
- Similarity scores > 0.05 for correct matches


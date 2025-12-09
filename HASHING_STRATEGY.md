# Image Hashing Strategy - Avoiding TCGPlayer

## 🎯 Problem

TCGPlayer images are **not reliable** for hashing:
- ❌ Rate-limited (403 errors)
- ❌ Slow (5-10 second delays needed)
- ❌ Unreliable (frequent failures)
- ❌ Only 35% of cards hashed (20,502 / 58,382)

## ✅ Solution: Multi-Step Approach

### Step 1: Hash from Cached Images (FASTEST)
**Use images already downloaded** - no rate limits, instant!

```bash
npm run hashes:from-cache
```

**Benefits:**
- ✅ No rate limits (uses local cache)
- ✅ Fast (no downloads needed)
- ✅ Reliable (images already validated)
- ✅ Can hash thousands of cards quickly

**Expected:** Hash ~10,000-15,000 cards from cache

---

### Step 2: Multi-Source for Remaining Cards
**Try alternative sources** before falling back to TCGPlayer

```bash
npm run hashes:multi-source
```

**Sources tried (in order):**
1. **Pokemon TCG API** - Free, high quality, no limits
2. **TCGdx** - Free, good quality, no limits  
3. **Pokemon Price Tracker** - High quality, API key required
4. **TCGPlayer** - Last resort only (rate limited)

**Expected:** Hash ~5,000-10,000 more cards from alternative sources

---

### Step 3: Handle TCGPlayer-Only Cards
**For cards that can ONLY use TCGPlayer:**

**Option A: Skip them** (recommended)
- Focus on cards with alternative sources
- These are usually older/promo sets
- Can be hashed later when TCGPlayer is less rate-limited

**Option B: Hash with very long delays**
- Use 30-60 second delays between downloads
- Only hash a few cards at a time
- Run overnight/weekend when rate limits reset

---

## 📊 Expected Results

| Step | Method | Cards Hashed | Time |
|------|--------|--------------|------|
| **1** | Cache | ~10,000-15,000 | ~1-2 hours |
| **2** | Multi-source | ~5,000-10,000 | ~2-4 hours |
| **3** | TCGPlayer (skip) | 0 | N/A |
| **Total** | | **~15,000-25,000** | **~3-6 hours** |

**Coverage:** ~40-60% of cards (vs current 35%)

---

## 🚀 Recommended Workflow

### 1. Hash from cache first:
```bash
npm run hashes:from-cache
```

### 2. Then hash remaining cards with multi-source:
```bash
LIMIT=1000 npm run hashes:multi-source
```

### 3. Check progress:
```bash
sqlite3 cards.db "SELECT COUNT(*) as total, COUNT(CASE WHEN image_hash_perceptual_normal IS NOT NULL AND image_hash_perceptual_normal != '' THEN 1 END) as hashed FROM products WHERE category_id = 3;"
```

---

## ⚠️ Important Notes

### Cards That Can't Be Hashed Without TCGPlayer:
- Older promo sets (HGSS Trainer Kit, XY Promos, etc.)
- Very old sets (pre-2000)
- Special sets not in Pokemon TCG API
- **These represent ~20-30% of cards**

### What This Means:
- **~70-80% of cards CAN be hashed** using alternative sources
- **~20-30% require TCGPlayer** (can skip for now)
- **Matching will work for most modern cards** (Scarlet & Violet, Sword & Shield, etc.)

---

## 💡 Alternative: Use Existing Hashes

If you have hashes from another database or source:
1. Export hashes from that source
2. Import into this database
3. Use `scripts/copy-hashes-between-databases.js`

---

## 🎯 Bottom Line

**Best approach:**
1. ✅ Hash from cache (fast, reliable)
2. ✅ Use multi-source for modern sets (alternative sources)
3. ⏭️ Skip TCGPlayer-only cards for now (can add later)

This will get you **~60-70% coverage** without relying on TCGPlayer!


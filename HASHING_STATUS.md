# Hashing Status Summary

## ✅ Current Status

**Successfully Hashed: 2,960 cards**
- 1,452 new cards hashed in latest run
- 1,508 cards already had new-format hashes (5696 bits, 64x89 aspect ratio)
- All using Pokemon TCG API images (official, clean, consistent)

**Skipped: 7,040 cards**
- No Pokemon TCG API mapping available
- Mostly promos, Japanese sets, special collections, tournament decks

---

## 📊 Coverage Analysis

### ✅ Well Covered Sets (Main English Sets):
- Base Set, Jungle, Fossil
- Scarlet & Violet era (SV1, SV2, SV3, SV4, SV5, SV6, SV11, SV12)
- Sword & Shield era (SWSH1-SWSH12)
- Sun & Moon era (SM1-SM12)
- XY era (XY1-XY12)

### ⏭️ Skipped Sets (Not in Pokemon TCG API):

**Top Skipped Categories:**
1. **World Championship Decks** (1,874 cards)
   - Tournament deck cards
   - Not available in Pokemon TCG API
   - May be available in TCGPlayer/TCGdx

2. **Miscellaneous Cards & Products** (724 cards)
   - Generic category
   - Various special products
   - May need manual categorization

3. **Prize Pack Series Cards** (652 cards)
   - Special promo cards
   - Limited availability

4. **Japanese Sets with Prefixes:**
   - `SV2a: Pokemon Card 151` (521 cards) - Should map to sv12
   - `SV4a: Shiny Treasure ex` (486 cards) - Japanese set
   - `SV8a: Terastal Fest ex` (485 cards) - Japanese set
   - `S4a: Shiny Star V` (453 cards) - Japanese set
   - `S8b: VMAX Climax` (405 cards) - Japanese set
   - `S12a: VSTAR Universe` (353 cards) - Japanese set

5. **Promos:**
   - `SM-P: Sun & Moon Promos` (409 cards)
   - `S-P: Sword & Shield Promos` (345 cards)
   - Various other promo sets

---

## 🎯 What This Means

### ✅ Good News:
- **Main English sets are well covered** (~30% of database)
- **High-quality reference images** from Pokemon TCG API
- **Proper aspect ratio** (64x89, no distortion)
- **Consistent format** for matching

### ⚠️ Limitations:
- **Many Japanese sets** not in Pokemon TCG API
- **Promos and special collections** limited availability
- **Tournament decks** not in API
- **Some sets** may need alternative sources

---

## 💡 Next Steps

### Option 1: Use Multi-Source Script (Recommended)
Run the multi-source script to try alternative sources for skipped cards:

```bash
npm run hashes:multi-source
```

This will try:
1. Pokemon TCG API (already done)
2. TCGdx (good coverage for Japanese sets)
3. Pokemon Price Tracker (high quality, API key required)
4. TCGPlayer (fallback, rate limited)

### Option 2: Improve Prefix Handling
Some Japanese sets with prefixes can be mapped:
- `SV2a: Pokemon Card 151` → `sv12` (151 set)
- `SV4a: Shiny Treasure ex` → May need TCGdx
- `SV8a: Terastal Fest ex` → May need TCGdx

### Option 3: Accept Limitations
- Many promos/special collections won't have hashes
- Focus on main sets (which are well covered)
- Use manual search for skipped cards

---

## 📈 Matching Performance

With 2,960 cards hashed:
- ✅ **Main English sets**: Excellent coverage
- ✅ **Popular cards**: Well covered
- ✅ **Recent sets**: Good coverage
- ⚠️ **Japanese sets**: Limited coverage
- ⚠️ **Promos**: Limited coverage

**For scanning feature:**
- Should work well for **main English sets**
- May struggle with **Japanese cards** and **promos**
- **Manual search** available as fallback

---

## 🔧 Technical Details

### Hash Format:
- **Type**: dHash only (most reliable)
- **Aspect Ratio**: 64x89 (maintains card proportions 2.5:3.5)
- **Hash Length**: ~5,696 bits
- **Orientations**: 4 (normal, mirrored, upside-down, mirrored+upside-down)

### Image Source:
- **Primary**: Pokemon TCG API (`images.pokemontcg.io`)
- **Format**: `_hires.png` (high resolution)
- **Quality**: Official, clean product shots
- **Consistency**: All from same source

---

## 📝 Recommendations

1. **For best matching**: Use the 2,960 hashed cards (main English sets)
2. **For more coverage**: Run multi-source script for skipped cards
3. **For Japanese cards**: May need TCGdx or manual search
4. **For promos**: Accept limitations or use alternative sources

The current coverage is **excellent for main English sets**, which are the most commonly scanned cards.


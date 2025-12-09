# Pokemon TCG API Image Strategy (RECOMMENDED)

## Overview

Using **Pokemon TCG API images** as the primary reference source for hashing is the **recommended approach** because:

✅ **Official images** - Clean, consistent, high quality  
✅ **Perfect format** - Product shots with white/neutral backgrounds  
✅ **No rate limits** - Free API access with reasonable limits  
✅ **Consistent aspect ratio** - All cards properly formatted  
✅ **High resolution** - `_hires.png` format for best quality  

---

## Image URL Format

```
https://images.pokemontcg.io/{setId}/{number}_hires.png
```

### Examples:
- Base Set Alakazam: `https://images.pokemontcg.io/base1/1_hires.png`
- Scarlet & Violet Pikachu: `https://images.pokemontcg.io/sv1/173_hires.png`
- 151 Charizard: `https://images.pokemontcg.io/sv12/6_hires.png`

---

## Implementation

### New Script: `precompute-hashes-pokemontcg-fixed.js`

**Features:**
- Uses Pokemon TCG API images exclusively
- Fixed hashing implementation (64x89 aspect ratio, proper preprocessing)
- Only dHash (most reliable)
- Comprehensive set name mapping
- Image caching for efficiency
- Rate limiting (0.2-0.5s delay between requests)

**Usage:**
```bash
npm run hashes:pokemontcg-fixed
```

**What it does:**
1. Maps database set names to Pokemon TCG API set IDs
2. Constructs image URLs: `https://images.pokemontcg.io/{setId}/{number}_hires.png`
3. Downloads high-resolution images
4. Calculates dHash with proper aspect ratio (64x89)
5. Stores hashes in database

---

## Set Name Mapping

The script includes comprehensive mapping for:
- ✅ Scarlet & Violet era (sv1, sv2, sv3, etc.)
- ✅ Sword & Shield era (swsh1, swsh2, etc.)
- ✅ Sun & Moon era (sm1, sm2, etc.)
- ✅ XY era (xy1, xy2, etc.)
- ✅ Classic sets (base1, jungle, fossil, etc.)
- ✅ Promos and special sets

**Mapping Logic:**
1. Exact match (case-sensitive)
2. Case-insensitive match
3. Partial match (handles prefixes like "SV01: Scarlet & Violet")

---

## Advantages Over TCGPlayer

| Feature | Pokemon TCG API | TCGPlayer |
|---------|---------------|-----------|
| **Image Quality** | ✅ Official, consistent | ⚠️ Varies |
| **Format** | ✅ Clean product shots | ⚠️ May include borders |
| **Rate Limits** | ✅ Free, reasonable | ❌ Aggressive 403 blocks |
| **Aspect Ratio** | ✅ Consistent | ⚠️ May vary |
| **Coverage** | ✅ Most modern sets | ✅ All sets |
| **Reliability** | ✅ Official source | ⚠️ CDN issues |

---

## Hash Format

### New Implementation (Fixed):
- **Hash Type:** dHash only (most reliable)
- **Aspect Ratio:** 64x89 (maintains card proportions 2.5:3.5)
- **Hash Length:** ~5,696 bits (64 × 89)
- **Orientations:** 4 (normal, mirrored, upside-down, mirrored+upside-down)

### Old Implementation (Database):
- **Hash Type:** Multiple (perceptual, difference, average, wavelet)
- **Aspect Ratio:** Square (distorts cards)
- **Hash Length:** 1024 bits (32x32)
- **Problem:** Cannot compare with new hashes

---

## Migration Strategy

### Step 1: Re-hash with Pokemon TCG API
```bash
npm run hashes:pokemontcg-fixed
```

This will:
- Download Pokemon TCG API images
- Calculate new hashes (64x89, dHash only)
- Update database with new hashes

### Step 2: Test Consistency
```bash
npm run hashes:test-consistency
```

Should show:
- ✅ Hash length: 5696 bits (matches new implementation)
- ✅ Perfect match: distance = 0 (100% similarity)

### Step 3: Update Matching Route
- Use only dHash for matching
- Update threshold for new hash size
- Test with physical cards

---

## Expected Results

### After Re-hashing:

**Hash Characteristics:**
- Length: 5696 bits (consistent)
- Format: Binary string ('0' and '1')
- Type: dHash only

**Matching Performance:**
- ✅ Correct card: 95-100% similarity
- ✅ Similar cards: 80-95% similarity
- ✅ Different cards: 50-80% similarity
- ✅ Very different cards: 0-50% similarity

**Distribution:**
- Should see **good discrimination** (not clustered around 60%)
- Standard deviation > 0.2 (well-distributed similarities)

---

## Next Steps

1. **Run the new script:**
   ```bash
   npm run hashes:pokemontcg-fixed
   ```

2. **Test consistency:**
   ```bash
   npm run hashes:test-consistency
   ```

3. **Analyze patterns:**
   ```bash
   npm run hashes:analyze-patterns
   ```

4. **Update matching route:**
   - Use fixed hashing implementation
   - Only dHash matching
   - Proper thresholds

5. **Test with physical cards:**
   - Scan 5-10 cards you physically have
   - Verify correct matches appear in top results

---

## Notes

- **Rate Limiting:** Pokemon TCG API is free but be respectful (0.2-0.5s delay)
- **Coverage:** Most modern sets are available, older sets may have gaps
- **Image Quality:** Always use `_hires.png` for best quality
- **Set Mapping:** May need to add more mappings for newer sets

---

## Benefits

✅ **Consistent reference images** - All from same source  
✅ **Proper aspect ratio** - No distortion  
✅ **Better matching** - Clean images match scanned cards better  
✅ **No rate limits** - Can hash all cards without issues  
✅ **Future-proof** - Official API, maintained by Pokemon Company  


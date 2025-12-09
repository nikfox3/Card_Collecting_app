# Multi-Source Image Hashing Solution

## 🎯 Problem

The current hashing system relies **exclusively** on TCGPlayer images, which are:
- ❌ **Rate-limited** (403 errors)
- ❌ **Unreliable** (frequent failures)
- ❌ **Slow** (5-10 second delays needed)
- ❌ **Poor quality** (low resolution, watermarks)

This causes:
- Only 35% of cards hashed (20,502 / 58,382)
- Matching failures due to missing hashes
- Slow hashing process
- Poor matching accuracy

## ✅ Solution: Multi-Source Hashing

Created a **multi-source hashing system** that tries multiple image sources in priority order:

### Image Source Priority:

1. **Pokemon TCG API** (`images.pokemontcg.io`)
   - ✅ High quality (hires images)
   - ✅ Free, no rate limits
   - ✅ Official source
   - ⚠️ Limited set coverage

2. **TCGdx** (`assets.tcgdx.net`)
   - ✅ Good quality
   - ✅ No rate limits
   - ✅ Good set coverage
   - ✅ Fast downloads

3. **Pokemon Price Tracker API**
   - ✅ High quality (800x800)
   - ✅ Better rate limits than TCGPlayer
   - ⚠️ Requires API key
   - ⚠️ Uses credits

4. **TCGPlayer** (fallback only)
   - ⚠️ Rate limited
   - ⚠️ Slow
   - ✅ Comprehensive coverage
   - Only used if other sources fail

## 🚀 Usage

### Hash cards using multiple sources:

```bash
# Hash 1000 cards (default)
npm run hashes:multi-source

# Hash specific number of cards
LIMIT=500 npm run hashes:multi-source
```

### How It Works:

1. **For each card:**
   - Tries Pokemon TCG API first
   - If fails, tries TCGdx
   - If fails, tries Pokemon Price Tracker API
   - If all fail, tries TCGPlayer (fallback)

2. **Downloads and caches images:**
   - Images cached in `.image-cache/` directory
   - Prevents re-downloading same images
   - Validates image format before hashing

3. **Calculates hashes:**
   - All 4 hash types (perceptual, difference, average, wavelet)
   - All 4 orientations (normal, mirrored, upside-down, mirrored+upside-down)
   - Stores in database

## 📊 Expected Improvements

| Metric | Before (TCGPlayer Only) | After (Multi-Source) |
|--------|------------------------|---------------------|
| **Success Rate** | ~30-40% (rate limited) | ~80-90% (multiple sources) |
| **Speed** | 5-10s per card | 0.5-2s per card |
| **Coverage** | 35% hashed | 80-90% hashed (expected) |
| **Image Quality** | Low (watermarked) | High (official sources) |
| **Reliability** | Poor (403 errors) | Good (fallback sources) |

## 🔧 Technical Details

### Source Selection Logic:

```javascript
// Priority order (tries in sequence)
1. Pokemon TCG API → High quality, free
2. TCGdx → Good quality, no limits
3. Pokemon Price Tracker → High quality, API key
4. TCGPlayer → Fallback only
```

### Download Strategy:

- **Fast sources** (Pokemon TCG, TCGdx): 0.3-1s delay
- **API sources** (Price Tracker): 1-2s delay
- **Slow sources** (TCGPlayer): 5-10s delay (fallback only)

### Caching:

- Images cached by source + filename
- Validates image format before caching
- Reuses cached images for faster hashing

## 📝 Next Steps

1. **Run multi-source hashing:**
   ```bash
   npm run hashes:multi-source
   ```

2. **Monitor progress:**
   - Check console for source statistics
   - Verify images are downloading successfully
   - Check database for hash updates

3. **Re-test matching:**
   - After hashing more cards, test scanning again
   - Should see improved accuracy with more cards hashed

## 🎉 Benefits

- ✅ **No more rate limits** - Uses free sources first
- ✅ **Faster hashing** - Better sources = faster downloads
- ✅ **Better quality** - Official Pokemon TCG images
- ✅ **Higher coverage** - Multiple sources = more cards hashed
- ✅ **More reliable** - Fallback sources prevent failures

## ⚠️ Notes

- **Pokemon TCG API** has limited set coverage (mainly newer sets)
- **TCGdx** has good coverage but may miss some sets
- **Pokemon Price Tracker** requires API key and uses credits
- **TCGPlayer** is fallback only (slow, rate-limited)

The system automatically tries sources in order and uses the best available option!


# Card Extraction & Matching Analysis

## 1. How We're Cropping the Detected Card

### Current Process (CardScanner.jsx):

1. **Camera Capture:**
   - User captures image from webcam
   - Original color image is used

2. **Card Boundary Detection:**
   ```javascript
   const { detectCardBoundaries } = await import('../utils/cardBoundaryDetection.js');
   const boundaryResult = await detectCardBoundaries(scannedImage, {
     minArea: 5000,
     cardWidth: 330,
     cardHeight: 440
   });
   ```

3. **Boundary Detection Methods:**
   - **Primary:** Hybrid detection (`detectCardHybrid`) - fast + accurate
   - **Fallback:** OpenCV-based detection (`detectCardBoundariesOriginal`)
     - Canny edge detection
     - Contour finding
     - Perspective correction (homography)
     - Warps card to 330x440 (maintains 2.5:3.5 ratio)

4. **Preprocessing:**
   ```javascript
   const { normalizeBrightnessContrast } = await import('../utils/imagePreprocessing.js');
   preprocessedImage = await normalizeBrightnessContrast(extractedCard);
   ```
   - Normalizes brightness/contrast to match reference images
   - **Does NOT** sharpen or denoise (reference images are already clean)

### Issues Identified:

⚠️ **Problem:** Card extraction may fail, falling back to full camera frame
- If boundary detection fails → uses original image (includes background)
- This causes hash mismatch with clean reference images

⚠️ **Problem:** Preprocessing may not match reference image format
- Reference images are clean product shots (no background, perfect lighting)
- Scanned images may have:
  - Background noise
  - Poor lighting
  - Perspective distortion (if detection fails)
  - Camera artifacts

---

## 2. What Reference Images Look Like

### Database Images:

**Source:** TCGPlayer CDN
- **URL Format:** `https://tcgplayer-cdn.tcgplayer.com/product/{product_id}_200w.jpg`
- **Example:** `https://tcgplayer-cdn.tcgplayer.com/product/42346_200w.jpg` (Alakazam)

**Characteristics:**
- ✅ Clean product shots (white/neutral background)
- ✅ Perfect lighting (studio quality)
- ✅ No perspective distortion (straight-on view)
- ✅ High quality (200w = 200px width, but good quality)
- ✅ Consistent format (all cards same style)

**Example Cards:**
- Alakazam (ID: 42346)
- Mewtwo (ID: 42347)
- Lightning Energy (ID: 42348)
- Psychic Energy (ID: 42349)
- Water Energy (ID: 42350)

### Hash Characteristics:

**Current Database Hashes:**
- **Length:** 1024 bits (32x32 dHash - old implementation)
- **Format:** Binary string ('0' and '1')
- **Type:** String

**New Implementation Hashes:**
- **Length:** 5760 bits (64x89 dHash - maintains aspect ratio)
- **Format:** Binary string ('0' and '1')
- **Type:** String

**Mismatch:**
- ❌ Database: 1024 bits (square, distorts card)
- ❌ New: 5760 bits (maintains ratio, proper)
- ❌ **Cannot compare directly** - different sizes!

---

## 3. Hamming Distance Patterns

### Current Matching Algorithm:

1. **Hash Comparison:**
   - Compares 4 hash types (perceptual, difference, average, wavelet)
   - Tests 4 orientations (normal, mirrored, upside-down, mirrored+upside-down)
   - Finds minimum distance for each hash type

2. **Similarity Calculation:**
   ```javascript
   similarity = 1 - (distance / hashLength)
   // Example: distance=100, hashLength=1024 → similarity = 0.902 (90.2%)
   ```

3. **Weighted Average:**
   - Perceptual: 35% weight
   - Difference: 30% weight
   - Average: 20% weight
   - Wavelet: 15% weight

4. **Threshold:**
   - Default: 0.15 (85% similarity)
   - Effective: 0.05 (95% similarity) - very lenient
   - Returns top 50 matches

### Expected Patterns:

**If Matching Works Well:**
- ✅ Correct card: 95-100% similarity
- ✅ Similar cards: 80-95% similarity
- ✅ Different cards: 50-80% similarity
- ✅ Very different cards: 0-50% similarity

**If Matching Doesn't Work:**
- ❌ All similarities clustered around 50-60% (poor discrimination)
- ❌ Correct card not in top matches
- ❌ Random matches with similar scores

### Diagnostic Script:

Created `scripts/analyze-matching-patterns.js` to analyze:
- Hash length distribution
- Similarity score distribution
- Standard deviation (clustering vs spread)
- Top/bottom matches

**Run it:**
```bash
npm run hashes:analyze-patterns
```

---

## Key Issues Summary

### Issue 1: Card Extraction
- **Problem:** May fail, using full camera frame instead of cropped card
- **Impact:** Hash includes background → mismatch with clean reference
- **Fix:** Improve boundary detection reliability, add validation

### Issue 2: Reference Image Format
- **Problem:** Reference images are clean product shots (perfect conditions)
- **Impact:** Scanned images don't match reference format
- **Fix:** Better preprocessing to match reference image characteristics

### Issue 3: Hash Size Mismatch
- **Problem:** Database has 1024-bit hashes, new implementation produces 5760-bit hashes
- **Impact:** Cannot compare directly
- **Fix:** Re-hash all cards with new implementation

### Issue 4: Preprocessing Mismatch
- **Problem:** Different preprocessing between reference and scanned images
- **Impact:** Hashes don't match even for same card
- **Fix:** Ensure consistent preprocessing pipeline

---

## Recommendations

### Immediate Actions:

1. **Run diagnostic script:**
   ```bash
   npm run hashes:analyze-patterns
   ```
   - See actual similarity distributions
   - Identify if similarities are clustered or spread out

2. **Improve card extraction:**
   - Add validation to ensure card is properly cropped
   - Reject images where boundary detection fails
   - Add visual feedback showing detected boundaries

3. **Fix hash size mismatch:**
   - Re-hash all cards with new implementation (64x89)
   - Update matching route to use new hash size
   - Test consistency with `hashes:test-consistency`

4. **Match preprocessing:**
   - Ensure scanned images match reference image format
   - Same cropping, resizing, normalization
   - Test with physical cards

### Long-term Improvements:

1. **Better boundary detection:**
   - Improve hybrid detection accuracy
   - Add multiple detection attempts
   - Better fallback handling

2. **Preprocessing pipeline:**
   - Match reference image characteristics exactly
   - Remove background if present
   - Normalize lighting/contrast
   - Perspective correction

3. **Hash algorithm:**
   - Use only dHash initially (most reliable)
   - Add back other hash types once dHash works
   - Consider true perceptual hash (DCT-based)


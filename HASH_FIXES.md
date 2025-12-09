# Critical Hash Matching Fixes

## Issues Identified

### 1. ✅ Hash Format Consistency
- **Problem:** Need to verify database hashes and scanned hashes are same format
- **Status:** Created test script to verify
- **Fix:** `scripts/test-hash-consistency.js` - Tests if reference image matches itself

### 2. ✅ Image Preprocessing Mismatch
- **Problem:** Reference images (clean product shots) vs scanned images (with background) processed differently
- **Status:** Fixed in `imageHashFixed.js`
- **Fix:** 
  - Proper card cropping (center crop, maintain aspect ratio)
  - Same resize method as reference images
  - Preprocessing function ensures consistency

### 3. ✅ Orientation/Aspect Ratio Issues
- **Problem:** Cards are 2.5:3.5 ratio, but we were resizing to square (64x64)
- **Status:** Fixed in `imageHashFixed.js`
- **Fix:**
  - Maintain card aspect ratio: 64x89 (instead of 64x64)
  - Proper center cropping before resize
  - No distortion from stretching

### 4. ✅ "Perceptual Hash" Problem
- **Problem:** Our "pHash" isn't true pHash (no DCT), has 35% weight, essentially duplicate of aHash
- **Status:** Simplified to use ONLY dHash initially
- **Fix:**
  - Removed perceptual, average, and wavelet hashes temporarily
  - Using ONLY dHash (most reliable, correct implementation)
  - Can add back other hash types once dHash works reliably

---

## Implementation Plan

### Phase 1: Test Current System (NOW)
```bash
npm run hashes:test-consistency
```
This will:
- Download a reference image from database
- Hash it using fixed implementation
- Compare to database hash
- Report any mismatches

### Phase 2: Update Matching Route (SIMPLIFIED)
- Use ONLY dHash for matching
- Remove weighted average (no other hash types)
- Lower threshold for dHash-only matching
- Test with 5-10 physical cards

### Phase 3: Re-hash Database (IF NEEDED)
- If test shows mismatches, re-hash all cards with fixed implementation
- Maintain aspect ratio (64x89)
- Proper preprocessing

### Phase 4: Add Back Other Hash Types (ONCE dHash WORKS)
- Once dHash matching is reliable
- Add back aHash (simple, fast)
- Consider true pHash with DCT (library)
- Add back wavelet hash (improved)

---

## Files Created

1. **`server/utils/imageHashFixed.js`**
   - Fixed dHash with proper aspect ratio (64x89)
   - Proper preprocessing (cropping, resizing)
   - Only dHash initially

2. **`src/utils/imageHashFixed.js`**
   - Client-side version of fixed hashing
   - Same fixes as server-side

3. **`scripts/test-hash-consistency.js`**
   - Tests if reference image matches itself
   - Verifies hash format consistency
   - Reports preprocessing mismatches

---

## Next Steps

1. **Run consistency test:**
   ```bash
   npm run hashes:test-consistency
   ```

2. **If test passes (distance < 10):**
   - Update matching route to use fixed hashing
   - Update CardScanner to use fixed hashing
   - Test with physical cards

3. **If test fails (distance > 100):**
   - Re-hash all cards with fixed implementation
   - Update database with new hashes
   - Then proceed with step 2

---

## Key Changes

### Aspect Ratio Fix
```javascript
// OLD (WRONG - distorts card):
.resize(64, 64)  // Square - distorts 2.5:3.5 card

// NEW (CORRECT - maintains aspect ratio):
const HASH_HEIGHT = Math.round(64 / (2.5/3.5)); // ~89
.resize(64, 89)  // Maintains card proportions
```

### Preprocessing Fix
```javascript
// NEW: Proper cropping before hashing
- Center crop to get just the card (remove background)
- Maintain aspect ratio during resize
- Use high-quality resampling (lanczos3)
```

### Simplified Matching
```javascript
// OLD: Weighted average of 4 hash types
// NEW: Only dHash (most reliable)
// Once dHash works, add back others
```

---

## Testing Checklist

- [ ] Run `hashes:test-consistency` - verify format consistency
- [ ] Test with 5-10 physical cards - verify matching works
- [ ] Check hash lengths match (should be ~5696 for dHash with 64x89)
- [ ] Verify card cropping works correctly
- [ ] Test all 4 orientations (normal, mirrored, upside-down, mirrored+upside-down)

---

## Expected Results

### Hash Lengths (dHash with 64x89):
- Width: 64 pixels
- Height: 89 pixels
- Hash length: 64 × 89 = **5,696 bits**

### Matching Threshold:
- **Perfect match:** distance = 0 (100% similarity)
- **Very close:** distance < 50 (99%+ similarity)
- **Good match:** distance < 200 (96%+ similarity)
- **Acceptable:** distance < 500 (91%+ similarity)

---

## Notes

- Current database hashes were created with square (64x64) - may need re-hashing
- Fixed implementation uses 64x89 - maintains card proportions
- dHash is most reliable - focus on this first
- Once dHash works, can add back other hash types for better accuracy


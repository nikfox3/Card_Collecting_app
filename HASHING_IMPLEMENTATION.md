# Current Hashing Implementation

## 🔍 What We're Using

### **Custom Implementations** (No External Library)
We're using **custom JavaScript implementations** of image hashing algorithms:

1. **Perceptual Hash (pHash)** - Custom implementation
   - Resize to 64x64, grayscale
   - Calculate average pixel value
   - Compare each pixel to average → binary hash
   - ⚠️ **Note:** This is actually more like "average hash" - true pHash uses DCT

2. **Difference Hash (dHash)** - Custom implementation
   - Resize to 65x64, grayscale
   - Compare adjacent pixels horizontally
   - Binary hash based on differences
   - ✅ This is correct dHash implementation

3. **Average Hash (aHash)** - Custom implementation
   - Resize to 8x8, grayscale
   - Calculate average pixel value
   - Compare each pixel to average → binary hash
   - ✅ This is correct aHash implementation

4. **Wavelet Hash (wHash)** - Simplified custom implementation
   - Resize to 64x64, grayscale
   - Divide into 4 quadrants
   - Compare quadrant averages and pixels to quadrant averages
   - ⚠️ **Note:** This is simplified - true wavelet hash uses DWT (Discrete Wavelet Transform)

### **Image Processing Library:**
- **Server-side:** `sharp` (for resizing, grayscale conversion)
- **Client-side:** Canvas API (for image manipulation)

---

## ✅ Hamming Distance Comparison

**Yes, we ARE using Hamming distance!**

### How It Works:

1. **Calculate Hamming distance** between scanned hash and database hash:
   ```javascript
   function hammingDistance(hash1, hash2) {
     let distance = 0;
     for (let i = 0; i < hash1.length; i++) {
       if (hash1[i] !== hash2[i]) {
         distance++; // Count differing bits
       }
     }
     return distance; // Lower = more similar
   }
   ```

2. **Normalize distance to similarity score:**
   ```javascript
   similarity = 1 - (distance / hashLength)
   // Example: distance=100, hashLength=4096 → similarity = 0.976 (97.6%)
   ```

3. **Compare across all orientations:**
   - Normal, Mirrored, Upside-down, Mirrored+Upside-down
   - Find minimum distance for each hash type (best match)

4. **Weighted average** of all hash types:
   - Perceptual: 35% weight
   - Difference: 30% weight
   - Average: 20% weight
   - Wavelet: 15% weight

---

## ⚠️ Issues with Current Implementation

### 1. **"Perceptual Hash" is Actually Average Hash**
**Problem:** Our "perceptual hash" doesn't use DCT (Discrete Cosine Transform)
- True pHash uses DCT to analyze frequency domain
- Our implementation just compares pixels to average (like aHash)
- **Impact:** Less robust to transformations (rotation, scaling)

### 2. **Wavelet Hash is Simplified**
**Problem:** Not using true DWT (Discrete Wavelet Transform)
- True wavelet hash uses multi-level wavelet decomposition
- Our implementation uses simple quadrant averages
- **Impact:** Less effective for texture matching

### 3. **Hash Lengths May Be Inconsistent**
**Problem:** Different hash types have different lengths:
- Perceptual: 4096 bits (64x64)
- Difference: 4096 bits (64x64)
- Average: 64 bits (8x8)
- Wavelet: 4096 bits (64x64)

**Impact:** Normalization might not be perfect

---

## 💡 Potential Improvements

### Option 1: Use a Proven Library
**Libraries available:**
- `image-hash` (npm) - Implements pHash, dHash, aHash correctly
- `sharp` with custom DCT - More accurate pHash
- `jimp` - Image processing with hash functions

**Benefits:**
- ✅ Proven algorithms
- ✅ Better accuracy
- ✅ Less code to maintain

**Drawbacks:**
- ⚠️ Additional dependency
- ⚠️ May need to migrate existing hashes

### Option 2: Improve Custom Implementation
**Improvements:**
1. **True Perceptual Hash (DCT-based):**
   - Implement DCT (Discrete Cosine Transform)
   - Analyze frequency domain
   - More robust to transformations

2. **True Wavelet Hash (DWT-based):**
   - Implement DWT (Discrete Wavelet Transform)
   - Multi-level decomposition
   - Better texture matching

3. **Consistent Hash Lengths:**
   - Use same resolution for all hash types
   - Easier normalization

**Benefits:**
- ✅ No external dependencies
- ✅ Full control
- ✅ Can optimize for our use case

**Drawbacks:**
- ⚠️ More complex to implement
- ⚠️ Need to re-hash all cards

### Option 3: Hybrid Approach
**Use library for pHash, keep custom for others:**
- Use `image-hash` for true perceptual hash
- Keep custom dHash and aHash (they're correct)
- Improve wavelet hash or use library version

---

## 📊 Current Matching Algorithm

### Process:
1. **Calculate hashes** for scanned image (4 types × 4 orientations = 16 hashes)
2. **Compare to database** hashes using Hamming distance
3. **Find minimum distance** for each hash type across orientations
4. **Normalize distances** to similarity scores (0-1)
5. **Weighted average** of similarity scores
6. **Apply consensus boost** if multiple hash types agree
7. **Filter by threshold** (0.05 = 95% similarity)
8. **Return top 50 matches**

### Threshold:
- **Default:** 0.15 (85% similarity)
- **Effective:** 0.05 (95% similarity) - very lenient
- **Lower threshold = more matches** (but more false positives)

---

## 🎯 Recommendations

### For Better Accuracy:

1. **Use `image-hash` library** for true perceptual hash:
   ```bash
   npm install image-hash
   ```
   - Implements pHash with DCT correctly
   - More robust to transformations

2. **Improve wavelet hash** or use library version
   - Better texture matching
   - More accurate for similar cards

3. **Consider adding more hash types:**
   - **Color hash** - For energy type detection
   - **Block hash** - For structure matching
   - **Radial hash** - For rotation-invariant matching

4. **Optimize hash lengths:**
   - Use consistent lengths for easier comparison
   - Consider 256-bit hashes (faster, still accurate)

---

## 📝 Summary

**Current Status:**
- ✅ Using Hamming distance for comparison
- ✅ Multiple hash types (4 types)
- ✅ Multiple orientations (4 orientations)
- ✅ Weighted average matching
- ⚠️ "Perceptual hash" is actually average hash
- ⚠️ Wavelet hash is simplified

**Accuracy Issues:**
- Custom implementations may be less accurate than proven libraries
- "Perceptual hash" doesn't use DCT (less robust)
- Wavelet hash is simplified (less effective)

**Recommendation:**
- Consider using `image-hash` library for true pHash
- Or improve custom implementations with DCT/DWT
- Current approach works but could be more accurate


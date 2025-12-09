# Card Scanner Accuracy Improvements

## Current Issues

### 1. **Critical: Low Database Coverage** ⚠️
- **Only 1,280 out of 58,382 cards have been hashed (2.2% coverage!)**
- This is the #1 reason for poor accuracy
- Most cards can't be matched because they don't have hashes

### 2. **Basic Image Hashing**
- Using simple perceptual/difference/average hashes
- 64x64 resolution (could be higher)
- No color histogram matching
- No multi-scale matching

### 3. **Limited Feature Matching**
- ORB features only used as refinement (not primary matching)
- ORB is fast but less accurate than SIFT/SURF
- Feature matching only runs on top 10 matches

### 4. **No Advanced Preprocessing**
- No brightness/contrast normalization
- No edge detection
- No perspective correction
- No card boundary detection

### 5. **No Deep Learning**
- Not using neural networks/CNNs
- No trained models for Pokemon card recognition
- Missing the most accurate modern approach

## How Other Apps Achieve High Accuracy

### TCG Stacked (95%+ accuracy)
- **Advanced recognition engine** with machine learning
- Continuously updated models
- Multiple recognition strategies combined

### Key Techniques Used by Successful Apps:

1. **Deep Learning Models**
   - Convolutional Neural Networks (CNNs) trained on Pokemon cards
   - Transfer learning from pre-trained models
   - Fine-tuned for card recognition

2. **Better Image Preprocessing**
   - Automatic brightness/contrast normalization
   - Edge detection and card boundary detection
   - Perspective correction (fix skewed cards)
   - Noise reduction

3. **Multi-Scale Matching**
   - Compare at multiple resolutions
   - Handle different card sizes/angles
   - More robust to distance variations

4. **Hybrid Approaches**
   - Combine multiple techniques:
     - Image hashing (fast, good for similar images)
     - Feature matching (robust to rotation/scale)
     - Template matching (exact layout matching)
     - Deep learning (highest accuracy)

5. **Better Database Coverage**
   - All cards pre-processed and indexed
   - Multiple images per card (different angles/lighting)
   - Regular updates for new sets

## Proposed Solutions (Priority Order)

### 🔴 **CRITICAL: Increase Database Coverage**
**Impact: HIGH | Effort: MEDIUM**

```bash
# Hash all remaining cards
npm run hashes:precompute-10000  # Run multiple times
# Or create a script to hash ALL cards
```

**Why this matters:** You can't match cards that aren't in the database!

---

### 🟠 **HIGH PRIORITY: Improve Image Preprocessing**
**Impact: HIGH | Effort: MEDIUM**

Add preprocessing pipeline:
1. **Brightness/Contrast Normalization**
   - Normalize lighting conditions
   - Handle different camera exposures

2. **Edge Detection & Card Boundary Detection**
   - Auto-detect card edges
   - Crop to card boundaries
   - Remove background

3. **Perspective Correction**
   - Fix skewed cards (not perfectly flat)
   - Normalize card orientation

4. **Noise Reduction**
   - Reduce camera noise
   - Sharpen edges

**Implementation:** Add preprocessing step before hashing/feature detection

---

### 🟡 **MEDIUM PRIORITY: Better Feature Matching**
**Impact: MEDIUM | Effort: HIGH**

1. **Use SIFT instead of ORB**
   - More accurate (but slower)
   - Better for rotation/scale changes
   - Can use OpenCV.js SIFT if available

2. **Make Feature Matching Primary**
   - Use features for initial matching (not just refinement)
   - Combine with hashing for best results

3. **Improve Matching Algorithm**
   - Better distance metrics
   - RANSAC for outlier removal
   - Geometric verification

---

### 🟢 **LOW PRIORITY: Advanced Techniques**
**Impact: HIGH | Effort: VERY HIGH**

1. **Deep Learning Integration**
   - Use TensorFlow.js or ONNX.js
   - Train/fine-tune CNN on Pokemon cards
   - Requires significant ML expertise

2. **Template Matching**
   - Pre-defined card layout templates
   - Match against known card structures
   - Good for standard cards

3. **Multi-Scale Matching**
   - Compare at multiple resolutions
   - More robust matching

---

## Quick Wins (Implement First)

### 1. **Hash All Cards** (Most Important!)
```bash
# Create script to hash ALL cards
node scripts/precompute-all-hashes.js
```

### 2. **Add Image Preprocessing**
- Normalize brightness/contrast
- Detect and crop card boundaries
- This alone will improve accuracy significantly

### 3. **Improve Hash Resolution**
- Increase from 64x64 to 128x128 or 256x256
- Better accuracy (but slower)

### 4. **Better Threshold Tuning**
- Current threshold (0.2 = 80% similarity) might be too lenient
- Test different thresholds
- Use adaptive thresholds based on match quality

---

## Recommended Implementation Order

1. ✅ **Hash all cards** (critical - do this first!)
2. ✅ **Add image preprocessing** (brightness normalization, edge detection)
3. ✅ **Improve hash resolution** (128x128 or higher)
4. ✅ **Better feature matching** (use SIFT, make it primary)
5. ⏳ **Deep learning** (long-term, requires ML expertise)

---

## Testing Strategy

1. **Create test set:** 50-100 known cards
2. **Scan each card** multiple times (different lighting/angles)
3. **Measure accuracy:** % of correct matches in top 3 results
4. **Compare before/after** each improvement
5. **Target:** 90%+ accuracy (top 3 matches include correct card)

---

## Resources

- **OpenCV.js Documentation:** https://docs.opencv.org/
- **TensorFlow.js:** https://www.tensorflow.org/js
- **Image Hashing Techniques:** https://www.hackerfactor.com/blog/?/archives/529-Kind-of-Like-That.html
- **Feature Matching:** https://docs.opencv.org/4.x/dc/dc3/tutorial_py_matcher.html


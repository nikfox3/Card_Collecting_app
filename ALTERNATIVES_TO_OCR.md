# Alternatives to OCR for Card Scanning

Since OCR is not working reliably, here are better alternatives focused on **visual image matching**:

## Current Status
- ✅ Image hashing (perceptual, difference, average) - Already implemented
- ❌ OCR - Not reliable enough

## Recommended Solutions (in order of priority)

### 1. **Improve Image Matching** (Easiest, Most Effective)
**What:** Enhance the existing image hash matching system
**Why:** Already implemented, just needs optimization
**How:**
- Lower similarity threshold (currently 0.4, try 0.3)
- Increase hash resolution (32x32 → 64x64 for perceptual hash)
- Add more hash types (wavelet hash, block hash)
- Better preprocessing (normalize brightness, contrast)
- Cache more card images (currently limited to 5000)

**Pros:**
- Already working
- Fast
- No new dependencies
- Works offline

**Cons:**
- Needs more cards hashed in database
- May struggle with very similar cards

---

### 2. **Feature-Based Matching (SIFT/ORB)** (Most Robust)
**What:** Match cards by detecting and comparing visual features/keypoints
**Why:** More accurate than hashing, handles rotation/scale/lighting better
**How:**
- Use OpenCV.js (runs in browser)
- Detect keypoints and descriptors
- Match features between scanned card and database cards
- Score matches based on feature correspondences

**Pros:**
- Very accurate
- Handles rotation, scale, lighting changes
- Industry standard approach

**Cons:**
- Requires OpenCV.js (~8MB)
- More CPU intensive
- Need to compute descriptors for all cards

**Implementation:**
```javascript
// Would use OpenCV.js for feature detection
import cv from 'opencv-js';
// Detect ORB features
// Match descriptors
// Score matches
```

---

### 3. **Deep Learning Model** (Most Accurate, Long-term)
**What:** Use a pre-trained or custom CNN model
**Why:** Can learn complex visual patterns
**How:**
- Option A: Use TensorFlow.js with MobileNet (transfer learning)
- Option B: Train custom model on card dataset
- Option C: Use existing Pokemon card recognition APIs

**Pros:**
- Highest accuracy potential
- Can learn card-specific features
- Handles variations well

**Cons:**
- Requires model training or API access
- Larger bundle size
- More complex to implement

---

### 4. **Template Matching** (Good for Standard Layouts)
**What:** Compare scanned card against templates
**Why:** Fast and accurate for consistent layouts
**How:**
- Create templates for each card
- Use normalized cross-correlation
- Match against templates

**Pros:**
- Fast
- Accurate for standard cards
- Simple concept

**Cons:**
- Needs templates for all cards
- Sensitive to angle/lighting
- Storage intensive

---

### 5. **Hybrid Approach** (Recommended)
**What:** Combine multiple methods
**Why:** Leverage strengths of each
**How:**
1. **Quick filter:** Image hash matching (fast, narrows down to ~100 cards)
2. **Refine:** Feature matching on top candidates (accurate)
3. **Final check:** Visual similarity score

**Pros:**
- Best of all worlds
- Fast + accurate
- Handles edge cases

**Cons:**
- More complex
- Multiple systems to maintain

---

## Immediate Action Plan

### Phase 1: Improve Current System (This Week)
1. ✅ Lower hash matching threshold to 0.3
2. ✅ Increase hash resolution (64x64)
3. ✅ Add better image preprocessing
4. ✅ Hash more cards (run precompute script)
5. ✅ Improve scoring algorithm

### Phase 2: Add Feature Matching (Next Week)
1. Add OpenCV.js dependency
2. Implement ORB feature detection
3. Create feature descriptor database
4. Integrate with existing matching

### Phase 3: Deep Learning (Future)
1. Evaluate TensorFlow.js models
2. Consider API solutions (Google Vision, AWS Rekognition)
3. Train custom model if needed

---

## Recommendation

**Start with Phase 1** - Improve the existing image matching:
- It's already working
- Just needs optimization
- No new dependencies
- Can implement today

Then **add Phase 2** if needed for better accuracy.


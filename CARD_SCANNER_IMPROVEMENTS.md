# Card Scanner Improvements Based on PokeCard-TCG-detector

## Overview
This document outlines improvements to the card scanner based on techniques from [PokeCard-TCG-detector](https://github.com/em4go/PokeCard-TCG-detector), which uses image hashing for visual card matching instead of OCR.

## Current Implementation
- **Method**: OCR (Tesseract.js) → Text extraction → Database search
- **Limitations**: 
  - OCR accuracy can be poor on trading cards (glare, foil effects, small text)
  - Relies on readable text, fails on damaged/obscured cards
  - Multiple search strategies needed as fallback

## PokeCard-TCG-detector Approach
- **Method**: Image hashing (perceptual hash, difference hash, wavelet hash) → Visual matching
- **Advantages**:
  - Works even when text is obscured
  - More accurate for card recognition
  - Doesn't depend on OCR quality
  - Can handle foil effects and glare better

## ✅ Implemented Improvements

### Phase 1: Enhanced OCR Preprocessing (COMPLETED)
**Location**: `src/components/CardScanner.jsx`

Implemented OpenCV-style image preprocessing techniques:

1. **Grayscale Conversion**: Converts image to grayscale using luminance formula (0.299*R + 0.587*G + 0.114*B) for better text recognition
2. **Histogram Equalization**: Adaptive contrast enhancement to improve text visibility
3. **Contrast Enhancement**: Increased contrast from 1.5x to 1.8x for better text recognition
4. **Edge Sharpening**: Unsharp mask algorithm to sharpen text boundaries, helping OCR recognize characters better
5. **Brightness Adjustment**: Optimized brightness levels for card scanning

**Benefits**:
- Improved OCR accuracy on trading cards
- Better handling of glare and foil effects
- More reliable text extraction

## 🔄 Future Enhancements

### Phase 2: Image-Based Matching (PLANNED)
**Location**: `server/routes/image-matching.js` (stub created)

- Add backend endpoint for image hash comparison
- Pre-compute hashes for all card images in database
- Compare captured image hash with database hashes
- Return top matches based on hash similarity

**Implementation Requirements**:
```bash
npm install sharp imghash
```

**Database Changes**:
- Add `image_hash` column to `products` table
- Background job to compute hashes for existing cards

### Phase 3: Hybrid Strategy (PLANNED)
1. **Primary**: Try OCR-based search (fast, works offline) ✅
2. **Fallback**: If OCR fails or low confidence → Image hash matching (future)
3. **Final**: Manual search option (always available) ✅

## Implementation Options

### Option A: Client-Side Image Comparison (Simpler)
- Use browser-based image comparison libraries
- Compare captured image with card thumbnails
- **Pros**: No backend changes needed
- **Cons**: Less accurate, slower for large databases

### Option B: Backend Image Hash Service (More Accurate) ⭐ RECOMMENDED
- Create Node.js service using `sharp` for image processing
- Use `imghash` library for perceptual hashing
- Pre-compute hashes and store in database
- **Pros**: More accurate, scalable, matches PokeCard-TCG-detector approach
- **Cons**: Requires backend work, database schema changes

## Next Steps

1. ✅ **Enhanced OCR preprocessing** - COMPLETED
2. ⏳ **Test improved OCR accuracy** - IN PROGRESS
3. 📋 **Implement backend image hash service** - PLANNED
4. 📋 **Add hybrid matching strategy** - PLANNED

## References
- [PokeCard-TCG-detector GitHub](https://github.com/em4go/PokeCard-TCG-detector)
- Uses imagehash library with perceptual hash, difference hash, and wavelet hash algorithms
- OpenCV for card detection and image preprocessing


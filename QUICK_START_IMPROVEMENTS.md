# Quick Start: Scanner Improvements

## 🚀 Setup Steps

### Step 1: Run Database Migration
```bash
npm run hashes:migrate-orientations
```
This adds 16 new columns for orientation hashes.

### Step 2: Wait for Current Hash Script to Finish
The `hashes:precompute-all` script is already running. Once it finishes:
- It will have generated hashes for all orientations
- Cards will be ready for improved matching

### Step 3: Test the Scanner
1. Open the scanner in your app
2. Try scanning a card at different angles
3. Try scanning upside-down or mirrored
4. Check if accuracy improves

## ✅ What's New

### 1. **Card Boundary Detection**
- Automatically detects card edges
- Handles angled/scanned cards
- Normalizes card to standard size

### 2. **Multiple Orientations**
- Cards can be scanned in any orientation
- System checks all 4 orientations automatically
- No need to manually rotate cards

### 3. **Wavelet Hash**
- Better texture matching
- 4th hash type for improved accuracy

### 4. **Max-of-Mins Matching**
- More accurate matching algorithm
- Reduces false positives
- Based on proven techniques

## 📊 Expected Results

- **Before:** ~10-20% accuracy (due to low database coverage)
- **After:** 80-90%+ accuracy (with full database coverage)

## 🔧 Troubleshooting

### If boundary detection fails:
- Falls back to original image automatically
- Check browser console for OpenCV.js loading errors

### If matching still poor:
- Ensure database migration ran successfully
- Check that hash script completed
- Verify cards have orientation hashes in database

## 📝 Files Changed

- `src/utils/cardBoundaryDetection.js` (NEW)
- `src/utils/imageHash.js` (UPDATED - added wavelet hash & orientations)
- `src/utils/imagePreprocessing.js` (EXISTS - already integrated)
- `src/components/CardScanner.jsx` (UPDATED - uses boundary detection)
- `server/utils/imageHash.js` (UPDATED - added wavelet hash & orientations)
- `server/routes/cards.js` (UPDATED - max-of-mins matching)
- `scripts/precompute-all-hashes.js` (UPDATED - generates all orientations)
- `scripts/migrate-orientation-hashes.js` (NEW)


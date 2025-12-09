# Database Hash Status Report

## Current State (as of check)

### Overall Statistics
- **Total cards:** 58,382
- **Hashed (old format):** 1,280
- **Hashed (normal orientation):** 1,280
- **Hashed (with wavelet):** 0
- **Still need hashing:** 57,102

### Cache Status
- **Cached images:** 20,495 files
- **Cache size:** 477 MB

### Key Findings

1. **Discrepancy Detected:**
   - Script reported ~9,950 cards remaining
   - Database shows 57,102 cards still need hashing
   - Only 1,280 cards actually saved to database
   - 20,495 images were downloaded and cached

2. **Possible Issues:**
   - Many images were downloaded but hashes weren't saved
   - Script may have encountered errors during hash computation
   - Database connection issues during save operations
   - Rate limiting may have caused failures after download

3. **Missing Data:**
   - All 1,280 hashed cards are missing:
     - Mirrored orientation hashes
     - Upside-down orientation hashes
     - Mirrored+upside-down orientation hashes
     - Wavelet hashes (all orientations)

## Next Steps

### Option 1: Add Orientations to Existing Hashes
Since you have 1,280 cards with basic hashes, add orientations:

```bash
npm run hashes:add-orientations
```

This will:
- Use cached images (fast!)
- Generate all 4 orientations
- Add wavelet hashes
- Process 1,000 at a time

### Option 2: Re-run Hash Script
The cached images can be reused, so re-running should be faster:

```bash
npm run hashes:precompute-all
```

This will:
- Use cached images when available
- Generate all orientations from the start
- Process remaining 57,102 cards

### Option 3: Investigate Why Hashes Weren't Saved
Check if there were database errors or connection issues that prevented saving.

## Recommendations

1. **First:** Run `hashes:add-orientations` to complete the 1,280 existing cards
2. **Then:** Run `hashes:precompute-all` to process remaining cards
3. **Monitor:** Watch for errors during hash computation/saving

The good news: 20,495 images are already cached, so re-running will be much faster!


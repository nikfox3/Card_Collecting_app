# Hash Status Report

## Current Status (Updated)

**Date:** $(date)

### Overall Statistics
- **Total cards with images:** 58,382
- **Cards with complete hashes:** 20,502 (35.1%)
- **Cards missing hashes:** 37,880 (64.9%)

### Hash Coverage by Type
- **Normal orientation:** 20,502 cards (35.1%)
- **Wavelet hash:** 20,502 cards (35.1%)
- **Mirrored orientation:** 20,502 cards (35.1%)
- **Upside-down orientation:** 20,502 cards (35.1%)
- **Mirrored+upside-down orientation:** 20,502 cards (35.1%)

### Hash Format
- **Perceptual hash:** 1024 characters (32x32 bits)
- **Difference hash:** 1024 characters (32x32 bits)
- **Average hash:** 64 characters (8x8 bits)
- **Wavelet hash:** 4100 characters

## Database Path Fix

**Issue Resolved:** All hash scripts now use the correct database path via `config.databasePath`, which resolves to an absolute path: `/Users/NikFox/Documents/git/Card_Collecting_app/cards.db`

**Scripts Updated:**
- ✅ `add-orientations-to-existing-hashes.js`
- ✅ `precompute-all-hashes.js`
- ✅ `precompute-image-hashes.js`
- ✅ `hash-grookey-cards.js` (already correct)

## What Needs to Be Done

### Option 1: Run Full Precompute Script (Recommended)
To hash the remaining 37,880 cards:

```bash
npm run hashes:precompute-all
```

This will:
- Process all remaining cards that are missing hashes
- Calculate all hash types (perceptual, difference, average, wavelet)
- Calculate all orientations (normal, mirrored, upside-down, mirrored+upside-down)
- Store hashes in both old format (backward compatibility) and new format

**Estimated time:** Several hours (depends on download speed and rate limits)

### Option 2: Batch Processing
If you want to process in smaller batches:

```bash
# Process 10,000 cards at a time
LIMIT=10000 node scripts/precompute-all-hashes.js
```

## Verification

After running the scripts, verify with:

```bash
node scripts/verify-hashes.js
```

This will show:
- Updated hash coverage statistics
- Hash format integrity
- Cards still missing hashes
- Incomplete hash sets

## Notes

- ✅ Database path issue has been fixed - all scripts now use the correct database
- ✅ 20,502 cards have been successfully copied from the parent database
- ✅ All hash scripts now log the database path they're using for verification
- The hash precompute script includes rate limiting and retry logic
- Images are cached in `.image-cache/` directory to avoid re-downloading
- The script processes cards in batches with progress reporting
- Failed downloads are retried up to 3 times with exponential backoff

# Image Hashing Guide

## Overview
Image hashing allows the scanner to match cards visually by comparing image fingerprints. This is more accurate than OCR alone and works even when text recognition fails.

## Current Status
- ✅ **1,000 cards** have been processed and have image hashes
- ⚠️ **~29,000 cards** remaining to process

## How to Hash More Images

### Option 1: Default (5000 cards per run)
```bash
npm run hashes:precompute
```
Processes 5,000 cards per run (default).

### Option 2: Custom batch size
```bash
# Process 1,000 cards
npm run hashes:precompute-1000

# Process 5,000 cards
npm run hashes:precompute-5000

# Process 10,000 cards
npm run hashes:precompute-10000
```

### Option 3: Environment variable
```bash
LIMIT=2000 npm run hashes:precompute
```

## How It Works

1. **Script finds cards** without hashes
2. **Downloads images** (cached locally in `.image-cache/`)
3. **Calculates 3 hash types**:
   - Perceptual hash (pHash) - resistant to scaling/rotation
   - Difference hash (dHash) - compares adjacent pixels
   - Average hash (aHash) - simple but effective
4. **Stores hashes** in database
5. **Skips cards** that already have hashes

## Performance

- **Speed**: ~1-2 seconds per card
- **Caching**: Images are cached locally (`.image-cache/`)
- **Resumable**: Can run multiple times - will continue where it left off
- **Safe**: Won't re-process cards that already have hashes

## Example Output

```
🔄 Starting image hash pre-computation...

📊 Found 5000 cards to process

📦 Processing batch 1/500
  [1/5000] Pikachu... ✅
  [2/5000] Charizard... ✅
  ...

📊 Summary:
   ✅ Success: 5000
   ❌ Failed: 0
   📈 Progress: 5000/5000

⚠️  24000 cards remaining. Run this script again to continue.
```

## Tips

- **Run overnight**: Processing all cards takes several hours
- **Monitor progress**: Script shows progress after each batch
- **Check cache**: Images are cached, so re-runs are faster
- **Database backup**: Consider backing up before large runs

## Color Analysis Integration

The scanner now uses **color analysis** to detect Pokemon energy types and filters results accordingly:

1. **Analyzes card colors** → Detects energy type (Fire, Water, Grass, etc.)
2. **Filters database** → Only compares against cards of that energy type
3. **Boosts matches** → Cards matching detected energy type get +0.2 score boost
4. **Prioritizes results** → Name + Energy Type matches are prioritized

This significantly narrows down results and improves accuracy!


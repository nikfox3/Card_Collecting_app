# Hash Analysis Results

## Test Results

### Database Hash (Old Implementation)
- **Length:** 1024 bits
- **Type:** string
- **Card:** Alakazam (ID: 42346)

### Calculated Hash (New Implementation)
- **Length:** 5760 bits  
- **Type:** string
- **Aspect Ratio:** 64x89 (maintains card proportions)

### Comparison
- **Hamming Distance:** 5236
- **Similarity:** 9.10%
- **Hash Lengths Match:** ❌
- **Hash Types Match:** ✅

## Root Cause

### Issue 1: Hash Length Mismatch
- **Old:** 1024 bits (likely 32x32 dHash: 32*32 = 1024)
- **New:** 5760 bits (64x89 dHash: 64*89 = 5696, but we're using 65x89 for calculation)
- **Problem:** Completely different hash sizes = cannot compare

### Issue 2: Aspect Ratio Mismatch
- **Old:** Likely square (32x32 or 64x64) - distorts card
- **New:** Maintains card ratio (64x89) - preserves proportions
- **Problem:** Different preprocessing = different hashes

### Issue 3: Preprocessing Mismatch
- **Old:** Unknown preprocessing (need to check original implementation)
- **New:** Center crop + aspect ratio preservation
- **Problem:** Different preprocessing = different hashes

## Solution Options

### Option 1: Match Old Implementation (Temporary)
- Use same hash size as old (1024 bits = 32x32)
- Use square aspect ratio (distort card)
- Match old preprocessing exactly
- **Pros:** Can compare with existing database hashes
- **Cons:** Still inaccurate due to distortion

### Option 2: Re-hash Database (Recommended)
- Re-hash all cards with new implementation (64x89)
- Maintain aspect ratio (no distortion)
- Proper preprocessing
- **Pros:** Accurate matching, proper aspect ratio
- **Cons:** Need to re-hash ~20,000+ cards

### Option 3: Dual Hash System
- Keep old hashes for backward compatibility
- Add new hashes in separate columns
- Gradually migrate to new system
- **Pros:** No data loss, gradual migration
- **Cons:** More complex, need dual matching

## Recommendation

**Option 2: Re-hash Database**

1. **Phase 1:** Update hashing scripts to use new implementation (64x89, proper aspect ratio)
2. **Phase 2:** Re-hash all cards with new implementation
3. **Phase 3:** Update matching route to use new hashes
4. **Phase 4:** Test with physical cards

This ensures:
- ✅ Proper aspect ratio (no distortion)
- ✅ Consistent preprocessing
- ✅ Accurate matching
- ✅ Future-proof system

## Next Steps

1. **Check old implementation size:**
   ```bash
   # Check what size the old dHash actually uses
   # Database shows 1024 bits = likely 32x32
   ```

2. **Update precompute scripts:**
   - Use new `imageHashFixed.js` implementation
   - Maintain 64x89 aspect ratio
   - Proper preprocessing

3. **Re-hash all cards:**
   ```bash
   npm run hashes:precompute-all
   ```

4. **Test consistency:**
   ```bash
   npm run hashes:test-consistency
   # Should show distance < 10 for perfect match
   ```

5. **Update matching route:**
   - Use only dHash initially
   - Proper threshold for 64x89 hashes
   - Test with physical cards

## Hash Size Reference

### dHash Sizes:
- **32x32:** 32*32 = 1024 bits (old, square, distorts card)
- **64x64:** 64*64 = 4096 bits (square, distorts card)
- **64x89:** 64*89 = 5696 bits (maintains card ratio 2.5:3.5)
- **65x89:** Used for calculation (65 width for difference), produces 64*89 = 5696 bit hash

### Current Database:
- **Stored:** 1024 bits (32x32 dHash)
- **Needed:** 5696 bits (64x89 dHash)
- **Action:** Re-hash all cards


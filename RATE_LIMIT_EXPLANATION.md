# Rate Limiting Explanation & Solutions

## Why You're Getting Rate Limited

**TCGPlayer CDN (`tcgplayer-cdn.tcgplayer.com`) has aggressive anti-scraping measures:**

1. **IP-based Rate Limiting**: After a certain number of requests from the same IP address, they block further requests with HTTP 403 errors
2. **Request Pattern Detection**: They detect automated request patterns (consistent timing, similar headers, sequential URLs)
3. **No Public API**: TCGPlayer doesn't provide a public API for bulk image downloads - they want to prevent scraping
4. **CDN Protection**: They likely use Cloudflare or similar services that detect and block automated traffic

**Why delays don't always help:**
- Even with 2-5 second delays, bulk automated requests are still detectable
- They may track request patterns over time, not just frequency
- Once your IP is flagged, it may take hours or days to reset
- The pattern of downloading thousands of images sequentially is a clear signal of automation

## Current Situation

- **20,506 images cached** - These were successfully downloaded before rate limiting kicked in
- **37,880 cards still need hashes** - These require downloading images (which triggers rate limits)
- **20,502 cards already have hashes** - These are ready to use

## Solutions

### Option 1: Hash from Cache Only (Recommended First Step)
Hash cards that already have cached images (no downloads needed):

```bash
npm run hashes:from-cache
```

This will hash ~20,000+ cards without any downloads, avoiding rate limits completely.

### Option 2: Process in Very Small Batches
If you need to download more images, process in tiny batches with very long delays:

```bash
# Process 100 cards at a time, then wait hours before next batch
LIMIT=100 node scripts/precompute-all-hashes.js
```

Then wait 2-4 hours before running again.

### Option 3: Use Alternative Image Sources
Consider using alternative image sources that are more permissive:
- **TCGdx API** (`assets.tcgdx.net`) - More permissive, but requires set/card number mapping
- **Pokemon TCG API** (`images.pokemontcg.io`) - Official API, but may have rate limits too

### Option 4: Wait and Resume Later
Rate limit windows typically reset after several hours. You can:
1. Hash all cached images now (no downloads)
2. Wait 12-24 hours
3. Resume downloading in small batches

### Option 5: Use a VPN/Proxy (Not Recommended)
Rotating IPs can help, but:
- May violate TCGPlayer's Terms of Service
- Adds complexity
- May still get blocked if pattern is detected

## Recommended Approach

1. **First**: Run `npm run hashes:from-cache` to hash all cached images (no rate limits)
2. **Then**: Wait 24 hours for rate limit window to reset
3. **Finally**: Process remaining cards in batches of 100-500 with very long delays (5-10 seconds between requests)

## Why This Happens

TCGPlayer is a commercial marketplace. They protect their CDN because:
- Bandwidth costs money
- They want to prevent competitors from scraping their data
- They want to control how their images are used
- Bulk downloads could impact their server performance

This is standard practice for commercial CDNs - they're not designed for bulk automated downloads.


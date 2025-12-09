# Local Image Storage System

## Overview

This system stores card images locally and serves them through your own API, eliminating dependency on external CDNs and avoiding rate limits.

## Architecture

### Storage Structure
```
public/
  images/
    cards/
      42346.jpg  (product_id.jpg)
      42347.jpg
      ...
```

### Database Schema
- Added `local_image_url` column to `products` table
- Stores path like `/images/cards/42346.jpg`
- Falls back to `image_url` (external) if local image not available

## API Endpoints

### 1. Serve Image Directly
```
GET /api/images/cards/:productId
```
Returns the image file directly. Falls back to external URL redirect if local image not found.

### 2. Get Image URL
```
GET /api/images/cards/:productId/url
```
Returns JSON with image URL:
```json
{
  "url": "http://localhost:3001/images/cards/42346.jpg",
  "local": true
}
```

### 3. Batch Get Image URLs
```
POST /api/images/cards/batch-urls
Body: { "productIds": [42346, 42347, 42348] }
```
Returns:
```json
{
  "imageUrls": {
    "42346": { "url": "...", "local": true },
    "42347": { "url": "...", "local": false }
  }
}
```

### 4. Static File Serving
```
GET /images/cards/:filename
```
Serves images directly via Express static middleware.

## Card API Integration

The `/api/cards/*` endpoints automatically prefer local images:
- If `local_image_url` exists → uses local image
- Otherwise → falls back to `image_url` (external)

The `formatCardForFrontend()` function handles this automatically.

## Downloading Images

### Using Pokemon Price Tracker API
```bash
npm run hashes:from-api
```

This script:
1. Fetches card data from Pokemon Price Tracker API
2. Downloads high-quality images (800x800)
3. Saves to `public/images/cards/{product_id}.jpg`
4. Updates database with `local_image_url`
5. Calculates image hashes for scanning

### Benefits
- **Higher Quality**: 800x800 images vs 200x200 from direct CDN
- **Better Rate Limits**: 20k credits/day vs getting blocked
- **Local Storage**: Images cached locally, no external dependency
- **Faster Loading**: Served from your own server

## Usage

### Download Images
```bash
# Download and hash images using Pokemon Price Tracker API
npm run hashes:from-api
```

### Access Images
```javascript
// Frontend - images are automatically served locally if available
const card = await fetch('/api/cards/42346').then(r => r.json());
console.log(card.images.local); // true if local, false if external
console.log(card.images.small); // Full URL (local or external)
```

### Direct Image Access
```html
<!-- Direct image URL -->
<img src="http://localhost:3001/images/cards/42346.jpg" />

<!-- Or via API -->
<img src="http://localhost:3001/api/images/cards/42346" />
```

## Storage Considerations

### Disk Space
- Average card image: ~50-100 KB
- 20,000 cards: ~1-2 GB
- 50,000 cards: ~2.5-5 GB

### Backup
Images are stored in `public/images/cards/` - include this directory in backups.

### Cleanup
To remove old external images after migrating to local:
```sql
-- Check how many have local images
SELECT 
  COUNT(*) as total,
  COUNT(local_image_url) as local,
  COUNT(*) - COUNT(local_image_url) as external_only
FROM products
WHERE category_id = 3;
```

## Migration Strategy

1. **Phase 1**: Download images via API (using remaining credits)
2. **Phase 2**: Update frontend to prefer local images
3. **Phase 3**: Gradually migrate all cards to local storage
4. **Phase 4**: Remove dependency on external CDNs

## Rate Limit Management

With Pokemon Price Tracker API:
- **Pro Plan**: 20,000 credits/day
- **Cost**: $9.99/month
- **Current Usage**: 19,999/20,000 (almost at limit!)

### Strategy
1. Download images in batches of 1000 cards
2. Wait for daily reset (20k credits refresh)
3. Continue until all cards have local images
4. Cancel API subscription once complete (optional)

## Benefits

✅ **No Rate Limits**: Images served from your server  
✅ **Faster Loading**: No external API calls  
✅ **Higher Quality**: 800x800 images  
✅ **Reliability**: No dependency on external CDNs  
✅ **Cost Control**: One-time download vs ongoing API costs  


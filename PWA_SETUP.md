# PWA Setup Guide

## Overview
The Card Collecting App is now configured as a Progressive Web App (PWA), allowing users to install it on their devices and use it offline.

## Features
- ✅ **Installable**: Users can add the app to their home screen
- ✅ **Offline Support**: Basic offline functionality via service worker
- ✅ **App-like Experience**: Standalone display mode
- ✅ **Fast Loading**: Cached assets for faster load times

## Setup Instructions

### 1. Generate App Icons
You need to create app icons for the PWA:

```bash
# Create 192x192 and 512x512 PNG icons
# Place them in the public folder as:
# - public/icon-192.png
# - public/icon-512.png
```

You can use online tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### 2. Build for Production
```bash
npm run build
```

### 3. Test PWA Locally
```bash
# Serve the built app
npm run preview

# Or use a simple HTTP server
npx serve dist
```

### 4. Deploy
Deploy the `dist` folder to your hosting provider (Vercel, Netlify, etc.)

## Service Worker
The service worker (`public/sw.js`) provides:
- **Caching**: Static assets are cached for offline access
- **Network First**: API calls always use network
- **Fallback**: Returns cached index.html if offline

## Manifest
The manifest file (`public/manifest.json`) defines:
- App name and description
- Icons and theme colors
- Display mode (standalone)
- Start URL

## Testing PWA Features

### Chrome DevTools
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check "Service Workers" section
4. Check "Manifest" section
5. Use "Lighthouse" to test PWA score

### Mobile Testing
1. Serve over HTTPS (required for PWA)
2. Open on mobile device
3. Look for "Add to Home Screen" prompt
4. Test offline functionality

## Troubleshooting

### Service Worker Not Registering
- Ensure you're serving over HTTPS (or localhost)
- Check browser console for errors
- Clear browser cache and reload

### Icons Not Showing
- Verify icon files exist in `public/` folder
- Check file sizes (should be reasonable, not too large)
- Ensure correct paths in manifest.json

### Offline Not Working
- Check service worker is registered (DevTools > Application > Service Workers)
- Verify assets are cached (DevTools > Application > Cache Storage)
- Test with network throttling in DevTools

## Next Steps
1. Create proper app icons
2. Test on multiple devices
3. Optimize service worker caching strategy
4. Add offline data sync capabilities
5. Implement background sync for collection updates


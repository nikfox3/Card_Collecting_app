# Fix 404 Asset Errors in Android APK

## Problem
Assets (JS/CSS files) are returning 404 errors when loading the app in Android.

## Root Cause
The service worker was intercepting asset requests and causing path resolution issues in Capacitor.

## Solution Applied

### 1. Service Worker Unregistration
Added code to automatically unregister any existing service workers when the app loads, especially in Capacitor builds.

### 2. Service Worker Skip for Assets
Updated the service worker to skip intercepting `/assets/` requests, allowing them to load directly.

### 3. Conditional Service Worker Registration
Service worker only registers in web browsers, not in Capacitor builds.

## Steps to Fix

### Option 1: Complete Uninstall (Recommended)
1. **Uninstall the app completely** from your Android device
2. **Clear app data** (Settings → Apps → CardStax → Storage → Clear Data)
3. Rebuild the APK in Android Studio
4. Install the new APK

### Option 2: Clear Service Worker Cache
1. Open Chrome DevTools on your device (if enabled)
2. Go to Application → Service Workers
3. Unregister all service workers
4. Clear all caches
5. Reload the app

### Option 3: Fresh Install
1. Uninstall the app
2. Rebuild APK: `npm run build && npm run android:sync`
3. Build APK in Android Studio
4. Install fresh APK

## Verification

After installing the new APK, check the console:
- You should see: "Unregistered old service worker" (if one existed)
- You should NOT see: "SW registered" (in Capacitor)
- Assets should load without 404 errors

## Files Modified
- `index.html` - Added service worker unregistration
- `dist/index.html` - Same changes
- `public/sw.js` - Skip asset files
- `dist/sw.js` - Same changes

## If Issues Persist

1. Check that files exist:
   ```bash
   ls -la android/app/src/main/assets/public/assets/
   ```

2. Verify HTML references:
   ```bash
   grep "assets" android/app/src/main/assets/public/index.html
   ```

3. Check service worker status in Chrome DevTools

4. Try completely uninstalling and reinstalling the app


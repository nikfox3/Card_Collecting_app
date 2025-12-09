# Fix: White Screen on Android APK

A white screen usually means the app can't load or there's a JavaScript error. Here's how to fix it:

## Common Causes

1. **API URL pointing to localhost** (most common)
2. **JavaScript errors** preventing app from loading
3. **Network security** blocking HTTP connections
4. **Web assets not properly synced**

## Quick Fix Steps

### Step 1: Check Device Logs

**Connect device and check logs:**
```bash
# View all logs
~/Library/Android/sdk/platform-tools/adb logcat

# Filter for your app
~/Library/Android/sdk/platform-tools/adb logcat | grep -i cardstax

# Or use Chrome DevTools (if enabled)
# chrome://inspect → Devices → Inspect
```

### Step 2: Configure API URL for Mobile

**The app needs a real API URL, not localhost!**

**Option A: Use Your Computer's IP (For Testing)**

1. **Find your computer's IP:**
   ```bash
   # On Mac
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Look for something like: 192.168.1.100
   ```

2. **Update API URL:**
   ```bash
   # Create .env.production with your IP
   cat > .env.production << EOF
   VITE_API_URL=http://YOUR_IP:3002
   EOF
   # Replace YOUR_IP with your actual IP (e.g., 192.168.1.100)
   ```

3. **Rebuild and sync:**
   ```bash
   npm run build
   npm run android:sync
   ```

4. **Rebuild APK in Android Studio**

**Option B: Use Production API (Recommended)**

1. **Deploy your backend server** to a cloud provider
2. **Set production API URL:**
   ```bash
   cat > .env.production << EOF
   VITE_API_URL=https://your-production-api.com
   EOF
   ```

3. **Rebuild and sync:**
   ```bash
   npm run build
   npm run android:sync
   ```

### Step 3: Enable WebView Debugging

This allows you to see JavaScript errors in Chrome DevTools:

1. **Already configured** in `capacitor.config.json`:
   ```json
   "webContentsDebuggingEnabled": true
   ```

2. **Debug in Chrome:**
   - Connect device via USB
   - Open Chrome: `chrome://inspect`
   - Find your device and click "Inspect"
   - Check Console tab for errors

### Step 4: Verify Web Assets Are Synced

```bash
# Check if assets are in Android project
ls -la android/app/src/main/assets/public/

# Should see index.html and other files
# If not, sync again:
npm run build
npm run android:sync
```

### Step 5: Check Network Security

Network security config has been added to allow HTTP connections. Make sure:
- `android/app/src/main/res/xml/network_security_config.xml` exists
- `AndroidManifest.xml` references it (already updated)

## Debugging Steps

### 1. Check Logs for Errors

```bash
# Connect device
~/Library/Android/sdk/platform-tools/adb devices

# View logs
~/Library/Android/sdk/platform-tools/adb logcat | grep -E "(CardStax|chromium|WebView|ERROR)"
```

### 2. Check Chrome DevTools

1. Connect device via USB
2. Enable USB Debugging
3. Open Chrome: `chrome://inspect`
4. Find your device → Click "Inspect"
5. Check Console for JavaScript errors
6. Check Network tab for failed requests

### 3. Test API Connection

The app might be trying to connect to `localhost:3002` which doesn't exist on your phone.

**Quick test - Update API URL temporarily:**

Edit `src/utils/api.js` and hardcode a test URL:
```javascript
if (isCapacitor) {
  // TEMPORARY: Use your computer's IP for testing
  return 'http://192.168.1.100:3002'; // Replace with your IP
}
```

Then rebuild:
```bash
npm run build
npm run android:sync
# Rebuild APK in Android Studio
```

## Most Likely Fix

**The issue is probably the API URL.** Your phone can't connect to `localhost:3002`.

**Quick fix for testing:**

1. **Start your backend server:**
   ```bash
   cd server
   npm start
   # Server should be running on port 3002
   ```

2. **Find your computer's IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. **Update .env.production:**
   ```bash
   echo "VITE_API_URL=http://YOUR_IP:3002" > .env.production
   # Replace YOUR_IP with actual IP (e.g., 192.168.1.100)
   ```

4. **Rebuild:**
   ```bash
   npm run build
   npm run android:sync
   ```

5. **Rebuild APK in Android Studio**

6. **Make sure phone and computer are on same WiFi network**

7. **Reinstall APK**

## Verify Fix

After making changes:

1. **Check logs:**
   ```bash
   adb logcat | grep CardStax
   ```

2. **Check Chrome DevTools:**
   - `chrome://inspect` → Inspect device
   - Look for errors in Console

3. **Test API connection:**
   - Open app
   - Check if it loads (not white screen)
   - Try a feature that uses API

## Still White Screen?

1. **Check if index.html loads:**
   - Chrome DevTools → Network tab
   - Refresh app
   - See if index.html loads

2. **Check JavaScript errors:**
   - Chrome DevTools → Console tab
   - Look for red errors

3. **Check API connection:**
   - Network tab → Look for API requests
   - See if they're failing

4. **Try debug APK:**
   - Build debug APK instead
   - Debug APK has more logging

## Next Steps

1. ✅ Check device logs for errors
2. ✅ Configure API URL (your computer's IP or production URL)
3. ✅ Rebuild web app and sync
4. ✅ Rebuild APK
5. ✅ Reinstall and test

The most common issue is the API URL pointing to localhost. Fix that first!


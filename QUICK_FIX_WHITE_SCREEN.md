# Quick Fix: White Screen Issue

## The Problem

Your app is trying to connect to `localhost:3002`, which doesn't exist on your phone. This causes the app to fail loading.

## ✅ Quick Fix Applied

I've configured your API URL to use your computer's IP address: `192.168.1.240:3002`

**Files updated:**
- ✅ Created `.env.production` with your IP
- ✅ Updated AndroidManifest.xml for network security
- ✅ Added network security config
- ✅ Rebuilt web app
- ✅ Synced to Android

## Next Steps

### 1. Make Sure Your Backend Server is Running

```bash
# Start your API server
cd server
npm start
# Should be running on port 3002
```

### 2. Make Sure Phone and Computer Are on Same WiFi

- Both devices must be on the same WiFi network
- Your computer's IP: `192.168.1.240`
- Server should be accessible at: `http://192.168.1.240:3002`

### 3. Rebuild APK in Android Studio

1. **Open Android Studio:**
   ```bash
   npm run android:open
   ```

2. **Build release APK:**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Select "release" variant

3. **Install new APK:**
   ```bash
   ~/Library/Android/sdk/platform-tools/adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

### 4. Test the App

The app should now:
- ✅ Load (no white screen)
- ✅ Connect to your API server
- ✅ Function properly

## If Still White Screen

### Check Logs

```bash
# View device logs
~/Library/Android/sdk/platform-tools/adb logcat | grep -i cardstax

# Or use Chrome DevTools
# 1. Connect device via USB
# 2. Open Chrome: chrome://inspect
# 3. Click "Inspect" on your device
# 4. Check Console tab for errors
```

### Verify API Server is Running

```bash
# Test if server is accessible
curl http://192.168.1.240:3002/health

# Should return: {"status":"ok",...}
```

### Check Network Connection

1. On your phone, open a browser
2. Go to: `http://192.168.1.240:3002/health`
3. Should see API response
4. If not, check firewall settings

## For Production

When ready for production, update `.env.production`:

```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://your-production-api.com
EOF
```

Then rebuild:
```bash
npm run build
npm run android:sync
# Rebuild APK
```

## Current Configuration

- **API URL:** `http://192.168.1.240:3002`
- **Network Security:** HTTP allowed (for development)
- **WebView Debugging:** Enabled

The app should work now! Rebuild the APK and reinstall.


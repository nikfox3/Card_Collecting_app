# Quick Start: Building Android APK

## Prerequisites Checklist

- [ ] Android Studio installed
- [ ] Java JDK 17+ installed
- [ ] Android SDK installed (via Android Studio)
- [ ] Environment variables set (see ANDROID_BUILD_GUIDE.md)

## Quick Build Steps

### 1. First Time Setup

```bash
# Install dependencies (if not already done)
npm install

# Build the web app
npm run build

# Sync to Android
npm run android:sync
```

### 2. Configure API URL

**For Production:**
Create `.env.production` file:
```
VITE_API_URL=https://your-production-api.com
```

**For Testing:**
Update `src/utils/api.js` to use your computer's IP:
```javascript
// For local testing, replace with your computer's IP
return 'http://192.168.1.100:3002';
```

### 3. Build APK

**Option A: Using Android Studio (Recommended)**
```bash
npm run android:open
```
Then in Android Studio:
- Build → Build Bundle(s) / APK(s) → Build APK(s)
- Wait for build
- Click "locate" to find APK

**Option B: Command Line**
```bash
cd android
./gradlew assembleDebug
```
APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Install on Device

```bash
# Connect Android device via USB
# Enable USB Debugging in Developer Options

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Common Commands

```bash
# Build and sync
npm run build:android

# Open in Android Studio
npm run android:open

# Run on connected device
npm run android:run
```

## Troubleshooting

**"SDK location not found"**
- Set ANDROID_HOME environment variable
- Or create `android/local.properties`:
  ```
  sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
  ```

**"Gradle sync failed"**
- Open Android Studio
- File → Sync Project with Gradle Files

**API not connecting**
- Check API URL in `src/utils/api.js`
- Ensure backend server is running
- For mobile, use your computer's IP, not localhost

## Full Documentation

See `ANDROID_BUILD_GUIDE.md` for complete instructions.


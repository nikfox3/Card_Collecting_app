# Next Steps: Complete Android APK Setup

Follow these steps in order to build and distribute your CardStax Android APK.

## ✅ Step 1: Create Keystore (If Not Done)

**Run the simple script:**
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
./create-keystore-simple.sh
```

**Or manually:**
```bash
/Applications/Android\ Studio.app/Contents/jbr/Contents/Home/bin/keytool \
  -genkey -v \
  -keystore cardstax-release-key.jks \
  -alias cardstax \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Then create `android/key.properties`:**
```bash
cat > android/key.properties << 'EOF'
storeFile=../cardstax-release-key.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=cardstax
keyPassword=YOUR_KEY_PASSWORD
EOF
```
(Replace with your actual passwords)

## ✅ Step 2: Configure Production API URL

Your app needs to know where to find your backend API.

**Option A: Environment Variable (Recommended)**
```bash
# Create .env.production file
cat > .env.production << 'EOF'
VITE_API_URL=https://your-production-api.com
EOF
```

**Option B: Direct Update**
Edit `src/utils/api.js` and set your production API URL.

**Then rebuild:**
```bash
npm run build
npm run android:sync
```

## ✅ Step 3: Open Project in Android Studio

```bash
npm run android:open
```

**Or manually:**
1. Open Android Studio
2. File → Open
3. Navigate to: `/Users/NikFox/Documents/git/Card_Collecting_app/android`
4. Wait for Gradle sync to complete

## ✅ Step 4: Build Debug APK (Test First)

**In Android Studio:**
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Wait for "BUILD SUCCESSFUL"
3. Click "locate" in notification
4. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

**Install on device:**
```bash
# Connect Android device via USB
# Enable USB Debugging

adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Test thoroughly:**
- ✅ App launches
- ✅ API connects
- ✅ Card scanning works
- ✅ All features function correctly

## ✅ Step 5: Update Version (If Needed)

**Edit `android/app/build.gradle`:**
```gradle
defaultConfig {
    versionCode 1        // Increment for each release
    versionName "1.0.0"  // User-visible version
}
```

## ✅ Step 6: Build Release APK

**In Android Studio:**
1. Build Variants → Select "release"
2. Build → Build Bundle(s) / APK(s) → Build APK(s)
3. Wait for build
4. APK location: `android/app/build/outputs/apk/release/app-release.apk`

**Or via command line:**
```bash
cd android
./gradlew assembleRelease
```

## ✅ Step 7: Test Release APK

**Install on device:**
```bash
# Uninstall debug version first
adb uninstall com.cardstax.app

# Install release APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Test everything again:**
- ✅ All features work
- ✅ API connects correctly
- ✅ No crashes or errors
- ✅ Performance is good

## ✅ Step 8: Prepare for Distribution

### Option A: Direct Distribution (APK)

1. **Share APK file:**
   - Upload to your website
   - Share via email/cloud storage
   - Users need to enable "Install from Unknown Sources"

2. **Create download page:**
   - Instructions for users
   - System requirements
   - Installation steps

### Option B: Google Play Store (Recommended)

1. **Create App Bundle:**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   AAB location: `android/app/build/outputs/bundle/release/app-release.aab`

2. **Create Play Console Account:**
   - Go to https://play.google.com/console
   - Pay $25 one-time registration fee
   - Create new app

3. **Prepare Store Listing:**
   - App name: CardStax
   - Short description
   - Full description
   - Screenshots (at least 2)
   - App icon (512x512)
   - Feature graphic (1024x500)

4. **Upload AAB:**
   - Production → Create new release
   - Upload `app-release.aab`
   - Fill in release notes
   - Submit for review

## ✅ Step 9: Set Up Backend Server (If Not Done)

Your app needs a backend API. Options:

**Option A: Deploy Your Server**
- Deploy `server/` folder to:
  - Heroku
  - AWS
  - DigitalOcean
  - Railway
  - Or any Node.js hosting

**Option B: Use ngrok (Testing Only)**
```bash
# Install ngrok
brew install ngrok

# Start your server
cd server
npm start

# In another terminal, expose it
ngrok http 3002
# Use the https URL in your app
```

**Option C: Local Network (Development)**
- Use your computer's IP address
- Update API URL to: `http://YOUR_IP:3002`
- Only works on same network

## ✅ Step 10: Monitor and Update

**After launch:**
- Monitor app crashes (consider Firebase Crashlytics)
- Collect user feedback
- Plan updates and new features
- Update version numbers for each release

## Quick Checklist

- [ ] Keystore created
- [ ] key.properties configured
- [ ] Production API URL set
- [ ] Web app rebuilt (`npm run build`)
- [ ] Android project synced (`npm run android:sync`)
- [ ] Debug APK built and tested
- [ ] Release APK built
- [ ] Release APK tested
- [ ] Backend server deployed/configured
- [ ] Ready for distribution

## Common Commands Reference

```bash
# Build web app
npm run build

# Sync to Android
npm run android:sync

# Build and sync
npm run build:android

# Open in Android Studio
npm run android:open

# Build debug APK (command line)
cd android && ./gradlew assembleDebug

# Build release APK (command line)
cd android && ./gradlew assembleRelease

# Build app bundle (for Play Store)
cd android && ./gradlew bundleRelease

# Install APK on device
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Need Help?

- **Keystore issues:** See `FIX_JAVA_KEYSTORE.md`
- **Build errors:** See `ANDROID_STUDIO_SETUP.md` troubleshooting section
- **API configuration:** See `ANDROID_BUILD_GUIDE.md`

## Current Status

Based on your progress:
1. ✅ Android project configured
2. ✅ Build scripts ready
3. ⏳ Keystore creation (in progress)
4. ⏳ Production API configuration (next)
5. ⏳ First APK build (after above)

**Your immediate next step:** Create the keystore using `./create-keystore-simple.sh`


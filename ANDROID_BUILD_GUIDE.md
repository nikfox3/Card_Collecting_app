# Android APK Build Guide for CardStax

This guide will help you build and package your CardStax app as an Android APK using Capacitor.

## Prerequisites

### 1. Install Required Tools

#### Android Studio
- Download and install [Android Studio](https://developer.android.com/studio)
- During installation, make sure to install:
  - Android SDK
  - Android SDK Platform
  - Android Virtual Device (AVD) - optional, for testing

#### Java Development Kit (JDK)
- Android Studio includes JDK, but you can also install separately:
  - JDK 17 or later (recommended)
  - Check installation: `java -version`

#### Environment Variables
Add to your `~/.zshrc` or `~/.bash_profile`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload: `source ~/.zshrc`

### 2. Verify Installation

```bash
# Check Java
java -version

# Check Android SDK (after setting environment variables)
adb version

# Check Capacitor
npx cap --version
```

## Building the APK

### Step 1: Build the Web App

First, build your React/Vite app:

```bash
npm run build
```

This creates the `dist` folder with your production-ready web app.

### Step 2: Sync with Android

Sync your web assets to the Android project:

```bash
npm run android:sync
```

Or use the combined command:

```bash
npm run build:android
```

### Step 3: Configure API URL (Important!)

Since your app connects to a backend API, you need to configure the API URL for production.

**Option A: Use Production Server**
Update `src/utils/api.js` to use your production API URL:

```javascript
export const API_URL = 'https://your-production-api.com';
```

**Option B: Use Environment Variables**
Create a `.env.production` file:

```
VITE_API_URL=https://your-production-api.com
```

Then update `src/utils/api.js`:

```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
```

### Step 4: Open in Android Studio

```bash
npm run android:open
```

This opens the Android project in Android Studio.

### Step 5: Configure App Settings

In Android Studio:

1. **Update App Name & Package**
   - Open `android/app/src/main/res/values/strings.xml`
   - Update `app_name` if needed

2. **Update Version**
   - Open `android/app/build.gradle`
   - Update `versionCode` and `versionName`

3. **Configure Permissions**
   - Open `android/app/src/main/AndroidManifest.xml`
   - Ensure these permissions are present:
     ```xml
     <uses-permission android:name="android.permission.INTERNET" />
     <uses-permission android:name="android.permission.CAMERA" />
     <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
     <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
     ```

4. **Configure API URL for Android**
   - The app needs to know where to find your API
   - You can hardcode it or use build variants

### Step 6: Build APK

#### Option A: Build Debug APK (for testing)

1. In Android Studio:
   - Click `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Wait for build to complete
   - Click `locate` to find the APK
   - Location: `android/app/build/outputs/apk/debug/app-debug.apk`

2. Or via command line:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Build Release APK (for distribution)

1. **Create a Keystore** (first time only):
   ```bash
   keytool -genkey -v -keystore cardstax-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cardstax
   ```
   - Store the keystore file securely
   - Remember the password!

2. **Configure Signing**:
   - Create `android/key.properties`:
     ```properties
     storePassword=YOUR_KEYSTORE_PASSWORD
     keyPassword=YOUR_KEY_PASSWORD
     keyAlias=cardstax
     storeFile=../cardstax-release-key.jks
     ```

3. **Update build.gradle**:
   - Open `android/app/build.gradle`
   - Add before `android {`:
     ```gradle
     def keystorePropertiesFile = rootProject.file("key.properties")
     def keystoreProperties = new Properties()
     if (keystorePropertiesFile.exists()) {
         keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
     }
     ```
   - Inside `android {`, add:
     ```gradle
     signingConfigs {
         release {
             keyAlias keystoreProperties['keyAlias']
             keyPassword keystoreProperties['keyPassword']
             storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
             storePassword keystoreProperties['storePassword']
         }
     }
     buildTypes {
         release {
             signingConfig signingConfigs.release
         }
     }
     ```

4. **Build Release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Testing the APK

### Option 1: Install on Physical Device

1. Enable Developer Options on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. Connect device via USB

3. Install APK:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Option 2: Use Android Emulator

1. Open Android Studio
2. Tools → Device Manager
3. Create/Start an emulator
4. Run: `npm run android:run`

## Distribution

### Google Play Store

1. **Create App Bundle** (recommended for Play Store):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   AAB file: `android/app/build/outputs/bundle/release/app-release.aab`

2. **Create Play Console Account**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Pay one-time $25 registration fee
   - Create new app

3. **Upload AAB**:
   - Go to Production → Create new release
   - Upload the AAB file
   - Fill in store listing, screenshots, etc.
   - Submit for review

### Direct Distribution

- Share the APK file directly
- Users need to enable "Install from Unknown Sources"
- Not recommended for wide distribution (use Play Store)

## Troubleshooting

### Build Errors

**Error: SDK location not found**
- Set `ANDROID_HOME` environment variable
- Or create `local.properties` in `android/` folder:
  ```properties
  sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
  ```

**Error: Gradle sync failed**
- Open Android Studio
- File → Sync Project with Gradle Files
- Or: `cd android && ./gradlew clean`

**Error: API connection issues**
- Check `capacitor.config.json` - ensure `cleartext: true` for HTTP
- For HTTPS, ensure SSL certificate is valid
- Check network security config in AndroidManifest.xml

### Runtime Issues

**App crashes on launch**
- Check Android Studio Logcat for errors
- Ensure all permissions are granted
- Verify API URL is accessible from device

**API not connecting**
- For localhost testing, use your computer's IP address
- Update API_URL in `src/utils/api.js`
- Ensure backend server is running and accessible

## Quick Reference Commands

```bash
# Build web app
npm run build

# Sync to Android
npm run android:sync

# Build and sync
npm run build:android

# Open in Android Studio
npm run android:open

# Run on connected device/emulator
npm run android:run

# Build debug APK
cd android && ./gradlew assembleDebug

# Build release APK
cd android && ./gradlew assembleRelease

# Build release AAB (for Play Store)
cd android && ./gradlew bundleRelease
```

## Next Steps

1. **Set up production API server** - Your app needs a backend
2. **Configure app icons** - Update icons in `android/app/src/main/res/`
3. **Add app screenshots** - For Play Store listing
4. **Set up analytics** - Track app usage
5. **Configure push notifications** - If needed
6. **Set up crash reporting** - Firebase Crashlytics recommended

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)


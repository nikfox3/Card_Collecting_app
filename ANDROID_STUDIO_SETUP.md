# Android Studio Configuration Guide for CardStax APK

This guide will walk you through configuring and building your APK using Android Studio.

## Prerequisites

- Android Studio installed (latest version recommended)
- Java JDK 17 or later
- Android SDK installed via Android Studio

## Step 1: Open Project in Android Studio

1. **Open Android Studio**

2. **Open the Android project:**

   - Click "Open" or "File → Open"
   - Navigate to: `/Users/NikFox/Documents/git/Card_Collecting_app/android`
   - Click "OK"

3. **Wait for Gradle Sync:**
   - Android Studio will automatically sync Gradle
   - This may take a few minutes the first time
   - Watch the bottom status bar for "Gradle sync completed"

## Step 2: Configure Project Settings

### 2.1 Update App Version

1. **Open `app/build.gradle`:**

   - In the Project panel (left side), navigate to: `app → build.gradle`
   - Double-click to open

2. **Update version information:**
   ```gradle
   defaultConfig {
       versionCode 1        // Increment for each release (1, 2, 3...)
       versionName "1.0.0"  // User-visible version (1.0.0, 1.0.1, etc.)
   }
   ```

### 2.2 Configure App Name and Package

1. **Open `app/src/main/res/values/strings.xml`:**

   - Navigate to: `app → src → main → res → values → strings.xml`

2. **Verify/Update app name:**

   ```xml
   <string name="app_name">CardStax</string>
   ```

3. **Package name is in `app/build.gradle`:**
   ```gradle
   applicationId "com.cardstax.app"
   ```

## Step 3: Configure Signing (For Release APK)

### 3.1 Create Keystore (First Time Only)

**Option A: Using Simple Script (Easiest - Recommended)**

```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
./create-keystore-simple.sh
```

This script uses Android Studio's bundled Java (no Java installation needed) and will:

- Prompt you for passwords and information
- Create the keystore file

**If you get "Java Runtime not found" error:**

- Use the simple script above (it uses Android Studio's Java)
- Or see `FIX_JAVA_KEYSTORE.md` for solutions

**Option B: Using Android Studio**

1. Build → Generate Signed Bundle / APK
2. Select "APK" → Next
3. Click "Create new..." to create a new keystore
4. Fill in the form:
   - Key store path: Choose location (e.g., `cardstax-release-key.jks`)
   - Password: Create a strong password
   - Key alias: `cardstax`
   - Key password: Create a strong password
   - Validity: 25 years (recommended)
   - Certificate information: Fill in your details
5. Click "OK"

**Option C: Using Command Line (If Java is installed)**

```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
keytool -genkey -v -keystore cardstax-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias cardstax
```

**⚠️ Having Issues?**
See `KEYSTORE_TROUBLESHOOTING.md` for detailed troubleshooting steps.

### 3.2 Configure Signing in Android Studio

1. **Create `key.properties` file:**

   - In Android Studio, right-click `android` folder
   - New → File
   - Name: `key.properties`

2. **Add signing configuration:**

   ```properties
   storeFile=../cardstax-release-key.jks
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyAlias=cardstax
   keyPassword=YOUR_KEY_PASSWORD
   ```

3. **Add to .gitignore:**
   - Make sure `key.properties` is in `.gitignore`
   - Never commit this file!

## Step 4: Configure Build Variants

1. **Open Build Variants panel:**

   - View → Tool Windows → Build Variants
   - Or click the "Build Variants" tab at the bottom

2. **Select build variant:**
   - For testing: Select "debug"
   - For release: Select "release"

## Step 5: Build APK

### Option A: Build Debug APK (For Testing)

1. **Build menu:**

   - Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"

2. **Wait for build:**

   - Watch the "Build" tab at the bottom
   - Wait for "BUILD SUCCESSFUL"

3. **Locate APK:**
   - Click "locate" in the notification
   - Or navigate to: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Build Release APK (For Distribution)

1. **Ensure signing is configured:**

   - Make sure `key.properties` exists and is correct
   - Keystore file exists

2. **Build menu:**

   - Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
   - Select "release" build variant if prompted

3. **Wait for build:**

   - Watch the "Build" tab
   - Wait for "BUILD SUCCESSFUL"

4. **Locate APK:**
   - Navigate to: `android/app/build/outputs/apk/release/app-release.apk`

### Option C: Build App Bundle (For Google Play Store)

1. **Build menu:**

   - Click "Build" → "Generate Signed Bundle / APK"
   - Select "Android App Bundle"
   - Click "Next"

2. **Select keystore:**

   - Choose your keystore file
   - Enter passwords
   - Click "Next"

3. **Select build variant:**

   - Choose "release"
   - Click "Create"

4. **Locate AAB:**
   - Navigate to: `android/app/release/app-release.aab`

## Step 6: Install and Test APK

### Install on Physical Device

1. **Enable USB Debugging:**

   - On your Android device: Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back: Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect device:**

   - Connect via USB
   - Allow USB debugging on device

3. **Install via Android Studio:**

   - Click the "Run" button (green play icon)
   - Or: Run → Run 'app'

4. **Install via Command Line:**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Install on Emulator

1. **Create/Start Emulator:**

   - Tools → Device Manager
   - Create Virtual Device (if needed)
   - Start emulator

2. **Run app:**
   - Click "Run" button
   - Select emulator
   - App will install and launch

## Step 7: Configure API URL for Production

Before building a release APK, configure your production API URL:

1. **Create `.env.production` in project root:**

   ```
   VITE_API_URL=https://your-production-api.com
   ```

2. **Or update `src/utils/api.js` directly:**

   ```javascript
   // For production, set this to your API URL
   return import.meta.env.VITE_API_URL || "https://your-api.com";
   ```

3. **Rebuild web app:**

   ```bash
   npm run build
   ```

4. **Sync to Android:**
   ```bash
   npm run android:sync
   ```

## Step 8: Optimize APK Size (Optional)

### Enable ProGuard (Code Shrinking)

1. **Edit `app/build.gradle`:**

   ```gradle
   buildTypes {
       release {
           minifyEnabled true
           shrinkResources true
           proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
       }
   }
   ```

2. **Test thoroughly** - ProGuard may remove code if not configured correctly

### Enable Split APKs

Add to `app/build.gradle`:

```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk true
        }
    }
}
```

## Troubleshooting

### Gradle Sync Failed

1. **File → Sync Project with Gradle Files**
2. **Or:** `cd android && ./gradlew clean`
3. **Check:** Android Studio → Preferences → Build → Gradle
   - Use Gradle from: 'gradle-wrapper.properties' file

### SDK Location Not Found

1. **Create `android/local.properties`:**

   ```properties
   sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
   ```

2. **Or set in Android Studio:**
   - Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
   - Note the SDK location

### Build Errors

1. **Clean project:**

   - Build → Clean Project

2. **Rebuild:**

   - Build → Rebuild Project

3. **Invalidate caches:**
   - File → Invalidate Caches / Restart

### APK Not Installing

1. **Uninstall old version first:**

   ```bash
   adb uninstall com.cardstax.app
   ```

2. **Check device compatibility:**
   - Verify `minSdkVersion` in `build.gradle`
   - Check device Android version

## Quick Reference

### Build Commands in Android Studio

- **Build APK:** Build → Build Bundle(s) / APK(s) → Build APK(s)
- **Clean:** Build → Clean Project
- **Rebuild:** Build → Rebuild Project
- **Run:** Run → Run 'app' (or green play button)

### File Locations

- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK:** `android/app/build/outputs/apk/release/app-release.apk`
- **App Bundle:** `android/app/release/app-release.aab`
- **Keystore:** `cardstax-release-key.jks` (in project root)

### Version Management

- **versionCode:** Increment for each release (1, 2, 3...)
- **versionName:** User-visible version (1.0.0, 1.0.1, 1.1.0...)

## Next Steps

1. ✅ Build debug APK and test on device
2. ✅ Configure production API URL
3. ✅ Create release keystore
4. ✅ Build release APK
5. ✅ Test release APK thoroughly
6. ✅ Prepare for Google Play Store (if distributing)

## Additional Resources

- [Android Studio User Guide](https://developer.android.com/studio/intro)
- [Build Your App](https://developer.android.com/studio/build)
- [Sign Your App](https://developer.android.com/studio/publish/app-signing)

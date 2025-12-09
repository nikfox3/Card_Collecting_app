# Quick APK Installation Guide

You have APKs ready! Here are the fastest ways to install:

## ✅ Your APK Files

- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk` (239 MB)
- **Release APK:** `android/app/build/outputs/apk/release/app-release.apk` (236 MB)

**Use the Release APK** for final testing.

## Method 1: Direct File Transfer (Easiest - No ADB Needed)

### Step 1: Copy APK to Device

**Option A: USB Transfer**
1. Connect Android device via USB
2. On your Mac, the device should appear in Finder
3. Open device → Internal Storage → Downloads
4. Drag `app-release.apk` to the Downloads folder

**Option B: Cloud Transfer**
1. Upload `app-release.apk` to Google Drive/Dropbox
2. On your device, download the file

**Option C: Email**
1. Email the APK to yourself
2. Open email on device and download

### Step 2: Install on Device

1. **Open Files app** on your Android device
2. **Navigate to Downloads** (or wherever you saved it)
3. **Tap on `app-release.apk`**
4. **Allow installation:**
   - You'll see a security warning
   - Tap **Settings** or **More details**
   - Enable **"Install from Unknown Sources"** or **"Allow from this source"**
   - Go back and tap **Install**
5. **Wait for installation**
6. **Tap Open** or find **CardStax** in your app drawer

## Method 2: Using ADB (If You Have It)

### Find ADB Location

```bash
# Check if ADB is available
which adb

# Or find it in Android SDK
find ~/Library/Android/sdk -name "adb" 2>/dev/null
```

### Add ADB to PATH (One Time Setup)

Add to `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Then reload:
```bash
source ~/.zshrc
```

### Install via ADB

1. **Enable USB Debugging:**
   - Settings → About Phone → Tap Build Number 7 times
   - Settings → Developer Options → Enable USB Debugging

2. **Connect device via USB**

3. **Install:**
   ```bash
   cd /Users/NikFox/Documents/git/Card_Collecting_app
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

## Method 3: Using Android Studio (Automatic)

1. **Open project:**
   ```bash
   npm run android:open
   ```

2. **Connect device via USB**
   - Enable USB Debugging

3. **Click Run button** (green play icon)
   - Android Studio will install automatically

## Quick Steps Summary

**Fastest Method (No setup needed):**
1. Copy `app-release.apk` to device (USB, cloud, or email)
2. Open Files app on device
3. Tap APK file
4. Allow installation from unknown sources
5. Install and open!

## Troubleshooting

**"Install blocked" or "Unknown sources"**
- Go to Settings → Security → Enable "Install from Unknown Sources"
- Or when prompted, tap Settings and allow

**"Package appears to be corrupt"**
- Try the debug APK instead
- Rebuild the APK

**"App not installing"**
- Make sure you have enough storage space
- Uninstall any previous version first

## Your APK Location

The release APK is ready at:
```
/Users/NikFox/Documents/git/Card_Collecting_app/android/app/build/outputs/apk/release/app-release.apk
```

Just copy this file to your device and install!


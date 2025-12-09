# How to Install APK on Android Device

## Method 1: Using ADB (USB Connection) - Recommended

### Step 1: Enable USB Debugging on Your Device

1. **Enable Developer Options:**
   - Go to **Settings → About Phone**
   - Find **Build Number** (may be under Software Information)
   - Tap **Build Number 7 times** until you see "You are now a developer!"

2. **Enable USB Debugging:**
   - Go back to **Settings**
   - Find **Developer Options** (usually under System or Advanced)
   - Enable **USB Debugging**
   - Enable **Install via USB** (if available)

### Step 2: Connect Device via USB

1. Connect your Android device to your computer via USB cable
2. On your device, you may see a prompt: **"Allow USB debugging?"**
   - Check **"Always allow from this computer"**
   - Tap **Allow**

### Step 3: Verify Device is Connected

```bash
# Check if device is detected
adb devices
```

You should see your device listed. If you see "unauthorized", check your device and allow USB debugging.

### Step 4: Install APK

**For Debug APK:**
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**For Release APK:**
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
adb install android/app/build/outputs/apk/release/app-release.apk
```

**If app is already installed, use `-r` to replace:**
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Method 2: Direct File Transfer

### Step 1: Transfer APK to Device

1. **Copy APK to device:**
   - Connect device via USB
   - Copy APK file to device's Downloads folder or any accessible location
   - Or use cloud storage (Google Drive, Dropbox, etc.)

2. **On your device:**
   - Open **Files** app or **Downloads**
   - Find the APK file
   - Tap on it

### Step 2: Allow Installation from Unknown Sources

1. When you tap the APK, you'll see a security warning
2. Tap **Settings** or **More details**
3. Enable **"Install from Unknown Sources"** or **"Allow from this source"**
4. Go back and tap **Install**

### Step 3: Install

1. Tap **Install**
2. Wait for installation
3. Tap **Open** or find CardStax in your app drawer

## Method 3: Using Android Studio (Easiest)

### Step 1: Connect Device

1. Connect device via USB
2. Enable USB Debugging (see Method 1, Step 1)

### Step 2: Run from Android Studio

1. **Open project in Android Studio:**
   ```bash
   npm run android:open
   ```

2. **Select your device:**
   - Look at the top toolbar
   - Click the device dropdown (should show your device name)
   - If not listed, click **"No devices"** and select your device

3. **Click Run:**
   - Click the green **Run** button (play icon)
   - Or: **Run → Run 'app'**
   - Android Studio will build and install automatically

## Method 4: Wireless ADB (No USB Cable)

### Step 1: Initial USB Connection

First time setup requires USB:

1. Connect device via USB
2. Enable USB Debugging
3. Enable Wireless Debugging (Android 11+):
   - Settings → Developer Options
   - Enable **Wireless Debugging**
   - Tap it to see IP address and port

### Step 2: Connect Wirelessly

```bash
# Connect to device wirelessly
adb connect DEVICE_IP:PORT

# Example:
adb connect 192.168.1.100:5555
```

### Step 3: Install APK

```bash
# Now install wirelessly
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### "device not found" or "no devices/emulators found"

**Solutions:**
1. **Check USB connection:**
   - Try different USB cable
   - Try different USB port
   - Use USB 2.0 port (not USB 3.0)

2. **Check USB Debugging:**
   - Make sure it's enabled
   - Revoke USB debugging authorizations and reconnect

3. **Install ADB drivers (Windows):**
   - Download Android USB drivers
   - Or install Google USB Driver via Android Studio SDK Manager

4. **Check ADB:**
   ```bash
   # Restart ADB server
   adb kill-server
   adb start-server
   adb devices
   ```

### "INSTALL_FAILED_UPDATE_INCOMPATIBLE"

**Solution:**
```bash
# Uninstall existing version first
adb uninstall com.cardstax.app

# Then install new version
adb install android/app/build/outputs/apk/release/app-release.apk
```

### "INSTALL_FAILED_INSUFFICIENT_STORAGE"

**Solution:**
- Free up space on your device
- Uninstall unused apps

### "INSTALL_PARSE_FAILED_NO_CERTIFICATES"

**Solution:**
- Make sure you're installing a signed release APK
- Or install debug APK instead

### "Package appears to be corrupt"

**Solution:**
- Rebuild the APK
- Make sure build completed successfully
- Try installing debug APK first to test

## Quick Commands Reference

```bash
# Check connected devices
adb devices

# Install APK
adb install path/to/app.apk

# Install and replace existing
adb install -r path/to/app.apk

# Uninstall app
adb uninstall com.cardstax.app

# Restart ADB
adb kill-server && adb start-server

# View device logs
adb logcat

# View app-specific logs
adb logcat | grep CardStax
```

## Verify Installation

After installation:

1. **Check app is installed:**
   ```bash
   adb shell pm list packages | grep cardstax
   ```

2. **Launch app:**
   ```bash
   adb shell am start -n com.cardstax.app/.MainActivity
   ```

3. **Or find it manually:**
   - Open app drawer on device
   - Look for "CardStax" icon
   - Tap to launch

## Next Steps After Installation

1. ✅ **Test the app:**
   - Launch and verify it opens
   - Test API connection
   - Test card scanning
   - Test all major features

2. ✅ **Check logs if issues:**
   ```bash
   adb logcat | grep -i cardstax
   ```

3. ✅ **Monitor performance:**
   - Check for crashes
   - Monitor memory usage
   - Test on different Android versions if possible

## Tips

- **Keep USB Debugging enabled** for easier development
- **Use release APK** for final testing (matches production)
- **Test on multiple devices** if possible
- **Check Android version compatibility** (minSdkVersion 23 = Android 6.0+)


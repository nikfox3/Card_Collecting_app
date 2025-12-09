# Fix: Keystore File Not Found Error

## Problem
```
Execution failed for task ':app:validateSigningRelease'.
> Keystore file '/Users/NikFox/Documents/git/Card_Collecting_app/android/cardstax-release-key.jks' not found
```

## Solution

The issue is that Gradle is looking for the keystore in the wrong location. The path resolution has been fixed in `build.gradle`, but you may need to verify your setup.

### Option 1: Verify Current Setup (Recommended)

Your keystore should be at:
```
/Users/NikFox/Documents/git/Card_Collecting_app/cardstax-release-key.jks
```

Your `android/key.properties` should have:
```properties
storeFile=../cardstax-release-key.jks
```

The build.gradle has been updated to properly resolve this path.

### Option 2: Use Absolute Path

If the relative path still doesn't work, update `android/key.properties` to use an absolute path:

```properties
storeFile=/Users/NikFox/Documents/git/Card_Collecting_app/cardstax-release-key.jks
storePassword=YOUR_PASSWORD
keyAlias=cardstax
keyPassword=YOUR_PASSWORD
```

### Option 3: Move Keystore to android/ Folder

Alternatively, move the keystore to the android folder:

```bash
# Move keystore
mv cardstax-release-key.jks android/cardstax-release-key.jks

# Update key.properties
cat > android/key.properties << 'EOF'
storeFile=cardstax-release-key.jks
storePassword=YOUR_PASSWORD
keyAlias=cardstax
keyPassword=YOUR_PASSWORD
EOF
```

### Option 4: Verify File Exists

Check that the keystore file actually exists:

```bash
# Check if keystore exists
ls -lh /Users/NikFox/Documents/git/Card_Collecting_app/cardstax-release-key.jks

# Verify it's a valid keystore
/Applications/Android\ Studio.app/Contents/jbr/Contents/Home/bin/keytool \
  -list -v -keystore cardstax-release-key.jks
```

## After Fixing

1. **Clean the project:**
   ```bash
   cd android
   ./gradlew clean
   ```

2. **Try building again in Android Studio:**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Select "release" build variant

3. **Or build via command line:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## Current Status

✅ **Keystore exists:** `/Users/NikFox/Documents/git/Card_Collecting_app/cardstax-release-key.jks`
✅ **key.properties exists:** `android/key.properties`
✅ **build.gradle updated:** Path resolution fixed

The build.gradle file has been updated to properly resolve the `../cardstax-release-key.jks` path. Try building again - it should work now!


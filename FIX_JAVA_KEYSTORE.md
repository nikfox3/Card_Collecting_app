# Fix: Java Runtime Not Found Error

If you're getting "Unable to locate a Java Runtime" error, here's the quick fix:

## Quick Solution: Use Android Studio's Java

Android Studio comes with its own Java, so you don't need to install Java separately!

### Method 1: Use the Simple Script (Easiest)

```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
./create-keystore-simple.sh
```

This script uses Android Studio's bundled Java automatically.

### Method 2: Direct Command

```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app

# Use Android Studio's keytool directly
/Applications/Android\ Studio.app/Contents/jbr/Contents/Home/bin/keytool \
  -genkey -v \
  -keystore cardstax-release-key.jks \
  -alias cardstax \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Then follow the prompts:
- Enter keystore password (twice)
- Enter key password (can be same)
- Enter your name, organization, etc.

### Method 3: Create key.properties Manually

After creating the keystore, create `android/key.properties`:

```bash
cat > android/key.properties << 'EOF'
storeFile=../cardstax-release-key.jks
storePassword=YOUR_KEYSTORE_PASSWORD_HERE
keyAlias=cardstax
keyPassword=YOUR_KEY_PASSWORD_HERE
EOF
```

Replace `YOUR_KEYSTORE_PASSWORD_HERE` and `YOUR_KEY_PASSWORD_HERE` with the passwords you entered.

## Alternative: Install Java (If Needed)

If you want Java in your PATH for other purposes:

### Option A: Install via Homebrew
```bash
brew install openjdk@17
```

Then add to `~/.zshrc`:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH
```

Reload:
```bash
source ~/.zshrc
```

### Option B: Download from Oracle
1. Visit: https://www.oracle.com/java/technologies/downloads/
2. Download JDK 17 or later for macOS
3. Install the .dmg file
4. Add to PATH (see Option A)

## Verify It Works

Test the keytool:
```bash
/Applications/Android\ Studio.app/Contents/jbr/Contents/Home/bin/keytool -version
```

You should see version information.

## After Creating Keystore

1. ✅ Keystore file created: `cardstax-release-key.jks`
2. ✅ Create `android/key.properties` with your passwords
3. ✅ Build release APK in Android Studio

## Still Having Issues?

1. **Check Android Studio is installed:**
   ```bash
   ls -la "/Applications/Android Studio.app"
   ```

2. **Try different path:**
   If Android Studio is in a different location, find it:
   ```bash
   find /Applications -name "keytool" 2>/dev/null
   ```

3. **Use Android Studio GUI:**
   - Build → Generate Signed Bundle / APK
   - Click "Create new..." keystore
   - This uses Android Studio's Java automatically


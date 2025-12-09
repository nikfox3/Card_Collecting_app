# Keystore Creation Troubleshooting Guide

If you're getting "Failed to create keystore" error, try these solutions:

## Method 1: Using Command Line (Recommended)

### Step 1: Find Java/Keytool Location

**On macOS:**
```bash
# Check if keytool exists
which keytool

# If not found, try finding Java
/usr/libexec/java_home -V

# Use full path to keytool
/usr/libexec/java_home)/bin/keytool
```

### Step 2: Create Keystore via Command Line

```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app

# Create keystore (replace YOUR_PASSWORD with actual password)
keytool -genkey -v -keystore cardstax-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias cardstax \
  -storepass YOUR_KEYSTORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=CardStax, OU=Development, O=CardStax, L=City, ST=State, C=US"
```

**Or use full path if keytool not in PATH:**
```bash
# Find Java home first
JAVA_HOME=$(/usr/libexec/java_home)

# Use full path
$JAVA_HOME/bin/keytool -genkey -v -keystore cardstax-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias cardstax \
  -storepass YOUR_KEYSTORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=CardStax, OU=Development, O=CardStax, L=City, ST=State, C=US"
```

### Step 3: Create key.properties

After creating the keystore, create `android/key.properties`:

```properties
storeFile=../cardstax-release-key.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=cardstax
keyPassword=YOUR_KEY_PASSWORD
```

## Method 2: Using Android Studio GUI

### Step 1: Open Build Menu
1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Select **"APK"** → Click **Next**

### Step 2: Create New Keystore
1. Click **"Create new..."** button
2. Fill in the form:
   - **Key store path:** Click folder icon, navigate to project root, name it `cardstax-release-key.jks`
   - **Password:** Enter a strong password (remember this!)
   - **Confirm:** Re-enter password
   - **Key alias:** `cardstax`
   - **Key password:** Enter password (can be same as keystore password)
   - **Validity:** 25 years (or 10000 days)
   - **First and Last Name:** Your name or company name
   - **Organizational Unit:** Development (or your department)
   - **Organization:** CardStax (or your company)
   - **City:** Your city
   - **State:** Your state
   - **Country Code:** US (or your country code)

3. Click **OK**

### Step 3: If GUI Fails
If Android Studio GUI fails, use Method 1 (command line) instead.

## Method 3: Using Android Studio Terminal

1. **Open Terminal in Android Studio:**
   - View → Tool Windows → Terminal
   - Or: Alt+F12 (Windows/Linux) / Option+F12 (Mac)

2. **Navigate to project root:**
   ```bash
   cd /Users/NikFox/Documents/git/Card_Collecting_app
   ```

3. **Create keystore:**
   ```bash
   keytool -genkey -v -keystore cardstax-release-key.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias cardstax
   ```

4. **Follow prompts:**
   - Enter keystore password
   - Re-enter password
   - Enter your name, organization, etc.
   - Enter key password (can be same as keystore password)

## Common Errors and Solutions

### Error: "keytool: command not found"

**Solution:**
```bash
# Find Java
/usr/libexec/java_home -V

# Use full path
$(/usr/libexec/java_home)/bin/keytool -genkey ...
```

Or add Java to PATH:
```bash
# Add to ~/.zshrc or ~/.bash_profile
export JAVA_HOME=$(/usr/libexec/java_home)
export PATH=$JAVA_HOME/bin:$PATH
```

### Error: "Permission denied"

**Solution:**
```bash
# Check file permissions
ls -la cardstax-release-key.jks

# Fix permissions if needed
chmod 600 cardstax-release-key.jks
```

### Error: "Keystore file does not exist"

**Solution:**
- Make sure you're in the correct directory
- Use absolute path: `/Users/NikFox/Documents/git/Card_Collecting_app/cardstax-release-key.jks`
- Or relative path from android folder: `../cardstax-release-key.jks`

### Error: "Invalid keystore format"

**Solution:**
- Delete the corrupted keystore file
- Create a new one using the command line method
- Make sure to use `.jks` extension

### Error: Android Studio "Failed to create keystore"

**Solutions:**
1. **Check file permissions:**
   - Make sure you have write permissions in the directory
   - Try creating in a different location (Desktop, Documents)

2. **Use command line instead:**
   - Method 1 or Method 3 above

3. **Check Android Studio logs:**
   - Help → Show Log in Finder/Explorer
   - Look for detailed error messages

4. **Try different location:**
   - Create keystore in `android/` folder instead
   - Update `key.properties` accordingly:
     ```properties
     storeFile=cardstax-release-key.jks
     ```

## Verify Keystore Creation

After creating, verify it exists:

```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
ls -lh cardstax-release-key.jks
```

You should see a file around 2-3 KB.

## Test Keystore

Verify the keystore works:

```bash
keytool -list -v -keystore cardstax-release-key.jks
```

Enter the keystore password when prompted. You should see keystore information.

## Alternative: Use Different Keystore Format

If `.jks` format doesn't work, try `.keystore`:

```bash
keytool -genkey -v -keystore cardstax-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 -alias cardstax
```

Then update `key.properties`:
```properties
storeFile=../cardstax-release-key.keystore
```

## Quick Test Script

Create a test script to verify everything works:

```bash
#!/bin/bash
# test-keystore.sh

cd /Users/NikFox/Documents/git/Card_Collecting_app

# Check if keytool exists
if ! command -v keytool &> /dev/null; then
    echo "❌ keytool not found. Finding Java..."
    JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null)
    if [ -z "$JAVA_HOME" ]; then
        echo "❌ Java not found. Please install Java JDK."
        exit 1
    fi
    KEYTOOL="$JAVA_HOME/bin/keytool"
    echo "✅ Found keytool at: $KEYTOOL"
else
    KEYTOOL="keytool"
    echo "✅ keytool found in PATH"
fi

# Test keystore creation (will fail if already exists, that's OK)
echo "Testing keystore creation..."
$KEYTOOL -genkey -v -keystore test-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias test -storepass testpass -keypass testpass \
  -dname "CN=Test, OU=Test, O=Test, L=Test, ST=Test, C=US" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Keystore creation works!"
    rm -f test-keystore.jks
else
    echo "❌ Keystore creation failed. Check error above."
fi
```

Run it:
```bash
chmod +x test-keystore.sh
./test-keystore.sh
```

## Still Having Issues?

1. **Check Java installation:**
   ```bash
   java -version
   /usr/libexec/java_home -V
   ```

2. **Install/Update Java:**
   - Download from: https://www.oracle.com/java/technologies/downloads/
   - Or use Homebrew: `brew install openjdk@17`

3. **Check Android Studio Java:**
   - Android Studio → Preferences → Build, Execution, Deployment → Build Tools → Gradle
   - Check "Gradle JDK" is set correctly

4. **Try creating in different location:**
   - Desktop: `~/Desktop/cardstax-release-key.jks`
   - Then move it to project root

## Need Help?

If none of these work, share:
1. The exact error message
2. Output of `java -version`
3. Output of `which keytool` or `keytool -version`
4. Whether you're using Android Studio GUI or command line


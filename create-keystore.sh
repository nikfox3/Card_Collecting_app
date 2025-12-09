#!/bin/bash
# Keystore Creation Script for CardStax
# This script helps create a keystore even if Java isn't in PATH

set -e

echo "🔑 CardStax Keystore Creation Script"
echo "===================================="
echo ""

# Find keytool
KEYTOOL=""
JAVA_HOME=""

# Method 1: Check if keytool is in PATH
if command -v keytool &> /dev/null; then
    KEYTOOL="keytool"
    echo "✅ Found keytool in PATH"
elif [ -f "/usr/bin/keytool" ]; then
    KEYTOOL="/usr/bin/keytool"
    echo "✅ Found keytool at /usr/bin/keytool"
fi

# Method 2: Try to find Java via /usr/libexec/java_home
if [ -z "$KEYTOOL" ]; then
    if command -v /usr/libexec/java_home &> /dev/null; then
        JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null || echo "")
        if [ -n "$JAVA_HOME" ] && [ -f "$JAVA_HOME/bin/keytool" ]; then
            KEYTOOL="$JAVA_HOME/bin/keytool"
            echo "✅ Found keytool via java_home: $KEYTOOL"
        fi
    fi
fi

# Method 3: Check Android Studio's bundled Java
if [ -z "$KEYTOOL" ]; then
    ANDROID_STUDIO_JAVA="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
    if [ -f "$ANDROID_STUDIO_JAVA/bin/keytool" ]; then
        KEYTOOL="$ANDROID_STUDIO_JAVA/bin/keytool"
        JAVA_HOME="$ANDROID_STUDIO_JAVA"
        echo "✅ Found keytool in Android Studio: $KEYTOOL"
    fi
fi

# Method 4: Check common Java locations
if [ -z "$KEYTOOL" ]; then
    for java_path in \
        "/Library/Java/JavaVirtualMachines" \
        "/System/Library/Java/JavaVirtualMachines" \
        "$HOME/Library/Java/JavaVirtualMachines"
    do
        if [ -d "$java_path" ]; then
            for jvm in "$java_path"/*; do
                if [ -f "$jvm/Contents/Home/bin/keytool" ]; then
                    KEYTOOL="$jvm/Contents/Home/bin/keytool"
                    JAVA_HOME="$jvm/Contents/Home"
                    echo "✅ Found keytool at: $KEYTOOL"
                    break 2
                fi
            done
        fi
    done
fi

# If still not found, give up
if [ -z "$KEYTOOL" ]; then
    echo "❌ ERROR: keytool not found!"
    echo ""
    echo "Please install Java JDK:"
    echo "  1. Download from: https://www.oracle.com/java/technologies/downloads/"
    echo "  2. Or use Homebrew: brew install openjdk@17"
    echo "  3. Or use Android Studio's bundled Java (see KEYSTORE_TROUBLESHOOTING.md)"
    exit 1
fi

# Get project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if keystore already exists
KEYSTORE_FILE="cardstax-release-key.jks"
if [ -f "$KEYSTORE_FILE" ]; then
    echo ""
    echo "⚠️  Keystore already exists: $KEYSTORE_FILE"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    rm -f "$KEYSTORE_FILE"
fi

echo ""
echo "Creating keystore..."
echo ""

# Prompt for passwords
echo "Enter keystore password (you'll need to enter this twice):"
read -s STORE_PASS
echo "Re-enter keystore password:"
read -s STORE_PASS_CONFIRM

if [ "$STORE_PASS" != "$STORE_PASS_CONFIRM" ]; then
    echo "❌ Passwords don't match!"
    exit 1
fi

echo ""
echo "Enter key password (can be same as keystore password, or press Enter to use same):"
read -s KEY_PASS
if [ -z "$KEY_PASS" ]; then
    KEY_PASS="$STORE_PASS"
fi

echo ""
echo "Enter your information (or press Enter for defaults):"
read -p "Name/CN [CardStax]: " NAME
NAME=${NAME:-CardStax}

read -p "Organizational Unit [Development]: " OU
OU=${OU:-Development}

read -p "Organization [CardStax]: " ORG
ORG=${ORG:-CardStax}

read -p "City [City]: " CITY
CITY=${CITY:-City}

read -p "State [State]: " STATE
STATE=${STATE:-State}

read -p "Country Code (2 letters) [US]: " COUNTRY
COUNTRY=${COUNTRY:-US}

# Create keystore
echo ""
echo "Creating keystore with the following information:"
echo "  Name: $NAME"
echo "  Organization: $ORG"
echo "  Location: $CITY, $STATE, $COUNTRY"
echo ""

"$KEYTOOL" -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -alias cardstax \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$STORE_PASS" \
    -keypass "$KEY_PASS" \
    -dname "CN=$NAME, OU=$OU, O=$ORG, L=$CITY, ST=$STATE, C=$COUNTRY"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore created successfully: $KEYSTORE_FILE"
    echo ""
    
    # Create key.properties
    KEY_PROPERTIES="android/key.properties"
    echo "Creating $KEY_PROPERTIES..."
    
    cat > "$KEY_PROPERTIES" << EOF
storeFile=../cardstax-release-key.jks
storePassword=$STORE_PASS
keyAlias=cardstax
keyPassword=$KEY_PASS
EOF
    
    echo "✅ Created $KEY_PROPERTIES"
    echo ""
    echo "⚠️  IMPORTANT:"
    echo "   - Keep your keystore password safe!"
    echo "   - Never commit key.properties or the keystore file to git"
    echo "   - Back up your keystore file securely"
    echo ""
    echo "Next steps:"
    echo "  1. Build release APK in Android Studio"
    echo "  2. Or run: npm run build:android"
else
    echo ""
    echo "❌ Failed to create keystore"
    exit 1
fi


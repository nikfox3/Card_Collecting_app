#!/bin/bash
# Simple Keystore Creation using Android Studio's Java
# This script uses Android Studio's bundled Java, so no Java installation needed

set -e

echo "🔑 CardStax Keystore Creation"
echo "============================="
echo ""

# Use Android Studio's bundled keytool
KEYTOOL="/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool"

if [ ! -f "$KEYTOOL" ]; then
    echo "❌ ERROR: Android Studio not found at default location"
    echo "Please install Android Studio or use a different method"
    exit 1
fi

echo "✅ Using Android Studio's keytool"
echo ""

# Get project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if keystore already exists
KEYSTORE_FILE="cardstax-release-key.jks"
if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  Keystore already exists: $KEYSTORE_FILE"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    rm -f "$KEYSTORE_FILE"
fi

echo "Creating keystore..."
echo ""
echo "You'll be prompted for:"
echo "  - Keystore password (enter twice)"
echo "  - Key password (can be same as keystore password)"
echo "  - Your name, organization, city, state, country"
echo ""

# Create keystore (interactive mode)
"$KEYTOOL" -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -alias cardstax \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore created successfully: $KEYSTORE_FILE"
    echo ""
    echo "⚠️  IMPORTANT: Remember your passwords!"
    echo ""
    echo "Next: Create android/key.properties file with your passwords"
    echo "See ANDROID_STUDIO_SETUP.md for instructions"
else
    echo ""
    echo "❌ Failed to create keystore"
    exit 1
fi


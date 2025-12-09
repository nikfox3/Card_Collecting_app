#!/bin/bash

echo "🌾 SETTING UP HISTORICAL PRICE HARVESTING"
echo "=========================================="

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    else
        echo "✅ Homebrew found"
    fi
    
    # Install p7zip
    echo "📦 Installing p7zip..."
    brew install p7zip
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Detected Linux"
    
    # Install p7zip for Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        echo "📦 Installing p7zip-full..."
        sudo apt-get update
        sudo apt-get install -y p7zip-full
    else
        echo "❌ Unsupported Linux distribution. Please install p7zip manually."
        exit 1
    fi
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "Please install 7zip manually:"
    echo "  Windows: Download from https://www.7-zip.org/"
    echo "  macOS: brew install p7zip"
    echo "  Ubuntu: sudo apt-get install p7zip-full"
    exit 1
fi

# Verify 7zip installation
echo "🔍 Verifying 7zip installation..."
if command -v 7z &> /dev/null; then
    echo "✅ 7zip installed successfully"
    echo "Version: $(7z | head -1)"
else
    echo "❌ 7zip installation failed"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p price_history/archives
mkdir -p price_history/extracted
mkdir -p price_history/processed

echo "✅ Directories created"

# Test the harvester
echo "🧪 Testing historical price harvester..."
node harvest_historical_prices.js status

echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
echo "💡 Next steps:"
echo "  1. Quick test: node harvest_historical_prices.js quick"
echo "  2. Last week: node harvest_historical_prices.js week"
echo "  3. Last month: node harvest_historical_prices.js month"
echo "  4. All history: node harvest_historical_prices.js all"
echo ""
echo "📊 Check status anytime: node harvest_historical_prices.js status"
echo ""
echo "⚠️  Note: Full history download may take several hours and use several GB of disk space"









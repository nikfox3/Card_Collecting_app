#!/bin/bash

echo "🎴 Pokemon Card Pricing Update Setup"
echo "===================================="
echo ""

# Check if TCGPlayer token is set
if [ -z "$TCGPLAYER_ACCESS_TOKEN" ]; then
    echo "❌ TCGPLAYER_ACCESS_TOKEN environment variable not set"
    echo ""
    echo "📋 Setup Steps:"
    echo "1. Go to https://api.tcgplayer.com/"
    echo "2. Create an account and request API access"
    echo "3. Get your access token from the dashboard"
    echo "4. Run: export TCGPLAYER_ACCESS_TOKEN=\"your_token_here\""
    echo "5. Or add it to your .env file"
    echo ""
    echo "💡 After setting the token, run this script again"
    exit 1
fi

echo "✅ TCGPlayer API token is set"
echo ""

# Test API connection
echo "🔍 Testing API connection..."
npm run pricing:test

if [ $? -eq 0 ]; then
    echo ""
    echo "🚀 Ready to update pricing data!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Run: npm run pricing:update"
    echo "2. This will update up to 1000 cards with current market prices"
    echo "3. Historical data will be generated for price charts"
    echo "4. The process may take 10-30 minutes depending on API response times"
    echo ""
    echo "⚠️  Note: This will update your database with current market prices"
    echo "   Make sure you have a backup if needed"
    echo ""
    
    read -p "🤔 Do you want to start the pricing update now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Starting pricing update..."
        npm run pricing:update
    else
        echo "👍 Run 'npm run pricing:update' when you're ready"
    fi
else
    echo ""
    echo "❌ API test failed. Please check your token and try again."
fi









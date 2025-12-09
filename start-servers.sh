#!/bin/bash

# Start both API and Vite servers for Card Collecting App

echo "🚀 Starting Card Collecting App Servers..."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Step 1: Create .env file if it doesn't exist
echo "📝 Step 1: Checking .env file..."
if [ ! -f .env ]; then
    echo 'VITE_GOOGLE_CLOUD_VISION_API_KEY=AIzaSyCAsIe8B4MotWxbVd7vDlRYa2J3HLzrEiM' > .env
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
    cat .env
fi
echo ""

# Step 2: Kill any existing servers
echo "🛑 Step 2: Stopping existing servers..."
pkill -9 -f "node.*server" 2>/dev/null
pkill -9 -f vite 2>/dev/null
sleep 2
echo "✅ Stopped existing servers"
echo ""

# Step 3: Start API server
echo "🔧 Step 3: Starting API server..."
cd server
npm run dev > ../api-server.log 2>&1 &
API_PID=$!
cd ..
sleep 3
echo "✅ API server started (PID: $API_PID)"
echo "   Logs: tail -f api-server.log"
echo ""

# Step 4: Start Vite server
echo "⚡ Step 4: Starting Vite server..."
npm run dev > vite-server.log 2>&1 &
VITE_PID=$!
sleep 5
echo "✅ Vite server started (PID: $VITE_PID)"
echo "   Logs: tail -f vite-server.log"
echo ""

# Step 5: Verify servers are running
echo "🔍 Step 5: Verifying servers..."
sleep 2

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API server is responding"
else
    echo "⚠️  API server not responding yet (may need a few more seconds)"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Vite server is responding"
else
    echo "⚠️  Vite server not responding yet (may need a few more seconds)"
fi
echo ""

# Final instructions
echo "════════════════════════════════════════════════════════"
echo "✅ Setup Complete!"
echo ""
echo "📱 Access your app:"
echo "   • Local: http://localhost:3000"
echo "   • Network: http://192.168.1.240:3000"
echo ""
echo "🔍 Check server logs:"
echo "   • API: tail -f api-server.log"
echo "   • Vite: tail -f vite-server.log"
echo ""
echo "🌐 Next steps:"
echo "   1. Open http://192.168.1.240:3000 in your browser"
echo "   2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "   3. Open browser console (F12)"
echo "   4. Try scanning a card"
echo "   5. Check console for: hasApiKey: true"
echo ""
echo "🛑 To stop servers:"
echo "   pkill -f 'node.*server' && pkill -f vite"
echo "════════════════════════════════════════════════════════"


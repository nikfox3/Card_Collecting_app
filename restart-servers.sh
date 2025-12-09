#!/bin/bash

# Kill all existing servers
echo "🛑 Stopping all servers..."
pkill -9 -f "node.*server" 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
sleep 2

# Create .env file in root (for Vite)
echo "📝 Creating .env file in root..."
echo 'VITE_GOOGLE_CLOUD_VISION_API_KEY=AIzaSyCAsIe8B4MotWxbVd7vDlRYa2J3HLzrEiM' > .env
echo "✅ Created .env file"

# Start API server in background
echo "🚀 Starting API server..."
cd server
npm run dev > ../api-server.log 2>&1 &
API_PID=$!
cd ..
sleep 3

# Start Vite server in background
echo "🚀 Starting Vite server..."
npm run dev > vite-server.log 2>&1 &
VITE_PID=$!
sleep 5

# Check if servers are running
echo ""
echo "=== Server Status ==="
if ps -p $API_PID > /dev/null; then
    echo "✅ API server running (PID: $API_PID)"
else
    echo "❌ API server failed to start"
    echo "📋 Last 20 lines of api-server.log:"
    tail -20 api-server.log
fi

if ps -p $VITE_PID > /dev/null; then
    echo "✅ Vite server running (PID: $VITE_PID)"
else
    echo "❌ Vite server failed to start"
    echo "📋 Last 20 lines of vite-server.log:"
    tail -20 vite-server.log
fi

# Test API server
echo ""
echo "=== Testing API Server ==="
sleep 2
curl -s http://localhost:3001/health 2>&1 | head -5 || echo "❌ API server not responding"

echo ""
echo "✅ Servers restarted!"
echo "📱 Access app at: http://192.168.1.240:3000"
echo "🔍 Check logs: tail -f api-server.log vite-server.log"


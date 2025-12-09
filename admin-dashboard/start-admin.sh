#!/bin/bash
echo "🚀 Starting Admin Dashboard System..."
echo ""
echo "📊 Admin Dashboard:  http://localhost:3003"
echo "🔧 Backend API:      http://localhost:3001"
echo "🔐 Password: admin123"
echo ""
echo "Starting services..."
cd server && node server.js &
sleep 2
cd ../admin-dashboard && npm run dev &
wait

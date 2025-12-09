#!/bin/bash

echo "🚀 Starting Admin Dashboard System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start the backend server
echo -e "${BLUE}Starting backend server...${NC}"
cd server
node server.js &
SERVER_PID=$!
cd ..

sleep 2

# Start the admin dashboard
echo -e "${BLUE}Starting admin dashboard...${NC}"
cd admin-dashboard
npm run dev &
ADMIN_PID=$!
cd ..

sleep 2

echo ""
echo -e "${GREEN}✅ Admin Dashboard System Started!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Admin Dashboard:  http://localhost:3003"
echo "🔧 Backend API:      http://localhost:3001"
echo ""
echo "🔐 Login with:"
echo "   Password: admin123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
wait











#!/bin/bash

# Pokémon Card Database Setup Script
# This script sets up the complete database infrastructure

echo "🚀 Setting up Pokémon Card Database Infrastructure..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Setup database
echo ""
echo "📦 Setting up database..."
cd database
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install database dependencies"
    exit 1
fi

echo "✅ Database dependencies installed"

# Run database setup
echo ""
echo "🔄 Running database setup and initial sync..."
echo "   This will download all Pokémon cards from the API (may take 10-15 minutes)..."
npm run setup

if [ $? -ne 0 ]; then
    echo "❌ Database setup failed"
    exit 1
fi

echo "✅ Database setup complete"

# Setup API server
echo ""
echo "📡 Setting up API server..."
cd ../server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install API server dependencies"
    exit 1
fi

echo "✅ API server dependencies installed"

# Go back to root
cd ..

echo ""
echo "🎉 Database infrastructure setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the API server: npm run api:start"
echo "   2. Start the frontend: npm run dev"
echo "   3. The frontend will now use the local database for search"
echo ""
echo "🔧 Available commands:"
echo "   npm run db:sync     - Re-sync database with API"
echo "   npm run db:search   - Search cards in database"
echo "   npm run api:start   - Start API server"
echo "   npm run api:dev     - Start API server in dev mode"
echo ""
echo "📊 Database location: ./database/cards.db"
echo "🌐 API server: http://localhost:3001"
echo "⚡ Frontend: http://localhost:3000"



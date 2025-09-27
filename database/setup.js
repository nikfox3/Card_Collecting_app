#!/usr/bin/env node

/**
 * Database Setup Script
 * Installs dependencies and runs initial sync
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Pokémon Card Database...\n');

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found. Please run this from the database directory.');
    process.exit(1);
}

try {
    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { 
        cwd: __dirname, 
        stdio: 'inherit' 
    });
    console.log('✅ Dependencies installed\n');

    // Check if database already exists
    const dbPath = path.join(__dirname, 'cards.db');
    if (fs.existsSync(dbPath)) {
        console.log('⚠️  Database already exists. Skipping initial sync.');
        console.log('   To re-sync, delete cards.db and run: npm run sync\n');
    } else {
        // Run initial sync
        console.log('🔄 Running initial database sync...');
        console.log('   This may take several minutes to download all cards...\n');
        
        execSync('node sync.js', { 
            cwd: __dirname, 
            stdio: 'inherit' 
        });
    }

    // Test search functionality
    console.log('\n🧪 Testing search functionality...');
    execSync('node search.js "Charizard"', { 
        cwd: __dirname, 
        stdio: 'inherit' 
    });

    console.log('\n🎉 Database setup complete!');
    console.log('\n📋 Available commands:');
    console.log('   npm run sync    - Sync database with Pokémon TCG API');
    console.log('   npm run search  - Search cards in database');
    console.log('   node search.js "query" - Search for specific cards');

} catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
}



const fs = require('fs');
const path = require('path');

console.log('🎯 Starting complete pricing data update...\n');

// Check if pricing CSV exists
const csvPath = path.join(__dirname, '..', 'pokemon-card-prices.csv');
if (!fs.existsSync(csvPath)) {
  console.error('❌ Error: pokemon-card-prices.csv not found in root directory');
  process.exit(1);
}

console.log('✅ Found pricing data file');
console.log('📊 File size:', (fs.statSync(csvPath).size / 1024 / 1024).toFixed(2), 'MB');

// Import the required modules
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runImport() {
  try {
    console.log('\n🚀 Step 1: Importing pricing data to database...');
    await execAsync('node import_pricing_data.js', { cwd: __dirname });
    console.log('✅ Database import completed');
    
    console.log('\n🔧 Step 2: Updating app pricing logic...');
    await execAsync('node update_app_pricing.js', { cwd: __dirname });
    console.log('✅ App pricing logic updated');
    
    console.log('\n🎉 Complete pricing update finished successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Test the app to see updated pricing');
    console.log('   3. Check that cards now show accurate prices');
    
  } catch (error) {
    console.error('❌ Error during update:', error.message);
    process.exit(1);
  }
}

runImport();










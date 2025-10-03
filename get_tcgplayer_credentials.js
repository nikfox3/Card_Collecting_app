// Script to help get TCGPlayer API credentials
console.log('🔐 TCGPlayer API Credentials Setup');
console.log('=====================================\n');

console.log('To get TCGPlayer API access, follow these steps:\n');

console.log('1. 🌐 Go to TCGPlayer Developer Portal:');
console.log('   https://docs.tcgplayer.com/\n');

console.log('2. 📝 Create a Developer Account:');
console.log('   - Sign up at the developer portal');
console.log('   - Verify your email address\n');

console.log('3. 🏗️ Create a New Application:');
console.log('   - Go to your developer dashboard');
console.log('   - Click "Create New Application"');
console.log('   - Select "Server-to-Server" application type');
console.log('   - Fill in application details\n');

console.log('4. 🔑 Get Your Credentials:');
console.log('   - Note down your "Client ID" (this is your API Key)');
console.log('   - Note down your "Client Secret"\n');

console.log('5. ⚙️ Set Environment Variables:');
console.log('   Create a .env file in your project root with:');
console.log('   REACT_APP_TCGPLAYER_API_KEY=your_client_id_here');
console.log('   REACT_APP_TCGPLAYER_CLIENT_SECRET=your_client_secret_here\n');

console.log('6. 🧪 Test Your Setup:');
console.log('   Run: node test_tcgplayer_auth.js\n');

console.log('📚 For detailed instructions, see: TCGPLAYER_SETUP.md\n');

console.log('⚠️  Important Notes:');
console.log('   - Keep your credentials secure and never commit them to version control');
console.log('   - TCGPlayer has rate limits (1000 requests/hour)');
console.log('   - The system will fallback to historical data if API is unavailable\n');

console.log('✅ Once configured, your app will have real-time Pokemon card pricing!');

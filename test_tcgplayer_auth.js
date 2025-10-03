import TCGPlayerApiService from './src/services/tcgplayerApiService.js';

async function testTCGPlayerAuth() {
  console.log('🔐 Testing TCGPlayer API Authentication...');
  
  // Check if credentials are set
  const hasApiKey = process.env.REACT_APP_TCGPLAYER_API_KEY && 
                   process.env.REACT_APP_TCGPLAYER_API_KEY !== 'your-api-key-here';
  const hasClientSecret = process.env.REACT_APP_TCGPLAYER_CLIENT_SECRET && 
                         process.env.REACT_APP_TCGPLAYER_CLIENT_SECRET !== 'your-client-secret-here';
  
  if (!hasApiKey || !hasClientSecret) {
    console.log('❌ TCGPlayer credentials not configured');
    console.log('📝 Please set the following environment variables:');
    console.log('   REACT_APP_TCGPLAYER_API_KEY=your_client_id');
    console.log('   REACT_APP_TCGPLAYER_CLIENT_SECRET=your_client_secret');
    console.log('\n📖 See TCGPLAYER_SETUP.md for detailed instructions');
    return;
  }
  
  console.log('✅ TCGPlayer credentials found');
  
  try {
    // Test authentication
    console.log('🔄 Testing authentication...');
    const token = await TCGPlayerApiService.getAccessToken();
    console.log('✅ Authentication successful!');
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);
    
    // Test a simple API call
    console.log('🔄 Testing product search...');
    const products = await TCGPlayerApiService.searchProducts('Charizard', 'Base Set');
    
    if (products.length > 0) {
      console.log('✅ Product search successful!');
      console.log(`📦 Found ${products.length} products`);
      console.log(`🎯 First product: ${products[0].name} (ID: ${products[0].productId})`);
      
      // Test pricing
      console.log('🔄 Testing pricing data...');
      const pricing = await TCGPlayerApiService.getPricing([products[0].productId]);
      
      if (pricing.length > 0) {
        console.log('✅ Pricing data retrieved!');
        console.log(`💰 Market Price: $${pricing[0].marketPrice || 'N/A'}`);
        console.log(`📈 Low Price: $${pricing[0].lowPrice || 'N/A'}`);
        console.log(`📉 High Price: $${pricing[0].highPrice || 'N/A'}`);
      }
    } else {
      console.log('⚠️ No products found for test search');
    }
    
    console.log('\n🎉 TCGPlayer API integration is working correctly!');
    
  } catch (error) {
    console.error('❌ TCGPlayer API test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 This usually means invalid credentials. Check your Client ID and Client Secret.');
    } else if (error.message.includes('403')) {
      console.log('💡 This usually means insufficient permissions. Check your application settings.');
    } else if (error.message.includes('429')) {
      console.log('💡 This means rate limit exceeded. Wait a moment and try again.');
    }
  }
}

// Run the test
testTCGPlayerAuth();

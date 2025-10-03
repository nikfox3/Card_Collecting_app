import TCGdexService from './src/services/tcgdexService.js';
import PriceUpdateService from './src/services/priceUpdateService.js';

async function testTCGdexIntegration() {
  console.log('🧪 Testing TCGdex API integration...');
  
  try {
    // Test TCGdex connection
    console.log('1. Testing TCGdex API connection...');
    const isConnected = await TCGdexService.testConnection();
    
    if (!isConnected) {
      console.log('❌ TCGdex API connection failed');
      return;
    }
    
    // Test single card lookup
    console.log('\n2. Testing single card lookup...');
    const cardData = await TCGdexService.getCardData('Charizard', 'Base Set');
    
    if (cardData) {
      console.log('✅ Card data retrieved successfully!');
      console.log(`   Card: ${cardData.cardName}`);
      console.log(`   Set: ${cardData.setName}`);
      console.log(`   Price: $${cardData.currentPrice}`);
      console.log(`   Source: ${cardData.priceSource}`);
      console.log(`   TCGPlayer Low: $${cardData.tcgplayer.low || 'N/A'}`);
      console.log(`   TCGPlayer Market: $${cardData.tcgplayer.market || 'N/A'}`);
      console.log(`   Cardmarket Average: $${cardData.cardmarket.averageSellPrice || 'N/A'}`);
    } else {
      console.log('❌ No card data found');
    }
    
    // Test price update service
    console.log('\n3. Testing price update service...');
    const results = await PriceUpdateService.updateAllPrices();
    
    console.log('\n📊 Update Results:');
    console.log(`Method: ${results.method}`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Failed: ${results.failed}`);
    
    // Get updated stats
    console.log('\n4. Checking database stats...');
    const response = await fetch('http://localhost:3001/api/price-history/stats');
    const stats = await response.json();
    
    if (stats) {
      console.log('📈 Current Database Stats:');
      console.log(`Total price records: ${stats.total_price_records}`);
      console.log(`Unique cards: ${stats.unique_cards}`);
      console.log(`Price range: $${stats.min_price} - $${stats.max_price}`);
      console.log(`Average price: $${stats.avg_price.toFixed(2)}`);
    }
    
    console.log('\n✅ TCGdex integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTCGdexIntegration();

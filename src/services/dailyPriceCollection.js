// Daily price collection service
class DailyPriceCollection {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.tcgplayerService = null;
  }

  // Initialize TCGPlayer service
  async initializeTCGPlayerService() {
    if (!this.tcgplayerService) {
      const { default: TCGPlayerApiService } = await import('./tcgplayerApiService.js');
      this.tcgplayerService = TCGPlayerApiService;
    }
  }

  // Run daily price collection for all cards
  async runDailyCollection() {
    console.log('🌅 Starting daily price collection...');
    
    try {
      await this.initializeTCGPlayerService();
      
      // Get all cards with prices
      const allCards = await this.getAllCardsWithPrices();
      console.log(`📊 Found ${allCards.length} cards to update`);

      // Update prices with TCGPlayer API
      const results = await this.tcgplayerService.updateMultipleCardPrices(allCards);
      
      // Store today's prices for historical tracking
      await this.storeTodaysPrices(allCards);
      
      console.log('✅ Daily price collection completed!');
      console.log(`📈 Results: ${results.updated} updated, ${results.failed} failed`);
      
      return results;
    } catch (error) {
      console.error('❌ Error in daily price collection:', error);
      throw error;
    }
  }

  // Get all cards that have current values
  async getAllCardsWithPrices() {
    try {
      const response = await fetch(`${this.baseUrl}/api/cards/with-prices`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching cards with prices:', error);
      return [];
    }
  }

  // Store today's prices for historical tracking
  async storeTodaysPrices(cards) {
    console.log('📅 Storing today\'s prices for historical tracking...');
    
    const today = new Date().toISOString().split('T')[0];
    let stored = 0;
    let errors = 0;

    for (const card of cards) {
      try {
        await this.tcgplayerService.storeTodaysPrice(card.id, card.current_value);
        stored++;
      } catch (error) {
        console.error(`Error storing today's price for ${card.name}:`, error);
        errors++;
      }
    }

    console.log(`✅ Stored today's prices: ${stored} successful, ${errors} errors`);
  }

  // Run collection for a specific subset of cards (for testing)
  async runCollectionForSubset(limit = 100) {
    console.log(`🧪 Running price collection for ${limit} cards (testing mode)...`);
    
    try {
      await this.initializeTCGPlayerService();
      
      // Get a subset of cards
      const allCards = await this.getAllCardsWithPrices();
      const subset = allCards.slice(0, limit);
      
      console.log(`📊 Testing with ${subset.length} cards`);

      // Update prices with TCGPlayer API
      const results = await this.tcgplayerService.updateMultipleCardPrices(subset);
      
      console.log('✅ Test collection completed!');
      console.log(`📈 Results: ${results.updated} updated, ${results.failed} failed`);
      
      return results;
    } catch (error) {
      console.error('❌ Error in test collection:', error);
      throw error;
    }
  }

  // Get collection statistics
  async getCollectionStats() {
    try {
      const response = await fetch(`${this.baseUrl}/api/price-history/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching collection stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new DailyPriceCollection();

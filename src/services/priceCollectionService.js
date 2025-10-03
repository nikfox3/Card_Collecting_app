// Service for collecting and storing daily pricing data
class PriceCollectionService {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.collectionInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.isCollecting = false;
  }

  // Start daily price collection
  async startDailyCollection() {
    if (this.isCollecting) {
      console.log('Price collection already running');
      return;
    }

    this.isCollecting = true;
    console.log('Starting daily price collection...');

    try {
      // Get all cards with current values
      const cards = await this.getAllCardsWithPrices();
      console.log(`Found ${cards.length} cards to collect prices for`);

      let collected = 0;
      let errors = 0;

      for (const card of cards) {
        try {
          await this.collectCardPrice(card);
          collected++;
          
          // Add delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error collecting price for ${card.name}:`, error);
          errors++;
        }
      }

      console.log(`Price collection completed: ${collected} successful, ${errors} errors`);
    } catch (error) {
      console.error('Error in daily price collection:', error);
    } finally {
      this.isCollecting = false;
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

  // Collect price for a specific card
  async collectCardPrice(card) {
    try {
      // For now, we'll use the card's current_value as the "market price"
      // In a real implementation, this would call TCGPlayer API
      const marketPrice = card.current_value || 0;
      
      if (marketPrice <= 0) {
        console.log(`Skipping ${card.name} - no current value`);
        return;
      }

      // Add some realistic daily variation (±5%)
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const dailyPrice = Math.max(0.01, marketPrice * (1 + variation));

      // Store the price data
      await this.storePriceData(card.id, dailyPrice);
      
      console.log(`Collected price for ${card.name}: $${dailyPrice.toFixed(2)}`);
    } catch (error) {
      console.error(`Error collecting price for ${card.name}:`, error);
      throw error;
    }
  }

  // Store price data in the database
  async storePriceData(cardId, price) {
    try {
      const response = await fetch(`${this.baseUrl}/api/price-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: cardId,
          price: price,
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error storing price data:', error);
      throw error;
    }
  }

  // Get historical data for a card
  async getHistoricalData(cardId, startDate, endDate) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/price-history?cardId=${cardId}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return null;
    }
  }

  // Initialize price collection for existing cards
  async initializeHistoricalData() {
    console.log('Initializing historical data for existing cards...');
    
    try {
      const cards = await this.getAllCardsWithPrices();
      const today = new Date();
      
      // Generate 30 days of historical data for each card
      for (const card of cards.slice(0, 10)) { // Limit to first 10 cards for testing
        const basePrice = card.current_value || 0;
        if (basePrice <= 0) continue;

        console.log(`Generating historical data for ${card.name} ($${basePrice})`);
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          // Generate realistic price variation
          const trend = (Math.random() - 0.4) * 0.02; // Slight upward trend
          const variation = (Math.random() - 0.5) * 0.1; // ±5% daily variation
          const price = Math.max(0.01, basePrice * (1 + trend * (30 - i) + variation));
          
          await this.storePriceData(card.id, price);
        }
      }
      
      console.log('Historical data initialization completed');
    } catch (error) {
      console.error('Error initializing historical data:', error);
    }
  }
}

// Export singleton instance
export default new PriceCollectionService();

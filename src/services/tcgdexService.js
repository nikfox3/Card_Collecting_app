// TCGdex API service for real current market prices
class TCGdexService {
  constructor() {
    this.baseUrl = 'https://api.tcgdex.net/v2';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes cache
  }

  // Get card data with pricing from TCGdex
  async getCardData(cardName, setName = null) {
    try {
      // First, search for the card
      const searchResults = await this.searchCard(cardName, setName);
      
      if (!searchResults || searchResults.length === 0) {
        console.log(`No TCGdex results found for ${cardName} ${setName ? `from ${setName}` : ''}`);
        return null;
      }

      // Get the most relevant card (first result)
      const card = searchResults[0];
      
      // Get detailed card data including pricing
      const cardData = await this.getCardDetails(card.id);
      
      if (!cardData) {
        console.log(`No detailed data found for ${cardName}`);
        return null;
      }

      return this.extractPricingData(cardData, cardName);
    } catch (error) {
      console.error(`Error getting TCGdex data for ${cardName}:`, error);
      return null;
    }
  }

  // Search for cards by name and set
  async searchCard(cardName, setName = null) {
    try {
      const cacheKey = `search_${cardName}_${setName || 'any'}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      // Search in English cards
      const response = await fetch(`${this.baseUrl}/en/cards`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allCards = await response.json();
      
      // Filter cards by name and set
      let filteredCards = allCards.filter(card => 
        card.name && card.name.toLowerCase().includes(cardName.toLowerCase())
      );

      // If setName is provided, filter by set as well
      if (setName) {
        filteredCards = filteredCards.filter(card => 
          card.set && card.set.name && 
          card.set.name.toLowerCase().includes(setName.toLowerCase())
        );
      }

      // Cache the results
      this.cache.set(cacheKey, {
        data: filteredCards,
        timestamp: Date.now()
      });

      return filteredCards;
    } catch (error) {
      console.error('Error searching TCGdex cards:', error);
      return [];
    }
  }

  // Get detailed card data including pricing
  async getCardDetails(cardId) {
    try {
      const cacheKey = `card_${cardId}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const response = await fetch(`${this.baseUrl}/en/cards/${cardId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const cardData = await response.json();
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: cardData,
        timestamp: Date.now()
      });

      return cardData;
    } catch (error) {
      console.error(`Error getting TCGdex card details for ${cardId}:`, error);
      return null;
    }
  }

  // Extract pricing data from TCGdex response
  extractPricingData(cardData, cardName) {
    try {
      const pricing = cardData.pricing || {};
      
      // TCGdex provides pricing from multiple sources
      const tcgplayer = pricing.tcgplayer || {};
      const cardmarket = pricing.cardmarket || {};
      
      // Calculate current price (prefer market price, fallback to average)
      let currentPrice = null;
      let priceSource = 'unknown';
      
      if (tcgplayer.market) {
        currentPrice = tcgplayer.market;
        priceSource = 'tcgplayer';
      } else if (cardmarket.averageSellPrice) {
        currentPrice = cardmarket.averageSellPrice;
        priceSource = 'cardmarket';
      } else if (tcgplayer.low) {
        currentPrice = tcgplayer.low;
        priceSource = 'tcgplayer_low';
      } else if (cardmarket.lowPrice) {
        currentPrice = cardmarket.lowPrice;
        priceSource = 'cardmarket_low';
      }

      if (!currentPrice) {
        console.log(`No pricing data available for ${cardName}`);
        return null;
      }

      return {
        cardId: cardData.id,
        cardName: cardData.name,
        setName: cardData.set?.name || 'Unknown Set',
        currentPrice: currentPrice,
        priceSource: priceSource,
        tcgplayer: {
          low: tcgplayer.low || null,
          mid: tcgplayer.mid || null,
          high: tcgplayer.high || null,
          market: tcgplayer.market || null,
          directLow: tcgplayer.directLow || null
        },
        cardmarket: {
          lowPrice: cardmarket.lowPrice || null,
          trendPrice: cardmarket.trendPrice || null,
          averageSellPrice: cardmarket.averageSellPrice || null,
          averageSellPrice: cardmarket.averageSellPrice || null,
          suggestedPrice: cardmarket.suggestedPrice || null
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error extracting pricing data for ${cardName}:`, error);
      return null;
    }
  }

  // Update prices for multiple cards
  async updateMultipleCardPrices(cards) {
    console.log(`🔄 Updating prices for ${cards.length} cards via TCGdex API...`);
    
    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    // Process cards in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cards.length / batchSize)} (${batch.length} cards)`);
      
      for (const card of batch) {
        try {
          const priceData = await this.getCardData(card.name, card.set_name);
          
          if (priceData && priceData.currentPrice) {
            // Update the card's current value
            await this.updateCardPrice(card.id, priceData.currentPrice);
            results.updated++;
            console.log(`✅ Updated ${card.name}: $${card.current_value} → $${priceData.currentPrice} (${priceData.priceSource})`);
          } else {
            results.failed++;
            console.log(`❌ No price data for ${card.name}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`${card.name}: ${error.message}`);
          console.error(`Error updating ${card.name}:`, error);
        }
      }

      // Delay between batches to be respectful to the API
      if (i + batchSize < cards.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ TCGdex update completed: ${results.updated} updated, ${results.failed} failed`);
    return results;
  }

  // Update card price in database
  async updateCardPrice(cardId, newPrice) {
    try {
      const response = await fetch('http://localhost:3001/api/cards/update-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: cardId,
          currentValue: newPrice
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating card price:', error);
      throw error;
    }
  }

  // Store today's prices for historical tracking
  async storeTodaysPrice(cardId, price) {
    try {
      const response = await fetch('http://localhost:3001/api/price-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: cardId,
          price: price,
          date: new Date().toISOString().split('T')[0],
          volume: 1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error storing today\'s price:', error);
      throw error;
    }
  }

  // Test TCGdex API connection
  async testConnection() {
    try {
      console.log('🧪 Testing TCGdex API connection...');
      
      // Try multiple possible endpoints
      const endpoints = [
        'https://api.tcgdx.net/v2/en/cards',
        'https://api.tcgdx.net/v2/en/cards',
        'https://api.tcgdx.net/v2/en/cards'
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying ${endpoint}...`);
          const response = await fetch(endpoint);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ TCGdex API connected! Found ${data.length} cards available`);
            this.baseUrl = endpoint.replace('/en/cards', '');
            return true;
          }
        } catch (err) {
          console.log(`❌ Failed: ${endpoint}`);
          continue;
        }
      }
      
      throw new Error('All TCGdex endpoints failed');
    } catch (error) {
      console.error('❌ TCGdex API connection failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export default new TCGdexService();

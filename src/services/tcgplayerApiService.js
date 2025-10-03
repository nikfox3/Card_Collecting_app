// TCGPlayer API service for real current market prices
class TCGPlayerApiService {
  constructor() {
    this.baseUrl = 'https://api.tcgplayer.com';
    this.apiKey = process.env.REACT_APP_TCGPLAYER_API_KEY || 'your-api-key-here';
    this.clientSecret = process.env.REACT_APP_TCGPLAYER_CLIENT_SECRET || 'your-client-secret-here';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get access token for TCGPlayer API using Client Credentials flow
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // TCGPlayer uses OAuth 2.0 Client Credentials flow
      const response = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.clientSecret}`
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TCGPlayer API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      
      console.log('✅ TCGPlayer access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting TCGPlayer access token:', error);
      throw error;
    }
  }

  // Search for products by name
  async searchProducts(cardName, setName = null) {
    try {
      const token = await this.getAccessToken();
      
      let searchQuery = `name:"${cardName}"`;
      if (setName) {
        searchQuery += ` set.name:"${setName}"`;
      }

      const response = await fetch(`${this.baseUrl}/catalog/products?q=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching TCGPlayer products:', error);
      return [];
    }
  }

  // Get pricing for specific product IDs
  async getPricing(productIds) {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/pricing/product/${productIds.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error getting TCGPlayer pricing:', error);
      return [];
    }
  }

  // Get current market price for a specific card
  async getCurrentPrice(cardName, setName = null) {
    try {
      // Search for the product
      const products = await this.searchProducts(cardName, setName);
      
      if (products.length === 0) {
        console.log(`No TCGPlayer products found for ${cardName} ${setName ? `from ${setName}` : ''}`);
        return null;
      }

      // Get the first product (most relevant)
      const product = products[0];
      
      // Get pricing for this product
      const pricing = await this.getPricing([product.productId]);
      
      if (pricing.length === 0) {
        console.log(`No pricing data found for ${cardName}`);
        return null;
      }

      const priceData = pricing[0];
      
      // Extract market price (prefer market price over low/high)
      let currentPrice = null;
      if (priceData.marketPrice) {
        currentPrice = priceData.marketPrice;
      } else if (priceData.lowPrice && priceData.highPrice) {
        currentPrice = (priceData.lowPrice + priceData.highPrice) / 2;
      } else if (priceData.lowPrice) {
        currentPrice = priceData.lowPrice;
      }

      return {
        productId: product.productId,
        currentPrice: currentPrice,
        lowPrice: priceData.lowPrice,
        highPrice: priceData.highPrice,
        marketPrice: priceData.marketPrice,
        directLowPrice: priceData.directLowPrice,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting current price for ${cardName}:`, error);
      return null;
    }
  }

  // Batch update prices for multiple cards
  async updateMultipleCardPrices(cards) {
    console.log(`🔄 Updating prices for ${cards.length} cards via TCGPlayer API...`);
    
    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    // Process cards in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cards.length / batchSize)} (${batch.length} cards)`);
      
      for (const card of batch) {
        try {
          const priceData = await this.getCurrentPrice(card.name, card.set_name);
          
          if (priceData && priceData.currentPrice) {
            // Update the card's current value
            await this.updateCardPrice(card.id, priceData.currentPrice);
            results.updated++;
            console.log(`✅ Updated ${card.name}: $${priceData.currentPrice}`);
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

      // Delay between batches to respect rate limits
      if (i + batchSize < cards.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Price update completed: ${results.updated} updated, ${results.failed} failed`);
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

  // Store today's price in historical data
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
}

// Export singleton instance
export default new TCGPlayerApiService();
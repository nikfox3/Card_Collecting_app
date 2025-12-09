// Pokemon Price Tracker API Service
// Paid tier: $9.99/month
// Features: RAW & PSA prices, 6+ months history, 20k credits/day

class PokemonPriceTrackerService {
  constructor() {
    this.apiKey = process.env.POKEMON_PRICE_TRACKER_API_KEY || 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56';
    this.baseUrl = 'https://www.pokemonpricetracker.com/api/v2';
    this.rateLimit = 20000; // per day
    this.requestCount = 0;
    this.lastReset = new Date();
  }

  // Check rate limit
  checkRateLimit() {
    const now = new Date();
    if (now.getDate() !== this.lastReset.getDate()) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    return this.requestCount < this.rateLimit;
  }

  // Make API request
  async request(endpoint, options = {}) {
    if (!this.checkRateLimit()) {
      throw new Error('API rate limit exceeded');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      this.requestCount++;
      return await response.json();
    } catch (error) {
      console.error('Pokemon Price Tracker API error:', error);
      throw error;
    }
  }

  /**
   * Get card pricing data (includes multiple conditions and grades)
   * @param {string} tcgPlayerId - TCGPlayer product ID
   * @param {Object} options - Fetch options (includeHistory, includeEbay, includeBoth)
   * @returns {Promise<Object>} Price data
   */
  async getCardPrice(tcgPlayerId, options = {}) {
    try {
      const params = new URLSearchParams({
        tcgPlayerId: tcgPlayerId,
        ...options
      });
      
      const data = await this.request(`/cards?${params}`);
      
      if (data && data.data && data.data.length > 0) {
        const card = data.data[0];
        return {
          tcgPlayerId: card.tcgPlayerId,
          name: card.name,
          set: card.set,
          price: card.price,
          marketPrice: card.marketPrice,
          lowPrice: card.lowPrice,
          highPrice: card.highPrice,
          conditions: card.conditions || {},
          psaGrades: card.psaGrades || {},
          history: card.history || [],
          source: 'pokemonpricetracker',
          timestamp: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting card price for ${tcgPlayerId}:`, error);
      return null;
    }
  }

  /**
   * Get RAW card price (Near Mint)
   * @param {string} cardId - TCGPlayer card ID
   * @returns {Promise<Object>} Price data
   */
  async getRawPrice(cardId) {
    try {
      const data = await this.getCardPrice(cardId);
      if (data && data.price) {
        return {
          low: data.lowPrice || data.price,
          mid: data.price,
          high: data.highPrice || data.price,
          market: data.marketPrice || data.price,
          source: 'pokemonpricetracker-raw',
          timestamp: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error(`Error getting RAW price for ${cardId}:`, error);
      return null;
    }
  }

  /**
   * Get PSA graded card prices
   * @param {string} cardId - TCGPlayer card ID
   * @param {string} grade - PSA grade (10, 9, 8, etc.) or 'all'
   * @returns {Promise<Object>} PSA price data
   */
  async getPSAPrices(cardId, grade = 'all') {
    try {
      const cardData = await this.getCardPrice(cardId, { includeBoth: true });
      
      if (cardData && cardData.psaGrades) {
        const psaGrades = cardData.psaGrades;
        
        if (grade === 'all') {
          // Return all grades
          return Object.keys(psaGrades).reduce((acc, gradeKey) => {
            acc[gradeKey] = {
              price: psaGrades[gradeKey].price || 0,
              lowPrice: psaGrades[gradeKey].lowPrice || 0,
              highPrice: psaGrades[gradeKey].highPrice || 0,
              marketPrice: psaGrades[gradeKey].marketPrice || 0,
              population: psaGrades[gradeKey].population || 0,
              source: `pokemonpricetracker-psa-${gradeKey}`,
              timestamp: new Date().toISOString()
            };
            return acc;
          }, {});
        } else {
          // Return single grade
          const gradeData = psaGrades[grade];
          if (gradeData) {
            return {
              price: gradeData.price || 0,
              lowPrice: gradeData.lowPrice || 0,
              highPrice: gradeData.highPrice || 0,
              marketPrice: gradeData.marketPrice || 0,
              population: gradeData.population || 0,
              source: `pokemonpricetracker-psa-${grade}`,
              timestamp: new Date().toISOString()
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting PSA price for ${cardId} grade ${grade}:`, error);
      return null;
    }
  }

  /**
   * Get price history for a card
   * @param {string} cardId - TCGPlayer card ID
   * @param {string} type - 'raw' or 'psa' or 'both'
   * @param {string} timeRange - '6m', '1y', 'all'
   * @returns {Promise<Array>} Historical price data
   */
  async getPriceHistory(cardId, type = 'both', timeRange = '6m') {
    try {
      const endpoint = `/history/${cardId}?type=${type}&range=${timeRange}`;
      const data = await this.request(endpoint);
      
      return data.map(item => ({
        date: item.date,
        raw: item.raw || null,
        psa10: item.psa10 || null,
        psa9: item.psa9 || null,
        psa8: item.psa8 || null,
        source: 'pokemonpricetracker',
        timestamp: item.timestamp || new Date().toISOString()
      }));
    } catch (error) {
      console.error(`Error getting price history for ${cardId}:`, error);
      return [];
    }
  }

  /**
   * Get comprehensive pricing for a card
   * Combines RAW + PSA 10 prices + conditions
   * @param {string} cardId - TCGPlayer card ID
   * @returns {Promise<Object>} Complete pricing data
   */
  async getComprehensivePricing(cardId) {
    try {
      const cardData = await this.getCardPrice(cardId, { 
        includeBoth: true,
        includeHistory: true 
      });

      if (cardData) {
        return {
          cardId,
          name: cardData.name,
          set: cardData.set,
          raw: {
            price: cardData.price,
            marketPrice: cardData.marketPrice,
            lowPrice: cardData.lowPrice,
            highPrice: cardData.highPrice,
            condition: 'Near Mint'
          },
          conditions: cardData.conditions || {},
          psa: cardData.psaGrades || {},
          history: cardData.history || [],
          timestamp: cardData.timestamp
        };
      }

      return {
        raw: null,
        psa: {},
        conditions: {},
        cardId,
        error: 'No data found'
      };
    } catch (error) {
      console.error(`Error getting comprehensive pricing for ${cardId}:`, error);
      return {
        raw: null,
        psa: {},
        conditions: {},
        cardId,
        error: error.message
      };
    }
  }

  /**
   * Search for card by name and set
   * @param {string} cardName - Card name
   * @param {string} setName - Set name
   * @returns {Promise<Object>} Card info with pricing
   */
  async searchCard(cardName, setName) {
    try {
      const data = await this.request(`/search?name=${encodeURIComponent(cardName)}&set=${encodeURIComponent(setName)}`);
      return data;
    } catch (error) {
      console.error(`Error searching for ${cardName} ${setName}:`, error);
      return null;
    }
  }

  /**
   * Get trending cards
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Trending cards
   */
  async getTrendingCards(limit = 50) {
    try {
      const data = await this.request(`/trending?limit=${limit}`);
      return data;
    } catch (error) {
      console.error('Error getting trending cards:', error);
      return [];
    }
  }

  /**
   * Get PSA population data for a card
   * @param {string} cardId - TCGPlayer card ID
   * @returns {Promise<Object>} Population by grade
   */
  async getPSAPopulation(cardId) {
    try {
      const data = await this.request(`/psa/population/${cardId}`);
      return data;
    } catch (error) {
      console.error(`Error getting PSA population for ${cardId}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export default new PokemonPriceTrackerService();


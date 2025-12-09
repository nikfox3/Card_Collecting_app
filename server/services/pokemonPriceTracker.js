const https = require('https');

class PokemonPriceTrackerService {
  constructor() {
    this.apiKey = 'pokeprice_free_f9ed9dfd54a54ae367c22d6072c114be931253ff51bfeb7d';
    this.baseUrl = 'https://www.pokemonpricetracker.com/api/v2';
    this.rateLimit = {
      daily: 100,
      used: 0,
      resetTime: null
    };
    this.requestQueue = [];
    this.isProcessing = false;
  }

  /**
   * Make authenticated request to Pokemon Price Tracker API
   */
  async makeRequest(endpoint, params = {}) {
    return new Promise((resolve, reject) => {
      // Check rate limit
      if (this.rateLimit.used >= this.rateLimit.daily) {
        const resetTime = new Date(this.rateLimit.resetTime);
        const now = new Date();
        if (now < resetTime) {
          const waitTime = resetTime - now;
          console.log(`⏳ Rate limit reached. Waiting ${Math.ceil(waitTime / 1000 / 60)} minutes until reset...`);
          setTimeout(() => {
            this.rateLimit.used = 0;
            this.rateLimit.resetTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            this.makeRequest(endpoint, params).then(resolve).catch(reject);
          }, waitTime);
          return;
        } else {
          // Reset daily limit
          this.rateLimit.used = 0;
          this.rateLimit.resetTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
      }

      const queryString = new URLSearchParams(params).toString();
      const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

      console.log(`🔍 Fetching: ${url}`);

      const options = {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Card-Collecting-App/1.0'
        }
      };

      https.get(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            
            // Update rate limit from response headers
            if (res.headers['x-api-calls-consumed']) {
              this.rateLimit.used = parseInt(res.headers['x-api-calls-consumed']);
            }
            if (res.headers['x-ratelimit-daily-remaining']) {
              this.rateLimit.used = this.rateLimit.daily - parseInt(res.headers['x-ratelimit-daily-remaining']);
            }

            console.log(`✅ API Response: ${res.statusCode}, Credits used: ${this.rateLimit.used}/${this.rateLimit.daily}`);
            
            if (res.statusCode === 200) {
              resolve(jsonData);
            } else {
              reject(new Error(`API Error ${res.statusCode}: ${jsonData.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });
    });
  }

  /**
   * Get condition prices for a specific card by TCGPlayer ID
   */
  async getConditionPrices(tcgPlayerId) {
    try {
      const response = await this.makeRequest('/cards', {
        tcgPlayerId: tcgPlayerId,
        includeHistory: false,
        includeEbay: false
      });

      if (!response.data || !response.data.prices) {
        return null;
      }

      const prices = response.data.prices;
      const conditions = prices.conditions || {};

      return {
        nm_price: conditions['Near Mint']?.price || null,
        lp_price: conditions['Lightly Played']?.price || null,
        mp_price: conditions['Moderately Played']?.price || null,
        hp_price: conditions['Heavily Played']?.price || null,
        dmg_price: conditions['Damaged']?.price || null,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error fetching condition prices for TCGPlayer ID ${tcgPlayerId}:`, error.message);
      return null;
    }
  }

  /**
   * Get graded prices for a specific card by TCGPlayer ID
   */
  async getGradedPrices(tcgPlayerId) {
    try {
      const response = await this.makeRequest('/cards', {
        tcgPlayerId: tcgPlayerId,
        includeHistory: false,
        includeEbay: true
      });

      if (!response.data || !response.data.ebay) {
        return null;
      }

      const ebay = response.data.ebay;
      const salesByGrade = ebay.salesByGrade || {};
      const gradedPrices = [];

      // Extract PSA grades
      Object.keys(salesByGrade).forEach(grade => {
        if (grade.startsWith('psa')) {
          const gradeData = salesByGrade[grade];
          const gradeNumber = grade.replace('psa', '');
          
          gradedPrices.push({
            grading_service: 'PSA',
            grade: gradeNumber,
            price: gradeData.smartMarketPrice?.price || gradeData.averagePrice || null,
            market_trend: gradeData.marketTrend || null,
            sales_velocity: gradeData.dailyVolume7Day || null
          });
        }
      });

      return gradedPrices;
    } catch (error) {
      console.error(`❌ Error fetching graded prices for TCGPlayer ID ${tcgPlayerId}:`, error.message);
      return null;
    }
  }

  /**
   * Get both condition and graded prices in one call (3 credits)
   */
  async getFullPricingData(tcgPlayerId) {
    try {
      const response = await this.makeRequest('/cards', {
        tcgPlayerId: tcgPlayerId,
        includeHistory: false,
        includeEbay: true
      });

      if (!response.data) {
        return null;
      }

      const prices = response.data.prices;
      const conditions = prices?.conditions || {};
      const ebay = response.data.ebay;
      const salesByGrade = ebay?.salesByGrade || {};

      const conditionPrices = {
        nm_price: conditions['Near Mint']?.price || null,
        lp_price: conditions['Lightly Played']?.price || null,
        mp_price: conditions['Moderately Played']?.price || null,
        hp_price: conditions['Heavily Played']?.price || null,
        dmg_price: conditions['Damaged']?.price || null,
        last_updated: new Date().toISOString()
      };

      const gradedPrices = [];
      Object.keys(salesByGrade).forEach(grade => {
        if (grade.startsWith('psa')) {
          const gradeData = salesByGrade[grade];
          const gradeNumber = grade.replace('psa', '');
          
          gradedPrices.push({
            grading_service: 'PSA',
            grade: gradeNumber,
            price: gradeData.smartMarketPrice?.price || gradeData.averagePrice || null,
            market_trend: gradeData.marketTrend || null,
            sales_velocity: gradeData.dailyVolume7Day || null
          });
        }
      });

      return {
        conditionPrices,
        gradedPrices
      };
    } catch (error) {
      console.error(`❌ Error fetching full pricing data for TCGPlayer ID ${tcgPlayerId}:`, error.message);
      return null;
    }
  }

  /**
   * Search for cards by name
   */
  async searchCards(searchTerm, limit = 10) {
    try {
      const response = await this.makeRequest('/cards', {
        search: searchTerm,
        limit: limit
      });

      return response.data || [];
    } catch (error) {
      console.error(`❌ Error searching cards:`, error.message);
      return [];
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    return {
      used: this.rateLimit.used,
      remaining: this.rateLimit.daily - this.rateLimit.used,
      resetTime: this.rateLimit.resetTime
    };
  }

  /**
   * Reset rate limit (for testing)
   */
  resetRateLimit() {
    this.rateLimit.used = 0;
    this.rateLimit.resetTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    console.log('🔄 Rate limit reset');
  }
}

module.exports = PokemonPriceTrackerService;







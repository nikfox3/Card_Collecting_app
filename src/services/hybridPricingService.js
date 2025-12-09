// Hybrid Pricing Service
// Combines TCGCSV daily archives with Pokemon Price Tracker API

import pokemonPriceTrackerService from './pokemonPriceTrackerService.js';
import tcgplayerService from './tcgplayerService.js';

class HybridPricingService {
  constructor() {
    this.tcgcsv = tcgplayerService;
    this.pokemonAPI = pokemonPriceTrackerService;
  }

  /**
   * Get comprehensive price history for a card
   * Combines TCGCSV bulk data with API enrichment
   * 
   * @param {Object} card - Card object with product_id
   * @param {string} timeRange - Time range for history
   * @param {Object} options - Options for pricing types
   * @returns {Promise<Object>} Chart-ready data
   */
  async getCardPriceHistory(card, timeRange = '6M', options = {}) {
    const {
      includeRaw = true,
      includePSA10 = true,
      includePSA9 = false
    } = options;

    const productId = card.product_id || card.id || card.cardId;

    try {
      // 1. Get base TCGCSV data (daily archives)
      const tcgcsvData = await this.getTCGCSVPriceHistory(productId, timeRange);

      // 2. Enrich with API data if available
      const apiData = includeRaw || includePSA10 || includePSA9
        ? await this.getAPIEnhancedPriceHistory(productId, timeRange, options)
        : null;

      // 3. Merge and format for charts
      const mergedData = this.mergePriceData(tcgcsvData, apiData, options);

      return mergedData;
    } catch (error) {
      console.error('Error getting hybrid price history:', error);
      return {
        labels: [],
        datasets: [],
        rawChange: { absolute: 0, percentage: 0 },
        psa10Change: { absolute: 0, percentage: 0 }
      };
    }
  }

  /**
   * Get TCGCSV price history from database
   */
  async getTCGCSVPriceHistory(productId, timeRange) {
    try {
      const url = `${API_URL}/api/cards/price-history/${productId}?timeRange=${timeRange}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        return data.data.map(record => ({
          date: record.date,
          price: record.mid_price || record.market_price || record.price,
          low: record.low_price || record.price,
          high: record.high_price || record.price,
          source: 'tcgcsv',
          type: 'raw'
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting TCGCSV data:', error);
      return [];
    }
  }

  /**
   * Get enhanced price data from Pokemon Price Tracker API
   */
  async getAPIEnhancedPriceHistory(productId, timeRange, options) {
    try {
      const history = await this.pokemonAPI.getPriceHistory(
        productId,
        'both',
        this.mapTimeRange(timeRange)
      );

      return history.map(record => ({
        date: record.date,
        rawPrice: record.raw?.market || record.raw?.mid || null,
        psa10Price: record.psa10?.market || record.psa10?.mid || null,
        psa9Price: record.psa9?.market || record.psa9?.mid || null,
        source: 'pokemonpricetracker',
        timestamp: record.timestamp
      }));
    } catch (error) {
      console.error('Error getting API enhanced data:', error);
      return null;
    }
  }

  /**
   * Merge TCGCSV and API data into chart format
   */
  mergePriceData(tcgcsvData, apiData, options) {
    // Start with TCGCSV as base
    const datasets = [];
    const labels = [...new Set([
      ...tcgcsvData.map(d => d.date),
      ...(apiData || []).map(d => d.date)
    ])].sort();

    // RAW prices dataset
    if (options.includeRaw) {
      datasets.push({
        label: 'Raw Market',
        data: this.combinePrices(labels, tcgcsvData, apiData, 'rawPrice', 'price'),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      });
    }

    // PSA 10 prices dataset
    if (options.includePSA10) {
      datasets.push({
        label: 'PSA 10',
        data: this.combinePrices(labels, [], apiData, 'psa10Price', null),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.4
      });
    }

    // PSA 9 prices dataset
    if (options.includePSA9) {
      datasets.push({
        label: 'PSA 9',
        data: this.combinePrices(labels, [], apiData, 'psa9Price', null),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4
      });
    }

    // Calculate price changes
    const rawChange = this.calculatePriceChange(tcgcsvData);
    const psa10Change = apiData 
      ? this.calculatePriceChangeFromAPI(apiData, 'psa10Price')
      : { absolute: 0, percentage: 0 };

    return {
      labels,
      datasets,
      rawChange,
      psa10Change
    };
  }

  /**
   * Combine prices from multiple sources for a label
   */
  combinePrices(labels, tcgcsvData, apiData, apiField, tcgcsvField) {
    return labels.map(label => {
      // Try API data first (if available)
      if (apiData) {
        const apiRecord = apiData.find(d => d.date === label);
        if (apiRecord && apiRecord[apiField]) {
          return apiRecord[apiField];
        }
      }

      // Fallback to TCGCSV data
      if (tcgcsvField) {
        const tcgcsvRecord = tcgcsvData.find(d => d.date === label);
        if (tcgcsvRecord && tcgcsvRecord[tcgcsvField]) {
          return tcgcsvRecord[tcgcsvField];
        }
      }

      return null;
    });
  }

  /**
   * Calculate price change from TCGCSV data
   */
  calculatePriceChange(data) {
    if (!data || data.length < 2) {
      return { absolute: 0, percentage: 0 };
    }

    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = sorted[0].price;
    const last = sorted[sorted.length - 1].price;

    const absolute = last - first;
    const percentage = first > 0 ? (absolute / first) * 100 : 0;

    return { absolute, percentage };
  }

  /**
   * Calculate price change from API data
   */
  calculatePriceChangeFromAPI(data, field) {
    if (!data || data.length < 2) {
      return { absolute: 0, percentage: 0 };
    }

    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const prices = sorted.map(d => d[field]).filter(p => p != null);

    if (prices.length < 2) {
      return { absolute: 0, percentage: 0 };
    }

    const first = prices[0];
    const last = prices[prices.length - 1];

    const absolute = last - first;
    const percentage = first > 0 ? (absolute / first) * 100 : 0;

    return { absolute, percentage };
  }

  /**
   * Map frontend time range to API time range
   */
  mapTimeRange(timeRange) {
    const mapping = {
      '7D': '7d',
      '1M': '1m',
      '3M': '3m',
      '6M': '6m',
      '1Y': '1y',
      'All': 'all'
    };
    return mapping[timeRange] || '6m';
  }

  /**
   * Get current pricing for a card (RAW + PSA)
   */
  async getCurrentPricing(productId) {
    try {
      const comprehensive = await this.pokemonAPI.getComprehensivePricing(productId);
      
      return {
        raw: comprehensive.raw,
        psa10: comprehensive.psa?.PSA10 || null,
        psa9: comprehensive.psa?.PSA9 || null,
        timestamp: comprehensive.timestamp
      };
    } catch (error) {
      console.error('Error getting current pricing:', error);
      return { raw: null, psa10: null, psa9: null };
    }
  }
}

// Export singleton instance
export default new HybridPricingService();




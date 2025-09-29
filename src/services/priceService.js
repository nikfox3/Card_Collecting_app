// Price Service - Handles real-time and historical price data
const API_BASE_URL = 'http://localhost:3001/api';

class PriceService {
  // Get current price data for a card
  async getCurrentPrice(cardId) {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/${cardId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching current price:', error);
      return null;
    }
  }

  // Generate realistic historical price data based on TCGPlayer data
  generateHistoricalData(card, timeRange, dataPoints) {
    if (!card) {
      return this.generateFallbackData(timeRange, dataPoints);
    }

    console.log('PriceService - Card data:', {
      name: card.name,
      tcgplayerType: typeof card.tcgplayer,
      tcgplayer: card.tcgplayer
    });

    let tcgplayerPrices = null;
    
    try {
      // Handle both string and object tcgplayer data
      if (card.tcgplayer) {
        tcgplayerPrices = typeof card.tcgplayer === 'string' 
          ? JSON.parse(card.tcgplayer) 
          : card.tcgplayer;
      }
    } catch (error) {
      console.warn('Error parsing TCGPlayer data:', error);
      tcgplayerPrices = null;
    }

    if (!tcgplayerPrices || !tcgplayerPrices.prices) {
      return this.generateFallbackData(timeRange, dataPoints);
    }

    const marketPrice = tcgplayerPrices.prices?.holofoil?.market || card.current_value || 0;
    const lowPrice = tcgplayerPrices.prices?.holofoil?.low || marketPrice * 0.7;
    const highPrice = tcgplayerPrices.prices?.holofoil?.high || marketPrice * 1.3;

    // Create more realistic price bounds based on actual market behavior
    const realisticLow = Math.min(lowPrice, marketPrice * 0.75);
    const realisticHigh = Math.min(highPrice, marketPrice * 1.25);

    const history = [];
    const now = new Date();
    const timeInterval = this.getTimeInterval(timeRange, dataPoints);

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * timeInterval));
      const timeProgress = i / dataPoints;

      let price;
      if (i === dataPoints - 1) {
        // Most recent point uses current market price
        price = marketPrice;
      } else {
        // Create a realistic trend - sometimes up, sometimes down
        // Use a random trend direction for more realistic testing
        const trendDirection = Math.random() > 0.5 ? 1 : -1; // 50% chance of up or down
        const trendMagnitude = 0.1 + Math.random() * 0.2; // 10-30% change
        
        if (trendDirection > 0) {
          // Upward trend: start lower, end at current price
          const startPrice = marketPrice * (1 - trendMagnitude);
          const priceIncrease = (marketPrice - startPrice) * (1 - timeProgress);
          price = startPrice + priceIncrease;
        } else {
          // Downward trend: start higher, end at current price
          const startPrice = marketPrice * (1 + trendMagnitude);
          const priceDecrease = (startPrice - marketPrice) * (1 - timeProgress);
          price = startPrice - priceDecrease;
        }
        
        // Add some realistic volatility but keep the overall trend
        const volatility = (Math.random() - 0.5) * (marketPrice * 0.03); // ±3% volatility
        price = price + volatility;
        
        // Ensure price stays within reasonable bounds
        price = Math.max(realisticLow * 0.9, Math.min(realisticHigh * 1.1, price));
      }

      history.push({
        date: date.toISOString(),
        value: Math.max(0.01, price)
      });
    }

    console.log('PriceService - Generated history:', {
      dataPoints: history.length,
      startPrice: history[0].value,
      endPrice: history[history.length - 1].value,
      absoluteChange: history[history.length - 1].value - history[0].value,
      isPositive: (history[history.length - 1].value - history[0].value) >= 0
    });

    return history;
  }

  // Generate fallback data when no TCGPlayer data is available
  generateFallbackData(timeRange, dataPoints) {
    const history = [];
    const now = new Date();
    const timeInterval = this.getTimeInterval(timeRange, dataPoints);
    const basePrice = 100; // Default base price

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * timeInterval));
      const timeProgress = i / dataPoints;
      
      // Simple fallback price generation
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const trend = Math.sin(timeProgress * Math.PI) * 0.1; // Gentle trend
      const price = basePrice * (1 + variation + trend);
      
      history.push({
        date: date.toISOString(),
        value: Math.max(0.01, price)
      });
    }

    return history;
  }

  // Get time interval based on time range and data points
  getTimeInterval(timeRange, dataPoints) {
    const now = new Date();
    const totalTime = this.getTotalTimeForRange(timeRange);
    return totalTime / dataPoints;
  }

  // Get total time in milliseconds for a given range
  getTotalTimeForRange(timeRange) {
    const timeMap = {
      '1D': 24 * 60 * 60 * 1000, // 1 day
      '7D': 7 * 24 * 60 * 60 * 1000, // 7 days
      '1M': 30 * 24 * 60 * 60 * 1000, // 30 days
      '3M': 90 * 24 * 60 * 60 * 1000, // 90 days
      '6M': 180 * 24 * 60 * 60 * 1000, // 180 days
      '1Y': 365 * 24 * 60 * 60 * 1000, // 365 days
      'Max': 365 * 24 * 60 * 60 * 1000 // 1 year max
    };
    return timeMap[timeRange] || timeMap['3M'];
  }

  // Get data points for a given time range
  getDataPointsForRange(timeRange) {
    const pointMap = {
      '1D': 24, // Hourly data
      '7D': 7, // Daily data
      '1M': 15, // Every 2 days
      '3M': 20, // Every 4-5 days
      '6M': 24, // Weekly data
      '1Y': 26, // Bi-weekly data
      'Max': 30 // Monthly data
    };
    return pointMap[timeRange] || 20;
  }

  // Get price change percentage for a given time range
  calculatePriceChange(history, timeRange) {
    if (!history || history.length < 2) return 0;
    
    const currentPrice = history[history.length - 1].value;
    const startPrice = history[0].value;
    
    return ((currentPrice - startPrice) / startPrice) * 100;
  }

  // Get daily price change
  calculateDailyChange(history) {
    if (!history || history.length < 2) return 0;
    
    const currentPrice = history[history.length - 1].value;
    const previousPrice = history[history.length - 2].value;
    
    return currentPrice - previousPrice;
  }
}

export default new PriceService();

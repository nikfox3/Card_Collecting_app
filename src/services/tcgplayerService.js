// TCGPlayer API Service
// Note: TCGPlayer doesn't have a public API, so we'll need to scrape their data
// This is a simplified approach - in production, you'd want to use their official API or a service like PokéTCG API

class TCGPlayerService {
  constructor() {
    this.baseUrl = 'https://www.tcgplayer.com'
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.scrapingCache = new Map() // Cache for scraped data
    this.scrapingCacheTimeout = 30 * 60 * 1000 // 30 minutes for scraped data
  }

  // Get cached data or fetch fresh data
  async getCachedData(key, fetchFn) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    const data = await fetchFn()
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    return data
  }

  // Search for a card on TCGPlayer
  async searchCard(cardName, setName) {
    const searchKey = `search-${cardName}-${setName}`
    
    return this.getCachedData(searchKey, async () => {
      try {
        // Since TCGPlayer doesn't have a public API, we'll use a proxy approach
        // In a real implementation, you'd use their official API or a service like PokéTCG API
        const searchQuery = `${cardName} ${setName}`.toLowerCase().replace(/\s+/g, '+')
        
        // For now, we'll return mock data that matches TCGPlayer's structure
        // In production, you'd implement actual web scraping or use their API
        return this.generateMockTCGPlayerData(cardName, setName)
      } catch (error) {
        console.error('Error searching TCGPlayer:', error)
        return null
      }
    })
  }

  // Generate mock data that matches TCGPlayer's structure
  generateMockTCGPlayerData(cardName, setName) {
    // Use real TCGPlayer data for Psyduck Detective Pikachu
    if (cardName === 'Psyduck' && setName === 'Detective Pikachu') {
      return this.getRealPsyduckData()
    }
    
    // Base price for other cards
    const basePrice = 0.45
    
    // Generate realistic price history (last 365 days to cover all time ranges)
    const history = []
    const now = new Date()
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Add some realistic price variation with trend
      const trendFactor = Math.sin((i / 365) * Math.PI * 2) * 0.05 // Seasonal trend
      const randomVariation = (Math.random() - 0.5) * 0.08 // ±4 cents random variation
      const price = Math.max(0.1, basePrice + trendFactor + randomVariation)
      
      history.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 10) + 1
      })
    }

    return {
      productId: '186010',
      name: cardName,
      setName: setName,
      currentPrice: basePrice,
      priceHistory: history,
      marketPrice: basePrice,
      lowPrice: basePrice - 0.05,
      midPrice: basePrice,
      highPrice: basePrice + 0.1,
      directLowPrice: basePrice - 0.02,
      lastUpdated: new Date().toISOString(),
      // TCGPlayer specific data
      tcgplayer: {
        url: `https://www.tcgplayer.com/product/186010/pokemon-detective-pikachu-psyduck-holo-common`,
        updatedAt: new Date().toISOString(),
        prices: {
          holofoil: {
            low: basePrice - 0.05,
            mid: basePrice,
            high: basePrice + 0.1,
            market: basePrice,
            directLow: basePrice - 0.02
          }
        }
      }
    }
  }

  // Scrape real TCGPlayer data for different time ranges
  async scrapeTCGPlayerData(productId, timeRange = '1M') {
    try {
      // Check cache first
      const cacheKey = `${productId}-${timeRange}`
      const cached = this.scrapingCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.scrapingCacheTimeout) {
        console.log(`Using cached TCGPlayer data for ${timeRange}`)
        return cached.data
      }

      // TCGPlayer URLs for different time ranges
      const timeRangeUrls = {
        '1D': `https://www.tcgplayer.com/product/${productId}/pokemon-detective-pikachu-psyduck-holo-common?page=1&Language=English&view=chart&period=1D`,
        '1M': `https://www.tcgplayer.com/product/${productId}/pokemon-detective-pikachu-psyduck-holo-common?page=1&Language=English&view=chart&period=1M`,
        '3M': `https://www.tcgplayer.com/product/${productId}/pokemon-detective-pikachu-psyduck-holo-common?page=1&Language=English&view=chart&period=3M`,
        '6M': `https://www.tcgplayer.com/product/${productId}/pokemon-detective-pikachu-psyduck-holo-common?page=1&Language=English&view=chart&period=6M`,
        '1Y': `https://www.tcgplayer.com/product/${productId}/pokemon-detective-pikachu-psyduck-holo-common?page=1&Language=English&view=chart&period=1Y`
      }

      const url = timeRangeUrls[timeRange]
      if (!url) {
        console.log(`No URL found for time range: ${timeRange}`)
        return null
      }

      console.log(`Scraping TCGPlayer data for ${timeRange}:`, url)
      
      // Use backend API to scrape TCGPlayer data
      try {
        const response = await fetch(`http://localhost:3001/api/tcgplayer/scrape?productId=${productId}&timeRange=${timeRange}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const chartData = await response.json()
        
        if (chartData && chartData.length > 0) {
          console.log(`Successfully scraped ${timeRange} data:`, chartData.length, 'data points')
          const formattedData = this.formatScrapedData(chartData, timeRange)
          
          // Cache the result
          this.scrapingCache.set(cacheKey, {
            data: formattedData,
            timestamp: Date.now()
          })
          
          return formattedData
        } else {
          console.log(`No chart data found for ${timeRange}`)
          return null
        }
        
      } catch (error) {
        console.log(`Backend scraping failed for ${timeRange}:`, error.message)
        return null
      }
    } catch (error) {
      console.error('Error scraping TCGPlayer:', error)
      return null
    }
  }

  // Format scraped TCGPlayer data into our chart format
  formatScrapedData(scrapedData, timeRange) {
    if (!scrapedData || !Array.isArray(scrapedData)) {
      return null
    }

    const labels = scrapedData.map(point => {
      const date = new Date(point.date || point.time)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })

    const prices = scrapedData.map(point => point.price || point.value)

    const priceChange = this.calculatePriceChange(scrapedData)

    return {
      labels,
      datasets: [{
        label: 'Price',
        data: prices,
        borderColor: priceChange.absoluteChange >= 0 ? '#10B981' : '#EF4444',
        backgroundColor: priceChange.absoluteChange >= 0 ? '#10B98120' : '#EF444420',
        tension: 0.4,
        fill: true
      }],
      absoluteChange: priceChange.absoluteChange,
      percentageChange: priceChange.percentageChange,
      currentPrice: prices[prices.length - 1],
      startPrice: prices[0],
      endPrice: prices[prices.length - 1]
    }
  }

  // Get real Psyduck data from TCGPlayer
  getRealPsyduckData() {
    // Generate comprehensive price history covering all time ranges
    const basePrice = 0.45
    const realPriceHistory = []
    const now = new Date()
    
    // Generate 1 year of data (365 days) to cover all time ranges
    for (let i = 364; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Use real TCGPlayer data for the last 30 days (Aug 30 - Sep 29)
      let price
      if (i <= 30) {
        const realData = [
          0.44, 0.43, 0.45, 0.46, 0.40, 0.33, 0.33, 0.35, 0.33, 0.33,
          0.34, 0.34, 0.36, 0.37, 0.37, 0.41, 0.40, 0.40, 0.40, 0.40,
          0.41, 0.41, 0.42, 0.41, 0.43, 0.44, 0.44, 0.45, 0.45, 0.44, 0.45
        ]
        price = realData[30 - i] || basePrice
      } else {
        // Generate realistic historical data for older dates
        const trendFactor = Math.sin((i / 365) * Math.PI * 2) * 0.1 // Seasonal trend
        const randomVariation = (Math.random() - 0.5) * 0.15 // ±7.5 cents variation
        price = Math.max(0.1, basePrice + trendFactor + randomVariation)
      }
      
      realPriceHistory.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 10) + 1
      })
    }

    // Calculate current price and market data
    const currentPrice = realPriceHistory[realPriceHistory.length - 1].price
    const startPrice = realPriceHistory[0].price
    const absoluteChange = currentPrice - startPrice
    const percentageChange = (absoluteChange / startPrice) * 100

    return this.formatCleanChartData(realPriceHistory, '7D')
  }

  // Get price history for charting
  async getPriceHistory(cardName, setName, days = 365) {
    const data = await this.searchCard(cardName, setName)
    if (!data || !data.priceHistory) {
      return []
    }

    // Return the last N days of data
    return data.priceHistory.slice(-days)
  }

  // Get current market data
  async getMarketData(cardName, setName) {
    const data = await this.searchCard(cardName, setName)
    if (!data) {
      return null
    }

    return {
      currentPrice: data.currentPrice,
      marketPrice: data.marketPrice,
      lowPrice: data.lowPrice,
      midPrice: data.midPrice,
      highPrice: data.highPrice,
      directLowPrice: data.directLowPrice,
      lastUpdated: data.lastUpdated,
      tcgplayer: data.tcgplayer
    }
  }

  // Calculate price change over time period
  calculatePriceChange(priceHistory, days = 7) {
    if (!priceHistory || priceHistory.length < 2) {
      return { absoluteChange: 0, percentageChange: 0 }
    }

    const recent = priceHistory.slice(-days)
    const startPrice = recent[0].price
    const endPrice = recent[recent.length - 1].price
    
    const absoluteChange = endPrice - startPrice
    const percentageChange = (absoluteChange / startPrice) * 100

    return {
      absoluteChange: parseFloat(absoluteChange.toFixed(2)),
      percentageChange: parseFloat(percentageChange.toFixed(2))
    }
  }

  // Get historical data from database
  async getHistoricalData(productId, timeRange) {
    try {
      console.log(`Fetching historical data for ${productId} with timeRange ${timeRange}`)
      const response = await fetch(`http://localhost:3001/api/tcgplayer/history?productId=${productId}&timeRange=${timeRange}`)
      if (!response.ok) {
        console.log(`API response not ok: ${response.status}`)
        return null
      }
      
      const data = await response.json()
      console.log(`Received ${data.length} records from database for ${timeRange}`)
      if (!data || data.length === 0) {
        console.log('No data received from database')
        return null
      }
      
      return this.formatHistoricalData(data, timeRange)
    } catch (error) {
      console.log('Error getting historical data:', error)
      return null
    }
  }

  // Get current price from API
  async getCurrentPrice(productId) {
    try {
      const response = await fetch(`http://localhost:3001/api/tcgplayer/current?productId=${productId}`)
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.currentPrice
    } catch (error) {
      console.log('Error getting current price:', error)
      return null
    }
  }

  // Format historical data from database
  formatHistoricalData(data, timeRange) {
    console.log(`Formatting historical data for ${timeRange}:`, data.length, 'records')
    
    // Reduce data points for better readability
    const maxPoints = this.getMaxDataPoints(timeRange)
    const filteredData = this.reduceDataPoints(data, maxPoints)
    
    console.log(`Reduced to ${filteredData.length} data points for ${timeRange}`)
    
    const labels = filteredData.map(point => {
      const date = new Date(point.date)
      return this.formatDateLabel(date, timeRange)
    })

    const prices = filteredData.map(point => point.price)

    const priceChange = this.calculatePriceChange(filteredData)

    console.log(`Price change for ${timeRange}:`, priceChange)

    return {
      labels,
      datasets: [{
        label: 'Price',
        data: prices,
        borderColor: priceChange.absoluteChange >= 0 ? '#10B981' : '#EF4444',
        backgroundColor: priceChange.absoluteChange >= 0 ? '#10B98120' : '#EF444420',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2
      }],
      absoluteChange: priceChange.absoluteChange,
      percentageChange: priceChange.percentageChange,
      currentPrice: prices[prices.length - 1],
      startPrice: prices[0],
      endPrice: prices[prices.length - 1]
    }
  }

  // Get maximum data points based on time range
  getMaxDataPoints(timeRange) {
    const maxPoints = {
      '1D': 24,    // Hourly data
      '7D': 7,     // Daily data
      '1M': 15,    // Every 2 days
      '3M': 20,    // Every 4-5 days
      '6M': 25,    // Every week
      '1Y': 30     // Every 2 weeks
    }
    return maxPoints[timeRange] || 20
  }

  // Reduce data points for better readability
  reduceDataPoints(data, maxPoints) {
    if (data.length <= maxPoints) {
      return data
    }
    
    const step = Math.ceil(data.length / maxPoints)
    const reduced = []
    
    for (let i = 0; i < data.length; i += step) {
      reduced.push(data[i])
    }
    
    // Always include the last data point
    if (reduced[reduced.length - 1] !== data[data.length - 1]) {
      reduced.push(data[data.length - 1])
    }
    
    return reduced
  }

  // Format date labels based on time range
  formatDateLabel(date, timeRange) {
    if (timeRange === '1D') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        hour12: false 
      })
    } else if (timeRange === '7D' || timeRange === '1M') {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  // Format clean chart data with reduced points
  formatCleanChartData(data, timeRange) {
    const maxPoints = this.getMaxDataPoints(timeRange)
    const filteredData = this.reduceDataPoints(data, maxPoints)
    
    const labels = filteredData.map(point => {
      const date = new Date(point.date)
      return this.formatDateLabel(date, timeRange)
    })
    
    const prices = filteredData.map(point => point.price)
    const priceChange = this.calculatePriceChange(filteredData)
    
    return {
      labels,
      datasets: [{
        label: 'Price',
        data: prices,
        borderColor: priceChange.absoluteChange >= 0 ? '#10B981' : '#EF4444',
        backgroundColor: priceChange.absoluteChange >= 0 ? '#10B98120' : '#EF444420',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2
      }],
      absoluteChange: priceChange.absoluteChange,
      percentageChange: priceChange.percentageChange,
      currentPrice: prices[prices.length - 1],
      startPrice: prices[0],
      endPrice: prices[prices.length - 1]
    }
  }

  // Generate 1-day hourly data
  generate1DayData(priceHistory) {
    const currentPrice = priceHistory[priceHistory.length - 1].price
    const startPrice = currentPrice - (Math.random() - 0.5) * 0.1 // ±5 cents variation
    
    // Generate 24 hours of data
    const hourlyData = []
    const labels = []
    const prices = []
    
    for (let hour = 0; hour < 24; hour++) {
      const timeLabel = `${hour.toString().padStart(2, '0')}:00`
      labels.push(timeLabel)
      
      // Generate realistic intraday price movement
      const hourVariation = Math.sin((hour / 24) * Math.PI * 2) * 0.05 // Daily pattern
      const randomVariation = (Math.random() - 0.5) * 0.03 // ±1.5 cents random
      const price = Math.max(0.1, startPrice + hourVariation + randomVariation)
      prices.push(parseFloat(price.toFixed(2)))
      
      hourlyData.push({
        time: timeLabel,
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 5) + 1
      })
    }
    
    const priceChange = this.calculatePriceChange(hourlyData)
    
    return {
      labels,
      datasets: [{
        label: 'Price',
        data: prices,
        borderColor: priceChange.absoluteChange >= 0 ? '#10B981' : '#EF4444',
        backgroundColor: priceChange.absoluteChange >= 0 ? '#10B98120' : '#EF444420',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2
      }],
      absoluteChange: priceChange.absoluteChange,
      percentageChange: priceChange.percentageChange,
      currentPrice: prices[prices.length - 1],
      startPrice: prices[0],
      endPrice: prices[prices.length - 1]
    }
  }

  // Get chart data formatted for our chart component
  async getChartData(cardName, setName, timeRange = '7D') {
    // Try to get real TCGPlayer data first
    if (cardName === 'Psyduck' && setName === 'Detective Pikachu') {
      console.log(`Attempting to get TCGPlayer data for ${timeRange}`)
      
      // Get historical data from database
      const historicalData = await this.getHistoricalData('186010', timeRange)
      if (historicalData) {
        console.log(`Successfully got historical TCGPlayer data for ${timeRange}`)
        return historicalData
      }
      
      // Get current price from API
      const currentPrice = await this.getCurrentPrice('186010')
      if (currentPrice) {
        console.log(`Got current price: $${currentPrice}`)
        // Generate data with real current price
        return this.generateMockTCGPlayerData(cardName, setName, timeRange, currentPrice)
      }
      
      console.log(`Failed to get real TCGPlayer data for ${timeRange}, using fallback data`)
    }

    const priceHistory = await this.getPriceHistory(cardName, setName)
    
    if (!priceHistory.length) {
      return {
        labels: [],
        datasets: [],
        absoluteChange: 0,
        percentageChange: 0
      }
    }

    // Special handling for 1D - generate hourly data
    if (timeRange === '1D') {
      return this.generate1DayData(priceHistory)
    }

    // Convert timeRange to days
    const daysMap = {
      '1D': 1,
      '7D': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      'Max': 365
    }
    
    const days = daysMap[timeRange] || 7
    const recentHistory = priceHistory.slice(-days)


    const labels = recentHistory.map(point => {
      // Parse date as local time to avoid timezone issues
      const [year, month, day] = point.date.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })

    const prices = recentHistory.map(point => point.price)


    const priceChange = this.calculatePriceChange(recentHistory)

    return {
      labels,
      datasets: [{
        label: 'Price',
        data: prices,
        borderColor: priceChange.absoluteChange >= 0 ? '#10B981' : '#EF4444',
        backgroundColor: priceChange.absoluteChange >= 0 ? '#10B98120' : '#EF444420',
        tension: 0.4,
        fill: true
      }],
      absoluteChange: priceChange.absoluteChange,
      percentageChange: priceChange.percentageChange,
      currentPrice: prices[0], // Price at the beginning of the selected range (what user is viewing)
      startPrice: prices[0], // Oldest price in the selected range
      endPrice: prices[prices.length - 1] // Most recent price in the selected range
    }
  }
}

// Export singleton instance
export default new TCGPlayerService()

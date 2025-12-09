// Pokemon TCG Data Importer Service
// Handles importing and processing the complete Pokemon TCG database

class PokemonDataImporterService {
  constructor() {
    this.database = null
    this.isLoaded = false
    this.loadingProgress = 0
  }

  // Load the Pokemon TCG database from JSON file
  async loadDatabase() {
    try {
      console.log('Loading Pokemon TCG database...')
      this.loadingProgress = 0
      
      // Handle both browser and Node.js environments
      const isBrowser = typeof window !== 'undefined'
      const baseUrl = isBrowser ? '' : 'http://localhost:3000'
      const filePath = '/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.json'
      
      const response = await fetch(baseUrl + filePath)
      if (!response.ok) {
        console.warn(`Pokemon TCG database file not found: ${filePath}`)
        console.log('Using empty database - Pokemon TCG data will be loaded from other sources')
        
        // Initialize with empty database instead of failing
        this.database = []
        this.loadingProgress = 100
        this.isLoaded = true
        
        console.log('Pokemon TCG database initialized with empty dataset')
        return true
      }
      
      this.loadingProgress = 50
      const rawDatabase = await response.json()
      
      // Process each card to add formatted number
      this.database = rawDatabase.map(card => {
        const totalInSet = card.printed_total || card.total_in_set || card.official_card_count
        const number = card.number || card.card_number
        
        // Format card number as XXX/YYY
        let formattedNumber = number
        if (totalInSet && number && number.match(/^\d+$/)) {
          const totalStr = String(totalInSet)
          const paddedNumber = number.padStart(totalStr.length, '0')
          formattedNumber = `${paddedNumber}/${totalInSet}`
        }
        
        return {
          ...card,
          formattedNumber
        }
      })
      
      this.loadingProgress = 100
      this.isLoaded = true
      
      console.log(`Pokemon TCG database loaded: ${this.database.length} cards`)
      return true
    } catch (error) {
      console.error('Error loading Pokemon TCG database:', error)
      
      // Initialize with empty database instead of failing completely
      console.log('Using empty database - Pokemon TCG data will be loaded from other sources')
      this.database = []
      this.loadingProgress = 100
      this.isLoaded = true
      
      return true
    }
  }

  // Get loading progress
  getLoadingProgress() {
    return this.loadingProgress
  }

  // Check if database is loaded
  isDatabaseLoaded() {
    return this.isLoaded && this.database !== null
  }

  // Search for cards by name
  searchCards(query, options = {}) {
    if (!this.isDatabaseLoaded()) {
      console.warn('Database not loaded')
      return []
    }

    const {
      limit = 200,
      exactMatch = false,
      setFilter = null,
      rarityFilter = null,
      typeFilter = null
    } = options


    let results = this.database

    // Comprehensive search across multiple fields
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim()
      
      if (exactMatch) {
        // Exact match search
        results = results.filter(card => 
          card.name.toLowerCase() === searchTerm ||
          (card.artist && card.artist.toLowerCase() === searchTerm) ||
          (card.number && card.number.toLowerCase() === searchTerm)
        )
      } else {
        // Partial match search across multiple fields
        results = results.filter(card => {
          // Search in card name
          if (card.name && card.name.toLowerCase().includes(searchTerm)) {
            return true
          }
          
          // Search in artist name
          if (card.artist && card.artist.toLowerCase().includes(searchTerm)) {
            return true
          }
          
          // Search in card number (handle various Pokemon TCG formats)
          if (card.number) {
            const cardNumber = card.number.toLowerCase()
            const searchTermLower = searchTerm.toLowerCase()
            
            // Direct match
            if (cardNumber === searchTermLower) {
              return true
            }
            
            // Contains match
            if (cardNumber.includes(searchTermLower)) {
              return true
            }
            
            // Handle XXX/YYY format searches
            if (searchTerm.match(/^\d+\/\d+$/)) {
              // For exact XXX/YYY format, only match exact card numbers
              // Check both the raw number and formatted number
              if (cardNumber === searchTermLower || 
                  (card.formattedNumber && card.formattedNumber.toLowerCase() === searchTermLower)) {
                return true
              }
            }
            
            // Handle numeric searches with different padding
            if (searchTerm.match(/^\d+$/)) {
              const searchNum = parseInt(searchTerm)
              const cardNum = parseInt(cardNumber)
              
              // Direct numeric match
              if (cardNum === searchNum) {
                return true
              }
              
              // Handle zero-padded matches (e.g., "1" matches "001")
              const paddedSearch = searchTerm.padStart(3, '0')
              if (cardNumber === paddedSearch) {
                return true
              }
              
              // Handle unpadded matches (e.g., "001" matches "1")
              const unpaddedCard = cardNumber.replace(/^0+/, '')
              if (unpaddedCard === searchTerm) {
                return true
              }
              
              // Handle partial matches for numeric searches (e.g., "025" matches "025/102", "025a")
              if (cardNumber.startsWith(searchTerm) || 
                  (card.formattedNumber && card.formattedNumber.startsWith(searchTerm))) {
                return true
              }
            }
            
            // Handle letter suffixes (e.g., "25a", "15A1")
            if (searchTerm.match(/^\d+[a-zA-Z]/)) {
              const numericPart = searchTerm.match(/^\d+/)[0]
              if (cardNumber.startsWith(numericPart)) {
                return true
              }
            }
          }
          
          // Search in set name
          if (card.set_name && card.set_name.toLowerCase().includes(searchTerm)) {
            return true
          }
          
          // Search in rarity
          if (card.rarity && card.rarity.toLowerCase().includes(searchTerm)) {
            return true
          }
          
          // Search in types
          if (card.type && card.type.toLowerCase().includes(searchTerm)) {
            return true
          }
          
          // Search in subtypes
          if (card.subtypes && Array.isArray(card.subtypes)) {
            if (card.subtypes.some(subtype => 
              subtype.toLowerCase().includes(searchTerm)
            )) {
              return true
            }
          }
          
          return false
        })
      }
    }

    // Filter by set
    if (setFilter) {
      results = results.filter(card => 
        card.set_name && card.set_name.toLowerCase().includes(setFilter.toLowerCase())
      )
    }

    // Filter by rarity
    if (rarityFilter) {
      results = results.filter(card => 
        card.rarity && card.rarity.toLowerCase().includes(rarityFilter.toLowerCase())
      )
    }

    // Filter by type
    if (typeFilter) {
      results = results.filter(card => 
        card.type && card.type.toLowerCase().includes(typeFilter.toLowerCase())
      )
    }


    return results.slice(0, limit)
  }

  // Get card by ID
  getCardById(cardId) {
    if (!this.isDatabaseLoaded()) {
      return null
    }
    return this.database.find(card => card.id === cardId || card.card_id === cardId)
  }

  // Get all unique sets
  getAllSets() {
    if (!this.isDatabaseLoaded()) {
      return []
    }

    const sets = new Map()
    this.database.forEach(card => {
      if (card.set_name && card.set_id) {
        if (!sets.has(card.set_id)) {
          sets.set(card.set_id, {
            id: card.set_id,
            name: card.set_name,
            series: card.series,
            releaseDate: card.release_date,
            totalCards: card.total_in_set || card.printed_total,
            logo: card.set_logo_url,
            symbol: card.set_symbol_url
          })
        }
      }
    })

    return Array.from(sets.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  // Get all unique rarities
  getAllRarities() {
    if (!this.isDatabaseLoaded()) {
      return []
    }

    const rarities = new Set()
    this.database.forEach(card => {
      if (card.rarity) {
        rarities.add(card.rarity)
      }
    })

    return Array.from(rarities).sort()
  }

  // Get all unique types
  getAllTypes() {
    if (!this.isDatabaseLoaded()) {
      return []
    }

    const types = new Set()
    this.database.forEach(card => {
      if (card.type) {
        types.add(card.type)
      }
    })

    return Array.from(types).sort()
  }

  // Fix tcgdx typo in URLs (should be tcgdx)
  fixImageUrl(url) {
    if (!url) return url
    return url.replace(/tcgdx\.net/g, 'tcgdex.net')
  }

  // Format TCGdx image URLs with proper extensions
  formatImageUrl(url, quality = 'high', extension = 'webp') {
    if (!url) return url
    
    // Check if it's a TCGdex URL that needs formatting
    if (url.includes('assets.tcgdex.net')) {
      // Check if URL already has an extension (ends with .webp, .png, .jpg)
      const hasExtension = /\.(webp|png|jpg|jpeg)$/i.test(url)
      
      if (!hasExtension) {
        // URL format: https://assets.tcgdex.net/en/swsh/swsh3/136
        // Add quality and extension: https://assets.tcgdex.net/en/swsh/swsh3/136/high.webp
        return `${url}/${quality}.${extension}`
      } else {
        // URL already has extension, check if it needs quality adjustment
        const hasQuality = url.includes(`/${quality}.${extension}`)
        if (!hasQuality) {
          // Replace existing quality/extension with new ones
          const baseUrl = url.replace(/\/[^/]+\.(webp|png|jpg|jpeg)$/i, '')
          return `${baseUrl}/${quality}.${extension}`
        }
      }
    }
    return url
  }

  // Convert Pokemon TCG data to app format
  convertToAppFormat(pokemonCard) {
    if (!pokemonCard) {
      console.log('convertToAppFormat: pokemonCard is null/undefined')
      return null
    }
    

    // Parse JSON strings
    let abilities = []
    let attacks = []
    let weaknesses = []
    let resistances = []
    let variants = {}
    let tcgplayerPrices = {}
    let cardmarketPrices = {}

    try {
      if (pokemonCard.abilities) {
        abilities = JSON.parse(pokemonCard.abilities)
      }
    } catch (e) {
      console.warn('Failed to parse abilities:', e)
    }

    try {
      if (pokemonCard.attacks) {
        attacks = JSON.parse(pokemonCard.attacks)
      }
    } catch (e) {
      console.warn('Failed to parse attacks:', e)
    }

    try {
      if (pokemonCard.weaknesses) {
        weaknesses = JSON.parse(pokemonCard.weaknesses)
      }
    } catch (e) {
      console.warn('Failed to parse weaknesses:', e)
    }

    try {
      if (pokemonCard.resistances) {
        resistances = JSON.parse(pokemonCard.resistances)
      }
    } catch (e) {
      console.warn('Failed to parse resistances:', e)
    }

    try {
      if (pokemonCard.variants) {
        variants = JSON.parse(pokemonCard.variants)
      }
    } catch (e) {
      console.warn('Failed to parse variants:', e)
    }

    try {
      if (pokemonCard.tcgplayer_prices) {
        tcgplayerPrices = JSON.parse(pokemonCard.tcgplayer_prices)
      }
    } catch (e) {
      console.warn('Failed to parse TCGPlayer prices:', e)
    }

    try {
      if (pokemonCard.cardmarket_prices) {
        cardmarketPrices = JSON.parse(pokemonCard.cardmarket_prices)
      }
    } catch (e) {
      console.warn('Failed to parse CardMarket prices:', e)
    }

    // Calculate current value from TCGPlayer prices
    let currentValue = 0
    if (tcgplayerPrices.holofoil?.marketPrice) {
      currentValue = tcgplayerPrices.holofoil.marketPrice
    } else if (tcgplayerPrices.normal?.marketPrice) {
      currentValue = tcgplayerPrices.normal.marketPrice
    } else if (tcgplayerPrices['reverse-holofoil']?.marketPrice) {
      currentValue = tcgplayerPrices['reverse-holofoil'].marketPrice
    } else {
      // Fallback price calculation based on card name and rarity
      const cardName = pokemonCard.name.toLowerCase()
      const rarity = pokemonCard.rarity?.toLowerCase() || ''
      
      if (cardName.includes('charizard')) {
        currentValue = rarity.includes('rare') ? 100.00 : 50.00
      } else if (cardName.includes('pikachu')) {
        currentValue = rarity.includes('rare') ? 30.00 : 15.00
      } else if (cardName.includes('blastoise')) {
        currentValue = rarity.includes('rare') ? 80.00 : 40.00
      } else if (cardName.includes('venusaur')) {
        currentValue = rarity.includes('rare') ? 70.00 : 35.00
      } else if (cardName.includes('mew')) {
        currentValue = 50.00
      } else if (cardName.includes('legendary')) {
        currentValue = 60.00
      } else if (rarity.includes('rare')) {
        currentValue = 20.00
      } else if (rarity.includes('uncommon')) {
        currentValue = 8.00
      } else {
        currentValue = 5.00 // Base price for common cards
      }
    }

    // Get the best available image URL
    let rawImageUrl = pokemonCard.image_high_res || pokemonCard.image_large || pokemonCard.image_small
    
    // If no image URL found, provide a fallback
    if (!rawImageUrl) {
      const cardName = pokemonCard.name.toLowerCase()
      if (cardName.includes('charizard')) {
        rawImageUrl = 'https://images.pokemontcg.io/base1/4_hires.png'
      } else if (cardName.includes('pikachu')) {
        rawImageUrl = 'https://images.pokemontcg.io/base1/58_hires.png'
      } else if (cardName.includes('blastoise')) {
        rawImageUrl = 'https://images.pokemontcg.io/base1/2_hires.png'
      } else if (cardName.includes('venusaur')) {
        rawImageUrl = 'https://images.pokemontcg.io/base1/15_hires.png'
      } else if (cardName.includes('mew')) {
        rawImageUrl = 'https://images.pokemontcg.io/fossil/15_hires.png'
      } else {
        // Generic fallback - try to construct a Pokemon TCG image URL
        const pokemonName = cardName.replace(/[^a-z0-9]/g, '')
        rawImageUrl = `https://images.pokemontcg.io/${pokemonName}/1_hires.png`
      }
    }
    
    // Format card number as XXX/YYY where XXX is padded to match YYY length
    const formatCardNumber = (number, totalInSet) => {
      if (!number) return number
      
      // If we have a set total and the number is purely numeric, format as XXX/YYY
      if (totalInSet && number.match(/^\d+$/)) {
        const totalStr = String(totalInSet)
        const paddedNumber = number.padStart(totalStr.length, '0')
        return `${paddedNumber}/${totalInSet}`
      }
      
      return number
    }

    const totalInSet = pokemonCard.printed_total || pokemonCard.total_in_set || pokemonCard.official_card_count
    const formattedNumber = formatCardNumber(pokemonCard.number || pokemonCard.card_number, totalInSet)

    return {
      id: pokemonCard.id || pokemonCard.card_id,
      name: pokemonCard.name,
      set: pokemonCard.set_name,
      set_id: pokemonCard.set_id,
      series: pokemonCard.series,
      rarity: pokemonCard.rarity,
      number: pokemonCard.number || pokemonCard.card_number,
      formattedNumber: formattedNumber,
      imageUrl: this.formatImageUrl(this.fixImageUrl(rawImageUrl), 'high', 'webp'),
      images: {
        small: this.formatImageUrl(this.fixImageUrl(pokemonCard.image_small), 'low', 'webp'),
        large: this.formatImageUrl(this.fixImageUrl(pokemonCard.image_large), 'high', 'webp'),
        highRes: this.formatImageUrl(this.fixImageUrl(pokemonCard.image_high_res), 'high', 'webp')
      },
      artist: pokemonCard.artist || pokemonCard.illustrator,
      currentValue: currentValue,
      tcgplayer: {
        url: pokemonCard.tcgplayer_url,
        prices: tcgplayerPrices,
        normal: {
          low: pokemonCard.tcgplayer_normal_low,
          mid: pokemonCard.tcgplayer_normal_mid,
          high: pokemonCard.tcgplayer_normal_high,
          market: pokemonCard.tcgplayer_normal_market
        },
        holofoil: {
          low: pokemonCard.tcgplayer_holofoil_low,
          mid: pokemonCard.tcgplayer_holofoil_mid,
          high: pokemonCard.tcgplayer_holofoil_high,
          market: pokemonCard.tcgplayer_holofoil_market
        }
      },
      cardmarket: {
        url: pokemonCard.cardmarket_url,
        prices: cardmarketPrices,
        avg: pokemonCard.cardmarket_avg,
        low: pokemonCard.cardmarket_low,
        trend: pokemonCard.cardmarket_trend
      },
      // Pokemon-specific data
      supertype: pokemonCard.supertype,
      stage: pokemonCard.stage,
      subtypes: pokemonCard.subtypes,
      hp: pokemonCard.hp,
      types: pokemonCard.types,
      type: pokemonCard.type,
      evolvesFrom: pokemonCard.evolves_from,
      evolvesTo: pokemonCard.evolves_to,
      dexId: pokemonCard.dex_id,
      nationalPokedexNumbers: pokemonCard.national_pokedex_numbers,
      abilities: abilities,
      attacks: attacks,
      weaknesses: weaknesses,
      resistances: resistances,
      retreatCost: pokemonCard.retreat_cost,
      convertedRetreatCost: pokemonCard.converted_retreat_cost,
      flavorText: pokemonCard.flavor_text,
      variants: variants,
      // Legal information
      legalStandard: pokemonCard.legal_standard,
      legalExpanded: pokemonCard.legal_expanded,
      regulationMark: pokemonCard.regulation_mark,
      // Set information
      printedTotal: pokemonCard.printed_total,
      totalInSet: pokemonCard.total_in_set,
      releaseDate: pokemonCard.release_date,
      // Metadata
      updatedAt: pokemonCard.updated_at,
      source: pokemonCard.source,
      apiVersion: pokemonCard.api_version
    }
  }

  // Get statistics about the database
  getDatabaseStats() {
    if (!this.isDatabaseLoaded()) {
      return null
    }

    const stats = {
      totalCards: this.database.length,
      totalSets: this.getAllSets().length,
      totalRarities: this.getAllRarities().length,
      totalTypes: this.getAllTypes().length,
      cardsWithImages: this.database.filter(card => card.image_high_res || card.image_large || card.image_small).length,
      cardsWithPrices: this.database.filter(card => 
        card.tcgplayer_normal_market || 
        card.tcgplayer_holofoil_market || 
        card.tcgplayer_reverse_holofoil_market
      ).length,
      averagePrice: 0,
      priceRange: { min: 0, max: 0 }
    }

    // Calculate price statistics
    const prices = this.database
      .map(card => {
        if (card.tcgplayer_holofoil_market) return card.tcgplayer_holofoil_market
        if (card.tcgplayer_normal_market) return card.tcgplayer_normal_market
        if (card.tcgplayer_reverse_holofoil_market) return card.tcgplayer_reverse_holofoil_market
        return null
      })
      .filter(price => price !== null && price > 0)

    if (prices.length > 0) {
      stats.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
      stats.priceRange.min = Math.min(...prices)
      stats.priceRange.max = Math.max(...prices)
    }

    return stats
  }
}

export default new PokemonDataImporterService()

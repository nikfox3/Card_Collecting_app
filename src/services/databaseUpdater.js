// Database Updater Service
// Updates the existing database with Pokemon TCG data and provides enhanced search

import pokemonDataImporter from './pokemonDataImporter.js'
import userDatabase from './userDatabase.js'

class DatabaseUpdaterService {
  constructor() {
    this.isInitialized = false
    this.updateProgress = 0
  }

  // Initialize the database updater
  async initialize() {
    try {
      console.log('Initializing database updater...')
      this.updateProgress = 10
      
      // Load the Pokemon TCG database
      const loaded = await pokemonDataImporter.loadDatabase()
      if (!loaded) {
        throw new Error('Failed to load Pokemon TCG database')
      }
      
      this.updateProgress = 50
      this.isInitialized = true
      this.updateProgress = 100
      
      console.log('Database updater initialized successfully')
      return true
    } catch (error) {
      console.error('Error initializing database updater:', error)
      return false
    }
  }

  // Get update progress
  getUpdateProgress() {
    return this.updateProgress
  }

  // Check if updater is initialized
  isUpdaterInitialized() {
    return this.isInitialized && pokemonDataImporter.isDatabaseLoaded()
  }

  // Enhanced search that uses both local and Pokemon TCG data
  async searchCards(query, options = {}) {
    if (!this.isUpdaterInitialized()) {
      console.warn('Database updater not initialized')
      return []
    }

    const {
      limit = 50,
      exactMatch = false,
      setFilter = null,
      rarityFilter = null,
      typeFilter = null,
      includeLocalData = true
    } = options

    // Search Pokemon TCG database
    const pokemonResults = pokemonDataImporter.searchCards(query, {
      limit: limit * 2, // Get more results to account for filtering
      exactMatch,
      setFilter,
      rarityFilter,
      typeFilter
    })

    // Convert to app format
    const convertedResults = pokemonResults.map(card => 
      pokemonDataImporter.convertToAppFormat(card)
    ).filter(card => card !== null)

    // If we want to include local data, we could merge with existing search results
    // For now, we'll just return the Pokemon TCG data
    return convertedResults.slice(0, limit)
  }

  // Get card with enhanced data
  async getCardWithEnhancedData(cardId) {
    if (!this.isUpdaterInitialized()) {
      return null
    }

    // Try to get from Pokemon TCG database first
    const pokemonCard = pokemonDataImporter.getCardById(cardId)
    if (pokemonCard) {
      return pokemonDataImporter.convertToAppFormat(pokemonCard)
    }

    // Fallback to existing system
    return null
  }

  // Update existing collection cards with enhanced data
  async updateCollectionCardsWithEnhancedData(collectionId) {
    if (!this.isUpdaterInitialized()) {
      return false
    }

    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      console.log('Skipping collection update - not in browser environment')
      return false
    }

    const userData = userDatabase.getUserData()
    if (!userData) return false

    const collection = userData.collections.find(c => c.id === collectionId)
    if (!collection) return false

    let updated = 0
    console.log(`Updating ${collection.cards.length} cards with enhanced data...`)

    collection.cards.forEach(card => {
      // Search for matching card in Pokemon TCG database
      const searchResults = pokemonDataImporter.searchCards(card.name, {
        exactMatch: true,
        setFilter: card.set,
        limit: 1
      })

      if (searchResults.length > 0) {
        const enhancedCard = pokemonDataImporter.convertToAppFormat(searchResults[0])
        
        // Update card with enhanced data
        if (enhancedCard) {
          // Update image with correct one from database
          if (enhancedCard.imageUrl) {
            card.imageUrl = enhancedCard.imageUrl
            card.images = enhancedCard.images
            updated++
          }

          // Update price if missing or if we have a better one
          if ((!card.currentValue || card.currentValue === 0) && enhancedCard.currentValue > 0) {
            card.currentValue = enhancedCard.currentValue
            updated++
          }

          // Add TCGPlayer data if missing
          if (!card.tcgplayer && enhancedCard.tcgplayer) {
            card.tcgplayer = enhancedCard.tcgplayer
            updated++
          }

          // Add Pokemon-specific data
          if (!card.hp && enhancedCard.hp) {
            card.hp = enhancedCard.hp
            updated++
          }

          if (!card.types && enhancedCard.types) {
            card.types = enhancedCard.types
            updated++
          }

          if (!card.attacks && enhancedCard.attacks) {
            card.attacks = enhancedCard.attacks
            updated++
          }

          if (!card.abilities && enhancedCard.abilities) {
            card.abilities = enhancedCard.abilities
            updated++
          }

          card.lastUpdated = new Date().toISOString()
        }
      }
    })

    if (updated > 0) {
      // Recalculate collection totals
      collection.totalValue = userDatabase.calculateCollectionValue(collection)
      collection.lastUpdated = new Date().toISOString()
      userDatabase.saveUserData(userData)
      console.log(`Updated ${updated} cards with enhanced data`)
    }

    return updated > 0
  }

  // Get all available sets
  getAllSets() {
    if (!this.isUpdaterInitialized()) {
      return []
    }
    return pokemonDataImporter.getAllSets()
  }

  // Get all available rarities
  getAllRarities() {
    if (!this.isUpdaterInitialized()) {
      return []
    }
    return pokemonDataImporter.getAllRarities()
  }

  // Get all available types
  getAllTypes() {
    if (!this.isUpdaterInitialized()) {
      return []
    }
    return pokemonDataImporter.getAllTypes()
  }

  // Get database statistics
  getDatabaseStats() {
    if (!this.isUpdaterInitialized()) {
      return null
    }
    return pokemonDataImporter.getDatabaseStats()
  }

  // Search for cards by multiple criteria
  async advancedSearch(criteria) {
    if (!this.isUpdaterInitialized()) {
      return []
    }

    const {
      query = '',
      setName = '',
      rarity = '',
      type = '',
      hpMin = null,
      hpMax = null,
      priceMin = null,
      priceMax = null,
      hasImage = null,
      hasPrice = null,
      limit = 50
    } = criteria

    let results = pokemonDataImporter.searchCards(query, {
      limit: 1000, // Get more results for filtering
      setFilter: setName || null,
      rarityFilter: rarity || null,
      typeFilter: type || null
    })

    // Apply additional filters
    if (hpMin !== null) {
      results = results.filter(card => card.hp && card.hp >= hpMin)
    }
    if (hpMax !== null) {
      results = results.filter(card => card.hp && card.hp <= hpMax)
    }
    if (priceMin !== null) {
      results = results.filter(card => {
        const price = card.tcgplayer_holofoil_market || card.tcgplayer_normal_market || card.tcgplayer_reverse_holofoil_market
        return price && price >= priceMin
      })
    }
    if (priceMax !== null) {
      results = results.filter(card => {
        const price = card.tcgplayer_holofoil_market || card.tcgplayer_normal_market || card.tcgplayer_reverse_holofoil_market
        return price && price <= priceMax
      })
    }
    if (hasImage !== null) {
      results = results.filter(card => hasImage ? (card.image_high_res || card.image_large || card.image_small) : !(card.image_high_res || card.image_large || card.image_small))
    }
    if (hasPrice !== null) {
      results = results.filter(card => {
        const hasPriceData = card.tcgplayer_holofoil_market || card.tcgplayer_normal_market || card.tcgplayer_reverse_holofoil_market
        return hasPrice ? hasPriceData : !hasPriceData
      })
    }

    // Convert to app format and limit results
    return results
      .slice(0, limit)
      .map(card => pokemonDataImporter.convertToAppFormat(card))
      .filter(card => card !== null)
  }
}

export default new DatabaseUpdaterService()

// Card Data Migration Service
// Handles the transition from hardcoded data to the comprehensive Pokemon TCG database

import pokemonDataImporter from './pokemonDataImporter.js'
import userDatabase from './userDatabase.js'

class CardDataMigrationService {
  constructor() {
    this.isInitialized = false
  }

  // Initialize the migration service
  async initialize() {
    try {
      console.log('Initializing card data migration...')
      
      // Load the Pokemon TCG database
      const loaded = await pokemonDataImporter.loadDatabase()
      if (!loaded) {
        throw new Error('Failed to load Pokemon TCG database')
      }
      
      this.isInitialized = true
      console.log('Card data migration service initialized successfully')
      return true
    } catch (error) {
      console.error('Error initializing migration service:', error)
      return false
    }
  }

  // Clear existing hardcoded data and replace with database
  async migrateToDatabase() {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return false
    }

    try {
      console.log('Starting migration to Pokemon TCG database...')
      
      // Get user data
      const userData = userDatabase.getUserData()
      if (!userData) {
        console.error('No user data found')
        return false
      }

      // Clear existing collections and create a fresh one
      const newCollection = {
        id: 'pokemon-tcg-collection',
        name: 'Pokemon TCG Collection',
        description: 'Complete Pokemon TCG card collection',
        cards: [],
        totalCards: 0,
        totalValue: 0,
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }

      // Update user data with new collection
      userData.collections = [newCollection]
      userData.selectedCollection = 'pokemon-tcg-collection'
      
      // Save the updated user data
      const saved = userDatabase.saveUserData(userData)
      if (!saved) {
        console.error('Failed to save user data')
        return false
      }

      console.log('Migration completed successfully')
      return true
    } catch (error) {
      console.error('Error during migration:', error)
      return false
    }
  }

  // Search cards using the database
  async searchCards(query = '', options = {}) {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return []
    }

    const {
      limit = 200,
      exactMatch = false,
      setFilter = null,
      rarityFilter = null,
      typeFilter = null
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

    return convertedResults.slice(0, limit)
  }

  // Get card by ID from database
  async getCardById(cardId) {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return null
    }

    const pokemonCard = pokemonDataImporter.getCardById(cardId)
    if (pokemonCard) {
      return pokemonDataImporter.convertToAppFormat(pokemonCard)
    }

    return null
  }

  // Get all available sets
  async getAllSets() {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return []
    }

    return pokemonDataImporter.getAllSets()
  }

  // Get all available rarities
  async getAllRarities() {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return []
    }

    return pokemonDataImporter.getAllRarities()
  }

  // Get all available types
  async getAllTypes() {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return []
    }

    return pokemonDataImporter.getAllTypes()
  }

  // Get database statistics
  async getDatabaseStats() {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return null
    }

    return pokemonDataImporter.getDatabaseStats()
  }

  // Add a card to collection from database
  async addCardToCollection(cardId, quantity = 1, condition = 'Near Mint', variant = 'Normal', grade = null, gradingService = null, pricePaid = null, notes = '') {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return false
    }

    // Get card data from database
    const cardData = await this.getCardById(cardId)
    if (!cardData) {
      console.error('Card not found in database:', cardId)
      return false
    }

    // Add to collection using userDatabase
    const success = userDatabase.addCardToCollection(
      'pokemon-tcg-collection',
      cardData,
      quantity,
      condition,
      variant,
      grade,
      gradingService,
      pricePaid,
      notes
    )

    return success
  }

  // Get collection cards with enhanced data
  async getCollectionCards() {
    const userData = userDatabase.getUserData()
    if (!userData) return []

    const collection = userData.collections.find(c => c.id === 'pokemon-tcg-collection')
    if (!collection) return []

    return collection.cards || []
  }
}

export default new CardDataMigrationService()

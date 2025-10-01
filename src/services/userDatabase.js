// User Database Service
// This service manages user data including collections, decks, binders, and activity

class UserDatabaseService {
  constructor() {
    this.storageKey = 'pokemonCardCollector_userData'
    this.initializeUserData()
  }

  // Initialize user data structure
  initializeUserData() {
    const existingData = this.getUserData()
    if (!existingData) {
      const initialData = {
        username: 'Stuart60',
        profilePicture: 'S',
        collections: [
          {
            id: 'pokemon-collection',
            name: 'Pokemon Collection',
            totalValue: 0,
            totalCards: 0,
            monthlyChange: 0,
            currency: 'USD',
            lastUpdated: new Date().toISOString(),
            cardsAddedThisWeek: 0,
            valueChangeThisWeek: 0,
            isUserCreated: false,
            cards: []
          }
        ],
        decks: [],
        binders: [],
        folders: [],
        recentActivity: [],
        portfolioHistory: {
          'pokemon-collection': {
            '1D': [],
            '7D': [],
            '1M': [],
            '3M': [],
            '6M': [],
            '1Y': [],
            'MAX': []
          }
        },
        settings: {
          defaultCollection: 'pokemon-collection',
          currency: 'USD',
          theme: 'dark'
        }
      }
      this.saveUserData(initialData)
    }
  }

  // Get user data from localStorage
  getUserData() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error loading user data:', error)
      return null
    }
  }

  // Save user data to localStorage
  saveUserData(userData) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(userData))
      return true
    } catch (error) {
      console.error('Error saving user data:', error)
      return false
    }
  }

  // Update user data
  updateUserData(updates) {
    const currentData = this.getUserData()
    if (!currentData) return false

    const updatedData = {
      ...currentData,
      ...updates,
      lastUpdated: new Date().toISOString()
    }

    return this.saveUserData(updatedData)
  }

  // Add card to collection
  addCardToCollection(collectionId, cardData, quantity = 1, condition = 'Near Mint', variant = 'Normal', grade = null, gradingService = null, pricePaid = null, notes = '') {
    const userData = this.getUserData()
    if (!userData) return false

    const collection = userData.collections.find(c => c.id === collectionId)
    if (!collection) return false

    // Check if card already exists with same condition, variant, and grade
    const existingCard = collection.cards.find(c => 
      c.cardId === cardData.id &&
      c.condition === condition &&
      c.variant === variant &&
      c.grade === grade &&
      c.gradingService === gradingService
    )

    if (existingCard) {
      // Update existing card quantity
      console.log('Found existing card, updating quantity:', {
        cardId: cardData.id,
        oldQuantity: existingCard.quantity,
        addingQuantity: quantity,
        newQuantity: (existingCard.quantity || 1) + quantity
      });
      existingCard.quantity = (existingCard.quantity || 1) + quantity
      existingCard.lastUpdated = new Date().toISOString()
      // Update notes if new notes provided
      if (notes && notes.trim()) {
        existingCard.notes = notes
      }
    } else {
      // Create new card entry
      console.log('Creating new card entry:', {
        cardId: cardData.id,
        quantity: quantity,
        condition: condition,
        variant: variant,
        grade: grade,
        gradingService: gradingService
      });
      const cardEntry = {
        id: `${cardData.id}-${Date.now()}`,
        cardId: cardData.id,
        name: cardData.name,
        set: cardData.set?.name || cardData.set_name || 'Unknown Set',
        rarity: cardData.rarity || 'Unknown',
        number: cardData.number || '000/000',
        imageUrl: cardData.imageUrl || cardData.images?.small || cardData.images?.large,
        quantity: quantity,
        condition: condition,
        variant: variant,
        grade: grade,
        gradingService: gradingService,
        pricePaid: pricePaid,
        currentValue: this.calculateCardValue(cardData, condition, variant, grade, gradingService),
        notes: notes,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }

      // Add to collection
      collection.cards.push(cardEntry)
    }

    collection.totalCards = (collection.totalCards || 0) + quantity
    collection.totalValue = this.calculateCollectionValue(collection)
    collection.lastUpdated = new Date().toISOString()

    // Add to recent activity (directly to userData, not via addActivity to avoid double save)
    const timestamp = new Date().toISOString();
    const activityEntry = {
      id: `activity-${Date.now()}`,
      type: 'add',
      action: 'Added',
      cardName: cardData.name,
      collectionName: collection.name,
      quantity: quantity,
      timestamp: timestamp,
      time: this.formatTimeAgo(timestamp)
    };
    
    userData.recentActivity.unshift(activityEntry);
    
    // Keep only last 50 activities
    if (userData.recentActivity.length > 50) {
      userData.recentActivity = userData.recentActivity.slice(0, 50);
    }

    return this.saveUserData(userData)
  }

  // Update card in collection
  updateCardInCollection(collectionId, cardEntryId, updates) {
    const userData = this.getUserData()
    if (!userData) return false

    const collection = userData.collections.find(c => c.id === collectionId)
    if (!collection) return false

    const cardIndex = collection.cards.findIndex(c => c.id === cardEntryId)
    if (cardIndex === -1) return false

    const card = collection.cards[cardIndex]
    const oldQuantity = card.quantity || 1
    
    // Update the card with new values
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        card[key] = updates[key]
      }
    })
    
    // Recalculate current value if condition, variant, grade, or grading service changed
    if (updates.condition || updates.variant || updates.grade || updates.gradingService) {
      // We need the original card data to recalculate value
      // For now, we'll use the existing currentValue as base
      const baseValue = card.currentValue || 0
      const conditionMultipliers = {
        'Near Mint': 1.0,
        'Lightly Played': 0.8,
        'Moderately Played': 0.6,
        'Heavily Played': 0.4,
        'Damaged': 0.2
      }
      const variantMultipliers = {
        'Normal': 1.0,
        'Holo': 1.2,
        'Reverse Holo': 1.1,
        'Foil': 1.3
      }
      
      const conditionMultiplier = conditionMultipliers[card.condition] || 1.0
      const variantMultiplier = variantMultipliers[card.variant] || 1.0
      let gradingMultiplier = 1.0
      if (card.grade && card.gradingService) {
        gradingMultiplier = 1.5 + (parseFloat(card.grade) / 10) * 0.5
      }
      
      card.currentValue = baseValue * conditionMultiplier * variantMultiplier * gradingMultiplier
    }
    
    card.lastUpdated = new Date().toISOString()
    
    // Update collection totals
    const quantityChange = (card.quantity || 1) - oldQuantity
    collection.totalCards = Math.max(0, collection.totalCards + quantityChange)
    collection.totalValue = this.calculateCollectionValue(collection)
    collection.lastUpdated = new Date().toISOString()

    // Add to recent activity
    const timestamp = new Date().toISOString();
    const activityEntry = {
      id: `activity-${Date.now()}`,
      type: 'edit',
      action: 'Updated',
      cardName: card.name,
      collectionName: collection.name,
      quantity: card.quantity || 1,
      timestamp: timestamp,
      time: this.formatTimeAgo(timestamp)
    };
    
    userData.recentActivity.unshift(activityEntry);
    
    // Keep only last 50 activities
    if (userData.recentActivity.length > 50) {
      userData.recentActivity = userData.recentActivity.slice(0, 50);
    }

    return this.saveUserData(userData)
  }

  // Remove card from collection
  removeCardFromCollection(collectionId, cardEntryId, quantity = 1) {
    const userData = this.getUserData()
    if (!userData) return false

    const collection = userData.collections.find(c => c.id === collectionId)
    if (!collection) return false

    const cardIndex = collection.cards.findIndex(c => c.id === cardEntryId)
    if (cardIndex === -1) return false

    const card = collection.cards[cardIndex]
    
    // Update quantity or remove entirely
    if (card.quantity <= quantity) {
      collection.cards.splice(cardIndex, 1)
    } else {
      collection.cards[cardIndex].quantity -= quantity
    }

    collection.totalCards = Math.max(0, collection.totalCards - quantity)
    collection.totalValue = this.calculateCollectionValue(collection)
    collection.lastUpdated = new Date().toISOString()

    // Add to recent activity (directly to userData, not via addActivity to avoid double save)
    const timestamp = new Date().toISOString();
    const activityEntry = {
      id: `activity-${Date.now()}`,
      type: 'remove',
      action: 'Removed',
      cardName: card.name,
      collectionName: collection.name,
      quantity: quantity,
      timestamp: timestamp,
      time: this.formatTimeAgo(timestamp)
    };
    
    userData.recentActivity.unshift(activityEntry);
    
    // Keep only last 50 activities
    if (userData.recentActivity.length > 50) {
      userData.recentActivity = userData.recentActivity.slice(0, 50);
    }

    return this.saveUserData(userData)
  }

  // Calculate card value based on condition, variant, grade, etc.
  calculateCardValue(cardData, condition, variant, grade, gradingService) {
    // This would integrate with your pricing service
    // For now, return a base value
    const baseValue = cardData.tcgplayer?.prices?.holofoil?.market || 
                     cardData.tcgplayer?.prices?.normal?.market || 
                     cardData.currentValue || 0

    // Apply condition multiplier
    const conditionMultipliers = {
      'Near Mint': 1.0,
      'Lightly Played': 0.8,
      'Moderately Played': 0.6,
      'Heavily Played': 0.4,
      'Damaged': 0.2
    }

    const conditionMultiplier = conditionMultipliers[condition] || 1.0

    // Apply variant multiplier
    const variantMultipliers = {
      'Normal': 1.0,
      'Holo': 1.2,
      'Reverse Holo': 1.1,
      'Foil': 1.3
    }

    const variantMultiplier = variantMultipliers[variant] || 1.0

    // Apply grading multiplier (if graded)
    let gradingMultiplier = 1.0
    if (grade && gradingService) {
      // This would be more sophisticated in reality
      gradingMultiplier = 1.5 + (parseFloat(grade) / 10) * 0.5
    }

    return baseValue * conditionMultiplier * variantMultiplier * gradingMultiplier
  }

  // Calculate total collection value
  calculateCollectionValue(collection) {
    return collection.cards.reduce((total, card) => {
      return total + (card.currentValue * card.quantity)
    }, 0)
  }

  // Add activity to recent activity
  addActivity(activity) {
    const userData = this.getUserData()
    if (!userData) return false

    const activityEntry = {
      id: `activity-${Date.now()}`,
      ...activity,
      time: this.formatTimeAgo(activity.timestamp)
    }
    
    userData.recentActivity.unshift(activityEntry)
    
    // Keep only last 50 activities
    if (userData.recentActivity.length > 50) {
      userData.recentActivity = userData.recentActivity.slice(0, 50)
    }

    return this.saveUserData(userData)
  }

  // Format timestamp to "time ago" format
  formatTimeAgo(timestamp) {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now - time) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    
    const diffInMonths = Math.floor(diffInDays / 30)
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  }

  // Get total cards across all collections
  getTotalCards() {
    const userData = this.getUserData()
    if (!userData) return 0

    return userData.collections.reduce((total, collection) => {
      return total + (collection.totalCards || 0)
    }, 0)
  }

  // Get cards added this month
  getCardsAddedThisMonth() {
    const userData = this.getUserData()
    if (!userData) return 0

    const thisMonth = new Date()
    thisMonth.setDate(1) // First day of month

    return userData.recentActivity.filter(activity => {
      if (activity.type !== 'add') return false
      const activityDate = new Date(activity.timestamp)
      return activityDate >= thisMonth
    }).reduce((total, activity) => total + (activity.quantity || 1), 0)
  }

  // Get recent activity (last 3 items)
  getRecentActivity(limit = 3) {
    const userData = this.getUserData()
    if (!userData) return []

    return userData.recentActivity.slice(0, limit)
  }

  // Create new collection
  createCollection(name, description = '') {
    const userData = this.getUserData()
    if (!userData) return false

    const newCollection = {
      id: `collection-${Date.now()}`,
      name: name,
      description: description,
      totalValue: 0,
      totalCards: 0,
      monthlyChange: 0,
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      cardsAddedThisWeek: 0,
      valueChangeThisWeek: 0,
      isUserCreated: true,
      cards: []
    }

    userData.collections.push(newCollection)
    userData.portfolioHistory[newCollection.id] = {
      '1D': [],
      '7D': [],
      '1M': [],
      '3M': [],
      '6M': [],
      '1Y': [],
      'MAX': []
    }

    return this.saveUserData(userData)
  }

  // Update portfolio history (this would be called periodically)
  updatePortfolioHistory(collectionId, timeRange, value) {
    const userData = this.getUserData()
    if (!userData) return false

    if (!userData.portfolioHistory[collectionId]) {
      userData.portfolioHistory[collectionId] = {
        '1D': [],
        '7D': [],
        '1M': [],
        '3M': [],
        '6M': [],
        '1Y': [],
        'MAX': []
      }
    }

    const historyEntry = {
      date: new Date().toISOString(),
      value: value
    }

    userData.portfolioHistory[collectionId][timeRange].push(historyEntry)

    // Keep only last 30 entries per time range
    if (userData.portfolioHistory[collectionId][timeRange].length > 30) {
      userData.portfolioHistory[collectionId][timeRange] = 
        userData.portfolioHistory[collectionId][timeRange].slice(-30)
    }

    return this.saveUserData(userData)
  }
}

export default new UserDatabaseService()

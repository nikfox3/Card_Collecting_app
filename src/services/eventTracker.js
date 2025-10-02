/**
 * Event Tracking Service
 * Handles timestamping and tracking of all app events
 */

class EventTracker {
  constructor() {
    this.events = this.loadEvents()
    this.maxEvents = 1000 // Keep last 1000 events
  }

  /**
   * Load events from localStorage
   */
  loadEvents() {
    try {
      const stored = localStorage.getItem('cardApp_events')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading events:', error)
      return []
    }
  }

  /**
   * Save events to localStorage
   */
  saveEvents() {
    try {
      localStorage.setItem('cardApp_events', JSON.stringify(this.events))
    } catch (error) {
      console.error('Error saving events:', error)
    }
  }

  /**
   * Add a new event
   * @param {string} type - Event type (card_added, card_removed, price_updated, etc.)
   * @param {Object} data - Event data
   * @param {string} userId - User identifier
   */
  addEvent(type, data = {}, userId = 'default') {
    const event = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type,
      data,
      userId,
      version: '1.0'
    }

    this.events.unshift(event) // Add to beginning of array

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents)
    }

    this.saveEvents()
    return event
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get events by type
   * @param {string} type - Event type to filter by
   * @param {number} limit - Maximum number of events to return
   */
  getEventsByType(type, limit = 50) {
    return this.events
      .filter(event => event.type === type)
      .slice(0, limit)
  }

  /**
   * Get recent events
   * @param {number} limit - Maximum number of events to return
   */
  getRecentEvents(limit = 50) {
    return this.events.slice(0, limit)
  }

  /**
   * Get events within a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   */
  getEventsByDateRange(startDate, endDate) {
    return this.events.filter(event => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= startDate && eventDate <= endDate
    })
  }

  /**
   * Get events for a specific card
   * @param {string} cardId - Card ID to filter by
   */
  getCardEvents(cardId) {
    return this.events.filter(event => 
      event.data.cardId === cardId || 
      event.data.card?.id === cardId
    )
  }

  /**
   * Get events for a specific collection
   * @param {string} collectionId - Collection ID to filter by
   */
  getCollectionEvents(collectionId) {
    return this.events.filter(event => 
      event.data.collectionId === collectionId ||
      event.data.collection?.id === collectionId
    )
  }

  /**
   * Clear all events
   */
  clearAllEvents() {
    this.events = []
    this.saveEvents()
  }

  /**
   * Clear events older than specified days
   * @param {number} days - Number of days to keep
   */
  clearOldEvents(days = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    this.events = this.events.filter(event => 
      new Date(event.timestamp) > cutoffDate
    )
    
    this.saveEvents()
  }

  /**
   * Get event statistics
   */
  getEventStats() {
    const stats = {
      totalEvents: this.events.length,
      eventsByType: {},
      recentActivity: 0
    }

    // Count events by type
    this.events.forEach(event => {
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1
    })

    // Count events in last 24 hours
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    stats.recentActivity = this.events.filter(event => 
      new Date(event.timestamp) > oneDayAgo
    ).length

    return stats
  }

  // Predefined event types and their data structures
  static EVENT_TYPES = {
    CARD_ADDED: 'card_added',
    CARD_REMOVED: 'card_removed',
    CARD_UPDATED: 'card_updated',
    CARD_MOVED: 'card_moved',
    PRICE_UPDATED: 'price_updated',
    COLLECTION_CREATED: 'collection_created',
    COLLECTION_DELETED: 'collection_deleted',
    COLLECTION_RENAMED: 'collection_renamed',
    DECK_CREATED: 'deck_created',
    DECK_DELETED: 'deck_deleted',
    BINDER_CREATED: 'binder_created',
    BINDER_DELETED: 'binder_deleted',
    FOLDER_CREATED: 'folder_created',
    FOLDER_DELETED: 'folder_deleted',
    SCAN_PERFORMED: 'scan_performed',
    SEARCH_PERFORMED: 'search_performed',
    FILTER_APPLIED: 'filter_applied',
    SORT_APPLIED: 'sort_applied',
    EXPORT_PERFORMED: 'export_performed',
    IMPORT_PERFORMED: 'import_performed',
    SETTINGS_CHANGED: 'settings_changed',
    BACKUP_CREATED: 'backup_created',
    BACKUP_RESTORED: 'backup_restored'
  }

  // Helper methods for common events
  trackCardAdded(card, collectionId, quantity = 1, condition = 'Near Mint') {
    return this.addEvent(EventTracker.EVENT_TYPES.CARD_ADDED, {
      cardId: card.id,
      cardName: card.name,
      cardSet: card.set?.name || card.set,
      collectionId,
      quantity,
      condition,
      price: card.currentValue || card.price || 0,
      card: {
        id: card.id,
        name: card.name,
        set: card.set,
        rarity: card.rarity,
        number: card.number
      }
    })
  }

  trackCardRemoved(card, collectionId, quantity = 1) {
    return this.addEvent(EventTracker.EVENT_TYPES.CARD_REMOVED, {
      cardId: card.id,
      cardName: card.name,
      cardSet: card.set?.name || card.set,
      collectionId,
      quantity,
      card: {
        id: card.id,
        name: card.name,
        set: card.set,
        rarity: card.rarity,
        number: card.number
      }
    })
  }

  trackCardUpdated(card, collectionId, changes) {
    return this.addEvent(EventTracker.EVENT_TYPES.CARD_UPDATED, {
      cardId: card.id,
      cardName: card.name,
      cardSet: card.set?.name || card.set,
      collectionId,
      changes,
      card: {
        id: card.id,
        name: card.name,
        set: card.set,
        rarity: card.rarity,
        number: card.number
      }
    })
  }

  trackPriceUpdated(card, oldPrice, newPrice, source = 'api') {
    return this.addEvent(EventTracker.EVENT_TYPES.PRICE_UPDATED, {
      cardId: card.id,
      cardName: card.name,
      cardSet: card.set?.name || card.set,
      oldPrice,
      newPrice,
      priceChange: newPrice - oldPrice,
      priceChangePercent: oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0,
      source,
      card: {
        id: card.id,
        name: card.name,
        set: card.set,
        rarity: card.rarity,
        number: card.number
      }
    })
  }

  trackCollectionCreated(collection) {
    return this.addEvent(EventTracker.EVENT_TYPES.COLLECTION_CREATED, {
      collectionId: collection.id,
      collectionName: collection.name,
      collection: {
        id: collection.id,
        name: collection.name,
        totalCards: collection.totalCards || 0,
        totalValue: collection.totalValue || 0
      }
    })
  }

  trackScanPerformed(cardsFound, scanType = 'manual') {
    return this.addEvent(EventTracker.EVENT_TYPES.SCAN_PERFORMED, {
      cardsFound: cardsFound.length,
      scanType,
      cards: cardsFound.map(card => ({
        id: card.id,
        name: card.name,
        set: card.set?.name || card.set
      }))
    })
  }

  trackSearchPerformed(query, resultsCount, filters = {}) {
    return this.addEvent(EventTracker.EVENT_TYPES.SEARCH_PERFORMED, {
      query,
      resultsCount,
      filters
    })
  }

  trackFilterApplied(filters) {
    return this.addEvent(EventTracker.EVENT_TYPES.FILTER_APPLIED, {
      filters
    })
  }

  trackSortApplied(sortType) {
    return this.addEvent(EventTracker.EVENT_TYPES.SORT_APPLIED, {
      sortType
    })
  }
}

// Create singleton instance
const eventTracker = new EventTracker()

export default eventTracker

import React, { useState, useEffect } from 'react'
import eventTracker from '../services/eventTracker.js'

const EventHistory = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadEvents()
    }
  }, [isOpen, filterType])

  const loadEvents = () => {
    setLoading(true)
    try {
      let filteredEvents
      if (filterType === 'all') {
        filteredEvents = eventTracker.getRecentEvents(100)
      } else {
        filteredEvents = eventTracker.getEventsByType(filterType, 100)
      }
      setEvents(filteredEvents)
    } catch (error) {
      console.error('Error loading events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getEventIcon = (type) => {
    const icons = {
      card_added: '➕',
      card_removed: '➖',
      card_updated: '✏️',
      card_moved: '📦',
      price_updated: '💰',
      collection_created: '📁',
      collection_deleted: '🗑️',
      collection_renamed: '✏️',
      deck_created: '🃏',
      deck_deleted: '🗑️',
      binder_created: '📚',
      binder_deleted: '🗑️',
      folder_created: '📂',
      folder_deleted: '🗑️',
      scan_performed: '📷',
      search_performed: '🔍',
      filter_applied: '🔽',
      sort_applied: '🔄',
      export_performed: '📤',
      import_performed: '📥',
      settings_changed: '⚙️',
      backup_created: '💾',
      backup_restored: '📀'
    }
    return icons[type] || '📝'
  }

  const getEventDescription = (event) => {
    const { type, data } = event
    
    switch (type) {
      case 'card_added':
        return `Added ${data.quantity}x ${data.cardName} to ${data.collectionId}`
      case 'card_removed':
        return `Removed ${data.quantity}x ${data.cardName} from ${data.collectionId}`
      case 'card_updated':
        return `Updated ${data.cardName} in ${data.collectionId}`
      case 'price_updated':
        return `Price updated for ${data.cardName}: $${data.oldPrice} → $${data.newPrice}`
      case 'collection_created':
        return `Created collection: ${data.collectionName}`
      case 'scan_performed':
        return `Scanned ${data.cardsFound} card(s) (${data.scanType})`
      case 'search_performed':
        return `Searched for "${data.query}" (${data.resultsCount} results)`
      case 'filter_applied':
        return `Applied filters: ${Object.keys(data.filters).join(', ')}`
      case 'sort_applied':
        return `Sorted by: ${data.sortType}`
      default:
        return `${type.replace(/_/g, ' ')}`
    }
  }

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'card_added', label: 'Cards Added' },
    { value: 'card_removed', label: 'Cards Removed' },
    { value: 'card_updated', label: 'Cards Updated' },
    { value: 'price_updated', label: 'Price Updates' },
    { value: 'collection_created', label: 'Collections Created' },
    { value: 'scan_performed', label: 'Scans' },
    { value: 'search_performed', label: 'Searches' },
    { value: 'filter_applied', label: 'Filters' },
    { value: 'sort_applied', label: 'Sorts' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-[#2b2b2b] rounded-2xl w-full max-w-2xl max-h-[80vh] border border-gray-700/50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 className="text-xl font-bold text-white">Event History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-700/50">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No events found
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-colors"
                >
                  <div className="text-2xl flex-shrink-0">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {getEventDescription(event)}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {formatTimestamp(event.timestamp)}
                    </p>
                    {event.data.cardSet && (
                      <p className="text-gray-500 text-xs mt-1">
                        Set: {event.data.cardSet}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{events.length} events</span>
            <button
              onClick={() => {
                eventTracker.clearAllEvents()
                loadEvents()
              }}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventHistory

import React, { useState, useEffect } from 'react'
import databaseUpdater from '../services/databaseUpdater.js'
import pokemonDataImporter from '../services/pokemonDataImporter.js'

const DatabaseManager = ({ isOpen, onClose }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [updateStatus, setUpdateStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Initialize on component mount
  useEffect(() => {
    if (isOpen) {
      initializeDatabase()
    }
  }, [isOpen])

  const initializeDatabase = async () => {
    setIsLoading(true)
    setUpdateStatus('Initializing database...')
    
    try {
      const success = await databaseUpdater.initialize()
      if (success) {
        setIsInitialized(true)
        setUpdateStatus('Database initialized successfully!')
        loadStats()
      } else {
        setUpdateStatus('Failed to initialize database')
      }
    } catch (error) {
      console.error('Error initializing database:', error)
      setUpdateStatus('Error initializing database')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = () => {
    const databaseStats = databaseUpdater.getDatabaseStats()
    setStats(databaseStats)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await databaseUpdater.searchCards(searchQuery, { limit: 20 })
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleUpdateCollection = async () => {
    if (!isInitialized) return

    setIsLoading(true)
    setUpdateStatus('Updating collection cards...')
    
    try {
      const updated = await databaseUpdater.updateCollectionCardsWithEnhancedData('pokemon-collection')
      if (updated) {
        setUpdateStatus('Collection updated successfully!')
        loadStats()
      } else {
        setUpdateStatus('No cards needed updating')
      }
    } catch (error) {
      console.error('Error updating collection:', error)
      setUpdateStatus('Error updating collection')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Pokemon TCG Database Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Status Section */}
          <div className="mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Database Status</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white">
                    {isInitialized ? 'Database Loaded' : 'Database Not Loaded'}
                  </span>
                </div>
                {isLoading && (
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                )}
                {updateStatus && (
                  <p className="text-gray-300 text-sm">{updateStatus}</p>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Database Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">{stats.totalCards.toLocaleString()}</div>
                  <div className="text-sm text-gray-300">Total Cards</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{stats.totalSets}</div>
                  <div className="text-sm text-gray-300">Sets</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">{stats.cardsWithImages.toLocaleString()}</div>
                  <div className="text-sm text-gray-300">Cards with Images</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-400">{stats.cardsWithPrices.toLocaleString()}</div>
                  <div className="text-sm text-gray-300">Cards with Prices</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={initializeDatabase}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {isLoading ? 'Loading...' : 'Initialize Database'}
              </button>
              <button
                onClick={handleUpdateCollection}
                disabled={!isInitialized || isLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Update Collection
              </button>
              <button
                onClick={loadStats}
                disabled={!isInitialized}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Refresh Stats
              </button>
            </div>
          </div>

          {/* Search Section */}
          {isInitialized && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Search Database</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for cards..."
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Search Results ({searchResults.length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((card, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-600 rounded">
                        {card.images?.small && (
                          <img 
                            src={card.images.small} 
                            alt={card.name}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="text-white font-medium">{card.name}</div>
                          <div className="text-gray-300 text-sm">{card.set} • {card.rarity}</div>
                          {card.currentValue > 0 && (
                            <div className="text-green-400 text-sm">${card.currentValue.toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatabaseManager


import React, { useState, useEffect, useRef, useMemo } from 'react'

// Marketplace Card Component
const MarketplaceCard = ({ platform, cardName, setName, rarity, cardNumber, price, onClick, isCollection = false, isSelected = false, onPressStart, onPressEnd, onTouchStart, onTouchEnd, onTouchMove, cardImage, quantity = 1, onAddToCollection }) => {
  const affiliateLinks = {
    'TCGPlayer': 'https://www.tcgplayer.com',
    'eBay': 'https://www.ebay.com',
    'Whatnot': 'https://www.whatnot.com',
    'Drip': 'https://www.drip.com',
    'Fanatics': 'https://www.fanaticsollect.com'
  }

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling
    
    if (isCollection) {
      // Collection mode - only trigger onClick (no external links)
      if (onClick) onClick(e)
    } else {
      // Marketplace mode - open affiliate link
      window.open(affiliateLinks[platform] || '#', '_blank')
      if (onClick) onClick(e)
    }
  }

  const cardClasses = `flex-shrink-0 w-[125px] sm:w-[140px] md:w-[155px] lg:w-[170px] xl:w-[185px] cursor-pointer hover:transform hover:scale-105 transition-transform ${
    isCollection && isSelected ? 'ring-2 ring-[#8871FF] bg-[#8871FF]/10' : ''
  }`

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      onMouseDown={isCollection ? onPressStart : undefined}
      onMouseUp={isCollection ? onPressEnd : undefined}
      onMouseLeave={isCollection ? onPressEnd : undefined}
      onTouchStart={isCollection ? onTouchStart : undefined}
      onTouchEnd={isCollection ? onTouchEnd : undefined}
      onTouchMove={isCollection ? onTouchMove : undefined}
    >
      <div className="bg-[#202020] rounded-[4px] p-[6px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        {/* Card Image */}
        <div className="aspect-[3/4] bg-gray-700 rounded mb-1 flex items-center justify-center overflow-hidden relative">
          {cardImage && cardImage !== '/placeholder-card.png' ? (
            <img 
              src={cardImage} 
              alt={cardName} 
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log(`Image failed to load for ${cardName}:`, cardImage)
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
              onLoad={() => {
                console.log(`Image loaded successfully for ${cardName}:`, cardImage)
              }}
            />
          ) : null}
          <span className="text-gray-400 text-xs" style={{ display: (cardImage && cardImage !== '/placeholder-card.png') ? 'none' : 'flex' }}>
            {cardImage === '/placeholder-card.png' ? 'No Image' : 'Card Image'}
          </span>
          {isCollection && isSelected && (
            <div className="absolute top-1 right-1 w-5 h-5 bg-[#8871FF] rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Card Info */}
        <div className="space-y-3">
          {/* Card Name */}
          <div className="text-white text-[14px] sm:text-[15px] md:text-[16px] font-bold leading-[normal]">
            <p className="truncate">{cardName}</p>
          </div>
          
          {/* Card Details */}
          <div className="text-white text-[12px] sm:text-[13px] md:text-[14px] space-y-1">
            <p className="truncate">{setName}</p>
            <p className="truncate">{rarity}</p>
            <p className="whitespace-pre">{cardNumber}</p>
          </div>
          
          {/* Price and Quantity */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[#8871FF] text-[14px] sm:text-[15px] md:text-[16px] font-black" title={`Raw price data: ${price}`}>
                {price}
              </span>
              {isCollection && (
                <div className="flex items-center gap-1 text-white text-[12px] sm:text-[13px] md:text-[14px]">
                  <span>Qty:</span>
                  <span>{quantity}</span>
                </div>
              )}
            </div>
            {!isCollection && onAddToCollection && (
              <svg 
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCollection();
                }}
                className="h-6 w-6 cursor-pointer hover:opacity-80 transition-opacity"
                viewBox="0 0 31 31" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <mask id="mask0_253_3934" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="2" y="1" width="28" height="28">
                  <path d="M25.9542 2.85913H5.27307C4.13088 2.85913 3.20496 3.78506 3.20496 4.92724V25.6084C3.20496 26.7506 4.13088 27.6765 5.27307 27.6765H25.9542C27.0964 27.6765 28.0223 26.7506 28.0223 25.6084V4.92724C28.0223 3.78506 27.0964 2.85913 25.9542 2.85913Z" fill="white" stroke="white" strokeWidth="2.14869" strokeLinejoin="round"/>
                  <path d="M15.6138 9.75293V20.7829M10.0989 15.2679H21.1288" stroke="black" strokeWidth="2.14869" strokeLinecap="round" strokeLinejoin="round"/>
                </mask>
                <g mask="url(#mask0_253_3934)">
                  <path d="M-0.931274 -1.2771H32.1586V31.8127H-0.931274V-1.2771Z" fill="#605DEC"/>
                </g>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
import cardService from './services/cardService'
import priceService from './services/priceService'
import tcgplayerService from './services/tcgplayerService'
import userDatabase from './services/userDatabase'
import cardDataMigration from './services/cardDataMigration.js'
import './styles/holographic.css'
import './styles/card-rarities.css'
import HolographicCard from './components/HolographicCard'
import SearchBar from './components/SearchBar'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Signup form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [username, setUsername] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmSignupPassword, setConfirmSignupPassword] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('US')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  
  // Dashboard state
  const [searchQuery, setSearchQuery] = useState('')
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('')
  
  // Marketplace state
  const [marketplaceSearchQuery, setMarketplaceSearchQuery] = useState('')
  const [trendingProducts, setTrendingProducts] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [selectedCollection, setSelectedCollection] = useState('pokemon-collection')
  const [selectedTimeRange, setSelectedTimeRange] = useState('6M')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false)
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [collectionSortOption, setCollectionSortOption] = useState('name')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [defaultLanguage, setDefaultLanguage] = useState('english')
  const [filterSettings, setFilterSettings] = useState({
    cardStatus: 'all', // all, duplicates, wishlisted
    languages: [], // array of selected languages - empty means show all
    products: [], // cards, sealed - empty means show all
    energies: [], // array of selected energies - empty means show all
    supertype: [], // pokemon, trainer, energy - empty means show all
    rarityType: 'international', // international, japanese
    rarities: [], // array of selected rarities - empty means show all
    variants: [], // normal, holos, reverse_holos, first_editions - empty means show all
    formats: [], // unlimited, expanded, standard - empty means show all
    regulationMarkings: [], // A, B, C, D, E, F, G, H, I - empty means show all
    conditions: [] // near_mint, lightly_played, moderately_played, heavily_played, damaged - empty means show all
  })
  const [showCollectionCardActions, setShowCollectionCardActions] = useState(false)
  const [selectedCollectionCard, setSelectedCollectionCard] = useState(null)
  const [collectionCardActionsPosition, setCollectionCardActionsPosition] = useState({ x: 0, y: 0 })
  const [selectedCollectionCards, setSelectedCollectionCards] = useState(new Set())
  const [isCollectionMultiSelectMode, setIsCollectionMultiSelectMode] = useState(false)

  const [longPressTimer, setLongPressTimer] = useState(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const [touchStartPosition, setTouchStartPosition] = useState(null)
  const [scrollTimeout, setScrollTimeout] = useState(null)
  const [lastTapTime, setLastTapTime] = useState(0)
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false)
  const [availableFolders, setAvailableFolders] = useState([])
  const [showAddToDeckModal, setShowAddToDeckModal] = useState(false)
  const [availableDecks, setAvailableDecks] = useState([])
  const [showAddToBinderModal, setShowAddToBinderModal] = useState(false)
  const [availableBinders, setAvailableBinders] = useState([])
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [showCollectionsModal, setShowCollectionsModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showTopMoversModal, setShowTopMoversModal] = useState(false)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const [showSlidingMenu, setShowSlidingMenu] = useState(false)

  // Real user data from database
  const [userData, setUserData] = useState(null)
  const [recentActivityData, setRecentActivityData] = useState([])
  const [displayedActivity, setDisplayedActivity] = useState([])

  // State for real data
  const [topMoversData, setTopMoversData] = useState([])
  const [trendingCardsData, setTrendingCardsData] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Load user data from database
  useEffect(() => {
    const loadUserData = () => {
      const data = userDatabase.getUserData()
      if (data) {
        // Clean up duplicates in all collections automatically
        data.collections?.forEach(collection => {
          userDatabase.cleanupDuplicates(collection.id)
        })
        
        // Get the cleaned data
        const cleanedData = userDatabase.getUserData()
        setUserData(cleanedData)
        setRecentActivityData(cleanedData.recentActivity || [])
        setDisplayedActivity((cleanedData.recentActivity || []).slice(0, 3))
        
        // Fetch missing data for the selected collection
        if (selectedCollection) {
          userDatabase.fetchMissingCardData(selectedCollection).then(success => {
            if (success) {
              const updatedData = userDatabase.getUserData()
              setUserData(updatedData)
              console.log('Missing card data fetched automatically')
            }
          })
        }
      }
    }
    loadUserData()
  }, [])

  // Fetch missing data when selected collection changes
  useEffect(() => {
    if (selectedCollection && userData) {
      userDatabase.fetchMissingCardData(selectedCollection).then(success => {
        if (success) {
          const updatedData = userDatabase.getUserData()
          setUserData(updatedData)
          console.log('Missing card data fetched for collection:', selectedCollection)
        }
      })
    }
  }, [selectedCollection])

  // Load real data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true)
        
        // Initialize card data migration service
        await cardDataMigration.initialize()
        
        // Load real data from database
        const [topMovers, trending] = await Promise.all([
          cardService.getTopMovers(),
          cardService.getTrendingCards()
        ])
        
        // Transform the data and add mock properties for compatibility
        const transformedTopMovers = topMovers.map((card, index) => {
          const transformed = cardService.transformCard(card)
          return {
            ...transformed,
            id: transformed.id || index + 1,
            change: Math.random() * 50 - 25, // Mock change percentage
            dailyChange: Math.random() * 200 - 100, // Mock daily change
            quantity: Math.floor(Math.random() * 5) + 1, // Mock quantity
            rank: index + 1, // Mock rank
            type: transformed.price > 200 ? 'gain' : 'loss' // Mock type based on price
          }
        })
        
        const transformedTrending = trending.map((card, index) => {
          const transformed = cardService.transformCard(card)
          return {
            ...transformed,
            id: transformed.id || index + 1,
            change: Math.random() * 30 - 15, // Mock change percentage
            rank: index + 1 // Mock rank
          }
        })
        
        setTopMoversData(transformedTopMovers)
        setTrendingCardsData(transformedTrending)
        
      } catch (error) {
        console.error('Error loading card data:', error)
        // Fall back to mock data if API fails
        setTopMoversData(mockTopMoversData)
        setTrendingCardsData(mockTrendingCardsData)
      } finally {
        setIsLoadingData(false)
      }
    }
    
    loadData()
  }, [])

  // Mock top movers data with real Pokemon card IDs (fallback)
  const mockTopMoversData = [
    { 
      id: 1, 
      name: "Charizard ex", 
      set: "Base Set", 
      rarity: "Ultra Rare", 
      number: "#004/102", 
      price: 1250, 
      change: 24.5, 
      dailyChange: 245, 
      quantity: 2, 
      rank: 1, 
      type: "gain", 
      emoji: "🔥", 
      cardId: "base1-4", 
      imageUrl: "https://images.pokemontcg.io/base1/4_hires.png", 
      artist: "Mitsuhiro Arita",
      hp: 120,
      pokemonType: "Fire",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Energy Burn",
          description: "As often as you like during your turn (before your attack), you may turn all Energy attached to Charizard into Fire Energy for the rest of the turn. This power can't be used if Charizard is Asleep, Confused, or Paralyzed."
        }
      ],
      attacks: [
        {
          cost: ["Fire", "Fire", "Fire", "Fire"],
          name: "Fire Spin",
          damage: "100",
          description: "Discard 2 Energy cards attached to Charizard in order to use this attack."
        }
      ]
    },
    { 
      id: 2, 
      name: "Blastoise ex", 
      set: "Base Set", 
      rarity: "Ultra Rare", 
      number: "#009/102", 
      price: 890, 
      change: 18.2, 
      dailyChange: 137, 
      quantity: 1, 
      rank: 2, 
      type: "gain", 
      emoji: "⚡", 
      cardId: "base1-2", 
      imageUrl: "https://images.pokemontcg.io/base1/2_hires.png", 
      artist: "Atsuko Nishida",
      hp: 100,
      pokemonType: "Water",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Rain Dance",
          description: "As often as you like during your turn (before your attack), you may attach a Water Energy card from your hand to 1 of your Water Pokémon. (This doesn't use up your 1 Energy card attachment for the turn.)"
        }
      ],
      attacks: [
        {
          cost: ["Water", "Water", "Water"],
          name: "Hydro Pump",
          damage: "40+",
          description: "This attack does 10 more damage for each Water Energy attached to this Pokémon."
        }
      ]
    },
    { 
      id: 3, 
      name: "Venusaur ex", 
      set: "Base Set", 
      rarity: "Ultra Rare", 
      number: "#015/102", 
      price: 650, 
      change: -12.8, 
      dailyChange: -95, 
      quantity: 3, 
      rank: 3, 
      type: "loss", 
      emoji: "🌿", 
      cardId: "base1-15", 
      imageUrl: "https://images.pokemontcg.io/base1/15_hires.png", 
      artist: "Atsuko Nishida",
      hp: 100,
      pokemonType: "Grass",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Energy Trans",
          description: "As often as you like during your turn (before your attack), you may take 1 Grass Energy card attached to 1 of your Pokémon and attach it to a different one."
        }
      ],
      attacks: [
        {
          cost: ["Grass", "Grass", "Grass", "Grass"],
          name: "Solar Beam",
          damage: "60",
          description: "This attack does 20 damage to each of your opponent's Benched Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)"
        }
      ]
    },
    { 
      id: 4, 
      name: "Pikachu VMAX", 
      set: "Vivid Voltage", 
      rarity: "VMAX", 
      number: "#044/185", 
      price: 89, 
      change: 15.2, 
      dailyChange: 12, 
      quantity: 1, 
      rank: 4, 
      type: "gain", 
      emoji: "⚡", 
      cardId: "swsh4-44", 
      imageUrl: "https://images.pokemontcg.io/swsh4/44_hires.png", 
      artist: "Atsuko Nishida",
      hp: 320,
      pokemonType: "Lightning",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Max Spark",
          description: "Once during your turn (before your attack), you may search your deck for up to 2 Lightning Energy cards and attach them to this Pokémon. Then, shuffle your deck."
        }
      ],
      attacks: [
        {
          cost: ["Lightning", "Lightning", "Colorless"],
          name: "G-Max Volt Crash",
          damage: "180",
          description: "This attack does 30 damage to each of your opponent's Benched Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)"
        }
      ]
    },
    { 
      id: 5, 
      name: "Lugia V", 
      set: "Silver Tempest", 
      rarity: "Ultra Rare", 
      number: "#186/195", 
      price: 156, 
      change: 22.8, 
      dailyChange: 29, 
      quantity: 2, 
      rank: 5, 
      type: "gain", 
      emoji: "🌊", 
      cardId: "swsh12-186", 
      imageUrl: "https://images.pokemontcg.io/swsh12/186_hires.png", 
      artist: "Hitoshi Ariga",
      hp: 220,
      pokemonType: "Colorless",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Aero Dive",
          description: "Once during your turn (before your attack), you may discard 2 cards from your hand. If you do, draw 2 cards."
        }
      ],
      attacks: [
        {
          cost: ["Colorless", "Colorless", "Colorless"],
          name: "Aeroblast",
          damage: "120",
          description: "You may discard a Stadium card in play."
        }
      ]
    },
    { 
      id: 6, 
      name: "Rayquaza VMAX", 
      set: "Evolving Skies", 
      rarity: "VMAX", 
      number: "#217/203", 
      price: 234, 
      change: 8.4, 
      dailyChange: 18, 
      quantity: 1, 
      rank: 6, 
      type: "gain", 
      emoji: "🌿", 
      cardId: "swsh7-217", 
      imageUrl: "https://images.pokemontcg.io/swsh7/217_hires.png", 
      artist: "Ryuta Fuse",
      hp: 320,
      pokemonType: "Dragon",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Azure Pulse",
          description: "Once during your turn, you may discard your hand and draw 3 cards."
        }
      ],
      attacks: [
        {
          cost: ["Fire", "Lightning"],
          name: "Max Burst",
          damage: "20+",
          description: "You may discard any number of Fire or Lightning Energy from this Pokémon; this attack does 80 more damage for each Energy card discarded in this way."
        }
      ]
    },
    { 
      id: 7, 
      name: "Mewtwo V", 
      set: "Pokemon GO", 
      rarity: "Ultra Rare", 
      number: "#030/071", 
      price: 67, 
      change: 12.1, 
      dailyChange: 7, 
      quantity: 3, 
      rank: 7, 
      type: "gain", 
      emoji: "✨", 
      cardId: "pgo-30", 
      imageUrl: "https://images.pokemontcg.io/pgo/30_hires.png", 
      artist: "Mitsuhiro Arita",
      hp: 220,
      pokemonType: "Psychic",
      abilities: [],
      attacks: [
        {
          cost: ["Psychic"],
          name: "Super Psy Bolt",
          damage: "50",
          description: ""
        },
        {
          cost: ["Psychic", "Psychic", "Colorless"],
          name: "Transfer Break",
          damage: "160",
          description: "Move an Energy from this Pokémon to 1 of your Benched Pokémon."
        }
      ]
    },
    { 
      id: 8, 
      name: "Gengar VMAX", 
      set: "Fusion Strike", 
      rarity: "VMAX", 
      number: "#271/264", 
      price: 45, 
      change: -8.3, 
      dailyChange: -4, 
      quantity: 2, 
      rank: 8, 
      type: "loss", 
      emoji: "👻", 
      cardId: "swsh9-271", 
      imageUrl: "https://images.pokemontcg.io/swsh9/271_hires.png", 
      artist: "Ryuta Fuse",
      hp: 320,
      pokemonType: "Psychic",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Shadow Tag",
          description: "Once during your turn (before your attack), you may switch 1 of your opponent's Benched Pokémon with their Active Pokémon."
        }
      ],
      attacks: [
        {
          cost: ["Psychic", "Psychic", "Colorless"],
          name: "G-Max Terror",
          damage: "180",
          description: "The Defending Pokémon can't retreat during your opponent's next turn."
        }
      ]
    }
  ]

  // Mock trending cards data with real Pokemon card IDs (fallback)
  const mockTrendingCardsData = [
    { 
      id: 1, 
      name: "Pikachu VMAX", 
      set: "Vivid Voltage", 
      rarity: "VMAX", 
      number: "#044/185", 
      price: 89, 
      change: 15.2, 
      rank: 1, 
      emoji: "🔥", 
      color: "orange", 
      cardId: "swsh4-44", 
      imageUrl: "https://images.pokemontcg.io/swsh4/44_hires.png", 
      artist: "Atsuko Nishida",
      hp: 320,
      pokemonType: "Lightning",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Volt Tackle",
          description: "Once during your turn (before your attack), you may search your deck for a Lightning Energy card and attach it to this Pokémon. Then, shuffle your deck."
        }
      ],
      attacks: [
        {
          cost: ["Lightning", "Lightning", "Colorless"],
          name: "G-Max Volt Crash",
          damage: "180",
          description: "This attack does 30 damage to each of your opponent's Benched Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)"
        }
      ]
    },
    { 
      id: 2, 
      name: "Lugia V", 
      set: "Silver Tempest", 
      rarity: "Ultra Rare", 
      number: "#186/195", 
      price: 156, 
      change: 22.8, 
      rank: 2, 
      emoji: "⚡", 
      color: "blue", 
      cardId: "swsh12-186", 
      imageUrl: "https://images.pokemontcg.io/swsh12/186_hires.png", 
      artist: "Hitoshi Ariga",
      hp: 220,
      pokemonType: "Colorless",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Aeroblast",
          description: "Once during your turn (before your attack), you may discard 2 cards from your hand. If you do, draw 2 cards."
        }
      ],
      attacks: [
        {
          cost: ["Colorless", "Colorless", "Colorless"],
          name: "Wind Storm",
          damage: "120",
          description: "You may discard a Stadium card in play."
        }
      ]
    },
    { 
      id: 3, 
      name: "Rayquaza VMAX", 
      set: "Evolving Skies", 
      rarity: "VMAX", 
      number: "#217/203", 
      price: 234, 
      change: 8.4, 
      rank: 3, 
      emoji: "🌿", 
      color: "green", 
      cardId: "swsh7-217", 
      imageUrl: "https://images.pokemontcg.io/swsh7/217_hires.png", 
      artist: "Ryuta Fuse",
      hp: 320,
      pokemonType: "Dragon",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Azure Pulse",
          description: "Once during your turn, you may discard your hand and draw 3 cards."
        }
      ],
      attacks: [
        {
          cost: ["Fire", "Lightning"],
          name: "Max Burst",
          damage: "20+",
          description: "You may discard any number of Fire or Lightning Energy from this Pokémon; this attack does 80 more damage for each Energy card discarded in this way."
        }
      ]
    },
    { 
      id: 4, 
      name: "Mewtwo V", 
      set: "Pokemon GO", 
      rarity: "Ultra Rare", 
      number: "#030/071", 
      price: 67, 
      change: 12.1, 
      rank: 4, 
      emoji: "✨", 
      color: "purple", 
      cardId: "pgo-30", 
      imageUrl: "https://images.pokemontcg.io/pgo/30_hires.png", 
      artist: "Mitsuhiro Arita",
      hp: 220,
      pokemonType: "Psychic",
      abilities: [],
      attacks: [
        {
          cost: ["Psychic"],
          name: "Super Psy Bolt",
          damage: "50",
          description: ""
        },
        {
          cost: ["Psychic", "Psychic", "Colorless"],
          name: "Transfer Break",
          damage: "160",
          description: "Move an Energy from this Pokémon to 1 of your Benched Pokémon."
        }
      ]
    },
    { 
      id: 5, 
      name: "Charizard VMAX", 
      set: "Darkness Ablaze", 
      rarity: "VMAX", 
      number: "#020/189", 
      price: 198, 
      change: 19.7, 
      rank: 5, 
      emoji: "🔥", 
      color: "red", 
      cardId: "swsh3-20", 
      imageUrl: "https://images.pokemontcg.io/swsh3/20_hires.png", 
      artist: "Mitsuhiro Arita",
      hp: 330,
      pokemonType: "Fire",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Blaze",
          description: "Once during your turn (before your attack), you may attach a Fire Energy card from your hand to this Pokémon."
        }
      ],
      attacks: [
        {
          cost: ["Fire", "Fire", "Colorless", "Colorless"],
          name: "G-Max Wildfire",
          damage: "200",
          description: "This attack does 50 damage to each of your opponent's Benched Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)"
        }
      ]
    },
    { 
      id: 6, 
      name: "Blastoise VMAX", 
      set: "Chilling Reign", 
      rarity: "VMAX", 
      number: "#018/198", 
      price: 134, 
      change: 14.3, 
      rank: 6, 
      emoji: "🌊", 
      color: "cyan", 
      cardId: "swsh6-18", 
      imageUrl: "https://images.pokemontcg.io/swsh6/18_hires.png", 
      artist: "Atsuko Nishida",
      hp: 330,
      pokemonType: "Water",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Torrent",
          description: "Once during your turn (before your attack), you may attach a Water Energy card from your hand to this Pokémon."
        }
      ],
      attacks: [
        {
          cost: ["Water", "Water", "Colorless", "Colorless"],
          name: "G-Max Hydro Cannon",
          damage: "200",
          description: "This attack does 30 damage to each of your opponent's Benched Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)"
        }
      ]
    },
    { 
      id: 7, 
      name: "Venusaur VMAX", 
      set: "Battle Styles", 
      rarity: "VMAX", 
      number: "#015/163", 
      price: 112, 
      change: 11.8, 
      rank: 7, 
      emoji: "🌿", 
      color: "emerald", 
      cardId: "swsh5-15", 
      imageUrl: "https://images.pokemontcg.io/swsh5/15_hires.png", 
      artist: "Atsuko Nishida",
      hp: 330,
      pokemonType: "Grass",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Overgrow",
          description: "Once during your turn (before your attack), you may attach a Grass Energy card from your hand to this Pokémon."
        }
      ],
      attacks: [
        {
          cost: ["Grass", "Grass", "Colorless", "Colorless"],
          name: "G-Max Vine Lash",
          damage: "200",
          description: "This attack does 30 damage to each of your opponent's Benched Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)"
        }
      ]
    },
    { 
      id: 8, 
      name: "Gengar VMAX", 
      set: "Fusion Strike", 
      rarity: "VMAX", 
      number: "#271/264", 
      price: 45, 
      change: 9.2, 
      rank: 8, 
      emoji: "👻", 
      color: "purple", 
      cardId: "swsh9-271", 
      imageUrl: "https://images.pokemontcg.io/swsh9/271_hires.png", 
      artist: "Ryuta Fuse",
      hp: 320,
      pokemonType: "Psychic",
      abilities: [
        {
          type: "Pokémon Power",
          name: "Shadow Tag",
          description: "Once during your turn (before your attack), you may switch 1 of your opponent's Benched Pokémon with their Active Pokémon."
        }
      ],
      attacks: [
        {
          cost: ["Psychic", "Psychic", "Colorless"],
          name: "G-Max Terror",
          damage: "180",
          description: "The Defending Pokémon can't retreat during your opponent's next turn."
        }
      ]
    }
  ]
  const [activeTab, setActiveTab] = useState('home')
  const [navigationMode, setNavigationMode] = useState('home') // 'home', 'collection', 'marketplace', 'profile', 'none'
  const [showScanner, setShowScanner] = useState(false)
  const [scannedCard, setScannedCard] = useState(null)
  const [cardImages, setCardImages] = useState({})
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [indicatorAnimation, setIndicatorAnimation] = useState('enter')
  
  const [filteredSearchResults, setFilteredSearchResults] = useState([])
  const [originalSearchResults, setOriginalSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSortModal, setShowSortModal] = useState(false)
  const [sortOption, setSortOption] = useState('trending')
  
  // Add to Collection Modal states
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false)
  const [cardToAdd, setCardToAdd] = useState(null)
  const [selectedCollectionForAdd, setSelectedCollectionForAdd] = useState('pokemon-collection')
  
  // Separate modal states for search results and card profile
  const [showSearchResultsModal, setShowSearchResultsModal] = useState(false)
  const [cardToAddFromSearch, setCardToAddFromSearch] = useState(null)
  const [showCardProfileModal, setShowCardProfileModal] = useState(false)
  const [cardToAddFromProfile, setCardToAddFromProfile] = useState(null)
  const [addQuantity, setAddQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState('normal')
  const [addCardCondition, setAddCardCondition] = useState('Near Mint')
  const [isGraded, setIsGraded] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState('10')
  const [addNote, setAddNote] = useState('')
  
  // Custom dropdown states for Add to Collection modal
  const [showVariantDropdown, setShowVariantDropdown] = useState(false)
  const [showConditionDropdown, setShowConditionDropdown] = useState(false)
  const [showGradingServiceDropdown, setShowGradingServiceDropdown] = useState(false)
  const [showGradeDropdown, setShowGradeDropdown] = useState(false)
  const [showQuickFiltersModal, setShowQuickFiltersModal] = useState(false)
  const [showSetPage, setShowSetPage] = useState(false)
  const [selectedSet, setSelectedSet] = useState(null)
  const [setCardsData, setSetCardsData] = useState([])
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [cardNote, setCardNote] = useState('')
  
  // Edit card modal states
  const [showEditCardModal, setShowEditCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [editQuantity, setEditQuantity] = useState(1)
  const [editCondition, setEditCondition] = useState('Near Mint')
  const [editVariant, setEditVariant] = useState('Normal')
  const [editGrade, setEditGrade] = useState('')
  const [editGradingService, setEditGradingService] = useState('raw')
  const [editPricePaid, setEditPricePaid] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editIsGraded, setEditIsGraded] = useState(false)
  
  // Edit modal specific dropdown states
  const [showEditConditionDropdown, setShowEditConditionDropdown] = useState(false)
  const [showEditVariantDropdown, setShowEditVariantDropdown] = useState(false)
  const [showEditGradeDropdown, setShowEditGradeDropdown] = useState(false)
  const [showEditGradingServiceDropdown, setShowEditGradingServiceDropdown] = useState(false)
  const [quickFilters, setQuickFilters] = useState({
    owned: false,
    missing: false,
    duplicates: false,
    wishlist: false
  })
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState({
    english: true,
    japanese: false,
    chinese: false,
    korean: false,
    german: false,
    spanish: false,
    french: false,
    italian: false
  })
  const [showConditionModal, setShowConditionModal] = useState(false)
  const [selectedConditions, setSelectedConditions] = useState({
    mint: false,
    nearMint: true,
    lightlyPlayed: false,
    moderatelyPlayed: false,
    heavilyPlayed: false,
    damaged: false
  })
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState({
    cardsOnly: true,
    sealedOnly: false
  })
  const [showEnergyModal, setShowEnergyModal] = useState(false)
  const [selectedEnergies, setSelectedEnergies] = useState({
    colorless: false,
    darkness: false,
    dragon: false,
    electric: false,
    fairy: false,
    fighting: false,
    fire: false,
    grass: false,
    metal: false,
    psychic: false,
    water: false
  })
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState({
    pokemon: true,
    trainer: true,
    energy: true
  })
  const [showRarityModal, setShowRarityModal] = useState(false)
  const [rarityType, setRarityType] = useState('international') // 'international' or 'japanese'
  
  const [selectedRarities, setSelectedRarities] = useState({
    common: true,
    uncommon: true,
    rare: true,
    doubleRare: true,
    aceSpecRare: true,
    illustrationRare: true,
    ultraRare: true,
    specialIllustrationRare: true,
    hyperRare: true,
    shinyRare: true,
    shinyUltraRare: true,
    blackStarPromo: true,
    artRare: true,
    specialArtRare: true,
    superRare: true,
    shinySuperRare: true
  })
  
  // Variant modal state
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState({
    normal: true,
    holo: true,
    reverseHolo: true,
    firstEdition: true
  })
  
  // Regulation filter state
  const [showRegulationModal, setShowRegulationModal] = useState(false)
  const [selectedRegulations, setSelectedRegulations] = useState({
    a: true,
    b: true,
    c: true,
    d: true,
    e: true,
    f: true,
    g: true,
    h: true,
    i: true
  })
  
  // Format filter state
  const [showFormatModal, setShowFormatModal] = useState(false)
  const [selectedFormats, setSelectedFormats] = useState({
    unlimited: true,
    expanded: true,
    standard: true
  })

  // Additional scanner states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showScanConfirm, setShowScanConfirm] = useState(false)
  const [isScanConfirmFading, setIsScanConfirmFading] = useState(false)
  const [showCardProfile, setShowCardProfile] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [wishlist, setWishlist] = useState(new Set())
  const [showWishlistNotification, setShowWishlistNotification] = useState(false)
  const [wishlistNotificationMessage, setWishlistNotificationMessage] = useState('')
  const [showCollectionNotification, setShowCollectionNotification] = useState(false)
  const [collectionNotificationMessage, setCollectionNotificationMessage] = useState('')
  const [showCardMenu, setShowCardMenu] = useState(false)
  const [showViewMyCardsModal, setShowViewMyCardsModal] = useState(false)
  const [myCardEntries, setMyCardEntries] = useState([])
  const [swipedEntryId, setSwipedEntryId] = useState(null)
  const [pressedEntryId, setPressedEntryId] = useState(null)
  const [pressTimer, setPressTimer] = useState(null)
  const [touchStartPos, setTouchStartPos] = useState(null)
  const [mouseStartPos, setMouseStartPos] = useState(null)
  const [selectedEntries, setSelectedEntries] = useState(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [showPricingMenu, setShowPricingMenu] = useState(false)
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false)
  const [showEditPricePaidModal, setShowEditPricePaidModal] = useState(false)
  const [selectedPurchaseSource, setSelectedPurchaseSource] = useState('')
  const [showPurchaseSourceDropdown, setShowPurchaseSourceDropdown] = useState(false)
  const [cardChartTimeRange, setCardChartTimeRange] = useState('6M')
  const [selectedCardVariant, setSelectedCardVariant] = useState('normal')
  const [showCardVariantDropdown, setShowCardVariantDropdown] = useState(false)
  const [selectedGradingService, setSelectedGradingService] = useState('raw')
  const [showGradingDropdown, setShowGradingDropdown] = useState(false)
  const [showAddToFolderModal, setShowAddToFolderModal] = useState(false)
  const [showSetCustomTagModal, setShowSetCustomTagModal] = useState(false)
  const [showSendFeedbackModal, setShowSendFeedbackModal] = useState(false)
  
  // Dropdown states for modals
  const [showFolderDropdown, setShowFolderDropdown] = useState(false)
  const [showDeckDropdown, setShowDeckDropdown] = useState(false)
  const [showBinderDropdown, setShowBinderDropdown] = useState(false)
  const [showIssueDropdown, setShowIssueDropdown] = useState(false)
  
  // Selected values for modal dropdowns
  const [selectedDeck, setSelectedDeck] = useState('Standard Deck')
  const [selectedBinder, setSelectedBinder] = useState('Main Binder')
  const [selectedIssue, setSelectedIssue] = useState('Incorrect Image')
  
  // New deck name state
  const [newDeckName, setNewDeckName] = useState('')
  
  // Deck quantity state
  const [deckQuantity, setDeckQuantity] = useState(1)
  
  // New binder name state
  const [newBinderName, setNewBinderName] = useState('')
  
  // Custom tag states
  const [tagName, setTagName] = useState('')
  const [selectedTagColor, setSelectedTagColor] = useState('red')
  const [cardCustomTags, setCardCustomTags] = useState([]) // Array of tags for the card
  const [editingTagIndex, setEditingTagIndex] = useState(null) // Index of tag being edited
  
  // Color mapping for consistent styling
  const colorMap = {
    red: {
      bg: 'bg-red-500/20',
      border: 'border-red-400/30',
      dot: 'bg-red-500',
      text: 'text-white'
    },
    blue: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-400/30',
      dot: 'bg-blue-500',
      text: 'text-white'
    },
    green: {
      bg: 'bg-green-500/20',
      border: 'border-green-400/30',
      dot: 'bg-green-500',
      text: 'text-white'
    },
    yellow: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-400/30',
      dot: 'bg-yellow-500',
      text: 'text-white'
    },
    purple: {
      bg: 'bg-purple-500/20',
      border: 'border-purple-400/30',
      dot: 'bg-purple-500',
      text: 'text-white'
    },
    pink: {
      bg: 'bg-pink-500/20',
      border: 'border-pink-400/30',
      dot: 'bg-pink-500',
      text: 'text-white'
    }
  }

  // Energy type mapping for dynamic energy icons
  const energyTypeMap = {
    'Fire': 'Fire',
    'Water': 'Water', 
    'Grass': 'Grass',
    'Lightning': 'Electric',
    'Psychic': 'Psychic',
    'Fighting': 'Fighting',
    'Darkness': 'Darkness',
    'Metal': 'Metal',
    'Fairy': 'Fairy',
    'Dragon': 'Dragon',
    'Colorless': 'Colorless'
  }

  // Helper function to get energy icon path
  const getEnergyIconPath = (energyType) => {
    const mappedType = energyTypeMap[energyType] || 'Colorless'
    return `/Assets/Energies/${mappedType}.svg`
  }

  // Helper function to render energy cost
  const renderEnergyCost = (cost) => {
    if (!cost || !Array.isArray(cost)) return null
    
    return (
      <div className="flex items-center gap-1">
        {cost.map((energy, index) => (
          <img 
            key={index}
            src={getEnergyIconPath(energy)} 
            alt={`${energy} Energy`} 
            className="w-5 h-5" 
          />
        ))}
      </div>
    )
  }
  
  // Chart and pricing state
  const [selectedPriceType, setSelectedPriceType] = useState('Raw')
  const [selectedTimeframe, setSelectedTimeframe] = useState('6M')
  const [showPriceTypeDropdown, setShowPriceTypeDropdown] = useState(false)
  
  // Infinite scroll state
  const [visibleCardsCount, setVisibleCardsCount] = useState(12)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  

  // Helper function to get card variants and their colors


  // Calculate ungraded values based on card and condition
  const getUngradedValues = useMemo(() => {
    if (!selectedCard) return {}
    
    // Get base market value - handle different pricing structures
    const baseValue = selectedCard?.currentValue || selectedCard?.current_value || selectedCard?.price || 
                     selectedCard?.tcgplayer?.prices?.holofoil?.market || 
                     selectedCard?.tcgplayer?.prices?.normal?.market || 
                     selectedCard?.tcgplayer?.prices?.reverseHolofoil?.market ||
                     selectedCard?.tcgplayer?.prices?.firstEditionHolofoil?.market || 100
    
    // Condition multipliers (relative to Near Mint)
    const conditionMultipliers = {
      'NM': 1.0,    // Near Mint - 100%
      'LP': 0.85,   // Lightly Played - 85%
      'MP': 0.70,   // Moderately Played - 70%
      'HP': 0.50,   // Heavily Played - 50%
      'DM': 0.30    // Damaged - 30%
    }
    
    const values = {}
    Object.entries(conditionMultipliers).forEach(([condition, multiplier]) => {
      values[condition] = Math.round(baseValue * multiplier * 100) / 100
    })
    
    return values
  }, [selectedCard])

  const [flashEnabled, setFlashEnabled] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('My Collection')
  const [selectedCondition, setSelectedCondition] = useState('Near Mint')

  // Data structures for the app
  const mockUserData = {
    username: 'Stuart60',
    profilePicture: 'S',
    collections: [
      {
        id: 'pokemon-collection',
        name: 'Pokemon Collection',
        totalValue: 4268.23,
        totalCards: 1247,
        monthlyChange: 102.36,
        currency: 'USD',
        lastUpdated: '2025-08-02',
        cardsAddedThisWeek: 12,
        valueChangeThisWeek: 234.50,
        isUserCreated: false
      },
      {
        id: 'vintage-pokemon',
        name: 'Vintage Pokemon',
        totalValue: 3200.00,
        totalCards: 89,
        monthlyChange: 125.80,
        currency: 'USD',
        lastUpdated: '2025-08-01',
        cardsAddedThisWeek: 2,
        valueChangeThisWeek: 89.50,
        isUserCreated: true
      },
      {
        id: 'vintage-cards',
        name: 'Vintage Cards',
        totalValue: 850.75,
        totalCards: 156,
        monthlyChange: -15.20,
        currency: 'USD',
        lastUpdated: '2025-08-01',
        cardsAddedThisWeek: 2,
        valueChangeThisWeek: -25.30,
        isUserCreated: true
      }
    ],
    recentActivity: [
      { id: 1, type: 'added', description: 'Added Charizard ex', time: '2 hours ago', value: 45.00 },
      { id: 2, type: 'sold', description: 'Sold Pikachu VMAX', time: '1 day ago', value: 23.50 },
      { id: 3, type: 'alert', description: 'Price Alert: Blastoise reached $25.00', time: '3 days ago', value: 25.00 }
    ],
    portfolioHistory: {
      '1D': [
        { date: '2025-09-25T00:00:00Z', value: 4200 },
        { date: '2025-09-25T06:00:00Z', value: 4250 },
        { date: '2025-09-25T12:00:00Z', value: 4300 },
        { date: '2025-09-25T18:00:00Z', value: 4280 },
        { date: '2025-09-25T23:59:59Z', value: 4268 }
      ],
      '7D': [
        { date: '2025-09-19T00:00:00Z', value: 4100 },
        { date: '2025-09-20T00:00:00Z', value: 4150 },
        { date: '2025-09-21T00:00:00Z', value: 4200 },
        { date: '2025-09-22T00:00:00Z', value: 4180 },
        { date: '2025-09-23T00:00:00Z', value: 4220 },
        { date: '2025-09-24T00:00:00Z', value: 4250 },
        { date: '2025-09-25T00:00:00Z', value: 4268 }
      ],
      '1M': [
        { date: '2025-08-25T00:00:00Z', value: 4000 },
        { date: '2025-09-01T00:00:00Z', value: 4050 },
        { date: '2025-09-05T00:00:00Z', value: 4100 },
        { date: '2025-09-10T00:00:00Z', value: 4150 },
        { date: '2025-09-15T00:00:00Z', value: 4200 },
        { date: '2025-09-20T00:00:00Z', value: 4250 },
        { date: '2025-09-25T00:00:00Z', value: 4268 }
      ],
      '3M': [
        { date: '2025-06-25T00:00:00Z', value: 3800 },
        { date: '2025-07-25T00:00:00Z', value: 3900 },
        { date: '2025-08-25T00:00:00Z', value: 4000 },
        { date: '2025-09-25T00:00:00Z', value: 4268 }
      ],
      '6M': [
        { date: '2025-03-25T00:00:00Z', value: 3500 },
        { date: '2025-04-25T00:00:00Z', value: 3600 },
        { date: '2025-05-25T00:00:00Z', value: 3700 },
        { date: '2025-06-25T00:00:00Z', value: 3800 },
        { date: '2025-07-25T00:00:00Z', value: 3900 },
        { date: '2025-08-25T00:00:00Z', value: 4000 },
        { date: '2025-09-25T00:00:00Z', value: 4268 }
      ],
      '1Y': [
        { date: '2024-09-25T00:00:00Z', value: 3000 },
        { date: '2024-12-25T00:00:00Z', value: 3200 },
        { date: '2025-03-25T00:00:00Z', value: 3500 },
        { date: '2025-06-25T00:00:00Z', value: 3800 },
        { date: '2025-09-25T00:00:00Z', value: 4268 }
      ],
      'MAX': [
        { date: '2023-01-01T00:00:00Z', value: 1500 },
        { date: '2023-03-01T00:00:00Z', value: 1650 },
        { date: '2023-06-01T00:00:00Z', value: 1800 },
        { date: '2023-09-01T00:00:00Z', value: 1950 },
        { date: '2023-12-01T00:00:00Z', value: 2100 },
        { date: '2024-01-01T00:00:00Z', value: 2200 },
        { date: '2024-03-01T00:00:00Z', value: 2400 },
        { date: '2024-06-01T00:00:00Z', value: 2600 },
        { date: '2024-09-01T00:00:00Z', value: 2800 },
        { date: '2024-12-01T00:00:00Z', value: 3000 },
        { date: '2025-01-01T00:00:00Z', value: 3200 },
        { date: '2025-03-01T00:00:00Z', value: 3500 },
        { date: '2025-06-01T00:00:00Z', value: 3800 },
        { date: '2025-09-01T00:00:00Z', value: 4100 },
        { date: '2025-09-25T00:00:00Z', value: 4268 }
      ]
    },
    // Portfolio history for different collections
    collectionPortfolioHistory: {
      'pokemon-collection': {
        '1D': [
          { date: '2025-09-25T00:00:00Z', value: 4200 },
          { date: '2025-09-25T06:00:00Z', value: 4250 },
          { date: '2025-09-25T12:00:00Z', value: 4300 },
          { date: '2025-09-25T18:00:00Z', value: 4280 },
          { date: '2025-09-25T23:59:59Z', value: 4268 }
        ],
        '7D': [
          { date: '2025-09-19T00:00:00Z', value: 4100 },
          { date: '2025-09-20T00:00:00Z', value: 4150 },
          { date: '2025-09-21T00:00:00Z', value: 4200 },
          { date: '2025-09-22T00:00:00Z', value: 4180 },
          { date: '2025-09-23T00:00:00Z', value: 4220 },
          { date: '2025-09-24T00:00:00Z', value: 4250 },
          { date: '2025-09-25T00:00:00Z', value: 4268 }
        ],
        '1M': [
          { date: '2025-08-25T00:00:00Z', value: 4000 },
          { date: '2025-09-01T00:00:00Z', value: 4050 },
          { date: '2025-09-05T00:00:00Z', value: 4100 },
          { date: '2025-09-10T00:00:00Z', value: 4150 },
          { date: '2025-09-15T00:00:00Z', value: 4200 },
          { date: '2025-09-20T00:00:00Z', value: 4250 },
          { date: '2025-09-25T00:00:00Z', value: 4268 }
        ],
        '3M': [
          { date: '2025-06-25T00:00:00Z', value: 3800 },
          { date: '2025-07-25T00:00:00Z', value: 3900 },
          { date: '2025-08-25T00:00:00Z', value: 4000 },
          { date: '2025-09-25T00:00:00Z', value: 4268 }
        ],
        '6M': [
          { date: '2025-03-25T00:00:00Z', value: 3500 },
          { date: '2025-04-25T00:00:00Z', value: 3600 },
          { date: '2025-05-25T00:00:00Z', value: 3700 },
          { date: '2025-06-25T00:00:00Z', value: 3800 },
          { date: '2025-07-25T00:00:00Z', value: 3900 },
          { date: '2025-08-25T00:00:00Z', value: 4000 },
          { date: '2025-09-25T00:00:00Z', value: 4268 }
        ],
        '1Y': [
          { date: '2024-09-25T00:00:00Z', value: 3000 },
          { date: '2024-12-25T00:00:00Z', value: 3200 },
          { date: '2025-03-25T00:00:00Z', value: 3500 },
          { date: '2025-06-25T00:00:00Z', value: 3800 },
          { date: '2025-09-25T00:00:00Z', value: 4268 }
        ],
        'MAX': [
          { date: '2023-01-01T00:00:00Z', value: 1500 },
          { date: '2023-03-01T00:00:00Z', value: 1650 },
          { date: '2023-06-01T00:00:00Z', value: 1800 },
          { date: '2023-09-01T00:00:00Z', value: 1950 },
          { date: '2023-12-01T00:00:00Z', value: 2100 },
          { date: '2024-01-01T00:00:00Z', value: 2200 },
          { date: '2024-03-01T00:00:00Z', value: 2400 },
          { date: '2024-06-01T00:00:00Z', value: 2600 },
          { date: '2024-09-01T00:00:00Z', value: 2800 },
          { date: '2024-12-01T00:00:00Z', value: 3000 },
          { date: '2025-01-01T00:00:00Z', value: 3200 },
          { date: '2025-03-01T00:00:00Z', value: 3500 },
          { date: '2025-06-01T00:00:00Z', value: 3800 },
          { date: '2025-09-01T00:00:00Z', value: 4100 },
          { date: '2025-09-25T00:00:00Z', value: 4268 }
        ]
      },
      'vintage-pokemon': {
        '1D': [
          { date: '2025-09-25T00:00:00Z', value: 3190 },
          { date: '2025-09-25T06:00:00Z', value: 3195 },
          { date: '2025-09-25T12:00:00Z', value: 3200 },
          { date: '2025-09-25T18:00:00Z', value: 3200 },
          { date: '2025-09-25T23:59:59Z', value: 3200 }
        ],
        '7D': [
          { date: '2025-09-19T00:00:00Z', value: 3150 },
          { date: '2025-09-20T00:00:00Z', value: 3160 },
          { date: '2025-09-21T00:00:00Z', value: 3170 },
          { date: '2025-09-22T00:00:00Z', value: 3180 },
          { date: '2025-09-23T00:00:00Z', value: 3185 },
          { date: '2025-09-24T00:00:00Z', value: 3190 },
          { date: '2025-09-25T00:00:00Z', value: 3200 }
        ],
        '1M': [
          { date: '2025-08-25T00:00:00Z', value: 3100 },
          { date: '2025-09-01T00:00:00Z', value: 3120 },
          { date: '2025-09-05T00:00:00Z', value: 3140 },
          { date: '2025-09-10T00:00:00Z', value: 3160 },
          { date: '2025-09-15T00:00:00Z', value: 3180 },
          { date: '2025-09-20T00:00:00Z', value: 3190 },
          { date: '2025-09-25T00:00:00Z', value: 3200 }
        ],
        '3M': [
          { date: '2025-06-25T00:00:00Z', value: 2900 },
          { date: '2025-07-25T00:00:00Z', value: 3000 },
          { date: '2025-08-25T00:00:00Z', value: 3100 },
          { date: '2025-09-25T00:00:00Z', value: 3200 }
        ],
        '6M': [
          { date: '2025-03-25T00:00:00Z', value: 2500 },
          { date: '2025-04-25T00:00:00Z', value: 2600 },
          { date: '2025-05-25T00:00:00Z', value: 2700 },
          { date: '2025-06-25T00:00:00Z', value: 2900 },
          { date: '2025-07-25T00:00:00Z', value: 3000 },
          { date: '2025-08-25T00:00:00Z', value: 3100 },
          { date: '2025-09-25T00:00:00Z', value: 3200 }
        ],
        '1Y': [
          { date: '2024-09-25T00:00:00Z', value: 1800 },
          { date: '2024-12-25T00:00:00Z', value: 2000 },
          { date: '2025-03-25T00:00:00Z', value: 2500 },
          { date: '2025-06-25T00:00:00Z', value: 2900 },
          { date: '2025-09-25T00:00:00Z', value: 3200 }
        ],
        'MAX': [
          { date: '2023-01-01T00:00:00Z', value: 800 },
          { date: '2023-03-01T00:00:00Z', value: 900 },
          { date: '2023-06-01T00:00:00Z', value: 1000 },
          { date: '2023-09-01T00:00:00Z', value: 1100 },
          { date: '2023-12-01T00:00:00Z', value: 1200 },
          { date: '2024-01-01T00:00:00Z', value: 1300 },
          { date: '2024-03-01T00:00:00Z', value: 1500 },
          { date: '2024-06-01T00:00:00Z', value: 1800 },
          { date: '2024-09-01T00:00:00Z', value: 1800 },
          { date: '2024-12-01T00:00:00Z', value: 2000 },
          { date: '2025-01-01T00:00:00Z', value: 2200 },
          { date: '2025-03-01T00:00:00Z', value: 2500 },
          { date: '2025-06-01T00:00:00Z', value: 2900 },
          { date: '2025-09-01T00:00:00Z', value: 3100 },
          { date: '2025-09-25T00:00:00Z', value: 3200 }
        ]
      },
      'vintage-cards': {
        '1D': [
          { date: '2025-09-25T00:00:00Z', value: 845 },
          { date: '2025-09-25T06:00:00Z', value: 848 },
          { date: '2025-09-25T12:00:00Z', value: 850 },
          { date: '2025-09-25T18:00:00Z', value: 851 },
          { date: '2025-09-25T23:59:59Z', value: 850 }
        ],
        '7D': [
          { date: '2025-09-19T00:00:00Z', value: 860 },
          { date: '2025-09-20T00:00:00Z', value: 858 },
          { date: '2025-09-21T00:00:00Z', value: 856 },
          { date: '2025-09-22T00:00:00Z', value: 854 },
          { date: '2025-09-23T00:00:00Z', value: 852 },
          { date: '2025-09-24T00:00:00Z', value: 851 },
          { date: '2025-09-25T00:00:00Z', value: 850 }
        ],
        '1M': [
          { date: '2025-08-25T00:00:00Z', value: 870 },
          { date: '2025-09-01T00:00:00Z', value: 865 },
          { date: '2025-09-05T00:00:00Z', value: 860 },
          { date: '2025-09-10T00:00:00Z', value: 855 },
          { date: '2025-09-15T00:00:00Z', value: 852 },
          { date: '2025-09-20T00:00:00Z', value: 851 },
          { date: '2025-09-25T00:00:00Z', value: 850 }
        ],
        '3M': [
          { date: '2025-06-25T00:00:00Z', value: 900 },
          { date: '2025-07-25T00:00:00Z', value: 880 },
          { date: '2025-08-25T00:00:00Z', value: 870 },
          { date: '2025-09-25T00:00:00Z', value: 850 }
        ],
        '6M': [
          { date: '2025-03-25T00:00:00Z', value: 950 },
          { date: '2025-04-25T00:00:00Z', value: 940 },
          { date: '2025-05-25T00:00:00Z', value: 930 },
          { date: '2025-06-25T00:00:00Z', value: 900 },
          { date: '2025-07-25T00:00:00Z', value: 880 },
          { date: '2025-08-25T00:00:00Z', value: 870 },
          { date: '2025-09-25T00:00:00Z', value: 850 }
        ],
        '1Y': [
          { date: '2024-09-25T00:00:00Z', value: 1000 },
          { date: '2024-12-25T00:00:00Z', value: 980 },
          { date: '2025-03-25T00:00:00Z', value: 950 },
          { date: '2025-06-25T00:00:00Z', value: 900 },
          { date: '2025-09-25T00:00:00Z', value: 850 }
        ],
        'MAX': [
          { date: '2023-01-01T00:00:00Z', value: 1200 },
          { date: '2023-03-01T00:00:00Z', value: 1150 },
          { date: '2023-06-01T00:00:00Z', value: 1100 },
          { date: '2023-09-01T00:00:00Z', value: 1050 },
          { date: '2023-12-01T00:00:00Z', value: 1000 },
          { date: '2024-01-01T00:00:00Z', value: 980 },
          { date: '2024-03-01T00:00:00Z', value: 950 },
          { date: '2024-06-01T00:00:00Z', value: 900 },
          { date: '2024-09-01T00:00:00Z', value: 1000 },
          { date: '2024-12-01T00:00:00Z', value: 980 },
          { date: '2025-01-01T00:00:00Z', value: 950 },
          { date: '2025-03-01T00:00:00Z', value: 950 },
          { date: '2025-06-01T00:00:00Z', value: 900 },
          { date: '2025-09-01T00:00:00Z', value: 870 },
          { date: '2025-09-25T00:00:00Z', value: 850 }
        ]
      }
    },
    topMovers: [
      {
        // Pokémon TCG API structure
        id: "gym2-2",
        name: "Blaine's Charizard",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        level: "50",
        hp: "100",
        types: ["Fire"],
        evolvesFrom: "Blaine's Charmeleon",
        set: {
          id: "gym2",
          name: "Gym Challenge",
          series: "Gym",
          printedTotal: 132,
          total: 132,
          legalities: { unlimited: "Legal" },
          ptcgoCode: "G2",
          releaseDate: "2000/10/16",
          updatedAt: "2022/10/10 15:12:00",
          images: {
            symbol: "https://images.pokemontcg.io/gym2/symbol.png",
            logo: "https://images.pokemontcg.io/gym2/logo.png"
          }
        },
        number: "2",
        artist: "Ken Sugimori",
        rarity: "Rare Holo",
        nationalPokedexNumbers: [6],
        legalities: { unlimited: "Legal" },
        images: {
          small: "https://images.pokemontcg.io/gym2/2.png",
          large: "https://images.pokemontcg.io/gym2/2_hires.png"
        },
        tcgplayer: {
          url: "https://prices.pokemontcg.io/tcgplayer/gym2-2",
          updatedAt: "2025/09/18",
          prices: {
            unlimitedHolofoil: {
              low: 292.5,
              mid: 475.46,
              high: 593.69,
              market: 528.66,
              directLow: 309.98
            }
          }
        },
        // App-specific fields
        currentValue: 528.66,
        change: 12.34,
        changePercent: 37.0,
        quantity: 2,
        collected: true
      },
      {
        id: "base1-58",
        name: "Pikachu",
        supertype: "Pokémon",
        subtypes: ["Basic"],
        types: ["Lightning"],
        set: {
          id: "base1",
          name: "Base Set",
          series: "Base",
          printedTotal: 102,
          total: 102,
          legalities: { unlimited: "Legal" },
          ptcgoCode: "BS",
          releaseDate: "1999/01/09",
          updatedAt: "2020/08/14 09:35:00",
          images: {
            symbol: "https://images.pokemontcg.io/base1/symbol.png",
            logo: "https://images.pokemontcg.io/base1/logo.png"
          }
        },
        number: "58",
        artist: "Atsuko Nishida",
        rarity: "Common",
        nationalPokedexNumbers: [25],
        legalities: { unlimited: "Legal" },
        images: {
          small: "https://images.pokemontcg.io/base1/58.png",
          large: "https://images.pokemontcg.io/base1/58_hires.png"
        },
        tcgplayer: {
          url: "https://prices.pokemontcg.io/tcgplayer/base1-58",
          updatedAt: "2025/09/18",
          prices: {
            normal: {
              low: 0.25,
              mid: 0.5,
              high: 1.0,
              market: 0.45,
              directLow: null
            }
          }
        },
        currentValue: 0.45,
        change: -5.67,
        changePercent: -19.5,
        quantity: 1,
        collected: true
      },
      {
        id: "neo4-9",
        name: "Lugia",
        supertype: "Pokémon",
        subtypes: ["Basic"],
        types: ["Colorless"],
        set: {
          id: "neo4",
          name: "Neo Genesis",
          series: "Neo",
          printedTotal: 111,
          total: 111,
          legalities: { unlimited: "Legal" },
          ptcgoCode: "NG",
          releaseDate: "2000/12/16",
          updatedAt: "2020/08/14 09:35:00",
          images: {
            symbol: "https://images.pokemontcg.io/neo4/symbol.png",
            logo: "https://images.pokemontcg.io/neo4/logo.png"
          }
        },
        number: "9",
        artist: "Hironobu Yoshida",
        rarity: "Rare Holo",
        nationalPokedexNumbers: [249],
        legalities: { unlimited: "Legal" },
        images: {
          small: "https://images.pokemontcg.io/neo4/9.png",
          large: "https://images.pokemontcg.io/neo4/9_hires.png"
        },
        tcgplayer: {
          url: "https://prices.pokemontcg.io/tcgplayer/neo4-9",
          updatedAt: "2025/09/18",
          prices: {
            holofoil: {
              low: 15.0,
              mid: 25.0,
              high: 50.0,
              market: 22.5,
              directLow: null
            }
          }
        },
        currentValue: 22.5,
        change: 8.12,
        changePercent: 75.4,
        quantity: 3,
        collected: true
      }
    ],
    trendingCards: [
      {
        id: "fossil-15",
        name: "Mew",
        supertype: "Pokémon",
        subtypes: ["Basic"],
        types: ["Psychic"],
        set: {
          id: "fossil",
          name: "Fossil",
          series: "Base",
          printedTotal: 62,
          total: 62,
          legalities: { unlimited: "Legal" },
          ptcgoCode: "FO",
          releaseDate: "1999/10/10",
          updatedAt: "2020/08/14 09:35:00",
          images: {
            symbol: "https://images.pokemontcg.io/fossil/symbol.png",
            logo: "https://images.pokemontcg.io/fossil/logo.png"
          }
        },
        number: "15",
        artist: "Atsuko Nishida",
        rarity: "Rare Holo",
        nationalPokedexNumbers: [151],
        legalities: { unlimited: "Legal" },
        images: {
          small: "https://images.pokemontcg.io/fossil/15.png",
          large: "https://images.pokemontcg.io/fossil/15_hires.png"
        },
        tcgplayer: {
          url: "https://prices.pokemontcg.io/tcgplayer/fossil-15",
          updatedAt: "2025/09/18",
          prices: {
            holofoil: {
              low: 25.0,
              mid: 40.0,
              high: 80.0,
              market: 35.0,
              directLow: null
            }
          }
        },
        currentValue: 35.0,
        change: 15.67,
        changePercent: 95.3,
        quantity: 0,
        collected: false
      },
      {
        id: "base1-1",
        name: "Alakazam",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Psychic"],
        evolvesFrom: "Kadabra",
        set: {
          id: "base1",
          name: "Base Set",
          series: "Base",
          printedTotal: 102,
          total: 102,
          legalities: { unlimited: "Legal" },
          ptcgoCode: "BS",
          releaseDate: "1999/01/09",
          updatedAt: "2020/08/14 09:35:00",
          images: {
            symbol: "https://images.pokemontcg.io/base1/symbol.png",
            logo: "https://images.pokemontcg.io/base1/logo.png"
          }
        },
        number: "1",
        artist: "Mitsuhiro Arita",
        rarity: "Rare Holo",
        nationalPokedexNumbers: [65],
        legalities: { unlimited: "Legal" },
        images: {
          small: "https://images.pokemontcg.io/base1/1.png",
          large: "https://images.pokemontcg.io/base1/1_hires.png"
        },
        tcgplayer: {
          url: "https://prices.pokemontcg.io/tcgplayer/base1-1",
          updatedAt: "2025/09/18",
          prices: {
            holofoil: {
              low: 8.0,
              mid: 15.0,
              high: 30.0,
              market: 12.0,
              directLow: null
            }
          }
        },
        currentValue: 12.0,
        change: -3.21,
        changePercent: -10.1,
        quantity: 0,
        collected: false
      },
      {
        id: "base1-2",
        name: "Blastoise",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Water"],
        evolvesFrom: "Wartortle",
        set: {
          id: "base1",
          name: "Base Set",
          series: "Base",
          printedTotal: 102,
          total: 102,
          legalities: { unlimited: "Legal" },
          ptcgoCode: "BS",
          releaseDate: "1999/01/09",
          updatedAt: "2020/08/14 09:35:00",
          images: {
            symbol: "https://images.pokemontcg.io/base1/symbol.png",
            logo: "https://images.pokemontcg.io/base1/logo.png"
          }
        },
        number: "2",
        artist: "Atsuko Nishida",
        rarity: "Rare Holo",
        nationalPokedexNumbers: [9],
        legalities: { unlimited: "Legal" },
        images: {
          small: "https://images.pokemontcg.io/base1/2.png",
          large: "https://images.pokemontcg.io/base1/2_hires.png"
        },
        tcgplayer: {
          url: "https://prices.pokemontcg.io/tcgplayer/base1-2",
          updatedAt: "2025/09/18",
          prices: {
            holofoil: {
              low: 20.0,
              mid: 35.0,
              high: 60.0,
              market: 30.0,
              directLow: null
            }
          }
        },
        currentValue: 30.0,
        change: 22.15,
        changePercent: 116.2,
        quantity: 0,
        collected: false
      },
      {
        id: "base1-15",
        name: "Venusaur",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Grass"],
        evolvesFrom: "Ivysaur",
        set: {
          id: "base1",
          name: "Base Set",
          series: "Base",
          printedTotal: 102,
          total: 102,
          legalities: { unlimited: "Legal" },
          ptcgoCode: "BS",
          releaseDate: "1999/01/09",
          updatedAt: "2020/08/14 09:35:00",
          images: {
            symbol: "https://images.pokemontcg.io/base1/symbol.png",
            logo: "https://images.pokemontcg.io/base1/logo.png"
          }
        },
        number: "15",
        artist: "Atsuko Nishida",
        rarity: "Rare Holo",
        nationalPokedexNumbers: [3],
        legalities: { unlimited: "Legal" },
        images: {
          small: "https://images.pokemontcg.io/base1/15.png",
          large: "https://images.pokemontcg.io/base1/15_hires.png"
        },
        tcgplayer: {
          url: "https://prices.pokemontcg.io/tcgplayer/base1-15",
          updatedAt: "2025/09/18",
          prices: {
            holofoil: {
              low: 15.0,
              mid: 25.0,
              high: 45.0,
              market: 22.0,
              directLow: null
            }
          }
        },
        currentValue: 22.0,
        change: -7.89,
        changePercent: -18.1,
        quantity: 0,
        collected: false
      }
    ],
    searchResults: [
      {
        id: "gym2-2",
        name: "Blaine's Charizard",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Fire"],
        set: {
          id: "gym2",
          name: "Gym Challenge",
          series: "Gym",
          printedTotal: 132,
          total: 132
        },
        number: "2",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/gym2/2.png",
          large: "https://images.pokemontcg.io/gym2/2_hires.png"
        },
        tcgplayer: {
          prices: {
            unlimitedHolofoil: { market: 528.66 }
          }
        },
        currentValue: 528.66,
        quantity: 1,
        collected: true
      },
      {
        id: "dp3-3",
        name: "Charizard",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Fire"],
        set: {
          id: "dp3",
          name: "Secret Wonders",
          series: "Diamond & Pearl",
          printedTotal: 132,
          total: 132
        },
        number: "3",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/dp3/3.png",
          large: "https://images.pokemontcg.io/dp3/3_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 127.01 }
          }
        },
        currentValue: 127.01,
        quantity: 0,
        collected: false
      },
      {
        id: "pl4-1",
        name: "Charizard",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Fire"],
        set: {
          id: "pl4",
          name: "Arceus",
          series: "Platinum",
          printedTotal: 99,
          total: 111
        },
        number: "1",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/pl4/1.png",
          large: "https://images.pokemontcg.io/pl4/1_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 40.29 }
          }
        },
        currentValue: 40.29,
        quantity: 2,
        collected: true
      },
      {
        id: "base1-4",
        name: "Charizard",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Fire"],
        set: {
          id: "base1",
          name: "Base Set",
          series: "Base",
          printedTotal: 102,
          total: 102
        },
        number: "4",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/base1/4.png",
          large: "https://images.pokemontcg.io/base1/4_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 1500.0 }
          }
        },
        currentValue: 1500.0,
        quantity: 0,
        collected: false
      },
      {
        id: "base2-4",
        name: "Charizard",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Fire"],
        set: {
          id: "base2",
          name: "Base Set 2",
          series: "Base",
          printedTotal: 130,
          total: 130
        },
        number: "4",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/base2/4.png",
          large: "https://images.pokemontcg.io/base2/4_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 800.0 }
          }
        },
        currentValue: 800.0,
        quantity: 1,
        collected: true
      },
      {
        id: "base1-58",
        name: "Pikachu",
        supertype: "Pokémon",
        subtypes: ["Basic"],
        types: ["Lightning"],
        set: {
          id: "base1",
          name: "Base Set",
          series: "Base",
          printedTotal: 102,
          total: 102
        },
        number: "58",
        rarity: "Common",
        images: {
          small: "https://images.pokemontcg.io/base1/58.png",
          large: "https://images.pokemontcg.io/base1/58_hires.png"
        },
        tcgplayer: {
          prices: {
            normal: { market: 0.45 }
          }
        },
        currentValue: 0.45,
        quantity: 0,
        collected: false
      },
      {
        id: "base1-2",
        name: "Blastoise",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Water"],
        set: {
          id: "base1",
          name: "Base Set",
          series: "Base",
          printedTotal: 102,
          total: 102
        },
        number: "2",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/base1/2.png",
          large: "https://images.pokemontcg.io/base1/2_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 30.0 }
          }
        },
        currentValue: 30.0,
        quantity: 1,
        collected: true
      },
      {
        id: "base1-15",
        name: "Venusaur",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Grass"],
        set: {
          id: "base1",
          name: "Base Set",
          series: "Base",
          printedTotal: 102,
          total: 102
        },
        number: "15",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/base1/15.png",
          large: "https://images.pokemontcg.io/base1/15_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 22.0 }
          }
        },
        currentValue: 22.0,
        quantity: 0,
        collected: false
      },
      {
        id: "base1-1",
        name: "Alakazam",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Psychic"],
        set: {
          id: "base1",
          name: "Base Set",
          series: "Base",
          printedTotal: 102,
          total: 102
        },
        number: "1",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/base1/1.png",
          large: "https://images.pokemontcg.io/base1/1_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 12.0 }
          }
        },
        currentValue: 12.0,
        quantity: 0,
        collected: false
      },
      {
        id: "base1-8",
        name: "Machamp",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Fighting"],
        set: {
          id: "base1",
          name: "Base Set",
          series: "Base",
          printedTotal: 102,
          total: 102
        },
        number: "8",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/base1/8.png",
          large: "https://images.pokemontcg.io/base1/8_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 15.0 }
          }
        },
        currentValue: 15.0,
        quantity: 1,
        collected: true
      },
      {
        id: "fossil-5",
        name: "Gengar",
        supertype: "Pokémon",
        subtypes: ["Stage 2"],
        types: ["Psychic"],
        set: {
          id: "fossil",
          name: "Fossil",
          series: "Base",
          printedTotal: 62,
          total: 62
        },
        number: "5",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/fossil/5.png",
          large: "https://images.pokemontcg.io/fossil/5_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 25.0 }
          }
        },
        currentValue: 25.0,
        quantity: 0,
        collected: false
      },
      {
        id: "jungle-58",
        name: "Pikachu",
        supertype: "Pokémon",
        subtypes: ["Basic"],
        types: ["Lightning"],
        set: {
          id: "jungle",
          name: "Jungle",
          series: "Base",
          printedTotal: 64,
          total: 64
        },
        number: "58",
        rarity: "Common",
        images: {
          small: "https://images.pokemontcg.io/jungle/58.png",
          large: "https://images.pokemontcg.io/jungle/58_hires.png"
        },
        tcgplayer: {
          prices: {
            normal: { market: 0.75 }
          }
        },
        currentValue: 0.75,
        quantity: 2,
        collected: true
      },
      {
        id: "neo4-9",
        name: "Lugia",
        supertype: "Pokémon",
        subtypes: ["Basic"],
        types: ["Colorless"],
        set: {
          id: "neo4",
          name: "Neo Genesis",
          series: "Neo",
          printedTotal: 111,
          total: 111
        },
        number: "9",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/neo4/9.png",
          large: "https://images.pokemontcg.io/neo4/9_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 22.5 }
          }
        },
        currentValue: 22.5,
        quantity: 1,
        collected: true
      }
    ]
  }

  // Generate more trending cards for infinite scroll
  const generateMoreTrendingCards = () => {
    const baseCards = mockUserData.trendingCards
    const moreCards = []
    
    // Generate additional cards by duplicating and modifying existing ones
    for (let i = 0; i < 20; i++) {
      const baseCard = baseCards[i % baseCards.length]
      const newCard = {
        ...baseCard,
        id: `${baseCard.id}-${i + 100}`,
        name: baseCard.name,
        currentValue: Math.max(0.01, baseCard.currentValue + (Math.random() - 0.5) * 50),
        changePercent: (Math.random() - 0.5) * 100
      }
      moreCards.push(newCard)
    }
    
    return moreCards
  }
  
  // Use real trending cards data from database
  const allTrendingCards = useMemo(() => {
    return trendingCardsData.length > 0 ? trendingCardsData : generateMoreTrendingCards()
  }, [trendingCardsData])
  
  // Load more cards function
  const loadMoreCards = () => {
    if (isLoadingMore) return
    
    setIsLoadingMore(true)
    
    // Simulate loading delay
    setTimeout(() => {
      setVisibleCardsCount(prev => Math.min(prev + 12, allTrendingCards.length))
      setIsLoadingMore(false)
    }, 1000)
  }
  
  // Infinite scroll handler
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    // Load more when user scrolls to 80% of the content
    if (scrollPercentage > 0.8 && visibleCardsCount < allTrendingCards.length) {
      loadMoreCards()
    }
  }

  // Create new collection function
  const createNewCollection = () => {
    if (newCollectionName.trim()) {
      const newCollection = {
        id: `collection-${Date.now()}`,
        name: newCollectionName.trim(),
        totalValue: 0,
        totalCards: 0,
        monthlyChange: 0,
        currency: 'USD',
        lastUpdated: new Date().toISOString().split('T')[0],
        cardsAddedThisWeek: 0,
        valueChangeThisWeek: 0,
        isUserCreated: true
      }
      
      // Add to collections using userDatabase
      const success = userDatabase.createCollection(newCollection.name, newCollection.description)
      if (!success) {
        console.error('Failed to create collection')
        return
      }
      
      // Select the new collection
      setSelectedCollection(newCollection.id)
      setNewCollectionName('')
      setShowCreateCollectionModal(false)
      setShowCollectionDropdown(false)
    }
  }

  // Reset scroll position when navigating between tabs
  useEffect(() => {
    // Scroll to top when activeTab changes
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [activeTab])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCurrencyDropdown && !event.target.closest('.currency-dropdown')) {
        setShowCurrencyDropdown(false)
      }
      if (showCollectionDropdown && !event.target.closest('.collection-dropdown')) {
        setShowCollectionDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCurrencyDropdown, showCollectionDropdown])

  // Currency options and conversion rates
  const currencies = [
    { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
    { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', flag: '🇨🇦', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', flag: '🇦🇺', name: 'Australian Dollar' }
  ]

  // Mock conversion rates (in real app, these would come from an API)
  const conversionRates = {
    USD: 1.0,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35
  }

  // Convert value to selected currency
  const convertCurrency = (usdValue) => {
    const rate = conversionRates[selectedCurrency] || 1.0
    return usdValue * rate
  }

  // Format currency value
  const formatCurrency = (value) => {
    const convertedValue = convertCurrency(value)
    const currency = currencies.find(c => c.code === selectedCurrency)
    return `${currency?.symbol || '$'}${convertedValue.toFixed(2)}`
  }

  // Helper function to scroll to top
  const scrollToTop = () => {
    // Scroll the main container to top
    const mainContainer = document.querySelector('[data-main-container]')
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    // Also scroll window to top as fallback
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Search functions using database API
  const handleSearch = async () => {
    // Don't trigger search if we're on the collection tab (use collection search instead)
    if (activeTab === 'collection') {
      return
    }
    
    try {
      setLoading(true);
        
        // Use database migration service for search
        const searchResults = await cardDataMigration.searchCards(searchQuery, {
          limit: 200,
          exactMatch: false
        });
        
        // Search results loaded successfully
        
        // Apply filters to the API results
        
        // Get active languages for filtering
        const activeLanguages = Object.entries(selectedLanguages)
          .filter(([lang, isSelected]) => isSelected)
          .map(([lang]) => {
            // Map language names to language codes
            const languageMap = {
              english: 'en',
              japanese: 'jp',
              chinese: 'zh',
              korean: 'ko',
              german: 'de',
              spanish: 'es',
              french: 'fr',
              italian: 'it'
            };
            return languageMap[lang] || 'en';
          });

        // Get active energy types for filtering
        const activeEnergies = Object.entries(selectedEnergies)
          .filter(([energy, isSelected]) => isSelected)
          .map(([energy]) => {
            // Map UI energy types to Pokemon TCG API energy types
            const energyMap = {
              colorless: 'Colorless',
              darkness: 'Darkness',
              dragon: 'Dragon',
              electric: 'Lightning', // Pokemon TCG uses "Lightning" not "Electric"
              fairy: 'Fairy',
              fighting: 'Fighting',
              fire: 'Fire',
              grass: 'Grass',
              metal: 'Metal',
              psychic: 'Psychic',
              water: 'Water'
            };
            return energyMap[energy];
          });

        // Get active variants for filtering
        const activeVariants = Object.entries(selectedVariants)
          .filter(([variant, isSelected]) => isSelected)
          .map(([variant]) => {
            // Map UI variant types to Pokemon TCG API variant types
            const variantMap = {
              normal: 'Normal',
              holo: 'Holo',
              reverseHolo: 'Reverse Holo',
              firstEdition: '1st Edition'
            };
            return variantMap[variant];
          });

        // Get active regulations for filtering
        const activeRegulations = Object.entries(selectedRegulations)
          .filter(([regulation, isSelected]) => isSelected)
          .map(([regulation]) => regulation.toUpperCase());

        // Get active formats for filtering
        const activeFormats = Object.entries(selectedFormats)
          .filter(([format, isSelected]) => isSelected)
          .map(([format]) => {
            // Map UI format types to Pokemon TCG API format types
            const formatMap = {
              unlimited: 'Unlimited',
              expanded: 'Expanded',
              standard: 'Standard'
            };
            return formatMap[format];
          });

        // Apply filters to the API results
        let filtered = searchResults;
        
        // Apply filters to search results
        
        // Apply language filter - skip for now as cards don't have language property
        // if (activeLanguages.length > 0) {
        //   filtered = filtered.filter(card => 
        //     activeLanguages.includes(card.language)
        //   );
        //   console.log('After language filter:', filtered.length, 'cards');
        // }
        
        // Apply energy type filter
        if (activeEnergies.length > 0) {
          filtered = filtered.filter(card => 
            card.types && card.types.some(type => activeEnergies.includes(type))
          );
        }
        
        // Apply variant filter - skip for now as cards don't have variant property
        // if (activeVariants.length > 0) {
        //   filtered = filtered.filter(card => 
        //     activeVariants.includes(card.variant)
        //   );
        //   console.log('After variant filter:', filtered.length, 'cards');
        // }
        
        // Apply regulation filter
        if (activeRegulations.length > 0) {
          filtered = filtered.filter(card => 
            card.regulationMark && activeRegulations.includes(card.regulationMark)
          );
        }
        
        // Apply format filter - skip for now as cards don't have format property
        // if (activeFormats.length > 0) {
        //   filtered = filtered.filter(card => 
        //     activeFormats.includes(card.format)
        //   );
        //   console.log('After format filter:', filtered.length, 'cards');
        // }
        
        setOriginalSearchResults(filtered);
        setFilteredSearchResults(filtered);
        setShowSearchResults(true);
        loadSearchResultImages(filtered);
        
      } catch (error) {
        console.error('Search error:', error);
        // Show error message instead of fallback data
        setOriginalSearchResults([]);
        setFilteredSearchResults([]);
        setShowSearchResults(true);
        alert('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
  }

  // Load images for search results - now using database API structure
  const loadSearchResultImages = async (searchCards = []) => {

    const imageMap = {}
    searchCards.forEach((card) => {
      // Use the imageUrl or images object directly (already formatted with extensions)
      if (card.imageUrl) {
        imageMap[card.id] = card.imageUrl
      } else if (card.images?.small) {
        imageMap[card.id] = card.images.small
      } else if (card.images?.large) {
        imageMap[card.id] = card.images.large
      }
    })
    
    setCardImages(prev => ({ ...prev, ...imageMap }))
  }

  // Sort cards based on selected option
  const sortCards = (cards, sortType) => {
    const sortedCards = [...cards].sort((a, b) => {
      // Helper function to get card price from any data structure
      const getCardPrice = (card) => {
        if (card.currentValue) return card.currentValue;
        if (card.current_value) return card.current_value;
        if (card.price) return card.price;
        if (card.tcgplayer?.prices?.holofoil?.market) return card.tcgplayer.prices.holofoil.market;
        if (card.tcgplayer?.prices?.normal?.market) return card.tcgplayer.prices.normal.market;
        if (card.tcgplayer?.prices?.reverseHolofoil?.market) return card.tcgplayer.prices.reverseHolofoil.market;
        if (card.tcgplayer?.prices?.firstEditionHolofoil?.market) return card.tcgplayer.prices.firstEditionHolofoil.market;
        return 0;
      };

      switch (sortType) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price-low':
          return getCardPrice(a) - getCardPrice(b)
        case 'price-high':
          return getCardPrice(b) - getCardPrice(a)
        case 'rarity-desc':
          const rarityOrderDesc = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Ultra', 'Rare Secret', 'Rare Rainbow', 'VMAX', 'Ultra Rare']
          return rarityOrderDesc.indexOf(b.rarity || '') - rarityOrderDesc.indexOf(a.rarity || '')
        case 'rarity-asc':
          const rarityOrderAsc = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Ultra', 'Rare Secret', 'Rare Rainbow', 'VMAX', 'Ultra Rare']
          return rarityOrderAsc.indexOf(a.rarity || '') - rarityOrderAsc.indexOf(b.rarity || '')
        case 'number':
          return parseInt(a.number?.replace('#', '') || '0') - parseInt(b.number?.replace('#', '') || '0')
        case 'pokemon-number':
          return (a.nationalPokedexNumbers?.[0] || 0) - (b.nationalPokedexNumbers?.[0] || 0)
        case 'trending':
          return getCardPrice(b) - getCardPrice(a)
        default:
          return 0
      }
    })
    return sortedCards
  }

  // Handle sort option selection
  const handleSortOption = (option) => {
    setSortOption(option)
    const sortedCards = sortCards(filteredSearchResults, option)
    setFilteredSearchResults(sortedCards)
    setShowSortModal(false)
  }

  const handleQuickFilterToggle = (filterType) => {
    setQuickFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }))
  }

  const selectAllQuickFilters = () => {
    setQuickFilters(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = true
      })
      return updated
    })
  }

  const deselectAllQuickFilters = () => {
    setQuickFilters(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = false
      })
      return updated
    })
  }

  const applyQuickFilters = () => {
    setShowQuickFiltersModal(false)
    // Filter the search results based on selected quick filters
    filterSearchResults()
  }

  const filterSearchResults = () => {
    if (!originalSearchResults.length) return
    
    let filteredCards = [...originalSearchResults]
    
    // Apply quick filters based on collection status
    if (quickFilters.owned) {
      // Show only owned cards (quantity > 0)
      filteredCards = filteredCards.filter(card => card.quantity > 0)
    }
    
    if (quickFilters.missing) {
      // Show only missing cards (quantity = 0)
      filteredCards = filteredCards.filter(card => card.quantity === 0)
    }
    
    if (quickFilters.duplicates) {
      // Show only cards with duplicates (quantity > 1)
      filteredCards = filteredCards.filter(card => card.quantity > 1)
    }
    
    if (quickFilters.wishlist) {
      // Show only wishlist cards (for now, we'll use a placeholder logic)
      // In a real app, this would check a wishlist status field
      filteredCards = filteredCards.filter(card => card.wishlist === true)
    }
    
    // If no filters are selected, show all cards
    const hasActiveFilters = Object.values(quickFilters).some(filter => filter)
    if (!hasActiveFilters) {
      filteredCards = [...originalSearchResults]
    }
    
    setFilteredSearchResults(filteredCards)
  }

  const handleLanguageToggle = (language) => {
    setSelectedLanguages(prev => ({
      ...prev,
      [language]: !prev[language]
    }))
  }

  const selectAllLanguages = () => {
    setSelectedLanguages(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = true
      })
      return updated
    })
  }

  const deselectAllLanguages = () => {
    setSelectedLanguages(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = false
      })
      return updated
    })
  }

  const applyLanguageFilters = () => {
    setShowLanguageModal(false)
    // Filter the search results based on selected languages
    filterByLanguage()
  }

  const filterByLanguage = () => {
    if (!originalSearchResults.length) return
    
    let filteredCards = [...originalSearchResults]
    
    // Apply language filters
    const activeLanguages = Object.entries(selectedLanguages)
      .filter(([lang, isSelected]) => isSelected)
      .map(([lang]) => lang)
    
    if (activeLanguages.length > 0) {
      filteredCards = filteredCards.filter(card => {
        // Map language names to language codes
        const languageMap = {
          english: ['en', 'english'],
          japanese: ['jp', 'ja', 'japanese'],
          chinese: ['zh', 'chinese'],
          korean: ['ko', 'korean'],
          german: ['de', 'german'],
          spanish: ['es', 'spanish'],
          french: ['fr', 'french'],
          italian: ['it', 'italian']
        }
        
        // Check if card's language matches any selected language
        const cardLanguage = card.language?.toLowerCase() || 'en'
        return activeLanguages.some(lang => 
          languageMap[lang]?.includes(cardLanguage)
        )
      })
    }
    
    setFilteredSearchResults(filteredCards)
  }

  const handleConditionToggle = (condition) => {
    setSelectedConditions(prev => ({
      ...prev,
      [condition]: !prev[condition]
    }))
  }

  const selectAllConditions = () => {
    setSelectedConditions(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = true
      })
      return updated
    })
  }

  const deselectAllConditions = () => {
    setSelectedConditions(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = false
      })
      return updated
    })
  }

  const applyConditionFilters = () => {
    setShowConditionModal(false)
    // Filter the search results based on selected conditions
    filterByCondition()
  }

  const filterByCondition = () => {
    if (!originalSearchResults.length) return
    
    let filteredCards = [...originalSearchResults]
    
    // Apply condition filters
    const activeConditions = Object.entries(selectedConditions)
      .filter(([condition, isSelected]) => isSelected)
      .map(([condition]) => condition)
    
    if (activeConditions.length > 0) {
      filteredCards = filteredCards.filter(card => {
        // Map condition names to condition codes
        const conditionMap = {
          mint: ['mint', 'm'],
          nearMint: ['near mint', 'nearmint', 'nm'],
          lightlyPlayed: ['lightly played', 'lightlyplayed', 'lp'],
          moderatelyPlayed: ['moderately played', 'moderatelyplayed', 'mp'],
          heavilyPlayed: ['heavily played', 'heavilyplayed', 'hp'],
          damaged: ['damaged', 'd']
        }
        
        // Check if card's condition matches any selected condition
        const cardCondition = card.condition?.toLowerCase() || 'nearmint'
        return activeConditions.some(condition => 
          conditionMap[condition]?.includes(cardCondition)
        )
      })
    }
    
    setFilteredSearchResults(filteredCards)
  }

  const handleProductsToggle = (productType) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productType]: !prev[productType]
    }))
  }

  const selectAllProducts = () => {
    setSelectedProducts(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = true
      })
      return updated
    })
  }

  const deselectAllProducts = () => {
    setSelectedProducts(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = false
      })
      return updated
    })
  }

  const applyProductsFilters = () => {
    setShowProductsModal(false)
    // Filter the search results based on selected product types
    filterByProducts()
  }

  const filterByProducts = () => {
    if (!originalSearchResults.length) return
    
    let filteredCards = [...originalSearchResults]
    
    // Apply product type filters
    const activeProducts = Object.entries(selectedProducts)
      .filter(([product, isSelected]) => isSelected)
      .map(([product]) => product)
    
    if (activeProducts.length > 0) {
      filteredCards = filteredCards.filter(card => {
        // Map product types to product codes
        const productMap = {
          cardsOnly: ['card', 'cards', 'individual'],
          sealedOnly: ['sealed', 'pack', 'booster', 'box', 'collection']
        }
        
        // Check if card's product type matches any selected product type
        const cardProductType = card.product_type?.toLowerCase() || 'card'
        return activeProducts.some(product => 
          productMap[product]?.includes(cardProductType)
        )
      })
    }
    
    setFilteredSearchResults(filteredCards)
  }

  const handleEnergyToggle = (energyType) => {
    setSelectedEnergies(prev => ({
      ...prev,
      [energyType]: !prev[energyType]
    }))
  }

  const selectAllEnergies = () => {
    setSelectedEnergies(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = true
      })
      return updated
    })
  }

  const deselectAllEnergies = () => {
    setSelectedEnergies(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = false
      })
      return updated
    })
  }

  const applyEnergyFilters = () => {
    setShowEnergyModal(false)
    // Trigger a new search with the selected energy types
    handleSearch()
  }

  // Variant filter functions
  const handleVariantToggle = (variant) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variant]: !prev[variant]
    }))
  }

  const applyVariantFilters = () => {
    setShowVariantModal(false)
    handleSearch() // Trigger search with new variant filters
  }

  // Select/Deselect all functions for Variant modal
  const selectAllVariants = () => {
    setSelectedVariants(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = true
      })
      return updated
    })
  }

  const deselectAllVariants = () => {
    setSelectedVariants(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = false
      })
      return updated
    })
  }

  // Regulation filter functions
  const handleRegulationToggle = (regulation) => {
    setSelectedRegulations(prev => ({
      ...prev,
      [regulation]: !prev[regulation]
    }))
  }

  const applyRegulationFilters = () => {
    setShowRegulationModal(false)
    handleSearch() // Trigger search with new regulation filters
  }

  // Select/Deselect all functions for Regulation modal
  const selectAllRegulations = () => {
    setSelectedRegulations(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = true
      })
      return updated
    })
  }

  const deselectAllRegulations = () => {
    setSelectedRegulations(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = false
      })
      return updated
    })
  }

  // Format filter functions
  const handleFormatToggle = (format) => {
    setSelectedFormats(prev => ({
      ...prev,
      [format]: !prev[format]
    }))
  }

  const applyFormatFilters = () => {
    setShowFormatModal(false)
    handleSearch() // Trigger search with new format filters
  }

  // Select/Deselect all functions for Format modal
  const selectAllFormats = () => {
    setSelectedFormats(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = true
      })
      return updated
    })
  }

  const deselectAllFormats = () => {
    setSelectedFormats(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = false
      })
      return updated
    })
  }

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const selectAllTypes = () => {
    setSelectedTypes(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = true
      })
      return updated
    })
  }

  const deselectAllTypes = () => {
    setSelectedTypes(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = false
      })
      return updated
    })
  }

  const applyTypeFilters = () => {
    setShowTypeModal(false)
    // Trigger a new search with the selected types
    handleSearch()
  }

  const handleRarityToggle = (rarity) => {
    setSelectedRarities(prev => ({
      ...prev,
      [rarity]: !prev[rarity]
    }))
  }

  const handleRarityTypeToggle = (type) => {
    setRarityType(type)
  }

  const selectAllRarities = () => {
    setSelectedRarities(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = true
      })
      return updated
    })
  }

  const deselectAllRarities = () => {
    setSelectedRarities(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = false
      })
      return updated
    })
  }

  const applyRarityFilters = () => {
    setShowRarityModal(false)
    // Trigger a new search with the selected rarities
    handleSearch()
  }

  // Touch handlers for swipe-down to close modals
  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isDownSwipe = distance < -50 // Swipe down (touchStart > touchEnd)
    
    if (isDownSwipe) {
      // Close any open modal
      if (showSortModal) setShowSortModal(false)
      if (showQuickFiltersModal) setShowQuickFiltersModal(false)
      if (showLanguageModal) setShowLanguageModal(false)
      if (showConditionModal) setShowConditionModal(false)
      if (showProductsModal) setShowProductsModal(false)
      if (showEnergyModal) setShowEnergyModal(false)
      if (showTypeModal) setShowTypeModal(false)
      if (showRarityModal) setShowRarityModal(false)
      if (showVariantModal) setShowVariantModal(false)
      if (showRegulationModal) setShowRegulationModal(false)
      if (showFormatModal) setShowFormatModal(false)
    }
  }


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }


  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value)
  }

  // Handle search tab click with scroll
  const handleSearchTabClick = () => {
    setActiveTab('search')
    setNavigationMode('none')
    scrollToTop() // Scroll to top when navigating
  }



  // Test function to debug image loading
  const testImageLoading = async () => {
    console.log('Testing image loading...')
    const testUrl = 'https://images.pokemontcg.io/gym2/2.png'
    console.log('Test URL:', testUrl)
    
    // Test if we can load the image
    const img = new Image()
    img.onload = () => console.log('Test image loaded successfully!')
    img.onerror = (e) => console.log('Test image failed to load:', e)
    img.src = testUrl
    
    // Also test the API call
    const imageUrl = await fetchCardImage('Charizard', 'Gym Challenge')
    console.log('API returned:', imageUrl)
  }


  // Pokémon TCG API integration
  const fetchCardImage = async (cardName, setName) => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      // First try searching by name only
      let searchQuery = `name:"${cardName}"`
      console.log('Searching for:', searchQuery)
      let response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchQuery)}&pageSize=1`, {
        signal: controller.signal
      })
      let data = await response.json()
      console.log('API Response (name only):', data)
      
      // If no results, try with set name
      if (!data.data || data.data.length === 0) {
        searchQuery = `name:"${cardName}" set.name:"${setName}"`
        console.log('Trying with set name:', searchQuery)
        response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchQuery)}&pageSize=1`, {
          signal: controller.signal
        })
        data = await response.json()
        console.log('API Response (with set):', data)
      }
      
      clearTimeout(timeoutId)
      
      if (data.data && data.data.length > 0) {
        console.log('Found card:', data.data[0].name, 'Image URL:', data.data[0].images.small)
        return data.data[0].images.small // Use small image for better performance
      }
      console.log('No card found for:', cardName, setName)
      return null
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Image fetch timed out for:', cardName)
      } else {
        console.error('Error fetching card image:', error)
      }
      return null
    }
  }

  // Country codes for phone number
  const countryCodes = [
    { code: 'US', flag: '🇺🇸', dialCode: '+1', name: 'United States' },
    { code: 'CA', flag: '🇨🇦', dialCode: '+1', name: 'Canada' },
    { code: 'GB', flag: '🇬🇧', dialCode: '+44', name: 'United Kingdom' },
    { code: 'AU', flag: '🇦🇺', dialCode: '+61', name: 'Australia' },
    { code: 'DE', flag: '🇩🇪', dialCode: '+49', name: 'Germany' },
    { code: 'FR', flag: '🇫🇷', dialCode: '+33', name: 'France' },
    { code: 'IT', flag: '🇮🇹', dialCode: '+39', name: 'Italy' },
    { code: 'ES', flag: '🇪🇸', dialCode: '+34', name: 'Spain' },
    { code: 'JP', flag: '🇯🇵', dialCode: '+81', name: 'Japan' },
    { code: 'CN', flag: '🇨🇳', dialCode: '+86', name: 'China' },
    { code: 'IN', flag: '🇮🇳', dialCode: '+91', name: 'India' },
    { code: 'BR', flag: '🇧🇷', dialCode: '+55', name: 'Brazil' },
  ]

  const getSelectedCountry = () => {
    return countryCodes.find(country => country.code === selectedCountry) || countryCodes[0]
  }

  // Close dropdown when clicking outside
  const handleClickOutside = (e) => {
    if (showCountryDropdown && !e.target.closest('.country-dropdown')) {
      setShowCountryDropdown(false)
    }
    if (showCurrencyDropdown && !e.target.closest('.currency-dropdown')) {
      setShowCurrencyDropdown(false)
    }
    if (showSortDropdown && !e.target.closest('.sort-dropdown')) {
      setShowSortDropdown(false)
    }
    if (showFilterModal && !e.target.closest('.filter-modal')) {
      setShowFilterModal(false)
    }
    if (showCollectionCardActions && !e.target.closest('.collection-card-actions')) {
      setShowCollectionCardActions(false)
    }
    if (isCollectionMultiSelectMode && !e.target.closest('.collection-card') && !e.target.closest('.collection-multi-select-bar')) {
      setIsCollectionMultiSelectMode(false)
      setSelectedCollectionCards(new Set())
    }
    if (showMoveToFolderModal && !e.target.closest('.move-to-folder-modal')) {
      setShowMoveToFolderModal(false)
    }
    if (showAddToDeckModal && !e.target.closest('.add-to-deck-modal')) {
      setShowAddToDeckModal(false)
    }
    if (showAddToBinderModal && !e.target.closest('.add-to-binder-modal')) {
      setShowAddToBinderModal(false)
    }
    if (showEditCardModal && !e.target.closest('.edit-card-modal')) {
      setShowEditCardModal(false)
    }
    // Close edit modal dropdowns when clicking outside
    if (!e.target.closest('.edit-card-modal')) {
      setShowEditConditionDropdown(false)
      setShowEditVariantDropdown(false)
      setShowEditGradeDropdown(false)
      setShowEditGradingServiceDropdown(false)
    }
  }

  // Handle collection card press and hold
  const handleCollectionCardPressStart = (e, card) => {
    // Don't prevent default on touch events to avoid passive listener issues
    if (e.type !== 'touchstart') {
      e.preventDefault()
    }
    e.stopPropagation()
    
    console.log('Press start on card:', card.name, 'isScrolling:', isScrolling)
    
    // Reset scrolling state when starting a new press
    setIsScrolling(false)
    
    // Clear any existing timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
    }
    
    // Store initial touch position for scroll detection
    if (e.type === 'touchstart') {
      setTouchStartPosition({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      })
    }
    
    // Set a timer for long press (500ms)
    const timer = setTimeout(() => {
      // Only start multi-select if we're not scrolling
      if (!isScrolling) {
        console.log('Long press detected - entering multi-select mode with card:', card.name)
        setIsCollectionMultiSelectMode(true)
        setSelectedCollectionCards(new Set([card.id]))
      } else {
        console.log('Long press cancelled - user was scrolling')
      }
      setLongPressTimer(null)
    }, 500)
    
    setLongPressTimer(timer)
  }

  const handleCollectionCardPressEnd = (e) => {
    // Don't prevent default on touch events to avoid passive listener issues
    if (e.type !== 'touchend') {
      e.preventDefault()
    }
    e.stopPropagation()
    
    // Clear the long press timer if it hasn't fired yet
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    
    // Clear scroll timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
      setScrollTimeout(null)
    }
    
    // Reset scroll detection
    setIsScrolling(false)
    setTouchStartPosition(null)
  }

  // Handle touch move to detect scrolling
  const handleCollectionCardTouchMove = (e) => {
    if (!touchStartPosition) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPosition.x)
    const deltaY = Math.abs(touch.clientY - touchStartPosition.y)
    
    console.log('Touch move - deltaX:', deltaX, 'deltaY:', deltaY, 'isScrolling:', isScrolling)
    
    // If user moved more than 15px, consider it scrolling (increased threshold)
    if (deltaX > 15 || deltaY > 15) {
      console.log('Scrolling detected - cancelling long press')
      setIsScrolling(true)
      // Cancel the long press timer if scrolling
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
      
      // Clear any existing scroll timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      
      // Set a timeout to reset scrolling state after 300ms of no movement (increased timeout)
      const timeout = setTimeout(() => {
        console.log('Resetting scroll state')
        setIsScrolling(false)
        setScrollTimeout(null)
      }, 300)
      
      setScrollTimeout(timeout)
    }
  }

  // Handle collection card click
  const handleCollectionCardClick = (e, card) => {
    // Don't prevent default on touch events to avoid passive listener issues
    if (e.type !== 'touchend') {
      e.preventDefault()
    }
    e.stopPropagation()
    
    // Only handle click if we're not in the middle of a long press
    if (longPressTimer) {
      console.log('Click ignored - long press in progress')
      return
    }
    
    // Don't handle click if we were scrolling
    if (isScrolling) {
      console.log('Click ignored - user was scrolling')
      return
    }
    
    if (isCollectionMultiSelectMode) {
      // Toggle selection in multi-select mode
      const newSelected = new Set(selectedCollectionCards)
      if (newSelected.has(card.id)) {
        newSelected.delete(card.id)
        console.log('Deselected card:', card.name)
      } else {
        newSelected.add(card.id)
        console.log('Selected card:', card.name)
      }
      setSelectedCollectionCards(newSelected)
      
      // Exit multi-select mode if no cards selected
      if (newSelected.size === 0) {
        console.log('Exiting multi-select mode - no cards selected')
        setIsCollectionMultiSelectMode(false)
      }
    } else {
      // Check for double-tap to enter multi-select mode
      const currentTime = Date.now()
      const timeDiff = currentTime - lastTapTime
      
      if (timeDiff < 500 && timeDiff > 0) {
        // Double tap detected - enter multi-select mode
        console.log('Double tap detected - entering multi-select mode with card:', card.name)
        setIsCollectionMultiSelectMode(true)
        setSelectedCollectionCards(new Set([card.id]))
        setLastTapTime(0) // Reset to prevent triple-tap issues
      } else {
        // Single tap - open card profile
        console.log('Single tap - opening card profile:', card.name)
        handleCardClick(card)
        setLastTapTime(currentTime)
      }
    }
  }

  // Handle collection card long press
  const handleCollectionCardLongPress = (e, card) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Start multi-select mode with this card
    setIsCollectionMultiSelectMode(true)
    setSelectedCollectionCards(new Set([card.id]))
  }

  // Handle collection card touch end (for mobile)
  const handleCollectionCardTouchEnd = (e, card) => {
    e.stopPropagation()
    
    // Only handle if we're not in the middle of a long press
    if (longPressTimer) {
      console.log('Touch end ignored - long press in progress')
      return
    }
    
    // Don't handle touch end if we were scrolling
    if (isScrolling) {
      console.log('Touch end ignored - user was scrolling')
      return
    }
    
    if (isCollectionMultiSelectMode) {
      // Toggle selection in multi-select mode
      const newSelected = new Set(selectedCollectionCards)
      if (newSelected.has(card.id)) {
        newSelected.delete(card.id)
        console.log('Touch deselected card:', card.name)
      } else {
        newSelected.add(card.id)
        console.log('Touch selected card:', card.name)
      }
      setSelectedCollectionCards(newSelected)
      
      // Exit multi-select mode if no cards selected
      if (newSelected.size === 0) {
        console.log('Exiting multi-select mode - no cards selected')
        setIsCollectionMultiSelectMode(false)
      }
    } else {
      // Normal touch - open card profile
      console.log('Normal touch - opening card profile:', card.name)
      handleCardClick(card)
    }
  }

  // Handle move to folder button click
  const handleMoveToFolder = () => {
    // Get all collections except the current one
    const currentCollection = userData?.collections?.find(c => c.id === selectedCollection)
    const otherCollections = userData?.collections?.filter(c => c.id !== selectedCollection) || []
    
    // Transform collections to folder format
    const folders = otherCollections.map(collection => ({
      id: collection.id,
      name: collection.name,
      color: collection.color || '#605DEC' // Default to app theme color
    }))
    
    setAvailableFolders(folders)
    setShowMoveToFolderModal(true)
  }

  // Handle folder selection
  const handleFolderSelection = async (folderId) => {
    try {
      const cardIds = Array.from(selectedCollectionCards)
      const currentCollection = userData?.collections?.find(c => c.id === selectedCollection)
      const targetCollection = userData?.collections?.find(c => c.id === folderId)
      
      if (!currentCollection || !targetCollection) {
        console.error('Collection not found')
        return
      }

      // Get the cards to move
      const cardsToMove = currentCollection.cards.filter(card => cardIds.includes(card.id))
      
      if (cardsToMove.length === 0) {
        console.error('No cards found to move')
        return
      }

      // Move cards from current collection to target collection
      for (const card of cardsToMove) {
        // Remove from current collection
        await userDatabase.removeCardFromCollection(selectedCollection, card.id)
        
        // Add to target collection
        await userDatabase.addCardToCollection(
          folderId,
          card.cardId, // Use the original cardId for the API
          card.condition,
          card.variant,
          card.grade,
          card.gradingService,
          card.pricePaid,
          card.notes
        )
      }

      // Refresh user data
      const updatedUserData = await userDatabase.getUserData()
      setUserData(updatedUserData)

      console.log(`Successfully moved ${cardsToMove.length} cards to ${targetCollection.name}`)
      
      // Close modals and reset state
      setShowMoveToFolderModal(false)
      setIsCollectionMultiSelectMode(false)
      setSelectedCollectionCards(new Set())
      
    } catch (error) {
      console.error('Error moving cards:', error)
      // Still close the modal even if there's an error
      setShowMoveToFolderModal(false)
      setIsCollectionMultiSelectMode(false)
      setSelectedCollectionCards(new Set())
    }
  }

  // Handle add to deck button click
  const handleAddToDeck = () => {
    // Get all decks from user data
    const userDecks = userData?.decks || []
    
    // Transform decks to the format needed for the modal
    const decks = userDecks.map(deck => ({
      id: deck.id,
      name: deck.name,
      color: deck.color || '#605DEC', // Default to app theme color
      cardCount: deck.cards?.length || 0
    }))
    
    setAvailableDecks(decks)
    setShowAddToDeckModal(true)
  }

  // Handle deck selection
  const handleDeckSelection = async (deckId) => {
    try {
      const cardIds = Array.from(selectedCollectionCards)
      const currentCollection = userData?.collections?.find(c => c.id === selectedCollection)
      const targetDeck = userData?.decks?.find(d => d.id === deckId)
      
      if (!currentCollection || !targetDeck) {
        console.error('Collection or deck not found')
        return
      }

      // Get the cards to add
      const cardsToAdd = currentCollection.cards.filter(card => cardIds.includes(card.id))
      
      if (cardsToAdd.length === 0) {
        console.error('No cards found to add')
        return
      }

      // Add cards to the selected deck
      for (const card of cardsToAdd) {
        await userDatabase.addCardToDeck(
          deckId,
          card.cardId, // Use the original cardId for the API
          card.condition,
          card.variant,
          card.grade,
          card.gradingService,
          card.pricePaid,
          card.notes
        )
      }

      // Refresh user data
      const updatedUserData = await userDatabase.getUserData()
      setUserData(updatedUserData)

      console.log(`Successfully added ${cardsToAdd.length} cards to ${targetDeck.name}`)
      
      // Close modals and reset state
      setShowAddToDeckModal(false)
      setIsCollectionMultiSelectMode(false)
      setSelectedCollectionCards(new Set())
      
    } catch (error) {
      console.error('Error adding cards to deck:', error)
      setShowAddToDeckModal(false)
      setIsCollectionMultiSelectMode(false)
      setSelectedCollectionCards(new Set())
    }
  }

  // Handle add to binder button click
  const handleAddToBinder = () => {
    // Get all binders from user data
    const userBinders = userData?.binders || []
    
    // Transform binders to the format needed for the modal
    const binders = userBinders.map(binder => ({
      id: binder.id,
      name: binder.name,
      color: binder.color || '#605DEC', // Default to app theme color
      cardCount: binder.cards?.length || 0
    }))
    
    setAvailableBinders(binders)
    setShowAddToBinderModal(true)
  }

  // Handle binder selection
  const handleBinderSelection = async (binderId) => {
    try {
      const cardIds = Array.from(selectedCollectionCards)
      const currentCollection = userData?.collections?.find(c => c.id === selectedCollection)
      const targetBinder = userData?.binders?.find(b => b.id === binderId)
      
      if (!currentCollection || !targetBinder) {
        console.error('Collection or binder not found')
        return
      }

      // Get the cards to add
      const cardsToAdd = currentCollection.cards.filter(card => cardIds.includes(card.id))
      
      if (cardsToAdd.length === 0) {
        console.error('No cards found to add')
        return
      }

      // Add cards to the selected binder
      for (const card of cardsToAdd) {
        await userDatabase.addCardToBinder(
          binderId,
          card.cardId, // Use the original cardId for the API
          card.condition,
          card.variant,
          card.grade,
          card.gradingService,
          card.pricePaid,
          card.notes
        )
      }

      // Refresh user data
      const updatedUserData = await userDatabase.getUserData()
      setUserData(updatedUserData)

      console.log(`Successfully added ${cardsToAdd.length} cards to ${targetBinder.name}`)
      
      // Close modals and reset state
      setShowAddToBinderModal(false)
      setIsCollectionMultiSelectMode(false)
      setSelectedCollectionCards(new Set())
      
    } catch (error) {
      console.error('Error adding cards to binder:', error)
      setShowAddToBinderModal(false)
      setIsCollectionMultiSelectMode(false)
      setSelectedCollectionCards(new Set())
    }
  }

  // Add event listener for clicking outside
  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCountryDropdown, showCurrencyDropdown, showSortDropdown, showFilterModal, showCollectionCardActions, isCollectionMultiSelectMode, showMoveToFolderModal, showAddToDeckModal, showAddToBinderModal, showEditCardModal, showEditConditionDropdown, showEditVariantDropdown, showEditGradeDropdown, showEditGradingServiceDropdown])

  // Cleanup long press timer on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [longPressTimer, scrollTimeout])

  // Load card images on component mount - now using direct API structure
  React.useEffect(() => {
    const loadCardImages = () => {
      // Load images for both topMovers and trendingCards
      const allCards = [...mockUserData.topMovers, ...mockUserData.trendingCards]
      
      const imageMap = {}
      allCards.forEach((card) => {
        if (card.images?.small) {
          imageMap[card.id] = card.images.small
        }
      })
      
      setCardImages(prev => ({ ...prev, ...imageMap }))
    }
    
    loadCardImages()
  }, [])

  // Onboarding navigation handlers
  const handleNextOnboarding = () => {
    if (currentOnboardingStep < 2) {
      setCurrentOnboardingStep(currentOnboardingStep + 1)
    } else {
      // Complete onboarding
      setIsFirstTimeUser(false)
      setCurrentScreen('main-app') // You can change this to your main app screen
    }
  }

  const handlePreviousOnboarding = () => {
    if (currentOnboardingStep > 0) {
      setCurrentOnboardingStep(currentOnboardingStep - 1)
    }
  }

  const handleSkipOnboarding = () => {
    setIsFirstTimeUser(false)
    setCurrentScreen('main-app') // You can change this to your main app screen
  }

  // Card scanning handlers
  const handleCardScan = async () => {
    try {
      console.log('Scanner button clicked, setting showScanner to true')
      setShowScanner(true)
      // In a real app, this would:
      // 1. Access device camera
      // 2. Capture card image
      // 3. Send to TCGPlayer API for recognition
      // 4. Get card data from Pokemon TCG API
      // 5. Add to collection
    } catch (error) {
      console.error('Card scanning error:', error)
      setShowScanner(false)
      alert('Card scanning failed. Please try again.')
    }
  }

  // Scanner interface handlers
  const handleManualScan = async () => {
    try {
      // Simulate card scanning and recognition
      console.log('Manual scan triggered - simulating card recognition...')
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock card recognition - randomly select a card from our mock data
      const mockScannedCards = [
        { id: 101, name: "Charizard ex", set: "Base Set", rarity: "Ultra Rare", number: "#004/102", price: 1250, imageUrl: "https://images.pokemontcg.io/base1/4_hires.png" },
        { id: 102, name: "Pikachu VMAX", set: "Vivid Voltage", rarity: "VMAX", number: "#044/185", price: 89, imageUrl: "https://images.pokemontcg.io/swsh4/44_hires.png" },
        { id: 103, name: "Lugia V", set: "Silver Tempest", rarity: "Ultra Rare", number: "#186/195", price: 156, imageUrl: "https://images.pokemontcg.io/swsh12/186_hires.png" },
        { id: 104, name: "Rayquaza VMAX", set: "Evolving Skies", rarity: "VMAX", number: "#217/203", price: 234, imageUrl: "https://images.pokemontcg.io/swsh7/217_hires.png" },
        { id: 105, name: "Mewtwo V", set: "Pokemon GO", rarity: "Ultra Rare", number: "#030/071", price: 67, imageUrl: "https://images.pokemontcg.io/pgo/30_hires.png" }
      ]
      
      const recognizedCard = mockScannedCards[Math.floor(Math.random() * mockScannedCards.length)]
      
      // Add card to collection
      const newCard = {
        ...recognizedCard,
        condition: selectedCondition || 'Near Mint',
        folder: selectedFolder || 'Collection',
        dateAdded: new Date().toISOString(),
        quantity: 1
      }
      
      // Add card to collection using userDatabase
      const success = userDatabase.addCardToCollection(
        selectedCollection || 'pokemon-tcg-collection',
        newCard,
        1,
        'Near Mint',
        'Normal',
        null,
        null,
        newCard.price,
        'Scanned card'
      )
      
      if (success) {
        // Update user data
        const updatedData = userDatabase.getUserData()
        setUserData(updatedData)
      } else {
        console.error('Failed to add card to collection')
      }
      
      // Set the scanned card and show confirmation ONLY after card is identified
      setScannedCard(newCard)
    setShowScanConfirm(true)
    setIsScanConfirmFading(false)
    
      // Start fade animation after showing success for longer
    setTimeout(() => {
      setIsScanConfirmFading(true)
      }, 1500)
    
      // Auto-close after fade completes (1500ms display + 500ms fade = 2000ms total)
    setTimeout(() => {
      setShowScanConfirm(false)
      setIsScanConfirmFading(false)
        setScannedCard(null)
      }, 2000)
      
    } catch (error) {
      console.error('Error during card scanning:', error)
      // Show error confirmation ONLY after error occurs
      setScannedCard({
        name: "Scan Error",
        set: "Unknown",
        rarity: "Error",
        number: "000/000",
        price: 0,
        imageUrl: null
      })
      setShowScanConfirm(true)
      setIsScanConfirmFading(false)
      
      // Still show and fade the confirmation
      setTimeout(() => {
        setIsScanConfirmFading(true)
      }, 1500)
      
      setTimeout(() => {
        setShowScanConfirm(false)
        setIsScanConfirmFading(false)
        setScannedCard(null)
      }, 2000)
    }
  }

  // Card profile handlers
  const handleCardClick = async (card) => {
    // Show the modal immediately for better UX
    setShowCardProfile(true)
    
    // If the card has a cardId, fetch the complete data from the API
    if (card.cardId) {
      try {
        // Extract the base card ID from the cardId (remove timestamp parts)
        const baseCardId = card.cardId.includes('-') ? card.cardId.split('-').slice(0, 2).join('-') : card.cardId
        
        const response = await fetch(`http://localhost:3001/api/cards/${baseCardId}`)
        if (response.ok) {
          const result = await response.json()
          const cardData = result.data
          
          // Set the card data first (without image) for immediate display
          setSelectedCard(cardData)
          
          // Fetch image URL from Pokémon TCG API asynchronously
          // Don't await this - let it update the card when ready
          fetchCardImage(cardData.name, cardData.set_name)
            .then(imageUrl => {
              if (imageUrl) {
                setSelectedCard(prevCard => ({
                  ...prevCard,
                  imageUrl: imageUrl,
                  images: {
                    small: imageUrl,
                    large: imageUrl
                  }
                }))
              }
            })
            .catch(imageError => {
              console.warn('Error fetching card image:', imageError)
            })
        } else {
          setSelectedCard(card)
        }
      } catch (error) {
        console.error('Error fetching card data:', error)
        setSelectedCard(card)
      }
    } else {
      // Use the provided card data if no cardId
      setSelectedCard(card)
    }
  }

  // Handle native share functionality
  const handleShare = async () => {
    if (!selectedCard) return;

    const shareData = {
      title: `${selectedCard.name} - Pokemon Card`,
      text: `Check out this ${selectedCard.name} card from ${selectedCard.set_name || selectedCard.set?.name || selectedCard.set || 'Pokemon TCG'}!`,
      url: window.location.href
    };

    try {
      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        // You could add a toast notification here to inform the user
        console.log('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        console.log('Link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
      }
    }
  }

  // Handle artist search functionality
  const handleArtistSearch = async (artistName) => {
    if (!artistName) return;

    try {
      setLoading(true);
      
      // Combine all available card data sources
      const allCards = [
        ...topMoversData,
        ...trendingCardsData
      ];
      
      // Filter cards by artist name
      const artistCards = allCards.filter(card => 
        card.artist && card.artist.toLowerCase().includes(artistName.toLowerCase())
      );
      
      // Remove duplicates based on card name and set
      const uniqueArtistCards = artistCards.filter((card, index, self) => 
        index === self.findIndex(c => c.name === card.name && c.set === card.set)
      );
      
      // Set search results
      setOriginalSearchResults(uniqueArtistCards);
      setFilteredSearchResults(uniqueArtistCards);
      setShowSearchResults(true);
      setSearchQuery(artistName); // Set the search query to show what we're searching for
      
      // Load images for the results
      loadSearchResultImages(uniqueArtistCards);
      
      // Close card profile and switch to search tab
      setShowCardProfile(false);
      setActiveTab('search');
      setNavigationMode('search');
      scrollToTop() // Scroll to top when navigating
      
    } catch (error) {
      console.error('Error searching for artist:', error);
    } finally {
      setLoading(false);
    }
  }

  // Handle clear search functionality
  const handleClearSearch = () => {
    // Clear search query
    setSearchQuery('');
    
    // Reset search results to show trending cards
    setShowSearchResults(false);
    setFilteredSearchResults([]);
    setOriginalSearchResults([]);
    
    // Reset sort option to default
    setSortOption('trending');
    
    // Clear any active filters
    setQuickFilters({
      owned: false,
      missing: false,
      duplicates: false,
      wishlist: false
    });
    
    // Reset language selection
    setSelectedLanguages({
      english: true,
      japanese: false,
      chinese: false,
      korean: false,
      german: false,
      spanish: false,
      french: false,
      italian: false
    });
    
    // Reset other filter states
    setSelectedConditions({});
    setSelectedProducts({});
    setSelectedEnergies({});
    setSelectedTypes({});
    setSelectedRarities({});
    setSelectedVariants({});
    setSelectedRegulations({});
    setSelectedFormats({});
  }

  // Handle viewing my cards in collection
  const handleViewMyCards = () => {
    if (!selectedCard || !userData || !userData.collections) return;
    
    // Find all entries of this card in user's collections
    const entries = [];
    const searchCardId = selectedCard.cardId || selectedCard.id;
    
    userData.collections.forEach(collection => {
      if (collection.cards && collection.cards.length > 0) {
        collection.cards.forEach(card => {
          const baseCardId = card.cardId || card.id;
          const searchBaseCardId = searchCardId;
          
          // Extract the base card ID from the full ID (remove timestamp part)
          const cardBaseId = baseCardId.includes('-') ? baseCardId.split('-').slice(0, 2).join('-') : baseCardId;
          const searchBaseId = searchBaseCardId.includes('-') ? searchBaseCardId.split('-').slice(0, 2).join('-') : searchBaseCardId;
          
          if (cardBaseId === searchBaseId || baseCardId === searchBaseCardId) {
            entries.push({
              ...card,
              collectionName: collection.name,
              collectionId: collection.id
            });
          }
        });
      }
    });
    
    console.log('View My Cards - Found entries:', {
      searchCardId,
      entriesCount: entries.length,
      totalQuantity: entries.reduce((sum, entry) => sum + (entry.quantity || 0), 0)
    });
    
    setMyCardEntries(entries);
    setSelectedEntries(new Set());
    setIsMultiSelectMode(false);
    setShowViewMyCardsModal(true);
    setShowCardMenu(false);
  };

  // Handle multi-select toggle
  const toggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedEntries(new Set());
  };

  // Handle entry selection
  const toggleEntrySelection = (entryId) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  // Handle select all
  const selectAllEntries = () => {
    const allEntryIds = myCardEntries.map(entry => entry.id);
    setSelectedEntries(new Set(allEntryIds));
  };

  // Handle deselect all
  const deselectAllEntries = () => {
    setSelectedEntries(new Set());
  };

  // Handle bulk remove
  const handleBulkRemove = () => {
    if (selectedEntries.size === 0) return;
    
    const entriesToRemove = myCardEntries.filter(entry => selectedEntries.has(entry.id));
    const totalQuantity = entriesToRemove.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
    
    if (confirm(`Remove ${selectedEntries.size} entries (${totalQuantity} cards) from your collection?`)) {
      let successCount = 0;
      entriesToRemove.forEach(entry => {
        const success = userDatabase.removeCardFromCollection(entry.collectionId, entry.id, entry.quantity || 1);
        if (success) successCount++;
      });
      
      if (successCount > 0) {
        // Refresh data
        const updatedUserData = userDatabase.getUserData();
        setUserData({...updatedUserData});
        setRecentActivityData([...(updatedUserData.recentActivity || [])]);
        setDisplayedActivity([...(updatedUserData.recentActivity || []).slice(0, 3)]);
        
        // Refresh the entries list
        const updatedEntries = myCardEntries.filter(entry => !selectedEntries.has(entry.id));
        setMyCardEntries(updatedEntries);
        setSelectedEntries(new Set());
        
        // Show notification
        setCollectionNotificationMessage(`Removed ${successCount} entries from collection`);
        setShowCollectionNotification(true);
        setTimeout(() => {
          setShowCollectionNotification(false);
        }, 3000);
      }
    }
  };

  // Handle click outside to close swipe actions
  const handleSwipeClickOutside = (e) => {
    if (swipedEntryId && !e.target.closest('.swipe-actions')) {
      setSwipedEntryId(null);
    }
  };

  // Add click-outside listener for swipe actions
  useEffect(() => {
    if (swipedEntryId) {
      document.addEventListener('click', handleSwipeClickOutside);
      return () => document.removeEventListener('click', handleSwipeClickOutside);
    }
  }, [swipedEntryId]);

  // Handle press and hold for entry
  const handleEntryPressStart = (entryId) => {
    const timer = setTimeout(() => {
      if (!isMultiSelectMode) {
        // Enter multi-select mode on press and hold
        setIsMultiSelectMode(true);
        setSelectedEntries(new Set([entryId]));
      } else {
        // Toggle selection in multi-select mode
        toggleEntrySelection(entryId);
      }
    }, 500); // 500ms press and hold
    setPressTimer(timer);
  };

  const handleEntryPressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  // Handle swipe gestures
  const handleEntrySwipe = (entryId, direction) => {
    if (direction === 'right' && !isMultiSelectMode) {
      setSwipedEntryId(entryId);
    }
  };

  // Touch swipe detection
  const handleEntryTouchStart = (e, entryId) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY, entryId });
    handleEntryPressStart(entryId);
  };

  const handleEntryTouchEnd = (e, entryId) => {
    if (!touchStartPos) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartPos.x;
    const deltaY = touch.clientY - touchStartPos.y;
    
    // Check if it's a horizontal swipe (more horizontal than vertical movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      handleEntrySwipe(entryId, deltaX > 0 ? 'right' : 'left');
    }
    
    setTouchStartPos(null);
    handleEntryPressEnd();
  };

  // Mouse swipe detection
  const handleEntryMouseDown = (e, entryId) => {
    setMouseStartPos({ x: e.clientX, y: e.clientY, entryId });
    handleEntryPressStart(entryId);
  };

  const handleEntryMouseUp = (e, entryId) => {
    if (!mouseStartPos) return;
    
    const deltaX = e.clientX - mouseStartPos.x;
    const deltaY = e.clientY - mouseStartPos.y;
    
    // Check if it's a horizontal swipe (more horizontal than vertical movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      handleEntrySwipe(entryId, deltaX > 0 ? 'right' : 'left');
    }
    
    setMouseStartPos(null);
    handleEntryPressEnd();
  };

  // Handle entry actions
  const handleEditEntry = (entry) => {
    setSwipedEntryId(null);
    setPressedEntryId(null);
    
    // Set up edit form with current values
    setEditingCard(entry);
    setEditQuantity(entry.quantity || 1);
    setEditCondition(entry.condition || 'Near Mint');
    setEditVariant(entry.variant || 'Normal');
    setEditGrade(entry.grade || '');
    setEditGradingService(entry.gradingService || 'raw');
    setEditPricePaid(entry.pricePaid || '');
    setEditNotes(entry.notes || '');
    setEditIsGraded(!!(entry.grade && entry.gradingService && entry.gradingService !== 'raw'));
    
    setShowEditCardModal(true);
  };

  // Handle saving edited card
  const handleSaveEdit = () => {
    if (!editingCard) return;
    
    const updates = {
      quantity: parseInt(editQuantity) || 1,
      condition: editCondition,
      variant: editVariant,
      grade: editIsGraded ? editGrade : null,
      gradingService: editIsGraded ? editGradingService : 'raw',
      pricePaid: editPricePaid ? parseFloat(editPricePaid) : null,
      notes: editNotes.trim()
    };
    
    const success = userDatabase.updateCardInCollection(editingCard.collectionId, editingCard.id, updates);
    
    if (success) {
      // Refresh data
      const updatedUserData = userDatabase.getUserData();
      setUserData({...updatedUserData});
      setRecentActivityData([...(updatedUserData.recentActivity || [])]);
      setDisplayedActivity([...(updatedUserData.recentActivity || []).slice(0, 3)]);
      
      // Refresh the entries list
      const updatedEntries = myCardEntries.map(entry => 
        entry.id === editingCard.id 
          ? { ...entry, ...updates, lastUpdated: new Date().toISOString() }
          : entry
      );
      setMyCardEntries(updatedEntries);
      
      // Close modal and reset form
      setShowEditCardModal(false);
      setEditingCard(null);
      setEditQuantity(1);
      setEditCondition('Near Mint');
      setEditVariant('Normal');
      setEditGrade('');
      setEditGradingService('raw');
      setEditPricePaid('');
      setEditNotes('');
      setEditIsGraded(false);
      
      // Reset dropdown states
      setShowEditConditionDropdown(false);
      setShowEditVariantDropdown(false);
      setShowEditGradeDropdown(false);
      setShowEditGradingServiceDropdown(false);
    } else {
      alert('Failed to update card. Please try again.');
    }
  };

  const handleRemoveEntry = (entry) => {
    setSwipedEntryId(null);
    setPressedEntryId(null);
    
    if (confirm(`Remove ${entry.quantity || 1} ${entry.name} from ${entry.collectionName}?`)) {
      const success = userDatabase.removeCardFromCollection(entry.collectionId, entry.id, entry.quantity || 1);
      if (success) {
        // Refresh data
        const updatedUserData = userDatabase.getUserData();
        setUserData({...updatedUserData});
        setRecentActivityData([...(updatedUserData.recentActivity || [])]);
        setDisplayedActivity([...(updatedUserData.recentActivity || []).slice(0, 3)]);
        
        // Refresh the entries list
        const updatedEntries = myCardEntries.filter(e => e.id !== entry.id);
        setMyCardEntries(updatedEntries);
        
        // Show notification
        setCollectionNotificationMessage(`Removed ${entry.name} from ${entry.collectionName}`);
        setShowCollectionNotification(true);
        setTimeout(() => {
          setShowCollectionNotification(false);
        }, 3000);
      }
    }
  };

  // Handle opening Add to Collection modal
  const handleAddToCollection = (card) => {
    // First close any open modals
    setShowCardProfileModal(false);
    setShowSearchResultsModal(false);
    setShowAddToCollectionModal(false);
    
    // Small delay to ensure modal closes and resets
    setTimeout(() => {
      // Reset form to defaults
      setSelectedCollectionForAdd('pokemon-collection');
      setAddQuantity(1);
      setSelectedVariant('normal');
      setAddCardCondition('Near Mint');
      setIsGraded(false);
      setSelectedGradingService('PSA');
      setSelectedGrade('10');
      setAddNote('');
      
      // Reset dropdown states
      setShowCollectionDropdown(false);
      setShowVariantDropdown(false);
      setShowConditionDropdown(false);
      setShowGradingServiceDropdown(false);
      setShowGradeDropdown(false);
      
      // Determine which modal to open based on current page
      if (showCardProfile) {
        setCardToAddFromProfile(card);
        setShowCardProfileModal(true);
      } else if (showSearchResults || activeTab === 'cards' || activeTab === 'search') {
        setCardToAddFromSearch(card);
        setShowSearchResultsModal(true);
      } else {
        // Fallback to original behavior
        setCardToAdd(card);
        setShowAddToCollectionModal(true);
      }
    }, 50);
  }

  // Get total quantity of a card in user's collection
  const getCardQuantityInCollection = (cardId) => {
    // Always get fresh data from userDatabase to ensure we have the latest state
    const freshUserData = userDatabase.getUserData();
    
    if (!freshUserData || !freshUserData.collections) return 0;
    
    let totalQuantity = 0;
    freshUserData.collections.forEach(collection => {
      if (collection.cards && collection.cards.length > 0) {
        collection.cards.forEach(card => {
          // Check if this card matches the base cardId (before the timestamp)
          const baseCardId = card.cardId || card.id;
          const searchBaseCardId = cardId;
          
          // Extract the base card ID from the full ID (remove timestamp part)
          const cardBaseId = baseCardId.includes('-') ? baseCardId.split('-').slice(0, 2).join('-') : baseCardId;
          const searchBaseId = searchBaseCardId.includes('-') ? searchBaseCardId.split('-').slice(0, 2).join('-') : searchBaseCardId;
          
          if (cardBaseId === searchBaseId || baseCardId === searchBaseCardId) {
            totalQuantity += (card.quantity || 0);
          }
        });
      }
    });
    
    
    return totalQuantity;
  };

  // Calculate dynamic price based on variant, condition, and grade
  const calculateDynamicPrice = (card) => {
    if (!card) return 0;
    
    // Base price from the card
    let basePrice = card.price || card.currentValue || card.tcgplayer?.prices?.holofoil?.market || 
                   card.tcgplayer?.prices?.normal?.market || card.tcgplayer?.prices?.reverseHolofoil?.market ||
                   card.tcgplayer?.prices?.firstEditionHolofoil?.market || 0;
    
    // Variant multipliers
    const variantMultipliers = {
      'normal': 1.0,
      'holo': 1.5,
      'reverse-holo': 1.2,
      'first-edition': 3.0,
      'shadowless': 2.5,
      'unlimited': 1.0
    };
    
    // Condition multipliers (for raw cards)
    const conditionMultipliers = {
      'Near Mint': 1.0,
      'Lightly Played': 0.8,
      'Moderately Played': 0.6,
      'Heavily Played': 0.4,
      'Damaged': 0.2
    };
    
    // Grade multipliers (for graded cards)
    const gradeMultipliers = {
      '10': 2.0,
      '9.5': 1.8,
      '9': 1.5,
      '8.5': 1.3,
      '8': 1.1,
      '7.5': 0.9,
      '7': 0.8,
      '6.5': 0.7,
      '6': 0.6,
      '5.5': 0.5,
      '5': 0.4
    };
    
    // Grading service multipliers
    const serviceMultipliers = {
      'PSA': 1.0,
      'BGS': 1.1,
      'CGC': 0.9,
      'TAG': 0.8,
      'ACE': 0.7
    };
    
    // Apply variant multiplier
    let adjustedPrice = basePrice * (variantMultipliers[selectedVariant] || 1.0);
    
    // Apply condition or grade multiplier
    if (isGraded) {
      // For graded cards, apply grade and service multipliers
      adjustedPrice *= (gradeMultipliers[selectedGrade] || 1.0);
      adjustedPrice *= (serviceMultipliers[selectedGradingService] || 1.0);
    } else {
      // For raw cards, apply condition multiplier
      adjustedPrice *= (conditionMultipliers[addCardCondition] || 1.0);
    }
    
    return Math.max(0.01, Math.round(adjustedPrice * 100) / 100); // Round to 2 decimal places, ensure positive
  }

  // Handle clicking on set information to navigate to set page
  const handleSetClick = (setName) => {
    console.log('Navigating to set page for:', setName);
    setSelectedSet(setName);
    setShowSetPage(true);
  }

  // Handle note functionality
  const handleNoteClick = () => {
    console.log('Note button clicked!');
    console.log('selectedCard:', selectedCard);
    console.log('showNoteModal before:', showNoteModal);
    if (selectedCard) {
      // Load existing note if available
      setCardNote(selectedCard.note || '');
      setShowNoteModal(true);
      console.log('Note modal should be opening...');
      console.log('showNoteModal after setShowNoteModal(true):', showNoteModal);
    } else {
      console.log('No selectedCard found');
    }
  }

  const handleSaveNote = () => {
    if (selectedCard) {
      // Update the card with the new note
      selectedCard.note = cardNote;
      console.log('Note saved for card:', selectedCard.name, 'Note:', cardNote);
      setShowNoteModal(false);
    }
  }

  const handleDeleteNote = () => {
    if (selectedCard) {
      selectedCard.note = '';
      setCardNote('');
      console.log('Note deleted for card:', selectedCard.name);
      setShowNoteModal(false);
    }
  }

  // Handle wishlist toggle
  const handleWishlistToggle = (cardId) => {
    setWishlist(prev => {
      const newWishlist = new Set(prev)
      const isCurrentlyWishlisted = newWishlist.has(cardId)
      
      if (isCurrentlyWishlisted) {
        newWishlist.delete(cardId)
        setWishlistNotificationMessage('Removed from wishlist')
      } else {
        newWishlist.add(cardId)
        setWishlistNotificationMessage('Added to wishlist')
      }
      
      // Show notification
      setShowWishlistNotification(true)
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setShowWishlistNotification(false)
      }, 3000)
      
      return newWishlist
    })
  }

  // Handle card menu toggle
  const handleCardMenuToggle = () => {
    setShowCardMenu(!showCardMenu)
  }

  const handlePricingMenuToggle = () => {
    setShowPricingMenu(!showPricingMenu)
  }

  // Handle pricing menu item clicks
  const handleSetPriceAlert = () => {
    setShowPricingMenu(false)
    setShowPriceAlertModal(true)
  }

  const handleEditPricePaid = () => {
    setShowPricingMenu(false)
    setShowEditPricePaidModal(true)
  }

  // Handle menu item clicks
  const handleAddToFolder = () => {
    setShowCardMenu(false)
    setShowAddToFolderModal(true)
  }


  const handleSetCustomTag = () => {
    setShowCardMenu(false)
    setShowSetCustomTagModal(true)
  }

  const handleSendFeedback = () => {
    setShowCardMenu(false)
    setShowSendFeedbackModal(true)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCardMenu && !event.target.closest('.card-menu-container')) {
        setShowCardMenu(false)
      }
      if (showPricingMenu && !event.target.closest('.pricing-menu-container')) {
        setShowPricingMenu(false)
      }
        if (showCardVariantDropdown && !event.target.closest('.variant-dropdown-container')) {
          setShowCardVariantDropdown(false)
        }
        if (showGradingDropdown && !event.target.closest('.grading-dropdown-container')) {
          setShowGradingDropdown(false)
        }
      // Close dropdowns when clicking outside
      if (!event.target.closest('.dropdown-container')) {
        setShowFolderDropdown(false)
        setShowDeckDropdown(false)
        setShowBinderDropdown(false)
        setShowIssueDropdown(false)
        setShowPurchaseSourceDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCardMenu, showPricingMenu, showCardVariantDropdown, showGradingDropdown])

  // Handle actually adding the card to collection with all options
  const handleConfirmAddToCollection = () => {
    // Determine which card to add based on which modal is open
    const card = cardToAdd || cardToAddFromProfile || cardToAddFromSearch;
    if (!card) return;
    
    console.log('Adding card to collection with options:', {
      card: card.name,
      collection: selectedCollectionForAdd,
      quantity: addQuantity,
      variant: selectedVariant,
      condition: addCardCondition,
      isGraded,
      gradingService: selectedGradingService,
      grade: selectedGrade,
      note: addNote
    });
    
    // Create a consistent card ID based on card properties
    // This ensures the same card always gets the same ID regardless of when it's added
    const cardId = card.id || card.cardId || `${card.name}-${card.set?.name || card.set || card.set_name || 'Unknown'}-${card.number || '001'}`.replace(/[^a-zA-Z0-9-]/g, '-');
    
    
    // Prepare card data for database
    const cardData = {
      id: cardId,
      name: card.name,
      set: card.set?.name || card.set || card.set_name || 'Unknown Set',
      set_name: card.set?.name || card.set || card.set_name || 'Unknown Set',
      rarity: card.rarity || 'Unknown',
      number: card.number || '001',
      imageUrl: card.imageUrl || card.images?.large || card.images?.small,
      images: card.images || { small: card.imageUrl, large: card.imageUrl },
      artist: card.artist || 'Unknown Artist',
      currentValue: card.price || card.currentValue || card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0,
      tcgplayer: card.tcgplayer
    };
    
    // Add card to collection using userDatabase
    const success = userDatabase.addCardToCollection(
      selectedCollectionForAdd,
      cardData,
      addQuantity,
      isGraded ? null : addCardCondition,
      selectedVariant,
      isGraded ? selectedGrade : null,
      isGraded ? selectedGradingService : null,
      null, // pricePaid
      addNote || ''
    );
    
    if (success) {
      // Clean up any duplicates that might have been created
      userDatabase.cleanupDuplicates(selectedCollectionForAdd);
      
      // Reload user data to reflect changes
      const updatedUserData = userDatabase.getUserData();
      
      // Update states
      if (updatedUserData) {
        setUserData({...updatedUserData});
        setRecentActivityData([...(updatedUserData.recentActivity || [])]);
        setDisplayedActivity([...(updatedUserData.recentActivity || []).slice(0, 3)]);
      }
      
      // Show notification
      const collectionName = updatedUserData?.collections.find(c => c.id === selectedCollectionForAdd)?.name || 'Collection';
      const quantityText = addQuantity > 1 ? ` (${addQuantity})` : '';
      setCollectionNotificationMessage(`Added ${card.name}${quantityText} to ${collectionName}`);
      setShowCollectionNotification(true);
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setShowCollectionNotification(false);
      }, 3000);
      
      // Close all modals and reset states
      setShowAddToCollectionModal(false);
      setShowCardProfileModal(false);
      setShowSearchResultsModal(false);
      setCardToAdd(null);
      setCardToAddFromProfile(null);
      setCardToAddFromSearch(null);
      
      // Reset form fields for next use
      setAddQuantity(1);
      setSelectedVariant('normal');
      setAddCardCondition('Near Mint');
      setIsGraded(false);
      setSelectedGradingService('PSA');
      setSelectedGrade('10');
      setAddNote('');
      setSelectedCollectionForAdd('pokemon-collection');
    } else {
      console.error('Failed to add card to collection');
      alert('Failed to add card to collection. Please try again.');
    }
  }

  const handleCloseCardProfile = () => {
    setShowCardProfile(false)
    setSelectedCard(null)
  }


  const handleGallerySelect = () => {
    // Gallery selection functionality
    console.log('Gallery selection triggered')
  }

  const handleEditSettings = () => {
    setShowEditModal(true)
  }

  const handleEditModalClose = () => {
    setShowEditModal(false)
  }

  // Chart data generator
  const getChartData = useMemo(() => {
    if (!userData) {
      return {
        labels: [],
        datasets: [{
          label: 'Portfolio Value',
          data: [],
          borderColor: '#6865E7',
          backgroundColor: 'rgba(104, 101, 231, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6865E7',
          pointBorderColor: '#F9F9F9',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      }
    }

    const currentCollection = userData.collections.find(c => c.id === selectedCollection) || userData.collections[0]
    const history = userData.portfolioHistory?.[selectedCollection]?.[selectedTimeRange] || []
    
    // If no history but collection exists, generate initial data point with current value
    if (history.length === 0 && currentCollection) {
      const currentValue = currentCollection.totalValue || 0
      const now = new Date()
      
      // Generate a simple data point showing the current value
      const singlePoint = { date: now.toISOString(), value: currentValue }
      
      return {
        labels: [now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })],
        datasets: [{
          label: 'Portfolio Value',
          data: [convertCurrency(currentValue)],
          borderColor: '#6865E7',
          backgroundColor: 'rgba(104, 101, 231, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6865E7',
          pointBorderColor: '#F9F9F9',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      }
    }
    
    // Ensure we have valid data
    if (!history || history.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Portfolio Value',
            data: [],
            borderColor: '#6865E7',
            backgroundColor: 'rgba(104, 101, 231, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6865E7',
            pointBorderColor: '#F9F9F9',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      }
    }
    
    return {
      labels: history.map(point => {
        const date = new Date(point.date)
        if (selectedTimeRange === '1D') {
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        } else if (selectedTimeRange === '7D') {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } else if (selectedTimeRange === '1M') {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } else if (selectedTimeRange === '3M') {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } else if (selectedTimeRange === '6M') {
          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        } else if (selectedTimeRange === '1Y') {
          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        } else if (selectedTimeRange === 'MAX') {
          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        } else {
          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        }
      }),
      datasets: [
        {
          label: 'Portfolio Value',
          data: history.map(point => convertCurrency(point.value)),
          borderColor: '#6865E7',
          backgroundColor: 'rgba(104, 101, 231, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6865E7',
          pointBorderColor: '#F9F9F9',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    }
  }, [selectedTimeRange, selectedCurrency, selectedCollection, userData])

  // Get top valued cards from user's collection
  const myTopMovers = useMemo(() => {
    if (!userData || !userData.collections) return []
    
    // Get all cards from all collections
    const allCards = []
    userData.collections.forEach(collection => {
      if (collection.cards && collection.cards.length > 0) {
        collection.cards.forEach(card => {
          allCards.push({
            ...card,
            totalValue: (card.currentValue || 0) * (card.quantity || 1)
          })
        })
      }
    })
    
    // Sort by total value (descending) and take top 3
    return allCards
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 3)
  }, [userData])

  // Get graded card options and their prices
  const getGradedOptions = useMemo(() => {
    if (!selectedCard) return []
    
    const basePrice = selectedCard.current_value || selectedCard.price || 12.00
    const gradingOptions = []
    
    // Add raw card option
    gradingOptions.push({
      id: 'raw',
      name: 'Raw',
      price: basePrice,
      multiplier: 1.0
    })
    
    // Add graded options with different multipliers based on grading service
    const gradingServices = [
      { id: 'psa', name: 'PSA', multiplier: 1.5 },
      { id: 'cgc', name: 'CGC', multiplier: 1.3 },
      { id: 'tag', name: 'TAG', multiplier: 1.2 },
      { id: 'bgs', name: 'BGS', multiplier: 1.4 },
      { id: 'ace', name: 'ACE', multiplier: 1.1 }
    ]
    
    gradingServices.forEach(service => {
      gradingOptions.push({
        id: service.id,
        name: service.name,
        price: basePrice * service.multiplier,
        multiplier: service.multiplier
      })
    })
    
    return gradingOptions
  }, [selectedCard])

  // Get card-specific variants and their prices (dynamic based on grading service)
  const getCardVariants = useMemo(() => {
    if (!selectedCard) return []
    
    const basePrice = selectedCard.current_value || selectedCard.price || 12.00
    
    
    const grading = getGradedOptions.find(g => g.id === selectedGradingService)
    const gradingMultiplier = grading ? grading.multiplier : 1.0
    
    const variants = []
    
    // Add normal variant
    variants.push({
      id: 'normal',
      name: 'Normal',
      price: basePrice * gradingMultiplier,
      multiplier: 1.0
    })
    
    // Add holofoil variant (typically 1.5-2x normal price)
    variants.push({
      id: 'holofoil',
      name: 'Holofoil',
      price: basePrice * 1.8 * gradingMultiplier,
      multiplier: 1.8
    })
    
    // Add reverse holofoil variant (typically 1.2-1.5x normal price)
    variants.push({
      id: 'reverseHolofoil',
      name: 'Reverse Holo',
      price: basePrice * 1.3 * gradingMultiplier,
      multiplier: 1.3
    })
    
    // Add first edition if it's a vintage card
    if (selectedCard.set?.name?.includes('Base Set') || selectedCard.set?.name?.includes('Jungle') || selectedCard.set?.name?.includes('Fossil')) {
      variants.push({
        id: 'firstEdition',
        name: '1st Edition',
        price: basePrice * 3.0 * gradingMultiplier,
        multiplier: 3.0
      })
    }
    
    // Add special variants for certain cards
    if (selectedCard.name?.includes('Charizard') || selectedCard.name?.includes('Pikachu')) {
      variants.push({
        id: 'shadowless',
        name: 'Shadowless',
        price: basePrice * 2.5 * gradingMultiplier,
        multiplier: 2.5
      })
    }
    
    return variants
  }, [selectedCard, selectedGradingService, getGradedOptions])

  // Get current price (variant prices already include grading multiplier)
  const getCurrentPrice = useMemo(() => {
    if (!selectedCard) return 0.45 // Default to Psyduck price
    
    const variant = getCardVariants.find(v => v.id === selectedCardVariant)
    if (variant) {
      return variant.price;
    }
    
    // Use the same TCGPlayer data parsing logic as the "Avg. market value" section
    let tcgplayerPrices = {};
    if (selectedCard?.tcgplayer) {
      try {
        tcgplayerPrices = typeof selectedCard.tcgplayer === 'string' 
          ? JSON.parse(selectedCard.tcgplayer) 
          : selectedCard.tcgplayer;
      } catch (error) {
        console.warn('Error parsing TCGPlayer data in getCurrentPrice:', error);
        tcgplayerPrices = {};
      }
    }

    // Use TCGPlayer market price as primary source
    if (tcgplayerPrices.prices?.holofoil?.market) return tcgplayerPrices.prices.holofoil.market;
    if (tcgplayerPrices.prices?.normal?.market) return tcgplayerPrices.prices.normal.market;
    if (tcgplayerPrices.prices?.reverseHolofoil?.market) return tcgplayerPrices.prices.reverseHolofoil.market;
    if (tcgplayerPrices.prices?.firstEditionHolofoil?.market) return tcgplayerPrices.prices.firstEditionHolofoil.market;
    
    // Fallback to current_value (this should have the market price from TCGPlayer)
    if (selectedCard?.current_value) return selectedCard.current_value;
    
    // If no price data available, use a default value based on card name
    if (selectedCard?.name === 'Psyduck') return 0.45;
    return 12.00;
  }, [selectedCard, selectedCardVariant, getCardVariants])

  // Card-specific price chart data generator
  // Helper function to get chart data with parameters
  const getCardChartData = async (card, timeRange, variant, condition, gradingService, grade) => {
    if (!card) {
      return {
        labels: [],
        datasets: [],
        absoluteChange: 0,
        percentageChange: 0
      }
    }

    try {
      // Use TCGPlayer service for real data
      const chartData = await tcgplayerService.getChartData(card.name, card.set_name || card.set, timeRange)
      return chartData
    } catch (error) {
      console.warn('Error fetching TCGPlayer chart data, falling back to mock data:', error)
      
      // Fallback to mock data if TCGPlayer fails
      const dataPoints = priceService.getDataPointsForRange(timeRange)
      const history = priceService.generateHistoricalData(card, timeRange, dataPoints)
      
      // Calculate price changes
      const absoluteChange = history.length > 1 ? history[history.length - 1].value - history[0].value : 0
      const percentageChange = history.length > 1 ? ((history[history.length - 1].value - history[0].value) / history[0].value) * 100 : 0

      return {
        labels: history.map(point => {
          const date = new Date(point.date)
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }),
        datasets: [{
          label: 'Price',
          data: history.map(point => point.value),
          borderColor: '#8871FF',
          backgroundColor: 'rgba(136, 113, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }],
        absoluteChange,
        percentageChange
      }
    }
  }

  // Chart data state for async loading
  const [cardChartData, setCardChartData] = useState({
    labels: [],
    datasets: []
  })

  // Market value data state for async loading
  const [marketValueData, setMarketValueData] = useState({
    currentPrice: 0,
    absoluteChange: 0,
    percentageChange: 0,
    isPositive: false
  })

  // Chart error state
  const [chartError, setChartError] = useState(null)

  // Load chart data when selectedCard or timeRange changes
  useEffect(() => {
    const loadChartData = async () => {
      if (!selectedCard) {
        setCardChartData({
          labels: [],
          datasets: []
        })
        return
      }

      console.log(`Loading chart data for ${selectedCard.name} with time range: ${cardChartTimeRange}`)
      
      try {
        const chartData = await getCardChartData(selectedCard, cardChartTimeRange, selectedCardVariant, 'raw', 'PSA', '10')
        console.log(`Chart data loaded for ${cardChartTimeRange}:`, chartData)
        setCardChartData(chartData)
        setChartError(null) // Clear any previous errors
      } catch (error) {
        console.error('Error loading chart data:', error)
        setChartError(error.message || 'Failed to load chart data')
        // Set empty chart data
        setCardChartData({
          labels: [],
          datasets: []
        })
      }
    }

    loadChartData()
  }, [selectedCard, cardChartTimeRange, selectedCardVariant])

  // Load set cards when selectedSet changes
  useEffect(() => {
    const loadSetCards = async () => {
      if (!selectedSet) {
        setSetCardsData([])
        return
      }

      try {
        const cards = await cardDataMigration.searchCards('', {
          setFilter: selectedSet,
          limit: 1000
        })
        setSetCardsData(cards)
      } catch (error) {
        console.error('Error loading set cards:', error)
        setSetCardsData([])
      }
    }

    loadSetCards()
  }, [selectedSet])

  // Load market value data when selectedCard changes
  useEffect(() => {
    const loadMarketValueData = async () => {
      if (!selectedCard) {
        setMarketValueData({
          currentPrice: 0,
          absoluteChange: 0,
          percentageChange: 0,
          isPositive: false
        })
        return
      }

      try {
        // Use the same time range as the chart for consistency
        const chartData = await getCardChartData(selectedCard, cardChartTimeRange, 'normal', 'raw', 'PSA', '10')
        setMarketValueData({
          currentPrice: chartData.currentPrice || getCurrentPrice,
          absoluteChange: chartData.absoluteChange || 0,
          percentageChange: chartData.percentageChange || 0,
          isPositive: (chartData.absoluteChange || 0) >= 0
        })
      } catch (error) {
        console.error('Error loading market value data:', error)
        setMarketValueData({
          currentPrice: getCurrentPrice,
          absoluteChange: 0,
          percentageChange: 0,
          isPositive: false
        })
      }
    }

    loadMarketValueData()
  }, [selectedCard, cardChartTimeRange, getCurrentPrice])

  // Card chart options
  const cardChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#F9F9F9',
        bodyColor: '#F9F9F9',
        borderColor: '#605DEC',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `Price: $${context.parsed.y.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 10
          },
          callback: function(value) {
            return `$${value.toFixed(2)}`
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#F9F9F9',
        bodyColor: '#F9F9F9',
        borderColor: '#6865E7',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `Value: ${formatCurrency(context.parsed.y)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12
          },
        callback: function(value) {
          return formatCurrency(value)
        }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }

  // Swipe handlers
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentOnboardingStep < 2) {
      handleNextOnboarding()
    }
    if (isRightSwipe && currentOnboardingStep > 0) {
      handlePreviousOnboarding()
    }
  }

  // Google OAuth handler
  const handleGoogleAuth = async () => {
    try {
      // For now, we'll simulate a Google OAuth flow
      // In a real app, you would integrate with Google OAuth 2.0
      console.log(`Google ${currentScreen} initiated`)
      
      // Simulate successful authentication
      console.log(`Google ${currentScreen} successful! (This is a demo - in production this would redirect to Google OAuth)`)
      
      // Simulate first-time user for demo purposes
      setIsFirstTimeUser(true)
      setCurrentScreen('onboarding')
      
      // In a real app, you would:
      // 1. Redirect to Google OAuth consent screen
      // 2. Handle the callback with authorization code
      // 3. Exchange code for access token
      // 4. Use token to get user info
      // 5. Create/login user account
      // 6. Check if user is new and show onboarding
      // 7. Redirect to main app or onboarding
      
    } catch (error) {
      console.error('Google authentication error:', error)
      alert('Google authentication failed. Please try again.')
    }
  }

  // Apple OAuth handler
  const handleAppleAuth = async () => {
    try {
      console.log(`Apple ${currentScreen} initiated`)
      alert(`Apple ${currentScreen} successful! (This is a demo - in production this would redirect to Apple Sign In)`)
    } catch (error) {
      console.error('Apple authentication error:', error)
      alert('Apple authentication failed. Please try again.')
    }
  }

  // Email signup handler
  const handleEmailSignup = async () => {
    try {
      console.log('Email signup initiated')
      setCurrentScreen('manual-signup')
    } catch (error) {
      console.error('Email signup error:', error)
      alert('Email signup failed. Please try again.')
    }
  }

  // Manual signup form handler
  const handleManualSignup = async () => {
    try {
      // Validate required fields
      if (!firstName || !lastName || !signupEmail || !dateOfBirth || !phoneNumber || !username || !signupPassword || !confirmSignupPassword) {
        alert('Please fill in all required fields')
        return
      }

      if (signupPassword !== confirmSignupPassword) {
        alert('Passwords do not match')
        return
      }

      if (signupPassword.length < 6) {
        alert('Password must be at least 6 characters long')
        return
      }

      // Simulate account creation
      console.log('Account created:', {
        firstName,
        lastName,
        email: signupEmail,
        dateOfBirth,
        phoneNumber,
        username
      })
      
      alert('Account created successfully! You can now log in.')
      setCurrentScreen('login')
      
      // In a real app, you would:
      // 1. Validate all form data
      // 2. Check if email/username already exists
      // 3. Hash password
      // 4. Create user account in database
      // 5. Send verification email
      // 6. Redirect to login or dashboard
      
    } catch (error) {
      console.error('Manual signup error:', error)
      alert('Account creation failed. Please try again.')
    }
  }

  // Forgot password handler
  const handleForgotPassword = async () => {
    try {
      if (!email) {
        alert('Please enter your email address')
        return
      }
      
      // Simulate sending reset email
      console.log('Password reset email sent to:', email)
      alert(`Password reset email sent to ${email}! (This is a demo - in production this would send a real email)`)
      
      // In a real app, you would:
      // 1. Validate email format
      // 2. Check if email exists in database
      // 3. Generate reset token
      // 4. Send email with reset link
      // 5. Store token in database with expiration
      
    } catch (error) {
      console.error('Forgot password error:', error)
      alert('Failed to send reset email. Please try again.')
    }
  }

  // Reset password handler
  const handleResetPassword = async () => {
    try {
      if (!newPassword || !confirmPassword) {
        alert('Please fill in all password fields')
        return
      }
      
      if (newPassword !== confirmPassword) {
        alert('Passwords do not match')
        return
      }
      
      if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long')
        return
      }
      
      // Simulate password reset
      console.log('Password reset successful for token:', resetToken)
      alert('Password reset successful! You can now log in with your new password.')
      setCurrentScreen('login')
      
      // In a real app, you would:
      // 1. Validate reset token
      // 2. Check token expiration
      // 3. Hash new password
      // 4. Update password in database
      // 5. Invalidate reset token
      
    } catch (error) {
      console.error('Reset password error:', error)
      alert('Failed to reset password. Please try again.')
    }
  }

  // Card Scanner Interface
  if (showScanner) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: '#01010C' }}>
        {/* Header */}
        <div className="px-4 py-4" style={{ backgroundColor: '#02030D' }}>
          <div className="flex justify-between items-center">
            {/* Close Button */}
            <button 
              onClick={() => setShowScanner(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(32, 32, 32, 0.65)' }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="27" height="27" rx="13.5" fill="#202020" fillOpacity="0.65"/>
                <rect x="0.5" y="0.5" width="27" height="27" rx="13.5" stroke="white"/>
                <path d="M9 9L19 19M9 19L19 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Header Text */}
            <div className="flex-1 text-center">
              <h1 className="text-white text-lg font-bold">Scan Card</h1>
            </div>

            {/* Flash Toggle */}
            <button 
              onClick={() => setFlashEnabled(!flashEnabled)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(32, 32, 32, 0.65)' }}
            >
              {flashEnabled ? (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" y="0.5" width="27" height="27" rx="13.5" fill="#202020" fillOpacity="0.65"/>
                  <rect x="0.5" y="0.5" width="27" height="27" rx="13.5" stroke="#605DEC"/>
                  <path d="M11.3307 6C10.854 6 10.4356 6.31395 10.3039 6.76988L8.04116 14.6427C7.99568 14.8008 7.98777 14.9672 8.01803 15.1289C8.0483 15.2906 8.11592 15.4431 8.21557 15.5743C8.31522 15.7056 8.44417 15.812 8.59226 15.8853C8.74036 15.9585 8.90354 15.9966 9.06894 15.9964H10.3431L9.16649 20.6757C8.901 21.7306 10.2134 22.4524 10.9727 21.6706L19.6977 12.8139L19.7018 12.8099C20.3454 12.143 19.8828 10.9992 18.9304 10.9992H16.3519L17.621 7.40578L17.6231 7.39778C17.6766 7.23812 17.6912 7.06808 17.6657 6.90169C17.6402 6.73531 17.5752 6.57734 17.4762 6.44082C17.3772 6.30429 17.247 6.19312 17.0963 6.11648C16.9455 6.03984 16.7786 5.99991 16.6094 6H11.3307Z" fill="#605DEC"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" y="0.5" width="27" height="27" rx="13.5" fill="#202020" fillOpacity="0.65"/>
                  <rect x="0.5" y="0.5" width="27" height="27" rx="13.5" stroke="white"/>
                  <path d="M10.2977 6.81624C10.3716 6.58025 10.5235 6.37331 10.7308 6.22623C10.9381 6.07916 11.1898 5.99981 11.4482 6H16.7342C16.928 6.00007 17.1189 6.04488 17.2906 6.13058C17.4622 6.21629 17.6095 6.34035 17.7199 6.49215C17.8303 6.64395 17.9004 6.81896 17.9243 7.00222C17.9482 7.18548 17.9252 7.37153 17.8571 7.54445L16.6658 10.5728H19.1012C19.2704 10.573 19.4362 10.6186 19.5794 10.7045C19.7226 10.7903 19.8375 10.9129 19.9109 11.0582C19.9843 11.2035 20.0133 11.3655 19.9944 11.5257C19.9755 11.686 19.9096 11.8379 19.8043 11.964L11.8777 21.4525C10.8532 22.6792 8.80403 21.6674 9.26472 20.163L10.8004 15.1455H8.90121C8.76098 15.1457 8.62264 15.1147 8.49722 15.0549C8.37181 14.9952 8.2628 14.9083 8.17888 14.8012C8.09497 14.6941 8.03848 14.5699 8.01391 14.4383C7.98935 14.3068 7.99739 14.1716 8.03741 14.0435L10.2977 6.81624Z" fill="white"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Camera Viewfinder */}
        <div className="flex-1 relative overflow-hidden">
          {/* Camera Feed Placeholder */}
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="text-center">
              <p className="text-white/70 text-sm">Camera feed will appear here</p>
              <p className="text-white/50 text-xs mt-1">Position card within the guide</p>
            </div>
          </div>

          {/* Card Alignment Guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Darkened Overlay */}
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}></div>
            
            {/* Card Frame Cutout */}
            <div className="relative">
              {/* Card Border - matches the design */}
              <div 
                className="border-4 rounded-lg bg-transparent"
                style={{ 
                  width: '307px', 
                  height: '413px',
                  borderColor: '#605DEC'
                }}
              >
                {/* Corner Guides */}
                <div className="absolute -top-3 -left-3">
                  <div className="w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
                </div>
                <div className="absolute -top-3 -right-3">
                  <div className="w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
                </div>
                <div className="absolute -bottom-3 -left-3">
                  <div className="w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
                </div>
                <div className="absolute -bottom-3 -right-3">
                  <div className="w-6 h-6 border-r-4 border-b-4 border-white rounded-br-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-center gap-8 p-6 pb-12">
          {/* Edit Button */}
          <button 
            onClick={handleEditSettings}
            className="w-16 h-16 flex items-center justify-center"
          >
            <img src="/Assets/edit.svg" alt="Edit" className="w-8 h-8" />
          </button>

          {/* Manual Scan Button */}
          <button 
            onClick={handleManualScan}
            className="w-20 h-20 flex items-center justify-center"
          >
            <img src="/Assets/Scan.svg" alt="Scan" className="w-20 h-20" />
          </button>

          {/* Gallery Button */}
          <button 
            onClick={handleGallerySelect}
            className="w-16 h-16 flex items-center justify-center"
          >
            <img src="/Assets/gallery-circle-bold.svg" alt="Gallery" className="w-8 h-8" />
          </button>
        </div>


        {/* Edit Modal - Compact Design */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-[#2b2b2b] rounded-2xl w-full max-w-sm border border-gray-700/50 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <h2 className="text-white text-lg font-bold">Scan Settings</h2>
                <button
                  onClick={handleEditModalClose}
                  className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Settings Options */}
              <div className="p-4">
                {/* Folder Selection */}
                <div className="mb-4">
                  <h3 className="text-white text-sm font-medium mb-2">Collection</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Collection', 'Wishlist', 'Trading', 'Selling'].map((folder) => (
                      <button
                        key={folder}
                        onClick={() => setSelectedFolder(folder)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedFolder === folder
                            ? 'bg-[#6865E7] text-white'
                            : 'bg-gray-700 text-white/70 hover:bg-gray-600'
                        }`}
                      >
                        {folder}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition Selection */}
                <div className="mb-6">
                  <h3 className="text-white text-sm font-medium mb-2">Condition</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'].map((condition) => (
                      <button
                        key={condition}
                        onClick={() => setSelectedCondition(condition)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          selectedCondition === condition
                            ? 'bg-[#6865E7] text-white'
                            : 'bg-gray-700 text-white/70 hover:bg-gray-600'
                        }`}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Language Selection */}
                <div className="mb-6">
                  <h3 className="text-white text-sm font-medium mb-2">Default Language</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'english', label: 'English' },
                      { value: 'japanese', label: 'Japanese' },
                      { value: 'chinese', label: 'Chinese' },
                      { value: 'korean', label: 'Korean' },
                      { value: 'german', label: 'German' },
                      { value: 'spanish', label: 'Spanish' },
                      { value: 'french', label: 'French' },
                      { value: 'italian', label: 'Italian' }
                    ].map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => setDefaultLanguage(lang.value)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          defaultLanguage === lang.value
                            ? 'bg-[#6865E7] text-white'
                            : 'bg-gray-700 text-white/70 hover:bg-gray-600'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleEditModalClose}
                  className="w-full bg-gradient-to-r from-[#6865E7] to-[#5A57D1] hover:from-[#5A57D1] hover:to-[#4C49BB] text-white py-3 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg shadow-[#6865E7]/25"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scan Confirmation Modal */}
        {showScanConfirm && (
          <div className="fixed inset-0 z-[70] flex items-end pointer-events-none">
            {/* No backdrop - allows camera to remain visible */}
            
            {/* Confirmation Card - Horizontal Layout */}
            <div 
              className={`relative bg-[rgba(32,32,32,0.95)] border border-white/20 rounded-lg p-3 w-full max-w-sm mx-auto transition-opacity duration-500 shadow-2xl ${
                isScanConfirmFading ? 'opacity-0' : 'opacity-100'
              }`}
              style={{
                marginBottom: '165px'
              }}
            >
              <div className="flex items-center justify-between gap-1">
                {/* Left side - Card Image */}
                <div className="w-[45.63px] h-[63.275px] bg-gray-700 rounded-lg shrink-0 overflow-hidden">
                  {scannedCard && scannedCard.imageUrl ? (
                    <img 
                      src={scannedCard.imageUrl} 
                      alt={scannedCard.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center" style={{display: (scannedCard && scannedCard.imageUrl) ? 'none' : 'flex'}}>
                    <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Middle section - Card Details */}
                <div className="flex-1 flex flex-col items-start gap-1">
                  {/* Card Name */}
                  <div className="text-white text-xs font-bold leading-tight">
                    {scannedCard ? scannedCard.name : ''}
                  </div>
                  
                  {/* Card Details */}
                  <div className="flex flex-col items-start text-white/70 text-[10px] leading-tight">
                    <div>{scannedCard ? scannedCard.set : ''}</div>
                    <div>{scannedCard ? scannedCard.rarity : ''}</div>
                    <div>{scannedCard ? scannedCard.number : ''}</div>
                  </div>
                </div>

                {/* Right side - Price and Status */}
                <div className="flex flex-col items-end justify-between h-[63.275px]">
                  {/* Price */}
                  <div className="text-[#8871FF] text-base font-black text-center">
                    {scannedCard ? `$${scannedCard.price.toLocaleString()}` : ''}
                  </div>
                  
                  {/* Success message */}
                  <div className="text-green-400 text-xs font-medium text-center">
                    {scannedCard ? `✓ Added to ${scannedCard.folder}` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

        // Set Page Component (takes priority over card profile)
        if (showSetPage && selectedSet) {
          // Get all cards from the selected set - will be loaded via useEffect
          const setCards = setCardsData || [];

          return (
            <div className="fixed inset-0 z-[60] bg-background overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-gray-800 z-10">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowSetPage(false)}
                      className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div>
                      <h1 className="text-white text-xl font-bold">{selectedSet}</h1>
                      <p className="text-gray-400 text-sm">{setCards.length} cards</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSetPage(false)}
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Set Cards Grid */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {setCards.map((card, index) => (
                    <div
                      key={`set-${card.id}-${index}`}
                      className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedCard(card);
                        setShowCardProfile(true);
                        setShowSetPage(false);
                      }}
                    >
                      <div className="aspect-[3/4] bg-gray-700 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                        <img
                          src={card.images?.small || card.imageUrl}
                          alt={card.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                          <span className="text-gray-400 text-sm">Card Image</span>
                        </div>
                      </div>
                      <h3 className="text-white font-medium text-sm mb-1">{card.name}</h3>
                      <p className="text-gray-400 text-xs mb-2">{card.number}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-primary font-bold text-sm">${(() => {
                          if (card.currentValue) return card.currentValue.toFixed(2);
                          if (card.tcgplayer?.prices?.holofoil?.market) return card.tcgplayer.prices.holofoil.market.toFixed(2);
                          if (card.tcgplayer?.prices?.normal?.market) return card.tcgplayer.prices.normal.market.toFixed(2);
                          return '0.00';
                        })()}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCollection(card);
                          }}
                          className="bg-primary text-accent px-3 py-1 rounded-lg text-xs font-medium hover:bg-primary/80 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {setCards.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No cards found in this set.</p>
                  </div>
                )}
              </div>
      </div>
    )
  }

        // Card Profile Screen
        if (showCardProfile && selectedCard) {
          return (
            <div className="fixed inset-0 z-[60] bg-background overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-gray-800 z-10">
                <div className="flex items-center justify-between p-4">
                  {/* Logo */}
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-white">logoipsum</h1>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>

                  {/* User Profile and Menu */}
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm">@Stuart60</span>
                    <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{mockUserData.profilePicture}</span>
                    </div>
                    <button>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-header with back arrow and share */}
              <div className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={handleCloseCardProfile}
                    className="w-6 h-6 text-white"
                  >
                    <img src="/Assets/Back_arrow.svg" alt="Back" className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={handleShare}
                    className="w-6 h-6 text-white hover:opacity-80 transition-opacity"
                  >
                    <img src="/Assets/share_card.svg" alt="Share" className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Card Image Section */}
              <div className="px-4 py-6">
                <div className="flex flex-col items-center gap-4">
                  {/* Card Image */}
                  <div className="w-[217px] h-[301px]">
                    <HolographicCard
                      src={(() => {
                        // Ensure we return a string, not a function
                        const imageSrc = selectedCard.imageUrl || selectedCard.images?.large || selectedCard.images?.small || cardImages[selectedCard.id];
                        return typeof imageSrc === 'string' ? imageSrc : '';
                      })()}
                      alt={selectedCard.name}
                      className="w-full h-full bg-transparent rounded-xl overflow-hidden"
                      enableGyroscope={true}
                      enableHolographic={true}
                      cardRarity={selectedCard.rarity || 'common'}
                      showExpandedOverlay={true}
                      onExpandedClick={() => {}}
                    />
                  </div>

                  {/* Card Info */}
                  <div className="flex flex-col items-center gap-1 w-[124px]">
                    {/* Card Name with Status */}
                    <div className="flex items-center gap-2 justify-center">
                      <h2 className="text-lg font-semibold text-white leading-tight whitespace-nowrap">{selectedCard.name}</h2>
                      {(selectedCard.collected !== false && (selectedCard.quantity > 0 || selectedCard.collected === true)) ? (
                        <img src="/Assets/Collected=Yes.svg" alt="Collected" className="w-[18px] h-[18px] flex-shrink-0" />
                      ) : (
                        <img src="/Assets/Collected=No.svg" alt="Not Collected" className="w-[18px] h-[18px] flex-shrink-0" />
                      )}
                    </div>

                    {/* Rarity */}
                    <p className="text-sm text-white text-center">{selectedCard.rarity}</p>

                    {/* Illustrator */}
                    <button 
                      onClick={() => handleArtistSearch(selectedCard.artist)}
                      className="text-sm text-[#605dec] text-center hover:text-[#7c7aff] hover:underline transition-colors cursor-pointer"
                      disabled={!selectedCard.artist}
                    >
                      {selectedCard.artist || 'Unknown Artist'}
                    </button>
                  </div>
                </div>

              </div>

              {/* Set Information Section */}
              <div className="px-4">
                <div 
                  className="bg-gray-700 rounded-2xl p-4 mb-0 relative z-0"
                  style={{
                    paddingBottom: '64px',
                    marginBottom: '0',
                    top: '0px',
                    marginTop: '0px'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Card Number Indicator */}
                      <div className="relative">
                        <img src="/Assets/Cardnumb_Background.svg" alt="Card Number" className="w-[46px] h-[28px]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {selectedCard.number ? selectedCard.number.replace('#', '') : '001'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Set and Expansion Info */}
                      <div 
                        className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          const setName = selectedCard.set_name || selectedCard.set?.name || selectedCard.set || 'Set Name';
                          handleSetClick(setName);
                        }}
                      >
                        <span className="text-white text-sm font-medium">
                          {selectedCard.set_name || selectedCard.set?.name || selectedCard.set || 'Set Name'}
                        </span>
                        <span className="text-gray-300 text-xs">
                          {(() => {
                            const set = selectedCard.set_name || selectedCard.set?.name || selectedCard.set || '';
                            // Map set names to their series
                            const seriesMap = {
                              'Base Set': 'Base Series',
                              'Vivid Voltage': 'Sword & Shield Series',
                              'Silver Tempest': 'Sword & Shield Series',
                              'Evolving Skies': 'Sword & Shield Series',
                              'Pokemon GO': 'Sword & Shield Series',
                              'Darkness Ablaze': 'Sword & Shield Series',
                              'Chilling Reign': 'Sword & Shield Series',
                              'Battle Styles': 'Sword & Shield Series',
                              'Fusion Strike': 'Sword & Shield Series',
                              'Gym Challenge': 'Gym Series',
                              'Team Rocket': 'Team Rocket Series',
                              'Neo Genesis': 'Neo Series',
                              'Neo Discovery': 'Neo Series',
                              'Neo Revelation': 'Neo Series',
                              'Neo Destiny': 'Neo Series'
                            };
                            return seriesMap[set] || selectedCard.set?.series || selectedCard.series || 'Pokemon TCG';
                          })()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Navigation Chevron */}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card Details Section */}
              <div className="px-4 pb-6">
                {/* Card Number and Set Info */}
                <div className="bg-gray-800 rounded-2xl p-6 mb-6 -mt-12 relative z-[1]">


                  {/* Action Icons */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <button 
                        className="w-6 h-6 text-white hover:opacity-80 transition-opacity"
                        onClick={handleNoteClick}
                      >
                        {selectedCard?.note ? (
                          <svg 
                            className="w-6 h-6" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M2.75499 14.7161L3.27199 16.6481C3.87599 18.9031 4.17899 20.0311 4.86399 20.7621C5.40464 21.3389 6.10408 21.7425 6.87399 21.9221C7.84999 22.1501 8.97799 21.8481 11.234 21.2441C13.488 20.6401 14.616 20.3381 15.347 19.6531C15.4077 19.5958 15.4663 19.5371 15.523 19.4771C15.1824 19.4464 14.8439 19.3963 14.509 19.3271C13.813 19.1891 12.986 18.9671 12.008 18.7051L11.901 18.6761L11.876 18.6701C10.812 18.3841 9.92299 18.1461 9.21299 17.8901C8.46599 17.6201 7.78799 17.2871 7.21099 16.7471C6.41731 16.0035 5.86191 15.0413 5.61499 13.9821C5.43499 13.2131 5.48699 12.4591 5.62699 11.6781C5.76099 10.9291 6.00099 10.0311 6.28899 8.95609L6.82399 6.96209L6.84199 6.89209C4.92199 7.40909 3.91099 7.71509 3.23699 8.34609C2.65949 8.88714 2.25545 9.58734 2.07599 10.3581C1.84799 11.3331 2.14999 12.4611 2.75499 14.7161Z" fill="#605DEC"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M20.83 10.715L20.312 12.647C19.707 14.902 19.405 16.03 18.72 16.761C18.1795 17.3382 17.48 17.7422 16.71 17.922C16.6133 17.9447 16.515 17.962 16.415 17.974C15.5 18.087 14.383 17.788 12.351 17.244C10.096 16.639 8.96799 16.337 8.23699 15.652C7.65966 15.1112 7.25563 14.4114 7.07599 13.641C6.84799 12.665 7.14999 11.538 7.75499 9.28299L8.27199 7.35099L8.51599 6.44599C8.97099 4.77999 9.27699 3.86299 9.86399 3.23599C10.4046 2.65919 11.1041 2.25553 11.874 2.07599C12.85 1.84799 13.978 2.14999 16.234 2.75499C18.488 3.35899 19.616 3.66099 20.347 4.34499C20.9245 4.88605 21.3285 5.58625 21.508 6.35699C21.736 7.33299 21.434 8.45999 20.83 10.715ZM11.051 9.80499C11.0765 9.70984 11.1205 9.62065 11.1805 9.54251C11.2405 9.46437 11.3154 9.39883 11.4007 9.34961C11.486 9.30039 11.5802 9.26847 11.6779 9.25566C11.7756 9.24286 11.8749 9.24943 11.97 9.27499L16.8 10.57C16.8976 10.5931 16.9897 10.6357 17.0706 10.695C17.1515 10.7544 17.2197 10.8294 17.2711 10.9156C17.3225 11.0018 17.3561 11.0974 17.3699 11.1968C17.3836 11.2963 17.3773 11.3974 17.3513 11.4943C17.3252 11.5913 17.28 11.682 17.2183 11.7611C17.1565 11.8402 17.0795 11.9062 16.9919 11.955C16.9042 12.0038 16.8076 12.0346 16.7078 12.0454C16.608 12.0562 16.5071 12.0469 16.411 12.018L11.581 10.724C11.389 10.6724 11.2254 10.5468 11.126 10.3747C11.0267 10.2025 10.9997 9.99701 11.051 9.80499ZM10.275 12.704C10.3266 12.512 10.4522 12.3484 10.6243 12.249C10.7964 12.1497 11.001 12.1227 11.193 12.174L14.091 12.951C14.1891 12.9736 14.2817 13.0158 14.3631 13.075C14.4446 13.1342 14.5133 13.2092 14.5652 13.2955C14.6171 13.3818 14.651 13.4777 14.665 13.5774C14.679 13.6771 14.6728 13.7786 14.6468 13.8759C14.6207 13.9732 14.5753 14.0642 14.5133 14.1435C14.4513 14.2229 14.374 14.2889 14.2859 14.3378C14.1978 14.3866 14.1008 14.4172 14.0007 14.4277C13.9005 14.4382 13.7993 14.4284 13.703 14.399L10.805 13.623C10.7098 13.5975 10.6206 13.5534 10.5425 13.4934C10.4644 13.4334 10.3988 13.3586 10.3496 13.2733C10.3004 13.1879 10.2685 13.0937 10.2557 12.9961C10.2429 12.8984 10.2494 12.7991 10.275 12.704Z" fill="#605DEC"/>
                        </svg>
                        ) : (
                          <img 
                            src="/Assets/Notes Icon_None.svg" 
                            alt="No Note" 
                            className="w-6 h-6"
                            style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                          />
                        )}
                      </button>
                      <button 
                        className="w-6 h-6 text-white hover:opacity-80 transition-opacity"
                        onClick={() => handleWishlistToggle(selectedCard.id)}
                      >
                        {wishlist.has(selectedCard.id) ? (
                          <img 
                            src="/Assets/Wishlisted_card.svg" 
                            alt="Remove from Wishlist" 
                            className="w-6 h-6"
                          />
                        ) : (
                          <img 
                            src="/Assets/Wishlist_white.svg" 
                            alt="Add to Wishlist" 
                            className="w-6 h-6"
                          />
                        )}
                      </button>
                    </div>
                    
                    {/* Centered Quantity Text */}
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                      <span className="text-white text-sm">Qty: {getCardQuantityInCollection(selectedCard.cardId || selectedCard.id)}</span>
                    </div>
                    
                    <button 
                      className="w-6 h-6 text-white hover:opacity-80 transition-opacity relative card-menu-container"
                      onClick={handleCardMenuToggle}
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Card Menu */}
                  {showCardMenu && (
                    <div className="absolute top-16 right-0 z-[80] bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-lg shadow-2xl min-w-[160px] card-menu-container">
                      <div className="py-2">
                        <button 
                          onClick={handleViewMyCards}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-700/50 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 20 20">
                            <g clipPath="url(#clip0_363_5703)">
                              <path d="M15.105 19.0527L10.4474 16.8878C10.1388 16.7443 10.0046 16.3774 10.1481 16.0684L13.444 8.97766C13.5872 8.66891 13.9545 8.53493 14.2629 8.67817L18.9207 10.8436C19.2293 10.987 19.3632 11.3539 19.2197 11.6625L15.924 18.7532C15.7804 19.062 15.4133 19.196 15.105 19.0527ZM3.86524 18.2791L0.773053 11.0973C0.638366 10.7845 0.783014 10.4214 1.09532 10.287L2.62641 9.6279L4.5395 16.8171C4.72286 17.5041 5.42837 17.9139 6.11606 17.7308L7.64075 17.3251L4.67563 18.6019C4.36286 18.7364 3.99993 18.5919 3.86524 18.2791ZM5.18907 16.644L3.17821 9.08743C3.09071 8.75852 3.2868 8.42032 3.61532 8.33305L4.94473 7.97946L4.78465 9.1695C4.69005 9.87403 5.18403 10.5231 5.88954 10.6182L9.00782 11.0384L7.73841 15.3145C7.60774 15.7551 7.72395 16.2109 8.00661 16.5325L5.94333 17.0813C5.61442 17.1688 5.27657 16.9731 5.18907 16.644ZM9.42454 16.458L8.79876 16.2721C8.47219 16.1748 8.28626 15.832 8.38298 15.5054L10.6084 8.0093C10.7054 7.68274 11.049 7.4968 11.3749 7.59329L13.2918 8.16294C13.0929 8.29413 12.9344 8.47837 12.8343 8.69458L9.53825 15.7856C9.44059 15.9955 9.40141 16.2277 9.42454 16.458ZM9.20161 10.3865L5.9795 9.95227C5.64227 9.90673 5.40512 9.59602 5.45067 9.2586L6.49481 1.50899C6.54012 1.17177 6.85126 0.934851 7.18778 0.980164L12.2787 1.66622C12.6157 1.71177 12.8526 2.02266 12.8073 2.35966L12.1649 7.12735L11.566 6.94954C10.8837 6.74653 10.1666 7.13641 9.9643 7.81798L9.20161 10.3865Z" fill="#8F8F94"/>
                            </g>
                            <defs>
                              <clipPath id="clip0_363_5703">
                                <rect width="20" height="20" fill="white"/>
                              </clipPath>
                            </defs>
                          </svg>
                          <span className="text-gray-300 text-sm font-medium">View My Cards</span>
                        </button>
                        <button 
                          onClick={handleAddToFolder}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-700/50 transition-colors"
                        >
                          <img src="/Assets/Addtofolder.svg" alt="Add to Folder" className="w-5 h-5" />
                          <span className="text-gray-300 text-sm font-medium">Add to Folder</span>
                        </button>
                        <button 
                          onClick={handleAddToDeck}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-700/50 transition-colors"
                        >
                          <img src="/Assets/Addtodeck.svg" alt="Add to Deck" className="w-5 h-5" />
                          <span className="text-gray-300 text-sm font-medium">Add to Deck</span>
                        </button>
                        <button 
                          onClick={handleAddToBinder}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-700/50 transition-colors"
                        >
                          <img src="/Assets/Addtobinder.svg" alt="Add to Binder" className="w-5 h-5" />
                          <span className="text-gray-300 text-sm font-medium">Add to Binder</span>
                        </button>
                        <button 
                          onClick={handleSetCustomTag}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-700/50 transition-colors"
                        >
                          <img src="/Assets/SetTag.svg" alt="Set Custom Tag" className="w-5 h-5" />
                          <span className="text-gray-300 text-sm font-medium">Set Custom Tag</span>
                        </button>
                        <button 
                          onClick={handleSendFeedback}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-700/50 transition-colors"
                        >
                          <img src="/Assets/Sendfeedback.svg" alt="Send Feedback" className="w-5 h-5" />
                          <span className="text-gray-300 text-sm font-medium">Send Feedback</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white">Avg. market value</span>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          <svg className={`w-4 h-4 ${marketValueData.isPositive ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={marketValueData.isPositive 
                              ? "M7 11l5-5m0 0l5 5m-5-5v12"
                              : "M17 13l-5 5m0 0l-5-5m5 5V6"
                            } />
                          </svg>
                          <span className="text-white text-lg font-bold">
                            ${marketValueData.currentPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className={`text-sm ${marketValueData.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          ${marketValueData.absoluteChange >= 0 ? '+' : ''}${marketValueData.absoluteChange.toFixed(2)} ({marketValueData.percentageChange >= 0 ? '+' : ''}${marketValueData.percentageChange.toFixed(2)}%)
                        </div>
                        <div className="text-gray-400 text-xs">
                          market data
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add to Collection Button */}
                <div className="mb-6">
                  <button 
                    onClick={() => handleAddToCollection(selectedCard)}
                    className="w-full bg-[#605DEC] text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-[#605DEC]/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add To Collection
                  </button>
                </div>

                {/* Market Value Chart Section */}
                <div className="bg-gray-800 rounded-2xl p-6 mb-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 17 18">
                        <path d="M1.70093 2.17285V15.7705H15.2986" stroke="white" strokeWidth="1.28571" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4.83911 8.44851L6.59152 10.2009C7.03773 10.6471 7.78063 10.5736 8.13067 10.0485L11.0651 5.64692C11.3784 5.17688 12.0187 5.05953 12.4784 5.38789L15.2989 7.40253" stroke="white" strokeWidth="1.28571" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <h3 className="text-white font-medium">Market Value</h3>
                    </div>
                    <button 
                      className="w-6 h-6 text-white hover:opacity-80 transition-opacity relative pricing-menu-container"
                      onClick={handlePricingMenuToggle}
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Pricing Menu */}
                  {showPricingMenu && (
                    <div className="absolute right-0 top-12 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-2 w-56 pricing-menu-container">
                      <button
                        onClick={handleSetPriceAlert}
                        className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                      >
                        <img src="/Assets/PriceAlert.svg" alt="Price Alert" className="w-4 h-4" />
                        <span>Set Pricing Alerts</span>
                      </button>
                      <button
                        onClick={handleEditPricePaid}
                        className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                      >
                        <img src="/Assets/Edit Price Paid.svg" alt="Edit Price Paid" className="w-4 h-4" />
                        <span>Edit Price Paid</span>
                      </button>
                    </div>
                  )}

                  {/* Price and Filters */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-white text-xl font-bold">
                  ${getCurrentPrice.toFixed(2)}
                      </span>
                      <div className={`flex items-center gap-1 text-sm ${(() => {
                        // Use the same calculation as the chart data to ensure consistency
                        const chartData = getCardChartData
                        if (!chartData.datasets || chartData.datasets.length === 0) {
                          return 'text-gray-400'
                        }
                        
                        const history = chartData.datasets[0].data
                        if (history.length < 2) {
                          return 'text-gray-400'
                        }
                        
                        // Calculate absolute price change from start to end of time range
                        const currentPrice = history[history.length - 1]
                        const startPrice = history[0]
                        const absoluteChange = currentPrice - startPrice
                        
                        
                        return absoluteChange >= 0 ? 'text-green-400' : 'text-red-400'
                      })()}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                            (() => {
                              // Use the same calculation as the chart data to ensure consistency
                              const chartData = getCardChartData
                              if (!chartData.datasets || chartData.datasets.length === 0) {
                                return "M7 11l5-5m0 0l5 5m-5-5v12" // Default up arrow
                              }
                              
                              const history = chartData.datasets[0].data
                              if (history.length < 2) {
                                return "M7 11l5-5m0 0l5 5m-5-5v12" // Default up arrow
                              }
                              
                              // Calculate absolute price change from start to end of time range
                              const currentPrice = history[history.length - 1]
                              const startPrice = history[0]
                              const absoluteChange = currentPrice - startPrice
                              
                              
                              // Return correct arrow based on price change direction
                              if (absoluteChange >= 0) {
                                return "M7 11l5-5m0 0l5 5m-5-5v12" // Up arrow for increase
                              } else {
                                return "M17 13l-5 5m0 0l-5-5m5 5V6" // Down arrow for decrease
                              }
                            })()
                          } />
                        </svg>
                        <span>{(() => {
                          // Use the same calculation as the chart data to ensure consistency
                          const chartData = getCardChartData
                          if (!chartData.datasets || chartData.datasets.length === 0) {
                            return '$0.00'
                          }
                          
                          const history = chartData.datasets[0].data
                          if (history.length < 2) {
                            return '$0.00'
                          }
                          
                          // Calculate absolute price change from start to end of time range
                          const currentPrice = history[history.length - 1]
                          const startPrice = history[0]
                          const absoluteChange = currentPrice - startPrice
                          
                          
                          return `$${absoluteChange >= 0 ? '+' : '-'}${Math.abs(absoluteChange).toFixed(2)}`
                        })()}</span>
                        <span>{(() => {
                          // Update text based on timeline selection
                          const tcgplayerPrices = selectedCard?.tcgplayer?.prices || {}
                          const hasRealData = tcgplayerPrices.holofoil?.market || tcgplayerPrices.normal?.market
                          
                          if (!hasRealData) return 'estimated'
                          
                          switch (cardChartTimeRange) {
                            case '1D': return 'today'
                            case '7D': return 'this week'
                            case '1M': return 'this month'
                            case '3M': return 'past 3 months'
                            case '6M': return 'past 6 months'
                            case '1Y': return 'past year'
                            default: return 'this week'
                          }
                        })()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative variant-dropdown-container">
                        <button 
                          onClick={() => setShowCardVariantDropdown(!showCardVariantDropdown)}
                          className="px-3 py-1 bg-gray-700 text-white text-sm rounded flex items-center gap-1 hover:bg-gray-600 transition-colors"
                        >
                          {getCardVariants.find(v => v.id === selectedCardVariant)?.name || 'Normal'}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                        {showCardVariantDropdown && (
                          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[120px]">
                            {getCardVariants.map((variant) => (
                              <button
                                key={variant.id}
                                onClick={() => {
                                  setSelectedCardVariant(variant.id)
                                  setShowCardVariantDropdown(false)
                                }}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                  selectedCardVariant === variant.id ? 'bg-gray-700 text-white' : 'text-gray-300'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span>{variant.name}</span>
                                  <span className="text-xs text-gray-400">${variant.price.toFixed(2)}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Grading Service Dropdown */}
                      <div className="relative grading-dropdown-container">
                        <button 
                          onClick={() => setShowGradingDropdown(!showGradingDropdown)}
                          className="px-3 py-1 bg-gray-700 text-white text-sm rounded flex items-center gap-1 hover:bg-gray-600 transition-colors"
                        >
                          {getGradedOptions.find(g => g.id === selectedGradingService)?.name || 'Raw'}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                        {showGradingDropdown && (
                          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[120px]">
                            {getGradedOptions.map((grading) => (
                              <button
                                key={grading.id}
                                onClick={() => {
                                  setSelectedGradingService(grading.id)
                                  setShowGradingDropdown(false)
                                }}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                  selectedGradingService === grading.id ? 'bg-gray-700 text-white' : 'text-gray-300'
                                }`}
                              >
                                <span>{grading.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Price Chart */}
                  <div className="h-48 bg-gray-700 rounded-lg mb-4 p-4">
                    {chartError ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <svg className="w-12 h-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Chart Data Unavailable</h3>
                        <p className="text-gray-300 text-sm mb-3">{chartError}</p>
                        <button 
                          onClick={() => {
                            setChartError(null)
                            // Trigger reload by updating time range
                            setCardChartTimeRange(cardChartTimeRange)
                          }}
                          className="px-4 py-2 bg-[#605DEC] hover:bg-[#4F46E5] text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <Line data={cardChartData} options={cardChartOptions} />
                    )}
                  </div>

                  {/* Time Range Buttons */}
                  <div className="flex gap-2 mb-4 w-full">
                    {['1D', '7D', '1M', '3M', '6M', '1Y'].map((period) => (
                      <button 
                        key={period}
                        onClick={() => setCardChartTimeRange(period)}
                        className={`flex-1 px-3 py-2 text-sm rounded font-medium ${
                          cardChartTimeRange === period 
                            ? 'bg-[#605DEC] text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Values Section */}
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-white text-sm mb-3">
                      {selectedGradingService === 'raw' ? 'Ungraded Values' : `${getGradedOptions.find(g => g.id === selectedGradingService)?.name} Values`}
                    </h4>
                    <div className={`${selectedGradingService === 'raw' ? 'grid grid-cols-5 gap-2' : 'flex gap-2 overflow-x-auto pb-2'}`}>
                      {selectedGradingService === 'raw' ? (
                        // Raw card conditions
                        [
                          { id: 'nm', name: 'NM', fullName: 'Near Mint', multiplier: 1.0 },
                          { id: 'lp', name: 'LP', fullName: 'Lightly Played', multiplier: 0.8 },
                          { id: 'mp', name: 'MP', fullName: 'Moderately Played', multiplier: 0.6 },
                          { id: 'hp', name: 'HP', fullName: 'Heavily Played', multiplier: 0.4 },
                          { id: 'dm', name: 'DM', fullName: 'Damaged', multiplier: 0.2 }
                        ].map(condition => {
                          const basePrice = selectedCard?.current_value || selectedCard?.price || 12.00
                          const price = basePrice * condition.multiplier
                          return (
                            <div key={condition.id} className="bg-gray-700 rounded p-2 text-center">
                              <div className="text-white text-xs mb-1">{condition.name}</div>
                              <div className="text-white text-xs font-medium">${price.toFixed(2)}</div>
                            </div>
                          )
                        })
                      ) : (
                        // Graded card grades
                        (() => {
                          const gradingService = getGradedOptions.find(g => g.id === selectedGradingService)
                          if (!gradingService) return []
                          
                          const basePrice = selectedCard?.current_value || selectedCard?.price || 12.00
                          const gradingMultiplier = gradingService.multiplier
                          
                          // Define grade ranges for different services based on official grading scales
                          const gradeRanges = {
                            'psa': [
                              { id: '10', name: '10', multiplier: 3.0 },
                              { id: '9', name: '9', multiplier: 2.0 },
                              { id: '8', name: '8', multiplier: 1.5 },
                              { id: '7', name: '7', multiplier: 1.2 },
                              { id: '6', name: '6', multiplier: 1.0 },
                              { id: '5', name: '5', multiplier: 0.8 },
                              { id: '4', name: '4', multiplier: 0.6 },
                              { id: '3', name: '3', multiplier: 0.4 },
                              { id: '2', name: '2', multiplier: 0.3 },
                              { id: '1.5', name: '1.5', multiplier: 0.25 },
                              { id: '1', name: '1', multiplier: 0.2 }
                            ],
                            'cgc': [
                              { id: '10', name: '10', multiplier: 2.8 },
                              { id: '9.5', name: '9.5', multiplier: 2.2 },
                              { id: '9', name: '9', multiplier: 1.8 },
                              { id: '8.5', name: '8.5', multiplier: 1.4 },
                              { id: '8', name: '8', multiplier: 1.1 },
                              { id: '7.5', name: '7.5', multiplier: 0.9 },
                              { id: '7', name: '7', multiplier: 0.7 },
                              { id: '6.5', name: '6.5', multiplier: 0.6 },
                              { id: '6', name: '6', multiplier: 0.5 },
                              { id: '5.5', name: '5.5', multiplier: 0.4 },
                              { id: '5', name: '5', multiplier: 0.35 },
                              { id: '4.5', name: '4.5', multiplier: 0.3 },
                              { id: '4', name: '4', multiplier: 0.25 },
                              { id: '3.5', name: '3.5', multiplier: 0.2 },
                              { id: '3', name: '3', multiplier: 0.18 },
                              { id: '2.5', name: '2.5', multiplier: 0.15 },
                              { id: '2', name: '2', multiplier: 0.12 },
                              { id: '1.5', name: '1.5', multiplier: 0.1 },
                              { id: '1', name: '1', multiplier: 0.08 }
                            ],
                            'bgs': [
                              { id: '10', name: '10', multiplier: 3.2 },
                              { id: '9.5', name: '9.5', multiplier: 2.5 },
                              { id: '9', name: '9', multiplier: 2.0 },
                              { id: '8.5', name: '8.5', multiplier: 1.6 },
                              { id: '8', name: '8', multiplier: 1.3 },
                              { id: '7.5', name: '7.5', multiplier: 1.1 },
                              { id: '7', name: '7', multiplier: 0.9 },
                              { id: '6.5', name: '6.5', multiplier: 0.7 },
                              { id: '6', name: '6', multiplier: 0.6 },
                              { id: '5.5', name: '5.5', multiplier: 0.5 },
                              { id: '5', name: '5', multiplier: 0.4 },
                              { id: '4.5', name: '4.5', multiplier: 0.35 },
                              { id: '4', name: '4', multiplier: 0.3 },
                              { id: '3.5', name: '3.5', multiplier: 0.25 },
                              { id: '3', name: '3', multiplier: 0.2 },
                              { id: '2.5', name: '2.5', multiplier: 0.15 },
                              { id: '2', name: '2', multiplier: 0.12 },
                              { id: '1.5', name: '1.5', multiplier: 0.1 },
                              { id: '1', name: '1', multiplier: 0.08 }
                            ],
                            'tag': [
                              { id: '10', name: '10', multiplier: 2.5 },
                              { id: '9.5', name: '9.5', multiplier: 2.0 },
                              { id: '9', name: '9', multiplier: 1.8 },
                              { id: '8.5', name: '8.5', multiplier: 1.5 },
                              { id: '8', name: '8', multiplier: 1.4 },
                              { id: '7.5', name: '7.5', multiplier: 1.2 },
                              { id: '7', name: '7', multiplier: 1.1 },
                              { id: '6.5', name: '6.5', multiplier: 0.9 },
                              { id: '6', name: '6', multiplier: 0.8 },
                              { id: '5.5', name: '5.5', multiplier: 0.7 },
                              { id: '5', name: '5', multiplier: 0.6 },
                              { id: '4.5', name: '4.5', multiplier: 0.5 },
                              { id: '4', name: '4', multiplier: 0.45 },
                              { id: '3.5', name: '3.5', multiplier: 0.4 },
                              { id: '3', name: '3', multiplier: 0.35 },
                              { id: '2.5', name: '2.5', multiplier: 0.3 },
                              { id: '2', name: '2', multiplier: 0.25 },
                              { id: '1.5', name: '1.5', multiplier: 0.2 },
                              { id: '1', name: '1', multiplier: 0.15 }
                            ],
                            'ace': [
                              { id: '10', name: '10', multiplier: 2.2 },
                              { id: '9', name: '9', multiplier: 1.6 },
                              { id: '8', name: '8', multiplier: 1.3 },
                              { id: '7', name: '7', multiplier: 1.0 },
                              { id: '6', name: '6', multiplier: 0.8 },
                              { id: '5', name: '5', multiplier: 0.6 },
                              { id: '4', name: '4', multiplier: 0.5 },
                              { id: '3', name: '3', multiplier: 0.4 },
                              { id: '2', name: '2', multiplier: 0.3 },
                              { id: '1', name: '1', multiplier: 0.2 }
                            ]
                          }
                          
                          const grades = gradeRanges[selectedGradingService] || []
                          
                          return grades.map(grade => {
                            const price = basePrice * gradingMultiplier * grade.multiplier
                            return (
                              <div key={grade.id} className="bg-gray-700 rounded p-2 text-center min-w-[60px] flex-shrink-0">
                                <div className="text-white text-xs mb-1">{grade.name}</div>
                                <div className="text-white text-xs font-medium">${price.toFixed(2)}</div>
                              </div>
                            )
                          })
                        })()
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Info Section */}
                <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <img src="/Assets/CardInfo.svg" alt="Card Info" className="w-4 h-4" />
                    <h3 className="text-white font-medium">Card info</h3>
                  </div>

                  {/* Attack Section */}
                  <div className="mb-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      {/* Pokémon Power Section */}
                      {selectedCard?.abilities && selectedCard.abilities.length > 0 && (
                        <div className="mb-4">
                          {selectedCard.abilities.map((ability, index) => (
                            <div key={index} className={index > 0 ? "mt-4" : ""}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-red-400 text-sm font-medium">{ability.type}</span>
                                <span className="text-white text-sm font-bold">{ability.name}</span>
                              </div>
                              <p className="text-white text-sm">
                                {ability.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Divider */}
                      {selectedCard?.attacks && (() => {
                        try {
                          const attacks = typeof selectedCard.attacks === 'string' 
                            ? JSON.parse(selectedCard.attacks) 
                            : selectedCard.attacks;
                          return attacks && attacks.length > 0;
                        } catch {
                          return false;
                        }
                      })() && (
                        <div className="border-t border-gray-600 pt-4 mb-4">
                          {(() => {
                            try {
                              const attacks = typeof selectedCard.attacks === 'string' 
                                ? JSON.parse(selectedCard.attacks) 
                                : selectedCard.attacks;
                              return attacks.map((attack, index) => (
                            <div key={index} className={index > 0 ? "mt-4" : ""}>
                              {/* Attack Cost */}
                              <div className="flex items-center gap-2 mb-2">
                                {renderEnergyCost(attack.cost)}
                                <span className="text-white text-sm font-bold">{attack.name}</span>
                                <span className="text-white text-sm ml-auto font-bold">{attack.damage}</span>
                              </div>
                              <p className="text-white text-sm">
                                {attack.description}
                              </p>
                            </div>
                              ));
                            } catch {
                              return null;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Attributes Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Illustrator</div>
                      <div className="text-[#605dec] text-sm">{selectedCard.artist || 'Hiroshi Yamamoto'}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Expansion</div>
                      <div className="text-[#605dec] text-sm">{selectedCard.set?.name || selectedCard.set_name || 'Expansion Name'}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Card Number</div>
                      <div className="text-white text-sm">{selectedCard.number}/{selectedCard.printed_total || selectedCard.set?.total || '?'}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Card Format</div>
                      <div className="text-[#605dec] text-sm">Standard</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">HP</div>
                      <div className="text-white text-sm">{selectedCard?.hp || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Type</div>
                      <div className="flex justify-center">
                        {selectedCard?.pokemonType ? (
                          <img 
                            src={getEnergyIconPath(selectedCard.pokemonType)} 
                            alt={`${selectedCard.pokemonType} Energy`} 
                            className="w-5 h-5" 
                          />
                        ) : (
                          <div className="w-5 h-5 bg-gray-600 rounded"></div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Stage</div>
                      <div className="text-[#605dec] text-sm">Basic</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Weakness</div>
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-5 h-5 bg-red-500 rounded"></div>
                        <span className="text-white text-sm">X2</span>
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Resistance</div>
                      <span className="text-white text-sm">—</span>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Retreat</div>
                      <div className="w-5 h-5 bg-gray-600 rounded mx-auto"></div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Rarity</div>
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                        <span className="text-[#605dec] text-sm">{selectedCard.rarity}</span>
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Regulation</div>
                      <div className="text-[#605dec] text-sm">A</div>
                    </div>
                  </div>
                </div>

                {/* Browse Listings Section */}
                <div className="bg-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    <h3 className="text-white font-medium">Browse Listings</h3>
                  </div>

                  <div className="space-y-3">
                    {/* TCGplayer */}
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                          TC
                        </div>
                        <div>
                          <div className="text-white text-sm">Recent Listings</div>
                          <div className="text-gray-400 text-xs">View recent listings on TCGplayer.com</div>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>

                    {/* eBay */}
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-6 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                          eB
                        </div>
                        <div>
                          <div className="text-white text-sm">Recent Sales</div>
                          <div className="text-gray-400 text-xs">View recently sold items on ebay.com</div>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* View My Cards Modal */}
              {showViewMyCardsModal && (
                <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className={`bg-gray-800 rounded-2xl p-6 w-full max-w-2xl mx-auto relative max-h-[90vh] overflow-y-auto ${isMultiSelectMode ? 'pb-24' : ''}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 20 20">
                          <g clipPath="url(#clip0_363_5703_modal)">
                            <path d="M15.105 19.0527L10.4474 16.8878C10.1388 16.7443 10.0046 16.3774 10.1481 16.0684L13.444 8.97766C13.5872 8.66891 13.9545 8.53493 14.2629 8.67817L18.9207 10.8436C19.2293 10.987 19.3632 11.3539 19.2197 11.6625L15.924 18.7532C15.7804 19.062 15.4133 19.196 15.105 19.0527ZM3.86524 18.2791L0.773053 11.0973C0.638366 10.7845 0.783014 10.4214 1.09532 10.287L2.62641 9.6279L4.5395 16.8171C4.72286 17.5041 5.42837 17.9139 6.11606 17.7308L7.64075 17.3251L4.67563 18.6019C4.36286 18.7364 3.99993 18.5919 3.86524 18.2791ZM5.18907 16.644L3.17821 9.08743C3.09071 8.75852 3.2868 8.42032 3.61532 8.33305L4.94473 7.97946L4.78465 9.1695C4.69005 9.87403 5.18403 10.5231 5.88954 10.6182L9.00782 11.0384L7.73841 15.3145C7.60774 15.7551 7.72395 16.2109 8.00661 16.5325L5.94333 17.0813C5.61442 17.1688 5.27657 16.9731 5.18907 16.644ZM9.42454 16.458L8.79876 16.2721C8.47219 16.1748 8.28626 15.832 8.38298 15.5054L10.6084 8.0093C10.7054 7.68274 11.049 7.4968 11.3749 7.59329L13.2918 8.16294C13.0929 8.29413 12.9344 8.47837 12.8343 8.69458L9.53825 15.7856C9.44059 15.9955 9.40141 16.2277 9.42454 16.458ZM9.20161 10.3865L5.9795 9.95227C5.64227 9.90673 5.40512 9.59602 5.45067 9.2586L6.49481 1.50899C6.54012 1.17177 6.85126 0.934851 7.18778 0.980164L12.2787 1.66622C12.6157 1.71177 12.8526 2.02266 12.8073 2.35966L12.1649 7.12735L11.566 6.94954C10.8837 6.74653 10.1666 7.13641 9.9643 7.81798L9.20161 10.3865Z" fill="#8F8F94"/>
                          </g>
                          <defs>
                            <clipPath id="clip0_363_5703_modal">
                              <rect width="20" height="20" fill="white"/>
                            </clipPath>
                          </defs>
                        </svg>
                        <h2 className="text-white text-xl font-semibold">My Cards: {selectedCard?.name}</h2>
                      </div>
                      <button 
                        onClick={() => setShowViewMyCardsModal(false)}
                        className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {myCardEntries.length > 0 && !isMultiSelectMode && (
                        <div className="text-center text-gray-400 text-xs mb-2">
                          💡 Swipe right to reveal actions • Press and hold to multi-select
                        </div>
                      )}
                      {myCardEntries.length > 0 && isMultiSelectMode && (
                        <div className="text-center text-blue-400 text-xs mb-2">
                          ✨ Multi-select mode: Tap entries to select them
                        </div>
                      )}
                      {myCardEntries.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <h3 className="text-white font-semibold text-lg mb-2">No Cards Found</h3>
                          <p className="text-gray-400 text-sm">You don't have this card in your collection yet.</p>
                        </div>
                      ) : (
                        <>
                          <div className="text-gray-400 text-sm mb-4">
                            Found {myCardEntries.length} {myCardEntries.length === 1 ? 'entry' : 'entries'} • Total Quantity: {myCardEntries.reduce((sum, entry) => sum + (entry.quantity || 0), 0)}
                          </div>
                          {myCardEntries.map((entry, index) => (
                            <div 
                              key={entry.id || index}
                              className={`relative bg-gray-700/50 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                                isMultiSelectMode && selectedEntries.has(entry.id)
                                  ? 'border-[#8871FF] shadow-lg shadow-[#8871FF]/20 bg-[#8871FF]/10'
                                  : pressedEntryId === entry.id 
                                  ? 'border-[#8871FF] shadow-lg shadow-[#8871FF]/20' 
                                  : swipedEntryId === entry.id
                                  ? 'border-[#8871FF] shadow-lg shadow-[#8871FF]/20'
                                  : 'border-gray-600/50 hover:border-gray-500/50'
                              }`}
                              onClick={() => {
                                if (isMultiSelectMode) {
                                  toggleEntrySelection(entry.id);
                                } else if (swipedEntryId === entry.id) {
                                  // Close swipe actions when clicking on the card
                                  setSwipedEntryId(null);
                                }
                              }}
                              onMouseDown={(e) => handleEntryMouseDown(e, entry.id)}
                              onMouseUp={(e) => handleEntryMouseUp(e, entry.id)}
                              onMouseLeave={handleEntryPressEnd}
                              onTouchStart={(e) => handleEntryTouchStart(e, entry.id)}
                              onTouchEnd={(e) => handleEntryTouchEnd(e, entry.id)}
                              style={{
                                transform: swipedEntryId === entry.id ? 'translateX(60px)' : 'translateX(0)',
                                transition: 'transform 0.3s ease-in-out'
                              }}
                            >
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    {isMultiSelectMode && (
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        selectedEntries.has(entry.id)
                                          ? 'bg-[#8871FF] border-[#8871FF]'
                                          : 'border-gray-400'
                                      }`}>
                                        {selectedEntries.has(entry.id) && (
                                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </div>
                                    )}
                                    <h4 className="text-white font-semibold">{entry.collectionName}</h4>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-primary font-bold">Qty: {entry.quantity || 1}</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                  <div>
                                    <span className="text-gray-400">Variant:</span>
                                    <span className="text-white ml-2 capitalize">{entry.variant || 'Normal'}</span>
                                  </div>
                                  {entry.gradingService && entry.gradingService !== 'raw' ? (
                                    <>
                                      <div>
                                        <span className="text-gray-400">Grade:</span>
                                        <span className="text-white ml-2">{entry.gradingService} {entry.grade}</span>
                                      </div>
                                    </>
                                  ) : (
                                    <div>
                                      <span className="text-gray-400">Condition:</span>
                                      <span className="text-white ml-2">{entry.condition || 'Near Mint'}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-gray-400">Value:</span>
                                    <span className="text-white ml-2">${(entry.currentValue || 0).toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Total:</span>
                                    <span className="text-white ml-2">${((entry.currentValue || 0) * (entry.quantity || 1)).toFixed(2)}</span>
                                  </div>
                                </div>
                                {entry.notes && (
                                  <div className="mt-2 pt-2 border-t border-gray-600/50">
                                    <span className="text-gray-400 text-xs">Notes:</span>
                                    <p className="text-white text-xs mt-1">{entry.notes}</p>
                                  </div>
                                )}
                                <div className="text-gray-500 text-xs mt-2">
                                  Added {new Date(entry.dateAdded).toLocaleDateString()}
                                </div>
                              </div>
                              
                              {/* Swipe-to-reveal action buttons */}
                              {swipedEntryId === entry.id && !isMultiSelectMode && (
                                <div className="swipe-actions absolute left-0 right-0 bottom-0 bg-gray-600/90 backdrop-blur-sm flex items-center justify-start gap-4 py-3 px-4 rounded-b-xl">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditEntry(entry);
                                    }}
                                    className="px-4 py-2 bg-[#8871FF] hover:bg-[#7A5FFF] text-white rounded-lg flex items-center gap-2 transition-colors"
                                    title="Edit"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span className="text-sm font-medium">Edit</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveEntry(entry);
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-2 transition-colors"
                                    title="Remove"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="text-sm font-medium">Remove</span>
                                  </button>
                                </div>
                              )}
                              
                              {/* Press and hold indicator */}
                              {pressedEntryId === entry.id && (
                                <div className="absolute inset-0 bg-[#8871FF]/10 rounded-xl pointer-events-none animate-pulse"></div>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Multi-select floating action bar */}
                    {isMultiSelectMode && (
                      <div className="fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-t border-gray-600/50 p-4 z-[100]">
                        <div className="max-w-2xl mx-auto flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-medium">
                              {selectedEntries.size} selected
                            </span>
                            <div className="flex gap-2">
                              <button 
                                onClick={selectAllEntries}
                                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                              >
                                All
                              </button>
                              <button 
                                onClick={deselectAllEntries}
                                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                              >
                                None
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {selectedEntries.size > 0 && (
                              <button 
                                onClick={handleBulkRemove}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
                              >
                                Remove
                              </button>
                            )}
                            <button 
                              onClick={toggleMultiSelect}
                              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={() => setShowViewMyCardsModal(false)}
                        className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Folder Modal */}
              {showAddToFolderModal && (
                <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-auto relative modal-container">
                    <div className="flex items-center gap-3 mb-6">
                      <img src="/Assets/Addtofolder.svg" alt="Add to Folder" className="w-6 h-6" />
                      <h2 className="text-white text-xl font-semibold">Add to Folder</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Select Folder</label>
                        <div className="relative dropdown-container">
                          <button
                            type="button"
                            onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <span>{selectedFolder}</span>
                            <svg className={`w-4 h-4 transition-transform ${showFolderDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showFolderDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                              <div className="py-1">
                                {['My Collection', 'Favorites', 'Trade Binder', 'Investment Cards', '+ Create New Folder'].map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                      setSelectedFolder(option)
                                      setShowFolderDropdown(false)
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedFolder === '+ Create New Folder' && (
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">New Folder Name</label>
                          <input 
                            type="text" 
                            placeholder="Enter new folder name..."
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => setShowAddToFolderModal(false)}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => setShowAddToFolderModal(false)}
                        className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/80 transition-colors"
                      >
                        Add to Folder
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Deck Modal */}
              {showAddToDeckModal && (
                <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-auto relative modal-container">
                    <div className="flex items-center gap-3 mb-6">
                      <img src="/Assets/Addtodeck.svg" alt="Add to Deck" className="w-6 h-6" />
                      <h2 className="text-white text-xl font-semibold">Add to Deck</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Select Deck</label>
                        <div className="relative dropdown-container">
                          <button
                            type="button"
                            onClick={() => setShowDeckDropdown(!showDeckDropdown)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <span>{selectedDeck}</span>
                            <svg className={`w-4 h-4 transition-transform ${showDeckDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showDeckDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                              <div className="py-1">
                                {['Standard Deck', 'Expanded Deck', 'Legacy Deck', 'Casual Deck', '+ Create New Deck'].map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDeck(option)
                                      setShowDeckDropdown(false)
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedDeck === '+ Create New Deck' && (
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">New Deck Name</label>
                          <input 
                            type="text" 
                            placeholder="Enter new deck name..."
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Quantity</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setDeckQuantity(Math.max(1, deckQuantity - 1))}
                            className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={deckQuantity <= 1}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <div className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-center">
                            <span className="text-white text-lg font-medium">{deckQuantity}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDeckQuantity(deckQuantity + 1)}
                            className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => setShowAddToDeckModal(false)}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => setShowAddToDeckModal(false)}
                        className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/80 transition-colors"
                      >
                        Add to Deck
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Binder Modal */}
              {showAddToBinderModal && (
                <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-auto relative modal-container">
                    <div className="flex items-center gap-3 mb-6">
                      <img src="/Assets/Addtobinder.svg" alt="Add to Binder" className="w-6 h-6" />
                      <h2 className="text-white text-xl font-semibold">Add to Binder</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Select Binder</label>
                        <div className="relative dropdown-container">
                          <button
                            type="button"
                            onClick={() => setShowBinderDropdown(!showBinderDropdown)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <span>{selectedBinder}</span>
                            <svg className={`w-4 h-4 transition-transform ${showBinderDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showBinderDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                              <div className="py-1">
                                {['Main Binder', 'Trade Binder', 'Rare Cards Binder', 'Complete Sets Binder', '+ Create New Binder'].map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                      setSelectedBinder(option)
                                      setShowBinderDropdown(false)
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedBinder === '+ Create New Binder' && (
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">New Binder Name</label>
                          <input 
                            type="text" 
                            placeholder="Enter new binder name..."
                            value={newBinderName}
                            onChange={(e) => setNewBinderName(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      )}
                      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-300 text-sm">Card will be added to the next available slot in the selected binder</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => setShowAddToBinderModal(false)}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => setShowAddToBinderModal(false)}
                        className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/80 transition-colors"
                      >
                        Add to Binder
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Set Custom Tag Modal */}
              {showSetCustomTagModal && (
                <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-auto relative modal-container">
                    <div className="flex items-center gap-3 mb-6">
                      <img src="/Assets/SetTag.svg" alt="Set Custom Tag" className="w-6 h-6" />
                      <h2 className="text-white text-xl font-semibold">Set Custom Tag</h2>
                    </div>
                    <div className="space-y-4">
                      {/* Create/Edit Tag Form */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          {editingTagIndex !== null ? 'Edit Tag Name' : 'Tag Name'}
                        </label>
                        <input 
                          type="text" 
                          placeholder="Enter tag name..."
                          value={tagName}
                          onChange={(e) => setTagName(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Tag Color</label>
                        <div className="flex gap-2">
                          {['red', 'blue', 'green', 'yellow', 'purple', 'pink'].map((color) => (
                            <button
                              key={color}
                              onClick={() => setSelectedTagColor(color)}
                              className={`w-8 h-8 bg-${color}-500 rounded-full border-2 ${
                                selectedTagColor === color ? 'border-white' : 'border-transparent'
                              } hover:scale-110 transition-transform`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Current Tags Display */}
                      {cardCustomTags.length > 0 && (
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">Current Tags</label>
                          <div className="flex flex-wrap gap-2">
                            {cardCustomTags.map((tag, index) => (
                              <div 
                                key={index}
                                className={`group relative cursor-pointer ${editingTagIndex === index ? 'ring-2 ring-blue-400 ring-opacity-50 rounded-full' : ''}`}
                                onClick={() => {
                                  setTagName(tag.name)
                                  setSelectedTagColor(tag.color)
                                  setEditingTagIndex(index)
                                }}
                              >
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${colorMap[tag.color].text} ${colorMap[tag.color].bg} border ${colorMap[tag.color].border} flex items-center gap-2`}>
                                  <div className={`w-2 h-2 rounded-full ${colorMap[tag.color].dot}`}></div>
                                  <span>{tag.name}</span>
                                </div>
                                {editingTagIndex === index && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => {
                          setShowSetCustomTagModal(false)
                          setTagName('')
                          setSelectedTagColor('red')
                          setEditingTagIndex(null)
                        }}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      {editingTagIndex !== null && (
                        <button 
                          onClick={() => {
                            const newTags = cardCustomTags.filter((_, index) => index !== editingTagIndex)
                            setCardCustomTags(newTags)
                            setTagName('')
                            setSelectedTagColor('red')
                            setEditingTagIndex(null)
                          }}
                          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (tagName.trim()) {
                            const newTag = {
                              name: tagName.trim(),
                              color: selectedTagColor
                            }
                            
                            if (editingTagIndex !== null) {
                              // Update existing tag
                              const newTags = [...cardCustomTags]
                              newTags[editingTagIndex] = newTag
                              setCardCustomTags(newTags)
                            } else {
                              // Add new tag
                              setCardCustomTags([...cardCustomTags, newTag])
                            }
                            
                            setTagName('')
                            setSelectedTagColor('red')
                            setEditingTagIndex(null)
                          }
                        }}
                        disabled={!tagName.trim()}
                        className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editingTagIndex !== null ? 'Update Tag' : 'Create Tag'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Send Feedback Modal */}
              {showSendFeedbackModal && (
                <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-auto relative modal-container">
                    <div className="flex items-center gap-3 mb-6">
                      <img src="/Assets/Sendfeedback.svg" alt="Send Feedback" className="w-6 h-6" />
                      <h2 className="text-white text-xl font-semibold">Send Feedback</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Issue Type</label>
                        <div className="relative dropdown-container">
                          <button
                            type="button"
                            onClick={() => setShowIssueDropdown(!showIssueDropdown)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <span>{selectedIssue}</span>
                            <svg className={`w-4 h-4 transition-transform ${showIssueDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showIssueDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                              <div className="py-1">
                                {['Incorrect Image', 'Incorrect Price', 'Missing Information', 'Card Not Found', 'App Bug', 'Feature Request', 'Other'].map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                      setSelectedIssue(option)
                                      setShowIssueDropdown(false)
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                        <textarea 
                          placeholder="Please describe the issue or feedback..."
                          rows="4"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Your Email (Optional)</label>
                        <input 
                          type="email" 
                          placeholder="your@email.com"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => setShowSendFeedbackModal(false)}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => setShowSendFeedbackModal(false)}
                        className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/80 transition-colors"
                      >
                        Send Feedback
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Set Pricing Alerts Modal - Card Profile Only */}
              {showPriceAlertModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-auto relative modal-container">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <img src="/Assets/PriceAlert.svg" alt="Price Alert" className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-white text-xl font-semibold">Set Pricing Alert</h2>
                        <p className="text-gray-400 text-sm">Get notified when price changes</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Alert Type */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-3">
                          Alert Type
                        </label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="alertType"
                              value="above"
                              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 focus:ring-primary focus:ring-2"
                            />
                            <span className="text-white text-sm">Price goes above</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="alertType"
                              value="below"
                              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 focus:ring-primary focus:ring-2"
                            />
                            <span className="text-white text-sm">Price goes below</span>
                          </label>
                        </div>
                      </div>

                      {/* Price Threshold */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Price Threshold
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Notification Method */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-3">
                          Notification Method
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2"
                            />
                            <span className="text-white text-sm">Push Notification</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2"
                            />
                            <span className="text-white text-sm">Email</span>
                          </label>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          placeholder="Add any additional notes about this alert..."
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-20"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => setShowPriceAlertModal(false)}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          // Handle price alert creation
                          console.log('Price alert created');
                          setShowPriceAlertModal(false);
                        }}
                        className="flex-1 bg-primary hover:bg-primary/80 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                      >
                        Create Alert
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Price Paid Modal - Card Profile Only */}
              {showEditPricePaidModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-auto relative modal-container">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <img src="/Assets/Edit Price Paid.svg" alt="Edit Price Paid" className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-white text-xl font-semibold">Edit Price Paid</h2>
                        <p className="text-gray-400 text-sm">Update your purchase price</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Current Price Display */}
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">Current Market Value</span>
                          <span className="text-white text-lg font-bold">$12.00</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-gray-300 text-sm">Your Purchase Price</span>
                          <span className="text-gray-400 text-sm">$0.00</span>
                        </div>
                      </div>

                      {/* Price Paid Input */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Price You Paid
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Purchase Date */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Purchase Date
                        </label>
                        <input
                          type="date"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      {/* Purchase Source */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Purchase Source
                        </label>
                        <div className="relative dropdown-container">
                          <button
                            onClick={() => setShowPurchaseSourceDropdown(!showPurchaseSourceDropdown)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <span>{selectedPurchaseSource || 'Select source'}</span>
                            <svg className={`w-4 h-4 transition-transform ${showPurchaseSourceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showPurchaseSourceDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                              <div className="py-1">
                                {['eBay', 'TCGPlayer', 'Local Store', 'Trade', 'Gift', 'Other'].map(source => (
                                  <button
                                    key={source}
                                    onClick={() => {
                                      setSelectedPurchaseSource(source);
                                      setShowPurchaseSourceDropdown(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {source}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          placeholder="Add any notes about this purchase..."
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-20"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => setShowEditPricePaidModal(false)}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          // Handle price paid update
                          console.log('Price paid updated');
                          setShowEditPricePaidModal(false);
                        }}
                        className="flex-1 bg-primary hover:bg-primary/80 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Wishlist Notification */}
              {showWishlistNotification && (
                <div className="fixed bottom-24 left-0 right-0 z-[70] animate-slide-up-notification">
                  <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-xl px-4 py-3 shadow-2xl mx-auto w-fit">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-white text-sm font-medium">{wishlistNotificationMessage}</span>
                    </div>
                  </div>
                </div>
              )}


              {/* Bottom Spacing */}
              <div className="h-20"></div>

              {/* Inactive Bottom Navigation Bar - Card Profile Screen */}
              <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[390px] h-[73px] z-[60]">
                {/* Glass Container */}
                <div className="relative w-full h-full">
                  {/* Background Glass Effect */}
                  <div className="absolute inset-0 bg-[#2B2B2B]/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                    {/* Figma Glass Effect - Light at 45 degrees, intensity 80% - More Subtle */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent rounded-2xl"></div>
                    {/* Refraction 80%, Depth 30%, Dispersion 32%, Frost 10% */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-white/2 to-white/3 rounded-2xl"></div>
                    {/* Frosting Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-white/3 rounded-2xl"></div>
                  </div>

                  {/* Navigation Items - Interactive but Inactive */}
                  <div className="relative z-10 flex justify-between items-center h-full px-8">
                    <button 
                      onClick={() => {
                        console.log('Home button clicked - navigating to dashboard');
                        setSelectedCard(null) // Close card profile modal
                        setShowCardProfile(false)
                        setShowSearchResults(false)
                        setTimeout(() => {
                          setActiveTab('home')
                          // Trigger indicator animation after navigation is complete
                          setTimeout(() => {
                            console.log('Triggering indicator animation');
                            setIndicatorAnimation('exit');
                            setTimeout(() => {
                              setIndicatorAnimation('enter');
                            }, 50);
                          }, 50);
                        }, 100);
                      }}
                      className="relative flex flex-col gap-1 px-2 py-3 rounded-xl transition-all duration-300 group items-center justify-center h-full hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <div className="relative z-10 transition-all duration-300 group-hover:scale-105">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.04 6.82018L14.28 2.79018C12.71 1.69018 10.3 1.75018 8.78999 2.92018L3.77999 6.83018C2.77999 7.61018 1.98999 9.21018 1.98999 10.4702V17.3702C1.98999 19.9202 4.05999 22.0002 6.60999 22.0002H17.39C19.94 22.0002 22.01 19.9302 22.01 17.3802V10.6002C22.01 9.25018 21.14 7.59018 20.04 6.82018ZM12.75 18.0002C12.75 18.4102 12.41 18.7502 12 18.7502C11.59 18.7502 11.25 18.4102 11.25 18.0002V15.0002C11.25 14.5902 11.59 14.2502 12 14.2502C12.41 14.2502 12.75 14.5902 12.75 15.0002V18.0002Z" fill="none" stroke="#8F8F94" strokeWidth="2"></path>
                        </svg>
                      </div>
                      <div className="relative z-10 text-xs font-medium transition-all duration-300 opacity-0 transform translate-y-2">Home</div>
                    </button>
                    
                    <button 
                      onClick={() => {
                        console.log('Collection button clicked in card profile')
                        setSelectedCard(null) // Close card profile modal
                        setShowCardProfile(false)
                        setShowSearchResults(false)
                        setTimeout(() => {
                          setActiveTab('collection')
                          setNavigationMode('collection')
                          // Trigger indicator animation after navigation is complete
                          setTimeout(() => {
                            setIndicatorAnimation('exit');
                            setTimeout(() => {
                              setIndicatorAnimation('enter');
                            }, 50);
                          }, 50);
                        }, 100);
                      }}
                      className="relative flex flex-col gap-1 px-2 py-3 rounded-xl transition-all duration-300 group items-center justify-center h-full hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <div className="relative z-10 transition-all duration-300 group-hover:scale-105">
                        <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_248_3247)">
                            <path d="M11.555 1.469C11.6113 1.26096 11.7477 1.0837 11.9344 0.976052C12.1211 0.868406 12.3428 0.839157 12.551 0.894714L22.871 3.65814C23.0797 3.71364 23.2578 3.84974 23.3661 4.03652C23.4745 4.2233 23.5042 4.44546 23.4488 4.65414L19.4888 19.4279C19.4325 19.6363 19.2959 19.8138 19.1088 19.9215C18.9217 20.0292 18.6995 20.0582 18.491 20.0021L8.17104 17.2387C7.96268 17.1828 7.78501 17.0466 7.67702 16.8599C7.56903 16.6731 7.53954 16.4512 7.59504 16.2427L11.555 1.469Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                            <path d="M10.8042 4.3457L1.7939 6.76113C1.58555 6.81699 1.40787 6.95325 1.29988 7.13999C1.19189 7.32672 1.16241 7.54868 1.2179 7.75713L5.17447 22.5308C5.23069 22.7393 5.36736 22.9168 5.55445 23.0245C5.74154 23.1322 5.96373 23.1612 6.17219 23.1051L11.3322 21.7234" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                          </g>
                          <defs>
                            <clipPath id="clip0_248_3247">
                              <rect width="24" height="24" fill="white" transform="translate(0.333313)"></rect>
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                      <div className="relative z-10 text-xs font-medium transition-all duration-300 opacity-0 transform translate-y-2">Collection</div>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setActiveTab('marketplace')
                        setShowCardProfile(false)
                        setShowSearchResults(false)
                        // Trigger indicator animation after navigation is complete
                        setTimeout(() => {
                          setIndicatorAnimation('exit');
                          setTimeout(() => {
                            setIndicatorAnimation('enter');
                          }, 50);
                        }, 100);
                      }}
                      className="relative flex flex-col gap-1 px-2 py-3 rounded-xl transition-all duration-300 group items-center justify-center h-full hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <div className="relative z-10 transition-all duration-300 group-hover:scale-105">
                        <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_144_6148)">
                            <path fillRule="evenodd" clipRule="evenodd" d="M11.3335 21.3348C11.3335 22.8078 10.1394 24.0019 8.66636 24.0019C7.19337 24.0019 5.99927 22.8078 5.99927 21.3348C5.99927 19.8618 7.19337 18.6677 8.66636 18.6677C10.1394 18.6677 11.3335 19.8618 11.3335 21.3348ZM22.0018 21.3348C22.0018 22.8078 20.8077 24.0019 19.3347 24.0019C17.8617 24.0019 16.6676 22.8078 16.6676 21.3348C16.6676 19.8618 17.8617 18.6677 19.3347 18.6677C20.8068 18.6677 22.0018 19.8618 22.0018 21.3348Z" fill="#8F8F94"></path>
                            <path d="M1.99902 0.998108H2.47949C3.90971 0.998253 5.14138 2.00775 5.42188 3.41022L5.57812 4.1944L5.73926 4.99908H21.3311C22.8789 4.99924 23.9975 6.47835 23.5762 7.96783L22.2051 12.8165C21.8396 14.1084 20.66 15.001 19.3174 15.001H9.51953C8.08934 15.001 6.85784 13.9913 6.57715 12.5889L4.76758 3.54108C4.54945 2.45042 3.59172 1.66524 2.47949 1.6651H1.99902C1.81496 1.6651 1.66528 1.5161 1.66504 1.33209C1.66504 1.17082 1.77952 1.03595 1.93164 1.00494L1.99902 0.998108Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round"></path>
                          </g>
                          <defs>
                            <clipPath id="clip0_144_6148">
                              <rect width="24" height="24" fill="white" transform="translate(0.666748)"></rect>
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                      <div className="relative z-10 text-xs font-medium transition-all duration-300 opacity-0 transform translate-y-2">Marketplace</div>
                    </button>
                    
                    <button 
                      onClick={() => {
                        console.log('Profile button clicked in card profile')
                        setSelectedCard(null) // Close card profile modal
                        setShowCardProfile(false)
                        setShowSearchResults(false)
                        setTimeout(() => {
                          setActiveTab('profile')
                          // Trigger indicator animation after navigation is complete
                          setTimeout(() => {
                            setIndicatorAnimation('exit');
                            setTimeout(() => {
                              setIndicatorAnimation('enter');
                            }, 50);
                          }, 50);
                        }, 100);
                      }}
                      className="relative flex flex-col gap-1 px-2 py-3 rounded-xl transition-all duration-300 group items-center justify-center h-full hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <div className="relative z-10 transition-all duration-300 group-hover:scale-105">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                          <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26003 15 3.41003 18.13 3.41003 22" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                      <div className="relative z-10 text-xs font-medium transition-all duration-300 opacity-0 transform translate-y-2">Profile</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Note Modal */}
              {console.log('Card Profile - Rendering note modal check:', showNoteModal, selectedCard)}
              {showNoteModal && selectedCard && (
                <div 
                  style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    zIndex: 9999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}
                  onClick={() => setShowNoteModal(false)}
                >
                  <div 
                    style={{
                      backgroundColor: '#2b2b2b',
                      borderRadius: '16px',
                      padding: '24px',
                      width: '100%',
                      maxWidth: '400px',
                      maxHeight: '80vh',
                      overflowY: 'auto',
                      border: '1px solid #444'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                        {selectedCard?.note ? 'Edit Note' : 'Add Note'}
                      </h2>
                      <button
                        onClick={() => setShowNoteModal(false)}
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#444',
                          border: 'none',
                          borderRadius: '50%',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Card Info */}
                    <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#333', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '60px', height: '80px', backgroundColor: '#555', borderRadius: '8px', flexShrink: 0 }}>
                          <img
                            src={selectedCard?.images?.small || selectedCard?.imageUrl}
                            alt={selectedCard?.name || 'Card'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '500', margin: '0 0 4px 0' }}>
                            {selectedCard?.name || 'Unknown Card'}
                          </h3>
                          <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
                            {selectedCard?.number || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Note Input */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                        Note
                      </label>
                      <textarea
                        value={cardNote}
                        onChange={(e) => setCardNote(e.target.value)}
                        placeholder="Add a note about this card..."
                        style={{
                          width: '100%',
                          height: '120px',
                          padding: '12px',
                          backgroundColor: '#333',
                          border: '1px solid #555',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {selectedCard?.note && (
                        <button 
                          onClick={handleDeleteNote}
                          style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#dc2626',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Delete Note
                        </button>
                      )}
                      <button 
                        onClick={() => setShowNoteModal(false)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#444',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveNote}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#6865E7',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        {selectedCard?.note ? 'Update Note' : 'Save Note'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Card Modal */}
              {showEditCardModal && editingCard && (
                <div 
                  style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    zIndex: 9999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}
                  onClick={() => setShowEditCardModal(false)}
                >
                  <div 
                    className="edit-card-modal"
                    style={{
                      backgroundColor: '#2b2b2b',
                      borderRadius: '16px',
                      padding: '24px',
                      width: '100%',
                      maxWidth: '500px',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      border: '1px solid #444'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                        Edit Card
                      </h2>
                      <button
                        onClick={() => setShowEditCardModal(false)}
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#444',
                          border: 'none',
                          borderRadius: '50%',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Card Info */}
                    <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#333', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={editingCard.imageUrl} 
                          alt={editingCard.name}
                          style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <div>
                          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                            {editingCard.name}
                          </h3>
                          <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                            {editingCard.set} • {editingCard.rarity}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Quantity */}
                      <div>
                        <label style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#444',
                            border: '1px solid #666',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px'
                          }}
                        />
                      </div>

                      {/* Condition */}
                      <div>
                        <label style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                          Condition
                        </label>
                        <select
                          value={editCondition}
                          onChange={(e) => setEditCondition(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#444',
                            border: '1px solid #666',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px'
                          }}
                        >
                          <option value="Near Mint">Near Mint</option>
                          <option value="Lightly Played">Lightly Played</option>
                          <option value="Moderately Played">Moderately Played</option>
                          <option value="Heavily Played">Heavily Played</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>

                      {/* Variant */}
                      <div>
                        <label style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                          Variant
                        </label>
                        <select
                          value={editVariant}
                          onChange={(e) => setEditVariant(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#444',
                            border: '1px solid #666',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px'
                          }}
                        >
                          <option value="Normal">Normal</option>
                          <option value="Holo">Holo</option>
                          <option value="Reverse Holo">Reverse Holo</option>
                          <option value="Foil">Foil</option>
                        </select>
                      </div>

                      {/* Grading Toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="isGraded"
                          checked={editIsGraded}
                          onChange={(e) => {
                            setEditIsGraded(e.target.checked);
                            if (!e.target.checked) {
                              setEditGrade('');
                              setEditGradingService('raw');
                            }
                          }}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <label htmlFor="isGraded" style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                          This card is graded
                        </label>
                      </div>

                      {/* Grade and Grading Service (only show if graded) */}
                      {editIsGraded && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                              Grade
                            </label>
                            <input
                              type="text"
                              value={editGrade}
                              onChange={(e) => setEditGrade(e.target.value)}
                              placeholder="e.g., 10, 9.5"
                              style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#444',
                                border: '1px solid #666',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                              Grading Service
                            </label>
                            <select
                              value={editGradingService}
                              onChange={(e) => setEditGradingService(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#444',
                                border: '1px solid #666',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px'
                              }}
                            >
                              <option value="PSA">PSA</option>
                              <option value="BGS">BGS</option>
                              <option value="CGC">CGC</option>
                              <option value="SGC">SGC</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Price Paid */}
                      <div>
                        <label style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                          Price Paid (optional)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPricePaid}
                          onChange={(e) => setEditPricePaid(e.target.value)}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#444',
                            border: '1px solid #666',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px'
                          }}
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                          Notes (optional)
                        </label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Add any notes about this card..."
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#444',
                            border: '1px solid #666',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                      <button 
                        onClick={() => setShowEditCardModal(false)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#444',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveEdit}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#6865E7',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Card Modal */}
              {showEditCardModal && editingCard && (
                <div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
                  onClick={() => setShowEditCardModal(false)}
                >
                  <div 
                    className="bg-gray-800 rounded-xl p-6 mx-4 max-w-md w-full edit-card-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-white text-lg font-semibold mb-2">Edit Card</h3>
                      <p className="text-gray-400 text-sm">
                        {editingCard.name} - {editingCard.set}
                      </p>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      {/* Quantity */}
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8871FF]"
                        />
                      </div>

                      {/* Condition */}
                      <div className="relative">
                        <label className="block text-white text-sm font-medium mb-2">Condition</label>
                        <button
                          onClick={() => setShowEditConditionDropdown(!showEditConditionDropdown)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-[#8871FF] flex items-center justify-between"
                        >
                          <span>{editCondition}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showEditConditionDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50">
                            {['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'].map((condition) => (
                              <button
                                key={condition}
                                onClick={() => {
                                  setEditCondition(condition);
                                  setShowEditConditionDropdown(false);
                                }}
                                className="w-full px-3 py-2 text-white hover:bg-gray-600 text-left first:rounded-t-lg last:rounded-b-lg"
                              >
                                {condition}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Variant */}
                      <div className="relative">
                        <label className="block text-white text-sm font-medium mb-2">Variant</label>
                        <button
                          onClick={() => setShowEditVariantDropdown(!showEditVariantDropdown)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-[#8871FF] flex items-center justify-between"
                        >
                          <span>{editVariant}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showEditVariantDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50">
                            {['Normal', 'Holo', 'Reverse Holo', 'Foil'].map((variant) => (
                              <button
                                key={variant}
                                onClick={() => {
                                  setEditVariant(variant);
                                  setShowEditVariantDropdown(false);
                                }}
                                className="w-full px-3 py-2 text-white hover:bg-gray-600 text-left first:rounded-t-lg last:rounded-b-lg"
                              >
                                {variant}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Grading Toggle */}
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editIsGraded}
                            onChange={(e) => setEditIsGraded(e.target.checked)}
                            className="w-4 h-4 text-[#8871FF] bg-gray-700 border-gray-600 rounded focus:ring-[#8871FF]"
                          />
                          <span className="text-white text-sm font-medium">This card is graded</span>
                        </label>
                      </div>

                      {/* Grade and Grading Service - only show if graded */}
                      {editIsGraded && (
                        <>
                          <div className="relative">
                            <label className="block text-white text-sm font-medium mb-2">Grade</label>
                            <button
                              onClick={() => setShowEditGradeDropdown(!showEditGradeDropdown)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-[#8871FF] flex items-center justify-between"
                            >
                              <span>{editGrade || 'Select Grade'}</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {showEditGradeDropdown && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50">
                                {['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5.5', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1', '0.5'].map((grade) => (
                                  <button
                                    key={grade}
                                    onClick={() => {
                                      setEditGrade(grade);
                                      setShowEditGradeDropdown(false);
                                    }}
                                    className="w-full px-3 py-2 text-white hover:bg-gray-600 text-left first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    {grade}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="relative">
                            <label className="block text-white text-sm font-medium mb-2">Grading Service</label>
                            <button
                              onClick={() => setShowEditGradingServiceDropdown(!showEditGradingServiceDropdown)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-[#8871FF] flex items-center justify-between"
                            >
                              <span>{editGradingService === 'raw' ? 'Raw' : editGradingService}</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {showEditGradingServiceDropdown && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50">
                                {['raw', 'PSA', 'BGS', 'CGC', 'SGC'].map((service) => (
                                  <button
                                    key={service}
                                    onClick={() => {
                                      setEditGradingService(service);
                                      setShowEditGradingServiceDropdown(false);
                                    }}
                                    className="w-full px-3 py-2 text-white hover:bg-gray-600 text-left first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    {service === 'raw' ? 'Raw' : service}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Price Paid */}
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Price Paid ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPricePaid}
                          onChange={(e) => setEditPricePaid(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8871FF]"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Notes</label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Add any notes about this card..."
                          rows="3"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8871FF] resize-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                        onClick={() => {
                          setShowEditCardModal(false);
                          setEditingCard(null);
                          setEditQuantity(1);
                          setEditCondition('Near Mint');
                          setEditVariant('Normal');
                          setEditGrade('');
                          setEditGradingService('raw');
                          setEditPricePaid('');
                          setEditNotes('');
                          setEditIsGraded(false);
                          setShowEditConditionDropdown(false);
                          setShowEditVariantDropdown(false);
                          setShowEditGradeDropdown(false);
                          setShowEditGradingServiceDropdown(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="flex-1 px-4 py-2 bg-[#8871FF] hover:bg-[#7A5FFF] text-white rounded-lg transition-colors"
                        onClick={handleSaveEdit}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Collection Modal - Card Profile */}
              {showCardProfileModal && cardToAddFromProfile && showCardProfile && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-gray-800 rounded-2xl w-full max-w-md mx-auto relative modal-container max-h-[90vh] flex flex-col">
                    <div className="p-6 overflow-y-auto flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-white text-xl font-semibold">Add to Collection</h2>
                      <button
                        onClick={() => {
                          setShowCardProfileModal(false);
                          setCardToAddFromProfile(null);
                        }}
                        className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Card Preview */}
                    {cardToAddFromProfile && (
                      <div className="mb-6 p-4 bg-gray-700 rounded-xl">
                        <div className="flex gap-4 items-center">
                          <img 
                            src={(() => {
                              const imageSrc = cardToAddFromProfile.imageUrl || cardToAddFromProfile.images?.large || cardToAddFromProfile.images?.small || cardImages[cardToAddFromProfile.id];
                              return typeof imageSrc === 'string' ? imageSrc : '';
                            })()} 
                            alt={cardToAddFromProfile.name}
                            className="w-20 h-28 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="text-white text-base font-bold mb-2">
                              {cardToAddFromProfile.name}
                            </h3>
                            <p className="text-gray-300 text-sm mb-1">
                              {cardToAddFromProfile.set_name || cardToAddFromProfile.set?.name || cardToAddFromProfile.set || 'Set Name'}
                            </p>
                            <p className="text-gray-400 text-xs mb-2">
                              #{cardToAddFromProfile.number ? cardToAddFromProfile.number.replace('#', '') : '001'}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 text-xs">Est. Value:</span>
                              <span className="text-primary text-base font-bold">
                                ${calculateDynamicPrice(cardToAddFromProfile, selectedVariant, addCardCondition, isGraded, selectedGradingService, selectedGrade).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Collection Selection */}
                    <div className="mb-5">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Collection
                      </label>
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <span>{selectedCollectionForAdd ? userData?.collections.find(c => c.id === selectedCollectionForAdd)?.name : 'Select Collection'}</span>
                          <svg className={`w-4 h-4 transition-transform ${showCollectionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showCollectionDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                            <div className="py-1">
                              {userData?.collections.map(collection => (
                                <button
                                  key={collection.id}
                                  onClick={() => {
                                    setSelectedCollectionForAdd(collection.id);
                                    setShowCollectionDropdown(false);
                                  }}
                                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                >
                                  {collection.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selection */}
                    <div className="mb-5">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Quantity
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))}
                          className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={addQuantity <= 1}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <div className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-center">
                          <span className="text-white text-lg font-medium">{addQuantity}</span>
                        </div>
                        <button
                          onClick={() => setAddQuantity(addQuantity + 1)}
                          className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Variant Selection */}
                    <div className="mb-5">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Variant
                      </label>
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => setShowVariantDropdown(!showVariantDropdown)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <span>{selectedVariant}</span>
                          <svg className={`w-4 h-4 transition-transform ${showVariantDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showVariantDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                            <div className="py-1">
                              {['normal', 'holo', 'reverse holo', '1st edition'].map(variant => (
                                <button
                                  key={variant}
                                  onClick={() => {
                                    setSelectedVariant(variant);
                                    setShowVariantDropdown(false);
                                  }}
                                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                >
                                  {variant}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Condition Selection */}
                    <div className="mb-5">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Condition
                      </label>
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => setShowConditionDropdown(!showConditionDropdown)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <span>{addCardCondition}</span>
                          <svg className={`w-4 h-4 transition-transform ${showConditionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showConditionDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                            <div className="py-1">
                              {['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'].map(condition => (
                                <button
                                  key={condition}
                                  onClick={() => {
                                    setAddCardCondition(condition);
                                    setShowConditionDropdown(false);
                                  }}
                                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                >
                                  {condition}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Graded Card Toggle */}
                    <div className="mb-5">
                      <label className="flex items-center gap-3 text-gray-300 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isGraded}
                          onChange={(e) => setIsGraded(e.target.checked)}
                          className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2"
                        />
                        <span>This is a graded card</span>
                      </label>
                    </div>

                    {/* Grading Service Selection - Only show if graded */}
                    {isGraded && (
                      <div className="mb-5">
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Grading Service
                        </label>
                        <div className="relative dropdown-container">
                          <button
                            onClick={() => setShowGradingServiceDropdown(!showGradingServiceDropdown)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <span>{selectedGradingService}</span>
                            <svg className={`w-4 h-4 transition-transform ${showGradingServiceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showGradingServiceDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                              <div className="py-1">
                                {['PSA', 'CGC', 'TAG', 'BGS', 'ACE'].map(service => (
                                  <button
                                    key={service}
                                    onClick={() => {
                                      setSelectedGradingService(service);
                                      setShowGradingServiceDropdown(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {service}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Grade Selection - Only show if graded */}
                    {isGraded && (
                      <div className="mb-5">
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Grade
                        </label>
                        <div className="relative dropdown-container">
                          <button
                            onClick={() => setShowGradeDropdown(!showGradeDropdown)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <span>{selectedGrade}</span>
                            <svg className={`w-4 h-4 transition-transform ${showGradeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showGradeDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              <div className="py-1">
                                {selectedGradingService === 'PSA' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(grade => (
                                  <button
                                    key={grade}
                                    onClick={() => {
                                      setSelectedGrade(grade);
                                      setShowGradeDropdown(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {grade}
                                  </button>
                                ))}
                                {selectedGradingService === 'CGC' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(grade => (
                                  <button
                                    key={grade}
                                    onClick={() => {
                                      setSelectedGrade(grade);
                                      setShowGradeDropdown(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {grade}
                                  </button>
                                ))}
                                {selectedGradingService === 'TAG' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(grade => (
                                  <button
                                    key={grade}
                                    onClick={() => {
                                      setSelectedGrade(grade);
                                      setShowGradeDropdown(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {grade}
                                  </button>
                                ))}
                                {selectedGradingService === 'BGS' && ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'].map(grade => (
                                  <button
                                    key={grade}
                                    onClick={() => {
                                      setSelectedGrade(grade);
                                      setShowGradeDropdown(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {grade}
                                  </button>
                                ))}
                                {selectedGradingService === 'ACE' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(grade => (
                                  <button
                                    key={grade}
                                    onClick={() => {
                                      setSelectedGrade(grade);
                                      setShowGradeDropdown(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                                  >
                                    {grade}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="mb-6">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={addNote}
                        onChange={(e) => setAddNote(e.target.value)}
                        placeholder="Add any notes about this card..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-20"
                      />
                    </div>

                    </div>
                    
                    {/* Action Buttons - Fixed at bottom */}
                    <div className="p-6 pt-4 border-t border-gray-700">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setShowCardProfileModal(false);
                            setCardToAddFromProfile(null);
                          }}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleConfirmAddToCollection}
                          className="flex-1 bg-primary hover:bg-primary/80 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                        >
                          Add to Collection
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        }



  // Login Screen
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background with card pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/30">
          {/* Card pattern background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-32 h-44 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-lg transform rotate-12"></div>
            <div className="absolute top-20 right-16 w-28 h-40 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg transform -rotate-6"></div>
            <div className="absolute bottom-20 left-20 w-36 h-48 bg-gradient-to-br from-accent/20 to-primary/40 rounded-lg transform rotate-6"></div>
            <div className="absolute bottom-32 right-20 w-30 h-42 bg-gradient-to-br from-primary/40 to-accent/20 rounded-lg transform -rotate-12"></div>
          </div>
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-background/80"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-accent drop-shadow-lg">
                CardCollector
              </h1>
              <div className="w-6 h-6 text-accent">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="w-full max-w-sm bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white text-center mb-6">Welcome Back</h2>
            
            <form className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('forgot-password')}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="button"
                onClick={() => setCurrentScreen('main-app')}
                className="w-full bg-primary hover:bg-primary/90 text-accent font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Log In
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <span className="text-gray-400">Don't have an account? </span>
              <button
                onClick={() => setCurrentScreen('signup')}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Signup Screen
  if (currentScreen === 'signup') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background with card pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/30">
          {/* Card pattern background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-32 h-44 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-lg transform rotate-12"></div>
            <div className="absolute top-20 right-16 w-28 h-40 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg transform -rotate-6"></div>
            <div className="absolute bottom-20 left-20 w-36 h-48 bg-gradient-to-br from-accent/20 to-primary/40 rounded-lg transform rotate-6"></div>
            <div className="absolute bottom-32 right-20 w-30 h-42 bg-gradient-to-br from-primary/40 to-accent/20 rounded-lg transform -rotate-12"></div>
          </div>
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-background/80"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-accent drop-shadow-lg">
                CardCollector
              </h1>
              <div className="w-6 h-6 text-accent">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div className="w-full max-w-sm bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white text-center mb-6">Create Account</h2>
            
            <form className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary pr-12"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showSignupPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Sign Up Button */}
              <button
                type="button"
                onClick={() => setCurrentScreen('main-app')}
                className="w-full bg-primary hover:bg-primary/90 text-accent font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Sign Up
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <span className="text-gray-400">Already have an account? </span>
              <button
                onClick={() => setCurrentScreen('login')}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state for data
  if (isLoadingData && currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading cards...</p>
        </div>
      </div>
    )
  }

  // Splash Screen
  if (currentScreen === 'splash') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background with card pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/30">
          {/* Card pattern background - using CSS to create a subtle card-like pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-32 h-44 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-lg transform rotate-12"></div>
            <div className="absolute top-20 right-16 w-28 h-40 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg transform -rotate-6"></div>
            <div className="absolute bottom-20 left-20 w-36 h-48 bg-gradient-to-br from-accent/20 to-primary/40 rounded-lg transform rotate-6"></div>
            <div className="absolute bottom-32 right-20 w-30 h-42 bg-gradient-to-br from-primary/40 to-accent/20 rounded-lg transform -rotate-12"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-36 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg transform rotate-45"></div>
            <div className="absolute top-1/3 right-1/3 w-26 h-38 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-lg transform -rotate-45"></div>
          </div>
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-background/80"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          {/* Logo */}
          <div className="mb-20">
            <div className="flex items-center gap-3">
              <h1 className="text-6xl font-bold text-accent drop-shadow-lg">
                logoipsum
              </h1>
              <div className="w-6 h-6 text-accent">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-4 w-full max-w-xs">
            {/* Log in button */}
            <button 
              onClick={() => setCurrentScreen('login')}
              className="w-full bg-primary hover:bg-primary/90 text-accent font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Log in
            </button>
            
            {/* Sign up button */}
            <button 
              onClick={() => setCurrentScreen('signup')}
              className="w-full bg-accent hover:bg-accent/90 text-primary font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Forgot Password Screen
  if (currentScreen === 'forgot-password') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Blurred card background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/30">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-32 h-44 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-lg transform rotate-12"></div>
            <div className="absolute top-20 right-16 w-28 h-40 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg transform -rotate-6"></div>
            <div className="absolute bottom-20 left-20 w-36 h-48 bg-gradient-to-br from-accent/20 to-primary/40 rounded-lg transform rotate-6"></div>
            <div className="absolute bottom-32 right-20 w-30 h-42 bg-gradient-to-br from-primary/40 to-accent/20 rounded-lg transform -rotate-12"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-36 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg transform rotate-45"></div>
            <div className="absolute top-1/3 right-1/3 w-26 h-38 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-lg transform -rotate-45"></div>
          </div>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm"></div>
        </div>

        {/* Modal */}
        <div className="min-h-screen flex items-end justify-center relative z-10 ">
          <div className="w-full max-w-2xl h-[80vh] sm:h-[80vh] lg:h-[75vh] min-h-[500px] bg-accent rounded-t-3xl shadow-2xl relative animate-slide-up flex flex-col">
            {/* Close button */}
            <button 
              onClick={() => setCurrentScreen('login')}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="px-6 pb-6 pt-12 flex-1 flex flex-col ">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Forgot your password?
              </h2>
              <p className="text-gray-600 mb-6">
                We'll send you an email with instructions to reset your password.
              </p>

              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                  />
                </div>

                <button 
                  onClick={handleForgotPassword}
                  className="w-full bg-primary hover:bg-primary/90 text-accent font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Continue
                </button>

                {/* Demo button to simulate email link click */}
                <div className="text-center">
                  <button 
                    onClick={() => {
                      setResetToken('demo-reset-token-123')
                      setCurrentScreen('reset-password')
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Demo: Click here to simulate email link
                  </button>
                </div>

                <div className="text-center">
                  <button 
                    onClick={() => setCurrentScreen('login')}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Back to login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Reset Password Screen
  if (currentScreen === 'reset-password') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Blurred card background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/30">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-32 h-44 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-lg transform rotate-12"></div>
            <div className="absolute top-20 right-16 w-28 h-40 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg transform -rotate-6"></div>
            <div className="absolute bottom-20 left-20 w-36 h-48 bg-gradient-to-br from-accent/20 to-primary/40 rounded-lg transform rotate-6"></div>
            <div className="absolute bottom-32 right-20 w-30 h-42 bg-gradient-to-br from-primary/40 to-accent/20 rounded-lg transform -rotate-12"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-36 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg transform rotate-45"></div>
            <div className="absolute top-1/3 right-1/3 w-26 h-38 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-lg transform -rotate-45"></div>
          </div>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm"></div>
        </div>

        {/* Modal */}
        <div className="min-h-screen flex items-end justify-center relative z-10 ">
          <div className="w-full max-w-2xl h-[80vh] sm:h-[80vh] lg:h-[75vh] min-h-[500px] bg-accent rounded-t-3xl shadow-2xl relative animate-slide-up flex flex-col">
            {/* Close button */}
            <button 
              onClick={() => setCurrentScreen('login')}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="px-6 pb-6 pt-12 flex-1 flex flex-col ">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Reset your password
              </h2>
              <p className="text-gray-600 mb-6">
                Enter your new password below.
              </p>

              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                  />
                </div>

                <button 
                  onClick={handleResetPassword}
                  className="w-full bg-primary hover:bg-primary/90 text-accent font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Reset password
                </button>

                <div className="text-center">
                  <button 
                    onClick={() => setCurrentScreen('login')}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Back to login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Manual Signup Screen
  if (currentScreen === 'manual-signup') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Blurred card background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/30">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-32 h-44 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-lg transform rotate-12"></div>
            <div className="absolute top-20 right-16 w-28 h-40 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg transform -rotate-6"></div>
            <div className="absolute bottom-20 left-20 w-36 h-48 bg-gradient-to-br from-accent/20 to-primary/40 rounded-lg transform rotate-6"></div>
            <div className="absolute bottom-32 right-20 w-30 h-42 bg-gradient-to-br from-primary/40 to-accent/20 rounded-lg transform -rotate-12"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-36 bg-gradient-to-br from-secondary/40 to-primary/40 rounded-lg transform rotate-45"></div>
            <div className="absolute top-1/3 right-1/3 w-26 h-38 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-lg transform -rotate-45"></div>
          </div>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm"></div>
        </div>

        {/* Modal */}
        <div className="min-h-screen flex items-end justify-center relative z-10">
          <div className="w-full max-w-2xl h-[90vh] sm:h-[90vh] lg:h-[85vh] min-h-[600px] bg-accent rounded-t-3xl shadow-2xl relative animate-slide-up flex flex-col">
            {/* Close button */}
            <button 
              onClick={() => setCurrentScreen('signup')}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Tab Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-lg mx-6 mb-0 mt-12">
              <button
                onClick={() => setCurrentScreen('login')}
                className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all text-gray-600 hover:text-gray-800"
              >
                Log In
              </button>
              <button
                onClick={() => setCurrentScreen('signup')}
                className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all bg-accent text-primary shadow-sm"
              >
                Sign Up
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 pb-8 pt-4 flex-1 flex flex-col">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Create an account
              </h2>

              <div className="space-y-3 flex-1 flex flex-col">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone number
                  </label>
                  <div className="flex">
                    <div className="relative country-dropdown">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 h-[42px]"
                      >
                        <span className="text-sm text-gray-700">
                          {getSelectedCountry().flag} {getSelectedCountry().dialCode}
                        </span>
                        <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          {countryCodes.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country.code)
                                setShowCountryDropdown(false)
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center"
                            >
                              <span className="mr-2">{country.flag}</span>
                              <span className="text-sm text-gray-700">{country.dialCode} {country.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="(555) 555-5555"
                      className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800 h-[42px]"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                      />
                      <button 
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showSignupPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmSignupPassword}
                        onChange={(e) => setConfirmSignupPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                      />
                      <button 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Register Button */}
                <div className="mt-6 pt-4">
                  <button 
                    onClick={handleManualSignup}
                    className="w-full bg-primary hover:bg-primary/90 text-accent font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Onboarding Screens
  if (currentScreen === 'onboarding') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Onboarding Content */}
        <div 
          className="min-h-screen flex flex-col px-4 py-4"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Image Placeholder */}
          <div className="w-full h-32 bg-gray-300 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Image Placeholder</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-accent text-center mb-4">
            {currentOnboardingStep === 0 ? 'Track' : 
             currentOnboardingStep === 1 ? 'Organize' : 'and more...'}
          </h1>

          {/* Features */}
          <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
            {currentOnboardingStep === 0 && (
              <>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary mb-1">Track Expansion Packs & Sets</h3>
                    <p className="text-accent text-xs">Visualize your completion progress for every set. Easily track the cards you own, the ones you need, and those on your wishlist. Watch your collection grow set by set and become the ultimate master collector.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary mb-1">Price Charting</h3>
                    <p className="text-accent text-xs">See the real-time market value of your entire portfolio. We pull prices from TCGplayer and eBay to give you the most accurate valuation.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary mb-1">Track Multiple Languages</h3>
                    <p className="text-accent text-xs">Whether you chase Japanese promos or European first editions, log every card in any language. Easily filter your collection to show only the languages you collect, making it simple to manage and showcase your international treasures.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary mb-1">Track Variants & Rarities</h3>
                    <p className="text-accent text-xs">Log every version of your favorite Pokémon. Easily distinguish between standard holos, reverse holos, amazing rares, illustration rares, and secret rares. Never lose track of that special alternate art pull or your complete master set ever again.</p>
                  </div>
                </div>
              </>
            )}

            {currentOnboardingStep === 1 && (
              <>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-accent mb-1">Deck Builder</h3>
                    <p className="text-accent text-xs">Build decks, check legality, and get recommendations. Create the perfect deck for any format with our intelligent deck builder that knows the rules and helps you optimize your strategy.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-accent mb-1">Custom Folders</h3>
                    <p className="text-accent text-xs">Create custom folders like 'Investment Cards' or 'Shiny Vault'. Organize your collection exactly how you want with unlimited custom categories and smart filtering options.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-accent mb-1">Binder Builder</h3>
                    <p className="text-accent text-xs">Digitally recreate your binders, arrange cards exactly how you want, and showcase your pulls. Create virtual binders that match your physical collection perfectly.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-accent mb-1">Bookmark Favorites</h3>
                    <p className="text-accent text-xs">Bookmark your most valuable or sentimental cards into a dedicated tab. Never lose track of your prized possessions and easily access your favorites.</p>
                  </div>
                </div>
              </>
            )}

            {currentOnboardingStep === 2 && (
              <>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6.5 9.5v3h-3v-3h3M19 13h-6v6h6v-6z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-accent mb-1">Scan Cards</h3>
                    <p className="text-accent text-xs">Point your camera, and you're done. Our advanced scanner instantly recognizes any card and adds it to your collection with all its details—no typing required. Build your digital library faster than ever.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-accent mb-1">Deep Search</h3>
                    <p className="text-accent text-xs">Go beyond the name. Hunt for cards by their artist, find all 'Fire' type cards from the 'Sword & Shield' era, or track down every card illustrated by Mitsuhiro Arita. The power to explore your collection is finally here.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01.99L12 11l-1.99-2.01A2.5 2.5 0 0 0 8 8H5.46c-.8 0-1.54.37-2.01.99L1 14.5V22h2v-6h2.5l2.54-7.63A1.5 1.5 0 0 1 9.46 8H12c.8 0 1.54.37 2.01.99L16 11l1.99-2.01A2.5 2.5 0 0 1 20.54 8H22v14h-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-accent mb-1">Add Friends & Community</h3>
                    <p className="text-accent text-xs">Join a thriving community! Add friends, show off your latest pulls, discuss strategies, and get inspired. Share your journey with fellow trainers who get it.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-accent mb-1">Buy/Sell/Trade Marketplace</h3>
                    <p className="text-accent text-xs">Manage your entire collecting lifecycle in one app. Safely buy, sell, and trade cards with other collectors. Securely connect your payment methods to easily grow your collection and your portfolio.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center space-x-2 mb-4">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${
                  step === currentOnboardingStep ? 'bg-primary' : 'bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Navigation Button */}
          <button
            onClick={handleNextOnboarding}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-base transition-all duration-200 ${
              currentOnboardingStep === 2
                ? 'bg-primary text-accent hover:bg-primary/90'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {currentOnboardingStep === 2 ? 'Start Collecting!' : 'Next'}
          </button>
        </div>
      </div>
    )
  }

  // Main Dashboard
  if (currentScreen === 'main-app') {
    return (
      <div 
        data-main-container
        className="min-h-screen bg-background text-accent transition-all duration-300 ease-in-out"
        style={{ 
          height: '100vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* Logo Placeholder */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6865E7] to-[#5A57D1] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <span className="text-xl font-bold text-white">CardCollector</span>
            </div>
            
            {/* Menu Button */}
            <button 
              onClick={() => setShowSlidingMenu(true)}
              className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

          </div>

          {/* Search Bar Component - Hidden on Collection Tab */}
          {activeTab !== 'collection' && activeTab !== 'marketplace' && (
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={handleSearch}
              onSearchInputClick={handleSearchTabClick}
              onClearSearch={handleClearSearch}
              onScanClick={() => {
                setShowScanner(true);
              }}
              placeholder="Search cards, sets, attacks, abilities..."
              isMenuOpen={showSlidingMenu}
              isModalOpen={showSearchResultsModal || showCardProfileModal}
              showScanButton={true}
            />
          )}

        {/* Tab Content */}
        {activeTab === 'home' && (
          <>
            {/* Collection Overview */}
            <div className="px-4 mb-6">
              <div className="bg-[#2b2b2b] rounded-lg p-6">
                {/* Collection Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="relative collection-dropdown">
              <button 
                      onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
                      className="flex items-center gap-2 hover:bg-gray-700 rounded px-2 py-1 transition-colors"
                    >
                      <h3 className="text-white font-bold text-sm">
                        {userData?.collections.find(c => c.id === selectedCollection)?.name || 'Select Collection'}
                      </h3>
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
                    {/* Collection Dropdown */}
                    {showCollectionDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-48">
                        {userData?.collections.map((collection) => (
                <button 
                            key={collection.id}
                onClick={() => {
                              setSelectedCollection(collection.id)
                              setShowCollectionDropdown(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center justify-between ${
                              selectedCollection === collection.id ? 'bg-gray-700' : ''
                            }`}
                          >
                            <span className="text-white">{collection.name}</span>
                            <span className="text-gray-400 text-xs">{formatCurrency(collection.totalValue)}</span>
                </button>
                        ))}
                        <div className="border-t border-gray-700"></div>
                <button 
                    onClick={() => {
                            setShowCreateCollectionModal(true)
                            setShowCollectionDropdown(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 text-blue-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                          Create New Collection
                </button>
          </div>
        )}
              </div>
              <div className="relative currency-dropdown">
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                        className="flex items-center gap-2 hover:bg-gray-700 rounded px-2 py-1 transition-colors"
                  >
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-white text-xs">
                          {currencies.find(c => c.code === selectedCurrency)?.code} ({currencies.find(c => c.code === selectedCurrency)?.symbol})
                    </span>
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                    {/* Currency Dropdown */}
                {showCurrencyDropdown && (
                      <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-32">
                    {currencies.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          setSelectedCurrency(currency.code)
                          setShowCurrencyDropdown(false)
                        }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 ${
                          selectedCurrency === currency.code ? 'bg-gray-700' : ''
                        }`}
                      >
                            <span className="text-lg">{currency.flag}</span>
                            <span className="text-white">{currency.code}</span>
                            <span className="text-gray-400 text-xs">({currency.symbol})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
                {/* Portfolio Value */}
                <div className="text-white text-2xl font-bold mb-2">
                  {formatCurrency(userData?.collections.find(c => c.id === selectedCollection)?.totalValue || 0)}
                </div>

                {/* Price Change */}
                <div className={`flex items-center gap-1 text-sm mb-1 ${
                  (userData?.collections.find(c => c.id === selectedCollection)?.monthlyChange || 0) >= 0 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={
                        (userData?.collections.find(c => c.id === selectedCollection)?.monthlyChange || 0) >= 0
                          ? "M7 11l5-5m0 0l5 5m-5-5v12"
                          : "M17 13l-5 5m0 0l-5-5m5 5V6"
                      }></path>
                </svg>
                    <span>{formatCurrency(Math.abs(userData?.collections.find(c => c.id === selectedCollection)?.monthlyChange || 0))}</span>
                    <span>past 6 months</span>
              </div>

                {/* Last Updated */}
                <div className="text-gray-400 text-xs mb-4">
                  August 2, 2025
            </div>

                {/* Chart */}
                <div className="h-48 mb-4">
                  <Line data={getChartData} options={chartOptions} />
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2">
                  {['1D', '7D', '1M', '3M', '6M', '1Y', 'Max'].map((range) => (
                <button
                  key={range}
                      onClick={() => setSelectedTimeRange(range === 'Max' ? 'MAX' : range)}
                      className={`px-3 py-1 text-sm rounded ${
                        selectedTimeRange === (range === 'Max' ? 'MAX' : range)
                      ? 'bg-primary text-accent'
                          : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
            </div>

            {/* Collection Stats */}
            <div className="px-4 mb-6">
              <div className="flex gap-2">
                {/* Total Cards Card */}
                <div className="flex-1 bg-[#2b2b2b] rounded-lg p-2">
                  <div className="text-white font-bold text-sm mb-2">Total Cards</div>
                  <div className="bg-[#202020] rounded p-1 mb-2">
                    <div className="text-white text-xl font-bold">{userDatabase.getTotalCards().toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      <span>{userDatabase.getCardsAddedThisMonth()}</span>
                      <span>this month</span>
                      </div>
          </div>

                  {/* Portfolio Items */}
                  <div className="space-y-1">
                    {userData?.collections?.slice(0, 2).map((collection, index) => (
                      <div key={collection.id} className="flex items-center justify-between px-2 py-1">
                        <span className="text-white text-xs">{collection.name}</span>
                        <div className="flex items-center gap-1 text-green-400 text-xs">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>{collection.totalCards || 0}</span>
                        </div>
                      </div>
                    ))}

                  <button 
                  onClick={() => setShowCollectionsModal(true)}
                  className="text-center text-white text-xs py-2 hover:text-blue-400 transition-colors cursor-pointer w-full"
                  style={{ marginTop: '24px' }}
                  >
                  View Collections
                  </button>
              </div>
            </div>

                {/* Recent Activity Card */}
                <div className="flex-1 bg-[#2b2b2b] rounded-lg p-2">
                  <div className="text-white font-bold text-sm mb-2">Recent Activity</div>
                  <div className="space-y-1">
                    {displayedActivity.length > 0 ? (
                      displayedActivity.map((activity) => (
                        <div key={activity.id} className="bg-[#202020] rounded p-1 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-white text-xs">{activity.cardName}</span>
                            <span className="text-gray-400 text-xs">{activity.time}</span>
                          </div>
                          <div className={`flex items-center gap-1 text-xs ${
                            activity.type === 'add' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {activity.type === 'add' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12L18 12" />
                              )}
                            </svg>
                            <span>{activity.action}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-[#202020] rounded p-3 text-center">
                        <div className="text-gray-400 text-xs mb-1">No activity yet</div>
                        <div className="text-gray-500 text-xs">Add cards to see activity</div>
                      </div>
                    )}
              </div>

                <button 
                    onClick={() => setShowActivityModal(true)}
                    className="text-center text-white text-xs py-2 mt-2 hover:text-blue-400 transition-colors cursor-pointer w-full"
                >
                    View All
                </button>
              </div>
              </div>
            </div>
              
            {/* Top Movers */}
            <div className="px-4 mb-6 mt-8">
              <div className="bg-gradient-to-br from-[#2b2b2b] to-[#1a1a1a] rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    <h3 className="text-white font-bold text-lg">My Top Movers</h3>
                  </div>
                  <div className="text-xs text-gray-400">Highest Value</div>
                </div>

                {myTopMovers.length === 0 ? (
                  // Empty State
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-2">No Cards Yet</h4>
                    <p className="text-gray-400 text-sm text-center max-w-xs mb-6">
                      Start building your collection to see your highest valued cards here
                    </p>
                    <button 
                      onClick={() => {
                        setActiveTab('search')
                        setNavigationMode('search') // Update navigation bar to show search as active
                        scrollToTop() // Scroll to top when navigating
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-[#6865E7] to-[#5A57D1] hover:from-[#5A57D1] hover:to-[#4C49BB] rounded-xl text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-[#6865E7]/25"
                    >
                      Browse Cards
                    </button>
                  </div>
                ) : (
                  <>
                  <div className="grid grid-cols-1 gap-4">
                  {myTopMovers.map((card, index) => (
                  <div 
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className="relative bg-gradient-to-r from-blue-500/10 to-transparent rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-20 rounded-lg shadow-lg overflow-hidden bg-gray-800">
                          <img 
                            src={card.imageUrl} 
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center" style={{display: 'none'}}>
                            <span className="text-white font-bold text-xs">#{index + 1}</span>
                      </div>
                  </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">#{index + 1}</span>
                      </div>
                  </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors">{card.name}</h4>
                        <p className="text-gray-400 text-xs">{card.set} • {card.rarity}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white text-xs font-medium">{card.number}</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-400 text-xs">Qty: {getCardQuantityInCollection(card.cardId || card.id)}</span>
                </div>
                    </div>
                      <div className="text-right">
                        <div className="text-blue-400 font-bold text-lg">{formatCurrency(card.totalValue)}</div>
                        <div className="text-gray-400 text-xs mt-1">
                          {formatCurrency(card.currentValue)} each
                        </div>
                  </div>
                </div>
              </div>
                  ))}
                  </div>
                  </>
                )}
                  </div>
                </div>

            {/* Trending Cards */}
            <div className="px-4 mb-6 pb-20">
              <div className="bg-gradient-to-br from-[#2b2b2b] to-[#1a1a1a] rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                      </div>
                    <h3 className="text-white font-bold text-lg">Trending Cards</h3>
                  </div>
                  <div className="text-xs text-gray-400">Hot Today</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Trending Card 1 */}
                  <div 
                    onClick={() => handleCardClick(trendingCardsData[0])}
                    className="relative bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-xl p-4 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <div className="w-20 h-28 rounded-lg shadow-lg overflow-hidden bg-gray-800">
                          <img 
                            src={trendingCardsData[0].imageUrl} 
                            alt={trendingCardsData[0].name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center" style={{display: 'none'}}>
                            <span className="text-white font-bold text-xs">🔥</span>
                      </div>
                  </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">1</span>
                </div>
              </div>
                      <h4 className="text-white font-bold text-sm group-hover:text-orange-400 transition-colors mb-1">{trendingCardsData[0].name}</h4>
                      <p className="text-gray-400 text-xs mb-2">{trendingCardsData[0].set}</p>
                      <div className="text-orange-400 font-bold text-lg">{formatCurrency(trendingCardsData[0].current_value || trendingCardsData[0].price || 0)}</div>
                      <div className="flex items-center gap-1 text-orange-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="font-semibold">+{(Math.abs(trendingCardsData[0].percentChange || 0)).toFixed(1)}%</span>
              </div>
              </div>
            </div>

                  {/* Trending Card 2 */}
                  <div 
                    onClick={() => handleCardClick(trendingCardsData[1])}
                    className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <div className="w-20 h-28 rounded-lg shadow-lg overflow-hidden bg-gray-800">
                          <img 
                            src={trendingCardsData[1].imageUrl} 
                            alt={trendingCardsData[1].name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center" style={{display: 'none'}}>
                            <span className="text-white font-bold text-xs">⚡</span>
              </div>
                    </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">2</span>
                  </div>
                      </div>
                      <h4 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors mb-1">{trendingCardsData[1].name}</h4>
                      <p className="text-gray-400 text-xs mb-2">{trendingCardsData[1].set}</p>
                      <div className="text-blue-400 font-bold text-lg">{formatCurrency(trendingCardsData[1].current_value || trendingCardsData[1].price || 0)}</div>
                      <div className="flex items-center gap-1 text-blue-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="font-semibold">+{(Math.abs(trendingCardsData[1].percentChange || 0)).toFixed(1)}%</span>
                      </div>
                  </div>
                </div>

                  {/* Trending Card 3 */}
                  <div 
                    onClick={() => handleCardClick(trendingCardsData[2])}
                    className="relative bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-xl p-4 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <div className="w-20 h-28 rounded-lg shadow-lg overflow-hidden bg-gray-800">
                          <img 
                            src={trendingCardsData[2].imageUrl} 
                            alt={trendingCardsData[2].name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center" style={{display: 'none'}}>
                            <span className="text-white font-bold text-xs">🌿</span>
                      </div>
                  </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">3</span>
                </div>
                    </div>
                      <h4 className="text-white font-bold text-sm group-hover:text-green-400 transition-colors mb-1">{trendingCardsData[2].name}</h4>
                      <p className="text-gray-400 text-xs mb-2">{trendingCardsData[2].set}</p>
                      <div className="text-green-400 font-bold text-lg">{formatCurrency(trendingCardsData[2].current_value || trendingCardsData[2].price || 0)}</div>
                      <div className="flex items-center gap-1 text-green-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="font-semibold">+{(Math.abs(trendingCardsData[2].percentChange || 0)).toFixed(1)}%</span>
                      </div>
                  </div>
                </div>

                  {/* Trending Card 4 */}
                  <div 
                    onClick={() => handleCardClick(trendingCardsData[3])}
                    className="relative bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <div className="w-20 h-28 rounded-lg shadow-lg overflow-hidden bg-gray-800">
                          <img 
                            src={trendingCardsData[3].imageUrl} 
                            alt={trendingCardsData[3].name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center" style={{display: 'none'}}>
                            <span className="text-white font-bold text-xs">✨</span>
                      </div>
                  </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">4</span>
                </div>
                    </div>
                      <h4 className="text-white font-bold text-sm group-hover:text-purple-400 transition-colors mb-1">{trendingCardsData[3].name}</h4>
                      <p className="text-gray-400 text-xs mb-2">{trendingCardsData[3].set}</p>
                      <div className="text-purple-400 font-bold text-lg">{formatCurrency(trendingCardsData[3].current_value || trendingCardsData[3].price || 0)}</div>
                      <div className="flex items-center gap-1 text-purple-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="font-semibold">+{(Math.abs(trendingCardsData[3].percentChange || 0)).toFixed(1)}%</span>
                      </div>
                  </div>
                </div>
              </div>
              
                <button 
                  onClick={() => {
                    setActiveTab('search');
                    setNavigationMode('search'); // Update navigation bar to show search as active
                    setShowSearchResults(false); // Show trending cards instead of search results
                    scrollToTop() // Scroll to top when navigating
                  }}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-[#6865E7] to-[#8B5CF6] hover:from-[#5A57D1] hover:to-[#7C3AED] rounded-xl text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#6865E7]/25"
                >
                  <span>Explore All Trending</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              </div>
        </>
        )}

        {activeTab === 'search' && (
          <div 
            data-search-section
            className="flex flex-col px-4 pb-20 transition-all duration-300 ease-in-out animate-in fade-in-0 slide-in-from-bottom-4"
          >
            {/* Search Header - Fixed */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h2 className="text-white text-lg font-semibold">
                {showSearchResults ? `Search Results (${filteredSearchResults.length})` : ''}
              </h2>
              {showSearchResults && (
                <button
                  onClick={() => setShowSortModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                  Sort
                </button>
                    )}
              </div>
              
            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto" onScroll={handleScroll} style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* Search Results */}
              {showSearchResults && (
                <div className="mb-6">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5">
                    {filteredSearchResults.map((card, index) => (
                      <MarketplaceCard
                        key={`search-${card.id}-${index}`}
                        platform="Search"
                        cardName={card.name}
                        setName={card.set?.name || card.set || 'Unknown Set'}
                        rarity={card.rarity}
                        cardNumber={`#${card.number || ''}`}
                        price={formatCurrency(card.currentValue || card.current_value || card.price || 0)}
                        isCollection={true}
                        cardImage={card.imageUrl || card.images?.small || card.images?.large || '/placeholder-card.png'}
                        onClick={() => {
                          setSelectedCard(card);
                          setShowCardProfile(true);
                        }}
                        onAddToCollection={() => handleAddToCollection(card)}
                      />
                    ))}
                  </div>
                  
                  {filteredSearchResults.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">No cards found matching your search.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Trending Cards Section - Only show when no search results */}
              {!showSearchResults && (
                <div className="mb-6 pb-20">
                  <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                <h3 className="text-white font-medium">Trending Now</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5">
                {allTrendingCards.slice(0, visibleCardsCount).map((card, index) => (
                  <MarketplaceCard
                    key={`trending-${card.id}`}
                    platform="Trending"
                    cardName={card.name}
                    setName={card.set?.name || 'Unknown Set'}
                    rarity={card.rarity}
                    cardNumber={`#${card.number || ''}`}
                    price={formatCurrency(card.currentValue || card.current_value || card.price || 0)}
                    isCollection={true}
                    cardImage={card.imageUrl || card.images?.small || card.images?.large || '/placeholder-card.png'}
                    onClick={() => {
                      setSelectedCard(card);
                      setShowCardProfile(true);
                    }}
                    onAddToCollection={() => handleAddToCollection(card)}
                  />
                ))}
                </div>

              {/* Loading More Indicator */}
              {isLoadingMore && (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-sm">Loading more cards...</span>
                    </div>
                  </div>
              )}
              
              {/* End of Results */}
              {visibleCardsCount >= allTrendingCards.length && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">You've reached the end of trending cards!</p>
                </div>
              )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="px-4 mb-6">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
              <h2 className="text-white text-xl font-semibold mb-2">Scan Card</h2>
              <p className="text-gray-400 mb-6">Point your camera at a card to identify it</p>
              <button className="bg-primary text-accent font-semibold py-3 px-8 rounded-xl">
                Start Scanning
                </button>
                  </div>
                </div>
        )}

        {activeTab === 'collection' && (
          <div className="px-4 mb-6 pb-20 transition-all duration-300 ease-in-out animate-in fade-in-0 slide-in-from-bottom-4">
            {/* Collection Header with Dropdown */}
              <div className="space-y-4 mb-6">
                {/* Collection Dropdown - Top Row */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button 
                      className="flex items-center gap-[7px] px-3 py-2 hover:bg-gray-600/20 rounded-lg transition-colors"
                      onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
                    >
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5 shrink-0 text-white">
                          <span className="text-[14px] font-bold">Collection</span>
                          <span className="text-[12px] font-bold">:</span>
                        </div>
                        <div className="shrink-0 text-[#605DEC] text-[14px] font-bold">
                          <span className="truncate">
                            {userData?.collections?.find(c => c.id === selectedCollection)?.name || 'My Personal Collection'}
                          </span>
                        </div>
                        <div className="relative shrink-0">
                          <svg 
                            className={`w-4 h-4 text-white transition-transform flex-shrink-0 ${showCollectionDropdown ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    
                    
                    {/* Collection Dropdown */}
                    {showCollectionDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                        <div className="py-2">
                          {userData?.collections?.map((collection) => (
                            <button
                              key={collection.id}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${
                                selectedCollection === collection.id ? 'bg-gray-700 text-[#605DEC]' : 'text-white'
                              }`}
                              onClick={() => {
                                setSelectedCollection(collection.id)
                                setShowCollectionDropdown(false)
                              }}
                            >
                              {collection.name}
                            </button>
                          ))}
                          <div className="border-t border-gray-600 my-1"></div>
                          <button
                            className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                            onClick={() => {
                              setShowCreateCollectionModal(true)
                              setShowCollectionDropdown(false)
                            }}
                          >
                            + Create New Collection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Collection Stats - Bottom Row */}
                <div className="flex items-center justify-between w-full">
                  <div className="text-white text-lg font-bold">
                    {formatCurrency(userData?.collections?.find(c => c.id === selectedCollection)?.totalValue || 0)}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {userData?.collections?.find(c => c.id === selectedCollection)?.totalCards || 0} cards
                  </div>
                </div>
              </div>

              {/* Collection Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search collection..."
                    value={collectionSearchQuery}
                    onChange={(e) => setCollectionSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent"
                  />
                  {collectionSearchQuery && (
                    <button
                      onClick={() => setCollectionSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Sort and Filter Dropdowns */}
              <div className="flex items-center gap-2 mb-4">
                {/* Sort Dropdown */}
                <div className="relative flex-1 sort-dropdown">
                  <button 
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors w-full"
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                  >
                    <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span className="text-white text-xs font-bold flex-shrink-0">Sort:</span>
                    <span className="text-[#605DEC] text-xs font-bold truncate">
                      {collectionSortOption === 'name' ? 'Name' : 
                       collectionSortOption === 'name-desc' ? 'Name Z-A' :
                       collectionSortOption === 'price' ? 'Price Low' : 
                       collectionSortOption === 'price-desc' ? 'Price High' :
                       collectionSortOption === 'rarity' ? 'Rarity' : 
                       collectionSortOption === 'set' ? 'Set' : 'Name'}
                    </span>
                    <svg 
                      className={`w-3 h-3 text-white transition-transform flex-shrink-0 ${showSortDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showSortDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        {[
                          { value: 'name', label: 'Name A-Z' },
                          { value: 'name-desc', label: 'Name Z-A' },
                          { value: 'price', label: 'Price Low-High' },
                          { value: 'price-desc', label: 'Price High-Low' },
                          { value: 'rarity', label: 'Rarity' },
                          { value: 'set', label: 'Set' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${
                              collectionSortOption === option.value ? 'bg-gray-700 text-[#605DEC]' : 'text-white'
                            }`}
                            onClick={() => {
                              setCollectionSortOption(option.value)
                              setShowSortDropdown(false)
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Filter Button */}
                <div className="relative flex-1">
                  <button 
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors w-full"
                    onClick={() => setShowFilterModal(true)}
                  >
                    <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="text-white text-xs font-bold flex-shrink-0">Filter:</span>
                    <span className="text-[#605DEC] text-xs font-bold truncate">
                      {Object.values(filterSettings).some(arr => Array.isArray(arr) ? arr.length > 0 : arr !== 'all' && arr !== 'international') ? 'Active Filters' : 'All Cards'}
                    </span>
                    <svg className="w-3 h-3 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Collection Cards Grid - Responsive */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5">
                {(() => {
                  try {
                    const collection = userData?.collections?.find(c => c.id === selectedCollection)
                    if (!collection || !collection.cards || collection.cards.length === 0) {
                      return (
                        <div className="col-span-3 flex flex-col items-center justify-center py-12 min-h-[400px]">
                          <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <h3 className="text-white text-lg font-semibold mb-2">No Cards in Collection</h3>
                          <p className="text-gray-400 mb-4 text-center max-w-md">Start building your collection by scanning cards or adding them from the marketplace.</p>
                          <button 
                            onClick={() => setShowScanner(true)}
                            className="px-6 py-2 bg-[#605DEC] hover:bg-[#4F46E5] text-white rounded-lg font-medium transition-colors"
                          >
                            Scan Cards
                          </button>
                        </div>
                      )
                    }

                    // Filter cards based on search query and filter settings
                    const filteredCards = collection.cards.filter(card => {
                      // Search query filter
                      if (collectionSearchQuery.trim()) {
                        const searchTerm = collectionSearchQuery.toLowerCase()
                        const matchesSearch = (
                          (card.name || '').toLowerCase().includes(searchTerm) ||
                          (card.set || '').toLowerCase().includes(searchTerm) ||
                          (card.rarity || '').toLowerCase().includes(searchTerm) ||
                          (card.number || '').toLowerCase().includes(searchTerm)
                        )
                        if (!matchesSearch) return false
                      }

                      // Card Status filter
                      if (filterSettings.cardStatus === 'duplicates') {
                        // Show only cards with quantity > 1
                        const quantity = card.quantity || 1
                        if (quantity <= 1) return false
                      } else if (filterSettings.cardStatus === 'wishlisted') {
                        // Show only wishlisted cards (this would need to be implemented in the card data structure)
                        // For now, we'll skip this filter as it's not in the current data structure
                      }
                      // If cardStatus is 'all', show all cards (no filtering)

                      // Languages filter
                      if (filterSettings.languages.length > 0) {
                        const cardLanguage = (card.language || 'english').toLowerCase()
                        if (!filterSettings.languages.includes(cardLanguage)) return false
                      }

                      // Products filter
                      if (filterSettings.products.length > 0) {
                        // For now, all cards are considered 'cards' type
                        // This would need to be implemented based on your data structure
                        if (!filterSettings.products.includes('cards')) return false
                      }

                      // Energies filter
                      if (filterSettings.energies.length > 0) {
                        const cardTypes = card.types || []
                        const hasMatchingEnergy = filterSettings.energies.some(energy => 
                          cardTypes.some(type => type.toLowerCase() === energy.toLowerCase())
                        )
                        if (!hasMatchingEnergy) return false
                      }

                      // Supertype filter
                      if (filterSettings.supertype.length > 0) {
                        const cardSupertype = (card.supertype || 'pokemon').toLowerCase()
                        if (!filterSettings.supertype.includes(cardSupertype)) return false
                      }

                      // Rarities filter
                      if (filterSettings.rarities.length > 0) {
                        const cardRarity = (card.rarity || '').toLowerCase().replace(/\s+/g, '_')
                        if (!filterSettings.rarities.includes(cardRarity)) return false
                      }

                      // Variants filter
                      if (filterSettings.variants.length > 0) {
                        // This would need to be implemented based on your card data structure
                        // For now, we'll assume all cards are 'normal' variant
                        if (!filterSettings.variants.includes('normal')) return false
                      }

                      // Formats filter
                      if (filterSettings.formats.length > 0) {
                        // This would need to be implemented based on your card data structure
                        // For now, we'll assume all cards are 'unlimited' format
                        if (!filterSettings.formats.includes('unlimited')) return false
                      }

                      // Regulation Markings filter
                      if (filterSettings.regulationMarkings.length > 0) {
                        // This would need to be implemented based on your card data structure
                        // For now, we'll skip this filter
                      }

                      // Conditions filter
                      if (filterSettings.conditions.length > 0) {
                        // This would need to be implemented based on your card data structure
                        // For now, we'll skip this filter
                      }

                      return true
                    })

                    // Sort cards based on selected option
                    const sortedCards = [...filteredCards].sort((a, b) => {
                      switch (collectionSortOption) {
                        case 'name':
                          return (a.name || '').localeCompare(b.name || '')
                        case 'name-desc':
                          return (b.name || '').localeCompare(a.name || '')
                        case 'price':
                          return (a.currentValue || a.current_value || a.price || 0) - (b.currentValue || b.current_value || b.price || 0)
                        case 'price-desc':
                          return (b.currentValue || b.current_value || b.price || 0) - (a.currentValue || a.current_value || a.price || 0)
                        case 'rarity':
                          return (a.rarity || '').localeCompare(b.rarity || '')
                        case 'set':
                          return (a.set || '').localeCompare(b.set || '')
                        default:
                          return 0
                      }
                    })

                    // Show no results message if search or filters return no cards
                    if (sortedCards.length === 0 && (collectionSearchQuery.trim() || Object.values(filterSettings).some(arr => Array.isArray(arr) ? arr.length > 0 : arr !== 'all' && arr !== 'international'))) {
                      return (
                        <div className="col-span-2 text-center py-12">
                          <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <h3 className="text-white text-lg font-semibold mb-2">No Cards Found</h3>
                          <p className="text-gray-400 mb-4">
                            {collectionSearchQuery.trim() 
                              ? `No cards match your search for "${collectionSearchQuery}"`
                              : "No cards match your current filter settings"
                            }
                          </p>
                          <div className="flex gap-2 justify-center">
                            {collectionSearchQuery.trim() && (
                              <button 
                                onClick={() => setCollectionSearchQuery('')}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                              >
                                Clear Search
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setCollectionSearchQuery('')
                                setFilterSettings({
                                  cardStatus: 'all',
                                  languages: [],
                                  products: [],
                                  energies: [],
                                  supertype: [],
                                  rarityType: 'international',
                                  rarities: [],
                                  variants: [],
                                  formats: [],
                                  regulationMarkings: [],
                                  conditions: []
                                })
                              }}
                              className="px-4 py-2 bg-[#605DEC] hover:bg-[#4F46E5] text-white rounded-lg font-medium transition-colors"
                            >
                              Clear All Filters
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return sortedCards.map((card, index) => {
                      const isSelected = selectedCollectionCards.has(card.id)
                      
                      return (
                        <MarketplaceCard
                          key={card.id || index}
                          platform="Collection"
                          cardName={card.name}
                          setName={card.set || 'Unknown Set'}
                          rarity={card.rarity}
                          cardNumber={`#${card.number}`}
                          price={formatCurrency(card.currentValue || card.current_value || card.price || 0)}
                          isCollection={true}
                          isSelected={isSelected}
                          quantity={card.quantity || 1}
                          cardImage={card.imageUrl || card.images?.small || card.images?.large || '/placeholder-card.png'}
                          onClick={(e) => handleCollectionCardClick(e, card)}
                          onPressStart={(e) => handleCollectionCardPressStart(e, card)}
                          onPressEnd={handleCollectionCardPressEnd}
                          onTouchStart={(e) => handleCollectionCardPressStart(e, card)}
                          onTouchEnd={(e) => handleCollectionCardTouchEnd(e, card)}
                          onTouchMove={handleCollectionCardTouchMove}
                        />
                      )
                    })
                  } catch (error) {
                    console.error('Error rendering collection:', error)
                    return (
                      <div className="col-span-2 text-center py-12">
                        <div className="w-16 h-16 bg-red-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <h3 className="text-red-400 text-lg font-semibold mb-2">Error Loading Collection</h3>
                        <p className="text-gray-400 mb-4">There was an error loading your collection. Please try again.</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                        >
                          Reload Page
                        </button>
                      </div>
                    )
                  }
                })()}
              </div>

            {/* Collection Multi-Select Action Bar */}
            {isCollectionMultiSelectMode && selectedCollectionCards.size > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-t border-gray-600 z-[100] collection-multi-select-bar">
                <div className="px-4 py-4">
                  {/* Top Row - Selected count and Cancel */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-white text-base font-semibold">
                        {selectedCollectionCards.size} selected
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsCollectionMultiSelectMode(false)
                        setSelectedCollectionCards(new Set())
                      }}
                      className="text-gray-400 hover:text-white text-sm font-medium px-3 py-1 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* Bottom Row - Action Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors min-w-[80px] justify-center"
                      onClick={handleMoveToFolder}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span className="text-white text-sm font-medium">Move</span>
                    </button>
                    
                    <button 
                      className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors min-w-[80px] justify-center"
                      onClick={handleAddToDeck}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-white text-sm font-medium">Deck</span>
                    </button>
                    
                    <button 
                      className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors min-w-[80px] justify-center"
                      onClick={handleAddToBinder}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      <span className="text-white text-sm font-medium">Binder</span>
                    </button>
                    
                    <button 
                      className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 rounded-lg transition-colors min-w-[80px] justify-center"
                      onClick={async () => {
                        const cardIds = Array.from(selectedCollectionCards)
                        if (cardIds.length === 0) return
                        
                        const totalQuantity = cardIds.reduce((sum, cardId) => {
                          const card = myCardEntries.find(entry => entry.id === cardId)
                          return sum + (card?.quantity || 1)
                        }, 0)
                        
                        if (confirm(`Remove ${cardIds.length} card${cardIds.length !== 1 ? 's' : ''} (${totalQuantity} total) from your collection?`)) {
                          let successCount = 0
                          
                          for (const cardId of cardIds) {
                            const success = userDatabase.removeCardFromCollection(selectedCollection, cardId)
                            if (success) successCount++
                          }
                          
                          if (successCount > 0) {
                            // Clear selection and exit multi-select mode
                            setSelectedCollectionCards(new Set())
                            setIsCollectionMultiSelectMode(false)
                            
                            // Refresh the collection data
                            const updatedUserData = userDatabase.getUserData()
                            setUserData(updatedUserData)
                            
                            // Update myCardEntries
                            const updatedCollection = updatedUserData?.collections?.find(c => c.id === selectedCollection)
                            if (updatedCollection) {
                              setMyCardEntries(updatedCollection.cards || [])
                            }
                            
                            console.log(`Successfully removed ${successCount} card${successCount !== 1 ? 's' : ''} from collection`)
                          } else {
                            alert('Failed to remove cards. Please try again.')
                          }
                        }
                      }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-white text-sm font-medium">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Move to Folder Modal */}
            {showMoveToFolderModal && (
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
                onClick={() => setShowMoveToFolderModal(false)}
              >
                <div 
                  className="bg-gray-800 rounded-xl p-6 mx-4 max-w-md w-full move-to-folder-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-white text-lg font-semibold mb-2">Move to Folder</h3>
                    <p className="text-gray-400 text-sm">
                      Select a folder to move {selectedCollectionCards.size} card{selectedCollectionCards.size !== 1 ? 's' : ''} to
                    </p>
                  </div>
                  
                  <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                    {availableFolders.length > 0 ? (
                      availableFolders.map((folder) => (
                        <button
                          key={folder.id}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                          onClick={() => handleFolderSelection(folder.id)}
                        >
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: folder.color }}
                          ></div>
                          <span className="text-white font-medium">{folder.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <h4 className="text-white text-lg font-semibold mb-2">No Other Collections</h4>
                        <p className="text-gray-400 text-sm">Create another collection to move cards to.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                      onClick={() => setShowMoveToFolderModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="flex-1 px-4 py-2 bg-[#605DEC] hover:bg-[#4F46E5] text-white rounded-lg transition-colors"
                      onClick={() => {
                        // TODO: Implement create new folder functionality
                        console.log('Create new folder')
                      }}
                    >
                      + New Folder
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add to Deck Modal */}
            {showAddToDeckModal && (
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
                onClick={() => setShowAddToDeckModal(false)}
              >
                <div 
                  className="bg-gray-800 rounded-xl p-6 mx-4 max-w-md w-full add-to-deck-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-white text-lg font-semibold mb-2">Add to Deck</h3>
                    <p className="text-gray-400 text-sm">
                      Select a deck to add {selectedCollectionCards.size} card{selectedCollectionCards.size !== 1 ? 's' : ''} to
                    </p>
                  </div>
                  
                  <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                    {availableDecks.length > 0 ? (
                      availableDecks.map((deck) => (
                        <button
                          key={deck.id}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                          onClick={() => handleDeckSelection(deck.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: deck.color }}
                            ></div>
                            <span className="text-white font-medium">{deck.name}</span>
                          </div>
                          <span className="text-gray-400 text-sm">{deck.cardCount} cards</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h4 className="text-white text-lg font-semibold mb-2">No Decks Available</h4>
                        <p className="text-gray-400 text-sm">Create a deck to add cards to.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                      onClick={() => setShowAddToDeckModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="flex-1 px-4 py-2 bg-[#605DEC] hover:bg-[#4F46E5] text-white rounded-lg transition-colors"
                      onClick={() => {
                        // TODO: Implement create new deck functionality
                        console.log('Create new deck')
                      }}
                    >
                      + New Deck
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add to Binder Modal */}
            {showAddToBinderModal && (
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
                onClick={() => setShowAddToBinderModal(false)}
              >
                <div 
                  className="bg-gray-800 rounded-xl p-6 mx-4 max-w-md w-full add-to-binder-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-white text-lg font-semibold mb-2">Add to Binder</h3>
                    <p className="text-gray-400 text-sm">
                      Select a binder to add {selectedCollectionCards.size} card{selectedCollectionCards.size !== 1 ? 's' : ''} to
                    </p>
                  </div>
                  
                  <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                    {availableBinders.length > 0 ? (
                      availableBinders.map((binder) => (
                        <button
                          key={binder.id}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                          onClick={() => handleBinderSelection(binder.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: binder.color }}
                            ></div>
                            <span className="text-white font-medium">{binder.name}</span>
                          </div>
                          <span className="text-gray-400 text-sm">{binder.cardCount} cards</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                          </svg>
                        </div>
                        <h4 className="text-white text-lg font-semibold mb-2">No Binders Available</h4>
                        <p className="text-gray-400 text-sm">Create a binder to add cards to.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                      onClick={() => setShowAddToBinderModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="flex-1 px-4 py-2 bg-[#605DEC] hover:bg-[#4F46E5] text-white rounded-lg transition-colors"
                      onClick={() => {
                        // TODO: Implement create new binder functionality
                        console.log('Create new binder')
                      }}
                    >
                      + New Binder
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="transition-all duration-300 ease-in-out animate-in fade-in-0 slide-in-from-bottom-4" style={{ height: 'calc(100vh - 120px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {/* Search Section */}
            <div className="flex items-center gap-2 mb-4 px-4">
              <div className="flex-1 bg-[#2b2b2b] rounded-lg px-4 py-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search marketplace..."
                  value={marketplaceSearchQuery}
                  onChange={(e) => setMarketplaceSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                />
                {marketplaceSearchQuery && (
                  <button
                    onClick={() => setMarketplaceSearchQuery('')}
                    className="hover:bg-gray-700 rounded p-0.5 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Trending Products Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 px-4">
                <h2 className="text-white text-lg font-bold">Trending Products</h2>
                <button className="text-gray-400 text-sm">View all</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 pl-4 pr-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-x-visible md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {[
                  { platform: 'TCGPlayer', cardName: 'Charizard', setName: 'Base Set', rarity: 'Rare Holo', cardNumber: '004/102', price: `$${(Math.random() * 100 + 10).toFixed(2)}` },
                  { platform: 'eBay', cardName: 'Charizard', setName: 'Base Set', rarity: 'Rare Holo', cardNumber: '004/102', price: `$${(Math.random() * 100 + 10).toFixed(2)}` },
                  { platform: 'Whatnot', cardName: 'Charizard', setName: 'Base Set', rarity: 'Rare Holo', cardNumber: '004/102', price: `$${(Math.random() * 100 + 10).toFixed(2)}` },
                  { platform: 'Drip', cardName: 'Charizard', setName: 'Base Set', rarity: 'Rare Holo', cardNumber: '004/102', price: `$${(Math.random() * 100 + 10).toFixed(2)}` },
                  { platform: 'Fanatics', cardName: 'Charizard', setName: 'Base Set', rarity: 'Rare Holo', cardNumber: '004/102', price: `$${(Math.random() * 100 + 10).toFixed(2)}` },
                  { platform: 'TCGPlayer', cardName: 'Charizard', setName: 'Base Set', rarity: 'Rare Holo', cardNumber: '004/102', price: `$${(Math.random() * 100 + 10).toFixed(2)}` }
                ].map((card, index) => (
                  <MarketplaceCard
                    key={index}
                    platform={card.platform}
                    cardName={card.cardName}
                    setName={card.setName}
                    rarity={card.rarity}
                    cardNumber={card.cardNumber}
                    price={card.price}
                  />
                ))}
              </div>
            </div>

            {/* Recent Searches Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 px-4">
                <h2 className="text-white text-lg font-bold">Recent Searches</h2>
                <button className="text-gray-400 text-sm">View all</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 pl-4 pr-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-x-visible md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {[
                  { platform: 'eBay', cardName: 'Pikachu VMAX', setName: 'Vivid Voltage', rarity: 'Rare Ultra', cardNumber: '188/185', price: `$${(Math.random() * 50 + 5).toFixed(2)}` },
                  { platform: 'Whatnot', cardName: 'Pikachu VMAX', setName: 'Vivid Voltage', rarity: 'Rare Ultra', cardNumber: '188/185', price: `$${(Math.random() * 50 + 5).toFixed(2)}` },
                  { platform: 'TCGPlayer', cardName: 'Pikachu VMAX', setName: 'Vivid Voltage', rarity: 'Rare Ultra', cardNumber: '188/185', price: `$${(Math.random() * 50 + 5).toFixed(2)}` },
                  { platform: 'Fanatics', cardName: 'Pikachu VMAX', setName: 'Vivid Voltage', rarity: 'Rare Ultra', cardNumber: '188/185', price: `$${(Math.random() * 50 + 5).toFixed(2)}` },
                  { platform: 'Drip', cardName: 'Pikachu VMAX', setName: 'Vivid Voltage', rarity: 'Rare Ultra', cardNumber: '188/185', price: `$${(Math.random() * 50 + 5).toFixed(2)}` },
                  { platform: 'eBay', cardName: 'Pikachu VMAX', setName: 'Vivid Voltage', rarity: 'Rare Ultra', cardNumber: '188/185', price: `$${(Math.random() * 50 + 5).toFixed(2)}` }
                ].map((card, index) => (
                  <MarketplaceCard
                    key={index}
                    platform={card.platform}
                    cardName={card.cardName}
                    setName={card.setName}
                    rarity={card.rarity}
                    cardNumber={card.cardNumber}
                    price={card.price}
                  />
                ))}
              </div>
            </div>

            {/* Wishlist Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 px-4">
                <h2 className="text-white text-lg font-bold">Wishlist</h2>
                <button className="text-gray-400 text-sm">View all</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 pl-4 pr-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {[
                  { platform: 'Fanatics', cardName: 'Mewtwo GX', setName: 'Shining Legends', rarity: 'Rare Holo GX', cardNumber: '072/073', price: `$${(Math.random() * 80 + 20).toFixed(2)}` },
                  { platform: 'Drip', cardName: 'Mewtwo GX', setName: 'Shining Legends', rarity: 'Rare Holo GX', cardNumber: '072/073', price: `$${(Math.random() * 80 + 20).toFixed(2)}` },
                  { platform: 'eBay', cardName: 'Mewtwo GX', setName: 'Shining Legends', rarity: 'Rare Holo GX', cardNumber: '072/073', price: `$${(Math.random() * 80 + 20).toFixed(2)}` },
                  { platform: 'TCGPlayer', cardName: 'Mewtwo GX', setName: 'Shining Legends', rarity: 'Rare Holo GX', cardNumber: '072/073', price: `$${(Math.random() * 80 + 20).toFixed(2)}` },
                  { platform: 'Whatnot', cardName: 'Mewtwo GX', setName: 'Shining Legends', rarity: 'Rare Holo GX', cardNumber: '072/073', price: `$${(Math.random() * 80 + 20).toFixed(2)}` },
                  { platform: 'Fanatics', cardName: 'Mewtwo GX', setName: 'Shining Legends', rarity: 'Rare Holo GX', cardNumber: '072/073', price: `$${(Math.random() * 80 + 20).toFixed(2)}` }
                ].map((card, index) => (
                  <MarketplaceCard
                    key={index}
                    platform={card.platform}
                    cardName={card.cardName}
                    setName={card.setName}
                    rarity={card.rarity}
                    cardNumber={card.cardNumber}
                    price={card.price}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="px-4 mb-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
              <div>
                <h2 className="text-white text-xl font-semibold mb-2">Profile</h2>
                <p className="text-gray-400 mb-6">Manage your account and preferences</p>
                <div className="space-y-3">
                <button className="w-full bg-gray-800 text-white py-3 px-4 rounded-xl text-left">
                  Account Settings
                </button>
                <button className="w-full bg-gray-800 text-white py-3 px-4 rounded-xl text-left">
                  Collection Stats
                </button>
                <button className="w-full bg-gray-800 text-white py-3 px-4 rounded-xl text-left">
                  Price Alerts
                </button>
                  </div>
                </div>
                    </div>
                  </div>
        )}

        {/* Create Collection Modal */}
        {showCreateCollectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Create New Collection</h3>
                <button 
                  onClick={() => {
                    setShowCreateCollectionModal(false)
                    setNewCollectionName('')
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      createNewCollection()
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateCollectionModal(false)
                    setNewCollectionName('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewCollection}
                  disabled={!newCollectionName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Collection
                </button>
              </div>
                  </div>
                      </div>
        )}

        {/* Collections Modal */}
        {showCollectionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Your Collections</h3>
                <button 
                  onClick={() => setShowCollectionsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                </button>
                </div>

              <div className="space-y-3">
                {userData?.collections.map((collection) => (
                  <div 
                    key={collection.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedCollection === collection.id 
                        ? 'bg-blue-600/20 border-blue-500' 
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                    onClick={() => {
                      setSelectedCollection(collection.id)
                      setShowCollectionsModal(false)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{collection.name}</h4>
                        <p className="text-gray-400 text-sm">
                          {collection.cardCount} cards • {formatCurrency(collection.totalValue)}
                        </p>
                  </div>
                      <div className="flex items-center gap-2">
                        {collection.monthlyChange >= 0 ? (
                          <div className="flex items-center gap-1 text-green-400 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                            <span>+{collection.monthlyChange.toFixed(1)}%</span>
                      </div>
                    ) : (
                          <div className="flex items-center gap-1 text-red-400 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            </svg>
                            <span>{collection.monthlyChange.toFixed(1)}%</span>
                          </div>
                        )}
                        {selectedCollection === collection.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
                ))}

                <button 
                  onClick={() => {
                    setShowCollectionsModal(false)
                    setShowCreateCollectionModal(true)
                  }}
                  className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                  Create New Collection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Modal */}
        {showActivityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Recent Activity</h3>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                </button>
              </div>

              <div className="space-y-3">
                {recentActivityData.map((activity) => (
                  <div key={activity.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">{activity.cardName}</h4>
                        <p className="text-gray-400 text-xs mt-1">{activity.time}</p>
              </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        activity.type === 'add' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {activity.type === 'add' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12L18 12" />
                          )}
                            </svg>
                        <span>{activity.action}</span>
                          </div>
                      </div>
                    </div>
                ))}
                
                {recentActivityData.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                    <h4 className="text-white font-medium mb-2">No Recent Activity</h4>
                    <p className="text-gray-400 text-sm">Start adding cards to your collection to see activity here.</p>
                      </div>
                        )}
                      </div>
                    </div>
                      </div>
        )}

        {/* Bottom Navigation Bar - Glass Effect Design */}
        <div 
          className="fixed bottom-4 left-0 right-0 px-[19px] py-0 rounded-[16px]"
          style={{
            filter: 'drop-shadow(0px 24px 7px rgba(0,0,0,0.01)) drop-shadow(16px 16px 16px rgba(0,0,0,0.04)) drop-shadow(0px 9px 5px rgba(0,0,0,0.15)) drop-shadow(0px 4px 4px rgba(0,0,0,0.25)) drop-shadow(0px 1px 2px rgba(0,0,0,0.29))'
          }}
        >
          <div 
            className="flex items-center justify-between px-[30px] py-0 rounded-[16px] relative border border-white/50 h-[75px] overflow-hidden"
            style={{
              background: 'rgba(43,43,43,0.9)',
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)'
            }}
          >
            {/* Home Button */}
            <button 
              onClick={() => {
                setActiveTab('home')
                setNavigationMode('home')
                setSelectedCard(null) // Close card profile modal
                scrollToTop() // Scroll to top when navigating
              }}
              className={`flex flex-col gap-[10px] h-[75px] items-center justify-end pb-0 pt-[15px] px-[10px] w-[84px] ${navigationMode === 'home' ? '' : 'justify-center pt-[26px] h-[47px]'}`}
            >
              <div className="flex flex-col gap-[6px] h-[58px] items-center w-[64px]">
                <div className="w-6 h-6">
                  {navigationMode === 'home' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.04 6.82006L14.28 2.79006C12.71 1.69006 10.3 1.75006 8.78999 2.92006L3.77999 6.83006C2.77999 7.61006 1.98999 9.21006 1.98999 10.4701V17.3701C1.98999 19.9201 4.05999 22.0001 6.60999 22.0001H17.39C19.94 22.0001 22.01 19.9301 22.01 17.3801V10.6001C22.01 9.25006 21.14 7.59006 20.04 6.82006ZM12.75 18.0001C12.75 18.4101 12.41 18.7501 12 18.7501C11.59 18.7501 11.25 18.4101 11.25 18.0001V15.0001C11.25 14.5901 11.59 14.2501 12 14.2501C12.41 14.2501 12.75 14.5901 12.75 15.0001V18.0001Z" fill="#6865E7"/>
                            </svg>
                        ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.04 6.82006L14.28 2.79006C12.71 1.69006 10.3 1.75006 8.78999 2.92006L3.77999 6.83006C2.77999 7.61006 1.98999 9.21006 1.98999 10.4701V17.3701C1.98999 19.9201 4.05999 22.0001 6.60999 22.0001H17.39C19.94 22.0001 22.01 19.9301 22.01 17.3801V10.6001C22.01 9.25006 21.14 7.59006 20.04 6.82006ZM12.75 18.0001C12.75 18.4101 12.41 18.7501 12 18.7501C11.59 18.7501 11.25 18.4101 11.25 18.0001V15.0001C11.25 14.5901 11.59 14.2501 12 14.2501C12.41 14.2501 12.75 14.5901 12.75 15.0001V18.0001Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                      </div>
                {navigationMode === 'home' && (
                  <div className="text-white text-[11px] font-normal leading-[0]">
                    Home
                  </div>
                )}
                      </div>
                </button>

            {/* Collection Button */}
                <button
              onClick={() => {
                setSelectedCard(null) // Close card profile modal first
                setTimeout(() => {
                  setActiveTab('collection')
                  setNavigationMode('collection')
                  scrollToTop() // Scroll to top when navigating
                }, 100) // Small delay to ensure modal closes first
              }}
              className={`flex flex-col gap-[10px] h-[75px] items-center justify-end pb-0 pt-[15px] px-[10px] w-[84px] ${navigationMode === 'collection' ? '' : 'justify-center pt-[26px] h-[47px]'}`}
            >
              <div className="flex flex-col gap-[6px] h-[58px] items-center w-[64px]">
                <div className="w-6 h-6">
                  {navigationMode === 'collection' ? (
                      <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_27_2085)">
                          <path fillRule="evenodd" clipRule="evenodd" d="M13.2934 0.565676C13.0829 0.509623 12.8587 0.53932 12.6701 0.648258C12.4815 0.757196 12.3437 0.936485 12.2871 1.14682L8.28764 16.0748C8.23165 16.2855 8.26158 16.5099 8.37087 16.6986C8.48015 16.8872 8.65985 17.0248 8.8705 17.0811L19.2985 19.8754C19.5092 19.9314 19.7336 19.9015 19.9222 19.7922C20.1109 19.6829 20.2485 19.5032 20.3048 19.2925L24.3076 4.36625C24.3356 4.26179 24.3427 4.15284 24.3286 4.04563C24.3144 3.93842 24.2793 3.83505 24.2252 3.74143C24.171 3.64782 24.099 3.56579 24.0131 3.50004C23.9273 3.43429 23.8293 3.38611 23.7248 3.35825L13.2934 0.565676ZM6.2185 15.5194L8.9545 5.31082L0.943644 7.45539C0.839153 7.48325 0.741178 7.53143 0.655321 7.59718C0.569464 7.66293 0.49741 7.74496 0.443278 7.83858C0.389145 7.93219 0.353997 8.03556 0.339843 8.14277C0.325688 8.24998 0.332805 8.35893 0.360787 8.46339L4.36364 23.3897C4.41993 23.6003 4.55751 23.78 4.74619 23.8893C4.93487 23.9986 5.1592 24.0285 5.36993 23.9725L15.7996 21.1782L15.8391 21.1662L8.31336 19.1502C7.55401 18.9465 6.90661 18.4497 6.51347 17.7688C6.12032 17.088 6.01361 16.2789 6.21679 15.5194" fill="#6865E7"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_27_2085">
                            <rect width="24" height="24" fill="white" transform="translate(0.333252)"/>
                          </clipPath>
                        </defs>
                            </svg>
                    ) : (
                      <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_248_3247)">
                        <path d="M11.555 1.469C11.6113 1.26096 11.7477 1.0837 11.9344 0.976052C12.1211 0.868406 12.3428 0.839157 12.551 0.894714L22.871 3.65814C23.0797 3.71364 23.2578 3.84974 23.3661 4.03652C23.4745 4.2233 23.5042 4.44546 23.4488 4.65414L19.4888 19.4279C19.4325 19.6363 19.2959 19.8138 19.1088 19.9215C18.9217 20.0292 18.6995 20.0582 18.491 20.0021L8.17104 17.2387C7.96268 17.1828 7.78501 17.0466 7.67702 16.8599C7.56903 16.6731 7.53954 16.4512 7.59504 16.2427L11.555 1.469Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M10.8042 4.3457L1.7939 6.76113C1.58555 6.81699 1.40787 6.95325 1.29988 7.13999C1.19189 7.32672 1.16241 7.54868 1.2179 7.75713L5.17447 22.5308C5.23069 22.7393 5.36736 22.9168 5.55445 23.0245C5.74154 23.1322 5.96373 23.1612 6.17219 23.1051L11.3322 21.7234" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        </g>
                        <defs>
                          <clipPath id="clip0_248_3247">
                          <rect width="24" height="24" fill="white" transform="translate(0.333313)"></rect>
                          </clipPath>
                        </defs>
                            </svg>
                        )}
                      </div>
                {navigationMode === 'collection' && (
                  <div className="text-white text-[11px] font-normal leading-[0]">
                    Collection
                    </div>
                        )}
                      </div>
            </button>

            {/* Marketplace Button */}
            <button 
              onClick={() => {
                setActiveTab('marketplace')
                setNavigationMode('marketplace')
                scrollToTop() // Scroll to top when navigating
              }}
              className={`flex flex-col gap-[10px] h-[75px] items-center justify-end pb-0 pt-[15px] px-[10px] w-[84px] ${navigationMode === 'marketplace' ? '' : 'justify-center pt-[26px] h-[47px]'}`}
            >
              <div className="flex flex-col gap-[6px] h-[58px] items-center w-[64px]">
                <div className="w-6 h-6">
                  {navigationMode === 'marketplace' ? (
                      <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_115_14278)">
                          <path fillRule="evenodd" clipRule="evenodd" d="M11.3341 21.3334C11.3341 22.8061 10.1402 24 8.6674 24C7.19464 24 6.00073 22.8061 6.00073 21.3334C6.00073 19.8606 7.19464 18.6667 8.6674 18.6667C10.1402 18.6667 11.3341 19.8606 11.3341 21.3334ZM22.0007 21.3334C22.0007 22.8061 20.8068 24 19.3341 24C17.8613 24 16.6674 22.8061 16.6674 21.3334C16.6674 19.8606 17.8613 18.6667 19.3341 18.6667C20.8068 18.6667 22.0007 19.8606 22.0007 21.3334Z" fill="#6865E7"/>
                          <path d="M2.00081 0C1.26443 0 0.66748 0.596954 0.66748 1.33333C0.66748 2.06971 1.26443 2.66667 2.00081 2.66667H2.48134C3.11691 2.66667 3.66413 3.11528 3.78878 3.73851L5.81234 13.8563C6.06163 15.1028 7.15607 16 8.42722 16H20.2749C21.5153 16 22.592 15.1447 22.8725 13.9363L24.6099 6.45226C24.9009 5.19836 23.9489 4 22.6617 4H6.56055L6.40366 3.21554C6.02972 1.34584 4.38806 0 2.48134 0H2.00081Z" fill="#6865E7"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_115_14278">
                            <rect width="24" height="24" fill="white" transform="translate(0.666748)"/>
                          </clipPath>
                        </defs>
                            </svg>
                    ) : (
                      <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_144_6148)">
                          <path fillRule="evenodd" clipRule="evenodd" d="M11.3335 21.3348C11.3335 22.8078 10.1394 24.0019 8.66636 24.0019C7.19337 24.0019 5.99927 22.8078 5.99927 21.3348C5.99927 19.8618 7.19337 18.6677 8.66636 18.6677C10.1394 18.6677 11.3335 19.8618 11.3335 21.3348ZM22.0018 21.3348C22.0018 22.8078 20.8077 24.0019 19.3347 24.0019C17.8617 24.0019 16.6676 22.8078 16.6676 21.3348C16.6676 19.8618 17.8617 18.6677 19.3347 18.6677C20.8068 18.6677 22.0018 19.8618 22.0018 21.3348Z" fill="#8F8F94"/>
                          <path d="M1.99902 0.998108H2.47949C3.90971 0.998253 5.14138 2.00775 5.42188 3.41022L5.57812 4.1944L5.73926 4.99908H21.3311C22.8789 4.99924 23.9975 6.47835 23.5762 7.96783L22.2051 12.8165C21.8396 14.1084 20.66 15.001 19.3174 15.001H9.51953C8.08934 15.001 6.85784 13.9913 6.57715 12.5889L4.76758 3.54108C4.54945 2.45042 3.59172 1.66524 2.47949 1.6651H1.99902C1.81496 1.6651 1.66528 1.5161 1.66504 1.33209C1.66504 1.17082 1.77952 1.03595 1.93164 1.00494L1.99902 0.998108Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_144_6148">
                            <rect width="24" height="24" fill="white" transform="translate(0.666748)"/>
                          </clipPath>
                        </defs>
                            </svg>
                        )}
                      </div>
                {navigationMode === 'marketplace' && (
                  <div className="text-white text-[11px] font-normal leading-[0]">
                    Marketplace
                    </div>
                        )}
                      </div>
            </button>

            {/* Profile Button */}
            <button 
              onClick={() => {
                setActiveTab('profile')
                setNavigationMode('profile')
                setSelectedCard(null) // Close card profile modal
                scrollToTop() // Scroll to top when navigating
              }}
              className={`flex flex-col gap-[10px] h-[75px] items-center justify-end pb-0 pt-[15px] px-[10px] w-[84px] ${navigationMode === 'profile' ? '' : 'justify-center pt-[26px] h-[47px]'}`}
            >
              <div className="flex flex-col gap-[6px] h-[58px] items-center w-[64px]">
                <div className="w-6 h-6">
                  {navigationMode === 'profile' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#6865E7"/>
                      <path d="M11.9999 14.5C6.98991 14.5 2.90991 17.86 2.90991 22C2.90991 22.28 3.12991 22.5 3.40991 22.5H20.5899C20.8699 22.5 21.0899 22.28 21.0899 22C21.0899 17.86 17.0099 14.5 11.9999 14.5Z" fill="#6865E7"/>
                            </svg>
                        ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26003 15 3.41003 18.13 3.41003 22" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        )}
                      </div>
                {navigationMode === 'profile' && (
                  <div className="text-white text-[11px] font-normal leading-[0]">
                    Profile
                    </div>
                )}
                      </div>
                </button>

            {/* Active Indicator */}
            <div className={`absolute bottom-0 transition-all duration-500 ease-in-out ${
              navigationMode === 'none' ? 'transform -translate-x-[200px] opacity-0' : 'transform translate-x-0 opacity-100'
            }`}
                 style={{
                   left: navigationMode === 'home' ? '41px' : 
                         navigationMode === 'collection' ? '125px' :
                         navigationMode === 'marketplace' ? '209px' : 
                         navigationMode === 'profile' ? '293px' : '-200px'
                 }}>
              <div className="relative flex justify-center">
                {/* Glow Effect with rounded corners */}
                <div className="absolute inset-0 bg-[#6865E7] blur-sm opacity-30 scale-110 rounded-t-[16px]" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%, 4% 50%, 4% 0)'}}></div>
                <div className="absolute inset-0 bg-[#6865E7] blur-md opacity-20 scale-125 rounded-t-[16px]" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%, 4% 50%, 4% 0)'}}></div>
                
                {/* Main Indicator with rounded corners */}
                <div className="relative z-10 rounded-t-[16px] overflow-hidden">
                  <svg width="64" height="8" viewBox="0 0 64 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M59.9277 3.92798C62.1768 3.92798 64 5.75121 64 8.00024H0C0 5.75121 1.82324 3.92798 4.07227 3.92798H25L31.1387 0.802979C31.9937 0.367721 33.0063 0.367721 33.8613 0.802979L40 3.92798H59.9277Z" fill="#6865E7"/>
                  </svg>
                </div>
                
                {/* Subtle Glass Diffusion Effect with rounded corners */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-t-[16px]" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%, 4% 50%, 4% 0)'}}></div>
                      </div>
                      </div>
                    </div>

        {/* Top Movers Modal */}
        {showTopMoversModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                  <h3 className="text-white text-xl font-bold">All Top Movers</h3>
                      </div>
                <button 
                  onClick={() => setShowTopMoversModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                </button>
                    </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topMoversData.map((mover) => (
                  <div 
                    key={mover.id}
                    onClick={() => {
                      handleCardClick(mover)
                      setShowTopMoversModal(false)
                    }}
                    className={`relative rounded-xl p-4 border transition-all duration-300 group cursor-pointer ${
                      mover.type === 'gain' 
                        ? 'bg-gradient-to-r from-green-500/10 to-transparent border-green-500/20 hover:border-green-500/40' 
                        : 'bg-gradient-to-r from-red-500/10 to-transparent border-red-500/20 hover:border-red-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-20 rounded-lg shadow-lg overflow-hidden bg-gray-800">
                          <img 
                            src={mover.imageUrl} 
                            alt={mover.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className={`w-full h-full flex items-center justify-center ${
                            mover.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                            mover.rank === 2 ? 'bg-gradient-to-br from-blue-400 to-purple-500' :
                            mover.rank === 3 ? 'bg-gradient-to-br from-red-400 to-pink-500' :
                            'bg-gradient-to-br from-gray-400 to-gray-600'
                          }`} style={{display: 'none'}}>
                            <span className="text-white font-bold text-xs">#{mover.rank}</span>
                      </div>
                          </div>
                        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                          mover.type === 'gain' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mover.type === 'gain' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            )}
                            </svg>
                          </div>
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-sm transition-colors ${
                          mover.type === 'gain' ? 'text-white group-hover:text-green-400' : 'text-white group-hover:text-red-400'
                        }`}>
                          {mover.name}
                        </h4>
                        <p className="text-gray-400 text-xs">{mover.set} • {mover.rarity}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white text-xs font-medium">{mover.number}</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-400 text-xs">Qty: {getCardQuantityInCollection(mover.cardId || mover.id)}</span>
                    </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-lg ${
                          mover.type === 'gain' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          ${mover.price.toLocaleString()}
                          </div>
                        <div className={`flex items-center gap-1 text-sm ${
                          mover.type === 'gain' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mover.type === 'gain' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            )}
                            </svg>
                          <span className="font-semibold">{Math.abs(mover.change).toFixed(2)}%</span>
                          </div>
                        <div className="text-gray-400 text-xs">
                          {mover.dailyChange >= 0 ? '+' : ''}${mover.dailyChange.toFixed(2)} today
                      </div>
                    </div>
                      </div>
                          </div>
                ))}
                      </div>
                    </div>
                      </div>
        )}

        {/* Trending Cards Modal */}
        {showTrendingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                            </svg>
                          </div>
                  <h3 className="text-white text-xl font-bold">All Trending Cards</h3>
                      </div>
                <button 
                  onClick={() => setShowTrendingModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {trendingCardsData.map((card) => (
                  <div 
                    key={card.id}
                    onClick={() => {
                      handleCardClick(card)
                      setShowTrendingModal(false)
                    }}
                    className={`relative rounded-xl p-4 border transition-all duration-300 group cursor-pointer ${
                      card.color === 'orange' ? 'bg-gradient-to-br from-orange-500/10 to-red-500/5 border-orange-500/20 hover:border-orange-500/40' :
                      card.color === 'blue' ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20 hover:border-blue-500/40' :
                      card.color === 'green' ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 hover:border-green-500/40' :
                      card.color === 'purple' ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20 hover:border-purple-500/40' :
                      card.color === 'red' ? 'bg-gradient-to-br from-red-500/10 to-pink-500/5 border-red-500/20 hover:border-red-500/40' :
                      card.color === 'cyan' ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/20 hover:border-cyan-500/40' :
                      card.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20 hover:border-emerald-500/40' :
                      'bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-500/20 hover:border-gray-500/40'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <div className="w-20 h-28 rounded-lg shadow-lg overflow-hidden bg-gray-800">
                          <img 
                            src={card.imageUrl} 
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className={`w-full h-full flex items-center justify-center ${
                            card.color === 'orange' ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                            card.color === 'blue' ? 'bg-gradient-to-br from-blue-400 to-cyan-500' :
                            card.color === 'green' ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                            card.color === 'purple' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                            card.color === 'red' ? 'bg-gradient-to-br from-red-400 to-pink-500' :
                            card.color === 'cyan' ? 'bg-gradient-to-br from-cyan-400 to-blue-500' :
                            card.color === 'emerald' ? 'bg-gradient-to-br from-emerald-400 to-green-500' :
                            'bg-gradient-to-br from-gray-400 to-gray-600'
                          }`} style={{display: 'none'}}>
                            <span className="text-white font-bold text-xs">{card.emoji}</span>
                    </div>
                  </div>
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                          card.color === 'orange' ? 'bg-orange-500' :
                          card.color === 'blue' ? 'bg-blue-500' :
                          card.color === 'green' ? 'bg-green-500' :
                          card.color === 'purple' ? 'bg-purple-500' :
                          card.color === 'red' ? 'bg-red-500' :
                          card.color === 'cyan' ? 'bg-cyan-500' :
                          card.color === 'emerald' ? 'bg-emerald-500' :
                          'bg-gray-500'
                        }`}>
                          <span className="text-white text-xs font-bold">{card.rank}</span>
                      </div>
                  </div>
                      <h4 className={`font-bold text-sm transition-colors mb-1 ${
                        card.color === 'orange' ? 'text-white group-hover:text-orange-400' :
                        card.color === 'blue' ? 'text-white group-hover:text-blue-400' :
                        card.color === 'green' ? 'text-white group-hover:text-green-400' :
                        card.color === 'purple' ? 'text-white group-hover:text-purple-400' :
                        card.color === 'red' ? 'text-white group-hover:text-red-400' :
                        card.color === 'cyan' ? 'text-white group-hover:text-cyan-400' :
                        card.color === 'emerald' ? 'text-white group-hover:text-emerald-400' :
                        'text-white group-hover:text-gray-400'
                      }`}>
                        {card.name}
                      </h4>
                      <p className="text-gray-400 text-xs mb-2">{card.set}</p>
                      <div className={`font-bold text-lg ${
                        card.color === 'orange' ? 'text-orange-400' :
                        card.color === 'blue' ? 'text-blue-400' :
                        card.color === 'green' ? 'text-green-400' :
                        card.color === 'purple' ? 'text-purple-400' :
                        card.color === 'red' ? 'text-red-400' :
                        card.color === 'cyan' ? 'text-cyan-400' :
                        card.color === 'emerald' ? 'text-emerald-400' :
                        'text-gray-400'
                      }`}>
                        ${card.price}
                </div>
                      <div className={`flex items-center gap-1 text-xs ${
                        card.color === 'orange' ? 'text-orange-400' :
                        card.color === 'blue' ? 'text-blue-400' :
                        card.color === 'green' ? 'text-green-400' :
                        card.color === 'purple' ? 'text-purple-400' :
                        card.color === 'red' ? 'text-red-400' :
                        card.color === 'cyan' ? 'text-cyan-400' :
                        card.color === 'emerald' ? 'text-emerald-400' :
                        'text-gray-400'
                      }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="font-semibold">+{card.change.toFixed(2)}%</span>
                      </div>
                  </div>
                </div>
                ))}
                    </div>
                  </div>
                      </div>
        )}

        {/* Sliding Menu */}
        {showSlidingMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
              onClick={() => setShowSlidingMenu(false)}
            />
            
            {/* Sliding Menu */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-gray-900 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out ${
              showSlidingMenu ? 'translate-x-0' : 'translate-x-full'
            }`}>
              {/* Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-white text-xl font-bold">Menu</h2>
                <button 
                  onClick={() => setShowSlidingMenu(false)}
                  className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                </button>
              </div>
              
              {/* Menu Content */}
              <div className="p-6">
                <nav className="space-y-4">
                  {/* Profile Section */}
                  <div className="pb-4 border-b border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#6865E7] to-[#5A57D1] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">JD</span>
              </div>
                      <div>
                        <h3 className="text-white font-semibold">John Doe</h3>
                        <p className="text-gray-400 text-sm">john.doe@example.com</p>
            </div>
          </div>
                </div>

            {/* Navigation Items */}
                  <div className="space-y-2">
                <button
                  onClick={() => {
                        setActiveTab('home')
                        setNavigationMode('home')
                        setShowSlidingMenu(false)
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      <span className="text-white">Dashboard</span>
                </button>

                <button
              onClick={() => {
                        setActiveTab('collection')
                        setNavigationMode('collection')
                        setShowSlidingMenu(false)
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      <span className="text-white">My Collection</span>
                </button>

          <button 
                      onClick={() => {
                        setActiveTab('marketplace')
                        setNavigationMode('marketplace')
                        setShowSlidingMenu(false)
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                        </svg>
                      <span className="text-white">Marketplace</span>
          </button>

                <button 
                      onClick={() => {
                        setActiveTab('profile')
                        setNavigationMode('profile')
                        setShowSlidingMenu(false)
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      <span className="text-white">Profile</span>
                </button>
                </div>

                  {/* Settings Section */}
                  <div className="pt-4 border-t border-gray-700">
                    <h4 className="text-gray-400 text-sm font-medium mb-3">Settings</h4>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-left">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-white">Settings</span>
                    </button>

                      <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-left">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-white">Help & Support</span>
                  </button>

                      <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-left">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-white">Sign Out</span>
                  </button>
                      </div>
                  </div>
                </nav>
                </div>
                    </div>
          </>
        )}

        {/* Sort Modal - Test at End */}
        {showSortModal && (
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSortModal(false)
              }
            }}
          >
            <div style={{
              backgroundColor: '#2b2b2b',
              borderRadius: '12px',
              padding: '20px',
              minWidth: '300px',
              maxWidth: '400px',
              border: '1px solid #444'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Sort Cards</h2>
                <button
                  onClick={() => setShowSortModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#444',
                    border: 'none',
                    borderRadius: '50%',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
                </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { value: 'trending', label: 'Trending' },
                  { value: 'name-asc', label: 'Name A-Z' },
                  { value: 'name-desc', label: 'Name Z-A' },
                  { value: 'price-high', label: 'Price High to Low' },
                  { value: 'price-low', label: 'Price Low to High' },
                  { value: 'rarity-desc', label: 'Rarity High to Low' },
                  { value: 'rarity-asc', label: 'Rarity Low to High' },
                  { value: 'number', label: 'Card Number' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortOption(option.value)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      backgroundColor: sortOption === option.value ? '#6865E7' : '#444',
                      color: 'white',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
                    </div>
                  </div>
                      </div>
        )}




        {/* Add to Collection Modal - Search Results - Rendered at top level */}
        {showSearchResultsModal && cardToAddFromSearch && (showSearchResults || activeTab === 'cards' || activeTab === 'search') && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md mx-auto relative modal-container max-h-[90vh] flex flex-col">
              <div className="p-6 overflow-y-auto flex-1">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white text-xl font-semibold">Add to Collection</h2>
                <button 
                    onClick={() => {
                      setShowSearchResultsModal(false);
                      setCardToAddFromSearch(null);
                    }}
                    className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
              </div>
              
                {/* Card Preview */}
                {cardToAddFromSearch && (
                  <div className="mb-6 p-4 bg-gray-700 rounded-xl">
                    <div className="flex gap-4 items-center">
                      <img 
                        src={(() => {
                          const imageSrc = cardToAddFromSearch.imageUrl || cardToAddFromSearch.images?.large || cardToAddFromSearch.images?.small || cardImages[cardToAddFromSearch.id];
                          return typeof imageSrc === 'string' ? imageSrc : '';
                        })()} 
                        alt={cardToAddFromSearch.name}
                        className="w-20 h-28 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-white text-base font-bold mb-2">
                          {cardToAddFromSearch.name}
                        </h3>
                        <p className="text-gray-300 text-sm mb-1">
                          {cardToAddFromSearch.set_name || cardToAddFromSearch.set?.name || cardToAddFromSearch.set || 'Set Name'}
                        </p>
                        <p className="text-gray-400 text-xs mb-2">
                          #{cardToAddFromSearch.number ? cardToAddFromSearch.number.replace('#', '') : '001'}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-xs">Est. Value:</span>
                          <span className="text-primary text-base font-bold">
                            ${calculateDynamicPrice(cardToAddFromSearch, selectedVariant, addCardCondition, isGraded, selectedGradingService, selectedGrade).toFixed(2)}
                          </span>
                        </div>
              </div>
            </div>
          </div>
        )}

                {/* Collection Selection */}
                <div className="mb-5">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Collection
                  </label>
                  <div className="relative dropdown-container">
                <button
                      onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                      <span>{selectedCollectionForAdd ? userData?.collections.find(c => c.id === selectedCollectionForAdd)?.name : 'Select Collection'}</span>
                      <svg className={`w-4 h-4 transition-transform ${showCollectionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                </button>
                    {showCollectionDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                        <div className="py-1">
                          {userData?.collections.map(collection => (
                <button
                              key={collection.id}
                              onClick={() => {
                                setSelectedCollectionForAdd(collection.id);
                                setShowCollectionDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                            >
                              {collection.name}
                </button>
                          ))}
              </div>
                    </div>
                    )}
                  </div>
                </div>

                {/* Quantity Selection */}
                <div className="mb-5">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))}
                      className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={addQuantity <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <div className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-center">
                      <span className="text-white text-lg font-medium">{addQuantity}</span>
                      </div>
                    <button
                      onClick={() => setAddQuantity(addQuantity + 1)}
                      className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                </div>
              </div>

                {/* Variant Selection */}
                <div className="mb-5">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Variant
                  </label>
                  <div className="relative dropdown-container">
                <button 
                      onClick={() => setShowVariantDropdown(!showVariantDropdown)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <span>{selectedVariant}</span>
                      <svg className={`w-4 h-4 transition-transform ${showVariantDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                </button>
                    {showVariantDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                        <div className="py-1">
                          {['normal', 'holo', 'reverse holo', '1st edition'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => {
                                setSelectedVariant(variant);
                                setShowVariantDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                            >
                              {variant}
                            </button>
                          ))}
              </div>
              </div>
                    )}
            </div>
          </div>

                {/* Condition Selection */}
                <div className="mb-5">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Condition
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => setShowConditionDropdown(!showConditionDropdown)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <span>{addCardCondition}</span>
                      <svg className={`w-4 h-4 transition-transform ${showConditionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    </button>
                    {showConditionDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                        <div className="py-1">
                          {['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'].map(condition => (
                <button
                              key={condition}
                  onClick={() => {
                                setAddCardCondition(condition);
                                setShowConditionDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                            >
                              {condition}
                </button>
              ))}
            </div>
                </div>
              )}
          </div>
        </div>

                {/* Graded Card Toggle */}
                <div className="mb-5">
                  <label className="flex items-center gap-3 text-gray-300 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGraded}
                      onChange={(e) => setIsGraded(e.target.checked)}
                      className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2"
                    />
                    <span>This is a graded card</span>
                  </label>
      </div>

                {/* Grading Service Selection - Only show if graded */}
                {isGraded && (
                  <div className="mb-5">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Grading Service
                    </label>
                    <div className="relative dropdown-container">
            <button 
                        onClick={() => setShowGradingServiceDropdown(!showGradingServiceDropdown)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
                        <span>{selectedGradingService}</span>
                        <svg className={`w-4 h-4 transition-transform ${showGradingServiceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
            </button>
                      {showGradingServiceDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                          <div className="py-1">
                            {['PSA', 'CGC', 'TAG', 'BGS', 'ACE'].map(service => (
            <button 
                                key={service}
              onClick={() => {
                                  setSelectedGradingService(service);
                                  setShowGradingServiceDropdown(false);
              }}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
            >
                                {service}
            </button>
                            ))}
          </div>
        </div>
                      )}
      </div>
        </div>
                )}

                {/* Grade Selection - Only show if graded */}
                {isGraded && (
                  <div className="mb-5">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Grade
                    </label>
                    <div className="relative dropdown-container">
          <button 
                        onClick={() => setShowGradeDropdown(!showGradeDropdown)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
                        <span>{selectedGrade}</span>
                        <svg className={`w-4 h-4 transition-transform ${showGradeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
                      {showGradeDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          <div className="py-1">
                            {selectedGradingService === 'PSA' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(grade => (
            <button
                                key={grade}
                                onClick={() => {
                                  setSelectedGrade(grade);
                                  setShowGradeDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                              >
                                {grade}
            </button>
                            ))}
                            {selectedGradingService === 'CGC' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(grade => (
            <button
                                key={grade}
                                onClick={() => {
                                  setSelectedGrade(grade);
                                  setShowGradeDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                              >
                                {grade}
            </button>
                            ))}
                            {selectedGradingService === 'TAG' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(grade => (
                    <button 
                                key={grade}
                                onClick={() => {
                                  setSelectedGrade(grade);
                                  setShowGradeDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                              >
                                {grade}
                    </button>
                            ))}
                            {selectedGradingService === 'BGS' && ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'].map(grade => (
                    <button 
                                key={grade}
                                onClick={() => {
                                  setSelectedGrade(grade);
                                  setShowGradeDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                              >
                                {grade}
                    </button>
                            ))}
                            {selectedGradingService === 'ACE' && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(grade => (
                              <button
                                key={grade}
                                onClick={() => {
                                  setSelectedGrade(grade);
                                  setShowGradeDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                              >
                                {grade}
                </button>
                            ))}
                  </div>
                  </div>
                      )}
                </div>
                  </div>
                )}

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={addNote}
                    onChange={(e) => setAddNote(e.target.value)}
                    placeholder="Add any notes about this card..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-20"
                  />
                </div>
              </div>
              
              {/* Action Buttons - Fixed at bottom */}
              <div className="p-6 pt-4 border-t border-gray-700">
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setShowSearchResultsModal(false);
                      setCardToAddFromSearch(null);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmAddToCollection}
                    className="flex-1 bg-primary hover:bg-primary/80 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Add to Collection
                  </button>
                </div>
              </div>
                </div>
              </div>
            )}

      {/* Collection Added Notification - Global */}
      {showCollectionNotification && (
        <div className="fixed bottom-24 left-0 right-0 z-[100] animate-slide-up-notification">
          <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-xl px-4 py-3 shadow-2xl mx-auto w-fit">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white text-sm font-medium">{collectionNotificationMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 filter-modal">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-white text-xl font-bold">Filter Collection</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-6 space-y-6">
              {/* Card Status */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Card Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'All Cards' },
                    { value: 'duplicates', label: 'Duplicates' },
                    { value: 'wishlisted', label: 'Wishlisted' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setFilterSettings(prev => ({ ...prev, cardStatus: status.value }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterSettings.cardStatus === status.value
                          ? 'bg-[#605DEC] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Languages</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'english', label: 'English' },
                    { value: 'japanese', label: 'Japanese' },
                    { value: 'chinese', label: 'Chinese' },
                    { value: 'korean', label: 'Korean' },
                    { value: 'german', label: 'German' },
                    { value: 'spanish', label: 'Spanish' },
                    { value: 'french', label: 'French' },
                    { value: 'italian', label: 'Italian' }
                  ].map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        setFilterSettings(prev => ({
                          ...prev,
                          languages: prev.languages.includes(lang.value)
                            ? prev.languages.filter(l => l !== lang.value)
                            : [...prev.languages, lang.value]
                        }))
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterSettings.languages.includes(lang.value)
                          ? 'bg-[#605DEC] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Products</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cards', label: 'Cards' },
                    { value: 'sealed', label: 'Sealed' }
                  ].map((product) => (
                    <button
                      key={product.value}
                      onClick={() => {
                        setFilterSettings(prev => ({
                          ...prev,
                          products: prev.products.includes(product.value)
                            ? prev.products.filter(p => p !== product.value)
                            : [...prev.products, product.value]
                        }))
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterSettings.products.includes(product.value)
                          ? 'bg-[#605DEC] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {product.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energies */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Energies</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'colorless', label: 'Colorless' },
                    { value: 'darkness', label: 'Darkness' },
                    { value: 'dragon', label: 'Dragon' },
                    { value: 'electric', label: 'Electric' },
                    { value: 'fairy', label: 'Fairy' },
                    { value: 'fighting', label: 'Fighting' },
                    { value: 'fire', label: 'Fire' },
                    { value: 'grass', label: 'Grass' },
                    { value: 'metal', label: 'Metal' },
                    { value: 'psychic', label: 'Psychic' },
                    { value: 'water', label: 'Water' }
                  ].map((energy) => (
                    <button
                      key={energy.value}
                      onClick={() => {
                        setFilterSettings(prev => ({
                          ...prev,
                          energies: prev.energies.includes(energy.value)
                            ? prev.energies.filter(e => e !== energy.value)
                            : [...prev.energies, energy.value]
                        }))
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterSettings.energies.includes(energy.value)
                          ? 'bg-[#605DEC] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {energy.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supertype */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Supertype</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'pokemon', label: 'Pokemon' },
                    { value: 'trainer', label: 'Trainer' },
                    { value: 'energy', label: 'Energy' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setFilterSettings(prev => ({
                          ...prev,
                          supertype: prev.supertype.includes(type.value)
                            ? prev.supertype.filter(t => t !== type.value)
                            : [...prev.supertype, type.value]
                        }))
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterSettings.supertype.includes(type.value)
                          ? 'bg-[#605DEC] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rarities */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Rarities</h3>
                
                {/* Rarity Type Toggle */}
                <div className="flex bg-gray-700 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => setFilterSettings(prev => ({ ...prev, rarityType: 'international' }))}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      filterSettings.rarityType === 'international'
                        ? 'bg-[#605DEC] text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    International
                  </button>
                  <button
                    onClick={() => setFilterSettings(prev => ({ ...prev, rarityType: 'japanese' }))}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      filterSettings.rarityType === 'japanese'
                        ? 'bg-[#605DEC] text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Japanese
                  </button>
                </div>

                {/* Rarity Options */}
                <div className="grid grid-cols-2 gap-2">
                  {(filterSettings.rarityType === 'international' ? [
                    { value: 'common', label: 'Common' },
                    { value: 'uncommon', label: 'Uncommon' },
                    { value: 'rare', label: 'Rare' },
                    { value: 'double_rare', label: 'Double Rare' },
                    { value: 'ace_spec_rare', label: 'ACE Spec Rare' },
                    { value: 'illustration_rare', label: 'Illustration Rare' },
                    { value: 'ultra_rare', label: 'Ultra Rare' },
                    { value: 'special_illustration_rare', label: 'Special Illustration Rare' },
                    { value: 'hyper_rare', label: 'Hyper Rare' },
                    { value: 'shiny_rare', label: 'Shiny Rare' },
                    { value: 'shiny_ultra_rare', label: 'Shiny Ultra Rare' },
                    { value: 'black_star_promo', label: 'Black Star Promo' }
                  ] : [
                    { value: 'common', label: 'Common' },
                    { value: 'uncommon', label: 'Uncommon' },
                    { value: 'rare', label: 'Rare' },
                    { value: 'double_rare', label: 'Double Rare' },
                    { value: 'ace_spec_rare', label: 'Ace Spec Rare' },
                    { value: 'art_rare', label: 'Art Rare' },
                    { value: 'super_rare', label: 'Super Rare' },
                    { value: 'special_art_rare', label: 'Special Art Rare' },
                    { value: 'ultra_rare', label: 'Ultra Rare' },
                    { value: 'shiny_rare', label: 'Shiny Rare' },
                    { value: 'shiny_super_rare', label: 'Shiny Super Rare' },
                    { value: 'black_star_promo', label: 'Black Star Promo' }
                  ]).map((rarity) => (
                    <button
                      key={rarity.value}
                      onClick={() => {
                        setFilterSettings(prev => ({
                          ...prev,
                          rarities: prev.rarities.includes(rarity.value)
                            ? prev.rarities.filter(r => r !== rarity.value)
                            : [...prev.rarities, rarity.value]
                        }))
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterSettings.rarities.includes(rarity.value)
                          ? 'bg-[#605DEC] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {rarity.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Variants</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'normal', label: 'Normal' },
                    { value: 'holos', label: 'Holos' },
                    { value: 'reverse_holos', label: 'Reverse Holos' },
                    { value: 'first_editions', label: '1st Editions' }
                  ].map((variant) => (
                    <button
                      key={variant.value}
                      onClick={() => {
                        setFilterSettings(prev => ({
                          ...prev,
                          variants: prev.variants.includes(variant.value)
                            ? prev.variants.filter(v => v !== variant.value)
                            : [...prev.variants, variant.value]
                        }))
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterSettings.variants.includes(variant.value)
                          ? 'bg-[#605DEC] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {variant.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formats */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Formats</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'unlimited', label: 'Unlimited' },
                    { value: 'expanded', label: 'Expanded' },
                    { value: 'standard', label: 'Standard' }
                  ].map((format) => (
                    <button
                      key={format.value}
                      onClick={() => {
                        setFilterSettings(prev => ({
                          ...prev,
                          formats: prev.formats.includes(format.value)
                            ? prev.formats.filter(f => f !== format.value)
                            : [...prev.formats, format.value]
                        }))
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterSettings.formats.includes(format.value)
                          ? 'bg-[#605DEC] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regulation Markings */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Regulation Markings</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((marking) => (
                    <button
                      key={marking}
                      onClick={() => {
                        setFilterSettings(prev => ({
                          ...prev,
                          regulationMarkings: prev.regulationMarkings.includes(marking)
                            ? prev.regulationMarkings.filter(m => m !== marking)
                            : [...prev.regulationMarkings, marking]
                        }))
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterSettings.regulationMarkings.includes(marking)
                          ? 'bg-[#605DEC] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {marking}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Conditions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'near_mint', label: 'Near Mint' },
                    { value: 'lightly_played', label: 'Lightly Played' },
                    { value: 'moderately_played', label: 'Moderately Played' },
                    { value: 'heavily_played', label: 'Heavily Played' },
                    { value: 'damaged', label: 'Damaged' }
                  ].map((condition) => (
                    <button
                      key={condition.value}
                      onClick={() => {
                        setFilterSettings(prev => ({
                          ...prev,
                          conditions: prev.conditions.includes(condition.value)
                            ? prev.conditions.filter(c => c !== condition.value)
                            : [...prev.conditions, condition.value]
                        }))
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterSettings.conditions.includes(condition.value)
                          ? 'bg-[#605DEC] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {condition.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setFilterSettings({
                    cardStatus: 'all',
                    languages: [],
                    products: [],
                    energies: [],
                    supertype: [],
                    rarityType: 'international',
                    rarities: [],
                    variants: [],
                    formats: [],
                    regulationMarkings: [],
                    conditions: []
                  })
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-6 py-2 bg-[#605DEC] hover:bg-[#4F46E5] text-white rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      </div>
    </div>
  )
  }

  // Default return for main dashboard
  return (
    <div 
      className="min-h-screen bg-background text-accent transition-all duration-300 ease-in-out"
      style={{ 
        height: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Card Collector</h1>
          <div className="flex items-center gap-4">
            <button className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 1 1 15 0v5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-4">
        <p className="text-white text-center py-8">Welcome to Card Collector!</p>
      </div>
    </div>
  )
}

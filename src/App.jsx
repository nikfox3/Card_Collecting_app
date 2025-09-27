import React, { useState, useEffect, useRef, useMemo } from 'react'
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
  const [selectedCollection, setSelectedCollection] = useState('pokemon-collection')
  const [selectedTimeRange, setSelectedTimeRange] = useState('6M')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false)
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false)
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [showCollectionsModal, setShowCollectionsModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showTopMoversModal, setShowTopMoversModal] = useState(false)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const [showSlidingMenu, setShowSlidingMenu] = useState(false)

  // Mock recent activity data
  const recentActivityData = [
    { id: 1, cardName: "Charizard ex", action: "Added", type: "add", time: "2 min ago" },
    { id: 2, cardName: "Pikachu VMAX", action: "Removed", type: "remove", time: "15 min ago" },
    { id: 3, cardName: "Blastoise ex", action: "Added", type: "add", time: "1 hour ago" },
    { id: 4, cardName: "Venusaur ex", action: "Added", type: "add", time: "2 hours ago" },
    { id: 5, cardName: "Mewtwo V", action: "Removed", type: "remove", time: "3 hours ago" },
    { id: 6, cardName: "Lugia V", action: "Added", type: "add", time: "4 hours ago" },
    { id: 7, cardName: "Ho-Oh V", action: "Added", type: "add", time: "5 hours ago" },
    { id: 8, cardName: "Rayquaza VMAX", action: "Removed", type: "remove", time: "6 hours ago" }
  ]

  const displayedActivity = recentActivityData.slice(0, 3)

  // Mock top movers data with real Pokemon card IDs
  const topMoversData = [
    { id: 1, name: "Charizard ex", set: "Base Set", rarity: "Ultra Rare", number: "#004/102", price: 1250, change: 24.5, dailyChange: 245, quantity: 2, rank: 1, type: "gain", emoji: "🔥", cardId: "base1-4", imageUrl: "https://images.pokemontcg.io/base1/4_hires.png", artist: "Mitsuhiro Arita" },
    { id: 2, name: "Blastoise ex", set: "Base Set", rarity: "Ultra Rare", number: "#009/102", price: 890, change: 18.2, dailyChange: 137, quantity: 1, rank: 2, type: "gain", emoji: "⚡", cardId: "base1-2", imageUrl: "https://images.pokemontcg.io/base1/2_hires.png", artist: "Atsuko Nishida" },
    { id: 3, name: "Venusaur ex", set: "Base Set", rarity: "Ultra Rare", number: "#015/102", price: 650, change: -12.8, dailyChange: -95, quantity: 3, rank: 3, type: "loss", emoji: "🌿", cardId: "base1-15", imageUrl: "https://images.pokemontcg.io/base1/15_hires.png", artist: "Atsuko Nishida" },
    { id: 4, name: "Pikachu VMAX", set: "Vivid Voltage", rarity: "VMAX", number: "#044/185", price: 89, change: 15.2, dailyChange: 12, quantity: 1, rank: 4, type: "gain", emoji: "⚡", cardId: "swsh4-44", imageUrl: "https://images.pokemontcg.io/swsh4/44_hires.png", artist: "Atsuko Nishida" },
    { id: 5, name: "Lugia V", set: "Silver Tempest", rarity: "Ultra Rare", number: "#186/195", price: 156, change: 22.8, dailyChange: 29, quantity: 2, rank: 5, type: "gain", emoji: "🌊", cardId: "swsh12-186", imageUrl: "https://images.pokemontcg.io/swsh12/186_hires.png", artist: "Hitoshi Ariga" },
    { id: 6, name: "Rayquaza VMAX", set: "Evolving Skies", rarity: "VMAX", number: "#217/203", price: 234, change: 8.4, dailyChange: 18, quantity: 1, rank: 6, type: "gain", emoji: "🌿", cardId: "swsh7-217", imageUrl: "https://images.pokemontcg.io/swsh7/217_hires.png", artist: "Ryuta Fuse" },
    { id: 7, name: "Mewtwo V", set: "Pokemon GO", rarity: "Ultra Rare", number: "#030/071", price: 67, change: 12.1, dailyChange: 7, quantity: 3, rank: 7, type: "gain", emoji: "✨", cardId: "pgo-30", imageUrl: "https://images.pokemontcg.io/pgo/30_hires.png", artist: "Mitsuhiro Arita" },
    { id: 8, name: "Gengar VMAX", set: "Fusion Strike", rarity: "VMAX", number: "#271/264", price: 45, change: -8.3, dailyChange: -4, quantity: 2, rank: 8, type: "loss", emoji: "👻", cardId: "swsh9-271", imageUrl: "https://images.pokemontcg.io/swsh9/271_hires.png", artist: "Ryuta Fuse" }
  ]

  // Mock trending cards data with real Pokemon card IDs
  const trendingCardsData = [
    { id: 1, name: "Pikachu VMAX", set: "Vivid Voltage", rarity: "VMAX", number: "#044/185", price: 89, change: 15.2, rank: 1, emoji: "🔥", color: "orange", cardId: "swsh4-44", imageUrl: "https://images.pokemontcg.io/swsh4/44_hires.png", artist: "Atsuko Nishida" },
    { id: 2, name: "Lugia V", set: "Silver Tempest", rarity: "Ultra Rare", number: "#186/195", price: 156, change: 22.8, rank: 2, emoji: "⚡", color: "blue", cardId: "swsh12-186", imageUrl: "https://images.pokemontcg.io/swsh12/186_hires.png", artist: "Hitoshi Ariga" },
    { id: 3, name: "Rayquaza VMAX", set: "Evolving Skies", rarity: "VMAX", number: "#217/203", price: 234, change: 8.4, rank: 3, emoji: "🌿", color: "green", cardId: "swsh7-217", imageUrl: "https://images.pokemontcg.io/swsh7/217_hires.png", artist: "Ryuta Fuse" },
    { id: 4, name: "Mewtwo V", set: "Pokemon GO", rarity: "Ultra Rare", number: "#030/071", price: 67, change: 12.1, rank: 4, emoji: "✨", color: "purple", cardId: "pgo-30", imageUrl: "https://images.pokemontcg.io/pgo/30_hires.png", artist: "Mitsuhiro Arita" },
    { id: 5, name: "Charizard VMAX", set: "Darkness Ablaze", rarity: "VMAX", number: "#020/189", price: 198, change: 19.7, rank: 5, emoji: "🔥", color: "red", cardId: "swsh3-20", imageUrl: "https://images.pokemontcg.io/swsh3/20_hires.png", artist: "Mitsuhiro Arita" },
    { id: 6, name: "Blastoise VMAX", set: "Chilling Reign", rarity: "VMAX", number: "#018/198", price: 134, change: 14.3, rank: 6, emoji: "🌊", color: "cyan", cardId: "swsh6-18", imageUrl: "https://images.pokemontcg.io/swsh6/18_hires.png", artist: "Atsuko Nishida" },
    { id: 7, name: "Venusaur VMAX", set: "Battle Styles", rarity: "VMAX", number: "#015/163", price: 112, change: 11.8, rank: 7, emoji: "🌿", color: "emerald", cardId: "swsh5-15", imageUrl: "https://images.pokemontcg.io/swsh5/15_hires.png", artist: "Atsuko Nishida" },
    { id: 8, name: "Gengar VMAX", set: "Fusion Strike", rarity: "VMAX", number: "#271/264", price: 45, change: 9.2, rank: 8, emoji: "👻", color: "purple", cardId: "swsh9-271", imageUrl: "https://images.pokemontcg.io/swsh9/271_hires.png", artist: "Ryuta Fuse" }
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
  const [showQuickFiltersModal, setShowQuickFiltersModal] = useState(false)
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

  // Chart.js options
  const cardChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // We'll use custom legend
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('Collection')
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
          total: 62
        },
        number: "15",
        rarity: "Rare Holo",
        images: {
          small: "https://images.pokemontcg.io/fossil/15.png",
          large: "https://images.pokemontcg.io/fossil/15_hires.png"
        },
        tcgplayer: {
          prices: {
            holofoil: { market: 35.0 }
          }
        },
        currentValue: 35.0,
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
        name: `${baseCard.name} (${i + 1})`,
        currentValue: baseCard.currentValue + (Math.random() - 0.5) * 50,
        changePercent: (Math.random() - 0.5) * 100
      }
      moreCards.push(newCard)
    }
    
    return moreCards
  }
  
  // Combine original trending cards with generated ones
  const allTrendingCards = useMemo(() => {
    return [...mockUserData.trendingCards, ...generateMoreTrendingCards()]
  }, [])
  
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
      
      // Add to collections array
      mockUserData.collections.push(newCollection)
      
      // Add empty portfolio history for the new collection
      mockUserData.collectionPortfolioHistory[newCollection.id] = {
        '1D': [{ date: new Date().toISOString(), value: 0 }],
        '7D': [{ date: new Date().toISOString(), value: 0 }],
        '1M': [{ date: new Date().toISOString(), value: 0 }],
        '3M': [{ date: new Date().toISOString(), value: 0 }],
        '6M': [{ date: new Date().toISOString(), value: 0 }],
        '1Y': [{ date: new Date().toISOString(), value: 0 }],
        'MAX': [{ date: new Date().toISOString(), value: 0 }]
      }
      
      // Select the new collection
      setSelectedCollection(newCollection.id)
      setNewCollectionName('')
      setShowCreateCollectionModal(false)
      setShowCollectionDropdown(false)
    }
  }

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

  // Search functions using database API
  const handleSearch = async () => {
    try {
      setLoading(true);
        
        // Skip API call and use mock data directly
        
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

        // Use mock data directly
        const filtered = mockUserData.searchResults.filter(card => 
          !searchQuery.trim() || 
          card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.set?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        
        setOriginalSearchResults(filtered);
        setFilteredSearchResults(filtered);
        setShowSearchResults(true);
        loadSearchResultImages(filtered);
        
      } finally {
        setLoading(false);
      }
  }

  // Load images for search results - now using database API structure
  const loadSearchResultImages = async (searchCards = mockUserData.searchResults) => {

    const imageMap = {}
    searchCards.forEach((card) => {
      // Parse the images JSON string from database
      let images = {};
      try {
        images = typeof card.images === 'string' ? JSON.parse(card.images) : card.images;
      } catch (e) {
      }

      if (images?.small) {
        imageMap[card.id] = images.small
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
    console.log('Sort option selected:', option)
    console.log('Current filteredSearchResults:', filteredSearchResults)
    
    setSortOption(option)
    const sortedCards = sortCards(filteredSearchResults, option)
    console.log('Sorted cards:', sortedCards)
    
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
    // Scroll to search section after a brief delay to ensure tab content is rendered
    setTimeout(() => {
      const searchSection = document.querySelector('[data-search-section]')
      if (searchSection) {
        searchSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }, 100)
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

  // Make test function available globally for debugging
  window.testImageLoading = testImageLoading

  // Pokémon TCG API integration
  const fetchCardImage = async (cardName, setName) => {
    try {
      // First try searching by name only
      let searchQuery = `name:"${cardName}"`
      console.log('Searching for:', searchQuery)
      let response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchQuery)}&pageSize=1`)
      let data = await response.json()
      console.log('API Response (name only):', data)
      
      // If no results, try with set name
      if (!data.data || data.data.length === 0) {
        searchQuery = `name:"${cardName}" set.name:"${setName}"`
        console.log('Trying with set name:', searchQuery)
        response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchQuery)}&pageSize=1`)
        data = await response.json()
        console.log('API Response (with set):', data)
      }
      
      if (data.data && data.data.length > 0) {
        console.log('Found card:', data.data[0].name, 'Image URL:', data.data[0].images.small)
        return data.data[0].images.small // Use small image for better performance
      }
      console.log('No card found for:', cardName, setName)
      return null
    } catch (error) {
      console.error('Error fetching card image:', error)
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
  }

  // Add event listener for clicking outside
  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCountryDropdown, showCurrencyDropdown])

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
      
      // Update mock user data to include the new card
      const targetCollection = mockUserData.collections.find(c => c.id === 1)
      if (!targetCollection) {
        console.error('Collection not found')
        // Still show confirmation even if collection update fails
        setScannedCard(newCard)
      } else {
        if (!targetCollection.cards) {
          targetCollection.cards = []
        }
        targetCollection.cards.push(newCard)
        
        // Update collection stats
        targetCollection.totalCards = (targetCollection.totalCards || 0) + 1
        targetCollection.totalValue = (targetCollection.totalValue || 0) + newCard.price
        
        // Add to recent activity
        recentActivityData.unshift({
          id: Date.now(),
          cardName: newCard.name,
          action: "Added",
          type: "add",
          time: "Just now"
        })
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
  const handleCardClick = (card) => {
    setSelectedCard(card)
    setShowCardProfile(true)
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
        ...mockUserData.searchResults,
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
      
      // Scroll to search section
      setTimeout(() => {
        const searchSection = document.querySelector('[data-section="search"]');
        if (searchSection) {
          searchSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
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
    const currentCollection = mockUserData.collections.find(c => c.id === selectedCollection) || mockUserData.collections[0]
    const history = mockUserData.collectionPortfolioHistory?.[selectedCollection]?.[selectedTimeRange] || []
    
    
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
  }, [selectedTimeRange, selectedCurrency, selectedCollection])

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

        {/* Sort Modal */}
        {showSortModal && (
          <div 
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" 
            style={{ zIndex: 9999 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSortModal(false)
              }
            }}
          >
            {console.log('Sort modal is rendering')}
            <div className="bg-[#2b2b2b] rounded-2xl w-full max-w-sm border border-gray-700/50 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <h2 className="text-white text-lg font-bold">Sort Cards</h2>
                <button
                  onClick={() => setShowSortModal(false)}
                  className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sort Options */}
              <div className="p-4">
                <div className="space-y-2">
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
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        sortOption === option.value
                          ? 'bg-[#6865E7] text-white'
                          : 'bg-gray-700 text-white/70 hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
                      src={selectedCard.imageUrl || selectedCard.images?.large || selectedCard.images?.small || cardImages[selectedCard.id]}
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
                      <div className="flex flex-col">
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
                <div className="bg-gray-800 rounded-2xl p-6 mb-6 -mt-12 relative z-10">


                  {/* Action Icons */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <button className="w-6 h-6 text-white">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button className="w-6 h-6 text-white">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-white text-sm">Qty: {selectedCard.quantity || 1}</span>
                    <button className="w-6 h-6 text-white">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white">Avg. market value</span>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                          <span className="text-white text-lg font-bold">
                            ${(() => {
                              // Handle different pricing structures
                              if (selectedCard.current_value) return selectedCard.current_value;
                              if (selectedCard.price) return selectedCard.price;
                              if (selectedCard.tcgplayer?.prices?.holofoil?.market) return selectedCard.tcgplayer.prices.holofoil.market;
                              if (selectedCard.tcgplayer?.prices?.normal?.market) return selectedCard.tcgplayer.prices.normal.market;
                              if (selectedCard.tcgplayer?.prices?.reverseHolofoil?.market) return selectedCard.tcgplayer.prices.reverseHolofoil.market;
                              if (selectedCard.tcgplayer?.prices?.firstEditionHolofoil?.market) return selectedCard.tcgplayer.prices.firstEditionHolofoil.market;
                              return 0;
                            })()}
                          </span>
                        </div>
                        <div className={`text-sm ${(selectedCard.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedCard.dailyChange ? `$${Math.abs(selectedCard.dailyChange)}` : '+$2.36'} ({selectedCard.change ? `${selectedCard.change > 0 ? '+' : ''}${selectedCard.change}%` : '+23.6%'})
                        </div>
                        <div className="text-gray-400 text-xs">
                          past 7 days
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add to Collection Button */}
                <div className="mb-6">
                  <button className="w-full bg-[#605DEC] text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-[#605DEC]/80 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add To Collection
                  </button>
                </div>

                {/* Market Value Chart Section */}
                <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <h3 className="text-white font-medium">Market Value</h3>
                    </div>
                    <button className="w-6 h-6 text-white">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Price and Filters */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-white text-xl font-bold">
                        ${(() => {
                          // Handle different pricing structures
                          if (selectedCard.current_value) return selectedCard.current_value;
                          if (selectedCard.price) return selectedCard.price;
                          if (selectedCard.tcgplayer?.prices?.holofoil?.market) return selectedCard.tcgplayer.prices.holofoil.market;
                          if (selectedCard.tcgplayer?.prices?.normal?.market) return selectedCard.tcgplayer.prices.normal.market;
                          if (selectedCard.tcgplayer?.prices?.reverseHolofoil?.market) return selectedCard.tcgplayer.prices.reverseHolofoil.market;
                          if (selectedCard.tcgplayer?.prices?.firstEditionHolofoil?.market) return selectedCard.tcgplayer.prices.firstEditionHolofoil.market;
                          return 0;
                        })()}
                      </span>
                      <div className="flex items-center gap-1 text-green-400 text-sm">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span>1.23</span>
                        <span>this weeks</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-gray-700 text-white text-sm rounded flex items-center gap-1">
                        Reverse Holo
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button className="px-3 py-1 bg-gray-700 text-white text-sm rounded flex items-center gap-1">
                        Raw
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="h-48 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-400">Price Chart</span>
                  </div>

                  {/* Time Range Buttons */}
                  <div className="flex gap-2 mb-4">
                    {['1D', '7D', '1M', '3M', '6M', '1Y', 'Max'].map((period, index) => (
                      <button 
                        key={period}
                        className={`px-3 py-1 text-sm rounded ${
                          period === '6M' 
                            ? 'bg-[#605DEC] text-white' 
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>

                  {/* Ungraded Values */}
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-white text-sm mb-3">Ungraded Values</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: 'NM', price: '$12.34' },
                        { label: 'LP', price: '$10.23' },
                        { label: 'MP', price: '$9.23' },
                        { label: 'HP', price: '$8.23' },
                        { label: 'DM', price: '$7.23' }
                      ].map((item) => (
                        <div key={item.label} className="bg-gray-700 rounded p-2 text-center">
                          <div className="text-white text-xs mb-1">{item.label}</div>
                          <div className="text-white text-xs font-medium">{item.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Info Section */}
                <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-white font-medium">Card info</h3>
                  </div>

                  {/* Ability Section */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-400 text-sm font-medium">Ability</span>
                      <span className="text-white text-sm">Stimulated Evolution</span>
                    </div>
                    <p className="text-white text-sm">
                      If you have Shelmet in play, this Pokémon can evolve during your first turn or the turn you play it.
                    </p>
                  </div>

                  <div className="border-t border-gray-700 pt-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-gray-600 rounded"></div>
                      <span className="text-white text-sm">Attack</span>
                      <span className="text-white text-sm ml-auto">10</span>
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
                      <div className="text-white text-sm">60</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-white text-xs mb-2">Energy</div>
                      <div className="w-5 h-5 bg-gray-600 rounded mx-auto"></div>
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
                        setActiveTab('home')
                        setShowCardProfile(false)
                        setShowSearchResults(false)
                        // Trigger indicator animation after navigation is complete
                        setTimeout(() => {
                          console.log('Triggering indicator animation');
                          setIndicatorAnimation('exit');
                          setTimeout(() => {
                            setIndicatorAnimation('enter');
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
                        setActiveTab('cards')
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
                        setActiveTab('scan')
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
                        setActiveTab('profile')
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
        className="min-h-screen bg-background text-accent pb-20"
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

          {/* Search Bar Component */}
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
          />
          </div>


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
                        {mockUserData.collections.find(c => c.id === selectedCollection)?.name || 'Select Collection'}
                      </h3>
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
                    {/* Collection Dropdown */}
                    {showCollectionDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-48">
                        {mockUserData.collections.map((collection) => (
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
                  {formatCurrency(mockUserData.collections.find(c => c.id === selectedCollection)?.totalValue || 0)}
                </div>

                {/* Price Change */}
                <div className={`flex items-center gap-1 text-sm mb-1 ${
                  (mockUserData.collections.find(c => c.id === selectedCollection)?.monthlyChange || 0) >= 0 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={
                        (mockUserData.collections.find(c => c.id === selectedCollection)?.monthlyChange || 0) >= 0
                          ? "M7 11l5-5m0 0l5 5m-5-5v12"
                          : "M17 13l-5 5m0 0l-5-5m5 5V6"
                      }></path>
                </svg>
                    <span>{formatCurrency(Math.abs(mockUserData.collections.find(c => c.id === selectedCollection)?.monthlyChange || 0))}</span>
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
                    <div className="text-white text-xl font-bold">8,456</div>
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      <span>150</span>
                      <span>this month</span>
                      </div>
          </div>

                  {/* Portfolio Items */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-white text-xs">My Portfolio</span>
                      <div className="flex items-center gap-1 text-green-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>175</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-white text-xs">Trade Binder</span>
                      <div className="flex items-center gap-1 text-red-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12L18 12" />
                  </svg>
                        <span>25</span>
                </div>
              </div>

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
                    {displayedActivity.map((activity) => (
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
                ))}
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
                  <div className="text-xs text-gray-400">Last 24h</div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Top Gainer */}
                  <div 
                    onClick={() => handleCardClick(topMoversData[0])}
                    className="relative bg-gradient-to-r from-green-500/10 to-transparent rounded-xl p-4 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-20 rounded-lg shadow-lg overflow-hidden bg-gray-800">
                          <img 
                            src={topMoversData[0].imageUrl} 
                            alt={topMoversData[0].name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center" style={{display: 'none'}}>
                            <span className="text-white font-bold text-xs">#1</span>
                      </div>
                  </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      </div>
                  </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm group-hover:text-green-400 transition-colors">Charizard ex</h4>
                        <p className="text-gray-400 text-xs">Base Set • Ultra Rare</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white text-xs font-medium">#004/102</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-400 text-xs">Qty: 2</span>
                </div>
                    </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-lg">$1,250</div>
                        <div className="flex items-center gap-1 text-green-400 text-sm">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                          <span className="font-semibold">+24.5%</span>
                      </div>
                        <div className="text-gray-400 text-xs">+$245 today</div>
                  </div>
                </div>
              </div>
              
                  {/* Second Gainer */}
                  <div 
                    onClick={() => handleCardClick(topMoversData[1])}
                    className="relative bg-gradient-to-r from-blue-500/10 to-transparent rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-20 rounded-lg shadow-lg overflow-hidden bg-gray-800">
                          <img 
                            src={topMoversData[1].imageUrl} 
                            alt={topMoversData[1].name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center" style={{display: 'none'}}>
                            <span className="text-white font-bold text-xs">#2</span>
              </div>
                    </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      </div>
                  </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors">Blastoise ex</h4>
                        <p className="text-gray-400 text-xs">Base Set • Ultra Rare</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white text-xs font-medium">#009/102</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-400 text-xs">Qty: 1</span>
                </div>
                    </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-lg">$890</div>
                        <div className="flex items-center gap-1 text-green-400 text-sm">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                          <span className="font-semibold">+18.2%</span>
                      </div>
                        <div className="text-gray-400 text-xs">+$137 today</div>
                  </div>
                </div>
                    </div>

                  {/* Top Loser */}
                  <div 
                    onClick={() => handleCardClick(topMoversData[2])}
                    className="relative bg-gradient-to-r from-red-500/10 to-transparent rounded-xl p-4 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-20 rounded-lg shadow-lg overflow-hidden bg-gray-800">
                          <img 
                            src={topMoversData[2].imageUrl} 
                            alt={topMoversData[2].name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center" style={{display: 'none'}}>
                            <span className="text-white font-bold text-xs">#3</span>
                      </div>
                  </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                      </div>
                  </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm group-hover:text-red-400 transition-colors">Venusaur ex</h4>
                        <p className="text-gray-400 text-xs">Base Set • Ultra Rare</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white text-xs font-medium">#015/102</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-400 text-xs">Qty: 3</span>
                </div>
                    </div>
                      <div className="text-right">
                        <div className="text-red-400 font-bold text-lg">$650</div>
                        <div className="flex items-center gap-1 text-red-400 text-sm">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                          <span className="font-semibold">-12.8%</span>
                      </div>
                        <div className="text-gray-400 text-xs">-$95 today</div>
                  </div>
                </div>
                    </div>
                  </div>

                <button 
                  onClick={() => setShowTopMoversModal(true)}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-[#6865E7] to-[#5A57D1] hover:from-[#5A57D1] hover:to-[#4C49BB] rounded-xl text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#6865E7]/25"
                >
                  <span>View All Movers</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                </button>
                  </div>
                </div>

            {/* Trending Cards */}
            <div className="px-4 mb-6">
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
                      <h4 className="text-white font-bold text-sm group-hover:text-orange-400 transition-colors mb-1">Pikachu VMAX</h4>
                      <p className="text-gray-400 text-xs mb-2">Vivid Voltage</p>
                      <div className="text-orange-400 font-bold text-lg">$89</div>
                      <div className="flex items-center gap-1 text-orange-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="font-semibold">+15.2%</span>
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
                      <h4 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors mb-1">Lugia V</h4>
                      <p className="text-gray-400 text-xs mb-2">Silver Tempest</p>
                      <div className="text-blue-400 font-bold text-lg">$156</div>
                      <div className="flex items-center gap-1 text-blue-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="font-semibold">+22.8%</span>
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
                      <h4 className="text-white font-bold text-sm group-hover:text-green-400 transition-colors mb-1">Rayquaza VMAX</h4>
                      <p className="text-gray-400 text-xs mb-2">Evolving Skies</p>
                      <div className="text-green-400 font-bold text-lg">$234</div>
                      <div className="flex items-center gap-1 text-green-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="font-semibold">+8.4%</span>
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
                      <h4 className="text-white font-bold text-sm group-hover:text-purple-400 transition-colors mb-1">Mewtwo V</h4>
                      <p className="text-gray-400 text-xs mb-2">Pokemon GO</p>
                      <div className="text-purple-400 font-bold text-lg">$67</div>
                      <div className="flex items-center gap-1 text-purple-400 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="font-semibold">+12.1%</span>
                      </div>
                  </div>
                </div>
              </div>
              
                <button 
                  onClick={() => setShowTrendingModal(true)}
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
            className="px-4 mb-6"
            onScroll={handleScroll}
            style={{ 
              height: 'calc(100vh - 200px)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Search Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-semibold">
                {showSearchResults ? `Search Results (${filteredSearchResults.length})` : 'Popular Cards Today'}
              </h2>
              {showSearchResults && (
                <button
                  onClick={() => {
                    console.log('Sort button clicked, opening modal')
                    setShowSortModal(true)
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                  Sort
                </button>
                    )}
              </div>
              
            {/* Search Results */}
            {showSearchResults && (
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4">
                  {filteredSearchResults.map((card, index) => (
                    <div
                      key={`search-${card.id}-${index}`}
                      className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors"
                    >
                      <div 
                        className="aspect-[3/4] bg-gray-700 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden cursor-pointer"
                        onClick={() => {
                          setSelectedCard(card);
                          setShowCardProfile(true);
                        }}
                      >
                        {(card.images?.small || card.imageUrl) ? (
                          <img 
                            src={card.images?.small || card.imageUrl} 
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center" style={{ display: (card.images?.small || card.imageUrl) ? 'none' : 'flex' }}>
                          <span className="text-gray-400 text-sm">Card Image</span>
                      </div>
                  </div>
                      <h3 className="text-white font-medium text-sm mb-1">{card.name}</h3>
                      <p className="text-gray-400 text-xs mb-2">{card.set?.name || card.set || 'Unknown Set'}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-primary font-bold text-sm">${(() => {
                          if (card.currentValue) return card.currentValue.toFixed(2);
                          if (card.price) return card.price.toFixed(2);
                          if (card.tcgplayer?.prices?.holofoil?.market) return card.tcgplayer.prices.holofoil.market.toFixed(2);
                          if (card.tcgplayer?.prices?.normal?.market) return card.tcgplayer.prices.normal.market.toFixed(2);
                          return 'N/A';
                        })()}</p>
                <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Adding card to collection:', card.name);
                          }}
                          className="bg-primary text-accent px-3 py-1 rounded-lg text-xs font-medium hover:bg-primary/80 transition-colors"
                        >
                          Add
                </button>
              </div>
              </div>
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
              <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                <h3 className="text-white font-medium">Trending Now</h3>
                <span className="text-gray-400 text-sm ml-2">({visibleCardsCount} of {allTrendingCards.length})</span>
                      </div>
              <div className="grid grid-cols-2 gap-4">
                {allTrendingCards.slice(0, visibleCardsCount).map((card, index) => (
                  <div
                    key={`trending-${card.id}`}
                    className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div 
                      className="aspect-[3/4] bg-gray-700 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden cursor-pointer"
                      onClick={() => {
                        setSelectedCard(card);
                        setShowCardProfile(true);
                      }}
                    >
                        {(card.images?.small || card.imageUrl) ? (
                          <img 
                            src={card.images?.small || card.imageUrl} 
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center" style={{ display: (card.images?.small || card.imageUrl) ? 'none' : 'flex' }}>
                          <span className="text-gray-400 text-sm">Card Image</span>
                      </div>
                  </div>
                    <h3 className="text-white font-medium text-sm mb-1">{card.name}</h3>
                    <p className="text-gray-400 text-xs mb-2">{card.set?.name || 'Unknown Set'}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-primary font-bold text-sm">${card.currentValue?.toFixed(2) || 'N/A'}</p>
                <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add card to collection logic here
                          console.log('Adding card to collection:', card.name);
                        }}
                        className="bg-primary text-accent px-3 py-1 rounded-lg text-xs font-medium hover:bg-primary/80 transition-colors"
                      >
                        Add
                </button>
                      </div>
                  </div>
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
          <div className="px-4 mb-6">
            <div className="bg-[#2b2b2b] rounded-lg p-6">
              <h3 className="text-white text-lg font-semibold mb-4">My Collection</h3>
              <div className="space-y-4">
                <div className="text-gray-400 text-center py-8">
                  Collection view coming soon...
              </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="px-4 mb-6">
            <div className="bg-[#2b2b2b] rounded-lg p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Marketplace</h3>
              <div className="space-y-4">
                <div className="text-gray-400 text-center py-8">
                  Marketplace view coming soon...
              </div>
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
                {mockUserData.collections.map((collection) => (
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
        <div className="fixed bottom-4 left-0 right-0 px-[19px] py-0 shadow-[0px_24px_7px_0px_rgba(0,0,0,0.01),0px_16px_6px_0px_rgba(0,0,0,0.04),0px_9px_5px_0px_rgba(0,0,0,0.15),0px_4px_4px_0px_rgba(0,0,0,0.25),0px_1px_2px_0px_rgba(0,0,0,0.29)]">
          <div className="bg-[rgba(43,43,43,0.2)] backdrop-blur-md flex items-center justify-between px-[30px] py-0 rounded-[16px] relative border border-white/10 h-[75px]">
            {/* Home Button */}
            <button 
              onClick={() => {
                setActiveTab('home')
                setNavigationMode('home')
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
                      <path d="M9.02 2.84004L3.63 7.04004C2.73 7.74004 2 9.23004 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.78V10.5C22 9.29004 21.19 7.74004 20.2 7.05004L14.02 2.72004C12.62 1.74004 10.37 1.79004 9.02 2.84004Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 17.99V14.99" stroke="#8F8F94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                setActiveTab('collection')
                setNavigationMode('collection')
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
              navigationMode === 'none' ? 'transform -translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'
            }`}
                 style={{
                   left: navigationMode === 'home' ? '41px' : 
                         navigationMode === 'collection' ? '125px' :
                         navigationMode === 'marketplace' ? '209px' : 
                         navigationMode === 'profile' ? '293px' : '-84px'
                 }}>
              <div className="relative flex justify-center">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-[#6865E7] blur-sm opacity-30 scale-110" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%, 4% 50%, 4% 0)'}}></div>
                <div className="absolute inset-0 bg-[#6865E7] blur-md opacity-20 scale-125" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%, 4% 50%, 4% 0)'}}></div>
                
                {/* Main Indicator */}
                <svg width="64" height="8" viewBox="0 0 64 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                  <path d="M59.9277 3.92798C62.1768 3.92798 64 5.75121 64 8.00024H0C0 5.75121 1.82324 3.92798 4.07227 3.92798H25L31.1387 0.802979C31.9937 0.367721 33.0063 0.367721 33.8613 0.802979L40 3.92798H59.9277Z" fill="#6865E7"/>
                        </svg>
                
                {/* Subtle Glass Diffusion Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%, 4% 50%, 4% 0)'}}></div>
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
                          <span className="text-gray-400 text-xs">Qty: {mover.quantity}</span>
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
                          <span className="font-semibold">{Math.abs(mover.change).toFixed(1)}%</span>
                      </div>
                        <div className="text-gray-400 text-xs">
                          {mover.dailyChange >= 0 ? '+' : ''}${mover.dailyChange} today
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
                        <span className="font-semibold">+{card.change.toFixed(1)}%</span>
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
      </div>
    </div>
  )
}

  // Default return (should never reach here)
  return null
}

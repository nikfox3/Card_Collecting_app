import React, { useState, useEffect } from 'react'
import './styles/holographic.css'
import './styles/card-rarities.css'
import HolographicCard from './components/HolographicCard'
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
  const [selectedCollection, setSelectedCollection] = useState('Pokemon Collection')
  const [selectedTimeRange, setSelectedTimeRange] = useState('6M')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [showScanner, setShowScanner] = useState(false)
  const [scannedCard, setScannedCard] = useState(null)
  const [cardImages, setCardImages] = useState({})
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [indicatorAnimation, setIndicatorAnimation] = useState('enter')
  
  // Debug logging for indicator animation
  useEffect(() => {
    console.log('Indicator animation changed to:', indicatorAnimation)
  }, [indicatorAnimation])
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
  
  // Add Card Modal state
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [cardToAdd, setCardToAdd] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [variant, setVariant] = useState('Normal')
  const [condition, setCondition] = useState('Mint')
  const [isGraded, setIsGraded] = useState(false)
  const [gradingService, setGradingService] = useState('PSA')
  const [grade, setGrade] = useState('GEM-MT 10')
  const [comment, setComment] = useState('')
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('Collection')
  const [selectedCondition, setSelectedCondition] = useState('Near Mint')
  
  // Custom dropdown states
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false)
  const [showVariantDropdown, setShowVariantDropdown] = useState(false)
  const [showConditionDropdown, setShowConditionDropdown] = useState(false)
  const [showGradingServiceDropdown, setShowGradingServiceDropdown] = useState(false)
  const [showGradeDropdown, setShowGradeDropdown] = useState(false)

  // Data structures for the app
  const mockUserData = {
    username: 'Stuart60',
    profilePicture: 'S',
    collections: [
      {
        id: 'pokemon-collection',
        name: 'Pokemon Collection',
        totalValue: 4268.23,
        totalCards: 8456,
        monthlyChange: 102.36,
        currency: 'USD',
        lastUpdated: '2025-08-02'
      }
    ],
    recentActivity: [
      { id: 1, cardName: 'Charizard ex', action: 'added', timestamp: '2025-08-01T10:30:00Z' },
      { id: 2, cardName: 'Pikachu VMAX', action: 'removed', timestamp: '2025-08-01T09:15:00Z' },
      { id: 3, cardName: 'Lugia V', action: 'added', timestamp: '2025-07-31T16:45:00Z' },
      { id: 4, cardName: 'Mew ex', action: 'added', timestamp: '2025-07-31T14:20:00Z' },
      { id: 5, cardName: 'Blastoise ex', action: 'added', timestamp: '2025-07-31T11:45:00Z' }
    ],
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
        collected: true,
        hasNote: true,
        isWishlisted: false
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
        collected: true,
        hasNote: false,
        isWishlisted: true
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
        collected: true,
        hasNote: true,
        isWishlisted: true
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
        collected: false,
        hasNote: false,
        isWishlisted: false
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
            unlimitedHolofoil: { market: 528.66 },
            holofoil: { market: 450.00 },
            reverseHolofoil: { market: 380.00 },
            normal: { market: 25.00 }
          }
        },
        currentValue: 528.66,
        change: 12.34,
        changePercent: 37.0,
        quantity: 1,
        collected: true,
        hasNote: true,
        isWishlisted: false,
        holo: true,
        reverseHolo: true,
        firstEdition: false
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
            holofoil: { market: 127.01 },
            normal: { market: 15.00 }
          }
        },
        currentValue: 127.01,
        quantity: 0,
        collected: false,
        holo: true,
        reverseHolo: false,
        firstEdition: false
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
            holofoil: { market: 40.29 },
            reverseHolofoil: { market: 35.00 }
          }
        },
        currentValue: 40.29,
        change: 5.23,
        changePercent: 14.9,
        quantity: 2,
        collected: true,
        hasNote: false,
        isWishlisted: true,
        holo: true,
        reverseHolo: true,
        firstEdition: false
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
        change: -25.50,
        changePercent: -3.1,
        quantity: 1,
        collected: true,
        hasNote: true,
        isWishlisted: true
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
        change: 8.75,
        changePercent: 33.3,
        quantity: 1,
        collected: true,
        hasNote: false,
        isWishlisted: false
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
        change: 2.10,
        changePercent: 7.5,
        quantity: 1,
        collected: true,
        hasNote: true,
        isWishlisted: false
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
        change: -1.25,
        changePercent: -7.7,
        quantity: 1,
        collected: true,
        hasNote: false,
        isWishlisted: true
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
        change: 0.15,
        changePercent: 25.0,
        quantity: 2,
        collected: true,
        hasNote: true,
        isWishlisted: true
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
        change: 3.75,
        changePercent: 20.0,
        quantity: 1,
        collected: true,
        hasNote: false,
        isWishlisted: false
      }
    ],
    portfolioHistory: {
      '1D': [
        { date: '2025-08-01T00:00:00Z', value: 4200.00 },
        { date: '2025-08-01T06:00:00Z', value: 4225.50 },
        { date: '2025-08-01T12:00:00Z', value: 4180.25 },
        { date: '2025-08-01T18:00:00Z', value: 4268.23 }
      ],
      '7D': [
        { date: '2025-07-26T00:00:00Z', value: 4100.00 },
        { date: '2025-07-27T00:00:00Z', value: 4150.25 },
        { date: '2025-07-28T00:00:00Z', value: 4080.50 },
        { date: '2025-07-29T00:00:00Z', value: 4200.75 },
        { date: '2025-07-30T00:00:00Z', value: 4180.00 },
        { date: '2025-07-31T00:00:00Z', value: 4225.50 },
        { date: '2025-08-01T00:00:00Z', value: 4268.23 }
      ],
      '1M': [
        { date: '2025-07-01T00:00:00Z', value: 4100.00 },
        { date: '2025-07-05T00:00:00Z', value: 4150.25 },
        { date: '2025-07-10T00:00:00Z', value: 4080.50 },
        { date: '2025-07-15T00:00:00Z', value: 4200.75 },
        { date: '2025-07-20T00:00:00Z', value: 4180.00 },
        { date: '2025-07-25T00:00:00Z', value: 4225.50 },
        { date: '2025-07-30T00:00:00Z', value: 4165.87 },
        { date: '2025-08-01T00:00:00Z', value: 4268.23 }
      ],
      '3M': [
        { date: '2025-05-01T00:00:00Z', value: 3900.00 },
        { date: '2025-05-15T00:00:00Z', value: 3950.25 },
        { date: '2025-06-01T00:00:00Z', value: 4000.50 },
        { date: '2025-06-15T00:00:00Z', value: 4050.75 },
        { date: '2025-07-01T00:00:00Z', value: 4100.00 },
        { date: '2025-07-15T00:00:00Z', value: 4150.25 },
        { date: '2025-08-01T00:00:00Z', value: 4268.23 }
      ],
      '6M': [
        { date: '2025-02-01T00:00:00Z', value: 3800.00 },
        { date: '2025-03-01T00:00:00Z', value: 3950.25 },
        { date: '2025-04-01T00:00:00Z', value: 4100.50 },
        { date: '2025-05-01T00:00:00Z', value: 4050.75 },
        { date: '2025-06-01T00:00:00Z', value: 4200.00 },
        { date: '2025-07-01T00:00:00Z', value: 4165.87 },
        { date: '2025-08-01T00:00:00Z', value: 4268.23 }
      ],
      '1Y': [
        { date: '2024-08-01T00:00:00Z', value: 3500.00 },
        { date: '2024-10-01T00:00:00Z', value: 3600.25 },
        { date: '2024-12-01T00:00:00Z', value: 3700.50 },
        { date: '2025-02-01T00:00:00Z', value: 3800.00 },
        { date: '2025-04-01T00:00:00Z', value: 3900.25 },
        { date: '2025-06-01T00:00:00Z', value: 4000.50 },
        { date: '2025-08-01T00:00:00Z', value: 4268.23 }
      ],
      'MAX': [
        { date: '2024-01-01T00:00:00Z', value: 3000.00 },
        { date: '2024-04-01T00:00:00Z', value: 3200.25 },
        { date: '2024-07-01T00:00:00Z', value: 3400.50 },
        { date: '2024-10-01T00:00:00Z', value: 3600.75 },
        { date: '2025-01-01T00:00:00Z', value: 3800.00 },
        { date: '2025-04-01T00:00:00Z', value: 4000.25 },
        { date: '2025-07-01T00:00:00Z', value: 4200.50 },
        { date: '2025-08-01T00:00:00Z', value: 4268.23 }
      ]
    }
  }

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
    console.log('🔍 handleSearch called with query:', searchQuery);
    try {
      setLoading(true);
      console.log('🚀 Starting API search for:', searchQuery || 'all cards');
        
        const apiUrl = 'http://localhost:3002/api/cards/search';
        console.log('📡 Calling API:', apiUrl);
        
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

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: searchQuery,
            languages: activeLanguages.length > 0 ? activeLanguages : null,
            energyTypes: activeEnergies.length > 0 ? activeEnergies : null,
            types: Object.entries(selectedTypes)
              .filter(([type, isSelected]) => isSelected)
              .map(([type]) => type),
            rarities: Object.entries(selectedRarities)
              .filter(([rarity, isSelected]) => isSelected)
              .map(([rarity]) => rarity),
            rarityType: rarityType,
            variants: activeVariants.length > 0 ? activeVariants : null,
            regulations: activeRegulations.length > 0 ? activeRegulations : null,
            formats: activeFormats.length > 0 ? activeFormats : null
          }),
        });

        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ API response received:', data);
        console.log('✅ Number of cards:', data.cards?.length || 0);
        
        const filtered = data.cards || [];
        console.log('✅ Using API data:', filtered.length, 'cards');
        console.log('✅ First card:', filtered[0]);
        console.log('✅ First card number:', filtered[0]?.number, 'printed_total:', filtered[0]?.printed_total);
        
        setOriginalSearchResults(filtered);
        setFilteredSearchResults(filtered);
        setShowSearchResults(true);
        loadSearchResultImages(filtered);
        
      } catch (error) {
        console.error('❌ API Search failed:', error.message);
        console.error('❌ Full error:', error);
        console.log('🔄 Falling back to mock data');
        
        // Fallback to mock data if API fails
        const filtered = mockUserData.searchResults.filter(card => 
          !searchQuery.trim() || 
          card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.set?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.rarity.toLowerCase().includes(searchQuery.toLowerCase())
        );
        console.log('📦 Using mock data:', filtered.length, 'cards');
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
    console.log('Loading images for search results...')
    console.log('Search cards to load:', searchCards.map(c => ({ id: c.id, name: c.name, setName: c.set_name })))

    const imageMap = {}
    searchCards.forEach((card) => {
      // Parse the images JSON string from database
      let images = {};
      try {
        images = typeof card.images === 'string' ? JSON.parse(card.images) : card.images;
      } catch (e) {
        console.log(`Failed to parse images for ${card.name}:`, e);
      }

      if (images?.small) {
        imageMap[card.id] = images.small
        console.log(`Using direct image for ${card.name}:`, images.small)
      } else {
        console.log(`No direct image found for ${card.name}, will use fallback`)
      }
    })
    
    console.log('Final search image map:', imageMap)
    setCardImages(prev => ({ ...prev, ...imageMap }))
  }

  // Sort cards based on selected option
  const sortCards = (cards, sortType) => {
    const sortedCards = [...cards].sort((a, b) => {
      switch (sortType) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price-low':
          return (a.tcgplayer?.prices?.holofoil?.market || a.tcgplayer?.prices?.normal?.market || a.current_value || 0) - 
                 (b.tcgplayer?.prices?.holofoil?.market || b.tcgplayer?.prices?.normal?.market || b.current_value || 0)
        case 'price-high':
          return (b.tcgplayer?.prices?.holofoil?.market || b.tcgplayer?.prices?.normal?.market || b.current_value || 0) - 
                 (a.tcgplayer?.prices?.holofoil?.market || a.tcgplayer?.prices?.normal?.market || a.current_value || 0)
        case 'rarity-desc':
          const rarityOrderDesc = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Ultra', 'Rare Secret', 'Rare Rainbow']
          return rarityOrderDesc.indexOf(b.rarity || '') - rarityOrderDesc.indexOf(a.rarity || '')
        case 'rarity-asc':
          const rarityOrderAsc = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Ultra', 'Rare Secret', 'Rare Rainbow']
          return rarityOrderAsc.indexOf(a.rarity || '') - rarityOrderAsc.indexOf(b.rarity || '')
        case 'number':
          return parseInt(a.number || '0') - parseInt(b.number || '0')
        case 'pokemon-number':
          return (a.nationalPokedexNumbers?.[0] || 0) - (b.nationalPokedexNumbers?.[0] || 0)
        case 'trending':
          return (b.current_value || 0) - (a.current_value || 0)
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
    console.log('Applied quick filters:', quickFilters, 'Filtered cards:', filteredCards.length)
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
    console.log('Applied language filters:', selectedLanguages, 'Filtered cards:', filteredCards.length)
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
    console.log('Applied condition filters:', selectedConditions, 'Filtered cards:', filteredCards.length)
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
    console.log('Applied products filters:', selectedProducts, 'Filtered cards:', filteredCards.length)
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
      console.log('Starting to load card images...')
      // Load images for both topMovers and trendingCards
      const allCards = [...mockUserData.topMovers, ...mockUserData.trendingCards]
      console.log('All cards to load:', allCards.map(c => ({ id: c.id, name: c.name, setName: c.set?.name })))
      
      const imageMap = {}
      allCards.forEach((card) => {
        if (card.images?.small) {
          imageMap[card.id] = card.images.small
          console.log(`Using direct image for ${card.name}:`, card.images.small)
        } else {
          console.log(`No direct image found for ${card.name}, will use fallback`)
        }
      })
      
      console.log('Final image map:', imageMap)
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
  const handleManualScan = () => {
    // Manual scan functionality
    console.log('Manual scan triggered')
    setShowScanConfirm(true)
    setIsScanConfirmFading(false)
    
    // Start fade animation after 2.5 seconds
    setTimeout(() => {
      setIsScanConfirmFading(true)
    }, 2500)
    
    // Hide the modal after 3 seconds
    setTimeout(() => {
      setShowScanConfirm(false)
      setIsScanConfirmFading(false)
    }, 3000)
  }

  // Card profile handlers
  const handleCardClick = (card) => {
    // Ensure the card has all the required properties
    const cardWithDefaults = {
      ...card,
      hasNote: card.hasNote !== undefined ? card.hasNote : (card.name === "Blaine's Charizard" ? true : false),
      isWishlisted: card.isWishlisted !== undefined ? card.isWishlisted : (card.name === "Blaine's Charizard" ? false : false),
      change: card.change || 2.36, // Default change value for demo
      changePercent: card.changePercent || 23.6, // Default percentage for demo
      currentValue: card.currentValue || card.current_value || card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 12.34
    }
    setSelectedCard(cardWithDefaults)
    setShowCardProfile(true)
  }

  const handleCloseCardProfile = () => {
    setShowCardProfile(false)
    setSelectedCard(null)
  }

  const handleAddCardClick = (card, e) => {
    e.stopPropagation() // Prevent card click
    console.log('Adding card to modal:', card)
    setCardToAdd(card)
    setShowAddCardModal(true)
    // Reset form to defaults
    setSelectedCollection('My Personal Collection')
    setQuantity(1)
    setCondition('Mint')
    setIsGraded(false)
    setGradingService('PSA')
    const psaGrades = getGradesForService('PSA')
    setGrade(psaGrades[0]) // Set to first PSA grade
    setComment('')
    
    // Set default variant based on card's available variants
    const availableVariants = getAvailableVariants(card)
    console.log('Available variants for', card.name, ':', availableVariants)
    setVariant(availableVariants[0] || 'Normal')
  }

  // Function to get available variants for a card
  const getAvailableVariants = (card) => {
    const variants = ['Normal'] // Always include Normal as default
    
    // Check if card has holo variant (based on tcgplayer prices or other indicators)
    if (card.tcgplayer?.prices?.holofoil || card.holo || card.rarity?.toLowerCase().includes('holo')) {
      variants.push('Holo')
    }
    
    // Check if card has reverse holo variant
    if (card.tcgplayer?.prices?.reverseHolofoil || card.reverseHolo) {
      variants.push('Reverse Holo')
    }
    
    // Check if card is 1st edition (based on set or other indicators)
    if (card.set?.name?.toLowerCase().includes('1st') || card.firstEdition) {
      variants.push('1st Edition')
    }
    
    // Check for other special variants based on card data
    if (card.tcgplayer?.prices?.unlimitedHolofoil) {
      variants.push('Unlimited Holo')
    }
    
    if (card.tcgplayer?.prices?.firstEditionHolofoil) {
      variants.push('1st Edition Holo')
    }
    
    // Debug logging to see what's being detected
    console.log('Card variants for', card.name, ':', variants)
    console.log('Card tcgplayer prices:', card.tcgplayer?.prices)
    console.log('Card holo flag:', card.holo)
    console.log('Card rarity:', card.rarity)
    console.log('Card object:', card)
    
    return variants
  }

  const handleCloseAddCardModal = () => {
    setShowAddCardModal(false)
    setCardToAdd(null)
  }

  const handleAddCard = () => {
    // Here you would typically save the card to the collection
    console.log('Adding card:', {
      card: cardToAdd,
      collection: selectedCollection,
      quantity,
      variant,
      condition: isGraded ? null : condition,
      isGraded,
      gradingService: isGraded ? gradingService : null,
      grade: isGraded ? grade : null,
      comment
    })
    // Close modal after adding
    handleCloseAddCardModal()
  }

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowCollectionDropdown(false)
    setShowVariantDropdown(false)
    setShowConditionDropdown(false)
    setShowGradingServiceDropdown(false)
    setShowGradeDropdown(false)
  }

  // Share functionality
  const handleShareClick = () => {
    setShowShareModal(true)
  }

  const handleCloseShareModal = () => {
    setShowShareModal(false)
  }

  const generateShareUrl = (card) => {
    if (!card) return ''
    const baseUrl = window.location.origin
    const cardId = card.id || 'unknown'
    return `${baseUrl}/card/${cardId}`
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
      console.log('Copied to clipboard:', text)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const shareToSocial = (platform, card) => {
    const shareUrl = generateShareUrl(card)
    const shareText = `Check out this ${card.name} card from ${card.set?.name || 'Pokémon TCG'}!`
    
    let url = ''
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        break
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        break
      default:
        return
    }
    
    window.open(url, '_blank', 'width=600,height=400')
  }

  // Function to get grades based on grading service
  const getGradesForService = (service) => {
    switch (service) {
      case 'PSA':
        return [
          'GEM-MT 10',
          'MINT 9',
          'NM-MT 8',
          'NM 7',
          'EX-MT 6',
          'EX 5',
          'VG-EX 4',
          'VG 3',
          'GOOD 2',
          'FAIR 1.5',
          'POOR 1'
        ]
      case 'BGS':
        return [
          'Pristine 10',
          'Gem Mint 9.5',
          'Mint 9',
          'Near Mint/Mint 8.5',
          'Near Mint/Mint 8',
          'Near Mint 7.5',
          'Near Mint 7',
          'Excellent Mint 6.5',
          'Excellent Mint 6',
          'Excellent 5.5',
          'Excellent 5',
          'Very Good/Excellent 4.5',
          'Very Good/Excellent 4',
          'Very Good 3.5',
          'Very Good 3',
          'Good 2.5',
          'Good 2',
          'Poor 1.5',
          'Poor 1'
        ]
      case 'CGC':
        return [
          'Pristine 10',
          'Gem Mint 10',
          'Mint+ 9.5',
          'Mint 9',
          'NM/Mint+ 8.5',
          'NM/Mint 8',
          'Near Mint+ 7.5',
          'Near Mint 7',
          'Excellent+ 6.5',
          'Excellent 6',
          'Very Good/Excellent 5.5',
          'Very Good/Excellent 5',
          'Very Good 4.5',
          'Very Good 4',
          'Good 3.5',
          'Good 3',
          'Fair 2.5',
          'Fair 2',
          'Poor 1.5',
          'Poor 1'
        ]
      case 'SGC':
        return [
          'Pristine 10',
          'Gem Mint 9.5',
          'Mint 9',
          'Near Mint/Mint 8.5',
          'Near Mint/Mint 8',
          'Near Mint 7.5',
          'Near Mint 7',
          'Excellent Mint 6.5',
          'Excellent Mint 6',
          'Excellent 5.5',
          'Excellent 5',
          'Very Good/Excellent 4.5',
          'Very Good/Excellent 4',
          'Very Good 3.5',
          'Very Good 3',
          'Good 2.5',
          'Good 2',
          'Poor 1.5',
          'Poor 1'
        ]
      default:
        return [
          'GEM-MT 10',
          'MINT 9',
          'NM-MT 8',
          'NM 7',
          'EX-MT 6',
          'EX 5',
          'VG-EX 4',
          'VG 3',
          'GOOD 2',
          'FAIR 1.5',
          'POOR 1'
        ]
    }
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
  const getChartData = () => {
    const currentCollection = mockUserData.collections[0]
    const history = mockUserData.portfolioHistory[selectedTimeRange] || []
    
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

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-end">
            <div className="bg-[#1C1C1E] w-full rounded-t-3xl max-h-[80vh] overflow-y-auto">
              {/* Grabber Handle */}
              <div className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mt-[15px] mb-[15px]"></div>
              
              {/* Modal Header */}
              <div className="px-6 pb-4">
                <h2 className="text-white text-xl font-bold text-center">Scan Settings</h2>
              </div>

              {/* Settings Options */}
              <div className="px-6 pb-8">
                {/* Folder Selection */}
                <div className="mb-6">
                  <h3 className="text-white text-lg font-semibold mb-3">Add to Folder</h3>
                  <div className="space-y-2">
                    {['Collection', 'Wishlist', 'Trading', 'Selling'].map((folder) => (
                      <button
                        key={folder}
                        onClick={() => setSelectedFolder(folder)}
                        className={`w-full text-left p-3 rounded-lg border ${
                          selectedFolder === folder
                            ? 'border-[#605DEC] bg-[#605DEC]/20 text-white'
                            : 'border-[#383838] bg-[#2B2B2B] text-white/70'
                        }`}
                      >
                        {folder}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition Selection */}
                <div className="mb-6">
                  <h3 className="text-white text-lg font-semibold mb-3">Card Condition</h3>
                  <div className="space-y-2">
                    {['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'].map((condition) => (
                      <button
                        key={condition}
                        onClick={() => setSelectedCondition(condition)}
                        className={`w-full text-left p-3 rounded-lg border ${
                          selectedCondition === condition
                            ? 'border-[#605DEC] bg-[#605DEC]/20 text-white'
                            : 'border-[#383838] bg-[#2B2B2B] text-white/70'
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
                  className="w-full bg-[#605DEC] text-white py-4 rounded-lg font-semibold text-lg"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scan Confirmation Modal */}
        {showScanConfirm && (
          <div className="fixed inset-0 z-[70] flex items-end">
            {/* Semi-transparent backdrop */}
            <div 
              className="absolute inset-0" 
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
              onClick={() => setShowScanConfirm(false)}
            ></div>
            
            {/* Confirmation Card - Horizontal Layout */}
            <div 
              className={`relative bg-[rgba(32,32,32,0.65)] rounded-lg p-3 w-full max-w-sm mx-auto transition-opacity duration-500 ${
                isScanConfirmFading ? 'opacity-0' : 'opacity-100'
              }`}
              style={{
                marginBottom: '165px'
              }}
            >
              <div className="flex items-center justify-between gap-1">
                {/* Left side - Card Image */}
                <div className="w-[45.63px] h-[63.275px] bg-gray-700 rounded-lg shrink-0">
                  {/* Card image placeholder */}
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Middle section - Card Details */}
                <div className="flex-1 flex flex-col items-start gap-1">
                  {/* Card Name */}
                  <div className="text-white text-xs font-bold leading-tight">
                    Card Name
                  </div>
                  
                  {/* Card Details */}
                  <div className="flex flex-col items-start text-white/70 text-[10px] leading-tight">
                    <div>Set name</div>
                    <div>Rarity</div>
                    <div>001/001</div>
                  </div>
                </div>

                {/* Right side - Price and Edit */}
                <div className="flex flex-col items-end justify-between h-[63.275px]">
                  {/* Price */}
                  <div className="text-[#8871FF] text-base font-black text-center">
                    $12.34
                  </div>
                  
                  {/* Tap to edit */}
                  <div className="text-white text-xs font-medium text-center">
                    Tap to edit
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
                  onClick={() => alert('Share functionality coming soon!')}
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
                      src={cardImages[selectedCard.id]}
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
                      {selectedCard.collected ? (
                        <img src="/Assets/Collected=Yes.svg" alt="Collected" className="w-[18px] h-[18px] flex-shrink-0" />
                      ) : (
                        <img src="/Assets/Collected=No.svg" alt="Not Collected" className="w-[18px] h-[18px] flex-shrink-0" />
                      )}
                    </div>

                    {/* Rarity */}
                    <p className="text-sm text-white text-center">{selectedCard.rarity}</p>

                    {/* Illustrator */}
                    <p className="text-sm text-[#605dec] text-center">{selectedCard.artist || 'Unknown Artist'}</p>
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
                            {selectedCard.number || '001'}/{selectedCard.printed_total || selectedCard.set?.total || '001'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Set and Expansion Info */}
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-medium">{selectedCard.set_name || selectedCard.set?.name || 'Set Name'}</span>
                        <span className="text-gray-300 text-xs">{selectedCard.set?.series || selectedCard.series || 'Series Name'}</span>
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
                      {/* Notes Icon */}
                      <button className="w-6 h-6 text-white">
                        {selectedCard.hasNote ? (
                          <img src="/Assets/Notes Icon_has.svg" alt="Has Notes" className="w-6 h-6" />
                        ) : (
                          <img src="/Assets/Notes Icon_None.svg" alt="No Notes" className="w-6 h-6" />
                        )}
                      </button>
                      {/* Wishlist Icon */}
                      <button className="w-6 h-6 text-white">
                        {selectedCard.isWishlisted ? (
                          <img src="/Assets/Wishlisted_card.svg" alt="Wishlisted" className="w-6 h-6" />
                        ) : (
                          <img src="/Assets/Wishlist_cardprof.svg" alt="Add to Wishlist" className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-center min-w-[60px]" style={{ marginRight: '60px' }}>
                      <span className="text-white text-sm text-center">Qty: {selectedCard.quantity || 0}</span>
                    </div>
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
                            ${selectedCard.currentValue || selectedCard.current_value || selectedCard.tcgplayer?.prices?.holofoil?.market || selectedCard.tcgplayer?.prices?.normal?.market || 0}
                          </span>
                        </div>
                        <div className="text-green-400 text-sm">
                          +${selectedCard.change.toFixed(2)} (+{selectedCard.changePercent.toFixed(1)}%)
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
                        ${selectedCard.currentValue || selectedCard.current_value || selectedCard.tcgplayer?.prices?.holofoil?.market || selectedCard.tcgplayer?.prices?.normal?.market || 0}
                      </span>
                      <div className="flex items-center gap-1 text-green-400 text-sm">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span>+{selectedCard.changePercent.toFixed(1)}%</span>
                        <span>this week</span>
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
      <div className="min-h-screen bg-background text-accent">
        {/* Header */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-accent">logoipsum</h1>
              <div className="w-4 h-4 text-accent">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
            
            {/* User Profile & Menu */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-accent">@{mockUserData.username}</span>
              <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{mockUserData.profilePicture}</span>
              </div>
              <button className="text-accent">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative ml-7">
            <div className="flex items-center bg-[#2B2B2B] border border-[#383838] rounded-lg pl-0 pr-4 py-2 search-bar-shadow h-12">
              {/* Card Scanner Button */}
              <button 
                onClick={handleCardScan}
                className="w-14 h-14 rounded-full flex items-center justify-center -ml-7 mr-4 hover:opacity-90 transition-opacity card-scanner-button relative z-10"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 15C4.24493 15 4.48134 15.09 4.66437 15.2527C4.84741 15.4155 4.96434 15.6397 4.993 15.883L5 16V19H9C9.25488 19.0003 9.50003 19.0979 9.68537 19.2728C9.8707 19.4478 9.98224 19.687 9.99717 19.9414C10.0121 20.1958 9.92933 20.4464 9.76574 20.6418C9.60215 20.8373 9.3701 20.9629 9.117 20.993L9 21H5C4.49542 21.0002 4.00943 20.8096 3.63945 20.4665C3.26947 20.1234 3.04284 19.6532 3.005 19.15L3 19V16C3 15.7348 3.10536 15.4804 3.29289 15.2929C3.48043 15.1054 3.73478 15 4 15ZM20 15C20.2652 15 20.5196 15.1054 20.7071 15.2929C20.8946 15.4804 21 15.7348 21 16V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15C14.7348 21 14.4804 20.8946 14.2929 20.7071C14.1054 20.5196 14 20.2652 14 20C14 19.7348 14.1054 19.4804 14.2929 19.2929C14.4804 19.1054 14.7348 19 15 19H19V16C19 15.7348 19.1054 15.4804 19.2929 15.2929C19.4804 15.1054 19.7348 15 20 15ZM20 11C20.2549 11.0003 20.5 11.0979 20.6854 11.2728C20.8707 11.4478 20.9822 11.687 20.9972 11.9414C21.0121 12.1958 20.9293 12.4464 20.7657 12.6418C20.6021 12.8373 20.3701 12.9629 20.117 12.993L20 13H4C3.74512 12.9997 3.49997 12.9021 3.31463 12.7272C3.1293 12.5522 3.01777 12.313 3.00283 12.0586C2.98789 11.8042 3.07067 11.5536 3.23426 11.3582C3.39786 11.1627 3.6299 11.0371 3.883 11.007L4 11H20ZM9 3C9.26522 3 9.51957 3.10536 9.70711 3.29289C9.89464 3.48043 10 3.73478 10 4C10 4.26522 9.89464 4.51957 9.70711 4.70711C9.51957 4.89464 9.26522 5 9 5H5V8C5 8.26522 4.89464 8.51957 4.70711 8.70711C4.51957 8.89464 4.26522 9 4 9C3.73478 9 3.48043 8.89464 3.29289 8.70711C3.10536 8.51957 3 8.26522 3 8V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9ZM19 3C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V8C21 8.26522 20.8946 8.51957 20.7071 8.70711C20.5196 8.89464 20.2652 9 20 9C19.7348 9 19.4804 8.89464 19.2929 8.70711C19.1054 8.51957 19 8.26522 19 8V5H15C14.7348 5 14.4804 4.89464 14.2929 4.70711C14.1054 4.51957 14 4.26522 14 4C14 3.73478 14.1054 3.48043 14.2929 3.29289C14.4804 3.10536 14.7348 3 15 3H19Z"/>
                </svg>
              </button>
              
              {/* Search Content */}
              <div 
                className="flex items-center flex-1 pl-1 cursor-pointer"
                onClick={() => {
                  setIndicatorAnimation('exit');
                  setTimeout(() => {
                    setShowSearchResults(true);
                    if (!searchQuery.trim()) {
                      handleSearch();
                    }
                  }, 300);
                }}
              >
                {/* Search Icon */}
                <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Search cards, sets, attacks, abilities..."
                    className="flex-1 bg-transparent text-white placeholder-white/70 focus:outline-none text-base"
                  />
              </div>
              
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-white/70 hover:text-white ml-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pb-20">
          {/* Collection Overview */}
          <div className="bg-[#1f2937] rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-accent">Pokemon Collection</h2>
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="relative currency-dropdown">
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="flex items-center gap-1 hover:bg-gray-700 rounded-lg px-2 py-1 transition-colors"
                >
                  <span className="text-sm">{currencies.find(c => c.code === selectedCurrency)?.flag}</span>
                  <span className="text-sm text-accent">{selectedCurrency} ({currencies.find(c => c.code === selectedCurrency)?.symbol})</span>
                  <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showCurrencyDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                    {currencies.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          setSelectedCurrency(currency.code)
                          setShowCurrencyDropdown(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                          selectedCurrency === currency.code ? 'bg-gray-700' : ''
                        }`}
                      >
                        <span className="text-sm">{currency.flag}</span>
                        <div className="flex-1">
                          <div className="text-sm text-accent">{currency.code}</div>
                          <div className="text-xs text-gray-400">{currency.name}</div>
                        </div>
                        <span className="text-sm text-gray-400">{currency.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-3xl font-bold text-accent mb-1">{formatCurrency(mockUserData.collections[0].totalValue)}</div>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14l5-5 5 5z"/>
                </svg>
                <span className="text-green-400 text-sm">{formatCurrency(mockUserData.collections[0].monthlyChange)} past 6 months</span>
              </div>
            </div>

            {/* Interactive Portfolio Graph Container */}
            <div className="bg-[#2B2B2B] rounded-lg h-40 mb-4 p-4 shadow-lg">
              <Line data={getChartData()} options={chartOptions} />
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2">
              {['1D', '7D', '1M', '3M', '6M', '1Y', 'MAX'].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-primary text-accent'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Total Cards */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-accent mb-2">Total Cards</h3>
              <div className="text-2xl font-bold text-accent mb-2">{mockUserData.collections[0].totalCards.toLocaleString()}</div>
              <div className="text-green-400 text-sm mb-3">+ 150 this month</div>
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">My Portfolio</span>
                  <span className="text-green-400">+ 175</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Trade Binder</span>
                  <span className="text-red-400">- 25</span>
                </div>
              </div>
              <button className="w-full bg-primary text-accent py-2 rounded text-sm font-medium">
                View Collections
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-accent mb-2">Recent Activity</h3>
              <div className="space-y-2 mb-4">
                {mockUserData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between text-xs">
                    <span className="text-gray-300">{activity.cardName}</span>
                    <span className={activity.action === 'added' ? 'text-green-400' : 'text-red-400'}>
                      {activity.action === 'added' ? '+ Added' : '- Removed'}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full bg-primary text-accent py-2 rounded text-sm font-medium">
                View All
              </button>
            </div>
          </div>

          {/* My Top Movers */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-accent mb-4">My Top Movers</h3>
            <div className="space-y-3">
              {mockUserData.topMovers.map((card) => (
                <div key={card.id} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => handleCardClick(card)}>
                  <div className="w-12 h-16 overflow-hidden rounded-sm">
                    <HolographicCard
                      src={cardImages[card.id]}
                      alt={card.name}
                      className="w-full h-full bg-gray-700 rounded-sm"
                      enableGyroscope={false}
                      enableHolographic={false}
                      cardRarity={card.rarity || 'common'}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-accent">{card.name}</div>
                    <div className="text-xs text-gray-400">{card.set?.name || 'Unknown Set'} • {card.rarity} • #{card.number}</div>
                    <div className="text-xs text-gray-400 mt-1">Quantity: {card.quantity}</div>
                  </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-accent mb-1">{formatCurrency(card.currentValue)}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <svg className={`w-4 h-4 ${card.change < 0 ? 'text-red-400' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d={card.change < 0 ? "M7 10l5 5 5-5z" : "M7 14l5-5 5 5z"}/>
                        </svg>
                        <span className={card.change < 0 ? 'text-red-400' : 'text-green-400'}>{formatCurrency(Math.abs(card.change))}</span>
                      </div>
                    </div>
                </div>
              ))}
            </div>
            <button className="w-full bg-gray-700 text-accent py-2 rounded text-sm font-medium mt-4">
              View All
            </button>
          </div>

          {/* Trending Cards */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-accent mb-4">Trending Cards</h3>
            <div className="space-y-3">
              {mockUserData.trendingCards.map((card) => (
                <div key={card.id} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => handleCardClick(card)}>
                  <div className="w-12 h-16 overflow-hidden rounded-sm">
                    <HolographicCard
                      src={cardImages[card.id]}
                      alt={card.name}
                      className="w-full h-full bg-gray-700 rounded-sm"
                      onClick={() => handleCardClick(card)}
                      enableGyroscope={false}
                      enableHolographic={false}
                      cardRarity={card.rarity || 'common'}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-accent">{card.name}</div>
                    <div className="text-xs text-gray-400">{card.set?.name || 'Unknown Set'} • {card.rarity} • #{card.number}</div>
                    <div className="text-xs text-gray-400 mt-1">Quantity: {card.quantity}</div>
                  </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-accent mb-1">{formatCurrency(card.currentValue)}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <svg className={`w-4 h-4 ${card.change < 0 ? 'text-red-400' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d={card.change < 0 ? "M7 10l5 5 5-5z" : "M7 14l5-5 5 5z"}/>
                        </svg>
                        <span className={card.change < 0 ? 'text-red-400' : 'text-green-400'}>{formatCurrency(Math.abs(card.change))}</span>
                      </div>
                    </div>
                </div>
              ))}
            </div>
            <button className="w-full bg-gray-700 text-accent py-2 rounded text-sm font-medium mt-4">
              View All
            </button>
          </div>
        </div>

        {/* Search Results Screen */}
        {showSearchResults && (
          <div className="fixed inset-0 bg-background z-50 overflow-y-auto min-h-screen">
            {/* Header & Search Bar - Combined Container */}
            <div className="px-4 py-4 bg-background">
              <div className="flex items-center justify-between mb-4">
                {/* Back Button - Replaces Logo */}
                <button 
                  onClick={() => setShowSearchResults(false)}
                  className="flex items-center gap-2 text-accent hover:opacity-80 transition-opacity"
                >
                  <img src="/Assets/Back_arrow.svg" alt="Back" className="w-6 h-6" />
                  <span className="text-lg font-medium">Back</span>
                </button>
                
                {/* User Profile & Menu - Same as Dashboard */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-accent">@{mockUserData.username}</span>
                  <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{mockUserData.profilePicture}</span>
                  </div>
                  <button className="text-accent">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative ml-7">
                <div className="flex items-center bg-[#2B2B2B] border border-[#383838] rounded-lg pl-0 pr-4 py-2 search-bar-shadow h-12">
                  {/* Card Scanner Button */}
                  <button 
                    onClick={handleCardScan}
                    className="w-14 h-14 rounded-full flex items-center justify-center -ml-7 mr-4 hover:opacity-90 transition-opacity card-scanner-button relative z-10"
                  >
                    <img src="/Assets/mingcute_scan-line.svg" alt="Scan" className="w-6 h-6" />
                  </button>
                  
                  {/* Search Content */}
                  <div className="flex items-center flex-1 pl-1">
                    {/* Search Icon */}
                    <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Search cards, sets, attacks, abilities..."
                      className="flex-1 bg-transparent text-white placeholder-white/70 focus:outline-none text-base"
                    />
                  </div>
                  
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-white/70 hover:text-white ml-2 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Options - Horizontal Scroll */}
            <div className="px-4 mb-4 mt-2">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {/* Sort by */}
                <button 
                  onClick={() => setShowSortModal(true)}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit hover:bg-[#383838] transition-colors cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  <img src="/Assets/fontisto_language.svg" alt="Sort" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Sort by</span>
                </button>
                
                {/* Quick filter */}
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowQuickFiltersModal(true)
                  }}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit cursor-pointer"
                >
                  <img src="/Assets/famicons_filter.svg" alt="Filter" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Filter</span>
                </button>
                
                {/* Language */}
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowLanguageModal(true)
                  }}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit cursor-pointer"
                >
                  <img src="/Assets/fontisto_language.svg" alt="Language" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Language</span>
                </button>
                
                {/* Condition */}
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowConditionModal(true)
                  }}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit cursor-pointer"
                >
                  <img src="/Assets/Near Mint.svg" alt="Condition" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Condition</span>
                </button>
                
                {/* Products */}
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowProductsModal(true)
                  }}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit cursor-pointer"
                >
                  <img src="/Assets/Products.svg" alt="Products" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Products</span>
                </button>
                
                {/* Energy */}
                <button 
                  onClick={() => setShowEnergyModal(true)}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit">
                  <img src="/Assets/Colorless.svg" alt="Energy" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Energy</span>
                </button>
                
                {/* Type */}
                <button 
                  onClick={() => setShowTypeModal(true)}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit">
                  <img src="/Assets/Pokeball 1.svg" alt="Type" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Type</span>
                </button>
                
                {/* Rarity */}
                <button 
                  onClick={() => setShowRarityModal(true)}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit">
                  <img src="/Assets/Rare.svg" alt="Rarity" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Rarity</span>
                </button>
                
                {/* Variant */}
                <button 
                  onClick={() => setShowVariantModal(true)}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit"
                >
                  <img src="/Assets/fluent_sparkle-32-filled.svg" alt="Variant" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Variant</span>
                </button>
                
                {/* Regulation */}
                <button 
                  onClick={() => setShowRegulationModal(true)}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit"
                >
                  <img src="/Assets/CardRegulation.svg" alt="Regulation" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Regulation</span>
                </button>
                
                {/* Format */}
                <button 
                  onClick={() => setShowFormatModal(true)}
                  className="flex items-center gap-1.5 bg-[#2B2B2B] border border-[#383838] rounded-lg px-2.5 py-1.5 whitespace-nowrap min-w-fit"
                >
                  <img src="/Assets/Cardsformatfilled.svg" alt="Format" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-white text-xs">Format</span>
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="px-4 pb-32">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 max-w-7xl mx-auto">
                {filteredSearchResults.map((card) => (
                  <div 
                    key={card.id} 
                    className="bg-[#2B2B2B] border border-[#383838] rounded-lg relative overflow-hidden shadow-lg cursor-pointer hover:border-[#605DEC] transition-colors"
                    onClick={() => handleCardClick(card)}
                  >
                    {/* Card Image - Top Section */}
                    <div className="w-full rounded-t-lg relative overflow-hidden flex items-center justify-center p-4" style={{ aspectRatio: '3/4' }}>
                      <HolographicCard
                        src={cardImages[card.id]}
                        alt={card.name}
                        className="w-full h-full bg-[#383838]"
                        enableGyroscope={false}
                        enableHolographic={false}
                        cardRarity={card.rarity || 'common'}
                        showExpandedOverlay={true}
                        onExpandedClick={() => handleCardClick(card)}
                      />
                      
                      {/* Darkened Overlay - Only for missing cards */}
                      {!card.collected && (
                        <div className="absolute inset-0 bg-black/50 rounded-t-lg"></div>
                      )}
                    </div>
                    
                    {/* Card Info - Bottom Section */}
                    <div className="px-2 pt-2 pb-3 bg-[#2B2B2B] flex flex-col">
                      {/* Card Name */}
                      <h3 className="text-white font-bold text-sm leading-tight">{card.name}</h3>
                      
                      {/* Set Name */}
                      <p className="text-gray-300 text-xs">{card.set_name || 'Unknown Set'}</p>
                      
                      {/* Rarity */}
                      <p className="text-gray-300 text-xs">{card.rarity}</p>
                      
                      {/* Card Number */}
                      <p className="text-gray-300 text-xs">{card.number || '?'}/{card.printed_total || '?'}</p>
                      
                      {/* Price and Quantity */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col">
                          <span className="text-[#605DEC] font-bold text-base">
                            {formatCurrency(card.current_value || card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0)}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-300 text-xs">Qty:</span>
                            <span className="text-white text-xs font-medium">{card.quantity || 0}</span>
                          </div>
                        </div>
                        
                        {/* Add Button - Bottom Right */}
                        <button 
                          className="w-8 h-8 rounded-md flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
                          onClick={(e) => handleAddCardClick(card, e)}
                        >
                          <img src="/Assets/icon-park-solid_add.svg" alt="Add" className="w-8 h-8" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inactive Bottom Navigation Bar - Search Results Screen */}
        {showSearchResults && (
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
                {[
                  { 
                    id: 'home', 
                    label: 'Home',
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.04 6.82018L14.28 2.79018C12.71 1.69018 10.3 1.75018 8.78999 2.92018L3.77999 6.83018C2.77999 7.61018 1.98999 9.21018 1.98999 10.4702V17.3702C1.98999 19.9202 4.05999 22.0002 6.60999 22.0002H17.39C19.94 22.0002 22.01 19.9302 22.01 17.3802V10.6002C22.01 9.25018 21.14 7.59018 20.04 6.82018ZM12.75 18.0002C12.75 18.4102 12.41 18.7502 12 18.7502C11.59 18.7502 11.25 18.4102 11.25 18.0002V15.0002C11.25 14.5902 11.59 14.2502 12 14.2502C12.41 14.2502 12.75 14.5902 12.75 15.0002V18.0002Z" fill="none" stroke="#8F8F94" strokeWidth="2"/>
                      </svg>
                    )
                  },
                  { 
                    id: 'collection', 
                    label: 'Collection',
                    icon: (
                      <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_248_3247)">
                          <path d="M11.555 1.469C11.6113 1.26096 11.7477 1.0837 11.9344 0.976052C12.1211 0.868406 12.3428 0.839157 12.551 0.894714L22.871 3.65814C23.0797 3.71364 23.2578 3.84974 23.3661 4.03652C23.4745 4.2233 23.5042 4.44546 23.4488 4.65414L19.4888 19.4279C19.4325 19.6363 19.2959 19.8138 19.1088 19.9215C18.9217 20.0292 18.6995 20.0582 18.491 20.0021L8.17104 17.2387C7.96268 17.1828 7.78501 17.0466 7.67702 16.8599C7.56903 16.6731 7.53954 16.4512 7.59504 16.2427L11.555 1.469Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10.8042 4.3457L1.7939 6.76113C1.58555 6.81699 1.40787 6.95325 1.29988 7.13999C1.19189 7.32672 1.16241 7.54868 1.2179 7.75713L5.17447 22.5308C5.23069 22.7393 5.36736 22.9168 5.55445 23.0245C5.74154 23.1322 5.96373 23.1612 6.17219 23.1051L11.3322 21.7234" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_248_3247">
                            <rect width="24" height="24" fill="white" transform="translate(0.333313)"/>
                          </clipPath>
                        </defs>
                      </svg>
                    )
                  },
                  { 
                    id: 'marketplace', 
                    label: 'Marketplace',
                    icon: (
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
                    )
                  },
                  { 
                    id: 'profile', 
                    label: 'Profile',
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26003 15 3.41003 18.13 3.41003 22" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )
                  }
                ].map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      // Navigate to different screens based on tab
                      if (tab.id === 'home') {
                        setIndicatorAnimation('exit');
                        setTimeout(() => {
                          setShowSearchResults(false);
                          setIndicatorAnimation('enter');
                        }, 300);
                      } else if (tab.id === 'collection') {
                        setIndicatorAnimation('exit');
                        setTimeout(() => {
                          setShowSearchResults(false);
                          setIndicatorAnimation('enter');
                        }, 300);
                        // Add collection screen logic here
                      } else if (tab.id === 'marketplace') {
                        setIndicatorAnimation('exit');
                        setTimeout(() => {
                          setShowSearchResults(false);
                          setIndicatorAnimation('enter');
                        }, 300);
                        // Add marketplace screen logic here
                      } else if (tab.id === 'profile') {
                        setIndicatorAnimation('exit');
                        setTimeout(() => {
                          setShowSearchResults(false);
                          setIndicatorAnimation('enter');
                        }, 300);
                        // Add profile screen logic here
                      }
                    }}
                    className={`relative flex flex-col gap-1 px-2 py-3 rounded-xl transition-all duration-300 group items-center justify-center h-full hover:opacity-80 transition-opacity cursor-pointer`}
                  >
                    {/* Icon */}
                    <div className={`relative z-10 transition-all duration-300 group-hover:scale-105`}>
                      {tab.icon}
                    </div>

                    {/* Label - Hidden for inactive state */}
                    <div className={`relative z-10 text-xs font-medium transition-all duration-300 opacity-0 transform translate-y-2`}>
                      {tab.label}
                    </div>
                  </button>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* Sort Modal */}
        {showSortModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSortModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative w-full bg-[#2B2B2B] rounded-t-[20px] px-5 pt-[5px] pb-0 transform transition-transform duration-300 ease-out">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>
              
              {/* Sort Options */}
              <div className="flex flex-col gap-[15px] mb-[15px]">
                {[
                  { 
                    value: 'trending', 
                    label: 'Trending', 
                    icon: (
                      <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                        </svg>
                      </div>
                    )
                  },
                  { 
                    value: 'number', 
                    label: 'Card Number', 
                    icon: (
                      <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                        <img src="/Assets/Cardnum.svg" alt="Card Number" className="w-5 h-5" />
                      </div>
                    )
                  },
                  { 
                    value: 'name-asc', 
                    label: 'Card Name (A-Z)', 
                    icon: (
                      <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                        <img src="/Assets/tabler_sort-a-z.svg" alt="Sort A-Z" className="w-5 h-5" />
                      </div>
                    )
                  },
                  { 
                    value: 'name-desc', 
                    label: 'Card Name (Z-A)', 
                    icon: (
                      <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                        <img src="/Assets/tabler_sort-z-a.svg" alt="Sort Z-A" className="w-5 h-5" />
                      </div>
                    )
                  },
                  { 
                    value: 'price-low', 
                    label: 'Market price (Low to High)', 
                    icon: (
                      <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                        <img src="/Assets/Price(low).svg" alt="Price Low" className="w-5 h-5" />
                      </div>
                    )
                  },
                  { 
                    value: 'price-high', 
                    label: 'Market price (High to Low)', 
                    icon: (
                      <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                        <img src="/Assets/Price(high).svg" alt="Price High" className="w-5 h-5" />
                      </div>
                    )
                  },
                  { 
                    value: 'rarity-desc', 
                    label: 'Rarity (desc)', 
                    icon: (
                      <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                        <img src="/Assets/Rare (decs).svg" alt="Rarity Desc" className="w-5 h-5" />
                      </div>
                    )
                  },
                  { 
                    value: 'rarity-asc', 
                    label: 'Rarity (asc)', 
                    icon: (
                      <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                        <img src="/Assets/Rare (asc).svg" alt="Rarity Asc" className="w-5 h-5" />
                      </div>
                    )
                  },
                  { 
                    value: 'pokemon-number', 
                    label: 'Pokémon number', 
                    icon: (
                      <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                        <img src="/Assets/mynaui_pokeball-solid.svg" alt="Pokemon Number" className="w-5 h-5" />
                      </div>
                    )
                  }
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSortOption(option.value)}
                    className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                      sortOption === option.value 
                        ? 'bg-[rgba(96,93,236,0.15)]' 
                        : ''
                    }`}
                  >
                    <div className="flex gap-[10px] items-center">
                      {option.icon}
                      <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                        {option.label}
                      </span>
                    </div>
                    
                    {/* Checkbox */}
                    <div className="w-6 h-6 rounded-[6px] border border-[#919191] flex items-center justify-center">
                      {sortOption === option.value && (
                        <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                          <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Search Button */}
              <div className="flex flex-col gap-[12px] h-[48px] mb-[15px]">
                <button 
                  onClick={() => setShowSortModal(false)}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Filters Modal */}
        {showQuickFiltersModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowQuickFiltersModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative w-full max-w-[390px] mx-auto bg-[#2b2b2b] rounded-t-[20px] pt-[5px] px-[20px] pb-0">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>

              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllQuickFilters}
                  className="flex-1 py-2 px-4 bg-[#605DEC] text-white text-sm font-medium rounded-md hover:bg-[#5047C7] transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllQuickFilters}
                  className="flex-1 py-2 px-4 bg-[#383838] text-gray-300 text-sm font-medium rounded-md hover:bg-[#4A4A4A] hover:text-white transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
              
              {/* Filter Options */}
              <div className="flex flex-col gap-[15px] mb-[15px] max-h-96 overflow-y-auto">
                {/* Owned */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  quickFilters.owned ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Owned.svg" alt="Owned" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Owned
                    </span>
                  </div>
                  <div 
                    onClick={() => handleQuickFilterToggle('owned')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {quickFilters.owned ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Missing */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  quickFilters.missing ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Missing.svg" alt="Missing" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Missing
                    </span>
                  </div>
                  <div 
                    onClick={() => handleQuickFilterToggle('missing')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {quickFilters.missing ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Duplicates */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  quickFilters.duplicates ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[4px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Duplicates.svg" alt="Duplicates" className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-[18px] text-white leading-[21px] whitespace-nowrap">
                      Duplicates
                    </span>
                  </div>
                  <div 
                    onClick={() => handleQuickFilterToggle('duplicates')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {quickFilters.duplicates ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Wishlist */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  quickFilters.wishlist ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Wishlist.svg" alt="Wishlist" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Wishlist
                    </span>
                  </div>
                  <div 
                    onClick={() => handleQuickFilterToggle('wishlist')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {quickFilters.wishlist ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Search Button */}
              <div className="flex flex-col gap-[12px] h-[48px] mb-[15px]">
                <button 
                  onClick={applyQuickFilters}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Language Filter Modal */}
        {showLanguageModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowLanguageModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative w-full max-w-[390px] mx-auto bg-[#2b2b2b] rounded-t-[20px] pt-[5px] px-[20px] pb-0 max-h-[80vh] overflow-y-auto">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>

              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllLanguages}
                  className="flex-1 py-2 px-4 bg-[#605DEC] text-white text-sm font-medium rounded-md hover:bg-[#5047C7] transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllLanguages}
                  className="flex-1 py-2 px-4 bg-[#383838] text-gray-300 text-sm font-medium rounded-md hover:bg-[#4A4A4A] hover:text-white transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
              
              {/* Language Options */}
              <div className="flex flex-col gap-[15px] mb-[15px] max-h-96 overflow-y-auto">
                {/* English */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedLanguages.english ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white text-[14px] font-bold">EN</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      English
                    </span>
                  </div>
                  <div 
                    onClick={() => handleLanguageToggle('english')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedLanguages.english ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Japanese */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedLanguages.japanese ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white text-[14px] font-bold">JP</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Japanese
                    </span>
                  </div>
                  <div 
                    onClick={() => handleLanguageToggle('japanese')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedLanguages.japanese ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Chinese */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedLanguages.chinese ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white text-[14px] font-bold">ZH</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Chinese
                    </span>
                  </div>
                  <div 
                    onClick={() => handleLanguageToggle('chinese')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedLanguages.chinese ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Korean */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedLanguages.korean ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white text-[14px] font-bold">KO</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Korean
                    </span>
                  </div>
                  <div 
                    onClick={() => handleLanguageToggle('korean')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedLanguages.korean ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* German */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedLanguages.german ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white text-[14px] font-bold">DE</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      German
                    </span>
                  </div>
                  <div 
                    onClick={() => handleLanguageToggle('german')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedLanguages.german ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Spanish */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedLanguages.spanish ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white text-[14px] font-bold">ES</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Spanish
                    </span>
                  </div>
                  <div 
                    onClick={() => handleLanguageToggle('spanish')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedLanguages.spanish ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* French */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedLanguages.french ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white text-[14px] font-bold">FR</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      French
                    </span>
                  </div>
                  <div 
                    onClick={() => handleLanguageToggle('french')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedLanguages.french ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Italian */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedLanguages.italian ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white text-[14px] font-bold">IT</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Italian
                    </span>
                  </div>
                  <div 
                    onClick={() => handleLanguageToggle('italian')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedLanguages.italian ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Search Button */}
              <div className="flex flex-col gap-[12px] h-[48px] mb-[15px]">
                <button 
                  onClick={applyLanguageFilters}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Condition Filter Modal */}
        {showConditionModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowConditionModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative w-full max-w-[390px] mx-auto bg-[#2b2b2b] rounded-t-[20px] pt-[5px] px-[20px] pb-0 max-h-[80vh] overflow-y-auto">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>

              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllConditions}
                  className="flex-1 py-2 px-4 bg-[#605DEC] text-white text-sm font-medium rounded-md hover:bg-[#5047C7] transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllConditions}
                  className="flex-1 py-2 px-4 bg-[#383838] text-gray-300 text-sm font-medium rounded-md hover:bg-[#4A4A4A] hover:text-white transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
              
              {/* Condition Options */}
              <div className="flex flex-col gap-[15px] mb-[15px] max-h-96 overflow-y-auto">
                {/* Mint */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedConditions.mint ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Mint.svg" alt="Mint" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Mint
                    </span>
                  </div>
                  <div 
                    onClick={() => handleConditionToggle('mint')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedConditions.mint ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Near Mint */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedConditions.nearMint ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/NearMint.svg" alt="Near Mint" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Near Mint
                    </span>
                  </div>
                  <div 
                    onClick={() => handleConditionToggle('nearMint')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedConditions.nearMint ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Lightly Played */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedConditions.lightlyPlayed ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/LightlyPlayed.svg" alt="Lightly Played" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Lightly Played
                    </span>
                  </div>
                  <div 
                    onClick={() => handleConditionToggle('lightlyPlayed')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedConditions.lightlyPlayed ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Moderately Played */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedConditions.moderatelyPlayed ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/ModPlay.svg" alt="Moderately Played" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Moderately Played
                    </span>
                  </div>
                  <div 
                    onClick={() => handleConditionToggle('moderatelyPlayed')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedConditions.moderatelyPlayed ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Heavily Played */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedConditions.heavilyPlayed ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/HeavyPlay.svg" alt="Heavily Played" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Heavily Played
                    </span>
                  </div>
                  <div 
                    onClick={() => handleConditionToggle('heavilyPlayed')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedConditions.heavilyPlayed ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Damaged */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedConditions.damaged ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Damaged.svg" alt="Damaged" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Damaged
                    </span>
                  </div>
                  <div 
                    onClick={() => handleConditionToggle('damaged')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedConditions.damaged ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Search Button */}
              <div className="flex flex-col gap-[12px] h-[48px] mb-[15px]">
                <button 
                  onClick={applyConditionFilters}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Products Filter Modal */}
        {showProductsModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowProductsModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative w-full max-w-[390px] mx-auto bg-[#2b2b2b] rounded-t-[20px] pt-[5px] px-[20px] pb-0 max-h-[80vh] overflow-y-auto">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>

              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllProducts}
                  className="flex-1 py-2 px-4 bg-[#605DEC] text-white text-sm font-medium rounded-md hover:bg-[#5047C7] transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllProducts}
                  className="flex-1 py-2 px-4 bg-[#383838] text-gray-300 text-sm font-medium rounded-md hover:bg-[#4A4A4A] hover:text-white transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
              
              {/* Product Type Options */}
              <div className="flex flex-col gap-[15px] mb-[15px] max-h-96 overflow-y-auto">
                {/* Cards Only */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedProducts.cardsOnly ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/CardsOnly.svg" alt="Cards" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Cards
                    </span>
                  </div>
                  <div 
                    onClick={() => handleProductsToggle('cardsOnly')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedProducts.cardsOnly ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Sealed Only */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedProducts.sealedOnly ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/SealedProducts.svg" alt="Sealed" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Sealed
                    </span>
                  </div>
                  <div 
                    onClick={() => handleProductsToggle('sealedOnly')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedProducts.sealedOnly ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Search Button */}
              <div className="flex flex-col gap-[12px] h-[48px] mb-[15px]">
                <button 
                  onClick={applyProductsFilters}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Energy Filter Modal */}
        {showEnergyModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowEnergyModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative w-full max-w-[390px] mx-auto bg-[#2b2b2b] rounded-t-[20px] pt-[5px] px-[20px] pb-0 max-h-[80vh] overflow-y-auto">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>

              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllEnergies}
                  className="flex-1 py-2 px-4 bg-[#605DEC] text-white text-sm font-medium rounded-md hover:bg-[#5047C7] transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllEnergies}
                  className="flex-1 py-2 px-4 bg-[#383838] text-gray-300 text-sm font-medium rounded-md hover:bg-[#4A4A4A] hover:text-white transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
              
              {/* Energy Type Options */}
              <div className="flex flex-col gap-[15px] mb-[15px] max-h-96 overflow-y-auto">
                {/* Colorless */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.colorless ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Colorless.svg" alt="Colorless" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Colorless
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('colorless')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.colorless ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Darkness */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.darkness ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Darkness.svg" alt="Darkness" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Darkness
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('darkness')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.darkness ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Dragon */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.dragon ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Dragon.svg" alt="Dragon" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Dragon
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('dragon')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.dragon ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Electric */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.electric ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Electric.svg" alt="Electric" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Electric
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('electric')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.electric ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Fairy */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.fairy ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Fairy.svg" alt="Fairy" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Fairy
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('fairy')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.fairy ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Fighting */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.fighting ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Fighting.svg" alt="Fighting" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Fighting
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('fighting')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.fighting ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Fire */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.fire ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Fire.svg" alt="Fire" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Fire
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('fire')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.fire ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Grass */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.grass ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Grass.svg" alt="Grass" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Grass
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('grass')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.grass ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Metal */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.metal ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Metal.svg" alt="Metal" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Metal
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('metal')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.metal ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Psychic */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.psychic ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Psychic.svg" alt="Psychic" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Psychic
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('psychic')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.psychic ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Water */}
                <div className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors ${
                  selectedEnergies.water ? 'bg-[rgba(96,93,236,0.15)]' : ''
                }`}>
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Energies/Water.svg" alt="Water" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">
                      Water
                    </span>
                  </div>
                  <div 
                    onClick={() => handleEnergyToggle('water')}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedEnergies.water ? (
                      <div className="w-6 h-6 bg-[#6865e7] rounded-[6px] flex items-center justify-center">
                        <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Search Button */}
              <div className="flex flex-col gap-[12px] h-[48px] mb-[15px]">
                <button 
                  onClick={applyEnergyFilters}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Type Filter Modal */}
        {showTypeModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowTypeModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-[#2B2B2B] rounded-t-[20px] w-full max-w-[390px] mx-auto pt-[5px] transform transition-transform duration-300 ease-out">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>

              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mx-4 mb-4">
                <button
                  onClick={selectAllTypes}
                  className="flex-1 py-2 px-4 bg-[#605DEC] text-white text-sm font-medium rounded-md hover:bg-[#5047C7] transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllTypes}
                  className="flex-1 py-2 px-4 bg-[#383838] text-gray-300 text-sm font-medium rounded-md hover:bg-[#4A4A4A] hover:text-white transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
              
              {/* Type Options */}
              <div className="flex flex-col gap-[15px] mb-[15px] px-4 max-h-96 overflow-y-auto">
                {/* Pokemon */}
                <div 
                  onClick={() => handleTypeToggle('pokemon')}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img src="/Assets/Pokemon_type.svg" alt="Pokemon" className="w-6 h-6" />
                    <span className="text-white text-base font-medium">Pokemon</span>
                  </div>
                  <div 
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedTypes.pokemon ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Trainer */}
                <div 
                  onClick={() => handleTypeToggle('trainer')}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img src="/Assets/Trainer_type.svg" alt="Trainer" className="w-6 h-6" />
                    <span className="text-white text-base font-medium">Trainer</span>
                  </div>
                  <div 
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedTypes.trainer ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Energy */}
                <div 
                  onClick={() => handleTypeToggle('energy')}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img src="/Assets/Energy_type.svg" alt="Energy" className="w-6 h-6" />
                    <span className="text-white text-base font-medium">Energy</span>
                  </div>
                  <div 
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                  >
                    {selectedTypes.energy ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="px-4 pb-4">
                <button 
                  onClick={applyTypeFilters}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Rarity Filter Modal */}
        {showRarityModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowRarityModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-[#2B2B2B] rounded-t-[20px] w-full max-w-[390px] mx-auto pt-[5px] transform transition-transform duration-300 ease-out">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>
              
              {/* Segmented Toggle */}
              <div className="flex bg-[#383838] rounded-lg p-1 mx-4 mb-4">
                <button
                  onClick={() => handleRarityTypeToggle('international')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    rarityType === 'international'
                      ? 'bg-white text-black'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  International
                </button>
                <button
                  onClick={() => handleRarityTypeToggle('japanese')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    rarityType === 'japanese'
                      ? 'bg-white text-black'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Japanese
                </button>
              </div>

              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mx-4 mb-4">
                <button
                  onClick={selectAllRarities}
                  className="flex-1 py-2 px-4 bg-[#605DEC] text-white text-sm font-medium rounded-md hover:bg-[#5047C7] transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllRarities}
                  className="flex-1 py-2 px-4 bg-[#383838] text-gray-300 text-sm font-medium rounded-md hover:bg-[#4A4A4A] hover:text-white transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
              
              {/* Rarity Options */}
              <div className="flex flex-col gap-[15px] mb-[15px] px-4 max-h-96 overflow-y-auto">
                {/* International Rarities */}
                {rarityType === 'international' && (
                  <>
                    {/* Common */}
                    <div 
                      onClick={() => handleRarityToggle('common')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/Common.svg" alt="Common" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Common</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.common ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Uncommon */}
                    <div 
                      onClick={() => handleRarityToggle('uncommon')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/Uncommon.svg" alt="Uncommon" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Uncommon</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.uncommon ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Rare */}
                    <div 
                      onClick={() => handleRarityToggle('rare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/Rare.svg" alt="Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.rare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Double Rare */}
                    <div 
                      onClick={() => handleRarityToggle('doubleRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/Double Rare.svg" alt="Double Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Double Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.doubleRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Ace Spec Rare */}
                    <div 
                      onClick={() => handleRarityToggle('aceSpecRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/ACE.svg" alt="Ace Spec Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Ace Spec Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.aceSpecRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Illustration Rare */}
                    <div 
                      onClick={() => handleRarityToggle('illustrationRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/IR.svg" alt="Illustration Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Illustration Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.illustrationRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Ultra Rare */}
                    <div 
                      onClick={() => handleRarityToggle('ultraRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/Ultra Rare.svg" alt="Ultra Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Ultra Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.ultraRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Special Illustration Rare */}
                    <div 
                      onClick={() => handleRarityToggle('specialIllustrationRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/SIR.svg" alt="Special Illustration Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Special Illustration Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.specialIllustrationRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Hyper Rare */}
                    <div 
                      onClick={() => handleRarityToggle('hyperRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/Hyper Rare.svg" alt="Hyper Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Hyper Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.hyperRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Shiny Rare */}
                    <div 
                      onClick={() => handleRarityToggle('shinyRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/Shiny Rare.svg" alt="Shiny Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Shiny Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.shinyRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Shiny Ultra Rare */}
                    <div 
                      onClick={() => handleRarityToggle('shinyUltraRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/Shiny Ultra Rare.svg" alt="Shiny Ultra Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Shiny Ultra Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.shinyUltraRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Black Star Promo */}
                    <div 
                      onClick={() => handleRarityToggle('blackStarPromo')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/International/Promo.svg" alt="Black Star Promo" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Black Star Promo</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.blackStarPromo ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Japanese Rarities */}
                {rarityType === 'japanese' && (
                  <>
                    {/* Common */}
                    <div 
                      onClick={() => handleRarityToggle('common')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Common.svg" alt="Common" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Common</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.common ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Uncommon */}
                    <div 
                      onClick={() => handleRarityToggle('uncommon')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Uncommon.svg" alt="Uncommon" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Uncommon</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.uncommon ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Rare */}
                    <div 
                      onClick={() => handleRarityToggle('rare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Rare.svg" alt="Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.rare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Double Rare */}
                    <div 
                      onClick={() => handleRarityToggle('doubleRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Double Rare.svg" alt="Double Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Double Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.doubleRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Ace Spec Rare */}
                    <div 
                      onClick={() => handleRarityToggle('aceSpecRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/ACE.svg" alt="Ace Spec Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Ace Spec Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.aceSpecRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Art Rare */}
                    <div 
                      onClick={() => handleRarityToggle('artRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Art Rare.svg" alt="Art Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Art Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.artRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Super Rare */}
                    <div 
                      onClick={() => handleRarityToggle('superRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Super Rare.svg" alt="Super Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Super Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.superRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Special Art Rare */}
                    <div 
                      onClick={() => handleRarityToggle('specialArtRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Special Art Rare.svg" alt="Special Art Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Special Art Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.specialArtRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Ultra Rare */}
                    <div 
                      onClick={() => handleRarityToggle('ultraRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Ultra Rare.svg" alt="Ultra Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Ultra Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.ultraRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Shiny Rare */}
                    <div 
                      onClick={() => handleRarityToggle('shinyRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Shiny Rare.svg" alt="Shiny Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Shiny Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.shinyRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Shiny Super Rare */}
                    <div 
                      onClick={() => handleRarityToggle('shinySuperRare')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Shiny Ultra Rare.svg" alt="Shiny Super Rare" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Shiny Super Rare</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.shinySuperRare ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Black Star Promo */}
                    <div 
                      onClick={() => handleRarityToggle('blackStarPromo')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src="/Assets/Rarity/Japanese/Promo.svg" alt="Black Star Promo" className="w-6 h-6" />
                        <span className="text-white text-base font-medium">Black Star Promo</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer"
                      >
                        {selectedRarities.blackStarPromo ? (
                          <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-[#605DEC] rounded-[6px]"></div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Search Button */}
              <div className="px-4 pb-4">
                <button 
                  onClick={applyRarityFilters}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Variant Filter Modal */}
        {showVariantModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowVariantModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-[#2B2B2B] rounded-t-[20px] w-full max-w-[390px] mx-auto pt-[5px] transform transition-transform duration-300 ease-out">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>

              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mx-4 mb-4">
                <button
                  onClick={selectAllVariants}
                  className="flex-1 py-2 px-4 bg-[#605DEC] text-white text-sm font-medium rounded-md hover:bg-[#5047C7] transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllVariants}
                  className="flex-1 py-2 px-4 bg-[#383838] text-gray-300 text-sm font-medium rounded-md hover:bg-[#4A4A4A] hover:text-white transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
              
              {/* Variant Options */}
              <div className="flex flex-col gap-[15px] mb-[15px] px-4 max-h-96 overflow-y-auto">
                {/* Normal */}
                <div 
                  onClick={() => handleVariantToggle('normal')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedVariants.normal ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Var_Norm.svg" alt="Normal" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">Normal</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedVariants.normal ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Holo */}
                <div 
                  onClick={() => handleVariantToggle('holo')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedVariants.holo ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Var_Holo.svg" alt="Holo" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">Holo</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedVariants.holo ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Reverse Holo */}
                <div 
                  onClick={() => handleVariantToggle('reverseHolo')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedVariants.reverseHolo ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Var_Reverse Holo.svg" alt="Reverse Holo" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">Reverse Holo</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedVariants.reverseHolo ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* 1st Edition */}
                <div 
                  onClick={() => handleVariantToggle('firstEdition')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedVariants.firstEdition ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Var_1sted.svg" alt="1st Edition" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">1st Edition</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedVariants.firstEdition ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="px-4 pb-4">
                <button 
                  onClick={applyVariantFilters}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Regulation Modal */}
        {showRegulationModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowRegulationModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-[#2B2B2B] rounded-t-[20px] w-full max-w-[390px] mx-auto pt-[5px] transform transition-transform duration-300 ease-out">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>

              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mx-4 mb-4">
                <button
                  onClick={selectAllRegulations}
                  className="flex-1 py-2 px-4 bg-[#605DEC] text-white text-sm font-medium rounded-md hover:bg-[#5047C7] transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllRegulations}
                  className="flex-1 py-2 px-4 bg-[#383838] text-gray-300 text-sm font-medium rounded-md hover:bg-[#4A4A4A] hover:text-white transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
              
              {/* Regulation Options */}
              <div className="flex flex-col gap-[15px] mb-[15px] px-4 max-h-96 overflow-y-auto">
                {/* A */}
                <div 
                  onClick={() => handleRegulationToggle('a')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedRegulations.a ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Regulation/A.svg" alt="A" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">A</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedRegulations.a ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* B */}
                <div 
                  onClick={() => handleRegulationToggle('b')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedRegulations.b ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Regulation/B.svg" alt="B" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">B</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedRegulations.b ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* C */}
                <div 
                  onClick={() => handleRegulationToggle('c')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedRegulations.c ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Regulation/C.svg" alt="C" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">C</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedRegulations.c ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* D */}
                <div 
                  onClick={() => handleRegulationToggle('d')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedRegulations.d ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Regulation/D.svg" alt="D" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">D</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedRegulations.d ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* E */}
                <div 
                  onClick={() => handleRegulationToggle('e')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedRegulations.e ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Regulation/E.svg" alt="E" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">E</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedRegulations.e ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* F */}
                <div 
                  onClick={() => handleRegulationToggle('f')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedRegulations.f ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Regulation/F.svg" alt="F" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">F</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedRegulations.f ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* G */}
                <div 
                  onClick={() => handleRegulationToggle('g')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedRegulations.g ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Regulation/G.svg" alt="G" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">G</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedRegulations.g ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* H */}
                <div 
                  onClick={() => handleRegulationToggle('h')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedRegulations.h ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Regulation/H.svg" alt="H" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">H</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedRegulations.h ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* I */}
                <div 
                  onClick={() => handleRegulationToggle('i')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedRegulations.i ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <img src="/Assets/Regulation/I.svg" alt="I" className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">I</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedRegulations.i ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="px-4 pb-4">
                <button 
                  onClick={applyRegulationFilters}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Format Modal */}
        {showFormatModal && (
          <div className="fixed inset-0 z-[100] flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowFormatModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-[#2B2B2B] rounded-t-[20px] w-full max-w-[390px] mx-auto pt-[5px] transform transition-transform duration-300 ease-out">
              {/* Grabber Handle */}
              <div 
                className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px] cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              ></div>

              {/* Select/Deselect All Buttons */}
              <div className="flex gap-2 mx-4 mb-4">
                <button
                  onClick={selectAllFormats}
                  className="flex-1 py-2 px-4 bg-[#605DEC] text-white text-sm font-medium rounded-md hover:bg-[#5047C7] transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllFormats}
                  className="flex-1 py-2 px-4 bg-[#383838] text-gray-300 text-sm font-medium rounded-md hover:bg-[#4A4A4A] hover:text-white transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
              
              {/* Format Options */}
              <div className="flex flex-col gap-[15px] mb-[15px] px-4">
                {/* Unlimited */}
                <div 
                  onClick={() => handleFormatToggle('unlimited')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedFormats.unlimited ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white font-semibold text-lg">U</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">Unlimited</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedFormats.unlimited ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Expanded */}
                <div 
                  onClick={() => handleFormatToggle('expanded')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedFormats.expanded ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white font-semibold text-lg">E</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">Expanded</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedFormats.expanded ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>

                {/* Standard */}
                <div 
                  onClick={() => handleFormatToggle('standard')}
                  className={`flex h-[42px] items-center justify-between px-[10px] py-[5px] rounded-[4px] transition-colors cursor-pointer ${
                    selectedFormats.standard ? 'bg-[rgba(96,93,236,0.15)]' : ''
                  }`}
                >
                  <div className="flex gap-[10px] items-center">
                    <div className="w-8 h-8 bg-black rounded-[2px] flex items-center justify-center p-[2px]">
                      <span className="text-white font-semibold text-lg">S</span>
                    </div>
                    <span className="font-bold text-[18px] text-white leading-[28px] whitespace-nowrap">Standard</span>
                  </div>
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer">
                    {selectedFormats.standard ? (
                      <div className="w-6 h-6 bg-[#605DEC] rounded-[6px] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#919191] rounded-[6px]"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="px-4 pb-4">
                <button 
                  onClick={applyFormatFilters}
                  className="bg-white h-[48px] flex items-center justify-center px-8 py-4 rounded-[4px] shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#605dec] w-full hover:opacity-90 transition-opacity"
                >
                  <span className="font-bold text-[#7775f4] text-[16px] leading-[24px] text-center whitespace-nowrap">
                    Search
                  </span>
                </button>
              </div>
              
              {/* Home Indicator */}
              <div className="h-[34px] flex items-end justify-center pb-2">
                <div className="w-[139px] h-[5px] bg-black rounded-[100px] opacity-0"></div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Bottom Navigation */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[390px] h-[73px]">
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

            {/* Navigation Items */}
            <div className="relative z-10 flex justify-between items-center h-full px-8">
              {[
                { 
                  id: 'home', 
                  label: 'Home',
                  icon: activeTab === 'home' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.04 6.82018L14.28 2.79018C12.71 1.69018 10.3 1.75018 8.78999 2.92018L3.77999 6.83018C2.77999 7.61018 1.98999 9.21018 1.98999 10.4702V17.3702C1.98999 19.9202 4.05999 22.0002 6.60999 22.0002H17.39C19.94 22.0002 22.01 19.9302 22.01 17.3802V10.6002C22.01 9.25018 21.14 7.59018 20.04 6.82018ZM12.75 18.0002C12.75 18.4102 12.41 18.7502 12 18.7502C11.59 18.7502 11.25 18.4102 11.25 18.0002V15.0002C11.25 14.5902 11.59 14.2502 12 14.2502C12.41 14.2502 12.75 14.5902 12.75 15.0002V18.0002Z" fill="#6865E7"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.04 6.82018L14.28 2.79018C12.71 1.69018 10.3 1.75018 8.78999 2.92018L3.77999 6.83018C2.77999 7.61018 1.98999 9.21018 1.98999 10.4702V17.3702C1.98999 19.9202 4.05999 22.0002 6.60999 22.0002H17.39C19.94 22.0002 22.01 19.9302 22.01 17.3802V10.6002C22.01 9.25018 21.14 7.59018 20.04 6.82018ZM12.75 18.0002C12.75 18.4102 12.41 18.7502 12 18.7502C11.59 18.7502 11.25 18.4102 11.25 18.0002V15.0002C11.25 14.5902 11.59 14.2502 12 14.2502C12.41 14.2502 12.75 14.5902 12.75 15.0002V18.0002Z" fill="none" stroke="#8F8F94" strokeWidth="2"/>
                    </svg>
                  )
                },
                  { 
                    id: 'collection', 
                    label: 'Collection',
                    icon: activeTab === 'collection' ? (
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
                          <path d="M11.555 1.469C11.6113 1.26096 11.7477 1.0837 11.9344 0.976052C12.1211 0.868406 12.3428 0.839157 12.551 0.894714L22.871 3.65814C23.0797 3.71364 23.2578 3.84974 23.3661 4.03652C23.4745 4.2233 23.5042 4.44546 23.4488 4.65414L19.4888 19.4279C19.4325 19.6363 19.2959 19.8138 19.1088 19.9215C18.9217 20.0292 18.6995 20.0582 18.491 20.0021L8.17104 17.2387C7.96268 17.1828 7.78501 17.0466 7.67702 16.8599C7.56903 16.6731 7.53954 16.4512 7.59504 16.2427L11.555 1.469Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10.8042 4.3457L1.7939 6.76113C1.58555 6.81699 1.40787 6.95325 1.29988 7.13999C1.19189 7.32672 1.16241 7.54868 1.2179 7.75713L5.17447 22.5308C5.23069 22.7393 5.36736 22.9168 5.55445 23.0245C5.74154 23.1322 5.96373 23.1612 6.17219 23.1051L11.3322 21.7234" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_248_3247">
                            <rect width="24" height="24" fill="white" transform="translate(0.333313)"/>
                          </clipPath>
                        </defs>
                      </svg>
                    )
                  },
                  { 
                    id: 'marketplace', 
                    label: 'Marketplace',
                    icon: activeTab === 'marketplace' ? (
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
                    )
                  },
                  { 
                    id: 'profile', 
                    label: 'Profile',
                    icon: activeTab === 'profile' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#6865E7"/>
                        <path d="M11.9999 14.5C6.98991 14.5 2.90991 17.86 2.90991 22C2.90991 22.28 3.12991 22.5 3.40991 22.5H20.5899C20.8699 22.5 21.0899 22.28 21.0899 22C21.0899 17.86 17.0099 14.5 11.9999 14.5Z" fill="#6865E7"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26003 15 3.41003 18.13 3.41003 22" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )
                  }
              ].map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Navigate to different screens based on tab
                    if (tab.id === 'home') {
                      setShowSearchResults(false);
                    } else if (tab.id === 'collection') {
                      setShowSearchResults(false);
                      // Add collection screen logic here
                    } else if (tab.id === 'marketplace') {
                      setShowSearchResults(false);
                      // Add marketplace screen logic here
                    } else if (tab.id === 'profile') {
                      setShowSearchResults(false);
                      // Add profile screen logic here
                    }
                  }}
                  className={`relative flex flex-col gap-1 px-2 py-3 rounded-xl transition-all duration-300 group ${
                    activeTab === tab.id ? 'items-center' : 'items-center justify-center h-full'
                  }`}
                >
                  {/* Active Indicator Background */}
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-[#4E4BC5]/20 rounded-xl blur-sm"></div>
                  )}

                  {/* Icon */}
                  <div className={`relative z-10 transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'transform -translate-y-1 icon-bounce' 
                      : 'group-hover:scale-105'
                  }`}>
                    {tab.icon}
                  </div>

                  {/* Label */}
                  <div className={`relative z-10 text-xs font-medium transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'text-white opacity-100 transform translate-y-0 label-slide' 
                      : 'text-[#8F8F94] opacity-0 transform translate-y-2 group-hover:opacity-70 group-hover:translate-y-0'
                  }`}>
                    {tab.label}
                  </div>
                </button>
              ))}
            </div>

              {/* Sliding Indicator */}
              {activeTab && (
                <div className="absolute bottom-0 left-0 transition-all duration-300 ease-out"
                     style={{
                       left: activeTab === 'home' ? '28px' : 
                             activeTab === 'collection' ? '110px' :
                             activeTab === 'marketplace' ? '212px' : '302px',
                       transform: indicatorAnimation === 'exit' ? 'translateX(-100vw)' : 
                                indicatorAnimation === 'enter' ? 'translateX(0)' :
                                showSearchResults ? 'translateX(-100vw)' : 'translateX(0)'
                     }}>
                  <svg width="64" height="8" viewBox="0 0 64 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M59.9277 3.92798C62.1768 3.92798 64 5.75121 64 8.00024H0C0 5.75121 1.82324 3.92798 4.07227 3.92798H25L31.1387 0.802979C31.9937 0.367721 33.0063 0.367721 33.8613 0.802979L40 3.92798H59.9277Z" fill="#6865E7"/>
                  </svg>
                </div>
              )}

          </div>
        </div>

          {/* Add Card Modal - Global modal accessible from all screens */}
          {showAddCardModal && cardToAdd && (
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-end" onClick={closeAllDropdowns}>
              <div className="w-full bg-[#2B2B2B] rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
              {/* Grabber Handle */}
              <div className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px]"></div>
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white text-lg font-semibold">{cardToAdd.name}</h2>
                  <p className="text-gray-400 text-sm">{cardToAdd.set?.name || 'Unknown Set'}</p>
                  <p className="text-gray-400 text-xs">{cardToAdd.number || '?'}/{cardToAdd.printed_total || '?'}</p>
                </div>
                <button 
                  onClick={handleCloseAddCardModal}
                  className="w-6 h-6 text-gray-400 hover:text-white"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Add to Section */}
                <div>
                  <div className="relative">
                    <div className="bg-[#383838] border border-[#4A4A4A] rounded-lg p-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">Add to:</span>
                        <div className="relative">
                          <button
                            onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
                            className="bg-transparent text-white text-sm font-medium cursor-pointer focus:outline-none pr-6 min-w-[200px] text-right flex items-center justify-end gap-2"
                          >
                            <span>{selectedCollection}</span>
                            <svg className={`w-4 h-4 text-white transition-transform ${showCollectionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {/* Dropdown Menu */}
                          {showCollectionDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-full min-w-[200px] bg-[#383838] border border-[#4A4A4A] rounded-lg shadow-lg z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setSelectedCollection('My Personal Collection')
                                    setShowCollectionDropdown(false)
                                  }}
                                  className="w-full text-left px-3 py-2 text-white text-sm hover:bg-[#4A4A4A] transition-colors"
                                >
                                  My Personal Collection
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCollection('Pokemon Collection')
                                    setShowCollectionDropdown(false)
                                  }}
                                  className="w-full text-left px-3 py-2 text-white text-sm hover:bg-[#4A4A4A] transition-colors"
                                >
                                  Pokemon Collection
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCollection('Favorites')
                                    setShowCollectionDropdown(false)
                                  }}
                                  className="w-full text-left px-3 py-2 text-white text-sm hover:bg-[#4A4A4A] transition-colors"
                                >
                                  Favorites
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div>
                  <div className="relative bg-[#383838] rounded-lg p-4 shadow-lg" style={{ backgroundImage: 'url(/Assets/Stepper with title.svg)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
                    <div className="flex items-center justify-between h-12">
                      {/* Minus Button */}
                      <button 
                        onClick={() => setQuantity(Math.max(0, quantity - 1))}
                        className="w-12 h-12 bg-[#1C1C1C] border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-600 transition-colors shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      {/* Quantity Display */}
                      <div className="flex-1 text-center">
                        <span className="text-white text-2xl font-bold">{quantity}</span>
                      </div>
                      
                      {/* Plus Button */}
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 bg-[#605DEC] border border-[#605DEC] rounded-lg flex items-center justify-center text-white hover:bg-[#4F46E5] transition-colors shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Variant and Condition */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">Variant</label>
                    <div className="relative">
                      <button
                        onClick={() => setShowVariantDropdown(!showVariantDropdown)}
                        className="w-full bg-[#383838] border border-[#4A4A4A] rounded-lg px-3 py-3 text-white text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent flex items-center justify-between"
                      >
                        <span>{variant}</span>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${showVariantDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showVariantDropdown && cardToAdd && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#383838] border border-[#4A4A4A] rounded-lg shadow-lg z-50">
                          <div className="py-1">
                            {(() => {
                              const availableVariants = getAvailableVariants(cardToAdd)
                              console.log('Rendering dropdown with variants:', availableVariants)
                              return availableVariants.map((variantOption) => (
                                <button
                                  key={variantOption}
                                  onClick={() => {
                                    setVariant(variantOption)
                                    setShowVariantDropdown(false)
                                  }}
                                  className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                                >
                                  {variantOption}
                                </button>
                              ))
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">Condition</label>
                    <div className="relative">
                      <button
                        onClick={() => !isGraded && setShowConditionDropdown(!showConditionDropdown)}
                        disabled={isGraded}
                        className={`w-full border rounded-lg px-3 py-3 text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent flex items-center justify-between ${
                          isGraded 
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600' 
                            : 'bg-[#383838] text-white border-[#4A4A4A]'
                        }`}
                      >
                        <span>{condition}</span>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${showConditionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showConditionDropdown && !isGraded && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#383838] border border-[#4A4A4A] rounded-lg shadow-lg z-50">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setCondition('Mint')
                                setShowConditionDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                            >
                              Mint
                            </button>
                            <button
                              onClick={() => {
                                setCondition('Near Mint')
                                setShowConditionDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                            >
                              Near Mint
                            </button>
                            <button
                              onClick={() => {
                                setCondition('Excellent')
                                setShowConditionDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                            >
                              Excellent
                            </button>
                            <button
                              onClick={() => {
                                setCondition('Good')
                                setShowConditionDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                            >
                              Good
                            </button>
                            <button
                              onClick={() => {
                                setCondition('Fair')
                                setShowConditionDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                            >
                              Fair
                            </button>
                            <button
                              onClick={() => {
                                setCondition('Poor')
                                setShowConditionDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                            >
                              Poor
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Graded Card Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsGraded(!isGraded)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      isGraded ? 'bg-[#605DEC]' : 'bg-[#1C1C1C] border border-gray-600'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      isGraded ? 'translate-x-7' : 'translate-x-1'
                    }`}></div>
                  </button>
                  <span className="text-white text-sm">Graded card</span>
                </div>

                {/* Grading Options (shown when graded) */}
                {isGraded && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">Grading Service</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowGradingServiceDropdown(!showGradingServiceDropdown)}
                          className="w-full bg-[#383838] border border-[#4A4A4A] rounded-lg px-3 py-3 text-white text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent flex items-center justify-between"
                        >
                          <span>{gradingService}</span>
                          <svg className={`w-5 h-5 text-gray-400 transition-transform ${showGradingServiceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showGradingServiceDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#383838] border border-[#4A4A4A] rounded-lg shadow-lg z-50">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setGradingService('PSA')
                                  const psaGrades = getGradesForService('PSA')
                                  setGrade(psaGrades[0]) // Set to first grade
                                  setShowGradingServiceDropdown(false)
                                }}
                                className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                              >
                                PSA
                              </button>
                              <button
                                onClick={() => {
                                  setGradingService('BGS')
                                  const bgsGrades = getGradesForService('BGS')
                                  setGrade(bgsGrades[0]) // Set to first grade
                                  setShowGradingServiceDropdown(false)
                                }}
                                className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                              >
                                BGS
                              </button>
                              <button
                                onClick={() => {
                                  setGradingService('CGC')
                                  const cgcGrades = getGradesForService('CGC')
                                  setGrade(cgcGrades[0]) // Set to first grade
                                  setShowGradingServiceDropdown(false)
                                }}
                                className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                              >
                                CGC
                              </button>
                              <button
                                onClick={() => {
                                  setGradingService('SGC')
                                  const sgcGrades = getGradesForService('SGC')
                                  setGrade(sgcGrades[0]) // Set to first grade
                                  setShowGradingServiceDropdown(false)
                                }}
                                className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                              >
                                SGC
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">Grade</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowGradeDropdown(!showGradeDropdown)}
                          className="w-full bg-[#383838] border border-[#4A4A4A] rounded-lg px-3 py-3 text-white text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent flex items-center justify-between"
                        >
                          <span>{grade}</span>
                          <svg className={`w-5 h-5 text-gray-400 transition-transform ${showGradeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showGradeDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#383838] border border-[#4A4A4A] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                            <div className="py-1">
                              {getGradesForService(gradingService).map((gradeOption) => (
                                <button
                                  key={gradeOption}
                                  onClick={() => {
                                    setGrade(gradeOption)
                                    setShowGradeDropdown(false)
                                  }}
                                  className="w-full text-left px-3 py-2 text-white text-base hover:bg-[#4A4A4A] transition-colors"
                                >
                                  {gradeOption}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Comment */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Add Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-[#383838] border border-[#4A4A4A] rounded-lg px-3 py-3 text-white text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8">
                <button 
                  onClick={handleAddCard}
                  className="w-full bg-[#605DEC] hover:bg-[#4F46E5] text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }


  // Edit Modal
  if (showEditModal) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-end">
        <div className="w-full bg-[#2B2B2B] rounded-t-2xl p-4">
          {/* Grabber Handle */}
          <div className="w-9 h-[5px] bg-[rgba(199,199,199,0.4)] rounded-[2.5px] mx-auto mb-[15px]"></div>
          
          <h2 className="text-white text-lg font-semibold mb-4 text-center">Edit Scan Settings</h2>
          
          {/* Folder Selection */}
          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-2 block">Add to Folder</label>
            <select 
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full bg-[#383838] border border-[#4A4A4A] rounded-lg px-3 py-2 text-white"
            >
              <option value="Collection">Collection</option>
              <option value="Trade Binder">Trade Binder</option>
              <option value="For Sale">For Sale</option>
              <option value="Personal Collection">Personal Collection</option>
            </select>
          </div>

          {/* Condition Selection */}
          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-2 block">Condition</label>
            <select 
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full bg-[#383838] border border-[#4A4A4A] rounded-lg px-3 py-2 text-white"
            >
              <option value="Mint">Mint</option>
              <option value="Near Mint">Near Mint</option>
              <option value="Lightly Played">Lightly Played</option>
              <option value="Moderately Played">Moderately Played</option>
              <option value="Heavily Played">Heavily Played</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={() => setShowEditModal(false)}
              className="flex-1 bg-[#383838] text-white py-3 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                setShowEditModal(false)
                setShowScanner(false)
                alert(`Card will be added to ${selectedFolder} with ${selectedCondition} condition`)
              }}
              className="flex-1 bg-[#605DEC] text-white py-3 rounded-lg font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }


  // Login/Signup Modal
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
            onClick={() => setCurrentScreen('splash')}
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
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                currentScreen === 'login' 
                  ? 'bg-accent text-primary shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setCurrentScreen('signup')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                currentScreen === 'signup' 
                  ? 'bg-accent text-primary shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-6 pb-6 pt-4 flex-1 flex flex-col ">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {currentScreen === 'login' ? 'Sign in to your account' : 'Sign up for an account'}
            </h2>

            {currentScreen === 'login' ? (
              // Login Form
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username or email address
                  </label>
                  <input
                    type="text"
                    placeholder="Username/email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-gray-800"
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
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={() => setCurrentScreen('forgot-password')}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button className="w-full bg-primary hover:bg-primary/90 text-accent font-semibold py-3 px-4 rounded-lg transition-all duration-200">
                  Sign in
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-accent text-gray-500">Or</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <button 
                    onClick={handleAppleAuth}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2.032-.169-3.951 1.144-5.12 1.144z"/>
                    </svg>
                    Continue with Apple
                  </button>
                </div>
              </div>
            ) : (
              // Signup Form
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-3">
                  <button 
                    onClick={handleEmailSignup}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    Continue with Email
                  </button>

                  <button 
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <button 
                    onClick={handleAppleAuth}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2.032-.169-3.951 1.144-5.12 1.144z"/>
                    </svg>
                    Continue with Apple
                  </button>
                </div>
              </div>
            )}

            {/* Legal text */}
            <p className="text-xs text-gray-500 mt-6 text-center">
              By {currentScreen === 'login' ? 'signing in' : 'signing up'}, you agree to the{' '}
              <span className="text-gray-700 cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
        <span className="text-gray-700 cursor-pointer hover:underline">Data Processing Agreement</span>
      </p>
    </div>
  </div>
</div>
</div>
)
}

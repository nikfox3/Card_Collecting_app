# Pokémon Card Collecting App - Data Structure

## Overview
This document outlines the comprehensive data structure designed for the Pokémon card collecting application, including user data, collections, cards, pricing, and portfolio tracking.

## Core Data Models

### 1. User Profile
```javascript
{
  username: string,           // "@Stuart60"
  profilePicture: string,     // Initial or avatar URL
  collections: Collection[],  // Array of user collections
  recentActivity: Activity[], // Recent card additions/removals
  topMovers: Card[],         // User's most valuable cards
  trendingCards: Card[],     // Market trending cards
  portfolioHistory: Object   // Price history by time range
}
```

### 2. Collection
```javascript
{
  id: string,              // "pokemon-collection"
  name: string,            // "Pokemon Collection"
  totalValue: number,      // 4268.23
  totalCards: number,      // 8456
  monthlyChange: number,   // 102.36
  currency: string,        // "USD"
  lastUpdated: string      // "2025-08-02"
}
```

### 3. Card
```javascript
{
  id: number,              // Unique card identifier
  name: string,            // "Charizard ex"
  setName: string,         // "Obsidian Flames"
  rarity: string,          // "Ultra Rare"
  cardNumber: string,      // "223/197"
  currentValue: number,    // 45.67
  change: number,          // 12.34 (can be negative)
  changePercent: number,   // 37.0
  quantity: number,        // 2
  imageUrl: string|null,   // Card image URL
  // Additional card attributes for search
  hp?: number,             // Hit Points
  types?: string[],        // ["Fire", "Fighting"]
  illustrator?: string,    // Artist name
  moves?: Move[],          // Card moves/attacks
  weaknesses?: string[],   // Card weaknesses
  resistances?: string[],  // Card resistances
  retreatCost?: number,    // Retreat cost
  set?: Set,              // Full set information
  tcgPlayerId?: string,    // TCGPlayer API ID
  pokemonTcgId?: string    // Pokémon TCG API ID
}
```

### 4. Move
```javascript
{
  name: string,            // "Fire Blast"
  cost: string[],          // ["Fire", "Fire", "Colorless"]
  damage: string,          // "120"
  description: string      // Move description
}
```

### 5. Set
```javascript
{
  id: string,              // Set identifier
  name: string,            // "Obsidian Flames"
  series: string,          // "Scarlet & Violet"
  releaseDate: string,     // "2023-08-11"
  totalCards: number,      // 197
  symbol: string,          // Set symbol URL
  logo: string             // Set logo URL
}
```

### 6. Activity
```javascript
{
  id: number,              // Activity ID
  cardName: string,        // "Charizard ex"
  action: string,          // "added" | "removed"
  timestamp: string,       // "2025-08-01T10:30:00Z"
  quantity?: number,       // Quantity added/removed
  value?: number,          // Value at time of action
  source?: string          // "scan" | "manual" | "import"
}
```

### 7. Portfolio History
```javascript
{
  "1D": PortfolioPoint[],   // 1 day data points
  "7D": PortfolioPoint[],   // 7 day data points
  "1M": PortfolioPoint[],   // 1 month data points
  "3M": PortfolioPoint[],   // 3 month data points
  "6M": PortfolioPoint[],   // 6 month data points
  "1Y": PortfolioPoint[],   // 1 year data points
  "MAX": PortfolioPoint[]   // All time data points
}
```

### 8. Portfolio Point
```javascript
{
  date: string,            // "2025-08-01T00:00:00Z"
  value: number            // 4200.00
}
```

## API Integration Structure

### TCGPlayer API Integration
```javascript
// Card recognition and pricing
const tcgPlayerCard = {
  productId: string,       // TCGPlayer product ID
  name: string,            // Card name
  setName: string,         // Set name
  rarity: string,          // Rarity
  marketPrice: number,     // Current market price
  lowPrice: number,        // Low price
  midPrice: number,        // Mid price
  highPrice: number,       // High price
  directLowPrice: number,  // Direct low price
  imageUrl: string         // Card image
}
```

### Pokémon TCG API Integration
```javascript
// Detailed card information
const pokemonTcgCard = {
  id: string,              // Pokémon TCG API ID
  name: string,            // Card name
  images: {
    small: string,         // Small image URL
    large: string          // Large image URL
  },
  types: string[],         // Card types
  hp: string,              // Hit Points
  attacks: Attack[],       // Card attacks
  weaknesses: Weakness[],  // Card weaknesses
  resistances: Resistance[], // Card resistances
  retreatCost: string[],   // Retreat cost
  set: {
    id: string,            // Set ID
    name: string,          // Set name
    series: string,        // Series
    total: number,         // Total cards in set
    releaseDate: string    // Release date
  },
  number: string,          // Card number
  rarity: string,          // Rarity
  artist: string,          // Illustrator
  nationalPokedexNumbers: number[] // Pokédex numbers
}
```

## Search Functionality

### Searchable Fields
The robust search system supports searching across:
- **Card Name**: "Charizard", "Pikachu"
- **Set Name**: "Obsidian Flames", "151"
- **Rarity**: "Ultra Rare", "Secret Rare"
- **Card Number**: "223/197", "151/165"
- **HP**: "120", "300"
- **Types**: "Fire", "Water", "Grass"
- **Illustrator**: "Atsuko Nishida", "5ban Graphics"
- **Moves**: "Fire Blast", "Thunderbolt"
- **Artist**: "Atsuko Nishida"
- **Series**: "Scarlet & Violet", "Sword & Shield"

### Search Implementation
```javascript
const searchCard = (query, filters) => {
  // Search across all card attributes
  // Support fuzzy matching
  // Filter by set, rarity, type, etc.
  // Return ranked results
}
```

## Card Scanning Integration

### Camera Scanning Flow
1. **Camera Access**: Request device camera permission
2. **Image Capture**: Capture card image
3. **Image Processing**: Optimize image for API
4. **TCGPlayer Recognition**: Send to TCGPlayer API for card recognition
5. **Pokémon TCG Data**: Fetch detailed card data from Pokémon TCG API
6. **Price Integration**: Get current pricing from TCGPlayer
7. **Collection Update**: Add card to user's collection
8. **Activity Log**: Record the addition in recent activity

### Scanning API Endpoints
```javascript
// TCGPlayer Card Recognition
POST /api/tcgplayer/recognize
{
  image: File,              // Card image
  confidence: number        // Recognition confidence threshold
}

// Pokémon TCG Card Details
GET /api/pokemon-tcg/cards/{cardId}
GET /api/pokemon-tcg/cards?name={cardName}
GET /api/pokemon-tcg/sets/{setId}
```

## Portfolio Tracking

### Real-time Price Updates
- **TCGPlayer API**: Primary pricing source
- **Update Frequency**: Every 15 minutes for active collections
- **Price History**: Store daily price snapshots
- **Change Tracking**: Calculate daily/weekly/monthly changes

### Portfolio Graph Data
- **Interactive Charts**: Chart.js implementation
- **Time Ranges**: 1D, 7D, 1M, 3M, 6M, 1Y, MAX
- **Hover Interactions**: Show exact values and dates
- **Responsive Design**: Mobile-optimized charts

## Data Persistence

### Local Storage
- **User Preferences**: Theme, currency, default collection
- **Offline Data**: Cached card data for offline viewing
- **Search History**: Recent searches for quick access

### Database Schema (Future)
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  profile_picture TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(100),
  total_value DECIMAL(10,2),
  total_cards INTEGER,
  currency VARCHAR(3),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  set_name VARCHAR(100),
  rarity VARCHAR(50),
  card_number VARCHAR(20),
  tcg_player_id VARCHAR(50),
  pokemon_tcg_id VARCHAR(50),
  current_value DECIMAL(10,2),
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- User Cards (Collection Items)
CREATE TABLE user_cards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  card_id UUID REFERENCES cards(id),
  collection_id UUID REFERENCES collections(id),
  quantity INTEGER DEFAULT 1,
  condition VARCHAR(20),
  added_at TIMESTAMP,
  added_via VARCHAR(20) -- 'scan', 'manual', 'import'
);

-- Price History
CREATE TABLE price_history (
  id UUID PRIMARY KEY,
  card_id UUID REFERENCES cards(id),
  price DECIMAL(10,2),
  source VARCHAR(20), -- 'tcgplayer', 'ebay'
  recorded_at TIMESTAMP
);
```

## Future Enhancements

### Advanced Features
1. **Wishlist Management**: Track wanted cards
2. **Trade Tracking**: Monitor trades and offers
3. **Collection Analytics**: Detailed statistics and insights
4. **Social Features**: Share collections, follow other collectors
5. **Market Alerts**: Price drop notifications
6. **Collection Goals**: Set and track collection targets
7. **Export/Import**: Backup and restore collections
8. **Multi-language Support**: International card support

### API Rate Limiting
- **TCGPlayer API**: 1000 requests/hour
- **Pokémon TCG API**: 100 requests/minute
- **Caching Strategy**: Redis for frequently accessed data
- **Batch Processing**: Group API calls for efficiency

This data structure provides a solid foundation for building a comprehensive Pokémon card collecting application with robust search, scanning, and portfolio tracking capabilities.




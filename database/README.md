# Pokémon Card Database

This directory contains the database infrastructure for the Pokémon Card Collecting App, including local SQLite storage and sync with the Pokémon TCG API.

## 🗄️ Database Schema

- **cards**: Stores all Pokémon card data with full-text search support
- **sets**: Stores set information (Base Set, Gym Challenge, etc.)
- **cards_fts**: Full-text search virtual table for fast searching

## 🚀 Quick Start

### 1. Setup Database
```bash
cd database
npm run setup
```

This will:
- Install dependencies
- Create the database schema
- Sync all cards from the Pokémon TCG API (may take 10-15 minutes)

### 2. Search Cards
```bash
# Search for specific cards
npm run search "Charizard"

# Search with filters
node search.js "Pikachu" --set=base1 --rarity="Rare Holo"
```

### 3. API Server
```bash
cd ../server
npm install
npm start
```

## 📊 Database Features

### Full-Text Search
- Search by card name, set name, rarity, types
- Fuzzy matching and typo tolerance
- Fast search across 20,000+ cards

### Filtering
- By set (Base Set, Gym Challenge, etc.)
- By rarity (Common, Uncommon, Rare Holo, etc.)
- By type (Fire, Water, Grass, etc.)
- By collection status (collected/not collected)

### Performance
- Indexed columns for fast queries
- Pagination support
- Sub-100ms search response times

## 🔄 Sync Process

The sync process downloads all cards from the Pokémon TCG API:

1. **Sets**: Downloads all available sets
2. **Cards**: Downloads all cards with pagination
3. **Pricing**: Extracts current market values from TCGPlayer
4. **Search**: Builds full-text search index

### Manual Sync
```bash
npm run sync
```

### Incremental Updates
The database can be updated incrementally by running sync again. Existing cards will be updated with new pricing data.

## 📈 Statistics

View database statistics:
```bash
node -e "
const search = require('./search');
const s = new search();
s.init().then(() => s.getStats()).then(console.log);
"
```

## 🛠️ Development

### Database Schema
The schema is defined in `schema.sql` and includes:
- Optimized indexes for search performance
- Full-text search virtual table
- Triggers to keep FTS in sync
- JSON columns for complex data (attacks, types, etc.)

### Search API
The `search.js` module provides:
- Text search with FTS5
- Advanced filtering options
- Sorting and pagination
- Statistics and metadata

### Sync Process
The `sync.js` module handles:
- API rate limiting (100ms delays)
- Batch processing (100 cards per request)
- Error handling and retry logic
- Progress tracking

## 🔧 Configuration

### Rate Limiting
Adjust `DELAY_MS` in `sync.js` to respect API limits:
```javascript
const DELAY_MS = 100; // milliseconds between requests
```

### Batch Size
Adjust `BATCH_SIZE` for API requests:
```javascript
const BATCH_SIZE = 100; // cards per request
```

### Database Path
The database is stored at `./cards.db` by default. Change `DB_PATH` in `sync.js` if needed.

## 📝 API Endpoints

When running the API server:

- `POST /api/cards/search` - Search cards with filters
- `GET /api/cards/:id` - Get specific card
- `GET /api/cards/stats` - Database statistics
- `GET /api/sets` - Available sets
- `GET /api/cards/rarities` - Available rarities
- `GET /api/cards/types` - Available types
- `GET /api/health` - Health check

## 🚨 Troubleshooting

### Database Locked
If you get "database is locked" errors:
```bash
# Check for running processes
ps aux | grep node

# Kill any stuck processes
kill -9 <process_id>
```

### Sync Failures
If sync fails partway through:
```bash
# Delete database and restart
rm cards.db
npm run setup
```

### Search Issues
If search returns no results:
```bash
# Check database exists
ls -la cards.db

# Verify data
node -e "const s = require('./search'); const search = new s(); search.init().then(() => search.getStats()).then(console.log);"
```

## 📊 Performance Tips

1. **Indexes**: All searchable columns are indexed
2. **FTS**: Use full-text search for text queries
3. **Pagination**: Use LIMIT/OFFSET for large result sets
4. **Caching**: Consider Redis for frequently searched terms
5. **Compression**: Database can be compressed with VACUUM

## 🔮 Future Enhancements

- [ ] Redis caching layer
- [ ] Elasticsearch integration
- [ ] Real-time price updates
- [ ] Image caching and optimization
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Collection tracking and statistics



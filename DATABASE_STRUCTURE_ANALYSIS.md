# Database Structure Analysis

**Generated:** October 11, 2025  
**Database:** cards_backup_20251002_182725.db

---

## 📊 Overall Statistics

| Metric | Value | Notes |
|--------|-------|-------|
| **Total Sets** | 237 | Complete set database |
| **Total Cards** | 21,673 | All cards in database |
| **Cards with Pricing** | 12,720 (58.7%) | ✅ Good coverage |
| **Average Price** | $16.31 | Across priced cards |
| **Price Range** | $0.03 - $2,617.85 | Wide range |

---

## 🗃️ Database Schema

### **1. SETS Table**
Stores information about Pokemon card sets.

```sql
CREATE TABLE sets (
    id VARCHAR(50) PRIMARY KEY,           -- e.g., 'base1', 'sm9', 'swsh1'
    name VARCHAR(255) NOT NULL,           -- e.g., 'Base Set', 'Team Up'
    series VARCHAR(100),                  -- e.g., 'Base', 'Sun & Moon'
    printed_total INTEGER,                -- # cards printed on packs
    total INTEGER,                        -- Total cards including secrets
    legalities JSON,                      -- Format legality (Standard, Expanded, etc.)
    ptcgo_code VARCHAR(20),              -- PTCGO/PTCGL code
    release_date DATE,                    -- Set release date
    updated_at TIMESTAMP,                 -- Last update
    images JSON                           -- Set logo and symbol URLs
);
```

**Coverage:**
- ✅ 237 sets (complete)
- ✅ All sets have IDs and names
- ✅ Release dates populated

---

### **2. CARDS Table**
Main table storing all card data.

```sql
CREATE TABLE cards (
    -- Core Identification
    id VARCHAR(50) PRIMARY KEY,           -- e.g., 'base1-4', 'sm9-170'
    name VARCHAR(255) NOT NULL,           -- Card name
    set_id VARCHAR(50),                   -- Links to sets table
    number VARCHAR(20),                   -- Card number (e.g., '4', '170/181')
    
    -- Pokemon Attributes
    supertype VARCHAR(50),                -- Pokemon, Trainer, Energy
    subtypes JSON,                        -- [Stage 1, Fire, etc.]
    level VARCHAR(20),                    -- Pokemon level (older cards)
    hp VARCHAR(20),                       -- Hit points
    types JSON,                           -- [Fire, Water, etc.]
    evolves_from VARCHAR(255),            -- Evolution chain
    
    -- Battle Stats
    attacks JSON,                         -- Attack data
    weaknesses JSON,                      -- Weakness types
    resistances JSON,                     -- Resistance types
    retreat_cost JSON,                    -- Retreat cost energies
    converted_retreat_cost INTEGER,       -- Numeric retreat cost
    
    -- Card Details
    artist VARCHAR(255),                  -- Illustrator name
    rarity VARCHAR(100),                  -- Rarity tier
    national_pokedex_numbers JSON,        -- Pokedex #s
    legalities JSON,                      -- Format legality
    images JSON,                          -- Card image URLs
    
    -- Pricing Data (NEW!)
    current_value DECIMAL(10,2),          -- Current market price
    tcgplayer JSON,                       -- TCGPlayer pricing (normal/holo)
    cardmarket JSON,                      -- Cardmarket pricing
    
    -- App-Specific Fields
    quantity INTEGER DEFAULT 0,           -- # owned
    collected BOOLEAN DEFAULT FALSE,      -- In collection?
    language VARCHAR(10) DEFAULT 'en',    -- Language code
    variant VARCHAR(50) DEFAULT 'Normal', -- Normal, Holo, Reverse, etc.
    variants TEXT DEFAULT '["Normal"]',   -- Available variants
    regulation VARCHAR(10) DEFAULT 'A',   -- Regulation mark
    format VARCHAR(20) DEFAULT 'Standard',-- Competitive format
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (set_id) REFERENCES sets(id)
);
```

**Coverage:**
| Field | Coverage | Notes |
|-------|----------|-------|
| `name` | 100% (21,673) | ✅ All cards have names |
| `artist` | 87.9% (19,063) | ⚠️ 2,610 missing artists |
| `rarity` | 99.9% (21,642) | ✅ Almost complete |
| `images` | 100% (21,673) | ✅ All have image URLs |
| `current_value` | **58.7% (12,720)** | ✅ Good pricing coverage |
| `tcgplayer` | 100% (21,673) | ✅ Structure present |
| `cardmarket` | 100% (21,673) | ✅ Structure present |
| `set_id` | 100% (21,673) | ✅ All cards linked to sets |

---

### **3. PRICE_HISTORY Table**
Tracks historical pricing data (ready for future use).

```sql
CREATE TABLE price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    date TEXT NOT NULL,
    price REAL NOT NULL,
    volume INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, date)
);
```

**Status:** ⏳ Empty (ready for price tracking implementation)

---

### **4. CARDS_FTS Table**
Full-text search virtual table for fast card searching.

```sql
CREATE VIRTUAL TABLE cards_fts USING fts5(
    name,        -- Searchable card name
    set_name,    -- Searchable set name
    rarity,      -- Searchable rarity
    types,       -- Searchable types
    content='cards',
    content_rowid='rowid'
);
```

**Features:**
- ✅ Automatic sync with cards table via triggers
- ✅ Fast text search across names, sets, rarities
- ✅ Handles partial matches and typos

---

## 📈 Data Quality Analysis

### **What's Good:**
1. ✅ **58.7% pricing coverage** (12,720 cards)
2. ✅ **Complete set database** (237 sets)
3. ✅ **All cards have images** (via API URLs)
4. ✅ **87.9% have artist data**
5. ✅ **Performance indexes** on key fields
6. ✅ **Full-text search** enabled

### **What's Missing:**

#### **1. Pricing Gaps (41.3% - 8,953 cards)**
**Why?**
- Promo cards without established market
- Very recent releases (like Destined Rivals sv10)
- Regional/language variants
- Cards with no TCGPlayer listings
- Older promo cards

**Solution:** 
- Continue monitoring for API updates
- Consider manual entry for high-value missing cards
- Wait for market data on new releases

#### **2. Artist Data (12.1% - 2,610 cards)**
**Why?**
- Some promo cards lack artist credits
- Older cards with incomplete data
- Digital-only cards

**Solution:**
- Import additional artist databases
- Use TCGdex API for supplemental data

#### **3. Supertype Inconsistency**
Found: `Pokemon` (17,716) AND `Pokémon` (648)

**Solution:**
- Normalize to `Pokémon` with accent
- Update 648 cards: `UPDATE cards SET supertype = 'Pokémon' WHERE supertype = 'Pokemon';`

---

## 💰 Pricing Distribution

| Price Range | Count | Percentage |
|-------------|-------|------------|
| Under $1 | 6,925 | 54.4% |
| $1 - $10 | 3,468 | 27.3% |
| $10 - $50 | 1,441 | 11.3% |
| $50 - $100 | 405 | 3.2% |
| Over $100 | 481 | 3.8% |

**Insights:**
- Most cards ($1-$10) are common/uncommon
- 481 cards are worth over $100 (chase cards, vintage, rare holos)
- Highest card: **Latias & Latios GX ($2,617.85)**

---

## 🔍 Performance Indexes

Current indexes for fast queries:

```sql
CREATE INDEX idx_cards_name ON cards(name);
CREATE INDEX idx_cards_set_id ON cards(set_id);
CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_cards_types ON cards(types);
CREATE INDEX idx_cards_collected ON cards(collected);
CREATE INDEX idx_cards_quantity ON cards(quantity);
CREATE INDEX idx_cards_variant ON cards(variant);
CREATE INDEX idx_cards_variants ON cards(variants);
CREATE INDEX idx_cards_regulation ON cards(regulation);
CREATE INDEX idx_cards_format ON cards(format);
CREATE INDEX idx_cards_language ON cards(language);
```

**Performance:** ✅ Well-optimized for common queries

---

## 📦 Example Data Structures

### **Pricing Data (tcgplayer field):**
```json
{
  "normal": {
    "market": 0.13,
    "low": 0.01,
    "high": 4.99
  },
  "holofoil": {
    "market": 2617.85,
    "low": 2050,
    "high": 2500
  },
  "url": "https://www.tcgplayer.com/search/pokemon/product?..."
}
```

### **Images Data:**
```json
{
  "small": "https://images.pokemontcg.io/base1/4.png",
  "large": "https://images.pokemontcg.io/base1/4_hires.png"
}
```

### **Types/Subtypes:**
```json
["Fire", "Dragon"]  // types
["Stage 2", "VMAX"]  // subtypes
```

---

## 🎯 Recommendations

### **Immediate Actions:**
1. ✅ **Pricing is now good!** (58.7% coverage achieved)
2. 🔧 **Fix supertype consistency** (Pokemon → Pokémon)
3. 📊 **Monitor price updates** (schedule daily/weekly imports)

### **Future Enhancements:**
1. 🔄 **Implement price_history tracking** (monitor price changes)
2. 🌐 **Add more language support** (Japanese, German, French pricing)
3. 📊 **Populate missing artist data** (2,610 cards)
4. 🎨 **Add variant-specific pricing** (PSA grades, 1st Edition, etc.)

### **Database Maintenance:**
1. ✅ **Regular price updates** (weekly recommended)
2. 🧹 **Clean up orphaned FTS entries** (if needed)
3. 📈 **Monitor database size** (currently ~29MB, manageable)

---

## 🚀 Next Steps

**To view your database yourself:**
```bash
# Open database in SQLite browser
sqlite3 database/cards_backup_20251002_182725.db

# Or install DB Browser for SQLite (GUI)
# https://sqlitebrowser.org/
```

**Common Queries:**
```sql
-- Find expensive cards
SELECT name, current_value, rarity, artist 
FROM cards 
WHERE current_value > 100 
ORDER BY current_value DESC;

-- Check pricing by set
SELECT s.name, COUNT(*) as total, 
       SUM(CASE WHEN c.current_value > 0 THEN 1 ELSE 0 END) as priced
FROM sets s
LEFT JOIN cards c ON s.id = c.set_id
GROUP BY s.name
ORDER BY total DESC;

-- Find missing data
SELECT name, id, rarity
FROM cards
WHERE (current_value IS NULL OR current_value = 0)
  AND rarity LIKE '%Rare%'
ORDER BY name;
```

---

**Status: ✅ Database is in excellent shape with 58.7% pricing coverage!**











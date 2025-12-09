-- TCGCSV Database Schema Migration
-- This creates a new database structure that matches TCGCSV data format

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS deck_notes;
DROP TABLE IF EXISTS deck_matches;
DROP TABLE IF EXISTS deck_cards;
DROP TABLE IF EXISTS decks;
DROP TABLE IF EXISTS user_collections;
DROP TABLE IF EXISTS pricing_alerts;
DROP TABLE IF EXISTS price_history;
DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS sets;
DROP TABLE IF EXISTS users;

-- Create users table (unchanged)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    profile_image TEXT,
    cover_image TEXT,
    is_pro BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create groups table (replaces sets table)
-- Maps to TCGCSV groupId
CREATE TABLE groups (
    group_id INTEGER PRIMARY KEY, -- TCGCSV groupId
    name VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL, -- TCGCSV categoryId (3 for Pokemon)
    url TEXT,
    modified_on TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table (replaces cards table)
-- Maps to TCGCSV productId and structure
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY, -- TCGCSV productId
    name VARCHAR(255) NOT NULL,
    clean_name VARCHAR(255),
    image_url TEXT,
    category_id INTEGER NOT NULL, -- TCGCSV categoryId (3 for Pokemon)
    group_id INTEGER NOT NULL, -- TCGCSV groupId (references groups.group_id)
    url TEXT,
    modified_on TIMESTAMP,
    image_count INTEGER DEFAULT 1,
    
    -- Extended data fields (from TCGCSV extNumber, extRarity, etc.)
    ext_number VARCHAR(20), -- e.g., "001/102"
    ext_rarity VARCHAR(50), -- e.g., "Holo Rare", "Common"
    ext_card_type VARCHAR(50), -- e.g., "Psychic", "Fire", "Trainer"
    ext_hp INTEGER, -- Hit Points
    ext_stage VARCHAR(50), -- e.g., "Basic", "Stage 1", "Stage 2"
    ext_card_text TEXT, -- Card description/abilities
    ext_attack1 TEXT, -- First attack
    ext_attack2 TEXT, -- Second attack
    ext_weakness VARCHAR(50), -- Weakness type
    ext_resistance VARCHAR(50), -- Resistance type
    ext_retreat_cost INTEGER, -- Retreat cost
    
    -- Pricing data (from TCGCSV pricing)
    low_price DECIMAL(10,2),
    mid_price DECIMAL(10,2),
    high_price DECIMAL(10,2),
    market_price DECIMAL(10,2),
    direct_low_price DECIMAL(10,2),
    sub_type_name VARCHAR(50), -- e.g., "Holofoil", "1st Edition", "Normal"
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE
);

-- Create price_history table (updated structure)
CREATE TABLE price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    sub_type_name VARCHAR(50), -- Track pricing by variant
    date DATE NOT NULL,
    low_price DECIMAL(10,2),
    mid_price DECIMAL(10,2),
    high_price DECIMAL(10,2),
    market_price DECIMAL(10,2),
    direct_low_price DECIMAL(10,2),
    source VARCHAR(50) DEFAULT 'TCGCSV',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE(product_id, sub_type_name, date)
);

-- Create user_collections table (updated structure)
CREATE TABLE user_collections (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_id INTEGER NOT NULL, -- References products.product_id
    sub_type_name VARCHAR(50), -- Track which variant (Holofoil, Normal, etc.)
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(20) DEFAULT 'Near Mint',
    purchase_price DECIMAL(10,2),
    purchase_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Create pricing_alerts table (updated structure)
CREATE TABLE pricing_alerts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_id INTEGER NOT NULL, -- References products.product_id
    sub_type_name VARCHAR(50), -- Alert for specific variant
    target_price DECIMAL(10,2) NOT NULL,
    alert_type VARCHAR(20) DEFAULT 'below', -- 'below' or 'above'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Create decks table (unchanged)
CREATE TABLE decks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT 'standard',
    deck_mode VARCHAR(20) NOT NULL DEFAULT 'casual',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    allow_cloning BOOLEAN DEFAULT FALSE,
    total_cards INTEGER DEFAULT 0,
    is_valid BOOLEAN DEFAULT FALSE,
    validation_issues JSON,
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    draw_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create deck_cards table (updated structure)
CREATE TABLE deck_cards (
    id VARCHAR(36) PRIMARY KEY,
    deck_id VARCHAR(36) NOT NULL,
    product_id INTEGER NOT NULL, -- References products.product_id
    sub_type_name VARCHAR(50), -- Track which variant
    quantity INTEGER NOT NULL DEFAULT 1,
    is_energy BOOLEAN DEFAULT FALSE,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Create deck_matches table (unchanged)
CREATE TABLE deck_matches (
    id VARCHAR(36) PRIMARY KEY,
    deck_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    result VARCHAR(10) NOT NULL, -- 'win', 'loss', 'draw'
    opponent_deck_type VARCHAR(100),
    match_date DATE NOT NULL,
    format VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create deck_notes table (unchanged)
CREATE TABLE deck_notes (
    id VARCHAR(36) PRIMARY KEY,
    deck_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_products_group_id ON products(group_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_ext_rarity ON products(ext_rarity);
CREATE INDEX idx_products_ext_card_type ON products(ext_card_type);
CREATE INDEX idx_products_market_price ON products(market_price);
CREATE INDEX idx_products_sub_type_name ON products(sub_type_name);

CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_date ON price_history(date);
CREATE INDEX idx_price_history_sub_type ON price_history(sub_type_name);

CREATE INDEX idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX idx_user_collections_product_id ON user_collections(product_id);

CREATE INDEX idx_pricing_alerts_user_id ON pricing_alerts(user_id);
CREATE INDEX idx_pricing_alerts_product_id ON pricing_alerts(product_id);

CREATE INDEX idx_deck_cards_deck_id ON deck_cards(deck_id);
CREATE INDEX idx_deck_cards_product_id ON deck_cards(product_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_products_updated_at 
    AFTER UPDATE ON products
    FOR EACH ROW
    BEGIN
        UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE product_id = NEW.product_id;
    END;

CREATE TRIGGER update_groups_updated_at 
    AFTER UPDATE ON groups
    FOR EACH ROW
    BEGIN
        UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE group_id = NEW.group_id;
    END;

CREATE TRIGGER update_users_updated_at 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_user_collections_updated_at 
    AFTER UPDATE ON user_collections
    FOR EACH ROW
    BEGIN
        UPDATE user_collections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_pricing_alerts_updated_at 
    AFTER UPDATE ON pricing_alerts
    FOR EACH ROW
    BEGIN
        UPDATE pricing_alerts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_decks_updated_at 
    AFTER UPDATE ON decks
    FOR EACH ROW
    BEGIN
        UPDATE decks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_deck_notes_updated_at 
    AFTER UPDATE ON deck_notes
    FOR EACH ROW
    BEGIN
        UPDATE deck_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;








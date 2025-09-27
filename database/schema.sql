-- Pokémon Card Collecting App Database Schema
-- SQLite Database for local card storage and fast search

-- Sets table
CREATE TABLE IF NOT EXISTS sets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    series VARCHAR(100),
    printed_total INTEGER,
    total INTEGER,
    legalities JSON,
    ptcgo_code VARCHAR(20),
    release_date DATE,
    updated_at TIMESTAMP,
    images JSON
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    supertype VARCHAR(50),
    subtypes JSON,
    level VARCHAR(20),
    hp VARCHAR(20),
    types JSON,
    evolves_from VARCHAR(255),
    attacks JSON,
    weaknesses JSON,
    resistances JSON,
    retreat_cost JSON,
    converted_retreat_cost INTEGER,
    set_id VARCHAR(50),
    number VARCHAR(20),
    artist VARCHAR(255),
    rarity VARCHAR(100),
    national_pokedex_numbers JSON,
    legalities JSON,
    images JSON,
    tcgplayer JSON,
    cardmarket JSON,
    -- App-specific fields
    current_value DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    collected BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    variant VARCHAR(50) DEFAULT 'Normal',
    variants TEXT DEFAULT '["Normal"]',
    regulation VARCHAR(10) DEFAULT 'A',
    format VARCHAR(20) DEFAULT 'Standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_id) REFERENCES sets(id)
);

-- Search indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards(set_id);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_types ON cards(types);
CREATE INDEX IF NOT EXISTS idx_cards_collected ON cards(collected);
CREATE INDEX IF NOT EXISTS idx_cards_quantity ON cards(quantity);
CREATE INDEX IF NOT EXISTS idx_cards_language ON cards(language);
CREATE INDEX IF NOT EXISTS idx_cards_variant ON cards(variant);
CREATE INDEX IF NOT EXISTS idx_cards_variants ON cards(variants);
CREATE INDEX IF NOT EXISTS idx_cards_regulation ON cards(regulation);
CREATE INDEX IF NOT EXISTS idx_cards_format ON cards(format);

-- Full-text search index
CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
    name,
    set_name,
    rarity,
    types,
    content='cards',
    content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS cards_ai AFTER INSERT ON cards BEGIN
    INSERT INTO cards_fts(rowid, name, set_name, rarity, types)
    VALUES (new.rowid, new.name, 
            (SELECT name FROM sets WHERE id = new.set_id),
            new.rarity, new.types);
END;

CREATE TRIGGER IF NOT EXISTS cards_au AFTER UPDATE ON cards BEGIN
    UPDATE cards_fts SET 
        name = new.name,
        set_name = (SELECT name FROM sets WHERE id = new.set_id),
        rarity = new.rarity,
        types = new.types
    WHERE rowid = new.rowid;
END;

CREATE TRIGGER IF NOT EXISTS cards_ad AFTER DELETE ON cards BEGIN
    DELETE FROM cards_fts WHERE rowid = old.rowid;
END;


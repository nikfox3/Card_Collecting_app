-- Pokemon Deck Builder Database Migration
-- Creates tables for deck management, cards, matches, and notes

-- Decks table
CREATE TABLE IF NOT EXISTS decks (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    user_id VARCHAR(36) NOT NULL, -- Foreign key to users table
    name VARCHAR(255) NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT 'standard', -- 'standard', 'expanded', 'unlimited', 'custom'
    deck_mode VARCHAR(20) NOT NULL DEFAULT 'casual', -- 'casual', 'tournament'
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deck cards table
CREATE TABLE IF NOT EXISTS deck_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id VARCHAR(36) NOT NULL,
    card_id VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_energy BOOLEAN DEFAULT FALSE,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE(deck_id, card_id)
);

-- Deck matches table
CREATE TABLE IF NOT EXISTS deck_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    result VARCHAR(10) NOT NULL, -- 'win', 'loss', 'draw'
    opponent_deck_type VARCHAR(100),
    match_date DATE NOT NULL,
    format VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- Deck notes table
CREATE TABLE IF NOT EXISTS deck_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_format ON decks(format);
CREATE INDEX IF NOT EXISTS idx_decks_is_public ON decks(is_public);
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_card_id ON deck_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_deck_matches_deck_id ON deck_matches(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_matches_user_id ON deck_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_matches_date ON deck_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_deck_notes_deck_id ON deck_notes(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_notes_user_id ON deck_notes(user_id);

-- Update trigger for decks table
CREATE TRIGGER IF NOT EXISTS update_decks_updated_at 
    AFTER UPDATE ON decks
    FOR EACH ROW
    BEGIN
        UPDATE decks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Update trigger for deck_notes table
CREATE TRIGGER IF NOT EXISTS update_deck_notes_updated_at 
    AFTER UPDATE ON deck_notes
    FOR EACH ROW
    BEGIN
        UPDATE deck_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;








-- Pokemon Digital Binder Database Migration
-- Creates tables for binder management with pages and pockets

-- Binders table
CREATE TABLE IF NOT EXISTS binders (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    user_id VARCHAR(36) NOT NULL, -- Foreign key to users table
    name VARCHAR(255) NOT NULL,
    pocket_config VARCHAR(20) NOT NULL DEFAULT '9-pocket', -- '9-pocket', '12-pocket'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Binder pages table
CREATE TABLE IF NOT EXISTS binder_pages (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    binder_id VARCHAR(36) NOT NULL,
    page_number INTEGER NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (binder_id) REFERENCES binders(id) ON DELETE CASCADE
);

-- Binder pockets table (cards in specific positions)
CREATE TABLE IF NOT EXISTS binder_pockets (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    binder_id VARCHAR(36) NOT NULL,
    page_id VARCHAR(36) NOT NULL,
    product_id INTEGER NOT NULL, -- References products.product_id
    pocket_position INTEGER NOT NULL, -- 0-8 for 9-pocket, 0-11 for 12-pocket
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (binder_id) REFERENCES binders(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES binder_pages(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE(binder_id, page_id, pocket_position)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_binders_user_id ON binders(user_id);
CREATE INDEX IF NOT EXISTS idx_binder_pages_binder_id ON binder_pages(binder_id);
CREATE INDEX IF NOT EXISTS idx_binder_pages_page_number ON binder_pages(page_number);
CREATE INDEX IF NOT EXISTS idx_binder_pockets_binder_id ON binder_pockets(binder_id);
CREATE INDEX IF NOT EXISTS idx_binder_pockets_page_id ON binder_pockets(page_id);
CREATE INDEX IF NOT EXISTS idx_binder_pockets_product_id ON binder_pockets(product_id);
CREATE INDEX IF NOT EXISTS idx_binder_pockets_position ON binder_pockets(binder_id, page_id, pocket_position);

-- Update trigger for binders table
CREATE TRIGGER IF NOT EXISTS update_binders_updated_at 
    AFTER UPDATE ON binders
    FOR EACH ROW
    BEGIN
        UPDATE binders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Update trigger for binder_pages table
CREATE TRIGGER IF NOT EXISTS update_binder_pages_updated_at 
    AFTER UPDATE ON binder_pages
    FOR EACH ROW
    BEGIN
        UPDATE binder_pages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Update trigger for binder_pockets table
CREATE TRIGGER IF NOT EXISTS update_binder_pockets_updated_at 
    AFTER UPDATE ON binder_pockets
    FOR EACH ROW
    BEGIN
        UPDATE binder_pockets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;


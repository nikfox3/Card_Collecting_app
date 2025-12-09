-- Create marketplace_config table for managing affiliate links and marketplace features
CREATE TABLE IF NOT EXISTS marketplace_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL UNIQUE, -- 'TCGPlayer', 'eBay', 'Whatnot', 'Drip', 'Fanatics', etc.
  enabled BOOLEAN DEFAULT 1,
  affiliate_link TEXT, -- Base affiliate link URL (can include affiliate ID/token)
  affiliate_id TEXT, -- Affiliate ID or token for the platform
  logo_path TEXT, -- Path to platform logo image
  display_name TEXT, -- Display name for the platform
  commission_rate REAL, -- Commission rate (e.g., 5.5 for 5.5%)
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_marketplace_platform ON marketplace_config(platform);
CREATE INDEX IF NOT EXISTS idx_marketplace_enabled ON marketplace_config(enabled);

-- Insert default marketplace platforms
INSERT OR IGNORE INTO marketplace_config (platform, enabled, affiliate_link, display_name, logo_path) VALUES
  ('TCGPlayer', 1, 'https://www.tcgplayer.com', 'TCGPlayer', '/Assets/TCGplayer_Logo 1.svg'),
  ('eBay', 1, 'https://www.ebay.com', 'eBay', NULL),
  ('Whatnot', 1, 'https://www.whatnot.com', 'Whatnot', NULL),
  ('Drip', 1, 'https://www.drip.com', 'Drip', NULL),
  ('Fanatics', 1, 'https://www.fanaticsollect.com', 'Fanatics', NULL);





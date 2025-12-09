-- Create featured_trending_cards table for manual trending card management
CREATE TABLE IF NOT EXISTS featured_trending_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL UNIQUE,
  position INTEGER NOT NULL,
  featured_until DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_featured_trending_position ON featured_trending_cards(position);
CREATE INDEX IF NOT EXISTS idx_featured_trending_product ON featured_trending_cards(product_id);
CREATE INDEX IF NOT EXISTS idx_featured_trending_active ON featured_trending_cards(featured_until, position);


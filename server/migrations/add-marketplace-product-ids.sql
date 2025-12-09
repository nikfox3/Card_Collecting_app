-- Add columns to store external marketplace product IDs
-- This allows direct linking to specific products on external platforms

ALTER TABLE products ADD COLUMN tcgplayer_product_id INTEGER;
ALTER TABLE products ADD COLUMN ebay_product_id TEXT;
ALTER TABLE products ADD COLUMN whatnot_product_id TEXT;
ALTER TABLE products ADD COLUMN drip_product_id TEXT;
ALTER TABLE products ADD COLUMN fanatics_product_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_tcgplayer_id ON products(tcgplayer_product_id);
CREATE INDEX IF NOT EXISTS idx_products_ebay_id ON products(ebay_product_id);




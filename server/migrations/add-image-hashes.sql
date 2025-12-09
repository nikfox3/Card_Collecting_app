-- Add image hash columns to products table for visual card matching
-- Based on techniques from existing Pokemon card scanner projects

-- Add hash columns (if they don't exist)
ALTER TABLE products ADD COLUMN image_hash_perceptual TEXT;
ALTER TABLE products ADD COLUMN image_hash_difference TEXT;
ALTER TABLE products ADD COLUMN image_hash_average TEXT;
ALTER TABLE products ADD COLUMN image_hash_updated_at TIMESTAMP;

-- Create index for faster hash lookups
CREATE INDEX IF NOT EXISTS idx_products_image_hash_perceptual ON products(image_hash_perceptual);
CREATE INDEX IF NOT EXISTS idx_products_image_hash_difference ON products(image_hash_difference);
CREATE INDEX IF NOT EXISTS idx_products_image_hash_average ON products(image_hash_average);


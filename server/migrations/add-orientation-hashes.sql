-- Add orientation hash columns to products table
-- Stores hashes for 4 orientations: normal, mirrored, upside-down, mirrored+upside-down
-- Each orientation has 4 hash types: perceptual, difference, average, wavelet

-- Add orientation hash columns (if they don't exist)
-- Normal orientation (already exists, but adding for completeness)
ALTER TABLE products ADD COLUMN image_hash_perceptual_normal TEXT;
ALTER TABLE products ADD COLUMN image_hash_difference_normal TEXT;
ALTER TABLE products ADD COLUMN image_hash_average_normal TEXT;
ALTER TABLE products ADD COLUMN image_hash_wavelet_normal TEXT;

-- Mirrored orientation
ALTER TABLE products ADD COLUMN image_hash_perceptual_mirrored TEXT;
ALTER TABLE products ADD COLUMN image_hash_difference_mirrored TEXT;
ALTER TABLE products ADD COLUMN image_hash_average_mirrored TEXT;
ALTER TABLE products ADD COLUMN image_hash_wavelet_mirrored TEXT;

-- Upside-down orientation
ALTER TABLE products ADD COLUMN image_hash_perceptual_upsidedown TEXT;
ALTER TABLE products ADD COLUMN image_hash_difference_upsidedown TEXT;
ALTER TABLE products ADD COLUMN image_hash_average_upsidedown TEXT;
ALTER TABLE products ADD COLUMN image_hash_wavelet_upsidedown TEXT;

-- Mirrored + Upside-down orientation
ALTER TABLE products ADD COLUMN image_hash_perceptual_mirrored_upsidedown TEXT;
ALTER TABLE products ADD COLUMN image_hash_difference_mirrored_upsidedown TEXT;
ALTER TABLE products ADD COLUMN image_hash_average_mirrored_upsidedown TEXT;
ALTER TABLE products ADD COLUMN image_hash_wavelet_mirrored_upsidedown TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_hash_perceptual_normal ON products(image_hash_perceptual_normal);
CREATE INDEX IF NOT EXISTS idx_products_hash_difference_normal ON products(image_hash_difference_normal);
CREATE INDEX IF NOT EXISTS idx_products_hash_average_normal ON products(image_hash_average_normal);
CREATE INDEX IF NOT EXISTS idx_products_hash_wavelet_normal ON products(image_hash_wavelet_normal);


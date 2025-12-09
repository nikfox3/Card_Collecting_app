-- Add pricing enhancements to support condition, grade, and multiple sources
-- This migration enhances the price_history table to support:
-- 1. Raw card prices (Near Mint)
-- 2. PSA graded prices (PSA 10, 9, 8, etc.)
-- 3. Multiple pricing sources (TCGCSV, Pokemon Price Tracker API)

-- First, ensure we're working with the TCGCSV schema
-- Check if columns exist before adding
PRAGMA foreign_keys = OFF;

-- Add new columns to price_history if they don't exist
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'Near Mint';
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS grade VARCHAR(10);
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS psa_type VARCHAR(20);
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS population INTEGER;
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS raw_price DECIMAL(10,2);
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS psa10_price DECIMAL(10,2);
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS psa9_price DECIMAL(10,2);
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS enhanced BOOLEAN DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_price_history_product_date ON price_history(product_id, date);
CREATE INDEX IF NOT EXISTS idx_price_history_condition ON price_history(condition);
CREATE INDEX IF NOT EXISTS idx_price_history_grade ON price_history(grade);
CREATE INDEX IF NOT EXISTS idx_price_history_source ON price_history(source);

-- Create a view for easy access to current prices
CREATE VIEW IF NOT EXISTS current_prices AS
SELECT 
    ph.product_id,
    p.name as card_name,
    MAX(ph.date) as latest_date,
    MAX(CASE WHEN ph.grade IS NULL THEN ph.mid_price END) as raw_price,
    MAX(CASE WHEN ph.grade = 'PSA10' THEN ph.mid_price END) as psa10_price,
    MAX(CASE WHEN ph.grade = 'PSA9' THEN ph.mid_price END) as psa9_price,
    MAX(CASE WHEN ph.grade = 'PSA8' THEN ph.mid_price END) as psa8_price
FROM price_history ph
JOIN products p ON ph.product_id = p.product_id
WHERE ph.date >= date('now', '-7 days')
GROUP BY ph.product_id;

-- Create a view for price trends
CREATE VIEW IF NOT EXISTS price_trends AS
SELECT 
    ph.product_id,
    p.name as card_name,
    ph.date,
    AVG(CASE WHEN ph.grade IS NULL THEN ph.mid_price END) as avg_raw_price,
    AVG(CASE WHEN ph.grade = 'PSA10' THEN ph.mid_price END) as avg_psa10_price,
    AVG(CASE WHEN ph.grade = 'PSA9' THEN ph.mid_price END) as avg_psa9_price
FROM price_history ph
JOIN products p ON ph.product_id = p.product_id
WHERE ph.date >= date('now', '-90 days')
GROUP BY ph.product_id, ph.date;

PRAGMA foreign_keys = ON;

-- Migration complete
SELECT 'Pricing enhancements migration completed' as message;




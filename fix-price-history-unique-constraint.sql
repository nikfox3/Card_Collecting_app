-- Fix price_history table to allow multiple conditions per card per day

-- First, drop the table and recreate with proper unique constraint
-- that includes condition and grade

BEGIN TRANSACTION;

-- Create backup
CREATE TABLE price_history_backup AS SELECT * FROM price_history;

-- Drop old table  
DROP TABLE IF EXISTS price_history;

-- Recreate with correct unique constraint
CREATE TABLE price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    date TEXT NOT NULL,
    price REAL NOT NULL,
    volume INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    condition VARCHAR(50) DEFAULT 'Near Mint',
    grade VARCHAR(10),
    population INTEGER,
    source VARCHAR(50) DEFAULT 'TCGCSV',
    UNIQUE(product_id, date, condition, grade)
);

-- Copy data back
INSERT OR IGNORE INTO price_history 
SELECT * FROM price_history_backup;

-- Drop backup
DROP TABLE price_history_backup;

COMMIT;




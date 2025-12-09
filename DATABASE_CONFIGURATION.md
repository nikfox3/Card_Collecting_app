# Database Configuration - Single Source of Truth

## ✅ Unified Database: `../cards.db` (Parent Directory)

All components now use the same database: `/Users/NikFox/Documents/git/cards.db`

## Component Database Paths

### ✅ API Server
- **File**: `server/config.js`
- **Path**: `../cards.db` (from server directory)
- **Status**: ✅ Correct

### ✅ Admin Dashboard
- **File**: `admin-dashboard/src/utils/api.js`
- **Path**: Uses API server via HTTP (no direct DB access)
- **Status**: ✅ Correct (connects to API server)

### ✅ Daily Pricing Collector
- **File**: `daily-pricing-collector.js`
- **Path**: `../cards.db` (from root directory)
- **Status**: ✅ Updated

### ✅ Hash Scripts
- **Files**: `scripts/precompute-*.js`, `scripts/add-orientations-*.js`
- **Path**: `../cards.db` (via config or fallback)
- **Status**: ✅ Updated

### ✅ Pricing Update Scripts
- **Files**: `update-pricing-tcgdex.js`, `update-pricing-data.js`
- **Path**: `../cards.db`
- **Status**: ✅ Updated

## Merge Process

### Before Merging:
1. **Stop API server** (if running)
2. **Stop any other processes** using the database

### Run Merge:
```bash
npm run db:merge
```

### After Merging:
1. **Verify** database has ~58,000+ cards
2. **Restart** API server
3. **Test** admin dashboard
4. **Test** daily pricing collector
5. **Archive/remove** local `./cards.db` (optional)

## Verification Commands

```bash
# Check total cards
sqlite3 ../cards.db "SELECT COUNT(*) FROM products WHERE category_id = 3;"

# Check pricing data
sqlite3 ../cards.db "SELECT COUNT(*) FROM products WHERE category_id = 3 AND market_price > 0;"

# Check hash data
sqlite3 ../cards.db "SELECT COUNT(*) FROM products WHERE category_id = 3 AND image_hash_perceptual IS NOT NULL;"
```

## Daily Pricing Collection

The `daily-pricing-collector.js` script is configured to use `../cards.db` and will automatically update pricing data daily.

To test it manually:
```bash
node daily-pricing-collector.js
```


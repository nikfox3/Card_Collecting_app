# Database Merge Instructions

## ⚠️ IMPORTANT: Stop API Server First!

The merge script needs exclusive access to the database. **Stop the API server before running the merge.**

```bash
# Stop the API server (Ctrl+C in the terminal where it's running)
# Or if running in background:
pkill -f "node.*server"
```

## Step 1: Run the Merge

```bash
npm run db:merge
```

This will:
- ✅ Create a backup of the API database automatically
- ✅ Add ~28,000 new cards from local database
- ✅ Update pricing data (43K cards with pricing)
- ✅ Preserve hash data (20K hashed cards from API DB)

## Step 2: Verify All Components Use Same Database

After merge, all components should use `../cards.db`:

### ✅ API Server
- Uses: `server/config.js` → `../cards.db` ✅

### ✅ Admin Dashboard  
- Uses: API server via HTTP (no direct DB access) ✅

### ✅ Daily Pricing Collector
- Uses: `daily-pricing-collector.js` → `../cards.db` ✅

### ✅ Hash Scripts
- Uses: `scripts/*.js` → `../cards.db` ✅

### ✅ Pricing Scripts
- Uses: `update-pricing-*.js` → `../cards.db` ✅

## Step 3: Remove Local Database (Optional)

After successful merge and verification:

```bash
# Archive it first (already done)
# Then remove:
rm cards.db
```

## Step 4: Restart API Server

```bash
npm run api:dev
```

## Verification

After merge, check the database:

```bash
sqlite3 ../cards.db "SELECT COUNT(*) FROM products WHERE category_id = 3;"
# Should show ~58,000+ cards
```

## Troubleshooting

### Database Locked Error
- **Solution**: Stop API server and any other processes using the database
- Check: `lsof ../cards.db` to see what's using it

### Merge Fails Partway
- **Solution**: Restore from backup and try again
- Backup location: `../cards_backup_before_merge_*.db`


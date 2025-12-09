# Data Sync Architecture - Admin Dashboard ↔ Main App

## Current Architecture

### Database Connection
Both the admin dashboard and main app connect to the **same database** (`cards.db`), located at the project root:

- **Admin Dashboard**: `http://localhost:3002` → `http://localhost:3001/api` → `cards.db`
- **Main App**: `http://localhost:5173` → `http://localhost:3001/api` → `cards.db`

### Server Configuration
The server (`server/server.js`) reads from: `../cards.db` (relative to server directory)

## ✅ What's Already Working

### 1. Shared API Endpoints
Both apps use the same API endpoints:
- `/api/cards/*` - Card data
- `/api/admin/*` - Admin operations
- `/api/sets/*` - Set data
- `/api/pricing-monitor/*` - Pricing data

### 2. Real-time Sync
Since both apps query the **same database file**, changes made in the admin dashboard are **immediately visible** in the main app when:
- Admin updates card data
- Admin imports CSV
- Admin updates prices
- Admin adds/modifies sets

### 3. Authentication
- **Admin Dashboard**: Uses admin routes (`/api/admin/*`) with admin authentication
- **Main App**: Uses public card routes (`/api/cards/*`) 
- Both use the same backend server

## ⚠️ Potential Issues

### 1. Caching
The main app might cache data, preventing immediate updates. Need to ensure:
- API calls include cache-busting parameters
- Frontend refetches data on navigation
- Use timestamps or version numbers to invalidate cache

### 2. Real-time Updates
Currently, updates are **pushed to database** but **not broadcast to the frontend**. The main app must:
- Manually refresh to see changes
- Navigate away and back
- Trigger a re-fetch

## 🎯 Proposed Improvements

### Option 1: Real-time Notifications (Recommended)
Add a notification system to alert the main app when data changes:

```javascript
// server/routes/admin.js
router.post('/api/admin/cards/:id', async (req, res) => {
  // Update card
  await updateCard(id, data);
  
  // Broadcast change
  io.emit('card-updated', { id, data });
  
  res.json({ success: true });
});
```

### Option 2: Polling (Simple)
Main app polls for updates at regular intervals:

```javascript
// Main app checks for updates every 30 seconds
setInterval(async () => {
  const lastUpdate = await getLastUpdateTime();
  if (lastUpdate > localStorage.getItem('last_sync')) {
    // Refresh data
    await refreshCards();
  }
}, 30000);
```

### Option 3: Version Numbers (Reliable)
Add version numbers to database records and compare:

```sql
-- Add version column
ALTER TABLE products ADD COLUMN version INTEGER DEFAULT 1;

-- Increment on update
UPDATE products SET version = version + 1 WHERE product_id = ?;
```

### Option 4: Event Sourcing (Advanced)
Log all changes to an events table:

```sql
CREATE TABLE change_events (
  id INTEGER PRIMARY KEY,
  entity_type VARCHAR(50),
  entity_id TEXT,
  action VARCHAR(20),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📋 Implementation Plan

### Phase 1: Immediate (Current State)
✅ **Already Working**: Both apps use same database
✅ **Already Working**: Changes persist to database
✅ **Already Working**: Manual refresh shows updates

### Phase 2: Cache Busting
Add cache-busting to all API calls:
```javascript
fetch(`http://localhost:3001/api/cards/${id}?t=${Date.now()}`)
```

### Phase 3: Auto-Refresh
Implement polling or WebSocket for automatic updates

### Phase 4: Version Tracking
Add version numbers to enable intelligent syncing

## 🔍 Testing

To verify the current sync:

1. **Test in Admin Dashboard**:
   - Update a card's name or price
   - Click "Save"

2. **Check in Main App**:
   - Navigate away from the card detail page
   - Navigate back
   - Should show updated data

## 🎨 User Experience Improvements

1. **Show "Syncing" indicator** when data is being updated
2. **Toast notifications** when admin makes changes
3. **Auto-refresh** after admin operations complete
4. **Conflict resolution** if both apps try to update simultaneously

## 📝 Next Steps

1. Add cache-busting to main app API calls
2. Implement real-time sync (WebSocket or polling)
3. Add visual indicators for sync status
4. Test with concurrent users




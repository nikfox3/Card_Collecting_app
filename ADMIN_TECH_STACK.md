# Admin Dashboard - Technical Stack & Structure

## 🏗️ Complete Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER-FACING APP                              │
│                    (localhost:3002)                              │
│                                                                  │
│  React + Vite + Tailwind                                        │
│  • Browse cards                                                  │
│  • Search & filter                                               │
│  • Collections                                                   │
│  • Marketplace                                                   │
│  • Profile                                                       │
│                                                                  │
│  📊 Tracks events → Analytics API                               │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS API SERVER                           │
│                    (localhost:3001)                              │
│                                                                  │
│  Routes:                                                         │
│  • /api/cards/*           - Card search & data                   │
│  • /api/analytics/track   - Event tracking                       │
│  • /api/admin/*           - Admin operations (protected)         │
│                                                                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                     SQLITE DATABASE                              │
│                  (cards_backup_*.db)                             │
│                                                                  │
│  Tables:                                                         │
│  • cards (21,673)       - Card data                              │
│  • sets (237)           - Set data                               │
│  • cards_fts            - Full-text search                       │
│  • price_history        - Price tracking                         │
│  • analytics_events     - User analytics (NEW!)                  │
│  • user_collections     - User data (NEW!)                       │
│                                                                  │
└──────────────────────┬───────────────────────────────────────────┘
                       ↑
                       │
┌──────────────────────┴───────────────────────────────────────────┐
│                   ADMIN DASHBOARD                                │
│                  (localhost:3003)                                │
│                                                                  │
│  React + Vite + Tailwind + Chart.js                             │
│  • Database management                                           │
│  • Card CRUD operations                                          │
│  • CSV Import/Export                                             │
│  • Analytics visualization                                       │
│  • System maintenance                                            │
│                                                                  │
│  🔒 Protected by password auth                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Card_Collecting_app/
│
├── src/                          # Main user app
│   ├── App.jsx                   # Main app (enhanced with tracking)
│   ├── components/
│   └── ...
│
├── server/                       # NEW - Backend API
│   ├── server.js                 # Main Express server
│   ├── routes/
│   │   ├── cards.js              # Card API routes
│   │   ├── admin.js              # Admin-only routes
│   │   └── analytics.js          # Analytics routes
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── validation.js         # Request validation
│   ├── utils/
│   │   ├── database.js           # DB helper functions
│   │   ├── csv-parser.js         # CSV processing
│   │   └── analytics.js          # Analytics helper
│   ├── package.json
│   └── .env                      # Environment variables
│
├── admin-dashboard/              # NEW - Admin frontend
│   ├── src/
│   │   ├── App.jsx               # Admin app root
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Login page
│   │   │   ├── Dashboard.jsx    # Overview dashboard
│   │   │   ├── CardBrowser.jsx  # Browse/search cards
│   │   │   ├── CardEditor.jsx   # Edit single card
│   │   │   ├── ImportCSV.jsx    # CSV import wizard
│   │   │   ├── Analytics.jsx    # Analytics dashboard
│   │   │   ├── Sets.jsx         # Set management
│   │   │   └── System.jsx       # System tools
│   │   ├── components/
│   │   │   ├── StatCard.jsx
│   │   │   ├── CardTable.jsx
│   │   │   ├── Chart.jsx
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── api.js           # API client
│   │   │   └── helpers.js       # Helper functions
│   │   └── index.css            # Tailwind styles
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── database/                     # Database files
│   ├── cards_backup_*.db        # Main database
│   ├── schema.sql               # Schema definition
│   └── migrations/              # Future: DB migrations
│
├── package.json                 # Root package.json
└── .env                         # Environment config

```

---

## 🛠️ Technology Stack

### **Backend (Server):**
```json
{
  "express": "^4.18.2",           // Web framework
  "sqlite3": "^5.1.6",            // Database
  "cors": "^2.8.5",               // CORS handling
  "dotenv": "^16.3.1",            // Environment variables
  "multer": "^1.4.5-lts.1",       // File uploads
  "csv-parser": "^3.0.0",         // CSV parsing
  "jsonwebtoken": "^9.0.2",       // Authentication
  "bcrypt": "^5.1.1",             // Password hashing
  "express-rate-limit": "^7.1.5", // Rate limiting
  "helmet": "^7.1.0"              // Security headers
}
```

### **Admin Dashboard (Frontend):**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",  // Routing
  "axios": "^1.6.2",              // HTTP client
  "chart.js": "^4.4.0",           // Charts
  "react-chartjs-2": "^5.2.0",    // React Chart.js
  "tailwindcss": "^3.3.0",        // Styling
  "date-fns": "^2.30.0",          // Date formatting
  "react-hot-toast": "^2.4.1",    // Notifications
  "react-query": "^3.39.3"        // Data fetching
}
```

### **Shared Dependencies:**
- SQLite3 (database)
- Node.js 18+
- NPM or Yarn

---

## 🗄️ New Database Tables

### **Analytics Events:**
```sql
CREATE TABLE analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type VARCHAR(50) NOT NULL,        -- 'search', 'card_view', etc.
    user_id VARCHAR(100),                   -- Anonymous UUID
    session_id VARCHAR(100),                -- Session UUID
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    data JSON,                              -- Event-specific data
    user_agent TEXT,                        -- Browser info
    screen_size VARCHAR(20),                -- e.g., "1920x1080"
    referrer VARCHAR(255),                  -- Where they came from
    
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_session (session_id)
);
```

### **User Sessions:**
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    cards_viewed INTEGER DEFAULT 0,
    searches INTEGER DEFAULT 0,
    device_type VARCHAR(20),                -- 'mobile', 'desktop', 'tablet'
    
    INDEX idx_user_sessions_user (user_id),
    INDEX idx_user_sessions_started (started_at)
);
```

### **Popular Cards Cache:**
```sql
CREATE TABLE popular_cards (
    card_id VARCHAR(50) PRIMARY KEY,
    view_count_today INTEGER DEFAULT 0,
    view_count_week INTEGER DEFAULT 0,
    view_count_month INTEGER DEFAULT 0,
    search_count_today INTEGER DEFAULT 0,
    search_count_week INTEGER DEFAULT 0,
    search_count_month INTEGER DEFAULT 0,
    collection_count INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (card_id) REFERENCES cards(id)
);
```

---

## 🚦 API Routes Reference

### **Public Routes (Main App):**
```
GET  /api/cards/search?q=charizard&type=fire
GET  /api/cards/:id
GET  /api/sets
POST /api/analytics/track
```

### **Admin Routes (Protected):**
```
# Dashboard
GET  /api/admin/dashboard/stats

# Cards
GET  /api/admin/cards?page=1&limit=50&filter=no_price
GET  /api/admin/cards/:id
PUT  /api/admin/cards/:id
POST /api/admin/cards
DELETE /api/admin/cards/:id
POST /api/admin/cards/bulk-update
POST /api/admin/cards/import
GET  /api/admin/cards/export

# Analytics
GET  /api/admin/analytics/overview
GET  /api/admin/analytics/searches?days=7
GET  /api/admin/analytics/popular-cards?limit=20
GET  /api/admin/analytics/users?days=30
GET  /api/admin/analytics/export

# Sets
GET  /api/admin/sets
PUT  /api/admin/sets/:id
POST /api/admin/sets

# System
GET  /api/admin/system/health
POST /api/admin/system/backup
POST /api/admin/system/optimize
GET  /api/admin/system/logs?level=error

# Auth
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/auth/verify
```

---

## 🔐 Authentication Flow

```
User visits admin.localhost:3003
         ↓
    Login Page
         ↓
Enter password
         ↓
POST /api/admin/auth/login
         ↓
Server validates password
         ↓
Returns JWT token
         ↓
Store token in localStorage
         ↓
All future requests include:
Authorization: Bearer <token>
         ↓
Middleware validates token
         ↓
Access granted to admin routes
```

---

## 📊 Analytics Data Examples

### **Search Analytics:**
```json
{
  "top_searches": [
    {"query": "charizard", "count": 876, "trend": "+23%"},
    {"query": "pikachu", "count": 654, "trend": "+15%"},
    {"query": "mewtwo", "count": 543, "trend": "0%"}
  ],
  "failed_searches": [
    {"query": "pokemon card", "count": 23},
    {"query": "rare", "count": 18}
  ],
  "avg_results_per_search": 12.4,
  "searches_with_zero_results": 156
}
```

### **User Behavior:**
```json
{
  "daily_active_users": 156,
  "weekly_active_users": 489,
  "avg_session_duration": "8m 32s",
  "avg_cards_viewed_per_session": 15,
  "avg_searches_per_session": 3.2,
  "bounce_rate": "12%",
  "return_rate": "68%"
}
```

### **Collection Stats:**
```json
{
  "total_collections": 328,
  "avg_cards_per_collection": 27,
  "most_collected_card": {
    "name": "Pikachu VMAX",
    "id": "swsh1-188",
    "collections": 45
  },
  "total_cards_collected": 8856,
  "total_collection_value": "$143,267.89"
}
```

---

## 💻 Sample Code Snippets

### **Server Setup (server/server.js):**
```javascript
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = new sqlite3.Database(process.env.DATABASE_PATH);

// Routes
app.use('/api/cards', require('./routes/cards'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

### **Admin Card Browser (admin-dashboard/src/pages/CardBrowser.jsx):**
```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CardBrowser() {
  const [cards, setCards] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  
  const fetchCards = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/cards', {
        params: filters,
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('admin_token')}` 
        }
      });
      setCards(response.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCards();
  }, [filters]);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Card Browser</h1>
      
      {/* Filters */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <input 
          placeholder="Search cards..."
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="px-4 py-2 rounded-lg border"
        />
        {/* More filters... */}
      </div>
      
      {/* Card Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th>Image</th>
              <th>Name</th>
              <th>Set</th>
              <th>Price</th>
              <th>Artist</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.map(card => (
              <tr key={card.id}>
                <td><img src={card.images?.small} className="w-12 h-16" /></td>
                <td>{card.name}</td>
                <td>{card.set_name}</td>
                <td>${card.current_value || '—'}</td>
                <td>{card.artist || '⚠️ Missing'}</td>
                <td>
                  <button onClick={() => handleEdit(card)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### **Analytics Tracking (in main App.jsx):**
```javascript
// Add to App.jsx
const Analytics = {
  track: (event, data) => {
    const userId = localStorage.getItem('user_uuid') || 
                   (() => {
                     const id = 'user_' + Math.random().toString(36).substr(2, 9);
                     localStorage.setItem('user_uuid', id);
                     return id;
                   })();
    
    const sessionId = sessionStorage.getItem('session_uuid') ||
                      (() => {
                        const id = 'session_' + Math.random().toString(36).substr(2, 9);
                        sessionStorage.setItem('session_uuid', id);
                        return id;
                      })();
    
    fetch('http://localhost:3001/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: event,
        user_id: userId,
        session_id: sessionId,
        data: data,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_size: `${window.innerWidth}x${window.innerHeight}`
      })
    }).catch(() => {}); // Silent fail
  }
};

// Use throughout app:
Analytics.track('search', { query: searchQuery, results: cards.length });
Analytics.track('card_view', { card_id: card.id, card_name: card.name });
Analytics.track('collection_add', { card_id: card.id });
```

---

## 🎯 MVP Feature Checklist

### **Backend (server/):**
- [ ] Express server setup
- [ ] Database connection
- [ ] Authentication middleware
- [ ] Card CRUD routes
- [ ] Analytics tracking endpoint
- [ ] CSV import endpoint
- [ ] Stats/dashboard endpoint

### **Admin Dashboard (admin-dashboard/):**
- [ ] React app setup with Vite
- [ ] Tailwind CSS configuration
- [ ] Login page
- [ ] Dashboard overview
- [ ] Card browser with search
- [ ] Card editor form
- [ ] CSV import wizard
- [ ] Basic analytics page

### **Main App Integration:**
- [ ] Add Analytics tracking helper
- [ ] Track search events
- [ ] Track card view events
- [ ] Track collection events
- [ ] Track filter/sort events

### **Database:**
- [ ] Create analytics_events table
- [ ] Create user_sessions table
- [ ] Add indexes for analytics
- [ ] Set up analytics aggregation

---

## ⏱️ Estimated Timeline

### **Phase 1: MVP (2 weeks)**

**Week 1: Backend + Basic Frontend**
- Day 1-2: Server setup, auth, basic routes
- Day 3-4: Admin UI setup, login, dashboard
- Day 5: Integration & testing

**Week 2: Features + Analytics**
- Day 6-7: Card browser & editor
- Day 8-9: CSV import, analytics tracking
- Day 10: Analytics dashboard, polish

### **Phase 2: Enhancements (1 week)**
- Advanced filters
- Bulk operations
- Charts and visualizations
- Export functionality

### **Phase 3: Polish (ongoing)**
- Performance optimization
- Additional features based on usage
- Security enhancements

---

## 🎯 Decision Time

**I recommend starting with the MVP because:**

1. **Immediate Value:**
   - Fix missing data 100x faster
   - Understand user behavior from day 1
   - Professional admin capabilities

2. **Low Risk:**
   - Separate app = won't affect main app
   - Can iterate and improve
   - Easy to add features later

3. **Scalable:**
   - Ready for multi-user
   - Can add advanced features
   - Professional foundation

4. **Time Investment:**
   - ~30 hours total
   - Saves 10+ hours/month in maintenance
   - ROI in first month

**Ready to build this?** 🚀

I can start with:
1. Setting up the server infrastructure
2. Creating the admin dashboard boilerplate
3. Implementing core features
4. Adding analytics tracking

Let me know if you'd like me to proceed! 🎯











# Admin Dashboard - Setup & Usage Guide

## 🎯 Overview

The Admin Dashboard is a separate web application for managing your Pokemon Card Collection database and viewing user analytics.

---

## 🚀 Quick Start

### **Start Everything:**
```bash
./start-admin.sh
```

This will start:
- ✅ Backend API Server (port 3001)
- ✅ Admin Dashboard (port 3003)

### **Access Admin Dashboard:**
1. Open browser to: **http://localhost:3003**
2. Login with password: **admin123**
3. Start managing your database!

---

## 📁 Project Structure

```
Card_Collecting_app/
├── src/                      # Main user app (port 3002)
├── server/                   # Backend API (port 3001)
│   ├── server.js            # Main server file
│   ├── config.js            # Configuration
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── admin.js         # Admin-only routes
│   │   ├── analytics.js     # Analytics routes
│   │   └── cards.js         # Card API routes
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   └── utils/
│       └── database.js      # Database helpers
│
├── admin-dashboard/          # Admin frontend (port 3003)
│   ├── src/
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # Entry point
│   │   ├── pages/
│   │   │   ├── Login.jsx    # Login page
│   │   │   ├── Dashboard.jsx    # Overview dashboard
│   │   │   ├── CardBrowser.jsx  # Browse cards
│   │   │   ├── CardEditor.jsx   # Edit cards
│   │   │   ├── ImportCSV.jsx    # CSV import
│   │   │   └── Analytics.jsx    # Analytics viewer
│   │   ├── components/
│   │   │   └── Layout.jsx   # Main layout with nav
│   │   └── utils/
│   │       └── api.js       # API client
│   └── package.json
│
└── database/                 # Shared database
    └── cards_backup_*.db
```

---

## 🔧 Manual Setup

If you need to start services manually:

### **1. Start Backend Server:**
```bash
cd server
node server.js
```

Backend will run on **http://localhost:3001**

### **2. Start Admin Dashboard:**
```bash
cd admin-dashboard
npm run dev
```

Admin dashboard will run on **http://localhost:3003**

---

## 🎨 Admin Dashboard Features

### **📊 Dashboard (Home)**
- Real-time database statistics
- Data quality metrics
- Quick action buttons
- Recent activity feed

**What you can see:**
- Total cards (21,673)
- Pricing coverage (58.7%)
- Artist coverage (87.9%)
- Active users today
- Top searches

### **🎴 Card Browser**
- Browse all 21,673 cards
- Search by name, artist, ID
- Filter options:
  - All Cards
  - Missing Price
  - Missing Artist
  - High Value ($100+)
- Paginated results (50 per page)
- Click "Edit" to modify any card

### **✏️ Card Editor**
- Edit individual cards
- Live preview of card image
- Update fields:
  - Name, Artist, Rarity, HP
  - Current Value (pricing)
  - TCGPlayer pricing (coming soon)
- Save changes with one click

### **📁 CSV Import**
- Upload CSV files
- Bulk update cards
- Preview before import
- *Note: Full CSV import wizard coming soon*
- *Current workaround: Use command-line script*

### **📈 Analytics**
- View user behavior metrics
- Top searched cards
- Most viewed cards
- Search trends over time
- User engagement stats
- Filter by time range (7, 14, 30 days)

---

## 🔐 Authentication

### **Default Login:**
- **Username:** admin (no username required, just password)
- **Password:** admin123

### **Change Password:**
Edit `server/config.js`:
```javascript
adminPassword: 'your-new-password-here'
```

### **Security:**
- JWT tokens (24-hour expiration)
- Protected API routes
- Session-based authentication
- CORS enabled for localhost only

---

## 📊 Analytics Tracking

### **How it Works:**
1. Main app tracks user events (searches, card views, etc.)
2. Events sent to `/api/analytics/track`
3. Stored in `analytics_events` table
4. Viewable in Admin Dashboard → Analytics

### **Events Being Tracked:**
- ✅ **Searches** - What users search for
- ✅ **Card Views** - Which cards are popular
- ✅ **Collection Adds** - What users collect
- ✅ **Filter Usage** - Which filters are used

### **Privacy:**
- Anonymous user IDs (no personal data)
- Session-based tracking
- Can be disabled: `localStorage.setItem('enable_analytics', 'false')`

---

## 🗄️ Database Tables

### **New Tables Added:**

**analytics_events:**
- Stores all user interaction events
- Fields: event_type, user_id, session_id, data, timestamp
- Indexes on type, user, timestamp for fast queries

**user_sessions:**
- Tracks user sessions
- Fields: user_id, session_id, started_at, page_views, etc.
- Helps calculate engagement metrics

---

## 🛠️ Common Tasks

### **Task 1: Update Card Pricing**
1. Go to **Cards** → Filter by "Missing Price"
2. Click **Edit** on a card
3. Enter **Current Value**
4. Click **Save**

### **Task 2: Fix Missing Artists**
1. Go to **Cards** → Filter by "Missing Artist"
2. Browse cards without artists
3. Click **Edit** and add artist name
4. Click **Save**

### **Task 3: View Popular Cards**
1. Go to **Analytics**
2. Select time range (7, 14, or 30 days)
3. See "Most Viewed Cards" section
4. Identify which cards users love

### **Task 4: Check Search Trends**
1. Go to **Analytics**
2. View "Top Searches" section
3. See what users are searching for
4. Use insights to improve app

---

## 🔧 Troubleshooting

### **Can't Login:**
- Check backend server is running (port 3001)
- Default password is: `admin123`
- Check browser console for errors

### **No Analytics Data:**
- Make sure backend server is running
- Analytics tables created automatically on server start
- Users need to use the app to generate data

### **Cards Not Loading:**
- Check database path in `server/config.js`
- Verify database file exists
- Check browser console for API errors

### **Port Already in Use:**
- Backend (3001): Check if another server is running
- Admin (3003): Check vite.config.js to change port

---

## 📡 API Endpoints

### **Public Endpoints:**
```
GET  /health                     - Server health check
GET  /api/cards/search?q=...     - Search cards
GET  /api/cards/stats            - Card statistics  
POST /api/analytics/track        - Track user events
```

### **Admin Endpoints (require authentication):**
```
POST /api/auth/login             - Admin login
GET  /api/admin/dashboard/stats  - Dashboard statistics
GET  /api/admin/cards            - Get cards (paginated)
GET  /api/admin/cards/:id        - Get single card
PUT  /api/admin/cards/:id        - Update card
GET  /api/admin/system/health    - System health
GET  /api/analytics/overview     - Analytics overview
GET  /api/analytics/searches/top - Top searches
GET  /api/analytics/cards/popular- Popular cards
```

---

## 🎯 Next Steps

### **Immediate (Working Now):**
- ✅ Login to admin dashboard
- ✅ Browse and edit cards
- ✅ View analytics (once data is generated)
- ✅ Check dashboard stats

### **Coming Soon:**
- 📁 Web-based CSV import
- 📊 More analytics charts
- 🔄 Bulk edit functionality
- 📈 Price history tracking
- 🎨 Enhanced card preview

### **Future Enhancements:**
- 🔐 Multiple admin accounts
- 📧 Email notifications for important events
- 🤖 Automated data sync from APIs
- 📱 Mobile-responsive admin dashboard
- 🎨 Dark/light mode toggle

---

## 💡 Tips

1. **Bookmark the admin dashboard** for easy access
2. **Check analytics weekly** to understand user behavior
3. **Fix missing data in batches** using filters
4. **Export data regularly** as backups
5. **Monitor server logs** for errors

---

## 🆘 Support

Created files for reference:
- `ADMIN_DASHBOARD_PROPOSAL.md` - Complete feature list
- `ADMIN_IMPLEMENTATION_PLAN.md` - Implementation roadmap
- `ADMIN_TECH_STACK.md` - Technical details
- `DATABASE_STRUCTURE_ANALYSIS.md` - Database overview

---

## ✅ Success!

Your admin dashboard is now ready to use! 🎉

Start the services and login to begin managing your Pokemon card database efficiently!











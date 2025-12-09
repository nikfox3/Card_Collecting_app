# 🚀 Getting Started with Admin Dashboard

## Quick Start (3 Steps)

### **Step 1: Start the Services**

Run this command from the project root:

```bash
# Start API Server (if not running)
node server/api.js &

# Start Admin Dashboard (if not running)
cd admin-dashboard && npm run dev &
```

**Check if running:**
- API Server: http://localhost:3001/api/cards/stats
- Admin Dashboard: http://localhost:3003

### **Step 2: Login**

1. Open browser: **http://localhost:3003**
2. Enter password: **admin123**
3. Click "Login"

### **Step 3: Start Managing!**

You're now in the admin dashboard! Explore:
- **Dashboard** - See stats
- **Cards** - Browse & edit cards
- **Analytics** - View user behavior

---

## 📖 First-Time Walkthrough

### **Tour of the Dashboard:**

When you first login, you'll see:

```
┌─────────────────────────────────────────────────────────┐
│ Dashboard Overview                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Stats Cards:                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │21,673    │ │ 58.7%    │ │ 87.9%    │ │    0     │  │
│  │Cards     │ │ Pricing  │ │ Artist   │ │ Users    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  🎯 Quick Actions:                                      │
│  [Fix Missing Prices] [Fix Missing Artists]             │
│  [Import CSV]         [View Analytics]                  │
│                                                          │
│  🔍 Top Searches:                                       │
│  (Will populate once users search)                      │
│                                                          │
│  ✅ Data Quality:                                       │
│  Pricing: ████████████░░░░░░░░  58.7%                  │
│  Artist:  █████████████████░░░  87.9%                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎴 Managing Cards

### **Browse Cards:**

1. Click **"Cards"** in sidebar
2. You'll see a table of all cards
3. Use search box to find specific cards
4. Click filter buttons:
   - **All Cards** - Show everything
   - **Missing Price** - 8,953 cards need pricing
   - **Missing Artist** - 2,610 cards need artists
   - **High Value** - Cards worth $100+

### **Edit a Card:**

1. Find a card in the browser
2. Click **"Edit"** button
3. You'll see:
   - **Left:** Card image preview
   - **Right:** Editable fields
4. Update any field (name, artist, rarity, price, HP)
5. Click **"Save Changes"**
6. Done! Card is updated instantly

### **Example: Fix Missing Price**

```
1. Go to Cards → Filter: "Missing Price"
2. Click Edit on first card
3. Enter Current Value: $2.50
4. Click Save
5. Card now has pricing! ✅
```

---

## 📈 Viewing Analytics

### **What You'll See:**

**Activity Metrics (Last 7 days):**
- Total unique users
- Total sessions
- Total searches
- Total card views

**Top Searches:**
- Most searched terms
- Number of searches
- Average results per search

**Popular Cards:**
- Most viewed cards
- View counts
- Card details

### **How to Use Insights:**

**If "Charizard" is #1 searched:**
- ✅ Feature Charizard cards on homepage
- ✅ Ensure Charizard pricing is accurate
- ✅ Create Charizard collection highlights

**If searches return 0 results:**
- ⚠️ Add missing cards to database
- ⚠️ Improve search algorithm
- ⚠️ Check for spelling variants

---

## 🔧 Common Tasks

### **Task 1: Bulk Fix Missing Pricing**

**Current Method:**
1. Filter for "Missing Price"
2. Edit cards one by one
3. Save each card

**Future (CSV Import):**
1. Export missing price cards
2. Fill in prices in Excel
3. Import CSV
4. Done in 5 minutes!

### **Task 2: Find High-Value Cards**

1. Go to **Cards**
2. Click **"High Value"** filter
3. See all cards worth $100+
4. Review pricing accuracy
5. Edit if needed

### **Task 3: Monitor User Behavior**

1. Go to **Analytics**
2. Select time range (7, 14, or 30 days)
3. Review top searches
4. Check popular cards
5. Use insights to improve app

---

## 🎯 Key Features

### **What Makes This Powerful:**

1. **Visual Card Management**
   - See card images
   - Edit with instant preview
   - No SQL required

2. **Smart Filtering**
   - Find missing data instantly
   - Focus on high-value cards
   - Paginated for performance

3. **Real-Time Analytics**
   - Understand user behavior
   - Data-driven decisions
   - Track engagement

4. **Secure & Separate**
   - Password protected
   - Separate from user app
   - Won't affect user experience

---

## 🔐 Security Notes

### **Current Security:**
- ✅ Password protection
- ✅ JWT tokens (24hr expiration)
- ✅ Admin-only API routes
- ✅ CORS protection

### **Recommendations:**
1. **Change default password** (admin123)
2. **Use HTTPS** in production
3. **Keep JWT secret** private
4. **Monitor login attempts**

### **Future Enhancements:**
- 2FA authentication
- Multiple admin accounts
- Role-based permissions
- Audit logs
- IP whitelisting

---

## 📊 Database Info

**Current State:**
- **Total Cards:** 21,673
- **With Pricing:** 12,720 (58.7%)
- **With Artist:** 19,063 (87.9%)
- **Missing Price:** 8,953 cards
- **Missing Artist:** 2,610 cards

**Tables:**
- `cards` - All card data
- `sets` - Set information
- `analytics_events` - User tracking (NEW!)
- `user_sessions` - Session tracking (NEW!)
- `price_history` - Price tracking

---

## 🆘 Troubleshooting

### **Can't Access Admin Dashboard:**
```bash
# Check if running
lsof -i :3003

# Start it
cd admin-dashboard && npm run dev
```

### **Login Not Working:**
```bash
# Check API server
curl http://localhost:3001/api/cards/stats

# Restart API server
node server/api.js
```

### **No Analytics Data:**
- Users need to use the main app first
- Check if API server is running
- Analytics will populate over time

### **Cards Not Loading:**
- Check browser console for errors
- Verify API server is running
- Check database path in server/api.js

---

## 🎊 You're All Set!

Your admin dashboard is **ready to use**!

**Next:**
1. Login at http://localhost:3003
2. Browse your 21,673 cards
3. Start fixing missing data
4. Monitor user behavior

**Have fun managing your Pokemon card database! 🎴✨**











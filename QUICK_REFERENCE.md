# ⚡ Quick Reference Guide

## 🚀 Start Services

```bash
# API Server (port 3001)
cd /Users/NikFox/Documents/git/Card_Collecting_app
node server/server.js

# Main App (port 3000)
npm run dev

# Admin Dashboard (port 3003)
cd admin-dashboard
npm run dev
```

## 🔧 Common Commands

```bash
# Restart Server
pkill -f "node server/server.js" && node server/server.js &

# Validate Database
node scripts/validate-data-integrity.js

# Fix Data Issues
node fix-all-data-inconsistencies.js

# Update Prices
node update-pricing-pokemontcg-api.js

# Analyze Database
node analyze-database-structure.js
```

## 📊 Database Quick Stats

- **Total Cards:** 20,700
- **Total Sets:** 189
- **Data Quality:** 95%+
- **Query Speed:** <100ms
- **Database Size:** ~50MB

## 🎯 URLs

- **Main App:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3003
- **API Server:** http://localhost:3001

## 📁 Important Files

### **Database**
- `database/cards.db` - Main database (20,700 cards)

### **Documentation**
- `DATABASE_STRUCTURE_FINAL.md` - Complete schema reference
- `CSV_IMPORT_GUIDE.md` - Import instructions
- `DATA_ORGANIZATION_RECOMMENDATIONS.md` - Best practices
- `SYSTEM_SUMMARY.md` - Full system overview
- `QUICK_REFERENCE.md` - This file

### **Templates**
- `CSV_TEMPLATE_COMPLETE.csv` - CSV import template

### **Scripts**
- `scripts/validate-data-integrity.js` - Data validation
- `fix-all-data-inconsistencies.js` - Auto-fix issues
- `update-pricing-pokemontcg-api.js` - Update prices
- `analyze-database-structure.js` - Database analysis

## 🔍 API Endpoints

### Public
```
GET /api/cards/search?q={query}
GET /api/cards/:id
GET /api/cards/trending
GET /api/cards/top-movers
GET /api/cards/price-history
```

### Admin
```
GET  /api/admin/cards
PUT  /api/admin/cards/:id
POST /api/admin/csv/import
POST /api/admin/prices/bulk-update
```

## 📝 Data Formats

### Card Number
```
Always: XXX/YYY
Examples: 95/203, TG22/TG30, 4/102
```

### JSON Fields
```javascript
types: ["Fire"]
retreat_cost: ["Colorless", "Colorless"]
images: {"small": "url", "large": "url", "high": "url"}
```

### Dates
```
Format: YYYY/MM/DD
Example: 2025/09/26
```

## ⚠️ Common Issues

### "Port already in use"
```bash
pkill -f "node server/server.js"
# or
lsof -ti:3001 | xargs kill
```

### "Database locked"
```bash
# Close all connections and restart server
pkill -f "node server/server.js"
node server/server.js &
```

### "No such column"
```bash
# Run data consistency fix
node fix-all-data-inconsistencies.js
```

## ✅ Data Quality Checklist

- [ ] All cards have required fields (id, name, set_id, number, images)
- [ ] All JSON fields are valid JSON
- [ ] All retreat_cost are JSON arrays (not numbers)
- [ ] All images are JSON objects (not plain URLs)
- [ ] All supertypes are "Pokémon", "Trainer", or "Energy"
- [ ] No negative prices
- [ ] All sets have release dates
- [ ] No orphaned cards (set_id exists in sets table)

## 🎯 Quick Fixes

### Fix Supertype
```sql
UPDATE cards SET supertype = 'Pokémon' WHERE supertype = 'Pokemon';
```

### Fix Retreat Cost Format
```sql
-- Already done via fix-all-data-inconsistencies.js
```

### Add Missing Set Date
```sql
UPDATE sets SET release_date = '2025/09/26' WHERE id = 'me01';
```

## 📞 Troubleshooting

### Server not responding
1. Check if server is running: `ps aux | grep "node server"`
2. Check server logs: `tail -f server.log`
3. Restart: `pkill -f "node server" && node server/server.js &`

### Database errors
1. Run validation: `node scripts/validate-data-integrity.js`
2. Fix issues: `node fix-all-data-inconsistencies.js`
3. Check integrity: `sqlite3 database/cards.db "PRAGMA integrity_check;"`

### Import errors
1. Validate CSV format matches template
2. Ensure JSON fields are properly escaped
3. Check that set_id exists in sets table
4. Preview before full import

## 🎉 Success Criteria

✅ **All services running** (ports 3000, 3001, 3003)  
✅ **Database validated** (0 errors)  
✅ **20,700 cards** loaded and searchable  
✅ **189 sets** with release dates  
✅ **Sub-100ms** query performance  
✅ **95%+ data** completeness  

---

**🚀 You're all set! Your Pokemon Card Collection app is production-ready.**

For detailed information, see the full documentation in:
- `DATABASE_STRUCTURE_FINAL.md`
- `SYSTEM_SUMMARY.md`
- `CSV_IMPORT_GUIDE.md`









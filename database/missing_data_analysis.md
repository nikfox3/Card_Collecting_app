# Missing Data Analysis Report

Generated: October 9, 2025

## 📊 Database Overview
- **Total Cards**: 21,673
- **Total Sets**: 237
- **Database Size**: 28.4 MB

---

## 🚨 Critical Missing Data

### 1. **Missing Prices** ⚠️
- **Cards without prices**: 3,591 (16.6% of total)
- **Cards with valid prices**: 18,082 (83.4% of total)

#### **Sets with Most Missing Prices:**
| Set Name | Missing Prices |
|----------|----------------|
| Genetic Apex | 286 (100%) |
| Destined Rivals | 244 (100%) |
| SM Black Star Promos | 243 |
| Wisdom of Sea and Sky | 241 (100%) |
| Celestial Guardians | 239 (100%) |
| Space-Time Smackdown | 207 |
| Scarlet & Violet Black Star Promos | 195 |
| Shining Revelry | 111 |
| Eevee Grove | 107 |
| Secluded Springs | 105 |

**Analysis**: 
- "Genetic Apex" (A1) appears to be a **Pokémon TCG Pocket** digital-only set - no physical prices available
- "Destined Rivals" (sv10) is a future set (Release: May 30, 2025) - prices not yet available
- Japanese-exclusive sets (Wisdom of Sea and Sky, Celestial Guardians, etc.) may not have TCGPlayer pricing
- Promo sets often lack comprehensive pricing data

---

### 2. **Missing Artist Information** ⚠️
- **Cards without artist**: 2,610 (12% of total)

**Why**: Likely from sets that don't have complete metadata from the API source

---

### 3. **Missing Images** ⚠️
- **Cards without images**: 941 (4.3% of total)

**Sample Cards with Missing Images:**
- Unown (exu)
- Beldum (tk-ex-p)
- Swirlix (tk-xy-w)
- Glameow (tk-xy-p)
- Skitty (tk-xy-latio)

**Analysis**: These appear to be from **Trainer Kit** sets which often have limited image availability

---

### 4. **Missing Rarity** ⚠️
- **Cards without rarity**: 31 (0.14% of total)

**Impact**: Minimal - very few cards affected

---

### 5. **Inconsistent Supertype** ⚠️
- **"Pokemon" (no accent)**: 17,716 cards
- **"Pokémon" (with accent)**: ~3,900 cards

**Impact**: This inconsistency can affect filtering and search

---

## 📋 Data Quality Issues

### 1. **Digital-Only Cards**
**Problem**: Pokémon TCG Pocket cards (Genetic Apex, etc.) are digital-only and don't have physical market prices
**Solution**: 
- Flag these as "Digital Only" 
- Consider adding "digital currency" pricing if available
- Or exclude from marketplace/pricing features

### 2. **Future Release Sets**
**Problem**: Sets like "Destined Rivals" (May 2025) don't have pricing yet
**Solution**: 
- Mark as "Pre-release" or "Coming Soon"
- Add price syncing once released

### 3. **Japanese/International Sets**
**Problem**: Japanese exclusive sets may not have TCGPlayer pricing
**Solution**: 
- Integrate with additional pricing sources (CardMarket for EU, Japanese marketplaces)
- Currently only 18% of cards have `cardmarket` data

### 4. **Promo & Special Sets**
**Problem**: Promo cards often lack standardized pricing
**Solution**: 
- Manual price curation for popular promos
- Community-sourced pricing data

### 5. **Trainer Kit Cards**
**Problem**: Limited availability and missing images/data
**Solution**: 
- These are typically low-value reprints
- Consider flagging as "Trainer Kit" variant

---

## 💡 Recommended Data Improvements

### **Priority 1: Price Coverage (High Impact)**
```javascript
// Action Items:
1. Identify digital-only sets and flag them
2. Add CardMarket integration for EU/Japanese cards
3. Implement fallback pricing for promos
4. Schedule regular price updates for new sets
```

### **Priority 2: Image Coverage (Medium Impact)**
```javascript
// Action Items:
1. Find alternative image sources for Trainer Kit cards
2. Use placeholder images for cards without images
3. Add image upload feature for user-submitted images
```

### **Priority 3: Artist Information (Low Impact)**
```javascript
// Action Items:
1. Cross-reference with secondary data sources
2. Allow community contributions for missing data
3. Update sync script to pull from additional APIs
```

### **Priority 4: Data Consistency (Medium Impact)**
```javascript
// Action Items:
1. Standardize "Pokemon" vs "Pokémon" (use accent version)
2. Normalize rarity strings (capitalize consistently)
3. Add data validation on import
```

---

## 🔧 Quick Fixes Available

### **Fix Supertype Inconsistency**
```sql
UPDATE cards 
SET supertype = 'Pokémon' 
WHERE supertype = 'Pokemon';
```

### **Add Digital-Only Flag**
```sql
ALTER TABLE cards ADD COLUMN is_digital_only BOOLEAN DEFAULT 0;

UPDATE cards 
SET is_digital_only = 1 
WHERE set_id IN ('A1', 'A2', 'A3', 'A4', 'A5');
```

### **Add Pre-release Flag**
```sql
ALTER TABLE cards ADD COLUMN is_prerelease BOOLEAN DEFAULT 0;

UPDATE cards 
SET is_prerelease = 1 
WHERE set_id IN (
  SELECT id FROM sets WHERE release_date > date('now')
);
```

---

## 📈 Data Sources to Consider

### **Current Sources:**
- ✅ Pokémon TCG API (primary)
- ✅ TCGPlayer (pricing)
- ⚠️ CardMarket (limited coverage)

### **Recommended Additional Sources:**
1. **PokéAPI** - Additional card metadata
2. **Bulbapedia** - Artist information, variant details
3. **CardMarket API** - European pricing
4. **Yahoo! Japan Auctions** - Japanese card pricing
5. **eBay API** - Sold listings for rare/promo cards
6. **Community Database** - User-submitted corrections

---

## 🎯 Next Steps

1. **Run data cleanup scripts**
   - Fix supertype inconsistency
   - Add digital-only flags
   - Add pre-release flags

2. **Enhance price syncing**
   - Add CardMarket integration
   - Add fallback pricing strategies
   - Schedule regular sync for new sets

3. **Improve image coverage**
   - Find alternative sources for missing images
   - Add placeholder system
   - Enable user uploads

4. **Add data validation**
   - Validate on import
   - Flag suspicious data
   - Track data quality scores

---

## 📞 Conclusion

Your database has **excellent coverage** for mainstream cards (83.4% have pricing), but gaps exist in:
- **Digital-only sets** (Pokémon TCG Pocket)
- **Future releases** (not yet available)
- **Japanese exclusive sets** (limited US pricing)
- **Trainer Kit cards** (limited data availability)

Most missing data is **explainable** and can be addressed with targeted improvements rather than a complete database overhaul.





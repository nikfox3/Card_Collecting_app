# 📊 CSV Import Guide for Pokemon Card Database

## 📋 CSV Template Overview

The `CSV_TEMPLATE_COMPLETE.csv` file contains the complete structure for importing card data into the database.

---

## 🎯 Required vs Optional Fields

### ✅ **ALWAYS REQUIRED** (Every Card)
- `id` - Unique identifier (e.g., `swsh7-95`, `base1-4`)
- `name` - Card name
- `set_id` - Set identifier (must exist in sets table)
- `set_name` - Set name (for reference)
- `supertype` - `Pokémon`, `Trainer`, or `Energy`
- `number` - Card number in set
- `printed_total` - Total cards in set
- `images` - JSON object with image URLs

### ✅ **REQUIRED FOR POKÉMON**
- `hp` - Hit points (except special cards)
- `types` - JSON array of types
- `attacks` - JSON array of attacks (except babies)
- `retreat_cost` - JSON array (can be empty `[]`)

### ⚠️ **OPTIONAL** (Depends on Card Type)
- `abilities` - Only if Pokémon has abilities
- `evolves_from` - Only for evolved Pokémon
- `level` - Only in older sets (DP era and before)
- `weaknesses` - Not all Pokémon have weaknesses
- `resistances` - Not all Pokémon have resistances
- `subtypes` - Additional classification
- `artist` - Illustrator name
- `rarity` - Card rarity
- `current_value` - Current market price
- `national_pokedex_numbers` - Pokedex numbers

---

## 📝 Field Formats & Examples

### **1. ID Format**
```
Format: {set_id}-{number}
Examples:
  - swsh7-95 (regular number)
  - swsh7-TG22 (trainer gallery)
  - base1-4 (base set)
  - xy11-RC32 (radiant collection)
```

### **2. JSON Array Fields**

**Types:**
```json
["Fire"]
["Darkness"]
["Water", "Psychic"]
["Colorless"]
```

**Subtypes:**
```json
["VMAX"]
["Stage 2"]
["Basic"]
["Supporter"]
["Special"]
```

**Retreat Cost:**
```json
[]  // No retreat cost
["Colorless"]  // 1 energy
["Colorless", "Colorless"]  // 2 energies
["Fire", "Fire", "Fire"]  // 3 specific energies
```

**National Pokedex Numbers:**
```json
["6"]  // Charizard
["197"]  // Umbreon
["25"]  // Pikachu
```

### **3. JSON Object Fields**

**Images:**
```json
{
  "small": "https://assets.tcgdex.net/en/swsh/swsh7/95/low.webp",
  "large": "https://assets.tcgdex.net/en/swsh/swsh7/95/high.webp",
  "high": "https://assets.tcgdex.net/en/swsh/swsh7/95/high.webp"
}
```

**Abilities:**
```json
[{
  "name": "Dark Signal",
  "type": "Ability",
  "text": "When you play this Pokémon from your hand..."
}]
```

**Attacks:**
```json
[{
  "name": "Max Darkness",
  "cost": ["Darkness", "Colorless", "Colorless"],
  "damage": 160,
  "effect": "This attack does 60 damage..."
}]
```

**Weaknesses:**
```json
[{
  "type": "Grass",
  "value": "×2"
}]
```

**Resistances:**
```json
[{
  "type": "Fighting",
  "value": "-30"
}]
```

**TCGPlayer Pricing:**
```json
{
  "prices": {
    "holofoil": {
      "low": 16.00,
      "mid": 25.00,
      "high": 50.00,
      "market": 16.07
    },
    "normal": {
      "low": 0.50,
      "mid": 1.00,
      "high": 3.00,
      "market": 0.75
    }
  }
}
```

---

## 🎨 Card Type Examples

### **Example 1: Pokémon VMAX (Full Data)**
```csv
swsh7-95,Umbreon VMAX,swsh7,Evolving Skies,Pokémon,"[""VMAX""]",310,,["Darkness"],Umbreon V,"[{""name"":""Dark Signal"",""type"":""Ability"",""text"":""When you play this Pokémon...""}]","[{""name"":""Max Darkness"",""cost"":[""Darkness"",""Colorless"",""Colorless""],""damage"":160}]","[{""type"":""Grass"",""value"":""×2""}]",[],["Colorless","Colorless"],2,95,203,Aya Kusube,Rare Holo VMAX,"{""small"":""...""",""large"":""...""",""high"":""...""}","{""prices"":{...}}","",16.07,["197"],"[{""format"":""Standard"",""legality"":""Legal""}]",E,E,Standard,en,Normal,"[""Normal"",""Reverse Holo""]",1,1,0,0,0,0,physical,0,0
```

### **Example 2: Trainer Card**
```csv
swsh1-163,Professor's Research,swsh1,Sword & Shield,Trainer,"[""Supporter""]",,,,,,"[{""name"":""Professor's Research"",""text"":""Discard your hand and draw 7 cards.""}]",,,[],0,163,202,Naoki Saito,Uncommon,"{""small"":""...""",""large"":""...""",""high"":""...""}","{""prices"":{...}}","",0.08,,"[{""format"":""Standard"",""legality"":""Legal""}]",D,D,Standard,en,Normal,"[""Normal"",""Reverse Holo""]",1,1,0,0,0,0,physical,0,0
```

### **Example 3: Energy Card**
```csv
base1-98,Double Colorless Energy,base1,Base Set,Energy,"[""Special""]",,,,,,"[{""text"":""Provides 2 Colorless Energy.""}]",,,[],0,96,102,Keiji Kinebuchi,Uncommon,"{""small"":""...""",""large"":""...""",""high"":""...""}","{""prices"":{...}}","",3.00,,"[{""format"":""Unlimited"",""legality"":""Legal""}]",,,Unlimited,en,Normal,"[""Normal"",""1st Edition""]",1,0,0,1,0,0,physical,0,0
```

---

## 🔄 Import Process

### **Using Admin Dashboard:**
1. Go to Admin Dashboard → CSV Import
2. Upload your CSV file
3. Click "Preview" to see first 10 rows
4. Review for errors
5. Click "Import All" to process all rows

### **Using Command Line Script:**
```bash
node import-csv-to-database.js your-file.csv
```

---

## ⚠️ Common Issues & Solutions

### **Issue 1: "Invalid JSON"**
**Cause:** JSON fields not properly escaped in CSV  
**Solution:** Use double quotes `""` inside JSON strings in CSV

❌ Wrong:
```csv
name,types
Pikachu,["Lightning"]
```

✅ Correct:
```csv
name,types
Pikachu,"[""Lightning""]"
```

### **Issue 2: "Card number format XXX/?"**
**Cause:** Missing `printed_total` field  
**Solution:** Always include printed_total for every card

### **Issue 3: "No image displayed"**
**Cause:** Images field is plain URL string instead of JSON object  
**Solution:** Use JSON object format:
```json
{"small":"url","large":"url","high":"url"}
```

### **Issue 4: "Retreat cost showing as 2.0"**
**Cause:** Numeric value instead of JSON array  
**Solution:** Convert to array:
- `2.0` → `["Colorless","Colorless"]`
- `1` → `["Colorless"]`
- `0` → `[]`

---

## 📐 Data Validation Rules

### **ID Validation:**
- Must be unique across entire database
- Format: `{set_id}-{number}`
- Cannot be empty

### **Name Validation:**
- Cannot be empty
- Max 255 characters

### **Supertype Validation:**
- Must be one of: `Pokémon`, `Trainer`, `Energy`
- Case sensitive

### **JSON Validation:**
- Must be valid JSON syntax
- Arrays must use square brackets `[]`
- Objects must use curly braces `{}`
- Strings must use double quotes `""`

### **Number Validation:**
- Must match actual card number
- Can include letters (TG22, RC32, etc.)
- Must be unique within set

### **Price Validation:**
- Must be positive number or 0
- Max 2 decimal places
- Currency: USD

---

## 🎯 Best Practices

### **1. Always Include Set Information First**
Before importing cards, ensure the set exists in the `sets` table with:
- `id`, `name`, `series`, `printed_total`, `release_date`

### **2. Use Consistent Formats**
- Dates: `YYYY/MM/DD`
- Prices: Always 2 decimals (e.g., `0.50`, `125.00`)
- Language codes: ISO 639-1 (e.g., `en`, `ja`, `fr`)

### **3. Don't Leave Critical Fields Empty**
- `id` - NEVER empty
- `name` - NEVER empty
- `set_id` - NEVER empty
- `supertype` - NEVER empty
- `images` - NEVER empty (at least placeholder)

### **4. Use Source Priority for Pricing**
1. **TCGPlayer** (most accurate for USD)
2. **Cardmarket** (good for EUR, convert to USD)
3. **Manual entry** (for rare/unique cards)

### **5. Validate Before Import**
- Check JSON syntax with online validator
- Verify image URLs are accessible
- Ensure set_id exists in sets table
- Test with small batch first (10-20 cards)

---

## 🔧 Field-by-Field Reference

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `id` | string | ✅ | `{set}-{num}` | `swsh7-95` |
| `name` | string | ✅ | Plain text | `Charizard` |
| `set_id` | string | ✅ | Set code | `swsh7` |
| `set_name` | string | ✅ | Plain text | `Evolving Skies` |
| `supertype` | string | ✅ | Enum | `Pokémon` |
| `subtypes` | JSON | - | Array | `["VMAX"]` |
| `hp` | string | ⚠️ | Number as string | `310` |
| `level` | string | - | Number as string | `76` |
| `types` | JSON | ⚠️ | Array | `["Fire"]` |
| `evolves_from` | string | - | Card name | `Charmeleon` |
| `abilities` | JSON | - | Array of objects | See above |
| `attacks` | JSON | ⚠️ | Array of objects | See above |
| `weaknesses` | JSON | - | Array of objects | `[{"type":"Water","value":"×2"}]` |
| `resistances` | JSON | - | Array of objects | `[{"type":"Fighting","value":"-30"}]` |
| `retreat_cost` | JSON | ⚠️ | Array | `["Colorless"]` |
| `converted_retreat_cost` | integer | - | Number | `2` |
| `number` | string | ✅ | Card number | `95` or `TG22` |
| `printed_total` | integer | ✅ | Number | `203` |
| `artist` | string | - | Full name | `Mitsuhiro Arita` |
| `rarity` | string | - | Rarity name | `Rare Holo VMAX` |
| `images` | JSON | ✅ | Object | See above |
| `tcgplayer` | JSON | - | Object | See above |
| `cardmarket` | JSON | - | Object | See above |
| `current_value` | decimal | - | USD price | `16.07` |
| `national_pokedex_numbers` | JSON | - | Array | `["197"]` |
| `legalities` | JSON | - | Array of objects | See above |
| `regulation_mark` | string | - | Letter | `E` |
| `regulation` | string | - | Letter (legacy) | `E` |
| `format` | string | - | Format name | `Standard` |
| `language` | string | - | ISO code | `en` |
| `variant` | string | - | Variant name | `Normal` |
| `variants` | JSON | - | Array | `["Normal","Holo"]` |
| `variant_normal` | boolean | - | 0 or 1 | `1` |
| `variant_reverse` | boolean | - | 0 or 1 | `1` |
| `variant_holo` | boolean | - | 0 or 1 | `0` |
| `variant_first_edition` | boolean | - | 0 or 1 | `0` |
| `is_digital_only` | boolean | - | 0 or 1 | `0` |
| `is_prerelease` | boolean | - | 0 or 1 | `0` |
| `card_type` | string | - | Type | `physical` |
| `quantity` | integer | - | Number | `0` |
| `collected` | boolean | - | 0 or 1 | `0` |

---

## ✅ Import Checklist

Before importing a CSV file:

- [ ] All required fields are present
- [ ] JSON fields are properly formatted and escaped
- [ ] Image URLs are accessible
- [ ] Set exists in sets table with correct release_date
- [ ] Card IDs are unique
- [ ] Card numbers include printed_total
- [ ] Retreat costs are arrays, not numbers
- [ ] Pricing is in USD (or converted)
- [ ] Tested with small batch first
- [ ] Backup database before large import

---

## 🎉 You're Ready!

With this structure, you can:
- ✅ Import cards from any source
- ✅ Maintain data consistency
- ✅ Scale to millions of cards
- ✅ Keep prices up-to-date
- ✅ Support multiple languages
- ✅ Track variants and editions

**Happy importing! 🚀**









#!/usr/bin/env python3
"""
Simple Database Fix Script
Fixes the most critical issues identified in the analysis.
"""

import sqlite3
import csv
import json
import shutil
import datetime

def create_backup():
    """Create a backup of the current database."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"database/cards_backup_{timestamp}.db"
    shutil.copy2("database/cards.db", backup_file)
    print(f"✅ Database backed up to: {backup_file}")
    return backup_file

def fix_duplicate_sets(conn):
    """Fix the most critical duplicate sets."""
    print("🔧 Fixing critical duplicate sets...")
    
    cursor = conn.cursor()
    
    # Critical duplicates to fix
    critical_duplicates = [
        ('151', 'sv03.5', 'sv3pt5'),
        ('Black Bolt', 'sv10.5b', 'zsv10pt5'),
        ('Crown Zenith', 'swsh12pt5', 'swsh12.5'),
        ('Champion\'s Path', 'swsh35', 'swsh3.5'),
        ('Dragon Majesty', 'sm75', 'sm7.5')
    ]
    
    for set_name, keep_id, remove_id in critical_duplicates:
        # Check if both IDs exist
        cursor.execute("SELECT COUNT(*) FROM sets WHERE id = ?", (keep_id,))
        keep_exists = cursor.fetchone()[0] > 0
        
        cursor.execute("SELECT COUNT(*) FROM sets WHERE id = ?", (remove_id,))
        remove_exists = cursor.fetchone()[0] > 0
        
        if keep_exists and remove_exists:
            # Move cards from remove_id to keep_id
            cursor.execute("UPDATE cards SET set_id = ? WHERE set_id = ?", (keep_id, remove_id))
            
            # Delete the duplicate set
            cursor.execute("DELETE FROM sets WHERE id = ?", (remove_id,))
            
            print(f"   ✅ Consolidated {set_name}: {remove_id} -> {keep_id}")
    
    conn.commit()

def update_set_mapping(conn):
    """Update the set mapping in the frontend to match database IDs."""
    print("🔧 Updating frontend set mapping...")
    
    cursor = conn.cursor()
    
    # Get all sets from database
    cursor.execute("SELECT id, name, series FROM sets ORDER BY name")
    sets = cursor.fetchall()
    
    # Create new mapping
    set_map = {}
    for set_id, name, series in sets:
        if series and set_id:
            set_map[name] = {'series': series, 'set': set_id}
    
    # Update App.jsx with correct mapping
    app_file = 'src/App.jsx'
    
    with open(app_file, 'r') as f:
        content = f.read()
    
    # Find the setMap section and replace it
    start_marker = "const setMap = {"
    end_marker = "};"
    
    start_idx = content.find(start_marker)
    if start_idx != -1:
        end_idx = content.find(end_marker, start_idx) + len(end_marker)
        
        # Generate new setMap
        new_set_map = "const setMap = {\n"
        for name, info in sorted(set_map.items()):
            new_set_map += f"    '{name}': {{ series: '{info['series']}', set: '{info['set']}' }},\n"
        new_set_map += "  };"
        
        # Replace the old mapping
        new_content = content[:start_idx] + new_set_map + content[end_idx:]
        
        with open(app_file, 'w') as f:
            f.write(new_content)
        
        print(f"   ✅ Updated set mapping with {len(set_map)} sets")

def update_image_urls_from_csv(conn):
    """Update image URLs using CSV data."""
    print("🔧 Updating image URLs from CSV...")
    
    cursor = conn.cursor()
    
    # Load CSV data
    csv_file = "public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv"
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        csv_data = list(reader)
    
    # Create lookup for image URLs
    image_lookup = {}
    for row in csv_data:
        set_id = row.get('set_id', '').strip()
        number = row.get('number', '').strip()
        image_url = row.get('image_high_res') or row.get('image_url', '')
        
        if set_id and number and image_url:
            key = f"{set_id}-{number}"
            image_lookup[key] = image_url
    
    # Update cards with image URLs
    cursor.execute("SELECT id, set_id, number FROM cards WHERE images IS NULL OR images = '{}'")
    cards = cursor.fetchall()
    
    updates_made = 0
    for card_id, set_id, number in cards:
        key = f"{set_id}-{number}"
        if key in image_lookup:
            image_url = image_lookup[key]
            
            # Extract series and set from URL if possible
            if 'tcgdex.net' in image_url:
                # URL format: https://assets.tcgdex.net/en/{series}/{set}/{number}/high.webp
                parts = image_url.split('/')
                if len(parts) >= 6:
                    series = parts[4]
                    set_code = parts[5]
                    
                    image_data = {
                        "small": image_url.replace('/high.webp', '/small.webp'),
                        "large": image_url.replace('/high.webp', '/large.webp'),
                        "high": image_url
                    }
                    
                    cursor.execute("UPDATE cards SET images = ? WHERE id = ?", 
                                 (json.dumps(image_data), card_id))
                    updates_made += 1
    
    conn.commit()
    print(f"   ✅ Updated {updates_made} image URLs")

def update_prices_from_csv(conn):
    """Update prices using CSV data."""
    print("🔧 Updating prices from CSV...")
    
    cursor = conn.cursor()
    
    # Load CSV data
    csv_file = "public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv"
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        csv_data = list(reader)
    
    # Create lookup for prices
    price_lookup = {}
    for row in csv_data:
        set_id = row.get('set_id', '').strip()
        number = row.get('number', '').strip()
        
        # Try TCGPlayer price first, then CardMarket
        tcgplayer_price = row.get('tcgplayer_normal_market', '')
        cardmarket_price = row.get('cardmarket_avg', '')
        
        price = 0
        if tcgplayer_price and tcgplayer_price.replace('.', '').isdigit():
            price = float(tcgplayer_price)
        elif cardmarket_price and cardmarket_price.replace('.', '').isdigit():
            price = float(cardmarket_price)
        
        if price > 0:
            key = f"{set_id}-{number}"
            price_lookup[key] = price
    
    # Update cards with prices
    cursor.execute("SELECT id, set_id, number FROM cards WHERE current_value IS NULL OR current_value = 0")
    cards = cursor.fetchall()
    
    updates_made = 0
    for card_id, set_id, number in cards:
        key = f"{set_id}-{number}"
        if key in price_lookup:
            price = price_lookup[key]
            cursor.execute("UPDATE cards SET current_value = ? WHERE id = ?", (price, card_id))
            updates_made += 1
    
    conn.commit()
    print(f"   ✅ Updated {updates_made} prices")

def main():
    """Main update function."""
    print("🚀 SIMPLE DATABASE FIX")
    print("=" * 50)
    
    # Create backup
    backup_file = create_backup()
    
    # Connect to database
    conn = sqlite3.connect('database/cards.db')
    
    try:
        # Run fixes
        fix_duplicate_sets(conn)
        update_set_mapping(conn)
        update_image_urls_from_csv(conn)
        update_prices_from_csv(conn)
        
        print("\n✅ DATABASE FIX COMPLETE")
        print("=" * 50)
        print(f"📁 Backup created: {backup_file}")
        
        # Show final stats
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM cards WHERE current_value > 0")
        cards_with_price = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM cards WHERE images IS NOT NULL AND images != '{}'")
        cards_with_image = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM cards")
        total_cards = cursor.fetchone()[0]
        
        print(f"📊 Final Stats:")
        print(f"   Total Cards: {total_cards:,}")
        print(f"   Cards with Price: {cards_with_price:,} ({cards_with_price/total_cards*100:.1f}%)")
        print(f"   Cards with Image: {cards_with_image:,} ({cards_with_image/total_cards*100:.1f}%)")
        
    except Exception as e:
        print(f"❌ Error during update: {e}")
        print(f"📁 Restore from backup: {backup_file}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()

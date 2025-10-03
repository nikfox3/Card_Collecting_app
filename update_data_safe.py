#!/usr/bin/env python3
"""
Safe Data Update Script
Updates card data by temporarily disabling triggers.
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

def update_data_safely():
    """Update data by temporarily disabling triggers."""
    print("🔧 Updating card data safely...")
    
    # Create backup
    backup_file = create_backup()
    
    # Connect to database
    conn = sqlite3.connect('database/cards.db')
    cursor = conn.cursor()
    
    try:
        # Disable triggers temporarily
        print("   Disabling triggers...")
        cursor.execute("DROP TRIGGER IF EXISTS cards_ai")
        cursor.execute("DROP TRIGGER IF EXISTS cards_au")
        cursor.execute("DROP TRIGGER IF EXISTS cards_ad")
        
        # Load CSV data
        csv_file = "public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv"
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            csv_data = list(reader)
        
        print(f"   Loaded {len(csv_data)} rows from CSV")
        
        # Create lookup dictionaries
        image_lookup = {}
        price_lookup = {}
        
        for row in csv_data:
            set_id = row.get('set_id', '').strip()
            number = row.get('number', '').strip()
            
            if set_id and number:
                key = f"{set_id}-{number}"
                
                # Image data
                image_url = row.get('image_high_res') or row.get('image_url', '')
                if image_url:
                    image_lookup[key] = image_url
                
                # Price data
                tcgplayer_price = row.get('tcgplayer_normal_market', '')
                cardmarket_price = row.get('cardmarket_avg', '')
                
                price = 0
                if tcgplayer_price and tcgplayer_price.replace('.', '').isdigit():
                    price = float(tcgplayer_price)
                elif cardmarket_price and cardmarket_price.replace('.', '').isdigit():
                    price = float(cardmarket_price)
                
                if price > 0:
                    price_lookup[key] = price
        
        print(f"   Found {len(image_lookup)} cards with images")
        print(f"   Found {len(price_lookup)} cards with prices")
        
        # Update images
        cursor.execute("SELECT id, set_id, number FROM cards")
        cards = cursor.fetchall()
        
        image_updates = 0
        price_updates = 0
        
        for card_id, set_id, number in cards:
            key = f"{set_id}-{number}"
            
            # Update image if available
            if key in image_lookup:
                image_url = image_lookup[key]
                
                # Try to construct proper image URLs
                if 'tcgdex.net' in image_url:
                    # Extract series and set from URL
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
                        image_updates += 1
            
            # Update price if available
            if key in price_lookup:
                price = price_lookup[key]
                cursor.execute("UPDATE cards SET current_value = ? WHERE id = ?", 
                             (price, card_id))
                price_updates += 1
        
        conn.commit()
        
        print(f"   ✅ Updated {image_updates} image URLs")
        print(f"   ✅ Updated {price_updates} prices")
        
        # Recreate triggers
        print("   Recreating triggers...")
        cursor.execute("""
            CREATE TRIGGER cards_ai AFTER INSERT ON cards BEGIN
                INSERT INTO cards_fts(rowid, name, set_name, rarity, types)
                VALUES (new.rowid, new.name, 
                        (SELECT name FROM sets WHERE id = new.set_id),
                        new.rarity, new.types);
            END
        """)
        
        cursor.execute("""
            CREATE TRIGGER cards_au AFTER UPDATE ON cards BEGIN
                UPDATE cards_fts SET 
                    name = new.name,
                    set_name = (SELECT name FROM sets WHERE id = new.set_id),
                    rarity = new.rarity,
                    types = new.types
                WHERE rowid = new.rowid;
            END
        """)
        
        cursor.execute("""
            CREATE TRIGGER cards_ad AFTER DELETE ON cards BEGIN
                DELETE FROM cards_fts WHERE rowid = old.rowid;
            END
        """)
        
        conn.commit()
        
        # Show final stats
        cursor.execute("SELECT COUNT(*) FROM cards WHERE current_value > 0")
        cards_with_price = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM cards WHERE images IS NOT NULL AND images != '{}' AND images != 'null'")
        cards_with_image = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM cards")
        total_cards = cursor.fetchone()[0]
        
        print(f"\n📊 Final Stats:")
        print(f"   Total Cards: {total_cards:,}")
        print(f"   Cards with Price: {cards_with_price:,} ({cards_with_price/total_cards*100:.1f}%)")
        print(f"   Cards with Image: {cards_with_image:,} ({cards_with_image/total_cards*100:.1f}%)")
        
        print(f"\n✅ CARD DATA UPDATE COMPLETE")
        print(f"📁 Backup created: {backup_file}")
        
    except Exception as e:
        print(f"❌ Error during update: {e}")
        print(f"📁 Restore from backup: {backup_file}")
        raise
    finally:
        conn.close()

def main():
    """Main function."""
    print("🚀 SAFE CARD DATA UPDATE")
    print("=" * 40)
    
    update_data_safely()

if __name__ == "__main__":
    main()

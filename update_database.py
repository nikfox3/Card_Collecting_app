#!/usr/bin/env python3
"""
Database Update Script
Fixes discrepancies between database and CSV data.
"""

import sqlite3
import csv
import json
import re
from collections import defaultdict

def create_backup():
    """Create a backup of the current database."""
    import shutil
    import datetime
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"database/cards_backup_{timestamp}.db"
    shutil.copy2("database/cards.db", backup_file)
    print(f"✅ Database backed up to: {backup_file}")
    return backup_file

def fix_duplicate_sets(conn):
    """Consolidate duplicate sets by keeping the most complete one."""
    print("🔧 Fixing duplicate sets...")
    
    cursor = conn.cursor()
    
    # Find duplicate sets
    cursor.execute("""
        SELECT s.name, GROUP_CONCAT(s.id) as set_ids, 
               COUNT(s.id) as count,
               GROUP_CONCAT(s.printed_total) as printed_totals
        FROM sets s
        GROUP BY s.name
        HAVING COUNT(s.id) > 1
        ORDER BY s.name
    """)
    
    duplicates = cursor.fetchall()
    print(f"   Found {len(duplicates)} duplicate sets")
    
    for set_name, set_ids, count, printed_totals in duplicates:
        set_id_list = set_ids.split(',')
        printed_total_list = [int(x) if x else 0 for x in printed_totals.split(',')]
        
        # Choose the set with the highest printed_total or most complete data
        best_set_id = None
        best_score = -1
        
        for i, set_id in enumerate(set_id_list):
            cursor.execute("""
                SELECT s.printed_total, COUNT(c.id) as card_count,
                       COUNT(CASE WHEN c.images IS NOT NULL AND c.images != '{}' THEN 1 END) as image_count
                FROM sets s
                LEFT JOIN cards c ON s.id = c.set_id
                WHERE s.id = ?
                GROUP BY s.id
            """, (set_id,))
            
            result = cursor.fetchone()
            if result:
                printed_total, card_count, image_count = result
                score = (printed_total or 0) + card_count + image_count
                
                if score > best_score:
                    best_score = score
                    best_set_id = set_id
        
        if best_set_id:
            # Update all cards to use the best set ID
            for set_id in set_id_list:
                if set_id != best_set_id:
                    cursor.execute("UPDATE cards SET set_id = ? WHERE set_id = ?", (best_set_id, set_id))
                    cursor.execute("DELETE FROM sets WHERE id = ?", (set_id,))
                    print(f"   Consolidated {set_name}: {set_id} -> {best_set_id}")
    
    conn.commit()
    print("   ✅ Duplicate sets consolidated")

def update_set_ids_from_csv(conn):
    """Update set IDs to match CSV data format."""
    print("🔧 Updating set IDs from CSV...")
    
    cursor = conn.cursor()
    
    # Load CSV data
    csv_file = "public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv"
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        csv_data = list(reader)
    
    # Create mapping from set names to correct set IDs
    set_name_to_id = {}
    for row in csv_data:
        set_name = row.get('set_name', '').strip()
        set_id = row.get('set_id', '').strip()
        if set_name and set_id:
            set_name_to_id[set_name] = set_id
    
    # Update set IDs in database
    cursor.execute("SELECT id, name FROM sets")
    db_sets = cursor.fetchall()
    
    updates_made = 0
    for db_id, db_name in db_sets:
        if db_name in set_name_to_id:
            correct_id = set_name_to_id[db_name]
            if correct_id != db_id:
                # Update cards first
                cursor.execute("UPDATE cards SET set_id = ? WHERE set_id = ?", (correct_id, db_id))
                # Update sets table
                cursor.execute("UPDATE sets SET id = ? WHERE id = ?", (correct_id, db_id))
                updates_made += 1
                print(f"   Updated {db_name}: {db_id} -> {correct_id}")
    
    conn.commit()
    print(f"   ✅ Updated {updates_made} set IDs")

def update_card_data_from_csv(conn):
    """Update card data with information from CSV."""
    print("🔧 Updating card data from CSV...")
    
    cursor = conn.cursor()
    
    # Load CSV data
    csv_file = "public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv"
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        csv_data = list(reader)
    
    # Create mapping from card key to CSV row
    csv_lookup = {}
    for row in csv_data:
        set_id = row.get('set_id', '').strip()
        number = row.get('number', '').strip()
        name = row.get('name', '').strip()
        
        if set_id and number and name:
            key = f"{set_id}-{number}"
            csv_lookup[key] = row
    
    # Update cards with CSV data
    cursor.execute("""
        SELECT id, name, set_id, number, current_value, images, artist, rarity
        FROM cards
    """)
    
    cards = cursor.fetchall()
    updates_made = 0
    
    for card_id, name, set_id, number, current_value, images, artist, rarity in cards:
        key = f"{set_id}-{number}"
        
        if key in csv_lookup:
            csv_row = csv_lookup[key]
            
            # Prepare update data
            updates = {}
            
            # Update image URLs
            image_url = csv_row.get('image_high_res') or csv_row.get('image_url', '')
            if image_url and (not images or images == '{}'):
                image_data = {
                    "small": csv_row.get('image_small', ''),
                    "large": csv_row.get('image_large', ''),
                    "high": image_url
                }
                updates['images'] = json.dumps(image_data)
            
            # Update pricing data
            if not current_value or current_value == 0:
                tcgplayer_price = csv_row.get('tcgplayer_normal_market', '')
                cardmarket_price = csv_row.get('cardmarket_avg', '')
                
                price = 0
                if tcgplayer_price and tcgplayer_price.replace('.', '').isdigit():
                    price = float(tcgplayer_price)
                elif cardmarket_price and cardmarket_price.replace('.', '').isdigit():
                    price = float(cardmarket_price)
                
                if price > 0:
                    updates['current_value'] = price
            
            # Update artist if missing
            if not artist and csv_row.get('artist'):
                updates['artist'] = csv_row['artist']
            
            # Update rarity if missing
            if not rarity and csv_row.get('rarity'):
                updates['rarity'] = csv_row['rarity']
            
            # Apply updates
            if updates:
                set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
                values = list(updates.values()) + [card_id]
                
                cursor.execute(f"UPDATE cards SET {set_clause} WHERE id = ?", values)
                updates_made += 1
    
    conn.commit()
    print(f"   ✅ Updated {updates_made} cards with CSV data")

def add_missing_sets(conn):
    """Add sets that exist in CSV but not in database."""
    print("🔧 Adding missing sets...")
    
    cursor = conn.cursor()
    
    # Load CSV data
    csv_file = "public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv"
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        csv_data = list(reader)
    
    # Get existing sets
    cursor.execute("SELECT id FROM sets")
    existing_set_ids = {row[0] for row in cursor.fetchall()}
    
    # Find unique sets in CSV
    csv_sets = {}
    for row in csv_data:
        set_id = row.get('set_id', '').strip()
        set_name = row.get('set_name', '').strip()
        series = row.get('series', '').strip()
        printed_total = row.get('printed_total', '')
        
        if set_id and set_name and set_id not in existing_set_ids:
            csv_sets[set_id] = {
                'name': set_name,
                'series': series,
                'printed_total': int(printed_total) if printed_total.isdigit() else None
            }
    
    # Add missing sets
    for set_id, set_data in csv_sets.items():
        cursor.execute("""
            INSERT INTO sets (id, name, series, printed_total, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (set_id, set_data['name'], set_data['series'], set_data['printed_total']))
    
    conn.commit()
    print(f"   ✅ Added {len(csv_sets)} missing sets")

def update_image_urls(conn):
    """Update image URLs to use correct TCGdex format."""
    print("🔧 Updating image URLs...")
    
    cursor = conn.cursor()
    
    # Get all cards with their set information
    cursor.execute("""
        SELECT c.id, c.name, c.set_id, c.number, s.name as set_name, s.series
        FROM cards c
        JOIN sets s ON c.set_id = s.id
        WHERE c.images IS NULL OR c.images = '{}' OR c.images = 'null'
    """)
    
    cards = cursor.fetchall()
    updates_made = 0
    
    for card_id, name, set_id, number, set_name, series in cards:
        # Construct TCGdex URL
        if series and set_id and number:
            image_url = f"https://assets.tcgdex.net/en/{series}/{set_id}/{number}/high.webp"
            
            image_data = {
                "small": f"https://assets.tcgdex.net/en/{series}/{set_id}/{number}/small.webp",
                "large": f"https://assets.tcgdex.net/en/{series}/{set_id}/{number}/large.webp",
                "high": image_url
            }
            
            cursor.execute("UPDATE cards SET images = ? WHERE id = ?", 
                         (json.dumps(image_data), card_id))
            updates_made += 1
    
    conn.commit()
    print(f"   ✅ Updated {updates_made} image URLs")

def main():
    """Main update function."""
    print("🚀 POKEMON CARD DATABASE UPDATE")
    print("=" * 50)
    
    # Create backup
    backup_file = create_backup()
    
    # Connect to database
    conn = sqlite3.connect('database/cards.db')
    
    try:
        # Run updates
        fix_duplicate_sets(conn)
        update_set_ids_from_csv(conn)
        add_missing_sets(conn)
        update_card_data_from_csv(conn)
        update_image_urls(conn)
        
        print("\n✅ DATABASE UPDATE COMPLETE")
        print("=" * 50)
        print(f"📁 Backup created: {backup_file}")
        
    except Exception as e:
        print(f"❌ Error during update: {e}")
        print(f"📁 Restore from backup: {backup_file}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()

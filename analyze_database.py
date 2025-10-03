#!/usr/bin/env python3
"""
Database Analysis Script
Compares database data with CSV data to identify discrepancies and needed updates.
"""

import sqlite3
import csv
import json
from collections import defaultdict, Counter
import re

def analyze_database():
    """Analyze the current database structure and data."""
    print("🔍 ANALYZING DATABASE...")
    
    conn = sqlite3.connect('database/cards.db')
    cursor = conn.cursor()
    
    # Get basic stats
    cursor.execute("SELECT COUNT(*) FROM cards")
    total_cards = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM sets")
    total_sets = cursor.fetchone()[0]
    
    print(f"📊 Database Stats:")
    print(f"   Total Cards: {total_cards:,}")
    print(f"   Total Sets: {total_sets}")
    
    # Analyze sets
    cursor.execute("""
        SELECT s.id, s.name, s.series, s.printed_total, COUNT(c.id) as card_count
        FROM sets s
        LEFT JOIN cards c ON s.id = c.set_id
        GROUP BY s.id, s.name, s.series, s.printed_total
        ORDER BY s.name
    """)
    
    sets_data = cursor.fetchall()
    print(f"\n📦 Sets Analysis:")
    
    # Find duplicate sets
    set_names = defaultdict(list)
    for set_id, name, series, printed_total, card_count in sets_data:
        set_names[name].append((set_id, series, printed_total, card_count))
    
    duplicates = {name: sets for name, sets in set_names.items() if len(sets) > 1}
    if duplicates:
        print(f"   ⚠️  Duplicate Sets Found: {len(duplicates)}")
        for name, sets in list(duplicates.items())[:5]:
            print(f"      '{name}': {[s[0] for s in sets]}")
    else:
        print(f"   ✅ No duplicate sets found")
    
    # Analyze card data quality
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN current_value IS NULL OR current_value = 0 THEN 1 END) as no_price,
            COUNT(CASE WHEN images IS NULL OR images = '{}' THEN 1 END) as no_image,
            COUNT(CASE WHEN artist IS NULL OR artist = '' THEN 1 END) as no_artist,
            COUNT(CASE WHEN rarity IS NULL OR rarity = '' THEN 1 END) as no_rarity
        FROM cards
    """)
    
    quality = cursor.fetchone()
    print(f"\n🎯 Card Data Quality:")
    print(f"   Total Cards: {quality[0]:,}")
    print(f"   No Price: {quality[1]:,} ({quality[1]/quality[0]*100:.1f}%)")
    print(f"   No Image: {quality[2]:,} ({quality[2]/quality[0]*100:.1f}%)")
    print(f"   No Artist: {quality[3]:,} ({quality[3]/quality[0]*100:.1f}%)")
    print(f"   No Rarity: {quality[4]:,} ({quality[4]/quality[0]*100:.1f}%)")
    
    # Analyze set ID patterns
    cursor.execute("SELECT DISTINCT set_id FROM cards ORDER BY set_id")
    set_ids = [row[0] for row in cursor.fetchall()]
    
    print(f"\n🔗 Set ID Patterns:")
    patterns = defaultdict(int)
    for set_id in set_ids:
        if '.' in set_id:
            patterns['with_dots'] += 1
        elif set_id.isalnum():
            patterns['alphanumeric'] += 1
        else:
            patterns['other'] += 1
    
    for pattern, count in patterns.items():
        print(f"   {pattern}: {count}")
    
    conn.close()
    return sets_data, duplicates

def analyze_csv():
    """Analyze the CSV data structure and content."""
    print("\n🔍 ANALYZING CSV DATA...")
    
    csv_file = "public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv"
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"📊 CSV Stats:")
    print(f"   Total Rows: {len(rows):,}")
    print(f"   Columns: {len(reader.fieldnames)}")
    
    # Analyze sets in CSV
    csv_sets = defaultdict(list)
    for row in rows:
        set_id = row.get('set_id', '')
        set_name = row.get('set_name', '')
        if set_id and set_name:
            csv_sets[set_name].append(set_id)
    
    # Find unique sets
    unique_sets = set()
    for sets in csv_sets.values():
        unique_sets.update(sets)
    
    print(f"   Unique Sets: {len(unique_sets)}")
    
    # Analyze data completeness
    complete_data = 0
    has_image = 0
    has_price = 0
    
    for row in rows:
        if (row.get('name') and row.get('set_id') and row.get('number') and 
            row.get('rarity') and row.get('artist')):
            complete_data += 1
        
        if row.get('image_url') or row.get('image_high_res'):
            has_image += 1
            
        if row.get('tcgplayer_normal_market') or row.get('cardmarket_avg'):
            has_price += 1
    
    print(f"\n🎯 CSV Data Quality:")
    print(f"   Complete Records: {complete_data:,} ({complete_data/len(rows)*100:.1f}%)")
    print(f"   Has Image: {has_image:,} ({has_image/len(rows)*100:.1f}%)")
    print(f"   Has Price: {has_price:,} ({has_price/len(rows)*100:.1f}%)")
    
    return rows, csv_sets, unique_sets

def find_discrepancies(db_sets, csv_sets, csv_rows):
    """Find discrepancies between database and CSV data."""
    print("\n🔍 FINDING DISCREPANCIES...")
    
    # Convert db_sets to dict for easier lookup
    db_set_lookup = {}
    for set_id, name, series, printed_total, card_count in db_sets:
        db_set_lookup[name] = {
            'id': set_id,
            'series': series,
            'printed_total': printed_total,
            'card_count': card_count
        }
    
    discrepancies = {
        'missing_sets': [],
        'duplicate_sets': [],
        'id_mismatches': [],
        'data_quality_issues': []
    }
    
    # Check for sets in CSV but not in DB
    for set_name, set_ids in csv_sets.items():
        if set_name not in db_set_lookup:
            discrepancies['missing_sets'].append((set_name, set_ids))
        elif len(set_ids) > 1:
            discrepancies['duplicate_sets'].append((set_name, set_ids))
    
    # Check for ID mismatches
    for set_name, set_ids in csv_sets.items():
        if set_name in db_set_lookup:
            db_id = db_set_lookup[set_name]['id']
            if db_id not in set_ids:
                discrepancies['id_mismatches'].append((set_name, db_id, set_ids))
    
    print(f"📋 Discrepancy Summary:")
    print(f"   Missing Sets: {len(discrepancies['missing_sets'])}")
    print(f"   Duplicate Sets: {len(discrepancies['duplicate_sets'])}")
    print(f"   ID Mismatches: {len(discrepancies['id_mismatches'])}")
    
    return discrepancies

def generate_recommendations(discrepancies, db_sets, csv_rows):
    """Generate recommendations for database updates."""
    print("\n💡 GENERATING RECOMMENDATIONS...")
    
    recommendations = []
    
    # 1. Fix duplicate sets
    if discrepancies['duplicate_sets']:
        recommendations.append({
            'type': 'consolidate_duplicates',
            'priority': 'high',
            'description': 'Consolidate duplicate sets with different IDs',
            'details': discrepancies['duplicate_sets'][:5]
        })
    
    # 2. Fix ID mismatches
    if discrepancies['id_mismatches']:
        recommendations.append({
            'type': 'fix_id_mismatches',
            'priority': 'high',
            'description': 'Update set IDs to match CSV data',
            'details': discrepancies['id_mismatches'][:5]
        })
    
    # 3. Add missing sets
    if discrepancies['missing_sets']:
        recommendations.append({
            'type': 'add_missing_sets',
            'priority': 'medium',
            'description': 'Add sets that exist in CSV but not in database',
            'details': discrepancies['missing_sets'][:5]
        })
    
    # 4. Update image URLs
    recommendations.append({
        'type': 'update_image_urls',
        'priority': 'high',
        'description': 'Update image URLs to use correct TCGdex format',
        'details': 'Many cards have incorrect or missing image URLs'
    })
    
    # 5. Update pricing data
    recommendations.append({
        'type': 'update_pricing',
        'priority': 'medium',
        'description': 'Update pricing data from TCGPlayer and CardMarket',
        'details': 'Many cards have $0.00 or missing prices'
    })
    
    print(f"📝 Generated {len(recommendations)} recommendations:")
    for i, rec in enumerate(recommendations, 1):
        print(f"   {i}. [{rec['priority'].upper()}] {rec['description']}")
    
    return recommendations

def main():
    """Main analysis function."""
    print("🚀 POKEMON CARD DATABASE ANALYSIS")
    print("=" * 50)
    
    # Analyze database
    db_sets, duplicates = analyze_database()
    
    # Analyze CSV
    csv_rows, csv_sets, unique_sets = analyze_csv()
    
    # Find discrepancies
    discrepancies = find_discrepancies(db_sets, csv_sets, csv_rows)
    
    # Generate recommendations
    recommendations = generate_recommendations(discrepancies, db_sets, csv_rows)
    
    print("\n✅ ANALYSIS COMPLETE")
    print("=" * 50)
    
    return {
        'db_sets': db_sets,
        'csv_rows': csv_rows,
        'discrepancies': discrepancies,
        'recommendations': recommendations
    }

if __name__ == "__main__":
    results = main()

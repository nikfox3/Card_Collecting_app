#!/usr/bin/env python3
"""
Fix Frontend Mapping Script
Updates the frontend set mapping to match the actual database set IDs.
"""

import sqlite3
import json

def get_database_sets():
    """Get all sets from the database."""
    conn = sqlite3.connect('database/cards.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, series FROM sets ORDER BY name")
    sets = cursor.fetchall()
    
    conn.close()
    return sets

def update_frontend_mapping():
    """Update the frontend set mapping in App.jsx."""
    print("🔧 Updating frontend set mapping...")
    
    # Get database sets
    db_sets = get_database_sets()
    
    # Create mapping
    set_map = {}
    for set_id, name, series in db_sets:
        if series and set_id:
            set_map[name] = {'series': series, 'set': set_id}
    
    print(f"   Found {len(set_map)} sets in database")
    
    # Read App.jsx
    with open('src/App.jsx', 'r') as f:
        content = f.read()
    
    # Find and replace the setMap
    start_marker = "const setMap = {"
    end_marker = "  };"
    
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("   ❌ Could not find setMap in App.jsx")
        return False
    
    end_idx = content.find(end_marker, start_idx) + len(end_marker)
    
    # Generate new setMap
    new_set_map = "const setMap = {\n"
    for name, info in sorted(set_map.items()):
        new_set_map += f"    '{name}': {{ series: '{info['series']}', set: '{info['set']}' }},\n"
    new_set_map += "  };"
    
    # Replace the old mapping
    new_content = content[:start_idx] + new_set_map + content[end_idx:]
    
    # Write back to file
    with open('src/App.jsx', 'w') as f:
        f.write(new_content)
    
    print(f"   ✅ Updated set mapping with {len(set_map)} sets")
    return True

def main():
    """Main function."""
    print("🚀 FIXING FRONTEND MAPPING")
    print("=" * 40)
    
    if update_frontend_mapping():
        print("\n✅ FRONTEND MAPPING UPDATED")
        print("=" * 40)
        print("The frontend will now use the correct set IDs from the database.")
    else:
        print("\n❌ FAILED TO UPDATE FRONTEND MAPPING")

if __name__ == "__main__":
    main()

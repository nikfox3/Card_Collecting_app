import py7zr
import sqlite3
import json
import os
from pathlib import Path

db_path = 'cards.db'

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

archives = [
    ('Pricing Data/Archives/prices-2025-10-17.ppmd.7z', '2025-10-17'),
    ('Pricing Data/Archives/prices-2025-10-19.ppmd.7z', '2025-10-19'),
    ('Pricing Data/Archives/prices-2025-10-20.ppmd.7z', '2025-10-20'),
    ('Pricing Data/Archives/prices-2025-10-22.ppmd.7z', '2025-10-22'),
    ('Pricing Data/Archives/prices-2025-10-23.ppmd.7z', '2025-10-23'),
    ('Pricing Data/Archives/prices-2025-10-25.ppmd.7z', '2025-10-25'),
]

print('🚀 Processing TCGCSV archives...\n')

total_imported = 0

for arch_path, date in archives:
    if not os.path.exists(arch_path):
        print(f'⚠️  {arch_path} not found')
        continue
    
    print(f'\n📦 Processing {date}...')
    
    imported = 0
    errors = 0
    
    with py7zr.SevenZipFile(arch_path, mode='r') as archive:
        files = archive.getnames()
        print(f'Found {len(files)} price files')
        
        for i, filepath in enumerate(files):
            if i % 1000 == 0:
                print(f'  Progress: {i}/{len(files)}...')
            
            try:
                # Read file content
                info = archive.get_file_info(filepath)
                if info.is_directory:
                    continue
                
                content = archive.read_file(filepath)
                
                # Parse the file path to extract product_id
                # Format: YYYY-MM-DD/CATEGORY_ID/PRODUCT_ID/prices
                parts = filepath.split('/')
                if len(parts) >= 3:
                    product_id = parts[2]
                    
                    # Try to parse as JSON
                    try:
                        data = json.loads(content)
                        price = float(data.get('mid_price', data.get('price', 0)))
                    except:
                        # Try to parse as text
                        text = content.decode('utf-8') if isinstance(content, bytes) else content
                        # Extract price from text (this is a placeholder)
                        price = 0.0
                    
                    if product_id and price > 0:
                        cursor.execute(
                            'INSERT OR REPLACE INTO price_history (product_id, date, price, volume) VALUES (?, ?, ?, ?)',
                            (product_id, date, price, 0)
                        )
                        imported += 1
            except Exception as e:
                errors += 1
                if errors < 10:
                    print(f'    Error: {e}')
    
    conn.commit()
    print(f'✅ Imported {imported} records, {errors} errors for {date}')
    total_imported += imported

print(f'\n🎉 Total imported: {total_imported} records')

conn.close()




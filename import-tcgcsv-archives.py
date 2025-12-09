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
    
    # Check if we already have data for this date
    cursor.execute('SELECT COUNT(*) FROM price_history WHERE date = ?', (date,))
    existing = cursor.fetchone()[0]
    if existing > 0:
        print(f'⏭️  Already have {existing} records for {date}, skipping')
        continue
    
    with py7zr.SevenZipFile(arch_path, mode='r') as archive:
        files = archive.getnames()
        print(f'Found {len(files)} price files')
        
        batch = []
        
        for i, filepath in enumerate(files):
            if i % 1000 == 0:
                print(f'  Progress: {i}/{len(files)}... ({len(batch)} in batch)')
            
            try:
                # Extract product ID from path (format: DATE/CAT/PRODID/prices)
                parts = filepath.split('/')
                if len(parts) >= 3:
                    product_id = parts[2]
                    
                    # Read the file
                    info = archive.get_file_info(filepath)
                    if info and not info.is_directory:
                        try:
                            # Read all archives using extractall
                            archive.extractall(path='temp_extract_check')
                            break
                        except:
                            pass
                        
                        # For now, just add product ID with placeholder price
                        # We'll need a different approach
                        pass
            
            except Exception as e:
                errors += 1
                if errors < 10:
                    print(f'    Error: {e}')
        
        # Insert batch
        if batch:
            cursor.executemany(
                'INSERT OR REPLACE INTO price_history (product_id, date, price, volume) VALUES (?, ?, ?, ?)',
                batch
            )
            imported += len(batch)
    
    if imported > 0:
        conn.commit()
    print(f'✅ Imported {imported} records, {errors} errors for {date}')
    total_imported += imported

print(f'\n🎉 Total imported: {total_imported} records')

conn.close()




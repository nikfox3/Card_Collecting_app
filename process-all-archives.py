import py7zr
import json
import sqlite3
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

print('🚀 Processing all TCGCSV archives...\n')

total_imported = 0

for arch_path, date in archives:
    if not os.path.exists(arch_path):
        print(f'⚠️  {arch_path} not found')
        continue
    
    print(f'\n📦 Processing {date}...')
    
    # Check if we already have data for this date
    cursor.execute('SELECT COUNT(*) FROM price_history WHERE date = ?', (date,))
    existing = cursor.fetchone()[0]
    if existing > 0:
        print(f'⏭️  Already have {existing} records for {date}, skipping')
        continue
    
    # Extract archive
    extract_dir = Path(f'temp_extract_{date}')
    if not extract_dir.exists():
        print(f'  Extracting...')
        with py7zr.SevenZipFile(arch_path, mode='r') as archive:
            archive.extractall(path=str(extract_dir))
    
    # Process extracted files
    imported = 0
    errors = 0
    batch = []
    
    json_files = list(extract_dir.rglob('*/prices'))
    print(f'Found {len(json_files)} price files')
    
    for i, file_path in enumerate(json_files):
        if i % 1000 == 0 and i > 0:
            print(f'  Progress: {i}/{len(json_files)}...')
        
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            if 'results' in data:
                for result in data['results']:
                    product_id = str(result.get('productId', ''))
                    price = result.get('midPrice', result.get('lowPrice', 0))
                    
                    if product_id and price and price > 0:
                        batch.append((product_id, date, price, 0))
                        imported += 1
                    
                    # Batch insert
                    if len(batch) >= 10000:
                        cursor.executemany(
                            'INSERT OR REPLACE INTO price_history (product_id, date, price, volume) VALUES (?, ?, ?, ?)',
                            batch
                        )
                        conn.commit()
                        batch = []
        
        except Exception as e:
            errors += 1
            if errors < 10:
                print(f'    Error: {e}')
    
    # Final insert
    if batch:
        cursor.executemany(
            'INSERT OR REPLACE INTO price_history (product_id, date, price, volume) VALUES (?, ?, ?, ?)',
            batch
        )
        conn.commit()
    
    print(f'✅ Imported {imported} records for {date}')
    total_imported += imported
    
    # Clean up extracted files
    import shutil
    if extract_dir.exists():
        shutil.rmtree(extract_dir)

print(f'\n🎉 Total imported: {total_imported} records!')
print(f'\n📊 Checking database...')
cursor.execute('SELECT COUNT(*) FROM price_history')
total_count = cursor.fetchone()[0]
print(f'Total records in database: {total_count:,}')
cursor.execute('SELECT date, COUNT(*) FROM price_history GROUP BY date ORDER BY date')
dates = cursor.fetchall()
print(f'\nDates in database:')
for date, count in dates:
    print(f'  {date}: {count:,} records')

conn.close()




import os
import json
import sqlite3
from pathlib import Path

db_path = 'cards.db'

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

dates = ['2025-10-17', '2025-10-19', '2025-10-20', '2025-10-22', '2025-10-23', '2025-10-25']

print('🚀 Processing extracted TCGCSV data...\n')

total_imported = 0

for date in dates:
    extract_dir = Path(f'temp_extract_{date}')
    
    if not extract_dir.exists():
        print(f'⚠️  {extract_dir} not found')
        continue
    
    print(f'\n📦 Processing {date}...')
    
    imported = 0
    errors = 0
    batch = []
    
    # Check if we already have data for this date
    cursor.execute('SELECT COUNT(*) FROM price_history WHERE date = ?', (date,))
    existing = cursor.fetchone()[0]
    if existing > 0:
        print(f'⏭️  Already have {existing} records for {date}, skipping')
        continue
    
    # Find all JSON files
    json_files = list(extract_dir.rglob('*/prices'))
    
    print(f'Found {len(json_files)} price files')
    
    for i, file_path in enumerate(json_files):
        if i % 1000 == 0:
            print(f'  Progress: {i}/{len(json_files)}...')
        
        try:
            # Read the JSON file
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # Get product ID from path (format: DATE/CAT/PRODID/prices)
            parts = str(file_path.relative_to(extract_dir)).split(os.sep)
            if len(parts) >= 3:
                # The product ID is in the path
                # Parse from parent directory path
                parent = file_path.parent
                product_id = parent.name
                
                # Process results in the JSON
                if 'results' in data:
                    for result in data['results']:
                        product_id = str(result.get('productId', ''))
                        # Use midPrice as the price
                        price = result.get('midPrice', result.get('lowPrice', 0))
                        
                        if product_id and price and price > 0:
                            batch.append((product_id, date, price, 0))
                            imported += 1
                        
                        # Limit batch size for performance
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
                print(f'    Error processing {file_path}: {e}')
    
    # Insert remaining batch
    if batch:
        cursor.executemany(
            'INSERT OR REPLACE INTO price_history (product_id, date, price, volume) VALUES (?, ?, ?, ?)',
            batch
        )
        conn.commit()
    
    print(f'✅ Imported {imported} records, {errors} errors for {date}')
    total_imported += imported

print(f'\n🎉 Total imported: {total_imported} records')

conn.close()




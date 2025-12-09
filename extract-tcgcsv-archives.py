import py7zr
import json
import os
from collections import defaultdict

archives = [
    ('Pricing Data/Archives/prices-2025-10-17.ppmd.7z', '2025-10-17'),
    ('Pricing Data/Archives/prices-2025-10-19.ppmd.7z', '2025-10-19'),
    ('Pricing Data/Archives/prices-2025-10-20.ppmd.7z', '2025-10-20'),
    ('Pricing Data/Archives/prices-2025-10-22.ppmd.7z', '2025-10-22'),
    ('Pricing Data/Archives/prices-2025-10-23.ppmd.7z', '2025-10-23'),
    ('Pricing Data/Archives/prices-2025-10-25.ppmd.7z', '2025-10-25'),
]

print('🚀 Extracting and parsing TCGCSV archives...\n')

for arch_path, date in archives:
    if not os.path.exists(arch_path):
        print(f'⚠️  {arch_path} not found')
        continue
    
    print(f'\n📦 Processing {date}...')
    
    pricing_data = []
    
    with py7zr.SevenZipFile(arch_path, mode='r') as archive:
        files = archive.getnames()
        print(f'Found {len(files)} files in archive')
        
        for i, filepath in enumerate(files):
            if i % 500 == 0:
                print(f'  Processing {i}/{len(files)}...')
            
            try:
                # Extract the data for this file
                info = archive.get_file_info(filepath)
                if info:
                    # Read the file content
                    data = archive.read_file(filepath)
                    # The data might be JSON or plain text
                    try:
                        parsed = json.loads(data)
                        pricing_data.append(parsed)
                    except:
                        # If not JSON, try to parse as plain text
                        # Look for product_id and price
                        text = data.decode('utf-8') if isinstance(data, bytes) else data
                        # Could be tab-separated or other format
                        pricing_data.append({'raw': text, 'path': filepath})
            except Exception as e:
                if i < 5:
                    print(f'    Error: {e}')
                continue
    
    print(f'✅ Extracted {len(pricing_data)} records for {date}')
    
    # Save to CSV format
    if pricing_data:
        csv_path = f'Pricing Data/pokemon-prices-{date}.csv'
        print(f'💾 Saving to {csv_path}...')
        # TODO: Convert pricing_data to CSV format based on structure
        print(f'   (Need to inspect data structure first)')

print('\n✅ Extraction complete!')




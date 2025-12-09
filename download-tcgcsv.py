import os
import urllib.request
import subprocess
from datetime import datetime, timedelta

BASE_URL = 'https://tcgcsv.com/archive/tcgplayer/prices-{date}.ppmd.7z'
ARCHIVE_DIR = os.path.join('Pricing Data', 'Archives')
OUTPUT_DIR = 'Pricing Data'

# Create directories
os.makedirs(ARCHIVE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_dates(start_date, end_date):
    """Generate list of dates between start and end"""
    dates = []
    current = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    while current <= end:
        dates.append(current.strftime('%Y-%m-%d'))
        current += timedelta(days=1)
    
    return dates

def download_file(url, filepath):
    """Download a file from URL"""
    import ssl
    ssl._create_default_https_context = ssl._create_unverified_context
    
    try:
        print(f"Downloading: {url}")
        urllib.request.urlretrieve(url, filepath)
        print(f"✅ Downloaded: {filepath}")
        return True
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"⚠️  Not found (404): {url}")
        else:
            print(f"❌ HTTP {e.code}: {url}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def extract_archive(filepath):
    """Extract 7z archive"""
    try:
        # Try using p7zip (7z command)
        result = subprocess.run(['7z', 'x', filepath, f'-o{OUTPUT_DIR}', '-y'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Extracted: {filepath}")
            return True
        else:
            print(f"❌ Extraction failed: {result.stderr}")
            return False
    except FileNotFoundError:
        print("⚠️  p7zip not installed. Install with: brew install p7zip")
        print("Or use the manual extraction method.")
        return False

def main():
    print('🚀 Starting TCGCSV historical pricing download...\n')
    
    # Get dates from Feb 8, 2024 to today
    today = datetime.now().strftime('%Y-%m-%d')
    dates = get_dates('2024-02-08', today)
    
    print(f"📅 Checking {len(dates)} dates from {dates[0]} to {dates[-1]}\n")
    
    # Check which dates we already have
    existing_dates = set()
    for filename in os.listdir(OUTPUT_DIR):
        if filename.startswith('pokemon-prices-') and filename.endswith('.csv'):
            date = filename.replace('pokemon-prices-', '').replace('.csv', '')
            existing_dates.add(date)
    
    print(f"📊 Already have {len(existing_dates)} CSV files\n")
    
    downloaded = 0
    extracted = 0
    failed = 0
    
    # Download recent dates first (last 30 days)
    recent_dates = dates[-30:]
    
    for date in recent_dates:
        if date in existing_dates:
            print(f"⏭️  Already have data for {date}")
            continue
        
        url = BASE_URL.replace('{date}', date)
        filename = f'prices-{date}.ppmd.7z'
        archive_path = os.path.join(ARCHIVE_DIR, filename)
        
        # Download if we don't have the archive
        if not os.path.exists(archive_path):
            print(f"📥 Downloading {date}...")
            success = download_file(url, archive_path)
            
            if success:
                downloaded += 1
            else:
                failed += 1
                continue
        
        # Extract if we have the archive
        if os.path.exists(archive_path):
            print(f"📦 Extracting {date}...")
            success = extract_archive(archive_path)
            
            if success:
                extracted += 1
            else:
                failed += 1
    
    print(f"\n✅ Complete!")
    print(f"📥 Downloaded: {downloaded} archives")
    print(f"📦 Extracted: {extracted} archives")
    print(f"❌ Failed: {failed} archives")
    print(f"\n💡 Next step: Run 'node import-pricing-simple-direct.js' to import CSV files")

if __name__ == '__main__':
    main()


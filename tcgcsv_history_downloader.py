import requests
import json
import csv
from datetime import datetime, timedelta
from pathlib import Path
import subprocess
import os
from typing import List, Optional

class TCGCSVHistoryDownloader:
    """
    Download and process historical pricing data from TCGCSV
    """
    
    ARCHIVE_BASE = "https://tcgcsv.com/archive/tcgplayer"
    FIRST_AVAILABLE_DATE = datetime(2024, 2, 8)
    
    def __init__(self, output_dir: str = "price_history"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.archives_dir = self.output_dir / "archives"
        self.archives_dir.mkdir(exist_ok=True)
    
    def check_7zip_installed(self) -> bool:
        """Check if 7zip is installed"""
        try:
            result = subprocess.run(['7z'], capture_output=True, text=True)
            return True
        except FileNotFoundError:
            return False
    
    def get_archive_url(self, date: datetime) -> str:
        """Generate archive URL for a specific date"""
        date_str = date.strftime('%Y-%m-%d')
        return f"{self.ARCHIVE_BASE}/prices-{date_str}.ppmd.7z"
    
    def download_archive(self, date: datetime) -> Optional[Path]:
        """
        Download a price archive for a specific date
        
        Returns path to downloaded file, or None if download failed
        """
        if date < self.FIRST_AVAILABLE_DATE:
            print(f"❌ Date {date.date()} is before first available date (2024-02-08)")
            return None
        
        url = self.get_archive_url(date)
        filename = f"prices-{date.strftime('%Y-%m-%d')}.ppmd.7z"
        filepath = self.archives_dir / filename
        
        # Skip if already downloaded
        if filepath.exists():
            print(f"✓ Already have: {filename}")
            return filepath
        
        print(f"📥 Downloading: {filename}")
        
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            # Save the file
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ Downloaded: {filename} ({filepath.stat().st_size / 1024 / 1024:.1f} MB)")
            return filepath
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                print(f"❌ Archive not available for {date.date()}")
            else:
                print(f"❌ Error downloading: {e}")
            return None
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def extract_archive(self, archive_path: Path) -> Optional[Path]:
        """
        Extract a 7z archive
        
        Returns path to extracted file
        """
        if not self.check_7zip_installed():
            print("❌ 7zip not installed!")
            print("\nInstall 7zip:")
            print("  macOS: brew install p7zip")
            print("  Ubuntu: sudo apt-get install p7zip-full")
            print("  Windows: Download from https://www.7-zip.org/")
            return None
        
        extract_dir = self.output_dir / "extracted"
        extract_dir.mkdir(exist_ok=True)
        
        print(f"📂 Extracting: {archive_path.name}")
        
        try:
            # Extract using 7z command
            result = subprocess.run(
                ['7z', 'x', str(archive_path), f'-o{extract_dir}', '-y'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                # Find the extracted file (should be .ppmd)
                extracted_files = list(extract_dir.glob('*.ppmd'))
                if extracted_files:
                    print(f"✅ Extracted: {extracted_files[0].name}")
                    return extracted_files[0]
            
            print(f"❌ Extraction failed: {result.stderr}")
            return None
            
        except Exception as e:
            print(f"❌ Error extracting: {e}")
            return None
    
    def download_date_range(self, start_date: datetime, end_date: datetime) -> List[Path]:
        """
        Download archives for a date range
        
        Returns list of downloaded archive paths
        """
        print("="*70)
        print(f"DOWNLOADING PRICE HISTORY")
        print(f"From: {start_date.date()}")
        print(f"To:   {end_date.date()}")
        print("="*70)
        
        downloaded = []
        current = start_date
        
        while current <= end_date:
            archive_path = self.download_archive(current)
            if archive_path:
                downloaded.append(archive_path)
            
            current += timedelta(days=1)
        
        print(f"\n{'='*70}")
        print(f"Downloaded {len(downloaded)} archives")
        print(f"{'='*70}")
        
        return downloaded
    
    def download_last_n_days(self, n_days: int = 30) -> List[Path]:
        """Download archives for the last N days"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=n_days)
        
        # Make sure we don't go before first available date
        if start_date < self.FIRST_AVAILABLE_DATE:
            start_date = self.FIRST_AVAILABLE_DATE
        
        return self.download_date_range(start_date, end_date)
    
    def list_available_archives(self) -> List[Path]:
        """List all downloaded archives"""
        archives = list(self.archives_dir.glob("*.7z"))
        archives.sort()
        return archives
    
    def get_archive_info(self) -> dict:
        """Get information about downloaded archives"""
        archives = self.list_available_archives()
        
        if not archives:
            return {
                'count': 0,
                'total_size_mb': 0,
                'oldest': None,
                'newest': None
            }
        
        total_size = sum(a.stat().st_size for a in archives)
        
        # Parse dates from filenames
        dates = []
        for archive in archives:
            try:
                date_str = archive.stem.replace('prices-', '').replace('.ppmd', '')
                dates.append(datetime.strptime(date_str, '%Y-%m-%d'))
            except:
                pass
        
        return {
            'count': len(archives),
            'total_size_mb': total_size / 1024 / 1024,
            'oldest': min(dates).date() if dates else None,
            'newest': max(dates).date() if dates else None,
            'dates': sorted(dates)
        }


def main():
    """Example usage"""
    import sys
    
    print("="*70)
    print("TCGCSV PRICE HISTORY DOWNLOADER")
    print("="*70)
    
    downloader = TCGCSVHistoryDownloader()
    
    # Check current archives
    info = downloader.get_archive_info()
    print(f"\n📊 Current Archives:")
    print(f"  Count: {info['count']}")
    print(f"  Total Size: {info['total_size_mb']:.1f} MB")
    if info['oldest']:
        print(f"  Date Range: {info['oldest']} to {info['newest']}")
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "today":
            print("\n📥 Downloading today's prices...")
            downloader.download_archive(datetime.now())
            
        elif command == "week":
            print("\n📥 Downloading last 7 days...")
            downloader.download_last_n_days(7)
            
        elif command == "month":
            print("\n📥 Downloading last 30 days...")
            downloader.download_last_n_days(30)
            
        elif command == "all":
            print("\n📥 Downloading ALL available history (since Feb 8, 2024)...")
            print("⚠️  This may take a while and use several GB of disk space!")
            confirm = input("Continue? (yes/no): ")
            if confirm.lower() == 'yes':
                start = downloader.FIRST_AVAILABLE_DATE
                end = datetime.now()
                downloader.download_date_range(start, end)
            else:
                print("Cancelled.")
        
        elif command == "info":
            # Already printed above
            pass
        
        else:
            print(f"\n❌ Unknown command: {command}")
    
    else:
        print("\n💡 Usage:")
        print("  python3 tcgcsv_history_downloader.py today    # Download today")
        print("  python3 tcgcsv_history_downloader.py week     # Last 7 days")
        print("  python3 tcgcsv_history_downloader.py month    # Last 30 days")
        print("  python3 tcgcsv_history_downloader.py all      # All history")
        print("  python3 tcgcsv_history_downloader.py info     # Show current archives")
    
    # Show final summary
    info = downloader.get_archive_info()
    print(f"\n{'='*70}")
    print(f"SUMMARY")
    print(f"{'='*70}")
    print(f"Total Archives: {info['count']}")
    print(f"Total Size: {info['total_size_mb']:.1f} MB")
    if info['oldest']:
        print(f"Date Range: {info['oldest']} to {info['newest']}")
        print(f"\n📁 Archives saved to: {downloader.archives_dir}")
    
    print("\n⚠️  NOTE: Files are compressed .7z format")
    print("   Install 7zip to extract:")
    print("     macOS:   brew install p7zip")
    print("     Ubuntu:  sudo apt-get install p7zip-full")
    print("     Windows: Download from https://www.7-zip.org/")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()

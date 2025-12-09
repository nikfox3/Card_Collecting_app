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


def main():
    """Example usage"""
    import sys
    
    print("="*70)
    print("TCGCSV PRICE HISTORY DOWNLOADER")
    print("="*70)
    
    downloader = TCGCSVHistoryDownloader()
    
    # Download recent month of data
    print("\n📥 Downloading last 30 days of pricing data...")
    downloaded = downloader.download_last_n_days(30)
    
    print(f"\n✅ Downloaded {len(downloaded)} archives")
    print(f"📁 Location: {downloader.archives_dir}")
    
    print("\n⚠️  NOTE: Files need to be extracted with 7zip:")
    print("     macOS:   brew install p7zip")
    print("     Ubuntu:  sudo apt-get install p7zip-full")


if __name__ == "__main__":
    main()




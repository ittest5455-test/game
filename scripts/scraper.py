"""
Retro Games Scraper & Catalog Sync Utility
Fetches retro game metadata and download packages from public game archives
and syncs them into js/games-data.js.
"""

import json
import urllib.request
import re
import os

ARCHIVE_SEARCH_API = "https://archive.org/advancedsearch.php"

def search_internet_archive_games(query, collection="softwarelibrary_msdos_games", limit=10):
    """
    Search Internet Archive for MS-DOS games or console ROM packages
    """
    print(f"[*] Searching Archive.org for: '{query}' in collection '{collection}'...")
    url = f"{ARCHIVE_SEARCH_API}?q=collection%3A({collection})+AND+{urllib.parse.quote(query)}&fl[]=identifier,title,description,year,mediatype&sort[]=&rows={limit}&page=1&output=json"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            docs = data.get("response", {}).get("docs", [])
            print(f"[+] Found {len(docs)} matching items.")
            return docs
    except Exception as e:
        print(f"[!] Error fetching from Archive.org: {e}")
        return []

def main():
    print("=" * 60)
    print("🕹️  Retro Games Catalog Sync & Scraper Utility")
    print("=" * 60)
    print("1. สามารถเพิ่มเกมใหม่ๆ ได้ง่ายๆ โดยแก้ไขในไฟล์ js/games-data.js")
    print("2. ค้นหาเกมคลาสสิกเพิ่มเติมจาก Internet Archive / DOSZone CDN")
    print("=" * 60)

if __name__ == "__main__":
    main()

import urllib.request

test_urls = {
    "Resident Evil 2": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8j.jpg",
    "Final Fantasy VII": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8d.jpg",
    "Metal Gear Solid": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8c.jpg",
    "Tekken 3": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7c.jpg",
    "Silent Hill": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8k.jpg",
    "Crash Bandicoot 3": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8e.jpg",
    "Dino Crisis 2": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8f.jpg",
    "Resident Evil 3": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8g.jpg",
    "Castlevania SOTN": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8h.jpg",
    "Mega Man X4": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8i.jpg"
}

for name, url in test_urls.items():
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            print(f"[OK 200] {name}")
    except Exception as e:
        print(f"[FAIL] {name}: {e}")

import urllib.request

ps1_libretro = {
    "ps1-resident-evil-2": "https://raw.githubusercontent.com/libretro-thumbnails/Sony_-_PlayStation/master/Named_Boxarts/Resident%20Evil%202%20(USA).png",
    "ps1-final-fantasy-7": "https://raw.githubusercontent.com/libretro-thumbnails/Sony_-_PlayStation/master/Named_Boxarts/Final%20Fantasy%20VII%20(USA).png",
    "ps1-metal-gear-solid": "https://raw.githubusercontent.com/libretro-thumbnails/Sony_-_PlayStation/master/Named_Boxarts/Metal%20Gear%20Solid%20(USA).png",
    "ps1-crash-bandicoot-3": "https://raw.githubusercontent.com/libretro-thumbnails/Sony_-_PlayStation/master/Named_Boxarts/Crash%20Bandicoot%20-%20Warped%20(USA).png",
    "ps1-resident-evil-3": "https://raw.githubusercontent.com/libretro-thumbnails/Sony_-_PlayStation/master/Named_Boxarts/Resident%20Evil%203%20-%20Nemesis%20(USA).png",
    "ps1-dino-crisis-2": "https://raw.githubusercontent.com/libretro-thumbnails/Sony_-_PlayStation/master/Named_Boxarts/Dino%20Crisis%202%20(USA).png",
    "ps1-silent-hill": "https://raw.githubusercontent.com/libretro-thumbnails/Sony_-_PlayStation/master/Named_Boxarts/Silent%20Hill%20(USA).png",
    "ps1-kof-98": "https://raw.githubusercontent.com/libretro-thumbnails/Sony_-_PlayStation/master/Named_Boxarts/The%20King%20of%20Fighters%20'98%20(Europe).png"
}

for gid, url in ps1_libretro.items():
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            print(f"[OK 200] {gid} -> {res.status}")
    except Exception as e:
        print(f"[FAIL] {gid}: {e}")

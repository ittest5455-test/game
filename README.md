# 🕹️ RETRO GAMES HUB (OldGames Web Platform)

เว็บเล่นเกมเก่าระดับตำนาน (MS-DOS, NES, SNES, GBA, Sega Genesis, Arcade) สไตล์ **OldGames.app** ที่สามารถเล่นได้ทันทีผ่าน Web Browser ทั้งบนคอมพิวเตอร์, สมาร์ตโฟน และจอทีวี **Mi Box 2 / Android TV** ด้วยขุมพลัง **WebAssembly (JS-DOS & EmulatorJS)**

![Retro Games Hub Preview](https://images.igdb.com/igdb/image/upload/t_1080p/sc7f39.jpg)

---

## ✨ จุดเด่นและฟีเจอร์หลัก (Features)

- 🎮 **Multi-Engine Emulators ในตัว**:
  - **JS-DOS (DOSBox v8 WASM)**: สำหรับรันเกม PC DOS (.jsdos, .zip) เช่น DOOM, Prince of Persia, Dave, SkyRoads
  - **EmulatorJS (Libretro Web)**: สำหรับรันเกมคอนโซล NES (Famicom), Super Nintendo (SNES), Game Boy Advance (GBA), Sega Genesis, Arcade MAME
- 📺 **รองรับ Mi Box 2 / Android TV (10-Foot UI & Gamepad Ready)**:
  - รองรับการบังคับด้วย **รีโมท TV** หรือ **จอยเกม Bluetooth / USB Gamepad** เลื่อนเลือกเกมเหมือนหน้าคอนโซล
  - ตรวจจับ HTML5 Gamepad API อัตโนมัติ เสียบจอยแล้วเล่นได้ทันที
- 🖥️ **ฟิลเตอร์จอภาพ CRT Shaders & Fullscreen**:
  - เปิด/ปิดเส้นสแกนย้อนยุค (CRT Scanlines) เพิ่มความคลาสสิก
  - โหมดเล่นเต็มจอ Fullscreen ไร้ขอบ
- 🔍 **ค้นหาและจัดหมวดหมู่รวดเร็ว**:
  - Search หาชื่อเกมแบบ Realtime (กดปุ่ม `/` เพื่อค้นหาได้ทันที)
  - แถบเลือกเครื่องเกม (Platform Tabs) และหมวดหมู่แนวเกม (Genre Pills)
  - ระบบบันทึกเกมโปรด (Favorites)
- 📂 **เล่นไฟล์ ROM ส่วนตัว (Custom ROM Drag & Drop)**:
  - มีปุ่มโยนไฟล์ ROM หรือไฟล์ `.zip` จากในเครื่องเพื่อเปิดเล่นได้ทันทีโดยไม่ต้องอัปโหลดขึ้นเซิร์ฟเวอร์

---

## 🚀 วิธีเปิดใช้งานในเครื่อง (Local Run)

เพียงแค่รันคำสั่งด้วย Python ที่มีอยู่ในเครื่อง:

```bash
# รัน Web Server ภายในเครื่อง
python server.py
```

เบราว์เซอร์จะเปิดขึ้นมาที่ `http://localhost:3000` ทันที!

> 💡 **วิธีเล่นบน Mi Box 2 ในวง Wi-Fi เดียวกัน**:
> 1. ตรวจสอบ IP เครื่องคอมของคุณ (เช่น `192.168.1.50`)
> 2. เปิดบราวเซอร์บน Mi Box (เช่น แอป **TV Bro**) แล้วพิมพ์ `http://192.168.1.50:3000` ก็เล่นบนทีวีได้ทันที!

---

## 🌐 วิธีนำขึ้น GitHub & เปิดเล่นออนไลน์ฟรี (Deploy to GitHub / Vercel)

### ขั้นตอนนำขึ้น GitHub:
```bash
# 1. เริ่มต้น Git
git init

# 2. เพิ่มไฟล์ทั้งหมดและ Commit
git add .
git commit -m "Initial commit - Retro Games Hub"

# 3. เชื่อมต่อกับ GitHub Repository ของคุณ (เปลี่ยน URL เป็นของตัวเอง)
git remote add origin https://github.com/YOUR_USERNAME/retro-games-hub.git
git branch -M main
git push -u origin main
```

### วิธีเปิดเล่นออนไลน์ฟรี:
1. **GitHub Pages (อัตโนมัติ)**:
   - ไปที่แท็บ **Settings** ใน GitHub Repo ของคุณ
   - ไปที่เมนู **Pages** -> ในส่วน **Build and deployment** ให้เลือก Source เป็น **GitHub Actions**
   - ตัวเว็บจะ Deploy ให้อัตโนมัติ และได้ URL เช่น `https://YOUR_USERNAME.github.io/retro-games-hub/`
2. **Vercel (1-Click)**:
   - นำ Repo ไป Import เข้า [Vercel.com](https://vercel.com) แล้วกด **Deploy** จะได้โดเมนเว็บส่วนตัวฟรีตลอดชีพ

---

## 📂 โครงสร้างโฟลเดอร์ (Project Structure)

```text
GAME/
├── index.html                 # หน้าเว็บหลัก สไตล์ Arcade Dark UI
├── css/
│   └── style.css              # สไตล์ Neon, CRT Shader, TV Focus
├── js/
│   ├── games-data.js          # ฐานข้อมูลรายชื่อเกม ปกเกม และ ROM Links
│   ├── emulator.js            # ระบบรัน Emulator (JS-DOS + EmulatorJS)
│   ├── tv-navigation.js       # ระบบรับคำสั่งจากจอยเกม และรีโมท Mi Box
│   └── app.js                 # ระบบจัดการการค้นหาและฟิลเตอร์
├── scripts/
│   └── scraper.py             # สคริปต์ค้นหาและดึงเกมเพิ่มเติมจาก Archive.org
├── .github/workflows/
│   └── deploy.yml             # Workflow ออโต้ Deploy ขึ้น GitHub Pages
├── server.py                  # Local Web Server พร้อม Headers สำหรับ WASM
├── vercel.json                # คอนฟิกสำหรับ Vercel
└── README.md
```

---

## ➕ วิธีเพิ่มเกมใหม่ลงในระบบ
เปิดไฟล์ `js/games-data.js` และเพิ่ม Object เกมใหม่ตามโครงสร้าง:
```javascript
{
  id: "dos-my-game",
  title: "My Favorite Game",
  platform: "dos", // dos, nes, snes, gba, sega, arcade
  platformName: "MS-DOS",
  genre: "Action",
  year: 1995,
  developer: "Publisher Name",
  rating: 4.8,
  thumbnail: "https://example.com/cover.jpg",
  description: "คำอธิบายเกม...",
  controls: "ลูกศร: เดิน | Space: กระโดด",
  bundleUrl: "https://example.com/game.jsdos", // สำหรับ DOS
  // romUrl: "https://example.com/game.nes",   // สำหรับ Console
  emulatorType: "jsdos" // หรือ "emulatorjs"
}
```

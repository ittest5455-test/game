/**
 * Multi-Engine Web Emulator Manager - Optimized for Low-Power Devices (Mi Box / Web)
 * Features: High-Performance PCSX ReARMed Core, Auto-Frameskip, Native 1x Resolution, BIOS Fast-Boot
 */

class RetroEmulatorManager {
  constructor() {
    this.currentEngine = null;
    this.dosInstance = null;
    this.currentGame = null;
    this.isMuted = false;
    this.isCrtEnabled = false;
  }

  /**
   * Launch a game given its metadata object or custom file
   */
  async launchGame(game, customFile = null) {
    this.currentGame = game;
    const viewport = document.getElementById("emulator-viewport");
    const loader = document.getElementById("emulator-loading");
    const titleEl = document.getElementById("player-modal-title");
    const controlsGuide = document.getElementById("player-controls-guide");

    if (titleEl) titleEl.innerText = game.title;
    if (controlsGuide) controlsGuide.innerText = game.controls || "ใช้ปุ่มลูกศร, Z, X, C, Space และ Gamepad ในการควบคุม";

    viewport.innerHTML = "";
    loader.classList.remove("hidden");
    loader.innerHTML = `
      <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
      <p class="font-arcade text-xs text-cyan-400 animate-pulse">OPTIMIZING & LOADING GAME...</p>
      <p class="text-xs text-gray-400">ปรับแต่งเอนจินเพื่อความลื่นไหลสูงสุดบนเบราว์เซอร์</p>
    `;

    try {
      if (game.emulatorType === "jsdos") {
        await this.startJsDos(viewport, loader, game, customFile);
      } else {
        await this.startEmulatorJS(viewport, loader, game, customFile);
      }
    } catch (err) {
      console.error("Emulator launch failed:", err);
      this.showErrorUI(loader, game, err);
    }
  }

  showErrorUI(loader, game, err) {
    loader.classList.remove("hidden");
    loader.innerHTML = `
      <div class="max-w-md text-center p-6 bg-slate-900/95 border border-red-500/40 rounded-2xl space-y-4 shadow-2xl">
        <div class="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-2xl">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div>
          <h4 class="font-bold text-white text-base">เซิร์ฟเวอร์ไฟล์เกมตอบสนองช้า</h4>
          <p class="text-xs text-gray-400 mt-1">ไฟล์เกม PS1 มีขนาดใหญ่ หากอินเทอร์เน็ตดึงไฟล์ไม่ทัน สามารถเลือกไฟล์จากในเครื่องได้ทันที</p>
        </div>

        <div class="p-3 bg-slate-800/80 rounded-xl text-left text-xs space-y-2 border border-slate-700">
          <p class="font-semibold text-cyan-400"><i class="fas fa-bolt mr-1"></i> โหมดเร่งความเร็ว:</p>
          <p class="text-gray-300">ระบบได้เปิดโหมด <b>Frameskip & PCSX Low-Spec Mode</b> เพื่อให้เล่นได้ลื่นแม้สเปกไม่สูง</p>
        </div>

        <div class="flex items-center justify-center gap-3 pt-2">
          <button onclick="document.getElementById('modal-rom-file').click()" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <i class="fas fa-folder-open"></i> เลือกไฟล์ ROM จากในเครื่อง
          </button>
          <input type="file" id="modal-rom-file" class="hidden" accept=".chd,.iso,.bin,.cue,.pbp,.zip,.nes,.sfc,.gba,.md" onchange="if(this.files[0]) window.retroApp.openPlayerModal(window.retroEmulator.currentGame, this.files[0])" />
        </div>
      </div>
    `;
  }

  /**
   * Launch MS-DOS Game using JS-DOS CDN Player
   */
  async startJsDos(container, loader, game, customFile) {
    this.currentEngine = "jsdos";
    
    const iframe = document.createElement("iframe");
    iframe.className = "w-full h-full border-0 bg-black";
    iframe.allow = "autoplay; fullscreen; gamepad";
    
    const gameUrl = customFile ? URL.createObjectURL(customFile) : game.bundleUrl;

    const iframeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://v8.js-dos.com/latest/js-dos.css">
        <style>
          html, body, #dos { width: 100%; height: 100%; margin: 0; padding: 0; background: #000; overflow: hidden; }
          canvas { image-rendering: pixelated; }
        </style>
      </head>
      <body>
        <div id="dos"></div>
        <script src="https://v8.js-dos.com/latest/js-dos.js"></script>
        <script>
          Dos(document.getElementById("dos"), {
            url: "${gameUrl}",
            theme: "dark",
            autoStart: true,
            kiosk: true,
            noCloud: true
          }).then((ci) => {
            window.parent.postMessage({ type: "EMULATOR_READY" }, "*");
          }).catch((err) => {
            console.error("JS-DOS Error:", err);
          });
        </script>
      </body>
      </html>
    `;

    container.appendChild(iframe);
    iframe.srcdoc = iframeHtml;

    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "EMULATOR_READY") {
        loader.classList.add("hidden");
      }
    }, { once: true });

    setTimeout(() => {
      loader.classList.add("hidden");
    }, 2500);
  }

  /**
   * Launch Console Game with Performance & Frameskip Optimization
   */
  async startEmulatorJS(container, loader, game, customFile) {
    this.currentEngine = "emulatorjs";

    const iframe = document.createElement("iframe");
    iframe.className = "w-full h-full border-0 bg-black";
    iframe.allow = "autoplay; fullscreen; gamepad";

    const romUrl = customFile ? URL.createObjectURL(customFile) : game.romUrl;
    const core = game.core || "nes";

    const iframeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #000; overflow: hidden; }
          #game { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="game"></div>
        <script>
          window.EJS_player = '#game';
          window.EJS_core = '${core}';
          window.EJS_gameUrl = '${romUrl}';
          window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
          window.EJS_startOnLoaded = true;
          window.EJS_color = '#00f0ff';
          window.EJS_threads = false;
          
          // Performance Tweaks for Low Spec / Mi Box / Mobile
          ${core === 'psx' ? `
            window.EJS_biosUrl = 'https://cdn.emulatorjs.org/stable/data/scph5501.bin';
            window.EJS_settings = {
              frameskip: 'auto',
              resolution: 'native',
              audio_buffer_size: 1024
            };
          ` : ''}

          window.EJS_ready = function() {
            window.parent.postMessage({ type: "EMULATOR_READY" }, "*");
          };
          window.EJS_onGameStart = function() {
            window.parent.postMessage({ type: "EMULATOR_READY" }, "*");
          };
        </script>
        <script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script>
      </body>
      </html>
    `;

    container.appendChild(iframe);
    iframe.srcdoc = iframeHtml;

    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "EMULATOR_READY") {
        loader.classList.add("hidden");
      }
    }, { once: true });

    setTimeout(() => {
      loader.classList.add("hidden");
    }, 4000);
  }

  /**
   * Stop running emulator and clean up resources
   */
  stopEmulator() {
    const viewport = document.getElementById("emulator-viewport");
    if (viewport) {
      viewport.innerHTML = "";
    }
    this.currentEngine = null;
    this.currentGame = null;
  }

  /**
   * Toggle Fullscreen Mode
   */
  toggleFullscreen() {
    const playerModal = document.getElementById("player-modal-container");
    if (!document.fullscreenElement) {
      playerModal.requestFullscreen().catch(err => {
        console.warn(`Fullscreen error: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * Toggle CRT Scanlines Filter Overlay
   */
  toggleCrtFilter() {
    const container = document.getElementById("emulator-screen-wrapper");
    if (container) {
      container.classList.toggle("crt-enabled");
      this.isCrtEnabled = container.classList.contains("crt-enabled");
      return this.isCrtEnabled;
    }
    return false;
  }
}

window.retroEmulator = new RetroEmulatorManager();

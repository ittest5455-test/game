/**
 * Multi-Engine Web Emulator Manager
 * Supports: JS-DOS (MS-DOS) and EmulatorJS (NES, SNES, GBA, Genesis, Arcade, PS1/PSX)
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

    try {
      if (game.emulatorType === "jsdos") {
        await this.startJsDos(viewport, loader, game, customFile);
      } else {
        await this.startEmulatorJS(viewport, loader, game, customFile);
      }
    } catch (err) {
      console.error("Emulator launch failed:", err);
      loader.innerHTML = `
        <div class="text-center p-6 text-red-400">
          <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
          <p class="font-bold">เกิดข้อผิดพลาดในการโหลดเกม</p>
          <p class="text-xs text-gray-400 mt-2">${err.message || "ไม่สามารถเริ่มรัน Emulator ได้"}</p>
        </div>
      `;
    }
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
   * Launch Console Game using EmulatorJS (NES, SNES, GBA, Genesis, Arcade, PS1)
   */
  async startEmulatorJS(container, loader, game, customFile) {
    this.currentEngine = "emulatorjs";

    const iframe = document.createElement("iframe");
    iframe.className = "w-full h-full border-0 bg-black";
    iframe.allow = "autoplay; fullscreen; gamepad";

    let romUrl = customFile ? URL.createObjectURL(customFile) : game.romUrl;
    
    // Ensure Archive.org URLs use the CORS endpoint to avoid "Network Error"
    if (romUrl.includes("archive.org/download/")) {
      romUrl = romUrl.replace("archive.org/download/", "archive.org/cors/");
    }

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
          EJS_player = '#game';
          EJS_core = '${core}';
          EJS_gameUrl = '${romUrl}';
          EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
          EJS_startOnLoaded = true;
          EJS_color = '#00f0ff';
          EJS_loadStateURL = '';
          EJS_ready = function() {
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
    }, 3500);
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

/**
 * Multi-Engine Web Emulator Manager (Same-Origin Player Architecture)
 * Supports: JS-DOS (MS-DOS) and EmulatorJS (NES, SNES, GBA, Genesis, Arcade, PS1/PSX)
 */

class RetroEmulatorManager {
  constructor() {
    this.currentGame = null;
    this.isCrtEnabled = false;
  }

  /**
   * Launch a game given its metadata object or custom file
   */
  launchGame(game, customFile = null) {
    this.currentGame = game;
    const viewport = document.getElementById("emulator-viewport");
    const loader = document.getElementById("emulator-loading");
    const titleEl = document.getElementById("player-modal-title");
    const controlsGuide = document.getElementById("player-controls-guide");

    if (titleEl) titleEl.innerText = game.title;
    if (controlsGuide) controlsGuide.innerText = game.controls || "ใช้ปุ่มลูกศร, Z, X, C, Space และ Gamepad ในการควบคุม";

    viewport.innerHTML = "";
    if (loader) loader.classList.remove("hidden");

    let gameUrl = customFile ? URL.createObjectURL(customFile) : (game.bundleUrl || game.romUrl);
    const type = game.emulatorType || "emulatorjs";
    const core = game.core || "nes";

    // Create Same-Origin Player Iframe
    const iframe = document.createElement("iframe");
    iframe.className = "w-full h-full border-0 bg-black";
    iframe.allow = "autoplay; fullscreen; gamepad";
    iframe.src = `player.html?type=${encodeURIComponent(type)}&core=${encodeURIComponent(core)}&game=${encodeURIComponent(gameUrl)}`;

    viewport.appendChild(iframe);

    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "EMULATOR_READY") {
        if (loader) loader.classList.add("hidden");
      }
    }, { once: true });

    setTimeout(() => {
      if (loader) loader.classList.add("hidden");
    }, 3000);
  }

  /**
   * Stop running emulator and clean up resources
   */
  stopEmulator() {
    const viewport = document.getElementById("emulator-viewport");
    if (viewport) {
      viewport.innerHTML = "";
    }
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

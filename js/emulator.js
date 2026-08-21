/**
 * PENNUENG GAME - High-Performance Web Emulator Launcher (Direct Stream Architecture)
 * Supports: PS1, MS-DOS, NES, SNES, GBA, SEGA, Arcade
 */

class RetroEmulatorManager {
  constructor() {
    this.currentGame = null;
    this.isCrtEnabled = false;
  }

  /**
   * Launch a game directly inside our sleek modal viewport
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

    const iframe = document.createElement("iframe");
    iframe.className = "w-full h-full border-0 bg-black";
    iframe.allow = "autoplay; fullscreen; gamepad; focus-without-user-activation; cross-origin-isolated";
    iframe.setAttribute("allowfullscreen", "true");

    if (customFile) {
      // Local custom file drop
      const localUrl = URL.createObjectURL(customFile);
      iframe.src = `player.html?core=nes&game=${encodeURIComponent(localUrl)}`;
    } else {
      // Direct high-speed web stream embed
      iframe.src = game.embedUrl;
    }

    iframe.onload = () => {
      setTimeout(() => {
        if (loader) loader.classList.add("hidden");
      }, 1500);
    };

    viewport.appendChild(iframe);

    // Fallback timer
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

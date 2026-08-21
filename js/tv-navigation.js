/**
 * TV 10-Foot & Gamepad Navigation Manager
 * Designed specifically for Android TV (Mi Box), Remote Controls, and USB/Bluetooth Gamepads
 */

class TVNavigationManager {
  constructor() {
    this.currentFocusIndex = 0;
    this.focusableElements = [];
    this.gamepadConnected = false;
    this.gamepadPollingInterval = null;
    this.lastButtonPress = 0;
    
    this.init();
  }

  init() {
    this.bindKeyboardEvents();
    this.bindGamepadEvents();
    this.refreshFocusables();
  }

  /**
   * Scan DOM for interactive focusable cards and buttons
   */
  refreshFocusables() {
    // Only query visible elements
    this.focusableElements = Array.from(
      document.querySelectorAll(".tv-focusable:not(.hidden):not([style*='display: none'])")
    );
  }

  /**
   * Set focus to element at given index
   */
  setFocus(index) {
    this.refreshFocusables();
    if (!this.focusableElements.length) return;

    if (index < 0) index = this.focusableElements.length - 1;
    if (index >= this.focusableElements.length) index = 0;

    // Remove previous focus highlight
    this.focusableElements.forEach(el => el.classList.remove("tv-focused"));

    this.currentFocusIndex = index;
    const target = this.focusableElements[this.currentFocusIndex];
    if (target) {
      target.classList.add("tv-focused");
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }

  /**
   * Keyboard / TV Remote D-pad listeners
   */
  bindKeyboardEvents() {
    window.addEventListener("keydown", (e) => {
      // Don't hijack input if user is typing in the search input
      if (document.activeElement && document.activeElement.tagName === "INPUT") {
        if (e.key === "Escape") {
          document.activeElement.blur();
          this.setFocus(0);
        }
        return;
      }

      const modalOpen = !document.getElementById("player-modal").classList.contains("hidden");

      switch (e.key) {
        case "ArrowRight":
          if (!modalOpen) {
            e.preventDefault();
            this.setFocus(this.currentFocusIndex + 1);
          }
          break;
        case "ArrowLeft":
          if (!modalOpen) {
            e.preventDefault();
            this.setFocus(this.currentFocusIndex - 1);
          }
          break;
        case "ArrowDown":
          if (!modalOpen) {
            e.preventDefault();
            // Jump roughly a row ahead (e.g. 4 cards per row)
            this.setFocus(this.currentFocusIndex + 4);
          }
          break;
        case "ArrowUp":
          if (!modalOpen) {
            e.preventDefault();
            this.setFocus(this.currentFocusIndex - 4);
          }
          break;
        case "Enter":
          if (!modalOpen && this.focusableElements[this.currentFocusIndex]) {
            this.focusableElements[this.currentFocusIndex].click();
          }
          break;
        case "Escape":
        case "Backspace":
          if (modalOpen) {
            e.preventDefault();
            window.retroApp.closePlayerModal();
          }
          break;
        case "/":
          if (!modalOpen) {
            e.preventDefault();
            const searchInput = document.getElementById("search-input");
            if (searchInput) searchInput.focus();
          }
          break;
      }
    });
  }

  /**
   * Gamepad HTML5 API Integration
   */
  bindGamepadEvents() {
    window.addEventListener("gamepadconnected", (e) => {
      console.log("🎮 Gamepad connected:", e.gamepad.id);
      this.gamepadConnected = true;
      this.showGamepadBanner(e.gamepad.id);
      this.startGamepadPolling();
    });

    window.addEventListener("gamepaddisconnected", () => {
      console.log("Gamepad disconnected");
      this.gamepadConnected = false;
      this.stopGamepadPolling();
      const banner = document.getElementById("gamepad-status-badge");
      if (banner) banner.classList.add("hidden");
    });
  }

  showGamepadBanner(id) {
    const badge = document.getElementById("gamepad-status-badge");
    const nameEl = document.getElementById("gamepad-name");
    if (badge && nameEl) {
      nameEl.innerText = id.split("(")[0] || "Gamepad Connected";
      badge.classList.remove("hidden");
      setTimeout(() => {
        badge.classList.add("opacity-80");
      }, 3000);
    }
  }

  startGamepadPolling() {
    if (this.gamepadPollingInterval) return;

    this.gamepadPollingInterval = setInterval(() => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      if (!gp) return;

      const now = Date.now();
      if (now - this.lastButtonPress < 200) return; // Debounce

      const modalOpen = !document.getElementById("player-modal").classList.contains("hidden");

      // D-Pad or Left Stick
      const up = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
      const down = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
      const left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
      const right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;

      // Action buttons (A = Button 0, B = Button 1)
      const btnA = gp.buttons[0]?.pressed;
      const btnB = gp.buttons[1]?.pressed;

      if (!modalOpen) {
        if (right) { this.setFocus(this.currentFocusIndex + 1); this.lastButtonPress = now; }
        else if (left) { this.setFocus(this.currentFocusIndex - 1); this.lastButtonPress = now; }
        else if (down) { this.setFocus(this.currentFocusIndex + 4); this.lastButtonPress = now; }
        else if (up) { this.setFocus(this.currentFocusIndex - 4); this.lastButtonPress = now; }
        else if (btnA) {
          if (this.focusableElements[this.currentFocusIndex]) {
            this.focusableElements[this.currentFocusIndex].click();
            this.lastButtonPress = now;
          }
        }
      } else {
        if (btnB) {
          window.retroApp.closePlayerModal();
          this.lastButtonPress = now;
        }
      }
    }, 50);
  }

  stopGamepadPolling() {
    if (this.gamepadPollingInterval) {
      clearInterval(this.gamepadPollingInterval);
      this.gamepadPollingInterval = null;
    }
  }
}

window.tvNavigation = new TVNavigationManager();

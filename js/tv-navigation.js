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
    this.startGamepadPolling(); // Start polling immediately without waiting for event
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

      // While playing in modal, let game receive all controls except ESC / Exit
      if (modalOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          window.retroApp.closePlayerModal();
        }
        return;
      }

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          this.setFocus(this.currentFocusIndex + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          this.setFocus(this.currentFocusIndex - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          this.setFocus(this.currentFocusIndex + 4);
          break;
        case "ArrowUp":
          e.preventDefault();
          this.setFocus(this.currentFocusIndex - 4);
          break;
        case "Enter":
          if (this.focusableElements[this.currentFocusIndex]) {
            this.focusableElements[this.currentFocusIndex].click();
          }
          break;
        case "Backspace":
          if (modalOpen) {
            e.preventDefault();
            window.retroApp.closePlayerModal();
          }
          break;
        case "/":
          e.preventDefault();
          const searchInput = document.getElementById("search-input");
          if (searchInput) searchInput.focus();
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
      const gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      this.gamepadConnected = gamepads.length > 0;
      if (!this.gamepadConnected) {
        const banner = document.getElementById("gamepad-status-badge");
        if (banner) banner.classList.add("hidden");
      }
    });
  }

  showGamepadBanner(id) {
    const badge = document.getElementById("gamepad-status-badge");
    const nameEl = document.getElementById("gamepad-name");
    if (badge && nameEl) {
      nameEl.innerText = id.split("(")[0] || "Gamepad Connected";
      badge.classList.remove("hidden");
      badge.classList.remove("opacity-0");
      badge.classList.add("opacity-100");
      
      setTimeout(() => {
        badge.classList.add("transition-opacity", "duration-500", "opacity-0");
        setTimeout(() => {
          badge.classList.add("hidden");
        }, 500);
      }, 2500);
    }
  }

  /**
   * Continuous Gamepad Polling (Supports multi-controllers & stick/D-pad navigation)
   */
  startGamepadPolling() {
    if (this.gamepadPollingInterval) return;

    this.gamepadPollingInterval = setInterval(() => {
      if (!navigator.getGamepads) return;
      const gamepads = navigator.getGamepads();
      if (!gamepads) return;

      // Find first active gamepad with input
      let gp = null;
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
          gp = gamepads[i];
          break;
        }
      }

      if (!gp) return;

      const playerModal = document.getElementById("player-modal");
      const modalOpen = playerModal && !playerModal.classList.contains("hidden");

      // While playing in modal: focus iframe and let all buttons pass through directly to game
      if (modalOpen) {
        const iframe = document.getElementById("active-game-iframe");
        if (iframe && document.activeElement !== iframe) {
          // Check if any button pressed to reclaim iframe focus
          const anyButtonPressed = gp.buttons.some(b => b && b.pressed);
          if (anyButtonPressed) {
            try {
              iframe.focus();
              iframe.contentWindow?.focus();
            } catch (e) {}
          }
        }

        // Close game if holding Select + Start or Home (button 8+9 or button 16)
        const btnHome = gp.buttons[16]?.pressed;
        const btnSelect = gp.buttons[8]?.pressed;
        const btnStart = gp.buttons[9]?.pressed;

        if (btnHome || (btnSelect && btnStart)) {
          const now = Date.now();
          if (now - this.lastButtonPress > 500) {
            this.lastButtonPress = now;
            window.retroApp.closePlayerModal();
          }
        }
        return; // Do not consume or navigate menu while playing
      }

      const now = Date.now();
      if (now - this.lastButtonPress < 170) return; // Debounce menu navigation

      // D-Pad or Left Analog Stick
      const up = (gp.buttons[12] && gp.buttons[12].pressed) || (gp.axes[1] && gp.axes[1] < -0.5);
      const down = (gp.buttons[13] && gp.buttons[13].pressed) || (gp.axes[1] && gp.axes[1] > 0.5);
      const left = (gp.buttons[14] && gp.buttons[14].pressed) || (gp.axes[0] && gp.axes[0] < -0.5);
      const right = (gp.buttons[15] && gp.buttons[15].pressed) || (gp.axes[0] && gp.axes[0] > 0.5);

      // Action Button A / Cross (button 0 or button 1)
      const btnA = (gp.buttons[0] && gp.buttons[0].pressed) || (gp.buttons[1] && gp.buttons[1].pressed);

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
    }, 40);
  }

  stopGamepadPolling() {
    if (this.gamepadPollingInterval) {
      clearInterval(this.gamepadPollingInterval);
      this.gamepadPollingInterval = null;
    }
  }
}
}

window.tvNavigation = new TVNavigationManager();

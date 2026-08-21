/**
 * Retro Games Hub - Main Application
 */

class RetroApp {
  constructor() {
    this.games = RETRO_GAMES_DATABASE || [];
    this.currentPlatform = "all";
    this.currentGenre = "all";
    this.searchQuery = "";
    this.favorites = JSON.parse(localStorage.getItem("retro_favorites") || "[]");

    this.init();
  }

  init() {
    this.renderFeaturedBanner();
    this.renderGames();
    this.bindEvents();
    this.updateStats();
    this.bindDropzone();
  }

  /**
   * Filter games by platform, genre, and search query
   */
  getFilteredGames() {
    return this.games.filter(game => {
      const matchPlatform = this.currentPlatform === "all" || 
        (this.currentPlatform === "favorites" ? this.favorites.includes(game.id) : game.platform === this.currentPlatform);
      const matchGenre = this.currentGenre === "all" || game.genre.toLowerCase() === this.currentGenre.toLowerCase();
      const matchQuery = this.searchQuery === "" || 
        game.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        game.platformName.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchPlatform && matchGenre && matchQuery;
    });
  }

  /**
   * Render Featured Hero Carousel / Banner
   */
  renderFeaturedBanner() {
    const featuredGames = this.games.filter(g => g.featured);
    if (!featuredGames.length) return;

    const bannerEl = document.getElementById("featured-banner");
    if (!bannerEl) return;

    const game = featuredGames[0]; // Featured headline game
    bannerEl.style.backgroundImage = `linear-gradient(to right, rgba(11, 14, 23, 0.95) 30%, rgba(11, 14, 23, 0.6) 70%, rgba(11, 14, 23, 0.85)), url('${game.banner || game.thumbnail}')`;

    document.getElementById("featured-title").innerText = game.title;
    document.getElementById("featured-desc").innerText = game.description;
    document.getElementById("featured-platform-badge").innerText = game.platformName;
    document.getElementById("featured-year").innerText = game.year;
    document.getElementById("featured-genre").innerText = game.genre;

    const playBtn = document.getElementById("featured-play-btn");
    playBtn.onclick = () => this.openPlayerModal(game);
  }

  /**
   * Render Game Cards Grid
   */
  renderGames() {
    const grid = document.getElementById("games-grid");
    const countEl = document.getElementById("results-count");
    if (!grid) return;

    const filtered = this.getFilteredGames();
    if (countEl) countEl.innerText = `${filtered.length} เกมพร้อมเล่น`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-gray-400">
          <i class="fas fa-gamepad text-5xl mb-4 text-cyan-400 opacity-60"></i>
          <p class="text-lg font-medium">ไม่พบเกมที่ตรงกับการค้นหา</p>
          <p class="text-sm text-gray-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกแพลตฟอร์มอื่น</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map((game, index) => {
      const isFav = this.favorites.includes(game.id);
      return `
        <div class="tv-focusable group relative bg-[#131b2e] rounded-xl overflow-hidden border border-slate-800/80 hover:border-cyan-500/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col cursor-pointer"
             tabindex="0"
             onclick="window.retroApp.openPlayerModalById('${game.id}')">
          
          <!-- Image Container -->
          <div class="relative w-full aspect-[4/3] bg-black overflow-hidden">
            <img src="${game.thumbnail}" alt="${game.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            
            <div class="absolute inset-0 bg-gradient-to-t from-[#131b2e] via-transparent to-black/40 opacity-70"></div>
            
            <!-- Platform Badge -->
            <div class="absolute top-2.5 left-2.5">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-cyan-400 border border-cyan-500/40 uppercase tracking-wider font-tech">
                ${game.platformName}
              </span>
            </div>

            <!-- Favorite Button -->
            <button class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-pink-400 transition-colors z-10"
                    onclick="event.stopPropagation(); window.retroApp.toggleFavorite('${game.id}')"
                    title="บันทึกเกมโปรด">
              <i class="${isFav ? 'fas fa-heart text-pink-500' : 'far fa-heart'} text-sm"></i>
            </button>

            <!-- Quick Play Hover Overlay -->
            <div class="absolute inset-0 bg-cyan-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div class="w-12 h-12 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg shadow-cyan-500/50 transform group-hover:scale-110 transition-transform">
                <i class="fas fa-play text-lg ml-0.5"></i>
              </div>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>${game.year}</span>
                <span class="flex items-center gap-1 text-amber-400">
                  <i class="fas fa-star text-[10px]"></i> ${game.rating}
                </span>
              </div>
              <h3 class="font-bold text-slate-100 text-sm line-clamp-1 group-hover:text-cyan-400 transition-colors">${game.title}</h3>
              <p class="text-xs text-gray-400 mt-1 line-clamp-2">${game.description}</p>
            </div>

            <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span class="text-gray-400 bg-slate-800/60 px-2 py-0.5 rounded">${game.genre}</span>
              <span class="text-cyan-400 font-semibold flex items-center gap-1">
                PLAY <i class="fas fa-arrow-right text-[9px]"></i>
              </span>
            </div>
          </div>

        </div>
      `;
    }).join("");

    if (window.tvNavigation) {
      window.tvNavigation.refreshFocusables();
    }
  }

  /**
   * Toggle Favorite Game
   */
  toggleFavorite(gameId) {
    if (this.favorites.includes(gameId)) {
      this.favorites = this.favorites.filter(id => id !== gameId);
    } else {
      this.favorites.push(gameId);
    }
    localStorage.setItem("retro_favorites", JSON.stringify(this.favorites));
    this.renderGames();
    this.updateStats();
  }

  /**
   * Update header counters
   */
  updateStats() {
    const favBadge = document.getElementById("fav-count-badge");
    if (favBadge) {
      favBadge.innerText = this.favorites.length;
      favBadge.classList.toggle("hidden", this.favorites.length === 0);
    }
  }

  /**
   * Open Game In Player Modal
   */
  openPlayerModalById(id) {
    const game = this.games.find(g => g.id === id);
    if (game) this.openPlayerModal(game);
  }

  openPlayerModal(game, customFile = null) {
    const modal = document.getElementById("player-modal");
    if (!modal) return;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    window.retroEmulator.launchGame(game, customFile);
  }

  closePlayerModal() {
    const modal = document.getElementById("player-modal");
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = "auto";
    window.retroEmulator.stopEmulator();
  }

  /**
   * Bind event listeners for UI tabs and search
   */
  bindEvents() {
    // Platform tabs
    document.querySelectorAll(".platform-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".platform-tab-btn").forEach(b => {
          b.classList.remove("bg-cyan-500", "text-black", "border-cyan-400");
          b.classList.add("bg-slate-800/80", "text-gray-300", "border-slate-700");
        });
        btn.classList.remove("bg-slate-800/80", "text-gray-300", "border-slate-700");
        btn.classList.add("bg-cyan-500", "text-black", "border-cyan-400");

        this.currentPlatform = btn.dataset.platform;
        this.renderGames();
      });
    });

    // Genre Filter Pills
    document.querySelectorAll(".genre-pill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".genre-pill-btn").forEach(b => {
          b.classList.remove("bg-purple-600", "text-white");
          b.classList.add("bg-slate-900/60", "text-gray-400");
        });
        btn.classList.remove("bg-slate-900/60", "text-gray-400");
        btn.classList.add("bg-purple-600", "text-white");

        this.currentGenre = btn.dataset.genre;
        this.renderGames();
      });
    });

    // Search Input
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderGames();
      });
    }

    // Close Player Modal Button
    const closeBtn = document.getElementById("close-player-btn");
    if (closeBtn) closeBtn.onclick = () => this.closePlayerModal();

    // Fullscreen button
    const fsBtn = document.getElementById("fullscreen-btn");
    if (fsBtn) fsBtn.onclick = () => window.retroEmulator.toggleFullscreen();

    // CRT Toggle button
    const crtBtn = document.getElementById("crt-toggle-btn");
    if (crtBtn) {
      crtBtn.onclick = () => {
        const enabled = window.retroEmulator.toggleCrtFilter();
        crtBtn.classList.toggle("text-cyan-400", enabled);
      };
    }

    // Custom ROM Upload Modal
    const openUploadBtn = document.getElementById("open-upload-btn");
    const uploadModal = document.getElementById("upload-modal");
    const closeUploadBtn = document.getElementById("close-upload-btn");

    if (openUploadBtn && uploadModal) {
      openUploadBtn.onclick = () => uploadModal.classList.remove("hidden");
    }
    if (closeUploadBtn && uploadModal) {
      closeUploadBtn.onclick = () => uploadModal.classList.add("hidden");
    }
  }

  /**
   * Custom ROM Drag & Drop Handler
   */
  bindDropzone() {
    const dropzone = document.getElementById("rom-dropzone");
    const fileInput = document.getElementById("rom-file-input");

    if (!dropzone || !fileInput) return;

    dropzone.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleCustomRom(e.target.files[0]);
      }
    };

    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add("border-cyan-400", "bg-cyan-950/30");
    };

    dropzone.ondragleave = () => {
      dropzone.classList.remove("border-cyan-400", "bg-cyan-950/30");
    };

    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove("border-cyan-400", "bg-cyan-950/30");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleCustomRom(e.dataTransfer.files[0]);
      }
    };
  }

  handleCustomRom(file) {
    const name = file.name.toLowerCase();
    let emulatorType = "emulatorjs";
    let core = "nes";
    let platformName = "Custom ROM";

    if (name.endsWith(".zip") || name.endsWith(".jsdos")) {
      emulatorType = "jsdos";
      platformName = "MS-DOS (.zip)";
    } else if (name.endsWith(".nes")) {
      core = "nes";
      platformName = "NES";
    } else if (name.endsWith(".sfc") || name.endsWith(".smc")) {
      core = "snes";
      platformName = "SNES";
    } else if (name.endsWith(".gba")) {
      core = "gba";
      platformName = "GBA";
    } else if (name.endsWith(".md") || name.endsWith(".gen") || name.endsWith(".bin")) {
      core = "segaMD";
      platformName = "Sega Genesis";
    }

    const customGame = {
      id: "custom-" + Date.now(),
      title: file.name.replace(/\.[^/.]+$/, ""),
      platform: "custom",
      platformName: platformName,
      genre: "Custom",
      year: new Date().getFullYear(),
      developer: "Local File",
      rating: 5.0,
      description: `เล่นไฟล์ ROM ส่วนตัว: ${file.name}`,
      controls: "ควบคุมด้วย Keyboard หรือ Gamepad",
      emulatorType: emulatorType,
      core: core
    };

    const uploadModal = document.getElementById("upload-modal");
    if (uploadModal) uploadModal.classList.add("hidden");

    this.openPlayerModal(customGame, file);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.retroApp = new RetroApp();
});

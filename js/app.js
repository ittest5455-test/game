/**
 * Retro Games Hub - Main Application & Live Archive Explorer
 */

class RetroApp {
  constructor() {
    this.games = RETRO_GAMES_DATABASE || [];
    this.currentPlatform = "all";
    this.currentGenre = "all";
    this.currentSpecTier = "all";
    this.searchQuery = "";
    this.favorites = JSON.parse(localStorage.getItem("retro_favorites") || "[]");
    this.isOnlineArchiveMode = false;
    this.onlineGamesCache = [];
    this.isSearchingOnline = false;
    this.displayLimit = 60;

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
   * Filter games by platform, spec tier, genre, and search query
   */
  getFilteredGames() {
    if (this.isOnlineArchiveMode) {
      return this.onlineGamesCache;
    }

    const cartridgePlatforms = ["nes", "snes", "gba", "gbc", "sega", "n64"];

    return this.games.filter(game => {
      // 1. Check Platform
      let matchPlatform = false;
      if (this.currentPlatform === "all") {
        matchPlatform = true;
      } else if (this.currentPlatform === "favorites") {
        matchPlatform = this.favorites.includes(game.id);
      } else if (this.currentPlatform === "cartridges") {
        matchPlatform = cartridgePlatforms.includes(game.platform);
      } else {
        matchPlatform = game.platform === this.currentPlatform;
      }

      // 2. Check TV Box Spec Tier
      const isHighSpec = game.platform === "ps1" || 
                         game.platform === "n64" ||
                         ["dos-doom", "dos-duke-nukem-3d", "dos-red-alert", "dos-warcraft-2", "dos-simcity-2000", "dos-wolfenstein-3d"].includes(game.id) ||
                         ["arcade-kof-98", "arcade-kof-2002", "arcade-marvel-vs-capcom", "arcade-street-fighter-alpha-3"].includes(game.id);

      let matchTier = true;
      if (this.currentSpecTier === "low-spec") {
        matchTier = !isHighSpec; // Low-spec includes all 8/16-bit, GBA, 2D DOS & Arcade (Smooth 60FPS on any TV box!)
      } else if (this.currentSpecTier === "high-spec") {
        matchTier = isHighSpec; // High-spec includes 3D PS1 & Heavy PC
      }

      const matchGenre = this.currentGenre === "all" || game.genre.toLowerCase() === this.currentGenre.toLowerCase();
      const matchQuery = this.searchQuery === "" || 
        game.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        game.platformName.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchPlatform && matchTier && matchGenre && matchQuery;
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

    const game = featuredGames[Math.floor(Math.random() * featuredGames.length)] || featuredGames[0];
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
   * Fetch games from Internet Archive Live API (Over 10,000+ Retro Games) with CORS Proxy Fallbacks
   */
  async searchOnlineArchive(query = "game") {
    const grid = document.getElementById("games-grid");
    const countEl = document.getElementById("results-count");
    
    this.isSearchingOnline = true;
    grid.innerHTML = `
      <div class="col-span-full py-20 text-center space-y-4">
        <div class="w-12 h-12 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto"></div>
        <p class="font-arcade text-xs text-purple-400 animate-pulse">CONNECTING 10,000+ ONLINE RETRO ARCHIVE...</p>
        <p class="text-xs text-gray-400">กำลังเชื่อมต่อฐานข้อมูลเกมคลาสสิกออนไลน์</p>
      </div>
    `;

    try {
      const q = encodeURIComponent(query || "game");
      const targetApi = `https://archive.org/advancedsearch.php?q=collection%3A(softwarelibrary_msdos_games)+AND+${q}&fl[]=identifier,title,description,year,downloads&sort[]=downloads+desc&rows=30&page=1&output=json`;
      
      let res;
      try {
        // Try direct fetch first
        res = await fetch(targetApi);
      } catch (e) {
        // Fallback to CORS proxy if browser blocks direct call
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetApi)}`;
        res = await fetch(proxyUrl);
      }

      const data = await res.json();
      const docs = data.response?.docs || [];

      if (!docs.length) {
        throw new Error("No games found");
      }

      this.onlineGamesCache = docs.map(doc => {
        const id = doc.identifier;
        return {
          id: `ia-${id}`,
          title: doc.title || id,
          platform: "dos",
          platformName: "MS-DOS Archive",
          genre: "Archive Classic",
          year: doc.year || 1995,
          developer: "Internet Archive",
          rating: 4.8,
          thumbnail: `https://archive.org/services/img/${id}`,
          description: (doc.description ? doc.description.replace(/<[^>]*>?/gm, '').slice(0, 140) : "เล่นเกมคลาสสิกจาก Internet Archive") + "...",
          controls: "ใช้ปุ่มลูกศร, Space, Enter และ Gamepad",
          bundleUrl: `https://archive.org/cors/${id}/${id}.zip`,
          emulatorType: "jsdos"
        };
      });

      if (countEl) countEl.innerText = `${this.onlineGamesCache.length} เกมจาก Online Archive`;
      this.renderGames();
    } catch (err) {
      console.warn("Archive Search Fallback to Built-in Full Catalog:", err);
      // Seamless Fallback to filtered built-in games matching query so user always gets games
      this.onlineGamesCache = this.games.filter(g => 
        g.title.toLowerCase().includes(query.toLowerCase()) || 
        g.genre.toLowerCase().includes(query.toLowerCase()) ||
        g.platformName.toLowerCase().includes(query.toLowerCase())
      );
      if (!this.onlineGamesCache.length) this.onlineGamesCache = this.games;
      if (countEl) countEl.innerText = `${this.onlineGamesCache.length} เกมพร้อมเล่น`;
      this.renderGames();
    } finally {
      this.isSearchingOnline = false;
    }
  }

  /**
   * Render Game Cards Grid
   */
  renderGames() {
    const grid = document.getElementById("games-grid");
    const countEl = document.getElementById("results-count");
    if (!grid) return;

    const filtered = this.getFilteredGames();
    if (!this.isOnlineArchiveMode && countEl) {
      countEl.innerText = `${filtered.length} เกมพร้อมเล่น`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-gray-400">
          <i class="fas fa-gamepad text-5xl mb-4 text-cyan-400 opacity-60"></i>
          <p class="text-lg font-medium">ไม่พบเกมที่ตรงกับการค้นหา</p>
          <p class="text-sm text-gray-500 mt-1">ลองพิมพ์ค้นหาในแท็บ Online Archive เพื่อค้นหาเกมอื่นๆ ในคลังออนไลน์</p>
        </div>
      `;
      return;
    }

    const toRender = filtered.slice(0, this.displayLimit);
    const hasMore = filtered.length > this.displayLimit;

    grid.innerHTML = toRender.map((game) => {
      const isFav = this.favorites.includes(game.id);
      const isHighSpec = game.platform === "ps1" || 
                         game.platform === "n64" ||
                         ["dos-doom", "dos-duke-nukem-3d", "dos-red-alert", "dos-warcraft-2", "dos-simcity-2000", "dos-wolfenstein-3d"].includes(game.id) ||
                         ["arcade-kof-98", "arcade-kof-2002", "arcade-marvel-vs-capcom", "arcade-street-fighter-alpha-3"].includes(game.id);

      return `
        <div class="tv-focusable group relative bg-[#131b2e] rounded-xl overflow-hidden border border-slate-800/80 hover:border-cyan-500/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col cursor-pointer"
             tabindex="0"
             onclick="window.retroApp.openPlayerModalById('${game.id}')">
          
          <!-- Image Container -->
          <div class="relative w-full aspect-[4/3] bg-black overflow-hidden">
            <img src="${game.thumbnail}" alt="${game.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.onerror=null; this.src='https://images.igdb.com/igdb/image/upload/t_cover_big/co1x9r.jpg'" />
            
            <div class="absolute inset-0 bg-gradient-to-t from-[#131b2e] via-transparent to-black/40 opacity-70"></div>
            
            <!-- Platform & TV Box Spec Badges -->
            <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-cyan-400 border border-cyan-500/40 uppercase tracking-wider font-tech">
                ${game.platformName}
              </span>
              ${isHighSpec ? 
                `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-950/90 backdrop-blur-md text-purple-300 border border-purple-500/50 flex items-center gap-1 shadow-sm">
                   <i class="fas fa-rocket text-[8px]"></i> สเปกสูง
                 </span>` :
                `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-950/90 backdrop-blur-md text-emerald-400 border border-emerald-500/50 flex items-center gap-1 shadow-sm">
                   <i class="fas fa-bolt text-[8px]"></i> สเปกต่ำลื่น 60FPS
                 </span>`
              }
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

    if (hasMore) {
      grid.innerHTML += `
        <div class="col-span-full py-8 text-center">
          <button class="tv-focusable px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-bold text-sm shadow-xl shadow-cyan-500/20 transform hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                  onclick="window.retroApp.loadMoreGames()">
            <i class="fas fa-plus-circle text-base"></i>
            <span>โหลดเกมเพิ่มเติม (+60 เกม) - เหลืออีก ${filtered.length - this.displayLimit} เกม</span>
          </button>
        </div>
      `;
    }

    if (window.tvNavigation) {
      window.tvNavigation.refreshFocusables();
    }
  }

  loadMoreGames() {
    this.displayLimit += 60;
    this.renderGames();
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
    let game = this.games.find(g => g.id === id);
    if (!game && this.isOnlineArchiveMode) {
      game = this.onlineGamesCache.find(g => g.id === id);
    }
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
    // TV Box Spec Tier Filter Buttons
    document.querySelectorAll(".spec-tier-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".spec-tier-btn").forEach(b => {
          b.classList.remove("bg-cyan-500", "text-black", "shadow-cyan-500/20");
          b.classList.add("bg-slate-800");
          if (b.dataset.tier === "low-spec") {
            b.classList.add("text-emerald-400");
          } else if (b.dataset.tier === "high-spec") {
            b.classList.add("text-purple-300");
          } else {
            b.classList.add("text-gray-300");
          }
        });

        btn.classList.remove("bg-slate-800", "text-emerald-400", "text-purple-300", "text-gray-300");
        btn.classList.add("bg-cyan-500", "text-black", "shadow-cyan-500/20");

        this.currentSpecTier = btn.dataset.tier;
        this.displayLimit = 60;
        this.renderGames();
      });
    });

    // Platform tabs
    document.querySelectorAll(".platform-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".platform-tab-btn").forEach(b => {
          b.classList.remove("bg-cyan-500", "text-black", "border-cyan-400", "bg-purple-600");
          b.classList.add("bg-slate-800/80", "text-gray-300", "border-slate-700");
        });

        const platform = btn.dataset.platform;

        if (platform === "online-archive") {
          btn.classList.remove("bg-slate-800/80", "text-gray-300", "border-slate-700");
          btn.classList.add("bg-purple-600", "text-white", "border-purple-400");
          this.isOnlineArchiveMode = true;
          this.searchOnlineArchive(this.searchQuery || "mario");
        } else {
          btn.classList.remove("bg-slate-800/80", "text-gray-300", "border-slate-700");
          btn.classList.add("bg-cyan-500", "text-black", "border-cyan-400");
          this.isOnlineArchiveMode = false;
          this.currentPlatform = platform;
          this.displayLimit = 60;
          this.renderGames();
        }
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
        this.displayLimit = 60;
        this.renderGames();
      });
    });

    // Search Input
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      let debounceTimeout;
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.trim();
        this.displayLimit = 60;
        clearTimeout(debounceTimeout);

        if (this.isOnlineArchiveMode) {
          debounceTimeout = setTimeout(() => {
            this.searchOnlineArchive(this.searchQuery || "action");
          }, 600);
        } else {
          this.renderGames();
        }
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

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
    this.initCardMotionEffects();
  }

  /**
   * Filter games by platform and search query
   */
  getFilteredGames() {
    if (this.isOnlineArchiveMode) {
      return this.onlineGamesCache;
    }

    return this.games.filter(game => {
      // 1. Check Platform
      let matchPlatform = false;
      if (this.currentPlatform === "all") {
        matchPlatform = true;
      } else if (this.currentPlatform === "favorites") {
        matchPlatform = this.favorites.includes(game.id);
      } else {
        matchPlatform = game.platform === this.currentPlatform;
      }

      // 2. Check Search Query
      const q = this.searchQuery.toLowerCase().trim();
      const matchQuery = q === "" || 
        game.title.toLowerCase().includes(q) ||
        (game.id && game.id.toLowerCase().includes(q)) ||
        game.description.toLowerCase().includes(q) ||
        game.platformName.toLowerCase().includes(q) ||
        (game.genre && game.genre.toLowerCase().includes(q));

      return matchPlatform && matchQuery;
    });
  }

  /**
   * Render 3D Image Stream Hero Banner (Clean, Unobstructed, Hover to Enlarge & Click to Play)
   */
  renderFeaturedBanner() {
    const bannerEl = document.getElementById("featured-banner");
    if (!bannerEl) return;

    // Initialize the 3D Image Stream Rails
    this.initImageStreamHero();
  }

  /**
   * Generate 3D perspective keyframe math for Image Stream rails (Ruixen UI Image Stream Hero model)
   */
  generateStreamKeyframes(dir, name) {
    const cfg = {
      perspective: 32,
      cardWidth: 16,
      cardHeight: 22,
      cardRadius: 0.6,
      birthHeight: 2.5,
      exitHeight: 44,
      railBirth: -10,
      railExit: 42,
      fan: 3.2,
      turnBirth: 6,
      turnExit: 26,
      stops: 24
    };
    const frames = [];
    for (let step = 0; step <= cfg.stops; step++) {
      const R = step / cfg.stops;
      const N = (cfg.birthHeight / cfg.cardHeight) * Math.pow(cfg.exitHeight / cfg.birthHeight, R);
      const z = cfg.perspective * (1 - 1 / N);
      const x = cfg.railExit - (cfg.railExit - cfg.railBirth) * Math.pow(1 - R, cfg.fan);
      const p = cfg.turnBirth + (cfg.turnExit - cfg.turnBirth) * R;
      const opacity = R < 0.1 ? (R / 0.1) : (R > 0.85 ? ((1 - R) / 0.15) : 1);
      frames.push(`${(R * 100).toFixed(1)}%{transform:translate3d(${(dir * x).toFixed(2)}cqw,0,${z.toFixed(2)}cqw) rotateY(${(-dir * p).toFixed(2)}deg);opacity:${opacity.toFixed(2)};}`);
    }
    return `@keyframes ${name}{${frames.join("")}}`;
  }

  /**
   * Initialize 3D Image Stream Rails with retro game covers
   * Clean, unblocked 3D corridor. Hovering enlarges card smoothly in place with zero jitter!
   */
  initImageStreamHero() {
    const root = document.getElementById("image-stream-root");
    if (!root) return;

    // Pick top iconic games across platforms
    const streamPool = [
      "nes-contra",
      "ps1-pepsiman",
      "snes-contra-iii",
      "ps1-jackie-chan",
      "sega-contra-hard-corps",
      "arcade-metal-slug",
      "arcade-contra",
      "snes-super-mario-world",
      "gba-contra-advance",
      "snes-chrono-trigger",
      "sega-sonic-the-hedgehog-2",
      "gba-pokemon-emerald",
      "nes-super-c",
      "ps1-bloody-roar-2",
      "ps1-chocobo-racing",
      "n64-super-mario-64"
    ].map(id => this.games.find(g => g.id === id)).filter(Boolean);

    const streamGames = streamPool.length >= 8 ? streamPool : this.games.slice(0, 16);
    const speed = 24; // seconds for smooth continuous loop
    const cardsPerRail = 8;
    const axisY = 56; // % perspective origin height (creates the curved U-shaped corridor)

    const styleId = "ish-styles";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      ${this.generateStreamKeyframes(1, "ish-r")}
      ${this.generateStreamKeyframes(-1, "ish-l")}

      .ish-stream-wrap {
        perspective: 32cqw;
        perspective-origin: 50% ${axisY}%;
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0;
      }
      .ish-stream-inner {
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0;
        transform-style: preserve-3d;
      }
      /* Animated Slot maintains the 3D trajectory */
      .ish-slot {
        position: absolute;
        left: 50%;
        top: ${axisY}%;
        width: 14.5cqw;
        height: 21.5cqw;
        margin-left: -7.25cqw;
        margin-top: -10.75cqw;
        transform-style: preserve-3d;
        will-change: transform, opacity;
      }
      /* Inner Card handles smooth scale-up on hover without disrupting the 3D path */
      .ish-card-box {
        width: 100%;
        height: 100%;
        border-radius: 0.9cqw;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 14px 32px rgba(0, 0, 0, 0.85), 0 0 15px rgba(6, 182, 212, 0.15);
        transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.25), box-shadow 0.25s ease, border-color 0.25s ease;
        transform-origin: center center;
        background: #0f1526;
        transform-style: preserve-3d;
      }
      .ish-card-box img {
        transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.25);
        will-change: transform;
      }
      /* Scale up smoothly when hovered or focused */
      .ish-slot:hover .ish-card-box,
      .ish-slot:focus-within .ish-card-box {
        transform: scale(1.42);
        border-color: #00f0ff;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 240, 255, 0.85);
        z-index: 999;
      }
      .ish-slot:hover .ish-card-box img:not(.is-tracking) {
        animation: retroImgBreath 2.8s ease-in-out infinite;
      }
      .ish-card-overlay {
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      .ish-slot:hover .ish-card-overlay,
      .ish-slot:focus-within .ish-card-overlay {
        opacity: 1;
      }
      #featured-banner:hover .ish-slot {
        animation-play-state: paused;
      }
      @media (prefers-reduced-motion: reduce) {
        .ish-slot { animation-play-state: paused !important; }
      }
    `;

    let html = `
      <div class="ish-stream-wrap" aria-hidden="true">
        <div class="ish-stream-inner">
    `;

    // Right rail
    for (let i = 0; i < cardsPerRail; i++) {
      const g = streamGames[i % streamGames.length];
      const delay = -(i * speed / cardsPerRail).toFixed(2);
      html += `
        <div class="ish-slot tv-focusable"
             tabindex="0"
             style="animation: ish-r ${speed}s linear infinite ${delay}s;"
             title="กดเล่นเกม: ${g.title}"
             onclick="window.retroApp.openPlayerModalById('${g.id}')">
          <div class="ish-card-box group">
            <img src="${g.thumbnail}" alt="${g.title}" class="w-full h-full object-cover" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div class="ish-card-glare absolute inset-0 pointer-events-none opacity-0 mix-blend-screen transition-opacity duration-300 z-10"></div>
            
            <!-- Hover Overlay -->
            <div class="ish-card-overlay absolute inset-0 bg-black/80 backdrop-blur-[1px] flex flex-col justify-between p-2 text-center z-10">
              <div class="flex justify-between items-center">
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500 text-black uppercase font-tech shadow">
                  ${g.platformName}
                </span>
                <span class="text-[9px] text-amber-400 font-bold flex items-center gap-0.5">
                  <i class="fas fa-star text-[8px]"></i> ${g.rating}
                </span>
              </div>

              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 text-black flex items-center justify-center self-center shadow-xl shadow-cyan-500/60 transform group-hover:scale-110 transition-transform">
                <i class="fas fa-play text-sm text-black ml-0.5"></i>
              </div>

              <div>
                <p class="text-[11px] font-bold text-white line-clamp-1 drop-shadow-md">${g.title}</p>
                <span class="text-[9px] text-cyan-300 font-bold flex items-center justify-center gap-1 mt-0.5">
                  <i class="fas fa-gamepad"></i> กดเพื่อเล่นเลย
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Left rail
    for (let i = 0; i < cardsPerRail; i++) {
      const g = streamGames[(i + 4) % streamGames.length];
      const delay = -(i * speed / cardsPerRail).toFixed(2);
      html += `
        <div class="ish-slot tv-focusable"
             tabindex="0"
             style="animation: ish-l ${speed}s linear infinite ${delay}s;"
             title="กดเล่นเกม: ${g.title}"
             onclick="window.retroApp.openPlayerModalById('${g.id}')">
          <div class="ish-card-box group">
            <img src="${g.thumbnail}" alt="${g.title}" class="w-full h-full object-cover" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div class="ish-card-glare absolute inset-0 pointer-events-none opacity-0 mix-blend-screen transition-opacity duration-300 z-10"></div>
            
            <!-- Hover Overlay -->
            <div class="ish-card-overlay absolute inset-0 bg-black/80 backdrop-blur-[1px] flex flex-col justify-between p-2 text-center z-10">
              <div class="flex justify-between items-center">
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500 text-black uppercase font-tech shadow">
                  ${g.platformName}
                </span>
                <span class="text-[9px] text-amber-400 font-bold flex items-center gap-0.5">
                  <i class="fas fa-star text-[8px]"></i> ${g.rating}
                </span>
              </div>

              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 text-black flex items-center justify-center self-center shadow-xl shadow-cyan-500/60 transform group-hover:scale-110 transition-transform">
                <i class="fas fa-play text-sm text-black ml-0.5"></i>
              </div>

              <div>
                <p class="text-[11px] font-bold text-white line-clamp-1 drop-shadow-md">${g.title}</p>
                <span class="text-[9px] text-cyan-300 font-bold flex items-center justify-center gap-1 mt-0.5">
                  <i class="fas fa-gamepad"></i> กดเพื่อเล่นเลย
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    root.innerHTML = html;

    if (window.tvNavigation) {
      window.tvNavigation.refreshFocusables();
    }
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
        <div class="col-span-full py-20 text-center text-gray-400 space-y-3">
          <i class="fas fa-layer-group text-5xl mb-2 text-cyan-400 opacity-60"></i>
          <p class="text-lg font-bold text-slate-200">คลังเกมว่างเปล่า (ล้างข้อมูลเกมออกทั้งหมดแล้ว)</p>
          <p class="text-sm text-gray-500">พร้อมสำหรับการเพิ่มรายชื่อเกมใหม่ หรือเปิดเล่นไฟล์ ROM ส่วนตัวได้ทันที</p>
        </div>
      `;
      return;
    }

    const toRender = filtered.slice(0, this.displayLimit);
    const hasMore = filtered.length > this.displayLimit;

    grid.innerHTML = toRender.map((game) => {
      const isFav = this.favorites.includes(game.id);

      return `
        <div class="interactive-game-card tv-focusable group relative bg-[#131b2e] rounded-xl overflow-hidden border border-slate-800/80 hover:border-cyan-500/80 transition-all duration-300 flex flex-col cursor-pointer"
             tabindex="0"
             onclick="window.retroApp.openPlayerModalById('${game.id}')">
          
          <!-- Image Container with 3D Depth -->
          <div class="game-cover-container bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
            <img src="${game.thumbnail}" alt="${game.title}" class="game-cover-img" loading="lazy" onerror="this.onerror=null; this.classList.add('hidden');" />
            
            <div class="absolute inset-0 bg-gradient-to-t from-[#131b2e] via-transparent to-black/40 opacity-70"></div>
            
            <!-- Dynamic Glare Light Reflection -->
            <div class="game-card-glare"></div>

            <!-- Platform Badge -->
            <div class="absolute top-2.5 left-2.5 z-10">
              <span class="text-[10px] font-bold px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-cyan-400 border border-cyan-500/50 uppercase tracking-wider font-tech shadow-md">
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
            <div class="absolute inset-0 bg-cyan-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
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
    // Platform tabs
    document.querySelectorAll(".platform-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".platform-tab-btn").forEach(b => {
          b.classList.remove("bg-cyan-500", "text-black", "border-cyan-400", "shadow-md", "shadow-cyan-500/20");
          b.classList.add("bg-slate-900/80", "text-gray-300", "border-slate-800");
        });

        const platform = btn.dataset.platform;

        btn.classList.remove("bg-slate-900/80", "text-gray-300", "border-slate-800");
        btn.classList.add("bg-cyan-500", "text-black", "border-cyan-400", "shadow-md", "shadow-cyan-500/20");
        
        this.isOnlineArchiveMode = false;
        this.currentPlatform = platform;
        this.displayLimit = 60;
        this.renderGames();
      });
    });

    // Search Input (Real-time live search)
    const searchInputs = [
      document.getElementById("search-input"),
      document.querySelector("input[placeholder*='ค้นหา']")
    ].filter(Boolean);

    searchInputs.forEach(input => {
      input.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.displayLimit = 60;
        this.renderGames();
      });
    });

    // Close Player Modal Events
    const closeBtn = document.getElementById("close-player-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.closePlayerModal());

    const playerModal = document.getElementById("player-modal");
    if (playerModal) {
      playerModal.addEventListener("click", (e) => {
        if (e.target === playerModal) {
          this.closePlayerModal();
        }
      });
    }

    // Fullscreen Toggle
    const fsBtn = document.getElementById("fullscreen-btn");
    if (fsBtn) fsBtn.addEventListener("click", () => window.retroEmulator.toggleFullscreen());

    // CRT Toggle
    const crtBtn = document.getElementById("crt-toggle-btn");
    if (crtBtn) crtBtn.addEventListener("click", () => window.retroEmulator.toggleCrt());

    // Custom ROM Upload Modal
    const openUploadBtn = document.getElementById("open-upload-btn");
    const closeUploadBtn = document.getElementById("close-upload-btn");
    const uploadModal = document.getElementById("upload-modal");

    if (openUploadBtn && uploadModal) {
      openUploadBtn.addEventListener("click", () => uploadModal.classList.remove("hidden"));
    }
    if (closeUploadBtn && uploadModal) {
      closeUploadBtn.addEventListener("click", () => uploadModal.classList.add("hidden"));
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

  /**
   * Bind interactive 3D mousemove tilt & parallax image motion
   * When cursor moves over a game card, card tilts and image moves dynamically!
   */
  initCardMotionEffects() {
    // 1. Grid Cards Motion (Event Delegation on #games-grid)
    const grid = document.getElementById("games-grid");
    if (grid) {
      grid.addEventListener("mousemove", (e) => {
        const card = e.target.closest(".interactive-game-card");
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const tiltX = ((y - centerY) / centerY) * -12;
        const tiltY = ((x - centerX) / centerX) * 12;

        card.style.transform = `perspective(800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-8px) scale3d(1.04, 1.04, 1.04)`;

        const img = card.querySelector(".game-cover-img");
        if (img) {
          img.classList.add("is-tracking");
          const shiftX = ((x - centerX) / centerX) * -10;
          const shiftY = ((y - centerY) / centerY) * -10;
          const rotateAngle = ((x - centerX) / centerX) * 1.5;
          img.style.transform = `scale(1.15) translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 15px) rotate(${rotateAngle.toFixed(1)}deg)`;
        }

        const glare = card.querySelector(".game-card-glare");
        if (glare) {
          const px = (x / rect.width) * 100;
          const py = (y / rect.height) * 100;
          glare.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(0, 240, 255, 0.45) 0%, rgba(255, 255, 255, 0.12) 25%, transparent 65%)`;
          glare.style.opacity = "1";
        }
      });

      const resetCard = (card) => {
        card.style.transform = "";
        const img = card.querySelector(".game-cover-img");
        if (img) {
          img.classList.remove("is-tracking");
          img.style.transform = "";
        }
        const glare = card.querySelector(".game-card-glare");
        if (glare) {
          glare.style.opacity = "0";
        }
      };

      grid.addEventListener("mouseout", (e) => {
        const card = e.target.closest(".interactive-game-card");
        if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
          resetCard(card);
        }
      });
    }

    // 2. Hero Stream Cards Motion (Event Delegation on #image-stream-root)
    const heroRoot = document.getElementById("image-stream-root");
    if (heroRoot) {
      heroRoot.addEventListener("mousemove", (e) => {
        const box = e.target.closest(".ish-card-box");
        if (!box) return;

        const rect = box.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const tiltX = ((y - centerY) / centerY) * -14;
        const tiltY = ((x - centerX) / centerX) * 14;

        box.style.transform = `perspective(600px) scale(1.45) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;

        const img = box.querySelector("img");
        if (img) {
          img.classList.add("is-tracking");
          const shiftX = ((x - centerX) / centerX) * -12;
          const shiftY = ((y - centerY) / centerY) * -12;
          const rotateAngle = ((x - centerX) / centerX) * 2;
          img.style.transform = `scale(1.18) translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0) rotate(${rotateAngle.toFixed(1)}deg)`;
        }

        const glare = box.querySelector(".ish-card-glare");
        if (glare) {
          const px = (x / rect.width) * 100;
          const py = (y / rect.height) * 100;
          glare.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(0, 240, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 25%, transparent 65%)`;
          glare.style.opacity = "1";
        }
      });

      heroRoot.addEventListener("mouseout", (e) => {
        const box = e.target.closest(".ish-card-box");
        if (box && (!e.relatedTarget || !box.contains(e.relatedTarget))) {
          box.style.transform = "";
          const img = box.querySelector("img");
          if (img) {
            img.classList.remove("is-tracking");
            img.style.transform = "";
          }
          const glare = box.querySelector(".ish-card-glare");
          if (glare) glare.style.opacity = "0";
        }
      });
    }
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

/* =========================================================
   HARE PUBLISHING WORD SEARCH ENGINE
   GitHub/jsDelivr hosted engine file
   Updated: 2026-05-19 v1.1 — Help modal + shared mobile tool/stat alignment

   Suggested filename:
   hare-word-search-engine.js

   Expected page setup:
   - A container with id="hp-wordsearch-container"
   - A puzzle data object: window.HareWordSearchData
     OR a JSON block with id="hp-wordsearch-data"
   - This engine loaded after the puzzle data block

   Data format:
   window.HareWordSearchData = {
     puzzleId: "57",
     puzzleDate: "2026-05-14",
     title: "Word Search #57",
     grid: ["ABC...", "DEF..."],
     words: ["WORD", "PHRASE"],
     placements: [{ word:"WORD", row:0, col:0, dr:0, dc:1 }],
     morePuzzlesUrl: "https://harepublishing.com/online-puzzles",
     shopUrl: "https://harepublishing.com/shop"
   };

   Uses shared CSS foundation + Word Search CSS.
   ========================================================= */

window.HareWordSearchEngine = {
  init({
    containerId = "hp-wordsearch-container",
    dataId = "hp-wordsearch-data",
    dataObject = window.HareWordSearchData
  } = {}) {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error("HareWordSearchEngine: puzzle container missing.");
      return;
    }

    if (container.dataset.hpWordsearchMounted === "true") {
      console.warn("HareWordSearchEngine: this container has already been mounted.");
      return;
    }

    container.dataset.hpWordsearchMounted = "true";
    container.setAttribute("tabindex", "0");

    const mount = container.querySelector(".hp-mount");
    if (!mount) {
      console.error("HareWordSearchEngine: .hp-mount element missing inside puzzle container.");
      return;
    }

    const yearEl = document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const dataEl = document.getElementById(dataId);
    let pageData = dataObject || null;

    if (!pageData && dataEl) {
      try {
        pageData = JSON.parse(dataEl.textContent || "{}");
      } catch (err) {
        console.error("HareWordSearchEngine: puzzle data block contains invalid JSON.", err);
      }
    }

    const MORE_PUZZLES_URL = pageData?.morePuzzlesUrl || "https://harepublishing.com/online-puzzles";
    const SHOP_URL = pageData?.shopUrl || "https://harepublishing.com/shop";

    function escapeHtml(str) {
      return String(str).replace(/[&<>\"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '\"': "&quot;",
        "'": "&#39;"
      }[s]));
    }

    function cleanWord(value) {
      return String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
    }

    function formatPuzzleDate(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";

      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return d.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      }

      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return raw;

      return d.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }

    function showConfigError(message) {
      mount.innerHTML = `<p style="color:#ED1B24;text-align:center;font-weight:800;">${escapeHtml(message)}</p>`;
    }

    function canonicalPathKey(path) {
      const forward = path.map(p => `${p.r},${p.c}`).join("|");
      const backward = [...path].reverse().map(p => `${p.r},${p.c}`).join("|");
      return forward < backward ? forward : backward;
    }

    function getPathForPlacement(p) {
      const word = cleanWord(p.word);
      const path = [];
      for (let i = 0; i < word.length; i++) {
        path.push({
          r: Number(p.row) + Number(p.dr) * i,
          c: Number(p.col) + Number(p.dc) * i
        });
      }
      return path;
    }

    if (!pageData) {
      showConfigError("Word Search puzzle data is missing. Add window.HareWordSearchData before loading the engine.");
      return;
    }

    const puzzleId = String(pageData.puzzleId || "").trim();
    const puzzleTitle = String(pageData.title || (puzzleId ? `Word Search #${puzzleId}` : "Word Search")).trim();
    const puzzleDate = formatPuzzleDate(pageData.puzzleDate || pageData.date || "");
    const grid = Array.isArray(pageData.grid) ? pageData.grid.map(row => String(row || "").toUpperCase().replace(/[^A-Z]/g, "")) : [];
    const gridSize = grid.length;
    const placementsRaw = Array.isArray(pageData.placements) ? pageData.placements : [];

    if (!puzzleId) {
      showConfigError("Word Search puzzleId is missing.");
      return;
    }

    if (!gridSize || grid.some(row => row.length !== gridSize)) {
      showConfigError("Word Search grid must be a square array of equal-length letter rows.");
      return;
    }

    if (!placementsRaw.length) {
      showConfigError("Word Search placements are missing.");
      return;
    }

    const board = grid.map(row => row.split(""));
    const placements = placementsRaw.map(p => {
      const word = cleanWord(p.word);
      const row = Number(p.row);
      const col = Number(p.col);
      const dr = Number(p.dr);
      const dc = Number(p.dc);
      const path = getPathForPlacement({ word, row, col, dr, dc });
      return { word, row, col, dr, dc, path, pathKey: canonicalPathKey(path) };
    }).filter(p => p.word && p.path.every(pos => (
      pos.r >= 0 && pos.r < gridSize && pos.c >= 0 && pos.c < gridSize
    )));

    const normalizedWords = placements.map(p => p.word);
    const placementMap = new Map();
    placements.forEach(p => placementMap.set(p.pathKey, p));

    if (!placements.length) {
      showConfigError("Word Search placements are invalid or outside the grid.");
      return;
    }

    const STORAGE_KEY = `hp_ws_${puzzleId}`;

    // =========================================================
    // SCHEMA
    // =========================================================
    (function injectSchema() {
      const existing = document.getElementById("hp-ws-schema");
      if (existing) existing.remove();

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": puzzleTitle,
        "description": `Play and solve ${puzzleTitle} by Hare Publishing. Find hidden words in a letter grid, save your progress automatically, and reveal the answers whenever you like.`,
        "genre": "Word Puzzle",
        "url": window.location.href,
        "inLanguage": "en",
        "audience": { "@type": "PeopleAudience", "suggestedMinAge": "8" },
        "numberOfPlayers": "1",
        "copyrightYear": String(new Date().getFullYear()),
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://harepublishing.com/"
        }
      };

      const script = document.createElement("script");
      script.id = "hp-ws-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    })();

    // =========================================================
    // ANALYTICS / STATS HOOKS
    // =========================================================
    function recordPuzzleEvent(eventName, extra = {}) {
      const payload = {
        puzzleType: "word-search",
        puzzleId,
        puzzleTitle,
        puzzleDate: pageData.puzzleDate || pageData.date || "",
        eventName,
        event: eventName,
        source: "hare-word-search-engine",
        timestamp: new Date().toISOString(),
        ...extra
      };

      try {
        window.dispatchEvent(new CustomEvent("hare:puzzle-event", { detail: payload }));
      } catch {}

      try {
        const analytics = window.HarePuzzleAnalytics;
        if (!analytics) return;

        if (typeof analytics.recordEvent === "function") analytics.recordEvent(payload);
        else if (typeof analytics.trackEvent === "function") analytics.trackEvent(payload);
        else if (typeof analytics.logEvent === "function") analytics.logEvent(payload);
        else if (typeof analytics.recordPuzzleEvent === "function") analytics.recordPuzzleEvent(payload);
        else if (typeof analytics.trackPuzzleEvent === "function") analytics.trackPuzzleEvent(payload);
      } catch {}
    }

    // =========================================================
    // STATE
    // =========================================================
    function defaultState() {
      return {
        foundWords: [],
        foundPathKeys: [],
        revealed: false,
        solved: false,
        overlaySeen: false,
        anchor: null,
        startedAt: "",
        solvedAt: "",
        revealedAt: ""
      };
    }

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
      } catch {
        return defaultState();
      }
    }

    const state = loadState();

    function markStarted() {
      if (!state.startedAt) {
        state.startedAt = new Date().toISOString();
        saveState();
        recordPuzzleEvent("started");
      }
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {}
    }

    let previewPath = [];

    function isFinished() {
      return state.solved || state.revealed;
    }

    function getFoundSet() {
      return new Set(state.foundWords);
    }

    function getFoundPathKeySet() {
      return new Set(state.foundPathKeys);
    }

    function allWordsFound() {
      return state.foundWords.length === normalizedWords.length;
    }

    function isStraightLine(start, end) {
      const dr = end.r - start.r;
      const dc = end.c - start.c;
      return dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
    }

    function getPathBetween(start, end) {
      if (!start || !end) return [];
      if (!isStraightLine(start, end)) return [];

      const dr = end.r - start.r;
      const dc = end.c - start.c;
      const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
      const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      const path = [];

      for (let i = 0; i <= steps; i++) {
        path.push({ r: start.r + stepR * i, c: start.c + stepC * i });
      }

      return path;
    }

    function trySelectPath(path) {
      if (!path.length) return false;

      markStarted();

      const pathKey = canonicalPathKey(path);
      const placement = placementMap.get(pathKey);

      if (!placement) return false;
      if (state.foundWords.includes(placement.word)) return false;

      state.foundWords.push(placement.word);
      state.foundPathKeys.push(pathKey);
      state.anchor = null;
      previewPath = [];
      recordPuzzleEvent("word_found", { word: placement.word, wordsFound: state.foundWords.length, totalWords: normalizedWords.length });

      if (allWordsFound()) {
        state.solved = true;
        state.revealed = false;
        state.solvedAt = new Date().toISOString();
        state.overlaySeen = false;
        recordPuzzleEvent("completed", { wordsFound: state.foundWords.length, totalWords: normalizedWords.length, startedAt: state.startedAt, solvedAt: state.solvedAt });
      }

      saveState();
      render();

      if (state.solved) showOverlay();
      return true;
    }

    function handleCellClick(r, c) {
      if (isFinished()) return;
      markStarted();

      const clicked = { r, c };

      if (!state.anchor) {
        state.anchor = clicked;
        previewPath = [];
        saveState();
        renderStatus();
        renderBoardOnly();
        return;
      }

      if (state.anchor.r === r && state.anchor.c === c) {
        state.anchor = null;
        previewPath = [];
        saveState();
        renderStatus();
        renderBoardOnly();
        return;
      }

      const path = getPathBetween(state.anchor, clicked);
      if (!path.length || !trySelectPath(path)) {
        state.anchor = clicked;
        previewPath = [];
        saveState();
        renderStatus();
        renderBoardOnly();
      }
    }

    // =========================================================
    // ACTIONS
    // =========================================================
    function clearAnchor() {
      if (isFinished()) return;
      state.anchor = null;
      previewPath = [];
      saveState();
      renderStatus();
      renderBoardOnly();
    }

    function resetPuzzle() {
      if (!confirm("Reset this word search and clear all progress?")) return;

      state.foundWords = [];
      state.foundPathKeys = [];
      state.revealed = false;
      state.solved = false;
      state.overlaySeen = false;
      state.anchor = null;
      state.startedAt = "";
      state.solvedAt = "";
      state.revealedAt = "";
      previewPath = [];

      saveState();
      recordPuzzleEvent("reset");
      hideOverlay(false);
      render();
    }

    function revealAnswers() {
      if (isFinished()) return;
      markStarted();

      const ok = confirm("Reveal all answers? This will end the puzzle.");
      if (!ok) return;

      state.foundWords = [...normalizedWords];
      state.foundPathKeys = placements.map(p => p.pathKey);
      state.revealed = true;
      state.solved = false;
      state.solvedAt = "";
      state.revealedAt = new Date().toISOString();
      state.overlaySeen = false;
      state.anchor = null;
      previewPath = [];

      saveState();
      recordPuzzleEvent("revealed", { wordsFound: state.foundWords.length, totalWords: normalizedWords.length, startedAt: state.startedAt, revealedAt: state.revealedAt });
      render();
      showOverlay();
    }

    // =========================================================
    // RENDER HELPERS
    // =========================================================
    function formatFoundCount() {
      return `${state.foundWords.length}/${normalizedWords.length}`;
    }

    function progressPercent() {
      return normalizedWords.length ? (state.foundWords.length / normalizedWords.length) * 100 : 0;
    }

    function statusMessage() {
      if (state.solved) return "Word search solved! 🎉";
      if (state.revealed) return "Answers revealed.";
      if (state.anchor) return `Start selected: Row ${state.anchor.r + 1}, Col ${state.anchor.c + 1}. Now choose the last letter.`;
      return "Click the first letter, then click the last letter of a hidden word.";
    }

    function renderStats() {
      const foundValue = mount.querySelector("#hp-ws-found-ratio");
      const remainingValue = mount.querySelector("#hp-ws-remaining");
      const sizeValue = mount.querySelector("#hp-ws-size");
      const progressFill = mount.querySelector("#hp-ws-progress-fill");

      if (foundValue) foundValue.textContent = formatFoundCount();
      if (remainingValue) remainingValue.textContent = String(normalizedWords.length - state.foundWords.length);
      if (sizeValue) sizeValue.textContent = `${gridSize}×${gridSize}`;
      if (progressFill) progressFill.style.width = `${progressPercent()}%`;
    }

    function renderStatus() {
      const el = mount.querySelector("#hp-ws-status-msg");
      if (el) el.textContent = statusMessage();
    }

    function getBoardCellClass(r, c) {
      const foundPathSet = getFoundPathKeySet();
      const classes = ["hp-ws-cell"];

      const isAnchor = state.anchor && state.anchor.r === r && state.anchor.c === c;
      if (isAnchor && !isFinished()) classes.push("is-anchor");

      const isPreview = previewPath.some(p => p.r === r && p.c === c);
      if (isPreview && !isFinished()) classes.push("is-preview");

      let foundHere = false;
      let revealedOnlyHere = false;

      placements.forEach(p => {
        const inPath = p.path.some(pos => pos.r === r && pos.c === c);
        if (!inPath) return;

        if (foundPathSet.has(p.pathKey)) {
          if (state.revealed && !state.solved) revealedOnlyHere = true;
          else foundHere = true;
        }
      });

      if (foundHere) classes.push("is-found");
      if (revealedOnlyHere) classes.push("is-revealed");

      return classes.join(" ");
    }

    function renderBoardOnly() {
      const boardEl = mount.querySelector("#hp-ws-board");
      if (!boardEl) return;

      boardEl.innerHTML = board.map((row, r) =>
        row.map((letter, c) => `
          <button
            type="button"
            class="${getBoardCellClass(r, c)}"
            data-r="${r}"
            data-c="${c}"
            aria-label="Row ${r + 1}, Column ${c + 1}, Letter ${letter}">
            ${letter}
          </button>
        `).join("")
      ).join("");

      boardEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

      boardEl.querySelectorAll("[data-r][data-c]").forEach(btn => {
        btn.addEventListener("click", () => {
          const r = parseInt(btn.getAttribute("data-r"), 10);
          const c = parseInt(btn.getAttribute("data-c"), 10);
          handleCellClick(r, c);
        });
      });
    }

    function renderWordListOnly() {
      const listEl = mount.querySelector("#hp-ws-word-list");
      if (!listEl) return;

      const foundSet = getFoundSet();

      listEl.innerHTML = normalizedWords
        .slice()
        .sort((a, b) => a.localeCompare(b))
        .map(word => {
          const found = foundSet.has(word);
          const cls = found
            ? (state.revealed && !state.solved ? "hp-ws-word-item is-revealed" : "hp-ws-word-item is-found")
            : "hp-ws-word-item";
          const check = found ? `<span class="hp-ws-word-check" aria-hidden="true">✓</span>` : "";
          return `<div class="${cls}"><span class="hp-ws-word-text">${escapeHtml(word)}</span>${check}</div>`;
        })
        .join("");
    }

    function renderOverlayContent() {
      const badgeIdEl = mount.querySelector("#hp-ws-badge-id");
      const badgeMetaEl = mount.querySelector("#hp-ws-badge-meta");
      const overlayIconEl = mount.querySelector("#hp-ws-overlay-icon");
      const overlayTitleEl = mount.querySelector("#hp-ws-overlay-title");
      const overlayTextEl = mount.querySelector("#hp-ws-overlay-text");

      if (!badgeIdEl || !badgeMetaEl || !overlayIconEl || !overlayTitleEl || !overlayTextEl) return;

      badgeIdEl.textContent = puzzleTitle;

      if (state.solved) {
        overlayIconEl.textContent = "🎉 ";
        overlayTitleEl.textContent = "You Solved the Word Search!";
        badgeMetaEl.textContent = `Found: ${state.foundWords.length}/${normalizedWords.length}`;
        overlayTextEl.textContent = "Congratulations — you found every hidden word. Explore more online puzzles or browse puzzle books for offline fun.";
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "📘 ";
        overlayTitleEl.textContent = "Answers Revealed";
        badgeMetaEl.textContent = `Found: ${state.foundWords.length}/${normalizedWords.length}`;
        overlayTextEl.textContent = "Here are all the hidden words for this puzzle. Explore more online puzzles or browse puzzle books for offline fun.";
      }
    }

    function showOverlay() {
      const overlayEl = mount.querySelector("#hp-ws-overlay");
      if (!overlayEl) return;

      renderOverlayContent();
      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");
      state.overlaySeen = false;
      saveState();
    }

    function hideOverlay(save = true) {
      const overlayEl = mount.querySelector("#hp-ws-overlay");
      if (!overlayEl) return;

      overlayEl.classList.remove("on");
      overlayEl.setAttribute("aria-hidden", "true");
      state.overlaySeen = true;
      if (save) saveState();
    }

    function showHelpModal() {
      const modalEl = mount.querySelector("#hp-ws-help-modal");
      if (!modalEl) return;

      modalEl.classList.add("on");
      modalEl.setAttribute("aria-hidden", "false");
    }

    function hideHelpModal() {
      const modalEl = mount.querySelector("#hp-ws-help-modal");
      if (!modalEl) return;

      modalEl.classList.remove("on");
      modalEl.setAttribute("aria-hidden", "true");
    }

    function render() {
      mount.innerHTML = `
        ${puzzleDate ? `<div class="hp-puzzle-date">${escapeHtml(puzzleDate)}</div>` : ""}

        <div class="hp-ws-top-panel">
          <div class="hp-ws-panel">
            <div class="hp-ws-stats">
              <div class="hp-ws-stat">
                <span class="hp-ws-stat-value" id="hp-ws-found-ratio">0/0</span>
                <span class="hp-ws-stat-label">Words Found</span>
              </div>

              <div class="hp-ws-stat">
                <span class="hp-ws-stat-value" id="hp-ws-remaining">0</span>
                <span class="hp-ws-stat-label">Words Left</span>
              </div>

              <div class="hp-ws-stat">
                <span class="hp-ws-stat-value" id="hp-ws-size">0×0</span>
                <span class="hp-ws-stat-label">Grid Size</span>
              </div>
            </div>

            <div class="hp-ws-progress">
              <div class="hp-ws-progress-fill" id="hp-ws-progress-fill"></div>
            </div>
          </div>
        </div>

        <div class="hp-ws-layout">
          <div class="hp-ws-col-left">
            <div class="hp-ws-panel">
              <div class="hp-ws-status">
                <span class="hp-ws-status-msg" id="hp-ws-status-msg">Loading puzzle...</span>
              </div>

              <div class="hp-ws-board-wrap">
                <div class="hp-ws-board" id="hp-ws-board" role="grid" aria-label="Word search board"></div>
              </div>

              <div class="hp-puzzle-mobile-tools" aria-label="Word Search puzzle controls">
                <button type="button" class="hp-tool-btn help-info" data-a="open-help-modal">Help</button>
                <button type="button" class="hp-tool-btn clear-tool" data-a="clear-selection">Clear</button>
                <button type="button" class="hp-tool-btn danger" data-a="reset-puzzle">Reset</button>
                <button type="button" class="hp-tool-btn reveal" data-a="reveal-answers">Reveal</button>
              </div>

              <div class="hp-ws-actions">
                <button type="button" class="hp-ws-btn" id="hp-ws-clear-anchor">Clear Selection</button>
                <button type="button" class="hp-ws-btn danger" id="hp-ws-reset">Reset Puzzle</button>
                <button type="button" class="hp-ws-btn reveal" id="hp-ws-reveal" style="grid-column: span 2;">Reveal Answers</button>
              </div>
            </div>
          </div>

          <div class="hp-ws-col-right">
            <div class="hp-ws-panel">
              <div class="hp-puzzle-tools" aria-label="Word Search puzzle controls">
                <button type="button" class="hp-tool-btn help-info" data-a="open-help-modal">Help</button>
                <button type="button" class="hp-tool-btn clear-tool" data-a="clear-selection">Clear</button>
                <button type="button" class="hp-tool-btn danger" data-a="reset-puzzle">Reset</button>
              </div>


              <div class="hp-ws-words-header">
                <h3>Find These Words</h3>
              </div>
              <div class="hp-ws-word-list" id="hp-ws-word-list"></div>
            </div>
          </div>
        </div>

        <div class="hp-overlay" id="hp-ws-overlay" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Word search result">
            <div id="hp-ws-overlay-icon" style="font-size:28px; line-height:1;">🎉 </div>
            <h3 id="hp-ws-overlay-title">You Solved the Word Search!</h3>

            <div class="hp-badges">
              <span class="hp-badge" id="hp-ws-badge-id"></span>
              <span class="hp-badge" id="hp-ws-badge-meta"></span>
            </div>

            <p id="hp-ws-overlay-text">Congratulations — you found every hidden word. Explore more online puzzles or browse puzzle books for offline fun.</p>

            <div class="hp-modal-actions">
              <a class="hp-link-btn secondary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
              <a class="hp-link-btn primary" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>
              <button class="hp-link-btn" data-a="share">Share</button>
              <button class="hp-link-btn" data-a="close-overlay">Back to Puzzle</button>
              <button class="hp-link-btn full danger" data-a="reset-puzzle">Reset Puzzle</button>
            </div>

            <small>Hare Publishing • Word Search</small>
          </div>
        </div>


        <div class="hp-overlay hp-ws-help-modal" id="hp-ws-help-modal" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Word Search">
            <h3>Help</h3>

            <div class="hp-help-modal-content">
              <span class="hp-help-line">Click the <strong>first letter</strong> of a hidden word, then click the <strong>last letter</strong>.</span>
              <span class="hp-help-line">Words may run <strong>horizontally</strong>, <strong>vertically</strong>, or <strong>diagonally</strong>.</span>
              <span class="hp-help-line">Words may also appear <strong>backward</strong>.</span>
              <span class="hp-help-line"><strong>Clear</strong> removes the current start-letter selection.</span>
              <span class="hp-help-line"><strong>Reveal Answers</strong> ends the puzzle and shows every hidden word.</span>
            </div>

            <div class="hp-modal-actions">
              <button class="hp-link-btn neutral full" data-a="close-help-modal">Back to Puzzle</button>
            </div>

            <small>Hare Publishing • Word Search</small>
          </div>
        </div>
      `;

      renderStats();
      renderStatus();
      renderBoardOnly();
      renderWordListOnly();
      bindEvents();

      if ((state.solved || state.revealed) && !state.overlaySeen) showOverlay();
    }

    function bindEvents() {
      const clearBtn = mount.querySelector("#hp-ws-clear-anchor");
      const resetBtn = mount.querySelector("#hp-ws-reset");
      const revealBtn = mount.querySelector("#hp-ws-reveal");
      const overlayEl = mount.querySelector("#hp-ws-overlay");

      if (clearBtn) clearBtn.addEventListener("click", clearAnchor);
      if (resetBtn) resetBtn.addEventListener("click", resetPuzzle);
      if (revealBtn) revealBtn.addEventListener("click", revealAnswers);

      mount.querySelectorAll("[data-a]").forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.getAttribute("data-a");

          if (action === "close-overlay") {
            hideOverlay();
            return;
          }

          if (action === "reset-puzzle") {
            resetPuzzle();
            return;
          }

          if (action === "open-help-modal") {
            showHelpModal();
            return;
          }

          if (action === "close-help-modal") {
            hideHelpModal();
            return;
          }

          if (action === "clear-selection") {
            clearAnchor();
            return;
          }

          if (action === "reveal-answers") {
            revealAnswers();
            return;
          }

          if (action === "share") {
            const shareData = {
              title: `${puzzleTitle} — Hare Publishing`,
              text: state.solved
                ? `I solved ${puzzleTitle} from Hare Publishing!`
                : state.revealed
                  ? `I revealed the answers for ${puzzleTitle} at Hare Publishing.`
                  : `I’m playing ${puzzleTitle} from Hare Publishing!`,
              url: window.location.href
            };

            if (navigator.share) {
              navigator.share(shareData).catch(() => {});
            } else {
              try {
                navigator.clipboard.writeText(window.location.href);
                const statusEl = mount.querySelector("#hp-ws-status-msg");
                if (statusEl) statusEl.textContent = "Link copied! 📋";
              } catch {
                const statusEl = mount.querySelector("#hp-ws-status-msg");
                if (statusEl) statusEl.textContent = "Copy the link from your address bar 🙂";
              }
            }
          }
        });
      });

      if (overlayEl) {
        overlayEl.addEventListener("click", e => {
          if (e.target === overlayEl) hideOverlay();
        });
      }

      const helpModalEl = mount.querySelector("#hp-ws-help-modal");
      if (helpModalEl) {
        helpModalEl.addEventListener("click", e => {
          if (e.target === helpModalEl) hideHelpModal();
        });
      }
    }

    container.addEventListener("keydown", e => {
      const overlayEl = mount.querySelector("#hp-ws-overlay");
      if (overlayEl && overlayEl.classList.contains("on")) {
        if (e.key === "Escape") hideOverlay();
        return;
      }

      const helpModalEl = mount.querySelector("#hp-ws-help-modal");
      if (helpModalEl && helpModalEl.classList.contains("on")) {
        if (e.key === "Escape") hideHelpModal();
        return;
      }

      if (e.key === "Escape") clearAnchor();
    });

    if (state.solved && state.foundWords.length !== normalizedWords.length) {
      state.foundWords = [...normalizedWords];
      state.foundPathKeys = placements.map(p => p.pathKey);
      saveState();
    }

    if (state.revealed && state.foundWords.length !== normalizedWords.length) {
      state.foundWords = [...normalizedWords];
      state.foundPathKeys = placements.map(p => p.pathKey);
      saveState();
    }

    recordPuzzleEvent("loaded", { wordsFound: state.foundWords.length, totalWords: normalizedWords.length });
    render();
  }
};

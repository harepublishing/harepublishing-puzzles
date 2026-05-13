window.HareKrissKrossEngine = {
  init({ containerId = "hp-krisskross-container", dataObject } = {}) {
    const BRAND_RED = "#ED1B24";

    const container = document.getElementById(containerId);
    if (!container) return;

    const mount = container.querySelector(".hp-mount") || container;
    if (!mount) return;

    const yearEl = container.querySelector("#hp-year") || document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const data = dataObject || window.HareKrissKrossData;

    if (!data) {
      mount.innerHTML = `
        <div class="hp-kk-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
          <strong>Configuration Error:</strong> Kriss Kross puzzle data is missing.
        </div>
      `;
      return;
    }

    const puzzleId = String(data.puzzleId || "1");
    const puzzleTitle = data.puzzleTitle || `Kriss Kross #${puzzleId}`;
    const puzzleDate = formatPuzzleDate(data.puzzleDate || "");
    const placements = Array.isArray(data.placements) ? data.placements : [];

    const MORE_PUZZLES_URL = data.morePuzzlesUrl || "https://www.harepublishing.com/online-puzzles";
    const SHOP_URL = data.shopUrl || "https://www.harepublishing.com/shop";
    const STORAGE_KEY = data.storageKey || `hp_kk_${puzzleId}`;

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[s]));
    }

    function normalizeWord(word) {
      return String(word || "").toUpperCase().replace(/[^A-Z]/g, "");
    }

    function cellKey(r, c) {
      return `${r}-${c}`;
    }

    function formatPuzzleDate(dateString) {
      if (!dateString) return "";

      const parts = String(dateString).split("-");
      if (parts.length !== 3) return String(dateString);

      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);

      const date = new Date(year, month, day);

      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }

    // =========================================================
    // SCHEMA
    // =========================================================

    (() => {
      const existing = document.getElementById("hp-kk-schema");
      if (existing) existing.remove();

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": puzzleTitle,
        "description": `Play and solve ${puzzleTitle} by Hare Publishing. Fit all of the words into the crossing grid, save your progress automatically, and reveal the answers whenever you like.`,
        "genre": "Word Puzzle",
        "url": window.location.href,
        "inLanguage": "en",
        "audience": {
          "@type": "PeopleAudience",
          "suggestedMinAge": "8"
        },
        "numberOfPlayers": "1",
        "copyrightYear": String(new Date().getFullYear()),
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://www.harepublishing.com/"
        }
      };

      const script = document.createElement("script");
      script.id = "hp-kk-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    })();

    const normalizedPlacements = placements.map((p, idx) => ({
      id: `slot-${idx + 1}`,
      word: normalizeWord(p.word),
      row: Number(p.row),
      col: Number(p.col),
      dir: p.dir === "down" ? "down" : "across"
    })).filter(p => p.word);

    if (!normalizedPlacements.length) {
      mount.innerHTML = `
        <div class="hp-kk-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
          <strong>Configuration Error:</strong> Add at least one Kriss Kross word placement.
        </div>
      `;
      return;
    }

    const wordSet = new Set();

    for (const p of normalizedPlacements) {
      if (wordSet.has(p.word)) {
        mount.innerHTML = `
          <div class="hp-kk-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
            <strong>Configuration Error:</strong> Each Kriss Kross word must be unique. Duplicate found: ${escapeHtml(p.word)}
          </div>
        `;
        return;
      }
      wordSet.add(p.word);
    }

    let maxRow = 0;
    let maxCol = 0;

    const activeCellMap = new Map();
    const solutionBoard = [];

    function ensureBoardSize(r, c) {
      while (solutionBoard.length <= r) solutionBoard.push([]);
      while (solutionBoard[r].length <= c) solutionBoard[r].push("");
    }

    try {
      normalizedPlacements.forEach(slot => {
        const dr = slot.dir === "down" ? 1 : 0;
        const dc = slot.dir === "across" ? 1 : 0;

        for (let i = 0; i < slot.word.length; i++) {
          const r = slot.row + dr * i;
          const c = slot.col + dc * i;

          maxRow = Math.max(maxRow, r);
          maxCol = Math.max(maxCol, c);

          ensureBoardSize(r, c);

          const existing = solutionBoard[r][c];
          const letter = slot.word[i];

          if (existing && existing !== letter) {
            mount.innerHTML = `
              <div class="hp-kk-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
                <strong>Configuration Error:</strong> Conflicting letters at row ${r}, col ${c}.
              </div>
            `;
            throw new Error("Kriss Kross config conflict");
          }

          solutionBoard[r][c] = letter;
          activeCellMap.set(cellKey(r, c), true);
        }
      });
    } catch {
      return;
    }

    const minRows = Number(data.minRows || data.gridRows || data.minGridSize || 16);
    const minCols = Number(data.minCols || data.gridCols || data.minGridSize || 16);

    const rowCount = Math.max(maxRow + 1, minRows);
    const colCount = Math.max(maxCol + 1, minCols);

    const cellsBySlot = new Map();
    const slotsByCell = new Map();

    normalizedPlacements.forEach(slot => {
      const dr = slot.dir === "down" ? 1 : 0;
      const dc = slot.dir === "across" ? 1 : 0;

      const cells = [];

      for (let i = 0; i < slot.word.length; i++) {
        const cell = {
          r: slot.row + dr * i,
          c: slot.col + dc * i,
          letter: slot.word[i]
        };

        cells.push(cell);

        const key = cellKey(cell.r, cell.c);

        if (!slotsByCell.has(key)) slotsByCell.set(key, []);

        slotsByCell.get(key).push(slot.id);
      }

      cellsBySlot.set(slot.id, cells);
    });

    function defaultState() {
      return {
        assignments: {},
        selectedSlotId: "",
        hintMode: true,
        revealed: false,
        solved: false,
        overlaySeen: false
      };
    }

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed ? { ...defaultState(), ...parsed } : defaultState();
      } catch {
        return defaultState();
      }
    }

    const state = loadState();

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {}
    }

    function render() {
      mount.innerHTML = `
        ${puzzleDate ? `
          <div class="hp-puzzle-date">
            ${escapeHtml(puzzleDate)}
          </div>
        ` : ""}

        <div class="hp-kk-layout">

          <div class="hp-kk-col-left">
            <div class="hp-kk-panel">

              <div class="hp-kk-board-wrap">
                <div class="hp-kk-board" id="hp-kk-board"></div>
              </div>

              <div class="hp-kk-actions">
                <button type="button" class="hp-kk-btn danger" id="hp-kk-reset">
                  Reset Puzzle
                </button>

                <button type="button" class="hp-kk-btn reveal" id="hp-kk-reveal">
                  Reveal Puzzle
                </button>
              </div>

            </div>
          </div>

          <div class="hp-kk-col-right">
            <div class="hp-kk-panel">

              <div class="hp-kk-mobile-toolbar">

                <button
                  type="button"
                  class="hp-kk-mobile-tool"
                  data-a="open-help-modal">
                  Help
                </button>

                <button
                  type="button"
                  class="hp-kk-mobile-tool help${state.hintMode ? " active" : ""}"
                  id="hp-kk-hint-toggle">
                  ${state.hintMode ? "Hint: ON" : "Hint: OFF"}
                </button>

                <button
                  type="button"
                  class="hp-kk-mobile-tool"
                  id="hp-kk-clear-slot">
                  Clear
                </button>

              </div>

              <div class="hp-kk-words-header">
                <h3>Place These Words</h3>
              </div>

              <div class="hp-kk-word-list" id="hp-kk-word-list"></div>

            </div>
          </div>

        </div>

        <div class="hp-overlay hp-kk-help-modal" id="hp-kk-help-modal" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true">
            <h3>How to Play</h3>

            <div class="hp-kk-help hp-kk-help-modal-content">
              <span class="hp-kk-help-line">
                Click a <strong>slot in the grid</strong>, then click a matching word from the list.
              </span>

              <span class="hp-kk-help-line">
                Use the <strong>crossing letters</strong> to help place each word correctly.
              </span>

              <span class="hp-kk-help-line">
                If a square belongs to two words, click it again to <strong>switch direction</strong>.
              </span>

              <span class="hp-kk-help-line">
                <strong>Hint: ON</strong> highlights words matching the selected slot length.
              </span>

              <span class="hp-kk-help-line">
                <strong>Reveal Puzzle</strong> ends the puzzle and shows the completed grid.
              </span>
            </div>

            <div class="hp-modal-actions">
              <button class="hp-link-btn neutral full" data-a="close-help-modal">
                Back to Puzzle
              </button>
            </div>

            <small>Hare Publishing • Kriss Kross</small>
          </div>
        </div>
      `;

      bindEvents();
    }

    function bindEvents() {
      const helpBtn = mount.querySelector('[data-a="open-help-modal"]');
      const closeHelpBtn = mount.querySelector('[data-a="close-help-modal"]');
      const helpModal = mount.querySelector("#hp-kk-help-modal");
      const hintBtn = mount.querySelector("#hp-kk-hint-toggle");

      if (helpBtn) {
        helpBtn.addEventListener("click", () => {
          helpModal.classList.add("on");
          helpModal.setAttribute("aria-hidden", "false");
        });
      }

      if (closeHelpBtn) {
        closeHelpBtn.addEventListener("click", () => {
          helpModal.classList.remove("on");
          helpModal.setAttribute("aria-hidden", "true");
        });
      }

      if (hintBtn) {
        hintBtn.addEventListener("click", () => {
          state.hintMode = !state.hintMode;
          saveState();
          render();
        });
      }

      helpModal?.addEventListener("click", (e) => {
        if (e.target === helpModal) {
          helpModal.classList.remove("on");
          helpModal.setAttribute("aria-hidden", "true");
        }
      });
    }

    render();
  }
};

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
    const puzzleTheme = data.theme || data.puzzleTheme || "";
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

    function areSequentialNeighbors(a, b) {
      const slotIdsA = slotsByCell.get(cellKey(a.r, a.c)) || [];
      const slotIdsB = slotsByCell.get(cellKey(b.r, b.c)) || [];
      const shared = slotIdsA.filter(id => slotIdsB.includes(id));

      return shared.some(slotId => {
        const cells = cellsBySlot.get(slotId) || [];

        for (let i = 1; i < cells.length; i++) {
          const prev = cells[i - 1];
          const curr = cells[i];

          if (
            (prev.r === a.r && prev.c === a.c && curr.r === b.r && curr.c === b.c) ||
            (prev.r === b.r && prev.c === b.c && curr.r === a.r && curr.c === a.c)
          ) {
            return true;
          }
        }

        return false;
      });
    }

    function validateNoTouchingWords() {
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          if (!activeCellMap.has(cellKey(r, c))) continue;

          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr < 0 || nc < 0 || nr >= rowCount || nc >= colCount) continue;
            if (!activeCellMap.has(cellKey(nr, nc))) continue;
            if (areSequentialNeighbors({ r, c }, { r: nr, c: nc })) continue;

            mount.innerHTML = `
              <div class="hp-kk-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
                <strong>Configuration Error:</strong> Words are touching side-by-side at row ${r}, col ${c} and row ${nr}, col ${nc}.
              </div>
            `;
            throw new Error("Kriss Kross touching words config");
          }
        }
      }
    }

    try {
      validateNoTouchingWords();
    } catch {
      return;
    }

    const words = normalizedPlacements.map(s => s.word).sort((a, b) => a.localeCompare(b));

    function defaultState() {
      return {
        assignments: {},
        selectedSlotId: "",
        helpMode: true,
        revealed: false,
        solved: false,
        solvedAt: "",
        revealedAt: "",
        overlaySeen: false
      };
    }

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const merged = parsed ? { ...defaultState(), ...parsed } : defaultState();

        if (typeof merged.solvedAt !== "string") merged.solvedAt = "";
        if (typeof merged.revealedAt !== "string") merged.revealedAt = "";

        return merged;
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

    function isFinished() {
      return state.solved || state.revealed;
    }

    function getWordToSlotMap() {
      const map = new Map();

      Object.entries(state.assignments).forEach(([slotId, word]) => {
        if (word) map.set(word, slotId);
      });

      return map;
    }

    function buildCurrentBoard() {
      const board = Array.from({ length: rowCount }, () => Array(colCount).fill(""));

      Object.entries(state.assignments).forEach(([slotId, word]) => {
        if (!word) return;

        const cells = cellsBySlot.get(slotId) || [];

        cells.forEach((cell, idx) => {
          board[cell.r][cell.c] = word[idx] || "";
        });
      });

      return board;
    }

    function slotIsCorrect(slotId) {
      const slot = normalizedPlacements.find(s => s.id === slotId);
      if (!slot) return false;
      return state.assignments[slotId] === slot.word;
    }

    function correctCount() {
      return normalizedPlacements.filter(slot => slotIsCorrect(slot.id)).length;
    }

    function placedCount() {
      return Object.values(state.assignments).filter(Boolean).length;
    }

    function progressPercent() {
      return normalizedPlacements.length
        ? (correctCount() / normalizedPlacements.length) * 100
        : 0;
    }

    function allSlotsCorrect() {
      return normalizedPlacements.every(slot => slotIsCorrect(slot.id));
    }

    function slotLength(slotId) {
      const cells = cellsBySlot.get(slotId) || [];
      return cells.length;
    }

    function clearSlot(slotId) {
      if (!slotId) return;
      delete state.assignments[slotId];
    }

    function clearSelectedSlot() {
      if (isFinished()) return;
      if (!state.selectedSlotId) return;

      delete state.assignments[state.selectedSlotId];

      saveState();
      render();
    }

    function updateHelpToggleButton() {
      mount.querySelectorAll("[data-kk-help-toggle]").forEach(helpBtn => {
        helpBtn.textContent = state.helpMode ? "Hint: ON" : "Hint: OFF";
        helpBtn.classList.toggle("active", state.helpMode);
        helpBtn.setAttribute("aria-pressed", state.helpMode ? "true" : "false");
      });
    }

    function toggleHelpMode() {
      if (isFinished()) return;

      state.helpMode = !state.helpMode;
      saveState();
      updateHelpToggleButton();
      renderStatus();
      renderWordListOnly();
    }

    function canFitWordInSlot(word, slotId) {
      const currentBoard = buildCurrentBoard();
      const cells = cellsBySlot.get(slotId) || [];

      if (word.length !== cells.length) return false;

      for (let i = 0; i < cells.length; i++) {
        const { r, c } = cells[i];
        const existing = currentBoard[r][c];

        if (existing && existing !== word[i]) return false;
      }

      return true;
    }

    function selectSlot(slotId) {
      if (isFinished()) return;

      state.selectedSlotId = slotId || "";

      saveState();
      renderStatus();
      renderBoardOnly();
      renderWordListOnly();
    }

    function selectNextSlotAtCell(r, c) {
      if (isFinished()) return;

      const slotIds = slotsByCell.get(cellKey(r, c)) || [];
      if (!slotIds.length) return;

      if (slotIds.length === 1) {
        selectSlot(slotIds[0]);
        return;
      }

      const currentIndex = slotIds.indexOf(state.selectedSlotId);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % slotIds.length : 0;

      selectSlot(slotIds[nextIndex]);
    }

    function placeWord(word) {
      if (isFinished()) return;

      if (!state.selectedSlotId) {
        setStatusMessage("Choose a slot in the grid first.");
        return;
      }

      const slotId = state.selectedSlotId;
      const expectedLen = slotLength(slotId);

      if (word.length !== expectedLen) {
        setStatusMessage(`That word has ${word.length} letters. This slot needs ${expectedLen}.`);
        return;
      }

      const wordToSlot = getWordToSlotMap();
      const existingSlotForWord = wordToSlot.get(word);

      if (existingSlotForWord && existingSlotForWord !== slotId) {
        clearSlot(existingSlotForWord);
      }

      const previousWord = state.assignments[slotId];
      if (previousWord) delete state.assignments[slotId];

      if (!canFitWordInSlot(word, slotId)) {
        if (previousWord) state.assignments[slotId] = previousWord;

        saveState();
        render();
        setStatusMessage("That word conflicts with letters already placed.");
        return;
      }

      state.assignments[slotId] = word;
      state.selectedSlotId = "";
      state.revealed = false;
      state.revealedAt = "";

      if (allSlotsCorrect()) {
        state.solved = true;

        if (!state.solvedAt) {
          state.solvedAt = new Date().toISOString();
        }

        state.overlaySeen = false;
      } else {
        state.solved = false;
      }

      saveState();
      render();

      if (state.solved) {
        showOverlay();
      } else {
        setStatusMessage(`Placed "${word}". Keep going!`);
      }
    }

    function resetPuzzle() {
      if (!confirm("Reset this Kriss Kross and clear all progress?")) return;

      state.assignments = {};
      state.selectedSlotId = "";
      state.revealed = false;
      state.solved = false;
      state.solvedAt = "";
      state.revealedAt = "";
      state.overlaySeen = false;

      saveState();
      hideOverlay();
      render();
    }

    function revealAnswers() {
      if (isFinished()) return;

      const ok = confirm("Reveal all answers? This will end the puzzle.");
      if (!ok) return;

      const assignments = {};

      normalizedPlacements.forEach(slot => {
        assignments[slot.id] = slot.word;
      });

      state.assignments = assignments;
      state.selectedSlotId = "";
      state.revealed = true;
      state.solved = false;

      if (!state.revealedAt) {
        state.revealedAt = new Date().toISOString();
      }

      state.overlaySeen = false;

      saveState();
      render();
      showOverlay();
    }

    function statusMessage() {
      if (state.solved) return "Kriss Kross solved! 🎉";
      if (state.revealed) return "Answers revealed.";

      if (state.selectedSlotId) {
        const len = slotLength(state.selectedSlotId);
        return `Slot selected. Choose a ${len}-letter word from the list.`;
      }

      return "Click a slot in the grid, then click a matching word from the list. Click the same crossing square again to switch direction.";
    }

    function setStatusMessage(msg) {
      const el = mount.querySelector("#hp-kk-status-msg");
      if (el) el.textContent = msg;
    }

    function isFirstCellOfSlot(r, c, slotId) {
      if (!slotId) return false;

      const cells = cellsBySlot.get(slotId) || [];
      if (!cells.length) return false;

      return cells[0].r === r && cells[0].c === c;
    }

    function renderStats() {
      const placedEl = mount.querySelector("#hp-kk-correct-ratio");
      const leftEl = mount.querySelector("#hp-kk-left");
      const sizeEl = mount.querySelector("#hp-kk-size");
      const progressFill = mount.querySelector("#hp-kk-progress-fill");

      if (placedEl) placedEl.textContent = `${correctCount()}/${normalizedPlacements.length}`;
      if (leftEl) leftEl.textContent = String(normalizedPlacements.length - correctCount());
      if (sizeEl) sizeEl.textContent = `${rowCount}×${colCount}`;
      if (progressFill) progressFill.style.width = `${progressPercent()}%`;
    }

    function renderStatus() {
      setStatusMessage(statusMessage());
    }

    function renderBoardOnly() {
      const boardEl = mount.querySelector("#hp-kk-board");
      if (!boardEl) return;

      const currentBoard = buildCurrentBoard();

      boardEl.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`;
      boardEl.style.setProperty("--hp-kk-cols", String(colCount));
      boardEl.style.setProperty("--hp-kk-rows", String(rowCount));

      boardEl.innerHTML = Array.from({ length: rowCount }, (_, r) =>
        Array.from({ length: colCount }, (_, c) => {
          if (!activeCellMap.has(cellKey(r, c))) {
            return `<div class="hp-kk-block" aria-hidden="true"></div>`;
          }

          const slotIdsHere = normalizedPlacements
            .filter(slot => (cellsBySlot.get(slot.id) || []).some(cell => cell.r === r && cell.c === c))
            .map(slot => slot.id);

          const selectedHere = slotIdsHere.includes(state.selectedSlotId);
          const anyCorrectHere = slotIdsHere.some(slotId => slotIsCorrect(slotId));
          const anyFilledHere = slotIdsHere.some(slotId => state.assignments[slotId]);
          const isSelectedStart = state.selectedSlotId && isFirstCellOfSlot(r, c, state.selectedSlotId);
          const canToggle = slotIdsHere.length > 1;

          const classes = ["hp-kk-cell"];

          if (selectedHere && !isFinished()) classes.push("is-selected");
          if (state.revealed) classes.push("is-revealed");
          else if (anyCorrectHere) classes.push("is-correct");
          else if (anyFilledHere) classes.push("is-filled");

          if (isSelectedStart) classes.push("is-slot-start");
          if (canToggle) classes.push("is-toggle-cell");

          const letter = state.revealed ? solutionBoard[r][c] : (currentBoard[r][c] || "");

          const label = letter
            ? `Row ${r + 1}, Column ${c + 1}, Letter ${letter}${canToggle ? ". Click again to switch direction." : ""}`
            : `Row ${r + 1}, Column ${c + 1}, empty slot${canToggle ? ". Click again to switch direction." : ""}`;

          return `
            <button
              type="button"
              class="${classes.join(" ")}"
              data-row="${r}"
              data-col="${c}"
              aria-label="${escapeHtml(label)}">
              ${escapeHtml(letter)}
            </button>
          `;
        }).join("")
      ).join("");

      boardEl.querySelectorAll("[data-row][data-col]").forEach(btn => {
        btn.addEventListener("click", () => {
          const r = Number(btn.getAttribute("data-row"));
          const c = Number(btn.getAttribute("data-col"));

          if (Number.isFinite(r) && Number.isFinite(c)) {
            selectNextSlotAtCell(r, c);
          }
        });
      });
    }

    function renderWordListOnly() {
      const listEl = mount.querySelector("#hp-kk-word-list");
      const pillEl = mount.querySelector("#hp-kk-pill");

      if (!listEl) return;

      const usedWords = new Set(Object.values(state.assignments).filter(Boolean));

      if (pillEl) pillEl.textContent = `Words Placed: ${placedCount()}/${normalizedPlacements.length}`;

      listEl.innerHTML = words.map(word => {
        const used = usedWords.has(word);
        const selectedMatch = state.selectedSlotId && slotLength(state.selectedSlotId) === word.length;
        const found = normalizedPlacements.some(slot => slot.word === word && slotIsCorrect(slot.id));

        const classes = ["hp-kk-word-item"];

        if (state.helpMode && selectedMatch && !used && !isFinished()) classes.push("is-match");
        if (used && !found) classes.push("is-used");
        if (found || state.revealed) classes.push("is-found");

        return `
          <button
            type="button"
            class="${classes.join(" ")}"
            data-word="${escapeHtml(word)}"
            ${isFinished() ? "disabled" : ""}>
            ${escapeHtml(word)}
          </button>
        `;
      }).join("");

      listEl.querySelectorAll("[data-word]").forEach(btn => {
        btn.addEventListener("click", () => {
          const word = btn.getAttribute("data-word");
          if (word) placeWord(word);
        });
      });
    }


    function getOverlayStatsLine(){
      const stats = (typeof window.HareKrissKrossGetStats === "function")
        ? window.HareKrissKrossGetStats()
        : { streak:0, solved: state.solved ? 1 : 0, revealed: state.revealed ? 1 : 0, inProgress: isFinished() ? 0 : (placedCount() ? 1 : 0), played: placedCount() || isFinished() ? 1 : 0 };
      return `
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">local_fire_department</span><strong>${Number(stats.streak||0).toLocaleString()}</strong> Day Streak</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">trophy</span><strong>${Number(stats.solved||0).toLocaleString()}</strong> Solved</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">visibility</span><strong>${Number(stats.revealed||0).toLocaleString()}</strong> Revealed</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">pending_actions</span><strong>${Number(stats.inProgress||0).toLocaleString()}</strong> In Progress</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">beenhere</span><strong>${Number(stats.played||0).toLocaleString()}</strong> Played</span>`;
    }

    function renderRecommendationHtml(){
      if (typeof window.HareKrissKrossFindNextPuzzle === "function") {
        const nextPuzzle = window.HareKrissKrossFindNextPuzzle(puzzleId);
        if (nextPuzzle && nextPuzzle.puzzleId) {
          return `<div class="hp-recommend-card">
            <div class="hp-recommend-title">Play Your Next Puzzle</div>
            <div class="hp-recommend-copy">Your next available Kriss Kross is ready. Keep the fun going with another word puzzle.</div>
            <button class="hp-link-btn primary" data-a="load-puzzle" data-puzzle-id="${escapeHtml(nextPuzzle.puzzleId)}">Kriss Kross #${escapeHtml(nextPuzzle.puzzleId)}</button>
          </div>`;
        }
      }
      return `<div class="hp-recommend-card"><div class="hp-recommend-title">All caught up!</div><div class="hp-recommend-copy">Congratulations — every available Kriss Kross puzzle has been played.</div><span class="hp-link-btn secondary full" role="status">Congratulations!</span></div>`;
    }

    function renderOverlayContent() {
      const badgeIdEl = mount.querySelector("#hp-kk-badge-id");
      const badgeMetaEl = mount.querySelector("#hp-kk-badge-meta");
      const overlayIconEl = mount.querySelector("#hp-kk-overlay-icon");
      const overlayTitleEl = mount.querySelector("#hp-kk-overlay-title");
      const overlayTextEl = mount.querySelector("#hp-kk-overlay-text");

      if (!badgeIdEl || !badgeMetaEl || !overlayIconEl || !overlayTitleEl || !overlayTextEl) return;

      badgeIdEl.textContent = puzzleTitle;
      badgeMetaEl.innerHTML = getOverlayStatsLine();

      if (state.solved) {
        overlayIconEl.textContent = "celebration";
        overlayTitleEl.textContent = "You Solved the Kriss Kross!";
        overlayTextEl.innerHTML = `<div class="hp-modal-lead">Congratulations — you placed every word!</div><div class="hp-modal-subtext">Great job solving this Kriss Kross puzzle.</div>${renderRecommendationHtml()}`;
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "visibility";
        overlayTitleEl.textContent = "Answers Revealed";
        overlayTextEl.innerHTML = `<div class="hp-modal-lead">Completed with a little help —<br>one or more words were revealed.</div>${renderRecommendationHtml()}`;
      }
    }

    function showOverlay() {
      renderOverlayContent();

      const overlayEl = mount.querySelector("#hp-kk-overlay");
      if (!overlayEl) return;

      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");

      state.overlaySeen = false;
      saveState();
    }

    function hideOverlay() {
      const overlayEl = mount.querySelector("#hp-kk-overlay");
      if (!overlayEl) return;

      overlayEl.classList.remove("on");
      overlayEl.setAttribute("aria-hidden", "true");

      state.overlaySeen = true;
      saveState();
    }

    function showHelpModal() {
      const modalEl = mount.querySelector("#hp-kk-help-modal");
      if (!modalEl) return;

      modalEl.classList.add("on");
      modalEl.setAttribute("aria-hidden", "false");
    }

    function hideHelpModal() {
      const modalEl = mount.querySelector("#hp-kk-help-modal");
      if (!modalEl) return;

      modalEl.classList.remove("on");
      modalEl.setAttribute("aria-hidden", "true");
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

              ${puzzleTheme ? `<h3 class="hp-kk-theme-title">${escapeHtml(puzzleTheme)}</h3>` : ""}

              <div class="hp-kk-stats">
                <div class="hp-kk-stat">
                  <span class="hp-kk-stat-value" id="hp-kk-correct-ratio">0/0</span>
                  <span class="hp-kk-stat-label">Correct</span>
                </div>

                <div class="hp-kk-stat">
                  <span class="hp-kk-stat-value" id="hp-kk-left">0</span>
                  <span class="hp-kk-stat-label">Left</span>

                </div>

                <div class="hp-kk-stat">
                  <span class="hp-kk-stat-value" id="hp-kk-size">0×0</span>
                  <span class="hp-kk-stat-label">Grid Size</span>
                </div>
              </div>

              <div class="hp-kk-progress">
                <div class="hp-kk-progress-fill" id="hp-kk-progress-fill"></div>
              </div>
              <div class="hp-kk-board-wrap">
                <div class="hp-kk-board" id="hp-kk-board" aria-label="Kriss Kross puzzle board"></div>
              </div>

              <div class="hp-puzzle-mobile-tools" aria-label="Kriss Kross puzzle controls">
                <button type="button" class="hp-tool-btn help-info" data-a="open-help-modal">Help</button>
                <button
                  type="button"
                  class="hp-tool-btn hint-toggle${state.helpMode ? " active" : ""}"
                  data-kk-help-toggle="mobile"
                  aria-pressed="${state.helpMode ? "true" : "false"}">
                  ${state.helpMode ? "Hint: ON" : "Hint: OFF"}
                </button>
                <button type="button" class="hp-tool-btn clear-tool" data-a="clear-selected">Clear</button>
                <button type="button" class="hp-tool-btn danger" data-a="reset-puzzle">Start Over</button>
                <button type="button" class="hp-tool-btn reveal" data-a="reveal-answers">Reveal</button>
              </div>

              <div class="hp-kk-actions">
                <button type="button" class="hp-kk-btn danger" id="hp-kk-reset">Start Over</button>
                <button type="button" class="hp-kk-btn reveal" id="hp-kk-reveal">Reveal Answers</button>
              </div>
            </div>
          </div>

          <div class="hp-kk-col-right">
            <div class="hp-kk-panel">

              <div class="hp-puzzle-tools" aria-label="Kriss Kross puzzle controls">
                <button type="button" class="hp-tool-btn help-info" data-a="open-help-modal">Help</button>
                <button
                  type="button"
                  class="hp-tool-btn hint-toggle${state.helpMode ? " active" : ""}"
                  id="hp-kk-help-toggle"
                  data-kk-help-toggle="desktop"
                  aria-pressed="${state.helpMode ? "true" : "false"}">
                  ${state.helpMode ? "Hint: ON" : "Hint: OFF"}
                </button>
                <button type="button" class="hp-tool-btn clear-tool" id="hp-kk-clear-slot" data-a="clear-selected">Clear</button>
              </div>

              <div class="hp-kk-words-header">
                <h3>Words</h3>
                <span class="hp-kk-pill" id="hp-kk-pill">Words Placed: 0/0</span>
              </div>

              <div class="hp-kk-word-list" id="hp-kk-word-list"></div>
            </div>
          </div>
        </div>

        <div class="hp-overlay" id="hp-kk-overlay" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Kriss Kross result">
            <span id="hp-kk-overlay-icon" class="material-symbols-outlined" aria-hidden="true">celebration</span>

            <h3 id="hp-kk-overlay-title">You Solved the Kriss Kross!</h3>

            <div class="hp-result-meta">
              <div class="hp-result-puzzle-title" id="hp-kk-badge-id"></div>
              <div class="hp-result-stats-line" id="hp-kk-badge-meta"></div>
            </div>

            <div id="hp-kk-overlay-text">
              <div class="hp-modal-lead">Congratulations — you did it!</div>
              <div class="hp-modal-subtext">New puzzles are added daily in the Puzzlers Hub.</div>
              <div class="hp-modal-subtext">Or explore a whole stack of puzzles to enjoy offline.</div>
            </div>

            <div class="hp-modal-actions">
              <a class="hp-link-btn primary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
              <a class="hp-link-btn secondary" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>

              <button class="hp-link-btn share" data-a="share">Share This Puzzle</button>
              <button class="hp-link-btn neutral" data-a="close-overlay">Back to Puzzle</button>

              <button class="hp-link-btn danger full" data-a="reset-puzzle">Start Over</button>
            </div>

            <small>Hare Publishing • Kriss Kross</small>
          </div>
        </div>

        <div class="hp-overlay hp-kk-help-modal" id="hp-kk-help-modal" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Kriss Kross">
            <h3>How to Play</h3>

            <div class="hp-help-modal-content">
              <span class="hp-help-line">Click a <strong>slot in the grid</strong>, then click a matching word from the list.</span>
              <span class="hp-help-line">Use the <strong>crossing letters</strong> to help place each word correctly.</span>
              <span class="hp-help-line">If a square belongs to two words, click it again to <strong>switch direction</strong>.</span>
              <span class="hp-help-line"><strong>Hint: ON</strong> highlights words that match the selected slot length.</span>
              <span class="hp-help-line"><strong>Reveal Answers</strong> ends the puzzle and shows the completed grid.</span>
            </div>

            <div class="hp-modal-actions">
              <button class="hp-link-btn neutral full" data-a="close-help-modal">Back to Puzzle</button>
            </div>

            <small>Hare Publishing • Kriss Kross</small>
          </div>
        </div>
      `;

      renderStats();
      renderStatus();
      renderBoardOnly();
      renderWordListOnly();
      bindEvents();

      if ((state.solved || state.revealed) && !state.overlaySeen) {
        showOverlay();
      }
    }

    function bindEvents() {
      const clearBtn = mount.querySelector("#hp-kk-clear-slot");
      const resetBtn = mount.querySelector("#hp-kk-reset");
      const revealBtn = mount.querySelector("#hp-kk-reveal");
      const overlayEl = mount.querySelector("#hp-kk-overlay");
      const helpModalEl = mount.querySelector("#hp-kk-help-modal");

      if (clearBtn) clearBtn.addEventListener("click", clearSelectedSlot);
      if (resetBtn) resetBtn.addEventListener("click", resetPuzzle);
      if (revealBtn) revealBtn.addEventListener("click", revealAnswers);

      mount.querySelectorAll("[data-kk-help-toggle]").forEach(helpBtn => {
        helpBtn.addEventListener("click", toggleHelpMode);
      });

      mount.querySelectorAll("[data-a]").forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.getAttribute("data-a");

          if (action === "close-overlay") {
            hideOverlay();
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

          if (action === "clear-selected") {
            clearSelectedSlot();
            return;
          }

          if (action === "reset-puzzle") {
            resetPuzzle();
            return;
          }

          if (action === "reveal-answers") {
            revealAnswers();
            return;
          }

          if (action === "load-puzzle") {
            const nextId = btn.getAttribute("data-puzzle-id");
            hideOverlay();
            if (nextId && typeof window.HareKrissKrossLoadPuzzle === "function") {
              window.HareKrissKrossLoadPuzzle(nextId);
            }
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
                setStatusMessage("Link copied! 📋");
              } catch {
                setStatusMessage("Copy the link from your address bar 🙂");
              }
            }
          }
        });
      });

      if (overlayEl) {
        overlayEl.addEventListener("click", (e) => {
          if (e.target === overlayEl) hideOverlay();
        });
      }

      if (helpModalEl) {
        helpModalEl.addEventListener("click", (e) => {
          if (e.target === helpModalEl) hideHelpModal();
        });
      }
    }

    container.addEventListener("keydown", (e) => {
      const overlayEl = mount.querySelector("#hp-kk-overlay");
      const helpModalEl = mount.querySelector("#hp-kk-help-modal");

      if (helpModalEl && helpModalEl.classList.contains("on")) {
        if (e.key === "Escape") hideHelpModal();
        return;
      }

      if (overlayEl && overlayEl.classList.contains("on")) {
        if (e.key === "Escape") hideOverlay();
        return;
      }

      if (e.key === "Escape") {
        state.selectedSlotId = "";
        saveState();
        render();
      }
    });

    render();
  }
};

// Platform alias: this file intentionally uses the production Kriss Kross engine/rendering unchanged.
// Only the loading layer supplies JSON data instead of a Squarespace inline data object.
window.HareKrissKrossPlatformEngine = window.HareKrissKrossEngine;
window.HareKrissKrossPlatformEngine.openHelp = function(containerId){
  const container = document.getElementById(containerId || "hp-krisskross-container");
  const modal = container && container.querySelector("#hp-kk-help-modal");
  if (modal) {
    modal.classList.add("on");
    modal.setAttribute("aria-hidden", "false");
  }
};

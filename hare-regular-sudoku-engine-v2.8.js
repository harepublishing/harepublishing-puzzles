/* =========================================================
   HARE PUBLISHING REGULAR SUDOKU ENGINE
   For Easy, Medium & Hard Sudoku puzzles
   GitHub/jsDelivr hosted engine file

   Suggested filename:
   hare-regular-sudoku-engine-v2.6.js

   Expected page setup:
   - A container with id="hp-sudoku-container"
   - A puzzle data block with id="hp-sudoku-data"
   - This engine loaded after the puzzle data block
   ========================================================= */

window.HareRegularSudokuEngine = {
  init({
    containerId = "hp-sudoku-container",
    dataId = "hp-sudoku-data",
    dataObject = window.HareRegularSudokuData
  } = {}) {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error("HareRegularSudokuEngine: puzzle container missing.");
      return;
    }

    if (container.dataset.hpRegularSudokuMounted === "true") {
      console.warn("HareRegularSudokuEngine: this container has already been mounted.");
      return;
    }

    container.dataset.hpRegularSudokuMounted = "true";

    const mount = container.querySelector(".hp-mount");
    if (!mount) {
      console.error("HareRegularSudokuEngine: .hp-mount element missing inside puzzle container.");
      return;
    }

    const yearEl = document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const TIMER_PLAY_ICON = "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@images-v1.4/icons/sudoku-play-button.svg";
    const TIMER_PAUSE_ICON = "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@images-v1.4/icons/sudoku-pause-button.svg";
    const TOOLS_CLOSED_ICON = "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@images-v1.4/icons/sudoku-tools_icon.svg";
    const TOOLS_OPEN_ICON = "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@images-v1.4/icons/sudoku-tools_icon-open.svg";

    const dataEl = document.getElementById(dataId);
    let pageData = dataObject || null;

    if (!pageData && dataEl) {
      try {
        pageData = JSON.parse(dataEl.textContent || "{}");
      } catch (err) {
        console.error("HareRegularSudokuEngine: puzzle data block contains invalid JSON.", err);
      }
    }

    const LINK_MORE_ONLINE = "https://harepublishing.com/online-puzzles";
    const LINK_SHOP = "https://harepublishing.com/shop";

    const SUDOKU_MODE_ORDER = ["easy", "medium", "hard", "extreme"];

    const MODE_META = {
      easy: {
        mode: "easy",
        label: "Easy Sudoku",
        boardAria: "Easy Sudoku Board",
        schemaName: () => `Easy Sudoku Puzzle`,
        schemaDescription: "Play and solve today's easy Sudoku puzzle by Hare Publishing. Includes notes, timer, and progress saving.",
        solvedTitle: "You Solved the Easy Sudoku Puzzle!",
        solvedStat: "Easy Sudoku Solved! 🎉 ",
        solvedText: "Congratulations — you did it! New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        revealedText: "Here is the completed Easy Sudoku puzzle. New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        footer: "Hare Publishing • Easy Sudoku",
        shareTitle: () => `Easy Sudoku — Hare Publishing`,
        shareSolvedText: (id, time) => `I solved today’s easy Sudoku in ${time}!`,
        shareRevealedText: () => `I revealed the answer for Easy Sudoku at Hare Publishing.`,
        sharePlayingText: () => `I’m playing today’s Easy Sudoku!`,
        saveKeyPrefix: "hp_sd_easy_"
      },

      medium: {
        mode: "medium",
        label: "Medium Sudoku",
        boardAria: "Medium Sudoku Board",
        schemaName: () => `Medium Sudoku Puzzle`,
        schemaDescription: "Play and solve today's medium Sudoku puzzle by Hare Publishing. Includes notes, timer, and progress saving.",
        solvedTitle: "You Solved the Medium Sudoku Puzzle!",
        solvedStat: "Medium Sudoku Solved! 🎉 ",
        solvedText: "Congratulations — you did it! New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        revealedText: "Here is the completed Medium Sudoku puzzle. New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        footer: "Hare Publishing • Medium Sudoku",
        shareTitle: () => `Medium Sudoku — Hare Publishing`,
        shareSolvedText: (id, time) => `I solved today’s medium Sudoku in ${time}!`,
        shareRevealedText: () => `I revealed the answer for Medium Sudoku at Hare Publishing.`,
        sharePlayingText: () => `I’m playing today’s Medium Sudoku!`,
        saveKeyPrefix: "hp_sd_medium_"
      },

      hard: {
        mode: "hard",
        label: "Hard Sudoku",
        boardAria: "Hard Sudoku Board",
        schemaName: () => `Hard Sudoku Puzzle`,
        schemaDescription: "Play and solve today's hard Sudoku puzzle by Hare Publishing. Includes notes, timer, and progress saving.",
        solvedTitle: "You Solved the Hard Sudoku Puzzle!",
        solvedStat: "Hard Sudoku Solved! 🎉 ",
        solvedText: "Congratulations — you did it! New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        revealedText: "Here is the completed Hard Sudoku puzzle. New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        footer: "Hare Publishing • Hard Sudoku",
        shareTitle: () => `Hard Sudoku — Hare Publishing`,
        shareSolvedText: (id, time) => `I solved today’s hard Sudoku in ${time}!`,
        shareRevealedText: () => `I revealed the answer for Hard Sudoku at Hare Publishing.`,
        sharePlayingText: () => `I’m playing today’s Hard Sudoku!`,
        saveKeyPrefix: "hp_sd_hard_"
      },

      extreme: {
        mode: "extreme",
        label: "Extreme Sudoku",
        boardAria: "Extreme Sudoku Board",
        schemaName: () => `Extreme Sudoku Puzzle`,
        schemaDescription: "Play and solve today's extreme Sudoku puzzle by Hare Publishing. Includes notes, timer, and progress saving.",
        solvedTitle: "You Solved the Extreme Sudoku Puzzle!",
        solvedStat: "Extreme Sudoku Solved! 🎉 ",
        solvedText: "Congratulations — you did it! New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        revealedText: "Here is the completed Extreme Sudoku puzzle. New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        footer: "Hare Publishing • Extreme Sudoku",
        shareTitle: () => `Extreme Sudoku — Hare Publishing`,
        shareSolvedText: (id, time) => `I solved today’s extreme Sudoku in ${time}!`,
        shareRevealedText: () => `I revealed the answer for Extreme Sudoku at Hare Publishing.`,
        sharePlayingText: () => `I’m playing today’s Extreme Sudoku!`,
        saveKeyPrefix: "hp_sd_extreme_"
      }
    };

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[s]));
    }


    function formatPuzzleDate(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";

      // Treat YYYY-MM-DD as a local date so it does not shift by timezone.
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const date = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(raw);

      if (Number.isNaN(date.getTime())) return raw;

      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    }

    function showConfigError(message) {
      mount.innerHTML = `
        <div class="hp-panel" style="border:1px solid #ED1B24; background:#fff5f5; color:#8a1c1c; padding:18px; border-radius:12px; text-align:center;">
          <strong>Sudoku Configuration Error:</strong><br>
          ${escapeHtml(message)}
        </div>
      `;
    }

    function normalizeGrid(value) {
      return String(value || "").trim();
    }

    function isValidPuzzleString(value) {
      return /^[1-9.]{81}$/.test(value);
    }

    function isValidSolutionString(value) {
      return /^[1-9]{81}$/.test(value);
    }

    function buildPuzzlesFromData(data) {
      if (!data || typeof data !== "object") return null;
      const source = data.puzzles || data.PUZZLES || data;
      const result = {};

      SUDOKU_MODE_ORDER.forEach(mode => {
        const item = source[mode];
        if (!item) return;

        const puzzleId = String(item.puzzleId || item.id || "").trim();
        const puzzle = normalizeGrid(item.puzzle);
        const solution = normalizeGrid(item.solution);

        result[mode] = {
          ...MODE_META[mode],
          puzzleId,
          puzzle,
          solution
        };
      });

      return result;
    }

    const PUZZLES = buildPuzzlesFromData(pageData);

    if (!PUZZLES) {
      showConfigError("Puzzle data is missing. Add window.HareRegularSudokuData or a JSON block with id hp-sudoku-data before loading the engine.");
      return;
    }

    const availableModes = SUDOKU_MODE_ORDER.filter(mode => PUZZLES[mode]);
    if (!availableModes.length) {
      showConfigError("At least one Sudoku puzzle is required. Add easy, medium, hard, or extreme puzzle data.");
      return;
    }

    for (const mode of availableModes) {
      const cfg = PUZZLES[mode];
      if (!cfg.puzzleId) {
        showConfigError(`${cfg.label} is missing a puzzleId.`);
        return;
      }
      if (!isValidPuzzleString(cfg.puzzle)) {
        showConfigError(`${cfg.label} #${cfg.puzzleId} must have an 81-character puzzle string using digits 1-9 and periods for blanks.`);
        return;
      }
      if (!isValidSolutionString(cfg.solution)) {
        showConfigError(`${cfg.label} #${cfg.puzzleId} must have an 81-character solution string using digits 1-9 only.`);
        return;
      }
    }

    const defaultMode = availableModes.includes(pageData?.defaultMode)
      ? pageData.defaultMode
      : availableModes[0];

    // =========================================================
    // STATE HELPERS
    // =========================================================
    const defaultState = () => ({
      cells: Array.from({ length: 81 }, () => ({ value: "", notes: Array(9).fill(false) })),
      elapsed: 0,
      running: false,
      solved: false,
      revealed: false,
      solvedAt: "",
      revealedAt: "",
      overlaySeen: false
    });

    function getSaveKey(mode) {
      const cfg = PUZZLES[mode];
      return `${cfg.saveKeyPrefix}${cfg.puzzleId}`;
    }

    function loadState(mode) {
      try {
        const raw = localStorage.getItem(getSaveKey(mode));
        const parsed = raw ? JSON.parse(raw) : null;
        const merged = parsed ? { ...defaultState(), ...parsed } : defaultState();
        if (typeof merged.revealed !== "boolean") merged.revealed = false;
        if (typeof merged.overlaySeen !== "boolean") merged.overlaySeen = false;
        if (typeof merged.solvedAt !== "string") merged.solvedAt = "";
        if (typeof merged.revealedAt !== "string") merged.revealedAt = "";
        if (!Array.isArray(merged.cells) || merged.cells.length !== 81) merged.cells = defaultState().cells;
        merged.cells = merged.cells.map(cell => ({
          value: String(cell?.value || ""),
          notes: Array.isArray(cell?.notes) && cell.notes.length === 9 ? cell.notes : Array(9).fill(false)
        }));
        return merged;
      } catch {
        return defaultState();
      }
    }

    function saveState(mode, state) {
      try {
        localStorage.setItem(getSaveKey(mode), JSON.stringify(state));
      } catch {}
    }

    const states = {};
    availableModes.forEach(mode => {
      states[mode] = loadState(mode);
    });

    let currentMode = defaultMode;
    let selected = null;
    let notesOn = false;
    let hintsOn = false;
    let checkOn = false;
    let timerInterval = null;
    let lastTick = Date.now();
    let saveTick = 0;
    const SAVE_EVERY = 10;

    let boardEl = null;
    let statEl = null;
    let timerEl = null;
    let timerToggleBtn = null;
    let timerToggleIcon = null;
    let notesBtn = null;
    let overlayEl = null;
    let badgeIdEl = null;
    let badgeTimeEl = null;
    let overlayIconEl = null;
    let overlayTitleEl = null;
    let overlayTextEl = null;
    let overlayFooterEl = null;
    let helpOverlayEl = null;
    let hintsBtn = null;
    let checkToggleBtn = null;
    let toolsToggleBtn = null;
    let toolsToggleIcon = null;
    let toolsTrayEl = null;
    let cells = [];
    let toolsOpen = false;

    let mountClickHandler = null;
    let notesClickHandler = null;
    let overlayClickHandler = null;
    let keydownHandler = null;
    let beforeUnloadHandler = null;

    function getConfig() {
      return PUZZLES[currentMode];
    }

    function getState() {
      return states[currentMode];
    }

    function saveCurrentState() {
      saveState(currentMode, getState());
    }

    function formatTime(ms) {
      const s = Math.max(0, Math.floor(ms / 1000));
      return new Date(s * 1000).toISOString().substr(11, 8);
    }

    function getSelectedCellText(index = selected) {
      if (index === null || index === undefined || index < 0) return "Tap a cell to begin";
      const row = Math.floor(index / 9) + 1;
      const col = (index % 9) + 1;
      return `Selected: Row ${row}, Col ${col}`;
    }

    function getPeerIndexes(index) {
      const peers = new Set();
      const row = Math.floor(index / 9);
      const col = index % 9;
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;

      for (let i = 0; i < 9; i++) {
        peers.add(row * 9 + i);
        peers.add(i * 9 + col);
      }

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          peers.add((boxRow + r) * 9 + boxCol + c);
        }
      }

      peers.delete(index);
      return Array.from(peers);
    }

    function removePeerNotesForValue(index, num) {
      const state = getState();
      const noteIndex = num - 1;

      getPeerIndexes(index).forEach(peerIndex => {
        const peer = state.cells[peerIndex];
        if (!peer?.notes?.[noteIndex]) return;

        peer.notes[noteIndex] = false;
        renderCell(peerIndex);
      });
    }

    function isFinished() {
      const state = getState();
      return state.solved || state.revealed;
    }

    function pauseTimer(saveNow = false) {
      const state = getState();

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      if (state.running) {
        const now = Date.now();
        state.elapsed += (now - lastTick);
        lastTick = now;
        state.running = false;
        updateTimerUI();
        if (saveNow) saveCurrentState();
      }
    }

    function startTimer() {
      const state = getState();
      if (state.running || isFinished()) return;

      state.running = true;
      lastTick = Date.now();

      timerInterval = setInterval(() => {
        const liveState = getState();
        if (!liveState.running || isFinished()) return;

        const now = Date.now();
        liveState.elapsed += (now - lastTick);
        lastTick = now;
        updateTimerUI();

        saveTick++;
        if (saveTick >= SAVE_EVERY) {
          saveTick = 0;
          saveCurrentState();
        }
      }, 1000);

      updateTimerUI();
      saveCurrentState();
    }

    function clearCheckMarks() {
      cells.forEach(c => c.el.classList.remove("is-wrong", "is-right"));
    }

    function clearHintMarks() {
      cells.forEach(c => c.el.classList.remove("hint-line", "hint-match", "hint-conflict"));
    }

    function getVisibleCellValue(index) {
      const cfg = getConfig();
      const state = getState();
      if (cfg.puzzle[index] !== ".") return cfg.puzzle[index];
      return String(state.cells[index]?.value || "");
    }

    function isDigitCompleteInRowsAndColumns(num) {
      const value = String(num);

      for (let row = 0; row < 9; row++) {
        let rowHasValue = false;
        for (let col = 0; col < 9; col++) {
          if (getVisibleCellValue(row * 9 + col) === value) {
            rowHasValue = true;
            break;
          }
        }
        if (!rowHasValue) return false;
      }

      for (let col = 0; col < 9; col++) {
        let colHasValue = false;
        for (let row = 0; row < 9; row++) {
          if (getVisibleCellValue(row * 9 + col) === value) {
            colHasValue = true;
            break;
          }
        }
        if (!colHasValue) return false;
      }

      return true;
    }

    function updateNumberPadHintStates() {
      mount.querySelectorAll(".hp-btn-grid [data-n]").forEach(btn => {
        const num = parseInt(btn.dataset.n, 10);
        btn.classList.toggle("hint-complete", hintsOn && isDigitCompleteInRowsAndColumns(num));
      });
    }

    function getConflictIndexes() {
      const conflicts = new Set();
      const groups = [];

      for (let r = 0; r < 9; r++) groups.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
      for (let c = 0; c < 9; c++) groups.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));

      for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
          const group = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              group.push((br * 3 + r) * 9 + (bc * 3 + c));
            }
          }
          groups.push(group);
        }
      }

      groups.forEach(group => {
        const seen = new Map();
        group.forEach(index => {
          const value = getVisibleCellValue(index);
          if (!value) return;
          if (!seen.has(value)) seen.set(value, []);
          seen.get(value).push(index);
        });

        seen.forEach(indexes => {
          if (indexes.length > 1) indexes.forEach(index => conflicts.add(index));
        });
      });

      return conflicts;
    }

    function applyHintHighlights() {
      clearHintMarks();
      if (!hintsOn || selected === null) return;

      const selectedValue = getVisibleCellValue(selected);
      const selectedRow = Math.floor(selected / 9);
      const selectedCol = selected % 9;

      if (selectedValue) {
        cells.forEach((cell, index) => {
          if (getVisibleCellValue(index) === selectedValue) {
            cell.el.classList.add("hint-match");
          }
        });
      } else {
        cells.forEach((cell, index) => {
          const row = Math.floor(index / 9);
          const col = index % 9;
          if (row === selectedRow || col === selectedCol) {
            cell.el.classList.add("hint-line");
          }
        });
      }

      getConflictIndexes().forEach(index => {
        cells[index]?.el.classList.add("hint-conflict");
      });
    }

    function updateInstructionText() {
      if (!statEl) return;
      if (!hintsOn) {
        statEl.textContent = "";
        statEl.classList.add("hidden");
        return;
      }

      statEl.classList.remove("hidden");

      if (selected === null) {
        statEl.textContent = "Tap a cell to begin";
        return;
      }

      if (checkOn) {
        statEl.textContent = "Correct numbers are green. Incorrect numbers are red.";
        return;
      }

      const selectedRow = Math.floor(selected / 9) + 1;
      const selectedCol = (selected % 9) + 1;
      const selectedValue = getVisibleCellValue(selected);

      if (!selectedValue) {
        statEl.textContent = `Selected cell: Row ${selectedRow}, Column ${selectedCol}.`;
        return;
      }

      const conflicts = getConflictIndexes();
      if (conflicts.has(selected)) {
        statEl.textContent = "That number already exists in this row, column, or box.";
        return;
      }

      statEl.textContent = "Matching numbers are highlighted in blue.";
    }

    function updateHintsButton() {
      if (!hintsBtn) return;
      hintsBtn.textContent = hintsOn ? "Hints: ON" : "Hints: OFF";
      hintsBtn.classList.toggle("active", hintsOn);
      hintsBtn.setAttribute("aria-pressed", hintsOn ? "true" : "false");
      updateNumberPadHintStates();
    }

    function updateCheckButton() {
      if (!checkToggleBtn) return;
      checkToggleBtn.textContent = checkOn ? "Check: ON" : "Check: OFF";
      checkToggleBtn.classList.toggle("active", checkOn);
      checkToggleBtn.setAttribute("aria-pressed", checkOn ? "true" : "false");
    }

    function computeSolved() {
      const cfg = getConfig();
      const state = getState();

      for (let i = 0; i < 81; i++) {
        const givenChar = cfg.puzzle[i];
        const expected = cfg.solution[i];
        if (givenChar !== ".") continue;
        if (state.cells[i].value !== expected) return false;
      }

      return true;
    }

    function updateTimerUI() {
      const state = getState();
      if (timerEl) timerEl.textContent = formatTime(state.elapsed);
      if (timerToggleBtn && timerToggleIcon) {
        const running = state.running && !isFinished();
        timerToggleBtn.setAttribute("aria-label", running ? "Pause timer" : "Start timer");
        timerToggleBtn.setAttribute("title", running ? "Pause" : "Start");
        timerToggleBtn.dataset.a = running ? "t-pause" : "t-start";
        timerToggleIcon.src = running ? TIMER_PAUSE_ICON : TIMER_PLAY_ICON;
        timerToggleIcon.alt = "";
      }
    }

    function updateToolsTray() {
      if (!toolsToggleBtn || !toolsToggleIcon || !toolsTrayEl) return;
      toolsToggleBtn.classList.toggle("open", toolsOpen);
      toolsToggleBtn.setAttribute("aria-expanded", toolsOpen ? "true" : "false");
      toolsToggleBtn.setAttribute("aria-label", toolsOpen ? "Close tools" : "Open tools");
      toolsToggleBtn.setAttribute("title", toolsOpen ? "Close tools" : "Open tools");
      toolsToggleIcon.src = toolsOpen ? TOOLS_OPEN_ICON : TOOLS_CLOSED_ICON;
      toolsToggleIcon.alt = "";
      toolsTrayEl.classList.toggle("open", toolsOpen);
      toolsTrayEl.setAttribute("aria-hidden", toolsOpen ? "false" : "true");
    }

    function injectSchema() {
      const cfg = getConfig();
      const existing = document.getElementById("hp-schema");
      if (existing) existing.remove();

      const nowYear = new Date().getFullYear();
      const pageUrl = window.location.href;

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": cfg.schemaName(cfg.puzzleId),
        "description": cfg.schemaDescription,
        "genre": "Puzzle",
        "url": pageUrl,
        "inLanguage": "en",
        "audience": { "@type": "PeopleAudience", "suggestedMinAge": "8" },
        "numberOfPlayers": "1",
        "copyrightYear": String(nowYear),
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://harepublishing.com/"
        }
      };

      const script = document.createElement("script");
      script.id = "hp-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }

    function renderOverlayContent() {
      const cfg = getConfig();
      const state = getState();

      if (!badgeIdEl || !badgeTimeEl || !overlayIconEl || !overlayTitleEl || !overlayTextEl || !overlayFooterEl) return;

      badgeIdEl.textContent = cfg.label;
      badgeTimeEl.textContent = `Time: ${formatTime(state.elapsed)}`;

      if (state.solved) {
        overlayIconEl.textContent = "🎉 ";
        overlayTitleEl.textContent = cfg.solvedTitle;
        overlayTextEl.textContent = cfg.solvedText;
        overlayFooterEl.textContent = cfg.footer;
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "📘 ";
        overlayTitleEl.textContent = "Answer Revealed";
        overlayTextEl.textContent = cfg.revealedText;
        overlayFooterEl.textContent = cfg.footer;
      }
    }

    function showOverlay() {
      const state = getState();
      renderOverlayContent();
      if (!overlayEl) return;
      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");
      state.overlaySeen = false;
      saveCurrentState();
    }

    function hideOverlay() {
      const state = getState();
      if (!overlayEl) return;
      overlayEl.classList.remove("on");
      overlayEl.setAttribute("aria-hidden", "true");
      state.overlaySeen = true;
      saveCurrentState();
    }

    function showSolved() {
      const cfg = getConfig();
      const state = getState();

      state.solved = true;
      state.revealed = false;

      if (!state.solvedAt) {
        state.solvedAt = new Date().toISOString();
      }

      state.revealedAt = "";

      pauseTimer(true);
      renderOverlayContent();
      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");
      statEl.textContent = cfg.solvedStat;
      state.overlaySeen = false;
      saveCurrentState();
    }

    function renderCell(i) {
      const state = getState();
      const c = cells[i];
      if (!c || c.given) return;

      const data = state.cells[i];
      const el = c.el;

      if (data.value) {
        c.valueEl.textContent = data.value;
        el.classList.add("has-value", "user-input");
      } else {
        c.valueEl.textContent = "";
        el.classList.remove("has-value", "user-input");
      }

      const noteVals = el.querySelectorAll(".hp-n-val");
      if (noteVals.length) {
        noteVals.forEach((nEl, idx) => {
          nEl.textContent = data.notes[idx] ? String(idx + 1) : "";
        });
      }
    }

    function revealAnswer() {
      const cfg = getConfig();
      const state = getState();
      if (isFinished()) return;

      const ok = confirm("Reveal the answer? This will end the puzzle.");
      if (!ok) return;

      clearCheckMarks();

      for (let i = 0; i < 81; i++) {
        if (cfg.puzzle[i] === ".") {
          state.cells[i].value = cfg.solution[i];
          state.cells[i].notes.fill(false);
          renderCell(i);
        }
      }

      if (cells[selected]?.el) cells[selected].el.classList.remove("selected");
      selected = null;

      state.solved = false;
      state.revealed = true;

      if (!state.revealedAt) {
        state.revealedAt = new Date().toISOString();
      }

      state.overlaySeen = false;

      pauseTimer(true);
      statEl.textContent = "Answer revealed.";
      updateNumberPadHintStates();
      saveCurrentState();
      showOverlay();
    }

    function revealSelectedCell() {
      const cfg = getConfig();
      const state = getState();

      if (isFinished()) return;
      if (selected === null) {
        statEl.textContent = "Select a cell to reveal.";
        return;
      }

      const c = cells[selected];
      if (!c || c.given) {
        statEl.textContent = "That cell is already given.";
        return;
      }

      if (!state.running && !state.solved && !state.revealed) startTimer();

      clearCheckMarks();
      checkOn = false;
      updateCheckButton();

      state.cells[selected].value = cfg.solution[selected];
      state.cells[selected].notes.fill(false);
      if (hintsOn) removePeerNotesForValue(selected, parseInt(cfg.solution[selected], 10));
      renderCell(selected);
      updateNumberPadHintStates();
      statEl.textContent = `Revealed Row ${Math.floor(selected / 9) + 1}, Col ${selected % 9 + 1}.`;
      applyHintHighlights();
      saveCurrentState();

      if (computeSolved()) showSolved();
    }

    function handleInput(num) {
      const state = getState();

      if (isFinished()) return;
      if (selected === null) return;

      const c = cells[selected];
      if (!c || c.given) return;

      if (!state.running && !state.solved && !state.revealed) startTimer();

      clearCheckMarks();
      checkOn = false;
      updateCheckButton();

      if (notesOn && num >= 1 && num <= 9) {
        state.cells[selected].notes[num - 1] = !state.cells[selected].notes[num - 1];
      } else {
        if (num === 0) {
          state.cells[selected].value = "";
          state.cells[selected].notes.fill(false);
        } else {
          state.cells[selected].value = String(num);
          state.cells[selected].notes.fill(false);
          if (hintsOn) removePeerNotesForValue(selected, num);
        }
      }

      renderCell(selected);
      updateNumberPadHintStates();
      applyHintHighlights();
      updateInstructionText();
      saveCurrentState();

      if (computeSolved()) showSolved();
    }

    function buildBoard() {
      const cfg = getConfig();
      const state = getState();

      boardEl.innerHTML = "";
      cells = [];
      selected = null;
      notesOn = false;
      hintsOn = false;
      checkOn = false;

      cfg.puzzle.split("").forEach((char, i) => {
        const cell = document.createElement("div");
        cell.className = `hp-cell ${char !== "." ? "given" : ""}`;
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("tabindex", char === "." ? "0" : "-1");
        cell.setAttribute("aria-label", char === "." ? `Cell ${i + 1}` : `Given ${char}`);

        const row = Math.floor(i / 9);
        const col = i % 9;

        if (col === 0) cell.classList.add("bL");
        if (col === 8) cell.classList.add("bR");
        if (row === 0) cell.classList.add("bT");
        if (row === 8) cell.classList.add("bB");
        if (col === 2 || col === 5) cell.classList.add("bR");
        if (row === 2 || row === 5) cell.classList.add("bB");

        const inner = document.createElement("div");
        inner.className = "hp-cell-inner";

        const valueSpan = document.createElement("span");
        valueSpan.className = "hp-value";

        if (char !== ".") {
          valueSpan.textContent = char;
        }

        const noteBox = document.createElement("div");
        noteBox.className = "hp-note-box";
        for (let n = 0; n < 9; n++) {
          const note = document.createElement("span");
          note.className = "hp-n-val";
          noteBox.appendChild(note);
        }

        inner.appendChild(valueSpan);
        if (char === ".") inner.appendChild(noteBox);
        cell.appendChild(inner);

        function selectCell() {
          if (isFinished()) return;

          if (cells[selected]?.el) cells[selected].el.classList.remove("selected");
          selected = i;
          cell.classList.add("selected");
          applyHintHighlights();
          updateInstructionText();
          cell.focus();
        }

        cell.addEventListener("click", selectCell);
        cell.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectCell();
          }
        });

        boardEl.appendChild(cell);

        cells.push({
          el: cell,
          inner,
          valueEl: valueSpan,
          given: char !== "."
        });

        if (char === ".") renderCell(i);
      });

      notesBtn.textContent = "✎ Notes: OFF";
      notesBtn.classList.remove("active");
      notesBtn.setAttribute("aria-pressed", "false");
      updateHintsButton();
      updateCheckButton();
      clearHintMarks();
      updateNumberPadHintStates();

      if (state.solved || state.revealed) {
        renderOverlayContent();
        statEl.textContent = state.solved ? cfg.solvedStat : "Answer revealed.";
      } else {
        statEl.textContent = "Tap a cell to begin";
      }
    }


    function applyTestMobileKeypadSizing() {
      if (!container.classList.contains("hp-sudoku-test")) return;

      const grid = mount.querySelector(".hp-btn-grid");
      if (grid) {
        grid.style.setProperty("display", "grid", "important");
        grid.style.setProperty("grid-template-columns", "repeat(3, minmax(0, 1fr))", "important");
        grid.style.setProperty("grid-auto-rows", "58px", "important");
        grid.style.setProperty("gap", "10px", "important");
        grid.style.setProperty("width", "100%", "important");
        grid.style.setProperty("height", "auto", "important");
        grid.style.setProperty("align-items", "stretch", "important");
      }

      mount.querySelectorAll(".hp-btn-grid .hp-btn").forEach(btn => {
        btn.style.setProperty("box-sizing", "border-box", "important");
        btn.style.setProperty("width", "auto", "important");
        btn.style.setProperty("min-width", "0", "important");
        btn.style.setProperty("height", "58px", "important");
        btn.style.setProperty("min-height", "58px", "important");
        btn.style.setProperty("max-height", "58px", "important");
        btn.style.setProperty("padding", "0", "important");
        btn.style.setProperty("display", "flex", "important");
        btn.style.setProperty("align-items", "center", "important");
        btn.style.setProperty("justify-content", "center", "important");
        btn.style.setProperty("line-height", "1", "important");
        btn.style.setProperty("font-size", "1rem", "important");
        btn.style.setProperty("aspect-ratio", "auto", "important");
      });
    }

    function renderUI() {
      const cfg = getConfig();

mount.innerHTML = `
        <style>
#hp-sudoku-container.hp-sudoku-test .hp-btn-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  grid-auto-rows: 58px !important;
  align-items: stretch !important;
  gap: 10px !important;
}

#hp-sudoku-container.hp-sudoku-test .hp-btn-grid .hp-btn {
  height: 58px !important;
  min-height: 58px !important;
  max-height: 58px !important;
  padding: 0 !important;
  aspect-ratio: auto !important;
  align-self: stretch !important;
  width: auto !important;
  min-width: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
}

          #hp-sudoku-container .hp-rs-top-area {
            width:100%;
            margin:0 0 18px;
            padding:8px 16px;
            border:1px solid #edf2f6;
            border-radius:16px;
            background:#fff;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:14px;
          }

          #hp-sudoku-container .hp-help-top-btn {
            flex:0 0 auto;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            box-sizing:border-box;
            height:36px;
            min-height:36px;
            padding:6px 16px;
            border:1px solid #b8d6ef;
            border-radius:14px;
            background:#fff;
            color:#107FBB;
            font-size:0.82rem;
            font-weight:600;
            line-height:1.1;
            cursor:pointer;
            box-shadow:none;
          }

          #hp-sudoku-container .hp-help-top-btn:hover {
            background:#f0f5fb;
          }

          #hp-sudoku-container .hp-timer-toolbar-row {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:8px;
            margin:0 0 12px;
            height:36px;
          }

          #hp-sudoku-container .hp-timer-toolbar-row .hp-timer-area {
            height:36px;
            min-height:36px;
            padding:0;
            margin:0;
            border:0;
            box-shadow:none;
            background:transparent;
            display:flex;
            align-items:center;
            justify-content:flex-start;
            gap:8px;
            flex-wrap:nowrap;
            flex:1 1 auto;
          }

          #hp-sudoku-container .hp-timer-toolbar-row .hp-timer-display {
            display:inline-flex;
            align-items:center;
            justify-content:flex-start;
            height:36px;
            font-size:19px;
            line-height:1;
            min-width:auto;
            margin:0;
            text-align:left;
            font-weight:600;
            color:#6B2B84;
          }

          #hp-sudoku-container .hp-timer-toolbar-row .hp-timer-controls {
            display:flex;
            align-items:center;
            gap:6px;
            justify-content:center;
            height:36px;
          }

          #hp-sudoku-container .hp-timer-toolbar-row .hp-btn-sm {
            display:inline-flex;
            align-items:center;
            justify-content:center;
            box-sizing:border-box;
            height:25px;
            min-height:25px;
            width:25px;
            padding:0;
            font-size:1rem;
            line-height:1;
            border-radius:14px;
            border:0;
            background:transparent;
            box-shadow:none;
          }

          #hp-sudoku-container .hp-timer-toolbar-row .hp-timer-toggle {
            border:0;
            background:transparent;
            box-shadow:none;
            overflow:visible;
            border-radius:14px;
          }

          #hp-sudoku-container .hp-timer-toolbar-row .hp-timer-toggle img {
            display:block;
            width:100%;
            height:100%;
            max-width:100%;
            max-height:100%;
            object-fit:contain;
            margin:0;
          }

          #hp-sudoku-container .hp-timer-toolbar-row .hp-tools-toggle {
            display:inline-flex;
            align-items:center;
            justify-content:center;
            flex:0 0 auto;
            width:25px;
            height:25px;
            padding:0;
            border:0;
            border-radius:14px;
            background:transparent;
            cursor:pointer;
            order:2;
          }

          #hp-sudoku-container .hp-timer-toolbar-row .hp-tools-toggle img {
            display:block;
            width:100%;
            height:100%;
            max-width:100%;
            max-height:100%;
            object-fit:contain;
          }

          #hp-sudoku-container .hp-rs-level-panel {
            display:flex;
            align-items:center;
            justify-content:flex-start;
            gap:10px;
            width:auto;
            min-width:0;
            flex:1 1 auto;
            margin:0;
            padding:0;
            height:44px;
            border:0;
            border-radius:0;
            background:transparent;
          }

          #hp-sudoku-container .hp-rs-level-title {
            display:inline-flex;
            align-items:center;
            justify-content:center;
            flex:0 0 auto;
            height:44px;
            min-height:44px;
            font-size:15px;
            font-weight:900;
            color:#24323d;
            line-height:1.1;
            white-space:nowrap;
            margin:0;
          }

          #hp-sudoku-container .hp-rs-level-panel .hp-mode-switch-wrap {
            display:flex;
            align-items:center;
            height:44px;
            min-height:44px;
            width:auto;
            max-width:100%;
            margin:0;
          }

          #hp-sudoku-container .hp-rs-level-panel .hp-mode-switch {
            display:grid !important;
            grid-template-columns:repeat(${availableModes.length}, minmax(82px, 1fr)) !important;
            gap:8px !important;
            width:auto !important;
            max-width:440px !important;
            height:44px !important;
            align-items:center !important;
            margin:0 !important;
          }

          #hp-sudoku-container .hp-rs-level-panel .hp-mode-btn {
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            box-sizing:border-box !important;
            height:36px !important;
            min-height:36px !important;
            padding:6px 12px !important;
            border-radius:14px !important;
            font-size:.82rem !important;
            line-height:1.1 !important;
          }

          #hp-sudoku-container .hp-rs-tools {
            display:grid !important;
            grid-template-columns:repeat(3, minmax(0, 1fr)) !important;
            gap:8px !important;
            width:100% !important;
            margin:0 !important;
          }

          #hp-sudoku-container .hp-tools-tray {
            max-height:0;
            opacity:0;
            overflow:hidden;
            transform:translateY(-6px);
            pointer-events:none;
            transition:max-height .22s ease, opacity .18s ease, transform .18s ease;
            margin:0 0 12px;
          }

          #hp-sudoku-container .hp-tools-tray.open {
            max-height:120px;
            opacity:1;
            transform:translateY(0);
            pointer-events:auto;
            overflow:visible;
          }

          #hp-sudoku-container .hp-stat {
            min-height:52px;
            padding:16px 10px;
            box-sizing:border-box;
            display:flex;
            align-items:center;
            justify-content:center;
            text-align:center;
            width:100%;
          }

          #hp-sudoku-container .hp-stat.hidden {
            display:none;
          }

          #hp-sudoku-container .hp-rs-tools .hp-tool-btn {
            position:relative;
            background:#fff !important;
            border:1px solid #b8d6ef !important;
            color:#107FBB !important;
            box-shadow:none !important;
            min-height:42px !important;
            padding:7px 5px !important;
            border-radius:14px !important;
            font-size:.78rem !important;
            line-height:1.08 !important;
            white-space:nowrap !important;
            transition:transform .18s ease, box-shadow .18s ease;
          }

          #hp-sudoku-container .hp-rs-tools .hp-tool-btn:hover {
            transform:translateY(-2px);
            z-index:1;
          }

          #hp-sudoku-container .hp-rs-tools .hp-tool-btn.hint-toggle {
            background:#f0fbf5 !important;
            border-color:#00A54F !important;
            color:#00A54F !important;
          }

          #hp-sudoku-container .hp-rs-tools .hp-tool-btn.hint-toggle.active {
            background:#00A54F !important;
            border-color:#00A54F !important;
            color:#fff !important;
          }

          #hp-sudoku-container #hp-check-toggle-btn.active {
            background:#107FBB !important;
            border-color:#107FBB !important;
            color:#fff !important;
          }

          #hp-sudoku-container .hp-rs-right {
            margin-top:0;
          }

          #hp-sudoku-container .hp-rs-right .hp-stat {
            margin:0 0 14px !important;
            min-height:auto;
            text-align:center;
            font-size:0.95rem;
            line-height:1.3;
          }

          #hp-sudoku-container .hp-cell.given {
            background:#e4e4e4;
          }

          #hp-sudoku-container .hp-cell.hint-line,
          #hp-sudoku-container .hp-cell.hint-match {
            background:#cce6f7 !important;
          }

          #hp-sudoku-container .hp-cell.given.hint-line,
          #hp-sudoku-container .hp-cell.given.hint-match {
            background:#a8cde8 !important;
          }

          #hp-sudoku-container .hp-cell.is-wrong,
          #hp-sudoku-container .hp-cell.hint-conflict,
          #hp-sudoku-container .hp-cell.is-wrong.hint-line,
          #hp-sudoku-container .hp-cell.is-wrong.hint-match,
          #hp-sudoku-container .hp-cell.hint-conflict.hint-line,
          #hp-sudoku-container .hp-cell.hint-conflict.hint-match {
            background:#ffc7cf !important;
            color:#ED1B24 !important;
          }

          #hp-sudoku-container .hp-cell.given.is-wrong,
          #hp-sudoku-container .hp-cell.given.hint-conflict,
          #hp-sudoku-container .hp-cell.given.is-wrong.hint-line,
          #hp-sudoku-container .hp-cell.given.is-wrong.hint-match,
          #hp-sudoku-container .hp-cell.given.hint-conflict.hint-line,
          #hp-sudoku-container .hp-cell.given.hint-conflict.hint-match {
            background:#f4a3af !important;
          }

          #hp-sudoku-container .hp-cell.is-wrong .hp-value,
          #hp-sudoku-container .hp-cell.hint-conflict .hp-value {
            color:#ED1B24 !important;
          }

          #hp-sudoku-container .hp-note-box,
          #hp-sudoku-container .hp-n-val {
            color:#333 !important;
            font-weight:800 !important;
          }

          #hp-sudoku-container .hp-cell.is-right {
            background:#e3f7ec !important;
          }

          #hp-sudoku-container .hp-btn-grid .hp-btn.hint-complete {
            background:#e6e8eb !important;
            border-color:#c4cbd3 !important;
            color:#7d8792 !important;
            box-shadow:none !important;
            cursor:pointer !important;
          }

          #hp-sudoku-container .hp-action-grid {
            display:grid !important;
            grid-template-columns:repeat(2, minmax(0, 1fr)) !important;
            gap:10px !important;
          }

          @media (max-width: 900px) {
            #hp-sudoku-container .hp-rs-top-area {
              display:grid;
              grid-template-columns:minmax(0, 1fr) auto;
              align-items:start;
              justify-items:stretch;
              gap:10px;
              padding:10px 12px;
            }

            #hp-sudoku-container .hp-help-top-btn {
              justify-self:end;
              align-self:start;
            }

            #hp-sudoku-container .hp-rs-level-panel {
              justify-self:start;
              width:100%;
            }

            #hp-sudoku-container .hp-timer-toolbar-row {
              width:100%;
              justify-content:center;
              gap:6px;
              margin:0 0 10px;
              height:32px;
            }

            #hp-sudoku-container .hp-timer-toolbar-row .hp-timer-area {
              height:32px;
              min-height:32px;
              justify-content:center;
              gap:6px;
              flex:0 1 auto;
            }

            #hp-sudoku-container .hp-timer-toolbar-row .hp-timer-display {
              font-size:18px;
              min-width:auto;
              text-align:center;
            }

            #hp-sudoku-container .hp-timer-toolbar-row .hp-btn-sm {
              height:30px;
              min-height:30px;
              width:30px;
              padding:0;
              font-size:0.9rem;
            }

            #hp-sudoku-container .hp-timer-toolbar-row .hp-timer-toggle img,
            #hp-sudoku-container .hp-timer-toolbar-row .hp-tools-toggle img {
              max-width:18px;
              max-height:18px;
            }

            #hp-sudoku-container .hp-timer-toolbar-row .hp-tools-toggle {
              width:30px;
              height:30px;
            }

            #hp-sudoku-container .hp-rs-level-panel {
              width:100%;
              height:auto;
              min-height:38px;
              justify-content:center;
              gap:8px;
              min-width:0;
            }

            #hp-sudoku-container .hp-rs-level-title {
              font-size:14px;
              flex:0 1 auto;
              min-width:0;
            }

            #hp-sudoku-container .hp-rs-level-panel .hp-mode-switch {
              grid-template-columns:repeat(${availableModes.length}, minmax(0, 1fr)) !important;
              gap:6px !important;
              width:min(100%, 320px) !important;
            }

            #hp-sudoku-container .hp-rs-tools {
              grid-template-columns:repeat(4, minmax(0, 1fr)) !important;
              gap:5px !important;
            }

            #hp-sudoku-container .hp-rs-level-panel {
              display:grid;
              grid-template-rows:auto auto;
              justify-items:start;
              align-items:start;
              gap:6px;
              width:100%;
            }

            #hp-sudoku-container .hp-rs-level-title {
              justify-self:center;
              width:100%;
              text-align:center;
            }

            #hp-sudoku-container .hp-rs-level-panel .hp-mode-switch-wrap {
              justify-self:start;
              width:100%;
              max-width:320px;
            }

            #hp-sudoku-container .hp-help-top-btn {
              justify-self:end;
              width:auto;
            }

            #hp-sudoku-container .hp-timer-toolbar-row {
              justify-content:space-between;
            }

            #hp-sudoku-container .hp-timer-toolbar-row .hp-timer-area {
              justify-content:flex-start;
            }

            #hp-sudoku-container .hp-rs-tools {
              justify-items:center;
              grid-template-columns:repeat(3, minmax(0, 1fr)) !important;
              gap:8px !important;
            }

            #hp-sudoku-container .hp-rs-tools .hp-tool-btn {
              width:100%;
              max-width:150px;
            }

            #hp-sudoku-container .hp-rs-level-panel .hp-mode-btn,
            #hp-sudoku-container .hp-rs-tools .hp-tool-btn {
              min-height:38px !important;
              padding:7px 4px !important;
              border-radius:14px !important;
              font-size:0.72rem !important;
              line-height:1.05 !important;
              white-space:nowrap !important;
            }

            #hp-sudoku-container .hp-rs-right {
              margin-top:0;
              align-self:flex-start;
            }
          }

          @media (max-width: 480px) {
            #hp-sudoku-container .hp-rs-top-area {
              padding:10px 8px;
              gap:8px;
              margin:0 0 6px;
            }

            #hp-sudoku-container .hp-btn-grid {
              display:grid;
              grid-template-columns:repeat(3, minmax(0, 1fr));
              gap:10px;
              width:100%;
              margin:0 0 12px;
            }

            #hp-sudoku-container .hp-btn-grid .hp-btn {
              width:auto !important;
              height:58px !important;
              min-height:58px !important;
              aspect-ratio:auto !important;
              line-height:1 !important;
              font-size:1rem !important;
            }

            #hp-sudoku-container .hp-rs-top-timer {
              height:34px;
            }

            #hp-sudoku-container .hp-rs-top-timer .hp-timer-area {
              height:34px;
              min-height:34px;
              display:flex;
              gap:6px;
            }

            #hp-sudoku-container .hp-rs-top-timer .hp-timer-display {
              font-size:20px;
              min-width:98px;
              height:34px;
              text-align:center;
            }

            #hp-sudoku-container .hp-rs-top-timer .hp-timer-controls {
              height:34px;
              gap:6px;
            }

            #hp-sudoku-container .hp-rs-top-timer .hp-btn-sm {
              font-size:.95rem;
              width:32px;
              height:32px;
              min-height:32px;
              padding:0;
            }

            #hp-sudoku-container .hp-rs-level-panel {
              display:grid;
              grid-template-columns:auto;
              grid-template-rows:auto auto;
              justify-items:center;
              align-items:center;
              gap:8px;
              padding:0;
              width:100%;
              height:auto;
              min-height:auto;
            }

            #hp-sudoku-container .hp-rs-level-panel .hp-mode-switch-wrap {
              order:1;
              width:auto;
              max-width:100%;
              flex:none;
              min-width:0;
              height:auto;
              min-height:auto;
            }

            #hp-sudoku-container .hp-rs-level-panel .hp-mode-switch {
              height:auto !important;
              gap:5px !important;
              width:auto !important;
            }

            #hp-sudoku-container .hp-rs-level-title {
              order:2;
              font-size:14px;
              text-align:center;
              margin-bottom:0;
              height:auto;
              min-height:auto;
              flex:none;
            }

            #hp-sudoku-container .hp-rs-level-panel .hp-mode-btn,
            #hp-sudoku-container .hp-rs-tools .hp-tool-btn {
              font-size:0.72rem !important;
              padding-left:4px !important;
              padding-right:4px !important;
            }

            #hp-sudoku-container .hp-rs-level-panel .hp-mode-btn {
              height:32px !important;
              min-height:32px !important;
              border-radius:12px !important;
            }
          }

          @media (max-width: 768px) {
            #hp-sudoku-container .hp-btn-grid {
              grid-template-columns:repeat(3, minmax(0, 1fr));
            }

            #hp-sudoku-container .hp-btn-grid .hp-btn {
              height:58px;
              min-height:58px;
              max-height:58px;
              aspect-ratio:auto;
            }
          }
        

          /* =========================================================
             TEST-ONLY MOBILE KEYPAD HEIGHT OVERRIDE
             Requires Squarespace test post container:
             <div id="hp-sudoku-container" class="hp-sudoku-test">
             Keeps the original 3-column width but shortens button height.
             ========================================================= */

          #hp-sudoku-container.hp-sudoku-test .hp-btn-grid {
            display:grid !important;
            grid-template-columns:repeat(3, minmax(0, 1fr)) !important;
            grid-auto-rows:58px !important;
            gap:10px !important;
            width:100% !important;
            height:auto !important;
            align-items:stretch !important;
          }

          #hp-sudoku-container.hp-sudoku-test .hp-btn-grid .hp-btn {
            box-sizing:border-box !important;
            width:auto !important;
            min-width:0 !important;
            height:58px !important;
            min-height:58px !important;
            max-height:58px !important;
            padding:0 !important;
            display:flex !important;
            align-items:center !important;
            justify-content:center !important;
            line-height:1 !important;
            font-size:1rem !important;
            aspect-ratio:auto !important;
          }
</style>

        ${pageData?.puzzleDate ? `
     <div class="hp-puzzle-date">
            ${escapeHtml(formatPuzzleDate(pageData.puzzleDate))}
          </div>
        ` : ""}

        <div class="hp-rs-top-area">
          <div class="hp-rs-level-panel">
            <div class="hp-mode-switch-wrap">
              <div class="hp-mode-switch" role="tablist" aria-label="Choose Sudoku difficulty">
                ${availableModes.map(mode => {
                  const label = mode.charAt(0).toUpperCase() + mode.slice(1);
                  return `<button class="hp-mode-btn ${currentMode === mode ? "active" : ""}" data-mode="${escapeHtml(mode)}" role="tab" aria-selected="${currentMode === mode ? "true" : "false"}">${escapeHtml(label)}</button>`;
                }).join("")}
              </div>
            </div>
            <div class="hp-rs-level-title">Choose Your Level</div>
          </div>

          <button class="hp-help-top-btn" data-a="help" type="button">Help</button>
        </div>

        <div class="hp-layout">
          <div class="hp-col-left">
            <div class="hp-grid" id="hp-board" role="grid" aria-label="${escapeHtml(cfg.boardAria)}"></div>
          </div>

          <div class="hp-col-right hp-rs-right">
            <div class="hp-timer-toolbar-row">
              <div class="hp-timer-area" aria-label="Timer">
                <span class="hp-timer-display" id="hp-timer">00:00:00</span>
                <div class="hp-timer-controls">
                  <button class="hp-btn-sm hp-timer-toggle" id="hp-timer-toggle" data-a="t-start" aria-label="Start timer" title="Start" type="button">
                    <img id="hp-timer-toggle-icon" src="${TIMER_PLAY_ICON}" alt="">
                  </button>
                </div>
              </div>
              <button class="hp-tools-toggle" id="hp-tools-toggle" data-a="tools-toggle" type="button" aria-expanded="false" aria-controls="hp-tools-tray" aria-label="Open tools" title="Open tools">
                <img id="hp-tools-toggle-icon" src="${TOOLS_CLOSED_ICON}" alt="">
              </button>
            </div>

            <div class="hp-tools-tray" id="hp-tools-tray" aria-hidden="true">
              <div class="hp-puzzle-tools hp-rs-tools" aria-label="Sudoku tools">
                <button class="hp-tool-btn hint-toggle" id="hp-hints-btn" data-a="hints-toggle" type="button" aria-pressed="false">Hints: OFF</button>
                <button class="hp-tool-btn reveal" id="hp-check-toggle-btn" data-a="check-toggle" type="button" aria-pressed="false">Check: OFF</button>
                <button class="hp-tool-btn reveal" data-a="reveal-cell" type="button">Reveal Cell</button>
              </div>
              <div class="hp-stat hidden" id="hp-stat" aria-live="polite">Tap a cell to begin</div>
            </div>

            <div class="hp-btn-grid" aria-label="Number pad">
              ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="hp-btn" data-n="${n}" aria-label="Enter ${n}">${n}</button>`).join("")}
            </div>

            <div class="hp-action-grid">
              <button class="hp-btn-sm" id="hp-notes-btn" aria-pressed="false">✎ Notes: OFF</button>
              <button class="hp-btn-sm" data-a="erase" aria-label="Erase cell">⌫ Erase</button>

              <button class="hp-btn-sm" data-a="reset-board" aria-label="Reset puzzle">Reset Puzzle</button>
              <button class="hp-btn-sm reveal" data-a="reveal-answer" aria-label="Reveal puzzle">Reveal Puzzle</button>
            </div>

            <p style="text-align:center; font-size:11px; color:#999; margin-top:10px;">
              Use Keyboard Arrows or Numbers
            </p>
          </div>
        </div>

        <div class="hp-overlay" id="hp-help-overlay" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Sudoku">
            <h3>How to Play Sudoku</h3>
            <div class="hp-help-modal-content">
              <span class="hp-help-line"><strong>Goal:</strong> Fill every empty cell with a number from 1 to 9.</span>
              <span class="hp-help-line"><strong>Rows:</strong> Each row must contain the numbers 1 through 9 without repeats.</span>
              <span class="hp-help-line"><strong>Columns:</strong> Each column must contain the numbers 1 through 9 without repeats.</span>
              <span class="hp-help-line"><strong>Boxes:</strong> Each 3×3 box must contain the numbers 1 through 9 without repeats.</span>
              <span class="hp-help-line"><strong>Notes:</strong> Turn notes on to place small possible numbers in a cell.</span>
              <span class="hp-help-line"><strong>Hints:</strong> Turn hints on to highlight the selected row/column, matching visible numbers, and duplicate conflicts.</span>
            </div>
            <div class="hp-modal-actions">
              <button class="hp-link-btn full secondary" data-a="close-help">Back to Puzzle</button>
            </div>
          </div>
        </div>

        <div class="hp-overlay" id="hp-overlay" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Puzzle complete">
            <div id="hp-overlay-icon" style="font-size:28px; line-height:1;">🎉 </div>
            <h3 id="hp-overlay-title">${escapeHtml(cfg.solvedTitle)}</h3>

            <div class="hp-badges">
              <span class="hp-badge" id="hp-badge-id"></span>
              <span class="hp-badge" id="hp-badge-time"></span>
            </div>

            <p id="hp-overlay-text">${escapeHtml(cfg.solvedText)}</p>

            <div class="hp-modal-actions">
              <a class="hp-link-btn secondary" href="${escapeHtml(LINK_MORE_ONLINE)}">More Online Puzzles</a>
              <a class="hp-link-btn primary" href="${escapeHtml(LINK_SHOP)}">Get Puzzle Books</a>

              <button class="hp-link-btn" data-a="share">Share</button>
              <button class="hp-link-btn" data-a="close-solved">Back to Puzzle</button>

              <button class="hp-link-btn full danger" data-a="reset-board">Reset Puzzle</button>
            </div>

            <small id="hp-overlay-footer">${escapeHtml(cfg.footer)}</small>
          </div>
        </div>
      `;
      boardEl = mount.querySelector("#hp-board");
      statEl = mount.querySelector("#hp-stat");
      timerEl = mount.querySelector("#hp-timer");
      timerToggleBtn = mount.querySelector("#hp-timer-toggle");
      timerToggleIcon = mount.querySelector("#hp-timer-toggle-icon");
      notesBtn = mount.querySelector("#hp-notes-btn");
      overlayEl = mount.querySelector("#hp-overlay");
      helpOverlayEl = mount.querySelector("#hp-help-overlay");
      hintsBtn = mount.querySelector("#hp-hints-btn");
      checkToggleBtn = mount.querySelector("#hp-check-toggle-btn");
      toolsToggleBtn = mount.querySelector("#hp-tools-toggle");
      toolsToggleIcon = mount.querySelector("#hp-tools-toggle-icon");
      toolsTrayEl = mount.querySelector("#hp-tools-tray");
      badgeIdEl = mount.querySelector("#hp-badge-id");
      badgeTimeEl = mount.querySelector("#hp-badge-time");
      overlayIconEl = mount.querySelector("#hp-overlay-icon");
      overlayTitleEl = mount.querySelector("#hp-overlay-title");
      overlayTextEl = mount.querySelector("#hp-overlay-text");
      overlayFooterEl = mount.querySelector("#hp-overlay-footer");

      toolsOpen = false;
      updateToolsTray();
      updateTimerUI();
      buildBoard();
      bindUIEvents();
      updateInstructionText();
      applyTestMobileKeypadSizing();

      const state = getState();
      if ((state.solved || state.revealed) && !state.overlaySeen) {
        showOverlay();
      }
    }

    function resetCurrentPuzzle() {
      const state = getState();

      if (!confirm("Clear Board?")) return;

      state.cells.forEach(c => {
        c.value = "";
        c.notes.fill(false);
      });

      cells.forEach((c, i) => {
        renderCell(i);
        c.el.classList.remove("is-wrong", "is-right", "selected", "hint-line", "hint-match", "hint-conflict");
      });

      selected = null;

      state.solved = false;
      state.revealed = false;
      state.solvedAt = "";
      state.revealedAt = "";
      state.overlaySeen = false;
      state.elapsed = 0;

      pauseTimer(false);
      updateTimerUI();
      hideOverlay();

      notesOn = false;
      hintsOn = false;
      checkOn = false;
      updateHintsButton();
      updateCheckButton();
      notesBtn.textContent = "✎ Notes: OFF";
      notesBtn.classList.remove("active");
      notesBtn.setAttribute("aria-pressed", "false");

      statEl.textContent = "Tap a cell to begin";
      saveCurrentState();
    }

    function checkCurrentPuzzle() {
      const state = getState();
      if (isFinished()) return;

      clearCheckMarks();

      cells.forEach((c, i) => {
        if (!c.given && state.cells[i].value) {
          if (state.cells[i].value === getConfig().solution[i]) {
            c.el.classList.add("is-right");
          } else {
            c.el.classList.add("is-wrong");
          }
        }
      });

      if (computeSolved()) showSolved();
    }

    function shareCurrentPuzzle() {
      const cfg = getConfig();
      const state = getState();

      const shareData = {
        title: cfg.shareTitle(cfg.puzzleId),
        text: state.solved
          ? cfg.shareSolvedText(cfg.puzzleId, formatTime(state.elapsed))
          : state.revealed
            ? cfg.shareRevealedText(cfg.puzzleId)
            : cfg.sharePlayingText(cfg.puzzleId),
        url: window.location.href
      };

      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        try {
          navigator.clipboard.writeText(window.location.href);
          statEl.textContent = "Link copied! 📋 ";
        } catch {
          statEl.textContent = "Copy the link from your address bar 🙂 ";
        }
      }
    }

    function switchMode(nextMode) {
      if (!PUZZLES[nextMode] || nextMode === currentMode) return;

      pauseTimer(true);

      if (cells[selected]?.el) cells[selected].el.classList.remove("selected");
      selected = null;

      currentMode = nextMode;
      hintsOn = false;
      checkOn = false;
      saveTick = 0;
      injectSchema();
      renderUI();

      const state = getState();
      if (state.running && !state.solved && !state.revealed) {
        startTimer();
      }
    }

    function bindUIEvents() {
      mount.querySelectorAll("[data-mode]").forEach(btn => {
        btn.addEventListener("click", () => {
          switchMode(btn.dataset.mode);
        });
      });

      if (mountClickHandler) {
        mount.removeEventListener("click", mountClickHandler);
      }

      mountClickHandler = (e) => {
        const link = e.target.closest("a[href]");
        if (link) return;

        const nBtn = e.target.closest("[data-n]");
        if (nBtn) {
          handleInput(parseInt(nBtn.dataset.n, 10));
          return;
        }

        const aBtn = e.target.closest("[data-a]");
        if (!aBtn) return;

        const state = getState();
        const a = aBtn.dataset.a;

        if (a === "tools-toggle") {
          toolsOpen = !toolsOpen;
          updateToolsTray();
          return;
        }

        if (a === "erase") {
          handleInput(0);
          return;
        }

        if (a === "clear") {
          clearCheckMarks();
          checkOn = false;
          updateCheckButton();
          statEl.textContent = isFinished() ? "Answer revealed." : "Check highlights cleared.";
          return;
        }

        if (a === "help") {
          if (helpOverlayEl) {
            helpOverlayEl.classList.add("on");
            helpOverlayEl.setAttribute("aria-hidden", "false");
          }
          return;
        }

        if (a === "close-help") {
          if (helpOverlayEl) {
            helpOverlayEl.classList.remove("on");
            helpOverlayEl.setAttribute("aria-hidden", "true");
          }
          return;
        }

        if (a === "hints-toggle") {
          hintsOn = !hintsOn;
          updateHintsButton();
          applyHintHighlights();
          updateInstructionText();
          return;
        }

        if (a === "check-toggle") {
          checkOn = !checkOn;
          updateCheckButton();
          if (checkOn) {
            checkCurrentPuzzle();
            statEl.textContent = "Check turned on.";
          } else {
            clearCheckMarks();
            statEl.textContent = "Check turned off.";
          }
          updateInstructionText();
          return;
        }

        if (a === "reveal-cell") {
          revealSelectedCell();
          return;
        }

        if (a === "t-start") {
          startTimer();
          return;
        }

        if (a === "t-pause") {
          pauseTimer(true);
          return;
        }

        if (a === "t-reset") {
          pauseTimer(false);
          state.elapsed = 0;
          updateTimerUI();
          saveCurrentState();
          return;
        }

        if (a === "reset-board") {
          resetCurrentPuzzle();
          return;
        }

        if (a === "reveal-answer") {
          revealAnswer();
          return;
        }

        if (a === "check") {
          checkOn = true;
          updateCheckButton();
          checkCurrentPuzzle();
          return;
        }

        if (a === "close-solved") {
          hideOverlay();
          saveCurrentState();
          return;
        }

        if (a === "share") {
          shareCurrentPuzzle();
        }
      };

      mount.addEventListener("click", mountClickHandler);

      if (notesClickHandler && notesBtn) {
        notesBtn.removeEventListener("click", notesClickHandler);
      }

      notesClickHandler = () => {
        if (isFinished()) return;
        notesOn = !notesOn;
        notesBtn.textContent = notesOn ? "✎ Notes: ON" : "✎ Notes: OFF";
        notesBtn.classList.toggle("active", notesOn);
        notesBtn.setAttribute("aria-pressed", notesOn ? "true" : "false");
      };

      notesBtn.addEventListener("click", notesClickHandler);

      if (overlayClickHandler && overlayEl) {
        overlayEl.removeEventListener("click", overlayClickHandler);
      }

      overlayClickHandler = (e) => {
        if (e.target === overlayEl) hideOverlay();
        if (e.target === helpOverlayEl) {
          helpOverlayEl.classList.remove("on");
          helpOverlayEl.setAttribute("aria-hidden", "true");
        }
      };

      overlayEl.addEventListener("click", overlayClickHandler);
      if (helpOverlayEl) helpOverlayEl.addEventListener("click", overlayClickHandler);
    }

    keydownHandler = (e) => {
      if (!container.isConnected) return;
      if (!boardEl) return;

      if (helpOverlayEl && helpOverlayEl.classList.contains("on")) {
        if (e.key === "Escape") {
          helpOverlayEl.classList.remove("on");
          helpOverlayEl.setAttribute("aria-hidden", "true");
        }
        return;
      }

      if (overlayEl && overlayEl.classList.contains("on")) {
        if (e.key === "Escape") hideOverlay();
        return;
      }

      if (isFinished()) return;
      if (selected === null) return;
      if (!container.contains(document.activeElement) && !container.contains(e.target)) return;

      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        handleInput(parseInt(e.key, 10));
      }

      if (e.key === "Backspace" || e.key === "0" || e.key === "Delete") {
        e.preventDefault();
        handleInput(0);
      }

      const r = Math.floor(selected / 9);
      const c = selected % 9;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        cells[Math.max(0, r - 1) * 9 + c].el.click();
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        cells[Math.min(8, r + 1) * 9 + c].el.click();
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        cells[r * 9 + Math.max(0, c - 1)].el.click();
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        cells[r * 9 + Math.min(8, c + 1)].el.click();
      }
    };

    document.addEventListener("keydown", keydownHandler);

    beforeUnloadHandler = () => {
      const state = getState();
      if (state.running) {
        const now = Date.now();
        state.elapsed += (now - lastTick);
        lastTick = now;
      }
      saveCurrentState();
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    window.addEventListener("resize", applyTestMobileKeypadSizing);

    // =========================================================
    // INIT
    // =========================================================
    injectSchema();
    renderUI();

    if (getState().running && !getState().solved && !getState().revealed) {
      startTimer();
    }
  }
};

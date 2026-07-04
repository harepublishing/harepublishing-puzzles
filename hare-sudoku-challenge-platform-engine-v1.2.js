/* =========================================================
   HARE PUBLISHING DAILY SUDOKU CHALLENGE PLATFORM ENGINE
   Version 1.2

   Platform version of the unified Sudoku engine for Sudoku Challenge.
   - Receives one Sudoku Challenge puzzle from the platform page
   - Single Challenge mode only; no difficulty selector
   - Preserves existing production localStorage keys:
     hp2_sdc_
   - Emits shared Hare Puzzle Platform state-change events
   - Injects platform-standard Game schema
   ========================================================= */

window.HareSudokuChallengePlatformEngine = {
  init({
    containerId = "hp-sudoku-container",
    dataId = "hp-sudoku-data",
    dataObject = window.HareSudokuData
  } = {}) {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error("HareSudokuChallengePlatformEngine: puzzle container missing.");
      return;
    }

    // Safety guard: this production engine should only mount the new unified Sudoku container.
    // It must not initialize older live Sudoku Challenge or Regular Sudoku posts.
    if (!container.classList.contains("hp-sudoku")) {
      console.warn("HareSudokuChallengePlatformEngine: container is not marked hp-sudoku. Skipping mount.");
      return;
    }

    // If this same platform container is being re-used for in-page puzzle navigation,
    // clean up the previous engine instance before mounting the next one. Without this,
    // click handlers stack up after several in-page loads and browser confirm dialogs
    // can appear to flash or require multiple clicks.
    if (typeof container.__hpSudokuPlatformCleanup === "function") {
      try {
        container.__hpSudokuPlatformCleanup();
      } catch (err) {
        console.warn("HareSudokuChallengePlatformEngine: previous instance cleanup failed.", err);
      }
    }

    if (container.dataset.hpSudokuMounted === "true") {
      delete container.dataset.hpSudokuMounted;
    }

    container.dataset.hpSudokuMounted = "true";

    const mount = container.querySelector(".hp-mount");
    if (!mount) {
      console.error("HareSudokuChallengePlatformEngine: .hp-mount element missing inside puzzle container.");
      return;
    }

    const yearEl = document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const ICON_BASE_URL = "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@images-v1.8/icons/";
    const KEYPAD_ICON_BASE_URL = "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@images-v2.0/icons/";
    const KEYPAD_NOTES_OFF_ICON = `${KEYPAD_ICON_BASE_URL}notes-off-button.svg`;
    const KEYPAD_NOTES_ON_ICON = `${KEYPAD_ICON_BASE_URL}notes-on-button.svg`;
    const KEYPAD_ERASE_ICON = `${KEYPAD_ICON_BASE_URL}erase-button.svg`;
    const KEYPAD_UNDO_ICON = `${KEYPAD_ICON_BASE_URL}undo-button.svg`;
    const HELP_BUTTON_ICON = `${ICON_BASE_URL}help-button.svg`;
    const TIMER_PLAY_ICON = `${ICON_BASE_URL}timer-play-button.svg`;
    const TIMER_PAUSE_ICON = `${ICON_BASE_URL}timer-pause-button.svg`;
    const NOTES_OFF_ICON = `${ICON_BASE_URL}notes-off-button.svg`;
    const NOTES_ON_ICON = `${ICON_BASE_URL}notes-on-button.svg`;
    const ERASE_BUTTON_ICON = `${ICON_BASE_URL}erase-button.svg`;
    const TOOLS_CLOSED_ICON = `${ICON_BASE_URL}toolbar-closed-button.svg`;
    const TOOLS_OPEN_ICON = `${ICON_BASE_URL}toolbar-open-button.svg`;

    const dataEl = document.getElementById(dataId);
    let pageData = dataObject || null;

    if (!pageData && dataEl) {
      try {
        pageData = JSON.parse(dataEl.textContent || "{}");
      } catch (err) {
        console.error("HareSudokuChallengePlatformEngine: puzzle data block contains invalid JSON.", err);
      }
    }

    const LINK_MORE_ONLINE = "/puzzlers-hub";
    const LINK_SHOP = "https://harepublishing.com/shop";
    const Core = window.HarePuzzleCore || null;
    const DEFAULT_MODE = "challenge";
    const PUZZLE_TYPE = "sudoku-challenge";

    const SUDOKU_MODE_ORDER = ["challenge"];

    const MODE_META = {
      challenge: {
        mode: "challenge",
        label: "Sudoku Challenge",
        boardAria: "Sudoku Challenge Board",
        schemaName: (id) => `Sudoku Challenge #${id}`,
        schemaDescription: (id) => `Play Sudoku Challenge #${id} online from Hare Publishing. This expert-level Sudoku puzzle includes notes, timer, checking, hints, reveal, and progress saving.`,
        solvedTitle: "You Solved the Sudoku Challenge!",
        solvedStat: "Sudoku Challenge Solved! 🎉 ",
        solvedText: "Congratulations — you did it! Come back for another Sudoku Challenge, or explore more free online puzzles.",
        revealedText: "Here is the completed Sudoku Challenge. Try another puzzle, or explore more free online puzzles.",
        footer: "Hare Publishing • Sudoku Challenge",
        shareTitle: () => `Sudoku Challenge — Hare Publishing`,
        shareSolvedText: (id, time) => `I solved Sudoku Challenge #${id} in ${time}!`,
        shareRevealedText: (id) => `I revealed the answer for Sudoku Challenge #${id} at Hare Publishing.`,
        sharePlayingText: (id) => `I’m playing Sudoku Challenge #${id} at Hare Publishing!`,
        saveKeyPrefix: "hp2_sdc_"
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
          <strong>Sudoku Challenge Configuration Error:</strong><br>
          ${escapeHtml(message)}
        </div>
      `;
    }

    function normalizeGrid(value) {
      return String(value || "").trim().replace(/0/g, ".");
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
      const sharedPuzzleId = String(data.puzzleId || data.id || source.puzzleId || "").trim();

      const challengeSource = source.challenge || source.daily || source;
      const puzzleId = String(challengeSource.puzzleId || challengeSource.id || sharedPuzzleId || "").trim();
      const puzzle = normalizeGrid(challengeSource.puzzle);
      const solution = normalizeGrid(challengeSource.solution);

      const puzzleDate = String(challengeSource.puzzleDate || challengeSource.date || data.puzzleDate || data.date || "").trim();

      return {
        challenge: {
          ...MODE_META.challenge,
          puzzleId,
          puzzle,
          solution,
          puzzleDate
        }
      };
    }

    const PUZZLES = buildPuzzlesFromData(pageData);

    if (!PUZZLES) {
      showConfigError("Puzzle data is missing. Add window.HareSudokuData before loading the Sudoku engine.");
      return;
    }

    const availableModes = SUDOKU_MODE_ORDER.filter(mode => PUZZLES[mode]);
    if (!availableModes.length) {
      showConfigError("Sudoku Challenge puzzle data is required.");
      return;
    }

    for (const mode of availableModes) {
      const cfg = PUZZLES[mode];
      if (!cfg.puzzleId) {
        showConfigError(`${cfg.label} is missing a puzzleId.`);
        return;
      }
      if (!isValidPuzzleString(cfg.puzzle)) {
        showConfigError(`${cfg.label} #${cfg.puzzleId} must have an 81-character puzzle string using digits 1-9, with 0 or periods for blanks.`);
        return;
      }
      if (!isValidSolutionString(cfg.solution)) {
        showConfigError(`${cfg.label} #${cfg.puzzleId} must have an 81-character solution string using digits 1-9 only.`);
        return;
      }
    }

    const requestedDefaultMode = String(dataObject.defaultMode || DEFAULT_MODE).toLowerCase();
    const defaultMode = availableModes.includes(requestedDefaultMode)
      ? requestedDefaultMode
      : (availableModes.includes(DEFAULT_MODE) ? DEFAULT_MODE : availableModes[0]);

    const hasMultipleModes = availableModes.length > 1;

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
      overlaySeen: false,
      history: []
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

        // Always reopen/return to the puzzle in a paused state.
        // The timer starts again when the player presses Play or selects a cell.
        merged.running = false;

        if (typeof merged.revealed !== "boolean") merged.revealed = false;
        if (typeof merged.overlaySeen !== "boolean") merged.overlaySeen = false;
        if (typeof merged.solvedAt !== "string") merged.solvedAt = "";
        if (typeof merged.revealedAt !== "string") merged.revealedAt = "";
        if (!Array.isArray(merged.cells) || merged.cells.length !== 81) merged.cells = defaultState().cells;
        merged.cells = merged.cells.map(cell => ({
          value: String(cell?.value || ""),
          notes: Array.isArray(cell?.notes) && cell.notes.length === 9 ? cell.notes : Array(9).fill(false)
        }));
        if (!Array.isArray(merged.history)) merged.history = [];
        merged.history = merged.history.slice(-50);
        return merged;
      } catch {
        return defaultState();
      }
    }

    function getPersistableState(state) {
      const cleanState = { ...defaultState(), ...state };

      // IMPORTANT:
      // The permanent save record must stay small and compatible with the
      // older HareRegularSudokuEngine. The old engine saves only puzzle state,
      // not the full undo history. Saving the advanced engine's 50-step history
      // inside hp2_sd_easy_ / hp2_sd_medium_ / hp2_sd_hard_ can exceed browser
      // localStorage limits on Squarespace pages, causing setItem() to fail.
      // When that happens, the puzzle appears to remember progress only until
      // the visitor leaves the page.
      delete cleanState.history;

      cleanState.running = Boolean(cleanState.running);
      cleanState.solved = Boolean(cleanState.solved);
      cleanState.revealed = Boolean(cleanState.revealed);
      cleanState.overlaySeen = Boolean(cleanState.overlaySeen);
      cleanState.elapsed = Number(cleanState.elapsed) || 0;
      cleanState.solvedAt = typeof cleanState.solvedAt === "string" ? cleanState.solvedAt : "";
      cleanState.revealedAt = typeof cleanState.revealedAt === "string" ? cleanState.revealedAt : "";

      if (!Array.isArray(cleanState.cells) || cleanState.cells.length !== 81) {
        cleanState.cells = defaultState().cells;
      }

      cleanState.cells = cleanState.cells.map(cell => ({
        value: String(cell?.value || ""),
        notes: Array.isArray(cell?.notes) && cell.notes.length === 9 ? cell.notes.map(Boolean) : Array(9).fill(false)
      }));

      return cleanState;
    }

    function saveState(mode, state) {
      try {
        localStorage.setItem(getSaveKey(mode), JSON.stringify(getPersistableState(state)));
      } catch (err) {
        console.warn("HareSudokuChallengePlatformEngine: unable to save puzzle progress.", err);
      }
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
    let completionStatusEl = null;
    let timerEl = null;
    let timerToggleBtn = null;
    let timerToggleIcon = null;
    let notesBtn = null;
    let notesToggleIcon = null;
    let undoBtn = null;
    let overlayEl = null;
    let badgeIdEl = null;
    let badgeTimeEl = null;
    let overlayIconEl = null;
    let overlayTitleEl = null;
    let overlayTextEl = null;
    let overlayStatsEl = null;
    let overlayNextPanelEl = null;
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
    let visibilityChangeHandler = null;
    let resizeHandler = null;

    function getConfig() {
      return PUZZLES[currentMode];
    }

    function getState() {
      return states[currentMode];
    }

    function getModeStatus(mode = currentMode) {
      const state = states[mode] || defaultState();
      const hasCells = Array.isArray(state.cells) && state.cells.some(cell => String(cell?.value || "").trim());
      const hasNotes = Array.isArray(state.cells) && state.cells.some(cell => Array.isArray(cell?.notes) && cell.notes.some(Boolean));

      if (state.solved) return "solved";
      if (state.revealed) return "revealed";
      if (hasCells || hasNotes || Number(state.elapsed || 0) > 0) return "in-progress";
      return "not-started";
    }

    function emitSudokuStateChange(mode = currentMode, action = "save") {
      const cfg = PUZZLES[mode];
      if (!cfg) return;

      const detail = {
        puzzleType: PUZZLE_TYPE,
        puzzleId: cfg.puzzleId,
        mode,
        storageKey: `${cfg.saveKeyPrefix}${cfg.puzzleId}`,
        status: getModeStatus(mode),
        action
      };

      if (Core && typeof Core.emitStateChange === "function") {
        Core.emitStateChange(detail);
      } else {
        window.dispatchEvent(new CustomEvent("hare:puzzle-state-change", { detail }));
        window.dispatchEvent(new CustomEvent("hare:sudoku-state-change", { detail }));
      }
    }

    function saveCurrentState(action = "save") {
      saveState(currentMode, getState());
      emitSudokuStateChange(currentMode, action);
    }

    function formatTime(ms) {
      const s = Math.max(0, Math.floor(ms / 1000));
      return new Date(s * 1000).toISOString().substr(11, 8);
    }

    function getPuzzleDisplayName(cfg = getConfig()) {
      const id = String(cfg?.puzzleId || "").trim();
      const baseName = cfg?.label || "Sudoku";
      return id ? `${baseName} #${id}` : baseName;
    }

    function getShareMessage(cfg, state) {
      const displayName = getPuzzleDisplayName(cfg);

      if (state.solved) {
        return `I solved ${displayName} in ${formatTime(state.elapsed)}!`;
      }

      if (state.revealed) {
        return `I revealed the answer for ${displayName} at Hare Publishing.`;
      }

      return `I’m playing ${displayName}!`;
    }


    function updateCompletionStatus() {
      if (!completionStatusEl) return;

      const cfg = getConfig();
      const state = getState();
      const displayName = getPuzzleDisplayName(cfg);

      completionStatusEl.classList.remove("show", "solved", "revealed");
      completionStatusEl.setAttribute("aria-hidden", "true");
      completionStatusEl.textContent = "";

      if (state.solved) {
        completionStatusEl.textContent = `🏆 Solved • ${displayName}`;
        completionStatusEl.classList.add("show", "solved");
        completionStatusEl.setAttribute("aria-hidden", "false");
        return;
      }

      if (state.revealed) {
        completionStatusEl.textContent = `✓ Revealed • ${displayName}`;
        completionStatusEl.classList.add("show", "revealed");
        completionStatusEl.setAttribute("aria-hidden", "false");
      }
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

    function updateNotesButton() {
      if (!notesBtn) return;
      notesBtn.classList.toggle("active", notesOn);
      notesBtn.setAttribute("aria-pressed", notesOn ? "true" : "false");
      notesBtn.setAttribute("aria-label", notesOn ? "Turn notes off" : "Turn notes on");
      notesBtn.setAttribute("title", notesOn ? "Notes on" : "Notes off");

      const icon = notesBtn.querySelector(".hp-keypad-action-icon");
      if (icon) {
        icon.src = notesOn ? KEYPAD_NOTES_ON_ICON : KEYPAD_NOTES_OFF_ICON;
      }
    }

    function cloneCellsForHistory(cellsToClone) {
      return cellsToClone.map(cell => ({
        value: String(cell?.value || ""),
        notes: Array.isArray(cell?.notes) && cell.notes.length === 9 ? [...cell.notes] : Array(9).fill(false)
      }));
    }

    function pushUndoState(label = "input") {
      const state = getState();
      if (isFinished()) return;
      if (!Array.isArray(state.history)) state.history = [];

      state.history.push({
        label,
        cells: cloneCellsForHistory(state.cells),
        selected
      });

      if (state.history.length > 50) {
        state.history = state.history.slice(-50);
      }

      updateUndoButton();
    }

    function updateUndoButton() {
      if (!undoBtn) return;
      const state = getState();
      const hasUndo = Array.isArray(state.history) && state.history.length > 0 && !isFinished();
      undoBtn.disabled = !hasUndo;
      undoBtn.classList.toggle("disabled", !hasUndo);
      undoBtn.setAttribute("aria-disabled", hasUndo ? "false" : "true");
      undoBtn.setAttribute("title", hasUndo ? "Undo" : "Nothing to undo");
    }

    function undoLastAction() {
      const state = getState();
      if (isFinished()) return;
      if (!Array.isArray(state.history) || !state.history.length) {
        updateUndoButton();
        return;
      }

      const previous = state.history.pop();
      if (!previous || !Array.isArray(previous.cells) || previous.cells.length !== 81) {
        updateUndoButton();
        return;
      }

      clearCheckMarks();

      state.cells = cloneCellsForHistory(previous.cells);
      selected = typeof previous.selected === "number" ? previous.selected : selected;

      cells.forEach((cell, index) => {
        cell.el.classList.remove("selected", "is-wrong", "is-right", "hint-line", "hint-match", "hint-conflict");
        renderCell(index);
      });

      if (selected !== null && cells[selected]?.el) {
        cells[selected].el.classList.add("selected");
      }

      applyHintHighlights();
      updateInstructionText();
      updateNumberPadHintStates();
      updateUndoButton();
      if (checkOn) checkCurrentPuzzle();
      saveCurrentState();
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
      const collectionUrl = window.HareSudokuChallengePlayUrl
        ? new URL(window.HareSudokuChallengePlayUrl, window.location.origin).href
        : "https://www.harepublishing.com/sudoku-challenge";
      const publishedDate = String(cfg.puzzleDate || pageData?.puzzleDate || pageData?.date || "").trim();

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": cfg.schemaName(cfg.puzzleId),
        "description": typeof cfg.schemaDescription === "function" ? cfg.schemaDescription(cfg.puzzleId) : cfg.schemaDescription,
        "genre": "Puzzle",
        "url": pageUrl,
        "inLanguage": "en",
        "datePublished": publishedDate || undefined,
        "copyrightYear": String(nowYear),
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://www.harepublishing.com/"
        },
        "isPartOf": {
          "@type": "CollectionPage",
          "name": "Sudoku Challenge",
          "url": collectionUrl
        }
      };

      Object.keys(schemaData).forEach(key => schemaData[key] === undefined && delete schemaData[key]);

      const script = document.createElement("script");
      script.id = "hp-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }

    function getOverlayStats() {
      if (typeof window.HareSudokuChallengeGetStats === "function") {
        try {
          return window.HareSudokuChallengeGetStats();
        } catch (err) {
          console.warn("Sudoku overlay stats helper failed.", err);
        }
      }
      return { streak: 0, solved: 0, revealed: 0, played: 0 };
    }

    function getModeLabel(mode) {
      return "Sudoku Challenge";
    }


    function hasProgress(modeState) {
      if (!modeState || modeState.solved || modeState.revealed) return false;
      if (Number(modeState.elapsed || 0) > 0) return true;
      if (modeState.startedAt || modeState.lastPlayedAt || modeState.updatedAt) return true;
      if (Array.isArray(modeState.cells)) {
        return modeState.cells.some(cell => {
          if (!cell) return false;
          if (String(cell.value || "").trim()) return true;
          if (Array.isArray(cell.notes) && cell.notes.some(Boolean)) return true;
          return false;
        });
      }
      return false;
    }

    function getModeStatusLabel(mode) {
      const modeState = states[mode] || defaultState();
      if (modeState.solved) return "Solved";
      if (modeState.revealed) return "Revealed";
      if (hasProgress(modeState)) return "In Progress";
      return "Not Started";
    }

    function getModeStatusClass(mode) {
      return getModeStatusLabel(mode).toLowerCase().replace(/\s+/g, "-");
    }

    function getRemainingModeLabels() {
      return availableModes
        .filter(mode => {
          const modeState = states[mode] || defaultState();
          return !modeState.solved && !modeState.revealed;
        })
        .map(getModeLabel);
    }

    function joinList(items) {
      if (!items.length) return "";
      if (items.length === 1) return items[0];
      if (items.length === 2) return `${items[0]} and ${items[1]}`;
      return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
    }

    function getOverlayModeSummaryHtml() {
      return `
        <div class="hp-overlay-mode-summary" aria-label="Sudoku Challenge status">
          ${availableModes.map(mode => {
            const label = getModeLabel(mode);
            const status = getModeStatusLabel(mode);
            const statusClass = getModeStatusClass(mode);
            return `<span class="hp-overlay-mode-pill ${statusClass}"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(status)}</span></span>`;
          }).join("")}
        </div>
      `;
    }

    function renderOverlayStats() {
      if (!overlayStatsEl) return;
      const stats = getOverlayStats();
      overlayStatsEl.innerHTML = `
        <div class="hp-overlay-stat-row">
          <span class="hp-overlay-stat"><span class="material-symbols-outlined" aria-hidden="true">local_fire_department</span><strong>${Number(stats.streak || 0).toLocaleString()}</strong> Day Streak</span>
          <span class="hp-overlay-stat"><span class="material-symbols-outlined" aria-hidden="true">trophy</span><strong>${Number(stats.solved || 0).toLocaleString()}</strong> Solved</span>
          <span class="hp-overlay-stat"><span class="material-symbols-outlined" aria-hidden="true">visibility</span><strong>${Number(stats.revealed || 0).toLocaleString()}</strong> Revealed</span>
          <span class="hp-overlay-stat"><span class="material-symbols-outlined" aria-hidden="true">pending_actions</span><strong>${Number(stats.inProgress || 0).toLocaleString()}</strong> In Progress</span>
          <span class="hp-overlay-stat"><span class="material-symbols-outlined" aria-hidden="true">beenhere</span><strong>${Number(stats.played || 0).toLocaleString()}</strong> Played</span>
        </div>
      `;
    }

    function getChallengeRecommendation() {
      const currentId = String(getConfig()?.puzzleId || "");
      if (typeof window.HareSudokuChallengeGetNextPuzzle === "function") {
        try {
          const next = window.HareSudokuChallengeGetNextPuzzle({ excludePuzzleId: currentId });
          if (next && next.puzzleId) return next;
        } catch (err) {
          console.warn("Sudoku Challenge next-puzzle helper failed.", err);
        }
      }
      return null;
    }

    function renderOverlayNextPanel() {
      if (!overlayNextPanelEl) return;

      const next = getChallengeRecommendation();

      if (next && next.puzzleId) {
        const isInProgress = next.status === "in-progress";
        const actionLabel = isInProgress ? "Continue" : "Play";
        const title = isInProgress ? "Continue where you left off" : "Another Sudoku Challenge is ready";
        const copy = isInProgress
          ? "Pick up where you left off and keep building your streak."
          : "Try another Sudoku Challenge and keep building your streak.";

        overlayNextPanelEl.innerHTML = `
          <div class="hp-overlay-message">
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(copy)}</span>
          </div>
          <div class="hp-overlay-action-row">
            <button class="hp-overlay-action-btn primary-action" type="button" data-a="overlay-next-challenge" data-puzzle-id="${escapeHtml(next.puzzleId)}">
              ${escapeHtml(actionLabel)} Sudoku Challenge #${escapeHtml(next.puzzleId)}
            </button>
            <button class="hp-overlay-action-btn share-action" type="button" data-a="share">Share This Puzzle</button>
          </div>
        `;
        overlayNextPanelEl.hidden = false;
        return;
      }

      overlayNextPanelEl.innerHTML = `
        <div class="hp-overlay-message">
          <strong>You're all caught up!</strong>
          <span>Check back tomorrow for the next Sudoku Challenge.</span>
        </div>
        <div class="hp-overlay-action-row">
          <a class="hp-overlay-action-btn primary-action" href="${escapeHtml((window.HarePlatformNextCta&&window.HarePlatformNextCta().url)||'/membership')}">${escapeHtml((window.HarePlatformNextCta&&window.HarePlatformNextCta().label)||'Unlock the Full Library')}</a>
          <button class="hp-overlay-action-btn share-action" type="button" data-a="share">Share This Puzzle</button>
        </div>
      `;
      overlayNextPanelEl.hidden = false;
    }

    function renderOverlayContent() {
      const cfg = getConfig();
      const state = getState();

      if (!badgeIdEl || !badgeTimeEl || !overlayIconEl || !overlayTitleEl || !overlayTextEl || !overlayFooterEl) return;

      const displayName = getPuzzleDisplayName(cfg);

      badgeIdEl.textContent = displayName;
      badgeTimeEl.textContent = `Time: ${formatTime(state.elapsed)}`;
      renderOverlayStats();

      if (state.solved) {
        overlayIconEl.textContent = "celebration";
        overlayIconEl.setAttribute("aria-label", "Solved");
        overlayTitleEl.textContent = displayName;
        overlayTextEl.textContent = "Solved";
        overlayFooterEl.textContent = cfg.footer;
        renderOverlayNextPanel();
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "visibility";
        overlayIconEl.setAttribute("aria-label", "Revealed");
        overlayTitleEl.textContent = displayName;
        overlayTextEl.textContent = "Revealed";
        overlayFooterEl.textContent = cfg.footer;
        renderOverlayNextPanel();
      }
    }

    function showOverlay() {
      const state = getState();
      renderOverlayContent();
      if (!overlayEl) return;
      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");
      state.overlaySeen = false;
      saveCurrentState(state.solved ? "solved" : "save");
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
      state.overlaySeen = false;
      saveCurrentState("solved");
      renderOverlayContent();
      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");
      statEl.textContent = cfg.solvedStat;
      updateCompletionStatus();
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
      updateCompletionStatus();
      updateNumberPadHintStates();
      saveCurrentState("revealed");
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

      startTimerOnPuzzleInteraction();

      clearCheckMarks();

      pushUndoState("reveal-cell");

      state.cells[selected].value = cfg.solution[selected];
      state.cells[selected].notes.fill(false);
      if (hintsOn) removePeerNotesForValue(selected, parseInt(cfg.solution[selected], 10));
      renderCell(selected);
      updateNumberPadHintStates();
      statEl.textContent = `Revealed Row ${Math.floor(selected / 9) + 1}, Col ${selected % 9 + 1}.`;
      applyHintHighlights();
      if (checkOn) checkCurrentPuzzle();
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

      pushUndoState(num === 0 ? "erase" : notesOn ? "note" : "number");

      clearCheckMarks();

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
      if (checkOn) checkCurrentPuzzle();
      saveCurrentState();

      if (computeSolved()) showSolved();
    }

    function startTimerOnPuzzleInteraction() {
      const state = getState();
      if (!state.running && !state.solved && !state.revealed) {
        startTimer();
      }
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

          startTimerOnPuzzleInteraction();

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

      updateNotesButton();
      updateUndoButton();
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

      updateCompletionStatus();
    }


    function applyMobileKeypadSizing() {
      const shouldShorten = window.matchMedia("(max-width: 900px)").matches;
      const grid = mount.querySelector(".hp-btn-grid");

      if (grid) {
        if (shouldShorten) {
          grid.style.setProperty("display", "grid", "important");
          grid.style.setProperty("grid-template-columns", "repeat(4, minmax(0, 1fr))", "important");
          grid.style.setProperty("gap", "10px", "important");
          grid.style.setProperty("width", "100%", "important");
          grid.style.setProperty("align-items", "stretch", "important");
          grid.style.removeProperty("grid-auto-rows");
        } else {
          ["display", "grid-template-columns", "gap", "width", "align-items", "grid-auto-rows"].forEach(prop => {
            grid.style.removeProperty(prop);
          });
        }
      }

      mount.querySelectorAll(".hp-btn-grid .hp-btn, .hp-btn-grid .hp-keypad-btn, .hp-btn-grid button[data-n]").forEach(btn => {
        if (shouldShorten) {
          btn.style.setProperty("width", "100%", "important");
          btn.style.setProperty("min-width", "0", "important");
          btn.style.setProperty("height", "42px", "important");
          btn.style.setProperty("min-height", "42px", "important");
          btn.style.setProperty("max-height", "42px", "important");
          btn.style.setProperty("padding", "0", "important");
          btn.style.setProperty("margin", "0", "important");
          btn.style.setProperty("display", "flex", "important");
          btn.style.setProperty("align-items", "center", "important");
          btn.style.setProperty("justify-content", "center", "important");
          btn.style.setProperty("line-height", "1", "important");
          btn.style.setProperty("font-size", "20px", "important");
          btn.style.setProperty("aspect-ratio", "auto", "important");
          btn.style.setProperty("box-sizing", "border-box", "important");
        } else {
          ["width", "min-width", "height", "min-height", "max-height", "padding", "margin", "display", "align-items", "justify-content", "line-height", "font-size", "aspect-ratio", "box-sizing"].forEach(prop => {
            btn.style.removeProperty(prop);
          });
        }
      });
    }

    function renderUI() {
      const cfg = getConfig();

mount.innerHTML = `
<style>
  #hp-sudoku-container.hp-sudoku .hp-rs-top-area {
    width: 100%;
    margin: 0 0 18px;
    padding: 8px 16px;
    border: 1px solid #edf2f6;
    border-radius: 16px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-top-area.single-mode {
    justify-content: flex-end;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 30px;
    height: 30px;
    min-height: 30px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    box-shadow: none;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-icon-btn img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    margin: 0;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-icon-btn:hover {
    transform: translateY(-1px);
  }

  /* Help modal: keep the full window inside the viewport and scroll the content when needed. */
  #hp-sudoku-container.hp-sudoku #hp-help-overlay .hp-modal {
    box-sizing: border-box !important;
    width: min(92vw, 620px) !important;
    max-width: 92vw !important;
    max-height: min(84vh, 720px) !important;
    padding: 20px 22px 16px !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-help-overlay .hp-modal h3 {
    margin: 0 0 12px !important;
    line-height: 1.15 !important;
    flex: 0 0 auto !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-help-overlay .hp-help-modal-content {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    padding: 14px 16px !important;
    margin: 0 0 14px !important;
    border: 1px solid #d9e9f6 !important;
    border-radius: 14px !important;
    background: #f8fbfe !important;
    flex: 1 1 auto !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-help-overlay .hp-modal-actions {
    flex: 0 0 auto !important;
    margin-top: 0 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-section-title {
    margin: 10px 0 4px !important;
    font-size: 1rem !important;
    line-height: 1.2 !important;
    font-weight: 800 !important;
    color: #24323d !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-modal-content p,
  #hp-sudoku-container.hp-sudoku .hp-help-modal-content li {
    font-size: 0.92rem !important;
    line-height: 1.35 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-modal-content p {
    margin: 0 0 8px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-list {
    margin: 8px 0 0 !important;
    padding-left: 18px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-modal-content img.hp-help-icon {
    display: inline-block !important;
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    max-width: 24px !important;
    max-height: 24px !important;
    object-fit: contain !important;
    vertical-align: middle !important;
    flex: 0 0 24px !important;
    margin: 0 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-icon-line {
    display: grid !important;
    grid-template-columns: auto minmax(0, 1fr) !important;
    align-items: start !important;
    column-gap: 10px !important;
    row-gap: 0 !important;
    margin: 8px 0 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-icon-line span:last-child {
    min-width: 0 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-icons-pair {
    display: inline-flex !important;
    align-items: center !important;
    gap: 5px !important;
    flex: 0 0 auto !important;
    margin: 0 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-help-icons-pair img.hp-help-icon {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    max-width: 24px !important;
    margin: 0 !important;
  }

  @media (max-width: 480px) {
    #hp-sudoku-container.hp-sudoku #hp-help-overlay .hp-modal {
      width: 94vw !important;
      max-width: 94vw !important;
      max-height: 82vh !important;
      padding: 16px 14px 14px !important;
    }

    #hp-sudoku-container.hp-sudoku #hp-help-overlay .hp-help-modal-content {
      padding: 12px 13px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-help-modal-content p,
    #hp-sudoku-container.hp-sudoku .hp-help-modal-content li {
      font-size: 0.88rem !important;
      line-height: 1.32 !important;
    }
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    width: auto;
    min-width: 0;
    flex: 1 1 auto;
    margin: 0;
    padding: 0;
    height: 44px;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-title {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    height: 44px;
    min-height: 44px;
    font-size: 15px;
    font-weight: 900;
    color: #24323d;
    line-height: 1.1;
    white-space: nowrap;
    margin: 0;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-switch-wrap {
    display: flex;
    align-items: center;
    height: 44px;
    min-height: 44px;
    width: auto;
    max-width: 100%;
    margin: 0;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-switch {
    display: grid !important;
    grid-template-columns: repeat(${availableModes.length}, minmax(82px, 1fr)) !important;
    gap: 8px !important;
    width: auto !important;
    max-width: 440px !important;
    height: 44px !important;
    align-items: center !important;
    margin: 0 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    height: 36px !important;
    min-height: 36px !important;
    padding: 6px 12px !important;
    border-radius: 14px !important;
    font-size: 0.82rem !important;
    line-height: 1.1 !important;
    font-weight: 800 !important;
    background: #fff !important;
    box-shadow: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn[data-mode="easy"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn[data-static-mode="easy"] {
    border: 1px solid #8fd4aa !important;
    color: #2f3337 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn[data-mode="medium"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn[data-static-mode="medium"] {
    border: 1px solid #8bc0e6 !important;
    color: #2f3337 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn[data-mode="hard"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn[data-static-mode="hard"] {
    border: 1px solid #f6c783 !important;
    color: #2f3337 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel.no-challenge .hp-mode-btn[data-mode="medium"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel.no-challenge .hp-mode-btn[data-static-mode="medium"] {
    border-color: #f6c783 !important;
    color: #2f3337 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel.no-challenge .hp-mode-btn[data-mode="hard"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel.no-challenge .hp-mode-btn[data-static-mode="hard"] {
    border-color: #f3a1a1 !important;
    color: #2f3337 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn[data-mode="challenge"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn[data-static-mode="challenge"] {
    border: 1px solid #f3a1a1 !important;
    color: #2f3337 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.active[data-mode="easy"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.active[data-static-mode="easy"] {
    background: #00A54F !important;
    border-color: #00A54F !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.active[data-mode="medium"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.active[data-static-mode="medium"] {
    background: #107FBB !important;
    border-color: #107FBB !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.active[data-mode="hard"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.active[data-static-mode="hard"] {
    background: #F7941C !important;
    border-color: #F7941C !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel.no-challenge .hp-mode-btn.active[data-mode="medium"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel.no-challenge .hp-mode-btn.active[data-static-mode="medium"] {
    background: #F7941C !important;
    border-color: #F7941C !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel.no-challenge .hp-mode-btn.active[data-mode="hard"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel.no-challenge .hp-mode-btn.active[data-static-mode="hard"] {
    background: #ED1B24 !important;
    border-color: #ED1B24 !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.active[data-mode="challenge"],
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.active[data-static-mode="challenge"] {
    background: #ED1B24 !important;
    border-color: #ED1B24 !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.static-mode {
    cursor: default !important;
    pointer-events: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 0 0 12px;
    height: 36px;
  }

  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-area {
    height: 36px;
    min-height: 36px;
    padding: 0;
    margin: 0;
    border: 0;
    box-shadow: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    flex-wrap: nowrap;
    flex: 1 1 auto;
  }

  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-display {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    height: 36px;
    font-size: 19px;
    line-height: 1;
    min-width: auto;
    margin: 0;
    text-align: left;
    font-weight: 600;
    color: #6B2B84;
  }

  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    height: 36px;
  }

  #hp-sudoku-container.hp-sudoku .hp-toolbar-icon-controls {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    height: 36px;
    flex: 0 0 auto;
  }

  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-btn-sm,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-toggle,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-tools-toggle,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-help-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 30px;
    height: 30px;
    min-height: 30px;
    padding: 0;
    border: 0;
    border-radius: 14px;
    background: transparent;
    box-shadow: none;
    cursor: pointer;
  }

  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-toggle img,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-tools-toggle img,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-help-icon-btn img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    margin: 0;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-tools {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 8px !important;
    width: 100% !important;
    margin: 0 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-tools-tray {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transform: translateY(-6px);
    pointer-events: none;
    transition: max-height 0.22s ease, opacity 0.18s ease, transform 0.18s ease;
    margin: 0 0 12px;
  }

  #hp-sudoku-container.hp-sudoku .hp-tools-tray.open {
    max-height: 120px;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
    overflow: visible;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn {
    position: relative;
    background: #fff !important;
    border: 1px solid #b8d6ef !important;
    color: #107FBB !important;
    box-shadow: none !important;
    min-height: 42px !important;
    padding: 7px 5px !important;
    border-radius: 14px !important;
    font-size: 0.78rem !important;
    line-height: 1.08 !important;
    white-space: nowrap !important;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn:hover {
    transform: translateY(-2px);
    z-index: 1;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn.hint-toggle {
    background: #fff !important;
    border-color: #b8d6ef !important;
    color: #107FBB !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn.hint-toggle.active {
    background: #00A54F !important;
    border-color: #00A54F !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-check-toggle-btn.active {
    background: #00A54F !important;
    border-color: #00A54F !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-stat {
    min-height: 52px;
    padding: 16px 10px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
  }

  #hp-sudoku-container.hp-sudoku .hp-stat.hidden {
    display: none;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-right {
    margin-top: 0;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-right .hp-stat {
    margin: 0 0 14px !important;
    min-height: auto;
    text-align: center;
    font-size: 0.95rem;
    line-height: 1.3;
  }

  #hp-sudoku-container.hp-sudoku .hp-cell.given {
    background: #e4e4e4;
  }

  #hp-sudoku-container.hp-sudoku .hp-cell.hint-line,
  #hp-sudoku-container.hp-sudoku .hp-cell.hint-match {
    background: #cce6f7 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-cell.given.hint-line,
  #hp-sudoku-container.hp-sudoku .hp-cell.given.hint-match {
    background: #a8cde8 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-cell.is-wrong,
  #hp-sudoku-container.hp-sudoku .hp-cell.hint-conflict,
  #hp-sudoku-container.hp-sudoku .hp-cell.is-wrong.hint-line,
  #hp-sudoku-container.hp-sudoku .hp-cell.is-wrong.hint-match,
  #hp-sudoku-container.hp-sudoku .hp-cell.hint-conflict.hint-line,
  #hp-sudoku-container.hp-sudoku .hp-cell.hint-conflict.hint-match {
    background: #ffc7cf !important;
    color: #ED1B24 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-cell.given.is-wrong,
  #hp-sudoku-container.hp-sudoku .hp-cell.given.hint-conflict,
  #hp-sudoku-container.hp-sudoku .hp-cell.given.is-wrong.hint-line,
  #hp-sudoku-container.hp-sudoku .hp-cell.given.is-wrong.hint-match,
  #hp-sudoku-container.hp-sudoku .hp-cell.given.hint-conflict.hint-line,
  #hp-sudoku-container.hp-sudoku .hp-cell.given.hint-conflict.hint-match {
    background: #f4a3af !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-cell.is-wrong .hp-value,
  #hp-sudoku-container.hp-sudoku .hp-cell.hint-conflict .hp-value {
    color: #ED1B24 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-cell.is-right {
    background: #e3f7ec !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-note-box,
  #hp-sudoku-container.hp-sudoku .hp-n-val {
    color: #333 !important;
    font-weight: 800 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-btn-grid {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 10px !important;
    width: 100% !important;
    margin: 0 0 12px !important;
    align-items: stretch !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn {
    background: #eef5fb !important;
    border-color: #c9dff1 !important;
    color: #107FBB !important;
    font-size: 36px !important;
    font-weight: 900 !important;
    line-height: 1 !important;
    text-rendering: geometricPrecision;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 1em !important;
    height: 1em !important;
    line-height: 1 !important;
    font-weight: 900 !important;
    transform: none !important;
    -webkit-font-smoothing: antialiased !important;
    text-rendering: geometricPrecision !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.notes-symbol {
    font-size: 38px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.erase-symbol {
    font-size: 40px !important;
    font-weight: 900 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.undo-symbol {
    font-size: 43px !important;
    font-weight: 900 !important;
    transform: translateY(-1px) scaleX(1.12) !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.active {
    background: #00A54F !important;
    border-color: #00A54F !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-undo-btn {
    font-size: 42px !important;
    font-weight: 900 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.disabled,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:disabled {
    opacity: 0.62 !important;
    cursor: not-allowed !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-btn.hint-complete {
    background: #e6e8eb !important;
    border-color: #c4cbd3 !important;
    color: #7d8792 !important;
    box-shadow: none !important;
    cursor: pointer !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-action-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
  }

  @media (max-width: 900px) {
    #hp-sudoku-container.hp-sudoku .hp-rs-top-area {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      justify-items: stretch;
      gap: 10px;
      padding: 10px 12px;
    }

    #hp-sudoku-container.hp-sudoku .hp-layout {
      gap: 12px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-col-left {
      margin-bottom: 0 !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row {
      margin-top: -2px;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-top-area.single-mode {
    justify-content: flex-end;
  }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-panel {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 6px;
      width: 100%;
      height: auto;
      min-height: 38px;
      min-width: 0;
      overflow: hidden;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-title {
      justify-self: auto;
      width: auto;
      text-align: left;
      font-size: 12px;
      flex: 0 0 auto;
      min-width: 0;
      white-space: nowrap;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-switch-wrap {
      justify-self: auto;
      width: auto;
      max-width: none;
      flex: 1 1 auto;
      min-width: 0;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-switch {
      grid-template-columns: repeat(${availableModes.length}, minmax(0, 1fr)) !important;
      gap: 4px !important;
      width: 100% !important;
      max-width: none !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn,
    #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn {
      min-height: 34px !important;
      padding: 5px 3px !important;
      border-radius: 12px !important;
      font-size: 0.64rem !important;
      line-height: 1.05 !important;
      white-space: nowrap !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row {
      width: 100%;
      justify-content: space-between;
      gap: 8px;
      margin: -2px 0 8px;
      height: 36px;
    }

    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-area {
      height: 36px;
      min-height: 36px;
      justify-content: flex-start;
      gap: 8px;
      flex: 0 1 auto;
    }

    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-display {
      height: 36px;
      font-size: 18px;
      min-width: auto;
      text-align: center;
    }

    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-btn-sm,
    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-toggle,
    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-notes-icon-btn,
    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-erase-icon-btn,
    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-tools-toggle,
    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-help-icon-btn {
      width: 36px;
      height: 36px;
      min-height: 36px;
    }

    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-toggle img,
    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-notes-icon-btn img,
    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-erase-icon-btn img,
    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-tools-toggle img,
    #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-help-icon-btn img {
      max-width: 28px;
      max-height: 28px;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-tools {
      justify-items: center;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn {
      width: 100%;
      max-width: 150px;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-right {
      margin-top: 0;
      align-self: flex-start;
    }

    #hp-sudoku-container.hp-sudoku .hp-btn-grid {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 10px !important;
      width: 100% !important;
      align-items: stretch !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-btn,
    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-keypad-btn,
    #hp-sudoku-container.hp-sudoku .hp-btn-grid button.hp-btn {
      width: 100% !important;
      min-width: 0 !important;
      height: 42px !important;
      min-height: 42px !important;
      max-height: 42px !important;
      padding: 0 !important;
      margin: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;
      font-size: 20px !important;
      aspect-ratio: auto !important;
      box-sizing: border-box !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-keypad-action-btn {
      background: #eef5fb !important;
      border-color: #c9dff1 !important;
      color: #107FBB !important;
      font-size: 34px !important;
      font-weight: 900 !important;
      line-height: 1 !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-btn-grid #hp-undo-btn {
      font-size: 39px !important;
      font-weight: 900 !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-keypad-action-btn.disabled,
    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-keypad-action-btn:disabled {
      opacity: 0.64 !important;
    }
  }

  @media (max-width: 480px) {
    #hp-sudoku-container.hp-sudoku .hp-rs-top-area {
      padding: 10px 8px;
      gap: 8px;
      margin: 0 0 6px;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-panel {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      gap: 5px;
      padding: 0;
      width: 100%;
      height: auto;
      min-height: auto;
      overflow: hidden;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-switch-wrap {
      order: 2;
      justify-self: auto;
      width: auto;
      max-width: none;
      flex: 1 1 auto;
      min-width: 0;
      height: auto;
      min-height: auto;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-switch {
      height: auto !important;
      gap: 4px !important;
      width: 100% !important;
      max-width: none !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-title {
      order: 1;
      font-size: 11px;
      text-align: left;
      margin-bottom: 0;
      height: auto;
      min-height: auto;
      flex: 0 0 auto;
      white-space: nowrap;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn,
    #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn {
      font-size: 0.72rem !important;
      padding-left: 4px !important;
      padding-right: 4px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn {
      height: 30px !important;
      min-height: 30px !important;
      border-radius: 11px !important;
      font-size: 0.60rem !important;
      padding-left: 2px !important;
      padding-right: 2px !important;
    }
  }


  /* =========================================================
     FINAL MOBILE POLISH OVERRIDES
     - Prevent mobile hover/tap border clipping on level buttons
     - Force larger keypad action icons on real phones
     ========================================================= */

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-switch,
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-switch-wrap,
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel {
    overflow: visible !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn {
    border-width: 1px !important;
    box-sizing: border-box !important;
    transform: none !important;
    -webkit-tap-highlight-color: transparent !important;
    transition: background-color .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease, filter .18s ease !important;
    background-clip: padding-box !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn:not(.static-mode):hover,
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn:not(.static-mode):focus-visible {
    border-width: 1px !important;
    transform: none !important;
    box-shadow: 0 3px 9px rgba(16,127,187,.16) !important;
    filter: brightness(.985) !important;
    outline: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn:not(.static-mode):active {
    border-width: 1px !important;
    transform: none !important;
    box-shadow: 0 2px 6px rgba(16,127,187,.12) !important;
    filter: brightness(.96) !important;
    outline: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.static-mode:hover,
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.static-mode:focus,
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn.static-mode:active {
    border-width: 1px !important;
    transform: none !important;
    box-shadow: none !important;
    filter: none !important;
    outline: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-tools-toggle:hover,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-tools-toggle:focus-visible,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-help-icon-btn:hover,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-help-icon-btn:focus-visible,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-toggle:hover,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-toggle:focus-visible {
    background: #eef5fb !important;
    box-shadow: 0 3px 9px rgba(16,127,187,.14) !important;
    outline: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-tools-toggle:active,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-help-icon-btn:active,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-timer-toggle:active {
    background: #e5f0f8 !important;
    box-shadow: 0 2px 6px rgba(16,127,187,.12) !important;
  }

  @media (max-width: 768px) {
    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-keypad-action-btn,
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn {
      background: #eef5fb !important;
      border-color: #c9dff1 !important;
      color: #107FBB !important;
      font-size: 40px !important;
      font-weight: 900 !important;
      line-height: 1 !important;
      text-rendering: geometricPrecision !important;
      -webkit-font-smoothing: antialiased !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-keypad-action-btn.active,
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.active {
      background: #00A54F !important;
      border-color: #00A54F !important;
      color: #fff !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-btn-grid #hp-undo-btn,
    #hp-sudoku-container.hp-sudoku #hp-undo-btn {
      font-size: 46px !important;
      font-weight: 900 !important;
      line-height: 1 !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.notes-symbol {
      font-size: 42px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.erase-symbol {
      font-size: 44px !important;
      font-weight: 900 !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.undo-symbol {
      font-size: 48px !important;
      font-weight: 900 !important;
      transform: translateY(-1px) scaleX(1.16) !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn img,
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn svg,
    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-keypad-action-btn img,
    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-keypad-action-btn svg {
      width: 34px !important;
      height: 34px !important;
      min-width: 34px !important;
      min-height: 34px !important;
      max-width: 34px !important;
      max-height: 34px !important;
      flex-shrink: 0 !important;
      object-fit: contain !important;
      opacity: 1 !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-keypad-action-btn.disabled,
    #hp-sudoku-container.hp-sudoku .hp-btn-grid .hp-keypad-action-btn:disabled,
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.disabled,
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:disabled {
      opacity: 0.64 !important;
      cursor: not-allowed !important;
    }
  }

  /* =========================================
     FINAL MOBILE ACTION ICON + HOVER POLISH
     Keeps action symbols large on real phones and restores
     hover/focus feedback without clipping level button borders.
     ========================================= */

  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn:not(.static-mode):hover,
  #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn:not(.static-mode):focus-visible {
    box-shadow: 0 3px 9px rgba(16,127,187,.16) !important;
    filter: brightness(.985) !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-tools-toggle:hover,
  #hp-sudoku-container.hp-sudoku .hp-timer-toolbar-row .hp-tools-toggle:focus-visible {
    background: #eef5fb !important;
    box-shadow: 0 3px 9px rgba(16,127,187,.14) !important;
  }

  @media (hover: none) and (pointer: coarse) {
    #hp-sudoku-container.hp-sudoku .hp-rs-level-panel .hp-mode-btn:hover {
      box-shadow: none !important;
      filter: none !important;
    }
  }

  @media (max-width: 768px) {
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.notes-symbol {
      font-size: 42px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.erase-symbol {
      font-size: 44px !important;
      font-weight: 900 !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.undo-symbol {
      font-size: 48px !important;
      font-weight: 900 !important;
      transform: translateY(-1px) scaleX(1.16) !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.disabled,
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:disabled {
      opacity: .66 !important;
    }
  }



  /* =========================================================
     FINAL CONSISTENT HOVER + KEYPAD ACTION SVG FIX
     - One hover/glow language across buttons
     - Inline SVG action icons render consistently on iPhone
     ========================================================= */

  #hp-sudoku-container.hp-sudoku .hp-mode-btn,
  #hp-sudoku-container.hp-sudoku .hp-tools-toggle,
  #hp-sudoku-container.hp-sudoku .hp-help-icon-btn,
  #hp-sudoku-container.hp-sudoku .hp-timer-toggle,
  #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn {
    transition: background-color .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease, filter .18s ease !important;
    transform: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-mode-btn:not(.static-mode):hover,
  #hp-sudoku-container.hp-sudoku .hp-mode-btn:not(.static-mode):focus-visible,
  #hp-sudoku-container.hp-sudoku .hp-tools-toggle:hover,
  #hp-sudoku-container.hp-sudoku .hp-tools-toggle:focus-visible,
  #hp-sudoku-container.hp-sudoku .hp-help-icon-btn:hover,
  #hp-sudoku-container.hp-sudoku .hp-help-icon-btn:focus-visible,
  #hp-sudoku-container.hp-sudoku .hp-timer-toggle:hover,
  #hp-sudoku-container.hp-sudoku .hp-timer-toggle:focus-visible,
  #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn:hover,
  #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn:focus-visible,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:hover,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:focus-visible {
    transform: none !important;
    background-color: #eef5fb !important;
    box-shadow: 0 3px 9px rgba(16,127,187,.16) !important;
    filter: brightness(.985) !important;
    outline: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.active:hover,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.active:focus-visible,
  #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn.active:hover,
  #hp-sudoku-container.hp-sudoku .hp-rs-tools .hp-tool-btn.active:focus-visible,
  #hp-sudoku-container.hp-sudoku #hp-check-toggle-btn.active:hover,
  #hp-sudoku-container.hp-sudoku #hp-check-toggle-btn.active:focus-visible {
    background-color: #00A54F !important;
    border-color: #00A54F !important;
    color: #fff !important;
    box-shadow: 0 3px 9px rgba(0,165,79,.18) !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol svg {
    display: block !important;
    width: 42px !important;
    height: 42px !important;
    min-width: 42px !important;
    min-height: 42px !important;
    max-width: 42px !important;
    max-height: 42px !important;
    overflow: visible !important;
    flex: 0 0 44px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol svg {
    fill: none !important;
    stroke: currentColor !important;
    stroke-width: 6.5 !important;
    stroke-linecap: round !important;
    stroke-linejoin: round !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.notes-symbol svg {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    min-height: 40px !important;
    max-width: 40px !important;
    max-height: 40px !important;
    flex-basis: 40px !important;
    stroke-width: 5.8 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.erase-symbol svg,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.undo-symbol svg {
    width: 46px !important;
    height: 46px !important;
    min-width: 46px !important;
    min-height: 46px !important;
    max-width: 46px !important;
    max-height: 46px !important;
    flex-basis: 46px !important;
    stroke-width: 7.2 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.disabled,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:disabled {
    opacity: .64 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.disabled .hp-keypad-action-symbol,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:disabled .hp-keypad-action-symbol,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.disabled svg,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:disabled svg {
    opacity: 1 !important;
  }

  @media (max-width: 768px) {
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol,
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol svg {
      width: 42px !important;
      height: 42px !important;
      min-width: 42px !important;
      min-height: 42px !important;
      max-width: 42px !important;
      max-height: 42px !important;
      flex-basis: 42px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.notes-symbol svg {
      width: 39px !important;
      height: 39px !important;
      min-width: 39px !important;
      min-height: 39px !important;
      max-width: 39px !important;
      max-height: 39px !important;
      flex-basis: 39px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.erase-symbol svg,
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol.undo-symbol svg {
      width: 44px !important;
      height: 44px !important;
      min-width: 44px !important;
      min-height: 44px !important;
      max-width: 44px !important;
      max-height: 44px !important;
      flex-basis: 44px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-mode-btn:not(.static-mode):hover,
    #hp-sudoku-container.hp-sudoku .hp-mode-btn:not(.static-mode):focus,
    #hp-sudoku-container.hp-sudoku .hp-mode-btn:not(.static-mode):active {
      border-width: 1px !important;
      transform: none !important;
      outline: none !important;
    }
  }


  /* =========================================================
     FINAL KEYPAD SVG ICON NORMALIZATION (images-v2.0)
     - Uses dedicated SVG image files for Notes / Erase / Undo
     - Forces consistent size on desktop and real mobile devices
     - Keeps disabled Undo visible but muted
     ========================================================= */

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn {
    background: #eef5fb !important;
    border-color: #c9dff1 !important;
    color: #107FBB !important;
    overflow: hidden !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 42px !important;
    height: 42px !important;
    min-width: 42px !important;
    min-height: 42px !important;
    max-width: 42px !important;
    max-height: 42px !important;
    line-height: 1 !important;
    transform: none !important;
    opacity: 1 !important;
    pointer-events: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-icon {
    display: block !important;
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    min-height: 36px !important;
    max-width: 36px !important;
    max-height: 36px !important;
    object-fit: contain !important;
    object-position: center center !important;
    flex: 0 0 auto !important;
    opacity: 1 !important;
    transform: none !important;
    margin: 0 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.active {
    background: #00A54F !important;
    border-color: #00A54F !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.active .hp-keypad-action-icon {
    filter: brightness(0) invert(1) !important;
    opacity: 1 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.disabled,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:disabled {
    opacity: 1 !important;
    cursor: not-allowed !important;
    background: #f2f7fb !important;
    border-color: #d7e7f4 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.disabled .hp-keypad-action-icon,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:disabled .hp-keypad-action-icon {
    opacity: .62 !important;
    filter: none !important;
  }

  @media (max-width: 768px) {
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-symbol {
      width: 42px !important;
      height: 42px !important;
      min-width: 42px !important;
      min-height: 42px !important;
      max-width: 42px !important;
      max-height: 42px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-icon {
      width: 36px !important;
      height: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
      max-width: 36px !important;
      max-height: 36px !important;
    }
  }


  /* =========================================================
     KEYPAD ACTION ICONS - v2.0 FINAL CONSISTENCY OVERRIDE
     Notes / Erase / Undo use dedicated GitHub SVGs and identical sizing.
     ========================================================= */
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn {
    background: #eef5fb !important;
    border-color: #c9dff1 !important;
    overflow: hidden !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn .hp-keypad-action-symbol {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 42px !important;
    height: 42px !important;
    min-width: 42px !important;
    min-height: 42px !important;
    max-width: 42px !important;
    max-height: 42px !important;
    line-height: 1 !important;
    transform: none !important;
    opacity: 1 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn .hp-keypad-action-icon {
    display: block !important;
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    min-height: 36px !important;
    max-width: 36px !important;
    max-height: 36px !important;
    object-fit: contain !important;
    object-position: center center !important;
    margin: 0 !important;
    padding: 0 !important;
    flex: 0 0 auto !important;
    opacity: 1 !important;
    transform: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.active .hp-keypad-action-icon {
    filter: none !important;
    opacity: 1 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.disabled .hp-keypad-action-icon,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn:disabled .hp-keypad-action-icon {
    opacity: .65 !important;
    filter: none !important;
  }

  @media (max-width: 768px) {
    #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn .hp-keypad-action-symbol {
      width: 42px !important;
      height: 42px !important;
      min-width: 42px !important;
      min-height: 42px !important;
      max-width: 42px !important;
      max-height: 42px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn .hp-keypad-action-icon {
      width: 36px !important;
      height: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
      max-width: 36px !important;
      max-height: 36px !important;
    }
  }


  /* =========================================================
     NOTES ON SVG FIX - v2.0
     Use dedicated notes-on-button.svg without CSS recoloring.
     Prevents the white-square artifact on the green Notes button.
     ========================================================= */
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.active .hp-keypad-action-icon,
  #hp-sudoku-container.hp-sudoku .hp-keypad-action-btn.active .hp-keypad-action-symbol img,
  #hp-sudoku-container.hp-sudoku .hp-notes-keypad-btn.active .hp-keypad-action-icon,
  #hp-sudoku-container.hp-sudoku .hp-notes-keypad-btn.active .hp-keypad-action-symbol img {
    filter: none !important;
    mix-blend-mode: normal !important;
    opacity: 1 !important;
    background: transparent !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-notes-keypad-btn.active {
    background: #00A54F !important;
    border-color: #00A54F !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-notes-keypad-btn.active .hp-keypad-action-icon {
    content: url("https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@images-v2.0/icons/notes-on-button.svg") !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-notes-keypad-btn:not(.active) .hp-keypad-action-icon {
    content: url("https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@images-v2.0/icons/notes-off-button.svg") !important;
  }


  #hp-sudoku-container.hp-sudoku .hp-completion-status {
    display: none;
    width: fit-content;
    max-width: 100%;
    margin: -4px auto 14px;
    padding: 7px 13px;
    border-radius: 999px;
    font-size: 0.92rem;
    line-height: 1.2;
    font-weight: 800;
    text-align: center;
    box-sizing: border-box;
  }

  #hp-sudoku-container.hp-sudoku .hp-completion-status.show {
    display: block;
  }

  #hp-sudoku-container.hp-sudoku .hp-completion-status.solved {
    color: #166534;
    background: #e3f7ec;
    border: 1px solid #b7e4c7;
  }

  #hp-sudoku-container.hp-sudoku .hp-completion-status.revealed {
    color: #31546f;
    background: #eef5fb;
    border: 1px solid #c9dff1;
  }

  @media (max-width: 480px) {
    #hp-sudoku-container.hp-sudoku .hp-completion-status {
      width: 100%;
      margin: 0 auto 10px;
      font-size: 0.86rem;
      padding: 7px 10px;
    }
  }



  /* =========================================================
     SINGLE-MODE LEVEL BUTTON FIX - v1.0.9
     When only one Sudoku mode is present, keep the inactive
     level button compact instead of stretching across mobile.
     ========================================================= */
  #hp-sudoku-container.hp-sudoku .hp-rs-top-area.single-mode {
    justify-content: flex-start !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-top-area.single-mode .hp-rs-level-panel {
    flex: 0 0 auto !important;
    width: auto !important;
    max-width: 100% !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-top-area.single-mode .hp-mode-switch-wrap {
    flex: 0 0 auto !important;
    width: auto !important;
    max-width: 100% !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-top-area.single-mode .hp-mode-switch {
    display: inline-grid !important;
    grid-template-columns: minmax(110px, 150px) !important;
    width: auto !important;
    max-width: 150px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-rs-top-area.single-mode .hp-mode-btn.static-mode {
    width: 100% !important;
    min-width: 110px !important;
    max-width: 150px !important;
    padding-left: 14px !important;
    padding-right: 14px !important;
  }



  /* =========================================================
     PLATFORM OVERLAY CARD - v2.4
     Matches the Cryptogram in-puzzle overlay behavior.
     IMPORTANT: this overlay is inside the Sudoku puzzle frame,
     not a full-page blocking modal.
     ========================================================= */
  #hp-sudoku-container.hp-sudoku,
  #hp-sudoku-container.hp-sudoku .hp-mount {
    position: relative !important;
    overflow: visible !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay {
    position: absolute !important;
    inset: 0 !important;
    z-index: 50 !important;
    background: rgba(255,255,255,.76) !important;
    border-radius: 18px !important;
    padding: 16px !important;
    display: none !important;
    align-items: center !important;
    justify-content: center !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay.on {
    display: flex !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-modal {
    background: #fff !important;
    width: min(500px, 100%) !important;
    max-width: 500px !important;
    border-radius: 18px !important;
    padding: 18px 20px 18px !important;
    border: 1px solid #e9eef3 !important;
    box-shadow: 0 18px 48px rgba(0,0,0,.18) !important;
    text-align: center !important;
    color: #222 !important;
    max-height: calc(100% - 24px) !important;
    overflow-y: auto !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay-icon {
    font-family: "Material Symbols Outlined" !important;
    font-size: 28px !important;
    line-height: 1 !important;
    color: #4B006F !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 40 !important;
    margin-bottom: 0 !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay-title {
    margin: 6px 0 10px !important;
    font-size: 24px !important;
    line-height: 1.15 !important;
    font-weight: 900 !important;
    color: #4B006F !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-stats {
    display: block !important;
    margin: 6px auto 10px !important;
    font-size: 12px !important;
    line-height: 1.25 !important;
    font-weight: 800 !important;
    color: #555 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-stat-row {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 6px 10px !important;
    margin: 0 auto 8px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-stat {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    white-space: nowrap !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-stat .material-symbols-outlined {
    font-size: 16px !important;
    line-height: 1 !important;
    color: #4B006F !important;
    font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 40 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-stat strong {
    color: #4B006F !important;
    font-weight: 900 !important;
    font-size: inherit !important;
    line-height: inherit !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-mode-summary {
    display: flex !important;
    flex-wrap: nowrap !important;
    justify-content: center !important;
    gap: 6px !important;
    margin: 6px auto 10px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-mode-pill {
    display: inline-flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 3px !important;
    padding: 6px 8px !important;
    min-width: 92px !important;
    border-radius: 999px !important;
    border: 1px solid #e6c6f5 !important;
    background: #faf3ff !important;
    color: #4B006F !important;
    font-size: 12px !important;
    line-height: 1 !important;
    font-weight: 900 !important;
    white-space: nowrap !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-mode-pill.solved {
    border-color: rgba(0,165,79,.28) !important;
    background: rgba(0,165,79,.08) !important;
    color: #08783f !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-mode-pill.revealed {
    border-color: rgba(104,0,153,.25) !important;
    background: #faf3ff !important;
    color: #4B006F !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-mode-pill.in-progress {
    border-color: rgba(247,148,28,.32) !important;
    background: rgba(247,148,28,.10) !important;
    color: #9a5700 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-mode-pill.not-started {
    border-color: #e5e7eb !important;
    background: #f8fafc !important;
    color: #555 !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay-text {
    max-width: 420px !important;
    margin: 0 auto 10px !important;
    color: #555 !important;
    font-size: 13px !important;
    line-height: 1.3 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel {
    max-width: 460px !important;
    margin: 12px auto 0 !important;
    padding: 14px 16px !important;
    background: #faf3ff !important;
    border: 1px solid #e6c6f5 !important;
    border-radius: 16px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-title {
    margin: 0 0 5px !important;
    font-size: 15px !important;
    font-weight: 900 !important;
    color: #4B006F !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel p {
    margin: 0 auto 8px !important;
    color: #555 !important;
    font-size: 12px !important;
    line-height: 1.35 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-mode-buttons {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 10px !important;
    margin-top: 4px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-actions {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    margin-top: 8px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn {
    border: 2px solid transparent !important;
    border-radius: 12px !important;
    min-height: 36px !important;
    padding: 8px 10px !important;
    font-weight: 900 !important;
    cursor: pointer !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: inherit !important;
    font-size: 12px !important;
    line-height: 1.1 !important;
    transition: all .18s ease !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.primary {
    background: #680099 !important;
    color: #fff !important;
    border-color: #680099 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.primary:hover,
  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.primary:focus-visible {
    background: #fff !important;
    border-color: #d9b7ed !important;
    color: #4B006F !important;
    transform: translateY(-1px) !important;
    outline: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.secondary {
    background: #fff !important;
    color: #333 !important;
    border-color: #e1e5ea !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.secondary:hover,
  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.secondary:focus-visible {
    background: #680099 !important;
    border-color: #680099 !important;
    color: #fff !important;
    transform: translateY(-1px) !important;
    outline: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.mode-easy {
    background: rgba(0,165,79,.08) !important;
    border-color: rgba(0,165,79,.32) !important;
    color: #08783f !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.mode-easy:hover,
  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.mode-easy:focus-visible {
    background: #00A54F !important;
    border-color: #00A54F !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.mode-medium {
    background: rgba(247,148,28,.10) !important;
    border-color: rgba(247,148,28,.38) !important;
    color: #9a5700 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.mode-medium:hover,
  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.mode-medium:focus-visible {
    background: #F7941C !important;
    border-color: #F7941C !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.mode-hard {
    background: rgba(237,27,36,.08) !important;
    border-color: rgba(237,27,36,.32) !important;
    color: #b11218 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.mode-hard:hover,
  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel-btn.mode-hard:focus-visible {
    background: #ED1B24 !important;
    border-color: #ED1B24 !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-badges {
    display: none !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-modal-actions {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    max-width: none !important;
    margin: 10px 0 0 !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-height: 36px !important;
    padding: 8px 10px !important;
    border: 2px solid transparent !important;
    border-radius: 12px !important;
    font-family: inherit !important;
    font-size: 12px !important;
    font-weight: 900 !important;
    text-decoration: none !important;
    cursor: pointer !important;
    transition: all .18s ease !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn.primary-action {
    background: #680099 !important;
    border-color: #680099 !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn.primary-action:hover {
    background: #fff !important;
    color: #4B006F !important;
    border-color: #e6c6f5 !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn.secondary-action {
    background: #fff !important;
    border-color: #e6c6f5 !important;
    color: #4B006F !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn.secondary-action:hover,
  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn.neutral-action:hover {
    background: #680099 !important;
    border-color: #680099 !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn.share-action {
    background: #faf3ff !important;
    border-color: #e6c6f5 !important;
    color: #4B006F !important;
    box-shadow: 0 4px 12px rgba(104,0,153,.12) !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn.share-action:hover {
    background: #680099 !important;
    border-color: #680099 !important;
    color: #fff !important;
    transform: translateY(-1px) !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn.neutral-action {
    background: #fff !important;
    border-color: #e1e5ea !important;
    color: #333 !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn.danger-action {
    grid-column: 1 / -1 !important;
    width: min(220px, 100%) !important;
    justify-self: center !important;
    background: #fff !important;
    border-color: #ffb4b4 !important;
    color: #ED1B24 !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-link-btn.danger-action:hover {
    background: #ED1B24 !important;
    border-color: #ED1B24 !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay-footer {
    display: block !important;
    margin-top: 10px !important;
    color: #777 !important;
    font-size: 12px !important;
  }


  #hp-sudoku-container.hp-sudoku .hp-overlay-mode-pill span {
    display: block !important;
    font-size: 11px !important;
    line-height: 1 !important;
    font-weight: 900 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-mode-pill strong {
    display: block !important;
    font-size: 12px !important;
    line-height: 1 !important;
    font-weight: 900 !important;
  }

  @media (max-width: 640px) {
    #hp-sudoku-container.hp-sudoku #hp-overlay {
      padding: 10px !important;
    }

    #hp-sudoku-container.hp-sudoku #hp-overlay .hp-modal {
      padding: 16px 14px 16px !important;
      max-height: calc(100% - 20px) !important;
    }

    #hp-sudoku-container.hp-sudoku #hp-overlay-title {
      font-size: 22px !important;
      margin-bottom: 8px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-overlay-mode-summary {
      gap: 5px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-overlay-mode-pill {
      min-width: 0 !important;
      flex: 1 1 0 !important;
      padding: 6px 4px !important;
      font-size: 11px !important;
    }

    #hp-sudoku-container.hp-sudoku #hp-overlay .hp-modal-actions {
      grid-template-columns: 1fr !important;
    }
  }

  /* =========================================================
     DAILY SUDOKU CHALLENGE RESULT CARD - v1.2
     Matched to the current Knights & Knaves / Sudoku / Cryptogram
     Success-Reveal card standard, adapted for one daily challenge.
     ========================================================= */
  #hp-sudoku-container.hp-sudoku #hp-overlay {
    position: absolute !important;
    inset: 0 !important;
    z-index: 50 !important;
    background: rgba(255,255,255,.78) !important;
    border-radius: 18px !important;
    padding: 18px !important;
    display: none !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: hidden !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay.on {
    display: flex !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-modal {
    position: relative !important;
    background: #fff !important;
    width: min(780px, 100%) !important;
    max-width: 780px !important;
    border-radius: 20px !important;
    padding: 38px 48px 42px !important;
    border: 1px solid #e9eef3 !important;
    box-shadow: 0 18px 54px rgba(0,0,0,.18) !important;
    text-align: center !important;
    color: #222 !important;
    max-height: calc(100% - 28px) !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-close-btn {
    position: absolute !important;
    top: 14px !important;
    right: 14px !important;
    width: 46px !important;
    height: 46px !important;
    border: 0 !important;
    border-radius: 999px !important;
    background: #fff !important;
    color: #B00012 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    box-shadow: 0 4px 18px rgba(0,0,0,.10) !important;
    transition: all .18s ease !important;
    font-family: inherit !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-close-btn:hover,
  #hp-sudoku-container.hp-sudoku .hp-overlay-close-btn:focus-visible {
    background: #ED1B24 !important;
    color: #fff !important;
    transform: translateY(-1px) !important;
    outline: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-close-btn .material-symbols-outlined {
    font-size: 32px !important;
    line-height: 1 !important;
    font-variation-settings: 'FILL' 0, 'wght' 800, 'GRAD' 0, 'opsz' 32 !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay-icon {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin: 0 auto 12px !important;
    color: #ED1B24 !important;
    font-size: 34px !important;
    line-height: 1 !important;
    font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 40 !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay-text.hp-overlay-status-text {
    display: block !important;
    margin: 0 auto 14px !important;
    color: #555 !important;
    font-size: 28px !important;
    line-height: 1.12 !important;
    font-weight: 900 !important;
    text-align: center !important;
    max-width: none !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay-title {
    display: block !important;
    margin: 0 auto 20px !important;
    color: #B00012 !important;
    font-size: 36px !important;
    line-height: 1.12 !important;
    font-weight: 900 !important;
    text-align: center !important;
  }

  #hp-sudoku-container.hp-sudoku #hp-overlay .hp-badges,
  #hp-sudoku-container.hp-sudoku #hp-overlay-footer {
    display: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-stats {
    display: block !important;
    margin: 0 auto 26px !important;
    color: #555 !important;
    font-size: 17px !important;
    line-height: 1.25 !important;
    font-weight: 800 !important;
    text-align: center !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-stat-row {
    display: flex !important;
    flex-wrap: nowrap !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 0 20px !important;
    margin: 0 auto !important;
    white-space: nowrap !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-stat {
    display: inline-flex !important;
    align-items: center !important;
    gap: 5px !important;
    white-space: nowrap !important;
    color: #555 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-stat .material-symbols-outlined {
    font-size: 21px !important;
    line-height: 1 !important;
    color: #B00012 !important;
    font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 40 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-stat strong {
    color: #B00012 !important;
    font-weight: 900 !important;
    font-size: inherit !important;
    line-height: inherit !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-sudoku-next-panel {
    max-width: 650px !important;
    margin: 0 auto !important;
    padding: 0 !important;
    background: transparent !important;
    border: 0 !important;
    border-radius: 0 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-message {
    margin: 0 auto 24px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 7px !important;
    color: #555 !important;
    text-align: center !important;
    max-width: 640px !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-message strong {
    display: block !important;
    color: #555 !important;
    font-size: 30px !important;
    line-height: 1.16 !important;
    font-weight: 900 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-message span {
    display: block !important;
    color: #555 !important;
    font-size: 22px !important;
    line-height: 1.24 !important;
    font-weight: 800 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-action-row {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 24px !important;
    flex-wrap: wrap !important;
    margin: 0 auto !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-action-btn {
    border: 2px solid transparent !important;
    border-radius: 15px !important;
    min-height: 54px !important;
    min-width: 260px !important;
    width: auto !important;
    padding: 14px 28px !important;
    font-family: inherit !important;
    font-size: 17px !important;
    line-height: 1.1 !important;
    font-weight: 900 !important;
    text-decoration: none !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all .18s ease !important;
    box-shadow: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-action-btn.primary-action {
    background: #ED1B24 !important;
    border-color: #ED1B24 !important;
    color: #fff !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-action-btn.primary-action:hover,
  #hp-sudoku-container.hp-sudoku .hp-overlay-action-btn.primary-action:focus-visible {
    background: #fff !important;
    border-color: #FFC8CC !important;
    color: #B00012 !important;
    transform: translateY(-1px) !important;
    outline: none !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-action-btn.share-action {
    background: #fff !important;
    border-color: transparent !important;
    color: #B00012 !important;
  }

  #hp-sudoku-container.hp-sudoku .hp-overlay-action-btn.share-action:hover,
  #hp-sudoku-container.hp-sudoku .hp-overlay-action-btn.share-action:focus-visible {
    background: #ED1B24 !important;
    border-color: #ED1B24 !important;
    color: #fff !important;
    transform: translateY(-1px) !important;
    outline: none !important;
  }

  @media (max-width: 760px) {
    #hp-sudoku-container.hp-sudoku #hp-overlay {
      padding: 10px !important;
    }

    #hp-sudoku-container.hp-sudoku #hp-overlay .hp-modal {
      width: min(780px, 100%) !important;
      padding: 30px 18px 28px !important;
      max-height: calc(100% - 18px) !important;
    }

    #hp-sudoku-container.hp-sudoku #hp-overlay-title {
      font-size: 27px !important;
    }

    #hp-sudoku-container.hp-sudoku #hp-overlay-text.hp-overlay-status-text {
      font-size: 24px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-overlay-stats {
      font-size: 14px !important;
      margin-bottom: 20px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-overlay-stat-row {
      flex-wrap: wrap !important;
      gap: 8px 14px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-overlay-message strong {
      font-size: 23px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-overlay-message span {
      font-size: 17px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-overlay-action-row {
      gap: 12px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-overlay-action-btn {
      width: 100% !important;
      min-width: 0 !important;
      min-height: 48px !important;
      font-size: 15px !important;
    }

    #hp-sudoku-container.hp-sudoku .hp-overlay-close-btn {
      width: 40px !important;
      height: 40px !important;
    }
  }

</style>

        <div class="hp-completion-status" id="hp-completion-status" aria-live="polite" aria-hidden="true"></div>

        <div class="hp-layout hp-layout-no-mode-selector">
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
              <div class="hp-toolbar-icon-controls" aria-label="Sudoku quick controls">
                <button class="hp-help-icon-btn" data-a="help" type="button" aria-label="Help" title="Help">
                  <img src="${HELP_BUTTON_ICON}" alt="">
                </button>
                <button class="hp-tools-toggle" id="hp-tools-toggle" data-a="tools-toggle" type="button" aria-expanded="false" aria-controls="hp-tools-tray" aria-label="Open tools" title="Open tools">
                  <img id="hp-tools-toggle-icon" src="${TOOLS_CLOSED_ICON}" alt="">
                </button>
              </div>
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
              <button class="hp-btn hp-keypad-btn" data-n="1" aria-label="Enter 1">1</button>
              <button class="hp-btn hp-keypad-btn" data-n="2" aria-label="Enter 2">2</button>
              <button class="hp-btn hp-keypad-btn" data-n="3" aria-label="Enter 3">3</button>
              <button class="hp-btn hp-keypad-action-btn hp-notes-keypad-btn" id="hp-notes-btn" type="button" aria-pressed="false" aria-label="Turn notes on" title="Notes off"><span class="hp-keypad-action-symbol notes-symbol" aria-hidden="true"><img class="hp-keypad-action-icon" src="${KEYPAD_NOTES_OFF_ICON}" alt=""></span></button>

              <button class="hp-btn hp-keypad-btn" data-n="4" aria-label="Enter 4">4</button>
              <button class="hp-btn hp-keypad-btn" data-n="5" aria-label="Enter 5">5</button>
              <button class="hp-btn hp-keypad-btn" data-n="6" aria-label="Enter 6">6</button>
              <button class="hp-btn hp-keypad-action-btn" data-a="erase" type="button" aria-label="Erase cell" title="Erase"><span class="hp-keypad-action-symbol erase-symbol" aria-hidden="true"><img class="hp-keypad-action-icon" src="${KEYPAD_ERASE_ICON}" alt=""></span></button>

              <button class="hp-btn hp-keypad-btn" data-n="7" aria-label="Enter 7">7</button>
              <button class="hp-btn hp-keypad-btn" data-n="8" aria-label="Enter 8">8</button>
              <button class="hp-btn hp-keypad-btn" data-n="9" aria-label="Enter 9">9</button>
              <button class="hp-btn hp-keypad-action-btn" id="hp-undo-btn" data-a="undo" type="button" aria-label="Undo last action" title="Nothing to undo" disabled><span class="hp-keypad-action-symbol undo-symbol" aria-hidden="true"><img class="hp-keypad-action-icon" src="${KEYPAD_UNDO_ICON}" alt=""></span></button>
            </div>

            <div class="hp-action-grid">
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
            <h3>Welcome to Sudoku!</h3>
            <div class="hp-help-modal-content">
              <div>
                <div class="hp-help-section-title">The Goal</div>
                <p>Fill every empty cell with a number from 1 to 9.</p>
              </div>

              <div>
                <div class="hp-help-section-title">The Rules</div>
                <p>Each row, column, and 3×3 box must contain the numbers 1 through 9 only once.</p>
              </div>

              <div>
                <div class="hp-help-section-title">Getting Started</div>
                <p>The puzzle begins with some numbers already filled in. These are called givens and cannot be changed.</p>
                <p>Tap any empty cell to begin solving.</p>
              </div>

              <div>
                <div class="hp-help-section-title">Puzzle Controls</div>

                <p class="hp-help-icon-line double-icon">
                  <span class="hp-help-icons-pair">
                    <img class="hp-help-icon" src="${TIMER_PLAY_ICON}" alt="">
                    <img class="hp-help-icon" src="${TIMER_PAUSE_ICON}" alt="">
                  </span>
                  <span>The timer starts automatically when you begin. Use play and pause to control it.</span>
                </p>

                <p class="hp-help-icon-line">
                  <img class="hp-help-icon" src="${NOTES_OFF_ICON}" alt="">
                  <span><strong>Notes Mode</strong> lets you add small candidate numbers to help track possible answers.</span>
                </p>

                <p class="hp-help-icon-line">
                  <img class="hp-help-icon" src="${ERASE_BUTTON_ICON}" alt="">
                  <span><strong>Erase</strong> removes the entry from the selected cell.</span>
                </p>

                <p class="hp-help-icon-line">
                  <img class="hp-help-icon" src="${TOOLS_CLOSED_ICON}" alt="">
                  <span><strong>Toolbar</strong> opens extra Sudoku tools.</span>
                </p>
              </div>

              <div>
                <div class="hp-help-section-title">Helpful Tools</div>
                <ul class="hp-help-list">
                  <li><strong>Hints</strong> highlight selected rows and columns, matching numbers, duplicate conflicts, and helpful solving feedback.</li>
                  <li><strong>Check</strong> shows correct entries in green and mistakes in red.</li>
                  <li><strong>Reveal Cell</strong> shows the correct answer for the selected cell.</li>
                  <li><strong>Reset Puzzle</strong> clears the puzzle and resets the timer.</li>
                  <li><strong>Reveal Puzzle</strong> ends the puzzle and shows the full solution.</li>
                </ul>
              </div>
            </div>
            <div class="hp-modal-actions">
              <button class="hp-link-btn full secondary" data-a="close-help">Back to Puzzle</button>
            </div>
          </div>
        </div>

        <div class="hp-overlay" id="hp-overlay" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Sudoku Challenge result">
            <button type="button" class="hp-overlay-close-btn" data-a="close-solved" aria-label="Close result card">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
            <div id="hp-overlay-icon" class="material-symbols-outlined">celebration</div>
            <div id="hp-overlay-text" class="hp-overlay-status-text">${escapeHtml(cfg.solvedText)}</div>
            <h3 id="hp-overlay-title">${escapeHtml(cfg.solvedTitle)}</h3>

            <div class="hp-badges">
              <span class="hp-badge" id="hp-badge-id"></span>
              <span class="hp-badge" id="hp-badge-time"></span>
            </div>

            <div class="hp-overlay-stats" id="hp-overlay-stats" aria-label="Sudoku Challenge statistics"></div>

            <div class="hp-sudoku-next-panel" id="hp-overlay-next-panel"></div>

            <small id="hp-overlay-footer">${escapeHtml(cfg.footer)}</small>
          </div>
        </div>
      `;
      boardEl = mount.querySelector("#hp-board");
      statEl = mount.querySelector("#hp-stat");
      completionStatusEl = mount.querySelector("#hp-completion-status");
      timerEl = mount.querySelector("#hp-timer");
      timerToggleBtn = mount.querySelector("#hp-timer-toggle");
      timerToggleIcon = mount.querySelector("#hp-timer-toggle-icon");
      notesBtn = mount.querySelector("#hp-notes-btn");
      notesToggleIcon = null;
      undoBtn = mount.querySelector("#hp-undo-btn");
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
      overlayStatsEl = mount.querySelector("#hp-overlay-stats");
      overlayNextPanelEl = mount.querySelector("#hp-overlay-next-panel");
      overlayFooterEl = mount.querySelector("#hp-overlay-footer");

      toolsOpen = false;
      updateToolsTray();
      updateTimerUI();
      buildBoard();
      bindUIEvents();
      updateInstructionText();
      applyMobileKeypadSizing();

      const state = getState();
      if (state.solved || state.revealed) {
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
      state.history = [];

      pauseTimer(false);
      updateTimerUI();
      hideOverlay();

      notesOn = false;
      hintsOn = false;
      checkOn = false;
      updateHintsButton();
      updateCheckButton();
      updateNotesButton();
      updateUndoButton();

      statEl.textContent = "Tap a cell to begin";
      updateCompletionStatus();
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

      const shareText = getShareMessage(cfg, state);
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const shareUrl = `${baseUrl}?puzzle=${encodeURIComponent(cfg.puzzleId)}`;

      const shareData = {
        title: `${getPuzzleDisplayName(cfg)} — Hare Publishing`,
        // Put the URL inside the text instead of using the separate url field.
        // Some share targets, especially Messages on iOS/macOS, show only the URL
        // when the url field is provided separately.
        text: `${shareText}\n${shareUrl}`
      };

      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        try {
          navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          statEl.textContent = "Share text copied! 📋 ";
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

    }

    window.HareSudokuSelectMode = function(mode) {
      if (mode) switchMode(String(mode).toLowerCase());
    };

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

        if (a === "undo") {
          undoLastAction();
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
          return;
        }

        if (a === "request-next-sudoku") {
          hideOverlay();
          if (typeof window.HareSudokuRequestNextSudoku === "function") {
            window.HareSudokuRequestNextSudoku({ source: "overlay" });
          }
          return;
        }

        if (a === "overlay-next-challenge") {
          const nextId = aBtn.getAttribute("data-puzzle-id");
          hideOverlay();
          if (nextId && typeof window.HareSudokuChallengeLoadPuzzle === "function") {
            window.HareSudokuChallengeLoadPuzzle(nextId, { scroll: true });
          } else if (nextId) {
            const url = new URL(window.location.href);
            url.searchParams.set("puzzle", nextId);
            window.location.href = url.toString();
          }
          return;
        }

        if (a === "overlay-next-puzzle") {
          const nextId = aBtn.getAttribute("data-puzzle-id");
          const nextMode = aBtn.getAttribute("data-mode");
          const cfg = getConfig();
          const currentId = String(cfg && cfg.puzzleId ? cfg.puzzleId : "");
          hideOverlay();

          // If the next unfinished puzzle for that level is this same Sudoku set,
          // stay on the page and switch to the requested difficulty.
          if (nextId && String(nextId) === currentId && nextMode) {
            switchMode(nextMode);
            return;
          }

          // Otherwise load the target Sudoku set and ask the page layer to open
          // the requested difficulty after the new set has mounted.
          if (nextId && typeof window.HareSudokuLoadPuzzle === "function") {
            window.HareSudokuLoadPuzzle(nextId, { scroll: true, mode: nextMode || undefined });
          } else if (nextId) {
            const url = new URL(window.location.href);
            url.searchParams.set("puzzle", nextId);
            if (nextMode) url.searchParams.set("mode", nextMode);
            window.location.href = url.toString();
          }
          return;
        }
      };

      mount.addEventListener("click", mountClickHandler);

      if (notesClickHandler && notesBtn) {
        notesBtn.removeEventListener("click", notesClickHandler);
      }

      notesClickHandler = () => {
        if (isFinished()) return;
        notesOn = !notesOn;
        updateNotesButton();
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

      // Return visits should always begin paused with the Play icon.
      state.running = false;

      saveCurrentState();
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    window.addEventListener("pagehide", beforeUnloadHandler);

    visibilityChangeHandler = () => {
      if (document.visibilityState === "hidden") beforeUnloadHandler();
    };
    document.addEventListener("visibilitychange", visibilityChangeHandler);

    resizeHandler = applyMobileKeypadSizing;
    window.addEventListener("resize", resizeHandler);

    // =========================================================
    // INIT
    // =========================================================
    injectSchema();
    renderUI();

    container.__hpSudokuPlatformCleanup = () => {
      try {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }

        if (mountClickHandler) mount.removeEventListener("click", mountClickHandler);
        if (notesClickHandler && notesBtn) notesBtn.removeEventListener("click", notesClickHandler);
        if (overlayClickHandler && overlayEl) overlayEl.removeEventListener("click", overlayClickHandler);
        if (overlayClickHandler && helpOverlayEl) helpOverlayEl.removeEventListener("click", overlayClickHandler);
        if (keydownHandler) document.removeEventListener("keydown", keydownHandler);
        if (beforeUnloadHandler) {
          window.removeEventListener("beforeunload", beforeUnloadHandler);
          window.removeEventListener("pagehide", beforeUnloadHandler);
        }
        if (visibilityChangeHandler) document.removeEventListener("visibilitychange", visibilityChangeHandler);
        if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      } finally {
        delete container.dataset.hpSudokuMounted;
        delete container.__hpSudokuPlatformCleanup;
      }
    };

  }
};

// Backward-compatible alias for pages that still call HareSudokuEngine directly.
window.HareSudokuEngine = window.HareSudokuChallengePlatformEngine;

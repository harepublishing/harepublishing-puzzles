/* =========================================================
   HARE PUBLISHING REGULAR SUDOKU ENGINE
   For Easy, Medium & Hard Sudoku puzzles
   GitHub/jsDelivr hosted engine file

   Suggested filename:
   hare-regular-sudoku-engine.js

   Expected page setup:
   - A container with id="hp-sudoku-container"
   - A puzzle data block with id="hp-sudoku-data"
   - This engine loaded after the puzzle data block

   Data format:
   window.HareRegularSudokuData = {
     defaultMode: "easy",
     puzzles: {
       easy: { puzzleId, puzzle, solution },
       medium: { puzzleId, puzzle, solution },
       hard: { puzzleId, puzzle, solution }
     }
   };
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

    const MODE_META = {
      easy: {
        mode: "easy",
        label: "Easy Sudoku",
        boardAria: "Easy Sudoku Board",
        schemaName: id => `Easy Sudoku #${id}`,
        schemaDescription: "Play and solve today's easy Sudoku puzzle by Hare Publishing. Includes notes, timer, and progress saving.",
        solvedTitle: "You Solved the Easy Sudoku Puzzle!",
        solvedStat: "Easy Sudoku Solved! 🎉 ",
        solvedText: "Congratulations — you did it! New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        revealedText: "Here is the completed Easy Sudoku puzzle. New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        footer: "Hare Publishing • Easy Sudoku",
        shareTitle: id => `Easy Sudoku #${id} — Hare Publishing`,
        shareSolvedText: (id, time) => `I solved today’s easy Sudoku #${id} in ${time}!`,
        shareRevealedText: id => `I revealed the answer for Easy Sudoku #${id} at Hare Publishing.`,
        sharePlayingText: id => `I’m playing today’s Easy Sudoku #${id}!`,
        saveKeyPrefix: "hp_sd_easy_"
      },

      medium: {
        mode: "medium",
        label: "Medium Sudoku",
        boardAria: "Medium Sudoku Board",
        schemaName: id => `Medium Sudoku #${id}`,
        schemaDescription: "Play and solve today's medium Sudoku puzzle by Hare Publishing. Includes notes, timer, and progress saving.",
        solvedTitle: "You Solved the Medium Sudoku Puzzle!",
        solvedStat: "Medium Sudoku Solved! 🎉 ",
        solvedText: "Congratulations — you did it! New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        revealedText: "Here is the completed Medium Sudoku puzzle. New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        footer: "Hare Publishing • Medium Sudoku",
        shareTitle: id => `Medium Sudoku #${id} — Hare Publishing`,
        shareSolvedText: (id, time) => `I solved today’s medium Sudoku #${id} in ${time}!`,
        shareRevealedText: id => `I revealed the answer for Medium Sudoku #${id} at Hare Publishing.`,
        sharePlayingText: id => `I’m playing today’s Medium Sudoku #${id}!`,
        saveKeyPrefix: "hp_sd_medium_"
      },

      hard: {
        mode: "hard",
        label: "Hard Sudoku",
        boardAria: "Hard Sudoku Board",
        schemaName: id => `Hard Sudoku #${id}`,
        schemaDescription: "Play and solve today's hard Sudoku puzzle by Hare Publishing. Includes notes, timer, and progress saving.",
        solvedTitle: "You Solved the Hard Sudoku Puzzle!",
        solvedStat: "Hard Sudoku Solved! 🎉 ",
        solvedText: "Congratulations — you did it! New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        revealedText: "Here is the completed Hard Sudoku puzzle. New puzzles are added daily in the Puzzlers Hub, or you can explore a whole stack of puzzles to enjoy offline.",
        footer: "Hare Publishing • Hard Sudoku",
        shareTitle: id => `Hard Sudoku #${id} — Hare Publishing`,
        shareSolvedText: (id, time) => `I solved today’s hard Sudoku #${id} in ${time}!`,
        shareRevealedText: id => `I revealed the answer for Hard Sudoku #${id} at Hare Publishing.`,
        sharePlayingText: id => `I’m playing today’s Hard Sudoku #${id}!`,
        saveKeyPrefix: "hp_sd_hard_"
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

      ["easy", "medium", "hard"].forEach(mode => {
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

    const missingModes = ["easy", "medium", "hard"].filter(mode => !PUZZLES[mode]);
    if (missingModes.length) {
      showConfigError(`Missing puzzle data for: ${missingModes.join(", ")}.`);
      return;
    }

    for (const mode of ["easy", "medium", "hard"]) {
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

    const defaultMode = ["easy", "medium", "hard"].includes(pageData?.defaultMode)
      ? pageData.defaultMode
      : "easy";

    // =========================================================
    // STATE HELPERS
    // =========================================================
    const defaultState = () => ({
      cells: Array.from({ length: 81 }, () => ({ value: "", notes: Array(9).fill(false) })),
      elapsed: 0,
      running: false,
      solved: false,
      revealed: false,
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

    const states = {
      easy: loadState("easy"),
      medium: loadState("medium"),
      hard: loadState("hard")
    };

    let currentMode = defaultMode;
    let selected = null;
    let notesOn = false;
    let timerInterval = null;
    let lastTick = Date.now();
    let saveTick = 0;
    const SAVE_EVERY = 10;

    let boardEl = null;
    let statEl = null;
    let timerEl = null;
    let notesBtn = null;
    let overlayEl = null;
    let badgeIdEl = null;
    let badgeTimeEl = null;
    let overlayIconEl = null;
    let overlayTitleEl = null;
    let overlayTextEl = null;
    let overlayFooterEl = null;
    let cells = [];

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

      saveCurrentState();
    }

    function clearCheckMarks() {
      cells.forEach(c => c.el.classList.remove("is-wrong", "is-right"));
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
      if (timerEl) timerEl.textContent = formatTime(getState().elapsed);
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

      badgeIdEl.textContent = `${cfg.label} #${cfg.puzzleId}`;
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
      state.overlaySeen = false;

      pauseTimer(true);
      statEl.textContent = "Answer revealed.";
      saveCurrentState();
      showOverlay();
    }

    function handleInput(num) {
      const state = getState();

      if (isFinished()) return;
      if (selected === null) return;

      const c = cells[selected];
      if (!c || c.given) return;

      if (!state.running && !state.solved && !state.revealed) startTimer();

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
        }
      }

      renderCell(selected);
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
          if (char !== ".") return;

          if (cells[selected]?.el) cells[selected].el.classList.remove("selected");
          selected = i;
          cell.classList.add("selected");
          statEl.textContent = "Use the number pad or your keyboard.";
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

      if (state.solved || state.revealed) {
        renderOverlayContent();
        statEl.textContent = state.solved ? cfg.solvedStat : "Answer revealed.";
      } else {
        statEl.textContent = "Tap a cell to begin";
      }
    }

    function renderUI() {
      const cfg = getConfig();

mount.innerHTML = `
  <div class="hp-layout">
    <div class="hp-col-left">

      <div style="text-align:center; margin-bottom:18px;">

        <div style="
          font-size:16px;
          font-weight:700;
          margin-top:4px;
        ">
          ${escapeHtml(cfg.label)} #${escapeHtml(cfg.puzzleId)}
        </div>

        ${pageData?.puzzleDate ? `
          <div style="
            text-align:center;
            font-size:22px;
            font-weight:700;
            color:#107FBB;
            margin-top:10px;
            margin-bottom:6px;
            line-height:1.2;
          ">
            ${escapeHtml(formatPuzzleDate(pageData.puzzleDate))}
          </div>
        ` : ""}

      </div>
            </div>

            <div class="hp-mode-switch-wrap">
              <div class="hp-mode-switch" role="tablist" aria-label="Choose Sudoku difficulty">
                <button class="hp-mode-btn ${currentMode === "easy" ? "active" : ""}" data-mode="easy" role="tab" aria-selected="${currentMode === "easy" ? "true" : "false"}">Easy Sudoku</button>
                <button class="hp-mode-btn ${currentMode === "medium" ? "active" : ""}" data-mode="medium" role="tab" aria-selected="${currentMode === "medium" ? "true" : "false"}">Medium Sudoku</button>
                <button class="hp-mode-btn ${currentMode === "hard" ? "active" : ""}" data-mode="hard" role="tab" aria-selected="${currentMode === "hard" ? "true" : "false"}">Hard Sudoku</button>
              </div>
            </div>

            <div class="hp-stat" id="hp-stat" aria-live="polite">Tap a cell to begin</div>
            <div class="hp-grid" id="hp-board" role="grid" aria-label="${escapeHtml(cfg.boardAria)}"></div>
          </div>

          <div class="hp-col-right">
            <div class="hp-timer-area" aria-label="Timer">
              <span class="hp-timer-display" id="hp-timer">00:00:00</span>
              <div style="display:flex; gap:5px; justify-content:center;">
                <button class="hp-btn-sm" data-a="t-start" aria-label="Start timer">Start</button>
                <button class="hp-btn-sm" data-a="t-pause" aria-label="Pause timer">Pause</button>
                <button class="hp-btn-sm" data-a="t-reset" aria-label="Reset timer">Reset</button>
              </div>
            </div>

            <div class="hp-btn-grid" aria-label="Number pad">
              ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="hp-btn" data-n="${n}" aria-label="Enter ${n}">${n}</button>`).join("")}
            </div>

            <div class="hp-action-grid">
              <button class="hp-btn-sm" id="hp-notes-btn" aria-pressed="false">✎ Notes: OFF</button>
              <button class="hp-btn-sm" data-a="erase" aria-label="Erase cell">⌫ Erase</button>

              <button class="hp-btn-sm" data-a="check" style="color:#107FBB;" aria-label="Check entries">Check</button>
              <button class="hp-btn-sm" data-a="clear" aria-label="Clear check highlights">Clear Checks</button>

              <button class="hp-btn-sm" data-a="reset-board" aria-label="Reset puzzle">Reset Puzzle</button>
              <button class="hp-btn-sm reveal" data-a="reveal-answer" aria-label="Reveal answer">Reveal Answer</button>
            </div>

            <p style="text-align:center; font-size:11px; color:#999; margin-top:10px;">
              Use Keyboard Arrows or Numbers
            </p>
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
      notesBtn = mount.querySelector("#hp-notes-btn");
      overlayEl = mount.querySelector("#hp-overlay");
      badgeIdEl = mount.querySelector("#hp-badge-id");
      badgeTimeEl = mount.querySelector("#hp-badge-time");
      overlayIconEl = mount.querySelector("#hp-overlay-icon");
      overlayTitleEl = mount.querySelector("#hp-overlay-title");
      overlayTextEl = mount.querySelector("#hp-overlay-text");
      overlayFooterEl = mount.querySelector("#hp-overlay-footer");

      updateTimerUI();
      buildBoard();
      bindUIEvents();

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
        c.el.classList.remove("is-wrong", "is-right", "selected");
      });

      selected = null;

      state.solved = false;
      state.revealed = false;
      state.overlaySeen = false;
      state.elapsed = 0;

      pauseTimer(false);
      updateTimerUI();
      hideOverlay();

      notesOn = false;
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

        if (a === "erase") {
          handleInput(0);
          return;
        }

        if (a === "clear") {
          clearCheckMarks();
          statEl.textContent = isFinished() ? "Answer revealed." : "Check highlights cleared.";
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
      };

      overlayEl.addEventListener("click", overlayClickHandler);
    }

    keydownHandler = (e) => {
      if (!container.isConnected) return;
      if (!boardEl) return;

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

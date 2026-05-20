/* =========================================================
   HARE PUBLISHING REGULAR SUDOKU ENGINE
   Version: 1.0.7
   Date: 2026-05-20

   Updates:
   - Condensed Sudoku tool menu above the grid
   - Help modal using shared puzzle modal classes
   - Hint toggle with row/column, matching-number, and duplicate-conflict highlights
   - Check toggle replaces separate Check / Clear Checks buttons
   - Reveal selected cell button
   - Larger, darker note candidates supported by CSS
   ========================================================= */

window.HareRegularSudokuEngine = (() => {
  "use strict";

  const DEFAULT_MORE_PUZZLES_URL = "https://harepublishing.com/online-puzzles";
  const DEFAULT_SHOP_URL = "https://harepublishing.com/shop";

  function init({ containerId = "hp-sudoku-container", dataObject } = {}) {
    const container = document.getElementById(containerId);
    if (!container || !dataObject) return;

    const mount = container.querySelector(".hp-mount") || container;
    const yearEl = container.querySelector("#hp-year") || document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const morePuzzlesUrl = dataObject.morePuzzlesUrl || DEFAULT_MORE_PUZZLES_URL;
    const shopUrl = dataObject.shopUrl || DEFAULT_SHOP_URL;
    const puzzleDate = dataObject.puzzleDate || dataObject.date || "";
    const formattedDate = formatPuzzleDate(puzzleDate);
    const levels = normalizeLevels(dataObject);

    if (!levels.length) {
      mount.innerHTML = `<div class="hp-sudoku-error">Regular Sudoku puzzle data could not be found.</div>`;
      return;
    }

    let activeLevelKey = getInitialLevel(levels, dataObject);
    let current = levels.find(level => level.key === activeLevelKey) || levels[0];

    injectSchema(current, puzzleDate);
    container.dataset.sudokuLevel = current.key;

    mount.innerHTML = `
      ${formattedDate ? `<div class="hp-puzzle-date">${escapeHtml(formattedDate)}</div>` : ""}

      ${levels.length > 1 ? `
        <div class="hp-sudoku-difficulty-wrap" aria-label="Choose a Sudoku difficulty">
          <div class="hp-sudoku-difficulty-title">Choose Your Level</div>
          <div class="hp-sudoku-difficulty-buttons">
            ${levels.map(level => `
              <button class="hp-sudoku-difficulty-btn${level.key === current.key ? " active" : ""}" type="button" data-level="${escapeHtml(level.key)}" aria-pressed="${level.key === current.key ? "true" : "false"}">
                ${escapeHtml(level.label)}
              </button>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <div class="hp-layout">
        <div class="hp-col-left">
          ${renderToolMenu("hp-puzzle-tools")}
          ${renderToolMenu("hp-puzzle-mobile-tools")}
          <div class="hp-stat" id="hp-stat" aria-live="polite">Tap a cell to begin</div>
          <div class="hp-grid" id="hp-board" role="grid" aria-label="Sudoku puzzle board"></div>
        </div>

        <div class="hp-col-right">
          <div class="hp-timer-area" aria-label="Timer">
            <span class="hp-timer-display" id="hp-timer">00:00:00</span>
            <div class="hp-timer-buttons">
              <button class="hp-btn-sm" type="button" data-a="t-start" aria-label="Start timer">Start</button>
              <button class="hp-btn-sm" type="button" data-a="t-pause" aria-label="Pause timer">Pause</button>
              <button class="hp-btn-sm" type="button" data-a="t-reset" aria-label="Reset timer">Reset</button>
            </div>
          </div>

          <div class="hp-btn-grid" aria-label="Number pad">
            ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="hp-btn" type="button" data-n="${n}" aria-label="Enter ${n}">${n}</button>`).join("")}
          </div>

          <div class="hp-action-grid">
            <button class="hp-btn-sm" type="button" id="hp-notes-btn" aria-pressed="false">✎ Notes: OFF</button>
            <button class="hp-btn-sm" type="button" data-a="erase" aria-label="Erase cell">⌫ Erase</button>
            <button class="hp-btn-sm danger" type="button" data-a="reset-board" aria-label="Reset puzzle">Reset Puzzle</button>
            <button class="hp-btn-sm reveal-full" type="button" data-a="reveal" aria-label="Reveal full puzzle answer">Reveal Puzzle</button>
          </div>

          <p class="hp-keyboard-note">Use keyboard arrows or numbers.</p>
        </div>
      </div>

      <div class="hp-overlay" id="hp-overlay" aria-hidden="true">
        <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Sudoku message">
          <div id="hp-overlay-icon" class="hp-overlay-icon">🎉</div>
          <h3 id="hp-overlay-title">You Solved the Sudoku!</h3>
          <div class="hp-badges" id="hp-overlay-badges">
            <span class="hp-badge" id="hp-badge-id"></span>
            <span class="hp-badge" id="hp-badge-time"></span>
          </div>
          <div id="hp-overlay-body">
            <p id="hp-overlay-text">Congratulations — you did it!</p>
          </div>
          <div class="hp-modal-actions" id="hp-overlay-actions">
            <a class="hp-link-btn secondary" href="${escapeAttr(morePuzzlesUrl)}">More Online Puzzles</a>
            <a class="hp-link-btn primary" href="${escapeAttr(shopUrl)}">Get Puzzle Books</a>
            <button class="hp-link-btn neutral full" type="button" data-a="close-overlay">Back to Puzzle</button>
          </div>
        </div>
      </div>
    `;

    const boardEl = mount.querySelector("#hp-board");
    const statEl = mount.querySelector("#hp-stat");
    const timerEl = mount.querySelector("#hp-timer");
    const notesBtn = mount.querySelector("#hp-notes-btn");
    const overlayEl = mount.querySelector("#hp-overlay");
    const overlayIconEl = mount.querySelector("#hp-overlay-icon");
    const overlayTitleEl = mount.querySelector("#hp-overlay-title");
    const overlayBadgesEl = mount.querySelector("#hp-overlay-badges");
    const badgeIdEl = mount.querySelector("#hp-badge-id");
    const badgeTimeEl = mount.querySelector("#hp-badge-time");
    const overlayBodyEl = mount.querySelector("#hp-overlay-body");
    const overlayActionsEl = mount.querySelector("#hp-overlay-actions");

    let state = loadState(current);
    let selected = null;
    let notesOn = false;
    let hintsOn = false;
    let checksOn = false;
    let lastTick = Date.now();
    let timerInterval = null;
    let saveTick = 0;
    const SAVE_EVERY = 10;
    let cells = [];

    window.addEventListener("beforeunload", () => {
      accrueTimer();
      save();
    });

    function renderToolMenu(className) {
      return `
        <div class="${className}" aria-label="Sudoku tools">
          <button class="hp-tool-btn help-info" type="button" data-a="help">Help</button>
          <button class="hp-tool-btn hint-toggle" type="button" data-a="hints" aria-pressed="false">Hints: OFF</button>
          <button class="hp-tool-btn check-toggle" type="button" data-a="check-toggle" aria-pressed="false">Check: OFF</button>
          <button class="hp-tool-btn clear-tool" type="button" data-a="clear-checks">Clear</button>
          <button class="hp-tool-btn reveal" type="button" data-a="reveal-cell">Reveal Cell</button>
        </div>
      `;
    }

    function getSaveKey(level) {
      const prefix = level.key === "medium" ? "hp_sd_medium_" : level.key === "hard" ? "hp_sd_hard_" : "hp_sd_easy_";
      return `${prefix}${level.puzzleId}`;
    }

    function newState() {
      return {
        cells: Array.from({ length: 81 }, () => ({ value: "", notes: Array(9).fill(false), revealed: false })),
        elapsed: 0,
        running: false,
        solved: false,
        revealed: false
      };
    }

    function loadState(level) {
      try {
        const raw = localStorage.getItem(getSaveKey(level));
        const loaded = raw ? JSON.parse(raw) : null;
        if (loaded && Array.isArray(loaded.cells) && loaded.cells.length === 81) {
          loaded.cells.forEach(cell => {
            if (!Array.isArray(cell.notes)) cell.notes = Array(9).fill(false);
            if (typeof cell.revealed !== "boolean") cell.revealed = false;
          });
          if (typeof loaded.revealed !== "boolean") loaded.revealed = false;
          if (typeof loaded.solved !== "boolean") loaded.solved = false;
          if (typeof loaded.running !== "boolean") loaded.running = false;
          if (typeof loaded.elapsed !== "number") loaded.elapsed = 0;
          return loaded;
        }
      } catch {}
      return newState();
    }

    function save() {
      try {
        localStorage.setItem(getSaveKey(current), JSON.stringify(state));
      } catch {}
    }

    function track(eventType, status) {
      try {
        window.HarePuzzleAnalytics?.track({
          eventType,
          puzzleType: "regular-sudoku",
          puzzleId: current.puzzleId || "",
          puzzleDate: puzzleDate || "",
          status: status || eventType,
          difficulty: current.key,
          engineVersion: "HareRegularSudokuEngine-v1.0.7"
        });
      } catch {}
    }

    function formatTime(ms) {
      const s = Math.max(0, Math.floor(ms / 1000));
      return new Date(s * 1000).toISOString().substr(11, 8);
    }

    function accrueTimer() {
      if (!state.running) return;
      const now = Date.now();
      state.elapsed += now - lastTick;
      lastTick = now;
    }

    function updateTimerUI() {
      timerEl.textContent = formatTime(state.elapsed);
    }

    function pauseTimer(saveNow = false) {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      accrueTimer();
      state.running = false;
      updateTimerUI();
      if (saveNow) save();
    }

    function startTimer() {
      if (state.running || state.solved || state.revealed) return;
      state.running = true;
      lastTick = Date.now();
      saveTick = 0;
      timerInterval = setInterval(() => {
        accrueTimer();
        updateTimerUI();
        saveTick++;
        if (saveTick >= SAVE_EVERY) {
          saveTick = 0;
          save();
        }
      }, 1000);
      save();
    }

    function clearCheckMarks() {
      cells.forEach(c => c.el.classList.remove("is-wrong", "is-right"));
    }

    function clearHintMarks() {
      cells.forEach(c => c.el.classList.remove("hint-peer", "hint-match", "hint-conflict"));
    }

    function visibleValue(index) {
      const given = current.puzzle[index];
      if (given && given !== "." && given !== "0") return given;
      return state.cells[index]?.value || "";
    }

    function sameBox(a, b) {
      const ar = Math.floor(a / 9), ac = a % 9;
      const br = Math.floor(b / 9), bc = b % 9;
      return Math.floor(ar / 3) === Math.floor(br / 3) && Math.floor(ac / 3) === Math.floor(bc / 3);
    }

    function updateHints() {
      clearHintMarks();
      if (!hintsOn || selected === null || state.solved || state.revealed) return;

      const selectedValue = visibleValue(selected);
      const sr = Math.floor(selected / 9);
      const sc = selected % 9;

      if (selectedValue) {
        cells.forEach((cell, i) => {
          if (visibleValue(i) === selectedValue) cell.el.classList.add("hint-match");
        });
      } else {
        cells.forEach((cell, i) => {
          const r = Math.floor(i / 9);
          const c = i % 9;
          if (i !== selected && (r === sr || c === sc)) cell.el.classList.add("hint-peer");
        });
      }

      applyConflictHighlights();
    }

    function applyConflictHighlights() {
      const conflictIndexes = new Set();

      for (let i = 0; i < 81; i++) {
        const v = visibleValue(i);
        if (!v) continue;
        for (let j = i + 1; j < 81; j++) {
          if (visibleValue(j) !== v) continue;
          const sameRow = Math.floor(i / 9) === Math.floor(j / 9);
          const sameCol = i % 9 === j % 9;
          if (sameRow || sameCol || sameBox(i, j)) {
            conflictIndexes.add(i);
            conflictIndexes.add(j);
          }
        }
      }

      conflictIndexes.forEach(i => cells[i]?.el.classList.add("hint-conflict"));
    }

    function updateToolButtons() {
      mount.querySelectorAll('[data-a="hints"]').forEach(btn => {
        btn.textContent = hintsOn ? "Hints: ON" : "Hints: OFF";
        btn.classList.toggle("active", hintsOn);
        btn.setAttribute("aria-pressed", hintsOn ? "true" : "false");
      });
      mount.querySelectorAll('[data-a="check-toggle"]').forEach(btn => {
        btn.textContent = checksOn ? "Check: ON" : "Check: OFF";
        btn.classList.toggle("active", checksOn);
        btn.setAttribute("aria-pressed", checksOn ? "true" : "false");
      });
    }

    function checkPuzzle() {
      if (state.revealed) return;
      clearCheckMarks();
      let checked = 0;
      let wrong = 0;
      cells.forEach((c, i) => {
        if (!c.given && state.cells[i].value) {
          checked++;
          if (state.cells[i].value === current.solution[i]) c.el.classList.add("is-right");
          else {
            c.el.classList.add("is-wrong");
            wrong++;
          }
        }
      });
      statEl.textContent = checked === 0 ? "No entries to check yet." : wrong === 0 ? "All checked entries are correct so far." : `${wrong} entr${wrong === 1 ? "y" : "ies"} need another look.`;
      if (computeSolved()) showSolved();
    }

    function toggleChecks() {
      if (state.revealed || state.solved) return;
      checksOn = !checksOn;
      updateToolButtons();
      if (checksOn) checkPuzzle();
      else {
        clearCheckMarks();
        statEl.textContent = "Check highlights cleared.";
      }
    }

    function revealSelectedCell() {
      if (state.revealed || state.solved) return;
      if (selected === null) {
        statEl.textContent = "Select a cell first, then choose Reveal Cell.";
        return;
      }
      const c = cells[selected];
      if (!c || c.given) {
        statEl.textContent = "That cell is already given.";
        return;
      }
      if (!state.running && !state.solved) startTimer();
      state.cells[selected].value = current.solution[selected];
      state.cells[selected].notes.fill(false);
      state.cells[selected].revealed = true;
      renderCell(selected);
      c.el.classList.add("revealed-answer");
      clearCheckMarks();
      updateHints();
      statEl.textContent = `Revealed Row ${Math.floor(selected / 9) + 1}, Col ${selected % 9 + 1}.`;
      save();
      track("revealed", "cell-revealed");
      if (computeSolved()) showSolved();
    }

    function computeSolved() {
      for (let i = 0; i < 81; i++) {
        if (visibleValue(i) !== current.solution[i]) return false;
      }
      return true;
    }

    function showOverlay({ icon, title, bodyHtml, badges = true, actionsHtml }) {
      overlayIconEl.textContent = icon || "";
      overlayTitleEl.textContent = title || "";
      overlayBadgesEl.style.display = badges ? "flex" : "none";
      badgeIdEl.textContent = `${current.label} Sudoku${current.puzzleId ? ` #${current.puzzleId}` : ""}`;
      badgeTimeEl.textContent = `Time: ${formatTime(state.elapsed)}`;
      overlayBodyEl.innerHTML = bodyHtml || "";
      overlayActionsEl.innerHTML = actionsHtml || `
        <a class="hp-link-btn secondary" href="${escapeAttr(morePuzzlesUrl)}">More Online Puzzles</a>
        <a class="hp-link-btn primary" href="${escapeAttr(shopUrl)}">Get Puzzle Books</a>
        <button class="hp-link-btn neutral full" type="button" data-a="close-overlay">Back to Puzzle</button>
      `;
      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");
    }

    function hideOverlay() {
      overlayEl.classList.remove("on");
      overlayEl.setAttribute("aria-hidden", "true");
    }

    function showSolved() {
      state.solved = true;
      state.revealed = false;
      pauseTimer(true);
      clearHintMarks();
      clearCheckMarks();
      showOverlay({
        icon: "🎉",
        title: "You Solved the Sudoku!",
        bodyHtml: `<p class="hp-modal-lead">Congratulations — you did it!</p><p class="hp-modal-subtext">Come back for another Sudoku puzzle, or explore more Hare Publishing puzzles.</p>`
      });
      statEl.textContent = "Sudoku solved! 🎉";
      save();
      track("completed", "solved");
    }

    function showHelp() {
      showOverlay({
        icon: "?",
        title: "How to Play Sudoku",
        badges: false,
        bodyHtml: `
          <div class="hp-help-modal-content">
            <span class="hp-help-line"><strong>Goal:</strong> Fill every empty cell so each row, column, and 3×3 box contains the numbers 1 through 9.</span>
            <span class="hp-help-line"><strong>Choose a cell:</strong> Tap or click an empty square, then use the number pad or your keyboard to enter a number.</span>
            <span class="hp-help-line"><strong>Notes:</strong> Turn Notes ON to add small candidate numbers inside a cell instead of placing a final answer.</span>
            <span class="hp-help-line"><strong>Hints:</strong> Turn Hints ON to highlight the selected row/column, matching visible numbers, and duplicate conflicts.</span>
            <span class="hp-help-line"><strong>Check:</strong> Turn Check ON to mark filled answers as correct or incorrect. Turn it OFF or choose Clear to remove the markings.</span>
            <span class="hp-help-line"><strong>Reveal Cell:</strong> Select one empty cell and reveal only that cell’s correct number.</span>
            <span class="hp-help-line"><strong>Reveal Puzzle:</strong> Reveals the full solution and ends the puzzle.</span>
          </div>
        `,
        actionsHtml: `<button class="hp-link-btn secondary full" type="button" data-a="close-overlay">Back to Puzzle</button>`
      });
    }

    function revealAnswer() {
      if (state.revealed || state.solved) return;
      if (!confirm("Reveal the full answer? This will end the puzzle.")) return;
      pauseTimer(true);
      current.puzzle.split("").forEach((char, i) => {
        if (char === "." || char === "0") {
          state.cells[i].value = current.solution[i];
          state.cells[i].notes.fill(false);
          state.cells[i].revealed = true;
        }
      });
      state.revealed = true;
      state.solved = false;
      selected = null;
      cells.forEach((c, i) => renderCell(i));
      clearHintMarks();
      clearCheckMarks();
      showOverlay({
        icon: "🔍",
        title: "Answer Revealed",
        bodyHtml: `<p class="hp-modal-lead">The completed Sudoku is now shown on the board.</p><p class="hp-modal-subtext">You can reset the puzzle to try again.</p>`
      });
      statEl.textContent = "Answer revealed.";
      save();
      track("revealed", "full-answer-revealed");
    }

    function renderCell(i) {
      const c = cells[i];
      if (!c) return;
      const data = state.cells[i];
      const givenChar = current.puzzle[i];
      const isGiven = givenChar && givenChar !== "." && givenChar !== "0";
      const value = isGiven ? String(givenChar) : String(data.value || "");
      c.valueEl.textContent = value || "";
      c.el.classList.toggle("has-value", !!value);
      c.el.classList.toggle("revealed-answer", !!data.revealed && !isGiven);
      const noteVals = c.el.querySelectorAll(".hp-n-val");
      if (noteVals.length) {
        noteVals.forEach((node, idx) => {
          node.textContent = !value && data.notes[idx] ? String(idx + 1) : "";
        });
      }
    }

    function buildBoard() {
      boardEl.innerHTML = "";
      cells = [];
      selected = null;
      clearCheckMarks();
      clearHintMarks();

      current.puzzle.split("").forEach((char, i) => {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const isGiven = char !== "." && char !== "0";
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = `hp-cell${isGiven ? " given" : ""}`;
        if (col === 0) cell.classList.add("bL");
        if (col === 8 || col === 2 || col === 5) cell.classList.add("bR");
        if (row === 0) cell.classList.add("bT");
        if (row === 8 || row === 2 || row === 5) cell.classList.add("bB");
        cell.setAttribute("role", "gridcell");
        cell.dataset.index = String(i);
        cell.setAttribute("aria-label", `Row ${row + 1}, Column ${col + 1}`);
        cell.tabIndex = 0;

        const inner = document.createElement("div");
        inner.className = "hp-cell-inner";
        const valueSpan = document.createElement("span");
        valueSpan.className = "hp-value";
        inner.appendChild(valueSpan);

        if (!isGiven) {
          const noteBox = document.createElement("div");
          noteBox.className = "hp-note-box";
          for (let n = 1; n <= 9; n++) {
            const nv = document.createElement("div");
            nv.className = "hp-n-val";
            noteBox.appendChild(nv);
          }
          inner.appendChild(noteBox);
        }

        cell.appendChild(inner);
        boardEl.appendChild(cell);
        cells.push({ el: cell, valueEl: valueSpan, given: isGiven });

        const selectCell = () => {
          if (state.revealed) return;
          if (cells[selected]?.el) cells[selected].el.classList.remove("selected");
          selected = Number(cell.dataset.index);
          cell.classList.add("selected");
          cell.focus({ preventScroll: true });
          statEl.textContent = `Selected: Row ${row + 1}, Col ${col + 1}`;
          updateHints();
        };

        cell.addEventListener("click", e => {
          e.stopPropagation();
          selectCell();
        });

        cell.addEventListener("keydown", e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectCell();
          }
        });

        renderCell(i);
      });
    }

    function handleInput(num) {
      if (state.revealed || state.solved) return;
      if (selected === null) return;
      const c = cells[selected];
      if (!c || c.given) return;
      if (!state.running) startTimer();
      clearCheckMarks();
      checksOn = false;
      updateToolButtons();

      const data = state.cells[selected];
      data.revealed = false;

      if (notesOn && num >= 1 && num <= 9) {
        data.notes[num - 1] = !data.notes[num - 1];
      } else if (num === 0) {
        data.value = "";
        data.notes.fill(false);
      } else {
        data.value = String(num);
        data.notes.fill(false);
      }

      renderCell(selected);
      updateHints();
      save();
      if (computeSolved()) showSolved();
    }

    function resetBoard() {
      if (!confirm("Clear this Sudoku puzzle and start again?")) return;
      pauseTimer(false);
      state = newState();
      selected = null;
      notesOn = false;
      hintsOn = false;
      checksOn = false;
      updateTimerUI();
      notesBtn.textContent = "✎ Notes: OFF";
      notesBtn.classList.remove("active");
      notesBtn.setAttribute("aria-pressed", "false");
      updateToolButtons();
      hideOverlay();
      buildBoard();
      statEl.textContent = "Tap a cell to begin";
      save();
    }

    function switchLevel(levelKey) {
      const next = levels.find(level => level.key === levelKey);
      if (!next || next.key === current.key) return;
      pauseTimer(true);
      current = next;
      state = loadState(current);
      selected = null;
      notesOn = false;
      hintsOn = false;
      checksOn = false;
      injectSchema(current, puzzleDate);
      container.dataset.sudokuLevel = current.key;
      mount.querySelectorAll(".hp-sudoku-difficulty-btn").forEach(btn => {
        const active = btn.dataset.level === current.key;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      notesBtn.textContent = "✎ Notes: OFF";
      notesBtn.classList.remove("active");
      notesBtn.setAttribute("aria-pressed", "false");
      updateToolButtons();
      updateTimerUI();
      buildBoard();
      statEl.textContent = "Tap a cell to begin";
      if (state.running && !state.solved && !state.revealed) startTimer();
    }

    document.addEventListener("click", e => {
      if (!container.contains(e.target)) {
        if (cells[selected]?.el) cells[selected].el.classList.remove("selected");
        selected = null;
        clearHintMarks();
        statEl.textContent = state.revealed ? "Answer revealed." : "Tap a cell to begin";
      }
    });

    container.addEventListener("click", e => {
      const levelBtn = e.target.closest("[data-level]");
      if (levelBtn) {
        switchLevel(levelBtn.dataset.level);
        return;
      }

      const nBtn = e.target.closest("[data-n]");
      if (nBtn) {
        handleInput(parseInt(nBtn.dataset.n, 10));
        return;
      }

      const aBtn = e.target.closest("[data-a]");
      if (!aBtn) return;
      const a = aBtn.dataset.a;

      if (a === "help") showHelp();
      if (a === "hints") {
        hintsOn = !hintsOn;
        updateToolButtons();
        updateHints();
        statEl.textContent = hintsOn ? "Hints turned on." : "Hints turned off.";
      }
      if (a === "check-toggle") toggleChecks();
      if (a === "clear-checks") {
        checksOn = false;
        clearCheckMarks();
        updateToolButtons();
        statEl.textContent = "Check highlights cleared.";
      }
      if (a === "reveal-cell") revealSelectedCell();
      if (a === "erase") handleInput(0);
      if (a === "reset-board") resetBoard();
      if (a === "reveal") revealAnswer();
      if (a === "t-start") startTimer();
      if (a === "t-pause") pauseTimer(true);
      if (a === "t-reset") {
        pauseTimer(false);
        state.elapsed = 0;
        updateTimerUI();
        save();
      }
      if (a === "close-overlay") hideOverlay();
    });

    notesBtn.addEventListener("click", () => {
      if (state.revealed || state.solved) return;
      notesOn = !notesOn;
      notesBtn.textContent = notesOn ? "✎ Notes: ON" : "✎ Notes: OFF";
      notesBtn.classList.toggle("active", notesOn);
      notesBtn.setAttribute("aria-pressed", notesOn ? "true" : "false");
    });

    document.addEventListener("keydown", e => {
      if (state.revealed || state.solved) return;
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
    });

    updateToolButtons();
    updateTimerUI();
    buildBoard();
    if (state.running && !state.solved && !state.revealed) startTimer();
    if (state.revealed) statEl.textContent = "Answer revealed.";
  }

  function normalizeLevels(data) {
    const candidates = [];
    const add = (key, label, obj) => {
      if (!obj) return;
      const puzzle = cleanGrid(obj.puzzle || obj.grid || obj.start || obj.givens);
      const solution = cleanGrid(obj.solution || obj.answer);
      if (puzzle.length !== 81 || solution.length !== 81) return;
      candidates.push({
        key,
        label,
        puzzle,
        solution,
        puzzleId: obj.puzzleId || obj.id || data.puzzleId || ""
      });
    };

    if (data.puzzles && typeof data.puzzles === "object") {
      add("easy", "Easy", data.puzzles.easy);
      add("medium", "Medium", data.puzzles.medium);
      add("hard", "Hard", data.puzzles.hard);
    }

    add("easy", "Easy", data.easy);
    add("medium", "Medium", data.medium);
    add("hard", "Hard", data.hard);

    if (Array.isArray(data.levels)) {
      data.levels.forEach((level, idx) => {
        const key = String(level.key || level.difficulty || level.label || `level-${idx + 1}`).toLowerCase();
        const label = level.label || titleCase(key);
        add(key, label, level);
      });
    }

    if (!candidates.length && (data.puzzle || data.grid) && (data.solution || data.answer)) {
      add(String(data.difficulty || "easy").toLowerCase(), titleCase(data.difficulty || "Sudoku"), data);
    }

    const seen = new Set();
    return candidates.filter(level => {
      if (seen.has(level.key)) return false;
      seen.add(level.key);
      return true;
    });
  }

  function getInitialLevel(levels, data) {
    const wanted = String(data.defaultMode || data.defaultDifficulty || data.difficulty || "easy").toLowerCase();
    return levels.some(level => level.key === wanted) ? wanted : levels[0].key;
  }

  function cleanGrid(value) {
    return String(value || "").replace(/[^0-9.]/g, "").replace(/0/g, ".");
  }

  function titleCase(value) {
    return String(value || "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatPuzzleDate(dateString) {
    if (!dateString) return "";
    const parts = String(dateString).split("-").map(Number);
    if (parts.length === 3 && parts.every(Boolean)) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
    return String(dateString);
  }

  function injectSchema(level, puzzleDate) {
    try {
      const existing = document.getElementById("hp-schema-regular-sudoku");
      if (existing) existing.remove();
      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": `${level.label} Sudoku${level.puzzleId ? ` #${level.puzzleId}` : ""}`,
        "description": "Play a Hare Publishing Sudoku puzzle online with notes, timer, hints, check, and reveal cell tools.",
        "genre": "Puzzle",
        "url": window.location.href,
        "inLanguage": "en",
        "audience": { "@type": "PeopleAudience", "suggestedMinAge": "8" },
        "numberOfPlayers": "1",
        "datePublished": puzzleDate || undefined,
        "copyrightYear": String(new Date().getFullYear()),
        "publisher": { "@type": "Organization", "name": "Hare Publishing", "url": "https://harepublishing.com/" }
      };
      const script = document.createElement("script");
      script.id = "hp-schema-regular-sudoku";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    } catch {}
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  return { init };
})();

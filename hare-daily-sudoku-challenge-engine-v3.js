window.HareDailySudokuChallengeEngine = {
  init({ containerId = "hp-sudoku-container", dataId = "hp-puzzle-data" } = {}) {
    const container = document.getElementById(containerId);
    const dataEl = document.getElementById(dataId);

    if (!container || !dataEl) {
      console.error("HareDailySudokuChallengeEngine: puzzle container or puzzle data block missing.");
      return;
    }

    if (container.dataset.hpSudokuChallengeMounted === "true") {
      console.warn("HareDailySudokuChallengeEngine: this container has already been initialized.");
      return;
    }

    container.dataset.hpSudokuChallengeMounted = "true";

    let puzzleData;

    try {
      puzzleData = JSON.parse(dataEl.textContent.trim());
    } catch (err) {
      console.error("HareDailySudokuChallengeEngine: invalid puzzle JSON.", err);
      showConfigError("Puzzle data could not be read. Please check the JSON formatting.");
      return;
    }

    const puzzleId = String(puzzleData.puzzleId || "").trim();
    const puzzle = String(puzzleData.puzzle || "").replace(/\s/g, "");
    const solution = String(puzzleData.solution || "").replace(/\s/g, "");
    const puzzleDate = String(puzzleData.date || "").trim();

    if (!puzzleId) {
      showConfigError("Puzzle data is missing puzzleId.");
      return;
    }

    if (puzzle.length !== 81) {
      showConfigError("Puzzle must contain exactly 81 characters.");
      return;
    }

    if (solution.length !== 81) {
      showConfigError("Solution must contain exactly 81 characters.");
      return;
    }

    const mount = container.querySelector(".hp-mount") || container;

    const yearEl = container.querySelector("#hp-year") || document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

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
      const target = container.querySelector(".hp-mount") || container;
      target.innerHTML = `
        <div style="max-width:720px;margin:20px auto;padding:18px;border:1px solid rgba(237,27,36,.35);border-radius:14px;background:#fff5f5;color:#8a1c1c;text-align:center;">
          <strong>Daily Sudoku Challenge could not load.</strong><br>
          ${escapeHtml(message)}
        </div>
      `;
    }

    function formatPuzzleDate(dateString) {
      if (!dateString) return "";

      const d = new Date(dateString + "T00:00:00");
      if (Number.isNaN(d.getTime())) return "";

      return d.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }

    const puzzleDateLabel = formatPuzzleDate(puzzleDate);

    function injectSchema() {
      const existing = document.getElementById("hp-schema-daily-sudoku-challenge");
      if (existing) existing.remove();

      const nowYear = new Date().getFullYear();
      const pageUrl = window.location.href;

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": `Daily Sudoku Challenge #${puzzleId}`,
        "description": "Play and solve today's Daily Sudoku Challenge by Hare Publishing. Includes notes, timer, and progress saving.",
        "genre": "Puzzle",
        "url": pageUrl,
        "inLanguage": "en",
        "audience": {
          "@type": "PeopleAudience",
          "suggestedMinAge": "8"
        },
        "numberOfPlayers": "1",
        "copyrightYear": String(nowYear),
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://harepublishing.com/"
        }
      };

      const script = document.createElement("script");
      script.id = "hp-schema-daily-sudoku-challenge";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }

    injectSchema();

    const SAVE_KEY = `hp_sd_challenge_${puzzleId}`;

    function defaultState() {
      return {
        cells: Array.from({ length: 81 }, () => ({
          value: "",
          notes: Array(9).fill(false)
        })),
        elapsed: 0,
        running: false,
        solved: false,
        revealed: false,
        overlaySeen: false
      };
    }

    function loadState() {
      try {
        const saved = localStorage.getItem(SAVE_KEY);
        const parsed = saved ? JSON.parse(saved) : null;
        const merged = parsed ? { ...defaultState(), ...parsed } : defaultState();

        if (typeof merged.revealed !== "boolean") merged.revealed = false;
        if (typeof merged.overlaySeen !== "boolean") merged.overlaySeen = false;

        return merged;
      } catch {
        return defaultState();
      }
    }

    const state = loadState();

    function save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch {}
    }

    let selected = null;
    let notesOn = false;
    let timerInterval = null;
    let lastTick = Date.now();
    let saveTick = 0;
    const SAVE_EVERY = 10;
    const cells = [];

    function handleBeforeUnload() {
      if (state.running) {
        const now = Date.now();
        state.elapsed += (now - lastTick);
        lastTick = now;
      }

      save();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    mount.innerHTML = `
      ${puzzleDateLabel ? `
        <div 
          id="hp-dsc-date" 
          class="hp-puzzle-date"
        >
TEST DATE STYLE CHANGE — ${escapeHtml(puzzleDateLabel)}        </div>
      ` : ""}

      <div class="hp-layout">
        <div class="hp-col-left">
          <div class="hp-stat" id="hp-stat" aria-live="polite">Tap a cell to begin</div>
          <div class="hp-grid" id="hp-board" role="grid" aria-label="Daily Sudoku Challenge Board"></div>
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

            <button class="hp-btn-sm" data-a="reset-board" style="color:#ED1B24;" aria-label="Reset puzzle">Reset Puzzle</button>
            <button class="hp-btn-sm reveal" data-a="reveal-answer" aria-label="Reveal answer">Reveal Answer</button>
          </div>

          <p style="text-align:center; font-size:11px; color:#999; margin-top:10px;">
            Use Keyboard Arrows or Numbers
          </p>
        </div>
      </div>

      <div class="hp-overlay" id="hp-overlay" aria-hidden="true">
        <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Puzzle complete">
          <div id="hp-overlay-icon" style="font-size:28px; line-height:1;">🎉</div>

          <h3 id="hp-overlay-title">You Solved the Daily Sudoku Challenge!</h3>

          <div class="hp-badges">
            <span class="hp-badge" id="hp-badge-id"></span>
            <span class="hp-badge" id="hp-badge-time"></span>
          </div>

          <p id="hp-overlay-text">Congratulations — you did it! Come back for another Daily Sudoku Challenge, or explore more puzzles to enjoy online and offline.</p>

          <div class="hp-modal-actions">
            <a class="hp-link-btn secondary" href="https://harepublishing.com/online-puzzles">More Online Puzzles</a>
            <a class="hp-link-btn primary" href="https://harepublishing.com/shop">Get Puzzle Books</a>

            <button class="hp-link-btn" data-a="share">Share</button>
            <button class="hp-link-btn" data-a="close-solved">Back to Puzzle</button>

            <button class="hp-link-btn full danger" data-a="reset-board">Reset Puzzle</button>
          </div>

          <small>Hare Publishing • Daily Sudoku Challenge</small>
        </div>
      </div>
    `;

    const dateEl = container.querySelector("#hp-dsc-date");

    if (dateEl) {
      dateEl.style.setProperty("display", "block", "important");
      dateEl.style.setProperty("width", "100%", "important");
      dateEl.style.setProperty("text-align", "center", "important");
      dateEl.style.setProperty("font-family", "Roboto, sans-serif", "important");
      dateEl.style.setProperty("font-size", "24px", "important");
      dateEl.style.setProperty("font-weight", "900", "important");
      dateEl.style.setProperty("line-height", "1.35", "important");
      dateEl.style.setProperty("color", "#107FBB", "important");
      dateEl.style.setProperty("margin", "0 auto 20px", "important");
    }

    const boardEl = container.querySelector("#hp-board");
    const statEl = container.querySelector("#hp-stat");
    const timerEl = container.querySelector("#hp-timer");
    const notesBtn = container.querySelector("#hp-notes-btn");
    const overlayEl = container.querySelector("#hp-overlay");
    const badgeIdEl = container.querySelector("#hp-badge-id");
    const badgeTimeEl = container.querySelector("#hp-badge-time");
    const overlayIconEl = container.querySelector("#hp-overlay-icon");
    const overlayTitleEl = container.querySelector("#hp-overlay-title");
    const overlayTextEl = container.querySelector("#hp-overlay-text");

    function formatTime(ms) {
      const s = Math.max(0, Math.floor(ms / 1000));
      return new Date(s * 1000).toISOString().substr(11, 8);
    }

    function updateTimerUI() {
      timerEl.textContent = formatTime(state.elapsed);
    }

    function clearCheckMarks() {
      cells.forEach(c => c.el.classList.remove("is-wrong", "is-right"));
    }

    function computeSolved() {
      for (let i = 0; i < 81; i++) {
        const givenChar = puzzle[i];
        const expected = solution[i];

        if (givenChar !== ".") continue;
        if (state.cells[i].value !== expected) return false;
      }

      return true;
    }

    function isFinished() {
      return state.solved || state.revealed;
    }

    function pauseTimer(saveNow = false) {
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
        if (saveNow) save();
      }
    }

    function startTimer() {
      if (state.running || isFinished()) return;

      state.running = true;
      lastTick = Date.now();

      timerInterval = setInterval(() => {
        const now = Date.now();
        state.elapsed += (now - lastTick);
        lastTick = now;
        updateTimerUI();

        saveTick++;

        if (saveTick >= SAVE_EVERY) {
          saveTick = 0;
          save();
        }
      }, 1000);

      save();
    }

    function renderOverlayContent() {
      badgeIdEl.textContent = `Daily Sudoku Challenge #${puzzleId}`;

      if (state.solved) {
        overlayIconEl.textContent = "🎉";
        overlayTitleEl.textContent = "You Solved the Daily Sudoku Challenge!";
        badgeTimeEl.textContent = `Time: ${formatTime(state.elapsed)}`;
        overlayTextEl.textContent = "Congratulations — you did it! Come back for another Daily Sudoku Challenge, or explore more puzzles to enjoy online and offline.";
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "📘";
        overlayTitleEl.textContent = "Answer Revealed";
        badgeTimeEl.textContent = `Time: ${formatTime(state.elapsed)}`;
        overlayTextEl.textContent = "Here is the completed Daily Sudoku Challenge. Try another online puzzle, or explore more puzzles to enjoy online and offline.";
      }
    }

    function showOverlay() {
      renderOverlayContent();
      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");
      state.overlaySeen = false;
      save();
    }

    function hideOverlay() {
      overlayEl.classList.remove("on");
      overlayEl.setAttribute("aria-hidden", "true");
      state.overlaySeen = true;
      save();
    }

    function showSolved() {
      state.solved = true;
      state.revealed = false;
      pauseTimer(true);
      renderOverlayContent();
      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");
      statEl.textContent = "Daily Sudoku Challenge Solved! 🎉";
      state.overlaySeen = false;
      save();
    }

    function revealAnswer() {
      if (isFinished()) return;

      const ok = confirm("Reveal the answer? This will end the puzzle.");
      if (!ok) return;

      clearCheckMarks();

      for (let i = 0; i < 81; i++) {
        if (puzzle[i] === ".") {
          state.cells[i].value = solution[i];
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
      save();
      showOverlay();
    }

    function renderCell(i) {
      const c = cells[i];
      if (c.given) return;

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

    function handleInput(num) {
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
      save();

      if (computeSolved()) showSolved();
    }

    puzzle.split("").forEach((char, i) => {
      const cell = document.createElement("div");
      cell.className = `hp-cell ${char !== "." ? "given" : ""}`;

      const row = Math.floor(i / 9);
      const col = i % 9;

      if (col === 0) cell.classList.add("bL");
      if (col === 8) cell.classList.add("bR");
      if (row === 0) cell.classList.add("bT");
      if (row === 8) cell.classList.add("bB");
      if (col === 2 || col === 5) cell.classList.add("bR");
      if (row === 2 || row === 5) cell.classList.add("bB");

      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Row ${row + 1}, Column ${col + 1}`);
      cell.tabIndex = 0;
      cell.dataset.idx = String(i);

      const inner = document.createElement("div");
      inner.className = "hp-cell-inner";

      const valueSpan = document.createElement("span");
      valueSpan.className = "hp-value";

      let nb = null;

      if (char === ".") {
        nb = document.createElement("div");
        nb.className = "hp-note-box";

        for (let n = 1; n <= 9; n++) {
          const nv = document.createElement("div");
          nv.className = "hp-n-val";
          nv.textContent = "";
          nb.appendChild(nv);
        }
      }

      inner.appendChild(valueSpan);

      if (char !== ".") {
        valueSpan.textContent = char;
      } else {
        inner.appendChild(nb);
      }

      cell.appendChild(inner);

      const selectCell = () => {
        if (isFinished()) return;

        if (cells[selected]?.el) cells[selected].el.classList.remove("selected");

        selected = i;
        cell.classList.add("selected");
        cell.focus({ preventScroll: true });
        statEl.textContent = `Selected: Row ${row + 1}, Col ${col + 1}`;
      };

      cell.addEventListener("click", (e) => {
        e.stopPropagation();
        selectCell();
      });

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

      renderCell(i);
    });

    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        if (cells[selected]?.el) cells[selected].el.classList.remove("selected");

        selected = null;
        statEl.textContent = isFinished()
          ? (state.revealed ? "Answer revealed." : "Daily Sudoku Challenge Solved! 🎉")
          : "Tap a cell to begin";
      }
    });

    container.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      if (link) return;

      const nBtn = e.target.closest("[data-n]");

      if (nBtn) {
        handleInput(parseInt(nBtn.dataset.n, 10));
        return;
      }

      const aBtn = e.target.closest("[data-a]");
      if (!aBtn) return;

      const a = aBtn.dataset.a;

      if (a === "erase") handleInput(0);

      if (a === "clear") {
        clearCheckMarks();
        statEl.textContent = "Check highlights cleared.";
      }

      if (a === "t-start") startTimer();

      if (a === "t-pause") pauseTimer(true);

      if (a === "t-reset") {
        pauseTimer(false);
        state.elapsed = 0;
        updateTimerUI();
        save();
      }

      if (a === "reset-board") {
        if (confirm("Clear Board?")) {
          state.cells.forEach(c => {
            c.value = "";
            c.notes.fill(false);
          });

          cells.forEach((c, i) => {
            renderCell(i);
            c.el.classList.remove("is-wrong", "is-right", "selected");
          });

          selected = null;
          hideOverlay();
          state.solved = false;
          state.revealed = false;
          state.overlaySeen = false;
          state.elapsed = 0;
          pauseTimer(true);
          updateTimerUI();
          statEl.textContent = "Tap a cell to begin";
          save();
        }
      }

      if (a === "reveal-answer") {
        revealAnswer();
      }

      if (a === "check") {
        if (isFinished()) return;

        clearCheckMarks();

        cells.forEach((c, i) => {
          if (!c.given && state.cells[i].value) {
            if (state.cells[i].value === solution[i]) c.el.classList.add("is-right");
            else c.el.classList.add("is-wrong");
          }
        });

        if (computeSolved()) showSolved();
      }

      if (a === "close-solved") {
        hideOverlay();
        save();
      }

      if (a === "share") {
        const shareData = {
          title: `Daily Sudoku Challenge #${puzzleId} — Hare Publishing`,
          text: state.solved
            ? `I solved today’s Daily Sudoku Challenge #${puzzleId} in ${formatTime(state.elapsed)}!`
            : state.revealed
              ? `I revealed the answer for Daily Sudoku Challenge #${puzzleId} at Hare Publishing.`
              : `I’m playing today’s Daily Sudoku Challenge #${puzzleId}!`,
          url: window.location.href
        };

        if (navigator.share) {
          navigator.share(shareData).catch(() => {});
        } else {
          try {
            navigator.clipboard.writeText(window.location.href);
            statEl.textContent = "Link copied! 📋";
          } catch {
            statEl.textContent = "Copy the link from your address bar 🙂";
          }
        }
      }
    });

    notesBtn.onclick = () => {
      if (isFinished()) return;

      notesOn = !notesOn;
      notesBtn.textContent = notesOn ? "✎ Notes: ON" : "✎ Notes: OFF";
      notesBtn.classList.toggle("active", notesOn);
      notesBtn.setAttribute("aria-pressed", notesOn ? "true" : "false");
    };

    document.addEventListener("keydown", (e) => {
      if (overlayEl.classList.contains("on")) {
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
    });

    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) hideOverlay();
    });

    updateTimerUI();

    if (state.running && !state.solved && !state.revealed) {
      startTimer();
    }

    if (state.solved || state.revealed) {
      renderOverlayContent();

      if (state.solved) {
        statEl.textContent = "Daily Sudoku Challenge Solved! 🎉";
      } else {
        statEl.textContent = "Answer revealed.";
      }
    }

    if ((state.solved || state.revealed) && !state.overlaySeen) {
      showOverlay();
    }
  }
};

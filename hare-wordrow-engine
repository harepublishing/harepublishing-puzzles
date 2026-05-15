/* =========================================================
   HARE PUBLISHING WORDROW ENGINE
   GitHub/jsDelivr hosted engine file

   Suggested filename:
   hare-wordrow-engine.js

   Expected page setup:
   - A container with id="hp-wordrow-container"
   - A puzzle data block/object: window.HareWordrowData or JSON block id="hp-wordrow-data"
   - This engine loaded after the puzzle data block

   Uses shared CSS:
   - shared-CSS-code-2026-05-15.txt
   ========================================================= */

window.HareWordrowEngine = {
  init({
    containerId = "hp-wordrow-container",
    dataId = "hp-wordrow-data",
    dataObject = window.HareWordrowData
  } = {}) {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error("HareWordrowEngine: puzzle container missing.");
      return;
    }

    if (container.dataset.hpWordrowMounted === "true") {
      console.warn("HareWordrowEngine: this container has already been mounted.");
      return;
    }

    container.dataset.hpWordrowMounted = "true";
    container.setAttribute("tabindex", "0");

    const mount = container.querySelector(".hpw-mount");
    if (!mount) {
      console.error("HareWordrowEngine: .hpw-mount element missing inside puzzle container.");
      return;
    }

    const yearEl = document.getElementById("hpw-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const dataEl = document.getElementById(dataId);
    let pageData = dataObject || null;

    if (!pageData && dataEl) {
      try {
        pageData = JSON.parse(dataEl.textContent || "{}");
      } catch (err) {
        console.error("HareWordrowEngine: puzzle data block contains invalid JSON.", err);
      }
    }

    const MORE_PUZZLES_URL = pageData?.morePuzzlesUrl || "https://harepublishing.com/online-puzzles";
    const SHOP_URL = pageData?.shopUrl || "https://harepublishing.com/shop";
    const MAX_GUESSES = Number(pageData?.maxGuesses || 6);

    function escapeHtml(str) {
      return String(str).replace(/[&<>\"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '\"': "&quot;",
        "'": "&#39;"
      }[s]));
    }

    function clean(value) {
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

    if (!pageData) {
      showConfigError("Wordrow puzzle data is missing. Add window.HareWordrowData before loading the engine.");
      return;
    }

    const puzzleId = String(pageData.puzzleId || "").trim();
    const answer = clean(pageData.answer || pageData.ANSWER);
    const puzzleDate = formatPuzzleDate(pageData.puzzleDate || pageData.date || "");

    if (!puzzleId) {
      showConfigError("Wordrow puzzleId is missing.");
      return;
    }

    if (answer.length !== 5) {
      showConfigError("Wordrow answer must be exactly 5 letters A-Z.");
      return;
    }

    if (!Number.isInteger(MAX_GUESSES) || MAX_GUESSES < 1) {
      showConfigError("Wordrow maxGuesses must be a positive whole number.");
      return;
    }

    // =========================================================
    // SCHEMA
    // =========================================================
    (function injectSchema() {
      const existing = document.getElementById("hpw-schema");
      if (existing) existing.remove();

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": `Wordrow #${puzzleId}`,
        "description": "Play today's 5-letter Wordrow puzzle by Hare Publishing. Includes color hints and progress saving.",
        "genre": "Puzzle",
        "url": window.location.href,
        "inLanguage": "en",
        "audience": { "@type": "PeopleAudience", "suggestedMinAge": "8" },
        "numberOfPlayers": "1",
        "copyrightYear": String(new Date().getFullYear()),
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://www.harepublishing.com/"
        }
      };

      const script = document.createElement("script");
      script.id = "hpw-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    })();

    // =========================================================
    // STATE
    // =========================================================
    const SAVE_KEY = `hp_wr_${puzzleId}`;

    function defaultState() {
      return {
        guesses: [],
        statuses: [],
        current: "",
        solved: false,
        revealed: false,
        lost: false,
        solvedAt: "",
        revealedAt: "",
        overlaySeen: false
      };
    }

    function loadState() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const merged = parsed ? { ...defaultState(), ...parsed } : defaultState();

        if (!Array.isArray(merged.guesses)) merged.guesses = [];
        if (!Array.isArray(merged.statuses)) merged.statuses = [];
        if (typeof merged.current !== "string") merged.current = "";
        if (typeof merged.solved !== "boolean") merged.solved = false;
        if (typeof merged.revealed !== "boolean") merged.revealed = false;
        if (typeof merged.lost !== "boolean") merged.lost = false;
        if (typeof merged.solvedAt !== "string") merged.solvedAt = "";
        if (typeof merged.revealedAt !== "string") merged.revealedAt = "";
        if (typeof merged.overlaySeen !== "boolean") merged.overlaySeen = false;

        merged.guesses = merged.guesses.map(clean).filter(g => g.length === 5).slice(0, MAX_GUESSES);
        merged.current = clean(merged.current).slice(0, 5);

        return merged;
      } catch {
        return defaultState();
      }
    }

    let state = loadState();

    function saveState() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch {}
    }

    window.addEventListener("beforeunload", saveState);

    // =========================================================
    // GAME LOGIC
    // =========================================================
    function evaluateGuess(guess) {
      const res = Array(5).fill("absent");
      const counts = {};

      for (let i = 0; i < 5; i++) counts[answer[i]] = (counts[answer[i]] || 0) + 1;

      for (let i = 0; i < 5; i++) {
        if (guess[i] === answer[i]) {
          res[i] = "correct";
          counts[guess[i]]--;
        }
      }

      for (let i = 0; i < 5; i++) {
        if (res[i] === "correct") continue;
        const ch = guess[i];
        if (counts[ch] > 0) {
          res[i] = "present";
          counts[ch]--;
        }
      }

      return res;
    }

    function recomputeStatus() {
      state.statuses = state.guesses.map(g => evaluateGuess(clean(g)));
      state.solved = state.guesses.includes(answer);
      state.lost = !state.solved && !state.revealed && state.guesses.length >= MAX_GUESSES;
    }

    function computeLetterStates() {
      const priority = { correct: 3, present: 2, absent: 1 };
      const letterStates = {};

      for (let i = 0; i < state.guesses.length; i++) {
        const guess = state.guesses[i];
        const statuses = state.statuses[i] || [];
        for (let j = 0; j < 5; j++) {
          const ch = guess[j];
          const st = statuses[j];
          if (!ch || !st) continue;
          const current = letterStates[ch];
          if (!current || priority[st] > priority[current]) letterStates[ch] = st;
        }
      }

      return letterStates;
    }

    function isFinished() {
      return state.solved || state.revealed || state.lost;
    }

    // =========================================================
    // RENDER
    // =========================================================
    const KEYS = [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
    ];

    function renderGrid() {
      const activeRow = Math.min(state.guesses.length, MAX_GUESSES - 1);
      let html = "";

      for (let r = 0; r < MAX_GUESSES; r++) {
        const guess = state.guesses[r] || "";
        const statuses = state.statuses[r] || null;
        const draft = (r === activeRow && !isFinished()) ? state.current : "";

        html += `<div class="hpw-row">`;

        for (let c = 0; c < 5; c++) {
          const ch = guess ? (guess[c] || "") : (draft[c] || "");
          const classes = ["hpw-tile"];

          if (statuses && statuses[c]) {
            classes.push(statuses[c]);
          } else if (r === activeRow && !isFinished()) {
            classes.push("hpw-active");
          }

          html += `<div class="${classes.join(" ")}">${escapeHtml(ch)}</div>`;
        }

        html += `</div>`;
      }

      return html;
    }

    function renderKeyboard() {
      const states = computeLetterStates();

      return KEYS.map((row, rowIndex) => `
        <div class="hpw-kb-row" data-row="${rowIndex}">
          ${row.map(key => {
            const cls = ["hpw-key"];
            if (key.length === 1 && states[key]) cls.push(states[key]);
            return `<button type="button" class="${cls.join(" ")}" data-k="${key}">${escapeHtml(key)}</button>`;
          }).join("")}
        </div>
      `).join("");
    }

    function renderOverlayContent() {
      const badgeIdEl = mount.querySelector("#hpw-badge-id");
      const badgeMetaEl = mount.querySelector("#hpw-badge-meta");
      const overlayIconEl = mount.querySelector("#hpw-overlay-icon");
      const overlayTitleEl = mount.querySelector("#hpw-overlay-title");
      const overlayTextEl = mount.querySelector("#hpw-overlay-text");

      if (!badgeIdEl || !badgeMetaEl || !overlayIconEl || !overlayTitleEl || !overlayTextEl) return;

      badgeIdEl.textContent = `Wordrow #${puzzleId}`;
      badgeMetaEl.textContent = `Guesses: ${state.guesses.length}/${MAX_GUESSES}`;

      if (state.solved) {
        overlayIconEl.textContent = "🎉";
        overlayTitleEl.textContent = "You Solved the Wordrow Puzzle!";
        overlayTextEl.innerHTML = `
          <div class="hp-modal-lead">Congratulations — you did it!</div>
          <div class="hp-modal-subtext">You found the hidden word.</div>
          <div class="hp-modal-subtext">New puzzles are added daily in the Puzzlers Hub.</div>
        `;
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "📘";
        overlayTitleEl.textContent = "Answer Revealed";
        overlayTextEl.innerHTML = `
          <div class="hp-modal-lead">The word was ${escapeHtml(answer)}.</div>
          <div class="hp-modal-subtext">Now that you've seen the answer, try another Daily Brain Boost puzzle.</div>
          <div class="hp-modal-subtext">Or explore a whole stack of puzzles to enjoy offline.</div>
        `;
        return;
      }

      overlayIconEl.textContent = "🙂";
      overlayTitleEl.textContent = "Puzzle Over";
      overlayTextEl.innerHTML = `
        <div class="hp-modal-lead">Good try — the word was ${escapeHtml(answer)}.</div>
        <div class="hp-modal-subtext">New puzzles are added daily in the Puzzlers Hub.</div>
        <div class="hp-modal-subtext">Or explore a whole stack of puzzles to enjoy offline.</div>
      `;
    }

    function showOverlay() {
      renderOverlayContent();
      const overlayEl = mount.querySelector("#hpw-overlay");
      if (!overlayEl) return;

      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");

      state.overlaySeen = false;
      saveState();
    }

    function hideOverlay() {
      const overlayEl = mount.querySelector("#hpw-overlay");
      if (!overlayEl) return;

      overlayEl.classList.remove("on");
      overlayEl.setAttribute("aria-hidden", "true");

      state.overlaySeen = true;
      saveState();
    }

    function toast(message) {
      const toastEl = mount.querySelector(".hpw-toast-msg");
      if (toastEl) toastEl.textContent = message;
    }

    function getStatusMessage() {
      if (state.solved) return "Solved previously! 🎉";
      if (state.revealed) return "Answer revealed.";
      if (state.lost) return "Played previously.";
      return "Guess the hidden word in 6 tries.";
    }

    function render() {
      mount.innerHTML = `
        ${puzzleDate ? `<div class="hp-puzzle-date">${escapeHtml(puzzleDate)}</div>` : ""}

        <div class="hpw-wrap">
          <div class="hpw-toast" aria-live="polite">
            <span class="hpw-toast-msg">${escapeHtml(getStatusMessage())}</span>
          </div>

          <div class="hpw-grid" id="hpw-grid">${renderGrid()}</div>

          <div class="hpw-kb" aria-label="Keyboard">${renderKeyboard()}</div>

          <div class="hpw-help-panel">
            <div class="hpw-help">
              <span class="hpw-help-title">How to play</span>
              <span class="hpw-help-line"><strong style="color:var(--hp-green);">Green</strong> = right letter, right spot</span>
              <span class="hpw-help-line"><strong style="color:var(--hp-orange);">Orange</strong> = right letter, wrong spot</span>
              <span class="hpw-help-line"><strong style="color:#6b7280;">Gray</strong> = not in the word</span>
              <span class="hpw-help-line"><strong>Enter</strong> submits your guess <span class="hpw-help-sep">•</span> <strong>Backspace</strong> erases a letter</span>
            </div>
          </div>

          <div class="hpw-actions">
            <button type="button" class="hpw-btn" data-a="reset-puzzle">Reset Puzzle</button>
            <button type="button" class="hpw-btn reveal" data-a="reveal-answer">Reveal Answer</button>
          </div>
        </div>

        <div class="hp-overlay" id="hpw-overlay" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Wordrow result">
            <div id="hpw-overlay-icon" style="font-size:28px; line-height:1;">🎉</div>
            <h3 id="hpw-overlay-title">You Solved the Wordrow Puzzle!</h3>

            <div class="hp-badges">
              <span class="hp-badge" id="hpw-badge-id"></span>
              <span class="hp-badge" id="hpw-badge-meta"></span>
            </div>

            <div id="hpw-overlay-text">
              <div class="hp-modal-lead">Congratulations — you did it!</div>
              <div class="hp-modal-subtext">You found the hidden word.</div>
              <div class="hp-modal-subtext">New puzzles are added daily in the Puzzlers Hub.</div>
            </div>

            <div class="hp-modal-actions">
              <a class="hp-link-btn secondary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
              <a class="hp-link-btn primary" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>
              <button type="button" class="hp-link-btn neutral" data-a="share">Share</button>
              <button type="button" class="hp-link-btn neutral" data-a="close-overlay">Back to Puzzle</button>
              <button type="button" class="hp-link-btn danger full" data-a="reset-puzzle">Reset Puzzle</button>
            </div>

            <small>Hare Publishing • Wordrow</small>
          </div>
        </div>
      `;

      renderOverlayContent();
    }

    // =========================================================
    // ACTIONS
    // =========================================================
    function resetPuzzle() {
      state = defaultState();
      saveState();
      render();
      toast("Reset! Type your first guess.");
    }

    function revealAnswer() {
      if (isFinished()) return;
      const ok = confirm("Reveal the answer? This will end the puzzle.");
      if (!ok) return;

      state.current = "";
      state.revealed = true;
      state.solved = false;
      state.lost = false;
      state.solvedAt = "";
      if (!state.revealedAt) state.revealedAt = new Date().toISOString();
      state.overlaySeen = false;

      saveState();
      render();
      showOverlay();
    }

    function submitGuess() {
      if (isFinished()) return;

      const guess = clean(state.current);
      if (guess.length !== 5) {
        toast("Need 5 letters.");
        return;
      }

      const statuses = evaluateGuess(guess);
      state.guesses.push(guess);
      state.statuses.push(statuses);
      state.current = "";

      if (guess === answer) {
        state.solved = true;
        state.revealed = false;
        state.lost = false;
        if (!state.solvedAt) state.solvedAt = new Date().toISOString();
        state.revealedAt = "";
        state.overlaySeen = false;
        saveState();
        render();
        showOverlay();
        return;
      }

      if (state.guesses.length >= MAX_GUESSES) {
        state.lost = true;
        state.overlaySeen = false;
        saveState();
        render();
        showOverlay();
        return;
      }

      saveState();
      render();
      toast("Next guess…");
    }

    function handleKey(key) {
      if (isFinished()) return;

      if (key === "ENTER") {
        submitGuess();
        return;
      }

      if (key === "⌫" || key === "BACKSPACE" || key === "DELETE") {
        state.current = state.current.slice(0, -1);
        saveState();
        render();
        return;
      }

      if (/^[A-Z]$/.test(key)) {
        if (state.current.length >= 5) return;
        state.current += key;
        saveState();
        render();
      }
    }

    function sharePuzzle() {
      const shareData = {
        title: `Wordrow #${puzzleId} — Hare Publishing`,
        text: state.solved
          ? `I solved today’s Wordrow #${puzzleId} in ${state.guesses.length}/${MAX_GUESSES}!`
          : state.revealed
            ? `I revealed the answer for today’s Wordrow #${puzzleId}.`
            : `I played today’s Wordrow #${puzzleId} — ${state.guesses.length}/${MAX_GUESSES} tries.`,
        url: window.location.href
      };

      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
        return;
      }

      try {
        navigator.clipboard.writeText(window.location.href);
        toast("Link copied! 📋");
      } catch {
        toast("Copy the link from your address bar 🙂");
      }
    }

    // =========================================================
    // EVENTS
    // =========================================================
    container.addEventListener("mousedown", e => {
      const link = e.target?.closest?.("a[href]");
      if (link) return;
      container.focus({ preventScroll: true });
    });

    container.addEventListener("click", e => {
      const link = e.target?.closest?.("a[href]");
      if (link) return;

      const btn = e.target.closest("button,[data-a],[data-k]");
      if (!btn) return;

      const action = btn.getAttribute("data-a");
      const key = btn.getAttribute("data-k");

      if (key) {
        handleKey(key);
        return;
      }

      if (action === "reset-puzzle") {
        resetPuzzle();
        return;
      }

      if (action === "reveal-answer") {
        revealAnswer();
        return;
      }

      if (action === "close-overlay") {
        hideOverlay();
        return;
      }

      if (action === "share") {
        sharePuzzle();
      }
    });

    container.addEventListener("keydown", e => {
      const target = e.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : "";

      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
      if (!container.contains(document.activeElement)) return;

      const overlayEl = mount.querySelector("#hpw-overlay");
      if (overlayEl?.classList.contains("on")) {
        if (e.key === "Escape") {
          e.preventDefault();
          hideOverlay();
        }
        return;
      }

      const key = e.key.toUpperCase();

      if (key === "ENTER") {
        e.preventDefault();
        handleKey("ENTER");
        return;
      }

      if (key === "BACKSPACE" || key === "DELETE") {
        e.preventDefault();
        handleKey(key);
        return;
      }

      if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        handleKey(key);
      }
    });

    mount.addEventListener("click", e => {
      const overlayEl = mount.querySelector("#hpw-overlay");
      if (overlayEl && e.target === overlayEl) hideOverlay();
    });

    // =========================================================
    // INIT
    // =========================================================
    recomputeStatus();
    saveState();
    render();

    if ((state.solved || state.revealed || state.lost) && !state.overlaySeen) {
      showOverlay();
    }
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.HareWordrowEngine.init());
} else {
  window.HareWordrowEngine.init();
}

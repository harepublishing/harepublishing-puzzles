/* =========================================================
   HARE PUBLISHING WORDROW PLATFORM ENGINE
   Version: 1.2
   Gameplay-only engine for the Cryptogram-style platform shell.
   Exposes: window.HareWordrowEngine
   ========================================================= */

window.HareWordrowEngine = (() => {
  const VERSION = "wordrow-platform-engine-v1.2";
  const STORAGE_PREFIX = "hp_wr_";
  const MORE_PUZZLES_URL = "https://www.harepublishing.com/online-puzzles";
  const SHOP_URL = "https://www.harepublishing.com/shop";

  const CSS = `
    #hp-wordrow-container,
    #hp-wordrow-container * { box-sizing: border-box; }

    #hp-wordrow-container .hpwr-shell,
    #hp-wordrow-container .hpwr-card { overflow: visible !important; }

    #hp-wordrow-container .hpwr-card {
      position: relative;
      border: 0;
      box-shadow: none;
      padding: 0;
      background: transparent;
      min-height: 0;
    }

    #hp-wordrow-container .hpwr-status {
      width: 100%;
      max-width: 900px;
      margin: 0 auto 16px;
      padding: 10px 14px;
      border-radius: 12px;
      background: #f7f9fb;
      border: 1px solid #dde7ef;
      text-align: center;
      box-shadow: none;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #hp-wordrow-container .hpwr-status-msg {
      display: block;
      width: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      border-radius: 0;
      font-size: 14px;
      font-weight: 900;
      color: #333;
      text-align: center;
    }

    #hp-wordrow-container .hpwr-board-wrap {
      max-width: 360px;
      margin: 0 auto 18px;
    }

    #hp-wordrow-container .hpwr-grid {
      display: grid;
      grid-template-rows: repeat(6, 54px);
      gap: 7px;
      width: max-content;
      max-width: 100%;
      margin: 0 auto;
      justify-content: center;
    }

    #hp-wordrow-container .hpwr-row {
      display: grid;
      grid-template-columns: repeat(5, 54px);
      gap: 7px;
      justify-content: center;
    }

    #hp-wordrow-container .hpwr-tile {
      width: 54px;
      height: 54px;
      min-height: 54px;
      border: 2px solid #d1d5db;
      border-radius: 10px;
      background: #fff;
      color: #111;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      line-height: 1;
      font-weight: 900;
      text-transform: uppercase;
      user-select: none;
    }

    #hp-wordrow-container .hpwr-tile.active {
      border-color: #107FBB;
      box-shadow: inset 0 0 0 3px #107FBB;
    }

    #hp-wordrow-container .hpwr-tile.correct { background: #00A54F; border-color: #00A54F; color: #fff; }
    #hp-wordrow-container .hpwr-tile.present { background: #F7941C; border-color: #F7941C; color: #fff; }
    #hp-wordrow-container .hpwr-tile.absent { background: #9AA0A6; border-color: #9AA0A6; color: #fff; }
    #hp-wordrow-container .hpwr-tile.revealed { background: #107FBB; border-color: #107FBB; color: #fff; }

    #hp-wordrow-container .hpwr-keyboard {
      width: min(100%, 680px);
      margin: 0 auto 12px;
    }

    #hp-wordrow-container .hpwr-key-row {
      display: grid;
      gap: 7px;
      margin-bottom: 8px;
    }

    #hp-wordrow-container .hpwr-key-row-top { grid-template-columns: repeat(10, minmax(0, 1fr)); }
    #hp-wordrow-container .hpwr-key-row-mid { grid-template-columns: repeat(9, minmax(0, 1fr)); width: 88%; margin-left: auto; margin-right: auto; }
    #hp-wordrow-container .hpwr-key-row-bottom { grid-template-columns: 1.65fr repeat(7, minmax(0, 1fr)) 1.35fr; }

    #hp-wordrow-container .hpwr-key,
    #hp-wordrow-container .hpwr-action-btn,
    #hp-wordrow-container .hp-link-btn {
      font-family: inherit;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all .18s ease;
    }

    #hp-wordrow-container .hpwr-key {
      min-height: 40px;
      padding: 9px 4px;
      border: 1px solid #dde2e7;
      border-radius: 10px;
      background: #fff;
      color: #222;
      font-size: 15px;
      line-height: 1;
      font-weight: 900;
    }

    #hp-wordrow-container .hpwr-key:hover,
    #hp-wordrow-container .hpwr-action-btn:hover,
    #hp-wordrow-container .hp-link-btn:hover {
      transform: translateY(-1px);
    }

    #hp-wordrow-container .hpwr-key.correct { background: #00A54F; border-color: #00A54F; color: #fff; }
    #hp-wordrow-container .hpwr-key.present { background: #F7941C; border-color: #F7941C; color: #fff; }
    #hp-wordrow-container .hpwr-key.absent { background: #9AA0A6; border-color: #9AA0A6; color: #fff; }

    #hp-wordrow-container .hpwr-actions {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin: 10px auto 0;
    }

    #hp-wordrow-container .hpwr-action-btn {
      min-height: 42px;
      border: 2px solid #ffb4b4;
      border-radius: 12px;
      background: #fff;
      color: #ED1B24;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 900;
    }

    #hp-wordrow-container .hpwr-action-btn:hover {
      background: #ED1B24;
      border-color: #ED1B24;
      color: #fff;
    }

    #hp-wordrow-container .material-symbols-outlined {
      font-family: "Material Symbols Outlined";
      font-weight: normal;
      font-style: normal;
      font-size: 20px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-flex;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-feature-settings: "liga";
      -webkit-font-smoothing: antialiased;
      font-variation-settings: 'FILL' 1, 'wght' 650, 'GRAD' 0, 'opsz' 24;
    }

    #hp-wordrow-container .hp-overlay {
      display: none;
      align-items: center;
      justify-content: center;
    }

    #hp-wordrow-container .hp-overlay.on {
      display: flex;
    }

    #hp-wordrow-container #hp-wordrow-overlay {
      position: absolute;
      inset: 0;
      z-index: 50;
      background: rgba(255,255,255,.76);
      border-radius: 18px;
      padding: 16px;
    }

    #hp-wordrow-container #hp-wordrow-help-modal {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0,0,0,.45);
      padding: 20px;
    }

    #hp-wordrow-container .hp-modal {
      background: #fff;
      width: min(560px, 100%);
      border-radius: 22px;
      padding: 26px;
      box-shadow: 0 20px 70px rgba(0,0,0,.25);
      text-align: center;
      color: #222;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-modal {
      width: min(760px, 100%);
      padding: 44px 44px 36px;
      border-radius: 20px;
      box-shadow: 0 18px 48px rgba(0,0,0,.18);
    }

    #hp-wordrow-container #hp-wordrow-overlay #hp-wordrow-overlay-icon {
      font-size: 42px !important;
      line-height: 1;
      color: #007A3A;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    #hp-wordrow-container .hp-modal h3 {
      margin: 10px 0 14px;
      font-size: 26px;
      line-height: 1.15;
      color: #007A3A;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-modal h3 {
      margin: 18px 0 14px;
      font-size: clamp(30px, 4vw, 44px);
      line-height: 1.1;
    }

    #hp-wordrow-container .hp-modal-lead {
      font-size: 17px;
      font-weight: 900;
      margin-bottom: 8px;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-modal-lead {
      font-size: 22px;
      margin-bottom: 12px;
    }

    #hp-wordrow-container .hp-modal-subtext {
      font-size: 14px;
      color: #555;
      line-height: 1.4;
      margin-bottom: 5px;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-modal-subtext {
      font-size: 18px;
      line-height: 1.35;
      margin-bottom: 6px;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-result-meta {
      margin: 8px 0 18px;
      text-align: center;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-result-puzzle-title {
      display: block;
      color: #007A3A;
      font-size: 30px;
      line-height: 1.2;
      font-weight: 900;
      margin-bottom: 18px;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-result-stats-line {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 10px 18px;
      color: #555;
      font-size: 18px;
      line-height: 1.25;
      font-weight: 900;
      margin: 0 auto;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-result-stat-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-result-stat-chip .material-symbols-outlined {
      font-size: 24px;
      line-height: 1;
      color: #007A3A;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-result-stat-chip strong {
      color: #007A3A;
      font-weight: 900;
    }

    #hp-wordrow-container .hp-recommend-card {
      margin: 18px auto 0;
      padding: 14px 16px;
      border-radius: 16px;
      background: #f0fbf5;
      border: 1px solid #BFEBD3;
      max-width: 520px;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-recommend-card {
      margin-top: 30px;
      padding: 28px 34px;
      max-width: 680px;
      background: #f0fbf5;
      border-color: #BFEBD3;
    }

    #hp-wordrow-container .hp-recommend-title {
      font-size: 16px;
      font-weight: 900;
      color: #007A3A;
      margin-bottom: 6px;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-recommend-title {
      font-size: 22px;
      margin-bottom: 14px;
    }

    #hp-wordrow-container .hp-recommend-copy {
      font-size: 14px;
      color: #555;
      line-height: 1.35;
      margin-bottom: 10px;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-recommend-copy {
      font-size: 18px;
      line-height: 1.35;
      margin-bottom: 18px;
    }

    #hp-wordrow-container .hp-modal-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 18px;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-modal-actions {
      gap: 14px;
      margin-top: 22px;
    }

    #hp-wordrow-container .hp-link-btn {
      border: 2px solid transparent;
      border-radius: 12px;
      min-height: 42px;
      padding: 11px 12px;
      font-weight: 900;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: inherit;
      font-size: 14px;
      transition: all .18s ease;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-link-btn {
      min-height: 52px;
      padding: 14px 18px;
      font-size: 18px;
      border-radius: 16px;
    }

    #hp-wordrow-container .hp-link-btn.primary {
      background: #00A54F;
      color: #fff;
      border-color: #00A54F;
    }

    #hp-wordrow-container .hp-link-btn.primary:hover {
      background: #fff;
      color: #007A3A;
      border-color: #BFEBD3;
    }

    #hp-wordrow-container .hp-link-btn.secondary {
      background: #fff;
      color: #007A3A;
      border: 2px solid #BFEBD3;
    }

    #hp-wordrow-container .hp-link-btn.secondary:hover {
      background: #00A54F;
      border-color: #00A54F;
      color: #fff;
    }

    #hp-wordrow-container .hp-link-btn.neutral {
      background: #fff;
      color: #333;
      border-color: #e1e5ea;
    }

    #hp-wordrow-container .hp-link-btn.neutral:hover {
      background: #00A54F;
      border-color: #00A54F;
      color: #fff;
    }

    #hp-wordrow-container .hp-link-btn.full {
      grid-column: 1 / -1;
    }

    #hp-wordrow-container .hp-help-modal-content {
      text-align: left;
      background: #f7f9fb;
      border: 1px solid #dce8f2;
      border-radius: 16px;
      padding: 18px;
      margin: 14px 0 6px;
    }

    #hp-wordrow-container .hp-help-modal-content p {
      margin: 0 0 12px;
      font-size: 15px;
      line-height: 1.45;
      color: #3d4b58;
    }

    #hp-wordrow-container .hp-help-modal-content p:last-child { margin-bottom: 0; }

    #hp-wordrow-container .hp-help-icon {
      display: inline-flex;
      width: 28px;
      height: 28px;
      margin-right: 6px;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      color: #107FBB;
      background: #edf6ff;
      border: 1px solid #b9d7ef;
      border-radius: 8px;
    }

    #hp-wordrow-container .hp-help-icon .material-symbols-outlined { font-size: 19px; }

    #hp-wordrow-container .hp-modal small {
      display: block;
      margin-top: 14px;
      color: #777;
      font-size: 12px;
    }

    #hp-wordrow-container #hp-wordrow-overlay .hp-modal small {
      margin-top: 10px;
      font-size: 11px;
    }

    @media (max-width: 760px) {
      #hp-wordrow-container .hpwr-grid { grid-template-rows: repeat(6, 46px); gap: 6px; }
      #hp-wordrow-container .hpwr-row { grid-template-columns: repeat(5, 46px); gap: 6px; }
      #hp-wordrow-container .hpwr-tile { width: 46px; height: 46px; min-height: 46px; border-radius: 9px; font-size: 24px; }
      #hp-wordrow-container .hpwr-keyboard { width: 100%; }
      #hp-wordrow-container .hpwr-key-row { gap: 5px; margin-bottom: 7px; }
      #hp-wordrow-container .hpwr-key { min-height: 38px; font-size: 13px; padding: 8px 3px; }
      #hp-wordrow-container .hp-modal-actions { grid-template-columns: 1fr; }
      #hp-wordrow-container .hp-link-btn.full { grid-column: auto; }
    }
  `;

  function injectStyles() {
    if (document.getElementById("hp-wordrow-platform-engine-css-v12")) return;
    const style = document.createElement("style");
    style.id = "hp-wordrow-platform-engine-css-v12";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  let container = null;
  let mount = null;
  let puzzle = null;
  let state = null;
  let maxGuesses = 6;
  let puzzleTitle = "Wordrow Puzzle";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[char]));
  }

  function cleanWord(value) {
    return String(value || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
  }

  function storageKey() {
    return puzzle?.storageKey || `${STORAGE_PREFIX}${puzzle?.puzzleId || "unknown"}`;
  }

  function defaultState() {
    return {
      guesses: [],
      statuses: [],
      current: "",
      solved: false,
      completed: false,
      isSolved: false,
      revealed: false,
      lost: false,
      status: "in-progress",
      solvedAt: "",
      completedAt: "",
      revealedAt: "",
      finishedAt: "",
      updatedAt: "",
      lastPlayedAt: ""
    };
  }

  function readState() {
    try {
      const raw = localStorage.getItem(storageKey());
      return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
    } catch {
      return defaultState();
    }
  }

  function writeState() {
    if (!puzzle) return;
    try {
      state.updatedAt = new Date().toISOString();
      state.lastPlayedAt = state.updatedAt;
      localStorage.setItem(storageKey(), JSON.stringify(state));
    } catch {}
  }

  function isEnded() {
    return Boolean(state?.solved || state?.revealed || state?.lost);
  }

  function getStoredItems() {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        items.push({ key, data });
      } catch {}
    }
    return items;
  }

  function getDateKey(date) {
    return date.toISOString().slice(0, 10);
  }

  function getCurrentStreak(items) {
    const completedDates = new Set();
    items.forEach(item => {
      const raw = item.data.completedAt || item.data.solvedAt;
      if (!raw) return;
      const date = new Date(raw);
      if (!isNaN(date)) completedDates.add(getDateKey(date));
    });

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 3650; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      if (completedDates.has(getDateKey(checkDate))) streak++;
      else if (i === 0) continue;
      else break;
    }
    return streak;
  }

  function getStats() {
    const items = getStoredItems();
    const solvedItems = items.filter(item => Boolean(item.data.solved || item.data.completed || item.data.isSolved || item.data.solvedAt || item.data.completedAt));
    const inProgressItems = items.filter(item => {
      const d = item.data;
      const ended = Boolean(d.solved || d.completed || d.isSolved || d.solvedAt || d.completedAt || d.revealed || d.revealedAt || d.lost || d.finishedAt);
      const progress = Boolean((Array.isArray(d.guesses) && d.guesses.length > 0) || String(d.current || "").length > 0);
      return progress && !ended;
    });
    const playedItems = items.filter(item => {
      const d = item.data;
      return Boolean(d.solved || d.completed || d.isSolved || d.solvedAt || d.completedAt || d.revealed || d.revealedAt || d.lost || d.finishedAt || (Array.isArray(d.guesses) && d.guesses.length > 0) || String(d.current || "").length > 0);
    });
    return {
      streak: getCurrentStreak(solvedItems),
      solved: solvedItems.length,
      inProgress: inProgressItems.length,
      played: playedItems.length
    };
  }

  function compareGuess(guess, answer) {
    const result = Array(5).fill("absent");
    const answerLetters = answer.split("");
    const used = Array(5).fill(false);

    for (let i = 0; i < 5; i++) {
      if (guess[i] === answerLetters[i]) {
        result[i] = "correct";
        used[i] = true;
      }
    }

    for (let i = 0; i < 5; i++) {
      if (result[i] === "correct") continue;
      const found = answerLetters.findIndex((letter, idx) => !used[idx] && letter === guess[i]);
      if (found >= 0) {
        result[i] = "present";
        used[found] = true;
      }
    }

    return result;
  }

  function recomputeState() {
    const guesses = Array.isArray(state.guesses) ? state.guesses.map(cleanWord).filter(word => word.length === 5) : [];
    state.guesses = guesses;
    state.statuses = guesses.map(guess => compareGuess(guess, puzzle.answer));

    if (!state.revealed && !state.lost) {
      state.solved = guesses.includes(puzzle.answer);
      state.completed = state.solved;
      state.isSolved = state.solved;
      state.status = state.solved ? "solved" : "in-progress";
      if (state.solved && !state.completedAt) {
        state.completedAt = state.solvedAt || new Date().toISOString();
        state.solvedAt = state.completedAt;
      }
      if (!state.solved && guesses.length >= maxGuesses) {
        state.lost = true;
        state.status = "finished";
        if (!state.finishedAt) state.finishedAt = new Date().toISOString();
      }
    }
  }

  function getStatusMessage() {
    if (state.solved) return `Wordrow solved!`;
    if (state.revealed) return `Answer revealed. Back to review the completed word.`;
    if (state.lost) return `Good try — the hidden word was ${puzzle.answer}.`;
    if (!state.guesses.length && !state.current) return "Start by entering a five-letter word.";
    if (state.current.length < 5) {
      const left = 5 - state.current.length;
      return `${left} letter${left === 1 ? "" : "s"} left.`;
    }
    return "Press Enter to submit your guess.";
  }

  function getKeyboardStatuses() {
    const keyStatus = {};
    const rank = { absent: 1, present: 2, correct: 3 };
    state.guesses.forEach((guess, rowIndex) => {
      guess.split("").forEach((letter, index) => {
        const status = state.statuses[rowIndex]?.[index];
        if (!status) return;
        if (!keyStatus[letter] || rank[status] > rank[keyStatus[letter]]) keyStatus[letter] = status;
      });
    });
    return keyStatus;
  }

  function renderGrid() {
    const rows = [];
    const currentRow = state.guesses.length;
    const revealRow = state.revealed ? Math.min(state.guesses.length, maxGuesses - 1) : -1;

    for (let row = 0; row < maxGuesses; row++) {
      let word = "";
      let statuses = null;

      if (row < state.guesses.length) {
        word = state.guesses[row];
        statuses = state.statuses[row] || [];
      } else if (row === revealRow) {
        word = puzzle.answer;
        statuses = Array(5).fill("revealed");
      } else if (row === currentRow && !isEnded()) {
        word = state.current || "";
      }

      rows.push(`
        <div class="hpwr-row" role="row">
          ${[0,1,2,3,4].map(col => {
            const active = !isEnded() && row === currentRow && col === Math.min(state.current.length, 4);
            const status = statuses ? statuses[col] : "";
            return `<div class="hpwr-tile ${status} ${active ? "active" : ""}" role="gridcell">${escapeHtml(word[col] || "")}</div>`;
          }).join("")}
        </div>
      `);
    }

    return `<div class="hpwr-grid" role="grid" aria-label="Wordrow guesses">${rows.join("")}</div>`;
  }

  function renderKeyboard() {
    const statuses = getKeyboardStatuses();
    const key = (label, value = label) => `<button type="button" class="hpwr-key ${statuses[value] || ""}" data-a="key" data-key="${value}">${label}</button>`;
    return `
      <div class="hpwr-keyboard" aria-label="On-screen keyboard">
        <div class="hpwr-key-row hpwr-key-row-top">${"QWERTYUIOP".split("").map(letter => key(letter)).join("")}</div>
        <div class="hpwr-key-row hpwr-key-row-mid">${"ASDFGHJKL".split("").map(letter => key(letter)).join("")}</div>
        <div class="hpwr-key-row hpwr-key-row-bottom">${key("Enter", "ENTER")}${"ZXCVBNM".split("").map(letter => key(letter)).join("")}${key("⌫", "BACK")}</div>
      </div>
    `;
  }

  function renderActions() {
    return `
      <div class="hpwr-actions">
        <button type="button" class="hpwr-action-btn hpwr-start-over-btn" data-a="start-over">
          <span class="material-symbols-outlined" aria-hidden="true">restart_alt</span>
          Start Over
        </button>
      </div>
    `;
  }

  function getOverlayStatsLine() {
    const stats = getStats();
    return `
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">local_fire_department</span><strong>${stats.streak.toLocaleString()}</strong> Day Streak</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">trophy</span><strong>${stats.solved.toLocaleString()}</strong> Solved</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">edit_note</span><strong>${stats.inProgress.toLocaleString()}</strong> In Progress</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">beenhere</span><strong>${stats.played.toLocaleString()}</strong> Played</span>
    `;
  }

  function renderRecommendationHtml() {
    if (typeof window.HareWordrowFindNextPuzzle === "function") {
      const nextPuzzle = window.HareWordrowFindNextPuzzle(puzzle.puzzleId);
      if (nextPuzzle?.puzzleId) {
        return `
          <div class="hp-recommend-card">
            <div class="hp-recommend-title">Play Your Next Puzzle</div>
            <div class="hp-recommend-copy">Your next available Wordrow puzzle is ready. Keep the fun going with another hidden word to find.</div>
            <button class="hp-link-btn primary" data-a="load-puzzle" data-puzzle-id="${escapeHtml(nextPuzzle.puzzleId)}">Wordrow #${escapeHtml(nextPuzzle.puzzleId)}</button>
          </div>
        `;
      }
    }

    return `
      <div class="hp-recommend-card">
        <div class="hp-recommend-title">All caught up!</div>
        <div class="hp-recommend-copy">Congratulations — every available Wordrow puzzle has been played.</div>
        <span class="hp-link-btn secondary full" role="status">Congratulations!</span>
      </div>
    `;
  }

  function renderOverlayContent() {
    const badgeIdEl = mount.querySelector("#hp-wordrow-badge-id");
    const badgeMetaEl = mount.querySelector("#hp-wordrow-badge-meta");
    const overlayIconEl = mount.querySelector("#hp-wordrow-overlay-icon");
    const overlayTitleEl = mount.querySelector("#hp-wordrow-overlay-title");
    const overlayTextEl = mount.querySelector("#hp-wordrow-overlay-text");

    if (!badgeIdEl || !badgeMetaEl || !overlayIconEl || !overlayTitleEl || !overlayTextEl) return;

    badgeIdEl.textContent = puzzleTitle;
    badgeMetaEl.innerHTML = getOverlayStatsLine();

    if (state.solved) {
      overlayIconEl.textContent = "celebration";
      overlayTitleEl.textContent = "You Solved the Wordrow!";
      overlayTextEl.innerHTML = `
        <div class="hp-modal-lead">Congratulations — you found the hidden word!</div>
        <div class="hp-modal-subtext">Great job solving this Wordrow puzzle.</div>
        <div class="hp-modal-subtext">Keep your puzzle streak going in the Puzzlers Hub.</div>
        ${renderRecommendationHtml()}
      `;
      return;
    }

    if (state.revealed) {
      overlayIconEl.textContent = "visibility";
      overlayTitleEl.textContent = "Answer Revealed";
      overlayTextEl.innerHTML = `
        <div class="hp-modal-lead">The hidden word was ${escapeHtml(puzzle.answer)}.</div>
        ${renderRecommendationHtml()}
      `;
      return;
    }

    if (state.lost) {
      overlayIconEl.textContent = "sports_score";
      overlayTitleEl.textContent = "Good Try!";
      overlayTextEl.innerHTML = `
        <div class="hp-modal-lead">The hidden word was ${escapeHtml(puzzle.answer)}.</div>
        <div class="hp-modal-subtext">Try another Wordrow puzzle and keep building your streak.</div>
        ${renderRecommendationHtml()}
      `;
    }
  }

  function showOverlay() {
    renderOverlayContent();
    const overlayEl = mount.querySelector("#hp-wordrow-overlay");
    if (!overlayEl) return;
    overlayEl.classList.add("on");
    overlayEl.setAttribute("aria-hidden", "false");
  }

  function hideOverlay() {
    const overlayEl = mount.querySelector("#hp-wordrow-overlay");
    if (!overlayEl) return;
    overlayEl.classList.remove("on");
    overlayEl.setAttribute("aria-hidden", "true");
  }

  async function shareResult() {
    const status = state.solved ? "solved" : state.revealed ? "revealed" : state.lost ? "played" : "played";
    const text = `${puzzleTitle} ${status} on Hare Publishing Wordrow. ${window.location.href}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: puzzleTitle, text, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(text);
      flash("Share text copied.");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        flash("Share text copied.");
      } catch {
        flash("Share is not available in this browser.");
      }
    }
  }

  function openHelp(containerId) {
    const target = containerId ? document.getElementById(containerId) : container;
    const modal = target?.querySelector("#hp-wordrow-help-modal");
    if (!modal) return;
    modal.classList.add("on");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeHelp() {
    const modal = mount?.querySelector("#hp-wordrow-help-modal");
    if (!modal) return;
    modal.classList.remove("on");
    modal.setAttribute("aria-hidden", "true");
  }

  function render() {
    if (!mount || !puzzle) return;
    mount.innerHTML = `
      <div class="hpwr-shell">
        <div class="hpwr-card">
          <div class="hpwr-status"><span class="hpwr-status-msg">${escapeHtml(getStatusMessage())}</span></div>
          <div class="hpwr-board-wrap">
            ${renderGrid()}
          </div>
          ${renderKeyboard()}
          ${renderActions()}

          <div class="hp-overlay" id="hp-wordrow-overlay" aria-hidden="true">
            <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Wordrow result">
              <span id="hp-wordrow-overlay-icon" class="material-symbols-outlined" aria-hidden="true">celebration</span>
              <h3 id="hp-wordrow-overlay-title">You Solved the Wordrow!</h3>
              <div class="hp-result-meta">
                <div class="hp-result-puzzle-title" id="hp-wordrow-badge-id"></div>
                <div class="hp-result-stats-line" id="hp-wordrow-badge-meta"></div>
              </div>
              <div id="hp-wordrow-overlay-text"></div>
              <div class="hp-modal-actions">
                <a class="hp-link-btn primary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
                <a class="hp-link-btn secondary" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>
                <button class="hp-link-btn neutral" data-a="share-result">Share</button>
                <button class="hp-link-btn neutral" data-a="close-overlay">Back to Puzzle</button>
              </div>
              <small>Hare Publishing • Wordrow</small>
            </div>
          </div>
        </div>

        <div class="hp-overlay hp-wordrow-help-modal" id="hp-wordrow-help-modal" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Wordrow">
            <span class="material-symbols-outlined" aria-hidden="true">help</span>
            <h3>How to Play Wordrow</h3>
            <div class="hp-help-modal-content">
              <p><span class="hp-help-icon"><span class="material-symbols-outlined">keyboard</span></span><strong>Guess the word</strong> by entering a five-letter word.</p>
              <p><span class="hp-help-icon"><span class="material-symbols-outlined">check_circle</span></span><strong>Green letters</strong> are correct and in the right spot.</p>
              <p><span class="hp-help-icon"><span class="material-symbols-outlined">sync_problem</span></span><strong>Orange letters</strong> are in the word but in another spot.</p>
              <p><span class="hp-help-icon"><span class="material-symbols-outlined">block</span></span><strong>Gray letters</strong> are not in the hidden word.</p>
              <p><strong>Goal:</strong> Find the hidden word in six guesses.</p>
            </div>
            <div class="hp-modal-actions">
              <button class="hp-link-btn neutral full" data-a="close-help-modal">Back to Puzzle</button>
            </div>
          </div>
        </div>
      </div>
    `;
    if (isEnded()) showOverlay();
  }

  function updateAfterChange(status) {
    writeState();
    render();
    window.dispatchEvent(new CustomEvent("hare-wordrow-progress", {
      detail: { puzzleId: puzzle?.puzzleId, status }
    }));
  }

  function flash(message) {
    const msg = mount.querySelector(".hpwr-status-msg");
    if (!msg) return;
    const original = msg.textContent;
    msg.textContent = message;
    msg.style.color = "#ED1B24";
    setTimeout(() => {
      const currentMsg = mount?.querySelector(".hpwr-status-msg");
      if (!currentMsg) return;
      currentMsg.textContent = getStatusMessage() || original;
      currentMsg.style.color = "";
    }, 1200);
  }

  function submitGuess() {
    if (isEnded()) return;
    const guess = cleanWord(state.current);
    if (guess.length !== 5) {
      flash("Please enter five letters first.");
      return;
    }
    state.guesses.push(guess);
    state.current = "";
    recomputeState();
    const status = state.solved ? "solved" : state.lost ? "finished" : "progress";
    updateAfterChange(status);
    if (state.solved || state.lost) showOverlay();
  }

  function handleInput(value) {
    if (!puzzle || isEnded()) return;
    if (value === "ENTER") {
      submitGuess();
      return;
    }
    if (value === "BACK") {
      state.current = cleanWord(state.current).slice(0, -1);
      updateAfterChange("progress");
      return;
    }
    if (/^[A-Z]$/.test(value) && state.current.length < 5) {
      state.current += value;
      updateAfterChange("progress");
    }
  }

  function startOver() {
    if (!confirm("Start this Wordrow puzzle over?")) return;
    state = defaultState();
    writeState();
    render();
    window.dispatchEvent(new CustomEvent("hare-wordrow-progress", { detail: { puzzleId: puzzle?.puzzleId, status: "reset" } }));
  }

  function revealForSystem() {
    if (!puzzle || isEnded()) return;
    state.revealed = true;
    state.status = "revealed";
    state.current = "";
    state.revealedAt = new Date().toISOString();
    updateAfterChange("revealed");
    showOverlay();
  }

  function init(options = {}) {
    injectStyles();
    container = document.getElementById(options.containerId || "hp-wordrow-container");
    if (!container) return;
    mount = container.querySelector(".hp-mount") || container;

    puzzle = { ...(options.dataObject || window.HareWordrowData || {}) };
    puzzle.answer = cleanWord(puzzle.answer || puzzle.word || puzzle.solution);
    puzzle.puzzleId = String(puzzle.puzzleId || "");
    puzzleTitle = puzzle.puzzleTitle || puzzle.title || `Wordrow #${puzzle.puzzleId}`;
    puzzle.puzzleTitle = puzzleTitle;
    maxGuesses = Number(puzzle.maxGuesses || 6);

    if (!puzzle.answer || puzzle.answer.length !== 5) {
      mount.innerHTML = `<div style="padding:20px; border:1px solid #ED1B24; background:#fff5f5; color:#8a1c1c; border-radius:12px; text-align:center;"><strong>Wordrow Error:</strong><br>Answer must be exactly five letters.</div>`;
      return;
    }

    state = readState();
    recomputeState();
    writeState();
    render();
    window.dispatchEvent(new CustomEvent("hare-wordrow-progress", { detail: { puzzleId: puzzle?.puzzleId, status: "loaded" } }));
  }

  document.addEventListener("click", event => {
    const actionEl = event.target.closest("[data-a]");
    if (!actionEl) return;
    if (mount && !mount.contains(actionEl)) return;

    const action = actionEl.getAttribute("data-a");
    if (action === "key") handleInput(actionEl.getAttribute("data-key"));
    if (action === "start-over") startOver();
    if (action === "close-overlay") hideOverlay();
    if (action === "close-help-modal") closeHelp();
    if (action === "share-result") shareResult();
    if (action === "load-puzzle") {
      const id = actionEl.getAttribute("data-puzzle-id");
      hideOverlay();
      if (typeof window.HareWordrowLoadPuzzle === "function") window.HareWordrowLoadPuzzle(id, { scroll: false });
      else window.location.href = `${window.location.pathname || "/wordrow-test"}?puzzle=${encodeURIComponent(id)}`;
    }
  });

  document.addEventListener("keydown", event => {
    if (!container || isEnded()) return;
    const active = document.activeElement;
    const typing = active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName);
    if (typing) return;

    if (event.key === "Enter") {
      event.preventDefault();
      handleInput("ENTER");
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      handleInput("BACK");
    } else if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      handleInput(event.key.toUpperCase());
    }
  });

  return {
    init,
    openHelp,
    revealForSystem,
    getStats,
    version: VERSION
  };
})();

window.HarePuzzleMenuConfig = {
  googleAppsScriptUrl: "https://script.google.com/macros/s/AKfycbwb0uiowxfn8f_bTTPqI3jVBYRu8l96SVRqdS_0tg7FESslgVHA6j0lyKMApXnMhx9X/exec"
};

(() => {
  if (window.HarePuzzleMenuLoaded) return;
  window.HarePuzzleMenuLoaded = true;

  const CONFIG = window.HarePuzzleMenuConfig || {};
  const ENDPOINT = CONFIG.googleAppsScriptUrl || "";

  const TRACKER_KEY = "hp_puzzlers_hub_progress_v1";

  const PUZZLE_PREFIXES = [
    "hp_sd_challenge_",
    "hp_sd_easy_",
    "hp_sd_medium_",
    "hp_sd_hard_",
    "hp_wr_",
    "hp_wf_",
    "hp_cg_",
    "hp_ws_",
    "hp_kk_",
    "hp_wsc_"
  ];

  const PUZZLE_CONTAINERS = [
    "#hp-sudoku-container",
    "#hp-daily-sudoku-container",
    "#hp-wordrow-container",
    "#hp-wordflower-container",
    "#hp-cryptogram-container",
    "#hp-wordsearch-container",
    "#hp-krisskross-container",
    "#hp-wordscramble-container"
  ];

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function todayKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }

  function weekStart(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function isPuzzleSaveKey(key) {
    return PUZZLE_PREFIXES.some(prefix => key.startsWith(prefix));
  }

  function hasStartedProgress(state) {
    if (!state || typeof state !== "object") return false;

    if (state.solved || state.revealed || state.lost) return true;
    if (Array.isArray(state.guesses) && state.guesses.length) return true;
    if (Array.isArray(state.found) && state.found.length) return true;
    if (Array.isArray(state.foundWords) && state.foundWords.length) return true;
    if (Array.isArray(state.solvedWords) && state.solvedWords.length) return true;
    if (state.mappings && Object.keys(state.mappings).length) return true;
    if (state.assignments && Object.keys(state.assignments).length) return true;

    if (Array.isArray(state.cells)) {
      return state.cells.some(cell => {
        if (!cell || typeof cell !== "object") return false;
        if (cell.value) return true;
        if (Array.isArray(cell.notes) && cell.notes.some(Boolean)) return true;
        return false;
      });
    }

    if (typeof state.current === "string" && state.current.length) return true;
    if (typeof state.currentGuess === "string" && state.currentGuess.length) return true;

    return false;
  }

  function loadTracker() {
    return safeParse(localStorage.getItem(TRACKER_KEY)) || {
      records: {}
    };
  }

  function saveTracker(tracker) {
    try {
      localStorage.setItem(TRACKER_KEY, JSON.stringify(tracker));
    } catch {}
  }

  function scanPuzzleSaves() {
    const tracker = loadTracker();
    if (!tracker.records) tracker.records = {};

    const now = new Date().toISOString();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!isPuzzleSaveKey(key)) continue;

      const state = safeParse(localStorage.getItem(key));
      if (!state || !hasStartedProgress(state)) continue;

      if (!tracker.records[key]) {
        tracker.records[key] = {
          key,
          firstSeenAt: now,
          solvedAt: "",
          revealedAt: "",
          status: "in-progress"
        };
      }

      if (state.solved && !tracker.records[key].solvedAt) {
        tracker.records[key].solvedAt = now;
      }

      if (state.revealed && !tracker.records[key].revealedAt) {
        tracker.records[key].revealedAt = now;
      }

      tracker.records[key].status =
        state.solved
          ? "solved"
          : state.revealed
          ? "revealed"
          : "in-progress";
    }

    saveTracker(tracker);
    return tracker;
  }

  function getStats() {
    const tracker = scanPuzzleSaves();
    const records = Object.values(tracker.records || {});

    const solved = records.filter(r => r.status === "solved" && r.solvedAt);
    const inProgress = records.filter(r => r.status === "in-progress");

    const thisWeekStart = weekStart(new Date());

    const solvedDates = [
      ...new Set(solved.map(r => todayKey(new Date(r.solvedAt))))
    ].sort().reverse();

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (solvedDates.includes(todayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      completed: solved.length,
      inProgress: inProgress.length,
      streak,
      thisWeek: solved.filter(r => new Date(r.solvedAt) >= thisWeekStart).length
    };
  }

  function detectPuzzleType() {
    const found = PUZZLE_CONTAINERS.find(sel => document.querySelector(sel));
    if (!found) return "Unknown";

    return found
      .replace("#hp-", "")
      .replace("-container", "");
  }

  function detectPuzzleMeta() {
    const sources = [
      { type: "cryptogram", data: window.HareCryptogramData },
      { type: "kriss-kross", data: window.HareKrissKrossData },
      { type: "wordrow", data: window.HareWordrowData },
      { type: "word-flower", data: window.HareWordFlowerData },
      { type: "word-search", data: window.HareWordSearchData },
      { type: "word-scramble", data: window.HareWordScrambleData },
      { type: "sudoku", data: window.HareRegularSudokuData },
      { type: "daily-sudoku-challenge", data: window.HareDailySudokuData }
    ];

    const detected = sources.find(source =>
      source.data && typeof source.data === "object"
    );

    const data = detected?.data || {};

    return {
      puzzleType: detected?.type || detectPuzzleType(),
      puzzleId: data.puzzleId || data.id || "Unknown",
      puzzleTitle:
        data.puzzleTitle ||
        data.title ||
        document.querySelector("h1")?.textContent?.trim() ||
        document.title ||
        "Hare Publishing Puzzle",
      puzzleDate: data.puzzleDate || data.date || "Unknown",
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  function closeModal() {
    const overlay = document.getElementById("hp-puzzle-menu-overlay");
    if (!overlay) return;
    overlay.classList.remove("on");
  }

  function showSendingState(type) {
    const form = document.getElementById("hppm-message-form");
    if (!form) return;

    form.innerHTML = `
      <div class="hppm-submit-state">
        <div class="hppm-submit-spinner">⏳</div>
        <strong>Sending...</strong>
        <span>Please wait a moment.</span>
      </div>
    `;
  }

  function showSuccessState(type) {
    const form = document.getElementById("hppm-message-form");
    if (!form) return;

    form.innerHTML = `
      <div class="hppm-submit-state hppm-submit-success">
        <div class="hppm-submit-check">✓</div>
        <strong>${
          type === "BUG"
            ? "Thank you — your report was sent."
            : "Thank you — your feedback was sent."
        }</strong>
      </div>
    `;
  }

  function showErrorState(type) {
    const form = document.getElementById("hppm-message-form");
    if (!form) return;

    form.innerHTML = `
      <div class="hppm-submit-state hppm-submit-error">
        <div class="hppm-submit-check">!</div>
        <strong>Sorry, your message could not be sent.</strong>
        <span>Please try again in a moment.</span>
      </div>
    `;
  }

  async function sendSubmission(type) {
    const textarea = document.getElementById("hppm-message-text");
    const status = document.getElementById("hppm-message-status");

    const message = textarea?.value?.trim();

    if (!message) {
      status.textContent = "Please enter a short message first.";
      return;
    }

    const payload = {
      submissionType: type,
      ...detectPuzzleMeta(),
      message
    };

    showSendingState(type);

    try {
      await fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      showSuccessState(type);

    } catch {
      showErrorState(type);
    }
  }

  function openModal(kind) {
    const overlay = document.getElementById("hp-puzzle-menu-overlay");
    const body = document.getElementById("hp-puzzle-menu-body");

    if (!overlay || !body) return;

    if (kind === "stats") {
      const s = getStats();

      body.innerHTML = `
        <div class="hppm-icon">🏆</div>

        <h2>Your Puzzle Stats</h2>

        <div class="hppm-stats-grid">
          <div><strong>${s.completed}</strong><span>Completed</span></div>
          <div><strong>${s.inProgress}</strong><span>In Progress</span></div>
          <div><strong>${s.streak}</strong><span>Current Streak</span></div>
          <div><strong>${s.thisWeek}</strong><span>This Week</span></div>
        </div>

        <p class="hppm-note">Keep solving puzzles to build your streak.</p>
      `;
    }

    if (kind === "bug") {
      body.innerHTML = `
        <div class="hppm-icon">🐞</div>

        <h2>Report a Bug</h2>

        <p class="hppm-note">Tell us what went wrong with this puzzle.</p>

        <div id="hppm-message-form">
          <textarea
            id="hppm-message-text"
            rows="5"
            placeholder="Briefly describe the problem..."
          ></textarea>

          <button class="hppm-primary" id="hppm-send-message">
            Send Report
          </button>

          <p class="hppm-small" id="hppm-message-status"></p>
        </div>
      `;

      document.getElementById("hppm-send-message").onclick = () => {
        sendSubmission("BUG");
      };
    }

    if (kind === "feedback") {
      body.innerHTML = `
        <div class="hppm-icon">💬</div>

        <h2>Share Feedback</h2>

        <p class="hppm-note">
          Tell us what you think about this puzzle or the Puzzlers Hub.
        </p>

        <div id="hppm-message-form">
          <textarea
            id="hppm-message-text"
            rows="5"
            placeholder="Share your thoughts..."
          ></textarea>

          <button class="hppm-primary" id="hppm-send-message">
            Send Feedback
          </button>

          <p class="hppm-small" id="hppm-message-status"></p>
        </div>
      `;

      document.getElementById("hppm-send-message").onclick = () => {
        sendSubmission("FEEDBACK");
      };
    }

    overlay.classList.add("on");
  }

  function buildMenu() {
    const puzzle = PUZZLE_CONTAINERS
      .map(sel => document.querySelector(sel))
      .find(Boolean);

    if (!puzzle || document.getElementById("hp-puzzle-menu-wrap")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "hp-puzzle-menu-wrap";

    wrapper.innerHTML = `
      <div id="hp-puzzle-menu">
        <button type="button" data-hppm="stats">
          📊 <span>Stats</span>
        </button>

        <button type="button" data-hppm="bug">
          🐞 <span>Report Bug</span>
        </button>

        <button type="button" data-hppm="feedback">
          💬 <span>Feedback</span>
        </button>
      </div>
    `;

    puzzle.parentNode.insertBefore(wrapper, puzzle);

    document.body.insertAdjacentHTML("beforeend", `
      <div id="hp-puzzle-menu-overlay">
        <div class="hppm-modal">
          <button type="button" class="hppm-close">×</button>
          <div id="hp-puzzle-menu-body"></div>
        </div>
      </div>
    `);

    wrapper.addEventListener("click", e => {
      const btn = e.target.closest("[data-hppm]");
      if (!btn) return;
      openModal(btn.dataset.hppm);
    });

    document.querySelector(".hppm-close").onclick = closeModal;

    document
      .getElementById("hp-puzzle-menu-overlay")
      .addEventListener("click", e => {
        if (e.target.id === "hp-puzzle-menu-overlay") {
          closeModal();
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildMenu);
  } else {
    buildMenu();
  }
})();

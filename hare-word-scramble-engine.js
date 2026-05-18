/* HARE PUBLISHING WORD SCRAMBLE ENGINE
   Release target: word-scramble-v1.2
   Update: Hint output moved directly under toolbar with soft green styling support.
*/
window.HareWordScrambleEngine = {
  init({ containerId = "hp-wordscramble-container", dataObject } = {}) {
  // =========================================================
  // SETUP
  // =========================================================
  const container = document.getElementById(containerId);
  if (!container) return;

  if (container.dataset.hpWordScrambleMounted === "true") {
    console.warn("HareWordScrambleEngine: this container has already been mounted.");
    return;
  }
  container.dataset.hpWordScrambleMounted = "true";

  container.setAttribute("tabindex", "0");

  container.addEventListener("mousedown", (e) => {
    const link = e.target?.closest?.("a[href]");
    if (link) return;
    container.focus({ preventScroll: true });
  });

  const mount = container.querySelector(".hp-mount") || container;
  if (!mount) return;

  const yearEl = container.querySelector("#hp-year") || document.getElementById("hp-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const data = dataObject || window.HareWordScrambleData;
  const BRAND_RED = "#ED1B24";

  if (!data) {
    mount.innerHTML = `<div class="hp-wsc-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;"><strong>Configuration Error:</strong> Word Scramble puzzle data is missing.</div>`;
    return;
  }

  const puzzleId = String(data.puzzleId || "1");
  const puzzleTitle = data.puzzleTitle || `Word Scramble #${puzzleId}`;
  const puzzleDate = formatPuzzleDate(data.puzzleDate || data.date || "");
  const MORE_PUZZLES_URL = data.morePuzzlesUrl || "https://www.harepublishing.com/online-puzzles";
  const SHOP_URL = data.shopUrl || "https://www.harepublishing.com/shop";
  const STORAGE_KEY = data.storageKey || `hp_wsc_${puzzleId}`;
  const entries = Array.isArray(data.entries) ? data.entries : [];

  // =========================================================
  // HELPERS
  // =========================================================
  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[s]));

  const normalizeWord = (word) =>
    String(word || "").toUpperCase().replace(/[^A-Z]/g, "");

  function formatPuzzleDate(dateString) {
    if (!dateString) return "";
    const parts = String(dateString).split("-");
    if (parts.length !== 3) return String(dateString);

    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return String(dateString);
    }

    const date = new Date(year, month, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function hashString(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleDeterministic(chars, seedStr) {
    const rand = mulberry32(hashString(seedStr));
    const copy = [...chars];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // =========================================================
  // NORMALIZE / VALIDATE CONFIG
  // =========================================================
  const normalizedEntries = entries
    .map((item, index) => ({
      id: `w${index + 1}`,
      answer: normalizeWord(item.answer),
      clue: String(item.clue || "").trim(),
      clue2: String(item.clue2 || "").trim(),
      index
    }))
    .filter(item => item.answer);

  const seenWords = new Set();
  const invalidWords = [];

  normalizedEntries.forEach(item => {
    if (item.answer.length < 3) invalidWords.push(item.answer);
    if (seenWords.has(item.answer)) invalidWords.push(item.answer);
    seenWords.add(item.answer);
  });

  if (!normalizedEntries.length) {
    mount.innerHTML = `
      <div class="hp-wsc-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
        <strong>Configuration Error:</strong> Add at least one Word Scramble answer.
      </div>
    `;
    return;
  }

  if (invalidWords.length) {
    mount.innerHTML = `
      <div class="hp-wsc-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
        <strong>Configuration Error:</strong> Duplicate or invalid answer(s): ${escapeHtml(invalidWords.join(", "))}
      </div>
    `;
    return;
  }

  const puzzleData = normalizedEntries.map(item => {
    const chars = item.answer.split("");
    let scrambled = item.answer;
    let tries = 0;

    while (scrambled === item.answer && tries < 25) {
      scrambled = shuffleDeterministic(chars, `${puzzleId}|${item.answer}|${tries}`).join("");
      tries++;
    }

    return {
      ...item,
      length: item.answer.length,
      scrambled
    };
  });

  // =========================================================
  // SCHEMA
  // =========================================================
  (() => {
    const existing = document.getElementById("hp-wsc-schema");
    if (existing) existing.remove();

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Game",
      "name": puzzleTitle,
      "description": `Play and solve ${puzzleTitle} by Hare Publishing. Unscramble letters to find each word, save your progress automatically, and reveal the answers whenever you like.`,
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
        "url": "https://harepublishing.com/"
      }
    };

    const script = document.createElement("script");
    script.id = "hp-wsc-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);
  })();

  // =========================================================
  // STATE
  // =========================================================
  function defaultState() {
    return {
      solvedWords: [],
      currentWordId: puzzleData[0].id,
      currentGuess: "",
      usedLetterIds: [],
      solved: false,
      revealed: false,
      revealedHints: {},
      startedAt: "",
      solvedAt: "",
      revealedAt: "",
      overlaySeen: false
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
    } catch {
      return defaultState();
    }
  }

  const state = loadState();

  function markStarted() {
    if (!state.startedAt) {
      state.startedAt = new Date().toISOString();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  const getSolvedSet = () => new Set(state.solvedWords);
  const isFinished = () => state.solved || state.revealed;
  const allSolved = () => state.solvedWords.length === puzzleData.length;

  function getCurrentEntry() {
    const solvedSet = getSolvedSet();

    const explicit = puzzleData.find(
      item => item.id === state.currentWordId && !solvedSet.has(item.answer)
    );
    if (explicit) return explicit;

    const next = puzzleData.find(item => !solvedSet.has(item.answer));
    if (next) {
      state.currentWordId = next.id;
      return next;
    }

    return puzzleData[0];
  }

  function solvedWordIds() {
    const solved = getSolvedSet();
    return new Set(
      puzzleData.filter(item => solved.has(item.answer)).map(item => item.id)
    );
  }

  // =========================================================
  // DERIVED UI VALUES
  // =========================================================
  const solvedCount = () => state.solvedWords.length;
  const remainingCount = () => Math.max(0, puzzleData.length - state.solvedWords.length);
  const progressPercent = () => puzzleData.length ? (state.solvedWords.length / puzzleData.length) * 100 : 0;
  const currentLength = () => {
    const entry = getCurrentEntry();
    return entry ? entry.length : 0;
  };

  function statusMessage() {
    if (state.solved) return "Word Scramble solved! 🎉";
    if (state.revealed) return "Answers revealed.";

    const entry = getCurrentEntry();
    if (!entry) return "Choose a word to begin.";

    if (state.currentGuess.length) {
      return `Build the answer, then press Enter. ${state.currentGuess.length}/${entry.length} letters entered.`;
    }

    return "Tap letters to build the word, then press Enter.";
  }

  function setStatusMessage(msg) {
    const el = mount.querySelector("#hp-wsc-status-msg");
    if (el) el.textContent = msg;
  }

  function showHint(hintNumber) {
    if (isFinished()) return;
    markStarted();

    const entry = getCurrentEntry();
    if (!entry) return;

    const key = hintNumber === 2 ? "2" : "1";

    if (!state.revealedHints || typeof state.revealedHints !== "object") {
      state.revealedHints = {};
    }

    if (!state.revealedHints[entry.id]) {
      state.revealedHints[entry.id] = {};
    }

    // Hint buttons behave as toggles:
    // click once to show the hint, click again to hide it.
    state.revealedHints[entry.id][key] = !state.revealedHints[entry.id][key];

    saveState();
    renderAll();
  }

  function showHelpModal() {
    const modalEl = mount.querySelector("#hp-wsc-help-modal");
    if (!modalEl) return;
    modalEl.classList.add("on");
    modalEl.setAttribute("aria-hidden", "false");
  }

  function hideHelpModal() {
    const modalEl = mount.querySelector("#hp-wsc-help-modal");
    if (!modalEl) return;
    modalEl.classList.remove("on");
    modalEl.setAttribute("aria-hidden", "true");
  }

  // =========================================================
  // ACTIONS
  // =========================================================
  function selectWord(wordId) {
    if (isFinished()) return;
    markStarted();
    if (solvedWordIds().has(wordId)) return;

    state.currentWordId = wordId;
    state.currentGuess = "";
    state.usedLetterIds = [];
    saveState();
    renderAll();
  }

  function addLetter(letterId) {
    if (isFinished()) return;
    markStarted();

    const entry = getCurrentEntry();
    if (!entry) return;
    if (state.usedLetterIds.includes(letterId)) return;
    if (state.currentGuess.length >= entry.length) return;

    const chars = entry.scrambled.split("");
    const idx = chars.findIndex((_, i) => `${entry.id}-scr-${i}` === letterId);
    if (idx === -1) return;

    state.currentGuess += chars[idx];
    state.usedLetterIds.push(letterId);
    saveState();
    renderCurrentOnly();
    renderStatusOnly();
  }

  function deleteLetter() {
    if (isFinished()) return;
    markStarted();
    if (!state.currentGuess.length) return;

    state.currentGuess = state.currentGuess.slice(0, -1);
    state.usedLetterIds.pop();
    saveState();
    renderCurrentOnly();
    renderStatusOnly();
  }

  function clearGuess() {
    if (isFinished()) return;
    markStarted();

    state.currentGuess = "";
    state.usedLetterIds = [];
    saveState();
    renderCurrentOnly();
    renderStatusOnly();
  }

  function submitGuess() {
    if (isFinished()) return;
    markStarted();

    const entry = getCurrentEntry();
    if (!entry) return;

    if (state.currentGuess.length !== entry.length) {
      setStatusMessage(`This word needs ${entry.length} letters.`);
      return;
    }

    if (state.currentGuess !== entry.answer) {
      setStatusMessage("Not quite right. Try again.");
      return;
    }

    if (!state.solvedWords.includes(entry.answer)) {
      state.solvedWords.push(entry.answer);
    }

    state.currentGuess = "";
    state.usedLetterIds = [];

    if (allSolved()) {
      state.solved = true;
      state.revealed = false;
      state.solvedAt = new Date().toISOString();
      state.overlaySeen = false;
      saveState();
      renderAll();
      showOverlay();
      return;
    }

    const next = puzzleData.find(item => !state.solvedWords.includes(item.answer));
    if (next) state.currentWordId = next.id;

    saveState();
    renderAll();
    setStatusMessage(`Correct! "${entry.answer}" solved.`);
  }

  function resetPuzzle() {
    if (!confirm("Reset this Word Scramble and clear all progress?")) return;

    Object.assign(state, defaultState());
    saveState();
    hideOverlay();
    renderAll();
  }

  function revealAnswers() {
    if (isFinished()) return;
    if (!confirm("Reveal all answers? This will end the puzzle.")) return;

    state.solvedWords = puzzleData.map(item => item.answer);
    state.currentGuess = "";
    state.usedLetterIds = [];
    state.solved = false;
    state.revealed = true;
    state.revealedAt = new Date().toISOString();
    state.overlaySeen = false;

    saveState();
    renderAll();
    showOverlay();
  }

  function sharePuzzle() {
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
      return;
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href)
        .then(() => setStatusMessage("Link copied! 📋"))
        .catch(() => setStatusMessage("Copy the link from your address bar 🙂"));
      return;
    }

    setStatusMessage("Copy the link from your address bar 🙂");
  }

  // =========================================================
  // OVERLAY
  // =========================================================
  function showOverlay() {
    const overlayEl = mount.querySelector("#hp-wsc-overlay");
    const badgeIdEl = mount.querySelector("#hp-wsc-badge-id");
    const badgeMetaEl = mount.querySelector("#hp-wsc-badge-meta");
    const titleEl = mount.querySelector("#hp-wsc-overlay-title");
    const textEl = mount.querySelector("#hp-wsc-overlay-text");
    const iconEl = mount.querySelector("#hp-wsc-overlay-icon");

    if (!overlayEl) return;

    if (badgeIdEl) badgeIdEl.textContent = puzzleTitle;
    if (badgeMetaEl) badgeMetaEl.textContent = `Words: ${state.solvedWords.length}/${puzzleData.length}`;

    if (state.solved) {
      if (iconEl) iconEl.textContent = "🎉 ";
      if (titleEl) titleEl.textContent = "You Solved the Word Scramble!";
      if (textEl) {
        textEl.innerHTML = `
          <div class="hp-modal-lead">Congratulations — you did it!</div>
          <div class="hp-modal-subtext">New puzzles are added daily in the Puzzlers Hub.</div>
          <div class="hp-modal-subtext">Or explore a whole stack of puzzles to enjoy offline.</div>
        `;
      }
    } else {
      if (iconEl) iconEl.textContent = "📘 ";
      if (titleEl) titleEl.textContent = "Answers Revealed";
      if (textEl) {
        textEl.innerHTML = `
          <div class="hp-modal-lead">Here are the completed answers.</div>
          <div class="hp-modal-subtext">Try another online puzzle in the Puzzlers Hub.</div>
          <div class="hp-modal-subtext">Or explore a whole stack of puzzles to enjoy offline.</div>
        `;
      }
    }

    overlayEl.classList.add("on");
    overlayEl.setAttribute("aria-hidden", "false");
    state.overlaySeen = false;
    saveState();
  }

  function hideOverlay() {
    const overlayEl = mount.querySelector("#hp-wsc-overlay");
    if (!overlayEl) return;

    overlayEl.classList.remove("on");
    overlayEl.setAttribute("aria-hidden", "true");
    state.overlaySeen = true;
    saveState();
  }

  // =========================================================
  // RENDER HELPERS
  // =========================================================
  function renderStatsOnly() {
    const solvedEl = mount.querySelector("#hp-wsc-solved-ratio");
    const leftEl = mount.querySelector("#hp-wsc-left");
    const lenEl = mount.querySelector("#hp-wsc-length");
    const fillEl = mount.querySelector("#hp-wsc-progress-fill");

    if (solvedEl) solvedEl.textContent = `${solvedCount()}/${puzzleData.length}`;
    if (leftEl) leftEl.textContent = String(remainingCount());
    if (lenEl) lenEl.textContent = String(currentLength());
    if (fillEl) fillEl.style.width = `${progressPercent()}%`;
  }

  function renderStatusOnly() {
    setStatusMessage(statusMessage());
  }

  function renderWordListOnly() {
    const listEl = mount.querySelector("#hp-wsc-word-list");
    const pillEl = mount.querySelector("#hp-wsc-list-pill");
    if (!listEl) return;

    const solvedSet = getSolvedSet();
    const current = getCurrentEntry();

    if (pillEl) {
      pillEl.textContent = state.revealed ? "Solved + revealed words" : "Tap a word to solve it";
    }

    listEl.innerHTML = puzzleData.map(item => {
      const isSolved = solvedSet.has(item.answer);
      const isActive = current && current.id === item.id && !isSolved && !isFinished();
      const displayText = (state.revealed || isSolved) ? item.answer : item.scrambled;

      return `
        <button
          type="button"
          class="hp-wsc-word-item${isSolved ? " is-solved" : ""}${isActive ? " is-active" : ""}"
          data-word-id="${item.id}"
          aria-label="${escapeHtml(displayText)}"
        >
          <span class="hp-wsc-word-answer">${escapeHtml(displayText)}</span>
          ${isSolved ? `<span class="hp-wsc-word-check" aria-hidden="true">✓</span>` : ``}
        </button>
      `;
    }).join("");
  }

  function renderCurrentOnly() {
    const currentAreaEl = mount.querySelector("#hp-wsc-current-area");
    if (!currentAreaEl) return;

    const entry = getCurrentEntry();
    const solvedSet = getSolvedSet();
    const isCurrentSolved = solvedSet.has(entry.answer);

    const guessDisplay = (state.revealed || isCurrentSolved) ? entry.answer : state.currentGuess;

    const slotsHtml = Array.from({ length: entry.length }, (_, i) => {
      const ch = guessDisplay[i] || "";
      return `<div class="hp-wsc-slot${ch ? " has-letter" : ""}">${ch ? escapeHtml(ch) : "<span aria-hidden=\"true\">&nbsp;</span>"}</div>`;
    }).join("");

    const scrambledLetters = entry.scrambled.split("").map((ch, i) => {
      const letterId = `${entry.id}-scr-${i}`;
      const used = state.usedLetterIds.includes(letterId);
      const disabled = used || isFinished() || isCurrentSolved;

      return `
        <button
          type="button"
          class="hp-wsc-letter-btn${used ? " is-used" : ""}"
          data-letter-id="${letterId}"
          ${disabled ? "disabled" : ""}
          aria-label="Letter ${ch}"
        >
          ${ch}
        </button>
      `;
    }).join("");

    currentAreaEl.innerHTML = `
      <div class="hp-wsc-answer-slots" aria-label="Answer slots" style="--hp-wsc-slot-count:${entry.length};">
        ${slotsHtml}
      </div>

      <div class="hp-wsc-bank-wrap">
        <div class="hp-wsc-bank-label">Scrambled Letters</div>
        <div class="hp-wsc-letter-bank">
          ${scrambledLetters}
        </div>
      </div>
    `;
  }

  function renderTopControls() {
    const entry = getCurrentEntry();
    const hintState = entry ? (state.revealedHints?.[entry.id] || {}) : {};
    const disabled = !entry || isFinished() || solvedWordIds().has(entry.id);

    return `
      <div class="hp-puzzle-tools hp-wsc-tools" aria-label="Word Scramble puzzle controls">
        <button type="button" class="hp-tool-btn help-info" data-a="open-help-modal">Help</button>
        <button type="button" class="hp-tool-btn hint-toggle${hintState["1"] ? " active" : ""}" data-a="show-hint" data-hint="1" ${disabled ? "disabled" : ""}>Hint 1</button>
        <button type="button" class="hp-tool-btn hint-toggle${hintState["2"] ? " active" : ""}" data-a="show-hint" data-hint="2" ${disabled ? "disabled" : ""}>Hint 2</button>
      </div>
    `;
  }

  function renderHintOutput() {
    const entry = getCurrentEntry();
    if (!entry || isFinished()) return "";

    const hintState = state.revealedHints?.[entry.id] || {};
    const hint1Text = entry.clue || "Unscramble the letters.";
    const hint2Text = entry.clue2 || `A ${entry.length}-letter word.`;

    const hintOne = hintState["1"]
      ? `<div class="hp-wsc-clue-text"><strong>Hint 1:</strong> ${escapeHtml(hint1Text)}</div>`
      : "";

    const hintTwo = hintState["2"]
      ? `<div class="hp-wsc-clue-text"><strong>Hint 2:</strong> ${escapeHtml(hint2Text)}</div>`
      : "";

    if (!hintOne && !hintTwo) return "";

    return `
      <div class="hp-wsc-hint-output" aria-live="polite">
        ${hintOne}
        ${hintTwo}
      </div>
    `;
  }

  function bindStaticEvents() {
    const resetBtn = mount.querySelector("#hp-wsc-reset");
    const revealBtn = mount.querySelector("#hp-wsc-reveal");
    const enterBtn = mount.querySelector("#hp-wsc-enter");
    const deleteBtn = mount.querySelector("#hp-wsc-delete");
    const clearBtn = mount.querySelector("#hp-wsc-clear");

    if (resetBtn) resetBtn.onclick = resetPuzzle;
    if (revealBtn) revealBtn.onclick = revealAnswers;
    if (enterBtn) enterBtn.onclick = submitGuess;
    if (deleteBtn) deleteBtn.onclick = deleteLetter;
    if (clearBtn) clearBtn.onclick = clearGuess;
  }

  function renderAll() {
    mount.innerHTML = `
      ${puzzleDate ? `<div class="hp-puzzle-date">${escapeHtml(puzzleDate)}</div>` : ""}
      <div class="hp-wsc-layout">
        <div class="hp-wsc-col-left">
          <div class="hp-wsc-panel">
            <div class="hp-wsc-stats">
              <div class="hp-wsc-stat">
                <span class="hp-wsc-stat-value" id="hp-wsc-solved-ratio">0/0</span>
                <span class="hp-wsc-stat-label">Words Solved</span>
              </div>

              <div class="hp-wsc-stat">
                <span class="hp-wsc-stat-value" id="hp-wsc-left">0</span>
                <span class="hp-wsc-stat-label">Remaining</span>
              </div>

              <div class="hp-wsc-stat">
                <span class="hp-wsc-stat-value" id="hp-wsc-length">0</span>
                <span class="hp-wsc-stat-label">Word Length</span>
              </div>
            </div>

            <div class="hp-wsc-progress">
              <div class="hp-wsc-progress-fill" id="hp-wsc-progress-fill"></div>
            </div>

            ${renderTopControls()}

            ${renderHintOutput()}

            <div class="hp-wsc-status">
              <span class="hp-wsc-status-msg" id="hp-wsc-status-msg">Tap letters to begin.</span>
            </div>

            <div id="hp-wsc-current-area"></div>

            <div class="hp-wsc-actions">
              <button type="button" class="hp-wsc-btn enter" id="hp-wsc-enter">Enter</button>
              <button type="button" class="hp-wsc-btn" id="hp-wsc-delete">Delete</button>
              <button type="button" class="hp-wsc-btn" id="hp-wsc-clear">Clear</button>
            </div>

            <div class="hp-wsc-secondary-actions">
              <button type="button" class="hp-wsc-btn danger" id="hp-wsc-reset">Reset Puzzle</button>
              <button type="button" class="hp-wsc-btn reveal" id="hp-wsc-reveal">Reveal Answers</button>
            </div>
          </div>
        </div>

        <div class="hp-wsc-col-right">
          <div class="hp-wsc-panel">
            <div class="hp-wsc-words-header">
              <h3>Words</h3>
              <span class="hp-wsc-pill" id="hp-wsc-list-pill">Tap a word to solve it</span>
            </div>

            <div class="hp-wsc-word-list" id="hp-wsc-word-list"></div>
          </div>
        </div>
      </div>

      <div class="hp-overlay" id="hp-wsc-overlay" aria-hidden="true">
        <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Word Scramble result">
          <div id="hp-wsc-overlay-icon" style="font-size:28px; line-height:1;">🎉 </div>

          <h3 id="hp-wsc-overlay-title">You Solved the Word Scramble!</h3>

          <div class="hp-badges">
            <span class="hp-badge" id="hp-wsc-badge-id"></span>
            <span class="hp-badge" id="hp-wsc-badge-meta"></span>
          </div>

          <div id="hp-wsc-overlay-text">
            <div class="hp-modal-lead">Congratulations — you did it!</div>
            <div class="hp-modal-subtext">New puzzles are added daily in the Puzzlers Hub.</div>
            <div class="hp-modal-subtext">Or explore a whole stack of puzzles to enjoy offline.</div>
          </div>

          <div class="hp-modal-actions">
            <a class="hp-link-btn secondary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
            <a class="hp-link-btn primary" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>

            <button class="hp-link-btn" data-a="share">Share</button>
            <button class="hp-link-btn" data-a="close-overlay">Back to Puzzle</button>

            <button class="hp-link-btn full danger" data-a="reset-puzzle">Reset Puzzle</button>
          </div>

          <small>Hare Publishing • Word Scramble</small>
        </div>
      </div>

      <div class="hp-overlay hp-wsc-help-modal" id="hp-wsc-help-modal" aria-hidden="true">
        <div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Word Scramble">
          <h3>How to Play</h3>

          <div class="hp-help-modal-content">
            <span class="hp-help-line">Choose a scrambled word from the list.</span>
            <span class="hp-help-line">Tap the scrambled letters to build the answer.</span>
            <span class="hp-help-line">Use <strong>Hint 1</strong> for the main clue, then <strong>Hint 2</strong> if you want an extra nudge.</span>
            <span class="hp-help-line">Use <strong>Delete</strong> to remove the last letter or <strong>Clear</strong> to start that word again.</span>
            <span class="hp-help-line">Press <strong>Enter</strong> when your word is complete.</span>
            <span class="hp-help-line"><strong>Reveal Answers</strong> ends the puzzle and shows every answer.</span>
          </div>

          <div class="hp-modal-actions">
            <button class="hp-link-btn neutral full" data-a="close-help-modal">Back to Puzzle</button>
          </div>

          <small>Hare Publishing • Word Scramble</small>
        </div>
      </div>
    `;

    renderStatsOnly();
    renderStatusOnly();
    renderCurrentOnly();
    renderWordListOnly();
    bindStaticEvents();

    if ((state.solved || state.revealed) && !state.overlaySeen) {
      showOverlay();
    }
  }

  // =========================================================
  // SINGLE DELEGATED CLICK HANDLER
  // =========================================================
mount.addEventListener("click", (e) => {
  const link = e.target?.closest?.("a[href]");
  if (!link) {
    container.focus({ preventScroll: true });
  }

  const overlayEl = mount.querySelector("#hp-wsc-overlay");

  const wordBtn = e.target.closest("[data-word-id]");
  if (wordBtn) {
    selectWord(wordBtn.getAttribute("data-word-id"));
    return;
  }

  const letterBtn = e.target.closest("[data-letter-id]");
  if (letterBtn && !letterBtn.disabled) {
    addLetter(letterBtn.getAttribute("data-letter-id"));
    return;
  }

  const actionBtn = e.target.closest("[data-a]");
  if (actionBtn) {
    const action = actionBtn.getAttribute("data-a");

    if (action === "close-overlay") {
      hideOverlay();
      return;
    }

    if (action === "reset-puzzle") {
      resetPuzzle();
      return;
    }

    if (action === "share") {
      sharePuzzle();
      return;
    }

    if (action === "show-hint") {
      const hintNumber = Number(actionBtn.getAttribute("data-hint") || "1");
      showHint(hintNumber);
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
  }

  if (overlayEl && e.target === overlayEl) {
    hideOverlay();
  }

  const helpModalEl = mount.querySelector("#hp-wsc-help-modal");
  if (helpModalEl && e.target === helpModalEl) {
    hideHelpModal();
  }
});

  // =========================================================
  // KEYBOARD SUPPORT
  // =========================================================
 container.addEventListener("keydown", (e) => {
  const target = e.target;
  const tag = target && target.tagName ? target.tagName.toUpperCase() : "";

  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
    return;
  }

  if (!container.contains(document.activeElement)) {
    return;
  }

  const helpModalEl = mount.querySelector("#hp-wsc-help-modal");
  if (helpModalEl && helpModalEl.classList.contains("on")) {
    if (e.key === "Escape") {
      e.preventDefault();
      hideHelpModal();
    }
    return;
  }

  const overlayEl = mount.querySelector("#hp-wsc-overlay");
  if (overlayEl && overlayEl.classList.contains("on")) {
    if (e.key === "Escape") {
      e.preventDefault();
      hideOverlay();
    }
    return;
  }

  if (isFinished()) return;

  const entry = getCurrentEntry();
  if (!entry) return;

  if (e.key === "Enter") {
    e.preventDefault();
    submitGuess();
    return;
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    e.preventDefault();
    deleteLetter();
    return;
  }

  if (e.key === "Escape") {
    e.preventDefault();
    clearGuess();
    return;
  }

  const key = e.key.toUpperCase();
  if (!/^[A-Z]$/.test(key)) return;

  const chars = entry.scrambled.split("");
  for (let i = 0; i < chars.length; i++) {
    const letterId = `${entry.id}-scr-${i}`;
    if (chars[i] === key && !state.usedLetterIds.includes(letterId)) {
      e.preventDefault();
      addLetter(letterId);
      return;
    }
  }
});

  // =========================================================
  // INITIAL CLEANUP
  // =========================================================
  state.solvedWords = state.solvedWords.filter(word =>
    puzzleData.some(item => item.answer === word)
  );

  if (allSolved() && !state.revealed) {
    state.solved = true;
  }

  saveState();
  renderAll();
  }
};

(() => {
  const init = () => {
    if (window.HareWordScrambleData) {
      window.HareWordScrambleEngine.init();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

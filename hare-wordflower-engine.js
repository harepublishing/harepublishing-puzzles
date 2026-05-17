/* =========================================================
   HARE PUBLISHING WORD FLOWER ENGINE
   Version: word-flower-v1.3
   Date: 2026-05-17
   ========================================================= */

window.HareWordFlowerEngine = (() => {
  const MORE_PUZZLES_URL = "https://harepublishing.com/online-puzzles";
  const SHOP_URL = "https://harepublishing.com/shop";
  const TRACKER_KEY = "hp_puzzlers_hub_progress_v1";

  function init(userConfig = {}) {
    const data = userConfig?.dataObject || window.HareWordFlowerData || {};
    const containerId = userConfig?.containerId || "hp-wordflower-container";

    const container = document.getElementById(containerId);
    if (!container) return;

    container.setAttribute("tabindex", "0");

    const mount = container.querySelector(".hp-mount") || container;

    const puzzleId = String(data.puzzleId || "").trim();
    const puzzleDate = String(data.puzzleDate || data.date || "").trim();
    const centerLetter = String(data.centerLetter || "").trim().toUpperCase();

    const outerLetters = Array.isArray(data.outerLetters)
      ? data.outerLetters.map(l => String(l).trim().toUpperCase()).filter(Boolean)
      : [];

    const minWordLength = Number(data.minWordLength || 4);
    const pangramBonus = Number(data.pangramBonus || 7);

    const allowedWords = Array.isArray(data.allowedWords)
      ? [...new Set(data.allowedWords.map(w => String(w).trim().toUpperCase()).filter(Boolean))]
      : [];

    const puzzleTitle = `Word Flower #${puzzleId}`;
    const fullLetterSet = [centerLetter, ...outerLetters];
    const uniqueSet = new Set(fullLetterSet);

    if (!puzzleId || centerLetter.length !== 1 || outerLetters.length !== 6 || uniqueSet.size !== 7) {
      mount.innerHTML = `
        <div style="
          max-width:700px;
          margin:20px auto;
          padding:18px;
          border:1px solid #ED1B24;
          border-radius:14px;
          background:#fff5f5;
          color:#8a1c1c;
          text-align:center;
          font-family:Roboto,Arial,sans-serif;
          line-height:1.45;
        ">
          <strong>Configuration Error:</strong><br>
          Word Flower needs a puzzleId, exactly 1 center letter, and 6 different outer letters with no repeats.
        </div>
      `;
      return;
    }

    const SAVE_KEY = `hp_wf_${puzzleId}`;

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[s]));
    }

    function formatPuzzleDate(dateStr) {
      if (!dateStr) return "";

      const d = new Date(`${dateStr}T00:00:00`);
      if (Number.isNaN(d.getTime())) return dateStr;

      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }

    function usesOnlyPuzzleLetters(word) {
      return [...word].every(ch => uniqueSet.has(ch));
    }

    function includesCenter(word) {
      return word.includes(centerLetter);
    }

    function hasValidLength(word) {
      return word.length >= minWordLength;
    }

    function isPangram(word) {
      return fullLetterSet.every(letter => word.includes(letter));
    }

    function scoreWord(word) {
      let score = word.length === 4 ? 1 : word.length;
      if (isPangram(word)) score += pangramBonus;
      return score;
    }

    function totalPossibleScore() {
      return allowedWords.reduce((sum, word) => sum + scoreWord(word), 0);
    }

    function currentScore() {
      return state.found.reduce((sum, word) => sum + scoreWord(word), 0);
    }

    function sortWords(words) {
      return [...words].sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        return a.localeCompare(b);
      });
    }

    function isFinished() {
      return state.solved || state.revealed;
    }

    function nowIso() {
      return new Date().toISOString();
    }

    function loadState() {
      try {
        const saved = localStorage.getItem(SAVE_KEY);
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }

    const state = Object.assign({
      current: "",
      found: [],
      solved: false,
      revealed: false,
      overlaySeen: false,
      startedAt: null,
      completedAt: null,
      revealedAt: null
    }, loadState() || {});

    if (!Array.isArray(state.found)) state.found = [];

    state.found = [...new Set(
      state.found.map(word => String(word).trim().toUpperCase()).filter(Boolean)
    )].filter(word => allowedWords.includes(word));

    function save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch {}
    }

    function recordProgress(status) {
      try {
        const raw = localStorage.getItem(TRACKER_KEY);
        const tracker = raw ? JSON.parse(raw) : {};
        const puzzles = tracker.puzzles && typeof tracker.puzzles === "object" ? tracker.puzzles : {};
        const existing = puzzles[SAVE_KEY] && typeof puzzles[SAVE_KEY] === "object" ? puzzles[SAVE_KEY] : {};

        puzzles[SAVE_KEY] = {
          ...existing,
          key: SAVE_KEY,
          puzzleType: "wordflower",
          type: "wordflower",
          label: "Word Flower",
          puzzleId,
          puzzleTitle,
          puzzleDate,
          status,
          startedAt: existing.startedAt || state.startedAt || nowIso(),
          completedAt: state.completedAt || existing.completedAt || null,
          revealedAt: state.revealedAt || existing.revealedAt || null,
          updatedAt: nowIso()
        };

        tracker.puzzles = puzzles;
        tracker.updatedAt = nowIso();

        localStorage.setItem(TRACKER_KEY, JSON.stringify(tracker));
      } catch {}
    }

    function ensureStarted() {
      if (!state.startedAt) state.startedAt = nowIso();
      recordProgress("started");
      save();
    }

    function injectSchema() {
      const existing = document.getElementById(`hp-wf-schema-${puzzleId}`);
      if (existing) existing.remove();

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": puzzleTitle,
        "description": `Play ${puzzleTitle} by Hare Publishing. Build words using the center letter and surrounding letters, track your score, and save your progress automatically.`,
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
      script.id = `hp-wf-schema-${puzzleId}`;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }

    const invalidConfiguredWords = allowedWords.filter(word => {
      return !hasValidLength(word) || !includesCenter(word) || !usesOnlyPuzzleLetters(word);
    });

    injectSchema();

    mount.innerHTML = `
      ${puzzleDate ? `<div class="hp-puzzle-date">${escapeHtml(formatPuzzleDate(puzzleDate))}</div>` : ""}

      <div class="hp-wf-layout">

        <div class="hp-wf-col-left">
          <div class="hp-wf-panel" id="hp-wf-main-panel">

            <div class="hp-wf-stats">
              <div class="hp-wf-stat">
                <span class="hp-wf-stat-value" id="hp-wf-found-ratio">0/0</span>
                <span class="hp-wf-stat-label">Words Found</span>
              </div>

              <div class="hp-wf-stat">
                <span class="hp-wf-stat-value" id="hp-wf-score">0</span>
                <span class="hp-wf-stat-label">Current Score</span>
              </div>

              <div class="hp-wf-stat">
                <span class="hp-wf-stat-value" id="hp-wf-max-score">0</span>
                <span class="hp-wf-stat-label">Max Score</span>
              </div>
            </div>

            <div class="hp-wf-progress">
              <div class="hp-wf-progress-fill" id="hp-wf-progress-fill"></div>
            </div>

            <div class="hp-wf-flower-wrap">
              <div class="hp-wf-flower">
                <div class="hp-wf-flower-core"></div>

                <button type="button" class="hp-wf-letter hp-wf-center-letter" data-letter="${escapeHtml(centerLetter)}" aria-label="Center letter ${escapeHtml(centerLetter)}">${escapeHtml(centerLetter)}</button>

                ${outerLetters.map((letter, index) => `
                  <button type="button" class="hp-wf-letter hp-wf-outer-letter hp-wf-pos-${index}" data-letter="${escapeHtml(letter)}" aria-label="Outer letter ${escapeHtml(letter)}">${escapeHtml(letter)}</button>
                `).join("")}
              </div>
            </div>

            <div class="hp-wf-input-wrap">
              <div id="hp-wf-current-word" class="hp-wf-current-word hp-wf-placeholder">BUILD A WORD</div>
              <div id="hp-wf-message" class="hp-wf-message hp-wf-neutral"> </div>
            </div>

            <div class="hp-wf-actions">
              <button type="button" id="hp-wf-enter" class="hp-wf-enter-btn">Enter</button>
              <button type="button" id="hp-wf-delete" class="hp-wf-delete-btn">Delete</button>
              <button type="button" id="hp-wf-clear" class="hp-wf-clear-btn">Clear</button>
            </div>

            <div class="hp-wf-secondary-actions">
              <button type="button" id="hp-wf-reset" class="hp-wf-reset-btn">Reset Puzzle</button>
              <button type="button" id="hp-wf-reveal" class="hp-wf-reveal-btn">Reveal Answers</button>
            </div>

            ${invalidConfiguredWords.length ? `
              <div class="hp-wf-config-warning">
                <strong>Configuration warning:</strong><br>
                These words in your allowed list do not match the current letter set or rules:
                <br><br>
                ${invalidConfiguredWords.map(escapeHtml).join(", ")}
              </div>
            ` : ""}

          </div>
        </div>

        <div class="hp-wf-col-right">
          <div class="hp-wf-panel" id="hp-wf-right-panel">

            <details class="hp-wf-help-details">
              <summary class="hp-wf-help-summary">How to play</summary>
              <div class="hp-wf-help">
                <span class="hp-wf-help-line">Build words using the flower letters.</span>
                <span class="hp-wf-help-line">Every word must include the <strong>center letter ${escapeHtml(centerLetter)}</strong>.</span>
                <span class="hp-wf-help-line">Use only the letters shown and make words at least <strong>${escapeHtml(minWordLength)}</strong> letters long.</span>
                <span class="hp-wf-help-line"><strong>Reveal Answers</strong> ends the puzzle and shows every accepted word.</span>
              </div>
            </details>

            <div class="hp-wf-found-header">
              <h3>Found Words</h3>
              <span class="hp-wf-pill" id="hp-wf-found-header-pill">Accepted words only</span>
            </div>

            <div id="hp-wf-found-words" class="hp-wf-found-words"></div>

          </div>
        </div>

      </div>

      <div class="hp-overlay" id="hp-wf-overlay" aria-hidden="true">
        <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Word Flower result">
          <div id="hp-wf-overlay-icon" style="font-size:28px; line-height:1;">🎉</div>

          <h3 id="hp-wf-overlay-title">You Solved the Word Flower!</h3>

          <div class="hp-badges">
            <span class="hp-badge" id="hp-wf-badge-id"></span>
            <span class="hp-badge" id="hp-wf-badge-meta"></span>
          </div>

          <p id="hp-wf-overlay-text">Congratulations — you found every accepted word. Explore more puzzles online or browse puzzle books for offline fun.</p>

          <div class="hp-modal-actions">
            <a class="hp-link-btn secondary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
            <a class="hp-link-btn primary" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>

            <button type="button" class="hp-link-btn neutral" data-a="share">Share</button>
            <button type="button" class="hp-link-btn neutral" data-a="close-solved">Back to Puzzle</button>

            <button type="button" class="hp-link-btn full danger" data-a="reset-puzzle">Reset Puzzle</button>
          </div>

          <small>Hare Publishing • Word Flower</small>
        </div>
      </div>
    `;

    const mainPanelEl = container.querySelector("#hp-wf-main-panel");
    const rightPanelEl = container.querySelector("#hp-wf-right-panel");
    const currentWordEl = container.querySelector("#hp-wf-current-word");
    const messageEl = container.querySelector("#hp-wf-message");
    const foundRatioEl = container.querySelector("#hp-wf-found-ratio");
    const scoreEl = container.querySelector("#hp-wf-score");
    const maxScoreEl = container.querySelector("#hp-wf-max-score");
    const progressFillEl = container.querySelector("#hp-wf-progress-fill");
    const foundWordsEl = container.querySelector("#hp-wf-found-words");
    const foundHeaderPillEl = container.querySelector("#hp-wf-found-header-pill");
    const overlayEl = container.querySelector("#hp-wf-overlay");
    const badgeIdEl = container.querySelector("#hp-wf-badge-id");
    const badgeMetaEl = container.querySelector("#hp-wf-badge-meta");
    const overlayIconEl = container.querySelector("#hp-wf-overlay-icon");
    const overlayTitleEl = container.querySelector("#hp-wf-overlay-title");
    const overlayTextEl = container.querySelector("#hp-wf-overlay-text");

    function syncPanelHeights() {
      if (!mainPanelEl || !rightPanelEl) return;

      if (window.innerWidth <= 900) {
        rightPanelEl.style.height = "";
        return;
      }

      rightPanelEl.style.height = "";

      requestAnimationFrame(() => {
        if (!mainPanelEl || !rightPanelEl) return;
        rightPanelEl.style.height = `${mainPanelEl.offsetHeight}px`;
      });
    }

    function updateFinishedStateUI() {
      mainPanelEl.classList.toggle("hp-wf-finished", isFinished());
      foundHeaderPillEl.textContent = state.revealed ? "Found + revealed answers" : "Accepted words only";
    }

    function updateInputDisplay() {
      if (state.current && !isFinished()) {
        currentWordEl.innerHTML = escapeHtml(state.current);
        currentWordEl.classList.remove("hp-wf-placeholder");
      } else if (state.revealed) {
        currentWordEl.innerHTML = "PUZZLE COMPLETE";
        currentWordEl.classList.remove("hp-wf-placeholder");
      } else if (state.solved) {
        currentWordEl.innerHTML = "PUZZLE SOLVED";
        currentWordEl.classList.remove("hp-wf-placeholder");
      } else {
        currentWordEl.innerHTML = "BUILD A WORD";
        currentWordEl.classList.add("hp-wf-placeholder");
      }
    }

    function updateStats() {
      foundRatioEl.textContent = `${state.found.length}/${allowedWords.length}`;
      scoreEl.textContent = String(currentScore());
      maxScoreEl.textContent = String(totalPossibleScore());

      const pct = allowedWords.length ? (state.found.length / allowedWords.length) * 100 : 0;
      progressFillEl.style.width = `${pct}%`;
    }

    function renderFoundWords() {
      if (!state.found.length && !state.revealed) {
        foundWordsEl.innerHTML = `<div class="hp-wf-empty">No words found yet. Start building!</div>`;
        return;
      }

      const list = state.revealed ? sortWords(allowedWords) : sortWords(state.found);

      foundWordsEl.innerHTML = list.map(word => {
        const userFound = state.found.includes(word);

        const pangram = isPangram(word)
          ? `<span class="hp-wf-pill hp-wf-pill-pangram">PANGRAM</span>`
          : "";

        const sourcePill = state.revealed && !userFound
          ? `<span class="hp-wf-pill hp-wf-pill-revealed">REVEALED</span>`
          : state.revealed && userFound
            ? `<span class="hp-wf-pill">FOUND</span>`
            : "";

        return `
          <div class="hp-wf-found-item ${state.revealed && !userFound ? "is-revealed" : ""}">
            <div class="hp-wf-found-word">${escapeHtml(word)}</div>
            <div class="hp-wf-found-meta">
              <span class="hp-wf-pill">${scoreWord(word)} pts</span>
              ${pangram}
              ${sourcePill}
            </div>
          </div>
        `;
      }).join("");
    }

    function showMessage(msg, type = "neutral") {
      messageEl.textContent = msg;
      messageEl.className = `hp-wf-message hp-wf-${type}`;
    }

    function clearMessage() {
      showMessage(" ", "neutral");
    }

    function renderAll() {
      updateFinishedStateUI();
      updateInputDisplay();
      updateStats();
      renderFoundWords();
      syncPanelHeights();
    }

    function addLetter(letter) {
      if (isFinished()) return;
      ensureStarted();
      state.current += String(letter).toUpperCase();
      save();
      renderAll();
      clearMessage();
    }

    function deleteLetter() {
      if (isFinished()) return;
      state.current = state.current.slice(0, -1);
      save();
      renderAll();
      clearMessage();
    }

    function clearCurrent() {
      if (isFinished()) return;
      state.current = "";
      save();
      renderAll();
      clearMessage();
    }

    function submitWord() {
      if (isFinished()) return;

      const word = state.current.toUpperCase().trim();

      if (!word) {
        showMessage("Type or build a word first.", "error");
        return;
      }

      ensureStarted();

      if (!hasValidLength(word)) {
        showMessage(`Words must be at least ${minWordLength} letters.`, "error");
        return;
      }

      if (!includesCenter(word)) {
        showMessage(`Every word must include the center letter "${centerLetter}".`, "error");
        return;
      }

      if (!usesOnlyPuzzleLetters(word)) {
        showMessage("That word uses letters outside this flower.", "error");
        return;
      }

      if (!allowedWords.includes(word)) {
        showMessage("That is not one of the accepted words for this puzzle.", "error");
        return;
      }

      if (state.found.includes(word)) {
        showMessage("You already found that word.", "error");
        return;
      }

      state.found.push(word);
      state.current = "";
      save();
      renderAll();

      showMessage(isPangram(word) ? `Great job! "${word}" is a pangram.` : `Great find: "${word}"`, "success");

      if (state.found.length === allowedWords.length) {
        state.solved = true;
        state.revealed = false;
        state.overlaySeen = false;
        state.completedAt = nowIso();
        recordProgress("completed");
        save();
        renderAll();
        showOverlay();
      }
    }

    function revealAnswers() {
      if (isFinished()) return;
      if (!confirm("Reveal all answers? This will end the puzzle.")) return;

      ensureStarted();
      state.current = "";
      state.revealed = true;
      state.solved = false;
      state.overlaySeen = false;
      state.revealedAt = nowIso();

      recordProgress("revealed");
      save();
      renderAll();
      showMessage("All answers revealed.", "neutral");
      showOverlay();
    }

    function resetPuzzle() {
      if (!confirm("Reset this puzzle and clear all progress?")) return;

      state.current = "";
      state.found = [];
      state.solved = false;
      state.revealed = false;
      state.overlaySeen = false;
      state.startedAt = null;
      state.completedAt = null;
      state.revealedAt = null;

      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {}

      save();
      hideOverlay();
      renderAll();
      clearMessage();
    }

    function renderOverlayContent() {
      badgeIdEl.textContent = puzzleTitle;

      if (state.solved) {
        overlayIconEl.textContent = "🎉";
        overlayTitleEl.textContent = "You Solved the Word Flower!";
        badgeMetaEl.textContent = `Score: ${currentScore()}`;
        overlayTextEl.textContent = "Congratulations — you found every accepted word. Explore more puzzles online or browse puzzle books for offline fun.";
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "📘";
        overlayTitleEl.textContent = "Answers Revealed";
        badgeMetaEl.textContent = `Found: ${state.found.length}/${allowedWords.length}`;
        overlayTextEl.textContent = "Here are all the accepted answers for this puzzle. Explore more puzzles online or browse puzzle books for offline fun.";
      }
    }

    function showOverlay() {
      renderOverlayContent();
      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");
      state.overlaySeen = false;
      save();
      syncPanelHeights();
    }

    function hideOverlay() {
      overlayEl.classList.remove("on");
      overlayEl.setAttribute("aria-hidden", "true");
      state.overlaySeen = true;
      save();
      syncPanelHeights();
    }

    container.querySelectorAll(".hp-wf-letter").forEach(btn => {
      btn.addEventListener("click", () => addLetter(btn.getAttribute("data-letter")));
    });

    container.querySelector("#hp-wf-enter")?.addEventListener("click", submitWord);
    container.querySelector("#hp-wf-delete")?.addEventListener("click", deleteLetter);
    container.querySelector("#hp-wf-clear")?.addEventListener("click", clearCurrent);
    container.querySelector("#hp-wf-reset")?.addEventListener("click", resetPuzzle);
    container.querySelector("#hp-wf-reveal")?.addEventListener("click", revealAnswers);

    container.addEventListener("keydown", e => {
      const target = e.target;
      const tag = target && target.tagName ? target.tagName.toUpperCase() : "";

      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      if (!container.contains(document.activeElement)) return;

      if (overlayEl.classList.contains("on")) {
        if (e.key === "Escape") {
          e.preventDefault();
          hideOverlay();
        }
        return;
      }

      if (isFinished()) return;

      const key = e.key.toUpperCase();

      if (key === "ENTER") {
        e.preventDefault();
        submitWord();
        return;
      }

      if (key === "BACKSPACE" || key === "DELETE") {
        e.preventDefault();
        deleteLetter();
        return;
      }

      if (/^[A-Z]$/.test(key) && uniqueSet.has(key)) {
        e.preventDefault();
        addLetter(key);
      }
    });

    overlayEl.addEventListener("click", e => {
      if (e.target === overlayEl) hideOverlay();
    });

    container.addEventListener("click", e => {
      const link = e.target?.closest?.("a[href]");
      if (link) return;

      const btn = e.target.closest("[data-a]");
      if (!btn) return;

      const action = btn.getAttribute("data-a");

      if (action === "close-solved") {
        hideOverlay();
        return;
      }

      if (action === "reset-puzzle") {
        resetPuzzle();
        return;
      }

      if (action === "share") {
        const shareData = {
          title: `${puzzleTitle} — Hare Publishing`,
          text: state.solved
            ? `I solved ${puzzleTitle} from Hare Publishing!`
            : `I played ${puzzleTitle} from Hare Publishing!`,
          url: window.location.href
        };

        if (navigator.share) {
          navigator.share(shareData).catch(() => {});
        } else {
          try {
            navigator.clipboard.writeText(window.location.href);
            showMessage("Link copied! 📋", "success");
          } catch {
            showMessage("Copy the link from your address bar 🙂", "error");
          }
        }
      }
    });

    container.addEventListener("mousedown", e => {
      const link = e.target?.closest?.("a[href]");
      if (link) return;
      container.focus({ preventScroll: true });
    });

    window.addEventListener("resize", syncPanelHeights);

    renderAll();

    if (state.solved) {
      showMessage("Puzzle already solved.", "success");
    } else if (state.revealed) {
      showMessage("Answers already revealed.", "neutral");
    } else {
      clearMessage();
    }

    if ((state.solved || state.revealed) && !state.overlaySeen) {
      showOverlay();
    }

    syncPanelHeights();
  }

  return { init };
})();

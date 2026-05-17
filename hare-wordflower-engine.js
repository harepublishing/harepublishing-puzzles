/* =========================================================
   HARE PUBLISHING WORD FLOWER ENGINE
   GitHub-hosted engine file
   Updated: 2026-05-17
   Purpose: shared engine + Squarespace puzzle-data architecture
   Expects: window.HareWordFlowerData
   ========================================================= */

(function () {
  "use strict";

  const DEFAULT_MORE_PUZZLES_URL = "https://harepublishing.com/online-puzzles";
  const DEFAULT_SHOP_URL = "https://harepublishing.com/shop";
  const TRACKER_KEY = "hp_puzzlers_hub_progress_v1";

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[s]));
  }

  function normalizeWord(word) {
    return String(word || "").trim().toUpperCase();
  }

  function getTodayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatPuzzleDate(rawDate) {
    if (!rawDate) return "";
    const parts = String(rawDate).split("-").map(Number);
    if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) return String(rawDate);
    const [year, month, day] = parts;
    const dt = new Date(year, month - 1, day);
    return dt.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function updateProgressTracker({ storageKey, puzzleId, puzzleTitle, puzzleDate, type, status, score, maxScore, foundCount, totalCount }) {
    const now = new Date().toISOString();
    const today = getTodayKey();
    const tracker = readJson(TRACKER_KEY, {});
    if (!tracker.puzzles || typeof tracker.puzzles !== "object") tracker.puzzles = {};

    const existing = tracker.puzzles[storageKey] || {};
    const next = {
      ...existing,
      key: storageKey,
      storageKey,
      puzzleId: String(puzzleId || ""),
      puzzleTitle: puzzleTitle || `Word Flower #${puzzleId}`,
      type: type || "wordflower",
      puzzleType: type || "wordflower",
      puzzleDate: puzzleDate || existing.puzzleDate || today,
      status: status || existing.status || "in-progress",
      score: Number.isFinite(score) ? score : existing.score || 0,
      maxScore: Number.isFinite(maxScore) ? maxScore : existing.maxScore || 0,
      foundCount: Number.isFinite(foundCount) ? foundCount : existing.foundCount || 0,
      totalCount: Number.isFinite(totalCount) ? totalCount : existing.totalCount || 0,
      updatedAt: now
    };

    if (!next.startedAt) next.startedAt = now;
    if (!next.startedDate) next.startedDate = today;

    if (status === "completed" || status === "revealed") {
      if (!next.completedAt) next.completedAt = now;
      if (!next.completedDate) next.completedDate = today;
    }

    tracker.puzzles[storageKey] = next;
    tracker.updatedAt = now;
    writeJson(TRACKER_KEY, tracker);

    try {
      window.dispatchEvent(new CustomEvent("hare:puzzle-progress-updated", { detail: next }));
    } catch {}
  }

  function initWordFlower(userConfig) {
    const data = userConfig || window.HareWordFlowerData || {};
    const container = document.getElementById(data.containerId || "hp-wordflower-container");
    if (!container) return;

    const mount = container.querySelector(".hp-mount");
    if (!mount) return;

    const puzzleId = String(data.puzzleId || "").trim();
    const puzzleTitle = data.puzzleTitle || `Word Flower #${puzzleId}`;
    const puzzleDate = data.puzzleDate || data.date || "";
    const centerLetter = normalizeWord(data.centerLetter).slice(0, 1);
    const outerLetters = Array.isArray(data.outerLetters)
      ? data.outerLetters.map(l => normalizeWord(l).slice(0, 1)).filter(Boolean).slice(0, 6)
      : [];
    const minWordLength = Number.isFinite(Number(data.minWordLength)) ? Number(data.minWordLength) : 4;
    const pangramBonus = Number.isFinite(Number(data.pangramBonus)) ? Number(data.pangramBonus) : 7;
    const morePuzzlesUrl = data.morePuzzlesUrl || DEFAULT_MORE_PUZZLES_URL;
    const shopUrl = data.shopUrl || DEFAULT_SHOP_URL;
    const type = "wordflower";

    const yearEl = container.querySelector("#hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    container.setAttribute("tabindex", "0");
    container.addEventListener("mousedown", e => {
      const link = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (link) return;
      container.focus({ preventScroll: true });
    });

    const fullLetterSet = [centerLetter, ...outerLetters];
    const uniqueSet = new Set(fullLetterSet);

    if (!puzzleId || centerLetter.length !== 1 || outerLetters.length !== 6 || uniqueSet.size !== 7) {
      mount.innerHTML = `
        <div class="hp-wf-panel hp-wf-config-error">
          <strong>Configuration Error:</strong> Word Flower needs a puzzleId, exactly 1 center letter, and 6 different outer letters with no repeats.
        </div>
      `;
      return;
    }

    const normalizedAllowedWords = [...new Set(
      (Array.isArray(data.allowedWords) ? data.allowedWords : [])
        .map(normalizeWord)
        .filter(Boolean)
    )];

    function usesOnlyPuzzleLetters(word) {
      return [...word].every(ch => uniqueSet.has(ch));
    }

    function includesCenter(word) {
      return word.includes(centerLetter);
    }

    function hasValidLength(word) {
      return word.length >= minWordLength;
    }

    const invalidConfiguredWords = normalizedAllowedWords.filter(word => {
      return !hasValidLength(word) || !includesCenter(word) || !usesOnlyPuzzleLetters(word);
    });

    const SAVE_KEY = `hp_wf_${puzzleId}`;

    const loadedState = readJson(SAVE_KEY, null);
    const state = loadedState || {
      current: "",
      found: [],
      solved: false,
      revealed: false,
      overlaySeen: false,
      startedAt: null,
      completedAt: null,
      revealedAt: null
    };

    if (!Array.isArray(state.found)) state.found = [];
    if (typeof state.current !== "string") state.current = "";
    if (typeof state.solved !== "boolean") state.solved = false;
    if (typeof state.revealed !== "boolean") state.revealed = false;
    if (typeof state.overlaySeen !== "boolean") state.overlaySeen = false;

    function isPangram(word) {
      return fullLetterSet.every(letter => word.includes(letter));
    }

    function scoreWord(word) {
      let score = word.length === 4 ? 1 : word.length;
      if (isPangram(word)) score += pangramBonus;
      return score;
    }

    function totalPossibleScore() {
      return normalizedAllowedWords.reduce((sum, word) => sum + scoreWord(word), 0);
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

    function formatCount() {
      return `${state.found.length}/${normalizedAllowedWords.length}`;
    }

    function isFinished() {
      return state.solved || state.revealed;
    }

    function trackerStatus() {
      if (state.solved) return "completed";
      if (state.revealed) return "revealed";
      return state.found.length || state.current ? "in-progress" : "not-started";
    }

    function save() {
      writeJson(SAVE_KEY, state);
      if (state.found.length || state.current || state.solved || state.revealed) {
        updateProgressTracker({
          storageKey: SAVE_KEY,
          puzzleId,
          puzzleTitle,
          puzzleDate,
          type,
          status: trackerStatus(),
          score: currentScore(),
          maxScore: totalPossibleScore(),
          foundCount: state.found.length,
          totalCount: normalizedAllowedWords.length
        });
      }
    }

    function markStarted() {
      if (!state.startedAt) state.startedAt = new Date().toISOString();
    }

    function markCompleted(kind) {
      const now = new Date().toISOString();
      if (kind === "solved") {
        state.solved = true;
        state.revealed = false;
        if (!state.completedAt) state.completedAt = now;
      }
      if (kind === "revealed") {
        state.revealed = true;
        state.solved = false;
        if (!state.revealedAt) state.revealedAt = now;
      }
      state.overlaySeen = false;
    }

    window.addEventListener("beforeunload", save);

    function injectSchema() {
      const schemaId = `hp-wf-schema-${puzzleId}`;
      const existing = document.getElementById(schemaId);
      if (existing) existing.remove();

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": `Word Flower Puzzle #${puzzleId}`,
        "description": `Play and solve Word Flower Puzzle #${puzzleId} by Hare Publishing. Build words using the center letter and surrounding letters, track your score, and save your progress automatically.`,
        "genre": "Word Puzzle",
        "url": window.location.href,
        "inLanguage": "en",
        "audience": { "@type": "PeopleAudience", "suggestedMinAge": "8" },
        "numberOfPlayers": "1",
        "copyrightYear": String(new Date().getFullYear()),
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://harepublishing.com/"
        }
      };

      const script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }

    injectSchema();

    const dateMarkup = puzzleDate ? `<div class="hp-puzzle-date">${escapeHtml(formatPuzzleDate(puzzleDate))}</div>` : "";

    mount.innerHTML = `
      ${dateMarkup}
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
                <br><br>${invalidConfiguredWords.map(escapeHtml).join(", ")}
              </div>
            ` : ""}
          </div>
        </div>

        <div class="hp-wf-col-right">
          <div class="hp-wf-panel">
            <details class="hp-wf-help-details">
              <summary class="hp-wf-help-summary">How to play</summary>
              <div class="hp-wf-help">
                <span class="hp-wf-help-line">Build words using the flower letters.</span>
                <span class="hp-wf-help-line">Every word must include the <strong>center letter ${escapeHtml(centerLetter)}</strong>.</span>
                <span class="hp-wf-help-line">Use only the letters shown and make words at least <strong>${minWordLength} letters</strong> long.</span>
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
        <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Word Flower message">
          <div id="hp-wf-overlay-icon" class="hp-wf-overlay-icon">🎉</div>
          <h3 id="hp-wf-overlay-title">You Solved the Word Flower!</h3>
          <div class="hp-badges">
            <span class="hp-badge" id="hp-wf-badge-id"></span>
            <span class="hp-badge" id="hp-wf-badge-meta"></span>
          </div>
          <p id="hp-wf-overlay-text">Congratulations — you found every accepted word.</p>
          <div class="hp-modal-actions">
            <a class="hp-link-btn secondary" href="${escapeHtml(morePuzzlesUrl)}">More Online Puzzles</a>
            <a class="hp-link-btn primary" href="${escapeHtml(shopUrl)}">Get Puzzle Books</a>
            <button type="button" class="hp-link-btn neutral" data-a="share">Share</button>
            <button type="button" class="hp-link-btn neutral" data-a="close-solved">Back to Puzzle</button>
            <button type="button" class="hp-link-btn full danger" data-a="reset-puzzle">Reset Puzzle</button>
          </div>
          <small>Hare Publishing • Word Flower</small>
        </div>
      </div>
    `;

    const mainPanelEl = container.querySelector("#hp-wf-main-panel");
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
      foundRatioEl.textContent = formatCount();
      scoreEl.textContent = currentScore();
      maxScoreEl.textContent = totalPossibleScore();
      const pct = normalizedAllowedWords.length ? (state.found.length / normalizedAllowedWords.length) * 100 : 0;
      progressFillEl.style.width = `${pct}%`;
    }

    function renderFoundWords() {
      if (!state.found.length && !state.revealed) {
        foundWordsEl.innerHTML = `<div class="hp-wf-empty">No words found yet. Start building!</div>`;
        return;
      }

      const list = state.revealed ? sortWords(normalizedAllowedWords) : sortWords(state.found);

      foundWordsEl.innerHTML = list.map(word => {
        const userFound = state.found.includes(word);
        const pangram = isPangram(word) ? `<span class="hp-wf-pill hp-wf-pill-pangram">PANGRAM</span>` : "";
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
        badgeMetaEl.textContent = `Found: ${state.found.length}/${normalizedAllowedWords.length}`;
        overlayTextEl.textContent = "Here are all the accepted answers for this puzzle. Explore more puzzles online or browse puzzle books for offline fun.";
      }
    }

    function renderAll() {
      updateFinishedStateUI();
      updateInputDisplay();
      updateStats();
      renderFoundWords();
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

    function addLetter(letter) {
      if (isFinished()) return;
      if (!letter || letter.length !== 1) return;
      markStarted();
      state.current += letter.toUpperCase();
      updateInputDisplay();
      clearMessage();
      save();
    }

    function deleteLetter() {
      if (isFinished()) return;
      markStarted();
      state.current = state.current.slice(0, -1);
      updateInputDisplay();
      clearMessage();
      save();
    }

    function clearCurrent() {
      if (isFinished()) return;
      markStarted();
      state.current = "";
      updateInputDisplay();
      clearMessage();
      save();
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
      writeJson(SAVE_KEY, state);
      hideOverlay();
      renderAll();
      clearMessage();
    }

    function revealAnswers() {
      if (isFinished()) return;
      const ok = confirm("Reveal all answers? This will end the puzzle.");
      if (!ok) return;
      markStarted();
      state.current = "";
      markCompleted("revealed");
      save();
      renderAll();
      showMessage("All answers revealed.", "neutral");
      showOverlay();
    }

    function submitWord() {
      if (isFinished()) return;
      markStarted();
      const word = state.current.toUpperCase().trim();

      if (!word) {
        showMessage("Type or build a word first.", "error");
        return;
      }
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
      if (!normalizedAllowedWords.includes(word)) {
        showMessage("That is not one of the accepted words for this puzzle.", "error");
        return;
      }
      if (state.found.includes(word)) {
        showMessage("You already found that word.", "error");
        return;
      }

      state.found.push(word);
      state.current = "";

      if (state.found.length === normalizedAllowedWords.length) {
        markCompleted("solved");
      }

      save();
      renderAll();

      if (isPangram(word)) {
        showMessage(`Great job! "${word}" is a pangram.`, "success");
      } else {
        showMessage(`Great find: "${word}"`, "success");
      }

      if (state.solved) showOverlay();
    }

    container.querySelectorAll(".hp-wf-letter").forEach(btn => {
      btn.addEventListener("click", () => addLetter(btn.getAttribute("data-letter")));
    });

    container.querySelector("#hp-wf-enter").addEventListener("click", submitWord);
    container.querySelector("#hp-wf-delete").addEventListener("click", deleteLetter);
    container.querySelector("#hp-wf-clear").addEventListener("click", clearCurrent);
    container.querySelector("#hp-wf-reset").addEventListener("click", resetPuzzle);
    container.querySelector("#hp-wf-reveal").addEventListener("click", revealAnswers);

    container.addEventListener("click", e => {
      const link = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (link) return;

      const btn = e.target && e.target.closest ? e.target.closest("[data-a]") : null;
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

    container.addEventListener("keydown", e => {
      const target = e.target;
      const tag = target && target.tagName ? target.tagName.toUpperCase() : "";

      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (target && target.isContentEditable)) return;
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

    renderAll();

    if (state.solved) {
      showMessage("Puzzle already solved.", "success");
    } else if (state.revealed) {
      showMessage("Answers already revealed.", "neutral");
    } else {
      clearMessage();
    }

    if ((state.solved || state.revealed) && !state.overlaySeen) showOverlay();
  }

  window.HareWordFlowerEngine = window.HareWordFlowerEngine || {};
  window.HareWordFlowerEngine.init = initWordFlower;

  document.addEventListener("DOMContentLoaded", function () {
    if (window.HareWordFlowerData && !window.HareWordFlowerData.deferInit) {
      initWordFlower(window.HareWordFlowerData);
    }
  });
})();

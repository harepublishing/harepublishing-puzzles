/* =========================================================
   HARE PUBLISHING WORD SEARCH PLATFORM ENGINE
   GitHub/jsDelivr hosted engine file
   Updated: 2026-07-05 v2.8 - standardizes JSON-LD Game schema

   Suggested filename:
   hare-word-search-platform-engine-v2.8.js

   Expected page setup:
   - A container with id="hp-wordsearch-container"
   - A puzzle data object: window.HareWordSearchData
     OR a JSON block with id="hp-wordsearch-data"
   - This engine loaded after the puzzle data block

   Uses shared CSS foundation + Word Search CSS.
   ========================================================= */

window.HareWordSearchEngine = {
  init({
    containerId = "hp-wordsearch-container",
    dataId = "hp-wordsearch-data",
    dataObject = window.HareWordSearchData
  } = {}) {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error("HareWordSearchEngine: puzzle container missing.");
      return;
    }

    if (container.dataset.hpWordsearchMounted === "true") {
      console.warn("HareWordSearchEngine: this container has already been mounted.");
      return;
    }

    container.dataset.hpWordsearchMounted = "true";
    container.setAttribute("tabindex", "0");

    const mount = container.querySelector(".hp-mount");
    if (!mount) {
      console.error("HareWordSearchEngine: .hp-mount element missing inside puzzle container.");
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
        console.error("HareWordSearchEngine: puzzle data block contains invalid JSON.", err);
      }
    }

    const MORE_PUZZLES_URL = pageData?.morePuzzlesUrl || "/puzzlers-hub";
    const SHOP_URL = pageData?.shopUrl || "https://harepublishing.com/shop";

    function escapeHtml(str) {
      return String(str).replace(/[&<>\"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '\"': "&quot;",
        "'": "&#39;"
      }[s]));
    }

    function cleanWord(value) {
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

    function canonicalPathKey(path) {
      const forward = path.map(p => `${p.r},${p.c}`).join("|");
      const backward = [...path].reverse().map(p => `${p.r},${p.c}`).join("|");
      return forward < backward ? forward : backward;
    }

    function getPathForPlacement(p) {
      const word = cleanWord(p.word);
      const path = [];
      for (let i = 0; i < word.length; i++) {
        path.push({
          r: Number(p.row) + Number(p.dr) * i,
          c: Number(p.col) + Number(p.dc) * i
        });
      }
      return path;
    }

    if (!pageData) {
      showConfigError("Word Search puzzle data is missing. Add window.HareWordSearchData before loading the engine.");
      return;
    }

    const puzzleId = String(pageData.puzzleId || "").trim();
    const puzzleTitle = String(pageData.puzzleTitle || (puzzleId ? `Word Search #${puzzleId}` : "Word Search")).trim();
    const puzzleDate = formatPuzzleDate(pageData.puzzleDate || pageData.date || "");
    const puzzleTheme = String(pageData.theme || pageData.puzzleTheme || pageData.topic || "").trim();
    const grid = Array.isArray(pageData.grid) ? pageData.grid.map(row => String(row || "").toUpperCase().replace(/[^A-Z]/g, "")) : [];
    const rowCount = grid.length;
    const colCount = rowCount ? grid[0].length : 0;
    const placementsRaw = Array.isArray(pageData.placements) ? pageData.placements : [];

    if (!puzzleId) {
      showConfigError("Word Search puzzleId is missing.");
      return;
    }

    if (!rowCount || !colCount || grid.some(row => row.length !== colCount)) {
      showConfigError("Word Search grid must be an array of equal-length letter rows.");
      return;
    }

    if (!placementsRaw.length) {
      showConfigError("Word Search placements are missing.");
      return;
    }

    const board = grid.map(row => row.split(""));
    const placements = placementsRaw.map(p => {
      const word = cleanWord(p.word);
      const row = Number(p.row);
      const col = Number(p.col);
      const dr = Number(p.dr);
      const dc = Number(p.dc);
      const path = getPathForPlacement({ word, row, col, dr, dc });
      return { word, row, col, dr, dc, path, pathKey: canonicalPathKey(path) };
    }).filter(p => p.word && p.path.every(pos => (
      pos.r >= 0 && pos.r < rowCount && pos.c >= 0 && pos.c < colCount
    )));

    const normalizedWords = placements.map(p => p.word);
    const placementMap = new Map();
    placements.forEach(p => placementMap.set(p.pathKey, p));

    if (!placements.length) {
      showConfigError("Word Search placements are invalid or outside the grid.");
      return;
    }

    const STORAGE_KEY = `hp2_ws_${puzzleId}`;

    (function injectSchema() {
      const existing = document.getElementById("hp-ws-schema");
      if (existing) existing.remove();

      const pageUrl = window.location.href;
      const schemaDate = String(pageData.puzzleDate || pageData.date || "").trim();
      const collectionUrl = new URL(pageData.publicPlayUrl || pageData.playPageUrl || "/word-search", window.location.origin).toString();
      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "@id": `${pageUrl}#puzzle`,
        "name": puzzleTitle,
        "description": `Play and solve ${puzzleTitle} by Hare Publishing. Find hidden words in a letter grid, save your progress automatically, and reveal the answers whenever you like.`,
        "genre": "Puzzle",
        "url": pageUrl,
        "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
        "inLanguage": "en",
        ...(schemaDate ? { "datePublished": schemaDate } : {}),
        "audience": { "@type": "PeopleAudience", "suggestedMinAge": "8" },
        "numberOfPlayers": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 1 },
        "copyrightYear": String((schemaDate && schemaDate.slice(0, 4)) || new Date().getFullYear()),
        "keywords": ["Word Search", "word puzzle", "daily puzzle", "online puzzle", "Hare Publishing"],
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://www.harepublishing.com/"
        },
        "isPartOf": {
          "@type": "CollectionPage",
          "name": "Word Search",
          "url": collectionUrl
        }
      };

      const script = document.createElement("script");
      script.id = "hp-ws-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    })();

    function recordPuzzleEvent(eventName, extra = {}) {
      const payload = {
        puzzleType: "word-search",
        puzzleId,
        puzzleTitle,
        puzzleDate: pageData.puzzleDate || pageData.date || "",
        eventName,
        event: eventName,
        source: "hare-word-search-engine",
        timestamp: new Date().toISOString(),
        ...extra
      };

      try {
        window.dispatchEvent(new CustomEvent("hare:puzzle-event", { detail: payload }));
      } catch {}

      try {
        const analytics = window.HarePuzzleAnalytics;
        if (!analytics) return;

        if (typeof analytics.recordEvent === "function") analytics.recordEvent(payload);
        else if (typeof analytics.trackEvent === "function") analytics.trackEvent(payload);
        else if (typeof analytics.logEvent === "function") analytics.logEvent(payload);
        else if (typeof analytics.recordPuzzleEvent === "function") analytics.recordPuzzleEvent(payload);
        else if (typeof analytics.trackPuzzleEvent === "function") analytics.trackPuzzleEvent(payload);
      } catch {}
    }

    function defaultState() {
      return {
        foundWords: [],
        foundPathKeys: [],
        revealed: false,
        solved: false,
        overlaySeen: false,
        anchor: null,
        startedAt: "",
        solvedAt: "",
        revealedAt: ""
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
        saveState();
        recordPuzzleEvent("started");
      }
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent("hare:puzzle-state-change", { detail: { puzzleType: "word-search", puzzleId } }));
        window.dispatchEvent(new CustomEvent("hare-word-search-progress", { detail: { puzzleId } }));
      } catch {}
    }

    let previewPath = [];
    let selectedAssistWord = null;
    let statusOverride = "";
    let assistDirectionOn = false;
    let assistFirstLetterOn = false;
    let assistOpen = false;

    function isFinished() {
      return state.solved || state.revealed;
    }

    function getFoundSet() {
      return new Set(state.foundWords);
    }

    function getFoundPathKeySet() {
      return new Set(state.foundPathKeys);
    }

    function allWordsFound() {
      return state.foundWords.length === normalizedWords.length;
    }

    function isStraightLine(start, end) {
      const dr = end.r - start.r;
      const dc = end.c - start.c;
      return dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
    }

    function getPathBetween(start, end) {
      if (!start || !end) return [];
      if (!isStraightLine(start, end)) return [];

      const dr = end.r - start.r;
      const dc = end.c - start.c;
      const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
      const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      const path = [];

      for (let i = 0; i <= steps; i++) {
        path.push({ r: start.r + stepR * i, c: start.c + stepC * i });
      }

      return path;
    }

    function getWordListScrollTop() {
      const wordListEl = mount.querySelector("#hp-ws-word-list");
      return wordListEl ? wordListEl.scrollTop : 0;
    }

    function restoreWordListScrollTop(scrollTop) {
      const apply = () => {
        const wordListEl = mount.querySelector("#hp-ws-word-list");
        if (wordListEl) wordListEl.scrollTop = scrollTop;
      };

      apply();
      window.requestAnimationFrame(apply);
      window.requestAnimationFrame(() => window.requestAnimationFrame(apply));
      setTimeout(apply, 0);
      setTimeout(apply, 60);
      setTimeout(apply, 180);
      setTimeout(apply, 360);
    }

    function renderPreservingWordListScroll() {
      const previousWordListScrollTop = getWordListScrollTop();
      render();
      restoreWordListScrollTop(previousWordListScrollTop);
    }

    function trySelectPath(path) {
      if (!path.length) return false;

      markStarted();

      const pathKey = canonicalPathKey(path);
      const placement = placementMap.get(pathKey);

      if (!placement) return false;
      if (state.foundWords.includes(placement.word)) return false;

      state.foundWords.push(placement.word);
      state.foundPathKeys.push(pathKey);
      state.anchor = null;
      selectedAssistWord = placement.word;
      statusOverride = `Great job — you found ${placement.word}!`;
      previewPath = [];
      recordPuzzleEvent("word_found", { word: placement.word, wordsFound: state.foundWords.length, totalWords: normalizedWords.length });

      if (allWordsFound()) {
        state.solved = true;
        state.revealed = false;
        state.solvedAt = new Date().toISOString();
        state.overlaySeen = false;
        recordPuzzleEvent("completed", { wordsFound: state.foundWords.length, totalWords: normalizedWords.length, startedAt: state.startedAt, solvedAt: state.solvedAt });
      }

      saveState();
      renderPreservingWordListScroll();

      if (state.solved) showOverlay();
      return true;
    }

    function handleCellClick(r, c) {
      if (isFinished()) return;
      markStarted();

      statusOverride = "";
      const clicked = { r, c };

      if (!state.anchor) {
        state.anchor = clicked;
        previewPath = [];
        saveState();
        renderStatus();
        renderBoardOnly();
        return;
      }

      if (state.anchor.r === r && state.anchor.c === c) {
        state.anchor = null;
        previewPath = [];
        saveState();
        renderStatus();
        renderBoardOnly();
        return;
      }

      const path = getPathBetween(state.anchor, clicked);
      if (!path.length || !trySelectPath(path)) {
        state.anchor = clicked;
        previewPath = [];
        saveState();
        renderStatus();
        renderBoardOnly();
      }
    }

    function clearAnchor() {
      if (isFinished()) return;
      state.anchor = null;
      previewPath = [];
      selectedAssistWord = null;
      statusOverride = "";
      assistOpen = false;
      saveState();
      renderStatus();
      renderBoardOnly();
      renderWordListOnly();
      renderAssistOnly();
    }

    function resetPuzzle() {
      if (!confirm("Reset this word search and clear all progress?")) return;

      state.foundWords = [];
      state.foundPathKeys = [];
      state.revealed = false;
      state.solved = false;
      state.overlaySeen = false;
      state.anchor = null;
      state.startedAt = "";
      state.solvedAt = "";
      state.revealedAt = "";
      previewPath = [];
      selectedAssistWord = null;
      statusOverride = "";
      assistDirectionOn = false;
      assistFirstLetterOn = false;
      assistOpen = false;

      saveState();
      recordPuzzleEvent("reset");
      hideOverlay(false);
      render();
    }

    function revealAnswers() {
      if (isFinished()) return;
      markStarted();

      const ok = confirm("Reveal all answers? This will end the puzzle.");
      if (!ok) return;

      state.foundWords = [...normalizedWords];
      state.foundPathKeys = placements.map(p => p.pathKey);
      state.revealed = true;
      state.solved = false;
      state.solvedAt = "";
      state.revealedAt = new Date().toISOString();
      state.overlaySeen = false;
      state.anchor = null;
      previewPath = [];
      selectedAssistWord = null;
      statusOverride = "";
      assistDirectionOn = false;
      assistFirstLetterOn = false;

      saveState();
      recordPuzzleEvent("revealed", { wordsFound: state.foundWords.length, totalWords: normalizedWords.length, startedAt: state.startedAt, revealedAt: state.revealedAt });
      render();
      showOverlay();
    }

    function formatFoundCount() {
      return `${state.foundWords.length}/${normalizedWords.length}`;
    }

    function progressPercent() {
      return normalizedWords.length ? (state.foundWords.length / normalizedWords.length) * 100 : 0;
    }

    function statusMessage() {
      if (statusOverride) return statusOverride;
      if (state.solved) return "Word search solved! 🎉";
      if (state.revealed) return "Answers revealed.";
      if (state.anchor) return `Start selected: Row ${state.anchor.r + 1}, Col ${state.anchor.c + 1}. Now choose the last letter.`;

      const hasAssist = assistDirectionOn || assistFirstLetterOn;

      if (selectedAssistWord) {
        const parts = [`Selected: ${selectedAssistWord}`];
        const placement = getPlacementForWord(selectedAssistWord);

        if (assistDirectionOn) {
          parts.push(`Direction: ${directionTextForPlacement(placement)}`);
        }

        if (assistFirstLetterOn) {
          parts.push(`Showing every ${selectedAssistLetter()} in the grid.`);
        }

        if (!hasAssist) {
          parts.push("Turn on Assist for help.");
        }

        return parts.join(" • ");
      }

      if (assistDirectionOn && assistFirstLetterOn) {
        return "Word Direction and Show First Letter assists active. Select a word from the list.";
      }

      if (assistDirectionOn) {
        return "Word Direction assist active. Select a word from the list.";
      }

      if (assistFirstLetterOn) {
        return "Show First Letter assist active. Select a word from the list.";
      }

      return "Click the first letter, then click the last letter of a hidden word.";
    }

    function directionTextForPlacement(placement) {
      if (!placement) return "";

      const key = `${placement.dr},${placement.dc}`;
      const labels = {
        "-1,-1": "Up Left ↖",
        "-1,0": "Up ↑",
        "-1,1": "Up Right ↗",
        "0,-1": "Left ←",
        "0,1": "Right →",
        "1,-1": "Down Left ↙",
        "1,0": "Down ↓",
        "1,1": "Down Right ↘"
      };

      return labels[key] || "Unknown";
    }

    function getPlacementForWord(word) {
      const target = cleanWord(word);
      return placements.find(p => p.word === target) || null;
    }

    function selectedAssistLetter() {
      return selectedAssistWord ? selectedAssistWord.charAt(0) : "";
    }

    function renderAssistOnly() {
      const trayEl = mount.querySelector("#hp-ws-assist-tray");
      const toggleBtn = mount.querySelector('[data-a="toggle-assist-modal"]');
      const dirBtn = mount.querySelector('[data-a="assist-direction"]');
      const firstBtn = mount.querySelector('[data-a="assist-first-letter"]');

      if (trayEl) {
        trayEl.classList.toggle("open", assistOpen);
        trayEl.setAttribute("aria-hidden", assistOpen ? "false" : "true");
      }

      if (toggleBtn) {
        toggleBtn.classList.toggle("active", assistOpen || assistDirectionOn || assistFirstLetterOn);
        toggleBtn.setAttribute("aria-expanded", assistOpen ? "true" : "false");
        toggleBtn.setAttribute("aria-label", assistOpen ? "Close assist tools" : "Open assist tools");
      }

      if (dirBtn) {
        dirBtn.classList.toggle("active", assistDirectionOn);
        dirBtn.setAttribute("aria-pressed", assistDirectionOn ? "true" : "false");
      }

      if (firstBtn) {
        firstBtn.classList.toggle("active", assistFirstLetterOn);
        firstBtn.setAttribute("aria-pressed", assistFirstLetterOn ? "true" : "false");
      }

      renderStatus();
    }

    function toggleAssistModal() {
      if (isFinished()) return;
      assistOpen = !assistOpen;
      renderAssistOnly();
    }

    function selectAssistWord(word) {
      const selectedWord = cleanWord(word);
      if (!selectedWord) return;

      // Completed words are intentionally not selectable for Assist.
      // They stay green/checked in the word list and do not trigger hints,
      // direction text, first-letter highlights, or grid-path highlights.
      if (getFoundSet().has(selectedWord)) {
        statusOverride = `${selectedWord} is already found.`;
        selectedAssistWord = null;
        renderAssistOnly();
        renderWordListOnly();
        renderBoardOnly();
        renderStatus();
        return;
      }

      if (isFinished()) return;
      selectedAssistWord = selectedWord;
      statusOverride = "";
      renderAssistOnly();
      renderWordListOnly();
      renderBoardOnly();
      renderStatus();
    }

    function setAssistMode(mode) {
      if (isFinished()) return;

      statusOverride = "";

      if (mode === "direction") {
        assistDirectionOn = !assistDirectionOn;
      }

      if (mode === "first-letter") {
        assistFirstLetterOn = !assistFirstLetterOn;
      }

      renderAssistOnly();
      renderBoardOnly();
      renderStatus();
    }

    function renderStats() {
      const foundValue = mount.querySelector("#hp-ws-found-ratio");
      const remainingValue = mount.querySelector("#hp-ws-remaining");
      const sizeValue = mount.querySelector("#hp-ws-size");
      const progressFill = mount.querySelector("#hp-ws-progress-fill");
      const wordCountValue = mount.querySelector("#hp-ws-word-count");

      if (foundValue) foundValue.textContent = formatFoundCount();
      if (wordCountValue) wordCountValue.textContent = `Words Found: ${state.foundWords.length}/${normalizedWords.length}`;
      if (remainingValue) remainingValue.textContent = String(normalizedWords.length - state.foundWords.length);
      if (sizeValue) sizeValue.textContent = `${rowCount}×${colCount}`;
      if (progressFill) progressFill.style.width = `${progressPercent()}%`;
    }

    function renderStatus() {
      const el = mount.querySelector("#hp-ws-status-msg");
      if (el) el.textContent = statusMessage();
    }

    function getBoardCellClass(r, c) {
      const foundPathSet = getFoundPathKeySet();
      const classes = ["hp-ws-cell"];

      const isAnchor = state.anchor && state.anchor.r === r && state.anchor.c === c;
      if (isAnchor && !isFinished()) classes.push("is-anchor");

      const isPreview = previewPath.some(p => p.r === r && p.c === c);
      if (isPreview && !isFinished()) classes.push("is-preview");

      let foundHere = false;
      let revealedOnlyHere = false;

      placements.forEach(p => {
        const inPath = p.path.some(pos => pos.r === r && pos.c === c);
        if (!inPath) return;

        if (foundPathSet.has(p.pathKey)) {
          if (state.revealed && !state.solved) revealedOnlyHere = true;
          else foundHere = true;
        }
      });

      if (foundHere) classes.push("is-found");
      if (revealedOnlyHere) classes.push("is-revealed");

      if (!isFinished() && assistFirstLetterOn && selectedAssistWord && board[r][c] === selectedAssistLetter()) {
        classes.push("is-assist-letter");
      }

      return classes.join(" ");
    }

    function renderBoardOnly() {
      const boardEl = mount.querySelector("#hp-ws-board");
      if (!boardEl) return;

      boardEl.innerHTML = board.map((row, r) =>
        row.map((letter, c) => `
          <button
            type="button"
            class="${getBoardCellClass(r, c)}"
            data-r="${r}"
            data-c="${c}"
            aria-label="Row ${r + 1}, Column ${c + 1}, Letter ${letter}">
            ${letter}
          </button>
        `).join("")
      ).join("");

      boardEl.style.setProperty("--hp-ws-cols", String(colCount));
      boardEl.style.setProperty("--hp-ws-rows", String(rowCount));
      boardEl.style.setProperty("--hp-ws-mobile-min-width", `${(colCount * 20) + (Math.max(colCount - 1, 0) * 2)}px`);
      boardEl.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`;

      boardEl.querySelectorAll("[data-r][data-c]").forEach(btn => {
        btn.addEventListener("click", () => {
          const r = parseInt(btn.getAttribute("data-r"), 10);
          const c = parseInt(btn.getAttribute("data-c"), 10);
          handleCellClick(r, c);
        });
      });
    }

    function renderWordListOnly() {
      const listEl = mount.querySelector("#hp-ws-word-list");
      if (!listEl) return;

      const foundSet = getFoundSet();

      listEl.innerHTML = normalizedWords
        .slice()
        .sort((a, b) => a.localeCompare(b))
        .map(word => {
          const found = foundSet.has(word);
          const classes = ["hp-ws-word-item"];
          if (found) classes.push(state.revealed && !state.solved ? "is-revealed" : "is-found");
          if (!found && selectedAssistWord === word) classes.push("is-selected-assist");
          const icon = found
            ? (state.revealed && !state.solved
              ? `<span class="hp-ws-word-check material-symbols-outlined" aria-hidden="true">visibility</span>`
              : `<span class="hp-ws-word-check" aria-hidden="true">✓</span>`)
            : "";
          const disabled = found ? ' disabled aria-disabled="true"' : "";
          return `<button type="button" class="${classes.join(" ")}" data-word="${escapeHtml(word)}"${disabled}>${icon}<span class="hp-ws-word-text">${escapeHtml(word)}</span></button>`;
        })
        .join("");

      listEl.querySelectorAll("[data-word]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (btn.disabled || btn.getAttribute("aria-disabled") === "true") return;
          selectAssistWord(btn.getAttribute("data-word"));
        });
      });
    }

    function getOverlayStatsLine(){
      const stats = (typeof window.HareWordSearchGetStats === "function")
        ? window.HareWordSearchGetStats()
        : { streak:0, solved: state.solved ? 1 : 0, revealed: state.revealed ? 1 : 0, inProgress: isFinished() ? 0 : (state.foundWords.length ? 1 : 0), played: state.foundWords.length || isFinished() ? 1 : 0 };
      return `
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">local_fire_department</span><strong>${Number(stats.streak||0).toLocaleString()}</strong> Day Streak</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">trophy</span><strong>${Number(stats.solved||0).toLocaleString()}</strong> Solved</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">visibility</span><strong>${Number(stats.revealed||0).toLocaleString()}</strong> Revealed</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">pending_actions</span><strong>${Number(stats.inProgress||0).toLocaleString()}</strong> In Progress</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">beenhere</span><strong>${Number(stats.played||0).toLocaleString()}</strong> Played</span>`;
    }

    function getNextRecommendation(){
      if (typeof window.HareWordSearchFindNextPuzzle !== "function") return null;
      const nextPuzzle = window.HareWordSearchFindNextPuzzle(puzzleId);
      if (!nextPuzzle || !nextPuzzle.puzzleId) return null;
      const isInProgress = Boolean(nextPuzzle.isInProgress || nextPuzzle.status === "in-progress");
      return { puzzleId:String(nextPuzzle.puzzleId), isInProgress };
    }

    function renderResultMessage(){
      const next = getNextRecommendation();
      if (state.solved) {
        if (next && next.puzzleId) {
          return `<div class="hp-result-message"><p class="hp-result-message-main">Puzzle solved!</p><p class="hp-result-message-sub">${next.isInProgress ? "Pick up where you left off and keep finding hidden words." : "Try another Word Search puzzle and keep building your streak."}</p></div>`;
        }
        return `<div class="hp-result-message"><p class="hp-result-message-main">Puzzle solved!</p><p class="hp-result-message-sub">You're caught up. Check back for the next Word Search puzzle.</p></div>`;
      }
      if (next && next.puzzleId) {
        return `<div class="hp-result-message"><p class="hp-result-message-main">Answers revealed.</p><p class="hp-result-message-sub">${next.isInProgress ? "Pick up where you left off and keep finding hidden words." : "Try another Word Search puzzle and keep building your streak."}</p></div>`;
      }
      return `<div class="hp-result-message"><p class="hp-result-message-main">Answers revealed.</p><p class="hp-result-message-sub">You're caught up. Check back for the next Word Search puzzle.</p></div>`;
    }

    function renderResultActions(){
      const next = getNextRecommendation();
      const buttons = [];
      if (next && next.puzzleId) {
        const verb = next.isInProgress ? "Continue" : "Play";
        buttons.push(`<button class="hp-link-btn primary" data-a="load-puzzle" data-puzzle-id="${escapeHtml(next.puzzleId)}">${verb} Word Search #${escapeHtml(next.puzzleId)}</button>`);
      }
      buttons.push(`<button class="hp-link-btn share" data-a="share">Share This Puzzle</button>`);
      return `<div class="hp-result-actions">${buttons.join("")}</div>`;
    }

    function renderOverlayContent() {
      const overlayIconEl = mount.querySelector("#hp-ws-overlay-icon");
      const overlayStatusEl = mount.querySelector("#hp-ws-overlay-status");
      const overlayTitleEl = mount.querySelector("#hp-ws-overlay-title");
      const badgeMetaEl = mount.querySelector("#hp-ws-badge-meta");
      const overlayTextEl = mount.querySelector("#hp-ws-overlay-text");

      if (!overlayIconEl || !overlayStatusEl || !overlayTitleEl || !badgeMetaEl || !overlayTextEl) return;

      overlayIconEl.textContent = state.solved ? "celebration" : "visibility";
      overlayStatusEl.textContent = state.solved ? "Solved" : "Revealed";
      overlayTitleEl.textContent = puzzleTitle;
      badgeMetaEl.innerHTML = getOverlayStatsLine();
      overlayTextEl.innerHTML = renderResultMessage() + renderResultActions();
    }


    function bindDynamicOverlayActions() {
      const overlayEl = mount.querySelector("#hp-ws-overlay");
      if (!overlayEl) return;

      overlayEl.querySelectorAll('[data-a="load-puzzle"]').forEach(btn => {
        if (btn.dataset.hpBound === "true") return;
        btn.dataset.hpBound = "true";
        btn.addEventListener("click", () => {
          const nextPuzzleId = btn.getAttribute("data-puzzle-id");
          hideOverlay(false);
          if (nextPuzzleId && typeof window.HareWordSearchLoadPuzzle === "function") {
            window.HareWordSearchLoadPuzzle(nextPuzzleId, { scroll:true });
          }
        });
      });
    }

    function showOverlay() {
      renderOverlayContent();
      bindDynamicOverlayActions();

      const overlayEl = mount.querySelector("#hp-ws-overlay");
      if (!overlayEl) return;
      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");
      state.overlaySeen = false;
      saveState();
    }

    function hideOverlay(save = true) {
      const overlayEl = mount.querySelector("#hp-ws-overlay");
      if (!overlayEl) return;

      overlayEl.classList.remove("on");
      overlayEl.setAttribute("aria-hidden", "true");
      state.overlaySeen = true;
      if (save) saveState();
    }

    function showHelpModal() {
      const modalEl = mount.querySelector("#hp-ws-help-modal");
      if (!modalEl) return;

      modalEl.classList.add("on");
      modalEl.setAttribute("aria-hidden", "false");
    }

    function hideHelpModal() {
      const modalEl = mount.querySelector("#hp-ws-help-modal");
      if (!modalEl) return;

      modalEl.classList.remove("on");
      modalEl.setAttribute("aria-hidden", "true");
    }

    function render() {
      mount.innerHTML = `
        ${puzzleDate ? `<div class="hp-puzzle-date">${escapeHtml(puzzleDate)}</div>` : ""}

        <div class="hp-ws-top-panel">
          <div class="hp-ws-panel">
            <div class="hp-ws-stats">
              <div class="hp-ws-stat">
                <span class="hp-ws-stat-value" id="hp-ws-found-ratio">0/0</span>
                <span class="hp-ws-stat-label">Words Found</span>
              </div>

              <div class="hp-ws-stat">
                <span class="hp-ws-stat-value" id="hp-ws-remaining">0</span>
                <span class="hp-ws-stat-label">Words Left</span>
              </div>

              <div class="hp-ws-stat">
                <span class="hp-ws-stat-value" id="hp-ws-size">0×0</span>
                <span class="hp-ws-stat-label">Grid Size</span>
              </div>
            </div>

            <div class="hp-ws-progress">
              <div class="hp-ws-progress-fill" id="hp-ws-progress-fill"></div>
            </div>
          </div>
        </div>

        <div class="hp-ws-layout">
          <div class="hp-ws-col-left">
            <div class="hp-ws-panel">
              ${puzzleTheme ? `<h3 class="hp-ws-theme-title">${escapeHtml(puzzleTheme)}</h3>` : ""}
              <div class="hp-ws-status">
                <span class="hp-ws-status-msg" id="hp-ws-status-msg">Loading puzzle...</span>
              </div>

              <div class="hp-ws-board-wrap">
                <div class="hp-ws-board" id="hp-ws-board" role="grid" aria-label="Word search board"></div>
              </div>

              <div class="hp-puzzle-mobile-tools" aria-label="Word Search puzzle controls">
                <button type="button" class="hp-tool-btn danger" data-a="reset-puzzle">Start Over</button>
                <button type="button" class="hp-tool-btn reveal" data-a="reveal-answers">Reveal Answers</button>
              </div>

              <div class="hp-ws-actions">
                <button type="button" class="hp-ws-btn danger" id="hp-ws-reset">Start Over</button>
                <button type="button" class="hp-ws-btn reveal" id="hp-ws-reveal">Reveal Answers</button>
              </div>
            </div>
          </div>

          <div class="hp-ws-col-right">
            <div class="hp-ws-panel">
              <div class="hp-puzzle-tools" aria-label="Word Search assist controls">
                <button type="button" class="hp-tool-btn assist-toggle" data-a="toggle-assist-modal" aria-expanded="false" aria-controls="hp-ws-assist-tray">
                  <span class="material-symbols-outlined" aria-hidden="true">tips_and_updates</span>
                  <span>Assist</span>
                </button>
                <div class="hp-ws-assist-tray" id="hp-ws-assist-tray" aria-hidden="true">
                  <div class="hp-ws-assist-options" aria-label="Assist options">
                    <button type="button" class="hp-ws-assist-option" data-a="assist-direction" aria-pressed="false">Word Direction</button>
                    <button type="button" class="hp-ws-assist-option" data-a="assist-first-letter" aria-pressed="false">Show First Letter</button>
                  </div>
                  <p class="hp-ws-assist-instruction">Select assistance type, then select word.</p>
                </div>
              </div>

              <div class="hp-ws-words-header">
                <h3>Word List</h3>
                <span class="hp-ws-word-count" id="hp-ws-word-count">Words Found: 0/0</span>
              </div>
              <div class="hp-ws-word-list" id="hp-ws-word-list"></div>
            </div>
          </div>
        </div>

        <div class="hp-overlay" id="hp-ws-overlay" aria-hidden="true">
          <div class="hp-result-modal" role="dialog" aria-modal="true" aria-label="Word Search result">
            <button type="button" class="hp-result-close" data-a="close-overlay" aria-label="Close result card"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
            <span id="hp-ws-overlay-icon" class="material-symbols-outlined hp-result-icon" aria-hidden="true">visibility</span>
            <div id="hp-ws-overlay-status" class="hp-result-status">Revealed</div>
            <h3 id="hp-ws-overlay-title" class="hp-result-title">Word Search Puzzle</h3>
            <div class="hp-result-stats-line" id="hp-ws-badge-meta"></div>
            <div id="hp-ws-overlay-text"></div>
          </div>
        </div>

        <div class="hp-overlay hp-ws-help-modal" id="hp-ws-help-modal" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Word Search">
            <h3>Help</h3>

            <div class="hp-help-modal-content">
              <span class="hp-help-line">Click the <strong>first letter</strong> of a hidden word, then click the <strong>last letter</strong>.</span>
              <span class="hp-help-line">Words may run <strong>horizontally</strong>, <strong>vertically</strong>, or <strong>diagonally</strong>.</span>
              <span class="hp-help-line">Words may also appear <strong>backward</strong>.</span>
              <span class="hp-help-line"><strong>Assist</strong> can show a selected word’s direction or highlight every matching first letter in the grid.</span>
              <span class="hp-help-line"><strong>Start Over</strong> clears your progress and restarts the puzzle.</span>
            </div>

            <div class="hp-modal-actions">
              <button class="hp-link-btn neutral full" data-a="close-help-modal">Back to Puzzle</button>
            </div>

            <small>Hare Publishing • Word Search</small>
          </div>
        </div>
      `;

      renderStats();
      renderStatus();
      renderBoardOnly();
      renderWordListOnly();
      renderAssistOnly();
      bindEvents();

      if (state.solved || state.revealed) showOverlay();
    }

    function bindEvents() {
      const resetBtn = mount.querySelector("#hp-ws-reset");
      const revealBtn = mount.querySelector("#hp-ws-reveal");
      const overlayEl = mount.querySelector("#hp-ws-overlay");

      if (resetBtn) resetBtn.addEventListener("click", resetPuzzle);
      if (revealBtn) revealBtn.addEventListener("click", revealAnswers);

      mount.querySelectorAll("[data-a]").forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.getAttribute("data-a");

          if (action === "close-overlay") {
            hideOverlay();
            return;
          }

          if (action === "reset-puzzle") {
            resetPuzzle();
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

          if (action === "clear-selection") {
            clearAnchor();
            return;
          }

          if (action === "toggle-assist-modal") {
            toggleAssistModal();
            return;
          }

          if (action === "assist-direction") {
            setAssistMode("direction");
            return;
          }

          if (action === "assist-first-letter") {
            setAssistMode("first-letter");
            return;
          }

          if (action === "reveal-answers") {
            revealAnswers();
            return;
          }

          if (action === "load-puzzle") {
            const nextId = btn.getAttribute("data-puzzle-id");
            hideOverlay();
            if (nextId && typeof window.HareWordSearchLoadPuzzle === "function") {
              window.HareWordSearchLoadPuzzle(nextId, { scroll: true });
            }
            return;
          }

          if (action === "load-puzzle") {
            const nextPuzzleId = btn.getAttribute("data-puzzle-id");
            hideOverlay(false);
            if (nextPuzzleId && typeof window.HareWordSearchLoadPuzzle === "function") {
              window.HareWordSearchLoadPuzzle(nextPuzzleId, { scroll:true });
            }
            return;
          }

          if (action === "share") {
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
            } else {
              try {
                navigator.clipboard.writeText(window.location.href);
                const statusEl = mount.querySelector("#hp-ws-status-msg");
                if (statusEl) statusEl.textContent = "Link copied! 📋";
              } catch {
                const statusEl = mount.querySelector("#hp-ws-status-msg");
                if (statusEl) statusEl.textContent = "Copy the link from your address bar 🙂";
              }
            }
          }
        });
      });

      if (overlayEl) {
        overlayEl.addEventListener("click", e => {
          if (e.target === overlayEl) hideOverlay();
        });
      }

      const helpModalEl = mount.querySelector("#hp-ws-help-modal");
      if (helpModalEl) {
        helpModalEl.addEventListener("click", e => {
          if (e.target === helpModalEl) hideHelpModal();
        });
      }
    }

    container.addEventListener("keydown", e => {
      const overlayEl = mount.querySelector("#hp-ws-overlay");
      if (overlayEl && overlayEl.classList.contains("on")) {
        if (e.key === "Escape") hideOverlay();
        return;
      }

      const helpModalEl = mount.querySelector("#hp-ws-help-modal");
      if (helpModalEl && helpModalEl.classList.contains("on")) {
        if (e.key === "Escape") hideHelpModal();
        return;
      }

      if (e.key === "Escape") {
        if (assistOpen) {
          assistOpen = false;
          renderAssistOnly();
          return;
        }
        clearAnchor();
      }
    });

    if (state.solved && state.foundWords.length !== normalizedWords.length) {
      state.foundWords = [...normalizedWords];
      state.foundPathKeys = placements.map(p => p.pathKey);
      saveState();
    }

    if (state.revealed && state.foundWords.length !== normalizedWords.length) {
      state.foundWords = [...normalizedWords];
      state.foundPathKeys = placements.map(p => p.pathKey);
      saveState();
    }

    recordPuzzleEvent("loaded", { wordsFound: state.foundWords.length, totalWords: normalizedWords.length });
    render();
  }
};

window.HareWordSearchPlatformEngine = window.HareWordSearchEngine;
window.HareWordSearchPlatformEngine.openHelp = function(containerId){
  const container = document.getElementById(containerId || "hp-wordsearch-container");
  const modal = container && container.querySelector("#hp-ws-help-modal");
  if (modal) {
    modal.classList.add("on");
    modal.setAttribute("aria-hidden", "false");
  }
};

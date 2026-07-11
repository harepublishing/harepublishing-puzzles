/* =========================================================
   HARE PUBLISHING PUZZLE PLATFORM ANALYTICS
   Version: 1.0

   Analytics-only listener for the current platform puzzle pages.
   - Does not load or mount puzzle engines
   - Tracks loaded, started, solved, and revealed events
   - Sends rows matching the Google Apps Script Events sheet
   ========================================================= */

(function () {
  "use strict";

  const VERSION = "hare-puzzle-platform-analytics-v1.0";
  const ENDPOINT = window.HARE_PUZZLE_ANALYTICS_ENDPOINT || "";
  const SUPPRESSED_HOSTS = ["cone-dinosaur-dht5.squarespace.com"];

  function hostIsSuppressed(value) {
    const host = String(value || "").toLowerCase();
    return SUPPRESSED_HOSTS.some(blocked => host === blocked || host.endsWith(`.${blocked}`));
  }

  function urlIsSuppressed(value) {
    const raw = String(value || "").trim();
    if (!raw) return false;
    try {
      return hostIsSuppressed(new URL(raw, window.location.origin).hostname);
    } catch {
      return raw.toLowerCase().includes("cone-dinosaur-dht5.squarespace.com");
    }
  }

  function analyticsSuppressedForPage() {
    if (window.HARE_PUZZLE_ANALYTICS_DISABLED === true) return true;
    if (urlIsSuppressed(window.location.href) || urlIsSuppressed(document.referrer)) return true;

    try {
      const origins = Array.from(window.location.ancestorOrigins || []);
      if (origins.some(urlIsSuppressed)) return true;
    } catch {}

    try {
      if (window.parent && window.parent !== window && urlIsSuppressed(window.parent.location.href)) return true;
    } catch {}

    try {
      if (window.top && window.top !== window && urlIsSuppressed(window.top.location.href)) return true;
    } catch {}

    return false;
  }

  if (analyticsSuppressedForPage()) {
    window.HarePuzzleAnalytics = window.HarePuzzleAnalytics || {
      version: VERSION,
      disabled: true,
      track() {},
      recordEvent() {},
      trackEvent() {},
      logEvent() {},
      recordPuzzleEvent() {},
      trackPuzzleEvent() {}
    };
    return;
  }

  const PUZZLES = [
    {
      puzzleType: "word-scramble",
      aliases: ["word-scramble", "wordscramble"],
      dataGlobals: ["HareWordScrambleData"],
      containers: ["hp-wordscramble-container"],
      storagePrefix: "hp2_wsc_",
      total(data) { return arrayLen(data.words) || arrayLen(data.entries) || arrayLen(data.items); },
      completed(state) { return uniqueCount(state.solvedWords) + uniqueCount(state.revealedWords); },
      hints(state) { return boolCount(state.showHint1) + boolCount(state.showHint2) + number(state.hintsUsed); }
    },
    {
      puzzleType: "word-search",
      aliases: ["word-search"],
      dataGlobals: ["HareWordSearchData"],
      containers: ["hp-wordsearch-container"],
      storagePrefix: "hp2_ws_",
      total(data) { return arrayLen(data.words); },
      completed(state) { return uniqueCount(state.foundWords); }
    },
    {
      puzzleType: "kriss-kross",
      aliases: ["kriss-kross"],
      dataGlobals: ["HareKrissKrossData"],
      containers: ["hp-krisskross-container"],
      storagePrefix: "hp2_kx_",
      total(data) { return arrayLen(data.placements) || arrayLen(data.words); },
      completed(state) { return uniqueCount(state.placedWords) || uniqueCount(state.completedWords); }
    },
    {
      puzzleType: "cryptogram",
      aliases: ["cryptogram"],
      dataGlobals: ["HareCryptogramData"],
      containers: ["hp-cryptogram-container"],
      storagePrefix: "hp2_cg_",
      total(data) { return uniqueLetters(data.ciphertext || data.quote || data.text).size; },
      completed(state) { return state.solved || state.revealed ? 100 : Object.keys(state.mappings || {}).filter(key => state.mappings[key]).length; },
      hints(state) { return uniqueCount(state.revealedLetters); }
    },
    {
      puzzleType: "wordflower",
      aliases: ["wordflower", "word-flower"],
      dataGlobals: ["HareWordFlowerData"],
      containers: ["hp-wordflower-container"],
      storagePrefix: "hp2_wf_",
      total(data) { return arrayLen(data.allowedWords); },
      completed(state) { return uniqueCount(state.found) + uniqueCount(state.revealedWords); },
      hints(state) { return number(state.hintsUsed); }
    },
    {
      puzzleType: "wordrow",
      aliases: ["wordrow"],
      dataGlobals: ["HareWordrowData"],
      containers: ["hp-wordrow-container"],
      storagePrefix: "hp2_wr_",
      total() { return 6; },
      completed(state) { return arrayLen(state.guesses); }
    },
    {
      puzzleType: "sudoku-challenge",
      aliases: ["sudoku-challenge"],
      dataGlobals: ["HareSudokuChallengeData", "HareSudokuData"],
      containers: ["hp-sudoku-container"],
      storagePrefixes: ["hp2_sdc_"],
      matchesPage() {
        return Boolean(window.HareSudokuChallengeData) || /sudoku-challenge/i.test(window.location.pathname || "");
      },
      total() { return 81; },
      completed(state) { return countSudokuFilledCells(state); },
      elapsed(state) { return Math.round(number(state.elapsed) / 1000); }
    },
    {
      puzzleType: "sudoku",
      aliases: ["sudoku"],
      dataGlobals: ["HareSudokuData"],
      containers: ["hp-sudoku-container"],
      storagePrefixes: ["hp2_sd_easy_", "hp2_sd_medium_", "hp2_sd_hard_"],
      total() { return 81; },
      completed(state) { return countSudokuFilledCells(state); },
      elapsed(state) { return Math.round(number(state.elapsed) / 1000); }
    },
    {
      puzzleType: "knights-knaves",
      aliases: ["knights-knaves"],
      dataGlobals: ["HareKnightsKnavesData"],
      containers: ["hp-knights-container"],
      storagePrefixes: ["hp2_knk_easy_", "hp2_knk_medium_", "hp2_knk_hard_"],
      total(data, state, detail) {
        const mode = String(detail.mode || data.defaultMode || "easy").toLowerCase();
        return arrayLen(data[mode]?.people);
      },
      completed(state) { return Object.keys(state.answers || {}).length; }
    }
  ];

  const loadedKeys = new Set();
  const startedKeys = new Set();
  const terminalKeys = new Set();
  const progressMilestones = new Map();

  function arrayLen(value) {
    return Array.isArray(value) ? value.length : 0;
  }

  function boolCount(value) {
    return value ? 1 : 0;
  }

  function number(value) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function uniqueCount(value) {
    return Array.isArray(value) ? new Set(value.filter(Boolean).map(String)).size : 0;
  }

  function uniqueLetters(value) {
    return new Set(String(value || "").toUpperCase().replace(/[^A-Z]/g, "").split(""));
  }

  function countSudokuFilledCells(state = {}) {
    const cells = Array.isArray(state.cells) ? state.cells : [];
    return cells.filter(cell => {
      if (!cell || typeof cell !== "object") return false;
      return String(cell.value || "").trim() !== "";
    }).length;
  }

  function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(number(value))));
  }

  function getAnonymousId() {
    const key = "hp_puzzle_analytics_id";
    try {
      let id = localStorage.getItem(key);
      if (!id) {
        const cryptoObj = window.crypto || window.msCrypto;
        id = cryptoObj && cryptoObj.randomUUID
          ? cryptoObj.randomUUID()
          : `hp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(key, id);
      }
      return id;
    } catch {
      return "";
    }
  }

  function getDeviceType() {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    if (width && width < 768) return "mobile";
    if (width && width < 1024) return "tablet";
    return "desktop";
  }

  function pageUrlWithPuzzleId(pageUrl, puzzleId) {
    const id = String(puzzleId || "").trim();
    const raw = String(pageUrl || window.location.href || "");
    if (!id) return raw;

    try {
      const url = new URL(raw, window.location.origin);
      if (!url.searchParams.get("puzzle")) url.searchParams.set("puzzle", id);
      return url.href;
    } catch {
      return raw;
    }
  }

  function normalizeType(value) {
    const raw = String(value || "").toLowerCase();
    const match = PUZZLES.find(item => item.aliases.includes(raw));
    return match ? match.puzzleType : raw;
  }

  function getPuzzleDef(type) {
    const normalized = normalizeType(type);
    return PUZZLES.find(item => item.puzzleType === normalized || item.aliases.includes(normalized)) || null;
  }

  function getData(def) {
    if (!def) return {};
    for (const globalName of def.dataGlobals || []) {
      const data = window[globalName];
      if (data && typeof data === "object") return data;
    }
    return {};
  }

  function inferPuzzleDefFromPage() {
    return PUZZLES.find(def => {
      if (typeof def.matchesPage === "function" && !def.matchesPage()) return false;
      const hasData = (def.dataGlobals || []).some(name => window[name]);
      const hasContainer = (def.containers || []).some(id => document.getElementById(id));
      return hasData && hasContainer;
    }) || null;
  }

  function readSavedState(def, puzzleId, detail = {}) {
    if (detail.state && typeof detail.state === "object") return detail.state;

    const keys = [];
    if (detail.storageKey) keys.push(String(detail.storageKey));
    if (def?.storagePrefix && puzzleId) keys.push(`${def.storagePrefix}${puzzleId}`);
    (def?.storagePrefixes || []).forEach(prefix => {
      if (puzzleId) keys.push(`${prefix}${puzzleId}`);
    });

    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch {}
    }

    return {};
  }

  function isSolved(state, detail = {}) {
    return Boolean(
      detail.status === "solved" ||
      detail.puzzleStatus === "solved" ||
      detail.action === "solved" ||
      state.solved ||
      state.completed ||
      state.masterGardener ||
      state.status === "solved" ||
      state.status === "complete" ||
      state.solvedAt ||
      state.completedAt ||
      state.masterGardenerAt
    );
  }

  function isRevealed(state, detail = {}) {
    return Boolean(
      detail.status === "revealed" ||
      detail.puzzleStatus === "revealed" ||
      detail.action === "revealed" ||
      state.revealed ||
      state.revealAllUsed ||
      state.status === "revealed" ||
      state.revealedAt
    );
  }

  function progressPercent(def, data, state, detail) {
    if (isSolved(state, detail) || isRevealed(state, detail)) return 100;
    const total = typeof def.total === "function" ? number(def.total(data, state, detail)) : 0;
    const completed = typeof def.completed === "function" ? number(def.completed(state, data, detail)) : 0;
    if (!total) return 0;
    return clampPercent((completed / total) * 100);
  }

  function eventKey(payload) {
    return [
      payload.eventType,
      payload.puzzleType,
      payload.puzzleId,
      payload.status,
      payload.progressPercent,
      payload.pageUrl
    ].join("|");
  }

  function shouldSend(payload) {
    const baseKey = `${payload.puzzleType}|${payload.puzzleId}|${payload.pageUrl}`;

    if (payload.eventType === "loaded") {
      if (loadedKeys.has(baseKey)) return false;
      loadedKeys.add(baseKey);
      return true;
    }

    if (payload.eventType === "started") {
      if (startedKeys.has(baseKey)) return false;
      startedKeys.add(baseKey);
      return true;
    }

    if (payload.eventType === "solved" || payload.eventType === "revealed") {
      const terminalKey = `${baseKey}|${payload.eventType}`;
      if (terminalKeys.has(terminalKey)) return false;
      terminalKeys.add(terminalKey);
      return true;
    }

    if (payload.eventType === "progress") {
      const milestone = Math.floor(number(payload.progressPercent) / 25) * 25;
      if (!milestone || milestone >= 100) return false;
      const previous = progressMilestones.get(baseKey) || 0;
      if (milestone <= previous) return false;
      progressMilestones.set(baseKey, milestone);
      payload.progressPercent = milestone;
      return true;
    }

    return true;
  }

  function send(payload) {
    if (!ENDPOINT) return;

    const body = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
        if (navigator.sendBeacon(ENDPOINT, blob)) return;
      }
    } catch {}

    try {
      fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body
      }).catch(() => {});
    } catch {}
  }

  function track(raw = {}) {
    const type = normalizeType(raw.puzzleType);
    const def = getPuzzleDef(type);
    const data = { ...getData(def), ...(raw.dataObject || {}) };
    const puzzleId = String(raw.puzzleId || data.puzzleId || "");
    const puzzleDate = String(raw.puzzleDate || data.puzzleDate || data.date || "");
    const state = raw.state || {};

    const payload = {
      eventType: String(raw.eventType || raw.eventName || raw.event || "event"),
      puzzleType: type,
      puzzleId,
      puzzleDate,
      status: String(raw.status || ""),
      elapsedSeconds: number(raw.elapsedSeconds ?? raw.elapsed ?? (def?.elapsed ? def.elapsed(state) : state.elapsedSeconds || state.timeElapsed)),
      progressPercent: clampPercent(raw.progressPercent ?? 0),
      hintsUsed: number(raw.hintsUsed ?? (def?.hints ? def.hints(state, data, raw) : state.hintsUsed)),
      revealed: Boolean(raw.revealed),
      solved: Boolean(raw.solved),
      pageUrl: pageUrlWithPuzzleId(raw.pageUrl || window.location.href, puzzleId),
      deviceType: String(raw.deviceType || getDeviceType()),
      anonymousId: String(raw.anonymousId || getAnonymousId()),
      engineVersion: String(raw.engineVersion || VERSION)
    };

    if (!payload.puzzleType || !payload.puzzleId) return;
    if (!payload.status) payload.status = payload.eventType;

    if (!shouldSend(payload)) return;
    send(payload);
  }

  function trackLoaded(def) {
    if (!def) return;
    const data = getData(def);
    if (!data || !data.puzzleId) return;

    track({
      eventType: "loaded",
      puzzleType: def.puzzleType,
      puzzleId: data.puzzleId,
      puzzleDate: data.puzzleDate || data.date || "",
      status: "loaded",
      progressPercent: 0
    });
  }

  function handleStateChange(event) {
    const detail = event?.detail || {};
    const def = getPuzzleDef(detail.puzzleType) || inferPuzzleDefFromPage();
    if (!def) return;

    const data = getData(def);
    const puzzleId = String(detail.puzzleId || data.puzzleId || "");
    if (!puzzleId) return;

    const state = readSavedState(def, puzzleId, detail);
    const solved = isSolved(state, detail);
    const revealed = !solved && isRevealed(state, detail);
    const percent = progressPercent(def, data, state, detail);
    const hasStarted = Boolean(state.startedAt || state.lastPlayedAt || state.updatedAt || percent > 0 || detail.status || detail.action);
    const status = solved ? "solved" : revealed ? "revealed" : percent > 0 ? "in-progress" : "started";
    let eventType = "progress";

    if (solved) eventType = "solved";
    else if (revealed) eventType = "revealed";
    else if (hasStarted) eventType = "started";

    track({
      eventType,
      puzzleType: def.puzzleType,
      puzzleId,
      puzzleDate: data.puzzleDate || data.date || "",
      status,
      progressPercent: percent,
      elapsedSeconds: def.elapsed ? def.elapsed(state, data, detail) : state.elapsedSeconds || state.timeElapsed || state.elapsed,
      hintsUsed: def.hints ? def.hints(state, data, detail) : state.hintsUsed,
      revealed,
      solved,
      state
    });

    if (!solved && !revealed && percent >= 25) {
      track({
        eventType: "progress",
        puzzleType: def.puzzleType,
        puzzleId,
        puzzleDate: data.puzzleDate || data.date || "",
        status: "in-progress",
        progressPercent: percent,
        elapsedSeconds: def.elapsed ? def.elapsed(state, data, detail) : state.elapsedSeconds || state.timeElapsed || state.elapsed,
        hintsUsed: def.hints ? def.hints(state, data, detail) : state.hintsUsed,
        state
      });
    }
  }

  function detectLoaded(attempt = 1) {
    const def = inferPuzzleDefFromPage();
    if (def) trackLoaded(def);
    if (!def && attempt < 40) {
      window.setTimeout(() => detectLoaded(attempt + 1), 250);
    }
  }

  window.HarePuzzleAnalytics = {
    version: VERSION,
    track,
    recordEvent: track,
    trackEvent: track,
    logEvent: track,
    recordPuzzleEvent: track,
    trackPuzzleEvent: track
  };

  window.addEventListener("hare:puzzle-state-change", handleStateChange);
  window.addEventListener("hare:puzzle-event", event => {
    const detail = event?.detail || {};
    track({
      eventType: detail.eventType || detail.eventName || detail.event || "event",
      puzzleType: detail.puzzleType,
      puzzleId: detail.puzzleId,
      puzzleDate: detail.puzzleDate,
      status: detail.status || detail.eventName || detail.event || "event",
      progressPercent: detail.progressPercent,
      hintsUsed: detail.hintsUsed,
      elapsedSeconds: detail.elapsedSeconds,
      revealed: detail.revealed,
      solved: detail.solved
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => detectLoaded(), { once: true });
  } else {
    detectLoaded();
  }
})();

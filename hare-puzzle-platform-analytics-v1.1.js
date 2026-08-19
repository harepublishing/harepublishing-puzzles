/* =========================================================
   HARE PUBLISHING PUZZLE PLATFORM ANALYTICS
   Version: 1.1

   Analytics-only listener for the current platform puzzle pages.
   - Does not load or mount puzzle engines
   - Preserves anonymous IDs created by the original tracker
   - Tracks in-page puzzle changes as new loaded events
   - Adds event/session/source fields for funnel reporting
   - Deduplicates immediate repeats and terminal events
   - Sends rows matching Google Apps Script collector v2.0
   ========================================================= */

(function () {
  "use strict";

  const VERSION = "hare-puzzle-platform-analytics-v1.1";
  const ENDPOINT = window.HARE_PUZZLE_ANALYTICS_ENDPOINT || "";
  const SUPPRESSED_HOSTS = ["cone-dinosaur-dht5.squarespace.com"];
  const ANONYMOUS_ID_KEY = "hp_puzzle_analytics_id";
  const LEGACY_ANONYMOUS_ID_KEY = "hp_anonymous_player_id";
  const SESSION_ID_KEY = "hp_puzzle_analytics_session_id";
  const SESSION_DEDUPE_KEY = "hp_puzzle_analytics_session_dedupe_v1";
  const TERMINAL_DEDUPE_KEY = "hp_puzzle_analytics_terminal_dedupe_v1";
  const FAILED_QUEUE_KEY = "hp_puzzle_analytics_failed_queue_v1";
  const MAX_STORED_KEYS = 1000;
  const persistentStorage = safeStorage("localStorage");
  const visitStorage = safeStorage("sessionStorage");

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
      aliases: ["word-scramble", "wordscramble", "word_scramble"],
      dataGlobals: ["HareWordScrambleData"],
      containers: ["hp-wordscramble-container"],
      storagePrefix: "hp2_wsc_",
      total(data) { return arrayLen(data.words) || arrayLen(data.entries) || arrayLen(data.items); },
      completed(state) { return uniqueCount(state.solvedWords) + uniqueCount(state.revealedWords); },
      hints(state) { return boolCount(state.showHint1) + boolCount(state.showHint2) + number(state.hintsUsed); }
    },
    {
      puzzleType: "word-search",
      aliases: ["word-search", "wordsearch", "word_search"],
      dataGlobals: ["HareWordSearchData"],
      containers: ["hp-wordsearch-container"],
      storagePrefix: "hp2_ws_",
      total(data) { return arrayLen(data.words); },
      completed(state) { return uniqueCount(state.foundWords); }
    },
    {
      puzzleType: "kriss-kross",
      aliases: ["kriss-kross", "krisskross", "kriss_kross"],
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
      aliases: ["wordflower", "word-flower", "word_flower"],
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
      aliases: ["sudoku-challenge", "daily-sudoku-challenge", "sudoku_challenge"],
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
      aliases: ["sudoku", "regular-sudoku"],
      dataGlobals: ["HareSudokuData"],
      containers: ["hp-sudoku-container"],
      storagePrefixes: ["hp2_sd_easy_", "hp2_sd_medium_", "hp2_sd_hard_"],
      total() { return 81; },
      completed(state) { return countSudokuFilledCells(state); },
      elapsed(state) { return Math.round(number(state.elapsed) / 1000); }
    },
    {
      puzzleType: "knights-knaves",
      aliases: ["knights-knaves", "knights-and-knaves", "knights_knaves"],
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

  const recentEventTimes = new Map();
  let sessionDedupe = readStoredObject(visitStorage, SESSION_DEDUPE_KEY);
  let terminalDedupe = readStoredObject(persistentStorage, TERMINAL_DEDUPE_KEY);
  let detectTimer = 0;
  let lastDetectedPuzzleKey = "";

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

  function safeStorage(name) {
    try {
      const storage = window[name];
      const testKey = "__hp_analytics_storage_test__";
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return storage;
    } catch {
      const memory = {};
      return {
        getItem(key) { return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null; },
        setItem(key, value) { memory[key] = String(value); },
        removeItem(key) { delete memory[key]; }
      };
    }
  }

  function readStoredObject(storage, key) {
    try {
      const value = JSON.parse(storage.getItem(key) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function writeStoredObject(storage, key, value) {
    try {
      const entries = Object.entries(value || {});
      const limited = entries.length > MAX_STORED_KEYS
        ? Object.fromEntries(entries.slice(entries.length - MAX_STORED_KEYS))
        : value;
      storage.setItem(key, JSON.stringify(limited || {}));
    } catch {}
  }

  function createId(prefix = "") {
    const cryptoObj = window.crypto || window.msCrypto;
    const value = cryptoObj && typeof cryptoObj.randomUUID === "function"
      ? cryptoObj.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    return `${prefix}${value}`;
  }

  function getAnonymousId() {
    try {
      let id = persistentStorage.getItem(ANONYMOUS_ID_KEY);
      if (!id) {
        id = persistentStorage.getItem(LEGACY_ANONYMOUS_ID_KEY) || createId("hp-");
        persistentStorage.setItem(ANONYMOUS_ID_KEY, id);
      }
      return id;
    } catch {
      if (!window.__harePuzzleAnonymousId) window.__harePuzzleAnonymousId = createId("session-");
      return window.__harePuzzleAnonymousId;
    }
  }

  function getSessionId() {
    try {
      let id = visitStorage.getItem(SESSION_ID_KEY);
      if (!id) {
        id = createId("session-");
        visitStorage.setItem(SESSION_ID_KEY, id);
      }
      return id;
    } catch {
      if (!window.__harePuzzleSessionId) window.__harePuzzleSessionId = createId("session-");
      return window.__harePuzzleSessionId;
    }
  }

  function getCampaignData() {
    try {
      const url = new URL(window.location.href);
      return {
        pagePath: `${url.pathname}${url.search}`,
        utmSource: url.searchParams.get("utm_source") || "",
        utmMedium: url.searchParams.get("utm_medium") || "",
        utmCampaign: url.searchParams.get("utm_campaign") || "",
        isTest: url.searchParams.get("hp_analytics_test") === "1"
      };
    } catch {
      return { pagePath: "", utmSource: "", utmMedium: "", utmCampaign: "", isTest: false };
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
    const raw = String(value || "").trim().toLowerCase();
    const match = PUZZLES.find(item => item.aliases.includes(raw));
    return match ? match.puzzleType : raw;
  }

  function normalizeEventType(value) {
    const raw = String(value || "event").trim().toLowerCase().replace(/\s+/g, "_");
    const aliases = {
      puzzle_loaded: "loaded",
      puzzle_started: "started",
      puzzle_solved: "solved",
      puzzle_revealed: "revealed",
      completed: "solved"
    };
    return aliases[raw] || raw;
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
      payload.mode,
      payload.interactionKey,
      payload.status,
      payload.progressPercent,
      payload.pageUrl
    ].join("|");
  }

  function shouldSend(payload) {
    const now = Date.now();
    const immediateKey = eventKey(payload);
    const recentAt = recentEventTimes.get(immediateKey) || 0;
    if (now - recentAt < 2000) return false;
    recentEventTimes.set(immediateKey, now);
    if (recentEventTimes.size > 250) {
      for (const [key, timestamp] of recentEventTimes) {
        if (now - timestamp > 10000) recentEventTimes.delete(key);
      }
    }

    const baseKey = `${payload.puzzleType}|${payload.puzzleId}|${payload.mode || "default"}`;

    if (payload.eventType === "loaded") {
      const key = `loaded|${baseKey}`;
      if (sessionDedupe[key]) return false;
      sessionDedupe[key] = now;
      writeStoredObject(visitStorage, SESSION_DEDUPE_KEY, sessionDedupe);
      return true;
    }

    if (payload.eventType === "started") {
      const key = `started|${baseKey}`;
      if (sessionDedupe[key]) return false;
      sessionDedupe[key] = now;
      writeStoredObject(visitStorage, SESSION_DEDUPE_KEY, sessionDedupe);
      return true;
    }

    if (payload.eventType === "solved" || payload.eventType === "revealed") {
      const terminalKey = `${payload.eventType}|${baseKey}`;
      if (terminalDedupe[terminalKey]) return false;
      terminalDedupe[terminalKey] = now;
      writeStoredObject(persistentStorage, TERMINAL_DEDUPE_KEY, terminalDedupe);
      return true;
    }

    if (payload.eventType === "progress") {
      const milestone = Math.floor(number(payload.progressPercent) / 25) * 25;
      if (!milestone || milestone >= 100) return false;
      const progressKey = `progress|${baseKey}`;
      const previous = number(sessionDedupe[progressKey]);
      if (milestone <= previous) return false;
      sessionDedupe[progressKey] = milestone;
      writeStoredObject(visitStorage, SESSION_DEDUPE_KEY, sessionDedupe);
      payload.progressPercent = milestone;
      return true;
    }

    if (payload.eventType === "reset") {
      delete terminalDedupe[`solved|${baseKey}`];
      delete terminalDedupe[`revealed|${baseKey}`];
      writeStoredObject(persistentStorage, TERMINAL_DEDUPE_KEY, terminalDedupe);
    }

    return true;
  }

  function readFailedQueue() {
    try {
      const value = JSON.parse(persistentStorage.getItem(FAILED_QUEUE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function writeFailedQueue(queue) {
    try {
      persistentStorage.setItem(FAILED_QUEUE_KEY, JSON.stringify((queue || []).slice(-100)));
    } catch {}
  }

  function enqueueFailed(payload) {
    const queue = readFailedQueue();
    if (!queue.some(item => item.eventId === payload.eventId)) queue.push(payload);
    writeFailedQueue(queue);
  }

  function send(payload, options = {}) {
    if (!ENDPOINT) return Promise.resolve(false);
    const body = JSON.stringify(payload);

    if (!options.skipBeacon) {
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
          if (navigator.sendBeacon(ENDPOINT, blob)) return Promise.resolve(true);
        }
      } catch {}
    }

    try {
      return fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body
      }).then(() => true).catch(() => {
        if (!options.fromQueue) enqueueFailed(payload);
        return false;
      });
    } catch {
      if (!options.fromQueue) enqueueFailed(payload);
      return Promise.resolve(false);
    }
  }

  async function flushFailedQueue() {
    if (!ENDPOINT || !navigator.onLine) return;
    const queue = readFailedQueue();
    if (!queue.length) return;

    const remaining = [];
    for (const payload of queue) {
      const sent = await send(payload, { skipBeacon: true, fromQueue: true });
      if (!sent) remaining.push(payload);
    }
    writeFailedQueue(remaining);
  }

  function track(raw = {}) {
    const type = normalizeType(raw.puzzleType);
    const def = getPuzzleDef(type);
    const data = { ...getData(def), ...(raw.dataObject || {}) };
    const puzzleId = String(raw.puzzleId || data.puzzleId || "");
    const puzzleDate = String(raw.puzzleDate || data.puzzleDate || data.date || "");
    const state = raw.state || {};
    const campaign = getCampaignData();
    const mode = String(raw.mode || raw.difficulty || data.mode || data.defaultMode || state.mode || "").toLowerCase();

    const payload = {
      eventType: normalizeEventType(raw.eventType || raw.eventName || raw.event),
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
      engineVersion: String(raw.engineVersion || data.engineVersion || ""),
      eventId: String(raw.eventId || createId("event-")),
      clientAt: String(raw.clientAt || new Date().toISOString()),
      sessionId: String(raw.sessionId || getSessionId()),
      mode,
      interactionKey: String(raw.interactionKey || raw.word || raw.answer || raw.item || ""),
      pagePath: String(raw.pagePath || campaign.pagePath),
      referrer: String(raw.referrer ?? document.referrer ?? ""),
      utmSource: String(raw.utmSource || campaign.utmSource),
      utmMedium: String(raw.utmMedium || campaign.utmMedium),
      utmCampaign: String(raw.utmCampaign || campaign.utmCampaign),
      trackerVersion: VERSION,
      isTest: Boolean(raw.isTest || campaign.isTest)
    };

    if (!payload.puzzleType || !payload.puzzleId) return;
    if (!payload.status) payload.status = payload.eventType;

    if (!shouldSend(payload)) return;
    send(payload);
  }

  function trackLoaded(def, detail = {}) {
    if (!def) return;
    const data = getData(def);
    const puzzleId = String(detail.puzzleId || data.puzzleId || "");
    if (!puzzleId) return;

    track({
      eventType: "loaded",
      puzzleType: def.puzzleType,
      puzzleId,
      puzzleDate: detail.puzzleDate || data.puzzleDate || data.date || "",
      status: "loaded",
      progressPercent: 0,
      mode: detail.mode || detail.difficulty || data.defaultMode || data.mode || "",
      engineVersion: detail.engineVersion || data.engineVersion || ""
    });
  }

  function handleStateChange(event) {
    const detail = event?.detail || {};
    const def = getPuzzleDef(detail.puzzleType) || inferPuzzleDefFromPage();
    if (!def) return;

    const data = getData(def);
    const puzzleId = String(detail.puzzleId || data.puzzleId || "");
    if (!puzzleId) return;
    trackLoaded(def, detail);

    const state = readSavedState(def, puzzleId, detail);
    const solved = isSolved(state, detail);
    const revealed = !solved && isRevealed(state, detail);
    const percent = progressPercent(def, data, state, detail);
    const detailStatus = String(detail.status || detail.puzzleStatus || state.status || "").toLowerCase();
    const detailAction = String(detail.action || "").toLowerCase();
    const statusIndicatesStarted = ["started", "in-progress", "progress"].includes(detailStatus);
    const actionIndicatesStarted = ["started", "start", "input", "play", "resume"].includes(detailAction);
    const hasStarted = Boolean(
      state.startedAt ||
      state.lastPlayedAt ||
      state.updatedAt ||
      percent > 0 ||
      statusIndicatesStarted ||
      actionIndicatesStarted
    );
    const status = solved ? "solved" : revealed ? "revealed" : percent > 0 ? "in-progress" : "started";
    let eventType = "progress";

    if (!solved && !revealed && !hasStarted) return;

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
      state,
      mode: detail.mode || detail.difficulty,
      engineVersion: detail.engineVersion
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
        state,
        mode: detail.mode || detail.difficulty,
        engineVersion: detail.engineVersion
      });
    }
  }

  function detectLoaded(attempt = 1) {
    const def = inferPuzzleDefFromPage();
    if (def) {
      const data = getData(def);
      const key = `${def.puzzleType}|${data.puzzleId || ""}|${data.defaultMode || data.mode || ""}`;
      if (data.puzzleId && key !== lastDetectedPuzzleKey) {
        lastDetectedPuzzleKey = key;
        trackLoaded(def);
      }
    }
    if (!def && attempt < 40) {
      window.setTimeout(() => detectLoaded(attempt + 1), 250);
    }
  }

  function scheduleDetectLoaded() {
    window.clearTimeout(detectTimer);
    detectTimer = window.setTimeout(() => detectLoaded(), 50);
  }

  function instrumentHistory() {
    ["pushState", "replaceState"].forEach(method => {
      const original = window.history && window.history[method];
      if (typeof original !== "function" || original.__hareAnalyticsWrapped) return;
      const wrapped = function (...args) {
        const result = original.apply(this, args);
        scheduleDetectLoaded();
        return result;
      };
      wrapped.__hareAnalyticsWrapped = true;
      window.history[method] = wrapped;
    });
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
      solved: detail.solved,
      mode: detail.mode || detail.difficulty,
      engineVersion: detail.engineVersion,
      eventId: detail.eventId,
      interactionKey: detail.interactionKey || detail.word || detail.answer || detail.item
    });
  });

  window.addEventListener("hare:puzzle-loaded", event => {
    const detail = event?.detail || {};
    const def = getPuzzleDef(detail.puzzleType) || inferPuzzleDefFromPage();
    if (def) trackLoaded(def, detail);
  });
  window.addEventListener("popstate", scheduleDetectLoaded);
  window.addEventListener("hashchange", scheduleDetectLoaded);
  window.addEventListener("online", flushFailedQueue);
  instrumentHistory();

  if (typeof MutationObserver === "function") {
    const observer = new MutationObserver(scheduleDetectLoaded);
    const observe = () => {
      if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
    else observe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => detectLoaded(), { once: true });
  } else {
    detectLoaded();
  }
  flushFailedQueue();
})();

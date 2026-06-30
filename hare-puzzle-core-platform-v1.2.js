/*
  Hare Publishing Puzzle Core
  Version: 1.2.0

  Purpose:
  Shared, puzzle-agnostic utilities for the new Hare Publishing puzzle platform.

  Important rules:
  - No gameplay logic.
  - No CSS.
  - No production localStorage key changes.
  - Puzzle engines/pages must pass their existing storage prefixes.
  - Designed to support JSON folders such as:
      https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@main/data/cryptogram/index.json
      https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@main/data/cryptogram/2026.json
*/
(function (window, document) {
  "use strict";

  const VERSION = "1.2.0";
  const DEFAULT_REPO = "harepublishing/harepublishing-puzzles";
  const DEFAULT_RELEASE = "main";
  const DEFAULT_CDN_ROOT = "https://cdn.jsdelivr.net/gh";

  const indexCache = new Map();
  const yearFileCache = new Map();
  const scriptCache = new Map();

  function toString(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function escapeHtml(value) {
    return toString(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function safeJSON(value, fallback = null) {
    try {
      if (value === null || value === undefined || value === "") return fallback;
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function localDateKey(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d)) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parsePuzzleDate(dateString, options = {}) {
    const endOfDay = options.endOfDay !== false;
    const parts = toString(dateString).split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

    const date = endOfDay
      ? new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999)
      : new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);

    return isNaN(date) ? null : date;
  }

  function formatDate(dateString, options = {}) {
    if (!dateString) return "";
    const locale = options.locale || "en-US";
    const formatOptions = options.formatOptions || {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    };

    const date = parsePuzzleDate(dateString, { endOfDay: false });
    if (!date) return toString(dateString);
    return date.toLocaleDateString(locale, formatOptions);
  }

  function monthKey(dateString) {
    const date = parsePuzzleDate(dateString, { endOfDay: false });
    if (!date) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function yearKey(dateString) {
    const date = parsePuzzleDate(dateString, { endOfDay: false });
    return date ? String(date.getFullYear()) : "";
  }

  function isFuturePuzzle(meta, now = new Date()) {
    const puzzleDate = parsePuzzleDate(meta && meta.puzzleDate, { endOfDay: true });
    if (!puzzleDate) return true;

    const today = now instanceof Date ? new Date(now) : new Date();
    today.setHours(23, 59, 59, 999);
    return puzzleDate > today;
  }

  function sortIndexAscending(indexItems) {
    return toArray(indexItems).slice().sort((a, b) => {
      const dateA = parsePuzzleDate(a && a.puzzleDate, { endOfDay: false });
      const dateB = parsePuzzleDate(b && b.puzzleDate, { endOfDay: false });
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return Number(a && a.puzzleId) - Number(b && b.puzzleId);
    });
  }

  function sortIndexDescending(indexItems) {
    return sortIndexAscending(indexItems).reverse();
  }

  function getAvailablePuzzles(indexItems, options = {}) {
    const now = options.now || new Date();
    const sort = options.sort || "ascending";
    let available = toArray(indexItems).filter(item => !isFuturePuzzle(item, now));

    if (options.accessConfig) {
      available = filterAccessiblePuzzles(available, options.accessConfig);
    }

    return sort === "descending" ? sortIndexDescending(available) : sortIndexAscending(available);
  }

  function getNewestAvailablePuzzle(indexItems, options = {}) {
    const available = getAvailablePuzzles(indexItems, { ...options, sort: "ascending" });
    return available.length ? available[available.length - 1] : null;
  }

  function buildDataBaseUrl(config = {}) {
    if (config.dataBaseUrl) return config.dataBaseUrl.replace(/\/?$/, "/");

    const cdnRoot = config.cdnRoot || DEFAULT_CDN_ROOT;
    const repo = config.repo || DEFAULT_REPO;
    const release = config.release || DEFAULT_RELEASE;
    const puzzleType = config.puzzleType;

    if (!puzzleType) {
      throw new Error("HarePuzzleCore: puzzleType is required when dataBaseUrl is not supplied.");
    }

    return `${cdnRoot}/${repo}@${release}/data/${puzzleType}/`;
  }

  function buildIndexUrl(config = {}) {
    return config.indexUrl || `${buildDataBaseUrl(config)}index.json`;
  }

  function buildYearFileUrl(year, config = {}) {
    return config.yearFileUrl
      ? config.yearFileUrl(year, config)
      : `${buildDataBaseUrl(config)}${year}.json`;
  }

  async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options.fetchOptions || {});
    if (!response.ok) {
      throw new Error(options.errorMessage || `Could not load JSON: ${url}`);
    }
    return response.json();
  }

  async function loadIndex(config = {}) {
    const url = buildIndexUrl(config);
    const cacheKey = url;
    const useCache = config.cache !== false;

    if (useCache && indexCache.has(cacheKey)) return indexCache.get(cacheKey);

    const index = await fetchJSON(url, {
      fetchOptions: config.fetchOptions,
      errorMessage: config.errorMessage || "Could not load index.json."
    });

    if (!Array.isArray(index)) {
      throw new Error("index.json did not contain an array.");
    }

    if (useCache) indexCache.set(cacheKey, index);
    return index;
  }

  async function loadYearFile(year, config = {}) {
    const url = buildYearFileUrl(year, config);
    const cacheKey = url;
    const useCache = config.cache !== false;

    if (useCache && yearFileCache.has(cacheKey)) return yearFileCache.get(cacheKey);

    const puzzles = await fetchJSON(url, {
      fetchOptions: config.fetchOptions,
      errorMessage: config.errorMessage || `Could not load ${year}.json.`
    });

    if (!Array.isArray(puzzles)) {
      throw new Error(`${year}.json did not contain an array.`);
    }

    if (useCache) yearFileCache.set(cacheKey, puzzles);
    return puzzles;
  }

  async function getPuzzleDataForMeta(meta, config = {}) {
    if (!meta || meta.puzzleId === undefined || meta.puzzleId === null) {
      throw new Error("Puzzle metadata is missing puzzleId.");
    }

    const year = meta.year || (meta.puzzleDate ? yearKey(meta.puzzleDate) : "");
    if (!year) throw new Error(`Puzzle #${meta.puzzleId} is missing a year.`);

    const puzzles = await loadYearFile(year, config);
    const puzzleData = puzzles.find(item => String(item.puzzleId) === String(meta.puzzleId));

    if (!puzzleData) {
      throw new Error(`Puzzle #${meta.puzzleId} was not found in ${year}.json.`);
    }

    return { ...puzzleData, puzzleId: puzzleData.puzzleId ?? meta.puzzleId, puzzleDate: puzzleData.puzzleDate ?? meta.puzzleDate };
  }

  function getPuzzleIdFromUrl(paramName = "puzzle", url = window.location.href) {
    try {
      return new URL(url, window.location.origin).searchParams.get(paramName);
    } catch {
      return new URLSearchParams(window.location.search).get(paramName);
    }
  }

  function updatePuzzleUrl(puzzleId, options = {}) {
    const paramName = options.paramName || "puzzle";
    const mode = options.mode || "push";
    const title = options.title || "";
    const url = new URL(window.location.href);

    if (puzzleId === null || puzzleId === undefined || puzzleId === "") {
      url.searchParams.delete(paramName);
    } else {
      url.searchParams.set(paramName, puzzleId);
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    if (mode === "replace") {
      window.history.replaceState(options.state || {}, title, nextUrl);
    } else {
      window.history.pushState(options.state || {}, title, nextUrl);
    }

    return nextUrl;
  }

  function getSavedState(storageKey, fallback = null) {
    if (!storageKey) return fallback;
    try {
      return safeJSON(localStorage.getItem(storageKey), fallback);
    } catch {
      return fallback;
    }
  }

  function setSavedState(storageKey, data) {
    if (!storageKey) return false;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function removeSavedState(storageKey) {
    if (!storageKey) return false;
    try {
      localStorage.removeItem(storageKey);
      return true;
    } catch {
      return false;
    }
  }

  function makeStorageKey(prefix, puzzleId) {
    return `${toString(prefix)}${toString(puzzleId)}`;
  }

  function normalizePrefixes(prefixes) {
    if (Array.isArray(prefixes)) return prefixes.filter(Boolean).map(String);
    if (prefixes) return [String(prefixes)];
    return [];
  }

  function getStoredItems(prefixes, options = {}) {
    const normalizedPrefixes = normalizePrefixes(prefixes || options.prefixes);
    const items = [];

    if (!normalizedPrefixes.length) return items;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !normalizedPrefixes.some(prefix => key.startsWith(prefix))) continue;

        const data = safeJSON(localStorage.getItem(key));
        if (!data) continue;

        const matchedPrefix = normalizedPrefixes.find(prefix => key.startsWith(prefix));
        const id = matchedPrefix ? key.slice(matchedPrefix.length) : "";

        items.push({ key, id, puzzleId: id, prefix: matchedPrefix, data, saved: data });
      }
    } catch {
      return items;
    }

    return items;
  }

  function toGlobalPuzzleName(value) {
    return toString(value)
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase();
  }

  function normalizePuzzleTypeName(value) {
    return toString(value).trim().toLowerCase().replace(/[_\s]+/g, "-");
  }

  function parseDateBoundary(dateString, endOfDay = false) {
    if (!dateString) return null;
    const parts = toString(dateString).split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const date = endOfDay
      ? new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999)
      : new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
    return isNaN(date) ? null : date;
  }

  function getPromotionConfig(puzzleType) {
    const globalPromotion = window.HARE_PUZZLE_PROMOTION || window.HARE_PUZZLE_PROMO || {};
    const puzzlePromotionName = `HARE_${toGlobalPuzzleName(puzzleType)}_PROMOTION`;
    const puzzlePromotion = window[puzzlePromotionName] || {};
    return { ...globalPromotion, ...puzzlePromotion };
  }

  function promotionMatchesPuzzleType(promotion, puzzleType) {
    const configured = promotion.puzzleTypes || promotion.puzzleType || promotion.types || "all";
    if (configured === "all" || configured === "*" || configured === true) return true;
    const target = normalizePuzzleTypeName(puzzleType);
    const values = Array.isArray(configured) ? configured : [configured];
    return values.some(value => {
      const normalized = normalizePuzzleTypeName(value);
      return normalized === "all" || normalized === "*" || normalized === target;
    });
  }

  function isPuzzlePromotionActive(puzzleType, now = new Date()) {
    const promotion = getPromotionConfig(puzzleType);
    if (!promotion || promotion.enabled !== true) return false;
    if (!promotionMatchesPuzzleType(promotion, puzzleType)) return false;

    const checkDate = now instanceof Date ? now : new Date(now);
    if (isNaN(checkDate)) return false;

    const start = parseDateBoundary(promotion.startDate || promotion.starts || promotion.start, false);
    const end = parseDateBoundary(promotion.endDate || promotion.ends || promotion.end, true);

    if (start && checkDate < start) return false;
    if (end && checkDate > end) return false;

    return true;
  }

  function getEffectiveAccessMode(puzzleType, pageMode = "public", options = {}) {
    const baseMode = toString(pageMode || "public").toLowerCase();
    if (isPuzzlePromotionActive(puzzleType, options.now || new Date())) {
      return toString(options.promoMode || "member").toLowerCase();
    }
    return baseMode;
  }

  function normalizePuzzleAccessConfig(config = {}) {
    const rawFreeDays = config.freeDays;
    const freeDays = rawFreeDays === "all"
      ? "all"
      : (rawFreeDays === null || rawFreeDays === false
        ? null
        : Math.max(0, Number(rawFreeDays ?? 7)));

    return {
      mode: toString(config.mode || "public").toLowerCase(),
      freeDays: Number.isNaN(freeDays) ? 7 : freeDays,
      accessField: config.accessField || "access",
      now: config.now instanceof Date ? config.now : new Date(),
      freeAccessValues: normalizePrefixes(config.freeAccessValues || ["free", "public"]).map(value => value.toLowerCase()),
      memberAccessValues: normalizePrefixes(config.memberAccessValues || ["member", "paid", "premium"]).map(value => value.toLowerCase()),
      publicPlayUrl: config.publicPlayUrl || "/cryptogram-test",
      memberPlayUrl: config.memberPlayUrl || "/cryptogram-member",
      archiveUrl: config.archiveUrl || "/cryptogram-archive"
    };
  }

  function getPuzzleAccessConfig(puzzleType, overrides = {}) {
    const globalConfig = window.HARE_PUZZLE_ACCESS || {};
    const puzzleConfigName = `HARE_${toGlobalPuzzleName(puzzleType)}_ACCESS`;
    const puzzleConfig = window[puzzleConfigName] || {};
    const merged = { ...globalConfig, ...puzzleConfig, ...overrides };
    const promoActive = isPuzzlePromotionActive(puzzleType, merged.now || new Date());
    const config = normalizePuzzleAccessConfig({
      ...merged,
      mode: promoActive ? "member" : merged.mode
    });
    config.pageMode = toString(merged.pageMode || overrides.pageMode || merged.mode || "public").toLowerCase();
    config.promoActive = promoActive;
    config.promotionActive = promoActive;
    config.effectiveMode = config.mode;
    return config;
  }

  function isWithinFreeWindow(meta, config = {}) {
    const accessConfig = normalizePuzzleAccessConfig(config);
    if (accessConfig.freeDays === "all") return true;
    if (accessConfig.freeDays === null || accessConfig.freeDays <= 0) return false;

    const puzzleDate = parsePuzzleDate(meta && meta.puzzleDate, { endOfDay: true });
    if (!puzzleDate) return false;

    const end = new Date(accessConfig.now);
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(start.getDate() - (accessConfig.freeDays - 1));
    start.setHours(0, 0, 0, 0);

    return puzzleDate >= start && puzzleDate <= end;
  }

  function getPuzzleRequiredAccess(meta, config = {}) {
    const accessConfig = normalizePuzzleAccessConfig(config);
    const rawAccess = meta && meta[accessConfig.accessField] !== undefined
      ? meta[accessConfig.accessField]
      : meta && meta.access;
    const normalizedAccess = toString(rawAccess).trim().toLowerCase();

    if (accessConfig.freeAccessValues.includes(normalizedAccess)) return "free";
    if (accessConfig.memberAccessValues.includes(normalizedAccess)) return "member";
    return isWithinFreeWindow(meta, accessConfig) ? "free" : "member";
  }

  function canAccessPuzzle(meta, config = {}) {
    const accessConfig = normalizePuzzleAccessConfig(config);
    if (accessConfig.mode === "member" || accessConfig.mode === "all" || accessConfig.mode === "admin") return true;
    return getPuzzleRequiredAccess(meta, accessConfig) === "free";
  }

  function filterAccessiblePuzzles(indexItems, config = {}) {
    return toArray(indexItems).filter(item => canAccessPuzzle(item, config));
  }

  const defaultStatusAdapter = {
    isSolved(data) {
      return Boolean(data && !this.isRevealed(data) && (
        data.solved ||
        data.completed ||
        data.isSolved ||
        data.status === "solved" ||
        data.status === "complete" ||
        data.completedAt ||
        data.solvedAt
      ));
    },

    isRevealed(data) {
      return Boolean(data && (data.revealed || data.revealedAt));
    },

    isFinished(data) {
      return Boolean(data && (
        data.solved ||
        data.revealed ||
        data.completed ||
        data.isSolved ||
        data.status === "solved" ||
        data.status === "complete" ||
        data.completedAt ||
        data.solvedAt ||
        data.revealedAt
      ));
    },

    hasProgress(data) {
      if (!data || this.isFinished(data)) return false;
      if (data.mappings && Object.keys(data.mappings).length > 0) return true;
      if (Array.isArray(data.guesses) && data.guesses.length > 0) return true;
      if (data.currentGuess) return true;
      if (data.elapsedSeconds > 0 || data.timeElapsed > 0) return true;
      if (data.startedAt || data.lastPlayedAt || data.updatedAt) return true;
      return false;
    },

    finishedDate(data) {
      if (!data) return null;
      return data.completedAt || data.solvedAt || data.revealedAt || data.finishedAt || data.updatedAt || data.lastPlayedAt || null;
    }
  };

  function createStatusAdapter(adapter = {}) {
    return {
      isSolved: typeof adapter.isSolved === "function" ? adapter.isSolved : defaultStatusAdapter.isSolved,
      isRevealed: typeof adapter.isRevealed === "function" ? adapter.isRevealed : defaultStatusAdapter.isRevealed,
      isFinished: typeof adapter.isFinished === "function" ? adapter.isFinished : defaultStatusAdapter.isFinished,
      hasProgress: typeof adapter.hasProgress === "function" ? adapter.hasProgress : defaultStatusAdapter.hasProgress,
      finishedDate: typeof adapter.finishedDate === "function" ? adapter.finishedDate : defaultStatusAdapter.finishedDate
    };
  }

  function getPuzzleStatus(data, adapter = {}) {
    const status = createStatusAdapter(adapter);

    if (status.isRevealed.call(status, data)) return "revealed";
    if (status.isSolved.call(status, data)) return "solved";
    if (status.hasProgress.call(status, data)) return "in-progress";
    return "not-started";
  }

  function getPuzzleState(puzzleId, options = {}) {
    const storageKey = options.storageKey || makeStorageKey(options.storagePrefix || options.prefix || "", puzzleId);
    const data = getSavedState(storageKey);
    return getPuzzleStatus(data, options.statusAdapter);
  }

  function isFinished(data, adapter = {}) {
    const status = createStatusAdapter(adapter);
    return status.isFinished.call(status, data);
  }

  function getFinishedDate(data, adapter = {}) {
    const status = createStatusAdapter(adapter);
    return status.finishedDate.call(status, data);
  }

  function getCurrentStreak(items, options = {}) {
    const adapter = createStatusAdapter(options.statusAdapter);
    const finishedDates = new Set();

    toArray(items).forEach(item => {
      const data = item.data || item.saved || item;
      if (!adapter.isFinished.call(adapter, data)) return;
      const raw = adapter.finishedDate.call(adapter, data);
      if (!raw) return;
      const date = new Date(raw);
      if (!isNaN(date)) finishedDates.add(localDateKey(date));
    });

    let streak = 0;
    const today = options.today instanceof Date ? options.today : new Date();
    const maxDays = Number(options.maxDays || 3650);

    for (let i = 0; i < maxDays; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      if (finishedDates.has(localDateKey(checkDate))) {
        streak++;
      } else if (i === 0 && options.allowYesterdayStart !== false) {
        continue;
      } else {
        break;
      }
    }

    return streak;
  }

  function getStats(options = {}) {
    const items = getStoredItems(options.storagePrefixes || options.storagePrefix || options.prefixes || options.prefix);
    const adapter = createStatusAdapter(options.statusAdapter);

    const solved = items.filter(item => adapter.isSolved.call(adapter, item.data));
    const revealed = items.filter(item => adapter.isRevealed.call(adapter, item.data));
    const finished = items.filter(item => adapter.isFinished.call(adapter, item.data));
    const inProgress = items.filter(item => !adapter.isFinished.call(adapter, item.data) && adapter.hasProgress.call(adapter, item.data));

    return {
      streak: getCurrentStreak(finished, { statusAdapter: adapter, today: options.today }),
      solved: solved.length,
      revealed: revealed.length,
      inProgress: inProgress.length,
      played: solved.length + revealed.length + inProgress.length,
      finished: finished.length,
      totalStored: items.length,
      items
    };
  }

  function findNextPuzzle(options = {}) {
    const available = toArray(options.availablePuzzles || options.indexItems);
    const storagePrefix = options.storagePrefix || options.prefix || "";
    const adapter = createStatusAdapter(options.statusAdapter);
    const order = options.order || "newest-first";
    const sorted = order === "oldest-first" ? sortIndexAscending(available) : sortIndexDescending(available);

    // Prefer in-progress puzzles first, newest first by default.
    for (const item of sorted) {
      const saved = getSavedState(makeStorageKey(storagePrefix, item.puzzleId));
      if (saved && !adapter.isFinished.call(adapter, saved) && adapter.hasProgress.call(adapter, saved)) {
        return { ...item, id: String(item.puzzleId), status: "in-progress", isInProgress: true };
      }
    }

    // Then newest not-finished puzzle.
    for (const item of sorted) {
      const saved = getSavedState(makeStorageKey(storagePrefix, item.puzzleId));
      if (!adapter.isFinished.call(adapter, saved)) {
        return {
          ...item,
          id: String(item.puzzleId),
          status: saved ? getPuzzleStatus(saved, adapter) : "not-started",
          isInProgress: false
        };
      }
    }

    return null;
  }

  function getHeroPuzzle(puzzles, options = {}) {
    const available = sortIndexDescending(puzzles);
    const storagePrefix = options.storagePrefix || options.prefix || "";
    const adapter = createStatusAdapter(options.statusAdapter);

    const withStatus = available.map(item => {
      const saved = getSavedState(makeStorageKey(storagePrefix, item.puzzleId));
      return { ...item, state: getPuzzleStatus(saved, adapter), saved };
    });

    return (
      withStatus.find(item => item.state === "in-progress") ||
      withStatus.find(item => item.state === "not-started") ||
      withStatus[0] ||
      null
    );
  }

  function buildPlayUrl(baseUrl, puzzleId, options = {}) {
    const paramName = options.paramName || "puzzle";
    const url = new URL(baseUrl || window.location.pathname, window.location.origin);
    url.searchParams.set(paramName, puzzleId);
    return options.absolute ? url.href : `${url.pathname}${url.search}${url.hash}`;
  }

  function emitStateChange(detail = {}) {
    const genericEvent = new CustomEvent("hare:puzzle-state-change", { detail });
    window.dispatchEvent(genericEvent);

    if (detail.puzzleType) {
      const specificEvent = new CustomEvent(`hare:${detail.puzzleType}-state-change`, { detail });
      window.dispatchEvent(specificEvent);
    }
  }

  function loadScript(src, options = {}) {
    if (!src) return Promise.reject(new Error("Script source is required."));
    if (options.globalName && window[options.globalName]) return Promise.resolve();
    if (scriptCache.has(src)) return scriptCache.get(src);

    const promise = new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts || []).find(item => item.src === src || item.getAttribute("src") === src);
      if (existing) {
        if (options.globalName && window[options.globalName]) return resolve();
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", () => reject(new Error(`Could not load script: ${src}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      if (options.defer) script.defer = true;
      if (options.async) script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(options.errorMessage || `Could not load script: ${src}`));
      document.head.appendChild(script);
    });

    scriptCache.set(src, promise);
    return promise;
  }

  function clearCaches() {
    indexCache.clear();
    yearFileCache.clear();
    scriptCache.clear();
  }

  window.HarePuzzleCore = {
    version: VERSION,

    // URL/path helpers
    buildDataBaseUrl,
    buildIndexUrl,
    buildYearFileUrl,
    buildPlayUrl,
    getPuzzleIdFromUrl,
    updatePuzzleUrl,

    // Loading helpers
    fetchJSON,
    loadIndex,
    loadYearFile,
    getPuzzleDataForMeta,
    loadScript,
    clearCaches,

	    // Date/index helpers
	    parsePuzzleDate,
	    formatDate,
	    monthKey,
	    yearKey,
    localDateKey,
    isFuturePuzzle,
    sortIndexAscending,
    sortIndexDescending,
	    getAvailablePuzzles,
	    getNewestAvailablePuzzle,

	    // Access helpers
	    normalizePuzzleAccessConfig,
	    getPuzzleAccessConfig,
    getPromotionConfig,
    isPuzzlePromotionActive,
    getEffectiveAccessMode,
	    isWithinFreeWindow,
	    getPuzzleRequiredAccess,
	    canAccessPuzzle,
	    filterAccessiblePuzzles,

    // Storage/status helpers
    safeJSON,
    escapeHtml,
    makeStorageKey,
    getSavedState,
    setSavedState,
    removeSavedState,
    getStoredItems,
    createStatusAdapter,
    getPuzzleStatus,
    getPuzzleState,
    isFinished,
    getFinishedDate,
    getCurrentStreak,
    getStats,

    // Platform selection helpers
    findNextPuzzle,
    getHeroPuzzle,

    // Events
    emitStateChange
  };
})(window, document);

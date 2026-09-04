/*
 * Hare Publishing Puzzle Break loader v1.0
 * Standalone from the Puzzlers Hub platform.
 *
 * Squarespace Code Block:
 * <div class="hare-puzzle-break-player"
 *      data-puzzle-type="word-search"
 *      data-puzzle-id="pb-ws-2026-09-04-01"></div>
 */
(function () {
  "use strict";

  const DEFAULT_BASE_URL =
    "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@main/puzzle-break/";
  const userConfig = window.HARE_PUZZLE_BREAK_CONFIG || {};
  const config = {
    baseUrl: normalizeBaseUrl(userConfig.baseUrl || DEFAULT_BASE_URL),
    release: String(userConfig.release || "1.0"),
    todayUrl: userConfig.todayUrl || "/puzzlers-hub",
    membershipUrl: userConfig.membershipUrl || "/membership"
  };

  const TYPES = {
    "word-search": {
      engineUrl: "code/engines/puzzle-break-word-search-engine-v1.0.js",
      globalName: "word-search"
    }
  };
  const jsonCache = new Map();
  const scriptCache = new Map();

  function normalizeBaseUrl(value) {
    const resolved = new URL(String(value || "./"), document.baseURI).toString();
    return resolved.replace(/\/+$/, "") + "/";
  }

  function versionedUrl(path, version) {
    const url = new URL(path, config.baseUrl);
    url.searchParams.set("v", String(version || config.release));
    return url.toString();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function showMessage(container, message, kind) {
    container.dataset.pbState = kind || "message";
    container.innerHTML = `<div class="pb-system-message pb-system-message--${escapeHtml(kind || "message")}">${escapeHtml(message)}</div>`;
  }

  async function fetchJson(path, version) {
    const url = versionedUrl(path, version);
    if (!jsonCache.has(url)) {
      jsonCache.set(url, fetch(url, { credentials: "omit" }).then(response => {
        if (!response.ok) throw new Error(`Request failed (${response.status}).`);
        return response.json();
      }).catch(error => {
        jsonCache.delete(url);
        throw error;
      }));
    }
    return jsonCache.get(url);
  }

  function loadScript(path) {
    const url = versionedUrl(path);
    if (!scriptCache.has(url)) {
      scriptCache.set(url, new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Could not load ${path}.`));
        document.head.appendChild(script);
      }).catch(error => {
        scriptCache.delete(url);
        throw error;
      }));
    }
    return scriptCache.get(url);
  }

  function ensureStyles() {
    if (document.querySelector('link[data-pb-styles="1.0"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = versionedUrl("code/puzzle-break-styles-v1.0.css");
    link.dataset.pbStyles = "1.0";
    document.head.appendChild(link);
  }

  async function mountContainer(container) {
    if (container.dataset.pbMounted === "true") return;
    container.dataset.pbMounted = "true";

    const type = String(container.dataset.puzzleType || "").trim().toLowerCase();
    const puzzleId = String(container.dataset.puzzleId || "").trim();
    const typeConfig = TYPES[type];

    if (!type || !puzzleId) {
      showMessage(container, "This Puzzle Break is missing its puzzle information.", "error");
      return;
    }
    if (!typeConfig) {
      showMessage(container, "This Puzzle Break puzzle type is not available yet.", "error");
      return;
    }

    showMessage(container, "Loading your Puzzle Break…", "loading");

    try {
      const index = await fetchJson(`${type}/index.json`);
      const entries = Array.isArray(index) ? index : (Array.isArray(index.puzzles) ? index.puzzles : []);
      const entryId = entry => String(entry.id != null ? entry.id : entry.puzzleId);
      const meta = entries.find(entry => entryId(entry) === puzzleId);
      if (!meta) throw new Error("Puzzle ID was not found in the index.");

      const yearKey = String(meta.year || String(meta.published || "").slice(0, 4));
      if (!/^\d{4}$/.test(yearKey)) throw new Error("Puzzle year was not found in the index.");
      const yearMeta = (!Array.isArray(index) && index.years && index.years[yearKey]) || {
        url: `${yearKey}.json`,
        version: config.release
      };

      const annual = await fetchJson(`${type}/${yearMeta.url}`, yearMeta.version || yearMeta.updated);
      const puzzles = Array.isArray(annual) ? annual : (Array.isArray(annual.puzzles) ? annual.puzzles : []);
      const record = puzzles.find(puzzle => entryId(puzzle) === puzzleId);
      if (!record) throw new Error("Puzzle ID was not found in the annual file.");
      if (record.type && String(record.type) !== type) throw new Error("Puzzle type does not match its Code Block.");

      await loadScript(typeConfig.engineUrl);
      const engine = window.HarePuzzleBreakEngines && window.HarePuzzleBreakEngines[typeConfig.globalName];
      if (!engine || typeof engine.mount !== "function") throw new Error("Puzzle engine did not initialize.");

      container.dataset.pbState = "ready";
      engine.mount({
        container,
        record,
        links: {
          today: config.todayUrl,
          membership: config.membershipUrl
        }
      });
    } catch (error) {
      console.error("Puzzle Break:", error);
      showMessage(container, "This Puzzle Break is temporarily unavailable. Please try again shortly.", "error");
    }
  }

  function start(root) {
    ensureStyles();
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".hare-puzzle-break-player").forEach(mountContainer);
  }

  window.HarePuzzleBreak = Object.freeze({ start });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => start(document), { once: true });
  } else {
    start(document);
  }
})();

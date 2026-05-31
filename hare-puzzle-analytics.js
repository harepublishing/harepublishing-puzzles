window.HarePuzzleAnalytics = (() => {
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbwS7DsZFTf_SzkHiNQ7k77ZvaDRenr8VCgispZdz2ohUeXOrjHRZ_TKoEOWuLZdfOI/exec";
  const ID_KEY = "hp_anonymous_player_id";

  function getAnonymousId() {
    try {
      let id = localStorage.getItem(ID_KEY);
      if (!id) {
        id = "hp_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(ID_KEY, id);
      }
      return id;
    } catch {
      return "";
    }
  }

  function getDeviceType() {
    return window.matchMedia && window.matchMedia("(max-width: 768px)").matches
      ? "mobile"
      : "desktop";
  }

  function getSudokuMeta(eventData = {}) {
    const data = window.HareSudokuData || {};
    const puzzles = data.puzzles || {};

    let mode =
      eventData.mode ||
      eventData.difficulty ||
      data.defaultMode ||
      "";

    if (eventData.puzzleType === "daily-sudoku-challenge") {
      mode = "challenge";
    }

    if (!mode && puzzles.challenge) mode = "challenge";
    if (!mode && puzzles.easy) mode = "easy";

    const puzzle = puzzles[mode] || {};

    return {
      puzzleType: mode === "challenge" ? "daily-sudoku-challenge" : "sudoku",
      puzzleId: eventData.puzzleId || puzzle.puzzleId || data.puzzleId || "",
      puzzleDate: eventData.puzzleDate || data.puzzleDate || data.date || ""
    };
  }

  function getFallbackMeta(eventData = {}) {
    const type = eventData.puzzleType || "";

    const sources = [
      window.HareCryptogramData,
      window.HareWordScrambleData,
      window.HareWordFlowerData,
      window.HareWordrowData,
      window.HareWordRowData,
      window.HareKrissKrossData,
      window.HareWordSearchData
    ].filter(Boolean);

    for (const data of sources) {
      if (data.puzzleId || data.id || data.puzzleDate || data.date) {
        return {
          puzzleType: type,
          puzzleId: eventData.puzzleId || data.puzzleId || data.id || "",
          puzzleDate: eventData.puzzleDate || data.puzzleDate || data.date || ""
        };
      }
    }

    return {
      puzzleType: type,
      puzzleId: eventData.puzzleId || "",
      puzzleDate: eventData.puzzleDate || ""
    };
  }

  function enrichEventData(eventData = {}) {
    const requestedType = eventData.puzzleType || "";

    if (
      requestedType === "sudoku" ||
      requestedType === "regular-sudoku" ||
      requestedType === "daily-sudoku-challenge" ||
      window.HareSudokuData
    ) {
      return {
        ...eventData,
        ...getSudokuMeta(eventData)
      };
    }

    return {
      ...eventData,
      ...getFallbackMeta(eventData)
    };
  }

  function track(eventData = {}) {
    try {
      const enriched = enrichEventData(eventData);

      const payload = {
        eventType: "",
        puzzleType: "",
        puzzleId: "",
        puzzleDate: "",
        status: "",
        elapsedSeconds: 0,
        progressPercent: 0,
        hintsUsed: 0,
        revealed: false,
        solved: false,
        pageUrl: window.location.href,
        hostName: window.location.hostname,
        deviceType: getDeviceType(),
        anonymousId: getAnonymousId(),
        engineVersion: "",
        ...enriched
      };

      fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    } catch {}
  }

  return { track };
})();

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

  function track(eventData = {}) {
    try {
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
        deviceType: getDeviceType(),
        anonymousId: getAnonymousId(),
        engineVersion: "",
        ...eventData
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

window.HareWordFlowerEngine = (() => {
  function init(userConfig = {}) {
    const data = userConfig?.dataObject || window.HareWordFlowerData || {};
    const containerId = userConfig?.containerId || "hp-wordflower-container";
    const container = document.getElementById(containerId);
    if (!container) return;
    const mount = container.querySelector(".hp-mount") || container;
    const puzzleId = String(data.puzzleId || "").trim();
    const puzzleDate = String(data.puzzleDate || "").trim();
    const centerLetter = String(data.centerLetter || "").trim().toUpperCase();
    const outerLetters = Array.isArray(data.outerLetters)
      ? data.outerLetters.map(l => String(l).trim().toUpperCase())
      : [];
    const allowedWords = Array.isArray(data.allowedWords)
      ? [...new Set(data.allowedWords.map(w => String(w).trim().toUpperCase()).filter(Boolean))]
      : [];
    const minWordLength = Number(data.minWordLength || 4);
    const pangramBonus = Number(data.pangramBonus || 7);
    const puzzleTitle = `Word Flower #${puzzleId}`;
    const uniqueSet = new Set([centerLetter, ...outerLetters]);
    if (
      !puzzleId ||
      centerLetter.length !== 1 ||
      outerLetters.length !== 6 ||
      uniqueSet.size !== 7
    ) {
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
          line-height:1.45;
        ">
          <strong>Configuration Error:</strong><br>
          Word Flower needs a puzzleId, exactly 1 center letter, and 6 different outer letters with no repeats.
        </div>
      `;
      return;
    }
    const SAVE_KEY = `hp_wf_${puzzleId}`;
    function loadState() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
    const state = loadState() || {
      current: "",
      found: [],
      solved: false,
      revealed: false
    };
    function save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch {}
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
      return [...uniqueSet].every(letter => word.includes(letter));
    }
    function scoreWord(word) {
      let score = word.length === 4 ? 1 : word.length;
      if (isPangram(word)) score += pangramBonus;
      return score;
    }
    function currentScore() {
      return state.found.reduce((sum, w) => sum + scoreWord(w), 0);
    }
    function totalScore() {
      return allowedWords.reduce((sum, w) => sum + scoreWord(w), 0);
    }
    function formatDate(dateStr) {
      if (!dateStr) return "";
      try {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-CA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      } catch {
        return dateStr;
      }
    }
    mount.innerHTML = `
      ${puzzleDate ? `<div class="hp-puzzle-date">${formatDate(puzzleDate)}</div>` : ""}
      <div class="hp-wf-panel">
        <div class="hp-wf-stats">
          <div class="hp-wf-stat">
            <span class="hp-wf-stat-value">${state.found.length}/${allowedWords.length}</span>
            <span class="hp-wf-stat-label">Words Found</span>
          </div>
          <div class="hp-wf-stat">
            <span class="hp-wf-stat-value">${currentScore()}</span>
            <span class="hp-wf-stat-label">Current Score</span>
          </div>
          <div class="hp-wf-stat">
            <span class="hp-wf-stat-value">${totalScore()}</span>
            <span class="hp-wf-stat-label">Max Score</span>
          </div>
        </div>
        <div class="hp-wf-progress">
          <div class="hp-wf-progress-fill" style="width:${(state.found.length / allowedWords.length) * 100}%"></div>
        </div>
        <div style="padding:20px 0;text-align:center;font-weight:800;">
          ${puzzleTitle}
        </div>
      </div>
    `;
    save();
  }
  return {
    init
  };
})();

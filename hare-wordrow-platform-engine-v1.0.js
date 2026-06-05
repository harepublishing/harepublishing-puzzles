/* =========================================================
   HARE PUBLISHING WORDROW PLATFORM ENGINE
   Gameplay-only engine for the Cryptogram-style platform shell.
   Filename: hare-wordrow-platform-engine-v1.0.js
   Exposes: window.HareWordrowEngine
   ========================================================= */

window.HareWordrowEngine = {
  init({ containerId = "hp-wordrow-container", dataId = "hp-wordrow-data", dataObject = window.HareWordrowData } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (container.dataset.hpWordrowMounted === "true") return;
    container.dataset.hpWordrowMounted = "true";
    container.setAttribute("tabindex", "0");

    const mount = container.querySelector(".hp-mount") || container.querySelector(".hpw-mount") || container;
    const yearEl = container.querySelector("#hp-year") || container.querySelector("#hpw-year") || document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const dataEl = document.getElementById(dataId);
    let pageData = dataObject || null;
    if (!pageData && dataEl) {
      try { pageData = JSON.parse(dataEl.textContent || "{}"); } catch {}
    }

    const MORE_PUZZLES_URL = pageData?.morePuzzlesUrl || "https://www.harepublishing.com/online-puzzles";
    const SHOP_URL = pageData?.shopUrl || "https://www.harepublishing.com/shop";
    const MAX_GUESSES = Number(pageData?.maxGuesses || 6);

    injectStyles();

    function escapeHtml(str) {
      return String(str).replace(/[&<>\"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[s]));
    }

    function clean(value) {
      return String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
    }

    function showConfigError(message) {
      mount.innerHTML = `<p style="color:#ED1B24;text-align:center;font-weight:800;">${escapeHtml(message)}</p>`;
    }

    if (!pageData) {
      showConfigError("Wordrow puzzle data is missing.");
      return;
    }

    const puzzleId = String(pageData.puzzleId || "").trim();
    const answer = clean(pageData.answer || pageData.ANSWER);
    const SAVE_KEY = pageData.storageKey || `hp_wr_${puzzleId}`;

    if (!puzzleId) return showConfigError("Wordrow puzzleId is missing.");
    if (answer.length !== 5) return showConfigError("Wordrow answer must be exactly 5 letters A-Z.");
    if (!Number.isInteger(MAX_GUESSES) || MAX_GUESSES < 1) return showConfigError("Wordrow maxGuesses must be a positive whole number.");

    function defaultState() {
      return { guesses: [], statuses: [], current: "", solved: false, revealed: false, lost: false, solvedAt: "", revealedAt: "", finishedAt: "", updatedAt: "", overlaySeen: false };
    }

    function loadState() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const merged = parsed ? { ...defaultState(), ...parsed } : defaultState();
        if (!Array.isArray(merged.guesses)) merged.guesses = [];
        if (!Array.isArray(merged.statuses)) merged.statuses = [];
        merged.guesses = merged.guesses.map(clean).filter(g => g.length === 5).slice(0, MAX_GUESSES);
        merged.current = clean(merged.current).slice(0, 5);
        merged.solved = Boolean(merged.solved || merged.completed || merged.isSolved || merged.solvedAt || merged.completedAt);
        merged.revealed = Boolean(merged.revealed || merged.revealedAt);
        merged.lost = Boolean(merged.lost);
        merged.overlaySeen = Boolean(merged.overlaySeen);
        return merged;
      } catch { return defaultState(); }
    }

    let state = loadState();

    function saveState() {
      state.updatedAt = new Date().toISOString();
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
      try { window.dispatchEvent(new CustomEvent("hare-wordrow-progress", { detail: { puzzleId, state } })); } catch {}
    }

    function evaluateGuess(guess) {
      const res = Array(5).fill("absent");
      const counts = {};
      for (let i = 0; i < 5; i++) counts[answer[i]] = (counts[answer[i]] || 0) + 1;
      for (let i = 0; i < 5; i++) {
        if (guess[i] === answer[i]) { res[i] = "correct"; counts[guess[i]]--; }
      }
      for (let i = 0; i < 5; i++) {
        if (res[i] === "correct") continue;
        const ch = guess[i];
        if (counts[ch] > 0) { res[i] = "present"; counts[ch]--; }
      }
      return res;
    }

    function recomputeStatus() {
      state.statuses = state.guesses.map(g => evaluateGuess(clean(g)));
      state.solved = state.guesses.includes(answer) || Boolean(state.solvedAt);
      state.lost = !state.solved && !state.revealed && state.guesses.length >= MAX_GUESSES;
    }

    function computeLetterStates() {
      const priority = { correct: 3, present: 2, absent: 1, revealed: 3 };
      const letterStates = {};
      for (let i = 0; i < state.guesses.length; i++) {
        const guess = state.guesses[i];
        const statuses = state.statuses[i] || [];
        for (let j = 0; j < 5; j++) {
          const ch = guess[j], st = statuses[j];
          if (!ch || !st) continue;
          const current = letterStates[ch];
          if (!current || priority[st] > priority[current]) letterStates[ch] = st;
        }
      }
      return letterStates;
    }

    function isFinished() { return state.solved || state.revealed || state.lost; }
    function guessesLeft() { return Math.max(0, MAX_GUESSES - state.guesses.length); }
    function progressPercent() { if (state.solved || state.revealed || state.lost) return 100; return Math.min(100, Math.round((state.guesses.length / MAX_GUESSES) * 100)); }
    function correctLetterCount() {
      if (state.solved || state.revealed) return 5;
      let count = 0;
      for (let pos = 0; pos < 5; pos++) if (state.statuses.some(row => row && row[pos] === "correct")) count++;
      return count;
    }

    const KEYS = [["Q","W","E","R","T","Y","U","I","O","P"],["A","S","D","F","G","H","J","K","L"],["ENTER","Z","X","C","V","B","N","M","⌫"]];

    function renderGrid() {
      const activeRow = Math.min(state.guesses.length, MAX_GUESSES - 1);
      const revealedRow = state.revealed ? MAX_GUESSES - 1 : -1;
      let html = "";
      for (let r = 0; r < MAX_GUESSES; r++) {
        const isRevealedAnswerRow = r === revealedRow;
        const guess = isRevealedAnswerRow ? answer : (state.guesses[r] || "");
        const statuses = isRevealedAnswerRow ? Array(5).fill("revealed") : (state.statuses[r] || null);
        const draft = (r === activeRow && !isFinished()) ? state.current : "";
        html += `<div class="hpw-row">`;
        for (let c = 0; c < 5; c++) {
          const ch = guess ? (guess[c] || "") : (draft[c] || "");
          const classes = ["hpw-tile"];
          if (statuses && statuses[c]) classes.push(statuses[c]);
          else if (r === activeRow && !isFinished()) classes.push("hpw-active");
          html += `<div class="${classes.join(" ")}">${escapeHtml(ch)}</div>`;
        }
        html += `</div>`;
      }
      return html;
    }

    function renderKeyboard() {
      const states = computeLetterStates();
      return KEYS.map((row, i) => `<div class="hpw-kb-row" data-row="${i}">${row.map(key => {
        const cls = ["hpw-key"];
        if (key.length === 1 && states[key]) cls.push(states[key]);
        return `<button type="button" class="${cls.join(" ")}" data-k="${key}">${escapeHtml(key)}</button>`;
      }).join("")}</div>`).join("");
    }

    function getStatusMessage() {
      if (state.solved) return "Wordrow solved!";
      if (state.revealed) return "Answer revealed.";
      if (state.lost) return "Puzzle over.";
      if (state.current.length) return `Current guess: ${state.current.length}/5 letters.`;
      if (state.guesses.length) return "Next guess…";
      return "Guess the hidden word in 6 tries.";
    }

    function renderOverlayContent() {
      const badgeIdEl = mount.querySelector("#hpw-badge-id");
      const badgeMetaEl = mount.querySelector("#hpw-badge-meta");
      const iconEl = mount.querySelector("#hpw-overlay-icon");
      const titleEl = mount.querySelector("#hpw-overlay-title");
      const textEl = mount.querySelector("#hpw-overlay-text");
      if (!badgeIdEl || !badgeMetaEl || !iconEl || !titleEl || !textEl) return;
      badgeIdEl.textContent = `Wordrow #${puzzleId}`;
      badgeMetaEl.textContent = `Guesses: ${state.guesses.length}/${MAX_GUESSES}`;
      if (state.solved) {
        iconEl.textContent = "trophy"; iconEl.className = "material-symbols-outlined hpw-result-icon";
        titleEl.textContent = "You Solved the Wordrow Puzzle!";
        textEl.innerHTML = `<div class="hp-modal-lead">Congratulations — you found the hidden word.</div><div class="hp-modal-subtext">Play another Wordrow puzzle or explore more puzzles in the Puzzlers Hub.</div>`;
      } else if (state.revealed) {
        iconEl.textContent = "visibility"; iconEl.className = "material-symbols-outlined hpw-result-icon";
        titleEl.textContent = "Answer Revealed";
        textEl.innerHTML = `<div class="hp-modal-lead">The word was ${escapeHtml(answer)}.</div><div class="hp-modal-subtext">The answer is shown in the final row of the puzzle.</div>`;
      } else {
        iconEl.textContent = "sentiment_satisfied"; iconEl.className = "material-symbols-outlined hpw-result-icon";
        titleEl.textContent = "Puzzle Over";
        textEl.innerHTML = `<div class="hp-modal-lead">Good try — the word was ${escapeHtml(answer)}.</div><div class="hp-modal-subtext">Try another puzzle when you're ready.</div>`;
      }
    }

    function showOverlay() { renderOverlayContent(); const el = mount.querySelector("#hpw-overlay"); if (el) { el.classList.add("on"); el.setAttribute("aria-hidden","false"); } state.overlaySeen = false; saveState(); }
    function hideOverlay() { const el = mount.querySelector("#hpw-overlay"); if (el) { el.classList.remove("on"); el.setAttribute("aria-hidden","true"); } state.overlaySeen = true; saveState(); }
    function showHelpModal() { const el = mount.querySelector("#hpw-help-modal"); if (el) { el.classList.add("on"); el.setAttribute("aria-hidden","false"); } }
    function hideHelpModal() { const el = mount.querySelector("#hpw-help-modal"); if (el) { el.classList.remove("on"); el.setAttribute("aria-hidden","true"); } }
    function toast(message) { const el = mount.querySelector(".hpw-toast-msg"); if (el) el.textContent = message; }

    function render() {
      const progress = progressPercent();
      mount.innerHTML = `
        <div class="hpw-wrap">
          <div class="hpw-stats" aria-label="Wordrow puzzle progress">
            <div class="hpw-stat"><span class="hpw-stat-value">${state.guesses.length}/${MAX_GUESSES}</span><span class="hpw-stat-label">Guesses</span></div>
            <div class="hpw-stat"><span class="hpw-stat-value">${guessesLeft()}</span><span class="hpw-stat-label">Left</span></div>
            <div class="hpw-stat"><span class="hpw-stat-value">${correctLetterCount()}/5</span><span class="hpw-stat-label">Correct Letters</span></div>
          </div>

          <div class="hpw-progress" aria-hidden="true"><div class="hpw-progress-fill" style="width:${progress}%;"></div></div>
          <div class="hpw-toast" aria-live="polite"><span class="hpw-toast-msg">${escapeHtml(getStatusMessage())}</span></div>
          <div class="hpw-grid" id="hpw-grid">${renderGrid()}</div>
          <div class="hpw-kb" aria-label="Keyboard">${renderKeyboard()}</div>

          <div class="hpw-actions" aria-label="Wordrow puzzle controls">
            <button type="button" class="hpw-btn neutral" data-a="share">Share</button>
            <button type="button" class="hpw-btn reveal" data-a="reveal-answer">Reveal</button>
            <button type="button" class="hpw-btn danger" data-a="reset-puzzle">Reset Puzzle</button>
          </div>
        </div>

        <div class="hp-overlay" id="hpw-overlay" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Wordrow result">
            <div id="hpw-overlay-icon" class="material-symbols-outlined hpw-result-icon">trophy</div>
            <h3 id="hpw-overlay-title">You Solved the Wordrow Puzzle!</h3>
            <div class="hp-badges"><span class="hp-badge" id="hpw-badge-id"></span><span class="hp-badge" id="hpw-badge-meta"></span></div>
            <div id="hpw-overlay-text"></div>
            <div class="hp-modal-actions">
              <button type="button" class="hp-link-btn primary" data-a="next-puzzle">Play Your Next Puzzle</button>
              <a class="hp-link-btn secondary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
              <a class="hp-link-btn neutral" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>
              <button type="button" class="hp-link-btn neutral" data-a="share">Share</button>
              <button type="button" class="hp-link-btn neutral" data-a="close-overlay">Back to Puzzle</button>
            </div>
            <small>Hare Publishing • Wordrow</small>
          </div>
        </div>

        <div class="hp-overlay" id="hpw-help-modal" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Wordrow">
            <div class="material-symbols-outlined hpw-result-icon">help</div>
            <h3>How to Play Wordrow</h3>
            <div class="hp-badges"><span class="hp-badge">5-letter word</span><span class="hp-badge">6 guesses</span></div>
            <div class="hp-modal-help-text">
              <div class="hp-modal-subtext"><strong>Goal:</strong> Guess the hidden 5-letter word in 6 tries.</div>
              <div class="hp-modal-subtext"><strong style="color:#00A54F;">Green</strong> means the letter is correct and in the right spot.</div>
              <div class="hp-modal-subtext"><strong style="color:#F7941C;">Orange</strong> means the letter is in the word but in the wrong spot.</div>
              <div class="hp-modal-subtext"><strong style="color:#6b7280;">Gray</strong> means the letter is not in the word.</div>
              <div class="hp-modal-subtext">Use the on-screen keyboard or your physical keyboard. Press <strong>Enter</strong> to submit and <strong>Backspace</strong> to erase.</div>
            </div>
            <div class="hp-modal-actions"><button type="button" class="hp-link-btn primary full" data-a="close-help-modal">Back to Puzzle</button></div>
            <small>Hare Publishing • Wordrow</small>
          </div>
        </div>
      `;
      renderOverlayContent();
    }

    function resetPuzzle() { state = defaultState(); saveState(); render(); toast("Reset! Type your first guess."); }
    function revealAnswer() {
      if (isFinished()) return;
      if (!confirm("Reveal the answer? This will end the puzzle.")) return;
      state.current = ""; state.revealed = true; state.solved = false; state.lost = false; state.solvedAt = ""; state.finishedAt = new Date().toISOString(); if (!state.revealedAt) state.revealedAt = state.finishedAt; state.overlaySeen = false;
      saveState(); render(); showOverlay();
    }
    function submitGuess() {
      if (isFinished()) return;
      const guess = clean(state.current);
      if (guess.length !== 5) { toast("Need 5 letters."); return; }
      const statuses = evaluateGuess(guess);
      state.guesses.push(guess); state.statuses.push(statuses); state.current = "";
      if (guess === answer) { state.solved = true; state.revealed = false; state.lost = false; if (!state.solvedAt) state.solvedAt = new Date().toISOString(); state.finishedAt = state.solvedAt; state.revealedAt = ""; state.overlaySeen = false; saveState(); render(); showOverlay(); return; }
      if (state.guesses.length >= MAX_GUESSES) { state.lost = true; state.finishedAt = new Date().toISOString(); state.overlaySeen = false; saveState(); render(); showOverlay(); return; }
      saveState(); render(); toast("Next guess…");
    }
    function handleKey(key) {
      if (isFinished()) return;
      if (key === "ENTER") return submitGuess();
      if (key === "⌫" || key === "BACKSPACE" || key === "DELETE") { state.current = state.current.slice(0,-1); saveState(); render(); return; }
      if (/^[A-Z]$/.test(key) && state.current.length < 5) { state.current += key; saveState(); render(); }
    }
    function sharePuzzle() {
      const shareData = { title: `Wordrow #${puzzleId} — Hare Publishing`, text: state.solved ? `I solved Wordrow #${puzzleId} in ${state.guesses.length}/${MAX_GUESSES}!` : `I played Wordrow #${puzzleId}.`, url: window.location.href };
      if (navigator.share) { navigator.share(shareData).catch(()=>{}); return; }
      try { navigator.clipboard.writeText(window.location.href); toast("Link copied."); } catch { toast("Copy the link from your address bar."); }
    }

    container.onclick = e => {
      const link = e.target?.closest?.("a[href]"); if (link) return;
      const btn = e.target.closest("button,[data-a],[data-k]"); if (!btn) return;
      const key = btn.getAttribute("data-k"); const action = btn.getAttribute("data-a");
      if (key) return handleKey(key);
      if (action === "reset-puzzle") return resetPuzzle();
      if (action === "reveal-answer") return revealAnswer();
      if (action === "close-overlay") return hideOverlay();
      if (action === "close-help-modal") return hideHelpModal();
      if (action === "share") return sharePuzzle();
      if (action === "next-puzzle") { if (window.HareWordrowLoadPuzzle) { hideOverlay(); const nextBtn = document.querySelector("#hp-next-wordrow-slot [data-hp-load-puzzle]"); const id = nextBtn?.getAttribute("data-hp-load-puzzle"); if (id) window.HareWordrowLoadPuzzle(id, { scroll: false }); } }
    };

    container.onkeydown = e => {
      const tag = e.target?.tagName?.toLowerCase?.() || "";
      if (["input","textarea","select"].includes(tag) || e.target?.isContentEditable) return;
      const overlayEl = mount.querySelector("#hpw-overlay"); const helpEl = mount.querySelector("#hpw-help-modal");
      if (overlayEl?.classList.contains("on") || helpEl?.classList.contains("on")) { if (e.key === "Escape") { e.preventDefault(); hideOverlay(); hideHelpModal(); } return; }
      const key = e.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || key === "DELETE" || /^[A-Z]$/.test(key)) { e.preventDefault(); handleKey(key); }
    };

    mount.addEventListener("click", e => { const overlayEl = mount.querySelector("#hpw-overlay"); const helpEl = mount.querySelector("#hpw-help-modal"); if (overlayEl && e.target === overlayEl) hideOverlay(); if (helpEl && e.target === helpEl) hideHelpModal(); });

    recomputeStatus(); saveState(); render(); if ((state.solved || state.revealed || state.lost) && !state.overlaySeen) showOverlay();
  },

  openHelp(containerId = "hp-wordrow-container") {
    const container = document.getElementById(containerId);
    const modal = container?.querySelector("#hpw-help-modal");
    if (modal) { modal.classList.add("on"); modal.setAttribute("aria-hidden", "false"); }
  }
};

function injectStyles() {
  if (document.getElementById("hp-wordrow-platform-engine-styles")) return;
  const style = document.createElement("style");
  style.id = "hp-wordrow-platform-engine-styles";
  style.textContent = `
#hp-wordrow-container { width:100%; max-width:1000px; margin:0 auto; font-family:Roboto,Arial,sans-serif; color:#333; }
#hp-wordrow-container * { box-sizing:border-box !important; }
#hp-wordrow-container .hpw-wrap { max-width:760px; margin:0 auto; padding:0 8px 10px; }
#hp-wordrow-container .hpw-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:0 auto 12px; max-width:560px; }
#hp-wordrow-container .hpw-stat { background:#f8fafc; border:1px solid #e5edf3; border-radius:14px; padding:9px 8px; text-align:center; }
#hp-wordrow-container .hpw-stat-value { display:block; color:#007A3A; font-size:20px; font-weight:900; line-height:1; }
#hp-wordrow-container .hpw-stat-label { display:block; color:#333; font-size:12px; font-weight:900; margin-top:4px; }
#hp-wordrow-container .hpw-progress { height:8px; max-width:560px; margin:0 auto 12px; background:#eef3f6; border-radius:999px; overflow:hidden; }
#hp-wordrow-container .hpw-progress-fill { height:100%; background:#00A54F; border-radius:999px; transition:width .2s ease; }
#hp-wordrow-container .hpw-toast { max-width:560px; margin:0 auto 14px; padding:10px 14px; border-radius:12px; background:#f7f9fb; border:1px solid #dde7ef; text-align:center; font-size:14px; font-weight:900; color:#333; }
#hp-wordrow-container .hpw-grid { display:grid; grid-template-rows:repeat(6,1fr); gap:8px; width:min(330px,100%); margin:0 auto 18px; }
#hp-wordrow-container .hpw-row { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
#hp-wordrow-container .hpw-tile { aspect-ratio:1/1; min-height:0; border-radius:12px; border:2px solid #d1d5db; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:900; background:#fff; color:#000; user-select:none; }
#hp-wordrow-container .hpw-tile.hpw-active { box-shadow:inset 0 0 0 4px #107FBB; }
#hp-wordrow-container .hpw-tile.correct, #hp-wordrow-container .hpw-key.correct { background:#00A54F; border-color:#00A54F; color:#fff; }
#hp-wordrow-container .hpw-tile.present, #hp-wordrow-container .hpw-key.present { background:#F7941C; border-color:#F7941C; color:#fff; }
#hp-wordrow-container .hpw-tile.absent, #hp-wordrow-container .hpw-key.absent { background:#9AA0A6; border-color:#9AA0A6; color:#fff; }
#hp-wordrow-container .hpw-tile.revealed { background:#107FBB; border-color:#107FBB; color:#fff; }
#hp-wordrow-container .hpw-kb { width:100%; max-width:620px; margin:0 auto 14px; }
#hp-wordrow-container .hpw-kb-row { width:100%; display:grid; gap:6px; margin:0 0 7px; align-items:stretch; }
#hp-wordrow-container .hpw-kb-row[data-row="0"] { grid-template-columns:repeat(10,1fr); }
#hp-wordrow-container .hpw-kb-row[data-row="1"] { grid-template-columns:repeat(9,1fr); max-width:560px; margin-left:auto; margin-right:auto; }
#hp-wordrow-container .hpw-kb-row[data-row="2"] { grid-template-columns:1.7fr repeat(7,1fr) 1.3fr; }
#hp-wordrow-container .hpw-key, #hp-wordrow-container .hpw-btn, #hp-wordrow-container .hp-link-btn { appearance:none; -webkit-appearance:none; border-radius:12px; font-weight:900; cursor:pointer; transition:transform .08s ease, background .2s ease; }
#hp-wordrow-container .hpw-key { width:100%; padding:12px 4px; border:1px solid #ddd; font-size:15px; background:#fff; line-height:1; display:flex; align-items:center; justify-content:center; color:#333; }
#hp-wordrow-container .hpw-key:hover, #hp-wordrow-container .hpw-btn:hover, #hp-wordrow-container .hp-link-btn:hover { transform:translateY(-1px); }
#hp-wordrow-container .hpw-actions { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin:14px auto 0; }
#hp-wordrow-container .hpw-btn { border:2px solid #BFEBD3; background:#fff; color:#007A3A; padding:10px 14px; font-size:14px; }
#hp-wordrow-container .hpw-btn.reveal { border-color:#F7941C; color:#C86E00; }
#hp-wordrow-container .hpw-btn.danger { border-color:#ED1B24; color:#ED1B24; }
#hp-wordrow-container .hp-overlay { display:none; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,.45); align-items:center; justify-content:center; padding:20px; }
#hp-wordrow-container .hp-overlay.on { display:flex; }
#hp-wordrow-container .hp-modal { width:min(520px,100%); background:#fff; border-radius:20px; padding:24px; box-shadow:0 20px 70px rgba(0,0,0,.2); text-align:center; }
#hp-wordrow-container .hp-modal h3 { margin:8px 0 12px; color:#007A3A; font-size:24px; }
#hp-wordrow-container .hpw-result-icon { font-family:"Material Symbols Outlined"; font-size:34px; line-height:1; color:#007A3A; font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24; }
#hp-wordrow-container .hp-badges { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:8px 0 14px; }
#hp-wordrow-container .hp-badge { background:#EAF8F0; border:1px solid #BFEBD3; color:#007A3A; border-radius:999px; padding:5px 10px; font-size:12px; font-weight:900; }
#hp-wordrow-container .hp-modal-lead { font-size:18px; font-weight:900; color:#111; margin-bottom:8px; }
#hp-wordrow-container .hp-modal-subtext { font-size:14px; color:#555; line-height:1.45; margin-bottom:6px; }
#hp-wordrow-container .hp-modal-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:16px; }
#hp-wordrow-container .hp-link-btn { border:2px solid #BFEBD3; background:#fff; color:#007A3A; text-decoration:none; padding:11px 12px; font-size:14px; display:flex; align-items:center; justify-content:center; }
#hp-wordrow-container .hp-link-btn.primary { background:#00A54F; border-color:#00A54F; color:#fff; }
#hp-wordrow-container .hp-link-btn.secondary { border-color:#107FBB; color:#107FBB; }
#hp-wordrow-container .hp-link-btn.full { grid-column:span 2; }
#hp-wordrow-container .hp-modal small { display:block; margin-top:10px; color:#777; font-size:12px; }
@media (max-width: 700px) { #hp-wordrow-container .hpw-kb-row { gap:4px; } #hp-wordrow-container .hpw-key { font-size:13px; padding:11px 2px; } #hp-wordrow-container .hpw-grid { width:min(300px,100%); gap:7px; } #hp-wordrow-container .hpw-row { gap:7px; } #hp-wordrow-container .hpw-tile { border-radius:10px; font-size:22px; } #hp-wordrow-container .hp-modal-actions { grid-template-columns:1fr; } #hp-wordrow-container .hp-link-btn.full { grid-column:span 1; } }
@media (max-width: 420px) { #hp-wordrow-container .hpw-stats { grid-template-columns:1fr; } #hp-wordrow-container .hpw-grid { width:min(280px,100%); } }
`;
  document.head.appendChild(style);
}

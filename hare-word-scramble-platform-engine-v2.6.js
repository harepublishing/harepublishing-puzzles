/* =========================================================
   HARE PUBLISHING WORD SCRAMBLE PLATFORM ENGINE
   Version: 2.1
   Self-contained platform engine. Does not rely on Squarespace CSS injection.
   Exposes: window.HareWordScramblePlatformEngine
   Storage prefix: hp_wsc_
   ========================================================= */

window.HareWordScramblePlatformEngine = (() => {
  const VERSION = "word-scramble-platform-engine-v2.1";
  const Core = window.HarePuzzleCore || null;
  const STORAGE_PREFIX = "hp_wsc_";
  const MORE_PUZZLES_URL = "https://www.harepublishing.com/online-puzzles";
  const SHOP_URL = "https://www.harepublishing.com/shop";

  const wordScrambleStatusAdapter = {
    isSolved(data) {
      return Boolean(data && !this.isRevealed(data) && (
        data.solved || data.completed || data.isSolved ||
        data.status === "solved" || data.status === "complete" ||
        data.completedAt || data.solvedAt
      ));
    },
    isRevealed(data) {
      return Boolean(data && (data.revealed || data.revealedAt || data.status === "revealed" || (Array.isArray(data.revealedWords) && data.revealedWords.length > 0)));
    },
    isFinished(data) {
      return Boolean(data && (
        data.solved || data.revealed || data.completed || data.isSolved ||
        data.status === "solved" || data.status === "complete" || data.status === "revealed" ||
        data.completedAt || data.solvedAt || data.revealedAt || data.finishedAt
      ));
    },
    hasProgress(data) {
      if (!data || this.isFinished(data)) return false;
      return Boolean(
        (Array.isArray(data.solvedWords) && data.solvedWords.length > 0) ||
        (Array.isArray(data.revealedWords) && data.revealedWords.length > 0) ||
        String(data.currentGuess || "").length > 0 ||
        data.currentWordId ||
        data.startedAt || data.updatedAt || data.lastPlayedAt
      );
    },
    finishedDate(data) {
      if (!data) return null;
      return data.completedAt || data.solvedAt || data.revealedAt || data.finishedAt || data.updatedAt || data.lastPlayedAt || null;
    }
  };

  const CSS = `
    #hp-wordscramble-container,
    #hp-wordscramble-container * { box-sizing:border-box; }

    #hp-wordscramble-container .hpwsc-shell,
    #hp-wordscramble-container .hpwsc-card { overflow:visible !important; }

    #hp-wordscramble-container .hpwsc-card {
      position:relative;
      border:0;
      box-shadow:none;
      padding:0;
      background:transparent;
      min-height:0;
      font-family:Roboto,Arial,sans-serif;
      color:#222;
    }


    #hp-wordscramble-container .hpwsc-layout {
      display:grid;
      grid-template-columns:minmax(0,1fr) 235px;
      gap:18px;
      align-items:stretch;
      width:100%;
      max-width:1040px;
      margin:0 auto;
    }

    #hp-wordscramble-container .hpwsc-panel {
      background:#fff;
      border:1px solid #e9eef3;
      border-radius:18px;
      padding:16px;
      box-shadow:0 8px 24px rgba(0,0,0,.055);
      min-height:0;
    }

    #hp-wordscramble-container .hpwsc-puzzle-panel {
      display:flex;
      flex-direction:column;
      justify-content:flex-start;
      min-height:575px;
    }


    #hp-wordscramble-container .hpwsc-theme {
      margin:0 0 14px;
      color:#167966;
      font-size:24px;
      line-height:1.15;
      font-weight:900;
      text-align:center;
      text-transform:none;
      letter-spacing:0;
    }

    #hp-wordscramble-container .hpwsc-info-panel {
      border:1px solid #BFE7DF;
      background:#F2FBF8;
      border-radius:16px;
      padding:12px;
      margin:0 0 14px;
      color:#3d4b58;
    }

    #hp-wordscramble-container .hpwsc-info-buttons {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:8px;
      margin-bottom:10px;
    }

    #hp-wordscramble-container .hpwsc-info-body {
      height:74px;
      min-height:74px;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      gap:4px;
      background:#fff;
      border:1px solid #dcebe7;
      border-radius:14px;
      padding:10px 12px;
      font-size:14px;
      line-height:1.25;
      font-weight:800;
      color:#3d4b58;
      text-align:center;
      overflow:hidden;
    }

    #hp-wordscramble-container .hpwsc-info-main {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:6px;
      flex-wrap:wrap;
      font-size:15px;
      line-height:1.2;
      font-weight:900;
    }

    #hp-wordscramble-container .hpwsc-info-icon {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      font-family:'Material Symbols Outlined';
      font-size:18px;
      line-height:1;
      vertical-align:-3px;
      font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24;
    }

    #hp-wordscramble-container .hpwsc-info-sub {
      display:block;
      font-size:13px;
      line-height:1.25;
      font-weight:800;
    }

    #hp-wordscramble-container .hpwsc-info-body strong {
      color:#167966;
      font-weight:900;
    }

    #hp-wordscramble-container .hpwsc-info-body.is-success {
      background:#f3fff9;
      border-color:#bdeed4;
      color:#08753d;
    }

    #hp-wordscramble-container .hpwsc-info-body.is-revealed {
      background:#edf6ff;
      border-color:#b9d7ef;
      color:#0F7FBB;
    }

    #hp-wordscramble-container .hpwsc-info-body.is-error {
      background:#fff5f5;
      border-color:#ffb4b4;
      color:#ED1B24;
    }

    #hp-wordscramble-container .hpwsc-info-footer {
      margin-top:10px;
      padding-top:8px;
      border-top:1px solid rgba(37,162,141,.18);
      text-align:center;
      font-size:12px;
      font-weight:900;
      color:#167966;
    }

    #hp-wordscramble-container .hpwsc-progress-wrap {
      margin:0 0 14px;
    }

    #hp-wordscramble-container .hpwsc-progress-line {
      display:flex;
      justify-content:space-between;
      gap:10px;
      align-items:center;
      margin-bottom:8px;
      font-size:13px;
      font-weight:900;
      color:#555;
    }

    #hp-wordscramble-container .hpwsc-progress-bar {
      height:12px;
      background:#f1f5f8;
      border:1px solid #dde7ef;
      border-radius:999px;
      overflow:hidden;
    }

    #hp-wordscramble-container .hpwsc-progress-fill {
      height:100%;
      width:0%;
      background:#25A28D;
      border-radius:999px;
      transition:width .2s ease;
    }

    #hp-wordscramble-container .hpwsc-slots,
    #hp-wordscramble-container .hpwsc-bank {
      display:flex;
      flex-wrap:nowrap;
      justify-content:center;
      gap:clamp(4px,1.1vw,8px);
      margin:0 auto 14px;
      width:100%;
      max-width:820px;
    }

    #hp-wordscramble-container .hpwsc-slot,
    #hp-wordscramble-container .hpwsc-letter {
      width:clamp(30px,5vw,46px);
      min-width:0;
      flex:0 1 46px;
      height:clamp(42px,6vw,52px);
      border:2px solid #d1d5db;
      border-radius:14px;
      background:#fff;
      color:#111;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      font-size:clamp(18px,3.1vw,25px);
      line-height:1;
      font-weight:900;
      text-transform:uppercase;
      font-family:inherit;
      user-select:none;
    }

    #hp-wordscramble-container .hpwsc-slot.has-letter {
      border-color:#0F7FBB;
      box-shadow:inset 0 0 0 2px #0F7FBB;
    }

    #hp-wordscramble-container .hpwsc-letter {
      cursor:pointer;
      background:#fff8ef;
      border-color:#BFE7DF;
      color:#167966;
      transition:all .18s ease;
    }

    #hp-wordscramble-container .hpwsc-letter:hover:not(:disabled) {
      transform:translateY(-1px);
      background:#25A28D;
      border-color:#25A28D;
      color:#fff;
    }

    #hp-wordscramble-container .hpwsc-letter:disabled {
      opacity:.32;
      cursor:not-allowed;
    }

    #hp-wordscramble-container .hpwsc-current.word-len-9 .hpwsc-slot,
    #hp-wordscramble-container .hpwsc-current.word-len-9 .hpwsc-letter,
    #hp-wordscramble-container .hpwsc-current.word-len-10 .hpwsc-slot,
    #hp-wordscramble-container .hpwsc-current.word-len-10 .hpwsc-letter {
      width:clamp(28px,4.3vw,42px);
      flex:0 1 42px;
      font-size:clamp(17px,2.8vw,23px);
    }

    #hp-wordscramble-container .hpwsc-current.word-len-10 .hpwsc-slots,
    #hp-wordscramble-container .hpwsc-current.word-len-10 .hpwsc-bank {
      gap:clamp(3px,.8vw,6px);
    }

    #hp-wordscramble-container .hpwsc-clue-box {
      border:1px solid #dde7ef;
      background:#f7f9fb;
      border-radius:14px;
      padding:12px;
      margin:0 0 14px;
      color:#3d4b58;
      font-size:14px;
      line-height:1.4;
      font-weight:700;
    }

    #hp-wordscramble-container .hpwsc-hint-buttons {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:8px;
      margin:0 0 12px;
    }

    #hp-wordscramble-container .hpwsc-btn.hint-toggle {
      background:#fff;
      color:#167966;
      border-color:#BFE7DF;
    }

    #hp-wordscramble-container .hpwsc-btn.hint-toggle:hover,
    #hp-wordscramble-container .hpwsc-btn.hint-toggle.is-on {
      background:#25A28D;
      border-color:#25A28D;
      color:#fff;
      transform:translateY(-1px);
    }

    #hp-wordscramble-container .hpwsc-hint-output {
      display:grid;
      gap:8px;
      margin:0 0 14px;
    }

    #hp-wordscramble-container .hpwsc-clue-box.is-hidden {
      display:none;
    }

    #hp-wordscramble-container .hpwsc-controls,
    #hp-wordscramble-container .hpwsc-actions {
      display:flex;
      flex-wrap:wrap;
      justify-content:center;
      gap:10px;
      margin-top:10px;
    }

    #hp-wordscramble-container .hpwsc-btn,
    #hp-wordscramble-container .hp-link-btn {
      font-family:inherit;
      cursor:pointer;
      text-decoration:none;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      border-radius:12px;
      min-height:40px;
      padding:9px 15px;
      font-size:13px;
      font-weight:900;
      border:2px solid transparent;
      transition:all .18s ease;
    }


    #hp-wordscramble-container .hpwsc-controls .hpwsc-btn {
      min-width:112px;
    }

    #hp-wordscramble-container .hpwsc-btn.primary,
    #hp-wordscramble-container .hp-link-btn.primary {
      background:#25A28D;
      border-color:#25A28D;
      color:#fff;
    }

    #hp-wordscramble-container .hpwsc-btn.primary:hover,
    #hp-wordscramble-container .hp-link-btn.primary:hover {
      background:#fff;
      color:#167966;
      border-color:#BFE7DF;
      transform:translateY(-1px);
    }

    #hp-wordscramble-container .hpwsc-btn.secondary,
    #hp-wordscramble-container .hp-link-btn.secondary {
      background:#fff;
      color:#167966;
      border-color:#BFE7DF;
    }

    #hp-wordscramble-container .hpwsc-btn.secondary:hover,
    #hp-wordscramble-container .hp-link-btn.secondary:hover {
      background:#25A28D;
      border-color:#25A28D;
      color:#fff;
      transform:translateY(-1px);
    }

    #hp-wordscramble-container .hpwsc-btn.danger,
    #hp-wordscramble-container .hp-link-btn.danger {
      background:#fff;
      color:#ED1B24;
      border-color:#ffb4b4;
    }

    #hp-wordscramble-container .hpwsc-btn.danger:hover,
    #hp-wordscramble-container .hp-link-btn.danger:hover {
      background:#ED1B24;
      border-color:#ED1B24;
      color:#fff;
      transform:translateY(-1px);
    }

    #hp-wordscramble-container .hpwsc-word-panel {
      display:flex;
      flex-direction:column;
      min-height:575px;
    }

    #hp-wordscramble-container .hpwsc-word-panel h3 {
      margin:0 0 8px;
      color:#167966;
      font-size:18px;
      font-weight:900;
      text-align:center;
    }

    #hp-wordscramble-container .hpwsc-word-list {
      display:grid;
      gap:7px;
      flex:1 1 auto;
      min-height:0;
      max-height:545px;
      overflow:auto;
      padding-right:3px;
      overscroll-behavior:contain;
    }

    #hp-wordscramble-container .hpwsc-word-item {
      width:100%;
      border:1px solid #dde7ef;
      background:#fff;
      color:#222;
      border-radius:12px;
      padding:8px 10px;
      font-family:inherit;
      font-size:14px;
      font-weight:900;
      text-align:left;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      transition:all .18s ease;
    }

    #hp-wordscramble-container .hpwsc-word-item:hover:not(:disabled),
    #hp-wordscramble-container .hpwsc-word-item.is-active {
      border-color:#25A28D;
      background:#EAF8F5;
      color:#167966;
    }

    #hp-wordscramble-container .hpwsc-word-item.is-solved {
      border-color:#bdeed4;
      background:#f3fff9;
      color:#00813f;
    }

    #hp-wordscramble-container .hpwsc-word-item.is-revealed {
      border-color:#b9d7ef;
      background:#edf6ff;
      color:#0F7FBB;
    }

    #hp-wordscramble-container .hpwsc-word-check {
      font-weight:900;
      color:#00A54F;
      flex:0 0 auto;
    }

    #hp-wordscramble-container .hpwsc-word-item.is-revealed .hpwsc-word-check {
      color:#0F7FBB;
    }

    #hp-wordscramble-container .material-symbols-outlined {
      font-family:"Material Symbols Outlined";
      font-weight:normal;
      font-style:normal;
      font-size:20px;
      line-height:1;
      letter-spacing:normal;
      text-transform:none;
      display:inline-flex;
      white-space:nowrap;
      word-wrap:normal;
      direction:ltr;
      -webkit-font-feature-settings:"liga";
      -webkit-font-smoothing:antialiased;
      font-variation-settings:'FILL' 1,'wght' 650,'GRAD' 0,'opsz' 24;
    }

    #hp-wordscramble-container .hp-overlay {
      display:none;
      align-items:center;
      justify-content:center;
    }

    #hp-wordscramble-container .hp-overlay.on { display:flex; }

    #hp-wordscramble-container #hp-wsc-overlay {
      position:absolute;
      inset:0;
      z-index:50;
      background:rgba(255,255,255,.76);
      border-radius:18px;
      padding:16px;
    }

    #hp-wordscramble-container #hp-wsc-help-modal {
      position:fixed;
      inset:0;
      z-index:99999;
      background:rgba(0,0,0,.45);
      padding:20px;
    }

    #hp-wordscramble-container .hp-modal {
      background:#fff;
      width:min(560px,100%);
      border-radius:22px;
      padding:26px;
      box-shadow:0 20px 70px rgba(0,0,0,.25);
      text-align:center;
      color:#222;
    }

    #hp-wordscramble-container #hp-wsc-overlay .hp-modal {
      width:min(500px,100%);
      padding:24px 24px 22px;
      border-radius:18px;
      box-shadow:0 18px 48px rgba(0,0,0,.18);
    }

    #hp-wordscramble-container #hp-wsc-overlay-icon {
      font-size:28px !important;
      color:#167966;
      display:inline-flex;
      align-items:center;
      justify-content:center;
    }

    #hp-wordscramble-container .hp-modal h3 {
      margin:8px 0 14px;
      font-size:24px;
      line-height:1.15;
      color:#167966;
    }

    #hp-wordscramble-container .hp-result-meta { margin:8px 0 18px; text-align:center; }
    #hp-wordscramble-container .hp-result-puzzle-title { display:block; color:#167966; font-size:19px; line-height:1.2; font-weight:900; margin-bottom:12px; }
    #hp-wordscramble-container .hp-result-stats-line { display:flex; flex-wrap:wrap; justify-content:center; align-items:center; gap:8px 12px; color:#555; font-size:12px; line-height:1.25; font-weight:800; }
    #hp-wordscramble-container .hp-result-stat-chip { display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
    #hp-wordscramble-container .hp-result-stat-chip .material-symbols-outlined { font-size:16px; color:#167966; }
    #hp-wordscramble-container .hp-result-stat-chip strong { color:#167966; font-weight:900; }

    #hp-wordscramble-container .hp-recommend-card {
      margin:16px auto 0;
      padding:14px 16px;
      max-width:420px;
      border-radius:16px;
      background:#EAF8F5;
      border:1px solid #BFE7DF;
    }

    #hp-wordscramble-container .hp-recommend-title { font-size:14px; font-weight:900; color:#167966; margin-bottom:4px; }
    #hp-wordscramble-container .hp-recommend-copy { font-size:12px; color:#555; line-height:1.3; margin-bottom:8px; }
    #hp-wordscramble-container .hp-modal-lead { font-size:15px; font-weight:900; margin-bottom:6px; }
    #hp-wordscramble-container .hp-modal-subtext { font-size:13px; color:#555; line-height:1.3; margin-bottom:4px; }

    #hp-wordscramble-container .hp-modal-actions {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:8px;
      margin-top:12px;
    }

    #hp-wordscramble-container #hp-wsc-overlay .hp-link-btn { min-height:36px; padding:8px 10px; font-size:12px; }
    #hp-wordscramble-container .hp-link-btn.neutral { background:#fff; color:#333; border-color:#e1e5ea; }
    #hp-wordscramble-container .hp-link-btn.neutral:hover { background:#25A28D; color:#fff; border-color:#25A28D; transform:translateY(-1px); }
    #hp-wordscramble-container .hp-link-btn.share { background:#fff9f0; color:#167966; border-color:#BFE7DF; box-shadow:0 4px 12px rgba(247,148,28,.14); }
    #hp-wordscramble-container .hp-link-btn.share:hover { background:#25A28D; color:#fff; border-color:#25A28D; transform:translateY(-1px); }
    #hp-wordscramble-container .hp-link-btn.full { grid-column:1/-1; }

    #hp-wordscramble-container .hp-help-modal-content { text-align:left; background:#f7f9fb; border:1px solid #dce8f2; border-radius:16px; padding:18px; margin:14px 0 6px; }
    #hp-wordscramble-container .hp-help-modal-content p { margin:0 0 12px; font-size:15px; line-height:1.45; color:#3d4b58; }
    #hp-wordscramble-container .hp-help-modal-content p:last-child { margin-bottom:0; }
    #hp-wordscramble-container .hp-modal small { display:block; margin-top:10px; color:#777; font-size:11px; }

    @media(max-width:900px){
      #hp-wordscramble-container .hpwsc-layout { grid-template-columns:1fr; }
      #hp-wordscramble-container .hpwsc-word-list { max-height:440px; }
    }

    @media(max-width:560px){
      #hp-wordscramble-container .hpwsc-panel { padding:13px; }
      #hp-wordscramble-container .hpwsc-info-buttons { grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
      #hp-wordscramble-container .hpwsc-info-buttons .hpwsc-btn { min-height:38px; padding:8px 5px; font-size:12px; border-radius:11px; }
      #hp-wordscramble-container .hpwsc-controls { flex-wrap:nowrap; gap:8px; }
      #hp-wordscramble-container .hpwsc-controls .hpwsc-btn { min-width:0; flex:1 1 0; padding:9px 7px; font-size:13px; }
      #hp-wordscramble-container .hpwsc-actions { margin-top:10px; }
      #hp-wordscramble-container .hpwsc-info-body { height:82px; min-height:82px; }
      #hp-wordscramble-container .hpwsc-slots,
      #hp-wordscramble-container .hpwsc-bank { gap:4px; max-width:100%; overflow:hidden; }
      #hp-wordscramble-container .hpwsc-slot,
      #hp-wordscramble-container .hpwsc-letter { width:clamp(24px,7.2vw,36px); min-width:0; flex:0 1 36px; height:clamp(40px,11vw,45px); border-radius:12px; font-size:clamp(17px,5.6vw,22px); }
      #hp-wordscramble-container .hpwsc-current.word-len-8 .hpwsc-slot,
      #hp-wordscramble-container .hpwsc-current.word-len-8 .hpwsc-letter,
      #hp-wordscramble-container .hpwsc-current.word-len-9 .hpwsc-slot,
      #hp-wordscramble-container .hpwsc-current.word-len-9 .hpwsc-letter,
      #hp-wordscramble-container .hpwsc-current.word-len-10 .hpwsc-slot,
      #hp-wordscramble-container .hpwsc-current.word-len-10 .hpwsc-letter { width:clamp(22px,6.7vw,32px); flex:0 1 32px; height:clamp(38px,10.5vw,43px); font-size:clamp(16px,5vw,20px); }
      #hp-wordscramble-container .hpwsc-current.word-len-9 .hpwsc-slots,
      #hp-wordscramble-container .hpwsc-current.word-len-9 .hpwsc-bank,
      #hp-wordscramble-container .hpwsc-current.word-len-10 .hpwsc-slots,
      #hp-wordscramble-container .hpwsc-current.word-len-10 .hpwsc-bank { gap:3px; }
      #hp-wordscramble-container .hp-modal-actions { grid-template-columns:1fr; }
      #hp-wordscramble-container .hp-link-btn.full { grid-column:auto; }
    }

    @media(max-width:380px){
      #hp-wordscramble-container .hpwsc-info-buttons { grid-template-columns:repeat(2,minmax(0,1fr)); }
      #hp-wordscramble-container .hpwsc-info-buttons .hpwsc-btn:nth-child(3) { grid-column:1/-1; width:64%; justify-self:center; }
      #hp-wordscramble-container .hpwsc-controls { gap:6px; }
      #hp-wordscramble-container .hpwsc-controls .hpwsc-btn { font-size:12px; padding:8px 5px; }
    }

  `;

  function injectStyles(){
    if (document.getElementById("hp-word-scramble-platform-engine-css-v24")) return;
    const style = document.createElement("style");
    style.id = "hp-word-scramble-platform-engine-css-v24";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  let container = null;
  let mount = null;
  let puzzle = null;
  let state = null;
  let puzzleTitle = "Word Scramble Puzzle";
  let puzzleData = [];
  let keyboardActive = false;

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>\"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  }
  function injectSchema(){
    if(!puzzle) return;

    const existing = document.getElementById("hp-schema-word-scramble");
    if(existing) existing.remove();

    const puzzleId = String(puzzle.puzzleId || "").trim();
    const puzzleDate = String(puzzle.puzzleDate || puzzle.date || "").trim();
    const pageUrl = window.location.href;

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Game",
      "name": puzzleId ? `Word Scramble Puzzle #${puzzleId}` : "Word Scramble Puzzle",
      "description": puzzleId
        ? `Play Word Scramble Puzzle #${puzzleId} online from Hare Publishing.`
        : "Play Word Scramble online from Hare Publishing.",
      "genre": "Puzzle",
      "url": pageUrl,
      "inLanguage": "en",
      ...(puzzleDate ? { "datePublished": puzzleDate } : {}),
      "publisher": {
        "@type": "Organization",
        "name": "Hare Publishing",
        "url": "https://www.harepublishing.com"
      },
      "isPartOf": {
        "@type": "CollectionPage",
        "name": "Word Scramble",
        "url": "https://www.harepublishing.com/word-scramble"
      }
    };

    const script = document.createElement("script");
    script.id = "hp-schema-word-scramble";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);
  }

  function normalizeWord(value){ return String(value || "").toUpperCase().replace(/[^A-Z]/g, ""); }
  function storageKey(){ return puzzle?.storageKey || `${STORAGE_PREFIX}${puzzle?.puzzleId || "unknown"}`; }
  function hashString(str){ let h = 1779033703 ^ str.length; for (let i=0;i<str.length;i++){ h=Math.imul(h^str.charCodeAt(i),3432918353); h=(h<<13)|(h>>>19); } return h>>>0; }
  function mulberry32(a){ return function(){ let t=a+=0x6D2B79F5; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
  function shuffleDeterministic(chars, seed){ const rand=mulberry32(hashString(seed)); const copy=[...chars]; for(let i=copy.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; } return copy; }

  function defaultState(){
    return { solvedWords:[], revealedWords:[], currentWordId:"", currentGuess:"", usedLetterIds:[], showHint1:false, showHint2:false, solved:false, revealed:false, status:"in-progress", solvedAt:"", completedAt:"", revealedAt:"", updatedAt:"", lastPlayedAt:"", startedAt:"" };
  }
  function readState(){
    try { const raw=localStorage.getItem(storageKey()); return raw ? {...defaultState(), ...JSON.parse(raw)} : defaultState(); }
    catch { return defaultState(); }
  }
  function writeState(){
    if (!puzzle) return;
    try { state.updatedAt=new Date().toISOString(); state.lastPlayedAt=state.updatedAt; if(!state.startedAt) state.startedAt=state.updatedAt; localStorage.setItem(storageKey(), JSON.stringify(state)); } catch {}
  }
  function isEnded(){ return Boolean(state?.solved || state?.revealed); }
  function solvedSet(){ return new Set(Array.isArray(state.solvedWords) ? state.solvedWords : []); }
  function revealedSet(){ return new Set(Array.isArray(state.revealedWords) ? state.revealedWords : []); }
  function completedSet(){ return new Set([...solvedSet(), ...revealedSet()]); }
  function solvedCount(){ return solvedSet().size; }
  function completedCount(){ return completedSet().size; }
  function remainingCount(){ return Math.max(0, puzzleData.length - completedCount()); }
  function progressPercent(){ return puzzleData.length ? (completedCount()/puzzleData.length)*100 : 0; }
  function isAllSolved(){ return puzzleData.length > 0 && solvedCount() >= puzzleData.length && revealedSet().size === 0; }
  function isAllCompleted(){ return puzzleData.length > 0 && completedCount() >= puzzleData.length; }

  function getStoredItems(){
    if (Core && typeof Core.getStoredItems === "function") return Core.getStoredItems(STORAGE_PREFIX);
    const items=[]; for(let i=0;i<localStorage.length;i++){ const key=localStorage.key(i); if(!key||!key.startsWith(STORAGE_PREFIX)) continue; try{items.push({key,data:JSON.parse(localStorage.getItem(key)||"{}")});}catch{} }
    return items;
  }
  function getDateKey(date){ return Core && typeof Core.localDateKey === "function" ? Core.localDateKey(date) : date.toISOString().slice(0,10); }
  function getCurrentStreak(items){
    const completedDates=new Set();
    items.forEach(item=>{ const raw=item.data.completedAt||item.data.solvedAt; if(!raw) return; const d=new Date(raw); if(!isNaN(d)) completedDates.add(getDateKey(d)); });
    let streak=0; const today=new Date();
    for(let i=0;i<3650;i++){ const d=new Date(today); d.setDate(today.getDate()-i); if(completedDates.has(getDateKey(d))) streak++; else if(i===0) continue; else break; }
    return streak;
  }
  function getStats(){
    const items=getStoredItems(); const a=wordScrambleStatusAdapter;
    const solvedItems=items.filter(item=>a.isSolved(item.data));
    const revealedItems=items.filter(item=>a.isRevealed(item.data));
    const inProgressItems=items.filter(item=>!a.isFinished(item.data)&&a.hasProgress(item.data));
    const playedItems=items.filter(item=>a.isFinished(item.data)||a.hasProgress(item.data));
    return { streak:getCurrentStreak(solvedItems), solved:solvedItems.length, revealed:revealedItems.length, inProgress:inProgressItems.length, played:playedItems.length };
  }

  function getCurrentEntry(){
    const explicit=puzzleData.find(item=>item.id===state.currentWordId);
    if (explicit) return explicit;
    const completed=completedSet();
    const next=puzzleData.find(item=>!completed.has(item.answer));
    if (next) { state.currentWordId=next.id; return next; }
    return puzzleData[0] || null;
  }

  function isEntryCompleted(entry){
    return Boolean(entry && completedSet().has(entry.answer));
  }
  function currentLetters(){
    const entry=getCurrentEntry(); if(!entry) return [];
    return entry.scrambled.split("").map((letter,index)=>({id:`${entry.id}-${index}`,letter}));
  }
  function statusMessage(){
    if (state.solved) return "Word Scramble solved!";
    if (state.revealed) return "Word Scramble completed with one or more revealed words.";
    return "Choose a scrambled word, use the hints if needed, and build the answer.";
  }

  function recomputeState(){
    state.solvedWords = Array.from(new Set((Array.isArray(state.solvedWords) ? state.solvedWords : []).map(normalizeWord))).filter(Boolean);
    state.revealedWords = Array.from(new Set((Array.isArray(state.revealedWords) ? state.revealedWords : []).map(normalizeWord))).filter(Boolean).filter(word => !state.solvedWords.includes(word));
    state.showHint1 = Boolean(state.showHint1);
    state.showHint2 = Boolean(state.showHint2);

    if (isAllCompleted()) {
      if (revealedSet().size > 0) {
        state.solved=false;
        state.completed=false;
        state.revealed=true;
        state.status="revealed";
        if(!state.revealedAt) state.revealedAt=new Date().toISOString();
      } else {
        state.solved=true;
        state.completed=true;
        state.revealed=false;
        state.status="solved";
        if(!state.solvedAt) state.solvedAt=new Date().toISOString();
        if(!state.completedAt) state.completedAt=state.solvedAt;
      }
    } else {
      state.solved=false;
      state.completed=false;
      state.revealed=false;
      state.status="in-progress";
    }
  }

  function addLetter(letterId){
    if(isEnded()) return;
    const entry=getCurrentEntry(); if(!entry || isEntryCompleted(entry)) return;
    const letters=currentLetters(); const found=letters.find(item=>item.id===letterId); if(!found) return;
    if(state.usedLetterIds.includes(letterId)) return;
    if(state.currentGuess.length >= entry.answer.length) return;
    state.currentGuess += found.letter;
    state.usedLetterIds.push(letterId);
    updateAfterChange("progress", false);
  }
  function deleteLetter(){
    if(isEnded() || isEntryCompleted(getCurrentEntry())) return;
    if(!state.currentGuess.length) return;
    state.currentGuess=state.currentGuess.slice(0,-1);
    state.usedLetterIds.pop();
    updateAfterChange("progress", false);
  }
  function clearGuess(){
    if(isEnded() || isEntryCompleted(getCurrentEntry())) return;
    state.currentGuess=""; state.usedLetterIds=[];
    updateAfterChange("progress", false);
  }
  function chooseWord(id){
    if(isEnded()) return;
    const item=puzzleData.find(x=>x.id===id); if(!item) return;
    state.currentWordId=id;
    state.currentGuess="";
    state.usedLetterIds=[];
    state.showHint1=false;
    state.showHint2=false;
    updateAfterChange("progress", true);
  }
  function submitGuess(){
    if(isEnded()) return;
    const entry=getCurrentEntry(); if(!entry || isEntryCompleted(entry)) return;
    const guess=normalizeWord(state.currentGuess);
    if(guess.length !== entry.answer.length){ flash("Use all the letters first."); return; }
    if(guess !== entry.answer){ flash("Not quite. Try again."); return; }
    if(!state.solvedWords.includes(entry.answer)) state.solvedWords.push(entry.answer);
    state.currentWordId=entry.id;
    state.currentGuess="";
    state.usedLetterIds=[];
    state.showHint1=false;
    state.showHint2=false;
    recomputeState();
    updateAfterChange(state.solved ? "solved" : "progress", true);
    if(state.solved) showOverlay();
  }
  function resetPuzzle(){
    if(!confirm("Start this Word Scramble puzzle over?")) return;
    state=defaultState(); writeState(); render(); emitStateChange("reset");
  }
  function revealWord(){
    if(!puzzle || isEnded()) return;
    const entry=getCurrentEntry();
    if(!entry) return;
    if(solvedSet().has(entry.answer) || revealedSet().has(entry.answer)) return;
    state.revealedWords = Array.isArray(state.revealedWords) ? state.revealedWords : [];
    state.revealedWords.push(entry.answer);
    state.currentWordId=entry.id;
    state.currentGuess="";
    state.usedLetterIds=[];
    state.showHint1=false;
    state.showHint2=false;
    recomputeState();
    updateAfterChange(state.revealed ? "revealed" : "progress", true);
    if(state.revealed) showOverlay();
  }

  function revealAnswers(){ revealWord(); }

  function toggleHint(which){
    if(which === "1") state.showHint1 = !state.showHint1;
    if(which === "2") state.showHint2 = !state.showHint2;
    updateAfterChange("progress", true);
  }

  function getOverlayStatsLine(){
    const stats=getStats();
    return `
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">local_fire_department</span><strong>${stats.streak.toLocaleString()}</strong> Day Streak</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">trophy</span><strong>${stats.solved.toLocaleString()}</strong> Solved</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">visibility</span><strong>${stats.revealed.toLocaleString()}</strong> Revealed</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">pending_actions</span><strong>${stats.inProgress.toLocaleString()}</strong> In Progress</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">beenhere</span><strong>${stats.played.toLocaleString()}</strong> Played</span>`;
  }

  function renderRecommendationHtml(){
    if(typeof window.HareWordScrambleFindNextPuzzle === "function"){
      const nextPuzzle=window.HareWordScrambleFindNextPuzzle(puzzle.puzzleId);
      if(nextPuzzle?.puzzleId){
        return `<div class="hp-recommend-card">
          <div class="hp-recommend-title">Play Your Next Puzzle</div>
          <div class="hp-recommend-copy">Your next available Word Scramble is ready. Keep the fun going with another word challenge.</div>
          <button class="hp-link-btn primary" data-a="load-puzzle" data-puzzle-id="${escapeHtml(nextPuzzle.puzzleId)}">Word Scramble #${escapeHtml(nextPuzzle.puzzleId)}</button>
        </div>`;
      }
    }
    return `<div class="hp-recommend-card"><div class="hp-recommend-title">All caught up!</div><div class="hp-recommend-copy">Congratulations — every available Word Scramble puzzle has been played.</div><span class="hp-link-btn secondary full" role="status">Congratulations!</span></div>`;
  }

  function renderOverlayContent(){
    const badgeIdEl=mount.querySelector("#hp-wsc-badge-id");
    const badgeMetaEl=mount.querySelector("#hp-wsc-badge-meta");
    const overlayIconEl=mount.querySelector("#hp-wsc-overlay-icon");
    const overlayTitleEl=mount.querySelector("#hp-wsc-overlay-title");
    const overlayTextEl=mount.querySelector("#hp-wsc-overlay-text");
    if(!badgeIdEl||!badgeMetaEl||!overlayIconEl||!overlayTitleEl||!overlayTextEl) return;
    badgeIdEl.textContent=puzzleTitle;
    badgeMetaEl.innerHTML=getOverlayStatsLine();
    if(state.solved){
      overlayIconEl.textContent="celebration";
      overlayTitleEl.textContent="You Solved the Word Scramble!";
      overlayTextEl.innerHTML=`<div class="hp-modal-lead">Congratulations — you unscrambled every word!</div><div class="hp-modal-subtext">Great job solving this Word Scramble puzzle.</div>${renderRecommendationHtml()}`;
    } else if(state.revealed){
      overlayIconEl.textContent="visibility";
      overlayTitleEl.textContent="Answers Revealed";
      overlayTextEl.innerHTML=`<div class="hp-modal-lead">Completed with a little help —<br>one or more words were revealed.</div>${renderRecommendationHtml()}`;
    }
  }
  function showOverlay(){ renderOverlayContent(); const el=mount.querySelector("#hp-wsc-overlay"); if(!el) return; el.classList.add("on"); el.setAttribute("aria-hidden","false"); }
  function hideOverlay(){ const el=mount.querySelector("#hp-wsc-overlay"); if(!el) return; el.classList.remove("on"); el.setAttribute("aria-hidden","true"); }

  function getPuzzleShareUrl(){ const url=new URL(window.location.href); url.search=""; url.hash=""; url.searchParams.set("puzzle", puzzle?.puzzleId || ""); return url.toString(); }
  function getShareText(){
    if(state.solved) return `I solved ${puzzleTitle} at Hare Publishing! 🧩\n\nCan you unscramble every word too?`;
    if(state.revealed) return `${puzzleTitle} finally beat me! 😄\n\nCan you solve it without revealing a word?`;
    return `I’m playing ${puzzleTitle} at Hare Publishing. 🧩\n\nCan you unscramble the words?`;
  }
  async function shareResult(){
    const full=`${getShareText()}\n\n${getPuzzleShareUrl()}`;
    try{ if(navigator.share){ await navigator.share({title:`${puzzleTitle} | Hare Publishing`, text:full}); return; } await navigator.clipboard.writeText(full); flash("Puzzle share text copied."); }
    catch{ try{ await navigator.clipboard.writeText(full); flash("Puzzle share text copied."); } catch{ flash("Share is not available in this browser."); } }
  }

  function renderInfoPanel(entry, solved, revealed, disabled){
    const showHint1=Boolean(state.showHint1);
    const showHint2=Boolean(state.showHint2);
    const hint1=entry.clue || "Unscramble the letters.";
    const hint2=entry.clue2 || `A ${entry.answer.length}-letter word.`;
    let bodyClass="";
    let bodyHtml="";

    if (solved) {
      bodyClass="is-success";
      bodyHtml=`<div class="hpwsc-info-main"><span class="hpwsc-info-icon material-symbols-outlined" aria-hidden="true">check_circle</span><span>Correct. You solved <strong>${escapeHtml(entry.answer)}</strong>.</span></div><div class="hpwsc-info-sub">Choose another word when you're ready.</div>`;
    } else if (revealed) {
      bodyClass="is-revealed";
      bodyHtml=`<div class="hpwsc-info-main"><span class="hpwsc-info-icon material-symbols-outlined" aria-hidden="true">visibility</span><span>Revealed. The word was <strong>${escapeHtml(entry.answer)}</strong>.</span></div><div class="hpwsc-info-sub">Choose another word when you're ready.</div>`;
    } else if (showHint1 || showHint2) {
      bodyHtml=`${showHint1 ? `<div><strong>Hint 1:</strong> ${escapeHtml(hint1)}</div>` : ""}${showHint2 ? `<div><strong>Hint 2:</strong> ${escapeHtml(hint2)}</div>` : ""}`;
    } else {
      bodyHtml=`Tap letters to build the word. Use a hint if you need a nudge.`;
    }

    return `<div class="hpwsc-info-panel">
      <div class="hpwsc-info-buttons" aria-label="Word help options">
        <button type="button" class="hpwsc-btn hint-toggle ${showHint1?"is-on":""}" data-a="toggle-hint" data-hint="1" ${disabled?"disabled":""}>Hint 1</button>
        <button type="button" class="hpwsc-btn hint-toggle ${showHint2?"is-on":""}" data-a="toggle-hint" data-hint="2" ${disabled?"disabled":""}>Hint 2</button>
        <button type="button" class="hpwsc-btn secondary" data-a="reveal-word" ${disabled?"disabled":""}>Reveal Word</button>
      </div>
      <div class="hpwsc-info-body ${bodyClass}">${bodyHtml}</div>
      <div class="hpwsc-info-footer">Solved: ${solvedCount().toLocaleString()} / ${puzzleData.length.toLocaleString()}</div>
    </div>`;
  }

  function renderCurrent(){
    const entry=getCurrentEntry();
    if(!entry) return `<div class="hpwsc-clue-box">No word is available.</div>`;
    const solved=solvedSet().has(entry.answer);
    const revealed=revealedSet().has(entry.answer);
    const guessDisplay=(state.revealed||solved||revealed) ? entry.answer : state.currentGuess;
    const letters=currentLetters();
    const disabled=isEnded()||solved||revealed;

    return `<div class="hpwsc-current word-len-${entry.answer.length}">
      ${renderInfoPanel(entry, solved, revealed, disabled)}
      <div class="hpwsc-slots" aria-label="Answer slots">${entry.answer.split("").map((_,i)=>`<button type="button" class="hpwsc-slot ${guessDisplay[i]?"has-letter":""}" data-a="delete-letter" aria-label="Remove last letter">${escapeHtml(guessDisplay[i]||"")}</button>`).join("")}</div>
      <div class="hpwsc-bank" aria-label="Letter bank">${letters.map(item=>`<button type="button" class="hpwsc-letter" data-letter-id="${escapeHtml(item.id)}" ${disabled||state.usedLetterIds.includes(item.id)?"disabled":""}>${escapeHtml(item.letter)}</button>`).join("")}</div>
      <div class="hpwsc-controls">
        <button type="button" class="hpwsc-btn primary" data-a="submit-guess" ${disabled?"disabled":""}>Enter</button>
        <button type="button" class="hpwsc-btn secondary" data-a="delete-letter" ${disabled?"disabled":""}>Delete</button>
        <button type="button" class="hpwsc-btn secondary" data-a="clear-guess" ${disabled?"disabled":""}>Clear</button>
      </div>
      <div class="hpwsc-actions">
        <button type="button" class="hpwsc-btn danger" data-a="reset-puzzle">Start Over</button>
      </div>
    </div>`;
  }
  function renderWordList(){
    const solved=solvedSet();
    const revealed=revealedSet();
    const current=getCurrentEntry();
    return `<div class="hpwsc-panel hpwsc-word-panel"><h3>Words</h3><div class="hpwsc-word-list">${puzzleData.map(item=>{
      const isSolved=solved.has(item.answer);
      const isRevealed=revealed.has(item.answer);
      const active=current&&current.id===item.id&&!isSolved&&!isRevealed&&!isEnded();
      const label=(state.revealed||isSolved||isRevealed)?item.answer:item.scrambled;
      const marker=isSolved?`<span class="hpwsc-word-check">✓</span>`:(isRevealed?`<span class="material-symbols-outlined hpwsc-word-check" aria-hidden="true">visibility</span>`:"");
      return `<button type="button" class="hpwsc-word-item ${isSolved?"is-solved":""} ${isRevealed?"is-revealed":""} ${active?"is-active":""}" data-word-id="${escapeHtml(item.id)}"><span>${escapeHtml(label)}</span>${marker}</button>`;
    }).join("")}</div></div>`;
  }

  function render(){
    if(!mount||!puzzle) return;
    mount.innerHTML=`<div class="hpwsc-shell"><div class="hpwsc-card">
      <div class="hpwsc-layout">
        <div class="hpwsc-panel hpwsc-puzzle-panel">
          ${puzzle.theme ? `<h3 class="hpwsc-theme">${escapeHtml(puzzle.theme)}</h3>` : ""}
          <div class="hpwsc-progress-wrap"><div class="hpwsc-progress-line"><span>Progress</span><span>${completedCount().toLocaleString()} / ${puzzleData.length.toLocaleString()} words</span></div><div class="hpwsc-progress-bar"><div class="hpwsc-progress-fill" style="width:${progressPercent()}%"></div></div></div>
          ${renderCurrent()}
        </div>
        ${renderWordList()}
      </div>
      <div class="hp-overlay" id="hp-wsc-overlay" aria-hidden="true"><div class="hp-modal" role="dialog" aria-modal="true" aria-label="Word Scramble result"><span id="hp-wsc-overlay-icon" class="material-symbols-outlined" aria-hidden="true">celebration</span><h3 id="hp-wsc-overlay-title">You Solved the Word Scramble!</h3><div class="hp-result-meta"><div class="hp-result-puzzle-title" id="hp-wsc-badge-id"></div><div class="hp-result-stats-line" id="hp-wsc-badge-meta"></div></div><div id="hp-wsc-overlay-text"></div><div class="hp-modal-actions"><a class="hp-link-btn primary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a><a class="hp-link-btn secondary" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a><button class="hp-link-btn share" data-a="share-result">Share This Puzzle</button><button class="hp-link-btn neutral" data-a="close-overlay">Back to Puzzle</button><button class="hp-link-btn danger full" data-a="reset-puzzle">Start Over</button></div><small>Hare Publishing • Word Scramble</small></div></div>
      <div class="hp-overlay hp-wsc-help-modal" id="hp-wsc-help-modal" aria-hidden="true"><div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Word Scramble"><span class="material-symbols-outlined" aria-hidden="true">help</span><h3>How to Play Word Scramble</h3><div class="hp-help-modal-content"><p><strong>Choose a word</strong> from the list or start with the active scrambled word.</p><p><strong>Tap letters</strong> to build the answer in the answer slots.</p><p><strong>Use the hints</strong> to help you figure out each word.</p><p><strong>Goal:</strong> Unscramble every word in the puzzle.</p></div><div class="hp-modal-actions"><button class="hp-link-btn neutral full" data-a="close-help-modal">Back to Puzzle</button></div></div></div>
    </div></div>`;
    if(isEnded()) showOverlay();
  }

  function flash(message){
    const body=mount?.querySelector(".hpwsc-info-body");
    if(!body) return;
    const original=body.innerHTML;
    const originalClass=body.className;
    body.className="hpwsc-info-body is-error";
    body.innerHTML=`<div class="hpwsc-info-main"><span class="hpwsc-info-icon material-symbols-outlined" aria-hidden="true">error</span><span>${escapeHtml(message)}</span></div>`;
    setTimeout(()=>{
      const current=mount?.querySelector(".hpwsc-info-body");
      if(!current) return;
      current.className=originalClass;
      current.innerHTML=original;
    },1200);
  }
  function emitStateChange(status){
    const detail={puzzleType:"wordscramble", puzzleId:puzzle?.puzzleId, storageKey:storageKey(), status};
    if(Core && typeof Core.emitStateChange === "function"){
      const saved=Core.getSavedState ? Core.getSavedState(storageKey()) : state;
      detail.puzzleStatus=Core.getPuzzleStatus ? Core.getPuzzleStatus(saved, wordScrambleStatusAdapter) : status;
      Core.emitStateChange(detail);
    }
    window.dispatchEvent(new CustomEvent("hare-word-scramble-progress", {detail}));
  }
  function updateAfterChange(status, fullRender=true){
    const listEl = mount?.querySelector(".hpwsc-word-list");
    const previousScrollTop = listEl ? listEl.scrollTop : 0;
    writeState();
    render();
    if (listEl) {
      const restoredList = mount?.querySelector(".hpwsc-word-list");
      if (restoredList) {
        restoredList.scrollTop = previousScrollTop;
        window.requestAnimationFrame(() => { restoredList.scrollTop = previousScrollTop; });
        setTimeout(() => { restoredList.scrollTop = previousScrollTop; }, 0);
      }
    }
    emitStateChange(status);
  }

  function openHelp(containerId){ const target=containerId?document.getElementById(containerId):container; const modal=target?.querySelector("#hp-wsc-help-modal"); if(!modal) return; modal.classList.add("on"); modal.setAttribute("aria-hidden","false"); }
  function closeHelp(){ const modal=mount?.querySelector("#hp-wsc-help-modal"); if(!modal) return; modal.classList.remove("on"); modal.setAttribute("aria-hidden","true"); }
  function revealForSystem(){ revealAnswers(); }

  function init(options={}){
    injectStyles();
    container=document.getElementById(options.containerId || "hp-wordscramble-container"); if(!container) return;
    mount=container.querySelector(".hp-mount") || container;
    puzzle={...(options.dataObject || window.HareWordScrambleData || {})};
    puzzle.puzzleId=String(puzzle.puzzleId || "");
    puzzleTitle=puzzle.puzzleTitle || puzzle.title || `Word Scramble #${puzzle.puzzleId}`;
    puzzle.puzzleTitle=puzzleTitle;
    const entries=Array.isArray(puzzle.entries) ? puzzle.entries : [];
    puzzleData=entries.map((item,index)=>({id:`w${index+1}`, answer:normalizeWord(item.answer), clue:String(item.clue||"").trim(), clue2:String(item.clue2||"").trim(), index})).filter(item=>item.answer);
    const seen=new Set(); const invalid=[];
    puzzleData.forEach(item=>{ if(item.answer.length<3||seen.has(item.answer)) invalid.push(item.answer); seen.add(item.answer); });
    if(!puzzleData.length||invalid.length){ mount.innerHTML=`<div style="padding:20px; border:1px solid #ED1B24; background:#fff5f5; color:#8a1c1c; border-radius:12px; text-align:center;"><strong>Word Scramble Error:</strong><br>${invalid.length?`Duplicate or invalid answer(s): ${escapeHtml(invalid.join(", "))}`:"Add at least one Word Scramble answer."}</div>`; return; }
    puzzleData=puzzleData.map(item=>{ const chars=item.answer.split(""); let scrambled=item.answer; let tries=0; while(scrambled===item.answer && tries<25){ scrambled=shuffleDeterministic(chars, `${puzzle.puzzleId}|${item.answer}|${tries}`).join(""); tries++; } return {...item, scrambled, length:item.answer.length}; });
    injectSchema();
    state=readState(); recomputeState(); writeState(); render(); emitStateChange("loaded");
  }

  document.addEventListener("click", event=>{
    const actionEl=event.target.closest("[data-a]");
    const wordEl=event.target.closest("[data-word-id]");
    const letterEl=event.target.closest("[data-letter-id]");
    if(wordEl && mount && mount.contains(wordEl)){ chooseWord(wordEl.getAttribute("data-word-id")); return; }
    if(letterEl && mount && mount.contains(letterEl) && !letterEl.disabled){ addLetter(letterEl.getAttribute("data-letter-id")); return; }
    if(!actionEl) return; if(mount && !mount.contains(actionEl)) return;
    const action=actionEl.getAttribute("data-a");
    if(action==="submit-guess") submitGuess();
    if(action==="delete-letter") deleteLetter();
    if(action==="clear-guess") clearGuess();
    if(action==="reset-puzzle") resetPuzzle();
    if(action==="reveal-answers") revealAnswers();
    if(action==="reveal-word") revealWord();
    if(action==="toggle-hint") toggleHint(actionEl.getAttribute("data-hint"));
    if(action==="close-overlay") hideOverlay();
    if(action==="close-help-modal") closeHelp();
    if(action==="share-result") shareResult();
    if(action==="load-puzzle") { const id=actionEl.getAttribute("data-puzzle-id"); hideOverlay(); if(typeof window.HareWordScrambleLoadPuzzle==="function") window.HareWordScrambleLoadPuzzle(id,{scroll:false}); else window.location.href=`${window.location.pathname || "/word-scramble"}?puzzle=${encodeURIComponent(id)}`; }
  });

  document.addEventListener("pointerdown", event=>{
    keyboardActive=Boolean(container && container.contains(event.target));
  }, true);

  document.addEventListener("focusin", event=>{
    keyboardActive=Boolean(container && container.contains(event.target));
  }, true);

  document.addEventListener("keydown", event=>{
    if(!container || isEnded() || !keyboardActive) return;

    const active=document.activeElement;
    const tag=active && active.tagName ? active.tagName.toUpperCase() : "";
    const typing=Boolean(active && (
      ["INPUT","TEXTAREA","SELECT"].includes(tag) ||
      active.isContentEditable ||
      active.closest?.('[contenteditable="true"]')
    ));
    if(typing) return;

    if(!container.contains(active) && active !== document.body && active !== document.documentElement) return;

    if(event.key==="Enter"){ event.preventDefault(); submitGuess(); }
    else if(event.key==="Backspace" || event.key==="Delete"){ event.preventDefault(); deleteLetter(); }
    else if(event.key==="Escape"){ event.preventDefault(); clearGuess(); }
    else if(/^[a-zA-Z]$/.test(event.key)){
      const entry=getCurrentEntry(); if(!entry) return; const letter=event.key.toUpperCase();
      const next=currentLetters().find(item=>item.letter===letter && !state.usedLetterIds.includes(item.id));
      if(next){ event.preventDefault(); addLetter(next.id); }
    }
  });

  return { init, openHelp, revealForSystem, getStats, statusAdapter:wordScrambleStatusAdapter, version:VERSION };
})();

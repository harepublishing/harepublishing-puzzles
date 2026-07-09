/* =========================================================
   HARE PUBLISHING WORD FLOWER PLATFORM ENGINE
   Version: v2.9
   New platform engine for achievement/progression Word Flower.
   Exposes: window.HareWordFlowerEngine
   ========================================================= */

window.HareWordFlowerEngine = (() => {
  const VERSION = "wordflower-platform-v2.9";
  const Core = window.HarePuzzleCore || null;
  const STORAGE_PREFIX = "hp2_wf_";
  const SAVE_VERSION = 2;
  const MORE_PUZZLES_URL = "/puzzlers-hub";
  const SHOP_URL = "https://www.harepublishing.com/shop";

  const LEVELS = [
    { key:"plant-sitter", label:"Plant Sitter", min:0, max:9, icon:"potted_plant" },
    { key:"beginner-gardener", label:"Beginner Gardener", min:10, max:24, icon:"eco" },
    { key:"garden-enthusiast", label:"Garden Enthusiast", min:25, max:44, icon:"grass" },
    { key:"green-thumb", label:"Green Thumb", min:45, max:64, icon:"psychiatry" },
    { key:"garden-expert", label:"Garden Expert", min:65, max:84, icon:"local_florist" },
    { key:"master-gardener", label:"Master Gardener", min:85, max:99, icon:"home_and_garden" },
    { key:"puzzle-complete", label:"Puzzle Complete", min:100, max:100, icon:"verified" }
  ];

  const wordFlowerStatusAdapter = {
    isSolved(data) {
      return Boolean(data && !data.revealAllUsed && (data.completed || data.completedAt || data.status === "complete" || data.status === "completed"));
    },
    isRevealed(data) {
      return Boolean(data && (data.revealAllUsed || data.revealedAt || data.status === "revealed"));
    },
    isFinished(data) {
      return Boolean(data && (this.isSolved(data) || this.isRevealed(data)));
    },
    hasProgress(data) {
      if (!data) return false;
      return Boolean(
        String(data.current || "").length > 0 ||
        (Array.isArray(data.found) && data.found.length > 0) ||
        (Array.isArray(data.revealedWords) && data.revealedWords.length > 0)
      );
    },
    finishedDate(data) {
      if (!data) return null;
      return data.completedAt || data.revealedAt || data.finishedAt || null;
    }
  };

  function getFallbackPlayPath(){
    const access = window.HareWordFlowerAccessConfig || {};
    return window.HareWordFlowerPlayUrl || window.location.pathname || access.publicPlayUrl || "/word-flower";
  }

  function getCollectionUrl(){
    const access = window.HareWordFlowerAccessConfig || {};
    try{
      return new URL(access.publicPlayUrl || "/word-flower", window.location.origin).href;
    }catch{
      return "https://www.harepublishing.com/word-flower";
    }
  }

  const CSS = `

    #hp-wordflower-container,
    #hp-wordflower-container * { box-sizing: border-box; }
    #hp-wordflower-container { width:100%; font-family:Roboto,Arial,sans-serif; color:#263238; }
    #hp-wordflower-container:focus, #hp-wordflower-container:focus-visible { outline:none !important; }

    #hp-wordflower-container .hpwf-shell { width:100%; position:relative; }
    #hp-wordflower-container .hpwf-card { background:transparent; border:0; box-shadow:none; padding:0; }
    #hp-wordflower-container .hpwf-layout { display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:16px; align-items:stretch; }
    #hp-wordflower-container .hpwf-progress-wrap { grid-column:1 / -1; }
    #hp-wordflower-container .hpwf-panel { background:#fff; border:1px solid #e9eef3; border-radius:20px; box-shadow:0 12px 34px rgba(0,0,0,.055); padding:14px; min-width:0; }
    #hp-wordflower-container .hpwf-main-panel { overflow:visible; min-height:650px; height:650px; display:flex; flex-direction:column; }
    #hp-wordflower-container .hpwf-word-panel { display:flex; flex-direction:column; overflow:hidden; min-height:650px; height:650px; }
    #hp-wordflower-container .hpwf-life-wrap { display:none; }

    #hp-wordflower-container .hpwf-progress-card { background:linear-gradient(135deg,#fff 0%,#fff 64%,#fff5f6 64%,#fff5f6 100%); border:1px solid #f7c7ca; border-radius:18px; padding:18px 14px 18px; min-height:184px; }
    #hp-wordflower-container .hpwf-progress-top { display:grid; grid-template-columns:minmax(170px,auto) minmax(390px,680px) auto; align-items:center; justify-content:space-between; gap:14px; margin-bottom:8px; }
    #hp-wordflower-container .hpwf-current-level { display:flex; align-items:center; gap:9px; min-width:0; }
    #hp-wordflower-container .hpwf-current-icon { width:36px; height:36px; border-radius:50%; background:#F68D91; color:#fff; display:flex; align-items:center; justify-content:center; flex:0 0 auto; box-shadow:0 5px 14px rgba(246,141,145,.28); }
    #hp-wordflower-container .hpwf-current-icon .material-symbols-outlined { font-size:21px; font-variation-settings:'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24; }
    #hp-wordflower-container .hpwf-level-label { font-size:15px; line-height:1.15; color:#9d4147; font-weight:900; }
    #hp-wordflower-container .hpwf-level-sub { margin-top:1px; font-size:11px; font-weight:900; color:#555; }
    #hp-wordflower-container .hpwf-progress-percent { font-size:28px; line-height:1; font-weight:900; color:#9d4147; text-align:right; }
    #hp-wordflower-container .hpwf-vine { position:relative; display:grid; grid-template-columns:repeat(7,1fr); align-items:start; gap:0; padding:10px 4px 4px; max-width:900px; margin:0 auto; }
    #hp-wordflower-container .hpwf-vine::before { content:""; position:absolute; left:6%; right:6%; top:31px; height:5px; border-radius:999px; background:#f1d4d6; z-index:0; }
    #hp-wordflower-container .hpwf-vine-fill { position:absolute; left:6%; top:31px; height:5px; border-radius:999px; background:#F68D91; z-index:1; transition:width .25s ease; max-width:88%; }
    #hp-wordflower-container .hpwf-node { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:4px; min-width:0; }
    #hp-wordflower-container .hpwf-node-dot { width:40px; height:40px; border-radius:50%; border:2px solid #f1d4d6; background:#fff; color:#b7777c; display:flex; align-items:center; justify-content:center; transition:all .2s ease; }
    #hp-wordflower-container .hpwf-node-dot .material-symbols-outlined { font-size:25px; font-variation-settings:'FILL' 0,'wght' 500,'GRAD' 0,'opsz' 24; }
    #hp-wordflower-container .hpwf-node.done .hpwf-node-dot, #hp-wordflower-container .hpwf-node.current .hpwf-node-dot { background:#F68D91; border-color:#F68D91; color:#fff; }
    #hp-wordflower-container .hpwf-node.current .hpwf-node-dot { width:48px; height:48px; box-shadow:0 7px 18px rgba(246,141,145,.35); transform:translateY(-3px); }
    #hp-wordflower-container .hpwf-node-label { font-size:11.2px; line-height:1.05; font-weight:900; text-align:center; color:#777; max-width:none; white-space:nowrap; }
    #hp-wordflower-container .hpwf-node.current .hpwf-node-label { color:#9d4147; }
    #hp-wordflower-container .hpwf-progress-meta { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; align-items:center; }
    #hp-wordflower-container .hpwf-progress-stat { background:#fff; border:1px solid #f7c7ca; border-radius:12px; padding:7px 6px; text-align:center; min-width:0; }
    #hp-wordflower-container .hpwf-progress-stat strong { display:block; font-size:15px; color:#9d4147; font-weight:900; line-height:1.05; white-space:nowrap; }
    #hp-wordflower-container .hpwf-progress-stat span { display:block; margin-top:2px; font-size:9px; color:#555; font-weight:900; text-transform:uppercase; line-height:1.1; white-space:nowrap; }

    #hp-wordflower-container .hpwf-message { margin:0 0 12px; padding:11px 14px; border-radius:16px; background:#f7f9fb; border:1px solid #dde7ef; font-size:15px; line-height:1.35; color:#334; font-weight:800; text-align:center; min-height:44px; display:flex; align-items:center; justify-content:center; }
    #hp-wordflower-container .hpwf-message.success { background:#f3fff9; border-color:#bdeed4; color:#08753d; }
    #hp-wordflower-container .hpwf-message.milestone { background:#fff5f6; border-color:#f7c7ca; color:#9d4147; }
    #hp-wordflower-container .hpwf-message.milestone .material-symbols-outlined { font-size:20px; margin-right:6px; font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24; }
    #hp-wordflower-container .hpwf-message.pangram { background:#fff8df; border-color:#f3cf63; color:#7a5600; }
    #hp-wordflower-container .hpwf-message.error { background:#fff5f5; border-color:#f6b4b9; color:#8a1c1c; }
    #hp-wordflower-container .hpwf-message.reveal { background:#edf6ff; border-color:#b9d7ef; color:#0F7FBB; }

    #hp-wordflower-container .hpwf-current-word { min-height:40px; margin:0 auto 10px; display:flex; align-items:center; justify-content:center; font-size:clamp(24px,4vw,32px); line-height:1.1; letter-spacing:.08em; color:#111; font-weight:900; text-align:center; }
    #hp-wordflower-container .hpwf-current-word.placeholder { color:#b0b8c0; letter-spacing:.02em; font-size:19px; }

    #hp-wordflower-container .hpwf-flower-wrap { width:100%; display:flex; justify-content:center; align-items:center; margin:0 auto 12px; overflow:visible; }
    #hp-wordflower-container .hpwf-flower { position:relative; width:330px; height:330px; max-width:100%; flex:0 0 auto; margin:0 auto; }
    #hp-wordflower-container .hpwf-flower-core { position:absolute; left:90px; top:90px; width:150px; height:150px; border-radius:50%; background:radial-gradient(circle at 35% 30%,#fff 0%,#fff7f7 50%,#fff0f1 100%); border:10px solid #fff; box-shadow:0 0 0 12px rgba(246,141,145,.18), 0 14px 32px rgba(0,0,0,.10); z-index:4; pointer-events:none; }
    #hp-wordflower-container .hpwf-letter { position:absolute; border-radius:50%; border:8px solid #f7c7ca; background:#fff; color:#9d4147; font-weight:900; font-size:21px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-family:inherit; transition:transform .12s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease; user-select:none; box-shadow:0 0 0 10px rgba(255,255,255,.92), 0 10px 24px rgba(0,0,0,.08); }
    #hp-wordflower-container .hpwf-letter:hover { transform:translateY(-2px); background:#fff5f6; }
    #hp-wordflower-container .hpwf-center-letter { left:99px; top:99px; width:132px; height:132px; background:#F68D91; color:#fff; border:10px solid #fff; z-index:5; box-shadow:0 0 0 10px rgba(246,141,145,.32), 0 16px 32px rgba(246,141,145,.35); font-size:38px; }
    #hp-wordflower-container .hpwf-center-letter:hover { background:#F68D91; color:#fff; border-color:#fff; box-shadow:0 0 0 10px rgba(246,141,145,.36), 0 18px 36px rgba(246,141,145,.38); }
    #hp-wordflower-container .hpwf-outer-letter { width:88px; height:88px; z-index:2; }
    #hp-wordflower-container .hpwf-pos-0 { left:121px; top:4px; }
    #hp-wordflower-container .hpwf-pos-1 { left:210px; top:62px; }
    #hp-wordflower-container .hpwf-pos-2 { left:210px; top:180px; }
    #hp-wordflower-container .hpwf-pos-3 { left:121px; top:238px; }
    #hp-wordflower-container .hpwf-pos-4 { left:32px; top:180px; }
    #hp-wordflower-container .hpwf-pos-5 { left:32px; top:62px; }

    #hp-wordflower-container .hpwf-actions, #hp-wordflower-container .hpwf-reveal-actions { display:flex; flex-wrap:wrap; gap:9px; justify-content:center; margin:0 auto 9px; }
    #hp-wordflower-container .hpwf-actions button, #hp-wordflower-container .hpwf-reveal-actions button { appearance:none; border-radius:14px; padding:10px 16px; font-size:14px; font-weight:900; font-family:inherit; cursor:pointer; border:2px solid #f7c7ca; background:#fff; color:#9d4147; transition:all .18s ease; }
    #hp-wordflower-container .hpwf-actions button:hover, #hp-wordflower-container .hpwf-reveal-actions button:hover { transform:translateY(-1px); background:#fff5f6; }
    #hp-wordflower-container .hpwf-enter { background:#F68D91 !important; color:#fff !important; border-color:#F68D91 !important; min-width:120px; }
    #hp-wordflower-container .hpwf-reveal { border-color:#b9d7ef !important; color:#0F7FBB !important; }
    #hp-wordflower-container .hpwf-danger { border-color:#f6b4b9 !important; color:#ED1B24 !important; }

    #hp-wordflower-container .hpwf-life-stats { padding:13px; border-radius:18px; background:#fff5f6; border:1px solid #f7c7ca; }
    #hp-wordflower-container .hpwf-life-title { text-align:center; margin:0 0 9px; font-size:15px; font-weight:900; color:#9d4147; }
    #hp-wordflower-container .hpwf-life-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
    #hp-wordflower-container .hpwf-life-item { background:#fff; border:1px solid #f7c7ca; border-radius:14px; padding:9px 8px; text-align:center; }
    #hp-wordflower-container .hpwf-life-item strong { display:block; color:#9d4147; font-size:21px; font-weight:900; line-height:1; }
    #hp-wordflower-container .hpwf-life-item span { display:block; margin-top:5px; color:#555; font-size:8px; font-weight:900; text-transform:uppercase; line-height:1.1; }

    #hp-wordflower-container .hpwf-word-panel h3 { margin:0 0 10px; text-align:center; font-size:19px; line-height:1.1; color:#9d4147; font-weight:900; }
    #hp-wordflower-container .hpwf-word-list { flex:1 1 auto; min-height:0; max-height:none; overflow-y:auto; padding-right:6px; scroll-behavior:auto; }
    #hp-wordflower-container .hpwf-empty { color:#666; text-align:center; font-weight:800; padding:20px 8px; }
    #hp-wordflower-container .hpwf-word-item { border:1px solid #e1e8ee; border-radius:12px; padding:7px 9px; margin-bottom:6px; background:#fff; display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px; }
    #hp-wordflower-container .hpwf-word-item.revealed { background:#edf6ff; border-color:#b9d7ef; color:#0F7FBB; }
    #hp-wordflower-container .hpwf-word-item.pangram { border-color:#f3cf63; }
    #hp-wordflower-container .hpwf-word-item.pangram:not(.revealed) { background:#fff8df; box-shadow:0 0 0 1px rgba(243,207,99,.35) inset; }
    #hp-wordflower-container .hpwf-word-item.pangram:not(.revealed) .hpwf-word-text { color:#7a5600; }
    #hp-wordflower-container .hpwf-word-item.pangram:not(.revealed) .hpwf-pill-pangram { color:#7a5600; background:#fff1b7; border-color:#f3cf63; }
    #hp-wordflower-container .hpwf-word-text { font-weight:900; color:#222; font-size:13px; line-height:1.15; min-width:0; display:flex; align-items:center; gap:9px; }
    #hp-wordflower-container .hpwf-word-text > .hpwf-word-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #hp-wordflower-container .hpwf-word-achievement-icon { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; flex:0 0 22px; border-radius:50%; background:#fff5f6; color:#9d4147; }
    #hp-wordflower-container .hpwf-word-achievement-icon .material-symbols-outlined { font-size:17px; line-height:1; font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 20; }
    #hp-wordflower-container .hpwf-word-meta { display:flex; gap:4px; align-items:center; flex-wrap:nowrap; justify-content:flex-end; }
    #hp-wordflower-container .hpwf-pill { display:inline-flex; align-items:center; justify-content:center; border-radius:999px; border:1px solid #dde7ef; background:#f7f9fb; color:#555; font-size:8.5px; font-weight:900; padding:4px 6px; text-transform:uppercase; white-space:nowrap; }
    #hp-wordflower-container .hpwf-pill-pangram { color:#9d4147; background:#fff5f6; border-color:#f7c7ca; }
    #hp-wordflower-container .hpwf-pill-revealed { color:#0F7FBB; background:#edf6ff; border-color:#b9d7ef; }

    #hp-wordflower-container .hp-overlay {
      display:none;
      position:absolute;
      inset:0;
      z-index:50;
      background:rgba(255,255,255,.82);
      align-items:center;
      justify-content:center;
      padding:20px;
      border-radius:20px;
    }
    #hp-wordflower-container .hp-overlay.on { display:flex; }

    #hp-wordflower-container .hp-result-modal {
      position:relative;
      width:min(920px,100%);
      max-height:calc(100% - 30px);
      overflow:auto;
      background:#fff;
      border:1px solid #e5edf3;
      border-radius:28px;
      box-shadow:0 20px 70px rgba(0,0,0,.20);
      padding:34px 44px 40px;
      text-align:center;
      color:#555;
    }

    #hp-wordflower-container .hp-result-close {
      position:absolute;
      top:18px;
      right:18px;
      width:54px;
      height:54px;
      border:0;
      border-radius:50%;
      background:#fff;
      color:#9d4147;
      box-shadow:0 10px 30px rgba(0,0,0,.12);
      cursor:pointer;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      transition:all .18s ease;
    }
    #hp-wordflower-container .hp-result-close:hover {
      background:#fff5f6;
      color:#F68D91;
      transform:translateY(-1px);
    }
    #hp-wordflower-container .hp-result-close .material-symbols-outlined {
      font-size:34px;
      font-variation-settings:'FILL' 0,'wght' 800,'GRAD' 0,'opsz' 40;
    }

    #hp-wordflower-container .hp-result-icon {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      margin:0 auto 14px;
      color:#9d4147;
      font-size:42px !important;
      line-height:1;
      font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 48 !important;
    }

    #hp-wordflower-container .hp-result-status {
      margin:0 0 12px;
      font-size:34px;
      line-height:1.1;
      font-weight:900;
      color:#555;
    }

    #hp-wordflower-container .hp-result-title {
      margin:0 0 22px;
      font-size:clamp(32px,3.5vw,46px);
      line-height:1.08;
      font-weight:900;
      color:#9d4147;
    }

    #hp-wordflower-container .hp-result-stats-line {
      display:flex;
      flex-wrap:nowrap;
      justify-content:center;
      align-items:center;
      gap:22px;
      margin:0 auto 24px;
      color:#555;
      font-size:20px;
      line-height:1.1;
      font-weight:900;
    }

    #hp-wordflower-container .hpwf-overlay-progress {
      width:100%;
      max-width:760px;
      margin:0 auto 24px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-card {
      min-height:auto;
      padding:14px 18px 16px;
      box-shadow:none;
      overflow:hidden;
      border-radius:20px;
      background:linear-gradient(135deg,#fff 0%,#fff 64%,#fff5f6 64%,#fff5f6 100%);
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-top {
      grid-template-columns:minmax(132px,auto) minmax(260px,1fr) 64px;
      gap:12px;
      margin-bottom:8px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-current-icon {
      width:40px;
      height:40px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-current-icon .material-symbols-outlined {
      font-size:26px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-level-label {
      font-size:15px;
      line-height:1.08;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-level-sub {
      font-size:11px;
      line-height:1.1;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-percent {
      font-size:28px;
      text-align:right;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-stat {
      padding:7px 6px;
      border-radius:12px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-stat strong {
      font-size:15px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-stat span {
      font-size:8px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-vine {
      padding-top:10px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-vine::before,
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-vine-fill {
      top:30px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-node-dot {
      width:40px;
      height:40px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-node.current .hpwf-node-dot {
      width:48px;
      height:48px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-node-dot .material-symbols-outlined {
      font-size:21px;
    }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-node-label {
      display:none;
    }
    #hp-wordflower-container .hp-result-stat-chip {
      display:inline-flex;
      align-items:center;
      gap:7px;
      white-space:nowrap;
      color:#555;
    }
    #hp-wordflower-container .hp-result-stat-chip .material-symbols-outlined {
      color:#9d4147;
      font-size:25px;
      line-height:1;
      font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 32;
    }
    #hp-wordflower-container .hp-result-stat-chip strong {
      color:#9d4147;
      font-weight:900;
    }

    #hp-wordflower-container .hp-result-message {
      max-width:740px;
      margin:0 auto 26px;
      color:#555;
      font-weight:900;
      text-align:center;
    }
    #hp-wordflower-container .hp-result-message-main {
      margin:0 0 12px;
      font-size:29px;
      line-height:1.15;
      font-weight:900;
    }
    #hp-wordflower-container .hp-result-message-sub {
      margin:0;
      font-size:23px;
      line-height:1.25;
      font-weight:900;
    }

    #hp-wordflower-container .hp-result-actions {
      display:flex;
      align-items:center;
      justify-content:center;
      gap:22px;
      flex-wrap:wrap;
      margin-top:14px;
    }

    #hp-wordflower-container .hp-link-btn {
      appearance:none;
      border:3px solid #f7c7ca;
      background:#fff;
      color:#9d4147;
      border-radius:22px;
      min-width:280px;
      min-height:62px;
      padding:14px 24px;
      font-family:inherit;
      font-size:21px;
      line-height:1.1;
      font-weight:900;
      text-decoration:none;
      cursor:pointer;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      transition:all .18s ease;
    }
    #hp-wordflower-container .hp-link-btn.primary {
      background:#F68D91;
      border-color:#F68D91;
      color:#fff;
    }
    #hp-wordflower-container .hp-link-btn.secondary,
    #hp-wordflower-container .hp-link-btn.share {
      background:#fff5f6;
      border-color:#f7c7ca;
      color:#9d4147;
    }
    #hp-wordflower-container .hp-link-btn:hover {
      transform:translateY(-1px);
      background:#F68D91;
      border-color:#F68D91;
      color:#fff;
    }
    #hp-wordflower-container .hp-link-btn.primary:hover {
      background:#fff;
      border-color:#f7c7ca;
      color:#9d4147;
    }

    #hp-wordflower-container .hp-modal small,
    #hp-wordflower-container .hp-recommend-card,
    #hp-wordflower-container .hp-recommend-title,
    #hp-wordflower-container .hp-recommend-copy,
    #hp-wordflower-container .hp-recommend-actions,
    #hp-wordflower-container .hp-modal-actions,
    #hp-wordflower-container .hp-modal-lead,
    #hp-wordflower-container .hp-modal-subtext {
      display:none;
    }

    @media(max-width:900px){
      #hp-wordflower-container .hp-result-modal {
        width:min(720px,100%);
        padding:36px 24px 34px;
      }
      #hp-wordflower-container .hp-result-stats-line {
        flex-wrap:wrap;
        gap:12px 18px;
        font-size:15px;
      }
      #hp-wordflower-container .hpwf-overlay-progress {
        margin-bottom:24px;
      }
      #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-card {
        padding:14px;
        border-radius:20px;
      }
      #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-top {
        grid-template-columns:minmax(0,1fr) auto;
        gap:8px 10px;
      }
      #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-meta {
        grid-column:1 / -1;
        grid-row:2;
      }
      #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-percent {
        font-size:28px;
      }
      #hp-wordflower-container .hpwf-overlay-progress .hpwf-node-dot {
        width:38px;
        height:38px;
      }
      #hp-wordflower-container .hpwf-overlay-progress .hpwf-node.current .hpwf-node-dot {
        width:46px;
        height:46px;
      }
      #hp-wordflower-container .hpwf-overlay-progress .hpwf-vine::before,
      #hp-wordflower-container .hpwf-overlay-progress .hpwf-vine-fill {
        top:30px;
      }
      #hp-wordflower-container .hp-result-message-main { font-size:28px; }
      #hp-wordflower-container .hp-result-message-sub { font-size:22px; }
      #hp-wordflower-container .hp-link-btn { min-width:min(320px,100%); font-size:20px; min-height:58px; }
      #hp-wordflower-container .hp-result-close { width:52px; height:52px; top:14px; right:14px; }
    }

    @media(max-width:560px){
      #hp-wordflower-container .hp-overlay {
        padding:12px;
      }
      #hp-wordflower-container .hp-result-modal {
        padding:34px 18px 28px;
        border-radius:20px;
      }
      #hp-wordflower-container .hp-result-icon { font-size:40px !important; margin-bottom:14px; }
      #hp-wordflower-container .hp-result-status { font-size:21px; margin-bottom:12px; }
      #hp-wordflower-container .hp-result-title { font-size:26px; margin-bottom:22px; }
      #hp-wordflower-container .hp-result-stats-line { font-size:16px; margin-bottom:24px; }
      #hp-wordflower-container .hp-result-stat-chip .material-symbols-outlined { font-size:22px; }
      #hp-wordflower-container .hp-result-message-main { font-size:25px; }
      #hp-wordflower-container .hp-result-message-sub { font-size:19px; }
      #hp-wordflower-container .hp-result-actions { gap:12px; }
      #hp-wordflower-container .hp-link-btn { width:100%; min-width:0; font-size:15px; min-height:54px; border-radius:18px; }
    }

    @media(max-width:1020px){
      #hp-wordflower-container .hpwf-layout{grid-template-columns:1fr;}
      #hp-wordflower-container .hpwf-main-panel{min-height:auto;height:auto;display:block;}
      #hp-wordflower-container .hpwf-word-panel{max-height:none; min-height:auto;height:auto;}
      #hp-wordflower-container .hpwf-word-list{max-height:360px;}
    }
    @media(max-width:620px){
      #hp-wordflower-container .hpwf-panel{padding:14px;}
      #hp-wordflower-container .hpwf-progress-card{min-height:auto;padding:12px 12px 14px;}
      #hp-wordflower-container .hpwf-progress-top{grid-template-columns:minmax(0,1fr) auto; gap:8px 10px; text-align:left;}
      #hp-wordflower-container .hpwf-current-level{justify-content:flex-start; grid-column:1; grid-row:1;}
      #hp-wordflower-container .hpwf-progress-percent{text-align:right; grid-column:2; grid-row:1; align-self:center;}
      #hp-wordflower-container .hpwf-progress-meta{grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; grid-column:1 / -1; grid-row:2;}
      #hp-wordflower-container .hpwf-progress-stat{padding:6px 4px;}
      #hp-wordflower-container .hpwf-progress-stat strong{font-size:13px;}
      #hp-wordflower-container .hpwf-progress-stat span{font-size:8px;}
      #hp-wordflower-container .hpwf-node-label{display:none;}
      #hp-wordflower-container .hpwf-node-dot{width:34px;height:34px;}
      #hp-wordflower-container .hpwf-node-dot .material-symbols-outlined{font-size:22px;}
      #hp-wordflower-container .hpwf-node.current .hpwf-node-dot{width:40px;height:40px;transform:translateY(-2px);}
      #hp-wordflower-container .hpwf-vine{padding-left:0;padding-right:0;}
      #hp-wordflower-container .hpwf-vine::before{left:7%;right:7%;top:27px;height:4px;}
      #hp-wordflower-container .hpwf-vine-fill{top:27px;height:4px;}
      #hp-wordflower-container .hpwf-life-grid{grid-template-columns:1fr 1fr;}
      #hp-wordflower-container .hpwf-flower-wrap{overflow:hidden; justify-content:center;}
      #hp-wordflower-container .hpwf-flower{width:300px;height:300px;max-width:300px;margin:0 auto;}
      #hp-wordflower-container .hpwf-flower-core{left:80px;top:80px;width:140px;height:140px;border-width:9px;}
      #hp-wordflower-container .hpwf-center-letter{left:91px;top:91px;width:118px;height:118px;font-size:31px;border-width:9px;}
      #hp-wordflower-container .hpwf-outer-letter{width:82px;height:82px;font-size:21px;border-width:7px;}
      #hp-wordflower-container .hpwf-pos-0{left:109px;top:2px;}
      #hp-wordflower-container .hpwf-pos-1{left:190px;top:52px;}
      #hp-wordflower-container .hpwf-pos-2{left:190px;top:166px;}
      #hp-wordflower-container .hpwf-pos-3{left:109px;top:216px;}
      #hp-wordflower-container .hpwf-pos-4{left:28px;top:166px;}
      #hp-wordflower-container .hpwf-pos-5{left:28px;top:52px;}
      #hp-wordflower-container .hpwf-actions button, #hp-wordflower-container .hpwf-reveal-actions button{padding:10px 13px;font-size:13px;}
      #hp-wordflower-container .hpwf-word-panel h3{font-size:22px;}
      #hp-wordflower-container .hpwf-word-text{font-size:13px;}
      #hp-wordflower-container .hpwf-word-list{max-height:360px;}
      #hp-wordflower-container .hp-modal-actions{grid-template-columns:1fr;}
      #hp-wordflower-container .hp-recommend-actions{grid-template-columns:1fr;}
    }
  
  `;

  function injectStyles() {
    if (document.getElementById("hp-wordflower-platform-engine-css-v28")) return;
    const style = document.createElement("style");
    style.id = "hp-wordflower-platform-engine-css-v28";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  let container = null;
  let mount = null;
  let puzzle = null;
  let state = null;
  let wordListScrollTop = 0;
  let overlayOpenedThisPageLoad = false;

  function captureWordListScroll(){
    const list = container?.querySelector?.(".hpwf-word-list");
    if(list) wordListScrollTop = list.scrollTop || 0;
  }

  function restoreWordListScroll(){
    const list = container?.querySelector?.(".hpwf-word-list");
    if(list) list.scrollTop = wordListScrollTop || 0;
  }

  function updateExternalLifeStats(){
    const slot = document.getElementById("hp-wordflower-lifetime-slot");
    if(slot) slot.innerHTML = renderLifeStats();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"']/g, char => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;"
    }[char]));
  }
  function nowIso(){ return new Date().toISOString(); }
  function cleanWord(value){ return String(value||"").toUpperCase().replace(/[^A-Z]/g,""); }
  function uniqueWords(words){ return [...new Set((Array.isArray(words)?words:[]).map(cleanWord).filter(Boolean))]; }
  function storageKey(){ return puzzle?.storageKey || `${STORAGE_PREFIX}${puzzle?.puzzleId || "unknown"}`; }

  function defaultState(){
    return {
      version:SAVE_VERSION,
      current:"",
      found:[],
      revealedWords:[],
      hintsUsed:0,
      wordLengthHintsUsed:0,
      firstLetterHintsUsed:0,
      wordPatternHintsUsed:0,
      revealWordUsed:false,
      revealAllUsed:false,
      revealed:false,
      solved:false,
      masterGardener:false,
      completed:false,
      status:"in-progress",
      playedAt:"",
      startedAt:"",
      updatedAt:"",
      lastPlayedAt:"",
      masterGardenerAt:"",
      completedAt:"",
      revealedAt:"",
      overlaySeen:{ master:false, complete:false, revealed:false },
      revealSnapshot:null,
      lastAchievementKey:"plant-sitter",
      lastMessage:"",
      wordAchievements:{}
    };
  }

  function readState(){
    try{
      const raw=localStorage.getItem(storageKey());
      if(!raw) return defaultState();
      const parsed=JSON.parse(raw);
      if(parsed.version !== SAVE_VERSION) return defaultState();
      return { ...defaultState(), ...parsed };
    }catch{ return defaultState(); }
  }

  function writeState(){
    if(!puzzle || !state) return;
    normalizeState();
    try{
      state.updatedAt = nowIso();
      state.lastPlayedAt = state.updatedAt;
      localStorage.setItem(storageKey(), JSON.stringify(state));
      dispatchStateChange();
    }catch{}
  }

  function dispatchStateChange(){
    try{
      const detail={ puzzleType:"wordflower", puzzleId:puzzle?.puzzleId, storageKey:storageKey(), state:{...state} };
      window.dispatchEvent(new CustomEvent("hare:puzzle-state-change", { detail }));
      window.dispatchEvent(new CustomEvent("hare:wordflower-state-change", { detail }));
    }catch{}
  }

  function allWords(){ return uniqueWords(puzzle.allowedWords).sort((a,b)=>a.length-b.length || a.localeCompare(b)); }
  function fullLetters(){ return [puzzle.centerLetter, ...puzzle.outerLetters]; }
  function isPangram(word){ return fullLetters().every(l => word.includes(l)); }
  function scoreWord(word){ return word.length === 4 ? 1 + (isPangram(word)?puzzle.pangramBonus:0) : word.length + (isPangram(word)?puzzle.pangramBonus:0); }
  function foundWords(){ return uniqueWords(state.found).filter(w=>allWords().includes(w)); }
  function revealedWords(){ return uniqueWords(state.revealedWords).filter(w=>allWords().includes(w)); }
  function foundCount(){ return foundWords().length; }
  function totalCount(){ return allWords().length; }
  function completionPct(){ return totalScore() ? Math.floor((currentScore()/totalScore())*100) : 0; }
  function currentScore(){ return foundWords().reduce((sum,w)=>sum+scoreWord(w),0); }
  function totalScore(){ return allWords().reduce((sum,w)=>sum+scoreWord(w),0); }
  function pangrams(){ return allWords().filter(isPangram); }
  function pangramsFound(){ return foundWords().filter(isPangram); }

  function scoreWords(words){ return uniqueWords(words).reduce((sum,w)=>sum+scoreWord(w),0); }
  function progressFromWords(words){
    const organic=uniqueWords(words).filter(w=>allWords().includes(w));
    const score=scoreWords(organic);
    const possible=totalScore();
    return {
      found:organic.length,
      total:totalCount(),
      pangrams:organic.filter(isPangram).length,
      pangramTotal:pangrams().length,
      score,
      totalScore:possible,
      pct:possible ? Math.floor((score/possible)*100) : 0
    };
  }
  function organicFoundBeforeRevealAll(){
    const found=foundWords();
    if(!state.revealAllUsed) return found;
    if(state.revealSnapshot && typeof state.revealSnapshot === "object") return null;
    const revealedSet=new Set(revealedWords());
    return found.filter(w=>!revealedSet.has(w));
  }

  function progressSnapshot(){
    if(state.revealAllUsed){
      if(state.revealSnapshot && typeof state.revealSnapshot === "object"){
        const snap=state.revealSnapshot;
        return {
          found:Number(snap.foundCount||0),
          total:totalCount(),
          pangrams:Number(snap.pangramsFound||0),
          pangramTotal:pangrams().length,
          score:Number(snap.score||0),
          totalScore:totalScore(),
          pct:Math.max(0, Math.min(100, Number(snap.pct||0)))
        };
      }
      return progressFromWords(organicFoundBeforeRevealAll() || []);
    }
    return progressFromWords(foundWords());
  }

  function makeRevealSnapshot(){
    const snap=progressSnapshot();
    const pct=snap.pct;
    const level=levelForPct(pct);
    return {
      foundCount:foundCount(),
      pangramsFound:pangramsFound().length,
      score:currentScore(),
      pct,
      levelKey:level.key,
      levelLabel:level.label,
      createdAt:nowIso()
    };
  }

  function levelForPct(pct){
    if(pct >= 100) return LEVELS[LEVELS.length-1];
    return LEVELS.find(l => pct >= l.min && pct <= l.max) || LEVELS[0];
  }
  function levelIndex(level){ return LEVELS.findIndex(l=>l.key===level.key); }
  function achievementMessage(level){
    const messages={
      "beginner-gardener":"Beginner Gardener achieved! Keep growing.",
      "garden-enthusiast":"Garden Enthusiast achieved! Nice progress.",
      "green-thumb":"Green Thumb achieved! You’re blooming now.",
      "garden-expert":"Garden Expert achieved! Excellent solving.",
      "master-gardener":"Master Gardener achieved! Word Flower Success!",
      "puzzle-complete":"Puzzle Complete! You found every word in this Word Flower."
    };
    return messages[level?.key] || `${level?.label || "Achievement"} achieved!`;
  }

  function newlyReachedLevels(beforeIndex, afterIndex){
    if(afterIndex <= beforeIndex) return [];
    return LEVELS.slice(beforeIndex + 1, afterIndex + 1).filter(l => l.key !== "puzzle-complete");
  }
  function achievementMessageHtml(levels){
    const list=Array.isArray(levels) ? levels.filter(Boolean) : [];
    const level=list[list.length-1];
    if(!level) return "";
    const icon=`<span class="material-symbols-outlined" aria-hidden="true">${escapeHtml(level.icon)}</span>`;
    if(list.length > 1){
      const names=list.map(l=>l.label).join(" and ");
      return `${icon}${escapeHtml(names)} achieved! Excellent progress.`;
    }
    return `${icon}${escapeHtml(achievementMessage(level))}`;
  }
  function wordAchievementIcon(word){
    const key=state?.wordAchievements?.[word];
    if(!key) return "";
    const level=LEVELS.find(l=>l.key===key);
    if(!level) return "";
    return `<span class="hpwf-word-achievement-icon" title="${escapeHtml(level.label)} achieved"><span class="material-symbols-outlined" aria-hidden="true">${escapeHtml(level.icon)}</span></span>`;
  }

  function reachedMaster(){ return completionPct() >= 85 && !state.revealAllUsed; }
  function reachedComplete(){ return completionPct() >= 100 && !state.revealAllUsed; }

  function normalizeState(){
    state.version = SAVE_VERSION;
    if(!state.wordAchievements || typeof state.wordAchievements !== "object" || Array.isArray(state.wordAchievements)) state.wordAchievements = {};
    state.found = foundWords();
    state.revealedWords = revealedWords();
    state.revealed = Boolean(state.revealAllUsed || state.revealedAt);
    state.masterGardener = reachedMaster();
    state.solved = state.completed;
    state.completed = reachedComplete();
    if(state.revealAllUsed) state.status = "revealed";
    else if(state.completed) state.status = "complete";
    else state.status = "in-progress";
  }

  function markPlayed(){
    const t=nowIso();
    if(!state.playedAt) state.playedAt=t;
    if(!state.startedAt) state.startedAt=t;
    writeState();
  }

  function getStoredItems(){
    if(Core && typeof Core.getStoredItems === "function") return Core.getStoredItems(STORAGE_PREFIX);
    const items=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!key || !key.startsWith(STORAGE_PREFIX)) continue;
      try{ items.push({ key, data:JSON.parse(localStorage.getItem(key)||"{}") }); }catch{}
    }
    return items;
  }

  function lifetimeStats(){
    const items=getStoredItems().filter(item=>item.data && item.data.version===SAVE_VERSION);
    let words=0, pangramCount=0, masters=0, completes=0;
    items.forEach(item=>{
      const data=item.data || {};
      let found=Array.isArray(data.found) ? uniqueWords(data.found) : [];
      if(data.revealAllUsed){
        if(data.revealSnapshot && typeof data.revealSnapshot === "object"){
          words += Number(data.revealSnapshot.foundCount || 0);
          pangramCount += Number(data.revealSnapshot.pangramsFound || 0);
        }else{
          const revealedSet=new Set(Array.isArray(data.revealedWords) ? uniqueWords(data.revealedWords) : []);
          found=found.filter(w=>!revealedSet.has(w));
          words += found.length;
          pangramCount += found.filter(w => Array.isArray(data.pangrams) ? data.pangrams.includes(w) : false).length;
        }
      }else{
        words += found.length;
        if(Array.isArray(data.pangramsFound)) pangramCount += uniqueWords(data.pangramsFound).length;
        else pangramCount += found.filter(w => Array.isArray(data.pangrams) ? data.pangrams.includes(w) : false).length;
      }
      if(!data.revealAllUsed && (data.masterGardener || data.solved || data.masterGardenerAt)) masters++;
      if(!data.revealAllUsed && (data.completed || data.completedAt || data.status === "complete")) completes++;
    });
    if(puzzle && state){
      // current item is already in storage after markPlayed/writeState; this is left intentionally simple.
    }
    return { words, pangrams:pangramCount, masterPuzzles:masters, completePuzzles:completes };
  }

  function messageForProgress(){
    const pct=completionPct();
    const level=levelForPct(pct);
    if(state.revealAllUsed) return "Answers revealed. You can review every accepted word.";
    if(state.completed) return "Puzzle Complete! You found every word in this Word Flower.";
    if(state.masterGardener) return "Master Gardener achieved! Keep searching to reach Puzzle Complete.";
    const next = LEVELS.find(l => l.min > pct && l.key !== "puzzle-complete");
    if(next){
      const pointsNeeded = Math.max(1, Math.ceil((next.min/100)*totalScore()) - currentScore());
      return `You are ${pointsNeeded} point${pointsNeeded===1?"":"s"} away from ${next.label}.`;
    }
    return `Welcome to today's Word Flower. Find words containing the center letter.`;
  }

  function vineFillWidthForPct(pct){
    const safePct = Math.max(0, Math.min(100, Number(pct) || 0));
    const maxWidth = 88;
    if(safePct >= 100) return maxWidth;
    let currentIndex = 0;
    for(let i=0;i<LEVELS.length;i++){
      if(safePct >= LEVELS[i].min) currentIndex = i;
    }
    const current = LEVELS[currentIndex] || LEVELS[0];
    const next = LEVELS[currentIndex + 1] || current;
    const currentPos = (currentIndex / (LEVELS.length - 1)) * maxWidth;
    const nextPos = ((currentIndex + 1) / (LEVELS.length - 1)) * maxWidth;
    const range = Math.max(1, next.min - current.min);
    const ratio = next === current ? 0 : Math.max(0, Math.min(1, (safePct - current.min) / range));
    return Math.min(maxWidth, currentPos + ((nextPos - currentPos) * ratio) + (safePct > 0 ? 2.5 : 0));
  }

  function renderProgress(){
    const snap=progressSnapshot();
    const pct=snap.pct;
    const level=levelForPct(pct);
    const idx=levelIndex(level);
    const vineWidth = vineFillWidthForPct(pct);
    const nodes=LEVELS.map((l,i)=>{
      const done = pct >= l.min && (pct >= l.max || i < idx || pct >= 100);
      const current = l.key === level.key;
      return `<div class="hpwf-node ${done?"done":""} ${current?"current":""}">
        <div class="hpwf-node-dot"><span class="material-symbols-outlined" aria-hidden="true">${l.icon}</span></div>
        <div class="hpwf-node-label">${escapeHtml(l.label)}</div>
      </div>`;
    }).join("");
    return `<div class="hpwf-progress-card">
      <div class="hpwf-progress-top">
        <div class="hpwf-current-level">
          <div class="hpwf-current-icon"><span class="material-symbols-outlined" aria-hidden="true">${level.icon}</span></div>
          <div><div class="hpwf-level-label">${escapeHtml(level.label)}</div><div class="hpwf-level-sub">Current achievement</div></div>
        </div>
        <div class="hpwf-progress-meta">
          <div class="hpwf-progress-stat"><strong>${snap.found} / ${snap.total}</strong><span>Words Found</span></div>
          <div class="hpwf-progress-stat"><strong>${snap.pangrams} / ${snap.pangramTotal}</strong><span>Pangrams Found</span></div>
          <div class="hpwf-progress-stat"><strong>${snap.score} / ${snap.totalScore}</strong><span>Points</span></div>
        </div>
        <div class="hpwf-progress-percent">${pct}%</div>
      </div>
      <div class="hpwf-vine"><div class="hpwf-vine-fill" style="width:${vineWidth}%"></div>${nodes}</div>
    </div>`;
  }

  function renderFlower(){
    return `<div class="hpwf-flower-wrap"><div class="hpwf-flower">
      <div class="hpwf-flower-core"></div>
      <button type="button" class="hpwf-letter hpwf-center-letter" data-letter="${escapeHtml(puzzle.centerLetter)}">${escapeHtml(puzzle.centerLetter)}</button>
      ${puzzle.outerLetters.map((l,i)=>`<button type="button" class="hpwf-letter hpwf-outer-letter hpwf-pos-${i}" data-letter="${escapeHtml(l)}">${escapeHtml(l)}</button>`).join("")}
    </div></div>`;
  }

  function renderWordList(){
    const found=foundWords();
    const revealed=revealedWords();
    const revealedSet=new Set(revealed);
    let list=[];
    if(state.revealAllUsed){
      const foundNewest=[...found].reverse();
      const foundSet=new Set(foundNewest);
      const revealedOnly=revealed.filter(w=>!foundSet.has(w)).sort((a,b)=>a.length-b.length||a.localeCompare(b));
      list=[...foundNewest, ...revealedOnly];
    }else{
      list=[...found].reverse();
    }
    if(!list.length){
      return `<div class="hpwf-empty">No words found yet. Start building!</div>`;
    }
    return list.map(word=>`<div class="hpwf-word-item ${revealedSet.has(word)?"revealed":""} ${isPangram(word)?"pangram":""} ${state.wordAchievements && state.wordAchievements[word]?"achievement":""}">
      <div class="hpwf-word-text">${wordAchievementIcon(word)}<span class="hpwf-word-label">${escapeHtml(word)}</span></div>
      <div class="hpwf-word-meta">
        <span class="hpwf-pill">${scoreWord(word)} pts</span>
        ${isPangram(word)?`<span class="hpwf-pill hpwf-pill-pangram">PANGRAM!</span>`:""}
        ${revealedSet.has(word)?`<span class="hpwf-pill hpwf-pill-revealed">Revealed</span>`:""}
      </div>
    </div>`).join("");
  }

  function renderLifeStats(){
    const s=lifetimeStats();
    return `<div class="hpwf-life-stats">
      <h3 class="hpwf-life-title">Your All-Time Word Flower Totals</h3>
      <div class="hpwf-life-grid">
        <div class="hpwf-life-item"><strong>${s.words.toLocaleString()}</strong><span>Words Found</span></div>
        <div class="hpwf-life-item"><strong>${s.pangrams.toLocaleString()}</strong><span>Pangrams Found</span></div>
        <div class="hpwf-life-item"><strong>${s.masterPuzzles.toLocaleString()}</strong><span>Master Gardener Puzzles</span></div>
        <div class="hpwf-life-item"><strong>${s.completePuzzles.toLocaleString()}</strong><span>Puzzle Complete Puzzles</span></div>
      </div>
    </div>`;
  }

  function getPlatformStats(){
    if(typeof window.HareWordFlowerGetStats === "function"){
      try{
        const stats = window.HareWordFlowerGetStats();
        return {
          streak: stats.streak || 0,
          solved: stats.solved || 0,
          revealed: stats.revealed || 0,
          inProgress: stats.inProgress || 0,
          played: stats.played || 0
        };
      }catch{}
    }
    if(Core && typeof Core.getStats === "function"){
      const stats = Core.getStats({ storagePrefix: STORAGE_PREFIX, statusAdapter: wordFlowerStatusAdapter });
      return {
        streak: stats.streak || 0,
        solved: stats.solved || 0,
        revealed: stats.revealed || 0,
        inProgress: stats.inProgress || 0,
        played: stats.played || 0
      };
    }
    const items=getStoredItems().filter(item=>item.data && item.data.version===SAVE_VERSION);
    return {
      streak:0,
      solved:items.filter(i=>wordFlowerStatusAdapter.isSolved(i.data)).length,
      revealed:items.filter(i=>wordFlowerStatusAdapter.isRevealed(i.data)).length,
      inProgress:items.filter(i=>wordFlowerStatusAdapter.hasProgress(i.data) && !wordFlowerStatusAdapter.isSolved(i.data) && !i.data.revealAllUsed).length,
      played:items.filter(i=>wordFlowerStatusAdapter.hasProgress(i.data)).length
    };
  }

  function getOverlayStatsLine(){
    const stats=getPlatformStats();
    return `
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">local_fire_department</span><strong>${stats.streak.toLocaleString()}</strong> Day Streak</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">emoji_events</span><strong>${stats.solved.toLocaleString()}</strong> Solved</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">visibility</span><strong>${stats.revealed.toLocaleString()}</strong> Revealed</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">pending_actions</span><strong>${stats.inProgress.toLocaleString()}</strong> In Progress</span>
      <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">beenhere</span><strong>${stats.played.toLocaleString()}</strong> Played</span>
    `;
  }

  function findNextPlayableWordFlower(options={}){
    if(typeof window.HareWordFlowerFindNextPuzzle === "function"){
      const next=window.HareWordFlowerFindNextPuzzle(options);
      if(next) return { id:String(next.puzzleId || next.id), isInProgress:Boolean(next.isInProgress || next.status === "in-progress") };
    }
    return null;
  }

  function renderResultActions(kind){
    const next=findNextPlayableWordFlower({ excludePuzzleId:puzzle?.puzzleId, excludeFinished:true });
    const actions=[];
    if(kind==="master"){
      actions.push(`<button class="hp-link-btn primary" type="button" data-a="close-overlay">Continue This Puzzle</button>`);
    }
    if(next && next.id){
      const verb=next.isInProgress ? "Continue" : "Play";
      actions.push(`<button class="hp-link-btn ${kind==="master" ? "secondary" : "primary"}" type="button" data-a="load-puzzle" data-puzzle-id="${escapeHtml(next.id)}">${verb} Word Flower #${escapeHtml(next.id)}</button>`);
    }
    actions.push(`<button type="button" class="hp-link-btn share" data-a="share">Share This Puzzle</button>`);
    if(!next && kind!=="master"){
      actions.unshift(`<a class="hp-link-btn primary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>`);
    }
    return `<div class="hp-result-actions">${actions.join("")}</div>`;
  }

  function renderResultMessage(kind){
    const next=findNextPlayableWordFlower({ excludePuzzleId:puzzle?.puzzleId, excludeFinished:true });
    if(kind==="master"){
      return `<div class="hp-result-message">
        <p class="hp-result-message-main">Master Gardener achieved!</p>
        <p class="hp-result-message-sub">Keep searching to find every word and complete the puzzle.</p>
      </div>`;
    }
    if(kind==="complete"){
      if(next && next.id){
        return `<div class="hp-result-message">
          <p class="hp-result-message-main">Puzzle Complete!</p>
          <p class="hp-result-message-sub">${next.isInProgress ? "Pick up where you left off and keep growing your garden." : "Try another Word Flower puzzle and keep growing your garden."}</p>
        </div>`;
      }
      return `<div class="hp-result-message">
        <p class="hp-result-message-main">You're caught up!</p>
        <p class="hp-result-message-sub">Check back for the next Word Flower puzzle.</p>
      </div>`;
    }
    if(next && next.id){
      return `<div class="hp-result-message">
        <p class="hp-result-message-main">Answers revealed.</p>
        <p class="hp-result-message-sub">${next.isInProgress ? "Pick up where you left off and keep growing your garden." : "Try another Word Flower puzzle and keep growing your garden."}</p>
      </div>`;
    }
    return `<div class="hp-result-message">
      <p class="hp-result-message-main">Answers revealed.</p>
      <p class="hp-result-message-sub">You're caught up. Check back for the next Word Flower puzzle.</p>
    </div>`;
  }

  function render(){
    captureWordListScroll();
    normalizeState();
    const current = state.current ? escapeHtml(state.current) : "BUILD A WORD";
    mount.innerHTML = `<div class="hpwf-shell"><div class="hpwf-card"><div class="hpwf-layout">
      <div class="hpwf-progress-wrap">${renderProgress()}</div>
      <section class="hpwf-panel hpwf-main-panel">
        <div id="hpwf-message" class="hpwf-message ${state.lastMessageType||""}">${state.lastMessageType==="milestone" && String(state.lastMessage||"").includes("<") ? state.lastMessage : escapeHtml(state.lastMessage || messageForProgress())}</div>
        <div id="hpwf-current-word" class="hpwf-current-word ${state.current?"":"placeholder"}">${current}</div>
        ${renderFlower()}
        <div class="hpwf-actions">
          <button type="button" class="hpwf-enter" data-a="enter">Enter</button>
          <button type="button" data-a="delete">Delete</button>
          <button type="button" data-a="clear">Clear</button>
        </div>
        <div class="hpwf-reveal-actions">
          <button type="button" class="hpwf-reveal" data-a="reveal-word">Reveal Word</button>
          <button type="button" class="hpwf-danger" data-a="reveal-all">Reveal All</button>
          <button type="button" class="hpwf-danger" data-a="reset">Start Over</button>
        </div>
      </section>
      <aside class="hpwf-panel hpwf-word-panel">
        <h3>Found Words</h3>
        <div class="hpwf-word-list">${renderWordList()}</div>
      </aside>
    </div>
      <div class="hp-overlay" id="hpwf-overlay" aria-hidden="true"><div class="hp-result-modal" role="dialog" aria-modal="true" aria-label="Word Flower result">
        <button type="button" class="hp-result-close" data-a="close-overlay" aria-label="Close result card"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
        <span id="hpwf-overlay-icon" class="material-symbols-outlined hp-result-icon" aria-hidden="true">celebration</span>
        <div id="hpwf-overlay-status" class="hp-result-status">Solved</div>
        <h3 id="hpwf-overlay-title" class="hp-result-title">Word Flower Puzzle</h3>
        <div id="hpwf-overlay-progress" class="hpwf-overlay-progress"></div>
        <div id="hpwf-overlay-meta" class="hp-result-stats-line"></div>
        <div id="hpwf-overlay-text"></div>
      </div></div>
    </div></div>`;
    bindDynamicEvents();
    restoreWordListScroll();
    updateExternalLifeStats();
    if(!overlayOpenedThisPageLoad && (state.revealAllUsed || state.completed || state.masterGardener)){
      overlayOpenedThisPageLoad = true;
      setTimeout(()=>showOverlay(state.revealAllUsed ? "revealed" : (state.completed ? "complete" : "master")), 0);
    }
  }

  function setMessage(msg,type=""){
    state.lastMessage = msg;
    state.lastMessageType = type;
    const el=container.querySelector("#hpwf-message");
    if(el){ el.className=`hpwf-message ${type}`; if(type==="milestone" && String(msg).includes("<")) el.innerHTML=msg; else el.textContent=msg; }
  }

  function addLetter(letter){
    if(state.revealAllUsed) return;
    state.current += String(letter).toUpperCase();
    writeState();
    render();
  }
  function del(){ state.current = String(state.current||"").slice(0,-1); writeState(); render(); }
  function clear(){ state.current=""; writeState(); render(); }

  function usesOnlyLetters(word){ const set=new Set(fullLetters()); return [...word].every(ch=>set.has(ch)); }
  function rejectSubmission(message){
    state.current="";
    setMessage(message,"error");
    writeState();
    render();
  }
  function submit(){
    if(state.revealAllUsed) return;
    const word=cleanWord(state.current);
    if(!word) return rejectSubmission("Build or type a word first.");
    if(word.length < puzzle.minWordLength) return rejectSubmission(`Words must be at least ${puzzle.minWordLength} letters.`);
    if(!word.includes(puzzle.centerLetter)) return rejectSubmission(`Every word must include the center letter ${puzzle.centerLetter}.`);
    if(!usesOnlyLetters(word)) return rejectSubmission("That word uses letters outside this flower.");
    if(!allWords().includes(word)) return rejectSubmission("That is not one of the accepted words for this puzzle.");
    if(foundWords().includes(word)) return rejectSubmission("You already found that word.");

    const beforeMaster=state.masterGardener;
    const beforeComplete=state.completed;
    const beforeLevel=levelForPct(completionPct());
    const beforeLevelIndex=levelIndex(beforeLevel);
    state.found.push(word);
    state.current="";
    normalizeState();
    const afterLevel=levelForPct(completionPct());
    const afterLevelIndex=levelIndex(afterLevel);
    if(state.masterGardener && !state.masterGardenerAt) state.masterGardenerAt=nowIso();
    if(state.completed && !state.completedAt) state.completedAt=nowIso();

    const pangram=isPangram(word);
    const reachedLevels=newlyReachedLevels(beforeLevelIndex, afterLevelIndex);
    const reachedNewLevel=reachedLevels.length > 0;
    if(reachedNewLevel){
      state.wordAchievements[word]=reachedLevels[reachedLevels.length-1].key;
    }
    if(pangram && reachedNewLevel){
      setMessage(`Fantastic! ${word} is a pangram — ${reachedLevels.map(l=>l.label).join(" and ")} achieved!`, "pangram");
    }else if(pangram){
      setMessage(`Fantastic! ${word} is a pangram!`, "pangram");
    }else if(reachedNewLevel){
      setMessage(achievementMessageHtml(reachedLevels), "milestone");
    }else{
      setMessage(`Great work! You found ${word}.`, "success");
    }
    state.lastAchievementKey=afterLevel.key;
    writeState();
    render();
    if(!beforeComplete && state.completed) showOverlay("complete");
    else if(!beforeMaster && state.masterGardener) showOverlay("master");
  }

  function remainingWords(){ return allWords().filter(w=>!foundWords().includes(w)); }
  function showHint(html){
    const box=container.querySelector("#hpwf-hint-box");
    if(!box) return;
    box.innerHTML=html;
    box.classList.add("on");
  }
  function hintLengths(){
    state.hintsUsed++; state.wordLengthHintsUsed++;
    const by={}; remainingWords().forEach(w=>{ by[w.length]=(by[w.length]||0)+1; });
    const rows=Object.keys(by).sort((a,b)=>Number(a)-Number(b)).map(len=>`${len} Letters: ${by[len]}`).join("<br>") || "No words remain.";
    writeState(); showHint(`<strong>Words Remaining</strong><br>${rows}`);
  }
  function hintFirst(){
    state.hintsUsed++; state.firstLetterHintsUsed++;
    const word=remainingWords().sort((a,b)=>a.length-b.length||a.localeCompare(b))[0];
    writeState(); showHint(word ? `<strong>First Letter Hint</strong><br>${escapeHtml(word[0])} ${"_ ".repeat(Math.max(0,word.length-1))}` : "No words remain.");
  }
  function hintPattern(){
    state.hintsUsed++; state.wordPatternHintsUsed++;
    const word=remainingWords().sort((a,b)=>a.length-b.length||a.localeCompare(b))[0];
    writeState(); showHint(word ? `<strong>Word Pattern Hint</strong><br>${escapeHtml(word[0])}${" _".repeat(Math.max(0,word.length-1))}<br>${word.length} letters` : "No words remain.");
  }
  function revealWord(){
    if(state.revealAllUsed) return;
    const word=remainingWords().sort((a,b)=>a.length-b.length||a.localeCompare(b))[0];
    if(!word) return setMessage("No words remain to reveal.","success");
    state.revealWordUsed=true; state.revealed=true; if(!state.revealedAt) state.revealedAt=nowIso();
    state.revealedWords.push(word); state.found.push(word); state.current="";
    normalizeState();
    setMessage(`Revealed. The word was ${word}.`,"reveal");
    writeState(); render();
  }
  function revealAll(){
    if(state.revealAllUsed) return;
    if(!confirm("Reveal all remaining words? This action cannot be undone.")) return;
    const rem=remainingWords();
    state.revealSnapshot=makeRevealSnapshot();
    state.revealAllUsed=true; state.revealed=true; state.revealWordUsed=true; if(!state.revealedAt) state.revealedAt=nowIso();
    state.revealedWords=[...new Set([...revealedWords(), ...rem])];
    state.current=""; state.status="revealed"; state.completed=false;
    setMessage("All remaining words have been revealed.","reveal");
    writeState(); render(); showOverlay("revealed");
  }
  function reset(){
    if(!confirm("Start over and clear all progress?")) return;
    try{ localStorage.removeItem(storageKey()); }catch{}
    state=defaultState();
    markPlayed();
    render();
  }

  function showOverlay(kind){
    const overlay=container.querySelector("#hpwf-overlay");
    const icon=container.querySelector("#hpwf-overlay-icon");
    const status=container.querySelector("#hpwf-overlay-status");
    const title=container.querySelector("#hpwf-overlay-title");
    const progress=container.querySelector("#hpwf-overlay-progress");
    const meta=container.querySelector("#hpwf-overlay-meta");
    const text=container.querySelector("#hpwf-overlay-text");
    if(!overlay||!icon||!status||!title||!progress||!meta||!text) return;

    if(kind==="master"){
      icon.textContent="home_and_garden";
      status.textContent="Success";
    }else if(kind==="complete"){
      icon.textContent="verified";
      status.textContent="Puzzle Complete";
    }else{
      icon.textContent="visibility";
      status.textContent="Revealed";
    }

    title.textContent=`Word Flower Puzzle #${puzzle?.puzzleId || ""}`;
    progress.innerHTML=renderProgress();
    meta.innerHTML=getOverlayStatsLine();
    meta.style.display="flex";
    text.innerHTML=renderResultMessage(kind) + renderResultActions(kind);

    overlay.querySelectorAll('[data-a="load-puzzle"]').forEach(btn=>{
      if(btn.dataset.hpLoadBound==="1") return;
      btn.dataset.hpLoadBound="1";
      btn.addEventListener("click", e=>{
        e.preventDefault();
        const nextId=btn.getAttribute("data-puzzle-id");
        if(!nextId) return;
        hideOverlay();
        if(typeof window.HareWordFlowerLoadPuzzle === "function") window.HareWordFlowerLoadPuzzle(nextId,{scroll:false});
        else window.location.href=`${getFallbackPlayPath()}?puzzle=${encodeURIComponent(nextId)}`;
      });
    });

    overlay.querySelectorAll('[data-a="close-overlay"]').forEach(btn=>{
      if(btn.dataset.hpCloseBound==="1") return;
      btn.dataset.hpCloseBound="1";
      btn.addEventListener("click", e=>{ e.preventDefault(); hideOverlay(); });
    });

    overlay.querySelectorAll('[data-a="share"]').forEach(btn=>{
      if(btn.dataset.hpShareBound==="1") return;
      btn.dataset.hpShareBound="1";
      btn.addEventListener("click", e=>{ e.preventDefault(); share(); });
    });

    overlay.classList.add("on");
    overlay.setAttribute("aria-hidden","false");
  }
  function hideOverlay(){ const overlay=container.querySelector("#hpwf-overlay"); if(overlay){ overlay.classList.remove("on"); overlay.setAttribute("aria-hidden","true"); } }

  function share(){
    const data={ title:`Word Flower #${puzzle.puzzleId} — Hare Publishing`, text:`I played Word Flower #${puzzle.puzzleId} from Hare Publishing!`, url:window.location.href };
    if(navigator.share) navigator.share(data).catch(()=>{});
    else navigator.clipboard?.writeText(window.location.href).then(()=>setMessage("Link copied!","success")).catch(()=>setMessage("Copy the link from your address bar.","error"));
  }

  function injectSchema(){
    if(!puzzle) return;
    const existing=document.getElementById("hp-schema-wordflower");
    if(existing) existing.remove();

    const puzzleId=String(puzzle.puzzleId||"").trim();
    const puzzleDate=String(puzzle.puzzleDate||"").trim();
    const pageUrl=window.location.href;
    const nowYear=new Date().getFullYear();

    const schemaData={
      "@context":"https://schema.org",
      "@type":"Game",
      "@id":`${pageUrl}#puzzle`,
      "name":puzzleId ? `Word Flower Puzzle #${puzzleId}` : "Word Flower Puzzle",
      "description":puzzleId ? `Play Word Flower Puzzle #${puzzleId} online from Hare Publishing. Build words from the flower letters, save your progress, and reveal answers when you need them.` : "Play Word Flower online from Hare Publishing. Build words from the flower letters, save your progress, and reveal answers when you need them.",
      "genre":"Puzzle",
      "url":pageUrl,
      "mainEntityOfPage":{ "@type":"WebPage", "@id":pageUrl },
      "inLanguage":"en",
      "datePublished":puzzleDate || undefined,
      "copyrightYear":String(nowYear),
      "keywords":["Word Flower", "word puzzle", "anagram puzzle", "daily puzzle", "online puzzle", "Hare Publishing"],
      "audience":{
        "@type":"PeopleAudience",
        "suggestedMinAge":"8"
      },
      "numberOfPlayers":{
        "@type":"QuantitativeValue",
        "minValue":1,
        "maxValue":1
      },
      "publisher":{
        "@type":"Organization",
        "name":"Hare Publishing",
        "url":"https://www.harepublishing.com/"
      },
      "isPartOf":{
        "@type":"CollectionPage",
        "name":"Word Flower",
        "url":getCollectionUrl()
      }
    };

    Object.keys(schemaData).forEach(key=>{
      if(schemaData[key] === undefined || schemaData[key] === "") delete schemaData[key];
    });

    const script=document.createElement("script");
    script.id="hp-schema-wordflower";
    script.type="application/ld+json";
    script.textContent=JSON.stringify(schemaData);
    document.head.appendChild(script);
  }

  function bindDynamicEvents(){
    container.querySelectorAll(".hpwf-letter").forEach(btn=>btn.addEventListener("click",()=>addLetter(btn.dataset.letter)));
    container.querySelectorAll("[data-a]").forEach(btn=>btn.addEventListener("click",()=>{
      const a=btn.dataset.a;
      if(a==="enter") submit();
      if(a==="delete") del();
      if(a==="clear") clear();
      if(a==="reveal-word") revealWord();
      if(a==="reveal-all") revealAll();
      if(a==="reset") reset();
      if(a==="close-overlay") hideOverlay();
      if(a==="share") share();
      if(a==="load-puzzle"){
        const nextId=btn.getAttribute("data-puzzle-id");
        if(nextId){
          hideOverlay();
          if(typeof window.HareWordFlowerLoadPuzzle === "function") window.HareWordFlowerLoadPuzzle(nextId,{scroll:false});
          else window.location.href=`${getFallbackPlayPath()}?puzzle=${encodeURIComponent(nextId)}`;
        }
      }
    }));
    const overlay=container.querySelector("#hpwf-overlay");
    if(overlay) overlay.addEventListener("click",e=>{
      const closeBtn=e.target.closest?.('[data-a="close-overlay"]');
      if(closeBtn){ e.preventDefault(); hideOverlay(); return; }
      if(e.target===overlay) hideOverlay();
    });
  }

  function keydown(e){
    const target=e.target;
    const tag=target && target.tagName ? target.tagName.toUpperCase() : "";
    if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT"||target?.isContentEditable) return;
    if(!container || !container.contains(document.activeElement)) return;
    const key=e.key.toUpperCase();
    if(key==="ENTER"){ e.preventDefault(); submit(); return; }
    if(key==="BACKSPACE" || key==="DELETE"){ e.preventDefault(); del(); return; }
    if(/^[A-Z]$/.test(key) && fullLetters().includes(key)){ e.preventDefault(); addLetter(key); }
  }

  function init(userConfig={}){
    injectStyles();
    const data=userConfig.dataObject || window.HareWordFlowerData || {};
    const containerId=userConfig.containerId || "hp-wordflower-container";
    container=document.getElementById(containerId);
    if(!container) return;
    container.setAttribute("tabindex","0");
    mount=container.querySelector(".hp-mount") || container;
    puzzle={
      puzzleId:String(data.puzzleId||"").trim(),
      puzzleDate:String(data.puzzleDate||data.date||"").trim(),
      minWordLength:Number(data.minWordLength||4),
      pangramBonus:Number(data.pangramBonus||7),
      centerLetter:cleanWord(data.centerLetter).slice(0,1),
      outerLetters:Array.isArray(data.outerLetters)?data.outerLetters.map(l=>cleanWord(l).slice(0,1)).filter(Boolean):[],
      allowedWords:uniqueWords(data.allowedWords),
      storageKey:data.storageKey || `${STORAGE_PREFIX}${String(data.puzzleId||"").trim()}`
    };
    const uniq=new Set([puzzle.centerLetter,...puzzle.outerLetters]);
    if(!puzzle.puzzleId || puzzle.centerLetter.length!==1 || puzzle.outerLetters.length!==6 || uniq.size!==7 || !puzzle.allowedWords.length){
      mount.innerHTML=`<div style="padding:20px;border:1px solid #ED1B24;background:#fff5f5;color:#8a1c1c;border-radius:14px;text-align:center;"><strong>Word Flower Configuration Error:</strong><br>Check puzzleId, centerLetter, six outerLetters, and allowedWords.</div>`;
      return;
    }
    injectSchema();
    overlayOpenedThisPageLoad = false;
    state=readState();
    normalizeState();
    markPlayed();
    render();
    if(container.__hareWordFlowerHandlers?.mousedown){
      container.removeEventListener("mousedown", container.__hareWordFlowerHandlers.mousedown);
    }
    container.removeEventListener("keydown", keydown);
    const mousedown=e=>{ if(!e.target?.closest?.("a[href]")) container.focus({preventScroll:true}); };
    container.addEventListener("keydown", keydown);
    container.addEventListener("mousedown", mousedown);
    container.__hareWordFlowerHandlers = { keydown, mousedown };
  }

  function openHelp(containerId="hp-wordflower-container"){
    const c=document.getElementById(containerId);
    if(!c) return;
    alert("Build words using the flower letters. Every word must include the center letter. Use only the letters shown. Find enough words to reach Master Gardener, or keep going for Puzzle Complete.");
  }

  return { init, openHelp, statusAdapter: wordFlowerStatusAdapter, getLevels:()=>[...LEVELS] };
})();

/* =========================================================
   HARE PUBLISHING WORD FLOWER PLATFORM ENGINE
   Version: v1.7
   New platform engine for achievement/progression Word Flower.
   Exposes: window.HareWordFlowerEngine
   ========================================================= */

window.HareWordFlowerEngine = (() => {
  const VERSION = "wordflower-platform-v1.7";
  const Core = window.HarePuzzleCore || null;
  const STORAGE_PREFIX = "hp_wf2_";
  const SAVE_VERSION = 2;
  const MORE_PUZZLES_URL = "https://www.harepublishing.com/online-puzzles";
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
      return Boolean(data && !data.revealAllUsed && (data.masterGardener || data.solved || data.status === "solved" || data.masterGardenerAt));
    },
    isRevealed(data) {
      return Boolean(data && (data.revealAllUsed || data.revealed || data.revealedAt || (Array.isArray(data.revealedWords) && data.revealedWords.length > 0)));
    },
    isFinished(data) {
      return Boolean(data && (this.isSolved(data) || data.revealAllUsed || data.completed || data.completedAt || data.status === "complete"));
    },
    hasProgress(data) {
      if (!data) return false;
      return Boolean(
        data.playedAt || data.startedAt || data.lastPlayedAt || data.updatedAt ||
        String(data.current || "").length > 0 ||
        (Array.isArray(data.found) && data.found.length > 0) ||
        (Array.isArray(data.revealedWords) && data.revealedWords.length > 0)
      );
    },
    finishedDate(data) {
      if (!data) return null;
      return data.completedAt || data.masterGardenerAt || data.revealedAt || data.finishedAt || data.updatedAt || data.lastPlayedAt || null;
    }
  };

  const CSS = `

    #hp-wordflower-container,
    #hp-wordflower-container * { box-sizing: border-box; }
    #hp-wordflower-container { width:100%; font-family:Roboto,Arial,sans-serif; color:#263238; }
    #hp-wordflower-container:focus, #hp-wordflower-container:focus-visible { outline:none !important; }

    #hp-wordflower-container .hpwf-shell { width:100%; position:relative; }
    #hp-wordflower-container .hpwf-card { background:transparent; border:0; box-shadow:none; padding:0; }
    #hp-wordflower-container .hpwf-layout { display:grid; grid-template-columns:minmax(0,1fr) 260px; gap:16px; align-items:stretch; }
    #hp-wordflower-container .hpwf-progress-wrap { grid-column:1 / -1; }
    #hp-wordflower-container .hpwf-panel { background:#fff; border:1px solid #e9eef3; border-radius:20px; box-shadow:0 12px 34px rgba(0,0,0,.055); padding:14px; min-width:0; }
    #hp-wordflower-container .hpwf-main-panel { overflow:visible; min-height:700px; height:700px; display:flex; flex-direction:column; }
    #hp-wordflower-container .hpwf-word-panel { display:flex; flex-direction:column; overflow:hidden; min-height:700px; height:700px; }
    #hp-wordflower-container .hpwf-life-wrap { display:none; }

    #hp-wordflower-container .hpwf-progress-card { background:linear-gradient(135deg,#fff 0%,#fff 64%,#fff5f6 64%,#fff5f6 100%); border:1px solid #f7c7ca; border-radius:18px; padding:14px 14px 16px; min-height:158px; }
    #hp-wordflower-container .hpwf-progress-top { display:grid; grid-template-columns:minmax(170px,auto) minmax(390px,680px) auto; align-items:center; justify-content:space-between; gap:14px; margin-bottom:8px; }
    #hp-wordflower-container .hpwf-current-level { display:flex; align-items:center; gap:9px; min-width:0; }
    #hp-wordflower-container .hpwf-current-icon { width:36px; height:36px; border-radius:50%; background:#F68D91; color:#fff; display:flex; align-items:center; justify-content:center; flex:0 0 auto; box-shadow:0 5px 14px rgba(246,141,145,.28); }
    #hp-wordflower-container .hpwf-current-icon .material-symbols-outlined { font-size:24px; font-variation-settings:'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24; }
    #hp-wordflower-container .hpwf-level-label { font-size:18px; line-height:1.15; color:#9d4147; font-weight:900; }
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
    #hp-wordflower-container .hpwf-message.error { background:#fff5f5; border-color:#f6b4b9; color:#8a1c1c; }
    #hp-wordflower-container .hpwf-message.reveal { background:#edf6ff; border-color:#b9d7ef; color:#0F7FBB; }

    #hp-wordflower-container .hpwf-current-word { min-height:40px; margin:0 auto 10px; display:flex; align-items:center; justify-content:center; font-size:clamp(24px,4vw,32px); line-height:1.1; letter-spacing:.08em; color:#111; font-weight:900; text-align:center; }
    #hp-wordflower-container .hpwf-current-word.placeholder { color:#b0b8c0; letter-spacing:.02em; font-size:19px; }

    #hp-wordflower-container .hpwf-flower-wrap { width:100%; display:flex; justify-content:center; align-items:center; margin:0 auto 12px; overflow:visible; }
    #hp-wordflower-container .hpwf-flower { position:relative; width:330px; height:330px; max-width:100%; flex:0 0 auto; margin:0 auto; }
    #hp-wordflower-container .hpwf-flower-core { position:absolute; left:90px; top:90px; width:150px; height:150px; border-radius:50%; background:radial-gradient(circle at 35% 30%,#fff 0%,#fff7f7 50%,#fff0f1 100%); border:10px solid #fff; box-shadow:0 0 0 12px rgba(246,141,145,.18), 0 14px 32px rgba(0,0,0,.10); z-index:4; pointer-events:none; }
    #hp-wordflower-container .hpwf-letter { position:absolute; border-radius:50%; border:8px solid #f7c7ca; background:#fff; color:#9d4147; font-weight:900; font-size:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-family:inherit; transition:transform .12s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease; user-select:none; box-shadow:0 0 0 10px rgba(255,255,255,.92), 0 10px 24px rgba(0,0,0,.08); }
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
    #hp-wordflower-container .hpwf-life-title { text-align:center; margin:0 0 9px; font-size:18px; font-weight:900; color:#9d4147; }
    #hp-wordflower-container .hpwf-life-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
    #hp-wordflower-container .hpwf-life-item { background:#fff; border:1px solid #f7c7ca; border-radius:14px; padding:9px 8px; text-align:center; }
    #hp-wordflower-container .hpwf-life-item strong { display:block; color:#9d4147; font-size:21px; font-weight:900; line-height:1; }
    #hp-wordflower-container .hpwf-life-item span { display:block; margin-top:5px; color:#555; font-size:10px; font-weight:900; text-transform:uppercase; line-height:1.1; }

    #hp-wordflower-container .hpwf-word-panel h3 { margin:0 0 10px; text-align:center; font-size:19px; line-height:1.1; color:#9d4147; font-weight:900; }
    #hp-wordflower-container .hpwf-word-list { flex:1 1 auto; min-height:0; max-height:none; overflow-y:auto; padding-right:6px; scroll-behavior:auto; }
    #hp-wordflower-container .hpwf-empty { color:#666; text-align:center; font-weight:800; padding:20px 8px; }
    #hp-wordflower-container .hpwf-word-item { border:1px solid #e1e8ee; border-radius:12px; padding:6px 8px; margin-bottom:6px; background:#fff; display:flex; align-items:center; justify-content:space-between; gap:8px; }
    #hp-wordflower-container .hpwf-word-item.revealed { background:#edf6ff; border-color:#b9d7ef; color:#0F7FBB; }
    #hp-wordflower-container .hpwf-word-item.pangram { border-color:#f7c7ca; }
    #hp-wordflower-container .hpwf-word-text { font-weight:900; color:#222; font-size:13px; line-height:1.15; }
    #hp-wordflower-container .hpwf-word-meta { display:flex; gap:5px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
    #hp-wordflower-container .hpwf-pill { display:inline-flex; align-items:center; justify-content:center; border-radius:999px; border:1px solid #dde7ef; background:#f7f9fb; color:#555; font-size:9px; font-weight:900; padding:4px 7px; text-transform:uppercase; }
    #hp-wordflower-container .hpwf-pill-pangram { color:#9d4147; background:#fff5f6; border-color:#f7c7ca; }
    #hp-wordflower-container .hpwf-pill-revealed { color:#0F7FBB; background:#edf6ff; border-color:#b9d7ef; }

    #hp-wordflower-container .hp-overlay { display:none; position:absolute; inset:0; z-index:50; background:rgba(255,255,255,.82); align-items:center; justify-content:center; padding:20px; border-radius:20px; }
    #hp-wordflower-container .hp-overlay.on { display:flex; }
    #hp-wordflower-container .hp-modal { width:min(760px,100%); max-height:calc(100% - 30px); overflow:auto; background:#fff; border-radius:24px; box-shadow:0 18px 52px rgba(0,0,0,.20); padding:22px; text-align:center; }
    #hp-wordflower-container .hp-modal .material-symbols-outlined.hp-result-icon { font-size:42px; color:#9d4147; font-variation-settings:'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 40; }
    #hp-wordflower-container .hp-modal h3 { margin:10px 0 8px; font-size:34px; line-height:1.1; color:#9d4147; font-weight:900; }
    #hp-wordflower-container .hp-result-stats-line { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin:14px 0 18px; color:#555; font-weight:900; }
    #hp-wordflower-container .hp-result-stats-line span { display:inline-flex; align-items:center; gap:4px; }
    #hp-wordflower-container .hp-result-stat-chip { display:inline-flex; align-items:center; gap:5px; font-size:14px; color:#555; }
    #hp-wordflower-container .hp-result-stat-chip .material-symbols-outlined { color:#9d4147; font-size:20px; font-variation-settings:'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24; }
    #hp-wordflower-container .hp-result-stat-chip strong { color:#9d4147; }
    #hp-wordflower-container .hpwf-overlay-progress { margin:0 auto 18px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-card { min-height:auto; padding:12px; box-shadow:none; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-card { overflow:hidden; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-top { grid-template-columns:minmax(92px,112px) minmax(0,1fr) 52px; gap:6px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-current-level { gap:6px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-current-icon { width:28px; height:28px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-current-icon .material-symbols-outlined { font-size:19px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-level-label { font-size:13px; line-height:1.05; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-level-sub { font-size:9px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-percent { font-size:22px; text-align:right; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-stat { padding:5px 3px; border-radius:9px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-stat strong { font-size:12px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-progress-stat span { font-size:7px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-node-label { display:none; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-node-dot { width:34px; height:34px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-node.current .hpwf-node-dot { width:40px; height:40px; }
    #hp-wordflower-container .hpwf-overlay-progress .hpwf-vine::before, #hp-wordflower-container .hpwf-overlay-progress .hpwf-vine-fill { top:27px; }

    #hp-wordflower-container .hp-modal-lead { color:#555; font-size:18px; line-height:1.35; font-weight:900; margin:8px 0; }
    #hp-wordflower-container .hp-modal-subtext { color:#555; font-size:16px; line-height:1.35; font-weight:700; margin:4px 0; }
    #hp-wordflower-container .hp-recommend-card { margin:18px auto 0; padding:20px; border:1px solid #f7c7ca; background:#fff5f6; border-radius:18px; }
    #hp-wordflower-container .hp-recommend-title { font-size:20px; line-height:1.15; font-weight:900; color:#9d4147; margin:0 0 10px; }
    #hp-wordflower-container .hp-recommend-copy { color:#555; font-size:16px; line-height:1.35; font-weight:600; margin:0 0 14px; }
    #hp-wordflower-container .hp-link-btn.full { width:100%; max-width:260px; margin-left:auto; margin-right:auto; }

    #hp-wordflower-container .hp-modal-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:18px; }
    #hp-wordflower-container .hp-link-btn { appearance:none; border:2px solid #f7c7ca; background:#fff; color:#9d4147; border-radius:14px; padding:12px 14px; font-family:inherit; font-size:15px; font-weight:900; text-decoration:none; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    #hp-wordflower-container .hp-link-btn.primary { background:#F68D91; border-color:#F68D91; color:#fff; }
    #hp-wordflower-container .hp-link-btn.danger { color:#ED1B24; border-color:#f6b4b9; grid-column:1/-1; }
    #hp-wordflower-container .hp-modal small { display:block; margin-top:14px; color:#777; font-size:12px; }

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
      #hp-wordflower-container .hpwf-outer-letter{width:82px;height:82px;font-size:24px;border-width:7px;}
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
    }
  
  `;

  function injectStyles() {
    if (document.getElementById("hp-wordflower-platform-engine-css-v15")) return;
    const style = document.createElement("style");
    style.id = "hp-wordflower-platform-engine-css-v15";
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
      lastMessage:""
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
  function reachedMaster(){ return completionPct() >= 85 && !state.revealAllUsed; }
  function reachedComplete(){ return completionPct() >= 100 && !state.revealAllUsed; }

  function normalizeState(){
    state.version = SAVE_VERSION;
    state.found = foundWords();
    state.revealedWords = revealedWords();
    state.revealed = Boolean(state.revealWordUsed || state.revealAllUsed || state.revealedWords.length || state.revealedAt);
    state.masterGardener = reachedMaster();
    state.solved = state.masterGardener;
    state.completed = reachedComplete();
    if(state.revealAllUsed) state.status = "revealed";
    else if(state.completed) state.status = "complete";
    else if(state.masterGardener) state.status = "solved";
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

  function renderProgress(){
    const snap=progressSnapshot();
    const pct=snap.pct;
    const level=levelForPct(pct);
    const idx=levelIndex(level);
    const vineWidth = Math.max(0, Math.min(84, (pct/100)*84));
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
    const visibleWords = state.revealAllUsed ? uniqueWords([...found, ...revealedWords()]) : found;
    if(!visibleWords.length){
      return `<div class="hpwf-empty">No words found yet. Start building!</div>`;
    }
    const list=[...visibleWords].sort((a,b)=>a.length-b.length||a.localeCompare(b));
    const revealedSet=new Set(revealedWords());
    return list.map(word=>`<div class="hpwf-word-item ${revealedSet.has(word)?"revealed":""} ${isPangram(word)?"pangram":""}">
      <div class="hpwf-word-text">${escapeHtml(word)}</div>
      <div class="hpwf-word-meta">
        <span class="hpwf-pill">${scoreWord(word)} pts</span>
        ${isPangram(word)?`<span class="hpwf-pill hpwf-pill-pangram">Pangram</span>`:""}
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

  function findNextPlayableWordFlower(){
    if(typeof window.HareWordFlowerFindNextPuzzle === "function"){
      const next=window.HareWordFlowerFindNextPuzzle();
      if(next) return { id:String(next.puzzleId || next.id), isInProgress:Boolean(next.isInProgress || next.status === "in-progress") };
    }
    return null;
  }

  function renderRecommendationHtml(){
    const next=findNextPlayableWordFlower();
    if(next){
      return `<div class="hp-recommend-card">
        <div class="hp-recommend-title">Play Your Next Puzzle</div>
        <div class="hp-recommend-copy">${next.isInProgress ? "You have a Word Flower already in progress. Pick up where you left off and keep growing your garden." : "Your next available Word Flower is ready. Keep the fun going with another flower challenge."}</div>
        <button class="hp-link-btn primary full" type="button" data-a="load-puzzle" data-puzzle-id="${escapeHtml(next.id)}">Word Flower #${escapeHtml(next.id)}</button>
      </div>`;
    }
    return `<div class="hp-recommend-card">
      <div class="hp-recommend-title">All caught up!</div>
      <div class="hp-recommend-copy">Congratulations — every available Word Flower puzzle has been solved or revealed.</div>
      <span class="hp-link-btn full" role="status">Congratulations!</span>
    </div>`;
  }

  function render(){
    captureWordListScroll();
    normalizeState();
    const current = state.current ? escapeHtml(state.current) : "BUILD A WORD";
    mount.innerHTML = `<div class="hpwf-shell"><div class="hpwf-card"><div class="hpwf-layout">
      <div class="hpwf-progress-wrap">${renderProgress()}</div>
      <section class="hpwf-panel hpwf-main-panel">
        <div id="hpwf-message" class="hpwf-message ${state.lastMessageType||""}">${escapeHtml(state.lastMessage || messageForProgress())}</div>
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
      <div class="hp-overlay" id="hpwf-overlay" aria-hidden="true"><div class="hp-modal" role="dialog" aria-modal="true" aria-label="Word Flower result">
        <span id="hpwf-overlay-icon" class="material-symbols-outlined hp-result-icon" aria-hidden="true">celebration</span>
        <h3 id="hpwf-overlay-title">Congratulations!</h3>
        <div id="hpwf-overlay-progress" class="hpwf-overlay-progress"></div>
        <div id="hpwf-overlay-meta" class="hp-result-stats-line"></div>
        <div id="hpwf-overlay-text"></div>
        <div class="hp-modal-actions">
          <a class="hp-link-btn primary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
          <a class="hp-link-btn" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>
          <button type="button" class="hp-link-btn" data-a="share">Share This Puzzle</button>
          <button type="button" class="hp-link-btn" data-a="close-overlay">Back to Puzzle</button>
        </div>
        <small>Hare Publishing • Word Flower</small>
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
    if(el){ el.textContent=msg; el.className=`hpwf-message ${type}`; }
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
    state.found.push(word);
    state.current="";
    normalizeState();
    if(state.masterGardener && !state.masterGardenerAt) state.masterGardenerAt=nowIso();
    if(state.completed && !state.completedAt) state.completedAt=nowIso();
    setMessage(isPangram(word) ? `Excellent! ${word} is a pangram.` : `Great work! You found ${word}.`, isPangram(word)?"success":"success");
    writeState();
    render();
    if(!beforeMaster && state.masterGardener) showOverlay("master");
    else if(!beforeComplete && state.completed) showOverlay("complete");
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
    const title=container.querySelector("#hpwf-overlay-title");
    const progress=container.querySelector("#hpwf-overlay-progress");
    const meta=container.querySelector("#hpwf-overlay-meta");
    const text=container.querySelector("#hpwf-overlay-text");
    if(!overlay||!title||!meta||!text) return;

    if(kind==="master"){
      icon.textContent="home_and_garden";
      title.textContent="Master Gardener Achieved!";
      text.innerHTML=`<div class="hp-modal-lead">You reached the Word Flower success level.</div><div class="hp-modal-subtext">Keep searching to achieve Puzzle Complete.</div>${renderRecommendationHtml()}`;
    }else if(kind==="complete"){
      icon.textContent="verified";
      title.textContent="Puzzle Complete!";
      text.innerHTML=`<div class="hp-modal-lead">Congratulations — you found every word in this Word Flower.</div>${renderRecommendationHtml()}`;
    }else{
      icon.textContent="visibility";
      title.textContent="Answers Revealed";
      text.innerHTML=`<div class="hp-modal-lead">You revealed the remaining Word Flower answers.</div>${renderRecommendationHtml()}`;
    }

    if(progress) progress.innerHTML=renderProgress();
    meta.innerHTML=getOverlayStatsLine();

    overlay.querySelectorAll('[data-a="load-puzzle"]').forEach(btn=>{
      if(btn.dataset.hpLoadBound==="1") return;
      btn.dataset.hpLoadBound="1";
      btn.addEventListener("click", e=>{
        e.preventDefault();
        const nextId=btn.getAttribute("data-puzzle-id");
        if(!nextId) return;
        hideOverlay();
        if(typeof window.HareWordFlowerLoadPuzzle === "function") window.HareWordFlowerLoadPuzzle(nextId,{scroll:false});
        else window.location.href=`${window.location.pathname || "/word-flower"}?puzzle=${encodeURIComponent(nextId)}`;
      });
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
          else window.location.href=`${window.location.pathname || "/word-flower"}?puzzle=${encodeURIComponent(nextId)}`;
        }
      }
    }));
    const overlay=container.querySelector("#hpwf-overlay");
    if(overlay) overlay.addEventListener("click",e=>{ if(e.target===overlay) hideOverlay(); });
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
    overlayOpenedThisPageLoad = false;
    state=readState();
    normalizeState();
    markPlayed();
    render();
    container.removeEventListener("keydown", keydown);
    container.addEventListener("keydown", keydown);
    container.addEventListener("mousedown", e=>{ if(!e.target?.closest?.("a[href]")) container.focus({preventScroll:true}); });
  }

  function openHelp(containerId="hp-wordflower-container"){
    const c=document.getElementById(containerId);
    if(!c) return;
    alert("Build words using the flower letters. Every word must include the center letter. Use only the letters shown. Find enough words to reach Master Gardener, or keep going for Puzzle Complete.");
  }

  return { init, openHelp, statusAdapter: wordFlowerStatusAdapter, getLevels:()=>[...LEVELS] };
})();

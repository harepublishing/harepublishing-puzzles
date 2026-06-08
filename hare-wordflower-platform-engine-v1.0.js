/* =========================================================
   HARE PUBLISHING WORD FLOWER PLATFORM ENGINE
   Version: 1.0
   New platform engine for achievement/progression Word Flower.
   Exposes: window.HareWordFlowerEngine
   ========================================================= */

window.HareWordFlowerEngine = (() => {
  const VERSION = "wordflower-platform-engine-v1.0";
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

    #hp-wordflower-container .hpwf-shell { width:100%; }
    #hp-wordflower-container .hpwf-card { background:transparent; border:0; box-shadow:none; padding:0; }
    #hp-wordflower-container .hpwf-layout { display:grid; grid-template-columns:minmax(0, 1fr) 320px; gap:24px; align-items:start; }
    #hp-wordflower-container .hpwf-panel { background:#fff; border:1px solid #e9eef3; border-radius:20px; box-shadow:0 12px 34px rgba(0,0,0,.055); padding:18px; min-width:0; }
    #hp-wordflower-container .hpwf-main-panel { overflow:visible; }
    #hp-wordflower-container .hpwf-word-panel { display:flex; flex-direction:column; max-height:820px; overflow:hidden; }

    #hp-wordflower-container .hpwf-progress-card { background:linear-gradient(135deg,#fff 0%,#fff 60%,#fff5f6 60%,#fff5f6 100%); border:1px solid #f7c7ca; border-radius:18px; padding:14px; margin-bottom:14px; }
    #hp-wordflower-container .hpwf-progress-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; }
    #hp-wordflower-container .hpwf-current-level { display:flex; align-items:center; gap:8px; min-width:0; }
    #hp-wordflower-container .hpwf-current-icon { width:38px; height:38px; border-radius:50%; background:#F68D91; color:#fff; display:flex; align-items:center; justify-content:center; flex:0 0 auto; box-shadow:0 5px 14px rgba(246,141,145,.28); }
    #hp-wordflower-container .hpwf-current-icon .material-symbols-outlined { font-size:24px; font-variation-settings:'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24; }
    #hp-wordflower-container .hpwf-level-label { font-size:17px; line-height:1.15; color:#9d4147; font-weight:900; }
    #hp-wordflower-container .hpwf-level-sub { margin-top:2px; font-size:12px; font-weight:900; color:#555; }
    #hp-wordflower-container .hpwf-progress-percent { font-size:24px; line-height:1; font-weight:900; color:#9d4147; }
    #hp-wordflower-container .hpwf-vine { position:relative; display:grid; grid-template-columns:repeat(7,1fr); align-items:center; gap:0; padding:12px 4px 6px; }
    #hp-wordflower-container .hpwf-vine::before { content:""; position:absolute; left:8%; right:8%; top:29px; height:5px; border-radius:999px; background:#f1d4d6; z-index:0; }
    #hp-wordflower-container .hpwf-vine-fill { position:absolute; left:8%; top:29px; height:5px; border-radius:999px; background:#F68D91; z-index:1; transition:width .25s ease; max-width:84%; }
    #hp-wordflower-container .hpwf-node { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:4px; min-width:0; }
    #hp-wordflower-container .hpwf-node-dot { width:34px; height:34px; border-radius:50%; border:2px solid #f1d4d6; background:#fff; color:#b7777c; display:flex; align-items:center; justify-content:center; transition:all .2s ease; }
    #hp-wordflower-container .hpwf-node-dot .material-symbols-outlined { font-size:20px; font-variation-settings:'FILL' 0,'wght' 500,'GRAD' 0,'opsz' 24; }
    #hp-wordflower-container .hpwf-node.done .hpwf-node-dot, #hp-wordflower-container .hpwf-node.current .hpwf-node-dot { background:#F68D91; border-color:#F68D91; color:#fff; }
    #hp-wordflower-container .hpwf-node.current .hpwf-node-dot { width:42px; height:42px; box-shadow:0 7px 18px rgba(246,141,145,.35); transform:translateY(-3px); }
    #hp-wordflower-container .hpwf-node-label { font-size:9px; line-height:1.05; font-weight:900; text-align:center; color:#777; max-width:70px; }
    #hp-wordflower-container .hpwf-node.current .hpwf-node-label { color:#9d4147; }
    #hp-wordflower-container .hpwf-progress-meta { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:10px; }
    #hp-wordflower-container .hpwf-progress-stat { background:#fff; border:1px solid #f7c7ca; border-radius:14px; padding:8px; text-align:center; }
    #hp-wordflower-container .hpwf-progress-stat strong { display:block; font-size:16px; color:#9d4147; font-weight:900; }
    #hp-wordflower-container .hpwf-progress-stat span { display:block; margin-top:3px; font-size:11px; color:#555; font-weight:900; text-transform:uppercase; }

    #hp-wordflower-container .hpwf-message { margin:0 0 16px; padding:13px 14px; border-radius:16px; background:#f7f9fb; border:1px solid #dde7ef; font-size:15px; line-height:1.35; color:#334; font-weight:800; text-align:center; min-height:48px; display:flex; align-items:center; justify-content:center; }
    #hp-wordflower-container .hpwf-message.success { background:#f3fff9; border-color:#bdeed4; color:#08753d; }
    #hp-wordflower-container .hpwf-message.error { background:#fff5f5; border-color:#f6b4b9; color:#8a1c1c; }
    #hp-wordflower-container .hpwf-message.reveal { background:#edf6ff; border-color:#b9d7ef; color:#0F7FBB; }

    #hp-wordflower-container .hpwf-current-word { min-height:44px; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; font-size:clamp(24px,4vw,34px); line-height:1.1; letter-spacing:.08em; color:#111; font-weight:900; text-align:center; }
    #hp-wordflower-container .hpwf-current-word.placeholder { color:#b0b8c0; letter-spacing:.02em; font-size:20px; }

    #hp-wordflower-container .hpwf-flower-wrap { display:flex; justify-content:center; margin:4px auto 16px; }
    #hp-wordflower-container .hpwf-flower { position:relative; width:360px; height:360px; max-width:100%; }
    #hp-wordflower-container .hpwf-flower-core { position:absolute; left:105px; top:105px; width:150px; height:150px; border-radius:50%; background:#fff8f8; border:7px solid #f7c7ca; box-shadow:0 12px 24px rgba(0,0,0,.06); }
    #hp-wordflower-container .hpwf-letter { position:absolute; border-radius:50%; border:7px solid #f7c7ca; background:#fff; color:#9d4147; font-weight:900; font-size:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-family:inherit; transition:transform .12s ease, background .18s ease, border-color .18s ease; user-select:none; }
    #hp-wordflower-container .hpwf-letter:hover { transform:translateY(-2px); background:#fff5f6; }
    #hp-wordflower-container .hpwf-center-letter { left:122px; top:122px; width:116px; height:116px; background:#F68D91; color:#fff; border-color:#F68D91; z-index:3; box-shadow:0 9px 20px rgba(246,141,145,.32); }
    #hp-wordflower-container .hpwf-outer-letter { width:110px; height:110px; z-index:2; }
    #hp-wordflower-container .hpwf-pos-0 { left:125px; top:0; }
    #hp-wordflower-container .hpwf-pos-1 { left:235px; top:64px; }
    #hp-wordflower-container .hpwf-pos-2 { left:235px; top:186px; }
    #hp-wordflower-container .hpwf-pos-3 { left:125px; top:250px; }
    #hp-wordflower-container .hpwf-pos-4 { left:15px; top:186px; }
    #hp-wordflower-container .hpwf-pos-5 { left:15px; top:64px; }

    #hp-wordflower-container .hpwf-actions, #hp-wordflower-container .hpwf-hint-actions { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin:0 auto 10px; }
    #hp-wordflower-container .hpwf-actions button, #hp-wordflower-container .hpwf-hint-actions button { appearance:none; border-radius:14px; padding:11px 17px; font-size:15px; font-weight:900; font-family:inherit; cursor:pointer; border:2px solid #f7c7ca; background:#fff; color:#9d4147; transition:all .18s ease; }
    #hp-wordflower-container .hpwf-actions button:hover, #hp-wordflower-container .hpwf-hint-actions button:hover { transform:translateY(-1px); background:#fff5f6; }
    #hp-wordflower-container .hpwf-enter { background:#F68D91 !important; color:#fff !important; border-color:#F68D91 !important; min-width:120px; }
    #hp-wordflower-container .hpwf-danger { border-color:#f6b4b9 !important; color:#ED1B24 !important; }
    #hp-wordflower-container .hpwf-reveal { border-color:#b9d7ef !important; color:#0F7FBB !important; }
    #hp-wordflower-container .hpwf-hint-box { display:none; max-width:720px; margin:0 auto 12px; padding:12px; border-radius:16px; border:1px solid #dde7ef; background:#f7f9fb; font-weight:800; color:#3d4b58; line-height:1.45; }
    #hp-wordflower-container .hpwf-hint-box.on { display:block; }

    #hp-wordflower-container .hpwf-life-stats { margin-top:16px; padding:14px; border-radius:18px; background:#fff5f6; border:1px solid #f7c7ca; }
    #hp-wordflower-container .hpwf-life-title { text-align:center; margin:0 0 10px; font-size:18px; font-weight:900; color:#9d4147; }
    #hp-wordflower-container .hpwf-life-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
    #hp-wordflower-container .hpwf-life-item { background:#fff; border:1px solid #f7c7ca; border-radius:14px; padding:10px 8px; text-align:center; }
    #hp-wordflower-container .hpwf-life-item strong { display:block; color:#9d4147; font-size:22px; font-weight:900; line-height:1; }
    #hp-wordflower-container .hpwf-life-item span { display:block; margin-top:5px; color:#555; font-size:11px; font-weight:900; text-transform:uppercase; line-height:1.1; }

    #hp-wordflower-container .hpwf-word-panel h3 { margin:0 0 10px; text-align:center; font-size:23px; line-height:1.1; color:#9d4147; font-weight:900; }
    #hp-wordflower-container .hpwf-word-list { flex:1 1 auto; min-height:220px; overflow-y:auto; padding-right:6px; }
    #hp-wordflower-container .hpwf-empty { color:#666; text-align:center; font-weight:800; padding:20px 8px; }
    #hp-wordflower-container .hpwf-word-item { border:1px solid #e1e8ee; border-radius:12px; padding:8px 10px; margin-bottom:7px; background:#fff; display:flex; align-items:center; justify-content:space-between; gap:8px; }
    #hp-wordflower-container .hpwf-word-item.revealed { background:#edf6ff; border-color:#b9d7ef; color:#0F7FBB; }
    #hp-wordflower-container .hpwf-word-item.pangram { border-color:#f7c7ca; }
    #hp-wordflower-container .hpwf-word-text { font-weight:900; color:#222; }
    #hp-wordflower-container .hpwf-word-meta { display:flex; gap:5px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
    #hp-wordflower-container .hpwf-pill { display:inline-flex; align-items:center; justify-content:center; border-radius:999px; border:1px solid #dde7ef; background:#f7f9fb; color:#555; font-size:10px; font-weight:900; padding:4px 7px; text-transform:uppercase; }
    #hp-wordflower-container .hpwf-pill-pangram { color:#9d4147; background:#fff5f6; border-color:#f7c7ca; }
    #hp-wordflower-container .hpwf-pill-revealed { color:#0F7FBB; background:#edf6ff; border-color:#b9d7ef; }

    #hp-wordflower-container .hp-overlay { display:none; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,.45); align-items:center; justify-content:center; padding:20px; }
    #hp-wordflower-container .hp-overlay.on { display:flex; }
    #hp-wordflower-container .hp-modal { width:min(640px,100%); max-height:92vh; overflow:auto; background:#fff; border-radius:24px; box-shadow:0 22px 70px rgba(0,0,0,.28); padding:28px; text-align:center; }
    #hp-wordflower-container .hp-modal .material-symbols-outlined.hp-result-icon { font-size:42px; color:#9d4147; font-variation-settings:'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 40; }
    #hp-wordflower-container .hp-modal h3 { margin:10px 0 8px; font-size:34px; line-height:1.1; color:#9d4147; font-weight:900; }
    #hp-wordflower-container .hp-result-stats-line { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin:14px 0; color:#555; font-weight:900; }
    #hp-wordflower-container .hp-result-stats-line span { display:inline-flex; align-items:center; gap:4px; }
    #hp-wordflower-container .hp-modal-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:18px; }
    #hp-wordflower-container .hp-link-btn { appearance:none; border:2px solid #f7c7ca; background:#fff; color:#9d4147; border-radius:14px; padding:12px 14px; font-family:inherit; font-size:15px; font-weight:900; text-decoration:none; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    #hp-wordflower-container .hp-link-btn.primary { background:#F68D91; border-color:#F68D91; color:#fff; }
    #hp-wordflower-container .hp-link-btn.danger { color:#ED1B24; border-color:#f6b4b9; grid-column:1/-1; }
    #hp-wordflower-container .hp-modal small { display:block; margin-top:14px; color:#777; font-size:12px; }

    @media(max-width:900px){
      #hp-wordflower-container .hpwf-layout{grid-template-columns:1fr;}
      #hp-wordflower-container .hpwf-word-panel{max-height:none;}
      #hp-wordflower-container .hpwf-word-list{max-height:360px;}
    }
    @media(max-width:620px){
      #hp-wordflower-container .hpwf-panel{padding:14px;}
      #hp-wordflower-container .hpwf-progress-meta{grid-template-columns:1fr;}
      #hp-wordflower-container .hpwf-node-label{display:none;}
      #hp-wordflower-container .hpwf-vine::before{left:6%;right:6%;}
      #hp-wordflower-container .hpwf-life-grid{grid-template-columns:1fr 1fr;}
      #hp-wordflower-container .hpwf-flower{width:330px;height:330px;}
      #hp-wordflower-container .hpwf-flower-core{left:92px;top:92px;width:146px;height:146px;}
      #hp-wordflower-container .hpwf-center-letter{left:119px;top:119px;width:92px;height:92px;font-size:26px;}
      #hp-wordflower-container .hpwf-outer-letter{width:98px;height:98px;font-size:25px;border-width:6px;}
      #hp-wordflower-container .hpwf-pos-0{left:116px;top:0;}
      #hp-wordflower-container .hpwf-pos-1{left:220px;top:58px;}
      #hp-wordflower-container .hpwf-pos-2{left:220px;top:174px;}
      #hp-wordflower-container .hpwf-pos-3{left:116px;top:232px;}
      #hp-wordflower-container .hpwf-pos-4{left:12px;top:174px;}
      #hp-wordflower-container .hpwf-pos-5{left:12px;top:58px;}
      #hp-wordflower-container .hp-modal-actions{grid-template-columns:1fr;}
      #hp-wordflower-container .hp-link-btn.danger{grid-column:auto;}
    }
  `;

  function injectStyles() {
    if (document.getElementById("hp-wordflower-platform-engine-css-v10")) return;
    const style = document.createElement("style");
    style.id = "hp-wordflower-platform-engine-css-v10";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  let container = null;
  let mount = null;
  let puzzle = null;
  let state = null;

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
  function completionPct(){ return totalCount() ? Math.floor((foundCount()/totalCount())*100) : 0; }
  function currentScore(){ return foundWords().reduce((sum,w)=>sum+scoreWord(w),0); }
  function totalScore(){ return allWords().reduce((sum,w)=>sum+scoreWord(w),0); }
  function pangrams(){ return allWords().filter(isPangram); }
  function pangramsFound(){ return foundWords().filter(isPangram); }

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
      const found=Array.isArray(data.found) ? uniqueWords(data.found) : [];
      words += found.length;
      if(Array.isArray(data.pangramsFound)) pangramCount += uniqueWords(data.pangramsFound).length;
      else pangramCount += found.filter(w => Array.isArray(data.pangrams) ? data.pangrams.includes(w) : false).length;
      if(data.masterGardener || data.solved || data.masterGardenerAt) masters++;
      if(data.completed || data.completedAt || data.status === "complete") completes++;
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
      const wordsNeeded = Math.max(1, Math.ceil((next.min/100)*totalCount()) - foundCount());
      return `You are ${wordsNeeded} word${wordsNeeded===1?"":"s"} away from ${next.label}.`;
    }
    return `Welcome to today's Word Flower. Find words containing the center letter.`;
  }

  function renderProgress(){
    const pct=completionPct();
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
        <div class="hpwf-progress-percent">${pct}%</div>
      </div>
      <div class="hpwf-vine"><div class="hpwf-vine-fill" style="width:${vineWidth}%"></div>${nodes}</div>
      <div class="hpwf-progress-meta">
        <div class="hpwf-progress-stat"><strong>${foundCount()} / ${totalCount()}</strong><span>Words Found</span></div>
        <div class="hpwf-progress-stat"><strong>${pangramsFound().length} / ${pangrams().length}</strong><span>Pangrams Found</span></div>
        <div class="hpwf-progress-stat"><strong>${currentScore()} / ${totalScore()}</strong><span>Score</span></div>
      </div>
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
    if(!found.length){
      return `<div class="hpwf-empty">No words found yet. Start building!</div>`;
    }
    const list=[...found].sort((a,b)=>a.length-b.length||a.localeCompare(b));
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
      <h3 class="hpwf-life-title">Your Word Flower Statistics</h3>
      <div class="hpwf-life-grid">
        <div class="hpwf-life-item"><strong>${s.words.toLocaleString()}</strong><span>Words Found</span></div>
        <div class="hpwf-life-item"><strong>${s.pangrams.toLocaleString()}</strong><span>Pangrams Found</span></div>
        <div class="hpwf-life-item"><strong>${s.masterPuzzles.toLocaleString()}</strong><span>Master Gardener Puzzles</span></div>
        <div class="hpwf-life-item"><strong>${s.completePuzzles.toLocaleString()}</strong><span>Puzzle Complete Puzzles</span></div>
      </div>
    </div>`;
  }

  function render(){
    normalizeState();
    const current = state.current ? escapeHtml(state.current) : "BUILD A WORD";
    mount.innerHTML = `<div class="hpwf-shell"><div class="hpwf-card"><div class="hpwf-layout">
      <section class="hpwf-panel hpwf-main-panel">
        ${renderProgress()}
        <div id="hpwf-message" class="hpwf-message ${state.lastMessageType||""}">${escapeHtml(state.lastMessage || messageForProgress())}</div>
        <div id="hpwf-current-word" class="hpwf-current-word ${state.current?"":"placeholder"}">${current}</div>
        ${renderFlower()}
        <div class="hpwf-actions">
          <button type="button" class="hpwf-enter" data-a="enter">Enter</button>
          <button type="button" data-a="delete">Delete</button>
          <button type="button" data-a="clear">Clear</button>
        </div>
        <div class="hpwf-hint-actions">
          <button type="button" data-a="hint-lengths">Word Lengths</button>
          <button type="button" data-a="hint-first">First Letter</button>
          <button type="button" data-a="hint-pattern">Word Pattern</button>
          <button type="button" class="hpwf-reveal" data-a="reveal-word">Reveal Word</button>
          <button type="button" class="hpwf-danger" data-a="reveal-all">Reveal All</button>
          <button type="button" class="hpwf-danger" data-a="reset">Reset Puzzle</button>
        </div>
        <div id="hpwf-hint-box" class="hpwf-hint-box"></div>
        ${renderLifeStats()}
      </section>
      <aside class="hpwf-panel hpwf-word-panel">
        <h3>Found Words</h3>
        <div class="hpwf-word-list">${renderWordList()}</div>
      </aside>
    </div>
      <div class="hp-overlay" id="hpwf-overlay" aria-hidden="true"><div class="hp-modal" role="dialog" aria-modal="true" aria-label="Word Flower result">
        <span id="hpwf-overlay-icon" class="material-symbols-outlined hp-result-icon" aria-hidden="true">celebration</span>
        <h3 id="hpwf-overlay-title">Congratulations!</h3>
        <div id="hpwf-overlay-meta" class="hp-result-stats-line"></div>
        <p id="hpwf-overlay-text"></p>
        <div class="hp-modal-actions">
          <a class="hp-link-btn primary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
          <a class="hp-link-btn" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>
          <button type="button" class="hp-link-btn" data-a="share">Share This Puzzle</button>
          <button type="button" class="hp-link-btn" data-a="close-overlay">Back to Puzzle</button>
          <button type="button" class="hp-link-btn danger" data-a="reset">Reset Puzzle</button>
        </div>
        <small>Hare Publishing • Word Flower</small>
      </div></div>
    </div></div>`;
    bindDynamicEvents();
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
  function submit(){
    if(state.revealAllUsed) return;
    const word=cleanWord(state.current);
    if(!word) return setMessage("Build or type a word first.","error");
    if(word.length < puzzle.minWordLength) return setMessage(`Words must be at least ${puzzle.minWordLength} letters.`,"error");
    if(!word.includes(puzzle.centerLetter)) return setMessage(`Every word must include the center letter ${puzzle.centerLetter}.`,"error");
    if(!usesOnlyLetters(word)) return setMessage("That word uses letters outside this flower.","error");
    if(!allWords().includes(word)) return setMessage("That is not one of the accepted words for this puzzle.","error");
    if(foundWords().includes(word)) return setMessage("You already found that word.","error");

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
    state.revealAllUsed=true; state.revealed=true; state.revealWordUsed=true; if(!state.revealedAt) state.revealedAt=nowIso();
    state.revealedWords=[...new Set([...revealedWords(), ...rem])];
    state.found=allWords(); state.current=""; state.status="revealed";
    setMessage("All remaining words have been revealed.","reveal");
    writeState(); render(); showOverlay("revealed");
  }
  function reset(){
    if(!confirm("Reset this puzzle and clear all progress?")) return;
    try{ localStorage.removeItem(storageKey()); }catch{}
    state=defaultState();
    markPlayed();
    render();
  }

  function showOverlay(kind){
    const overlay=container.querySelector("#hpwf-overlay");
    const icon=container.querySelector("#hpwf-overlay-icon");
    const title=container.querySelector("#hpwf-overlay-title");
    const meta=container.querySelector("#hpwf-overlay-meta");
    const text=container.querySelector("#hpwf-overlay-text");
    if(!overlay||!title||!meta||!text) return;
    if(kind==="master"){
      icon.textContent="home_and_garden";
      title.textContent="Master Gardener Achieved!";
      text.textContent="You reached the Word Flower success level. Keep searching to achieve Puzzle Complete.";
    }else if(kind==="complete"){
      icon.textContent="verified";
      title.textContent="Puzzle Complete!";
      text.textContent="You found every word in this Word Flower.";
    }else{
      icon.textContent="visibility";
      title.textContent="Answers Revealed";
      text.textContent="You revealed the remaining Word Flower answers.";
    }
    meta.innerHTML=`<span>Words Found: ${foundCount()} of ${totalCount()}</span><span>Pangrams Found: ${pangramsFound().length} of ${pangrams().length}</span>`;
    overlay.classList.add("on"); overlay.setAttribute("aria-hidden","false");
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
      if(a==="hint-lengths") hintLengths();
      if(a==="hint-first") hintFirst();
      if(a==="hint-pattern") hintPattern();
      if(a==="reveal-word") revealWord();
      if(a==="reveal-all") revealAll();
      if(a==="reset") reset();
      if(a==="close-overlay") hideOverlay();
      if(a==="share") share();
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

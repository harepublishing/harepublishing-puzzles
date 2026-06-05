/* =========================================================
   HARE PUBLISHING WORDROW PLATFORM ENGINE
   Version: 1.2

   Fixes/Features:
   - Uses same jsDelivr release/tag as this engine file for JSON data
   - Loads /data/wordrow/index.json and yearly files
   - Supports ?puzzle=ID
   - Hides future-dated puzzles by puzzleDate
   - Renders full puzzle panel + side toolbar
   - In-page puzzle loading for sidebar/carousel
   - Wordrow-specific localStorage + stats
   ========================================================= */
(function(){
  "use strict";

  const ENGINE_FILE = "hare-wordrow-platform-engine-v1.3.js";

  function detectBase(){
    const scripts = Array.from(document.scripts || []);
    const s = scripts.find(x => (x.src || "").includes("hare-wordrow-platform-engine-v1.3.js")) ||
              scripts.find(x => (x.src || "").includes("hare-wordrow-platform-engine-v1.0.js"));
    if (s && s.src) return s.src.replace(/\/hare-wordrow-platform-engine-v[\d.]+\.js(?:\?.*)?$/, "");
    return "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@wordrow-test-v1.0";
  }

  const BASE = detectBase();
  const DATA_BASE = `${BASE}/data/wordrow`;
  const ICON_URL = `${BASE}/icons/wordrow.webp`;
  const WORDROW_URL = "/wordrow-test";
  const ARCHIVE_URL = "/wordrow-archive";
  const MORE_PUZZLES_URL = "/online-puzzles";
  const SHOP_URL = "/shop";
  const FEEDBACK_URL = "/contact";
  const BUG_URL = "/contact";
  const PRIMARY = "#00A54F";
  const STORAGE_PREFIX = "hp_wordrow_platform_";
  const MAX_DEFAULT = 6;

  let root = null;
  let puzzleArea = null;
  let sideArea = null;
  let indexCache = null;
  const yearCache = new Map();
  let currentPuzzle = null;
  let currentState = null;
  let maxGuesses = MAX_DEFAULT;

  const css = `
  #hp-wordrow-platform{
    --hp-primary:#00A54F;
    --hp-primary-light:#F0FFF7;
    --hp-primary-soft:#C9F2DA;
    --hp-primary-dark:#007A3A;
    --hp-success:#00A54F;
    --hp-error:#ED1B24;
    --hp-blue:#107FBB;
    --hp-orange:#F7941C;
    width:100%;max-width:1220px;margin:0 auto;font-family:Roboto,Arial,sans-serif;color:#111;
  }
  #hp-wordrow-platform *{box-sizing:border-box;}
  .material-symbols-outlined,.hp-stat-icon,.hp-side-icon{font-family:"Material Symbols Outlined";font-weight:normal;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-feature-settings:"liga";-webkit-font-smoothing:antialiased;font-variation-settings:'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24;vertical-align:-3px;margin-right:4px;}
  .hp-wordrow-collection-note{text-align:center;font-size:15px;font-weight:800;color:#111;margin:0 0 8px;}
  .hp-wordrow-header{text-align:center;margin:0 auto 28px;}
  .hp-wordrow-title{margin:0;font-size:clamp(30px,4vw,48px);line-height:1.1;font-weight:900;color:var(--hp-primary-dark);}
  .hp-wordrow-date{margin-top:10px;font-size:17px;font-weight:800;color:#111;}
  .hp-wordrow-play-panel{background:#fff;border:1px solid #e9eef3;border-radius:22px;padding:22px;box-shadow:0 14px 40px rgba(0,0,0,.07);overflow:visible;}
  .hp-wordrow-layout{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:24px;align-items:start;overflow:visible;}
  .hp-wordrow-game-card{min-width:0;overflow:visible;}
  .hp-wordrow-side-card{background:var(--hp-primary-light);border:1px solid var(--hp-primary-soft);border-radius:18px;padding:14px;}
  .hp-side-btn{width:100%;border:2px solid var(--hp-primary-soft);background:#fff;color:var(--hp-primary-dark);border-radius:14px;padding:11px 10px;font-size:16px;font-weight:900;cursor:pointer;text-align:center;text-decoration:none;display:block;margin-bottom:8px;transition:all .18s ease;font-family:inherit;}
  .hp-side-btn:hover{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;transform:translateY(-1px);}
  .hp-support-links{display:flex;justify-content:center;gap:14px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,165,79,.22);}
  .hp-support-link{border:0;background:transparent;color:#666;font-size:12px;font-weight:900;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:4px 0;text-decoration:none;transition:color .18s ease;}
  .hp-support-link:hover{color:var(--hp-primary-dark);}.hp-support-link.feedback:hover{color:var(--hp-success);}.hp-support-link.bug:hover{color:var(--hp-error);}
  .hp-countdown-box{background:#fff;border:1px solid rgba(0,165,79,.25);border-radius:14px;padding:8px 10px;margin:0 0 7px;text-align:center;}
  .hp-countdown-label{font-size:11px;font-weight:900;color:var(--hp-primary-dark);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;}
  .hp-countdown-time{font-size:18px;line-height:1;font-weight:900;color:#111;margin-bottom:0;}
  .hp-next-wordrow-card{background:#fff;border:1px solid rgba(0,165,79,.25);border-radius:14px;padding:10px;margin:0 0 8px;text-align:center;}
  .hp-next-wordrow-title{font-size:12px;line-height:1.2;font-weight:900;color:var(--hp-primary-dark);margin:0 0 7px;}
  .hp-next-wordrow-card .hp-side-btn{margin-bottom:0;padding:10px 8px;font-size:15px;}
  .hp-next-wordrow-card .hp-next-hero-btn{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}
  .hp-next-wordrow-card .hp-next-hero-btn:hover{background:#fff;border-color:var(--hp-primary-soft);color:var(--hp-primary-dark);}
  .hp-next-wordrow-complete{display:block;width:100%;border:2px solid var(--hp-primary-soft);background:#fff;color:var(--hp-primary-dark);border-radius:14px;padding:10px 8px;font-size:14px;font-weight:900;line-height:1.25;}
  .hp-stat-box{background:#fff;border:1px solid rgba(0,165,79,.25);border-radius:14px;padding:7px 10px;margin:8px 0 8px;text-align:left;}
  .hp-stat-row{border-bottom:1px solid #eee;padding:7px 0;display:grid;grid-template-columns:38px 34px minmax(0,1fr);gap:8px;align-items:center;}
  .hp-stat-row:first-child{padding-top:0;}.hp-stat-row:last-child{border-bottom:0;padding-bottom:0;}
  .hp-stat-icon{font-size:34px;margin-right:0;color:var(--hp-primary-dark);align-self:center;justify-self:center;}
  .hp-stat-content{min-width:0;display:contents;}.hp-stat-main{display:block;font-size:24px;line-height:1;font-weight:900;color:var(--hp-primary-dark);text-align:center;}.hp-stat-label{display:block;font-size:13px;line-height:1.1;font-weight:900;margin-top:0;color:#111;text-align:left;}
  .hpwr-puzzle-title{text-align:center;margin:0 0 6px;font-size:clamp(26px,3vw,38px);font-weight:950;color:#111;}.hpwr-date{text-align:center;font-size:15px;font-weight:900;color:#555;margin-bottom:14px;}
  .hpwr-help{display:none;max-width:700px;margin:0 auto 16px;background:var(--hp-primary-light);border:1px solid var(--hp-primary-soft);border-radius:16px;padding:13px 14px;font-size:14px;line-height:1.45;font-weight:700;color:#244432;}.hpwr-help.on{display:block;}
  .hpwr-status{min-height:26px;text-align:center;font-weight:950;color:#334155;margin:10px auto 15px;text-transform:uppercase;font-size:13px;letter-spacing:.02em;}
  .hpwr-grid{display:grid;grid-template-rows:repeat(6,1fr);gap:8px;max-width:340px;margin:0 auto 18px;}.hpwr-row{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}.hpwr-tile{height:54px;border-radius:12px;border:2px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:25px;font-weight:950;user-select:none;background:#fff;color:#111;text-transform:uppercase;}.hpwr-tile.active{box-shadow:inset 0 0 0 4px var(--hp-blue);}.hpwr-tile.correct{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}.hpwr-tile.present{background:var(--hp-orange);border-color:var(--hp-orange);color:#fff;}.hpwr-tile.absent{background:#9AA0A6;border-color:#9AA0A6;color:#fff;}.hpwr-tile.revealed{background:var(--hp-blue);border-color:var(--hp-blue);color:#fff;}
  .hpwr-kb{max-width:640px;margin:0 auto 14px;}.hpwr-kb-row{display:grid;gap:7px;margin-bottom:8px;}.hpwr-kb-row:nth-child(1){grid-template-columns:repeat(10,1fr);}.hpwr-kb-row:nth-child(2){grid-template-columns:repeat(9,1fr);max-width:570px;margin-left:auto;margin-right:auto;}.hpwr-kb-row:nth-child(3){grid-template-columns:1.8fr repeat(7,1fr) 1.4fr;}.hpwr-key{appearance:none;width:100%;border:1px solid #ddd;background:#fff;color:#333;border-radius:11px;padding:12px 4px;font-size:16px;line-height:1;font-weight:950;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease;font-family:inherit;}.hpwr-key:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(0,0,0,.08);}.hpwr-key.correct{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}.hpwr-key.present{background:var(--hp-orange);border-color:var(--hp-orange);color:#fff;}.hpwr-key.absent{background:#9AA0A6;border-color:#9AA0A6;color:#fff;}
  .hpwr-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:8px;}.hpwr-btn,.hpwr-link-btn{appearance:none;border-radius:14px;font-family:inherit;font-weight:950;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:7px;transition:all .16s ease;}.hpwr-btn{border:2px solid #d7dde2;background:#fff;color:#1f2933;padding:10px 14px;font-size:14px;}.hpwr-btn:hover,.hpwr-link-btn:hover{transform:translateY(-1px);box-shadow:0 7px 16px rgba(0,0,0,.08);}.hpwr-btn.primary,.hpwr-link-btn.primary{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}.hpwr-btn.red{border-color:var(--hp-error);color:var(--hp-error);}
  .hpwr-loading,.hpwr-error{text-align:center;padding:38px 16px;font-weight:950;}.hpwr-error{color:#8a1c1c;background:#fff7f7;border:1px solid #ffd6d6;border-radius:16px;}.hpwr-error small{display:block;margin-top:8px;color:#666;font-weight:700;}
  .hpwr-overlay{position:fixed;inset:0;background:rgba(255,255,255,.78);backdrop-filter:blur(2px);display:none;align-items:center;justify-content:center;padding:20px;z-index:999999;}.hpwr-overlay.on{display:flex;}.hpwr-modal{width:100%;max-width:520px;background:#fff;border-radius:18px;border:1px solid #eee;box-shadow:0 20px 70px rgba(0,0,0,.18);padding:24px;text-align:center;}.hpwr-modal-icon{color:var(--hp-primary-dark);font-size:34px;margin:0 auto 10px;}.hpwr-modal h3{margin:5px 0 10px;font-size:24px;line-height:1.12;color:var(--hp-primary-dark);}.hpwr-modal-puzzle{font-size:20px;font-weight:900;color:var(--hp-primary-dark);margin-bottom:12px;}.hpwr-modal-stats{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin:12px 0;font-size:12px;font-weight:900;color:#555;}.hpwr-modal-stats span{display:inline-flex;align-items:center;gap:3px;}.hpwr-modal-stats .material-symbols-outlined{font-size:17px;color:var(--hp-primary-dark);}.hpwr-modal p{font-size:15px;line-height:1.45;color:#444;font-weight:500;margin:0 auto 8px;}.hpwr-next-panel{border:1px solid var(--hp-primary-soft);border-radius:16px;background:#fbfff8;padding:14px;margin:18px 0 12px;}.hpwr-next-panel-title{font-weight:900;color:var(--hp-primary-dark);margin-bottom:8px;}.hpwr-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;}.hpwr-link-btn{border:2px solid var(--hp-primary-soft);background:#fff;color:var(--hp-primary-dark);padding:11px 13px;font-size:14px;}.hpwr-link-btn.full{grid-column:1/-1;}.hpwr-link-btn.subtle{border-color:#d7dde2;color:#222;}
  @media(max-width:900px){.hp-wordrow-layout{grid-template-columns:1fr;}.hp-wordrow-side-card{position:static;}}
  @media(max-width:640px){.hp-wordrow-play-panel{padding:16px 12px;border-radius:18px;}.hpwr-grid{max-width:320px;gap:7px;}.hpwr-row{gap:7px;}.hpwr-tile{height:52px;border-radius:12px;font-size:23px;}.hpwr-kb-row{gap:5px;}.hpwr-key{font-size:14px;padding:12px 3px;border-radius:9px;}.hpwr-actions{display:grid;grid-template-columns:1fr 1fr;}.hpwr-actions .wide{grid-column:1/-1;}.hpwr-modal-actions{grid-template-columns:1fr;}.hpwr-link-btn.full{grid-column:auto;}}
  `;

  const esc = s => String(s ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const clean = v => String(v || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0,5);
  const num = v => Number(v || 0).toLocaleString();

  function localToday(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function parseDate(s, end=false){ const p = String(s || "").split("-"); if (p.length !== 3) return null; const d = new Date(Number(p[0]), Number(p[1])-1, Number(p[2]), end?23:0, end?59:0, end?59:0, end?999:0); return isNaN(d) ? null : d; }
  function isAvailable(p){ const d = parseDate(p && p.puzzleDate, true); return d && d <= new Date(); }
  function prettyDate(s){ const d = parseDate(s); return d ? d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" }) : (s || ""); }
  function shortDate(s){ const d = parseDate(s); return d ? d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" }) : (s || ""); }

  function normalizeIndex(raw){
    let arr = [];
    if (Array.isArray(raw)) arr = raw;
    else if (raw && Array.isArray(raw.puzzles)) arr = raw.puzzles;
    else if (raw && Array.isArray(raw.index)) arr = raw.index;
    else if (raw && raw.puzzleId) arr = [raw];
    return arr.map(x => ({ puzzleId: Number(x.puzzleId), puzzleDate: String(x.puzzleDate || ""), year: Number(x.year || String(x.puzzleDate || "").slice(0,4)) })).filter(x => x.puzzleId && x.puzzleDate && x.year);
  }
  function normalizeYear(raw){
    let arr = [];
    if (Array.isArray(raw)) arr = raw;
    else if (raw && Array.isArray(raw.puzzles)) arr = raw.puzzles;
    else if (raw && raw.puzzleId) arr = [raw];
    return arr.map(x => ({...x, puzzleId:Number(x.puzzleId), puzzleDate:String(x.puzzleDate || ""), answer:clean(x.answer), title:x.title || `Wordrow #${x.puzzleId}`, maxGuesses:Number(x.maxGuesses || MAX_DEFAULT)})).filter(x => x.puzzleId && x.answer.length === 5);
  }
  async function fetchJSON(url){
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache:"no-store" });
    if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
    return res.json();
  }
  async function loadIndex(){ if (indexCache) return indexCache; indexCache = normalizeIndex(await fetchJSON(`${DATA_BASE}/index.json`)); return indexCache; }
  async function loadYear(year){ if (yearCache.has(year)) return yearCache.get(year); const data = normalizeYear(await fetchJSON(`${DATA_BASE}/${year}.json`)); yearCache.set(year, data); return data; }
  async function availableIndex(){ return (await loadIndex()).filter(isAvailable).sort((a,b) => String(b.puzzleDate).localeCompare(String(a.puzzleDate)) || b.puzzleId-a.puzzleId); }
  async function findPuzzle(id){
    const idx = await loadIndex();
    let item = idx.find(x => Number(x.puzzleId) === Number(id));
    if (!item) throw new Error(`Wordrow puzzle #${id} was not found in index.json.`);
    if (!isAvailable(item)) throw new Error(`Wordrow puzzle #${id} is not available yet.`);
    const yearData = await loadYear(item.year);
    const puzzle = yearData.find(x => Number(x.puzzleId) === Number(id));
    if (!puzzle) throw new Error(`Wordrow puzzle #${id} was listed in index.json but was not found in ${item.year}.json.`);
    if (!isAvailable(puzzle)) throw new Error(`Wordrow puzzle #${id} is not available yet.`);
    return puzzle;
  }
  async function newestId(){ const a = await availableIndex(); if (!a.length) throw new Error("No Wordrow puzzles are currently available."); return a[0].puzzleId; }

  function stateKey(id){ return `${STORAGE_PREFIX}${id}`; }
  function safeParse(v){ try { return JSON.parse(v); } catch { return null; } }
  function blankState(){ return { guesses:[], statuses:[], current:"", startedAt:null, lastPlayedAt:null, solved:false, solvedAt:null, lost:false, revealed:false, revealedAt:null }; }
  function readState(id){ return Object.assign(blankState(), safeParse(localStorage.getItem(stateKey(id))) || {}); }
  function writeState(id, st){ st.lastPlayedAt = new Date().toISOString(); if (!st.startedAt && (st.current || (st.guesses && st.guesses.length))) st.startedAt = st.lastPlayedAt; localStorage.setItem(stateKey(id), JSON.stringify(st)); }
  function getStatus(id){
    const s = readState(id);
    if (s.solved || s.solvedAt) return "solved";
    if (s.lost || s.revealed || s.revealedAt) return "finished";
    if ((s.guesses && s.guesses.length) || s.current || s.startedAt) return "in-progress";
    return "not-started";
  }
  function hasMeaningfulProgress(s){ return !!(s.solved || s.solvedAt || s.lost || s.revealed || s.revealedAt || (s.guesses && s.guesses.length) || s.current || s.startedAt); }
  function getStatsFromIndex(idx){
    let solved = 0, progress = 0, played = 0;
    const solvedDates = new Set();
    idx.filter(isAvailable).forEach(p => {
      const s = readState(p.puzzleId);
      if (hasMeaningfulProgress(s)) played++;
      if (s.solved || s.solvedAt) { solved++; solvedDates.add(String(p.puzzleDate)); }
      else if ((s.guesses && s.guesses.length) || s.current || s.startedAt) progress++;
    });
    let streak = 0;
    const d = new Date();
    for (let i=0;i<5000;i++){
      const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      if (solvedDates.has(ymd)) { streak++; d.setDate(d.getDate()-1); }
      else break;
    }
    return { streak, solved, progress, played };
  }
  async function getStats(){ return getStatsFromIndex(await loadIndex()); }
  async function nextForUser(excludeId){
    const a = await availableIndex();
    const unfinished = a.find(p => p.puzzleId !== Number(excludeId) && getStatus(p.puzzleId) === "in-progress");
    if (unfinished) return unfinished;
    const notStarted = a.find(p => p.puzzleId !== Number(excludeId) && getStatus(p.puzzleId) === "not-started");
    if (notStarted) return notStarted;
    return a.find(p => p.puzzleId !== Number(excludeId)) || a[0] || null;
  }
  async function nextFuture(){
    const idx = await loadIndex();
    return idx.filter(p => !isAvailable(p)).sort((a,b) => String(a.puzzleDate).localeCompare(String(b.puzzleDate)) || a.puzzleId-b.puzzleId)[0] || null;
  }

  function injectAssets(){
    if (!document.getElementById("hp-wordrow-material-symbols")) { const l=document.createElement("link"); l.id="hp-wordrow-material-symbols"; l.rel="stylesheet"; l.href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400..700,0..1,-50..200"; document.head.appendChild(l); }
    if (!document.getElementById("hp-wordrow-platform-css")) { const st=document.createElement("style"); st.id="hp-wordrow-platform-css"; st.textContent=css; document.head.appendChild(st); }
  }

  function renderShell(){
    root.innerHTML = `
      <p class="hp-wordrow-collection-note">Part of the Wordrow collection in the Puzzlers Hub.</p>
      <header class="hp-wordrow-header">
        <h2 id="hp-wordrow-page-title" class="hp-wordrow-title">Wordrow Puzzle</h2>
        <div id="hp-wordrow-page-date" class="hp-wordrow-date"></div>
      </header>
      <div class="hp-wordrow-play-panel" id="hpwr-play-panel">
        <div class="hp-wordrow-layout">
          <main class="hp-wordrow-game-card" id="hpwr-game-card"><div class="hpwr-loading">Loading Wordrow puzzle...</div></main>
          <aside>
            <div class="hp-wordrow-side-card" id="hpwr-side" aria-label="Wordrow tools"></div>
          </aside>
        </div>
      </div>
      <div style="text-align:center;margin-top:25px;padding-top:15px;border-top:1px solid #eee;font-size:13px;color:#666;">© ${new Date().getFullYear()} harepublishing.com</div>`;
    puzzleArea = document.getElementById("hpwr-game-card");
    sideArea = document.getElementById("hpwr-side");
  }

  function evaluateGuess(guess, answer){
    const res = Array(5).fill("absent"), counts = {};
    for (let i=0;i<5;i++){ if (guess[i] === answer[i]) res[i]="correct"; else counts[answer[i]]=(counts[answer[i]]||0)+1; }
    for (let i=0;i<5;i++){ if (res[i] === "correct") continue; if (counts[guess[i]] > 0){ res[i]="present"; counts[guess[i]]--; } }
    return res;
  }
  function recompute(){
    currentState.statuses = (currentState.guesses || []).map(g => evaluateGuess(g, currentPuzzle.answer));
    currentState.solved = (currentState.guesses || []).includes(currentPuzzle.answer);
    currentState.lost = !currentState.solved && !currentState.revealed && (currentState.guesses || []).length >= maxGuesses;
  }
  function ended(){ return !!(currentState.solved || currentState.lost || currentState.revealed); }
  function statusText(){
    if (currentState.solved) return `Solved in ${currentState.guesses.length}/${maxGuesses}!`;
    if (currentState.revealed) return `Answer revealed: ${currentPuzzle.answer}`;
    if (currentState.lost) return `Good try — the word was ${currentPuzzle.answer}.`;
    const len = clean(currentState.current).length;
    if (!len && !(currentState.guesses||[]).length) return "Start by entering a five-letter word.";
    if (len < 5) return `${5-len} letter${5-len===1?"":"s"} to go.`;
    return "Press Enter to submit your guess.";
  }
  function renderGame(){
    if (!puzzleArea) return;
    const rows = [];
    const activeRow = Math.min((currentState.guesses || []).length, maxGuesses-1);
    const activeCol = Math.min(clean(currentState.current).length, 4);
    const revealRow = currentState.revealed ? Math.min((currentState.guesses || []).length, maxGuesses-1) : -1;
    for (let r=0;r<maxGuesses;r++){
      let word = "", statuses = null;
      if (r === revealRow) { word = currentPuzzle.answer; statuses = Array(5).fill("revealed"); }
      else if (currentState.guesses[r]) { word = currentState.guesses[r]; statuses = currentState.statuses[r] || []; }
      else if (r === (currentState.guesses || []).length && !ended()) { word = currentState.current || ""; }
      rows.push(`<div class="hpwr-row">${[0,1,2,3,4].map(c => `<div class="hpwr-tile ${statuses ? statuses[c] : ""} ${r===activeRow && c===activeCol && !ended()?"active":""}">${esc(word[c] || "")}</div>`).join("")}</div>`);
    }
    const keyStatus = {};
    (currentState.guesses || []).forEach((g,ri) => g.split("").forEach((ch,i) => { const s = (currentState.statuses[ri] || [])[i]; const rank = {absent:1,present:2,correct:3}; if (!keyStatus[ch] || rank[s] > rank[keyStatus[ch]]) keyStatus[ch]=s; }));
    const key = (label, val=label) => `<button type="button" class="hpwr-key ${keyStatus[val] || ""}" data-hpwr-key="${val}">${label}</button>`;
    const pageTitle = document.getElementById("hp-wordrow-page-title");
    const pageDate = document.getElementById("hp-wordrow-page-date");
    if (pageTitle) pageTitle.textContent = currentPuzzle.title || `Wordrow Puzzle #${currentPuzzle.puzzleId}`;
    if (pageDate) pageDate.textContent = prettyDate(currentPuzzle.puzzleDate);
    puzzleArea.innerHTML = `
      <h2 class="hpwr-puzzle-title">${esc(currentPuzzle.title || `Wordrow #${currentPuzzle.puzzleId}`)}</h2>
      <div class="hpwr-date">${esc(prettyDate(currentPuzzle.puzzleDate))}</div>
      <div class="hpwr-help" id="hpwr-help-panel"><strong>How to play:</strong> Guess the hidden five-letter word in six tries. Green letters are correct, orange letters are in the word but in the wrong spot, and gray letters are not in the word.</div>
      <div class="hpwr-status" id="hpwr-status">${esc(statusText())}</div>
      <div class="hpwr-grid" aria-label="Wordrow puzzle grid">${rows.join("")}</div>
      <div class="hpwr-kb" aria-label="Wordrow keyboard"><div class="hpwr-kb-row">${"QWERTYUIOP".split("").map(k=>key(k)).join("")}</div><div class="hpwr-kb-row">${"ASDFGHJKL".split("").map(k=>key(k)).join("")}</div><div class="hpwr-kb-row">${key("Enter","ENTER")}${"ZXCVBNM".split("").map(k=>key(k)).join("")}${key("⌫","BACK")}</div></div>
      <div class="hpwr-actions"><button type="button" class="hpwr-btn" data-hpwr-action="share"><span class="material-symbols-outlined" aria-hidden="true">share</span>Share</button><button type="button" class="hpwr-btn" data-hpwr-action="reveal"><span class="material-symbols-outlined" aria-hidden="true">visibility</span>Reveal</button><button type="button" class="hpwr-btn red wide" data-hpwr-action="reset"><span class="material-symbols-outlined" aria-hidden="true">restart_alt</span>Reset Puzzle</button></div>`;
    renderSide();
  }

  async function renderSide(){
    if (!sideArea) return;
    const [stats, next] = await Promise.all([getStats(), nextForUser(currentPuzzle && currentPuzzle.puzzleId)]);
    const nextHtml = next ? `<div class="hp-next-wordrow-card"><div class="hp-next-wordrow-title">Play Your Next Puzzle</div><button class="hp-side-btn hp-next-hero-btn" type="button" data-hpwr-load="${esc(next.puzzleId)}">Wordrow #${esc(next.puzzleId)}</button></div>` : `<div class="hp-next-wordrow-card"><div class="hp-next-wordrow-complete">Congratulations! All available Wordrow puzzles have been played.</div></div>`;
    sideArea.innerHTML = `
      <button class="hp-side-btn" type="button" data-hpwr-action="help">Help</button>
      ${nextHtml}
      <div class="hp-countdown-box">
        <div class="hp-countdown-label">Next Wordrow</div>
        <div class="hp-countdown-time" id="hpwr-countdown-time">--d --:--:--</div>
      </div>
      <a class="hp-side-btn" href="${ARCHIVE_URL}">Wordrow Archive</a>
      <a class="hp-side-btn" href="${MORE_PUZZLES_URL}">More Puzzles</a>
      <div class="hp-stat-box" id="hp-wordrow-player-stats">
        <div class="hp-stat-row"><span class="hp-stat-icon" aria-hidden="true">local_fire_department</span><span class="hp-stat-content"><span class="hp-stat-main">${num(stats.streak)}</span><span class="hp-stat-label">Day Streak</span></span></div>
        <div class="hp-stat-row"><span class="hp-stat-icon" aria-hidden="true">trophy</span><span class="hp-stat-content"><span class="hp-stat-main">${num(stats.solved)}</span><span class="hp-stat-label">Solved</span></span></div>
        <div class="hp-stat-row"><span class="hp-stat-icon" aria-hidden="true">pending_actions</span><span class="hp-stat-content"><span class="hp-stat-main">${num(stats.progress)}</span><span class="hp-stat-label">In Progress</span></span></div>
        <div class="hp-stat-row"><span class="hp-stat-icon" aria-hidden="true">beenhere</span><span class="hp-stat-content"><span class="hp-stat-main">${num(stats.played)}</span><span class="hp-stat-label">Played</span></span></div>
      </div>
      <div class="hp-support-links" aria-label="Puzzle support links">
        <a class="hp-support-link feedback" href="${FEEDBACK_URL}"><span class="hp-side-icon" aria-hidden="true">comment</span>Feedback</a>
        <a class="hp-support-link bug" href="${BUG_URL}"><span class="hp-side-icon" aria-hidden="true">bug_report</span>Report Bug</a>
      </div>`;
    updateCountdown();
  }

  async function getNextPublishDate(){
    const future = await nextFuture();
    if (future) return parseDate(future.puzzleDate);
    const idx = await loadIndex();
    const available = idx.filter(isAvailable).sort((a,b) => String(b.puzzleDate).localeCompare(String(a.puzzleDate)) || b.puzzleId-a.puzzleId);
    if (!available.length) return null;
    const last = parseDate(available[0].puzzleDate);
    if (!last) return null;
    last.setDate(last.getDate() + 7);
    return last;
  }

  async function updateCountdown(){
    const out = document.getElementById("hpwr-countdown-time");
    if (!out) return;
    const d = await getNextPublishDate();
    if (!d) { out.textContent = "--d --:--:--"; return; }
    const ms = d.getTime() - Date.now();
    if (ms <= 0) { out.textContent = "00d 00:00:00"; return; }
    const days = Math.floor(ms/86400000);
    const hrs = Math.floor((ms%86400000)/3600000);
    const mins = Math.floor((ms%3600000)/60000);
    const secs = Math.floor((ms%60000)/1000);
    out.textContent = `${String(days).padStart(2,"0")}d ${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  }

  function openHelp(){
    const panel = document.getElementById("hpwr-help-panel");
    if (!panel) return;
    panel.classList.toggle("on");
    panel.scrollIntoView({ behavior:"smooth", block:"center" });
  }

  function persist(){ writeState(currentPuzzle.puzzleId, currentState); }
  function flash(msg){ const el=document.getElementById("hpwr-status"); if (!el) return; const old=el.textContent; el.textContent=msg; el.style.color="#ED1B24"; setTimeout(()=>{ if (el){ el.textContent=statusText(); el.style.color="";} }, 1300); }
  function input(val){
    if (!currentPuzzle || ended()) return;
    if (val === "ENTER") return submit();
    if (val === "BACK") currentState.current = clean(currentState.current).slice(0,-1);
    else if (/^[A-Z]$/.test(val) && clean(currentState.current).length < 5) currentState.current = clean(currentState.current + val);
    persist(); renderGame(); fire("progress");
  }
  function submit(){
    const g = clean(currentState.current);
    if (g.length !== 5) { flash("Enter 5 letters first."); return; }
    currentState.guesses.push(g); currentState.current = ""; recompute();
    if (currentState.solved && !currentState.solvedAt) currentState.solvedAt = new Date().toISOString();
    persist(); renderGame();
    if (currentState.solved) showModal("solved");
    else if (currentState.lost) showModal("lost");
    fire(currentState.solved ? "solved" : currentState.lost ? "finished" : "progress");
  }
  function reset(){ if (!confirm("Reset this Wordrow puzzle?")) return; currentState = blankState(); persist(); renderGame(); fire("reset"); }
  function reveal(){ if (ended()) return; if (!confirm("Reveal the answer? This will end the puzzle.")) return; currentState.revealed=true; currentState.revealedAt=new Date().toISOString(); currentState.current=""; persist(); renderGame(); showModal("revealed"); fire("revealed"); }
  async function showModal(type){
    document.getElementById("hpwr-overlay")?.remove();
    const solved = type === "solved", lost = type === "lost";
    const title = solved ? "You Solved Wordrow!" : lost ? "Good Try!" : "Answer Revealed";
    const icon = solved ? "celebration" : lost ? "sports_score" : "visibility";
    const text = solved ? "Congratulations — you found the hidden word!" : `The word was ${currentPuzzle.answer}.`;
    const stats = await getStats();
    const next = await nextForUser(currentPuzzle && currentPuzzle.puzzleId);
    const nextPanel = next ? `<div class="hpwr-next-panel"><div class="hpwr-next-panel-title">Play Your Next Puzzle</div><p>Your next available Wordrow is ready. Keep the fun going with another five-letter word to solve.</p><button type="button" class="hpwr-link-btn primary" data-hpwr-action="next">Wordrow #${esc(next.puzzleId)}</button></div>` : `<div class="hpwr-next-panel"><div class="hpwr-next-panel-title">All caught up!</div><p>You have played every available Wordrow puzzle. Check back for the next puzzle.</p></div>`;
    document.body.insertAdjacentHTML("beforeend", `<div class="hpwr-overlay on" id="hpwr-overlay"><div class="hpwr-modal" role="dialog" aria-modal="true"><div class="hpwr-modal-icon material-symbols-outlined">${icon}</div><h3>${esc(title)}</h3><div class="hpwr-modal-puzzle">${esc(currentPuzzle.title || `Wordrow #${currentPuzzle.puzzleId}`)}</div><div class="hpwr-modal-stats"><span><span class="material-symbols-outlined">local_fire_department</span>${num(stats.streak)} Day Streak</span><span><span class="material-symbols-outlined">trophy</span>${num(stats.solved)} Solved</span><span><span class="material-symbols-outlined">pending_actions</span>${num(stats.progress)} In Progress</span><span><span class="material-symbols-outlined">beenhere</span>${num(stats.played)} Played</span></div><p><strong>${esc(text)}</strong></p><p>Keep your puzzle streak going in the Puzzlers Hub.</p>${nextPanel}<div class="hpwr-modal-actions"><a class="hpwr-link-btn primary" href="${MORE_PUZZLES_URL}">More Online Puzzles</a><a class="hpwr-link-btn" href="${SHOP_URL}">Get Puzzle Books</a><button type="button" class="hpwr-link-btn full subtle" data-hpwr-action="close-modal">Back to Puzzle</button></div><small style="display:block;margin-top:18px;color:#777;font-size:12px;">Hare Publishing • Wordrow</small></div></div>`);
  }
  function fire(status){ window.dispatchEvent(new CustomEvent("hare-wordrow-progress", { detail:{ puzzleId: currentPuzzle && currentPuzzle.puzzleId, status } })); }

  async function loadPuzzle(id, opts){
    opts = Object.assign({ push:true, scroll:true }, opts || {});
    try {
      if (!root) return;
      if (!puzzleArea) renderShell();
      puzzleArea.innerHTML = `<div class="hpwr-loading">Loading Wordrow puzzle...</div>`;
      const p = await findPuzzle(id);
      currentPuzzle = p; maxGuesses = Number(p.maxGuesses || MAX_DEFAULT); currentState = readState(p.puzzleId); recompute(); renderGame();
      if (opts.push) { const u = new URL(window.location.href); u.searchParams.set("puzzle", p.puzzleId); history.pushState({ hpWordrowPuzzle:p.puzzleId }, "", u.toString()); }
      if (opts.scroll) document.getElementById("hpwr-play-panel")?.scrollIntoView({ behavior:"smooth", block:"start" });
      fire("loaded");
    } catch (err) {
      if (!puzzleArea) renderShell();
      puzzleArea.innerHTML = `<div class="hpwr-error">${esc(err.message || "Could not load Wordrow puzzle.")}<small>Data base: ${esc(DATA_BASE)}</small></div>`;
    }
  }
  async function playNext(){ const n = await nextForUser(currentPuzzle && currentPuzzle.puzzleId); if (n) loadPuzzle(n.puzzleId, {push:true, scroll:true}); }
  async function init(opts){
    injectAssets();
    root = document.getElementById((opts && opts.containerId) || "hp-wordrow-platform") || document.getElementById("hp-wordrow-container");
    if (!root) return;
    if (root.id !== "hp-wordrow-platform") root.id = "hp-wordrow-platform";
    renderShell();
    const requested = new URLSearchParams(window.location.search).get("puzzle");
    const id = requested || await newestId();
    await loadPuzzle(id, { push:!!requested, scroll:false });
    if (!window.__hpWordrowCountdownTimer) window.__hpWordrowCountdownTimer = setInterval(updateCountdown, 1000);
  }
  function share(){ const data = { title:`${currentPuzzle.title} — Hare Publishing`, text: currentState.solved ? `I solved ${currentPuzzle.title} in ${currentState.guesses.length}/${maxGuesses}!` : `I'm playing ${currentPuzzle.title}.`, url:window.location.href }; if (navigator.share) navigator.share(data).catch(()=>{}); else navigator.clipboard?.writeText(window.location.href).then(()=>flash("Link copied!")); }

  document.addEventListener("click", e => {
    const key = e.target.closest("[data-hpwr-key]")?.dataset.hpwrKey; if (key) return input(key);
    const load = e.target.closest("[data-hpwr-load]")?.dataset.hpwrLoad; if (load) return loadPuzzle(load, {push:true, scroll:true});
    const a = e.target.closest("[data-hpwr-action]")?.dataset.hpwrAction; if (!a) return;
    if (a === "reset") reset(); else if (a === "reveal") reveal(); else if (a === "next") playNext(); else if (a === "share") share(); else if (a === "help") openHelp(); else if (a === "close-modal") document.getElementById("hpwr-overlay")?.remove();
  });
  document.addEventListener("keydown", e => {
    if (!root) return;
    const tag = (document.activeElement && document.activeElement.tagName || "").toLowerCase();
    if (["input","textarea","select"].includes(tag)) return;
    if (e.key === "Enter") { e.preventDefault(); input("ENTER"); }
    else if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); input("BACK"); }
    else if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); input(e.key.toUpperCase()); }
  });
  window.addEventListener("popstate", () => { const id = new URLSearchParams(window.location.search).get("puzzle"); if (id) loadPuzzle(id, {push:false, scroll:false}); });

  window.HareWordrowPlatform = { init, loadPuzzle, playNext, openHelp, loadIndex, loadYear, availableIndex, getStats, getStatus, readState, stateKey, nextForUser, config:{BASE,DATA_BASE,ICON_URL,WORDROW_URL,ARCHIVE_URL,STORAGE_PREFIX,PRIMARY} };
  window.HareWordrowLoadPuzzle = function(id){ return loadPuzzle(id, {push:true, scroll:true}); };
})();

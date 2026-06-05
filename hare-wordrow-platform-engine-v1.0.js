/* =========================================================
   HARE PUBLISHING WORDROW PLATFORM ENGINE
   Version: 1.0
   GitHub/jsDelivr hosted engine file

   Supports:
   - JSON puzzle loading from /data/wordrow/index.json and yearly files
   - Date-based publishing using puzzleDate
   - ?puzzle=ID loading
   - In-page puzzle switching
   - Wordrow progress/stat tracking
   - Next puzzle recommendation
   ========================================================= */

window.HareWordrowPlatform = (() => {
  const VERSION = "wordrow-platform-v1.0";
  const REPO_BASE = "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@main";
  const DATA_BASE = `${REPO_BASE}/data/wordrow`;
  const ICON_URL = `${REPO_BASE}/icons/wordrow.webp`;
  const WORDROW_URL = "/wordrow-test";
  const ARCHIVE_URL = "/wordrow-archive";
  const MORE_PUZZLES_URL = "/online-puzzles";
  const SHOP_URL = "/shop";
  const PRIMARY = "#00A54F";
  const STORAGE_PREFIX = "hp_wordrow_platform_";

  let container = null;
  let mount = null;
  let indexCache = null;
  const yearCache = new Map();
  let currentPuzzle = null;
  let currentState = null;
  let maxGuesses = 6;
  let activeRow = 0;
  let activeCol = 0;

  const css = `
  #hp-wordrow-container{font-family:Roboto,Arial,sans-serif;color:#1f2933;max-width:1180px;margin:0 auto;}
  #hp-wordrow-container *{box-sizing:border-box;}
  #hp-wordrow-container .material-symbols-outlined{font-family:'Material Symbols Outlined';font-weight:normal;font-style:normal;font-size:21px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-feature-settings:'liga';-webkit-font-smoothing:antialiased;}
  .hpwr-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;align-items:start;}
  .hpwr-card,.hpwr-side-card{background:#fff;border:1px solid #e9eef1;border-radius:22px;box-shadow:0 14px 38px rgba(0,0,0,.06);}
  .hpwr-card{padding:24px 18px;}
  .hpwr-header{text-align:center;margin-bottom:16px;}
  .hpwr-title{font-size:30px;line-height:1.1;font-weight:900;margin:0;color:#111;}
  .hpwr-date{font-size:14px;font-weight:800;color:#667085;margin-top:6px;}
  .hpwr-status{min-height:24px;text-align:center;font-weight:900;color:#334155;margin:12px auto 16px;}
  .hpwr-help{max-width:680px;margin:0 auto 16px;background:#f2fff8;border:1px solid rgba(0,165,79,.22);border-radius:16px;padding:14px;color:#315443;font-size:14px;line-height:1.45;font-weight:650;}
  .hpwr-grid{display:grid;grid-template-rows:repeat(6,1fr);gap:10px;max-width:370px;margin:0 auto 22px;}
  .hpwr-row{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
  .hpwr-tile{height:62px;border-radius:14px;border:2px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;user-select:none;background:#fff;color:#111;text-transform:uppercase;}
  .hpwr-tile.active{box-shadow:inset 0 0 0 4px #107FBB;}
  .hpwr-tile.correct{background:#00A54F;border-color:#00A54F;color:#fff;}
  .hpwr-tile.present{background:#F7941C;border-color:#F7941C;color:#fff;}
  .hpwr-tile.absent{background:#9AA0A6;border-color:#9AA0A6;color:#fff;}
  .hpwr-tile.revealed{background:#107FBB;border-color:#107FBB;color:#fff;}
  .hpwr-kb{max-width:700px;margin:0 auto 18px;}
  .hpwr-kb-row{display:grid;gap:8px;margin-bottom:10px;}
  .hpwr-kb-row:nth-child(1){grid-template-columns:repeat(10,1fr);}
  .hpwr-kb-row:nth-child(2){grid-template-columns:repeat(9,1fr);max-width:620px;margin-left:auto;margin-right:auto;}
  .hpwr-kb-row:nth-child(3){grid-template-columns:1.8fr repeat(7,1fr) 1.4fr;}
  .hpwr-key,.hpwr-btn,.hpwr-link-btn{appearance:none;border-radius:12px;font-weight:900;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:7px;transition:transform .08s ease,box-shadow .08s ease,background .2s ease;}
  .hpwr-key{width:100%;padding:14px 6px;border:1px solid #ddd;font-size:18px;background:#fff;color:#333;line-height:1;}
  .hpwr-key:hover,.hpwr-btn:hover,.hpwr-link-btn:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(0,0,0,.08);}
  .hpwr-key.correct{background:#00A54F;border-color:#00A54F;color:#fff;}.hpwr-key.present{background:#F7941C;border-color:#F7941C;color:#fff;}.hpwr-key.absent{background:#9AA0A6;border-color:#9AA0A6;color:#fff;}
  .hpwr-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:8px;}
  .hpwr-btn,.hpwr-link-btn{border:1px solid #d7dde2;background:#fff;color:#1f2933;padding:11px 14px;font-size:14px;}
  .hpwr-btn.primary,.hpwr-link-btn.primary{background:#00A54F;border-color:#00A54F;color:#fff;}.hpwr-link-btn.secondary{border-color:#107FBB;color:#107FBB;}.hpwr-btn.danger{border-color:#ED1B24;color:#ED1B24;}
  .hpwr-side{display:flex;flex-direction:column;gap:14px;position:sticky;top:18px;}
  .hpwr-side-card{padding:16px;}.hpwr-side-title{margin:0 0 10px;font-size:16px;font-weight:950;color:#111;display:flex;align-items:center;gap:8px;}.hpwr-side-text{font-size:13px;color:#52616d;line-height:1.45;margin:0 0 12px;font-weight:650;}
  .hpwr-side-actions{display:grid;gap:9px;}.hpwr-side-link{border:1px solid #e0e6ea;border-radius:14px;padding:11px 12px;text-decoration:none;color:#1f2933;background:#fff;font-weight:900;font-size:14px;display:flex;align-items:center;gap:8px;justify-content:center;}.hpwr-side-link.primary{background:#00A54F;color:#fff;border-color:#00A54F;}.hpwr-side-link.blue{color:#107FBB;border-color:#107FBB;}
  .hpwr-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}.hpwr-stat{border:1px solid #edf0f2;border-radius:14px;padding:10px;text-align:center;background:#fafafa;}.hpwr-stat-num{font-size:23px;line-height:1;font-weight:950;color:#00A54F;}.hpwr-stat-label{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#667085;font-weight:900;margin-top:4px;}
  .hpwr-small-links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:10px;}.hpwr-small-links a{font-size:12px;color:#667085;text-decoration:underline;font-weight:700;}
  .hpwr-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;padding:20px;z-index:999999;}.hpwr-overlay.on{display:flex;}.hpwr-modal{width:100%;max-width:540px;background:#fff;border-radius:18px;border:1px solid #eee;box-shadow:0 20px 70px rgba(0,0,0,.25);padding:22px;text-align:center;}.hpwr-modal-icon{width:54px;height:54px;border-radius:18px;background:#f2fff8;color:#00A54F;display:grid;place-items:center;margin:0 auto 10px;}.hpwr-modal h3{margin:4px 0 8px;font-size:25px;}.hpwr-badges{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0;}.hpwr-badge{border:1px solid #eee;background:#fafafa;border-radius:999px;padding:6px 10px;font-size:12px;color:#444;font-weight:800;}.hpwr-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}.hpwr-modal-actions .full{grid-column:span 2;}
  .hpwr-loading,.hpwr-error{text-align:center;padding:38px 16px;font-weight:900;}.hpwr-error{color:#8a1c1c;background:#fff7f7;border:1px solid #ffd6d6;border-radius:16px;}
  @media(max-width:900px){.hpwr-layout{grid-template-columns:1fr;}.hpwr-side{position:static;}.hpwr-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));}.hpwr-side-card.full{grid-column:1/-1;}}
  @media(max-width:640px){.hpwr-card{padding:18px 12px;border-radius:18px;}.hpwr-title{font-size:25px;}.hpwr-grid{max-width:330px;gap:8px;}.hpwr-row{gap:8px;}.hpwr-tile{height:56px;border-radius:12px;font-size:24px;}.hpwr-kb-row{gap:5px;}.hpwr-key{font-size:14px;padding:13px 3px;border-radius:9px;}.hpwr-side{display:flex;}.hpwr-modal-actions{grid-template-columns:1fr;}.hpwr-modal-actions .full{grid-column:span 1;}.hpwr-help{font-size:13px;}.hpwr-actions{display:grid;grid-template-columns:1fr 1fr;}.hpwr-actions .wide{grid-column:span 2;}}
  `;

  function injectAssets(){
    if(!document.getElementById("hpwr-material-symbols")){
      const link=document.createElement("link");link.id="hpwr-material-symbols";link.rel="stylesheet";link.href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0";document.head.appendChild(link);
    }
    if(!document.getElementById("hpwr-platform-css")){
      const style=document.createElement("style");style.id="hpwr-platform-css";style.textContent=css;document.head.appendChild(style);
    }
  }
  const clean = v => String(v||"").toUpperCase().replace(/[^A-Z]/g,"");
  const esc = s => String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const todayYMD = () => {const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
  const isAvailable = item => String(item?.puzzleDate||"") <= todayYMD();
  const prettyDate = ymd => {const m=String(ymd||"").match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return ymd||""; return new Date(+m[1],+m[2]-1,+m[3]).toLocaleDateString(undefined,{weekday:"long",year:"numeric",month:"long",day:"numeric"});};
  const storageKey = id => `${STORAGE_PREFIX}${id}`;
  const defaultState = () => ({guesses:[],statuses:[],current:"",solved:false,revealed:false,lost:false,solvedAt:"",revealedAt:"",overlaySeen:false});
  function readState(id){try{const raw=localStorage.getItem(storageKey(id));return raw?{...defaultState(),...JSON.parse(raw)}:defaultState();}catch{return defaultState();}}
  function writeState(id,state){try{localStorage.setItem(storageKey(id),JSON.stringify(state));}catch{}}
  function hasProgress(s){return !!(s?.solved||s?.revealed||s?.lost||(s?.guesses&&s.guesses.length)||s?.current);}
  async function fetchJson(url){const r=await fetch(`${url}?v=${Date.now()}`,{cache:"no-store"}); if(!r.ok) throw new Error(`Could not load ${url}`); return r.json();}
  async function loadIndex(){ if(indexCache) return indexCache; const data=await fetchJson(`${DATA_BASE}/index.json`); indexCache=(Array.isArray(data)?data:data.puzzles||[]).map(x=>({puzzleId:String(x.puzzleId),puzzleDate:String(x.puzzleDate),year:Number(x.year||String(x.puzzleDate).slice(0,4))})).filter(x=>x.puzzleId&&x.puzzleDate&&x.year); return indexCache; }
  async function loadYear(year){ if(yearCache.has(year)) return yearCache.get(year); const data=await fetchJson(`${DATA_BASE}/${year}.json`); const puzzles=Array.isArray(data)?data:data.puzzles||[]; yearCache.set(year,puzzles); return puzzles; }
  async function getAvailableIndex(){ const idx=await loadIndex(); return idx.filter(isAvailable).sort((a,b)=>String(a.puzzleDate).localeCompare(String(b.puzzleDate))||Number(a.puzzleId)-Number(b.puzzleId)); }
  async function getPuzzle(id){ const idx=await loadIndex(); const row=idx.find(x=>String(x.puzzleId)===String(id)); if(!row) throw new Error(`Wordrow puzzle #${id} was not found.`); if(!isAvailable(row)) throw new Error(`Wordrow puzzle #${id} is not available yet.`); const yearData=await loadYear(row.year); const puzzle=yearData.find(x=>String(x.puzzleId)===String(id)); if(!puzzle) throw new Error(`Wordrow puzzle #${id} is missing from ${row.year}.json.`); const answer=clean(puzzle.answer||puzzle.ANSWER); if(answer.length!==5) throw new Error(`Wordrow puzzle #${id} answer must be exactly 5 letters.`); return {...puzzle,puzzleId:String(row.puzzleId),puzzleDate:row.puzzleDate,year:row.year,answer,title:puzzle.title||`Wordrow #${row.puzzleId}`,maxGuesses:Number(puzzle.maxGuesses||6)}; }
  async function newestPuzzleId(){ const avail=await getAvailableIndex(); if(!avail.length) throw new Error("No Wordrow puzzles are available yet."); return avail[avail.length-1].puzzleId; }
  async function nextForUser(excludeId){ const avail=(await getAvailableIndex()).slice().sort((a,b)=>String(b.puzzleDate).localeCompare(String(a.puzzleDate))||Number(b.puzzleId)-Number(a.puzzleId)); const unfinished=avail.find(p=>String(p.puzzleId)!==String(excludeId)&&(()=>{const s=readState(p.puzzleId);return hasProgress(s)&&!s.solved&&!s.revealed&&!s.lost;})()); if(unfinished) return unfinished.puzzleId; const notStarted=avail.find(p=>String(p.puzzleId)!==String(excludeId)&&!hasProgress(readState(p.puzzleId))); if(notStarted) return notStarted.puzzleId; return avail.find(p=>String(p.puzzleId)!==String(excludeId))?.puzzleId || avail[0]?.puzzleId; }
  function getStats(){ const keys=Object.keys(localStorage).filter(k=>k.startsWith(STORAGE_PREFIX)); let solved=0,inProgress=0,played=0; const days=new Set(); keys.forEach(k=>{try{const s=JSON.parse(localStorage.getItem(k)||"{}"); if(hasProgress(s)) played++; if(s.solved){solved++; const day=String(s.solvedAt||"").slice(0,10); if(day) days.add(day);} else if(hasProgress(s) && !s.revealed && !s.lost) inProgress++;}catch{}}); let streak=0; const d=new Date(); while(true){const y=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; if(days.has(y)){streak++; d.setDate(d.getDate()-1);} else break;} return {streak,solved,inProgress,played}; }
  function statusFor(id){const s=readState(id); if(s.solved) return "Solved"; if(s.revealed) return "Revealed"; if(s.lost) return "Finished"; if(hasProgress(s)) return "In Progress"; return "Not Started";}
  function progressPercent(id){const s=readState(id); if(s.solved||s.revealed||s.lost) return 100; return Math.min(100, Math.round((((s.guesses||[]).length + (s.current?0.35:0))/6)*100));}
  function renderShell(){
    mount.innerHTML=`<div class="hpwr-layout"><main class="hpwr-card"><div id="hpwr-game"></div></main><aside class="hpwr-side" id="hpwr-side"></aside></div>`;
  }
  function renderSide(){
    const st=getStats();
    document.getElementById("hpwr-side").innerHTML=`
      <section class="hpwr-side-card"><h3 class="hpwr-side-title"><span class="material-symbols-outlined">help</span>Help</h3><p class="hpwr-side-text">Guess the five-letter word. Green means the letter is correct. Orange means the letter is in the word but in another spot. Gray means it is not used.</p></section>
      <section class="hpwr-side-card"><h3 class="hpwr-side-title"><span class="material-symbols-outlined">play_circle</span>Play Next</h3><div class="hpwr-side-actions"><button class="hpwr-side-link primary" data-a="next"><span class="material-symbols-outlined">arrow_forward</span>Play Your Next Puzzle</button><a class="hpwr-side-link blue" href="${ARCHIVE_URL}"><span class="material-symbols-outlined">inventory_2</span>Wordrow Archive</a><a class="hpwr-side-link" href="${MORE_PUZZLES_URL}"><span class="material-symbols-outlined">extension</span>More Puzzles</a></div></section>
      <section class="hpwr-side-card full"><h3 class="hpwr-side-title"><span class="material-symbols-outlined">monitoring</span>Stats</h3><div class="hpwr-stats-grid"><div class="hpwr-stat"><div class="hpwr-stat-num">${st.streak.toLocaleString()}</div><div class="hpwr-stat-label">Day Streak</div></div><div class="hpwr-stat"><div class="hpwr-stat-num">${st.solved.toLocaleString()}</div><div class="hpwr-stat-label">Solved</div></div><div class="hpwr-stat"><div class="hpwr-stat-num">${st.inProgress.toLocaleString()}</div><div class="hpwr-stat-label">In Progress</div></div><div class="hpwr-stat"><div class="hpwr-stat-num">${st.played.toLocaleString()}</div><div class="hpwr-stat-label">Played</div></div></div><div class="hpwr-small-links"><a href="/contact">Feedback</a><a href="/contact">Report Bug</a></div></section>`;
  }
  function evaluate(guess,answer){ const res=Array(5).fill("absent"), counts={}; for(let i=0;i<5;i++) counts[answer[i]]=(counts[answer[i]]||0)+1; for(let i=0;i<5;i++){if(guess[i]===answer[i]){res[i]="correct";counts[guess[i]]--;}} for(let i=0;i<5;i++){if(res[i]==="correct") continue; if(counts[guess[i]]>0){res[i]="present";counts[guess[i]]--;}} return res; }
  function recompute(){ currentState.statuses=(currentState.guesses||[]).map(g=>evaluate(g,currentPuzzle.answer)); currentState.solved=(currentState.guesses||[]).includes(currentPuzzle.answer); currentState.lost=!currentState.solved&&!currentState.revealed&&currentState.guesses.length>=maxGuesses; }
  function renderGame(){
    const game=document.getElementById("hpwr-game"); activeRow=Math.min(currentState.guesses.length,maxGuesses-1); activeCol=Math.min(clean(currentState.current).length,4);
    const rows=[]; const revealRow=currentState.revealed?maxGuesses-1:-1;
    for(let r=0;r<maxGuesses;r++){let word="",statuses=null; if(r===revealRow){word=currentPuzzle.answer; statuses=Array(5).fill("revealed");} else if(currentState.guesses[r]){word=currentState.guesses[r]; statuses=currentState.statuses[r]||[];} else if(r===currentState.guesses.length && !isEnded()){word=currentState.current||"";} rows.push(`<div class="hpwr-row">${[0,1,2,3,4].map(c=>`<div class="hpwr-tile ${statuses?statuses[c]:""} ${r===activeRow&&c===activeCol&&!isEnded()?"active":""}">${esc(word[c]||"")}</div>`).join("")}</div>`); }
    const keyStatus={}; (currentState.guesses||[]).forEach((g,ri)=>g.split("").forEach((ch,i)=>{const s=currentState.statuses[ri]?.[i]; const rank={absent:1,present:2,correct:3}; if(!keyStatus[ch]||rank[s]>rank[keyStatus[ch]]) keyStatus[ch]=s;}));
    const key=(label,val=label)=>`<button class="hpwr-key ${keyStatus[val]||""}" data-key="${val}">${label}</button>`;
    game.innerHTML=`<div class="hpwr-header"><h2 class="hpwr-title">${esc(currentPuzzle.title)}</h2><div class="hpwr-date">${esc(prettyDate(currentPuzzle.puzzleDate))}</div></div><div class="hpwr-help"><strong>How to play:</strong> Enter a five-letter word. Green letters are correct, orange letters are in the word but in the wrong place, and gray letters are not in the word.</div><div class="hpwr-status" id="hpwr-status">${esc(statusText())}</div><div class="hpwr-grid">${rows.join("")}</div><div class="hpwr-kb"><div class="hpwr-kb-row">${"QWERTYUIOP".split("").map(k=>key(k)).join("")}</div><div class="hpwr-kb-row">${"ASDFGHJKL".split("").map(k=>key(k)).join("")}</div><div class="hpwr-kb-row">${key("Enter","ENTER")}${"ZXCVBNM".split("").map(k=>key(k)).join("")}${key("⌫","BACK")}</div></div><div class="hpwr-actions"><button class="hpwr-btn" data-a="share"><span class="material-symbols-outlined">share</span>Share</button><button class="hpwr-btn" data-a="reveal"><span class="material-symbols-outlined">visibility</span>Reveal</button><button class="hpwr-btn danger wide" data-a="reset"><span class="material-symbols-outlined">restart_alt</span>Reset Puzzle</button></div>`;
    renderSide();
  }
  function statusText(){ if(currentState.solved) return `Solved in ${currentState.guesses.length}/${maxGuesses}!`; if(currentState.revealed) return "Answer revealed."; if(currentState.lost) return `Good try — the word was ${currentPuzzle.answer}.`; if(currentState.guesses.length===0&&!currentState.current) return "Start by entering a five-letter word."; if(currentState.current.length<5) return `${5-currentState.current.length} letter${5-currentState.current.length===1?"":"s"} to go.`; return "Press Enter to submit your guess."; }
  function isEnded(){return currentState.solved||currentState.revealed||currentState.lost;}
  function persist(){writeState(currentPuzzle.puzzleId,currentState);}
  function submit(){ if(isEnded()) return; const g=clean(currentState.current); if(g.length!==5){flash("Enter 5 letters first.");return;} currentState.guesses.push(g); currentState.current=""; recompute(); if(currentState.solved){currentState.revealed=false;currentState.lost=false;if(!currentState.solvedAt)currentState.solvedAt=new Date().toISOString(); currentState.overlaySeen=true; persist(); renderGame(); showSuccess(); fireChanged("solved"); return;} if(currentState.lost){persist(); renderGame(); showLost(); fireChanged("finished"); return;} persist(); renderGame(); fireChanged("progress"); }
  function input(val){ if(!currentPuzzle||isEnded()) return; if(val==="ENTER") return submit(); if(val==="BACK"){currentState.current=clean(currentState.current).slice(0,-1);} else if(/^[A-Z]$/.test(val)&&currentState.current.length<5){currentState.current+=val;} persist(); renderGame(); fireChanged("progress"); }
  function flash(msg){const el=document.getElementById("hpwr-status"); if(el){el.textContent=msg; el.style.color="#ED1B24"; setTimeout(()=>{if(el){el.textContent=statusText();el.style.color="";}},1200);}}
  function reset(){ if(!confirm("Reset this Wordrow puzzle?")) return; currentState=defaultState(); persist(); renderGame(); fireChanged("reset"); }
  function reveal(){ if(isEnded()) return; if(!confirm("Reveal the answer? This will end the puzzle.")) return; currentState.revealed=true; currentState.lost=false; currentState.solved=false; currentState.current=""; currentState.revealedAt=new Date().toISOString(); persist(); renderGame(); showReveal(); fireChanged("revealed"); }
  function showModal(type){ const solved=type==="solved"; const lost=type==="lost"; const title=solved?"You Solved Wordrow!":lost?"Good Try!":"Answer Revealed"; const lead=solved?`You solved ${currentPuzzle.title} in ${currentState.guesses.length}/${maxGuesses}.`:`The word was ${currentPuzzle.answer}.`; const icon=solved?"celebration":lost?"sports_score":"visibility"; const html=`<div class="hpwr-overlay on" id="hpwr-overlay"><div class="hpwr-modal" role="dialog" aria-modal="true"><div class="hpwr-modal-icon"><span class="material-symbols-outlined">${icon}</span></div><h3>${title}</h3><div>${esc(lead)}</div><div class="hpwr-badges"><span class="hpwr-badge">${esc(currentPuzzle.title)}</span><span class="hpwr-badge">${esc(prettyDate(currentPuzzle.puzzleDate))}</span></div><div class="hpwr-modal-actions"><button class="hpwr-link-btn primary full" data-a="next"><span class="material-symbols-outlined">arrow_forward</span>Play Your Next Puzzle</button><a class="hpwr-link-btn secondary" href="${MORE_PUZZLES_URL}">More Online Puzzles</a><a class="hpwr-link-btn" href="${SHOP_URL}">Get Puzzle Books</a><button class="hpwr-link-btn" data-a="close-modal">Back to Puzzle</button></div><small>Hare Publishing • Wordrow</small></div></div>`; document.body.insertAdjacentHTML("beforeend",html); }
  function showSuccess(){showModal("solved");} function showLost(){showModal("lost");} function showReveal(){showModal("revealed");}
  function fireChanged(status){ window.dispatchEvent(new CustomEvent("hare-wordrow-progress",{detail:{puzzleId:currentPuzzle?.puzzleId,status}})); }
  async function loadPuzzle(id,{push=true,scroll=true}={}){ try{ if(!mount) return; mount.innerHTML=`<div class="hpwr-loading">Loading Wordrow puzzle...</div>`; const puzzle=await getPuzzle(id); currentPuzzle=puzzle; maxGuesses=Number(puzzle.maxGuesses||6); currentState=readState(puzzle.puzzleId); recompute(); renderShell(); renderGame(); if(push){const url=new URL(window.location.href); url.searchParams.set("puzzle",puzzle.puzzleId); history.pushState({wordrowPuzzle:puzzle.puzzleId},"",url.toString());} if(scroll) container.scrollIntoView({behavior:"smooth",block:"start"}); fireChanged("loaded"); }catch(err){mount.innerHTML=`<div class="hpwr-error">${esc(err.message||"Could not load Wordrow puzzle.")}</div>`;} }
  async function init(opts={}){ injectAssets(); container=document.getElementById(opts.containerId||"hp-wordrow-container"); if(!container) return; mount=container.querySelector(".hpwr-mount")||container; const params=new URLSearchParams(window.location.search); const requested=params.get("puzzle"); const id=requested||await newestPuzzleId(); await loadPuzzle(id,{push:!!requested,scroll:false}); }
  async function playNext(){ const id=await nextForUser(currentPuzzle?.puzzleId); if(id) loadPuzzle(id,{push:true,scroll:true}); }
  function share(){ const data={title:`${currentPuzzle.title} — Hare Publishing`,text:currentState.solved?`I solved ${currentPuzzle.title} in ${currentState.guesses.length}/${maxGuesses}!`:`I'm playing ${currentPuzzle.title} at Hare Publishing.`,url:window.location.href}; if(navigator.share) navigator.share(data).catch(()=>{}); else navigator.clipboard?.writeText(window.location.href).then(()=>flash("Link copied!")); }
  document.addEventListener("click",e=>{ const key=e.target.closest("[data-key]")?.dataset.key; if(key) input(key); const a=e.target.closest("[data-a]")?.dataset.a; if(!a) return; if(a==="reset") reset(); if(a==="reveal") reveal(); if(a==="next") playNext(); if(a==="share") share(); if(a==="close-modal") document.getElementById("hpwr-overlay")?.remove(); });
  document.addEventListener("keydown",e=>{ if(!container||!container.contains(document.activeElement) && document.activeElement!==document.body) return; if(e.key==="Enter"){e.preventDefault();input("ENTER");} else if(e.key==="Backspace"||e.key==="Delete"){e.preventDefault();input("BACK");} else if(/^[a-zA-Z]$/.test(e.key)){e.preventDefault();input(e.key.toUpperCase());} });
  window.addEventListener("popstate",()=>{const id=new URLSearchParams(window.location.search).get("puzzle"); if(id) loadPuzzle(id,{push:false,scroll:false});});
  return {init,loadPuzzle,playNext,getStats,statusFor,progressPercent,readState,storageKey,loadIndex,loadYear,getAvailableIndex,nextForUser,config:{DATA_BASE,ICON_URL,WORDROW_URL,ARCHIVE_URL,STORAGE_PREFIX,PRIMARY,VERSION}};
})();

<link id="hp-material-symbols-font" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400..700,0..1,-50..200">

<style>
/* =========================================================
   WORD SEARCH PLATFORM v3.2
   Clean consolidated production build.
   - Self-contained; no Squarespace CSS injection required.
   - Built to parallel Kriss Kross platform v4.1.
   - v3.2: Adds mobile wide-grid layout for more board space.
   - v3.8: Loads engine v3.0 so top-level words are display labels and placements stay normalized.
   - Uses Word Search theme color #0F7FBB.
   - Uses core-powered GitHub JSON loading.
   ========================================================= */

#hp-word-search-platform{
  --hp-primary:#0F7FBB;
  --hp-primary-light:#EAF6FD;
  --hp-primary-soft:#B9D7EF;
  --hp-primary-dark:#0B5F8F;
  --hp-success:#00A54F;
  --hp-error:#ED1B24;
  --hp-blue:#107FBB;
  --hp-green:#00A54F;
  --hp-red:#ED1B24;
  --hp-text:#333;
  --hp-dark:#24323d;
  --hp-muted:#51606c;
  --hp-soft-blue:#f7fbff;
  --hp-soft-bg:#fafcff;
  --hp-soft-border:#dceaf6;
  --hp-panel-border:#eee;
  --hp-modal-shadow:0 20px 70px rgba(0,0,0,.25);
  --hp-ws-stage-height:clamp(620px, calc(100vh - 210px), 760px);
  width:100%;
  max-width:1440px;
  margin:0 auto;
  font-family:Roboto,Arial,sans-serif;
  color:var(--hp-text);
}
#hp-word-search-platform *{box-sizing:border-box;}

#hp-word-search-platform .hp-wsp-collection-note{margin:0 auto 8px;max-width:460px;text-align:center;font-size:15px;font-weight:800;line-height:1.35;color:#111;}
#hp-word-search-platform .hp-wsp-header{text-align:center;margin:0 auto 26px;}
#hp-word-search-platform .hp-wsp-title{margin:0;font-size:clamp(30px,4vw,48px);line-height:1.1;font-weight:900;color:var(--hp-primary-dark);}
#hp-word-search-platform .hp-wsp-date{margin-top:10px;font-size:17px;font-weight:800;color:#111;}
#hp-word-search-platform .hp-wsp-play-panel{background:#fff;border:1px solid #e9eef3;border-radius:22px;padding:22px 22px 12px;box-shadow:0 14px 40px rgba(0,0,0,.07);overflow:visible;}
#hp-word-search-platform .hp-wsp-layout{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:24px;align-items:start;overflow:visible;}
#hp-word-search-platform .hp-wsp-layout>main,#hp-word-search-platform .hp-wsp-layout>aside{min-width:0;}
#hp-word-search-platform .hp-wsp-layout>main{overflow:hidden;}
#hp-word-search-platform .hp-wsp-layout>aside{overflow:visible;}
#hp-word-search-platform .hp-wsp-copyright{text-align:center;margin-top:8px;padding-top:7px;border-top:1px solid #eee;font-size:13px;line-height:1.1;color:#666;}

/* Platform right sidebar */
#hp-word-search-platform .hp-wsp-side-card{background:var(--hp-primary-light);border:1px solid var(--hp-primary-soft);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px;}
#hp-word-search-platform .hp-side-btn{width:100%;border:2px solid var(--hp-primary-soft);background:#fff;color:var(--hp-primary-dark);border-radius:14px;padding:11px 10px;font-size:16px;font-weight:900;cursor:pointer;text-align:center;text-decoration:none;display:block;transition:all .18s ease;}
#hp-word-search-platform .hp-side-btn:hover{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;transform:translateY(-1px);}
#hp-word-search-platform .hp-next-ws-card{padding:10px;text-align:center;}
#hp-word-search-platform .hp-next-ws-title{font-size:12px;line-height:1.2;font-weight:900;color:var(--hp-primary-dark);margin:0 0 7px;}
#hp-word-search-platform .hp-next-ws-card .hp-side-btn{margin-bottom:0;padding:10px 8px;font-size:15px;}
#hp-word-search-platform .hp-next-ws-card .hp-next-hero-btn{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}
#hp-word-search-platform .hp-next-ws-card .hp-next-hero-btn:hover{background:#fff;border-color:var(--hp-primary-soft);color:var(--hp-primary-dark);}
#hp-word-search-platform .hp-next-ws-complete{display:block;width:100%;border:2px solid var(--hp-primary-soft);background:#fff;color:var(--hp-primary-dark);border-radius:14px;padding:10px 8px;font-size:14px;font-weight:900;line-height:1.25;}
#hp-word-search-platform .hp-stat-box{padding:7px 10px;text-align:left;}
#hp-word-search-platform .hp-stat-row{border-bottom:1px solid #eee;padding:7px 0;display:grid;grid-template-columns:38px 34px minmax(0,1fr);gap:8px;align-items:center;}
#hp-word-search-platform .hp-stat-row:first-child{padding-top:0;}#hp-word-search-platform .hp-stat-row:last-child{border-bottom:0;padding-bottom:0;}
#hp-word-search-platform .hp-stat-icon,#hp-word-search-platform .hp-side-icon{font-family:"Material Symbols Outlined";font-weight:normal;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-feature-settings:"liga";-webkit-font-smoothing:antialiased;font-variation-settings:'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24;}
#hp-word-search-platform .hp-stat-icon{font-size:34px;color:var(--hp-primary-dark);justify-self:center;}
#hp-word-search-platform .hp-side-icon{font-size:18px;vertical-align:-3px;margin-right:4px;}
#hp-word-search-platform .hp-stat-content{min-width:0;display:contents;}
#hp-word-search-platform .hp-stat-main{display:block;font-size:24px;line-height:1;font-weight:900;color:var(--hp-primary-dark);text-align:center;}
#hp-word-search-platform .hp-stat-label{display:block;font-size:13px;line-height:1.1;font-weight:900;color:#111;text-align:left;}
#hp-word-search-platform .hp-support-links{display:flex;justify-content:center;gap:14px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(15,127,187,.25);}
#hp-word-search-platform .hp-support-link{border:0;background:transparent;color:#666;font-size:12px;font-weight:900;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:4px 0;text-decoration:none;transition:color .18s ease;}
#hp-word-search-platform .hp-support-link:hover{color:var(--hp-primary-dark);}#hp-word-search-platform .hp-support-link.feedback:hover{color:var(--hp-success);}#hp-word-search-platform .hp-support-link.bug:hover{color:var(--hp-error);}

/* Feedback/report modal */
#hp-word-search-platform .hp-platform-modal{display:none;position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.45);align-items:center;justify-content:center;padding:20px;}
#hp-word-search-platform .hp-platform-modal.on{display:flex;}
#hp-word-search-platform .hp-platform-modal-card{width:min(520px,100%);background:#fff;border-radius:20px;padding:24px;box-shadow:0 20px 70px rgba(0,0,0,.2);text-align:center;}
#hp-word-search-platform .hp-platform-modal-card h3{margin:0 0 12px;color:var(--hp-primary-dark);font-size:24px;}
#hp-word-search-platform .hp-platform-modal-card textarea{width:100%;min-height:130px;border:1px solid #ddd;border-radius:14px;padding:12px;font-family:inherit;font-size:15px;}
#hp-word-search-platform .hp-platform-close,#hp-word-search-platform .hp-platform-submit{margin-top:14px;border:0;background:var(--hp-primary);color:#fff;border-radius:14px;padding:12px 18px;font-weight:900;cursor:pointer;}
#hp-word-search-platform .hp-platform-small{font-size:13px;color:#666;margin-top:8px;}

/* Word Search engine mount */
#hp-wordsearch-container{width:100%;max-width:none;margin:0 auto;font-family:Roboto,Arial,sans-serif;color:var(--hp-text);position:relative;}
#hp-wordsearch-container *{box-sizing:border-box;}
#hp-wordsearch-container .hp-puzzle-date,#hp-wordsearch-container .hp-ws-top-panel,#hp-wordsearch-container .hp-ws-stats,#hp-wordsearch-container .hp-ws-progress{display:none;}
#hp-wordsearch-container .hp-ws-layout{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:18px;align-items:start;width:100%;max-width:100%;margin:0 auto;}
#hp-wordsearch-container .hp-ws-col-left,#hp-wordsearch-container .hp-ws-col-right{min-width:0;display:flex;}
#hp-wordsearch-container .hp-ws-col-right{max-width:220px;}
#hp-wordsearch-container .hp-ws-panel{width:100%;min-height:0;background:#fff;border:1px solid #e7edf3;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.06);padding:18px;overflow:hidden;}
#hp-wordsearch-container .hp-ws-col-left .hp-ws-panel{display:flex;flex-direction:column;height:auto;padding-bottom:16px;}
#hp-wordsearch-container .hp-ws-col-right .hp-ws-panel{display:flex;flex-direction:column;height:var(--hp-ws-word-panel-height, auto);max-height:var(--hp-ws-word-panel-height, none);min-height:0;overflow:hidden;}
#hp-wordsearch-container .hp-ws-theme-title{margin:0 0 16px;text-align:center;color:var(--hp-primary-dark);font-size:clamp(20px,2vw,28px);line-height:1.15;font-weight:900;}

#hp-wordsearch-container .hp-ws-status{display:flex;align-items:center;justify-content:center;width:min(720px,100%);min-height:58px;margin:0 auto 16px;padding:10px 14px;border:1px solid #dcebe7;border-radius:14px;background:#fff;color:#3d4b58;text-align:center;box-shadow:none;overflow:hidden;}
#hp-wordsearch-container .hp-ws-status-msg{display:block;font-size:.95rem;line-height:1.25;font-weight:900;color:#3d4b58;background:transparent!important;border:0!important;border-radius:0!important;padding:0!important;box-shadow:none!important;}

/* Board */
#hp-wordsearch-container .hp-ws-board-wrap{display:flex;justify-content:center;align-items:center;flex:0 0 auto;width:100%;overflow:visible;margin:0 0 28px;padding:0;background:transparent;border:0;border-radius:0;}
#hp-wordsearch-container .hp-ws-board{display:grid;gap:clamp(3px,.55vw,7px);width:min(100%, calc((var(--hp-ws-stage-height) - 148px)));max-width:100%;min-width:0;margin:0 auto;user-select:none;touch-action:manipulation;background:transparent;padding:0;}
#hp-wordsearch-container .hp-ws-cell{appearance:none;-webkit-appearance:none;display:flex;align-items:center;justify-content:center;aspect-ratio:1 / 1;width:100%;min-width:0;min-height:0;border:1px solid rgba(15,127,187,.14);border-radius:2px;background:#fbfdff;color:#40505a;font-size:clamp(.82rem,1.45vw,1.6rem);font-weight:900;line-height:1;cursor:pointer;box-shadow:none;transition:background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease,transform .08s ease;}
#hp-wordsearch-container .hp-ws-cell:hover{background:#fff;border-color:rgba(15,127,187,.28);transform:translateY(-1px);}
#hp-wordsearch-container .hp-ws-cell.is-anchor{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;box-shadow:0 8px 18px rgba(15,127,187,.18);}
#hp-wordsearch-container .hp-ws-cell.is-preview{background:#dff1fb;border-color:#9fcde8;color:#24323d;}
#hp-wordsearch-container .hp-ws-cell.is-assist-letter{background:#fff8d7;border-color:#f0c94a;color:#111;box-shadow:inset 0 0 0 2px rgba(240,201,74,.75);}
#hp-wordsearch-container .hp-ws-cell.is-found{background:rgba(15,127,187,.28);border-color:rgba(15,127,187,.82);color:#073f60;box-shadow:inset 0 0 0 2px rgba(15,127,187,.28),0 0 0 1px rgba(15,127,187,.08);}
#hp-wordsearch-container .hp-ws-cell.is-revealed{background:rgba(15,127,187,.24);border-color:rgba(15,127,187,.7);color:var(--hp-primary-dark);box-shadow:inset 0 0 0 2px rgba(15,127,187,.22);}
#hp-wordsearch-container .hp-ws-cell.is-selected-word-path{background:inherit;border-color:inherit;color:inherit;box-shadow:inherit;}
#hp-wordsearch-container .hp-ws-cell.is-assist-letter.is-found,#hp-wordsearch-container .hp-ws-cell.is-assist-letter.is-revealed{background:#fff8d7!important;border-color:#f0c94a!important;color:#111!important;box-shadow:inset 0 0 0 2px rgba(240,201,74,.82),0 0 0 1px rgba(240,201,74,.12)!important;}

/* Controls */
#hp-wordsearch-container .hp-puzzle-tools{display:flex;flex-direction:column;gap:10px;margin:0 0 14px;flex:0 0 auto;}
#hp-wordsearch-container .hp-puzzle-mobile-tools{display:none;}
#hp-wordsearch-container .hp-tool-btn,#hp-wordsearch-container .hp-ws-btn,#hp-wordsearch-container .hp-link-btn{appearance:none;-webkit-appearance:none;border-radius:12px;font-weight:800;cursor:pointer;transition:transform .08s ease,box-shadow .08s ease,background .2s ease,opacity .2s ease;}
#hp-wordsearch-container .hp-tool-btn{width:100%;min-height:42px;padding:8px 6px;border:1px solid var(--hp-soft-border);background:#fff;color:var(--hp-dark);font-size:.78rem;line-height:1.05;text-align:center;}
#hp-wordsearch-container .hp-tool-btn:hover,#hp-wordsearch-container .hp-ws-btn:hover,#hp-wordsearch-container .hp-link-btn:hover{transform:translateY(-1px);}
#hp-wordsearch-container .hp-tool-btn:active,#hp-wordsearch-container .hp-ws-btn:active,#hp-wordsearch-container .hp-link-btn:active{transform:translateY(0);}
#hp-wordsearch-container .hp-tool-btn.help-info{background:#f3f8ff;border-color:#bfd8ef;color:var(--hp-primary);}

#hp-wordsearch-container .hp-tool-btn.danger{color:var(--hp-red);border-color:rgba(237,27,36,.4);}
#hp-wordsearch-container .hp-tool-btn.reveal{color:var(--hp-primary);border-color:rgba(15,127,187,.4);}
#hp-wordsearch-container .hp-tool-btn.assist-toggle{display:inline-flex;align-items:center;justify-content:center;gap:6px;color:var(--hp-primary);border-color:rgba(15,127,187,.4);background:#fff;}
#hp-wordsearch-container .hp-tool-btn.assist-toggle .material-symbols-outlined{font-size:18px;line-height:1;font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24;}
#hp-wordsearch-container .hp-tool-btn.assist-toggle.active{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}
#hp-wordsearch-container .hp-ws-assist-tray{max-height:0;opacity:0;overflow:hidden;transform:translateY(-6px);pointer-events:none;transition:max-height .22s ease,opacity .18s ease,transform .18s ease;margin:0;}
#hp-wordsearch-container .hp-ws-assist-tray.open{max-height:130px;opacity:1;transform:translateY(0);pointer-events:auto;overflow:visible;}
#hp-wordsearch-container .hp-ws-assist-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
#hp-wordsearch-container .hp-ws-assist-option{min-height:36px;padding:7px 6px;border-radius:12px;border:1px solid var(--hp-primary-soft);background:#fff;color:var(--hp-primary-dark);font-family:inherit;font-size:.74rem;font-weight:900;line-height:1.08;cursor:pointer;}
#hp-wordsearch-container .hp-ws-assist-option.active{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}
#hp-wordsearch-container .hp-ws-assist-instruction{margin:8px 0 0;color:#555;font-size:.76rem;line-height:1.25;font-weight:800;text-align:center;}
#hp-wordsearch-container .hp-ws-actions{display:flex;justify-content:center;align-items:center;gap:10px;margin-top:auto;padding-top:12px;}
#hp-wordsearch-container .hp-ws-btn{appearance:none;-webkit-appearance:none;width:min(220px,48%);min-height:44px;padding:12px 18px;border-radius:12px;border:1px solid #ddd;background:#fff;color:#333;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;text-align:center;font-size:14px;font-weight:800;line-height:1.05;cursor:pointer;}
#hp-wordsearch-container .hp-ws-btn.reveal{color:var(--hp-primary);border-color:rgba(15,127,187,.4);}
#hp-wordsearch-container .hp-ws-btn.danger{color:var(--hp-red);border-color:rgba(237,27,36,.4);}

/* Word list */
#hp-wordsearch-container .hp-ws-words-header{display:block;margin:0 0 12px;flex:0 0 auto;}
#hp-wordsearch-container .hp-ws-words-header h3{margin:0 0 6px;font-size:1.28rem;line-height:1.15;color:var(--hp-primary-dark);font-weight:900;text-align:center;}
#hp-wordsearch-container .hp-ws-word-count{display:block;padding:0;border:0;border-radius:0;background:transparent;color:var(--hp-primary-dark);font-size:.86rem;line-height:1.2;font-weight:900;white-space:normal;box-shadow:none;text-align:center;}
#hp-wordsearch-container .hp-ws-word-list{display:grid;grid-template-columns:1fr;gap:6px;align-content:start;flex:1 1 auto;min-height:0;max-height:100%;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding-right:3px;scrollbar-gutter:stable;}
#hp-wordsearch-container .hp-ws-word-item{appearance:none;-webkit-appearance:none;font-family:inherit;cursor:pointer;width:100%;min-width:0;border-radius:10px;border:1px solid #e6edf3;background:#fff;color:#24323d;padding:6px 7px;min-height:38px;text-align:center;font-size:.78rem;font-weight:800;line-height:1.05;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;justify-content:center;gap:6px;}
#hp-wordsearch-container .hp-ws-word-item.is-found{background:#eefaf1;border-color:#bfe5ca;color:#0e7a3c;}
#hp-wordsearch-container .hp-ws-word-item.is-revealed{background:var(--hp-primary-light);border-color:var(--hp-primary);color:var(--hp-primary-dark);}
#hp-wordsearch-container .hp-ws-word-item.is-selected-assist{background:#eaf6fd;border-color:var(--hp-primary);color:var(--hp-primary-dark);box-shadow:inset 0 0 0 1px rgba(15,127,187,.22);}
#hp-wordsearch-container .hp-ws-word-item.is-selected-assist.is-found,#hp-wordsearch-container .hp-ws-word-item.is-selected-assist.is-revealed{box-shadow:none;}
#hp-wordsearch-container .hp-ws-word-item:disabled{cursor:default;opacity:1;}
#hp-wordsearch-container .hp-ws-word-item.is-found:disabled{background:#eefaf1;border-color:#bfe5ca;color:#0e7a3c;}
#hp-wordsearch-container .hp-ws-word-item.is-revealed:disabled{background:var(--hp-primary-light);border-color:var(--hp-primary);color:var(--hp-primary-dark);}
#hp-wordsearch-container .hp-ws-word-check{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;font-weight:900;color:var(--hp-success);font-size:.92rem;line-height:1;}
#hp-wordsearch-container .hp-ws-word-check.material-symbols-outlined{font-family:"Material Symbols Outlined";font-size:17px;font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24;}
#hp-wordsearch-container .hp-ws-word-item.is-revealed .hp-ws-word-check{color:var(--hp-primary);}

/* Result, reveal, and help modals */
#hp-wordsearch-container .hp-overlay{display:none;align-items:center;justify-content:center;}
#hp-wordsearch-container .hp-overlay.on{display:flex;}
#hp-wordsearch-container #hp-ws-overlay{position:absolute;inset:0;z-index:50;background:rgba(255,255,255,.78);border-radius:18px;padding:16px;overflow:hidden;}
#hp-wordsearch-container #hp-ws-help-modal{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);padding:20px;}
#hp-wordsearch-container .hp-modal{background:#fff;width:min(560px,100%);border-radius:22px;padding:26px;box-shadow:0 20px 70px rgba(0,0,0,.25);text-align:center;color:#222;border:0;}

/* v2.7 compact Success/Reveal card matched to Cryptogram/Knights & Knaves standard */
#hp-wordsearch-container .hp-result-modal{position:relative;width:min(720px,100%);max-width:720px;max-height:calc(100% - 24px);overflow-y:auto;overflow-x:hidden;background:#fff;border:1px solid #e9eef3;border-radius:18px;box-shadow:0 18px 48px rgba(0,0,0,.18);padding:30px 36px 32px;text-align:center;color:#555;}
#hp-wordsearch-container .hp-result-close{position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;border-radius:999px;background:#fff;color:var(--hp-primary-dark);box-shadow:0 2px 10px rgba(0,0,0,.10);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all .18s ease;}
#hp-wordsearch-container .hp-result-close:hover{background:var(--hp-primary);color:#fff;transform:translateY(-1px);}
#hp-wordsearch-container .hp-result-close .material-symbols-outlined{font-size:22px!important;font-variation-settings:'FILL' 0,'wght' 800,'GRAD' 0,'opsz' 24!important;}
#hp-wordsearch-container .hp-result-icon{display:inline-flex;align-items:center;justify-content:center;margin:0 auto 8px;color:var(--hp-primary-dark);font-size:30px!important;line-height:1;font-family:"Material Symbols Outlined";font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 40!important;}
#hp-wordsearch-container .hp-result-status{margin:0 0 8px;font-size:24px;line-height:1.1;font-weight:900;color:#555;}
#hp-wordsearch-container .hp-result-title{margin:0 0 18px;font-size:28px;line-height:1.15;font-weight:900;color:var(--hp-primary-dark);}
#hp-wordsearch-container .hp-result-stats-line{display:flex;flex-wrap:nowrap;justify-content:center;align-items:center;gap:0 18px;margin:12px auto 14px;color:#555;font-size:14px;line-height:1.25;font-weight:800;white-space:nowrap;overflow:visible;}
#hp-wordsearch-container .hp-result-stat-chip{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;color:#555;}
#hp-wordsearch-container .hp-result-stat-chip .material-symbols-outlined{font-family:"Material Symbols Outlined";color:var(--hp-primary-dark);font-size:16px!important;line-height:1;font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 40!important;}
#hp-wordsearch-container .hp-result-stat-chip strong{color:var(--hp-primary-dark);font-weight:900;}
#hp-wordsearch-container .hp-result-message{max-width:610px;margin:18px auto 16px;color:#555;font-weight:800;text-align:center;}
#hp-wordsearch-container .hp-result-message-main{margin:0 0 5px;font-size:22px;line-height:1.25;font-weight:900;}
#hp-wordsearch-container .hp-result-message-sub{margin:0;font-size:18px;line-height:1.25;font-weight:800;}
#hp-wordsearch-container .hp-result-actions{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:14px;}
#hp-wordsearch-container .hp-link-btn{appearance:none;-webkit-appearance:none;border:2px solid transparent;background:#fff;color:var(--hp-primary-dark);border-radius:14px;min-width:220px;min-height:42px;width:auto;padding:10px 22px;font-family:inherit;font-size:14px;line-height:1.1;font-weight:900;text-decoration:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all .18s ease;box-shadow:none;}
#hp-wordsearch-container .hp-link-btn.primary{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}
#hp-wordsearch-container .hp-link-btn.share{background:#fff;border-color:transparent;color:var(--hp-primary-dark);}
#hp-wordsearch-container .hp-link-btn:hover{transform:translateY(-1px);background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}
#hp-wordsearch-container .hp-link-btn.primary:hover{background:#fff;border-color:var(--hp-primary-soft);color:var(--hp-primary-dark);}

#hp-wordsearch-container .hp-help-modal-content{text-align:left;background:#f7f9fb;border:1px solid #dce8f2;border-radius:16px;padding:18px;margin:14px 0 6px;}
#hp-wordsearch-container .hp-help-line{display:block;margin:0 0 12px;color:var(--hp-muted);font-size:.95rem;line-height:1.45;font-weight:600;}
#hp-wordsearch-container .hp-help-line:last-child{margin-bottom:0;}
#hp-wordsearch-container .hp-help-modal-content strong{color:var(--hp-dark);font-weight:900;}

@media(max-width:900px){
  #hp-wordsearch-container .hp-result-modal{width:min(720px,100%);padding:22px 16px;}
  #hp-wordsearch-container .hp-result-stats-line{flex-wrap:wrap;gap:6px 12px;font-size:14px;}
  #hp-wordsearch-container .hp-result-actions{gap:10px;}
  #hp-wordsearch-container .hp-link-btn{min-width:0;}
}
@media(max-width:560px){
  #hp-wordsearch-container #hp-ws-overlay{padding:12px;}
  #hp-wordsearch-container .hp-result-modal{padding:34px 18px 28px;border-radius:18px;}
  #hp-wordsearch-container .hp-result-title{font-size:26px;}
  #hp-wordsearch-container .hp-result-message-main{font-size:20px;}
  #hp-wordsearch-container .hp-result-message-sub{font-size:17px;}
  #hp-wordsearch-container .hp-link-btn{width:100%;min-width:0;}
}

@media(max-width:1100px){
  #hp-kriss-kross-platform{--hp-kk-stage-height:auto;}
  #hp-word-search-platform .hp-kkp-layout{grid-template-columns:1fr;}
  #hp-word-search-platform .hp-kkp-side-card{max-width:360px;margin:0 auto;width:100%;}
  #hp-wordsearch-container .hp-kk-layout{grid-template-columns:1fr;}
  #hp-wordsearch-container .hp-kk-col-left,
  #hp-wordsearch-container .hp-kk-col-right{width:100%;max-width:100%;display:block;}
  #hp-wordsearch-container .hp-kk-col-left .hp-kk-panel,
  #hp-wordsearch-container .hp-kk-col-right .hp-kk-panel{height:auto;min-height:0;}
  #hp-wordsearch-container .hp-kk-board{width:100%;}
}
@media(max-width:980px){
  #hp-wordsearch-container .hp-kk-actions{display:none;}
  #hp-wordsearch-container .hp-puzzle-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 0 14px;}
  #hp-wordsearch-container .hp-puzzle-mobile-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 0;}
  #hp-wordsearch-container .hp-kk-word-list{max-height:440px;}
  #hp-wordsearch-container .hp-kk-board-wrap{margin-bottom:10px;}
}

@media(max-width:700px){
  #hp-wordsearch-container .hp-ws-cell.is-found,
  #hp-wordsearch-container .hp-ws-cell.is-revealed{
    background:rgba(15,127,187,.34);
    border-color:rgba(15,127,187,.90);
    box-shadow:inset 0 0 0 2px rgba(15,127,187,.34),0 0 0 1px rgba(15,127,187,.10);
  }
}
@media(max-width:700px){
  #hp-wordsearch-container .hp-ws-cell.is-assist-letter.is-found,
  #hp-wordsearch-container .hp-ws-cell.is-assist-letter.is-revealed{
    background:#fff8d7!important;
    border-color:#f0c94a!important;
    color:#111!important;
    box-shadow:inset 0 0 0 2px rgba(240,201,74,.82),0 0 0 1px rgba(240,201,74,.12)!important;
  }
}

#hp-wordsearch-container .hp-ws-cell.is-anchor.is-assist-letter{
  background:var(--hp-primary)!important;
  color:#fff!important;
  border-color:#f0c94a!important;
  box-shadow:
    0 0 0 2px rgba(240,201,74,.95),
    0 8px 18px rgba(15,127,187,.18)!important;
}

@media(max-width:1100px){
  #hp-word-search-platform{--hp-ws-stage-height:auto;}
  #hp-word-search-platform .hp-wsp-layout{grid-template-columns:1fr;}
  #hp-word-search-platform .hp-wsp-side-card{max-width:360px;margin:0 auto;width:100%;}
  #hp-wordsearch-container .hp-ws-layout{grid-template-columns:1fr;}
  #hp-wordsearch-container .hp-ws-col-left,
  #hp-wordsearch-container .hp-ws-col-right{width:100%;max-width:100%;display:block;}
  #hp-wordsearch-container .hp-ws-col-left .hp-ws-panel,
  #hp-wordsearch-container .hp-ws-col-right .hp-ws-panel{height:auto;min-height:0;}
  #hp-wordsearch-container .hp-ws-board{width:100%;}
}
@media(max-width:980px){
  #hp-wordsearch-container .hp-ws-actions{display:none;}
  #hp-wordsearch-container .hp-puzzle-tools{display:flex;flex-direction:column;gap:10px;margin:0 0 14px;flex:0 0 auto;}
  #hp-wordsearch-container .hp-puzzle-mobile-tools{display:flex;justify-content:center;align-items:center;gap:8px;margin:8px auto 0;}
  #hp-wordsearch-container .hp-puzzle-mobile-tools .hp-tool-btn{width:min(190px,48%);flex:0 1 190px;white-space:nowrap;font-size:.74rem;padding-left:8px;padding-right:8px;}
  #hp-wordsearch-container .hp-ws-word-list{max-height:440px;}
  #hp-wordsearch-container .hp-ws-board-wrap{margin-bottom:10px;}
}
@media(max-width:760px){
  #hp-wordsearch-container .hp-ws-word-list{grid-template-columns:repeat(2,minmax(0,1fr));max-height:none;overflow:visible;padding-right:0;}
  #hp-wordsearch-container .hp-ws-word-item{min-height:34px;padding:6px 7px;font-size:.76rem;}
}
@media(max-width:700px){
  #hp-wordsearch-container .hp-ws-board-wrap{justify-content:flex-start;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;padding-bottom:2px;}
  #hp-wordsearch-container .hp-ws-board{width:max(100%, var(--hp-ws-mobile-min-width, 0px));max-width:none;margin:0;}
  #hp-wordsearch-container .hp-ws-word-list{grid-template-columns:repeat(2,minmax(0,1fr));max-height:none;overflow:visible;padding-right:0;}
  #hp-wordsearch-container .hp-ws-word-item{min-height:34px;padding:6px 7px;font-size:.76rem;}
  #hp-wordsearch-container .hp-modal-actions{grid-template-columns:1fr;}
  #hp-wordsearch-container .hp-link-btn.full{grid-column:auto;}
}
@media(max-width:560px){
  #hp-word-search-platform .hp-wsp-play-panel{padding:14px;}
  #hp-word-search-platform .hp-wsp-title{font-size:30px;}
  #hp-word-search-platform .hp-wsp-header{margin-bottom:18px;}
  #hp-word-search-platform .hp-wsp-collection-note{font-size:14px;}
  #hp-wordsearch-container .hp-ws-panel{padding:14px;}
  #hp-wordsearch-container .hp-ws-board{gap:2px;}
  #hp-wordsearch-container .hp-ws-cell{border-radius:2px;font-size:clamp(.82rem,4vw,1.12rem);}
  #hp-wordsearch-container .hp-tool-btn{min-height:34px;padding:6px 3px;font-size:.66rem;}
  #hp-wordsearch-container .hp-puzzle-mobile-tools .hp-tool-btn{width:min(190px,48%);flex:0 1 190px;white-space:nowrap;font-size:.70rem;padding-left:5px;padding-right:5px;}
  #hp-wordsearch-container .hp-ws-word-list{max-height:none;overflow:visible;gap:6px;}
  #hp-wordsearch-container .hp-ws-word-item{min-height:34px;font-size:.76rem;}
}

/* v3.2 mobile wide-grid mode: let the grid use more of the phone screen. */
@media(max-width:700px){
  #hp-word-search-platform .hp-wsp-play-panel{
    width:calc(100vw - 12px);
    max-width:calc(100vw - 12px);
    margin-left:50%;
    margin-right:0;
    transform:translateX(-50%);
    padding:10px 8px 12px;
    border-radius:18px;
  }
  #hp-word-search-platform .hp-wsp-layout>main{
    overflow:visible;
  }
  #hp-wordsearch-container .hp-ws-col-left .hp-ws-panel{
    padding:10px;
    border-radius:14px;
  }
  #hp-wordsearch-container .hp-ws-status{
    width:100%;
    min-height:50px;
    margin-bottom:12px;
    padding:8px 10px;
  }
  #hp-wordsearch-container .hp-ws-board-wrap{
    margin-bottom:14px;
  }
  #hp-wordsearch-container .hp-ws-board{
    gap:2px;
  }
}

@media(max-width:420px){
  #hp-word-search-platform .hp-wsp-play-panel{
    width:calc(100vw - 8px);
    max-width:calc(100vw - 8px);
    padding:8px 6px 10px;
  }
  #hp-wordsearch-container .hp-ws-col-left .hp-ws-panel{
    padding:8px 6px;
  }
}


/* v2.1 mobile action button refinement */
@media(max-width:980px){
  #hp-wordsearch-container .hp-puzzle-mobile-tools{
    justify-content:center;
    flex-wrap:nowrap;
    gap:10px;
  }
  #hp-wordsearch-container .hp-puzzle-mobile-tools .hp-tool-btn{
    width:auto!important;
    min-width:142px!important;
    flex:0 0 auto!important;
    min-height:42px!important;
    padding:10px 14px!important;
    font-size:.82rem!important;
    line-height:1!important;
    white-space:nowrap!important;
  }
}
@media(max-width:420px){
  #hp-wordsearch-container .hp-puzzle-mobile-tools .hp-tool-btn{
    min-width:132px!important;
    padding-left:10px!important;
    padding-right:10px!important;
    font-size:.78rem!important;
  }
}


/* v2.7: compact Success/Reveal card aligned with Cryptogram and Hare platform cards. */

.hp-collection-box{background:#fff;border:1px solid var(--hp-primary-soft);border-radius:14px;padding:10px;text-align:left;}
.hp-collection-title{font-size:12px;line-height:1.2;font-weight:900;color:var(--hp-primary-dark);margin:0 0 7px;text-transform:none;letter-spacing:0;text-align:center;}
.hp-collection-line{font-size:14px;line-height:1.25;font-weight:900;color:#111;text-align:center;}
.hp-collection-bar{height:10px;border-radius:999px;background:#eef3f7;overflow:hidden;margin:9px 0 7px;border:1px solid rgba(0,0,0,.06);}
.hp-collection-fill{height:100%;width:0%;border-radius:999px;background:var(--hp-primary);transition:width .25s ease;}
.hp-collection-remaining{font-size:12px;font-weight:900;color:#555;text-align:center;}

#hp-word-search-platform .hp-next-ws-card,#hp-word-search-platform .hp-stat-box{background:#fff;border:1px solid var(--hp-primary-soft);border-radius:14px;}
.hp-scroll-cue-host{position:relative!important;}
.hp-scroll-cue-host::after{content:"";position:absolute;z-index:7;left:0;right:0;bottom:0;height:54px;background:linear-gradient(to bottom,rgba(255,255,255,0),rgba(255,255,255,.82) 48%,rgba(255,255,255,.97));border-radius:0 0 16px 16px;opacity:0;pointer-events:none;transition:opacity .18s ease;}
.hp-scroll-cue-host.has-scroll-cue::after{opacity:1;}
.hp-scroll-cue{position:absolute;z-index:8;left:50%;bottom:10px;transform:translate(-50%,4px);width:29px;height:29px;border:1.5px solid rgba(15,127,187,.72);border-radius:50%;background:rgba(255,255,255,.96);color:#0F7FBB;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 2px 8px rgba(15,127,187,.16);font:900 18px/1 Arial,sans-serif;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;}
.hp-scroll-cue::before{content:"⌄";transform:translateY(-2px);}
.hp-scroll-cue.is-visible{opacity:.9;pointer-events:auto;transform:translate(-50%,0);}
.hp-scroll-cue:hover,.hp-scroll-cue:focus-visible{opacity:1;}

</style>

<div id="hp-word-search-platform">
  <p class="hp-wsp-collection-note">Part of the Word Search collection in the Puzzlers Hub.</p>
  <header class="hp-wsp-header">
    <h2 id="hp-wsp-title" class="hp-wsp-title">Word Search Puzzle</h2>
    <div id="hp-wsp-date" class="hp-wsp-date"></div>
  </header>
  <div class="hp-wsp-play-panel">
    <div class="hp-wsp-layout">
      <main>
        <div id="hp-wordsearch-container" tabindex="0">
          <div class="hp-mount"><p style="text-align:center;">Loading Word Search...</p></div>
          <div class="hp-wsp-copyright">© <span id="hp-year"></span> harepublishing.com</div>
        </div>
      </main>
      <aside>
        <div class="hp-wsp-side-card">
          <button class="hp-side-btn" type="button" id="hp-side-help">Help</button>
          <div id="hp-ws-collection-slot" class="hp-collection-box"></div>
          <div id="hp-next-ws-slot"></div>
          <a class="hp-side-btn" href="/word-search-library">Word Search Library</a>
          <a class="hp-side-btn" href="/puzzlers-hub" data-hp-hub-link>Puzzlers Hub</a>
          <div class="hp-stat-box" id="hp-wsp-player-stats"></div>
          <div class="hp-support-links" aria-label="Puzzle support links">
            <button class="hp-support-link feedback" type="button" data-hp-message="feedback"><span class="hp-side-icon" aria-hidden="true">comment</span>Feedback</button>
            <button class="hp-support-link bug" type="button" data-hp-message="bug"><span class="hp-side-icon" aria-hidden="true">bug_report</span>Report Bug</button>
          </div>
        </div>
      </aside>
    </div>
  </div>
  <div id="hp-message-modal" class="hp-platform-modal" aria-hidden="true">
    <div class="hp-platform-modal-card">
      <h3 id="hp-message-title">Send Message</h3>
      <p class="hp-platform-small" id="hp-message-intro"></p>
      <textarea id="hp-message-text" placeholder="Type your message here..."></textarea>
      <br>
      <button class="hp-platform-submit" id="hp-message-send" type="button">Send</button>
      <button class="hp-platform-close" type="button" id="hp-message-close">Back to Puzzle</button>
      <p class="hp-platform-small" id="hp-message-status"></p>
    </div>
  </div>
</div>

<script>
(async () => {
  const RELEASE = window.HARE_PUZZLE_RELEASES?.wordSearch || "main";
  const CORE_RELEASE = window.HARE_PUZZLE_RELEASES?.platformCore || window.HARE_PUZZLE_RELEASES?.core || "main";
  const ICON_RELEASE = window.HARE_PUZZLE_RELEASES?.icons || "main";
  const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwb0uiowxfn8f_bTTPqI3jVBYRu8l96SVRqdS_0tg7FESslgVHA6j0lyKMApXnMhx9X/exec";
  const CORE_URL = `https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@${CORE_RELEASE}/hare-puzzle-core-platform-v1.4.js`;
  const ENGINE_URL = `https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@${RELEASE}/hare-word-search-platform-engine-v3.0.js`;

  const wordSearchCoreConfig = { puzzleType:"word-search", repo:"harepublishing/harepublishing-puzzles", release:RELEASE, storagePrefix:"hp2_ws_" };
  const PUBLIC_PLAY_PAGE_URL = window.HARE_WORD_SEARCH_PUBLIC_PLAY_URL || "/word-search";
  const MEMBER_PLAY_PAGE_URL = window.HARE_WORD_SEARCH_MEMBER_PLAY_URL || "/word-search-member";
  const ARCHIVE_PAGE_URL = window.HARE_WORD_SEARCH_ARCHIVE_URL || "/word-search-library";
  const normalizedPath = String(window.location.pathname || "").replace(/\/+$/, "") || "/";
  const pageMode = normalizedPath === MEMBER_PLAY_PAGE_URL ? "member" : "public";
  const PLAY_PAGE_URL = window.location.pathname || (pageMode === "member" ? MEMBER_PLAY_PAGE_URL : PUBLIC_PLAY_PAGE_URL);
  window.HareWordSearchPlayUrl = PLAY_PAGE_URL;
  const HUB_PAGE_URL = pageMode === "member" ? "/puzzlers-hub-member" : "/puzzlers-hub";
  const MEMBERSHIP_PAGE_URL = "/membership";
  document.querySelectorAll("[data-hp-hub-link]").forEach(link => { link.href = HUB_PAGE_URL; });
  window.HarePlatformNextCta = function(){ return isMemberAccess() ? { title:"You’ve Solved Them All!", label:"Browse All Puzzles", url:HUB_PAGE_URL } : { title:"Play Your Next Puzzle", label:"Unlock the Full Library", url:MEMBERSHIP_PAGE_URL }; };

  const container = document.getElementById("hp-wordsearch-container");
  const mount = container.querySelector(".hp-mount");
  const titleEl = document.getElementById("hp-wsp-title");
  const dateEl = document.getElementById("hp-wsp-date");
  const statsEl = document.getElementById("hp-wsp-player-stats");
  const nextSlot = document.getElementById("hp-next-ws-slot");
  const collectionSlot = document.getElementById("hp-ws-collection-slot");

  let Core = window.HarePuzzleCore || null;
  let currentPuzzleData = null;
  let currentMessageType = "";
  let availablePuzzles = [];
  let allAvailablePuzzles = [];
  let indexPuzzles = [];
  let accessConfig = null;
  let timerIntervalId = null;

  const statusAdapter = {
    isSolved(data){ return Boolean(data && !this.isRevealed(data) && (data.solved || data.status === "solved" || data.solvedAt)); },
    isRevealed(data){ return Boolean(data && (data.revealed || data.status === "revealed" || data.revealedAt)); },
    isFinished(data){ return Boolean(data && (data.solved || data.revealed || data.status === "solved" || data.status === "revealed" || data.solvedAt || data.revealedAt || data.finishedAt)); },
    hasProgress(data){ if(!data || this.isFinished(data)) return false; return Boolean((Array.isArray(data.foundWords) && data.foundWords.length > 0) || (Array.isArray(data.foundPathKeys) && data.foundPathKeys.length > 0)); },
    finishedDate(data){ if(!data) return null; return data.solvedAt || data.revealedAt || data.finishedAt || data.updatedAt || data.lastPlayedAt || null; }
  };

  function showError(message){ mount.innerHTML = `<div style="padding:20px; border:1px solid #ED1B24; background:#fff5f5; color:#8a1c1c; border-radius:12px; text-align:center;"><strong>Word Search Error:</strong><br>${message}</div>`; }
  function showMemberOnlyMessage(puzzleId){ const numberText=puzzleId ? ` #${Core.escapeHtml(puzzleId)}` : ""; mount.innerHTML=`<div style="padding:24px; border:1px solid var(--hp-primary-soft); background:var(--hp-primary-light); color:var(--hp-primary-dark); border-radius:16px; text-align:center;"><strong>Word Search${numberText} is in the member library.</strong><br><span style="display:block; margin-top:8px; color:#333; font-weight:800;">Join or sign in to keep playing older Word Search puzzles.</span><a class="hp-side-btn" style="width:auto; display:inline-block; margin-top:14px; padding:10px 18px;" href="${Core.escapeHtml(ARCHIVE_PAGE_URL)}">Open Library</a></div>`; }
  function loadExternalScript(src, globalName, errorMessage){ return new Promise((resolve,reject)=>{ if(globalName && window[globalName]) return resolve(); const existing=Array.from(document.scripts||[]).find(item=>item.src===src||item.getAttribute("src")===src); if(existing){ existing.addEventListener("load",resolve,{once:true}); existing.addEventListener("error",()=>reject(new Error(errorMessage||`Could not load script: ${src}`)),{once:true}); return; } const script=document.createElement("script"); script.src=src; script.onload=resolve; script.onerror=()=>reject(new Error(errorMessage||`Could not load script: ${src}`)); document.head.appendChild(script); }); }
  async function ensureCore(){ if(!Core){ await loadExternalScript(CORE_URL,"HarePuzzleCore","Could not load Hare Puzzle Core."); Core=window.HarePuzzleCore; } if(!Core) throw new Error("Hare Puzzle Core is required but was not available."); return Core; }
  function refreshAccessConfig(){ accessConfig=Core.getPuzzleAccessConfig("word-search",{mode:pageMode, pageMode:pageMode, publicPlayUrl:PUBLIC_PLAY_PAGE_URL, memberPlayUrl:MEMBER_PLAY_PAGE_URL, archiveUrl:ARCHIVE_PAGE_URL, storagePrefix:wordSearchCoreConfig.storagePrefix, statusAdapter}); window.HareWordSearchAccessConfig=accessConfig; return accessConfig; }

  function getNextReleaseDate(){
    const now = new Date();
    const sourceIndex = Array.isArray(indexPuzzles) && indexPuzzles.length ? indexPuzzles : (Array.isArray(window.HareWordSearchIndex) ? window.HareWordSearchIndex : []);
    const future = sourceIndex.map(item => {
      const parts = String(item.puzzleDate || "").split("-").map(Number);
      if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
      return { meta:item, date:new Date(parts[0], parts[1] - 1, parts[2], 6, 0, 0, 0) };
    }).filter(item => item && item.date > now).sort((a,b)=>a.date-b.date);
    return future.length ? future[0].date : null;
  }
  function getCountdownText(){ const now=new Date(); const next=getNextReleaseDate(); if(!next) return "New Puzzles Coming Soon!"; const diff=Math.max(0,next-now); const days=Math.floor(diff/(1000*60*60*24)); const hours=Math.floor((diff/(1000*60*60))%24); const minutes=Math.floor((diff/(1000*60))%60); const seconds=Math.floor((diff/1000)%60); return `${String(days).padStart(2,"0")}d ${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`; }


  const HP_GLOBAL_STREAK_PREFIXES = ["hp2_cg_","hp2_knk_easy_","hp2_knk_medium_","hp2_knk_hard_","hp2_kx_","hp2_wr_","hp2_sdc_","hp2_sd_easy_","hp2_sd_medium_","hp2_sd_hard_","hp2_wsc_","hp2_wf_","hp2_ws_"];
  function hpDateKey(date){ if(Core && typeof Core.localDateKey === "function") return Core.localDateKey(date); const d=date instanceof Date?date:new Date(date); if(isNaN(d)) return ""; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function hpIsRevealAll(data){ const status=String(data?.status||data?.state||"").toLowerCase(); return Boolean(data && (data.revealAllUsed === true || data.revealed === true || status === "revealed" || data.revealedAt)); }
  function hpIsSolvedForStreak(data){ const status=String(data?.status||data?.state||"").toLowerCase(); return Boolean(data && !hpIsRevealAll(data) && (data.solved === true || data.completed === true || data.isSolved === true || status === "solved" || status === "complete" || status === "completed" || data.completedAt || data.solvedAt)); }
  function hpFinishedDate(data){ if(!data) return null; return data.completedAt || data.solvedAt || data.revealedAt || data.finishedAt || null; }
  function getGlobalDayStreak(){ const dates=new Set(); try{ for(let i=0;i<localStorage.length;i++){ const key=localStorage.key(i); if(!key || !HP_GLOBAL_STREAK_PREFIXES.some(prefix=>key.startsWith(prefix))) continue; const data=Core && Core.safeJSON ? Core.safeJSON(localStorage.getItem(key)) : JSON.parse(localStorage.getItem(key)||"null"); if(!data || (!hpIsSolvedForStreak(data) && !hpIsRevealAll(data))) continue; const raw=hpFinishedDate(data); if(!raw) continue; const d=new Date(raw); if(!isNaN(d)) dates.add(hpDateKey(d)); }}catch{} let streak=0; const today=new Date(); for(let i=0;i<3650;i++){ const d=new Date(today); d.setDate(today.getDate()-i); if(dates.has(hpDateKey(d))) streak++; else if(i===0) continue; else break; } return streak; }

  function renderCollectionProgress(){ if(!Core || !collectionSlot) return; const prefixes=[wordSearchCoreConfig.storagePrefix]; const items=Core.getStoredItems(prefixes); const adapter=statusAdapter; const solved=items.filter(item=>adapter.isSolved.call(adapter,item.data)).length; const revealed=items.filter(item=>adapter.isRevealed.call(adapter,item.data)).length; const complete=solved+revealed; const published=Array.isArray(allAvailablePuzzles)&&allAvailablePuzzles.length?allAvailablePuzzles:availablePuzzles; const total=Math.max(0,published.length); const left=Math.max(0,total-complete); const pct=total?Math.min(100,Math.round((complete/total)*100)):0; collectionSlot.innerHTML=`<div class="hp-collection-title">Your Progress</div><div class="hp-collection-line">${complete.toLocaleString()} of ${total.toLocaleString()} Completed</div><div class="hp-collection-bar" aria-label="${pct}% complete"><div class="hp-collection-fill" style="width:${pct}%"></div></div><div class="hp-collection-remaining">${pct}% • ${left.toLocaleString()} left to solve</div>`; }

  function renderPlayerStats(){ if(!Core) return; const items=Core.getStoredItems(wordSearchCoreConfig.storagePrefix); const solvedItems=items.filter(item=>statusAdapter.isSolved.call(statusAdapter,item.data)); const revealedItems=items.filter(item=>statusAdapter.isRevealed.call(statusAdapter,item.data)); const finishedItems=items.filter(item=>statusAdapter.isFinished.call(statusAdapter,item.data)); const inProgressItems=items.filter(item=>!statusAdapter.isFinished.call(statusAdapter,item.data)&&statusAdapter.hasProgress.call(statusAdapter,item.data)); const playedCount=finishedItems.length+inProgressItems.length; const streak=Core.getGlobalDayStreak ? Core.getGlobalDayStreak() : getGlobalDayStreak(); statsEl.innerHTML=`
      <div class="hp-stat-row"><span class="hp-stat-icon" aria-hidden="true">local_fire_department</span><span class="hp-stat-content"><span class="hp-stat-main">${streak.toLocaleString()}</span><span class="hp-stat-label">Day Streak</span></span></div>
      <div class="hp-stat-row"><span class="hp-stat-icon" aria-hidden="true">trophy</span><span class="hp-stat-content"><span class="hp-stat-main">${solvedItems.length.toLocaleString()}</span><span class="hp-stat-label">Word Searches Solved</span></span></div>
      <div class="hp-stat-row"><span class="hp-stat-icon" aria-hidden="true">visibility</span><span class="hp-stat-content"><span class="hp-stat-main">${revealedItems.length.toLocaleString()}</span><span class="hp-stat-label">Word Searches Revealed</span></span></div>
      <div class="hp-stat-row"><span class="hp-stat-icon" aria-hidden="true">pending_actions</span><span class="hp-stat-content"><span class="hp-stat-main">${inProgressItems.length.toLocaleString()}</span><span class="hp-stat-label">Word Searches In Progress</span></span></div>
      <div class="hp-stat-row"><span class="hp-stat-icon" aria-hidden="true">beenhere</span><span class="hp-stat-content"><span class="hp-stat-main">${playedCount.toLocaleString()}</span><span class="hp-stat-label">Word Searches Played</span></span></div>`; }

  function isMemberAccess(){ const mode=String(accessConfig?.mode || pageMode || "public").toLowerCase(); return mode === "member" || mode === "all" || mode === "admin"; }

  function getPuzzleStatusForNext(puzzleId){ if(!Core || !puzzleId) return "not-started"; const saved=Core.getSavedState(`${wordSearchCoreConfig.storagePrefix}${puzzleId}`); return Core.getPuzzleStatus(saved, statusAdapter); }

  function findNextPuzzle(excludePuzzleId){
    if(!Core) return null;
    const exclude = excludePuzzleId != null ? String(excludePuzzleId) : "";
    const sorted = [...(availablePuzzles || [])]
      .filter(item => !exclude || String(item.puzzleId) !== exclude)
      .sort((a,b) => new Date(b.puzzleDate || 0) - new Date(a.puzzleDate || 0) || Number(b.puzzleId || 0) - Number(a.puzzleId || 0));
    for(const item of sorted){
      const status = getPuzzleStatusForNext(item.puzzleId);
      if(status === "in-progress") return { ...item, status, isInProgress:true };
    }
    if(isMemberAccess()){
      for(const item of sorted){
        const status = getPuzzleStatusForNext(item.puzzleId);
        if(status === "not-started") return { ...item, status, isInProgress:false };
      }
    }
    return null;
  }

  function renderNextCta(){
    if(isMemberAccess()){
      return `<div class="hp-next-ws-card"><div class="hp-next-ws-title">You’ve Solved Them All!</div><a class="hp-side-btn hp-next-hero-btn" href="${HUB_PAGE_URL}">Browse All Puzzles</a></div>`;
    }
    return `<div class="hp-next-ws-card"><div class="hp-next-ws-title">Play Your Next Puzzle</div><a class="hp-side-btn hp-next-hero-btn" href="${MEMBERSHIP_PAGE_URL}">Unlock the Full Library</a></div>`;
  }

  function renderNextButton(){
    if(!nextSlot) return;
    const nextPuzzle=findNextPuzzle(currentPuzzleData?.puzzleId);
    if(nextPuzzle){
      nextSlot.innerHTML=`<div class="hp-next-ws-card"><div class="hp-next-ws-title">Play Your Next Puzzle</div><button class="hp-side-btn hp-next-hero-btn" type="button" data-hp-load-puzzle="${nextPuzzle.puzzleId}">Word Search Puzzle #${nextPuzzle.puzzleId}</button></div>`;
      return;
    }
    nextSlot.innerHTML=renderNextCta();
  }
  function syncWordPanelHeight(){
    const wsRoot = document.getElementById("hp-wordsearch-container");
    if(!wsRoot) return;
    const leftPanel = wsRoot.querySelector(".hp-ws-col-left .hp-ws-panel");
    const rightPanel = wsRoot.querySelector(".hp-ws-col-right .hp-ws-panel");
    const wordList = wsRoot.querySelector(".hp-ws-word-list");
    if(!leftPanel || !rightPanel || !wordList) return;
    if(window.matchMedia("(max-width:1100px)").matches){
      rightPanel.style.removeProperty("height");
      rightPanel.style.removeProperty("max-height");
      rightPanel.style.removeProperty("--hp-ws-word-panel-height");
      wordList.style.removeProperty("max-height");
      return;
    }
    const leftHeight = Math.round(leftPanel.getBoundingClientRect().height);
    if(leftHeight > 0){
      rightPanel.style.setProperty("--hp-ws-word-panel-height", `${leftHeight}px`);
      rightPanel.style.height = `${leftHeight}px`;
      rightPanel.style.maxHeight = `${leftHeight}px`;
      const header = rightPanel.querySelector(".hp-ws-words-header");
      const tools = rightPanel.querySelector(".hp-puzzle-tools");
      const panelStyles = window.getComputedStyle(rightPanel);
      const available = leftHeight - (parseFloat(panelStyles.paddingTop) || 0) - (parseFloat(panelStyles.paddingBottom) || 0) - (tools ? tools.getBoundingClientRect().height + 16 : 0) - (header ? header.getBoundingClientRect().height + 12 : 0);
      if(available > 120) wordList.style.maxHeight = `${Math.floor(available)}px`;
    }
  }
  let hpWsSyncQueued = false;
  function scheduleWordPanelSync(){ if(hpWsSyncQueued) return; hpWsSyncQueued = true; window.requestAnimationFrame(() => { hpWsSyncQueued = false; syncWordPanelHeight(); window.requestAnimationFrame(syncWordPanelHeight); }); }

  async function loadPuzzleFromMeta(selectedMeta, options={}){ const {updateUrl=false, scroll=false, replaceUrl=false}=options; if(!selectedMeta) throw new Error("Puzzle not found in index.json."); mount.innerHTML=`<p style="text-align:center; padding:20px; font-weight:800;">Loading Word Search...</p>`; const puzzleData=await Core.getPuzzleDataForMeta(selectedMeta, wordSearchCoreConfig); puzzleData.puzzleTitle=`Word Search Puzzle #${puzzleData.puzzleId}`; puzzleData.morePuzzlesUrl=puzzleData.morePuzzlesUrl||"/puzzlers-hub"; puzzleData.shopUrl=puzzleData.shopUrl||"https://www.harepublishing.com/shop"; puzzleData.archiveUrl=puzzleData.archiveUrl||ARCHIVE_PAGE_URL; puzzleData.storageKey=puzzleData.storageKey||`${wordSearchCoreConfig.storagePrefix}${puzzleData.puzzleId}`; currentPuzzleData=puzzleData; window.HareWordSearchData=puzzleData; titleEl.textContent=puzzleData.puzzleTitle; dateEl.textContent=Core.formatDate(puzzleData.puzzleDate||selectedMeta.puzzleDate); await Core.loadScript(ENGINE_URL,{globalName:"HareWordSearchPlatformEngine", errorMessage:"Could not load Word Search platform engine."}); const wordSearchEngine = (window.HareWordSearchPlatformEngine && typeof window.HareWordSearchPlatformEngine.init==="function") ? window.HareWordSearchPlatformEngine : ((window.HareWordSearchEngine && typeof window.HareWordSearchEngine.init==="function") ? window.HareWordSearchEngine : null); if(!wordSearchEngine) throw new Error(`Word Search engine loaded but did not expose HareWordSearchPlatformEngine.init. Check that ${ENGINE_URL} exists on GitHub/jsDelivr and is the platform engine file.`); delete container.dataset.hpWordsearchMounted; wordSearchEngine.init({containerId:"hp-wordsearch-container", dataObject:{...puzzleData}}); renderPlayerStats(); renderCollectionProgress(); renderNextButton(); scheduleWordPanelSync(); if(updateUrl){ Core.updatePuzzleUrl(puzzleData.puzzleId,{mode:replaceUrl?"replace":"push", state:{hpWordSearchPuzzleId:String(puzzleData.puzzleId)}}); } if(scroll){ document.getElementById("hp-word-search-platform")?.scrollIntoView({behavior:"smooth", block:"start"}); } }
  async function loadPuzzleById(puzzleId, options={}){ const selectedMeta=availablePuzzles.find(item=>String(item.puzzleId)===String(puzzleId)); if(!selectedMeta){ if(allAvailablePuzzles.some(item=>String(item.puzzleId)===String(puzzleId))){ showMemberOnlyMessage(puzzleId); return; } showError("This puzzle is not available yet."); return; } try{ await loadPuzzleFromMeta(selectedMeta,{updateUrl:options.updateUrl!==false, replaceUrl:Boolean(options.replaceUrl), scroll:Boolean(options.scroll)}); } catch(error){ console.error(error); showError(error.message); } }
  async function loadInitialPuzzle(){ const index=await Core.loadIndex(wordSearchCoreConfig); indexPuzzles=Array.isArray(index)?index.slice():[]; const requestedPuzzleId=Core.getPuzzleIdFromUrl(); refreshAccessConfig(); allAvailablePuzzles=Core.getAvailablePuzzles(indexPuzzles,{sort:"ascending"}); availablePuzzles=Core.getAvailablePuzzles(indexPuzzles,{sort:"ascending", accessConfig}); window.HareWordSearchIndex=indexPuzzles; window.HareWordSearchAllAvailableIndex=allAvailablePuzzles; window.HareWordSearchAvailableIndex=availablePuzzles; if(requestedPuzzleId && allAvailablePuzzles.some(item=>String(item.puzzleId)===String(requestedPuzzleId)) && !availablePuzzles.some(item=>String(item.puzzleId)===String(requestedPuzzleId))){ showMemberOnlyMessage(requestedPuzzleId); return; } let selectedMeta=requestedPuzzleId ? availablePuzzles.find(item=>String(item.puzzleId)===String(requestedPuzzleId)) : availablePuzzles[availablePuzzles.length - 1]; if(!selectedMeta){ if(requestedPuzzleId) throw new Error("This puzzle is not available yet."); throw new Error("Puzzle not found in index.json."); } await loadPuzzleFromMeta(selectedMeta,{updateUrl:false, scroll:false}); }

  window.HareWordSearchLoadPuzzle=loadPuzzleById;
  window.HareWordSearchFindNextPuzzle=findNextPuzzle;
  window.HareWordSearchGetStats=function(){ if(!Core) return {streak:0,solved:0,revealed:0,inProgress:0,played:0}; const items=Core.getStoredItems(wordSearchCoreConfig.storagePrefix); const solvedItems=items.filter(item=>statusAdapter.isSolved.call(statusAdapter,item.data)); const revealedItems=items.filter(item=>statusAdapter.isRevealed.call(statusAdapter,item.data)); const finishedItems=items.filter(item=>statusAdapter.isFinished.call(statusAdapter,item.data)); const inProgressItems=items.filter(item=>!statusAdapter.isFinished.call(statusAdapter,item.data)&&statusAdapter.hasProgress.call(statusAdapter,item.data)); return {streak: Core.getGlobalDayStreak ? Core.getGlobalDayStreak() : getGlobalDayStreak(), solved:solvedItems.length, revealed:revealedItems.length, inProgress:inProgressItems.length, played:finishedItems.length+inProgressItems.length}; };

  document.getElementById("hp-side-help").addEventListener("click",()=>{ if(window.HareWordSearchPlatformEngine?.openHelp) window.HareWordSearchPlatformEngine.openHelp("hp-wordsearch-container"); });
  document.querySelectorAll("[data-hp-message]").forEach(btn=>btn.addEventListener("click",()=>openMessageModal(btn.dataset.hpMessage)));
  document.getElementById("hp-message-close").addEventListener("click",closeMessageModal);
  document.getElementById("hp-message-send").addEventListener("click",sendMessage);
  document.getElementById("hp-message-modal").addEventListener("click",e=>{ if(e.target.id==="hp-message-modal") closeMessageModal(); });
  if(nextSlot){ nextSlot.addEventListener("click",e=>{ const btn=e.target.closest("[data-hp-load-puzzle]"); if(!btn) return; const puzzleId=btn.getAttribute("data-hp-load-puzzle"); if(puzzleId) loadPuzzleById(puzzleId,{scroll:true}); }); }
  window.addEventListener("popstate",()=>{ const puzzleId=Core?.getPuzzleIdFromUrl(); if(puzzleId){ loadPuzzleById(puzzleId,{updateUrl:false, scroll:false}); return; } const newest=availablePuzzles[availablePuzzles.length - 1]; if(newest) loadPuzzleFromMeta(newest,{updateUrl:false, scroll:false}); });
  window.addEventListener("hare:puzzle-state-change",event=>{ if(!event.detail||event.detail.puzzleType==="word-search"){ renderPlayerStats(); renderCollectionProgress(); renderNextButton(); scheduleWordPanelSync(); } });
  window.addEventListener("hare-word-search-progress",()=>{ renderPlayerStats(); renderCollectionProgress(); renderNextButton(); scheduleWordPanelSync(); });
  window.addEventListener("resize", scheduleWordPanelSync);
  const hpWsMountObserver = new MutationObserver(scheduleWordPanelSync);
  hpWsMountObserver.observe(mount, { childList:true, subtree:true, attributes:true, attributeFilter:["class", "style"] });
  let hpWsCueQueued=false;
  function refreshWordScrollCue(){
    const list=container.querySelector(".hp-ws-word-list"); if(!list)return;
    const host=list.parentElement; host.classList.add("hp-scroll-cue-host");
    let cue=host.querySelector(":scope > .hp-scroll-cue");
    if(!cue){cue=document.createElement("button");cue.type="button";cue.className="hp-scroll-cue";cue.setAttribute("aria-label","Scroll down for more words");host.appendChild(cue);cue.addEventListener("click",()=>list.scrollBy({top:Math.max(90,list.clientHeight*.65),behavior:"smooth"}));list.addEventListener("scroll",refreshWordScrollCue,{passive:true});}
    const visible=list.scrollHeight>list.clientHeight+3&&list.scrollTop+list.clientHeight<list.scrollHeight-3;cue.classList.toggle("is-visible",visible);host.classList.toggle("has-scroll-cue",visible);
  }
  function scheduleWordScrollCue(){if(hpWsCueQueued)return;hpWsCueQueued=true;requestAnimationFrame(()=>{hpWsCueQueued=false;refreshWordScrollCue();});}
  const hpWsCueObserver=new MutationObserver(scheduleWordScrollCue);hpWsCueObserver.observe(mount,{childList:true,subtree:true});window.addEventListener("resize",scheduleWordScrollCue);

  function detectPuzzleMeta(){ const data=currentPuzzleData||{}; return {puzzleType:"word-search", puzzleId:data.puzzleId||"Unknown", puzzleTitle:data.puzzleTitle||document.title||"Word Search Puzzle", puzzleDate:data.puzzleDate||"Unknown", pageUrl:window.location.href, userAgent:navigator.userAgent}; }
  function openMessageModal(type){ currentMessageType=type; const modal=document.getElementById("hp-message-modal"); const title=document.getElementById("hp-message-title"); const intro=document.getElementById("hp-message-intro"); const text=document.getElementById("hp-message-text"); const status=document.getElementById("hp-message-status"); title.textContent=type==="bug"?"Report a Bug":"Share Feedback"; intro.textContent=type==="bug"?"Tell us what went wrong with this Word Search puzzle.":"Tell us what you think about this puzzle or the Puzzlers Hub."; text.value=""; status.textContent=""; modal.classList.add("on"); modal.setAttribute("aria-hidden","false"); }
  function closeMessageModal(){ const modal=document.getElementById("hp-message-modal"); modal.classList.remove("on"); modal.setAttribute("aria-hidden","true"); }
  async function sendMessage(){ const textarea=document.getElementById("hp-message-text"); const status=document.getElementById("hp-message-status"); const message=textarea.value.trim(); if(!message){ status.textContent="Please enter a short message first."; return; } status.textContent="Sending..."; const payload={submissionType:currentMessageType==="bug"?"BUG":"FEEDBACK", ...detectPuzzleMeta(), message}; try{ await fetch(GOOGLE_APPS_SCRIPT_URL,{method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)}); status.textContent=currentMessageType==="bug"?"Thank you — your report was sent.":"Thank you — your feedback was sent."; textarea.value=""; } catch{ status.textContent="Sorry, your message could not be sent. Please try again."; } }

  try{ await ensureCore(); await loadInitialPuzzle(); renderCollectionProgress(); }
  catch(error){ console.error(error); showError(error.message); }
})();
</script>

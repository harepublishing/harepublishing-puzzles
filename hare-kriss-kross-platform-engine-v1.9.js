window.HareKrissKrossEngine = {
  openHelp(containerId = "hp-krisskross-container") {
    const target = document.getElementById(containerId);
    const modal = target?.querySelector("#hp-kk-help-modal");
    if (!modal) return;
    modal.classList.add("on");
    modal.setAttribute("aria-hidden", "false");
  },
  init({ containerId = "hp-krisskross-container", dataObject } = {}) {
    const BRAND_RED = "#ED1B24";
    const CSS = '/* =========================================================\n   HARE PUBLISHING KRISS KROSS CSS\n   Requires shared puzzle foundation above this section.\n   Updated: 2026-05-19\n   Version: v6.2 - responsive word scaling improved\n   ========================================================= */\n\n/* =========================================================\n   MAIN LAYOUT\n   ========================================================= */\n\n#hp-krisskross-container {\n  width: 100%;\n  max-width: 1260px;\n  margin: 0 auto;\n  font-family: sans-serif;\n  color: #333;\n}\n\n#hp-krisskross-container .hp-kk-layout {\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  gap: 18px;\n  justify-content: center;\n  align-items: stretch;\n  width: 100%;\n  margin: 0 auto;\n}\n\n#hp-krisskross-container .hp-kk-col-left {\n  flex: 1 1 0;\n  min-width: 0;\n  max-width: none;\n  display: flex;\n}\n\n#hp-krisskross-container .hp-kk-col-right {\n  flex: 0 0 360px;\n  width: 360px;\n  min-width: 360px;\n  max-width: 360px;\n  display: flex;\n  flex-direction: column;\n  align-self: stretch;\n  min-height: 0;\n}\n\n/* =========================================================\n   PANELS\n   ========================================================= */\n\n#hp-krisskross-container .hp-kk-panel {\n  padding: 16px;\n}\n\n#hp-krisskross-container .hp-kk-col-left .hp-kk-panel,\n#hp-krisskross-container .hp-kk-col-right .hp-kk-panel {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  width: 100%;\n  min-height: 0;\n}\n\n#hp-krisskross-container .hp-kk-col-right .hp-kk-panel {\n  margin-top: 0;\n}\n\n/* =========================================================\n   STATS / PROGRESS / STATUS\n   ========================================================= */\n\n#hp-krisskross-container .hp-kk-status {\n  margin-bottom: 12px;\n}\n\n/* =========================================================\n   BOARD AREA\n   ========================================================= */\n\n#hp-krisskross-container .hp-kk-board-wrap {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  flex: 0 0 auto;\n  width: 100%;\n  overflow: hidden;\n  margin: 0 0 12px;\n  padding: 16px 10px 12px;\n  background: #ffffff;\n  border: 1px solid #e6edf3;\n  border-radius: 18px;\n}\n\n#hp-krisskross-container .hp-kk-board {\n  --hp-kk-gap: 3px;\n  --hp-kk-cell-size: 29px;\n\n  display: inline-grid;\n  gap: var(--hp-kk-gap);\n  width: auto;\n  max-width: 100%;\n  margin: 0 auto;\n  user-select: none;\n  touch-action: manipulation;\n  background: transparent;\n  padding: 0;\n  border-radius: 0;\n}\n\n#hp-krisskross-container .hp-kk-cell,\n#hp-krisskross-container .hp-kk-block {\n  width: var(--hp-kk-cell-size);\n  height: var(--hp-kk-cell-size);\n  min-width: var(--hp-kk-cell-size);\n  min-height: var(--hp-kk-cell-size);\n  padding: 0;\n  margin: 0;\n  line-height: 1;\n}\n\n#hp-krisskross-container .hp-kk-block {\n  background: transparent;\n  border: none;\n  visibility: hidden;\n  pointer-events: none;\n}\n\n#hp-krisskross-container .hp-kk-cell {\n  appearance: none;\n  -webkit-appearance: none;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border: 1px solid #bfd4ea;\n  border-radius: 7px;\n  background: #cfe0f8;\n  color: #16324a;\n  font-size: clamp(0.72rem, 1vw, 0.92rem);\n  font-weight: 700;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background .16s ease, box-shadow .16s ease, color .16s ease, border-color .16s ease;\n}\n\n#hp-krisskross-container .hp-kk-cell:hover {\n  background: #bcd4f3;\n  border-color: #a9c4de;\n}\n\n#hp-krisskross-container .hp-kk-cell.is-filled,\n#hp-krisskross-container .hp-kk-cell.is-correct,\n#hp-krisskross-container .hp-kk-cell.is-revealed {\n  background: #cfe0f8;\n  color: #16324a;\n  border-color: #bfd4ea;\n}\n\n#hp-krisskross-container .hp-kk-cell.is-selected {\n  background: #a9c9ee;\n  color: #16324a;\n  border-color: #7ea9d1;\n  box-shadow: inset 0 0 0 1px #6e8fb9;\n}\n\n#hp-krisskross-container .hp-kk-cell.is-selected.is-slot-start {\n  background: #107FBB;\n  color: #fff;\n  border-color: #0d699a;\n  box-shadow: inset 0 0 0 1px #0d699a;\n}\n\n/* =========================================================\n   TOGGLE MARKER\n   ========================================================= */\n\n#hp-krisskross-container .hp-kk-cell.is-toggle-cell {\n  position: relative;\n}\n\n#hp-krisskross-container .hp-kk-cell.is-toggle-cell::after {\n  content: "";\n  position: absolute;\n  right: 3px;\n  top: 3px;\n  width: 4px;\n  height: 4px;\n  border-radius: 999px;\n  background: rgba(16,127,187,.45);\n}\n\n#hp-krisskross-container .hp-kk-cell.is-selected.is-toggle-cell::after,\n#hp-krisskross-container .hp-kk-cell.is-selected.is-slot-start.is-toggle-cell::after {\n  background: rgba(255,255,255,.8);\n}\n\n/* =========================================================\n   BOTTOM ACTION BUTTONS\n   ========================================================= */\n\n#hp-krisskross-container .hp-kk-actions {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 10px;\n  margin-top: auto;\n  padding-top: 12px;\n  align-items: stretch;\n}\n\n#hp-krisskross-container .hp-kk-btn {\n  appearance: none;\n  -webkit-appearance: none;\n  min-height: 44px;\n  padding: 12px;\n  border-radius: 12px;\n  border: 1px solid #ddd;\n  background: #fff;\n  color: #333;\n  text-decoration: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  text-align: center;\n  font-size: 14px;\n  font-weight: 800;\n  line-height: 1.05;\n  cursor: pointer;\n  transition: transform 0.08s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease;\n}\n\n#hp-krisskross-container .hp-kk-btn:hover {\n  transform: translateY(-1px);\n}\n\n#hp-krisskross-container .hp-kk-btn:active {\n  transform: translateY(0);\n}\n\n#hp-krisskross-container .hp-kk-btn.reveal {\n  color: #107FBB;\n  border-color: rgba(16,127,187,.4);\n}\n\n#hp-krisskross-container .hp-kk-btn.danger {\n  color: #ED1B24;\n  border-color: rgba(237,27,36,.4);\n}\n\n/* =========================================================\n   WORD LIST\n   ========================================================= */\n\n#hp-krisskross-container .hp-kk-words-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n  margin: 0 0 12px;\n}\n\n#hp-krisskross-container .hp-kk-words-header h3 {\n  margin: 0;\n  font-size: 1rem;\n  line-height: 1.2;\n  color: #24323d;\n  font-weight: 900;\n}\n\n#hp-krisskross-container .hp-kk-pill {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 6px 10px;\n  border-radius: 999px;\n  border: 1px solid #dceaf6;\n  background: #f7fbff;\n  color: #107FBB;\n  font-size: 0.74rem;\n  font-weight: 800;\n  white-space: nowrap;\n}\n\n#hp-krisskross-container .hp-kk-word-list {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 7px 8px;\n  align-content: start;\n  flex: 0 0 auto;\n}\n\n#hp-krisskross-container .hp-kk-word-item {\n  appearance: none;\n  -webkit-appearance: none;\n  width: 100%;\n  min-width: 0;\n  border-radius: 11px;\n  border: 1px solid #e6edf3;\n  background: #fff;\n  color: #24323d;\n  padding: 7px 6px;\n  min-height: 34px;\n  text-align: center;\n  font-size: clamp(0.6rem, 0.92vw, 0.74rem);\n  font-weight: 800;\n  line-height: 1.05;\n  letter-spacing: 0;\n  cursor: pointer;\n  white-space: nowrap;\n  overflow: visible;\n  text-overflow: clip;\n  transition: transform .12s ease, box-shadow .12s ease, background .2s ease, border-color .2s ease;\n}\n\n#hp-krisskross-container .hp-kk-word-item:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 10px 24px rgba(0,0,0,.06);\n}\n\n#hp-krisskross-container .hp-kk-word-item.is-match {\n  background: #f3f8ff;\n  border-color: #bfd8ef;\n  color: #107FBB;\n}\n\n#hp-krisskross-container .hp-kk-word-item.is-used {\n  background: #fffaf1;\n  border-color: #f6dfb1;\n  color: #b87800;\n}\n\n#hp-krisskross-container .hp-kk-word-item.is-found {\n  background: #eefaf1;\n  border-color: #bfe5ca;\n  color: #0e7a3c;\n}\n\n/* =========================================================\n   DESKTOP HEIGHT ALIGNMENT\n   ========================================================= */\n\n@media (min-width: 981px) {\n  #hp-krisskross-container .hp-kk-layout {\n    align-items: stretch;\n  }\n\n  #hp-krisskross-container .hp-kk-col-left .hp-kk-panel {\n    min-height: 720px;\n  }\n}\n\n/* =========================================================\n   RESPONSIVE\n   ========================================================= */\n\n@media (max-width: 980px) {\n  #hp-krisskross-container {\n    max-width: 760px;\n    width: 100%;\n    margin: 0 auto;\n    overflow-x: hidden;\n  }\n\n  #hp-krisskross-container .hp-kk-layout {\n    flex-direction: column;\n    flex-wrap: nowrap;\n    align-items: stretch;\n    justify-content: flex-start;\n    gap: 14px;\n    width: 100%;\n  }\n\n  #hp-krisskross-container .hp-kk-col-left,\n  #hp-krisskross-container .hp-kk-col-right {\n    flex: 1 1 auto;\n    width: 100%;\n    min-width: 0;\n    max-width: 100%;\n    display: flex;\n  }\n\n  #hp-krisskross-container .hp-kk-col-left {\n    order: 1;\n  }\n\n  #hp-krisskross-container .hp-kk-col-right {\n    order: 2;\n  }\n\n  #hp-krisskross-container .hp-kk-panel {\n    padding: 14px;\n  }\n\n  #hp-krisskross-container .hp-kk-board {\n    --hp-kk-gap: 3px;\n    --hp-kk-cell-size: clamp(20px, calc((100vw - 96px) / 16), 30px);\n  }\n\n  #hp-krisskross-container .hp-kk-col-left .hp-kk-panel {\n    min-height: auto;\n  }\n\n  #hp-krisskross-container .hp-kk-actions {\n    display: none;\n  }\n\n  #hp-krisskross-container .hp-kk-word-list {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n    gap: 7px;\n  }\n\n  #hp-krisskross-container .hp-kk-word-item {\n    min-height: 38px;\n    padding: 6px 7px;\n    font-size: clamp(0.62rem, 2.5vw, 0.9rem);\n    line-height: 1.05;\n  }\n}\n\n@media (max-width: 700px) {\n  #hp-krisskross-container .hp-kk-board {\n    --hp-kk-gap: 2px;\n    --hp-kk-cell-size: clamp(18px, calc((100vw - 72px) / 16), 25px);\n  }\n\n  #hp-krisskross-container .hp-kk-board-wrap {\n    padding: 12px 4px 10px;\n  }\n}\n\n@media (max-width: 560px) {\n  #hp-krisskross-container .hp-kk-panel {\n    padding: 12px;\n  }\n\n  #hp-krisskross-container .hp-kk-board {\n    --hp-kk-gap: 2px;\n    --hp-kk-cell-size: clamp(17px, calc((100vw - 64px) / 16), 23px);\n  }\n\n  #hp-krisskross-container .hp-kk-words-header h3 {\n    font-size: 0.95rem;\n  }\n\n  #hp-krisskross-container .hp-kk-word-list {\n    gap: 6px;\n  }\n\n  #hp-krisskross-container .hp-kk-word-item {\n    min-height: 36px;\n    padding: 6px;\n    font-size: clamp(0.58rem, 2.7vw, 0.82rem);\n    line-height: 1.02;\n    border-radius: 10px;\n  }\n}\n\n/* =========================================================\n   PLATFORM EMBEDDED ADDITIONS v1.9\n   These wrap the production Kriss Kross board without changing the board model.\n   ========================================================= */\n#hp-krisskross-container,\n#hp-krisskross-container *{box-sizing:border-box;}\n#hp-krisskross-container{font-family:Roboto,Arial,sans-serif;color:#24323d;}\n#hp-krisskross-container .hp-kk-panel{\n  background:#fff;\n  border:1px solid #e9eef3;\n  border-radius:18px;\n  box-shadow:0 8px 24px rgba(0,0,0,.055);\n}\n#hp-krisskross-container .hp-kk-layout{\n  display:grid;\n  grid-template-columns:minmax(0,1fr) 250px;\n  gap:16px;\n  align-items:stretch;\n  width:100%;\n}\n#hp-krisskross-container .hp-kk-col-left,\n#hp-krisskross-container .hp-kk-col-right{\n  min-width:0;\n  width:auto;\n  max-width:none;\n  display:flex;\n}\n#hp-krisskross-container .hp-kk-col-right{\n  min-width:0;\n}\n#hp-krisskross-container .hp-kk-col-left .hp-kk-panel,\n#hp-krisskross-container .hp-kk-col-right .hp-kk-panel{\n  width:100%;\n  display:flex;\n  flex-direction:column;\n  min-height:650px;\n  height:650px;\n}\n#hp-krisskross-container .hp-kk-theme{\n  margin:0 0 14px;\n  color:#2f4667;\n  font-size:24px;\n  line-height:1.15;\n  font-weight:900;\n  text-align:center;\n  text-transform:none;\n  letter-spacing:0;\n}\n#hp-krisskross-container .hp-kk-stats,\n#hp-krisskross-container .hp-kk-progress,\n#hp-krisskross-container .hp-kk-status{display:none!important;}\n#hp-krisskross-container .hp-kk-board-wrap{\n  flex:0 0 auto;\n  margin:0 0 12px;\n}\n#hp-krisskross-container .hp-puzzle-tools{\n  display:grid;\n  grid-template-columns:repeat(2,minmax(0,1fr));\n  gap:8px;\n  margin:0 0 12px;\n}\n#hp-krisskross-container .hp-puzzle-mobile-tools{display:none;}\n#hp-krisskross-container .hp-tool-btn{\n  appearance:none;\n  -webkit-appearance:none;\n  min-height:40px;\n  padding:9px 12px;\n  border-radius:12px;\n  border:2px solid #d8e3ef;\n  background:#fff;\n  color:#2f4667;\n  font-family:inherit;\n  font-size:13px;\n  font-weight:900;\n  cursor:pointer;\n  transition:all .18s ease;\n}\n#hp-krisskross-container .hp-tool-btn:hover{transform:translateY(-1px);background:#f3f7fc;}\n#hp-krisskross-container .hp-tool-btn.hint-toggle.active{background:#00A54F;border-color:#00A54F;color:#fff;}\n#hp-krisskross-container .hp-tool-btn.danger{color:#ED1B24;border-color:rgba(237,27,36,.35);}\n#hp-krisskross-container .hp-tool-btn.reveal{color:#107FBB;border-color:rgba(16,127,187,.35);}\n#hp-krisskross-container .hp-kk-words-header{\n  display:block;\n  margin:0 0 10px;\n  text-align:center;\n}\n#hp-krisskross-container .hp-kk-words-header h3{\n  margin:0 0 4px;\n  color:#2f4667;\n  font-size:18px;\n  line-height:1.15;\n  font-weight:900;\n  text-align:center;\n}\n#hp-krisskross-container .hp-kk-pill{\n  display:block;\n  padding:0;\n  border:0;\n  background:transparent;\n  color:#3d4b58;\n  font-size:13px;\n  line-height:1.25;\n  font-weight:900;\n  text-align:center;\n  white-space:normal;\n}\n#hp-krisskross-container .hp-kk-word-list{\n  display:grid;\n  grid-template-columns:1fr;\n  gap:7px;\n  align-content:start;\n  flex:1 1 auto;\n  min-height:0;\n  overflow-y:auto;\n  overflow-x:hidden;\n  padding-right:4px;\n  overscroll-behavior:contain;\n}\n#hp-krisskross-container .hp-kk-word-item{\n  min-height:34px;\n  padding:7px 8px;\n  font-size:12px;\n  line-height:1.05;\n  overflow:hidden;\n  text-overflow:ellipsis;\n}\n#hp-krisskross-container .hp-kk-actions{\n  margin-top:auto;\n  padding-top:12px;\n}\n#hp-krisskross-container .hp-overlay{\n  display:none;\n  position:absolute;\n  inset:0;\n  z-index:50;\n  background:rgba(255,255,255,.76);\n  align-items:center;\n  justify-content:center;\n  padding:16px;\n  border-radius:18px;\n}\n#hp-krisskross-container .hp-overlay.on{display:flex;}\n#hp-krisskross-container .hp-kk-help-modal{\n  position:fixed;\n  inset:0;\n  z-index:99999;\n  background:rgba(0,0,0,.45);\n}\n#hp-krisskross-container .hp-modal{\n  background:#fff;\n  width:min(560px,100%);\n  border-radius:22px;\n  padding:24px;\n  box-shadow:0 20px 70px rgba(0,0,0,.25);\n  text-align:center;\n  color:#222;\n}\n#hp-krisskross-container .hp-modal h3{margin:8px 0 14px;font-size:24px;line-height:1.15;color:#2f4667;font-weight:900;}\n#hp-krisskross-container .hp-help-modal-content{text-align:left;background:#f7f9fb;border:1px solid #dce8f2;border-radius:16px;padding:18px;margin:14px 0 6px;}\n#hp-krisskross-container .hp-help-line{display:block;margin:0 0 10px;font-size:15px;line-height:1.4;color:#3d4b58;}\n#hp-krisskross-container .hp-help-line:last-child{margin-bottom:0;}\n#hp-krisskross-container .hp-modal-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px;}\n#hp-krisskross-container .hp-link-btn{border:2px solid #d8e3ef;background:#fff;color:#2f4667;border-radius:12px;min-height:40px;padding:10px 12px;font-weight:900;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-family:inherit;font-size:13px;transition:all .18s ease;}\n#hp-krisskross-container .hp-link-btn.primary{background:#476695;border-color:#476695;color:#fff;}\n#hp-krisskross-container .hp-link-btn.secondary{background:#fff;color:#2f4667;border-color:#d8e3ef;}\n#hp-krisskross-container .hp-link-btn.neutral{background:#fff;color:#333;border-color:#e1e5ea;}\n#hp-krisskross-container .hp-link-btn.danger{background:#fff;color:#ED1B24;border-color:#ffb4b4;}\n#hp-krisskross-container .hp-link-btn.full{grid-column:1/-1;}\n#hp-krisskross-container .hp-link-btn:hover{transform:translateY(-1px);background:#476695;border-color:#476695;color:#fff;}\n#hp-krisskross-container .hp-badges{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:8px 0 14px;}\n#hp-krisskross-container .hp-badge{display:inline-flex;border:1px solid #d8e3ef;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:900;color:#2f4667;background:#f7f9fb;}\n#hp-krisskross-container .hp-modal-lead{font-size:15px;font-weight:900;margin-bottom:6px;}\n#hp-krisskross-container .hp-modal-subtext{font-size:13px;color:#555;line-height:1.35;margin-bottom:4px;}\n#hp-krisskross-container .hp-modal small{display:block;margin-top:10px;color:#777;font-size:11px;}\n@media(max-width:980px){\n  #hp-krisskross-container{max-width:100%;overflow-x:hidden;}\n  #hp-krisskross-container .hp-kk-layout{display:flex;flex-direction:column;gap:14px;}\n  #hp-krisskross-container .hp-kk-col-left,#hp-krisskross-container .hp-kk-col-right{width:100%;min-width:0;max-width:100%;}\n  #hp-krisskross-container .hp-kk-col-left .hp-kk-panel,#hp-krisskross-container .hp-kk-col-right .hp-kk-panel{height:auto;min-height:0;}\n  #hp-krisskross-container .hp-puzzle-mobile-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px;}\n  #hp-krisskross-container .hp-puzzle-tools{display:none;}\n  #hp-krisskross-container .hp-kk-word-list{max-height:360px;}\n  #hp-krisskross-container .hp-modal-actions{grid-template-columns:1fr;}\n  #hp-krisskross-container .hp-link-btn.full{grid-column:auto;}\n}\n\n/* =========================================================\n   VERIFIED KRISS KROSS PLATFORM OVERRIDES v1.9\n   Full crossword-style grid, using the production board model.\n   ========================================================= */\n#hp-krisskross-container .hp-kk-layout{display:grid!important;grid-template-columns:minmax(0,1fr) 230px!important;gap:18px!important;align-items:stretch!important;width:100%!important;max-width:100%!important;}\n#hp-krisskross-container .hp-kk-col-left,#hp-krisskross-container .hp-kk-col-right{min-width:0!important;display:flex!important;align-self:stretch!important;}\n#hp-krisskross-container .hp-kk-col-right{width:230px!important;min-width:230px!important;max-width:230px!important;}\n#hp-krisskross-container .hp-kk-col-left .hp-kk-panel,#hp-krisskross-container .hp-kk-col-right .hp-kk-panel{height:690px!important;min-height:690px!important;display:flex!important;flex-direction:column!important;}\n#hp-krisskross-container .hp-kk-theme{margin:0 0 12px!important;color:#2f4667!important;font-size:24px!important;line-height:1.15!important;font-weight:900!important;text-align:center!important;text-transform:none!important;letter-spacing:0!important;}\n#hp-krisskross-container .hp-kk-stats,#hp-krisskross-container .hp-kk-progress,#hp-krisskross-container .hp-kk-status{display:none!important;}\n#hp-krisskross-container .hp-kk-board-wrap{flex:1 1 auto!important;min-height:0!important;width:100%!important;margin:0 0 12px!important;padding:0!important;background:transparent!important;border:0!important;border-radius:0!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;}\n#hp-krisskross-container .hp-kk-board{--hp-kk-gap:1px!important;--hp-kk-cell-size:clamp(27px,2.28vw,34px)!important;display:grid!important;gap:var(--hp-kk-gap)!important;width:max-content!important;height:max-content!important;max-width:100%!important;max-height:100%!important;background:#c5d2e4!important;border:1px solid #c5d2e4!important;border-radius:18px!important;overflow:hidden!important;padding:0!important;margin:0 auto!important;}\n#hp-krisskross-container .hp-kk-cell,#hp-krisskross-container .hp-kk-block{width:var(--hp-kk-cell-size)!important;height:var(--hp-kk-cell-size)!important;min-width:var(--hp-kk-cell-size)!important;min-height:var(--hp-kk-cell-size)!important;border-radius:0!important;margin:0!important;padding:0!important;box-shadow:none!important;}\n#hp-krisskross-container .hp-kk-block{visibility:visible!important;pointer-events:none!important;display:block!important;background:#e8eef5!important;border:0!important;}\n#hp-krisskross-container .hp-kk-cell{background:#fff!important;border:0!important;color:#24323d!important;font-size:clamp(13px,1.2vw,18px)!important;font-weight:900!important;}\n#hp-krisskross-container .hp-kk-cell:hover{background:#eef6ff!important;}\n#hp-krisskross-container .hp-kk-cell.is-filled,#hp-krisskross-container .hp-kk-cell.is-correct,#hp-krisskross-container .hp-kk-cell.is-revealed{background:#fff!important;color:#24323d!important;}\n#hp-krisskross-container .hp-kk-cell.is-selected{background:#d9e8f8!important;outline:2px solid #476695!important;outline-offset:-2px!important;}\n#hp-krisskross-container .hp-kk-cell.is-selected.is-slot-start{background:#476695!important;color:#fff!important;}\n#hp-krisskross-container .hp-kk-cell.is-toggle-cell::after{right:3px!important;top:3px!important;background:rgba(71,102,149,.45)!important;}\n#hp-krisskross-container .hp-puzzle-tools{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin:0 0 12px!important;}\n#hp-krisskross-container .hp-puzzle-mobile-tools{display:none!important;}\n#hp-krisskross-container .hp-kk-word-list{display:grid!important;grid-template-columns:1fr!important;gap:7px!important;flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;padding-right:4px!important;overscroll-behavior:contain!important;align-content:start!important;}\n#hp-krisskross-container .hp-kk-word-item{min-height:34px!important;padding:7px 8px!important;font-size:12px!important;line-height:1.05!important;overflow:hidden!important;text-overflow:ellipsis!important;}\n#hp-krisskross-container .hp-kk-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin-top:12px!important;padding-top:0!important;}\n@media(max-width:980px){#hp-krisskross-container{max-width:100%!important;overflow-x:hidden!important;}#hp-krisskross-container .hp-kk-layout{display:flex!important;flex-direction:column!important;gap:14px!important;}#hp-krisskross-container .hp-kk-col-left,#hp-krisskross-container .hp-kk-col-right{width:100%!important;min-width:0!important;max-width:100%!important;}#hp-krisskross-container .hp-kk-col-left .hp-kk-panel,#hp-krisskross-container .hp-kk-col-right .hp-kk-panel{height:auto!important;min-height:0!important;}#hp-krisskross-container .hp-kk-board{--hp-kk-cell-size:clamp(18px,calc((100vw - 72px)/16),28px)!important;}#hp-krisskross-container .hp-puzzle-mobile-tools{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:12px!important;}#hp-krisskross-container .hp-puzzle-tools{display:none!important;}#hp-krisskross-container .hp-kk-word-list{max-height:360px!important;}}\n\n';

    function injectStyles() {
      if (document.getElementById("hp-kriss-kross-platform-engine-css-v18")) return;
      const style = document.createElement("style");
      style.id = "hp-kriss-kross-platform-engine-css-v18";
      style.textContent = CSS;
      document.head.appendChild(style);
    }


    const container = document.getElementById(containerId);
    if (!container) return;
    injectStyles();

    const mount = container.querySelector(".hp-mount") || container;
    if (!mount) return;

    const yearEl = container.querySelector("#hp-year") || document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const data = dataObject || window.HareKrissKrossData;

    if (!data) {
      mount.innerHTML = `
        <div class="hp-kk-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
          <strong>Configuration Error:</strong> Kriss Kross puzzle data is missing.
        </div>
      `;
      return;
    }

    const puzzleId = String(data.puzzleId || "1");
    const puzzleTitle = data.puzzleTitle || `Kriss Kross Puzzle #${puzzleId}`;
    const puzzleTheme = String(data.theme || data.Theme || "").trim();
    const puzzleDate = formatPuzzleDate(data.puzzleDate || "");
    const placements = Array.isArray(data.placements) ? data.placements : [];

    const MORE_PUZZLES_URL = data.morePuzzlesUrl || "https://www.harepublishing.com/online-puzzles";
    const SHOP_URL = data.shopUrl || "https://www.harepublishing.com/shop";
    const STORAGE_KEY = data.storageKey || `hp_kk_${puzzleId}`;

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[s]));
    }

    function normalizeWord(word) {
      return String(word || "").toUpperCase().replace(/[^A-Z]/g, "");
    }

    function cellKey(r, c) {
      return `${r}-${c}`;
    }

    function formatPuzzleDate(dateString) {
      if (!dateString) return "";

      const parts = String(dateString).split("-");
      if (parts.length !== 3) return String(dateString);

      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);

      const date = new Date(year, month, day);

      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }

    // =========================================================
    // PLATFORM SCHEMA
    // =========================================================

    function injectSchema() {
      const existing = document.getElementById("hp-schema-kriss-kross");
      if (existing) existing.remove();

      const pageUrl = window.location.href;
      const collectionPath = window.HareKrissKrossPlayUrl || "/kriss-kross";
      const collectionUrl = new URL(collectionPath, window.location.origin).toString();
      const rawDate = String(data.puzzleDate || "").trim();

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": puzzleTitle,
        "description": `Play ${puzzleTitle} online from Hare Publishing.`,
        "url": pageUrl,
        "genre": "Puzzle",
        "inLanguage": "en",
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://www.harepublishing.com"
        },
        "isPartOf": {
          "@type": "CollectionPage",
          "name": "Kriss Kross",
          "url": collectionUrl
        }
      };

      if (rawDate) schemaData.datePublished = rawDate;

      const script = document.createElement("script");
      script.id = "hp-schema-kriss-kross";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }

    injectSchema();

    const normalizedPlacements = placements.map((p, idx) => ({
      id: `slot-${idx + 1}`,
      word: normalizeWord(p.word),
      row: Number(p.row),
      col: Number(p.col),
      dir: p.dir === "down" ? "down" : "across"
    })).filter(p => p.word);

    if (!normalizedPlacements.length) {
      mount.innerHTML = `
        <div class="hp-kk-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
          <strong>Configuration Error:</strong> Add at least one Kriss Kross word placement.
        </div>
      `;
      return;
    }

    const wordSet = new Set();
    for (const p of normalizedPlacements) {
      if (wordSet.has(p.word)) {
        mount.innerHTML = `
          <div class="hp-kk-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
            <strong>Configuration Error:</strong> Each Kriss Kross word must be unique. Duplicate found: ${escapeHtml(p.word)}
          </div>
        `;
        return;
      }
      wordSet.add(p.word);
    }

    let maxRow = 0;
    let maxCol = 0;
    const activeCellMap = new Map();
    const solutionBoard = [];

    function ensureBoardSize(r, c) {
      while (solutionBoard.length <= r) solutionBoard.push([]);
      while (solutionBoard[r].length <= c) solutionBoard[r].push("");
    }

    try {
      normalizedPlacements.forEach(slot => {
        const dr = slot.dir === "down" ? 1 : 0;
        const dc = slot.dir === "across" ? 1 : 0;

        for (let i = 0; i < slot.word.length; i++) {
          const r = slot.row + dr * i;
          const c = slot.col + dc * i;

          maxRow = Math.max(maxRow, r);
          maxCol = Math.max(maxCol, c);
          ensureBoardSize(r, c);

          const existing = solutionBoard[r][c];
          const letter = slot.word[i];

          if (existing && existing !== letter) {
            mount.innerHTML = `
              <div class="hp-kk-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
                <strong>Configuration Error:</strong> Conflicting letters at row ${r}, col ${c}.
              </div>
            `;
            throw new Error("Kriss Kross config conflict");
          }

          solutionBoard[r][c] = letter;
          activeCellMap.set(cellKey(r, c), true);
        }
      });
    } catch {
      return;
    }

    const minRows = Number(data.minRows || data.gridRows || data.minGridSize || 16);
    const minCols = Number(data.minCols || data.gridCols || data.minGridSize || 16);

    const rowCount = Math.max(maxRow + 1, minRows);
    const colCount = Math.max(maxCol + 1, minCols);

    const cellsBySlot = new Map();
    const slotsByCell = new Map();

    normalizedPlacements.forEach(slot => {
      const dr = slot.dir === "down" ? 1 : 0;
      const dc = slot.dir === "across" ? 1 : 0;
      const cells = [];

      for (let i = 0; i < slot.word.length; i++) {
        const cell = {
          r: slot.row + dr * i,
          c: slot.col + dc * i,
          letter: slot.word[i]
        };
        cells.push(cell);

        const key = cellKey(cell.r, cell.c);
        if (!slotsByCell.has(key)) slotsByCell.set(key, []);
        slotsByCell.get(key).push(slot.id);
      }

      cellsBySlot.set(slot.id, cells);
    });

    function areSequentialNeighbors(a, b) {
      const slotIdsA = slotsByCell.get(cellKey(a.r, a.c)) || [];
      const slotIdsB = slotsByCell.get(cellKey(b.r, b.c)) || [];
      const shared = slotIdsA.filter(id => slotIdsB.includes(id));

      return shared.some(slotId => {
        const cells = cellsBySlot.get(slotId) || [];

        for (let i = 1; i < cells.length; i++) {
          const prev = cells[i - 1];
          const curr = cells[i];

          if (
            (prev.r === a.r && prev.c === a.c && curr.r === b.r && curr.c === b.c) ||
            (prev.r === b.r && prev.c === b.c && curr.r === a.r && curr.c === a.c)
          ) {
            return true;
          }
        }

        return false;
      });
    }

    function validateNoTouchingWords() {
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          if (!activeCellMap.has(cellKey(r, c))) continue;

          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr < 0 || nc < 0 || nr >= rowCount || nc >= colCount) continue;
            if (!activeCellMap.has(cellKey(nr, nc))) continue;
            if (areSequentialNeighbors({ r, c }, { r: nr, c: nc })) continue;

            mount.innerHTML = `
              <div class="hp-kk-panel" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;">
                <strong>Configuration Error:</strong> Words are touching side-by-side at row ${r}, col ${c} and row ${nr}, col ${nc}.
              </div>
            `;
            throw new Error("Kriss Kross touching words config");
          }
        }
      }
    }

    try {
      validateNoTouchingWords();
    } catch {
      return;
    }

    const words = normalizedPlacements.map(s => s.word).sort((a, b) => a.localeCompare(b));

    function defaultState() {
      return {
        assignments: {},
        selectedSlotId: "",
        helpMode: true,
        revealed: false,
        solved: false,
        solvedAt: "",
        revealedAt: "",
        overlaySeen: false
      };
    }

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const merged = parsed ? { ...defaultState(), ...parsed } : defaultState();

        if (typeof merged.solvedAt !== "string") merged.solvedAt = "";
        if (typeof merged.revealedAt !== "string") merged.revealedAt = "";

        return merged;
      } catch {
        return defaultState();
      }
    }

    const state = loadState();


    function emitKrissKrossStateChange(action = "save") {
      try {
        const detail = {
          puzzleType: "kriss-kross",
          puzzleId,
          storageKey: STORAGE_KEY,
          status: action,
          state: { ...state }
        };
        if (window.HarePuzzleCore && typeof window.HarePuzzleCore.emitStateChange === "function") {
          window.HarePuzzleCore.emitStateChange(detail);
        }
        window.dispatchEvent(new CustomEvent("hare:kriss-kross-state-change", { detail }));
        window.dispatchEvent(new CustomEvent("hare-kriss-kross-progress", { detail }));
      } catch {}
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        emitKrissKrossStateChange("save");
      } catch {}
    }

    function isFinished() {
      return state.solved || state.revealed;
    }

    function getWordToSlotMap() {
      const map = new Map();

      Object.entries(state.assignments).forEach(([slotId, word]) => {
        if (word) map.set(word, slotId);
      });

      return map;
    }

    function buildCurrentBoard() {
      const board = Array.from({ length: rowCount }, () => Array(colCount).fill(""));

      Object.entries(state.assignments).forEach(([slotId, word]) => {
        if (!word) return;

        const cells = cellsBySlot.get(slotId) || [];

        cells.forEach((cell, idx) => {
          board[cell.r][cell.c] = word[idx] || "";
        });
      });

      return board;
    }

    function slotIsCorrect(slotId) {
      const slot = normalizedPlacements.find(s => s.id === slotId);
      if (!slot) return false;
      return state.assignments[slotId] === slot.word;
    }

    function correctCount() {
      return normalizedPlacements.filter(slot => slotIsCorrect(slot.id)).length;
    }

    function placedCount() {
      return Object.values(state.assignments).filter(Boolean).length;
    }

    function progressPercent() {
      return normalizedPlacements.length
        ? (correctCount() / normalizedPlacements.length) * 100
        : 0;
    }

    function allSlotsCorrect() {
      return normalizedPlacements.every(slot => slotIsCorrect(slot.id));
    }

    function slotLength(slotId) {
      const cells = cellsBySlot.get(slotId) || [];
      return cells.length;
    }

    function clearSlot(slotId) {
      if (!slotId) return;
      delete state.assignments[slotId];
    }

    function clearSelectedSlot() {
      if (isFinished()) return;
      if (!state.selectedSlotId) return;

      delete state.assignments[state.selectedSlotId];

      saveState();
      render();
    }

    function updateHelpToggleButton() {
      mount.querySelectorAll("[data-kk-help-toggle]").forEach(helpBtn => {
        helpBtn.textContent = state.helpMode ? "Hint: ON" : "Hint: OFF";
        helpBtn.classList.toggle("active", state.helpMode);
        helpBtn.setAttribute("aria-pressed", state.helpMode ? "true" : "false");
      });
    }

    function toggleHelpMode() {
      if (isFinished()) return;

      state.helpMode = !state.helpMode;
      saveState();
      updateHelpToggleButton();
      renderStatus();
      renderWordListOnly();
    }

    function canFitWordInSlot(word, slotId) {
      const currentBoard = buildCurrentBoard();
      const cells = cellsBySlot.get(slotId) || [];

      if (word.length !== cells.length) return false;

      for (let i = 0; i < cells.length; i++) {
        const { r, c } = cells[i];
        const existing = currentBoard[r][c];

        if (existing && existing !== word[i]) return false;
      }

      return true;
    }

    function selectSlot(slotId) {
      if (isFinished()) return;

      state.selectedSlotId = slotId || "";

      saveState();
      renderStatus();
      renderBoardOnly();
      renderWordListOnly();
    }

    function selectNextSlotAtCell(r, c) {
      if (isFinished()) return;

      const slotIds = slotsByCell.get(cellKey(r, c)) || [];
      if (!slotIds.length) return;

      if (slotIds.length === 1) {
        selectSlot(slotIds[0]);
        return;
      }

      const currentIndex = slotIds.indexOf(state.selectedSlotId);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % slotIds.length : 0;

      selectSlot(slotIds[nextIndex]);
    }

    function placeWord(word) {
      if (isFinished()) return;

      if (!state.selectedSlotId) {
        setStatusMessage("Choose a slot in the grid first.");
        return;
      }

      const slotId = state.selectedSlotId;
      const expectedLen = slotLength(slotId);

      if (word.length !== expectedLen) {
        setStatusMessage(`That word has ${word.length} letters. This slot needs ${expectedLen}.`);
        return;
      }

      const wordToSlot = getWordToSlotMap();
      const existingSlotForWord = wordToSlot.get(word);

      if (existingSlotForWord && existingSlotForWord !== slotId) {
        clearSlot(existingSlotForWord);
      }

      const previousWord = state.assignments[slotId];
      if (previousWord) delete state.assignments[slotId];

      if (!canFitWordInSlot(word, slotId)) {
        if (previousWord) state.assignments[slotId] = previousWord;

        saveState();
        render();
        setStatusMessage("That word conflicts with letters already placed.");
        return;
      }

      state.assignments[slotId] = word;
      state.selectedSlotId = "";
      state.revealed = false;
      state.revealedAt = "";

      if (allSlotsCorrect()) {
        state.solved = true;

        if (!state.solvedAt) {
          state.solvedAt = new Date().toISOString();
        }

        state.overlaySeen = false;
      } else {
        state.solved = false;
      }

      saveState();
      render();

      if (state.solved) {
        showOverlay();
      } else {
        setStatusMessage(`Placed "${word}". Keep going!`);
      }
    }

    function resetPuzzle() {
      if (!confirm("Reset this Kriss Kross and clear all progress?")) return;

      state.assignments = {};
      state.selectedSlotId = "";
      state.revealed = false;
      state.solved = false;
      state.solvedAt = "";
      state.revealedAt = "";
      state.overlaySeen = false;

      saveState();
      hideOverlay();
      render();
    }

    function revealAnswers() {
      if (isFinished()) return;

      const ok = confirm("Reveal all answers? This will end the puzzle.");
      if (!ok) return;

      const assignments = {};

      normalizedPlacements.forEach(slot => {
        assignments[slot.id] = slot.word;
      });

      state.assignments = assignments;
      state.selectedSlotId = "";
      state.revealed = true;
      state.solved = false;

      if (!state.revealedAt) {
        state.revealedAt = new Date().toISOString();
      }

      state.overlaySeen = false;

      saveState();
      render();
      showOverlay();
    }

    function statusMessage() {
      if (state.solved) return "Kriss Kross solved! 🎉";
      if (state.revealed) return "Answers revealed.";

      if (state.selectedSlotId) {
        const len = slotLength(state.selectedSlotId);
        return `Slot selected. Choose a ${len}-letter word from the list.`;
      }

      return "Click a slot in the grid, then click a matching word from the list. Click the same crossing square again to switch direction.";
    }

    function setStatusMessage(msg) {
      const el = mount.querySelector("#hp-kk-status-msg");
      if (el) el.textContent = msg;
    }

    function isFirstCellOfSlot(r, c, slotId) {
      if (!slotId) return false;

      const cells = cellsBySlot.get(slotId) || [];
      if (!cells.length) return false;

      return cells[0].r === r && cells[0].c === c;
    }

    function renderStats() {
      const placedEl = mount.querySelector("#hp-kk-correct-ratio");
      const leftEl = mount.querySelector("#hp-kk-left");
      const sizeEl = mount.querySelector("#hp-kk-size");
      const progressFill = mount.querySelector("#hp-kk-progress-fill");

      if (placedEl) placedEl.textContent = `${correctCount()}/${normalizedPlacements.length}`;
      if (leftEl) leftEl.textContent = String(normalizedPlacements.length - correctCount());
      if (sizeEl) sizeEl.textContent = `${rowCount}×${colCount}`;
      if (progressFill) progressFill.style.width = `${progressPercent()}%`;
    }

    function renderStatus() {
      setStatusMessage(statusMessage());
    }

    function renderBoardOnly() {
      const boardEl = mount.querySelector("#hp-kk-board");
      if (!boardEl) return;

      const currentBoard = buildCurrentBoard();

      boardEl.style.setProperty("--hp-kk-cols", String(colCount));
      boardEl.style.setProperty("--hp-kk-rows", String(rowCount));
      boardEl.style.gridTemplateColumns = `repeat(${colCount}, var(--hp-kk-cell-size))`;
      boardEl.style.gridTemplateRows = `repeat(${rowCount}, var(--hp-kk-cell-size))`;

      boardEl.innerHTML = Array.from({ length: rowCount }, (_, r) =>
        Array.from({ length: colCount }, (_, c) => {
          if (!activeCellMap.has(cellKey(r, c))) {
            return `<div class="hp-kk-block" aria-hidden="true"></div>`;
          }

          const slotIdsHere = normalizedPlacements
            .filter(slot => (cellsBySlot.get(slot.id) || []).some(cell => cell.r === r && cell.c === c))
            .map(slot => slot.id);

          const selectedHere = slotIdsHere.includes(state.selectedSlotId);
          const anyCorrectHere = slotIdsHere.some(slotId => slotIsCorrect(slotId));
          const anyFilledHere = slotIdsHere.some(slotId => state.assignments[slotId]);
          const isSelectedStart = state.selectedSlotId && isFirstCellOfSlot(r, c, state.selectedSlotId);
          const canToggle = slotIdsHere.length > 1;

          const classes = ["hp-kk-cell"];

          if (selectedHere && !isFinished()) classes.push("is-selected");
          if (state.revealed) classes.push("is-revealed");
          else if (anyCorrectHere) classes.push("is-correct");
          else if (anyFilledHere) classes.push("is-filled");

          if (isSelectedStart) classes.push("is-slot-start");
          if (canToggle) classes.push("is-toggle-cell");

          const letter = state.revealed ? solutionBoard[r][c] : (currentBoard[r][c] || "");

          const label = letter
            ? `Row ${r + 1}, Column ${c + 1}, Letter ${letter}${canToggle ? ". Click again to switch direction." : ""}`
            : `Row ${r + 1}, Column ${c + 1}, empty slot${canToggle ? ". Click again to switch direction." : ""}`;

          return `
            <button
              type="button"
              class="${classes.join(" ")}"
              data-row="${r}"
              data-col="${c}"
              aria-label="${escapeHtml(label)}">
              ${escapeHtml(letter)}
            </button>
          `;
        }).join("")
      ).join("");

      boardEl.querySelectorAll("[data-row][data-col]").forEach(btn => {
        btn.addEventListener("click", () => {
          const r = Number(btn.getAttribute("data-row"));
          const c = Number(btn.getAttribute("data-col"));

          if (Number.isFinite(r) && Number.isFinite(c)) {
            selectNextSlotAtCell(r, c);
          }
        });
      });
    }

    function renderWordListOnly() {
      const listEl = mount.querySelector("#hp-kk-word-list");
      const pillEl = mount.querySelector("#hp-kk-pill");

      if (!listEl) return;

      const usedWords = new Set(Object.values(state.assignments).filter(Boolean));

      if (pillEl) pillEl.textContent = `Words Placed: ${placedCount()}/${normalizedPlacements.length}`;

      listEl.innerHTML = words.map(word => {
        const used = usedWords.has(word);
        const selectedMatch = state.selectedSlotId && slotLength(state.selectedSlotId) === word.length;
        const found = normalizedPlacements.some(slot => slot.word === word && slotIsCorrect(slot.id));

        const classes = ["hp-kk-word-item"];

        if (state.helpMode && selectedMatch && !used && !isFinished()) classes.push("is-match");
        if (used && !found) classes.push("is-used");
        if (found || state.revealed) classes.push("is-found");

        return `
          <button
            type="button"
            class="${classes.join(" ")}"
            data-word="${escapeHtml(word)}"
            ${isFinished() ? "disabled" : ""}>
            ${escapeHtml(word)}
          </button>
        `;
      }).join("");

      listEl.querySelectorAll("[data-word]").forEach(btn => {
        btn.addEventListener("click", () => {
          const word = btn.getAttribute("data-word");
          if (word) placeWord(word);
        });
      });
    }

    function renderOverlayContent() {
      const badgeIdEl = mount.querySelector("#hp-kk-badge-id");
      const badgeMetaEl = mount.querySelector("#hp-kk-badge-meta");
      const overlayIconEl = mount.querySelector("#hp-kk-overlay-icon");
      const overlayTitleEl = mount.querySelector("#hp-kk-overlay-title");
      const overlayTextEl = mount.querySelector("#hp-kk-overlay-text");

      if (!badgeIdEl || !badgeMetaEl || !overlayIconEl || !overlayTitleEl || !overlayTextEl) return;

      badgeIdEl.textContent = puzzleTitle;
      badgeMetaEl.textContent = `Placed: ${correctCount()}/${normalizedPlacements.length}`;

      if (state.solved) {
        overlayIconEl.textContent = "🎉";
        overlayTitleEl.textContent = "You Solved the Kriss Kross!";
        overlayTextEl.innerHTML = `
          <div class="hp-modal-lead">Congratulations — you did it!</div>
          <div class="hp-modal-subtext">New puzzles are added daily in the Puzzlers Hub.</div>
          <div class="hp-modal-subtext">Or explore a whole stack of puzzles to enjoy offline.</div>
        `;
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "📘";
        overlayTitleEl.textContent = "Answers Revealed";
        overlayTextEl.innerHTML = `
          <div class="hp-modal-lead">Here is the completed puzzle.</div>
          <div class="hp-modal-subtext">Now that you've seen the answers, try another Daily Brain Boost puzzle.</div>
          <div class="hp-modal-subtext">Or explore a whole stack of puzzles to enjoy offline.</div>
        `;
      }
    }

    function showOverlay() {
      renderOverlayContent();

      const overlayEl = mount.querySelector("#hp-kk-overlay");
      if (!overlayEl) return;

      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");

      state.overlaySeen = false;
      saveState();
    }

    function hideOverlay() {
      const overlayEl = mount.querySelector("#hp-kk-overlay");
      if (!overlayEl) return;

      overlayEl.classList.remove("on");
      overlayEl.setAttribute("aria-hidden", "true");

      state.overlaySeen = true;
      saveState();
    }

    function showHelpModal() {
      const modalEl = mount.querySelector("#hp-kk-help-modal");
      if (!modalEl) return;

      modalEl.classList.add("on");
      modalEl.setAttribute("aria-hidden", "false");
    }

    function hideHelpModal() {
      const modalEl = mount.querySelector("#hp-kk-help-modal");
      if (!modalEl) return;

      modalEl.classList.remove("on");
      modalEl.setAttribute("aria-hidden", "true");
    }

    function render() {
      mount.innerHTML = `
        <div class="hp-kk-layout">
          <div class="hp-kk-col-left">
            <div class="hp-kk-panel">
              ${puzzleTheme ? `<h3 class="hp-kk-theme">${escapeHtml(puzzleTheme)}</h3>` : ""}

              <div class="hp-kk-board-wrap">
                <div class="hp-kk-board" id="hp-kk-board" aria-label="Kriss Kross puzzle board"></div>
              </div>

              <div class="hp-puzzle-mobile-tools" aria-label="Kriss Kross puzzle controls">
                <button
                  type="button"
                  class="hp-tool-btn hint-toggle${state.helpMode ? " active" : ""}"
                  data-kk-help-toggle="mobile"
                  aria-pressed="${state.helpMode ? "true" : "false"}">
                  ${state.helpMode ? "Hint: ON" : "Hint: OFF"}
                </button>
                <button type="button" class="hp-tool-btn clear-tool" data-a="clear-selected">Clear</button>
                <button type="button" class="hp-tool-btn danger" data-a="reset-puzzle">Reset</button>
                <button type="button" class="hp-tool-btn reveal" data-a="reveal-answers">Reveal</button>
              </div>

              <div class="hp-kk-actions">
                <button type="button" class="hp-kk-btn danger" id="hp-kk-reset">Reset Puzzle</button>
                <button type="button" class="hp-kk-btn reveal" id="hp-kk-reveal">Reveal Answers</button>
              </div>
            </div>
          </div>

          <div class="hp-kk-col-right">
            <div class="hp-kk-panel">

              <div class="hp-puzzle-tools" aria-label="Kriss Kross puzzle controls">
                <button
                  type="button"
                  class="hp-tool-btn hint-toggle${state.helpMode ? " active" : ""}"
                  id="hp-kk-help-toggle"
                  data-kk-help-toggle="desktop"
                  aria-pressed="${state.helpMode ? "true" : "false"}">
                  ${state.helpMode ? "Hint: ON" : "Hint: OFF"}
                </button>
                <button type="button" class="hp-tool-btn clear-tool" id="hp-kk-clear-slot" data-a="clear-selected">Clear</button>
              </div>

              <div class="hp-kk-words-header">
                <h3>Place These Words</h3>
                <span class="hp-kk-pill" id="hp-kk-pill">Words Placed: 0/0</span>
              </div>

              <div class="hp-kk-word-list" id="hp-kk-word-list"></div>
            </div>
          </div>
        </div>

        <div class="hp-overlay" id="hp-kk-overlay" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Kriss Kross result">
            <div id="hp-kk-overlay-icon" style="font-size:28px; line-height:1;">🎉</div>

            <h3 id="hp-kk-overlay-title">You Solved the Kriss Kross!</h3>

            <div class="hp-badges">
              <span class="hp-badge" id="hp-kk-badge-id"></span>
              <span class="hp-badge" id="hp-kk-badge-meta"></span>
            </div>

            <div id="hp-kk-overlay-text">
              <div class="hp-modal-lead">Congratulations — you did it!</div>
              <div class="hp-modal-subtext">New puzzles are added daily in the Puzzlers Hub.</div>
              <div class="hp-modal-subtext">Or explore a whole stack of puzzles to enjoy offline.</div>
            </div>

            <div class="hp-modal-actions">
              <a class="hp-link-btn secondary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
              <a class="hp-link-btn primary" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>

              <button class="hp-link-btn neutral" data-a="share">Share</button>
              <button class="hp-link-btn neutral" data-a="close-overlay">Back to Puzzle</button>

              <button class="hp-link-btn danger full" data-a="reset-puzzle">Reset Puzzle</button>
            </div>

            <small>Hare Publishing • Kriss Kross</small>
          </div>
        </div>

        <div class="hp-overlay hp-kk-help-modal" id="hp-kk-help-modal" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Kriss Kross">
            <h3>How to Play</h3>

            <div class="hp-help-modal-content">
              <span class="hp-help-line">Select a <strong>slot in the grid</strong>, then choose a matching word from the list.</span>
              <span class="hp-help-line">Use the <strong>crossing letters</strong> to help place each word correctly.</span>
              <span class="hp-help-line">If a square belongs to two words, click it again to <strong>switch direction</strong>.</span>
              <span class="hp-help-line"><strong>Hint: ON</strong> highlights words that match the selected slot length.</span>
              <span class="hp-help-line"><strong>Reveal Answers</strong> ends the puzzle and shows the completed grid.</span>
            </div>

            <div class="hp-modal-actions">
              <button class="hp-link-btn neutral full" data-a="close-help-modal">Back to Puzzle</button>
            </div>

            <small>Hare Publishing • Kriss Kross</small>
          </div>
        </div>
      `;

      renderStats();
      renderStatus();
      renderBoardOnly();
      renderWordListOnly();
      bindEvents();

      if ((state.solved || state.revealed) && !state.overlaySeen) {
        showOverlay();
      }
    }

    function bindEvents() {
      const clearBtn = mount.querySelector("#hp-kk-clear-slot");
      const resetBtn = mount.querySelector("#hp-kk-reset");
      const revealBtn = mount.querySelector("#hp-kk-reveal");
      const overlayEl = mount.querySelector("#hp-kk-overlay");
      const helpModalEl = mount.querySelector("#hp-kk-help-modal");

      if (clearBtn) clearBtn.addEventListener("click", clearSelectedSlot);
      if (resetBtn) resetBtn.addEventListener("click", resetPuzzle);
      if (revealBtn) revealBtn.addEventListener("click", revealAnswers);

      mount.querySelectorAll("[data-kk-help-toggle]").forEach(helpBtn => {
        helpBtn.addEventListener("click", toggleHelpMode);
      });

      mount.querySelectorAll("[data-a]").forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.getAttribute("data-a");

          if (action === "close-overlay") {
            hideOverlay();
            return;
          }

          if (action === "open-help-modal") {
            showHelpModal();
            return;
          }

          if (action === "close-help-modal") {
            hideHelpModal();
            return;
          }

          if (action === "clear-selected") {
            clearSelectedSlot();
            return;
          }

          if (action === "reset-puzzle") {
            resetPuzzle();
            return;
          }

          if (action === "reveal-answers") {
            revealAnswers();
            return;
          }

          if (action === "share") {
            const shareData = {
              title: `${puzzleTitle} — Hare Publishing`,
              text: state.solved
                ? `I solved ${puzzleTitle} from Hare Publishing!`
                : state.revealed
                  ? `I revealed the answers for ${puzzleTitle} at Hare Publishing.`
                  : `I’m playing ${puzzleTitle} from Hare Publishing!`,
              url: window.location.href
            };

            if (navigator.share) {
              navigator.share(shareData).catch(() => {});
            } else {
              try {
                navigator.clipboard.writeText(window.location.href);
                setStatusMessage("Link copied! 📋");
              } catch {
                setStatusMessage("Copy the link from your address bar 🙂");
              }
            }
          }
        });
      });

      if (overlayEl) {
        overlayEl.addEventListener("click", (e) => {
          if (e.target === overlayEl) hideOverlay();
        });
      }

      if (helpModalEl) {
        helpModalEl.addEventListener("click", (e) => {
          if (e.target === helpModalEl) hideHelpModal();
        });
      }
    }

    container.addEventListener("keydown", (e) => {
      const overlayEl = mount.querySelector("#hp-kk-overlay");
      const helpModalEl = mount.querySelector("#hp-kk-help-modal");

      if (helpModalEl && helpModalEl.classList.contains("on")) {
        if (e.key === "Escape") hideHelpModal();
        return;
      }

      if (overlayEl && overlayEl.classList.contains("on")) {
        if (e.key === "Escape") hideOverlay();
        return;
      }

      if (e.key === "Escape") {
        state.selectedSlotId = "";
        saveState();
        render();
      }
    });

    render();
    emitKrissKrossStateChange("loaded");
  }
};

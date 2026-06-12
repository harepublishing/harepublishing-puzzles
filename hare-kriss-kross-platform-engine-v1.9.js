/* =========================================================
   HARE PUBLISHING KRISS KROSS PLATFORM ENGINE
   Version: 1.7
   Platform migration based on Word Scramble v2.6
   Self-contained: includes copied production shared CSS + clean Kriss Kross platform CSS
   Exposes: window.HareKrissKrossPlatformEngine
   Storage prefix: hp_kk_
   ========================================================= */

window.HareKrissKrossPlatformEngine = (() => {
  const VERSION = "kriss-kross-platform-engine-v1.9";
  const Core = window.HarePuzzleCore || null;
  const STORAGE_PREFIX = "hp_kk_";

  const krissKrossStatusAdapter = {
    isSolved(data) {
      return Boolean(data && !this.isRevealed(data) && (data.solved || data.status === "solved" || data.solvedAt));
    },
    isRevealed(data) {
      return Boolean(data && (data.revealed || data.status === "revealed" || data.revealedAt));
    },
    isFinished(data) {
      return Boolean(data && (data.solved || data.revealed || data.status === "solved" || data.status === "revealed" || data.solvedAt || data.revealedAt));
    },
    hasProgress(data) {
      if (!data || this.isFinished(data)) return false;
      const assignments = data.assignments && typeof data.assignments === "object" ? data.assignments : {};
      return Boolean(
        Object.values(assignments).some(Boolean) ||
        data.selectedSlotId ||
        data.startedAt || data.updatedAt || data.lastPlayedAt
      );
    },
    finishedDate(data) {
      if (!data) return null;
      return data.solvedAt || data.revealedAt || data.finishedAt || data.updatedAt || data.lastPlayedAt || null;
    }
  };

  const COPIED_PRODUCTION_CSS = "/* =========================================================\n   HARE PUZZLE MENU SYSTEM\n   ========================================================= */\n\n#hp-puzzle-menu-wrap {\n  width: 100%;\n  margin: 6px auto 22px;\n  padding: 0;\n  box-sizing: border-box;\n  position: relative;\n  z-index: 50;\n  display: flex;\n  justify-content: center;\n}\n\n#hp-puzzle-menu {\n  display: flex;\n  justify-content: center;\n  gap: 8px;\n  font-family: Roboto, Arial, sans-serif;\n}\n\n#hp-puzzle-menu button,\n#hp-puzzle-menu a {\n  appearance: none;\n  -webkit-appearance: none;\n  border: 1px solid #d8e8f4;\n  background: #fafcff;\n  color: #24323d;\n  border-radius: 12px;\n  min-height: 40px;\n  padding: 10px 12px;\n  font-size: 13px;\n  font-weight: 800;\n  line-height: 1;\n  text-decoration: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 7px;\n  cursor: pointer;\n  box-shadow: 0 8px 18px rgba(0,0,0,.045);\n  transition:\n    transform .08s ease,\n    box-shadow .08s ease,\n    background .2s ease,\n    opacity .2s ease;\n}\n\n#hp-puzzle-menu button:hover,\n#hp-puzzle-menu a:hover {\n  transform: translateY(-1px);\n  border-color: #107FBB;\n  color: #107FBB;\n  background: #ffffff;\n}\n\n#hp-puzzle-menu-overlay {\n  position: fixed;\n  inset: 0;\n  background: rgba(0,0,0,.45);\n  z-index: 999999;\n  display: none;\n  align-items: center;\n  justify-content: center;\n  padding: 20px;\n  font-family: Roboto, Arial, sans-serif;\n}\n\n#hp-puzzle-menu-overlay.on {\n  display: flex;\n}\n\n.hppm-modal {\n  position: relative;\n  width: min(520px, 100%);\n  background: #fff;\n  border-radius: 18px;\n  border: 1px solid #eee;\n  padding: 20px 18px 16px;\n  box-shadow: 0 20px 70px rgba(0,0,0,.25);\n  color: #24323d;\n  text-align: center;\n}\n\n.hppm-close {\n  position: absolute;\n  top: 10px;\n  right: 12px;\n  border: 0;\n  background: transparent;\n  font-size: 30px;\n  line-height: 1;\n  cursor: pointer;\n  color: #24323d;\n}\n\n.hppm-icon {\n  width: 58px;\n  height: 58px;\n  border-radius: 16px;\n  background: #eefaf1;\n  border: 1px solid #bfe5ca;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 30px;\n  margin: 0 auto 12px;\n}\n\n.hppm-modal h2 {\n  margin: 0 0 16px;\n  font-size: 26px;\n  font-weight: 900;\n  line-height: 1.1;\n  color: #24323d;\n}\n\n.hppm-stats-grid {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 10px;\n}\n\n.hppm-stats-grid div {\n  background: #fafcff;\n  border: 1px solid #d8e8f4;\n  border-radius: 16px;\n  padding: 14px 8px;\n  text-align: center;\n}\n\n.hppm-stats-grid strong {\n  display: block;\n  color: #107FBB;\n  font-size: 2rem;\n  line-height: 1;\n  font-weight: 900;\n}\n\n.hppm-stats-grid span {\n  display: block;\n  margin-top: 7px;\n  color: #51606c;\n  font-size: .78rem;\n  font-weight: 900;\n  line-height: 1.15;\n}\n\n.hppm-note {\n  text-align: center;\n  color: #51606c;\n  font-weight: 700;\n  line-height: 1.45;\n}\n\n#hppm-message-text {\n  display: block;\n  width: 100%;\n  max-width: 100%;\n  box-sizing: border-box;\n  border: 1px solid #d8e8f4;\n  background: #fafcff;\n  border-radius: 16px;\n  padding: 13px;\n  font: inherit;\n  resize: vertical;\n  min-height: 120px;\n  color: #24323d;\n}\n\n#hppm-message-text:focus {\n  outline: none;\n  border-color: #107FBB;\n  box-shadow: 0 0 0 3px rgba(16,127,187,.14);\n}\n\n.hppm-primary {\n  width: 100%;\n  margin-top: 12px;\n  border: 1px solid #00A54F;\n  border-radius: 12px;\n  background: #00A54F;\n  color: #fff;\n  min-height: 46px;\n  font-size: 15px;\n  font-weight: 900;\n  cursor: pointer;\n  transition:\n    transform .08s ease,\n    box-shadow .08s ease,\n    opacity .2s ease;\n}\n\n.hppm-primary:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 10px 22px rgba(0,165,79,.18);\n}\n\n.hppm-small {\n  text-align: center;\n  font-size: .9rem;\n  font-weight: 800;\n  color: #107FBB;\n}\n\n.hppm-submit-state {\n  min-height: 170px;\n  width: 100%;\n  box-sizing: border-box;\n  border: 1px solid #d8e8f4;\n  background: #fafcff;\n  border-radius: 16px;\n  padding: 26px 18px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 10px;\n  color: #24323d;\n  text-align: center;\n}\n\n.hppm-submit-state strong {\n  font-size: 1.25rem;\n  line-height: 1.25;\n  font-weight: 900;\n}\n\n.hppm-submit-state span {\n  color: #51606c;\n  font-weight: 700;\n}\n\n.hppm-submit-spinner,\n.hppm-submit-check {\n  width: 46px;\n  height: 46px;\n  border-radius: 999px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 26px;\n  background: #eefaf1;\n  border: 1px solid #bfe5ca;\n}\n\n.hppm-submit-success strong {\n  color: #00A54F;\n}\n\n.hppm-submit-error strong {\n  color: #ED1B24;\n}\n\n@media (max-width: 640px) {\n\n  #hp-puzzle-menu-wrap {\n    margin: 4px auto 18px;\n  }\n\n  #hp-puzzle-menu {\n    justify-content: center;\n    gap: 7px;\n  }\n\n  #hp-puzzle-menu button,\n  #hp-puzzle-menu a {\n    min-height: 38px;\n    padding: 9px 11px;\n    border-radius: 11px;\n  }\n\n  #hp-puzzle-menu span {\n    display: none;\n  }\n\n  .hppm-stats-grid {\n    grid-template-columns: repeat(2, 1fr);\n  }\n\n  .hppm-modal {\n    padding: 22px 18px 16px;\n  }\n}\n\n/* Updated 2026-05-18 v5: shared stats/progress selectors now remain the single source for Cryptogram, Word Scramble, Word Flower, Wordrow, and Kriss Kross. */\n/* =========================================================\n   HARE PUBLISHING SHARED PUZZLE FOUNDATION\n   Add BEFORE individual puzzle CSS.\n   CSS-only visual foundation. Does not change keyboard behavior.\nDate: 2026-05-14\n   ========================================================= */\n\n\n/* =========================================================\n   BRAND VARIABLES\n   ========================================================= */\n\n#hp-sudoku-container,\n#hp-wordrow-container,\n#hp-wordflower-container,\n#hp-cryptogram-container,\n#hp-wordsearch-container,\n#hp-kriss-kross-platform-container,\n#hp-wordscramble-container {\n  --hp-green: #00A54F;\n  --hp-blue: #107FBB;\n  --hp-purple: #680099;\n  --hp-red: #ED1B24;\n  --hp-orange: #F7941C;\n  --hp-text: #333;\n  --hp-dark: #24323d;\n  --hp-muted: #51606c;\n  --hp-soft-blue: #f7fbff;\n  --hp-soft-bg: #fafcff;\n  --hp-soft-border: #dceaf6;\n  --hp-help-border: #d8e8f4;\n  --hp-panel-border: #eee;\n  --hp-panel-shadow: 0 20px 60px rgba(0,0,0,.06);\n  --hp-modal-shadow: 0 20px 70px rgba(0,0,0,.25);\n}\n/* =========================================================\n\n   SHARED PUZZLE DATE\n\n   ========================================================= */\n\n#hp-sudoku-container .hp-puzzle-date,\n#hp-wordrow-container .hp-puzzle-date,\n#hp-wordflower-container .hp-puzzle-date,\n#hp-cryptogram-container .hp-puzzle-date,\n#hp-wordsearch-container .hp-puzzle-date,\n#hp-kriss-kross-platform-container .hp-puzzle-date,\n#hp-wordscramble-container .hp-puzzle-date {\n  text-align: center;\n  font-size: 24px;\n  font-weight: 800;\n  line-height: 1.2;\n  color: var(--hp-blue);\n  margin: 0 0 28px;\n}\n\n/* =========================================================\n   OUTER WRAPPERS\n   ========================================================= */\n\n#hp-sudoku-container,\n#hp-wordrow-container,\n#hp-wordflower-container,\n#hp-cryptogram-container,\n#hp-wordsearch-container,\n#hp-wordscramble-container {\n  width: 100%;\n  max-width: 1000px;\n  margin: 0 auto;\n  font-family: sans-serif;\n  color: var(--hp-text);\n}\n\n#hp-kriss-kross-platform-container {\n  width: 100%;\n  max-width: 1226px;\n  margin: 0 auto;\n  font-family: sans-serif;\n  color: var(--hp-text);\n}\n\n#hp-sudoku-container *,\n#hp-wordrow-container *,\n#hp-wordflower-container *,\n#hp-cryptogram-container *,\n#hp-wordsearch-container *,\n#hp-kriss-kross-platform-container *,\n#hp-wordscramble-container * {\n  box-sizing: border-box;\n}\n\n/* Keep puzzle containers visually clean when focused.\n   This does NOT change keyboard event scope or focus behavior. */\n#hp-wordrow-container:focus,\n#hp-wordrow-container:focus-visible,\n#hp-wordflower-container:focus,\n#hp-wordflower-container:focus-visible,\n#hp-wordscramble-container:focus,\n#hp-wordscramble-container:focus-visible,\n#hp-cryptogram-container:focus,\n#hp-cryptogram-container:focus-visible {\n  outline: none;\n}\n\n/* =========================================================\n   SHARED PANELS / CARDS\n   ========================================================= */\n\n#hp-wordrow-container .hpw-wrap,\n#hp-wordflower-container .hp-wf-panel,\n#hp-cryptogram-container .hp-crypto-card,\n#hp-wordsearch-container .hp-ws-panel,\n#hp-kriss-kross-platform-container .hp-kk-panel,\n#hp-wordscramble-container .hp-wsc-panel {\n  background: #fff;\n  border: 1px solid var(--hp-panel-border);\n  border-radius: 18px;\n  box-shadow: var(--hp-panel-shadow);\n  min-width: 0;\n}\n\n/* =========================================================\n   SHARED STATS\n   ========================================================= */\n\n#hp-wordrow-container .hpw-stats,\n#hp-wordflower-container .hp-wf-stats,\n#hp-wordsearch-container .hp-ws-stats,\n#hp-cryptogram-container .hp-crypto-stats,\n#hp-kriss-kross-platform-container .hp-kk-stats,\n#hp-wordscramble-container .hp-wsc-stats {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 8px;\n  margin-bottom: 8px;\n}\n\n#hp-wordrow-container .hpw-stat,\n#hp-wordflower-container .hp-wf-stat,\n#hp-wordsearch-container .hp-ws-stat,\n#hp-cryptogram-container .hp-crypto-stat,\n#hp-kriss-kross-platform-container .hp-kk-stat,\n#hp-wordscramble-container .hp-wsc-stat {\n  background: var(--hp-soft-blue);\n  border: 1px solid var(--hp-soft-border);\n  border-radius: 14px;\n  padding: 8px 6px;\n  text-align: center;\n}\n\n#hp-wordrow-container .hpw-stat-value,\n#hp-wordflower-container .hp-wf-stat-value,\n#hp-wordsearch-container .hp-ws-stat-value,\n#hp-cryptogram-container .hp-crypto-stat-value,\n#hp-kriss-kross-platform-container .hp-kk-stat-value,\n#hp-wordscramble-container .hp-wsc-stat-value {\n  display: block;\n  font-size: 1.5rem;\n  line-height: 1.15;\n  font-weight: 900;\n  color: var(--hp-blue);\n  white-space: nowrap;\n}\n\n#hp-wordrow-container .hpw-stat-label,\n#hp-wordflower-container .hp-wf-stat-label,\n#hp-wordsearch-container .hp-ws-stat-label,\n#hp-cryptogram-container .hp-crypto-stat-label,\n#hp-kriss-kross-platform-container .hp-kk-stat-label,\n#hp-wordscramble-container .hp-wsc-stat-label {\n  display: block;\n  margin-top: 4px;\n  font-size: 1rem;\n  line-height: 1.2;\n  font-weight: 700;\n  color: #5b6875;\n}\n\n/* =========================================================\n   SHARED PROGRESS BARS\n   ========================================================= */\n\n#hp-wordrow-container .hpw-progress,\n#hp-wordflower-container .hp-wf-progress,\n#hp-wordsearch-container .hp-ws-progress,\n#hp-cryptogram-container .hp-crypto-progress,\n#hp-kriss-kross-platform-container .hp-kk-progress,\n#hp-wordscramble-container .hp-wsc-progress {\n  width: 100%;\n  height: 10px;\n  margin: 15px 0 15px;\n  border-radius: 999px;\n  background: #d9e7f3;\n  overflow: hidden;\n  border: 1px solid #c4d9ea;\n}\n\n#hp-wordrow-container .hpw-progress-fill,\n#hp-wordflower-container .hp-wf-progress-fill,\n#hp-wordsearch-container .hp-ws-progress-fill,\n#hp-cryptogram-container .hp-crypto-progress-fill,\n#hp-kriss-kross-platform-container .hp-kk-progress-fill,\n#hp-wordscramble-container .hp-wsc-progress-fill {\n  display: block;\n  height: 100%;\n  width: 0%;\n  min-width: 0;\n  background: var(--hp-green);\n  transition: width 0.25s ease;\n}\n\n/* Shared mobile stats: keep all puzzle stat cards in one row and scale text down. */\n@media (max-width: 560px) {\n  #hp-wordrow-container .hpw-stats,\n  #hp-wordflower-container .hp-wf-stats,\n  #hp-wordsearch-container .hp-ws-stats,\n  #hp-cryptogram-container .hp-crypto-stats,\n  #hp-kriss-kross-platform-container .hp-kk-stats,\n  #hp-wordscramble-container .hp-wsc-stats {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n    gap: 6px;\n  }\n\n  #hp-wordrow-container .hpw-stat,\n  #hp-wordflower-container .hp-wf-stat,\n  #hp-wordsearch-container .hp-ws-stat,\n  #hp-cryptogram-container .hp-crypto-stat,\n  #hp-kriss-kross-platform-container .hp-kk-stat,\n  #hp-wordscramble-container .hp-wsc-stat {\n    padding: 7px 4px;\n    border-radius: 12px;\n  }\n\n  #hp-wordrow-container .hpw-stat-value,\n  #hp-wordflower-container .hp-wf-stat-value,\n  #hp-wordsearch-container .hp-ws-stat-value,\n  #hp-cryptogram-container .hp-crypto-stat-value,\n  #hp-kriss-kross-platform-container .hp-kk-stat-value,\n  #hp-wordscramble-container .hp-wsc-stat-value {\n    font-size: 0.9rem;\n    line-height: 1.05;\n  }\n\n  #hp-wordrow-container .hpw-stat-label,\n  #hp-wordflower-container .hp-wf-stat-label,\n  #hp-wordsearch-container .hp-ws-stat-label,\n  #hp-cryptogram-container .hp-crypto-stat-label,\n  #hp-kriss-kross-platform-container .hp-kk-stat-label,\n  #hp-wordscramble-container .hp-wsc-stat-label {\n    margin-top: 3px;\n    font-size: 0.62rem;\n    line-height: 1.1;\n  }\n}\n\n/* =========================================================\n   SHARED STATUS / TOAST\n   ========================================================= */\n\n#hp-wordrow-container .hpw-toast,\n#hp-wordsearch-container .hp-ws-status,\n#hp-cryptogram-container .hp-crypto-status,\n#hp-kriss-kross-platform-container .hp-kk-status,\n#hp-wordscramble-container .hp-wsc-status {\n  text-align: center;\n}\n\n#hp-wordrow-container .hpw-toast span,\n#hp-wordrow-container .hpw-toast-msg,\n#hp-wordsearch-container .hp-ws-status-msg,\n#hp-cryptogram-container .hp-crypto-status-msg,\n#hp-kriss-kross-platform-container .hp-kk-status-msg,\n#hp-wordscramble-container .hp-wsc-status-msg {\n  display: inline-block;\n  padding: 9px 15px;\n  border-radius: 999px;\n  border: 1px solid #dde8f2;\n  background: #f3f7fb;\n  font-weight: 700;\n  font-size: 14px;\n  color: #444;\n  line-height: 1.45;\n  max-width: 100%;\n}\n\n/* Wordrow intentionally keeps its toast slightly bolder. */\n#hp-wordrow-container .hpw-toast span,\n#hp-wordrow-container .hpw-toast-msg {\n  padding: 10px 16px;\n  font-weight: 900;\n  font-size: 15px;\n}\n\n/* =========================================================\n   SHARED BUTTON BEHAVIOR\n   ========================================================= */\n\n#hp-sudoku-container .hp-btn,\n#hp-sudoku-container .hp-btn-sm,\n#hp-sudoku-container .hp-link-btn,\n#hp-wordrow-container .hpw-key,\n#hp-wordrow-container .hpw-btn,\n#hp-wordrow-container .hp-link-btn,\n#hp-wordflower-container .hp-link-btn,\n#hp-wordflower-container .hp-wf-help-summary,\n#hp-wordsearch-container .hp-ws-btn,\n#hp-wordsearch-container .hp-link-btn,\n#hp-wordsearch-container .hp-ws-help-summary,\n#hp-kriss-kross-platform-container .hp-kk-btn,\n#hp-kriss-kross-platform-container .hp-link-btn,\n#hp-wordscramble-container .hp-wsc-btn,\n#hp-wordscramble-container .hp-link-btn,\n#hp-wordscramble-container .hp-wsc-help-summary,\n#hp-wordscramble-container .hp-wsc-clue-summary,\n#hp-wordscramble-container .hp-wsc-word-item,\n#hp-cryptogram-container .hp-crypto-hint-btn,\n#hp-cryptogram-container .hp-crypto-secondary,\n#hp-cryptogram-container .hp-link-btn,\n#hp-cryptogram-container .hp-crypto-help-summary {\n  appearance: none;\n  -webkit-appearance: none;\n  border-radius: 12px;\n  font-weight: 800;\n  cursor: pointer;\n  transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.2s ease, opacity 0.2s ease;\n}\n\n#hp-sudoku-container .hp-btn:hover,\n#hp-sudoku-container .hp-btn-sm:hover,\n#hp-sudoku-container .hp-link-btn:hover,\n#hp-wordrow-container .hpw-key:hover,\n#hp-wordrow-container .hpw-btn:hover,\n#hp-wordrow-container .hp-link-btn:hover,\n#hp-wordflower-container .hp-link-btn:hover,\n#hp-wordflower-container .hp-wf-help-summary:hover,\n#hp-wordsearch-container .hp-ws-btn:hover,\n#hp-wordsearch-container .hp-link-btn:hover,\n#hp-wordsearch-container .hp-ws-help-summary:hover,\n#hp-kriss-kross-platform-container .hp-kk-btn:hover,\n#hp-kriss-kross-platform-container .hp-link-btn:hover,\n#hp-wordscramble-container .hp-wsc-btn:hover,\n#hp-wordscramble-container .hp-link-btn:hover,\n#hp-wordscramble-container .hp-wsc-help-summary:hover,\n#hp-wordscramble-container .hp-wsc-clue-summary:hover,\n#hp-wordscramble-container .hp-wsc-word-item:hover,\n#hp-cryptogram-container .hp-crypto-hint-btn:hover,\n#hp-cryptogram-container .hp-crypto-secondary:hover,\n#hp-cryptogram-container .hp-link-btn:hover,\n#hp-cryptogram-container .hp-crypto-help-summary:hover {\n  transform: translateY(-1px);\n}\n\n#hp-sudoku-container .hp-btn:active,\n#hp-sudoku-container .hp-btn-sm:active,\n#hp-sudoku-container .hp-link-btn:active,\n#hp-wordrow-container .hpw-key:active,\n#hp-wordrow-container .hpw-btn:active,\n#hp-wordrow-container .hp-link-btn:active,\n#hp-wordflower-container .hp-link-btn:active,\n#hp-wordflower-container .hp-wf-help-summary:active,\n#hp-wordsearch-container .hp-ws-btn:active,\n#hp-wordsearch-container .hp-link-btn:active,\n#hp-wordsearch-container .hp-ws-help-summary:active,\n#hp-kriss-kross-platform-container .hp-kk-btn:active,\n#hp-kriss-kross-platform-container .hp-link-btn:active,\n#hp-wordscramble-container .hp-wsc-btn:active,\n#hp-wordscramble-container .hp-link-btn:active,\n#hp-wordscramble-container .hp-wsc-help-summary:active,\n#hp-wordscramble-container .hp-wsc-clue-summary:active,\n#hp-wordscramble-container .hp-wsc-word-item:active,\n#hp-cryptogram-container .hp-crypto-hint-btn:active,\n#hp-cryptogram-container .hp-crypto-secondary:active,\n#hp-cryptogram-container .hp-link-btn:active,\n#hp-cryptogram-container .hp-crypto-help-summary:active {\n  transform: translateY(0);\n}\n\n/* =========================================================\n   SHARED HELP / INSTRUCTION TEXT\n   ========================================================= */\n\n#hp-wordrow-container .hpw-help,\n#hp-wordflower-container .hp-wf-help,\n#hp-wordsearch-container .hp-ws-help,\n#hp-kriss-kross-platform-container .hp-kk-help,\n#hp-wordscramble-container .hp-wsc-help,\n#hp-cryptogram-container .hp-crypto-help {\n  text-align: left;\n  font-size: 0.93rem;\n  line-height: 1.55;\n  color: var(--hp-muted);\n  font-weight: 600;\n}\n\n#hp-wordrow-container .hpw-help-title,\n#hp-wordflower-container .hp-wf-help-title,\n#hp-wordsearch-container .hp-ws-help-title,\n#hp-kriss-kross-platform-container .hp-kk-help-title,\n#hp-wordscramble-container .hp-wsc-help-title,\n#hp-cryptogram-container .hp-crypto-help-title {\n  display: block;\n  margin-bottom: 8px;\n  font-size: 0.98rem;\n  font-weight: 800;\n  color: var(--hp-dark);\n}\n\n#hp-wordrow-container .hpw-help-line,\n#hp-wordflower-container .hp-wf-help-line,\n#hp-wordsearch-container .hp-ws-help-line,\n#hp-kriss-kross-platform-container .hp-kk-help-line,\n#hp-wordscramble-container .hp-wsc-help-line,\n#hp-cryptogram-container .hp-crypto-help-line {\n  display: block;\n  margin-bottom: 4px;\n}\n\n#hp-wordrow-container .hpw-help-line:last-child,\n#hp-wordflower-container .hp-wf-help-line:last-child,\n#hp-wordsearch-container .hp-ws-help-line:last-child,\n#hp-kriss-kross-platform-container .hp-kk-help-line:last-child,\n#hp-wordscramble-container .hp-wsc-help-line:last-child,\n#hp-cryptogram-container .hp-crypto-help-line:last-child {\n  margin-bottom: 0;\n}\n\n#hp-wordrow-container .hpw-help strong,\n#hp-wordflower-container .hp-wf-help strong,\n#hp-wordsearch-container .hp-ws-help strong,\n#hp-kriss-kross-platform-container .hp-kk-help strong,\n#hp-wordscramble-container .hp-wsc-help strong,\n#hp-cryptogram-container .hp-crypto-help strong {\n  color: var(--hp-dark);\n}\n\n/* =========================================================\n   SHARED HELP BOXES\n   ========================================================= */\n\n#hp-wordrow-container .hpw-help-panel,\n#hp-wordflower-container .hp-wf-help,\n#hp-wordsearch-container .hp-ws-help,\n#hp-kriss-kross-platform-container .hp-kk-help,\n#hp-wordscramble-container .hp-wsc-help,\n#hp-wordscramble-container .hp-wsc-clue-text,\n#hp-cryptogram-container .hp-crypto-help {\n  border: 1px solid #e6eef5;\n  border-radius: 14px;\n  background: var(--hp-soft-bg);\n}\n\n/* =========================================================\n   SHARED DETAILS / SUMMARY DROPDOWNS\n   ========================================================= */\n\n#hp-wordflower-container .hp-wf-help-summary,\n#hp-wordsearch-container .hp-ws-help-summary,\n#hp-wordscramble-container .hp-wsc-help-summary,\n#hp-wordscramble-container .hp-wsc-clue-summary,\n#hp-cryptogram-container .hp-crypto-help-summary {\n  list-style: none;\n  width: 100%;\n  min-height: 44px;\n  padding: 12px 14px;\n  border: 1px solid var(--hp-help-border);\n  background: var(--hp-soft-bg);\n  color: var(--hp-dark);\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n  font-size: 14px;\n}\n\n#hp-wordflower-container .hp-wf-help-summary::-webkit-details-marker,\n#hp-wordsearch-container .hp-ws-help-summary::-webkit-details-marker,\n#hp-wordscramble-container .hp-wsc-help-summary::-webkit-details-marker,\n#hp-wordscramble-container .hp-wsc-clue-summary::-webkit-details-marker,\n#hp-cryptogram-container .hp-crypto-help-summary::-webkit-details-marker {\n  display: none;\n}\n\n#hp-wordflower-container .hp-wf-help-summary::after,\n#hp-wordsearch-container .hp-ws-help-summary::after,\n#hp-wordscramble-container .hp-wsc-help-summary::after,\n#hp-wordscramble-container .hp-wsc-clue-summary::after,\n#hp-cryptogram-container .hp-crypto-help-summary::after {\n  content: \"\uff0b\";\n  font-size: 18px;\n  line-height: 1;\n  color: var(--hp-blue);\n  flex: 0 0 auto;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n}\n\n#hp-wordflower-container details[open] .hp-wf-help-summary::after,\n#hp-wordsearch-container details[open] .hp-ws-help-summary::after,\n#hp-wordscramble-container details[open] .hp-wsc-help-summary::after,\n#hp-wordscramble-container details[open] .hp-wsc-clue-summary::after,\n#hp-cryptogram-container details[open] .hp-crypto-help-summary::after {\n  content: \"\u2212\";\n}\n\n/* =========================================================\n   SHARED PILLS / BADGES\n   ========================================================= */\n\n#hp-sudoku-container .hp-badge,\n#hp-wordrow-container .hp-badge,\n#hp-wordflower-container .hp-badge,\n#hp-cryptogram-container .hp-badge,\n#hp-wordsearch-container .hp-badge,\n#hp-kriss-kross-platform-container .hp-badge,\n#hp-wordscramble-container .hp-badge,\n#hp-wordscramble-container .hp-wsc-pill {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 6px 10px;\n  border-radius: 999px;\n  border: 1px solid #dceaf6;\n  background: var(--hp-soft-blue);\n  color: var(--hp-blue);\n  font-size: 12px;\n  font-weight: 800;\n  white-space: nowrap;\n}\n\n/* =========================================================\n   SHARED OVERLAY / MODAL\n   Shared success, reveal, and help modal system.\n   Engines should use these shared class names:\n   .hp-overlay, .hp-modal, .hp-badges, .hp-badge,\n   .hp-modal-lead, .hp-modal-subtext, .hp-modal-actions,\n   .hp-link-btn, .primary, .secondary, .neutral,\n   .danger, .full\n   ========================================================= */\n\n#hp-sudoku-container .hp-overlay,\n#hp-wordrow-container .hp-overlay,\n#hp-wordflower-container .hp-overlay,\n#hp-cryptogram-container .hp-overlay,\n#hp-wordsearch-container .hp-overlay,\n#hp-kriss-kross-platform-container .hp-overlay,\n#hp-wordscramble-container .hp-overlay {\n  position: fixed;\n  inset: 0;\n  background: rgba(0,0,0,.45);\n  display: none;\n  align-items: center;\n  justify-content: center;\n  padding: 20px;\n  z-index: 999999;\n}\n\n#hp-sudoku-container .hp-overlay.on,\n#hp-wordrow-container .hp-overlay.on,\n#hp-wordflower-container .hp-overlay.on,\n#hp-cryptogram-container .hp-overlay.on,\n#hp-wordsearch-container .hp-overlay.on,\n#hp-kriss-kross-platform-container .hp-overlay.on,\n#hp-wordscramble-container .hp-overlay.on {\n  display: flex;\n}\n\n#hp-sudoku-container .hp-modal,\n#hp-wordrow-container .hp-modal,\n#hp-wordflower-container .hp-modal,\n#hp-cryptogram-container .hp-modal,\n#hp-wordsearch-container .hp-modal,\n#hp-kriss-kross-platform-container .hp-modal,\n#hp-wordscramble-container .hp-modal {\n  width: 100%;\n  max-width: 520px;\n  background: #fff;\n  border-radius: 14px;\n  border: 1px solid var(--hp-panel-border);\n  box-shadow: var(--hp-modal-shadow);\n  padding: 18px 18px 14px;\n  text-align: center;\n}\n\n#hp-sudoku-container .hp-modal h3,\n#hp-wordrow-container .hp-modal h3,\n#hp-wordflower-container .hp-modal h3,\n#hp-cryptogram-container .hp-modal h3,\n#hp-wordsearch-container .hp-modal h3,\n#hp-kriss-kross-platform-container .hp-modal h3,\n#hp-wordscramble-container .hp-modal h3 {\n  margin: 6px 0 8px;\n  font-size: 22px;\n  line-height: 1.2;\n  font-weight: 900;\n  color: #111;\n}\n\n#hp-sudoku-container .hp-modal p,\n#hp-wordflower-container .hp-modal p,\n#hp-cryptogram-container .hp-modal p,\n#hp-wordsearch-container .hp-modal p,\n#hp-kriss-kross-platform-container .hp-modal p,\n#hp-wordscramble-container .hp-modal p,\n#hp-wordrow-container #hpw-msg,\n#hp-sudoku-container .hp-modal-subtext,\n#hp-wordrow-container .hp-modal-subtext,\n#hp-wordflower-container .hp-modal-subtext,\n#hp-cryptogram-container .hp-modal-subtext,\n#hp-wordsearch-container .hp-modal-subtext,\n#hp-kriss-kross-platform-container .hp-modal-subtext,\n#hp-wordscramble-container .hp-modal-subtext {\n  margin: 0 0 8px;\n  font-size: 14px;\n  color: #555;\n  line-height: 1.35;\n}\n\n#hp-sudoku-container .hp-modal-lead,\n#hp-wordrow-container .hp-modal-lead,\n#hp-wordflower-container .hp-modal-lead,\n#hp-cryptogram-container .hp-modal-lead,\n#hp-wordsearch-container .hp-modal-lead,\n#hp-kriss-kross-platform-container .hp-modal-lead,\n#hp-wordscramble-container .hp-modal-lead {\n  margin: 0 0 10px;\n  font-size: 18px;\n  font-weight: 900;\n  color: #111;\n  line-height: 1.35;\n}\n\n#hp-sudoku-container .hp-modal-subtext:last-child,\n#hp-wordrow-container .hp-modal-subtext:last-child,\n#hp-wordflower-container .hp-modal-subtext:last-child,\n#hp-cryptogram-container .hp-modal-subtext:last-child,\n#hp-wordsearch-container .hp-modal-subtext:last-child,\n#hp-kriss-kross-platform-container .hp-modal-subtext:last-child,\n#hp-wordscramble-container .hp-modal-subtext:last-child {\n  margin-bottom: 12px;\n}\n\n#hp-sudoku-container .hp-badges,\n#hp-wordrow-container .hp-badges,\n#hp-wordflower-container .hp-badges,\n#hp-cryptogram-container .hp-badges,\n#hp-wordsearch-container .hp-badges,\n#hp-kriss-kross-platform-container .hp-badges,\n#hp-wordscramble-container .hp-badges {\n  display: flex;\n  gap: 8px;\n  justify-content: center;\n  flex-wrap: wrap;\n  margin-bottom: 12px;\n}\n\n#hp-sudoku-container .hp-modal-actions,\n#hp-wordrow-container .hp-modal-actions,\n#hp-wordflower-container .hp-modal-actions,\n#hp-cryptogram-container .hp-modal-actions,\n#hp-wordsearch-container .hp-modal-actions,\n#hp-kriss-kross-platform-container .hp-modal-actions,\n#hp-wordscramble-container .hp-modal-actions {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 10px;\n}\n\n#hp-sudoku-container .hp-link-btn,\n#hp-wordrow-container .hp-link-btn,\n#hp-wordflower-container .hp-link-btn,\n#hp-cryptogram-container .hp-link-btn,\n#hp-wordsearch-container .hp-link-btn,\n#hp-kriss-kross-platform-container .hp-link-btn,\n#hp-wordscramble-container .hp-link-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 42px;\n  padding: 10px;\n  border: 1px solid #ddd;\n  background: #fff;\n  text-decoration: none;\n  color: inherit;\n  font-size: 14px;\n  line-height: 1.2;\n  font-weight: 800;\n}\n\n#hp-sudoku-container .hp-link-btn.primary,\n#hp-wordrow-container .hp-link-btn.primary,\n#hp-wordflower-container .hp-link-btn.primary,\n#hp-cryptogram-container .hp-link-btn.primary,\n#hp-wordsearch-container .hp-link-btn.primary,\n#hp-kriss-kross-platform-container .hp-link-btn.primary,\n#hp-wordscramble-container .hp-link-btn.primary,\n#hp-wordscramble-container .hp-link-btn.secondary-outline {\n  border-color: var(--hp-green);\n  color: var(--hp-green);\n}\n\n#hp-sudoku-container .hp-link-btn.secondary,\n#hp-wordrow-container .hp-link-btn.secondary,\n#hp-wordflower-container .hp-link-btn.secondary,\n#hp-cryptogram-container .hp-link-btn.secondary,\n#hp-wordsearch-container .hp-link-btn.secondary,\n#hp-kriss-kross-platform-container .hp-link-btn.secondary,\n#hp-wordscramble-container .hp-link-btn.secondary,\n#hp-wordscramble-container .hp-link-btn.primary-outline {\n  border-color: var(--hp-blue);\n  color: var(--hp-blue);\n}\n\n#hp-sudoku-container .hp-link-btn.neutral,\n#hp-wordrow-container .hp-link-btn.neutral,\n#hp-wordflower-container .hp-link-btn.neutral,\n#hp-cryptogram-container .hp-link-btn.neutral,\n#hp-wordsearch-container .hp-link-btn.neutral,\n#hp-kriss-kross-platform-container .hp-link-btn.neutral,\n#hp-wordscramble-container .hp-link-btn.neutral {\n  border-color: #ddd;\n  color: #333;\n}\n\n#hp-sudoku-container .hp-link-btn.danger,\n#hp-wordrow-container .hp-link-btn.danger,\n#hp-wordflower-container .hp-link-btn.danger,\n#hp-cryptogram-container .hp-link-btn.danger,\n#hp-wordsearch-container .hp-link-btn.danger,\n#hp-kriss-kross-platform-container .hp-link-btn.danger,\n#hp-wordscramble-container .hp-link-btn.danger {\n  border-color: var(--hp-red);\n  color: var(--hp-red);\n}\n\n#hp-sudoku-container .hp-link-btn.full,\n#hp-wordrow-container .hp-link-btn.full,\n#hp-wordflower-container .hp-link-btn.full,\n#hp-cryptogram-container .hp-link-btn.full,\n#hp-wordsearch-container .hp-link-btn.full,\n#hp-kriss-kross-platform-container .hp-link-btn.full,\n#hp-wordscramble-container .hp-link-btn.full {\n  grid-column: 1 / -1;\n}\n\n#hp-sudoku-container .hp-modal small,\n#hp-wordrow-container .hp-modal small,\n#hp-wordflower-container .hp-modal small,\n#hp-cryptogram-container .hp-modal small,\n#hp-wordsearch-container .hp-modal small,\n#hp-kriss-kross-platform-container .hp-modal small,\n#hp-wordscramble-container .hp-modal small {\n  display: block;\n  margin-top: 10px;\n  color: #777;\n  font-size: 12px;\n}\n\n/* =========================================================\n   UNIVERSAL PUZZLE TOOLBARS / HELP MODALS\n   Future shared system used by newer puzzle engines.\n   Currently used by Kriss Kross only.\n   Safe to add now because existing puzzles do not yet\n   use these class names.\n   ========================================================= */\n\n/* =========================================================\n   DESKTOP TOOLBAR\n   ========================================================= */\n\n#hp-sudoku-container .hp-puzzle-tools,\n#hp-wordrow-container .hp-puzzle-tools,\n#hp-wordflower-container .hp-puzzle-tools,\n#hp-cryptogram-container .hp-puzzle-tools,\n#hp-wordsearch-container .hp-puzzle-tools,\n#hp-kriss-kross-platform-container .hp-puzzle-tools,\n#hp-wordscramble-container .hp-puzzle-tools {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 8px;\n  width: 100%;\n  margin: 0 0 14px;\n  align-items: stretch;\n}\n\n/* =========================================================\n   MOBILE TOOLBAR\n   ========================================================= */\n\n#hp-sudoku-container .hp-puzzle-mobile-tools,\n#hp-wordrow-container .hp-puzzle-mobile-tools,\n#hp-wordflower-container .hp-puzzle-mobile-tools,\n#hp-cryptogram-container .hp-puzzle-mobile-tools,\n#hp-wordsearch-container .hp-puzzle-mobile-tools,\n#hp-kriss-kross-platform-container .hp-puzzle-mobile-tools,\n#hp-wordscramble-container .hp-puzzle-mobile-tools {\n  display: none;\n}\n\n/* =========================================================\n   TOOL BUTTONS\n   ========================================================= */\n\n#hp-sudoku-container .hp-tool-btn,\n#hp-wordrow-container .hp-tool-btn,\n#hp-wordflower-container .hp-tool-btn,\n#hp-cryptogram-container .hp-tool-btn,\n#hp-wordsearch-container .hp-tool-btn,\n#hp-kriss-kross-platform-container .hp-tool-btn,\n#hp-wordscramble-container .hp-tool-btn {\n  appearance: none;\n  -webkit-appearance: none;\n  width: 100%;\n  min-height: 42px;\n  padding: 8px 6px;\n  border-radius: 12px;\n  border: 1px solid var(--hp-soft-border);\n  background: #fff;\n  color: var(--hp-dark);\n  font-size: 0.78rem;\n  font-weight: 800;\n  line-height: 1.05;\n  text-align: center;\n  cursor: pointer;\n  transition:\n    transform 0.08s ease,\n    background 0.18s ease,\n    border-color 0.18s ease,\n    color 0.18s ease;\n}\n\n#hp-sudoku-container .hp-tool-btn:hover,\n#hp-wordrow-container .hp-tool-btn:hover,\n#hp-wordflower-container .hp-tool-btn:hover,\n#hp-cryptogram-container .hp-tool-btn:hover,\n#hp-wordsearch-container .hp-tool-btn:hover,\n#hp-kriss-kross-platform-container .hp-tool-btn:hover,\n#hp-wordscramble-container .hp-tool-btn:hover {\n  transform: translateY(-1px);\n}\n\n#hp-sudoku-container .hp-tool-btn:active,\n#hp-wordrow-container .hp-tool-btn:active,\n#hp-wordflower-container .hp-tool-btn:active,\n#hp-cryptogram-container .hp-tool-btn:active,\n#hp-wordsearch-container .hp-tool-btn:active,\n#hp-kriss-kross-platform-container .hp-tool-btn:active,\n#hp-wordscramble-container .hp-tool-btn:active {\n  transform: translateY(0);\n}\n\n/* =========================================================\n   HELP BUTTON\n   ========================================================= */\n\n#hp-sudoku-container .hp-tool-btn.help-info,\n#hp-wordrow-container .hp-tool-btn.help-info,\n#hp-wordflower-container .hp-tool-btn.help-info,\n#hp-cryptogram-container .hp-tool-btn.help-info,\n#hp-wordsearch-container .hp-tool-btn.help-info,\n#hp-kriss-kross-platform-container .hp-tool-btn.help-info,\n#hp-wordscramble-container .hp-tool-btn.help-info {\n  background: #f3f8ff;\n  border-color: #bfd8ef;\n  color: var(--hp-blue);\n}\n\n/* =========================================================\n   HINT TOGGLE\n   ========================================================= */\n\n#hp-sudoku-container .hp-tool-btn.hint-toggle,\n#hp-wordrow-container .hp-tool-btn.hint-toggle,\n#hp-wordflower-container .hp-tool-btn.hint-toggle,\n#hp-cryptogram-container .hp-tool-btn.hint-toggle,\n#hp-wordsearch-container .hp-tool-btn.hint-toggle,\n#hp-kriss-kross-platform-container .hp-tool-btn.hint-toggle,\n#hp-wordscramble-container .hp-tool-btn.hint-toggle {\n  background: #e8f7ee;\n  border-color: var(--hp-green);\n  color: var(--hp-green);\n}\n\n#hp-sudoku-container .hp-tool-btn.hint-toggle.active,\n#hp-wordrow-container .hp-tool-btn.hint-toggle.active,\n#hp-wordflower-container .hp-tool-btn.hint-toggle.active,\n#hp-cryptogram-container .hp-tool-btn.hint-toggle.active,\n#hp-wordsearch-container .hp-tool-btn.hint-toggle.active,\n#hp-kriss-kross-platform-container .hp-tool-btn.hint-toggle.active,\n#hp-wordscramble-container .hp-tool-btn.hint-toggle.active {\n  background: var(--hp-green);\n  border-color: var(--hp-green);\n  color: #fff;\n}\n\n/* =========================================================\n   CLEAR BUTTON\n   ========================================================= */\n\n#hp-sudoku-container .hp-tool-btn.clear-tool,\n#hp-wordrow-container .hp-tool-btn.clear-tool,\n#hp-wordflower-container .hp-tool-btn.clear-tool,\n#hp-cryptogram-container .hp-tool-btn.clear-tool,\n#hp-wordsearch-container .hp-tool-btn.clear-tool,\n#hp-kriss-kross-platform-container .hp-tool-btn.clear-tool,\n#hp-wordscramble-container .hp-tool-btn.clear-tool {\n  background: #fafafa;\n  border-color: #d9d9d9;\n  color: #444;\n}\n\n/* =========================================================\n   RESET / DANGER\n   ========================================================= */\n\n#hp-sudoku-container .hp-tool-btn.danger,\n#hp-wordrow-container .hp-tool-btn.danger,\n#hp-wordflower-container .hp-tool-btn.danger,\n#hp-cryptogram-container .hp-tool-btn.danger,\n#hp-wordsearch-container .hp-tool-btn.danger,\n#hp-kriss-kross-platform-container .hp-tool-btn.danger,\n#hp-wordscramble-container .hp-tool-btn.danger {\n  color: var(--hp-red);\n  border-color: rgba(237,27,36,.4);\n}\n\n/* =========================================================\n   REVEAL\n   ========================================================= */\n\n#hp-sudoku-container .hp-tool-btn.reveal,\n#hp-wordrow-container .hp-tool-btn.reveal,\n#hp-wordflower-container .hp-tool-btn.reveal,\n#hp-cryptogram-container .hp-tool-btn.reveal,\n#hp-wordsearch-container .hp-tool-btn.reveal,\n#hp-kriss-kross-platform-container .hp-tool-btn.reveal,\n#hp-wordscramble-container .hp-tool-btn.reveal {\n  color: var(--hp-blue);\n  border-color: rgba(16,127,187,.4);\n}\n\n/* =========================================================\n   HELP MODAL CONTENT\n   ========================================================= */\n\n#hp-sudoku-container .hp-help-modal-content,\n#hp-wordrow-container .hp-help-modal-content,\n#hp-wordflower-container .hp-help-modal-content,\n#hp-cryptogram-container .hp-help-modal-content,\n#hp-wordsearch-container .hp-help-modal-content,\n#hp-kriss-kross-platform-container .hp-help-modal-content,\n#hp-wordscramble-container .hp-help-modal-content {\n  margin: 0 0 18px;\n  padding: 16px 18px;\n  border: 1px solid var(--hp-soft-border);\n  border-radius: 16px;\n  background: var(--hp-soft-blue);\n  text-align: left;\n}\n\n#hp-sudoku-container .hp-help-line,\n#hp-wordrow-container .hp-help-line,\n#hp-wordflower-container .hp-help-line,\n#hp-cryptogram-container .hp-help-line,\n#hp-wordsearch-container .hp-help-line,\n#hp-kriss-kross-platform-container .hp-help-line,\n#hp-wordscramble-container .hp-help-line {\n  display: block;\n  margin: 0 0 12px;\n  color: var(--hp-muted);\n  font-size: 0.95rem;\n  line-height: 1.45;\n  font-weight: 600;\n}\n\n#hp-sudoku-container .hp-help-line:last-child,\n#hp-wordrow-container .hp-help-line:last-child,\n#hp-wordflower-container .hp-help-line:last-child,\n#hp-cryptogram-container .hp-help-line:last-child,\n#hp-wordsearch-container .hp-help-line:last-child,\n#hp-kriss-kross-platform-container .hp-help-line:last-child,\n#hp-wordscramble-container .hp-help-line:last-child {\n  margin-bottom: 0;\n}\n\n#hp-sudoku-container .hp-help-modal-content strong,\n#hp-wordrow-container .hp-help-modal-content strong,\n#hp-wordflower-container .hp-help-modal-content strong,\n#hp-cryptogram-container .hp-help-modal-content strong,\n#hp-wordsearch-container .hp-help-modal-content strong,\n#hp-kriss-kross-platform-container .hp-help-modal-content strong,\n#hp-wordscramble-container .hp-help-modal-content strong {\n  color: var(--hp-dark);\n  font-weight: 900;\n}\n\n/* =========================================================\n   MOBILE TOOLBAR RESPONSIVE\n   ========================================================= */\n\n@media (max-width: 980px) {\n\n  #hp-sudoku-container .hp-puzzle-tools,\n  #hp-wordrow-container .hp-puzzle-tools,\n  #hp-wordflower-container .hp-puzzle-tools,\n  #hp-cryptogram-container .hp-puzzle-tools,\n  #hp-wordsearch-container .hp-puzzle-tools,\n  #hp-kriss-kross-platform-container .hp-puzzle-tools,\n  #hp-wordscramble-container .hp-puzzle-tools {\n    display: none;\n  }\n\n  #hp-sudoku-container .hp-puzzle-mobile-tools,\n  #hp-wordrow-container .hp-puzzle-mobile-tools,\n  #hp-wordflower-container .hp-puzzle-mobile-tools,\n  #hp-cryptogram-container .hp-puzzle-mobile-tools,\n  #hp-wordsearch-container .hp-puzzle-mobile-tools,\n  #hp-kriss-kross-platform-container .hp-puzzle-mobile-tools,\n  #hp-wordscramble-container .hp-puzzle-mobile-tools {\n    display: grid;\n    grid-template-columns: repeat(5, minmax(0, 1fr));\n    gap: 6px;\n    margin: 10px 0 0;\n  }\n\n  #hp-sudoku-container .hp-tool-btn,\n  #hp-wordrow-container .hp-tool-btn,\n  #hp-wordflower-container .hp-tool-btn,\n  #hp-cryptogram-container .hp-tool-btn,\n  #hp-wordsearch-container .hp-tool-btn,\n  #hp-kriss-kross-platform-container .hp-tool-btn,\n  #hp-wordscramble-container .hp-tool-btn {\n    min-height: 36px;\n    padding: 7px 5px;\n    border-radius: 999px;\n    font-size: 0.72rem;\n  }\n}\n\n@media (max-width: 560px) {\n\n  #hp-sudoku-container .hp-puzzle-mobile-tools,\n  #hp-wordrow-container .hp-puzzle-mobile-tools,\n  #hp-wordflower-container .hp-puzzle-mobile-tools,\n  #hp-cryptogram-container .hp-puzzle-mobile-tools,\n  #hp-wordsearch-container .hp-puzzle-mobile-tools,\n  #hp-kriss-kross-platform-container .hp-puzzle-mobile-tools,\n  #hp-wordscramble-container .hp-puzzle-mobile-tools {\n    gap: 5px;\n  }\n\n  #hp-sudoku-container .hp-tool-btn,\n  #hp-wordrow-container .hp-tool-btn,\n  #hp-wordflower-container .hp-tool-btn,\n  #hp-cryptogram-container .hp-tool-btn,\n  #hp-wordsearch-container .hp-tool-btn,\n  #hp-kriss-kross-platform-container .hp-tool-btn,\n  #hp-wordscramble-container .hp-tool-btn {\n    min-height: 34px;\n    padding: 6px 3px;\n    font-size: 0.66rem;\n  }\n}\n\n/* =========================================================\n   SHARED MOBILE FOUNDATION\n   ========================================================= */\n\n@media (max-width: 700px) {\n  #hp-sudoku-container .hp-modal-actions,\n  #hp-wordrow-container .hp-modal-actions,\n  #hp-wordflower-container .hp-modal-actions,\n  #hp-cryptogram-container .hp-modal-actions,\n  #hp-wordsearch-container .hp-modal-actions,\n  #hp-kriss-kross-platform-container .hp-modal-actions,\n  #hp-wordscramble-container .hp-modal-actions {\n    grid-template-columns: 1fr;\n  }\n\n  #hp-sudoku-container .hp-link-btn.full,\n  #hp-wordrow-container .hp-link-btn.full,\n  #hp-wordflower-container .hp-link-btn.full,\n  #hp-cryptogram-container .hp-link-btn.full,\n  #hp-wordsearch-container .hp-link-btn.full,\n  #hp-kriss-kross-platform-container .hp-link-btn.full,\n  #hp-wordscramble-container .hp-link-btn.full {\n    grid-column: auto;\n  }\n}\n\n/* =========================================================\n   HARE PUBLISHING KRISS KROSS CSS\n   Requires shared puzzle foundation above this section.\n   Updated: 2026-05-19\n   Version: v6.2 - responsive word scaling improved\n   ========================================================= */\n\n/* =========================================================\n   MAIN LAYOUT\n   ========================================================= */\n\n#hp-kriss-kross-platform-container {\n  width: 100%;\n  max-width: 1260px;\n  margin: 0 auto;\n  font-family: sans-serif;\n  color: #333;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-layout {\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  gap: 18px;\n  justify-content: center;\n  align-items: stretch;\n  width: 100%;\n  margin: 0 auto;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-col-left {\n  flex: 1 1 0;\n  min-width: 0;\n  max-width: none;\n  display: flex;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-col-right {\n  flex: 0 0 360px;\n  width: 360px;\n  min-width: 360px;\n  max-width: 360px;\n  display: flex;\n  flex-direction: column;\n  align-self: stretch;\n  min-height: 0;\n}\n\n/* =========================================================\n   PANELS\n   ========================================================= */\n\n#hp-kriss-kross-platform-container .hp-kk-panel {\n  padding: 16px;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-col-left .hp-kk-panel,\n#hp-kriss-kross-platform-container .hp-kk-col-right .hp-kk-panel {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  width: 100%;\n  min-height: 0;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-col-right .hp-kk-panel {\n  margin-top: 0;\n}\n\n/* =========================================================\n   STATS / PROGRESS / STATUS\n   ========================================================= */\n\n#hp-kriss-kross-platform-container .hp-kk-status {\n  margin-bottom: 12px;\n}\n\n/* =========================================================\n   BOARD AREA\n   Clean platform-rendered crossword-style grid\n   ========================================================= */\n\n#hp-kriss-kross-platform-container .hp-kk-board-wrap {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  flex: 0 0 auto;\n  width: 100%;\n  overflow: visible;\n  margin: 0 0 12px;\n  padding: 14px 6px 10px;\n  background: #ffffff;\n  border: 0;\n  border-radius: 0;\n  box-shadow: none;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-board {\n  --hp-kk-cell-size: clamp(25px, 2.15vw, 31px);\n\n  display: inline-grid;\n  gap: 0;\n  width: auto;\n  max-width: 100%;\n  margin: 0 auto;\n  user-select: none;\n  touch-action: manipulation;\n  background: #a9bbd4;\n  padding: 0;\n  border: 1px solid #a9bbd4;\n  border-radius: 18px;\n  overflow: hidden;\n  box-shadow: 0 10px 26px rgba(71,102,149,.10);\n}\n\n#hp-kriss-kross-platform-container .hp-kk-cell,\n#hp-kriss-kross-platform-container .hp-kk-block {\n  width: var(--hp-kk-cell-size);\n  height: var(--hp-kk-cell-size);\n  min-width: var(--hp-kk-cell-size);\n  min-height: var(--hp-kk-cell-size);\n  padding: 0;\n  margin: 0;\n  line-height: 1;\n  border-radius: 0;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-block {\n  display: block;\n  visibility: visible;\n  opacity: 1;\n  background: #eaf2fb;\n  border: 1px solid #d5e2f1;\n  pointer-events: none;\n  box-shadow: none;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-cell {\n  appearance: none;\n  -webkit-appearance: none;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border: 1px solid #a9bbd4;\n  background: #ffffff;\n  color: #16324a;\n  font-size: clamp(0.76rem, 1.03vw, 0.96rem);\n  font-weight: 800;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background .16s ease, box-shadow .16s ease, color .16s ease, border-color .16s ease;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-cell:hover {\n  background: #f4f9ff;\n  border-color: #8ea7c8;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-cell.is-filled,\n#hp-kriss-kross-platform-container .hp-kk-cell.is-correct,\n#hp-kriss-kross-platform-container .hp-kk-cell.is-revealed {\n  background: #ffffff;\n  color: #16324a;\n  border-color: #a9bbd4;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-cell.is-selected {\n  background: #dbeaf8;\n  color: #16324a;\n  border-color: #7fa0c7;\n  box-shadow: inset 0 0 0 2px rgba(71,102,149,.26);\n}\n\n#hp-kriss-kross-platform-container .hp-kk-cell.is-selected.is-slot-start {\n  background: #c9dff4;\n  color: #12324c;\n  border-color: #6d90ba;\n  box-shadow: inset 0 0 0 2px rgba(71,102,149,.36);\n}\n\n/* =========================================================\n   TOGGLE MARKER\n   ========================================================= */\n\n#hp-kriss-kross-platform-container .hp-kk-cell.is-toggle-cell {\n  position: relative;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-cell.is-toggle-cell::after {\n  content: \"\";\n  position: absolute;\n  right: 3px;\n  top: 3px;\n  width: 4px;\n  height: 4px;\n  border-radius: 999px;\n  background: rgba(71,102,149,.35);\n}\n\n#hp-kriss-kross-platform-container .hp-kk-cell.is-selected.is-toggle-cell::after,\n#hp-kriss-kross-platform-container .hp-kk-cell.is-selected.is-slot-start.is-toggle-cell::after {\n  background: rgba(71,102,149,.45);\n}\n\n/* =========================================================\n   BOTTOM ACTION BUTTONS\n   ========================================================= */\n\n#hp-kriss-kross-platform-container .hp-kk-actions {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 10px;\n  margin-top: auto;\n  padding-top: 12px;\n  align-items: stretch;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-btn {\n  appearance: none;\n  -webkit-appearance: none;\n  min-height: 44px;\n  padding: 12px;\n  border-radius: 12px;\n  border: 1px solid #ddd;\n  background: #fff;\n  color: #333;\n  text-decoration: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  text-align: center;\n  font-size: 14px;\n  font-weight: 800;\n  line-height: 1.05;\n  cursor: pointer;\n  transition: transform 0.08s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-btn:hover {\n  transform: translateY(-1px);\n}\n\n#hp-kriss-kross-platform-container .hp-kk-btn:active {\n  transform: translateY(0);\n}\n\n#hp-kriss-kross-platform-container .hp-kk-btn.reveal {\n  color: #107FBB;\n  border-color: rgba(16,127,187,.4);\n}\n\n#hp-kriss-kross-platform-container .hp-kk-btn.danger {\n  color: #ED1B24;\n  border-color: rgba(237,27,36,.4);\n}\n\n/* =========================================================\n   WORD LIST\n   ========================================================= */\n\n#hp-kriss-kross-platform-container .hp-kk-words-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n  margin: 0 0 12px;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-words-header h3 {\n  margin: 0;\n  font-size: 1rem;\n  line-height: 1.2;\n  color: #24323d;\n  font-weight: 900;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-pill {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 6px 10px;\n  border-radius: 999px;\n  border: 1px solid #dceaf6;\n  background: #f7fbff;\n  color: #107FBB;\n  font-size: 0.74rem;\n  font-weight: 800;\n  white-space: nowrap;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-word-list {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 7px 8px;\n  align-content: start;\n  flex: 0 0 auto;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-word-item {\n  appearance: none;\n  -webkit-appearance: none;\n  width: 100%;\n  min-width: 0;\n  border-radius: 11px;\n  border: 1px solid #e6edf3;\n  background: #fff;\n  color: #24323d;\n  padding: 7px 6px;\n  min-height: 34px;\n  text-align: center;\n  font-size: clamp(0.6rem, 0.92vw, 0.74rem);\n  font-weight: 800;\n  line-height: 1.05;\n  letter-spacing: 0;\n  cursor: pointer;\n  white-space: nowrap;\n  overflow: visible;\n  text-overflow: clip;\n  transition: transform .12s ease, box-shadow .12s ease, background .2s ease, border-color .2s ease;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-word-item:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 10px 24px rgba(0,0,0,.06);\n}\n\n#hp-kriss-kross-platform-container .hp-kk-word-item.is-match {\n  background: #f3f8ff;\n  border-color: #bfd8ef;\n  color: #107FBB;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-word-item.is-used {\n  background: #fffaf1;\n  border-color: #f6dfb1;\n  color: #b87800;\n}\n\n#hp-kriss-kross-platform-container .hp-kk-word-item.is-found {\n  background: #eefaf1;\n  border-color: #bfe5ca;\n  color: #0e7a3c;\n}\n\n/* =========================================================\n   DESKTOP HEIGHT ALIGNMENT\n   ========================================================= */\n\n@media (min-width: 981px) {\n  #hp-kriss-kross-platform-container .hp-kk-layout {\n    align-items: stretch;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-col-left .hp-kk-panel {\n    min-height: 720px;\n  }\n}\n\n/* =========================================================\n   RESPONSIVE\n   ========================================================= */\n\n@media (max-width: 980px) {\n  #hp-kriss-kross-platform-container {\n    max-width: 760px;\n    width: 100%;\n    margin: 0 auto;\n    overflow-x: hidden;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-layout {\n    flex-direction: column;\n    flex-wrap: nowrap;\n    align-items: stretch;\n    justify-content: flex-start;\n    gap: 14px;\n    width: 100%;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-col-left,\n  #hp-kriss-kross-platform-container .hp-kk-col-right {\n    flex: 1 1 auto;\n    width: 100%;\n    min-width: 0;\n    max-width: 100%;\n    display: flex;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-col-left {\n    order: 1;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-col-right {\n    order: 2;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-panel {\n    padding: 14px;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-board {\n    --hp-kk-cell-size: clamp(21px, calc((100vw - 46px) / 16), 31px);\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-col-left .hp-kk-panel {\n    min-height: auto;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-actions {\n    display: none;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-word-list {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n    gap: 7px;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-word-item {\n    min-height: 38px;\n    padding: 6px 7px;\n    font-size: clamp(0.62rem, 2.5vw, 0.9rem);\n    line-height: 1.05;\n  }\n}\n\n@media (max-width: 700px) {\n  #hp-kriss-kross-platform-container .hp-kk-board {\n    --hp-kk-cell-size: clamp(19px, calc((100vw - 34px) / 16), 28px);\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-board-wrap {\n    padding: 12px 0 10px;\n  }\n}\n\n@media (max-width: 560px) {\n  #hp-kriss-kross-platform-container .hp-kk-panel {\n    padding: 12px;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-board {\n    --hp-kk-cell-size: clamp(18px, calc((100vw - 30px) / 16), 25px);\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-words-header h3 {\n    font-size: 0.95rem;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-word-list {\n    gap: 6px;\n  }\n\n  #hp-kriss-kross-platform-container .hp-kk-word-item {\n    min-height: 36px;\n    padding: 6px;\n    font-size: clamp(0.58rem, 2.7vw, 0.82rem);\n    line-height: 1.02;\n    border-radius: 10px;\n  }\n}";

  function injectCopiedProductionCss() {
    /*
      Replace our own Kriss Kross platform stylesheet instead of stacking CSS.
      This platform build uses its own container namespace so live production CSS
      for #hp-krisskross-container cannot affect the platform grid. This removes
      only platform-owned Kriss Kross style nodes, then inserts one fresh stylesheet.
    */
    [
      "hp-kriss-kross-platform-copied-production-css",
      "hp-kriss-kross-platform-css-v1-8"
    ].forEach(id => {
      const existing = document.getElementById(id);
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    });

    const style = document.createElement("style");
    style.id = "hp-kriss-kross-platform-css-v1-8";
    style.setAttribute("data-hp-kk-platform-version", VERSION);
    style.textContent = COPIED_PRODUCTION_CSS;
    document.head.appendChild(style);
  }



  function openHelp(containerId = "hp-kriss-kross-platform-container") {
    const container = document.getElementById(containerId);
    const btn = container?.querySelector('[data-a="open-help-modal"]');
    if (btn) btn.click();
  }

  return {
    VERSION,
    statusAdapter: krissKrossStatusAdapter,
    openHelp,
    init({ containerId = "hp-kriss-kross-platform-container", dataObject } = {}) {
    const BRAND_RED = "#ED1B24";
    const BRAND_PRIMARY = "#476695";

    const container = document.getElementById(containerId);
    if (!container) return;

    container.classList.add("hp-kk-platform-v17");
    injectCopiedProductionCss();

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
    // SCHEMA
    // =========================================================

    (() => {
      const existing = document.getElementById("hp-kk-schema");
      if (existing) existing.remove();

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": puzzleTitle,
        "description": `Play and solve ${puzzleTitle} by Hare Publishing. Fit all of the words into the crossing grid, save your progress automatically, and reveal the answers whenever you like.`,
        "genre": "Word Puzzle",
        "url": window.location.href,
        "inLanguage": "en",
        "audience": {
          "@type": "PeopleAudience",
          "suggestedMinAge": "8"
        },
        "numberOfPlayers": "1",
        "copyrightYear": String(new Date().getFullYear()),
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://www.harepublishing.com/"
        }
      };

      const script = document.createElement("script");
      script.id = "hp-kk-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    })();
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
        overlaySeen: false,
        startedAt: "",
        updatedAt: "",
        lastPlayedAt: ""
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

    function saveState() {
      try {
        state.updatedAt = new Date().toISOString();
        state.lastPlayedAt = state.updatedAt;
        if (!state.startedAt && Object.values(state.assignments || {}).some(Boolean)) state.startedAt = state.updatedAt;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {}

      if (Core && typeof Core.emitStateChange === "function") {
        Core.emitStateChange({
          puzzleType: "kriss-kross",
          puzzleId,
          storageKey: STORAGE_KEY,
          state: { ...state }
        });
      }

      try {
        window.dispatchEvent(new CustomEvent("hare-kriss-kross-progress", { detail: { puzzleId, storageKey: STORAGE_KEY, state: { ...state } } }));
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

      boardEl.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`;

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

      if (pillEl) pillEl.textContent = `${placedCount()} placed`;

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
        ${puzzleDate ? `
          <div class="hp-puzzle-date">
            ${escapeHtml(puzzleDate)}
          </div>
        ` : ""}

        <div class="hp-kk-layout">
          <div class="hp-kk-col-left">
            <div class="hp-kk-panel">

              <div class="hp-kk-stats">
                <div class="hp-kk-stat">
                  <span class="hp-kk-stat-value" id="hp-kk-correct-ratio">0/0</span>
                  <span class="hp-kk-stat-label">Correct</span>
                </div>

                <div class="hp-kk-stat">
                  <span class="hp-kk-stat-value" id="hp-kk-left">0</span>
                  <span class="hp-kk-stat-label">Left</span>

                </div>

                <div class="hp-kk-stat">
                  <span class="hp-kk-stat-value" id="hp-kk-size">0×0</span>
                  <span class="hp-kk-stat-label">Grid Size</span>
                </div>
              </div>

              <div class="hp-kk-progress">
                <div class="hp-kk-progress-fill" id="hp-kk-progress-fill"></div>
              </div>

              <div class="hp-kk-status">
                <span class="hp-kk-status-msg" id="hp-kk-status-msg">Click a slot in the grid, then click a matching word from the list.</span>
              </div>

              <div class="hp-kk-board-wrap">
                <div class="hp-kk-board" id="hp-kk-board" aria-label="Kriss Kross puzzle board"></div>
              </div>

              <div class="hp-puzzle-mobile-tools" aria-label="Kriss Kross puzzle controls">
                <button type="button" class="hp-tool-btn help-info" data-a="open-help-modal">Help</button>
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
                <button type="button" class="hp-tool-btn help-info" data-a="open-help-modal">Help</button>
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
                <span class="hp-kk-pill" id="hp-kk-pill">0 placed</span>
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
              <span class="hp-help-line">Click a <strong>slot in the grid</strong>, then click a matching word from the list.</span>
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
  }

  };
})();

window.HareKrissKrossEngine = window.HareKrissKrossPlatformEngine;

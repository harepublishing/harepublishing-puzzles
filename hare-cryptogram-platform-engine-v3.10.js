/* HARE PUBLISHING CRYPTOGRAM PLATFORM ENGINE v3.9
   Update: hides blank author button with natural reflow and adds optional Riddle/Trivia answer reveal buttons. */
window.HareCryptogramEngine = {
	  init({ containerId = "hp-cryptogram-container", dataObject } = {}) {
	    const container = document.getElementById(containerId);
	    if (!container) return;

	    if (container.dataset.hpCryptogramMounted === "true") return;
	    container.dataset.hpCryptogramMounted = "true";

	    if (container.__hareCryptogramHandlers) {
	      container.removeEventListener("click", container.__hareCryptogramHandlers.click);
	      container.removeEventListener("keydown", container.__hareCryptogramHandlers.keydown);
	      container.__hareCryptogramHandlers = null;
	    }

	    if (container.__hareCryptogramResizeHandler) {
	      window.removeEventListener("resize", container.__hareCryptogramResizeHandler);
	      container.__hareCryptogramResizeHandler = null;
	    }

    const mount = container.querySelector(".hp-mount") || container;
    const yearEl = container.querySelector("#hp-year") || document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const Core = window.HarePuzzleCore;
    if (!Core) {
      mount.innerHTML = `<div class="hp-crypto-error"><strong>Configuration Error: HarePuzzleCore must be loaded before the Cryptogram engine.</strong></div>`;
      return;
    }

    const CRYPTOGRAM_STORAGE_PREFIX = "hp2_cg_";

    const cryptogramStatusAdapter = {
      isSolved(saved) {
        return Boolean(saved && !this.isRevealed(saved) && (
          saved.solved ||
          saved.completed ||
          saved.isSolved ||
          saved.status === "solved" ||
          saved.status === "complete" ||
          saved.completedAt ||
          saved.solvedAt
        ));
      },

      isRevealed(saved) {
        return Boolean(saved && (saved.revealed || saved.revealedAt));
      },

      isFinished(saved) {
        return Boolean(saved && (
          saved.solved ||
          saved.revealed ||
          saved.completed ||
          saved.isSolved ||
          saved.status === "solved" ||
          saved.status === "complete" ||
          saved.completedAt ||
          saved.solvedAt ||
          saved.revealedAt
        ));
      },

      hasProgress(saved) {
        return Boolean(
          saved &&
          saved.mappings &&
          Object.keys(saved.mappings).length > 0 &&
          !this.isFinished(saved)
        );
      },

      finishedDate(saved) {
        if (!saved) return null;
        return saved.completedAt || saved.solvedAt || saved.revealedAt || saved.finishedAt || saved.updatedAt || saved.lastPlayedAt || null;
      }
    };

    const data = dataObject || window.HareCryptogramData;
    if (!data) {
      mount.innerHTML = errorCard("Configuration Error: Cryptogram puzzle data is missing.");
      return;
    }

    const puzzleId = String(data.puzzleId || "1");
    const puzzleTitle = data.puzzleTitle || `Cryptogram Puzzle #${puzzleId}`;
    const puzzleText = String(data.puzzleText || data.cipherText || "");
    const solutionText = String(data.solutionText || data.solution || "");
    const hints = Array.isArray(data.hints) ? data.hints : [];
    const puzzleAnswer = String(data.answer || "").trim();
    const puzzleKind = titleCase(data.type || data.puzzleType || "");
    const answerButtonLabel = resolveAnswerButtonLabel();
    const puzzleHint = resolvePuzzleHint();
    const MORE_PUZZLES_URL = data.morePuzzlesUrl || "/puzzlers-hub";
    const SHOP_URL = data.shopUrl || "https://www.harepublishing.com/shop";
	    const ARCHIVE_URL = data.archiveUrl || "https://www.harepublishing.com/cryptogram-library";
	    const STORAGE_KEY = data.storageKey || Core.makeStorageKey(CRYPTOGRAM_STORAGE_PREFIX, puzzleId);

    if (!puzzleText || !solutionText) {
      mount.innerHTML = errorCard("Configuration Error: puzzleText and solutionText are required.");
      return;
    }

    let overlayOpenedThisPageLoad = false;
    let recommendation = null;

    injectMaterialSymbols();
    injectStyles();
    injectSchema();

    function injectMaterialSymbols() {
      if (document.getElementById("hp-material-symbols-font")) return;
      const link = document.createElement("link");
      link.id = "hp-material-symbols-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined";
      document.head.appendChild(link);
    }

    function injectSchema() {
      const schemaId = "hp-schema-cryptogram-platform";
      const existing = document.getElementById(schemaId);
      if (existing) existing.remove();

      const pageUrl = window.location.href;
      const accessConfig = window.HareCryptogramAccessConfig || {};
      const collectionPath = accessConfig.publicPlayUrl || "/cryptogram";
      const collectionUrl = new URL(collectionPath, window.location.origin).toString();
      const puzzleDate = String(data.puzzleDate || "").trim();
      const nowYear = new Date().getFullYear();

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "@id": `${pageUrl}#puzzle`,
        "name": puzzleTitle,
        "description": `Play ${puzzleTitle} online from Hare Publishing. Decode the quote, save your progress, and reveal the answer when you need it.`,
        "url": pageUrl,
        "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
        "genre": "Puzzle",
        "inLanguage": "en",
        "datePublished": puzzleDate || undefined,
        "copyrightYear": String(nowYear),
        "keywords": ["Cryptogram", "word puzzle", "quote puzzle", "daily puzzle", "online puzzle", "Hare Publishing"],
        "audience": {
          "@type": "PeopleAudience",
          "suggestedMinAge": "8"
        },
        "numberOfPlayers": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 1
        },
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://www.harepublishing.com/"
        },
        "isPartOf": {
          "@type": "CollectionPage",
          "name": "Cryptogram",
          "url": collectionUrl
        }
      };

      Object.keys(schemaData).forEach(key => {
        if (schemaData[key] === undefined || schemaData[key] === "") delete schemaData[key];
      });

      const script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }

    function errorCard(message) {
      return `<div class="hp-crypto-error"><strong>${escapeHtml(message)}</strong></div>`;
    }

    function upper(s) {
      return String(s || "").toUpperCase();
    }

    function isLetter(ch) {
      return /^[A-Z]$/.test(ch);
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[s]));
    }

    function titleCase(value) {
      return String(value || "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase());
    }

    function resolveAnswerButtonLabel() {
      if (!puzzleAnswer) return "";

      const normalizedType = String(data.type || "").trim().toLowerCase();

      if (normalizedType === "riddle") return "Show Riddle Answer";
      if (normalizedType === "trivia") return "Show Trivia Answer";

      return "";
    }

    function resolvePuzzleHint() {
      if (data.hint && typeof data.hint === "object" && data.hint.value) {
        const type = data.hint.type || "hint";
        return {
          type,
          label: data.hint.label || `${titleCase(type)} Hint`,
          value: String(data.hint.value)
        };
      }

      if (data.author) {
        return {
          type: "author",
          label: "Author Hint",
          value: String(data.author)
        };
      }

      const legacyAuthorHint = hints.find(h => h && h.type === "author" && h.value);
      if (legacyAuthorHint) {
        return {
          type: "author",
          label: legacyAuthorHint.label || "Author Hint",
          value: String(legacyAuthorHint.value)
        };
      }

      return null;
    }

    function injectStyles() {
      if (document.getElementById("hp-cryptogram-platform-engine-v3-styles")) return;

      const style = document.createElement("style");
      style.id = "hp-cryptogram-platform-engine-v3-styles";
      style.textContent = `
        #hp-cryptogram-container {
          --hp-cg-primary: #F7941C;
          --hp-cg-primary-light: #FFF4E6;
          --hp-cg-primary-soft: #FFE1B8;
          --hp-cg-primary-dark: #C86E00;
          --hp-cg-success: #00A54F;
          --hp-cg-error: #ED1B24;
          --hp-cg-blue: #0F7FBB;
          font-family: Roboto, Arial, sans-serif;
        }

        #hp-cryptogram-container * {
          box-sizing: border-box;
        }

        #hp-cryptogram-container .material-symbols-outlined {
          font-family: "Material Symbols Outlined";
          font-weight: normal;
          font-style: normal;
          font-size: 28px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: "liga";
          -webkit-font-smoothing: antialiased;
          font-variation-settings:
            'FILL' 1,
            'wght' 500,
            'GRAD' 0,
            'opsz' 24;
        }

        #hp-cryptogram-container .hp-crypto-error {
          padding: 20px;
          border: 1px solid var(--hp-cg-error);
          background: #fff5f5;
          color: #8a1c1c;
          border-radius: 14px;
          text-align: center;
        }

        #hp-cryptogram-container .hp-crypto-shell,
        #hp-cryptogram-container .hp-crypto-card {
          width: 100%;
          overflow: visible !important;
        }

        #hp-cryptogram-container .hp-crypto-card {
          position: relative;
          background: #fff;
          border: 1px solid #e9eef3;
          border-radius: 18px;
          padding: 26px 22px;
          box-shadow: 0 12px 36px rgba(0,0,0,.07);
        }

        #hp-cryptogram-container .hp-crypto-author-reveal {
          width: 100%;
          background: #f3fff9;
          border: 1px solid #bdeed4;
          color: #138c45;
          border-radius: 14px;
          padding: 12px 16px;
          text-align: center;
          font-weight: 900;
          margin: 8px auto 14px;
          max-width: 900px;
        }

        #hp-cryptogram-container .hp-crypto-status {
          width: 100%;
          max-width: 900px;
          margin: 10px auto 20px;
          padding: 10px 14px;
          border-radius: 12px;
          background: #f7f9fb;
          border: 1px solid #dde7ef;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #hp-cryptogram-container .hp-crypto-status-msg {
          display: block;
          width: 100%;
          font-size: 14px;
          font-weight: 900;
          color: #333;
          text-align: center;
        }

        #hp-cryptogram-container .hp-crypto-puzzle {
          --hp-cg-char-width: 28px;
          --hp-cg-letter-gap: 6px;
          --hp-cg-word-row-gap: 18px;
          --hp-cg-word-column-gap: 20px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: flex-end;
          gap: var(--hp-cg-word-row-gap) var(--hp-cg-word-column-gap);
          margin: 28px auto 30px;
          max-width: 900px;
          line-height: 1;
        }

        #hp-cryptogram-container .hp-crypto-puzzle.hp-crypto-fit-1 {
          --hp-cg-char-width: 26px;
          --hp-cg-letter-gap: 5px;
        }

        #hp-cryptogram-container .hp-crypto-puzzle.hp-crypto-fit-2 {
          --hp-cg-char-width: 24px;
          --hp-cg-letter-gap: 4px;
        }

        #hp-cryptogram-container .hp-crypto-puzzle.hp-crypto-fit-3 {
          --hp-cg-char-width: 23px;
          --hp-cg-letter-gap: 3px;
        }

        #hp-cryptogram-container .hp-crypto-word {
          display: inline-flex;
          gap: var(--hp-cg-letter-gap);
          white-space: nowrap;
          align-items: flex-end;
        }

        #hp-cryptogram-container .hp-crypto-space {
          width: 8px;
        }

        #hp-cryptogram-container .hp-crypto-char {
          width: var(--hp-cg-char-width);
          min-height: 52px;
          border: 0;
          background: transparent;
          padding: 0;
          cursor: pointer;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          font-family: inherit;
        }

        #hp-cryptogram-container .hp-crypto-top {
          min-height: 22px;
          display: block;
          font-size: 18px;
          line-height: 1;
          font-weight: 900;
          color: var(--hp-cg-blue);
          margin-bottom: 5px;
        }

        #hp-cryptogram-container .hp-crypto-bottom {
          display: block;
          width: 100%;
          border-top: 3px solid #333;
          padding-top: 6px;
          font-size: 16px;
          line-height: 1;
          font-weight: 900;
          color: #444;
        }

        #hp-cryptogram-container .hp-crypto-char.is-selected .hp-crypto-top,
        #hp-cryptogram-container .hp-crypto-char.is-selected .hp-crypto-bottom {
          color: var(--hp-cg-primary);
        }

        #hp-cryptogram-container .hp-crypto-char.is-selected .hp-crypto-bottom {
          border-top-color: var(--hp-cg-primary);
        }

        #hp-cryptogram-container .hp-crypto-char.is-correct .hp-crypto-top {
          color: var(--hp-cg-success);
        }

        #hp-cryptogram-container .hp-crypto-char.is-wrong .hp-crypto-top {
          color: var(--hp-cg-error);
        }

        #hp-cryptogram-container .hp-crypto-punc,
        #hp-cryptogram-container .hp-crypto-apostrophe {
          display: inline-flex;
          align-items: flex-end;
          justify-content: center;
          min-height: 52px;
          font-size: 22px;
          font-weight: 900;
          color: #333;
          padding: 0 1px 7px;
        }

        #hp-cryptogram-container .hp-crypto-word .hp-crypto-punc {
          margin-left: -1px;
          padding-left: 0;
          padding-right: 0;
        }

        #hp-cryptogram-container .hp-crypto-kb-wrap {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        #hp-cryptogram-container .hp-crypto-kb {
          display: grid !important;
          grid-template-columns: repeat(10, minmax(38px, 1fr)) !important;
          gap: 8px !important;
          margin: 0 auto 14px !important;
          padding: 2px !important;
          max-width: 900px !important;
        }

        #hp-cryptogram-container .hp-crypto-key,
        #hp-cryptogram-container .hp-crypto-function-key {
          border-radius: 12px;
          min-height: 46px;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
          transition: all .15s ease;
          font-family: inherit;
        }

        #hp-cryptogram-container .hp-crypto-key {
          border: 1px solid #ddd;
          background: #fff;
          color: #222;
        }

        #hp-cryptogram-container .hp-crypto-key:hover {
          border-color: var(--hp-cg-primary);
          background: var(--hp-cg-primary-light);
          color: var(--hp-cg-primary-dark);
        }

        #hp-cryptogram-container .hp-crypto-key.is-used {
          background: #edf6ff;
          border-color: #cfe3f8;
          color: #6e879d;
        }

        #hp-cryptogram-container .hp-crypto-function-key {
          border: 1px solid #b9d7ef;
          background: #edf6ff;
          color: var(--hp-cg-blue);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #hp-cryptogram-container .hp-crypto-function-key:hover {
          background: #dff0ff;
          transform: translateY(-1px);
        }

        #hp-cryptogram-container .hp-crypto-function-key .material-symbols-outlined {
          font-size: 26px;
          line-height: 1;
        }

        #hp-cryptogram-container .hp-crypto-kb-spacer {
          visibility: hidden;
          pointer-events: none;
        }

        #hp-cryptogram-container .hp-crypto-actions-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          max-width: 900px;
          margin: 0 auto;
          padding: 2px;
        }

        #hp-cryptogram-container .hp-crypto-secondary {
          border: 1px solid #ddd;
          background: #fff;
          color: #333;
          border-radius: 12px;
          min-height: 44px;
          padding: 10px 12px;
          font-weight: 900;
          cursor: pointer;
          transition: all .15s ease;
          font-family: inherit;
          flex: 1 1 180px;
        }

        #hp-cryptogram-container .hp-crypto-secondary:hover {
          background: #f7f9fb;
          transform: translateY(-1px);
        }

        #hp-cryptogram-container .hp-crypto-secondary.author {
          border-color: #bdeed4;
          color: var(--hp-cg-success);
          background: #f3fff9;
        }

        #hp-cryptogram-container .hp-crypto-secondary.author.active,
        #hp-cryptogram-container .hp-crypto-secondary.author:hover {
          background: var(--hp-cg-success);
          border-color: var(--hp-cg-success);
          color: #fff;
        }

        #hp-cryptogram-container .hp-crypto-secondary.answer {
          border-color: var(--hp-cg-primary-soft);
          color: var(--hp-cg-primary-dark);
          background: var(--hp-cg-primary-light);
        }

        #hp-cryptogram-container .hp-crypto-secondary.answer.active,
        #hp-cryptogram-container .hp-crypto-secondary.answer:hover {
          background: var(--hp-cg-primary);
          border-color: var(--hp-cg-primary);
          color: #fff;
        }

        #hp-cryptogram-container .hp-crypto-secondary.check {
          border-color: #b9d7ef;
          color: var(--hp-cg-blue);
        }

        #hp-cryptogram-container .hp-crypto-secondary.start-over {
          border-color: #ffb4b4;
          color: var(--hp-cg-error);
        }

        #hp-cryptogram-container .hp-crypto-secondary.reveal {
          border-color: #b9d7ef;
          color: var(--hp-cg-blue);
        }

        #hp-cryptogram-container .hp-overlay {
          display: none;
          align-items: center;
          justify-content: center;
        }

        #hp-cryptogram-container .hp-overlay.on {
          display: flex;
        }

        #hp-cryptogram-container #hp-crypto-overlay {
          position: absolute;
          inset: 0;
          z-index: 50;
          background: rgba(255,255,255,.76);
          border-radius: 18px;
          padding: 16px;
        }

        #hp-cryptogram-container #hp-crypto-help-modal {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(0,0,0,.45);
          padding: 20px;
        }

        #hp-cryptogram-container .hp-modal {
          background: #fff;
          width: min(560px, 100%);
          border-radius: 22px;
          padding: 26px;
          box-shadow: 0 20px 70px rgba(0,0,0,.25);
          text-align: center;
          color: #222;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-modal {
          width: min(500px, 100%);
          padding: 24px 24px 22px;
          border-radius: 18px;
          box-shadow: 0 18px 48px rgba(0,0,0,.18);
        }

        #hp-cryptogram-container #hp-crypto-overlay #hp-crypto-overlay-icon {
          font-size: 28px !important;
          line-height: 1;
          color: var(--hp-cg-primary-dark);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        #hp-cryptogram-container .hp-modal h3 {
          margin: 10px 0 14px;
          font-size: 26px;
          line-height: 1.15;
          color: var(--hp-cg-primary-dark);
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-modal h3 {
          margin: 8px 0 14px;
          font-size: 24px;
        }

        #hp-cryptogram-container .hp-modal-lead {
          font-size: 17px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-modal-lead {
          font-size: 15px;
          margin-bottom: 6px;
        }

        #hp-cryptogram-container .hp-modal-subtext {
          font-size: 14px;
          color: #555;
          line-height: 1.4;
          margin-bottom: 5px;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-modal-subtext {
          font-size: 13px;
          line-height: 1.3;
          margin-bottom: 4px;
        }

        #hp-cryptogram-container .hp-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin: 10px 0 16px;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-badges {
          margin: 8px 0 12px;
          gap: 6px;
        }

        #hp-cryptogram-container .hp-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: var(--hp-cg-primary-light);
          border: 1px solid var(--hp-cg-primary-soft);
          color: var(--hp-cg-primary-dark);
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 900;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-meta {
          margin: 8px 0 18px;
          text-align: center;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-puzzle-title {
          display: block;
          color: var(--hp-cg-primary-dark);
          font-size: 19px;
          line-height: 1.2;
          font-weight: 900;
          margin-bottom: 12px;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stats-line {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 8px 12px;
          color: #555;
          font-size: 12px;
          line-height: 1.25;
          font-weight: 800;
          margin: 0 auto;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stat-chip .material-symbols-outlined {
          font-size: 16px;
          line-height: 1;
          color: var(--hp-cg-primary-dark);
          font-variation-settings:
            'FILL' 1,
            'wght' 650,
            'GRAD' 0,
            'opsz' 24;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stat-chip strong {
          color: var(--hp-cg-primary-dark);
          font-weight: 900;
        }

        #hp-cryptogram-container .hp-recommend-card {
          margin: 18px auto 0;
          padding: 14px 16px;
          border-radius: 16px;
          background: #fff8ef;
          border: 1px solid var(--hp-cg-primary-soft);
          max-width: 520px;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-recommend-card {
          margin-top: 16px;
          padding: 14px 16px;
          max-width: 420px;
        }

        #hp-cryptogram-container .hp-recommend-title {
          font-size: 16px;
          font-weight: 900;
          color: var(--hp-cg-primary-dark);
          margin-bottom: 6px;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-recommend-title {
          font-size: 14px;
          margin-bottom: 4px;
        }

        #hp-cryptogram-container .hp-recommend-copy {
          font-size: 14px;
          color: #555;
          line-height: 1.35;
          margin-bottom: 10px;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-recommend-copy {
          font-size: 12px;
          line-height: 1.3;
          margin-bottom: 8px;
        }

        #hp-cryptogram-container .hp-modal-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-modal-actions {
          gap: 8px;
          margin-top: 12px;
        }

        #hp-cryptogram-container .hp-link-btn {
          border: 2px solid transparent;
          border-radius: 12px;
          min-height: 42px;
          padding: 11px 12px;
          font-weight: 900;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          font-size: 14px;
          transition: all .18s ease;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-link-btn {
          min-height: 36px;
          padding: 8px 10px;
          font-size: 12px;
        }

        #hp-cryptogram-container .hp-link-btn.primary {
          background: var(--hp-cg-primary);
          color: #fff;
          border-color: var(--hp-cg-primary);
        }

        #hp-cryptogram-container .hp-link-btn.primary:hover {
          background: #fff;
          color: var(--hp-cg-primary-dark);
          border-color: var(--hp-cg-primary-soft);
        }

        #hp-cryptogram-container .hp-link-btn.secondary {
          background: #fff;
          color: var(--hp-cg-primary-dark);
          border: 2px solid var(--hp-cg-primary-soft);
        }

        #hp-cryptogram-container .hp-link-btn.secondary:hover {
          background: var(--hp-cg-primary);
          border-color: var(--hp-cg-primary);
          color: #fff;
        }

        #hp-cryptogram-container .hp-link-btn.neutral {
          background: #fff;
          color: #333;
          border-color: #e1e5ea;
        }

        #hp-cryptogram-container .hp-link-btn.neutral:hover {
          background: var(--hp-cg-primary);
          border-color: var(--hp-cg-primary);
          color: #fff;
        }

        #hp-cryptogram-container .hp-link-btn.share {
          background: #fff7e3;
          color: var(--hp-cg-primary-dark);
          border-color: var(--hp-cg-primary-soft);
          box-shadow: 0 4px 12px rgba(243, 152, 0, .16);
        }

        #hp-cryptogram-container .hp-link-btn.share:hover {
          background: var(--hp-cg-primary);
          border-color: var(--hp-cg-primary);
          color: #fff;
          transform: translateY(-1px);
        }

        #hp-cryptogram-container .hp-link-btn.danger {
          background: #fff;
          color: var(--hp-cg-error);
          border-color: #ffb4b4;
        }

        #hp-cryptogram-container .hp-link-btn.danger:hover {
          background: var(--hp-cg-error);
          border-color: var(--hp-cg-error);
          color: #fff;
        }

        #hp-cryptogram-container .hp-link-btn.full {
          grid-column: 1 / -1;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-start-over-btn {
          grid-column: 1 / -1;
          width: min(220px, 100%);
          justify-self: center;
        }

        #hp-cryptogram-container .hp-help-modal-content {
          text-align: left;
          background: #f7f9fb;
          border: 1px solid #dce8f2;
          border-radius: 16px;
          padding: 18px;
          margin: 14px 0 6px;
        }

        #hp-cryptogram-container .hp-help-modal-content p {
          margin: 0 0 12px;
          font-size: 15px;
          line-height: 1.45;
          color: #3d4b58;
        }

        #hp-cryptogram-container .hp-help-modal-content p:last-child {
          margin-bottom: 0;
        }

        #hp-cryptogram-container .hp-help-icon {
          display: inline-flex;
          width: 28px;
          height: 28px;
          margin-right: 6px;
          align-items: center;
          justify-content: center;
          vertical-align: middle;
          color: var(--hp-cg-blue);
          background: #edf6ff;
          border: 1px solid #b9d7ef;
          border-radius: 8px;
        }

        #hp-cryptogram-container .hp-help-icon .material-symbols-outlined {
          font-size: 19px;
        }

        #hp-cryptogram-container .hp-modal small {
          display: block;
          margin-top: 14px;
          color: #777;
          font-size: 12px;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-modal small {
          margin-top: 10px;
          font-size: 11px;
        }


        /* v3.8 Success/Reveal overlay matched to Knights & Knaves v2.8 standard */
        #hp-cryptogram-container #hp-crypto-overlay .hp-modal {
          width: min(720px, 100%);
          padding: 30px 36px 32px;
          border-radius: 18px;
          border: 1px solid #e9eef3;
          box-shadow: 0 18px 48px rgba(0,0,0,.18);
          position: relative;
          max-height: calc(100% - 24px);
          overflow-y: auto;
        }

        #hp-cryptogram-container .hp-crypto-overlay-close {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 999px;
          background: #fff;
          color: var(--hp-cg-primary-dark);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,.10);
          transition: all .18s ease;
        }

        #hp-cryptogram-container .hp-crypto-overlay-close:hover {
          background: var(--hp-cg-primary);
          color: #fff;
          transform: translateY(-1px);
        }

        #hp-cryptogram-container .hp-crypto-overlay-close .material-symbols-outlined {
          font-size: 22px !important;
          font-variation-settings: 'FILL' 0, 'wght' 800, 'GRAD' 0, 'opsz' 24 !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-crypto-overlay-icon {
          font-size: 30px !important;
          color: var(--hp-cg-primary-dark);
          font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 40 !important;
          margin-bottom: 8px;
        }

        #hp-cryptogram-container .hp-crypto-overlay-status {
          font-weight: 900;
          color: #555;
          margin: 0 0 8px;
          font-size: 24px;
          line-height: 1.1;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-modal h3 {
          margin: 0 0 18px;
          color: var(--hp-cg-primary-dark);
          font-size: 28px;
          line-height: 1.15;
          font-weight: 900;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-meta {
          margin: 0;
          text-align: center;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-puzzle-title {
          display: none;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stats-line {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          align-items: center;
          gap: 0 18px;
          color: #555;
          font-size: 14px;
          line-height: 1.25;
          font-weight: 800;
          margin: 12px auto 14px;
          white-space: nowrap;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stat-chip .material-symbols-outlined {
          font-size: 16px !important;
          line-height: 1;
          color: var(--hp-cg-primary-dark);
          font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 40 !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stat-chip strong {
          color: var(--hp-cg-primary-dark);
          font-weight: 900;
        }

        #hp-cryptogram-container .hp-crypto-overlay-next-copy {
          margin: 18px auto 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          color: #555;
          font-size: 18px;
          line-height: 1.25;
          font-weight: 800;
          text-align: center;
        }

        #hp-cryptogram-container .hp-crypto-overlay-next-copy strong {
          font-size: 22px;
          color: #555;
          font-weight: 900;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 14px !important;
          flex-wrap: nowrap !important;
          margin-top: 14px !important;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn {
          border: 2px solid transparent !important;
          border-radius: 14px !important;
          min-height: 42px !important;
          min-width: 220px !important;
          width: auto !important;
          padding: 10px 22px !important;
          font-weight: 900 !important;
          cursor: pointer !important;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-family: inherit !important;
          font-size: 14px !important;
          line-height: 1.1 !important;
          transition: all .18s ease !important;
          grid-column: auto !important;
          justify-self: auto !important;
          margin: 0 !important;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.primary {
          background: var(--hp-cg-primary) !important;
          color: #fff !important;
          border-color: var(--hp-cg-primary) !important;
          min-width: 300px !important;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.primary:hover {
          background: #fff !important;
          border-color: var(--hp-cg-primary-soft) !important;
          color: var(--hp-cg-primary-dark) !important;
          transform: translateY(-1px);
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.secondary,
        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.share-action {
          background: #fff !important;
          color: var(--hp-cg-primary-dark) !important;
          border-color: var(--hp-cg-primary-soft) !important;
          min-width: 220px !important;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.secondary:hover,
        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.share-action:hover {
          background: var(--hp-cg-primary) !important;
          border-color: var(--hp-cg-primary) !important;
          color: #fff !important;
          transform: translateY(-1px);
        }


        /* v3.8 FINAL: exact Knights & Knaves overlay proportions and hierarchy */
        #hp-cryptogram-container #hp-crypto-overlay {
          position: absolute !important;
          inset: 0 !important;
          z-index: 50 !important;
          background: rgba(255,255,255,.78) !important;
          border-radius: 18px !important;
          padding: 16px !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay.on {
          display: flex !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-modal {
          background: #fff !important;
          width: min(720px, 100%) !important;
          max-width: 720px !important;
          border-radius: 18px !important;
          padding: 30px 36px 32px !important;
          border: 1px solid #e9eef3 !important;
          box-shadow: 0 18px 48px rgba(0,0,0,.18) !important;
          text-align: center !important;
          color: #222 !important;
          max-height: calc(100% - 24px) !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          position: relative !important;
        }

        #hp-cryptogram-container .hp-crypto-overlay-close {
          position: absolute !important;
          top: 10px !important;
          right: 10px !important;
          width: 34px !important;
          height: 34px !important;
          border: 0 !important;
          border-radius: 999px !important;
          background: #fff !important;
          color: var(--hp-cg-primary-dark) !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          box-shadow: 0 2px 10px rgba(0,0,0,.10) !important;
          transition: all .18s ease !important;
        }

        #hp-cryptogram-container .hp-crypto-overlay-close:hover {
          background: var(--hp-cg-primary) !important;
          color: #fff !important;
          transform: translateY(-1px) !important;
        }

        #hp-cryptogram-container .hp-crypto-overlay-close .material-symbols-outlined {
          font-size: 22px !important;
          font-variation-settings: 'FILL' 0, 'wght' 800, 'GRAD' 0, 'opsz' 24 !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-crypto-overlay-icon {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 30px !important;
          line-height: 1 !important;
          color: var(--hp-cg-primary-dark) !important;
          font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 40 !important;
          margin: 0 0 8px !important;
        }

        #hp-cryptogram-container .hp-crypto-overlay-status {
          display: block !important;
          font-weight: 900 !important;
          color: #555 !important;
          margin: 0 0 8px !important;
          font-size: 24px !important;
          line-height: 1.1 !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-modal h3 {
          margin: 0 0 18px !important;
          color: var(--hp-cg-primary-dark) !important;
          font-size: 28px !important;
          line-height: 1.15 !important;
          font-weight: 900 !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-meta {
          margin: 0 !important;
          padding: 0 !important;
          text-align: center !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-puzzle-title {
          display: none !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stats-line {
          display: flex !important;
          flex-wrap: nowrap !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 0 18px !important;
          color: #555 !important;
          font-size: 14px !important;
          line-height: 1.25 !important;
          font-weight: 800 !important;
          margin: 12px auto 14px !important;
          white-space: nowrap !important;
          overflow: visible !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stat-chip {
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
          white-space: nowrap !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stat-chip .material-symbols-outlined {
          font-size: 16px !important;
          line-height: 1 !important;
          color: var(--hp-cg-primary-dark) !important;
          font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 40 !important;
        }

        #hp-cryptogram-container #hp-crypto-overlay .hp-result-stat-chip strong {
          color: var(--hp-cg-primary-dark) !important;
          font-weight: 900 !important;
        }

        #hp-cryptogram-container .hp-crypto-overlay-next-copy {
          margin: 18px auto 16px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 5px !important;
          color: #555 !important;
          font-size: 18px !important;
          line-height: 1.25 !important;
          font-weight: 800 !important;
          text-align: center !important;
          max-width: 610px !important;
        }

        #hp-cryptogram-container .hp-crypto-overlay-next-copy strong {
          display: block !important;
          font-size: 22px !important;
          color: #555 !important;
          font-weight: 900 !important;
        }

        #hp-cryptogram-container .hp-crypto-overlay-next-copy span {
          display: block !important;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 14px !important;
          flex-wrap: wrap !important;
          margin-top: 14px !important;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn {
          border: 2px solid transparent !important;
          border-radius: 14px !important;
          min-height: 42px !important;
          min-width: 220px !important;
          width: auto !important;
          padding: 10px 22px !important;
          font-weight: 900 !important;
          cursor: pointer !important;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-family: inherit !important;
          font-size: 14px !important;
          line-height: 1.1 !important;
          transition: all .18s ease !important;
          grid-column: auto !important;
          justify-self: auto !important;
          margin: 0 !important;
          box-shadow: none !important;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.primary {
          background: var(--hp-cg-primary) !important;
          color: #fff !important;
          border-color: var(--hp-cg-primary) !important;
          min-width: 220px !important;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.primary:hover {
          background: #fff !important;
          border-color: var(--hp-cg-primary-soft) !important;
          color: var(--hp-cg-primary-dark) !important;
          transform: translateY(-1px) !important;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.secondary,
        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.share-action {
          background: #fff !important;
          color: var(--hp-cg-primary-dark) !important;
          border-color: transparent !important;
          min-width: 220px !important;
        }

        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.secondary:hover,
        #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.share-action:hover {
          background: var(--hp-cg-primary) !important;
          border-color: var(--hp-cg-primary) !important;
          color: #fff !important;
          transform: translateY(-1px) !important;
        }

        @media (max-width: 760px) {
          #hp-cryptogram-container #hp-crypto-overlay .hp-modal { width:min(720px,100%); padding:22px 16px; }
          #hp-cryptogram-container #hp-crypto-overlay .hp-result-stats-line { flex-wrap:wrap; gap:6px 12px; }
          #hp-cryptogram-container .hp-crypto-modal-buttons { flex-wrap:wrap !important; gap:10px !important; }
          #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn,
          #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.primary,
          #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.secondary,
          #hp-cryptogram-container .hp-crypto-modal-buttons .hp-link-btn.share-action { width:100% !important; min-width:0 !important; }

          #hp-cryptogram-container .hp-crypto-card {
            padding: 20px 14px;
          }

          #hp-cryptogram-container .hp-crypto-puzzle {
            --hp-cg-char-width: 23px;
            --hp-cg-letter-gap: 6px;
            --hp-cg-word-row-gap: 8px;
            --hp-cg-word-column-gap: 12px;
          }

          #hp-cryptogram-container .hp-crypto-puzzle.hp-crypto-fit-1 {
            --hp-cg-char-width: 22px;
            --hp-cg-letter-gap: 5px;
          }

          #hp-cryptogram-container .hp-crypto-puzzle.hp-crypto-fit-2 {
            --hp-cg-char-width: 21px;
            --hp-cg-letter-gap: 4px;
          }

          #hp-cryptogram-container .hp-crypto-puzzle.hp-crypto-fit-3 {
            --hp-cg-char-width: 20px;
            --hp-cg-letter-gap: 3px;
          }

          #hp-cryptogram-container .hp-crypto-top {
            font-size: 18px;
          }

          #hp-cryptogram-container .hp-crypto-bottom {
            font-size: 16px;
          }

          #hp-cryptogram-container .hp-crypto-kb {
            grid-template-columns: repeat(10, minmax(26px, 1fr)) !important;
            gap: 6px !important;
          }

          #hp-cryptogram-container .hp-crypto-key,
          #hp-cryptogram-container .hp-crypto-function-key {
            min-height: 42px;
            font-size: 14px;
            border-radius: 10px;
          }

          #hp-cryptogram-container .hp-crypto-function-key .material-symbols-outlined {
            font-size: 20px;
          }

          #hp-cryptogram-container .hp-crypto-function-key {
            padding: 4px;
          }

          #hp-cryptogram-container .hp-crypto-actions-row {
            max-width: 620px;
          }

          #hp-cryptogram-container .hp-crypto-secondary {
            flex-basis: calc(50% - 10px);
          }

          #hp-cryptogram-container .hp-modal-actions {
            grid-template-columns: 1fr;
          }
        }
      `;
      document.head.appendChild(style);
    }

    function defaultState() {
      return {
        mappings: {},
        selectedCipher: "",
        usedAuthorHint: false,
        answerShown: false,
        revealedLetters: [],
        history: [],
        solved: false,
        revealed: false,
        checked: false,
        solvedAt: "",
        revealedAt: "",
        overlaySeen: false
      };
    }

    function loadState() {
      try {
        const parsed = Core.getSavedState(STORAGE_KEY, null);
        const merged = parsed ? { ...defaultState(), ...parsed } : defaultState();

        if (!Array.isArray(merged.history)) merged.history = [];
        if (!Array.isArray(merged.revealedLetters)) merged.revealedLetters = [];

        if (Array.isArray(merged.usedHints)) {
          const authorIndex = hints.findIndex(h => h && h.type === "author");
          if (authorIndex >= 0 && merged.usedHints[authorIndex]) {
            merged.usedAuthorHint = true;
          }
        }

        return merged;
      } catch {
        return defaultState();
      }
    }

    let state = loadState();

    function saveState() {
      try {
        Core.setSavedState(STORAGE_KEY, state);
        Core.emitStateChange({
          puzzleType: "cryptogram",
          puzzleId,
          storageKey: STORAGE_KEY,
          status: Core.getPuzzleStatus(state, cryptogramStatusAdapter)
        });
      } catch {}
    }

    function isFinished() {
      return state.solved || state.revealed;
    }

    function getMapped(cipherChar) {
      return state.mappings[upper(cipherChar)] || "";
    }

    function getUsedPlainLetters() {
      return Object.values(state.mappings).filter(Boolean);
    }

    function pushHistory(entry) {
      state.history.push({
        ...entry,
        at: new Date().toISOString()
      });

      if (state.history.length > 200) {
        state.history = state.history.slice(-200);
      }
    }

    function setMapping(cipher, plain, source = "manual") {
      cipher = upper(cipher);
      plain = upper(plain);

      if (!isLetter(cipher) || !isLetter(plain) || isFinished()) return;

      const oldValue = state.mappings[cipher] || "";
      if (oldValue === plain) return;

      const displaced = [];

      Object.keys(state.mappings).forEach(key => {
        if (state.mappings[key] === plain && key !== cipher) {
          displaced.push({ cipher: key, oldValue: state.mappings[key] });
          delete state.mappings[key];
        }
      });

      state.mappings[cipher] = plain;
      state.checked = false;
      state.revealed = false;
      state.revealedAt = "";

      pushHistory({
        action: "set",
        source,
        cipher,
        oldValue,
        newValue: plain,
        displaced
      });

      checkSolvedAfterMove();
      saveState();
      render();
    }

    function eraseSelectedLetter() {
      if (!state.selectedCipher || isFinished()) return;

      const cipher = state.selectedCipher;
      const oldValue = state.mappings[cipher] || "";

      if (!oldValue) {
        setStatusOnly("There is no letter to erase for the selected cipher letter.");
        return;
      }

      delete state.mappings[cipher];
      state.checked = false;
      state.solved = false;
      state.solvedAt = "";

      pushHistory({
        action: "erase",
        cipher,
        oldValue,
        newValue: "",
        displaced: []
      });

      saveState();
      render();
    }

    function undoLastAction() {
      if (isFinished()) return;
      const last = state.history.pop();

      if (!last) {
        setStatusOnly("Nothing to undo yet.");
        return;
      }

      if (last.action === "set" || last.action === "reveal-letter") {
        if (last.oldValue) {
          state.mappings[last.cipher] = last.oldValue;
        } else {
          delete state.mappings[last.cipher];
        }

        if (Array.isArray(last.displaced)) {
          last.displaced.forEach(item => {
            if (item.oldValue) state.mappings[item.cipher] = item.oldValue;
          });
        }

        if (last.action === "reveal-letter") {
          state.revealedLetters = state.revealedLetters.filter(c => c !== last.cipher);
        }
      }

      if (last.action === "erase") {
        if (last.oldValue) state.mappings[last.cipher] = last.oldValue;
      }

      state.checked = false;
      state.solved = false;
      state.solvedAt = "";
      saveState();
      render();
    }

    function revealSelectedLetter() {
      if (!state.selectedCipher || isFinished()) {
        setStatusOnly("Select a cipher letter first, then reveal its plain letter.");
        return;
      }

      const cipher = state.selectedCipher;
      const p = upper(puzzleText);
      const s = upper(solutionText);

      const index = p.indexOf(cipher);
      if (index === -1 || !isLetter(s[index])) return;

      const plain = s[index];
      const oldValue = state.mappings[cipher] || "";
      if (oldValue === plain) {
        setStatusOnly(`${cipher} is already revealed as ${plain}.`);
        return;
      }

      const displaced = [];

      Object.keys(state.mappings).forEach(key => {
        if (state.mappings[key] === plain && key !== cipher) {
          displaced.push({ cipher: key, oldValue: state.mappings[key] });
          delete state.mappings[key];
        }
      });

      state.mappings[cipher] = plain;
      state.checked = false;

      if (!state.revealedLetters.includes(cipher)) {
        state.revealedLetters.push(cipher);
      }

      pushHistory({
        action: "reveal-letter",
        source: "reveal-letter",
        cipher,
        oldValue,
        newValue: plain,
        displaced
      });

      checkSolvedAfterMove();
      saveState();
      render();
    }

    function setStatusOnly(message) {
      const msg = mount.querySelector(".hp-crypto-status-msg");
      if (msg) msg.textContent = message;
    }

    function countSolvedLetters() {
      const p = upper(puzzleText);
      const s = upper(solutionText);
      let total = 0;
      let correct = 0;
      let filled = 0;

      for (let i = 0; i < p.length; i++) {
        if (!isLetter(p[i])) continue;
        total++;
        if (getMapped(p[i])) filled++;
        if (getMapped(p[i]) === s[i]) correct++;
      }

      return {
        correct,
        total,
        filled,
        left: Math.max(0, total - correct),
        percent: total ? Math.round((correct / total) * 100) : 0
      };
    }

    function puzzleSolved() {
      const p = upper(puzzleText);
      const s = upper(solutionText);

      if (p.length !== s.length) return false;

      for (let i = 0; i < p.length; i++) {
        if (!isLetter(p[i])) continue;
        if (getMapped(p[i]) !== s[i]) return false;
      }

      return true;
    }

    function checkSolvedAfterMove() {
      if (puzzleSolved()) {
        state.solved = true;
        state.checked = true;
        if (!state.solvedAt) state.solvedAt = new Date().toISOString();
        state.overlaySeen = false;
      } else {
        state.solved = false;
      }
    }

    function startOver() {
      if (!confirm("Start over? This will remove all of your entries for this puzzle.")) return;
      state = defaultState();
      overlayOpenedThisPageLoad = false;
      saveState();
      hideOverlay();
      hideHelpModal();
      render();
    }

    function revealSolution() {
      if (isFinished()) return;

      const ok = confirm("Reveal the answer? This will end the puzzle.");
      if (!ok) return;

      const p = upper(puzzleText);
      const s = upper(solutionText);

      for (let i = 0; i < p.length; i++) {
        if (isLetter(p[i]) && isLetter(s[i])) {
          state.mappings[p[i]] = s[i];
        }
      }

      state.selectedCipher = "";
      state.checked = true;
      state.solved = false;
      state.solvedAt = "";
      state.revealed = true;
      if (!state.revealedAt) state.revealedAt = new Date().toISOString();
      state.overlaySeen = false;

      saveState();
      render();
      showOverlay();
    }

    function checkProgress() {
      state.checked = true;

      if (puzzleSolved()) {
        state.solved = true;
        state.revealed = false;
        state.revealedAt = "";
        if (!state.solvedAt) state.solvedAt = new Date().toISOString();
        state.overlaySeen = false;
        saveState();
        render();
        showOverlay();
        return;
      }

      saveState();
      render();
    }

	    function getPuzzleShareUrl() {
	      const url = new URL(window.location.href);
	      url.search = "";
      url.hash = "";
      url.searchParams.set("puzzle", puzzleId);
	      return url.toString();
	    }

	    function getFallbackPlayPath() {
	      const accessConfig = window.HareCryptogramAccessConfig || {};
	      if (window.location.pathname) return window.location.pathname;
	      return accessConfig.mode === "member"
	        ? (accessConfig.memberPlayUrl || "/cryptogram-member")
	        : (accessConfig.publicPlayUrl || "/cryptogram");
	    }

    function getShareText() {
      const counts = countSolvedLetters();

      if (state.solved) {
        return `I solved ${puzzleTitle} at Hare Publishing! 🧩\n\nThink you can crack the code too?`;
      }

      if (state.revealed) {
        return `${puzzleTitle} finally beat me! 😄\n\nCan you solve it without revealing the answer?`;
      }

      return `I’m decoding ${puzzleTitle} at Hare Publishing — ${counts.correct}/${counts.total} letters cracked so far. 🧩\n\nCan you finish it?`;
    }

    function shareResult() {
      const shareUrl = getPuzzleShareUrl();
      const shareText = getShareText();
      const fullShareText = `${shareText}\n\n${shareUrl}`;

      const shareData = {
        title: `${puzzleTitle} | Hare Publishing`,
        text: fullShareText
      };

      /*
        Important:
        Some native share targets, especially Mail and Messages on Apple devices,
        ignore or downplay the Web Share API `text` value when `url` is supplied
        as a separate field. Putting the puzzle-specific URL directly inside the
        shared text makes the message more reliable across email, text messages,
        and social apps while still preserving the exact puzzle link.
      */
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullShareText).then(() => {
          setStatusOnly("Puzzle share text copied!");
        }).catch(() => {
          setStatusOnly("Share text could not be copied automatically.");
        });
      }
    }

    function renderAuthorReveal() {
      if (!puzzleHint || !state.usedAuthorHint) return "";

      return `
        <div class="hp-crypto-author-reveal">
          <strong>${escapeHtml(puzzleHint.label.replace(/ Hint$/i, ""))}:</strong> ${escapeHtml(puzzleHint.value)}
        </div>
      `;
    }

    function renderAnswerReveal() {
      if (!answerButtonLabel || !puzzleAnswer || !state.answerShown) return "";

      const label = puzzleKind === "Trivia" ? "Trivia Answer" : "Riddle Answer";

      return `
        <div class="hp-crypto-author-reveal">
          <strong>${escapeHtml(label)}:</strong> ${escapeHtml(puzzleAnswer)}
        </div>
      `;
    }

    function renderPuzzle() {
      const p = upper(puzzleText);
      const s = upper(solutionText);
      let html = `<div class="hp-crypto-puzzle" aria-label="Cryptogram puzzle">`;
      let currentWord = "";

      function flushWord() {
        if (!currentWord) return;
        html += `<span class="hp-crypto-word">${currentWord}</span>`;
        currentWord = "";
      }

      for (let i = 0; i < p.length; i++) {
        const cipher = p[i];
        const solution = s[i];

        if (cipher === " ") {
          flushWord();
          html += `<span class="hp-crypto-space" aria-hidden="true"></span>`;
          continue;
        }

        if (cipher === "'") {
          currentWord += `<span class="hp-crypto-apostrophe">'</span>`;
          continue;
        }

        if (!isLetter(cipher)) {
          if (currentWord) {
            currentWord += `<span class="hp-crypto-punc">${escapeHtml(cipher)}</span>`;
          } else {
            html += `<span class="hp-crypto-punc">${escapeHtml(cipher)}</span>`;
          }
          continue;
        }

        const mapped = getMapped(cipher);
        const isSelected = state.selectedCipher === cipher;
        const showFeedback = state.checked || isFinished();
        const isCorrect = showFeedback && mapped && mapped === solution;
        const isWrong = showFeedback && mapped && mapped !== solution;

        currentWord += `
          <button type="button"
                  class="hp-crypto-char${isSelected ? " is-selected" : ""}${isCorrect ? " is-correct" : ""}${isWrong ? " is-wrong" : ""}"
                  data-cipher="${cipher}"
                  aria-label="Cipher letter ${cipher}">
            <span class="hp-crypto-top">${mapped || "&nbsp;"}</span>
            <span class="hp-crypto-bottom">${cipher}</span>
          </button>
        `;
      }

      flushWord();
      html += `</div>`;
      return html;
    }

    function statusMessage() {
      const counts = countSolvedLetters();

      if (state.solved) return "Cryptogram solved! Back to admire your codebreaking work.";
      if (state.revealed) return "Answer revealed. Back to review the completed quote.";
      if (state.checked) return "Progress checked. Correct letters are green and incorrect letters are red.";
      if (state.selectedCipher) return `Selected cipher letter: ${state.selectedCipher}`;
      if (counts.filled > 0) return "Keep going — choose another cipher letter or check your progress.";
      return "Select a cipher letter, then choose its matching plain letter.";
    }

    function functionKey(action, label, iconName) {
      return `
        <button type="button" class="hp-crypto-function-key ${action}" data-a="${action}" aria-label="${label}">
          <span class="material-symbols-outlined" aria-hidden="true">${iconName}</span>
        </button>
      `;
    }

    function renderActionButtons() {
      const buttons = [];

      if (puzzleHint) {
        buttons.push(`
          <button type="button" class="hp-crypto-secondary author${state.usedAuthorHint ? " active" : ""}" data-a="toggle-author">
            ${state.usedAuthorHint ? `${escapeHtml(puzzleHint.label)}: ON` : escapeHtml(puzzleHint.label)}
          </button>
        `);
      }

      if (answerButtonLabel) {
        buttons.push(`
          <button type="button" class="hp-crypto-secondary answer${state.answerShown ? " active" : ""}" data-a="toggle-answer">
            ${state.answerShown ? `${escapeHtml(answerButtonLabel.replace(/^Show /i, ""))}: ON` : escapeHtml(answerButtonLabel)}
          </button>
        `);
      }

      buttons.push(`<button type="button" class="hp-crypto-secondary check" data-a="check">Check Progress</button>`);
      buttons.push(`<button type="button" class="hp-crypto-secondary reveal" data-a="reveal-answer">Reveal Answer</button>`);
      buttons.push(`<button type="button" class="hp-crypto-secondary start-over" data-a="start-over">Start Over</button>`);

      return buttons.join("");
    }

    function renderKeyboard() {
      const used = getUsedPlainLetters();

      const row1 = "ABCDEFGHI".split("");
      const row2 = "JKLMNOPQR".split("");
      const row3 = "STUVWXYZ".split("");

      function letterButton(letter) {
        return `
          <button type="button" class="hp-crypto-key${used.includes(letter) ? " is-used" : ""}" data-plain="${letter}">
            ${letter}
          </button>
        `;
      }

      return `
        <div class="hp-crypto-kb-wrap">
          <div class="hp-crypto-kb">
            ${row1.map(letterButton).join("")}
            ${functionKey("reveal-letter", "Reveal Letter", "visibility")}

            ${row2.map(letterButton).join("")}
            ${functionKey("erase-selected", "Erase", "backspace")}

            ${row3.map(letterButton).join("")}
            <span class="hp-crypto-kb-spacer"></span>
            ${functionKey("undo", "Undo", "undo")}
          </div>

          <div class="hp-crypto-actions-row">
            ${renderActionButtons()}
          </div>
        </div>
      `;
    }

    function getStoredCryptogramItems() {
      return Core.getStoredItems(CRYPTOGRAM_STORAGE_PREFIX).map(item => ({
        key: item.key,
        id: item.id,
        saved: item.data
      }));
    }

    function hasProgress(saved) {
      return cryptogramStatusAdapter.hasProgress.call(cryptogramStatusAdapter, saved);
    }

    function getSavedCryptogramState(id) {
      return Core.getSavedState(Core.makeStorageKey(CRYPTOGRAM_STORAGE_PREFIX, id), null);
    }

    function isSolvedOrRevealed(saved) {
      return Core.isFinished(saved, cryptogramStatusAdapter);
    }

    function isSolvedOnly(saved) {
      return cryptogramStatusAdapter.isSolved.call(cryptogramStatusAdapter, saved);
    }

    function isRevealedOnly(saved) {
      return cryptogramStatusAdapter.isRevealed.call(cryptogramStatusAdapter, saved);
    }

    function getFinishedDate(saved) {
      return Core.getFinishedDate(saved, cryptogramStatusAdapter);
    }

    function localDateKey(date) {
      return Core.localDateKey(date);
    }

    function getCryptogramStats() {
      const stats = Core.getStats({
        storagePrefix: CRYPTOGRAM_STORAGE_PREFIX,
        statusAdapter: cryptogramStatusAdapter
      });

      return {
        streak: stats.streak,
        solved: stats.solved,
        revealed: stats.revealed,
        inProgress: stats.inProgress,
        played: stats.played
      };
    }

    function getOverlayStatsLine() {
      const stats = getCryptogramStats();
      return `
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">local_fire_department</span><strong>${stats.streak.toLocaleString()}</strong> Day Streak</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">trophy</span><strong>${stats.solved.toLocaleString()}</strong> Solved</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">visibility</span><strong>${stats.revealed.toLocaleString()}</strong> Revealed</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">pending_actions</span><strong>${stats.inProgress.toLocaleString()}</strong> In Progress</span>
        <span class="hp-result-stat-chip"><span class="material-symbols-outlined" aria-hidden="true">beenhere</span><strong>${stats.played.toLocaleString()}</strong> Played</span>
      `;
    }

    function parsePuzzleDate(dateString) {
      return Core.parsePuzzleDate(dateString, { endOfDay: true });
    }

	    function getAvailableIndexItems() {
	      const index = Array.isArray(window.HareCryptogramIndex) ? window.HareCryptogramIndex : [];
	      return Core.getAvailablePuzzles(index, {
	        sort: "descending",
	        accessConfig: window.HareCryptogramAccessConfig || null
	      });
	    }

    function findNextPlayableCryptogram() {
      const next = Core.findNextPuzzle({
        availablePuzzles: getAvailableIndexItems(),
        storagePrefix: CRYPTOGRAM_STORAGE_PREFIX,
        statusAdapter: cryptogramStatusAdapter,
        order: "newest-first"
      });

      if (!next) return null;

      return {
        id: String(next.puzzleId || next.id),
        isInProgress: next.status === "in-progress" || Boolean(next.isInProgress)
      };
    }

    function renderRecommendationHtml(context = {}) {
      const nextPuzzle = findNextPlayableCryptogram();

      if (nextPuzzle) {
        const actionLabel = nextPuzzle.isInProgress ? "Continue" : "Play";
        const messageTitle = context.solved
          ? "Congratulations — you cracked the code!"
          : (nextPuzzle.isInProgress ? "Continue where you left off" : "Another Cryptogram is ready");
        const messageCopy = nextPuzzle.isInProgress
          ? "Pick up where you left off and finish cracking the quote."
          : "Keep your puzzle streak going with the next available Cryptogram.";

        return `
          <div class="hp-crypto-overlay-next-copy">
            <strong>${messageTitle}</strong>
            <span>${messageCopy}</span>
          </div>
          <div class="hp-crypto-modal-buttons">
            <button class="hp-link-btn primary" type="button" data-a="load-puzzle" data-puzzle-id="${escapeHtml(nextPuzzle.id)}">
              ${actionLabel} Cryptogram #${escapeHtml(nextPuzzle.id)}
            </button>
            <button class="hp-link-btn secondary share-action" type="button" data-a="share">Share This Puzzle</button>
          </div>
        `;
      }

      return `
        <div class="hp-crypto-overlay-next-copy">
          <strong>You're all caught up!</strong>
          <span>Check back for the next Cryptogram puzzle.</span>
        </div>
        <div class="hp-crypto-modal-buttons">
          <a class="hp-link-btn primary" href="${escapeHtml((window.HarePlatformNextCta&&window.HarePlatformNextCta().url)||'/membership')}">${escapeHtml((window.HarePlatformNextCta&&window.HarePlatformNextCta().label)||'Unlock the Full Library')}</a>
          <button class="hp-link-btn secondary share-action" type="button" data-a="share">Share This Puzzle</button>
        </div>
      `;
    }

    function renderOverlayContent() {
      const badgeIdEl = mount.querySelector("#hp-crypto-badge-id");
      const badgeMetaEl = mount.querySelector("#hp-crypto-badge-meta");
      const overlayIconEl = mount.querySelector("#hp-crypto-overlay-icon");
      const overlayStatusEl = mount.querySelector("#hp-crypto-overlay-status");
      const overlayTitleEl = mount.querySelector("#hp-crypto-overlay-title");
      const overlayTextEl = mount.querySelector("#hp-crypto-overlay-text");

      if (!badgeIdEl || !badgeMetaEl || !overlayIconEl || !overlayStatusEl || !overlayTitleEl || !overlayTextEl) return;

      badgeIdEl.textContent = puzzleTitle;
      badgeMetaEl.innerHTML = getOverlayStatsLine();

      if (state.solved) {
        overlayIconEl.textContent = "celebration";
        overlayStatusEl.textContent = "Solved";
        overlayTitleEl.textContent = puzzleTitle;
        overlayTextEl.innerHTML = renderRecommendationHtml({ solved:true });
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "visibility";
        overlayStatusEl.textContent = "Revealed";
        overlayTitleEl.textContent = puzzleTitle;
        overlayTextEl.innerHTML = `
          ${renderRecommendationHtml()}
        `;
      }
    }

    function showOverlay() {
      renderOverlayContent();
      const overlayEl = mount.querySelector("#hp-crypto-overlay");
      if (!overlayEl) return;

      overlayEl.querySelectorAll('[data-a="load-puzzle"]').forEach(btn => {
        if (btn.dataset.hpLoadBound === "1") return;
        btn.dataset.hpLoadBound = "1";
        btn.addEventListener("click", e => {
          e.preventDefault();
          const nextId = btn.getAttribute("data-puzzle-id");
          if (!nextId) return;

          hideOverlay();

          if (typeof window.HareCryptogramLoadPuzzle === "function") {
            window.HareCryptogramLoadPuzzle(nextId, { scroll: false });
          } else {
	            window.location.href = `${getFallbackPlayPath()}?puzzle=${encodeURIComponent(nextId)}`;
          }
        });
      });

      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");

      overlayOpenedThisPageLoad = true;
      state.overlaySeen = true;
      saveState();
    }

    function hideOverlay() {
      const overlayEl = mount.querySelector("#hp-crypto-overlay");
      if (!overlayEl) return;

      overlayEl.classList.remove("on");
      overlayEl.setAttribute("aria-hidden", "true");

      state.overlaySeen = true;
      saveState();
    }

    function showHelpModal() {
      const modalEl = mount.querySelector("#hp-crypto-help-modal");
      if (!modalEl) return;
      modalEl.classList.add("on");
      modalEl.setAttribute("aria-hidden", "false");
    }

    function hideHelpModal() {
      const modalEl = mount.querySelector("#hp-crypto-help-modal");
      if (!modalEl) return;
      modalEl.classList.remove("on");
      modalEl.setAttribute("aria-hidden", "true");
    }

    function fitPuzzleToWidth() {
      const puzzleEl = mount.querySelector(".hp-crypto-puzzle");
      if (!puzzleEl) return;

      const fitClasses = ["hp-crypto-fit-1", "hp-crypto-fit-2", "hp-crypto-fit-3"];
      puzzleEl.classList.remove(...fitClasses);

      const availableWidth = Math.floor(puzzleEl.clientWidth);
      if (!availableWidth) return;

      const words = Array.from(puzzleEl.querySelectorAll(".hp-crypto-word"));
      const comfortInset = window.matchMedia && window.matchMedia("(max-width: 760px)").matches ? 12 : 0;
      const targetWidth = Math.max(0, availableWidth - comfortInset);
      const hasWideWord = () => words.some(word => Math.ceil(word.scrollWidth) > targetWidth);

      for (const fitClass of fitClasses) {
        if (!hasWideWord()) break;
        puzzleEl.classList.add(fitClass);
      }
    }

    function schedulePuzzleFit() {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(fitPuzzleToWidth);
      } else {
        setTimeout(fitPuzzleToWidth, 0);
      }
    }

    function render() {
      mount.innerHTML = `
        <div class="hp-crypto-shell">
          <div class="hp-crypto-card">
            ${renderAuthorReveal()}
            ${renderAnswerReveal()}
            <div class="hp-crypto-status">
              <span class="hp-crypto-status-msg">${escapeHtml(statusMessage())}</span>
            </div>
            ${renderPuzzle()}
            ${renderKeyboard()}

            <div class="hp-overlay" id="hp-crypto-overlay" aria-hidden="true">
              <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Cryptogram result">
                <button type="button" class="hp-crypto-overlay-close" data-a="close-overlay" aria-label="Close success card">
                  <span class="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
                <span id="hp-crypto-overlay-icon" class="material-symbols-outlined hp-crypto-overlay-icon" aria-hidden="true">celebration</span>
                <div id="hp-crypto-overlay-status" class="hp-crypto-overlay-status">Solved</div>
                <h3 id="hp-crypto-overlay-title">Cryptogram Puzzle</h3>

                <div class="hp-result-meta">
                  <div class="hp-result-puzzle-title" id="hp-crypto-badge-id"></div>
                  <div class="hp-result-stats-line" id="hp-crypto-badge-meta"></div>
                </div>

                <div id="hp-crypto-overlay-text"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="hp-overlay hp-crypto-help-modal" id="hp-crypto-help-modal" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Cryptogram">
            <h3>How to Play</h3>

            <div class="hp-help-modal-content">
              <p>Click a <strong>cipher letter</strong>, then choose the plain letter you think it stands for. Every matching cipher letter updates across the whole quote.</p>
              <p><span class="hp-help-icon"><span class="material-symbols-outlined">visibility</span></span><strong>Reveal Letter</strong> reveals the plain letter for the selected cipher letter.</p>
              <p><span class="hp-help-icon"><span class="material-symbols-outlined">backspace</span></span><strong>Erase</strong> removes the entry for the selected cipher letter.</p>
              <p><span class="hp-help-icon"><span class="material-symbols-outlined">undo</span></span><strong>Undo</strong> steps backward through your recent actions.</p>
              <p><strong>Hint</strong> reveals an available clue, such as an author, category, or topic.</p>
              <p><strong>Show Riddle Answer</strong> or <strong>Show Trivia Answer</strong> appears only when the puzzle includes a separate answer.</p>
              <p><strong>Check Progress</strong> highlights correct letters in green and incorrect letters in red.</p>
              <p><strong>Reveal Answer</strong> ends the puzzle and shows the completed quote.</p>
            </div>

            <div class="hp-modal-actions">
              <button class="hp-link-btn neutral full" data-a="close-help-modal">Back to Puzzle</button>
            </div>

            <small>Hare Publishing • Cryptogram</small>
          </div>
        </div>
      `;

      bindEvents();
      fitPuzzleToWidth();
      schedulePuzzleFit();

      if (isFinished() && !overlayOpenedThisPageLoad) {
        setTimeout(showOverlay, 0);
      }

      window.dispatchEvent(new CustomEvent("hare:cryptogram-rendered", {
        detail: { puzzleId, storageKey: STORAGE_KEY }
      }));
    }

    container.__hareCryptogramResizeHandler = schedulePuzzleFit;
    window.addEventListener("resize", container.__hareCryptogramResizeHandler);

    function bindEvents() {
      mount.querySelectorAll("[data-cipher]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (isFinished()) return;
          state.selectedCipher = btn.getAttribute("data-cipher") || "";
          saveState();
          render();
        });
      });

      mount.querySelectorAll("[data-plain]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (!state.selectedCipher) return;
          setMapping(state.selectedCipher, btn.getAttribute("data-plain") || "", "manual");
        });
      });

      mount.querySelectorAll("[data-a]").forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.getAttribute("data-a");

          if (action === "erase-selected") eraseSelectedLetter();
          if (action === "undo") undoLastAction();
          if (action === "reveal-letter") revealSelectedLetter();
          if (action === "check") checkProgress();
          if (action === "share") shareResult();
          if (action === "reveal-answer") revealSolution();
          if (action === "start-over") startOver();
          if (action === "close-overlay") hideOverlay();
          if (action === "close-help-modal") hideHelpModal();
          if (action === "load-puzzle") {
            const nextId = btn.getAttribute("data-puzzle-id");
            if (nextId && typeof window.HareCryptogramLoadPuzzle === "function") {
              hideOverlay();
              window.HareCryptogramLoadPuzzle(nextId, { scroll: false });
            } else if (nextId) {
	              window.location.href = `${getFallbackPlayPath()}?puzzle=${encodeURIComponent(nextId)}`;
            }
          }

          if (action === "toggle-author") {
            state.usedAuthorHint = !state.usedAuthorHint;
            saveState();
            render();
          }

          if (action === "toggle-answer") {
            state.answerShown = !state.answerShown;
            saveState();
            render();
          }
        });
      });

      const overlayEl = mount.querySelector("#hp-crypto-overlay");
      if (overlayEl) {
        overlayEl.addEventListener("click", e => {
          if (e.target === overlayEl) hideOverlay();
        });
      }

      const helpModalEl = mount.querySelector("#hp-crypto-help-modal");
      if (helpModalEl) {
        helpModalEl.addEventListener("click", e => {
          if (e.target === helpModalEl) hideHelpModal();
        });
      }
    }

	    const containerClickHandler = () => {
	      container.focus();
	    };

	    const containerKeydownHandler = e => {
	      const tag = document.activeElement ? document.activeElement.tagName : "";
	      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const overlayEl = mount.querySelector("#hp-crypto-overlay");
      const helpModalEl = mount.querySelector("#hp-crypto-help-modal");

      if (e.key === "Escape") {
        if (helpModalEl && helpModalEl.classList.contains("on")) {
          hideHelpModal();
          return;
        }
        if (overlayEl && overlayEl.classList.contains("on")) {
          hideOverlay();
          return;
        }
      }

      if (overlayEl && overlayEl.classList.contains("on")) return;
      if (helpModalEl && helpModalEl.classList.contains("on")) return;
      if (isFinished()) return;

      const key = e.key.toUpperCase();

      if (/^[A-Z]$/.test(key)) {
        e.preventDefault();

        if (state.selectedCipher) {
          setMapping(state.selectedCipher, key, "keyboard");
        } else {
          const firstBtn = mount.querySelector(`[data-cipher="${key}"]`);
          if (firstBtn) {
            state.selectedCipher = key;
            saveState();
            render();
          }
        }
        return;
      }

      if (key === "BACKSPACE" || key === "DELETE") {
        e.preventDefault();
        eraseSelectedLetter();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && key === "Z") {
        e.preventDefault();
        undoLastAction();
        return;
      }

	      if (key === "ENTER") {
	        e.preventDefault();
	        checkProgress();
	      }
	    };

	    container.addEventListener("click", containerClickHandler);
	    container.addEventListener("keydown", containerKeydownHandler);
	    container.__hareCryptogramHandlers = {
	      click: containerClickHandler,
	      keydown: containerKeydownHandler
	    };

    window.HareCryptogramEngine.openHelp = function(id = containerId) {
      if (id === containerId) showHelpModal();
    };

    render();
  }
};

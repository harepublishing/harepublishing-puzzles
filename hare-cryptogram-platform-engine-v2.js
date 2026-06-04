window.HareCryptogramEngine = {
  init({ containerId = "hp-cryptogram-container", dataObject } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (container.dataset.hpCryptogramMounted === "true") return;
    container.dataset.hpCryptogramMounted = "true";

    const mount = container.querySelector(".hp-mount") || container;
    const yearEl = container.querySelector("#hp-year") || document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

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
    const puzzleHint = normalizePuzzleHint(data, hints);
    const MORE_PUZZLES_URL = data.morePuzzlesUrl || "https://www.harepublishing.com/online-puzzles";
    const SHOP_URL = data.shopUrl || "https://www.harepublishing.com/shop";
    const STORAGE_KEY = data.storageKey || `hp_cg_${puzzleId}`;

    if (!puzzleText || !solutionText) {
      mount.innerHTML = errorCard("Configuration Error: puzzleText and solutionText are required.");
      return;
    }

    injectMaterialSymbols();
    injectStyles();

    function injectMaterialSymbols() {
      if (document.getElementById("hp-material-symbols-font")) return;

      const link = document.createElement("link");
      link.id = "hp-material-symbols-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined";
      document.head.appendChild(link);
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
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\w/g, ch => ch.toUpperCase());
    }

    function normalizePuzzleHint(dataObject, hintArray) {
      if (dataObject && dataObject.hint && typeof dataObject.hint === "object" && dataObject.hint.value) {
        const type = String(dataObject.hint.type || "hint").toLowerCase();
        const displayName = dataObject.hint.label || titleCase(type) || "Hint";
        return {
          type,
          displayName,
          buttonLabel: `${displayName} Hint`,
          activeLabel: `${displayName} Hint: ON`,
          revealLabel: displayName,
          value: String(dataObject.hint.value)
        };
      }

      if (dataObject && dataObject.author) {
        return {
          type: "author",
          displayName: "Author",
          buttonLabel: "Author Hint",
          activeLabel: "Author Hint: ON",
          revealLabel: "Author",
          value: String(dataObject.author)
        };
      }

      const supportedHint = hintArray.find(h =>
        h && h.value && h.type && h.type !== "mapping"
      );

      if (supportedHint) {
        const type = String(supportedHint.type || "hint").toLowerCase();
        const displayName = supportedHint.label
          ? String(supportedHint.label).replace(/\s*hint\s*$/i, "")
          : titleCase(type) || "Hint";

        return {
          type,
          displayName,
          buttonLabel: `${displayName} Hint`,
          activeLabel: `${displayName} Hint: ON`,
          revealLabel: displayName,
          value: String(supportedHint.value)
        };
      }

      return null;
    }

    function injectStyles() {
      if (document.getElementById("hp-cryptogram-platform-engine-v2-styles")) return;

      const style = document.createElement("style");
      style.id = "hp-cryptogram-platform-engine-v2-styles";
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
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: flex-end;
          gap: 18px 22px;
          margin: 28px auto 30px;
          max-width: 900px;
          line-height: 1;
        }

        #hp-cryptogram-container .hp-crypto-word {
          display: inline-flex;
          gap: 6px;
          white-space: nowrap;
          align-items: flex-end;
        }

        #hp-cryptogram-container .hp-crypto-space {
          width: 8px;
        }

        #hp-cryptogram-container .hp-crypto-char {
          width: 31px;
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
          padding: 0 2px 7px;
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

        #hp-cryptogram-container .hp-crypto-function-key.reveal-letter .material-symbols-outlined {
          font-size: 28px;
        }

        #hp-cryptogram-container .hp-crypto-kb-spacer {
          visibility: hidden;
          pointer-events: none;
        }

        #hp-cryptogram-container .hp-crypto-actions-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          max-width: 820px;
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
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(0,0,0,.45);
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        #hp-cryptogram-container .hp-overlay.on {
          display: flex;
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

        #hp-cryptogram-container .hp-modal h3 {
          margin: 10px 0 14px;
          font-size: 26px;
          line-height: 1.15;
          color: var(--hp-cg-primary-dark);
        }

        #hp-cryptogram-container .hp-modal-lead {
          font-size: 17px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        #hp-cryptogram-container .hp-modal-subtext {
          font-size: 14px;
          color: #555;
          line-height: 1.4;
          margin-bottom: 5px;
        }

        #hp-cryptogram-container .hp-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin: 10px 0 16px;
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

        #hp-cryptogram-container .hp-modal-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        #hp-cryptogram-container .hp-link-btn {
          border: 0;
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
        }

        #hp-cryptogram-container .hp-link-btn.primary {
          background: var(--hp-cg-primary);
          color: #fff;
        }

        #hp-cryptogram-container .hp-link-btn.secondary {
          background: var(--hp-cg-primary-light);
          color: var(--hp-cg-primary-dark);
          border: 1px solid var(--hp-cg-primary-soft);
        }

        #hp-cryptogram-container .hp-link-btn.neutral {
          background: #f3f5f7;
          color: #333;
        }

        #hp-cryptogram-container .hp-link-btn.danger {
          background: #fff5f5;
          color: var(--hp-cg-error);
          border: 1px solid #ffb4b4;
        }

        #hp-cryptogram-container .hp-link-btn.full {
          grid-column: 1 / -1;
        }

        #hp-cryptogram-container .hp-help-modal-content {
          text-align: left;
          display: grid;
          gap: 10px;
          margin: 14px 0 6px;
        }

        #hp-cryptogram-container .hp-help-line {
          display: block;
          background: #f7f9fb;
          border: 1px solid #e3e9ef;
          border-radius: 12px;
          padding: 11px 12px;
          font-size: 14px;
          line-height: 1.4;
        }

        #hp-cryptogram-container .hp-modal small {
          display: block;
          margin-top: 14px;
          color: #777;
          font-size: 12px;
        }

        @media (max-width: 760px) {
          #hp-cryptogram-container .hp-crypto-card {
            padding: 20px 14px;
          }

          #hp-cryptogram-container .hp-crypto-puzzle {
            gap: 14px 16px;
          }

          #hp-cryptogram-container .hp-crypto-char {
            width: 26px;
          }

          #hp-cryptogram-container .hp-crypto-top {
            font-size: 16px;
          }

          #hp-cryptogram-container .hp-crypto-bottom {
            font-size: 14px;
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
            font-size: 24px;
          }

          #hp-cryptogram-container .hp-crypto-actions-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-width: 620px;
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
        usedHint: false,
        usedAuthorHint: false,
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
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const merged = parsed ? { ...defaultState(), ...parsed } : defaultState();

        if (!Array.isArray(merged.history)) merged.history = [];
        if (!Array.isArray(merged.revealedLetters)) merged.revealedLetters = [];

        if (typeof merged.usedHint !== "boolean") {
          merged.usedHint = Boolean(merged.usedAuthorHint);
        }

        if (Array.isArray(merged.usedHints) && puzzleHint) {
          const legacyHintIndex = hints.findIndex(h =>
            h && h.value && h.type && h.type !== "mapping"
          );
          if (legacyHintIndex >= 0 && merged.usedHints[legacyHintIndex]) {
            merged.usedHint = true;
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent("hare:cryptogram-state-change", {
          detail: { puzzleId, storageKey: STORAGE_KEY }
        }));
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

    function shareResult() {
      const counts = countSolvedLetters();
      const shareData = {
        title: `${puzzleTitle} — Hare Publishing`,
        text: state.solved
          ? `I solved ${puzzleTitle} from Hare Publishing!`
          : state.revealed
            ? `I revealed the answer for ${puzzleTitle} at Hare Publishing.`
            : `I’m working on ${puzzleTitle} — ${counts.correct}/${counts.total} letters solved so far.`,
        url: window.location.href
      };

      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(() => {
          setStatusOnly("Link copied!");
        }).catch(() => {});
      }
    }

    function renderHintReveal() {
      if (!puzzleHint || !state.usedHint) return "";

      return `
        <div class="hp-crypto-author-reveal">
          <strong>${escapeHtml(puzzleHint.revealLabel)}:</strong> ${escapeHtml(puzzleHint.value)}
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
          flushWord();
          html += `<span class="hp-crypto-punc">${escapeHtml(cipher)}</span>`;
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

      if (state.solved) return "Cryptogram solved! Great job cracking the quote.";
      if (state.revealed) return "Answer revealed. Try another puzzle when you are ready.";
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
            ${
              puzzleHint
                ? `<button type="button" class="hp-crypto-secondary author${state.usedHint ? " active" : ""}" data-a="toggle-hint">
                    ${state.usedHint ? escapeHtml(puzzleHint.activeLabel) : escapeHtml(puzzleHint.buttonLabel)}
                  </button>`
                : `<span class="hp-crypto-kb-spacer"></span>`
            }
            <button type="button" class="hp-crypto-secondary check" data-a="check">Check Progress</button>
            <button type="button" class="hp-crypto-secondary start-over" data-a="start-over">Start Over</button>
            <button type="button" class="hp-crypto-secondary reveal" data-a="reveal-answer">Reveal Answer</button>
          </div>
        </div>
      `;
    }

    function renderOverlayContent() {
      const badgeIdEl = mount.querySelector("#hp-crypto-badge-id");
      const badgeMetaEl = mount.querySelector("#hp-crypto-badge-meta");
      const overlayIconEl = mount.querySelector("#hp-crypto-overlay-icon");
      const overlayTitleEl = mount.querySelector("#hp-crypto-overlay-title");
      const overlayTextEl = mount.querySelector("#hp-crypto-overlay-text");

      if (!badgeIdEl || !badgeMetaEl || !overlayIconEl || !overlayTitleEl || !overlayTextEl) return;

      const counts = countSolvedLetters();
      badgeIdEl.textContent = puzzleTitle;
      badgeMetaEl.textContent = `Letters: ${counts.correct}/${counts.total}`;

      if (state.solved) {
        overlayIconEl.textContent = "🎉";
        overlayTitleEl.textContent = "You Solved the Cryptogram!";
        overlayTextEl.innerHTML = `
          <div class="hp-modal-lead">Congratulations — you cracked the code!</div>
          <div class="hp-modal-subtext">Great job decoding this quote.</div>
          <div class="hp-modal-subtext">Keep your puzzle streak going in the Puzzlers Hub.</div>
        `;
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "📘";
        overlayTitleEl.textContent = "Answer Revealed";
        overlayTextEl.innerHTML = `
          <div class="hp-modal-lead">Here is the completed quote.</div>
          <div class="hp-modal-subtext">Try another Cryptogram or explore more puzzles in the Puzzlers Hub.</div>
        `;
      }
    }

    function showOverlay() {
      renderOverlayContent();
      const overlayEl = mount.querySelector("#hp-crypto-overlay");
      if (!overlayEl) return;

      overlayEl.classList.add("on");
      overlayEl.setAttribute("aria-hidden", "false");

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

    function render() {
      mount.innerHTML = `
        <div class="hp-crypto-shell">
          <div class="hp-crypto-card">
            ${renderHintReveal()}
            <div class="hp-crypto-status">
              <span class="hp-crypto-status-msg">${escapeHtml(statusMessage())}</span>
            </div>
            ${renderPuzzle()}
            ${renderKeyboard()}
          </div>
        </div>

        <div class="hp-overlay" id="hp-crypto-overlay" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Cryptogram result">
            <div id="hp-crypto-overlay-icon" style="font-size:32px; line-height:1;">🎉</div>
            <h3 id="hp-crypto-overlay-title">You Solved the Cryptogram!</h3>

            <div class="hp-badges">
              <span class="hp-badge" id="hp-crypto-badge-id"></span>
              <span class="hp-badge" id="hp-crypto-badge-meta"></span>
            </div>

            <div id="hp-crypto-overlay-text"></div>

            <div class="hp-modal-actions">
              <a class="hp-link-btn secondary" href="${escapeHtml(MORE_PUZZLES_URL)}">More Online Puzzles</a>
              <a class="hp-link-btn primary" href="${escapeHtml(SHOP_URL)}">Get Puzzle Books</a>
              <button class="hp-link-btn neutral" data-a="share">Share</button>
              <button class="hp-link-btn neutral" data-a="close-overlay">Back to Puzzle</button>
              <button class="hp-link-btn danger full" data-a="start-over">Start Over</button>
            </div>

            <small>Hare Publishing • Cryptogram</small>
          </div>
        </div>

        <div class="hp-overlay hp-crypto-help-modal" id="hp-crypto-help-modal" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="How to play Cryptogram">
            <h3>How to Play</h3>

            <div class="hp-help-modal-content">
              <span class="hp-help-line">Click a <strong>cipher letter</strong>, then choose the plain letter you think it stands for.</span>
              <span class="hp-help-line">Every matching cipher letter updates across the whole quote.</span>
              <span class="hp-help-line"><strong>Reveal Letter</strong> reveals the plain letter for the selected cipher letter.</span>
              <span class="hp-help-line"><strong>Erase</strong> removes the entry for the selected cipher letter.</span>
              <span class="hp-help-line"><strong>Undo</strong> steps backward through your recent actions.</span>
              <span class="hp-help-line"><strong>Hint</strong> reveals the author, category, topic, or another helpful clue when one is available.</span>
              <span class="hp-help-line"><strong>Check Progress</strong> highlights correct letters in green and incorrect letters in red.</span>
              <span class="hp-help-line"><strong>Reveal Answer</strong> ends the puzzle and shows the completed quote.</span>
            </div>

            <div class="hp-modal-actions">
              <button class="hp-link-btn neutral full" data-a="close-help-modal">Back to Puzzle</button>
            </div>

            <small>Hare Publishing • Cryptogram</small>
          </div>
        </div>
      `;

      bindEvents();

      if ((state.solved || state.revealed) && !state.overlaySeen) {
        showOverlay();
      }

      window.dispatchEvent(new CustomEvent("hare:cryptogram-rendered", {
        detail: { puzzleId, storageKey: STORAGE_KEY }
      }));
    }

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

          if (action === "toggle-hint" || action === "toggle-author") {
            state.usedHint = !state.usedHint;
            state.usedAuthorHint = state.usedHint;
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

    container.addEventListener("click", () => {
      container.focus();
    });

    container.addEventListener("keydown", e => {
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
    });

    window.HareCryptogramEngine.openHelp = function(id = containerId) {
      if (id === containerId) showHelpModal();
    };

    render();
  }
};

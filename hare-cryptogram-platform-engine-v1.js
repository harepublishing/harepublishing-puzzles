window.HareCryptogramEngine = {
  init({ containerId = "hp-cryptogram-container", dataObject } = {}) {
    const BRAND_RED = "#ED1B24";
    const BRAND_GREEN = "#00A54F";
    const THEME_ORANGE = "#F7941C";
    const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const container = document.getElementById(containerId);
    if (!container) return;

    if (container.dataset.hpCryptogramMounted === "true") {
      console.warn("HareCryptogramEngine: this container has already been mounted.");
      return;
    }

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
    const MORE_PUZZLES_URL = data.morePuzzlesUrl || "https://www.harepublishing.com/online-puzzles";
    const SHOP_URL = data.shopUrl || "https://www.harepublishing.com/shop";
    const STORAGE_KEY = data.storageKey || `hp_cg_${puzzleId}`;

    if (!puzzleText || !solutionText) {
      mount.innerHTML = errorCard("Configuration Error: puzzleText and solutionText are required.");
      return;
    }

    injectStyles();

    function errorCard(message) {
      return `
        <div class="hp-crypto-error">
          <strong>${escapeHtml(message)}</strong>
        </div>
      `;
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

    function injectStyles() {
      if (document.getElementById("hp-cryptogram-platform-engine-styles")) return;

      const style = document.createElement("style");
      style.id = "hp-cryptogram-platform-engine-styles";
      style.textContent = `
        #hp-cryptogram-container {
          --hp-cg-primary: #F7941C;
          --hp-cg-primary-light: #FFF4E6;
          --hp-cg-primary-soft: #FFE1B8;
          --hp-cg-primary-dark: #C86E00;
          --hp-cg-success: #00A54F;
          --hp-cg-error: #ED1B24;
          --hp-cg-blue: #0F7FBB;
          --hp-cg-text: #222;
          --hp-cg-muted: #666;
          font-family: Roboto, Arial, sans-serif;
        }

        #hp-cryptogram-container * {
          box-sizing: border-box;
        }

        .hp-crypto-error {
          padding: 20px;
          border: 1px solid #ED1B24;
          background: #fff5f5;
          color: #8a1c1c;
          border-radius: 14px;
          text-align: center;
          font-family: Roboto, Arial, sans-serif;
        }

        .hp-crypto-shell {
          width: 100%;
        }

        .hp-crypto-card {
          background: #fff;
          border: 1px solid #e9eef3;
          border-radius: 18px;
          padding: 26px 22px;
          box-shadow: 0 12px 36px rgba(0,0,0,.07);
          width: 100%;
          overflow: hidden;
        }

        .hp-crypto-tools {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin: 0 0 14px;
        }

        .hp-tool-btn {
          border: 2px solid #bdeed4;
          background: #f3fff9;
          color: var(--hp-cg-success);
          border-radius: 14px;
          padding: 13px 10px;
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
          transition: all .18s ease;
        }

        .hp-tool-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(0,0,0,.08);
        }

        .hp-tool-btn.active {
          background: var(--hp-cg-success);
          border-color: var(--hp-cg-success);
          color: #fff;
        }

        .hp-crypto-author-reveal {
          width: 100%;
          background: #f3fff9;
          border: 1px solid #bdeed4;
          color: #138c45;
          border-radius: 14px;
          padding: 12px 16px;
          text-align: center;
          font-weight: 900;
          margin: 8px 0 18px;
        }

        .hp-crypto-puzzle {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: flex-end;
          gap: 18px 22px;
          margin: 28px auto 28px;
          max-width: 900px;
          line-height: 1;
        }

        .hp-crypto-word {
          display: inline-flex;
          gap: 6px;
          white-space: nowrap;
          align-items: flex-end;
        }

        .hp-crypto-space {
          width: 8px;
        }

        .hp-crypto-char {
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

        .hp-crypto-top {
          min-height: 22px;
          display: block;
          font-size: 18px;
          line-height: 1;
          font-weight: 900;
          color: var(--hp-cg-blue);
          margin-bottom: 5px;
        }

        .hp-crypto-bottom {
          display: block;
          width: 100%;
          border-top: 3px solid #333;
          padding-top: 6px;
          font-size: 16px;
          line-height: 1;
          font-weight: 900;
          color: #444;
        }

        .hp-crypto-char.is-selected .hp-crypto-top,
        .hp-crypto-char.is-selected .hp-crypto-bottom {
          color: var(--hp-cg-primary);
        }

        .hp-crypto-char.is-selected .hp-crypto-bottom {
          border-top-color: var(--hp-cg-primary);
        }

        .hp-crypto-char.is-correct .hp-crypto-top {
          color: var(--hp-cg-success);
        }

        .hp-crypto-char.is-wrong .hp-crypto-top {
          color: var(--hp-cg-error);
        }

        .hp-crypto-punc,
        .hp-crypto-apostrophe {
          display: inline-flex;
          align-items: flex-end;
          justify-content: center;
          min-height: 52px;
          font-size: 22px;
          font-weight: 900;
          color: #333;
          padding: 0 2px 7px;
        }

        .hp-crypto-kb-wrap {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .hp-crypto-status {
          width: 100%;
          margin: 18px auto 18px;
          padding: 14px 18px;
          border-radius: 14px;
          background: #f7f9fb;
          border: 1px solid #dde7ef;
          text-align: center;
        }

        .hp-crypto-status-msg {
          display: block;
          width: 100%;
          font-size: 15px;
          font-weight: 900;
          color: #333;
        }

        .hp-crypto-kb {
          display: grid;
          grid-template-columns: repeat(13, minmax(38px, 1fr));
          gap: 8px;
          margin: 0 auto 14px;
        }

        .hp-crypto-key {
          border: 1px solid #ddd;
          background: #fff;
          color: #222;
          border-radius: 12px;
          min-height: 46px;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
          transition: all .15s ease;
        }

        .hp-crypto-key:hover {
          border-color: var(--hp-cg-primary);
          background: var(--hp-cg-primary-light);
          color: var(--hp-cg-primary-dark);
        }

        .hp-crypto-key.is-used {
          background: #edf6ff;
          border-color: #cfe3f8;
          color: #6e879d;
        }

        .hp-crypto-actions-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          max-width: 620px;
          margin: 0 auto;
        }

        .hp-crypto-secondary {
          border: 1px solid #ddd;
          background: #fff;
          color: #333;
          border-radius: 12px;
          min-height: 44px;
          padding: 10px 12px;
          font-weight: 900;
          cursor: pointer;
          transition: all .15s ease;
        }

        .hp-crypto-secondary:hover {
          background: #f7f9fb;
          transform: translateY(-1px);
        }

        .hp-crypto-secondary.danger {
          border-color: #ffb4b4;
          color: var(--hp-cg-error);
        }

        .hp-crypto-secondary.danger:hover {
          background: #fff5f5;
        }

        .hp-crypto-secondary.reveal {
          border-color: #b9d7ef;
          color: var(--hp-cg-blue);
        }

        .hp-crypto-secondary.reveal:hover {
          background: #f0f8ff;
        }

        .hp-overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(0,0,0,.45);
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .hp-overlay.on {
          display: flex;
        }

        .hp-modal {
          background: #fff;
          width: min(560px, 100%);
          border-radius: 22px;
          padding: 26px;
          box-shadow: 0 20px 70px rgba(0,0,0,.25);
          text-align: center;
          color: #222;
        }

        .hp-modal h3 {
          margin: 10px 0 14px;
          font-size: 26px;
          line-height: 1.15;
          color: var(--hp-cg-primary-dark);
        }

        .hp-modal-lead {
          font-size: 17px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .hp-modal-subtext {
          font-size: 14px;
          color: #555;
          line-height: 1.4;
          margin-bottom: 5px;
        }

        .hp-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin: 10px 0 16px;
        }

        .hp-badge {
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

        .hp-modal-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .hp-link-btn {
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

        .hp-link-btn.primary {
          background: var(--hp-cg-primary);
          color: #fff;
        }

        .hp-link-btn.secondary {
          background: var(--hp-cg-primary-light);
          color: var(--hp-cg-primary-dark);
          border: 1px solid var(--hp-cg-primary-soft);
        }

        .hp-link-btn.neutral {
          background: #f3f5f7;
          color: #333;
        }

        .hp-link-btn.danger {
          background: #fff5f5;
          color: var(--hp-cg-error);
          border: 1px solid #ffb4b4;
        }

        .hp-link-btn.full {
          grid-column: 1 / -1;
        }

        .hp-help-modal-content {
          text-align: left;
          display: grid;
          gap: 10px;
          margin: 14px 0 6px;
        }

        .hp-help-line {
          display: block;
          background: #f7f9fb;
          border: 1px solid #e3e9ef;
          border-radius: 12px;
          padding: 11px 12px;
          font-size: 14px;
          line-height: 1.4;
        }

        .hp-modal small {
          display: block;
          margin-top: 14px;
          color: #777;
          font-size: 12px;
        }

        @media (max-width: 760px) {
          .hp-crypto-card {
            padding: 20px 14px;
          }

          .hp-crypto-tools {
            grid-template-columns: 1fr;
          }

          .hp-crypto-puzzle {
            gap: 14px 16px;
          }

          .hp-crypto-char {
            width: 26px;
          }

          .hp-crypto-top {
            font-size: 16px;
          }

          .hp-crypto-bottom {
            font-size: 14px;
          }

          .hp-crypto-kb {
            grid-template-columns: repeat(7, minmax(34px, 1fr));
          }

          .hp-crypto-actions-row,
          .hp-modal-actions {
            grid-template-columns: 1fr;
          }
        }
      `;

      document.head.appendChild(style);
    }

    (() => {
      const existing = document.getElementById("hp-crypto-schema");
      if (existing) existing.remove();

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Game",
        "name": puzzleTitle,
        "description": `Play and solve ${puzzleTitle} by Hare Publishing. Match cipher letters to plain letters, use hints, and save your progress automatically.`,
        "genre": "Word Puzzle",
        "url": window.location.href,
        "inLanguage": "en",
        "numberOfPlayers": "1",
        "publisher": {
          "@type": "Organization",
          "name": "Hare Publishing",
          "url": "https://www.harepublishing.com/"
        }
      };

      const script = document.createElement("script");
      script.id = "hp-crypto-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    })();

    function defaultState() {
      return {
        mappings: {},
        selectedCipher: "",
        usedHints: Array(hints.length).fill(false),
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

        merged.usedHints = Array.isArray(merged.usedHints)
          ? merged.usedHints.slice(0, hints.length).concat(Array(Math.max(0, hints.length - merged.usedHints.length)).fill(false))
          : Array(hints.length).fill(false);

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

    function countUsedHints() {
      return state.usedHints.filter(Boolean).length;
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

    function clearSelectedLetter() {
      if (!state.selectedCipher || isFinished()) return;
      delete state.mappings[state.selectedCipher];
      state.checked = false;
      saveState();
      render();
    }

    function clearAll() {
      if (isFinished()) return;
      if (!confirm("Clear all current letter mappings?")) return;

      state.mappings = {};
      state.selectedCipher = "";
      state.checked = false;
      state.solved = false;
      state.revealed = false;
      state.solvedAt = "";
      state.revealedAt = "";
      state.overlaySeen = false;

      saveState();
      render();
    }

    function resetPuzzle() {
      if (!confirm("Reset this cryptogram puzzle?")) return;
      state = defaultState();
      saveState();
      hideOverlay();
      hideHelpModal();
      render();
    }

    function applyMapping(cipher, plain) {
      cipher = upper(cipher);
      plain = upper(plain);

      if (!isLetter(cipher) || !isLetter(plain)) return;
      if (isFinished()) return;

      Object.keys(state.mappings).forEach(key => {
        if (state.mappings[key] === plain && key !== cipher) {
          delete state.mappings[key];
        }
      });

      state.mappings[cipher] = plain;
      state.checked = false;
      state.revealed = false;
      state.revealedAt = "";

      if (puzzleSolved()) {
        state.solved = true;
        state.checked = true;
        if (!state.solvedAt) state.solvedAt = new Date().toISOString();
        state.overlaySeen = false;
      } else {
        state.solved = false;
      }

      saveState();
      render();

      if (state.solved) showOverlay();
    }

    function useHint(idx) {
      if (idx < 0 || idx >= hints.length) return;
      if (isFinished()) return;

      const hint = hints[idx];
      const isTurningOff = Boolean(state.usedHints[idx]);

      state.usedHints[idx] = !isTurningOff;

      if (hint.type === "mapping") {
        const cipher = upper(hint.cipher);
        const plain = upper(hint.plain);

        if (isTurningOff) {
          if (state.mappings[cipher] === plain) {
            delete state.mappings[cipher];
          }

          state.checked = false;
          state.solved = false;
          state.solvedAt = "";
          saveState();
          render();
          return;
        }

        saveState();
        applyMapping(cipher, plain);
        return;
      }

      saveState();
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
          const msg = mount.querySelector(".hp-crypto-status-msg");
          if (msg) msg.textContent = "Link copied!";
        }).catch(() => {});
      }
    }

    function renderTopControls() {
      return `
        <div class="hp-puzzle-tools hp-crypto-tools" aria-label="Cryptogram hints">
          ${hints.map((hint, idx) => {
            let label = hint.label || `Hint ${idx + 1}`;

            if (state.usedHints[idx] && hint.type === "mapping") {
              label = `${label}: ${hint.cipher} = ${hint.plain}`;
            }

            return `
              <button
                type="button"
                class="hp-tool-btn hint-toggle${state.usedHints[idx] ? " active" : ""}"
                data-hint="${idx}"
                aria-pressed="${state.usedHints[idx] ? "true" : "false"}">
                ${escapeHtml(label)}
              </button>
            `;
          }).join("")}
        </div>
      `;
    }

    function renderAuthorReveal() {
      const idx = hints.findIndex(h => h.type === "author");
      if (idx === -1 || !state.usedHints[idx]) return "";

      return `
        <div class="hp-crypto-author-reveal">
          <strong>Author:</strong> ${escapeHtml(hints[idx].value)}
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

    function renderKeyboard() {
      const used = getUsedPlainLetters();

      return `
        <div class="hp-crypto-kb-wrap">
          <div class="hp-crypto-status">
            <span class="hp-crypto-status-msg">${escapeHtml(statusMessage())}</span>
          </div>

          <div class="hp-crypto-kb">
            ${ALPHA.split("").map(letter => `
              <button type="button" class="hp-crypto-key${used.includes(letter) ? " is-used" : ""}" data-plain="${letter}">
                ${letter}
              </button>
            `).join("")}
          </div>

          <div class="hp-crypto-actions-row">
            <button type="button" class="hp-crypto-secondary" data-a="clear-selected">Clear Selected</button>
            <button type="button" class="hp-crypto-secondary" data-a="check">Check Progress</button>
            <button type="button" class="hp-crypto-secondary danger" data-a="clear-all">Clear All</button>
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
            ${renderTopControls()}
            ${renderAuthorReveal()}
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
              <button class="hp-link-btn danger full" data-a="reset-puzzle">Reset Puzzle</button>
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
              <span class="hp-help-line"><strong>Check Progress</strong> highlights correct letters in green and incorrect letters in red.</span>
              <span class="hp-help-line"><strong>Hints</strong> can reveal a letter mapping or the quote author.</span>
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
          applyMapping(state.selectedCipher, btn.getAttribute("data-plain") || "");
        });
      });

      mount.querySelectorAll("[data-hint]").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-hint"), 10);
          useHint(idx);
        });
      });

      mount.querySelectorAll("[data-a]").forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.getAttribute("data-a");
          if (action === "clear-selected") clearSelectedLetter();
          if (action === "clear-all") clearAll();
          if (action === "check") checkProgress();
          if (action === "share") shareResult();
          if (action === "reveal-answer") revealSolution();
          if (action === "reset-puzzle") resetPuzzle();
          if (action === "close-overlay") hideOverlay();
          if (action === "close-help-modal") hideHelpModal();
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
          applyMapping(state.selectedCipher, key);
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
        clearSelectedLetter();
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

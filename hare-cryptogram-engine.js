window.HareCryptogramEngine = {
  init({ containerId = "hp-cryptogram-container", dataObject } = {}) {
    const BRAND_RED = "#ED1B24";
    const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const container = document.getElementById(containerId);
    if (!container) return;

    if (container.dataset.hpCryptogramMounted === "true") {
      console.warn("HareCryptogramEngine: this container has already been mounted.");
      return;
    }
    container.dataset.hpCryptogramMounted = "true";

    const mount = container.querySelector(".hp-mount") || container;
    if (!mount) return;

    const yearEl = container.querySelector("#hp-year") || document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const data = dataObject || window.HareCryptogramData;

    if (!data) {
      mount.innerHTML = `<div class="hp-crypto-card" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;"><strong>Configuration Error:</strong> Cryptogram puzzle data is missing.</div>`;
      return;
    }

    const puzzleId = String(data.puzzleId || "1");
    const puzzleTitle = data.puzzleTitle || `Cryptogram #${puzzleId}`;
    const puzzleDate = formatPuzzleDate(data.puzzleDate || data.date || "");
    const puzzleText = String(data.puzzleText || data.cipherText || "");
    const solutionText = String(data.solutionText || data.solution || "");
    const hints = Array.isArray(data.hints) ? data.hints : [];
    const MORE_PUZZLES_URL = data.morePuzzlesUrl || "https://www.harepublishing.com/online-puzzles";
    const SHOP_URL = data.shopUrl || "https://www.harepublishing.com/shop";
    const STORAGE_KEY = data.storageKey || `hp_cg_${puzzleId}`;

    if (!puzzleText || !solutionText) {
      mount.innerHTML = `<div class="hp-crypto-card" style="border-color:${BRAND_RED}; background:#fff5f5; color:#8a1c1c;"><strong>Configuration Error:</strong> Cryptogram puzzleText and solutionText are required.</div>`;
      return;
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

        if (typeof merged.solvedAt !== "string") merged.solvedAt = "";
        if (typeof merged.revealedAt !== "string") merged.revealedAt = "";
        if (typeof merged.overlaySeen !== "boolean") merged.overlaySeen = false;

        return merged;
      } catch {
        return defaultState();
      }
    }

    let state = loadState();

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

    function countUniqueCipherLetters() {
      const p = upper(puzzleText);
      const set = new Set();

      for (let i = 0; i < p.length; i++) {
        if (isLetter(p[i])) set.add(p[i]);
      }

      return set.size;
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
          // Only remove the hint's mapping if it is still the same mapping
          // the hint originally supplied. If the player changed it manually,
          // leave their current entry alone.
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

    function renderStats() {
      const counts = countSolvedLetters();
      const usedHints = countUsedHints();

      return `
        <div class="hp-crypto-stats" aria-label="Cryptogram progress">
          <div class="hp-crypto-stat">
            <span class="hp-crypto-stat-value">${counts.correct}/${counts.total}</span>
            <span class="hp-crypto-stat-label">Correct</span>
          </div>
          <div class="hp-crypto-stat">
            <span class="hp-crypto-stat-value">${counts.left}</span>
            <span class="hp-crypto-stat-label">Left</span>
          </div>
          <div class="hp-crypto-stat">
            <span class="hp-crypto-stat-value">${usedHints}/${hints.length}</span>
            <span class="hp-crypto-stat-label">Hints Used</span>
          </div>
        </div>

        <div class="hp-crypto-progress" aria-label="${counts.percent}% complete">
          <span class="hp-crypto-progress-fill" style="width:${counts.percent}%"></span>
        </div>
      `;
    }

    function renderTopControls() {
      return `
        <div class="hp-puzzle-tools hp-crypto-tools" aria-label="Cryptogram puzzle controls">
          <button type="button" class="hp-tool-btn help-info" data-a="open-help-modal">Help</button>
          ${hints.map((hint, idx) => {
            let label = hint.label || `Hint ${idx + 1}`;

            if (state.usedHints[idx] && hint.type === "mapping") {
              label = `${label}: ${hint.cipher} = ${hint.plain}`;
            }

            // Author hints stay labelled as Hint 3 in the button.
            // The author name appears only in the green reveal panel.
            return `<button type="button" class="hp-tool-btn hint-toggle${state.usedHints[idx] ? " active" : ""}" data-hint="${idx}" aria-pressed="${state.usedHints[idx] ? "true" : "false"}">${escapeHtml(label)}</button>`;
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
      if (state.revealed) return "Answer revealed. Try another Daily Brain Boost puzzle when you are ready.";
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
          <div class="hp-modal-lead">Congratulations — you did it!</div>
          <div class="hp-modal-subtext">Great job cracking this quote.</div>
          <div class="hp-modal-subtext">New puzzles are added daily in the Puzzlers Hub.</div>
        `;
        return;
      }

      if (state.revealed) {
        overlayIconEl.textContent = "📘";
        overlayTitleEl.textContent = "Answer Revealed";
        overlayTextEl.innerHTML = `
          <div class="hp-modal-lead">Here is the completed quote.</div>
          <div class="hp-modal-subtext">Now that you've seen the answer, try another Daily Brain Boost puzzle.</div>
          <div class="hp-modal-subtext">Or explore a whole stack of puzzles to enjoy offline.</div>
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
      const uniqueCipherCount = countUniqueCipherLetters();

      mount.innerHTML = `
        ${puzzleDate ? `<div class="hp-puzzle-date">${escapeHtml(puzzleDate)}</div>` : ""}

        <div class="hp-crypto-shell">
          <div class="hp-crypto-card">
            ${renderStats()}
            ${renderTopControls()}
            ${renderAuthorReveal()}

            <div class="hp-crypto-meta-row">
              <span class="hp-badge">${uniqueCipherCount} cipher letters</span>
            </div>

            ${renderPuzzle()}
            ${renderKeyboard()}
          </div>
        </div>

        <div class="hp-overlay" id="hp-crypto-overlay" aria-hidden="true">
          <div class="hp-modal" role="dialog" aria-modal="true" aria-label="Cryptogram result">
            <div id="hp-crypto-overlay-icon" style="font-size:28px; line-height:1;">🎉</div>
            <h3 id="hp-crypto-overlay-title">You Solved the Cryptogram!</h3>

            <div class="hp-badges">
              <span class="hp-badge" id="hp-crypto-badge-id"></span>
              <span class="hp-badge" id="hp-crypto-badge-meta"></span>
            </div>

            <div id="hp-crypto-overlay-text">
              <div class="hp-modal-lead">Congratulations — you did it!</div>
              <div class="hp-modal-subtext">Great job cracking this quote.</div>
              <div class="hp-modal-subtext">New puzzles are added daily in the Puzzlers Hub.</div>
            </div>

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
          if (action === "open-help-modal") showHelpModal();
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

    render();
  }
};

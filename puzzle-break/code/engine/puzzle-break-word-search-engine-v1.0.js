/*
 * Hare Publishing Puzzle Break Word Search engine v1.0
 * Derived from the Puzzlers Hub Word Search interaction model.
 * Standalone, container-scoped, analytics-free, and memory-only.
 */
(function () {
  "use strict";

  window.HarePuzzleBreakEngines = window.HarePuzzleBreakEngines || {};

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function cleanWord(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
  }

  function canonicalPathKey(path) {
    const forward = path.map(point => `${point.row},${point.col}`).join("|");
    const backward = [...path].reverse().map(point => `${point.row},${point.col}`).join("|");
    return forward < backward ? forward : backward;
  }

  function pathForPlacement(placement) {
    const word = cleanWord(placement.word);
    return Array.from({ length: word.length }, (_, index) => ({
      row: Number(placement.row) + Number(placement.dr) * index,
      col: Number(placement.col) + Number(placement.dc) * index
    }));
  }

  function pathBetween(start, end) {
    const rowDistance = end.row - start.row;
    const colDistance = end.col - start.col;
    const straight = rowDistance === 0 || colDistance === 0 || Math.abs(rowDistance) === Math.abs(colDistance);
    if (!straight) return [];
    const rowStep = rowDistance === 0 ? 0 : rowDistance / Math.abs(rowDistance);
    const colStep = colDistance === 0 ? 0 : colDistance / Math.abs(colDistance);
    const length = Math.max(Math.abs(rowDistance), Math.abs(colDistance));
    return Array.from({ length: length + 1 }, (_, index) => ({
      row: start.row + rowStep * index,
      col: start.col + colStep * index
    }));
  }

  function directionLabel(placement) {
    return ({
      "-1,-1": "Up left ↖", "-1,0": "Up ↑", "-1,1": "Up right ↗",
      "0,-1": "Left ←", "0,1": "Right →",
      "1,-1": "Down left ↙", "1,0": "Down ↓", "1,1": "Down right ↘"
    })[`${placement.dr},${placement.dc}`] || "Unknown";
  }

  function mount({ container, record, links }) {
    const source = record && (record.puzzle || record);
    const grid = source && Array.isArray(source.grid)
      ? source.grid.map(row => cleanWord(row))
      : [];
    const rowCount = grid.length;
    const colCount = rowCount ? grid[0].length : 0;
    const rawPlacements = source && Array.isArray(source.placements) ? source.placements : [];
    const displayWords = source && Array.isArray(source.words) ? source.words.map(String) : [];

    if (!rowCount || !colCount || grid.some(row => row.length !== colCount)) {
      throw new Error("Word Search grid must contain equal-length rows.");
    }

    const placements = rawPlacements.map((raw, index) => {
      const word = cleanWord(raw.word);
      const path = pathForPlacement(raw);
      const display = String(raw.display || displayWords[index] || raw.word || word);
      return {
        word,
        display,
        row: Number(raw.row),
        col: Number(raw.col),
        dr: Number(raw.dr),
        dc: Number(raw.dc),
        path,
        key: canonicalPathKey(path)
      };
    });

    const placementIsValid = placement => placement.word && placement.path.every((point, index) => (
      point.row >= 0 && point.row < rowCount &&
      point.col >= 0 && point.col < colCount &&
      grid[point.row][point.col] === placement.word[index]
    ));
    if (!placements.length || !placements.every(placementIsValid)) {
      throw new Error("Word Search placements do not match the grid.");
    }

    const placementByPath = new Map(placements.map(placement => [placement.key, placement]));
    const placementByWord = new Map(placements.map(placement => [placement.word, placement]));
    const state = {
      foundWords: new Set(),
      foundPaths: new Set(),
      anchor: null,
      selectedAssistWord: "",
      directionAssist: false,
      firstLetterAssist: false,
      assistOpen: false,
      solved: false,
      revealed: false,
      status: ""
    };
    let lastFocused = null;

    const recordId = record.id != null ? record.id : record.puzzleId;
    const recordTitle = record.title || `Word Search Puzzle #${recordId}`;

    container.classList.add("pb-player", "pb-word-search");
    container.setAttribute("tabindex", "-1");
    container.innerHTML = `
      <section class="pb-card" aria-label="${escapeHtml(recordTitle)}">
        <header class="pb-header">
          <p class="pb-kicker">Puzzle Break</p>
          <h2 class="pb-title">${escapeHtml(recordTitle)}</h2>
          ${record.theme ? `<p class="pb-theme">${escapeHtml(record.theme)}</p>` : ""}
          <p class="pb-instructions">${escapeHtml(record.instructions || "Find every hidden word. Select its first letter, then its last letter.")}</p>
        </header>

        <div class="pb-toolbar" aria-label="Puzzle controls">
          <button type="button" class="pb-button pb-button--tool" data-pb-action="help">Help</button>
          <button type="button" class="pb-button pb-button--tool" data-pb-action="assist" aria-expanded="false">Assist</button>
          <button type="button" class="pb-button pb-button--tool" data-pb-action="reset">Start Over</button>
          <button type="button" class="pb-button pb-button--reveal" data-pb-action="reveal">Reveal Answers</button>
        </div>

        <div class="pb-assist" data-pb-part="assist" hidden>
          <p>Select a word, then choose the help you want.</p>
          <div class="pb-assist-options">
            <button type="button" class="pb-button pb-button--small" data-pb-action="assist-direction" aria-pressed="false">Word Direction</button>
            <button type="button" class="pb-button pb-button--small" data-pb-action="assist-letter" aria-pressed="false">Show First Letter</button>
          </div>
        </div>

        <p class="pb-status" data-pb-part="status" aria-live="polite"></p>

        <div class="pb-ws-layout">
          <div class="pb-ws-board-panel">
            <div class="pb-ws-board" data-pb-part="board" role="grid" aria-label="Word Search grid"></div>
          </div>
          <aside class="pb-ws-word-panel" aria-label="Words to find">
            <div class="pb-ws-word-heading">
              <h3>Word List</h3>
              <span data-pb-part="count"></span>
            </div>
            <div class="pb-ws-word-list" data-pb-part="words"></div>
          </aside>
        </div>
      </section>

      <div class="pb-modal-backdrop" data-pb-part="help-modal" hidden>
        <div class="pb-modal" role="dialog" aria-modal="true" aria-label="How to play Word Search">
          <button type="button" class="pb-modal-close" data-pb-action="close-help" aria-label="Close help">×</button>
          <h3>How to play</h3>
          <p>Select the first letter of a hidden word, then select its last letter.</p>
          <p>Words may run horizontally, vertically, diagonally, forward, or backward.</p>
          <p>Assist can show a selected word’s direction or highlight its possible first letters.</p>
          <button type="button" class="pb-button pb-button--primary" data-pb-action="close-help">Back to Puzzle</button>
        </div>
      </div>

      <div class="pb-modal-backdrop" data-pb-part="result-modal" hidden>
        <div class="pb-modal pb-result" role="dialog" aria-modal="true" aria-label="Puzzle result">
          <button type="button" class="pb-modal-close" data-pb-action="close-result" aria-label="Close result">×</button>
          <div class="pb-result-icon" data-pb-part="result-icon" aria-hidden="true"></div>
          <p class="pb-result-label" data-pb-part="result-label"></p>
          <h3 data-pb-part="result-heading"></h3>
          <p data-pb-part="result-copy"></p>
          <div class="pb-result-actions">
            <a class="pb-button pb-button--primary" href="${escapeHtml(links.today)}">Play Today’s Puzzles Free</a>
            <a class="pb-button pb-button--secondary" href="${escapeHtml(links.membership)}">Become a Member</a>
          </div>
        </div>
      </div>
    `;

    const part = name => container.querySelector(`[data-pb-part="${name}"]`);
    const boardElement = part("board");
    const wordsElement = part("words");
    const statusElement = part("status");
    const countElement = part("count");
    const assistElement = part("assist");
    const helpModal = part("help-modal");
    const resultModal = part("result-modal");

    boardElement.style.setProperty("--pb-ws-columns", String(colCount));

    function finished() {
      return state.solved || state.revealed;
    }

    function statusText() {
      if (state.status) return state.status;
      if (state.solved) return "Word Search solved!";
      if (state.revealed) return "Answers revealed.";
      if (state.anchor) return "First letter selected. Now select the last letter.";
      if (state.selectedAssistWord) {
        const placement = placementByWord.get(state.selectedAssistWord);
        const details = [`Selected: ${placement.display}`];
        if (state.directionAssist) details.push(`Direction: ${directionLabel(placement)}`);
        if (state.firstLetterAssist) details.push(`Look for the letter ${placement.word[0]}.`);
        return details.join(" • ");
      }
      return "Select the first letter, then the last letter of a hidden word.";
    }

    function cellClasses(row, col) {
      const classes = ["pb-ws-cell"];
      if (state.anchor && state.anchor.row === row && state.anchor.col === col && !finished()) classes.push("is-anchor");

      let found = false;
      let revealed = false;
      placements.forEach(placement => {
        if (!placement.path.some(point => point.row === row && point.col === col)) return;
        if (state.foundPaths.has(placement.key)) {
          if (state.revealed) revealed = true;
          else found = true;
        }
      });
      if (found) classes.push("is-found");
      if (revealed) classes.push("is-revealed");

      const assisted = state.firstLetterAssist && state.selectedAssistWord;
      if (assisted && grid[row][col] === state.selectedAssistWord[0] && !finished()) classes.push("is-assist-letter");
      return classes.join(" ");
    }

    function renderBoard() {
      boardElement.innerHTML = grid.map((row, rowIndex) => [...row].map((letter, colIndex) => `
        <button type="button" role="gridcell" class="${cellClasses(rowIndex, colIndex)}"
          data-row="${rowIndex}" data-col="${colIndex}"
          aria-label="Row ${rowIndex + 1}, column ${colIndex + 1}, letter ${letter}">${letter}</button>
      `).join("")).join("");
    }

    function renderWords() {
      wordsElement.innerHTML = placements.slice().sort((a, b) => a.display.localeCompare(b.display)).map(placement => {
        const found = state.foundWords.has(placement.word);
        const classes = ["pb-ws-word"];
        if (found) classes.push(state.revealed ? "is-revealed" : "is-found");
        if (!found && state.selectedAssistWord === placement.word) classes.push("is-selected");
        return `<button type="button" class="${classes.join(" ")}" data-word="${escapeHtml(placement.word)}"${found ? " disabled" : ""}>
          <span aria-hidden="true">${found ? (state.revealed ? "◉" : "✓") : ""}</span>${escapeHtml(placement.display)}
        </button>`;
      }).join("");
      countElement.textContent = `${state.foundWords.size}/${placements.length} found`;
    }

    function renderControls() {
      statusElement.textContent = statusText();
      assistElement.hidden = !state.assistOpen;
      const assistButton = container.querySelector('[data-pb-action="assist"]');
      assistButton.setAttribute("aria-expanded", String(state.assistOpen));
      container.querySelector('[data-pb-action="assist-direction"]').setAttribute("aria-pressed", String(state.directionAssist));
      container.querySelector('[data-pb-action="assist-letter"]').setAttribute("aria-pressed", String(state.firstLetterAssist));
    }

    function render() {
      renderBoard();
      renderWords();
      renderControls();
    }

    function reset() {
      if ((state.foundWords.size || state.revealed || state.solved) && !window.confirm("Start this Word Search over?")) return;
      state.foundWords.clear();
      state.foundPaths.clear();
      state.anchor = null;
      state.selectedAssistWord = "";
      state.directionAssist = false;
      state.firstLetterAssist = false;
      state.assistOpen = false;
      state.solved = false;
      state.revealed = false;
      state.status = "Puzzle restarted.";
      closeModal(resultModal);
      render();
    }

    function reveal() {
      if (finished()) return;
      if (!window.confirm("Reveal all answers? This will end the puzzle.")) return;
      placements.forEach(placement => {
        state.foundWords.add(placement.word);
        state.foundPaths.add(placement.key);
      });
      state.anchor = null;
      state.selectedAssistWord = "";
      state.solved = false;
      state.revealed = true;
      state.status = "";
      render();
      showResult();
    }

    function selectCell(row, col) {
      if (finished()) return;
      state.status = "";
      const selected = { row, col };
      if (!state.anchor) {
        state.anchor = selected;
        render();
        return;
      }
      if (state.anchor.row === row && state.anchor.col === col) {
        state.anchor = null;
        render();
        return;
      }

      const path = pathBetween(state.anchor, selected);
      const placement = placementByPath.get(canonicalPathKey(path));
      if (!path.length || !placement || state.foundWords.has(placement.word)) {
        state.anchor = selected;
        state.status = placement ? "That word is already found." : "No hidden word there. A new first letter is selected.";
        render();
        return;
      }

      state.foundWords.add(placement.word);
      state.foundPaths.add(placement.key);
      state.anchor = null;
      state.selectedAssistWord = placement.word;
      state.status = `Great job—you found ${placement.display}!`;
      if (state.foundWords.size === placements.length) state.solved = true;
      render();
      if (state.solved) showResult();
    }

    function selectAssistWord(word) {
      if (finished() || state.foundWords.has(word)) return;
      state.selectedAssistWord = word;
      state.status = "";
      render();
    }

    function openModal(modal) {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.classList.add("pb-modal-open");
      window.requestAnimationFrame(() => modal.querySelector("button, a")?.focus());
    }

    function closeModal(modal) {
      modal.hidden = true;
      if (!container.querySelector(".pb-modal-backdrop:not([hidden])")) document.body.classList.remove("pb-modal-open");
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }

    function showResult() {
      part("result-icon").textContent = state.solved ? "✓" : "◉";
      part("result-label").textContent = state.solved ? "Solved" : "Revealed";
      part("result-heading").textContent = state.solved ? "Nicely solved!" : "Answers revealed.";
      part("result-copy").textContent = state.solved
        ? "Ready for another challenge?"
        : "Ready to try another puzzle?";
      openModal(resultModal);
    }

    container.addEventListener("click", event => {
      const cell = event.target.closest("[data-row][data-col]");
      if (cell && container.contains(cell)) {
        selectCell(Number(cell.dataset.row), Number(cell.dataset.col));
        return;
      }

      const wordButton = event.target.closest("[data-word]");
      if (wordButton && container.contains(wordButton)) {
        selectAssistWord(wordButton.dataset.word);
        return;
      }

      const actionButton = event.target.closest("[data-pb-action]");
      if (!actionButton || !container.contains(actionButton)) return;
      const action = actionButton.dataset.pbAction;
      if (action === "help") openModal(helpModal);
      if (action === "close-help") closeModal(helpModal);
      if (action === "close-result") closeModal(resultModal);
      if (action === "reset") reset();
      if (action === "reveal") reveal();
      if (action === "assist") {
        state.assistOpen = !state.assistOpen;
        renderControls();
      }
      if (action === "assist-direction") {
        state.directionAssist = !state.directionAssist;
        state.status = "";
        render();
      }
      if (action === "assist-letter") {
        state.firstLetterAssist = !state.firstLetterAssist;
        state.status = "";
        render();
      }
    });

    [helpModal, resultModal].forEach(modal => modal.addEventListener("click", event => {
      if (event.target === modal) closeModal(modal);
    }));
    container.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if (!helpModal.hidden) closeModal(helpModal);
      else if (!resultModal.hidden) closeModal(resultModal);
      else if (state.anchor || state.assistOpen) {
        state.anchor = null;
        state.assistOpen = false;
        state.status = "Selection cleared.";
        render();
      }
    });

    render();
  }

  window.HarePuzzleBreakEngines["word-search"] = Object.freeze({ mount });
})();

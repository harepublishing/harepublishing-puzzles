window.HarePuzzleMenuConfig = {
  googleAppsScriptUrl: "PASTE YOUR GOOGLE APPS SCRIPT URL HERE"
};

(() => {

  if (window.HarePuzzleMenuLoaded) return;
  window.HarePuzzleMenuLoaded = true;

  const CONFIG = window.HarePuzzleMenuConfig || {};
  const ENDPOINT = CONFIG.googleAppsScriptUrl || "";

  const PUZZLE_CONTAINERS = [
    "#hp-sudoku-container",
    "#hp-daily-sudoku-container",
    "#hp-wordrow-container",
    "#hp-wordflower-container",
    "#hp-cryptogram-container",
    "#hp-wordsearch-container",
    "#hp-krisskross-container",
    "#hp-wordscramble-container"
  ];

  function detectPuzzleType() {

    const found = PUZZLE_CONTAINERS.find(sel =>
      document.querySelector(sel)
    );

    if (!found) return "Unknown";

    return found
      .replace("#hp-", "")
      .replace("-container", "");
  }

  function detectPuzzleMeta() {

    const sources = [
      { type: "cryptogram", data: window.HareCryptogramData },
      { type: "kriss-kross", data: window.HareKrissKrossData },
      { type: "wordrow", data: window.HareWordrowData },
      { type: "word-flower", data: window.HareWordFlowerData },
      { type: "word-search", data: window.HareWordSearchData },
      { type: "word-scramble", data: window.HareWordScrambleData },
      { type: "sudoku", data: window.HareRegularSudokuData },
      { type: "daily-sudoku-challenge", data: window.HareDailySudokuData }
    ];

    const detected = sources.find(source =>
      source.data && typeof source.data === "object"
    );

    const data = detected?.data || {};

    return {
      submissionType: "",
      puzzleType: detected?.type || detectPuzzleType(),
      puzzleId: data.puzzleId || data.id || "Unknown",
      puzzleTitle:
        data.puzzleTitle ||
        data.title ||
        document.querySelector("h1")?.textContent?.trim() ||
        document.title ||
        "Hare Publishing Puzzle",
      puzzleDate:
        data.puzzleDate ||
        data.date ||
        "Unknown",
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  function closeModal() {

    const overlay = document.getElementById("hp-puzzle-menu-overlay");

    if (!overlay) return;

    overlay.classList.remove("on");
  }

  async function sendSubmission(type) {

    const textarea = document.getElementById("hppm-message-text");
    const status = document.getElementById("hppm-message-status");

    const message = textarea?.value?.trim();

    if (!message) {
      status.textContent = "Please enter a short message first.";
      return;
    }

    const payload = {
      ...detectPuzzleMeta(),
      submissionType: type,
      message
    };

    try {

      await fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      status.textContent =
        type === "BUG"
          ? "Thank you — your report was sent."
          : "Thank you — your feedback was sent.";

      textarea.value = "";

    } catch {

      status.textContent =
        "Sorry, your message could not be sent.";
    }
  }

  function openModal(kind) {

    const overlay = document.getElementById("hp-puzzle-menu-overlay");
    const body = document.getElementById("hp-puzzle-menu-body");

    if (!overlay || !body) return;

    if (kind === "stats") {

      body.innerHTML = `
        <div class="hppm-icon">🏆</div>

        <h2>Your Puzzle Stats</h2>

        <p class="hppm-note">
          Puzzle stats integration coming soon.
        </p>
      `;
    }

    if (kind === "bug") {

      body.innerHTML = `
        <div class="hppm-icon">🐞</div>

        <h2>Report a Bug</h2>

        <p class="hppm-note">
          Tell us what went wrong with this puzzle.
        </p>

        <textarea
          id="hppm-message-text"
          rows="5"
          placeholder="Briefly describe the problem..."
        ></textarea>

        <button class="hppm-primary" id="hppm-send-message">
          Send Report
        </button>

        <p class="hppm-small" id="hppm-message-status"></p>
      `;

      document.getElementById("hppm-send-message").onclick = () => {
        sendSubmission("BUG");
      };
    }

    if (kind === "feedback") {

      body.innerHTML = `
        <div class="hppm-icon">💬</div>

        <h2>Share Feedback</h2>

        <p class="hppm-note">
          Tell us what you think about this puzzle or the Puzzlers Hub.
        </p>

        <textarea
          id="hppm-message-text"
          rows="5"
          placeholder="Share your thoughts..."
        ></textarea>

        <button class="hppm-primary" id="hppm-send-message">
          Send Feedback
        </button>

        <p class="hppm-small" id="hppm-message-status"></p>
      `;

      document.getElementById("hppm-send-message").onclick = () => {
        sendSubmission("FEEDBACK");
      };
    }

    overlay.classList.add("on");
  }

  function buildMenu() {

    const puzzle = PUZZLE_CONTAINERS
      .map(sel => document.querySelector(sel))
      .find(Boolean);

    if (!puzzle || document.getElementById("hp-puzzle-menu-wrap")) return;

    const wrapper = document.createElement("div");

    wrapper.id = "hp-puzzle-menu-wrap";

    wrapper.innerHTML = `
      <div id="hp-puzzle-menu">

        <button type="button" data-hppm="stats">
          📊 <span>Stats</span>
        </button>

        <button type="button" data-hppm="bug">
          🐞 <span>Report Bug</span>
        </button>

        <button type="button" data-hppm="feedback">
          💬 <span>Feedback</span>
        </button>

      </div>
    `;

    puzzle.parentNode.insertBefore(wrapper, puzzle);

    document.body.insertAdjacentHTML("beforeend", `
      <div id="hp-puzzle-menu-overlay">

        <div class="hppm-modal">

          <button type="button" class="hppm-close">
            ×
          </button>

          <div id="hp-puzzle-menu-body"></div>

        </div>

      </div>
    `);

    wrapper.addEventListener("click", e => {

      const btn = e.target.closest("[data-hppm]");

      if (!btn) return;

      openModal(btn.dataset.hppm);
    });

    document.querySelector(".hppm-close").onclick = closeModal;

    document
      .getElementById("hp-puzzle-menu-overlay")
      .addEventListener("click", e => {

        if (e.target.id === "hp-puzzle-menu-overlay") {
          closeModal();
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildMenu);
  } else {
    buildMenu();
  }

})();

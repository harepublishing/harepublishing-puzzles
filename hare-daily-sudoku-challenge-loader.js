(() => {

  // =========================================================
  // DAILY SUDOKU CHALLENGE LOADER
  // Hare Publishing
  // =========================================================

  const ENGINE_URL =

    "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@main/hare-daily-sudoku-challenge-engine-v3.js";

  if (window.__hpDailySudokuChallengeLoaderRunning) return;

  window.__hpDailySudokuChallengeLoaderRunning = true;

  function renderPuzzleDate() {

    const container = document.getElementById("hp-sudoku-container");

    const dataEl = document.getElementById("hp-puzzle-data");

    if (!container || !dataEl) return;

    try {

      const data = JSON.parse(dataEl.textContent.trim());

      if (!data.date) return;

      const oldDate = document.getElementById("hp-dsc-date");

      if (oldDate) oldDate.remove();

      const d = new Date(data.date + "T00:00:00");

      const formatted = d.toLocaleDateString(undefined, {

        weekday: "long",

        year: "numeric",

        month: "long",

        day: "numeric"

      });

      const dateEl = document.createElement("div");

      dateEl.id = "hp-dsc-date";

      dateEl.style.cssText = `

        text-align:center;

        font-size:15px;

        color:#6b7280;

        margin:0 auto 16px;

        font-family:Roboto,sans-serif;

      `;

      dateEl.textContent = formatted;

      container.insertBefore(dateEl, container.firstChild);

    } catch (err) {

      console.error("Could not display Daily Sudoku Challenge date.", err);

    }

  }

  renderPuzzleDate();

  const script = document.createElement("script");

  script.src = ENGINE_URL;

  script.onload = () => {

    if (!window.HareDailySudokuChallengeEngine) {

      console.error("Daily Sudoku Challenge engine failed to initialize.");

      return;

    }

    window.HareDailySudokuChallengeEngine.init({

      containerId: "hp-sudoku-container",

      dataId: "hp-puzzle-data"

    });

  };

  script.onerror = () => {

    console.error("Could not load Daily Sudoku Challenge engine.");

  };

  document.head.appendChild(script);

})();

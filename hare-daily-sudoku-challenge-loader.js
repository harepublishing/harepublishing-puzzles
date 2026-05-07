(() => {

  // =========================================================
  // DAILY SUDOKU CHALLENGE LOADER
  // Hare Publishing
  // =========================================================

  const ENGINE_URL =
    "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@main/hare-daily-sudoku-challenge-engine-v2.js";

  // Prevent duplicate loading
  if (window.__hpDailySudokuChallengeLoaderRunning) return;
  window.__hpDailySudokuChallengeLoaderRunning = true;

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

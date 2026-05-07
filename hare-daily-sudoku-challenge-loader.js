(() => {
  const ENGINE_URL =
    "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@main/hare-daily-sudoku-challenge-engine-v3.js";

  const existing = document.querySelector('script[data-hp-dsc-engine="true"]');
  if (existing) return;

  const script = document.createElement("script");
  script.src = ENGINE_URL;
  script.dataset.hpDscEngine = "true";

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

/* =========================================================
   HARE PUBLISHING REGULAR SUDOKU LOADER
   For Easy, Medium & Hard Sudoku puzzles
   GitHub/jsDelivr hosted loader file

   Suggested filename:
   hare-regular-sudoku-loader.js

   Purpose:
   - Loads the regular Sudoku engine from GitHub/jsDelivr
   - Initializes the engine after the engine file is ready
   - Keeps blog-post puzzle code small

   IMPORTANT:
   Replace ENGINE_URL below with your actual jsDelivr release URL.
   Recommended: use a versioned release tag, not @main.

   Example:
   https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@v1.0.0/hare-regular-sudoku-engine.js
   ========================================================= */

(() => {
  const CONTAINER_ID = "hp-sudoku-container";
  const DATA_ID = "hp-sudoku-data";

const ENGINE_URL = "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@regular-sudoku-v1.0.2/hare-regular-sudoku-engine.js";

  const container = document.getElementById(CONTAINER_ID);
  if (!container) {
    console.error("Hare Regular Sudoku Loader: puzzle container not found.");
    return;
  }

  const mount = container.querySelector(".hp-mount");

  function showLoaderError(message) {
    if (!mount) return;

    mount.innerHTML = `
      <div style="
        max-width:700px;
        margin:20px auto;
        padding:18px;
        border:1px solid #ED1B24;
        border-radius:14px;
        background:#fff5f5;
        color:#8a1c1c;
        text-align:center;
        font-family:Roboto, Arial, sans-serif;
        line-height:1.45;
      ">
        <strong>Regular Sudoku could not load.</strong><br>
        ${message}
      </div>
    `;
  }

  function initEngine() {
    if (!window.HareRegularSudokuEngine || typeof window.HareRegularSudokuEngine.init !== "function") {
      showLoaderError("The regular Sudoku engine was not found after loading the script.");
      console.error("Hare Regular Sudoku Loader: HareRegularSudokuEngine.init is unavailable.");
      return;
    }

    try {
      window.HareRegularSudokuEngine.init({
        containerId: CONTAINER_ID,
        dataId: DATA_ID,
        dataObject: window.HareRegularSudokuData
      });
    } catch (err) {
      showLoaderError("The regular Sudoku engine started loading, but hit a JavaScript error. Open the browser console for details.");
      console.error("Hare Regular Sudoku Loader: engine init failed.", err);
    }
  }

  if (window.HareRegularSudokuEngine && typeof window.HareRegularSudokuEngine.init === "function") {
    initEngine();
    return;
  }

  const existingScript = document.querySelector(`script[data-hp-regular-sudoku-engine="true"]`);

  if (existingScript) {
    existingScript.addEventListener("load", initEngine, { once: true });
    existingScript.addEventListener("error", () => {
      showLoaderError("The regular Sudoku engine script could not be loaded.");
    }, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = ENGINE_URL;
  script.async = true;
  script.defer = true;
  script.dataset.hpRegularSudokuEngine = "true";

  script.onload = initEngine;

  script.onerror = () => {
    showLoaderError("The regular Sudoku engine script could not be loaded. Check the GitHub release tag and file path in the loader.");
    console.error("Hare Regular Sudoku Loader: failed to load engine URL:", ENGINE_URL);
  };

  document.head.appendChild(script);
})();

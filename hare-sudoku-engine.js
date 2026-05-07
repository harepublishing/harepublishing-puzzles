window.HareSudokuEngine = {
  init({ containerId, dataId }) {

    const container = document.getElementById(containerId);
    const dataEl = document.getElementById(dataId);

    if (!container || !dataEl) {
      console.error("Puzzle container or data block missing.");
      return;
    }

    let data;

    try {
      data = JSON.parse(dataEl.textContent.trim());
    } catch (err) {
      console.error("Invalid puzzle JSON", err);
      return;
    }

    container.innerHTML = `
      <div style="
        padding:20px;
        border:2px solid #00A54F;
        border-radius:16px;
        text-align:center;
        font-family:sans-serif;
      ">
        <h2>Daily Sudoku Challenge #${data.puzzleId}</h2>
        <p>Date: ${data.date}</p>
        <p style="color:#107FBB;">
          Shared GitHub Sudoku engine loaded successfully.
        </p>
      </div>
    `;
  }
};

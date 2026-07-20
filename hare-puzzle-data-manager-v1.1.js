/* HARE PUBLISHING PUZZLE DATA MANAGER v1.1
   Standalone member tool for backing up, restoring, and erasing current-platform puzzle progress. */
(function (window, document) {
  "use strict";

  const FORMAT = "hare-puzzle-progress";
  const FORMAT_VERSION = 1;
  const BACKUP_PREFIX = "hp_backup__";
  const MAX_IMPORT_RECORDS = 10000;
  const CURRENT_PROGRESS_PREFIXES = Object.freeze([
    "hp2_cg_",
    "hp2_knk_easy_",
    "hp2_knk_medium_",
    "hp2_knk_hard_",
    "hp2_kx_",
    "hp2_wr_",
    "hp2_sdc_",
    "hp2_sd_easy_",
    "hp2_sd_medium_",
    "hp2_sd_hard_",
    "hp2_wsc_",
    "hp2_wf_",
    "hp2_ws_"
  ]);

  function isCurrentProgressKey(key) {
    const value = String(key || "");
    return CURRENT_PROGRESS_PREFIXES.some(prefix => value.startsWith(prefix));
  }

  function safeParse(value) {
    try { return JSON.parse(value); } catch { return null; }
  }

  function getStorageApi() {
    return window.HarePuzzleProgressCore || window.HarePuzzleCore || null;
  }

  function readEffectiveState(key) {
    const api = getStorageApi();
    if (api && typeof api.getSavedState === "function") return api.getSavedState(key, null);
    const current = safeParse(localStorage.getItem(key));
    const backup = safeParse(localStorage.getItem(`${BACKUP_PREFIX}${key}`));
    if (!current) return backup;
    if (!backup) return current;
    return getStatusRank(backup) > getStatusRank(current) ? backup : current;
  }

  function hasMeaningfulProgress(data) {
    if (!data || typeof data !== "object") return false;
    if (Array.isArray(data.cells) && data.cells.some(cell => cell && (String(cell.value || "") || (Array.isArray(cell.notes) && cell.notes.some(Boolean))))) return true;
    if (data.mappings && Object.keys(data.mappings).length) return true;
    if (data.answers && Object.keys(data.answers).length) return true;
    if (data.assignments && Object.values(data.assignments).some(Boolean)) return true;
    const arrays = ["guesses", "found", "foundWords", "foundPathKeys", "solvedWords", "revealedWords", "revealedLetters", "usedLetterIds", "selectedWords", "entries", "history"];
    if (arrays.some(name => Array.isArray(data[name]) && data[name].length)) return true;
    return Boolean(String(data.current || data.currentGuess || data.guess || "").length || data.usedAuthorHint);
  }

  function getStatusRank(data) {
    const api = window.HarePuzzleProgressCore;
    if (api && typeof api.statusRank === "function") return api.statusRank(data);
    if (!data || typeof data !== "object") return 0;
    const status = String(data.status || data.state || "").toLowerCase();
    const revealed = data.revealAllUsed === true || data.revealed === true || status === "revealed" || Boolean(data.revealedAt);
    const solved = !revealed && (data.solved === true || data.completed === true || data.isSolved === true || ["solved", "complete", "completed"].includes(status) || Boolean(data.completedAt || data.solvedAt));
    if (solved) return 4;
    if (revealed) return 3;
    if (hasMeaningfulProgress(data)) return 2;
    return 1;
  }

  function getStateTime(data) {
    if (!data || typeof data !== "object") return 0;
    const value = data.updatedAt || data.lastPlayedAt || data.completedAt || data.solvedAt || data.revealedAt || data.finishedAt || "";
    const time = Date.parse(value);
    return Number.isFinite(time) ? time : 0;
  }

  function listPrimaryKeys() {
    const keys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (isCurrentProgressKey(key)) keys.push(key);
      }
    } catch {}
    return Array.from(new Set(keys)).sort();
  }

  function listAllManagedKeys() {
    const keys = new Set(listPrimaryKeys());
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(BACKUP_PREFIX)) {
          const primaryKey = key.slice(BACKUP_PREFIX.length);
          if (isCurrentProgressKey(primaryKey)) keys.add(primaryKey);
        }
      }
    } catch {}
    return Array.from(keys).sort();
  }

  function buildExport() {
    const records = listAllManagedKeys().map(key => ({ key, data: readEffectiveState(key) })).filter(record => record.data && typeof record.data === "object" && !Array.isArray(record.data));
    return {
      format: FORMAT,
      version: FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      origin: window.location.origin,
      recordCount: records.length,
      records
    };
  }

  function downloadBackup(setStatus) {
    const backup = buildExport();
    if (!backup.records.length) {
      setStatus("There is no current-platform puzzle progress to download.", "notice");
      return false;
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hare-publishing-puzzle-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`Downloaded ${backup.records.length.toLocaleString()} puzzle progress record${backup.records.length === 1 ? "" : "s"}.`, "success");
    return true;
  }

  function validateImport(payload) {
    if (!payload || typeof payload !== "object" || payload.format !== FORMAT || payload.version !== FORMAT_VERSION || !Array.isArray(payload.records)) {
      throw new Error("This is not a valid Hare Publishing puzzle progress backup.");
    }
    if (payload.records.length > MAX_IMPORT_RECORDS) throw new Error("This backup contains too many records.");
    const records = new Map();
    payload.records.forEach(record => {
      if (!record || !isCurrentProgressKey(record.key) || !record.data || typeof record.data !== "object" || Array.isArray(record.data)) {
        throw new Error("The backup contains an invalid or unsupported puzzle record.");
      }
      records.set(String(record.key), record.data);
    });
    return Array.from(records, ([key, data]) => ({ key, data }));
  }

  function writeState(key, data) {
    const api = getStorageApi();
    if (api && typeof api.setSavedState === "function") return api.setSavedState(key, data);
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function importRecords(records) {
    let imported = 0;
    let preserved = 0;
    let failed = 0;
    records.forEach(record => {
      const current = readEffectiveState(record.key);
      const currentRank = getStatusRank(current);
      const incomingRank = getStatusRank(record.data);
      const shouldWrite = !current || incomingRank > currentRank || (incomingRank === currentRank && getStateTime(record.data) > getStateTime(current));
      if (!shouldWrite) {
        preserved++;
        return;
      }
      if (writeState(record.key, record.data)) imported++;
      else failed++;
    });
    return { imported, preserved, failed };
  }

  function eraseAllProgress() {
    const keys = listAllManagedKeys();
    const api = getStorageApi();
    keys.forEach(key => {
      try {
        if (api && typeof api.removeSavedState === "function") api.removeSavedState(key, { allowDowngrade: true });
        else localStorage.removeItem(key);
        localStorage.removeItem(`${BACKUP_PREFIX}${key}`);
      } catch {}
    });
    return keys.length;
  }

  function injectStyles() {
    if (document.getElementById("hp-puzzle-data-manager-styles")) return;
    const style = document.createElement("style");
    style.id = "hp-puzzle-data-manager-styles";
    style.textContent = `
      .hp-pdm-footer{border-top:1px solid #edf1f5;margin-top:5px;padding-top:15px;text-align:left}.hp-pdm-footer-title{align-items:center;color:#18202b;display:flex;font-size:17px;font-weight:900;gap:8px;line-height:1.25}.hp-pdm-footer-title .material-symbols-outlined{color:#0f7fbb;font-size:23px}.hp-pdm-footer-copy{color:#526173;font-size:14px;font-weight:700;line-height:1.45;margin:7px 0 12px}.hp-pdm-open{background:#fff;border:2px solid #0f7fbb;border-radius:11px;color:#0f7fbb;cursor:pointer;font:inherit;font-size:14px;font-weight:900;padding:10px 12px;width:100%}.hp-pdm-open:hover,.hp-pdm-open:focus-visible{background:#0f7fbb;color:#fff}.hp-pdm-overlay,.hp-pdm-overlay *{box-sizing:border-box}.hp-pdm-overlay{align-items:center;background:rgba(17,29,40,.62);display:none;font-family:inherit;inset:0;justify-content:center;padding:18px;position:fixed;z-index:100000}.hp-pdm-overlay.on{display:flex}.hp-pdm-modal{background:#fff;border-radius:22px;box-shadow:0 22px 60px rgba(0,0,0,.25);max-height:calc(100vh - 36px);max-width:520px;overflow:auto;padding:24px;position:relative;width:100%}.hp-pdm-close{align-items:center;background:#f1f6f9;border:0;border-radius:50%;color:#263746;cursor:pointer;display:flex;height:38px;justify-content:center;position:absolute;right:16px;top:16px;width:38px}.hp-pdm-modal h2{color:#18202b;font-size:25px;font-weight:900;line-height:1.1;margin:0 48px 8px 0}.hp-pdm-intro{color:#526173;font-size:14px;line-height:1.45;margin:0 0 18px}.hp-pdm-actions{display:grid;gap:10px}.hp-pdm-btn{border:2px solid #0f7fbb;border-radius:12px;cursor:pointer;font:inherit;font-size:14px;font-weight:900;padding:11px 14px;text-align:center;width:100%}.hp-pdm-btn.primary{background:#0f7fbb;color:#fff}.hp-pdm-btn.secondary{background:#fff;color:#0f7fbb}.hp-pdm-btn:hover,.hp-pdm-btn:focus-visible{filter:brightness(.94)}.hp-pdm-status{border-radius:10px;color:#344657;font-size:13px;font-weight:800;line-height:1.35;margin:12px 0 0;min-height:0}.hp-pdm-status:not(:empty){background:#f1f7fa;padding:10px}.hp-pdm-status.success{background:#eaf8ef;color:#176b37}.hp-pdm-status.error{background:#fff0f0;color:#a32020}.hp-pdm-danger{border-top:1px solid #e5e9ed;margin-top:20px;padding-top:16px}.hp-pdm-danger h3{color:#a32020;font-size:14px;font-weight:900;margin:0 0 5px}.hp-pdm-danger p{color:#637180;font-size:13px;line-height:1.45;margin:0 0 10px}.hp-pdm-danger-open{background:transparent;border:0;color:#b32121;cursor:pointer;font:inherit;font-size:13px;font-weight:900;padding:3px 0;text-decoration:underline}.hp-pdm-confirm{background:#fff5f5;border:1px solid #f0caca;border-radius:12px;display:none;margin-top:12px;padding:13px}.hp-pdm-confirm.on{display:block}.hp-pdm-confirm label{color:#592323;display:block;font-size:12px;font-weight:800;line-height:1.4;margin-bottom:8px}.hp-pdm-confirm input{border:1px solid #c9d1d8;border-radius:9px;font:inherit;padding:9px;width:100%}.hp-pdm-confirm-actions{display:grid;gap:8px;margin-top:9px}.hp-pdm-erase{background:#b32121;border:2px solid #b32121;border-radius:10px;color:#fff;cursor:pointer;font:inherit;font-size:13px;font-weight:900;padding:9px}.hp-pdm-erase:disabled{cursor:not-allowed;opacity:.45}.hp-pdm-backup-first{background:#fff;border:1px solid #0f7fbb;border-radius:10px;color:#0f7fbb;cursor:pointer;font:inherit;font-size:12px;font-weight:900;padding:8px}.hp-pdm-file{display:none}@media(max-width:520px){.hp-pdm-modal{padding:21px 18px}.hp-pdm-modal h2{font-size:22px}}
    `;
    document.head.appendChild(style);
  }

  function init({ containerId = "hp-puzzle-data-manager" } = {}) {
    const host = document.getElementById(containerId);
    if (!host || host.dataset.hpPdmMounted === "1") return;
    host.dataset.hpPdmMounted = "1";
    injectStyles();

    host.innerHTML = `<div class="hp-pdm-footer"><div class="hp-pdm-footer-title"><span class="material-symbols-outlined" aria-hidden="true">cloud_sync</span>Protect Your Puzzle Progress</div><p class="hp-pdm-footer-copy">Back up, restore, or move your puzzle progress to another browser or device.</p><button class="hp-pdm-open" type="button">Manage Puzzle Data</button></div>`;

    const overlay = document.createElement("div");
    overlay.className = "hp-pdm-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `<section class="hp-pdm-modal" role="dialog" aria-modal="true" aria-labelledby="hp-pdm-title"><button class="hp-pdm-close" type="button" aria-label="Close"><span class="material-symbols-outlined" aria-hidden="true">close</span></button><h2 id="hp-pdm-title">Puzzle Data Management</h2><p class="hp-pdm-intro">Download your current puzzle progress or restore it in another browser or device.</p><div class="hp-pdm-actions"><button class="hp-pdm-btn primary" type="button" data-pdm-download>Download Progress Backup</button><button class="hp-pdm-btn secondary" type="button" data-pdm-import>Restore Progress Backup</button><input class="hp-pdm-file" type="file" accept=".json,application/json" data-pdm-file></div><div class="hp-pdm-status" role="status" aria-live="polite"></div><div class="hp-pdm-danger"><h3>Erase Puzzle Data</h3><p>Erase all current puzzle data, including statistics and progress stored in this browser. This cannot be undone without a downloaded backup.</p><button class="hp-pdm-danger-open" type="button">Erase All Puzzle Data</button><div class="hp-pdm-confirm"><label>Type <strong>ERASE</strong> to confirm removal of all current puzzle data and internal recovery copies.</label><input type="text" autocomplete="off" spellcheck="false" data-pdm-confirm-input><div class="hp-pdm-confirm-actions"><button class="hp-pdm-backup-first" type="button">Download a Backup First</button><button class="hp-pdm-erase" type="button" disabled>Erase All Puzzle Data</button></div></div></div></section>`;
    document.body.appendChild(overlay);

    const openButton = host.querySelector(".hp-pdm-open");
    const closeButton = overlay.querySelector(".hp-pdm-close");
    const status = overlay.querySelector(".hp-pdm-status");
    const fileInput = overlay.querySelector("[data-pdm-file]");
    const confirmPanel = overlay.querySelector(".hp-pdm-confirm");
    const confirmInput = overlay.querySelector("[data-pdm-confirm-input]");
    const eraseButton = overlay.querySelector(".hp-pdm-erase");
    let previousFocus = null;

    function setStatus(message, type = "") {
      status.textContent = message || "";
      status.className = `hp-pdm-status${type ? ` ${type}` : ""}`;
    }
    function openModal() {
      previousFocus = document.activeElement;
      overlay.classList.add("on");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeButton.focus();
    }
    function closeModal() {
      overlay.classList.remove("on");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    }

    openButton.addEventListener("click", openModal);
    closeButton.addEventListener("click", closeModal);
    overlay.addEventListener("click", event => { if (event.target === overlay) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && overlay.classList.contains("on")) closeModal(); });
    overlay.querySelectorAll("[data-pdm-download], .hp-pdm-backup-first").forEach(button => button.addEventListener("click", () => downloadBackup(setStatus)));
    overlay.querySelector("[data-pdm-import]").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) { setStatus("That backup file is too large.", "error"); return; }
      try {
        const records = validateImport(JSON.parse(await file.text()));
        const result = importRecords(records);
        if (result.failed) throw new Error(`${result.failed} record${result.failed === 1 ? "" : "s"} could not be restored.`);
        setStatus(`Restored ${result.imported.toLocaleString()} record${result.imported === 1 ? "" : "s"}; preserved ${result.preserved.toLocaleString()} existing record${result.preserved === 1 ? "" : "s"}. Refreshing…`, "success");
        window.dispatchEvent(new CustomEvent("hare:puzzle-data-changed", { detail: { action: "import", ...result } }));
        setTimeout(() => window.location.reload(), 1200);
      } catch (error) {
        setStatus(error && error.message ? error.message : "The backup could not be restored.", "error");
      }
    });
    overlay.querySelector(".hp-pdm-danger-open").addEventListener("click", () => {
      confirmPanel.classList.toggle("on");
      if (confirmPanel.classList.contains("on")) confirmInput.focus();
    });
    confirmInput.addEventListener("input", () => { eraseButton.disabled = confirmInput.value.trim() !== "ERASE"; });
    eraseButton.addEventListener("click", () => {
      if (confirmInput.value.trim() !== "ERASE") return;
      const erased = eraseAllProgress();
      setStatus(`Erased ${erased.toLocaleString()} puzzle progress record${erased === 1 ? "" : "s"}. Refreshing…`, "success");
      window.dispatchEvent(new CustomEvent("hare:puzzle-data-changed", { detail: { action: "erase", erased } }));
      setTimeout(() => window.location.reload(), 1200);
    });
  }

  window.HarePuzzleDataManager = {
    version: "1.1.0",
    prefixes: CURRENT_PROGRESS_PREFIXES.slice(),
    init
  };
})(window, document);

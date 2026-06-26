/* =========================================================
   HARE PUBLISHING KNIGHTS & KNAVES PLATFORM ENGINE
   Version 2.8

   Platform version for Knights & Knaves Logic Puzzles.
   - Receives one puzzle set from the platform page
   - Supports Easy, Medium, and Hard modes
   - Preserves separate localStorage keys:
     hp2_knk_easy_, hp2_knk_medium_, hp2_knk_hard_
   - Emits shared Hare Puzzle Platform state-change events
   - v1.5: compact portrait overlays, Knight/Knave toggle, bottom logic notation
   - v1.7: compact chat title removal, message pop animation, mobile 2-column cards
   - v1.8: slower message reveal with subtle medieval tap sound
   - v1.9: replay message sounds on difficulty switch and rewrite speaker self-references as I
   - v2.1: message animation/sound only on puzzle open and difficulty changes
   - v2.2: platform page closes level-preference modal after Save, matching Sudoku behavior
   - v2.3: sidebar and success/reveal next-puzzle actions show destination puzzle names
   - v2.4: preferred-level exhausted flow, alternate difficulty offers, Puzzlers Hub caught-up destination
   - v2.5: close icon on success/reveal overlay and cleaner preferred-level caught-up actions
   - v2.7: larger success/reveal card with shared Sudoku/K&K spacing and no desktop stats wrapping
   - v2.8: status moved below icon and Share This Puzzle added to overlay
   ========================================================= */

window.HareKnightsKnavesPlatformEngine = {
  init({
    containerId = "hp-knights-container",
    dataId = "hp-knights-data",
    dataObject = window.HareKnightsKnavesData
  } = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error("HareKnightsKnavesPlatformEngine: puzzle container missing.");
      return;
    }

    if (!container.classList.contains("hp-knights")) {
      console.warn("HareKnightsKnavesPlatformEngine: container is not marked hp-knights. Skipping mount.");
      return;
    }

    if (typeof container.__hpKnightsPlatformCleanup === "function") {
      try { container.__hpKnightsPlatformCleanup(); } catch (err) { console.warn("HareKnightsKnavesPlatformEngine: cleanup failed.", err); }
    }

    container.dataset.hpKnightsMounted = "true";

    const mount = container.querySelector(".hp-mount");
    if (!mount) {
      console.error("HareKnightsKnavesPlatformEngine: .hp-mount element missing.");
      return;
    }

    const yearEl = document.getElementById("hp-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const dataEl = document.getElementById(dataId);
    let pageData = dataObject || null;
    if (!pageData && dataEl) {
      try { pageData = JSON.parse(dataEl.textContent || "{}"); }
      catch (err) { console.error("HareKnightsKnavesPlatformEngine: invalid data JSON.", err); }
    }

    const Core = window.HarePuzzleCore || null;
    const PUZZLE_TYPE = "knights-knaves";
    const MODE_ORDER = ["easy", "medium", "hard"];
    const MODE_META = {
      easy: { mode:"easy", label:"Easy", displayLabel:"Easy Knights & Knaves", saveKeyPrefix:"hp2_knk_easy_" },
      medium: { mode:"medium", label:"Medium", displayLabel:"Medium Knights & Knaves", saveKeyPrefix:"hp2_knk_medium_" },
      hard: { mode:"hard", label:"Hard", displayLabel:"Hard Knights & Knaves", saveKeyPrefix:"hp2_knk_hard_" }
    };
    const CHARACTER_BASE_URL = String(pageData?.characterBaseUrl || window.HareKnightsKnavesCharacterBaseUrl || "https://cdn.jsdelivr.net/gh/harepublishing/harepublishing-puzzles@main/characters/").replace(/\/?$/, "/");

    function escapeHtml(str) {
      return String(str ?? "").replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]));
    }

    function showConfigError(message) {
      mount.innerHTML = `<div class="hp-panel" style="border:1px solid #ED1B24;background:#fff5f5;color:#8a1c1c;padding:18px;border-radius:12px;text-align:center;"><strong>Knights & Knaves Configuration Error:</strong><br>${escapeHtml(message)}</div>`;
    }

    function lettersForCount(count) {
      return ["A","B","C","D","E"].slice(0, count);
    }

    function normalizePerson(person, index) {
      const fallbackId = String.fromCharCode(65 + index);
      if (person && typeof person === "object") {
        const id = String(person.id || fallbackId).trim().toUpperCase();
        const name = String(person.name || id).trim();
        const image = String(person.image || "").trim();
        const gender = String(person.gender || "").trim().toLowerCase();
        return { id, name, image, gender };
      }
      const name = String(person || fallbackId).trim();
      return { id:fallbackId, name:name || fallbackId, image:"", gender:"" };
    }

    function normalizeLevel(level, mode) {
      if (!level || typeof level !== "object") return null;
      const people = Array.isArray(level.people) ? level.people.map(normalizePerson) : [];
      const letters = people.map((person, index) => person.id || String.fromCharCode(65 + index));
      const statements = Array.isArray(level.statements) ? level.statements : [];
      const solution = level.solution && typeof level.solution === "object" ? level.solution : {};
      return { ...MODE_META[mode], people, letters, statements, solution };
    }

    function buildPuzzlesFromData(data) {
      if (!data || typeof data !== "object") return null;
      const result = {};
      MODE_ORDER.forEach(mode => {
        const normalized = normalizeLevel(data[mode], mode);
        if (normalized) result[mode] = normalized;
      });
      return result;
    }

    const PUZZLES = buildPuzzlesFromData(pageData);
    if (!PUZZLES) return showConfigError("Puzzle data is missing. Add window.HareKnightsKnavesData before loading the engine.");

    const availableModes = MODE_ORDER.filter(mode => PUZZLES[mode]);
    if (!availableModes.length) return showConfigError("At least one difficulty level is required.");

    for (const mode of availableModes) {
      const cfg = PUZZLES[mode];
      if (!cfg.people.length) return showConfigError(`${cfg.label} is missing people.`);
      if (!cfg.statements.length) return showConfigError(`${cfg.label} is missing statements.`);
      for (const letter of cfg.letters) {
        if (!["K","N"].includes(String(cfg.solution[letter] || "").toUpperCase())) {
          return showConfigError(`${cfg.label} is missing a K/N solution for ${letter}.`);
        }
      }
    }

    let currentMode = availableModes.includes(String(pageData.defaultMode || "easy").toLowerCase()) ? String(pageData.defaultMode || "easy").toLowerCase() : availableModes[0];
    const hasMultipleModes = availableModes.length > 1;
    let logicOpen = false;
    const messageSoundPlayedKeys = new Set();
    let audioCtx = null;
    let allowNextMessageSound = true;
    let pendingInitialSound = false;
    let currentRenderReason = "initial";

    function getAudioContext() {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      if (!audioCtx) audioCtx = new AudioCtor();
      return audioCtx;
    }

    function playMedievalMessageTap(isFinal = false) {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
          if (ctx.state === "suspended") return;
        }

        const now = ctx.currentTime;
        const duration = isFinal ? 0.095 : 0.075;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(isFinal ? 0.052 : 0.042, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        gain.connect(ctx.destination);

        const low = ctx.createOscillator();
        low.type = "triangle";
        low.frequency.setValueAtTime(isFinal ? 185 : 165, now);
        low.frequency.exponentialRampToValueAtTime(isFinal ? 92 : 82, now + duration);
        low.connect(gain);
        low.start(now);
        low.stop(now + duration);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.0001, now);
        clickGain.gain.exponentialRampToValueAtTime(isFinal ? 0.025 : 0.018, now + 0.003);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
        clickGain.connect(ctx.destination);

        const click = ctx.createOscillator();
        click.type = "square";
        click.frequency.setValueAtTime(isFinal ? 440 : 360, now);
        click.connect(clickGain);
        click.start(now);
        click.stop(now + 0.03);
      } catch {}
    }

    function scheduleMessageSounds(count, { force = false } = {}) {
      if (!count) return;
      const key = `${getPuzzleId()}_${currentMode}`;
      if (!force && messageSoundPlayedKeys.has(key)) return;
      messageSoundPlayedKeys.add(key);
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        pendingInitialSound = true;
        ctx.resume().catch(() => {});
        return;
      }
      for (let i = 0; i < count; i++) {
        window.setTimeout(() => playMedievalMessageTap(i === count - 1), i * 520 + 110);
      }
    }

    function unlockMessageAudio() {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      if (pendingInitialSound) {
        pendingInitialSound = false;
        scheduleMessageSounds((getConfig().statements || []).length, { force:true });
      }
    }

    const defaultState = () => ({
      answers:{},
      evaluated:false,
      solved:false,
      revealed:false,
      solvedAt:"",
      revealedAt:"",
      startedAt:"",
      updatedAt:"",
      overlaySeen:false
    });

    function getConfig(mode = currentMode) { return PUZZLES[mode]; }
    function getPuzzleId() { return String(pageData?.puzzleId || "").trim(); }
    function getSaveKey(mode = currentMode) { return `${PUZZLES[mode].saveKeyPrefix}${getPuzzleId()}`; }

    function loadState(mode) {
      try {
        const raw = localStorage.getItem(getSaveKey(mode));
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed ? { ...defaultState(), ...parsed, answers:{ ...(parsed.answers || {}) } } : defaultState();
      } catch { return defaultState(); }
    }

    const states = {};
    availableModes.forEach(mode => { states[mode] = loadState(mode); });

    function saveState(mode = currentMode, action = "save") {
      const state = states[mode];
      state.updatedAt = new Date().toISOString();
      try { localStorage.setItem(getSaveKey(mode), JSON.stringify(state)); }
      catch (err) { console.warn("HareKnightsKnavesPlatformEngine: unable to save progress.", err); }
      emitStateChange(mode, action);
    }

    function getModeStatus(mode = currentMode) {
      const state = states[mode] || defaultState();
      const hasAnswers = state.answers && Object.keys(state.answers).length > 0;
      if (state.solved) return "solved";
      if (state.revealed) return "revealed";
      if (hasAnswers || state.startedAt || state.updatedAt) return "in-progress";
      return "not-started";
    }

    function emitStateChange(mode = currentMode, action = "save") {
      const cfg = PUZZLES[mode];
      const detail = { puzzleType:PUZZLE_TYPE, puzzleId:getPuzzleId(), mode, storageKey:getSaveKey(mode), status:getModeStatus(mode), action };
      if (Core && typeof Core.emitStateChange === "function") Core.emitStateChange(detail);
      else {
        window.dispatchEvent(new CustomEvent("hare:puzzle-state-change", { detail }));
        window.dispatchEvent(new CustomEvent("hare:knights-knaves-state-change", { detail }));
      }
    }

    function peopleByLetter(cfg = getConfig()) {
      const map = {};
      cfg.people.forEach((person, index) => {
        const id = person.id || String.fromCharCode(65 + index);
        map[id] = person;
      });
      return map;
    }

    function letterNameMap(cfg = getConfig()) {
      const map = {};
      const people = peopleByLetter(cfg);
      Object.keys(people).forEach(letter => { map[letter] = people[letter].name || letter; });
      return map;
    }

    function getPerson(letter, cfg = getConfig()) {
      return peopleByLetter(cfg)[letter] || { id:letter, name:letter, image:"", gender:"" };
    }

    function characterImageUrl(person) {
      const image = person && person.image ? String(person.image).trim() : "";
      return image ? CHARACTER_BASE_URL + encodeURIComponent(image) : "";
    }

    function displayLogic(logic) {
      return String(logic || "").replace(/<->/g,"⇔").replace(/->/g,"⇒").replace(/!/g,"¬").replace(/\|/g,"∨").replace(/&/g,"∧");
    }

    function escapeRegExp(str) {
      return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function rewriteSelfReferenceText(text, person) {
      const name = String(person?.name || "").trim();
      if (!name) return String(text || "");
      const escapedName = escapeRegExp(name);
      let out = String(text || "");
      out = out.replace(new RegExp(`\\b${escapedName}\\s+is\\s+not\\s+a\\s+knight\\b`, "gi"), "I am not a knight");
      out = out.replace(new RegExp(`\\b${escapedName}\\s+is\\s+not\\s+a\\s+knave\\b`, "gi"), "I am not a knave");
      out = out.replace(new RegExp(`\\b${escapedName}\\s+is\\s+a\\s+knight\\b`, "gi"), "I am a knight");
      out = out.replace(new RegExp(`\\b${escapedName}\\s+is\\s+a\\s+knave\\b`, "gi"), "I am a knave");
      out = out.replace(new RegExp(`\\b${escapedName}\\b`, "g"), "I");
      return out;
    }

    function getPersonLabel(letter, cfg = getConfig()) {
      const map = letterNameMap(cfg);
      return map[letter] || letter;
    }

    function getShareMessage(cfg = getConfig(), state = states[currentMode]) {
      const id = getPuzzleId();
      const name = `${cfg.displayLabel} Puzzle #${id}`;
      if (state.solved) return `I solved ${name} at Hare Publishing!`;
      if (state.revealed) return `I revealed the answer for ${name} at Hare Publishing.`;
      return `I’m playing ${name} at Hare Publishing!`;
    }

    function shareCurrentPuzzle() {
      const cfg = getConfig();
      const state = states[currentMode];
      const shareText = getShareMessage(cfg, state);
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const shareUrl = `${baseUrl}?puzzle=${encodeURIComponent(getPuzzleId())}`;
      const shareData = {
        title: `${cfg.displayLabel} Puzzle #${getPuzzleId()} — Hare Publishing`,
        text: `${shareText}\n${shareUrl}`
      };

      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
        return;
      }

      try {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setStatus("Share text copied! 📋");
      } catch {
        setStatus("Copy the link from your address bar 🙂");
      }
    }

    function getStats() {
      if (typeof window.HareKnightsKnavesGetStats === "function") {
        try { return window.HareKnightsKnavesGetStats(); } catch {}
      }
      const prefixes = availableModes.map(mode => PUZZLES[mode].saveKeyPrefix);
      const items = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key || !prefixes.some(prefix => key.startsWith(prefix))) continue;
          const data = JSON.parse(localStorage.getItem(key) || "null");
          if (data) items.push(data);
        }
      } catch {}
      const solved = items.filter(x => x.solved && !x.revealed).length;
      const revealed = items.filter(x => x.revealed).length;
      const inProgress = items.filter(x => !x.solved && !x.revealed && x.answers && Object.keys(x.answers).length).length;
      const played = items.filter(x => x.solved || x.revealed).length;
      return { streak:0, solved, revealed, inProgress, played };
    }

    function getModeLabel(mode) { return mode.charAt(0).toUpperCase() + mode.slice(1); }
    function getModeStatusLabel(mode) {
      const s = getModeStatus(mode);
      return s === "solved" ? "Solved" : s === "revealed" ? "Revealed" : s === "in-progress" ? "In Progress" : "Not Started";
    }

    function renderOverlayStats() {
      const stats = getStats();
      return `<div class="hp-knights-overlay-stat-row">
        <span><span class="material-symbols-outlined" aria-hidden="true">local_fire_department</span><strong>${Number(stats.streak || 0).toLocaleString()}</strong> Day Streak</span>
        <span><span class="material-symbols-outlined" aria-hidden="true">trophy</span><strong>${Number(stats.solved || 0).toLocaleString()}</strong> Solved</span>
        <span><span class="material-symbols-outlined" aria-hidden="true">visibility</span><strong>${Number(stats.revealed || 0).toLocaleString()}</strong> Revealed</span>
        <span><span class="material-symbols-outlined" aria-hidden="true">pending_actions</span><strong>${Number(stats.inProgress || 0).toLocaleString()}</strong> In Progress</span>
        <span><span class="material-symbols-outlined" aria-hidden="true">beenhere</span><strong>${Number(stats.played || 0).toLocaleString()}</strong> Played</span>
      </div>
      <div class="hp-knights-overlay-mode-summary">${availableModes.map(mode => `<span class="hp-knights-overlay-mode-pill ${getModeStatus(mode)}"><strong>${getModeLabel(mode)}</strong><span>${getModeStatusLabel(mode)}</span></span>`).join("")}</div>`;
    }

    function getOverlayNextActionsHtml(remainingText) {
      if (typeof window.HareKnightsGetNextPuzzleOptions !== "function") {
        return typeof window.HareKnightsRequestNextPuzzle === "function"
          ? `<div class="hp-knights-modal-buttons"><button type="button" class="hp-knights-primary" data-a="request-next">Play Your Next Puzzle</button><button type="button" class="hp-knights-secondary share-action" data-a="share">Share This Puzzle</button></div>`
          : `<div class="hp-knights-modal-buttons"><a class="hp-knights-primary" href="/puzzlers-hub">Puzzlers Hub</a><button type="button" class="hp-knights-secondary share-action" data-a="share">Share This Puzzle</button></div>`;
      }

      let options = null;
      try { options = window.HareKnightsGetNextPuzzleOptions({ excludePuzzleId:getPuzzleId() }); } catch {}
      const shareButton = `<button type="button" class="hp-knights-secondary share-action" data-a="share">Share This Puzzle</button>`;
      const actions = [];
      const seen = new Set();
      function addAction(kind, item, prefix) {
        if (!item || !item.puzzleId || seen.has(`${item.mode || ""}_${item.puzzleId}`)) return;
        seen.add(`${item.mode || ""}_${item.puzzleId}`);
        const modeLabel = item.mode ? ` (${String(item.mode).charAt(0).toUpperCase()}${String(item.mode).slice(1)})` : "";
        actions.push(`<button type="button" class="hp-knights-primary" data-a="request-next" data-next-kind="${escapeHtml(kind)}">${escapeHtml(prefix)} ${escapeHtml(`Knights & Knaves #${item.puzzleId}${modeLabel}`)}</button>`);
      }
      addAction("continue", options?.continuePuzzle, "Continue");
      addAction("new", options?.newPuzzle, "Play");

      if (actions.length) {
        return `${remainingText ? `<p class="hp-knights-overlay-message">${escapeHtml(remainingText)}</p>` : ""}<div class="hp-knights-modal-buttons">${actions.join("")}${shareButton}</div>`;
      }

      if (options?.preferredLevelExhausted && options?.alternatePuzzle) {
        const preferred = options.preferenceLabel || "Preferred Level";
        const alt = options.alternatePuzzle;
        const altMode = alt.mode ? String(alt.mode).charAt(0).toUpperCase() + String(alt.mode).slice(1) : "Another Level";
        return `<div class="hp-knights-overlay-next-copy"><strong>You're caught up on ${escapeHtml(preferred)}!</strong><span>Check back tomorrow for the next ${escapeHtml(preferred)} puzzle.</span>${remainingText ? `<span>${escapeHtml(remainingText)}</span>` : ""}</div><div class="hp-knights-modal-buttons"><button type="button" class="hp-knights-primary" data-a="request-next" data-next-kind="alternate">Try ${escapeHtml(altMode)} #${escapeHtml(alt.puzzleId)}</button>${shareButton}</div>`;
      }
      if (options?.allDone) {
        return `<div class="hp-knights-overlay-next-copy"><strong>You're all caught up!</strong><span>Explore more puzzles in the Puzzlers Hub.</span></div><div class="hp-knights-modal-buttons"><a class="hp-knights-primary" href="/puzzlers-hub">Explore More Puzzles</a>${shareButton}</div>`;
      }
      return `<div class="hp-knights-overlay-next-copy"><strong>You're all caught up!</strong><span>Check back tomorrow.</span></div><div class="hp-knights-modal-buttons">${shareButton}</div>`;
    }

    function showOverlay(type) {
      const cfg = getConfig();
      const state = states[currentMode];
      const solved = type === "solved" || state.solved;
      const revealed = type === "revealed" || state.revealed;
      const statusWord = solved ? "Solved" : revealed ? "Revealed" : "Complete";
      const icon = solved ? "celebration" : "visibility";
      const remaining = availableModes.filter(mode => !states[mode].solved && !states[mode].revealed).map(getModeLabel);
      const remainingText = remaining.length ? `${remaining.join(", ")} ${remaining.length === 1 ? "is" : "are"} still available in this puzzle set.` : "You have completed every level in this puzzle set.";
      const overlay = mount.querySelector("#hp-knights-overlay");
      if (!overlay) return;
      overlay.innerHTML = `<div class="hp-knights-modal">
        <button type="button" class="hp-knights-overlay-close" data-a="close-overlay" aria-label="Close success card"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
        <span class="material-symbols-outlined hp-knights-overlay-icon" aria-hidden="true">${icon}</span>
        <div class="hp-knights-overlay-status">${statusWord}</div>
        <h3>${escapeHtml(cfg.displayLabel)} Puzzle #${escapeHtml(getPuzzleId())}</h3>
        <div class="hp-knights-overlay-stats">${renderOverlayStats()}</div>
        <div class="hp-knights-modal-actions">
          ${getOverlayNextActionsHtml(remainingText)}
        </div>
      </div>`;
      overlay.classList.add("on");
      overlay.setAttribute("aria-hidden", "false");
      state.overlaySeen = false;
      saveState(currentMode, solved ? "solved" : "revealed");
    }

    function hideOverlay() {
      const overlay = mount.querySelector("#hp-knights-overlay");
      if (!overlay) return;
      overlay.classList.remove("on");
      overlay.setAttribute("aria-hidden", "true");
      states[currentMode].overlaySeen = true;
      saveState(currentMode);
    }

    function renderCompletionStatus() {
      const el = mount.querySelector("#hp-knights-completion-status");
      if (!el) return;
      const status = getModeStatus(currentMode);
      el.className = "hp-knights-completion-status";
      el.textContent = "";
      if (status === "solved" || status === "revealed") {
        el.textContent = `${status === "solved" ? "🏆 Solved" : "✓ Revealed"} • ${getConfig().displayLabel} Puzzle #${getPuzzleId()}`;
        el.classList.add("show", status);
      }
    }

    function renderStatements(animateMessages = false) {
      const cfg = getConfig();
      const statements = cfg.statements || [];
      return `<div class="hp-knights-statements">
        <div class="hp-knights-message-list">
          ${statements.map((st, index) => {
            const speaker = st.speaker || "";
            const person = /^[A-E]$/.test(speaker) ? getPerson(speaker, cfg) : { name:st.speakerName || speaker, image:"" };
            const img = characterImageUrl(person);
            const side = index % 2 === 0 ? "left" : "right";
            return `<div class="hp-knights-message hp-knights-message-${side} ${animateMessages ? "animate" : ""}" ${animateMessages ? `style="animation-delay:${index * 520}ms;"` : ""}>
              <div class="hp-knights-message-avatar-wrap">
                ${img ? `<img class="hp-knights-message-avatar" src="${escapeHtml(img)}" alt="${escapeHtml(person.name)}">` : `<div class="hp-knights-message-avatar hp-knights-avatar-fallback">${escapeHtml(String(person.name || speaker).charAt(0))}</div>`}
              </div>
              <div class="hp-knights-message-bubble">
                <div class="hp-knights-message-name">${escapeHtml(person.name || speaker)} says:</div>
                <div class="hp-knights-message-text">“${escapeHtml(rewriteSelfReferenceText(st.text || "", person))}”</div>
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>`;
    }

    function getCardResult(letter, state = states[currentMode], cfg = getConfig()) {
      const picked = String(state.answers?.[letter] || "").toUpperCase();
      const correct = String(cfg.solution?.[letter] || "").toUpperCase();

      if (state.revealed) {
        if (!picked) return "revealed";
        return picked === correct ? "correct" : "incorrect";
      }

      if (state.solved) return "correct";
      return "";
    }

    function getCardIcon(result) {
      if (result === "correct") return "check_circle";
      if (result === "incorrect") return "cancel";
      if (result === "revealed") return "visibility";
      return "";
    }

    function renderLogicPanel() {
      const cfg = getConfig();
      return `<div id="hp-knights-logic-panel" class="hp-knights-logic-panel ${logicOpen ? "show" : ""}" aria-hidden="${logicOpen ? "false" : "true"}">
        <pre>${escapeHtml((cfg.statements || []).map(st => `${st.speaker}: ${displayLogic(st.logic)}`).join("\n"))}</pre>
      </div>`;
    }

    function renderAnswerControls() {
      const cfg = getConfig();
      const state = states[currentMode];
      return `<div class="hp-knights-answer-grid" role="group" aria-label="Choose knight or knave for each person">
        ${cfg.letters.map(letter => {
          const person = getPerson(letter, cfg);
          const selected = String(state.answers?.[letter] || "").toUpperCase();
          const locked = state.solved || state.revealed;
          const result = getCardResult(letter, state, cfg);
          const icon = getCardIcon(result);
          const answerForButton = state.revealed && !selected ? String(cfg.solution[letter] || "").toUpperCase() : selected;
          const img = characterImageUrl(person);
          return `<div class="hp-knights-person-card ${result ? `is-${result}` : ""}" data-person="${escapeHtml(letter)}">
            ${icon ? `<span class="material-symbols-outlined hp-knights-card-icon" aria-hidden="true">${icon}</span>` : ""}
            <div class="hp-knights-photo-wrap">
              ${img ? `<img class="hp-knights-person-photo" src="${escapeHtml(img)}" alt="${escapeHtml(person.name)}">` : `<div class="hp-knights-person-photo hp-knights-photo-fallback">${escapeHtml(letter)}</div>`}
              <div class="hp-knights-card-overlay">
                <div class="hp-knights-person-id"><span>${escapeHtml(letter)}</span><strong>${escapeHtml(person.name || letter)}</strong></div>
                <div class="hp-knights-choice-toggle" role="group" aria-label="Choose Knight or Knave for ${escapeHtml(person.name || letter)}">
                  <button type="button" data-a="answer" data-person="${escapeHtml(letter)}" data-value="K" class="hp-knights-choice ${answerForButton === "K" ? "active" : ""}" ${locked ? "disabled" : ""}>Knight</button>
                  <button type="button" data-a="answer" data-person="${escapeHtml(letter)}" data-value="N" class="hp-knights-choice ${answerForButton === "N" ? "active" : ""}" ${locked ? "disabled" : ""}>Knave</button>
                </div>
                ${state.revealed ? `<div class="hp-knights-revealed-label">Answer: ${cfg.solution[letter] === "K" ? "Knight" : "Knave"}</div>` : ""}
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>`;
    }

    function renderModeSwitch() {
      if (!hasMultipleModes) return "";
      return `<div class="hp-knights-mode-switch" role="tablist" aria-label="Difficulty">
        ${availableModes.map(mode => `<button type="button" class="hp-knights-mode-btn ${mode === currentMode ? "active" : ""}" data-a="mode" data-mode="${mode}">${escapeHtml(PUZZLES[mode].label)}</button>`).join("")}
      </div>`;
    }

    function renderUI({ playMessages = allowNextMessageSound } = {}) {
      const cfg = getConfig();
      mount.innerHTML = `<style>
        #hp-knights-container.hp-knights{--hp-primary:#AB8C50;--hp-primary-light:#F8F2E7;--hp-primary-soft:#E5D4B5;--hp-primary-dark:#6F5522;--hp-success:#00A54F;--hp-error:#ED1B24;--hp-blue:#0F7FBB;font-family:Roboto,Arial,sans-serif;position:relative;}
        #hp-knights-container.hp-knights *{box-sizing:border-box;}
        #hp-knights-container .hp-knights-top{display:flex;align-items:center;justify-content:center;margin:0 0 6px;padding:5px;border:1px solid #edf2f6;border-radius:14px;background:#fff;}
        #hp-knights-container .hp-knights-mode-switch{display:grid;grid-template-columns:repeat(${availableModes.length},minmax(72px,1fr));gap:6px;max-width:330px;width:100%;}
        #hp-knights-container .hp-knights-mode-btn{border:1px solid var(--hp-primary-soft);background:#fff;color:var(--hp-primary-dark);border-radius:12px;min-height:28px;padding:4px 8px;font-size:12px;font-weight:900;cursor:pointer;}
        #hp-knights-container .hp-knights-mode-btn.active,#hp-knights-container .hp-knights-mode-btn:hover{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}
        #hp-knights-container .hp-knights-completion-status{display:none;margin:0 auto 8px;padding:8px 11px;border-radius:12px;background:#f7f9fb;border:1px solid #dde7ef;text-align:center;font-size:13px;font-weight:900;color:#333;}
        #hp-knights-container .hp-knights-completion-status.show{display:block;}
        #hp-knights-container .hp-knights-status{min-height:34px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:17px;font-weight:900;color:#444;margin:0 0 8px;padding:6px 10px;border-radius:14px;background:#f7f9fb;border:1px solid #dde7ef;}
        #hp-knights-container .hp-knights-status.good{background:#e3f7ec;border-color:#b7e4c7;color:#166534;}
        #hp-knights-container .hp-knights-status.bad{background:#fff5f5;border-color:#ffc7cf;color:#b11218;}
        #hp-knights-container .hp-knights-statements{background:#fff;border:1px solid #e9eef3;border-radius:18px;padding:12px 16px;margin:0 0 12px;box-shadow:0 8px 24px rgba(0,0,0,.045);}
        #hp-knights-container .hp-knights-statements h3{display:none;}
        #hp-knights-container .hp-knights-message-list{display:grid;gap:10px;}
        #hp-knights-container .hp-knights-message{display:grid;grid-template-columns:62px auto;gap:9px;align-items:center;width:fit-content;max-width:min(72%,620px);opacity:1;transform:none;}
        #hp-knights-container .hp-knights-message.animate{opacity:0;transform:translateY(8px) scale(.985);animation:hpKnightsMessagePop .44s cubic-bezier(.2,.9,.2,1) forwards;}
        #hp-knights-container .hp-knights-message-right{grid-template-columns:auto 62px;margin-left:auto;}
        #hp-knights-container .hp-knights-message-right .hp-knights-message-avatar-wrap{grid-column:2;grid-row:1;}
        #hp-knights-container .hp-knights-message-right .hp-knights-message-bubble{grid-column:1;grid-row:1;background:var(--hp-primary-light);border-color:var(--hp-primary-soft);}
        #hp-knights-container .hp-knights-message-avatar{width:62px;height:62px;border-radius:50%;object-fit:cover;object-position:center 16%;display:block;border:2px solid var(--hp-primary-soft);background:#fff;}
        #hp-knights-container .hp-knights-avatar-fallback{display:flex;align-items:center;justify-content:center;background:var(--hp-primary);color:#fff;font-weight:900;}
        #hp-knights-container .hp-knights-message-bubble{position:relative;background:#f7f9fb;border:1px solid #dde7ef;border-radius:16px;padding:8px 12px;color:#222;line-height:1.32;min-height:62px;display:flex;flex-direction:column;justify-content:center;}
        #hp-knights-container .hp-knights-message-name{font-size:12px;font-weight:900;color:var(--hp-primary-dark);margin-bottom:3px;}
        #hp-knights-container .hp-knights-message-text{font-size:14px;font-weight:700;}
        @keyframes hpKnightsMessagePop{0%{opacity:0;transform:translateY(8px) scale(.985);}100%{opacity:1;transform:translateY(0) scale(1);}}
        #hp-knights-container .hp-knights-logic{margin-top:10px;background:var(--hp-primary-light);border:1px solid var(--hp-primary-soft);border-radius:14px;padding:8px 10px;}
        #hp-knights-container .hp-knights-logic summary{cursor:pointer;font-weight:900;color:var(--hp-primary-dark);font-size:13px;}
        #hp-knights-container .hp-knights-logic pre{white-space:pre-wrap;font-size:15px;line-height:1.35;margin:8px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}
        #hp-knights-container .hp-knights-answer-grid{display:grid;grid-template-columns:repeat(${getConfig().people.length},minmax(0,1fr));gap:8px;margin:0 0 10px;}
        #hp-knights-container .hp-knights-person-card{position:relative;border:1px solid #e9eef3;border-radius:16px;background:#fff;padding:6px;box-shadow:0 8px 22px rgba(0,0,0,.045);transition:background-color .18s ease,border-color .18s ease;overflow:hidden;}
        #hp-knights-container .hp-knights-person-card.is-correct{background:#e3f7ec;border-color:#b7e4c7;}
        #hp-knights-container .hp-knights-person-card.is-incorrect{background:#fff0f1;border-color:#ffc7cf;}
        #hp-knights-container .hp-knights-person-card.is-revealed{background:#edf6ff;border-color:#b9d7ef;}
        #hp-knights-container .hp-knights-card-icon{position:absolute;top:12px;left:12px;z-index:4;font-size:24px!important;line-height:1!important;font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 40!important;background:rgba(255,255,255,.88);border-radius:50%;}
        #hp-knights-container .hp-knights-person-card.is-correct .hp-knights-card-icon{color:var(--hp-success);}
        #hp-knights-container .hp-knights-person-card.is-incorrect .hp-knights-card-icon{color:var(--hp-error);}
        #hp-knights-container .hp-knights-person-card.is-revealed .hp-knights-card-icon{color:var(--hp-blue);}
        #hp-knights-container .hp-knights-photo-wrap{position:relative;width:100%;aspect-ratio:4/5.05;border-radius:13px;overflow:hidden;background:var(--hp-primary-light);border:1px solid var(--hp-primary-soft);}
        #hp-knights-container .hp-knights-person-photo{width:100%;height:100%;object-fit:cover;object-position:center 14%;display:block;}
        #hp-knights-container .hp-knights-photo-fallback{display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;color:var(--hp-primary-dark);}
        #hp-knights-container .hp-knights-card-overlay{position:absolute;left:0;right:0;bottom:0;padding:7px;background:linear-gradient(to top,rgba(0,0,0,.80),rgba(0,0,0,.50),rgba(0,0,0,0));color:#fff;}
        #hp-knights-container .hp-knights-person-id{display:flex;align-items:center;gap:6px;justify-content:center;margin:0 0 5px;min-width:0;}
        #hp-knights-container .hp-knights-person-id span{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--hp-primary);color:#fff;font-weight:900;font-size:11px;flex:0 0 auto;}
        #hp-knights-container .hp-knights-person-id strong{font-size:13px;line-height:1;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        #hp-knights-container .hp-knights-choice-toggle{display:grid;grid-template-columns:1fr 1fr;background:rgba(255,255,255,.93);border:1px solid rgba(255,255,255,.75);border-radius:999px;padding:2px;gap:2px;}
        #hp-knights-container .hp-knights-choice{border:0;background:transparent;color:var(--hp-primary-dark);border-radius:999px;padding:4px 5px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;line-height:1.1;}
        #hp-knights-container .hp-knights-choice.active{background:var(--hp-primary);color:#fff;box-shadow:0 1px 5px rgba(0,0,0,.2);}
        #hp-knights-container .hp-knights-choice:disabled{cursor:not-allowed;opacity:.88;}
        #hp-knights-container .hp-knights-revealed-label{text-align:center;margin-top:4px;font-size:11px;line-height:1.1;font-weight:900;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6);}
        #hp-knights-container .hp-knights-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:2px;}
        #hp-knights-container .hp-knights-actions button,#hp-knights-container .hp-knights-actions a{border:2px solid var(--hp-primary);border-radius:12px;min-height:30px;padding:4px 8px;font-size:13px;font-family:inherit;font-weight:900;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;text-align:center;}
        #hp-knights-container .hp-knights-primary{background:var(--hp-primary);color:#fff;border-color:var(--hp-primary);transition:all .18s ease;}
        #hp-knights-container .hp-knights-secondary{background:#fff;color:var(--hp-primary-dark);border-color:var(--hp-primary-soft);transition:all .18s ease;}
        #hp-knights-container .hp-knights-primary:hover,#hp-knights-container .hp-knights-primary:focus-visible{background:#fff;border-color:var(--hp-primary-soft);color:var(--hp-primary-dark);transform:translateY(-1px);outline:none;}
        #hp-knights-container .hp-knights-secondary:hover,#hp-knights-container .hp-knights-secondary:focus-visible{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;transform:translateY(-1px);outline:none;}
        #hp-knights-container .hp-knights-secondary.active{background:var(--hp-primary-light);border-color:var(--hp-primary);color:var(--hp-primary-dark);}
        #hp-knights-container .hp-knights-secondary.active:hover,#hp-knights-container .hp-knights-secondary.active:focus-visible{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff;}
        #hp-knights-container .hp-knights-logic-panel{display:none;margin:10px 0 0;background:var(--hp-primary-light);border:1px solid var(--hp-primary-soft);border-radius:14px;padding:10px 12px;}
        #hp-knights-container .hp-knights-logic-panel.show{display:block;}
        #hp-knights-container .hp-knights-logic-panel pre{white-space:pre-wrap;font-size:15px;line-height:1.35;margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--hp-primary-dark);}
        #hp-knights-container .hp-knights-overlay{position:absolute;inset:0;z-index:50;background:rgba(255,255,255,.78);border-radius:18px;padding:16px;display:none;align-items:center;justify-content:center;}
        #hp-knights-container .hp-knights-overlay.on{display:flex;}
        #hp-knights-container .hp-knights-modal{background:#fff;width:min(720px,100%);border-radius:18px;padding:30px 36px 32px;border:1px solid #e9eef3;box-shadow:0 18px 48px rgba(0,0,0,.18);text-align:center;color:#222;max-height:calc(100% - 24px);overflow-y:auto;position:relative;}
        #hp-knights-container .hp-knights-overlay-close{position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;border-radius:999px;background:#fff;color:var(--hp-primary-dark);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.10);transition:all .18s ease;}
        #hp-knights-container .hp-knights-overlay-close:hover{background:var(--hp-primary);color:#fff;transform:translateY(-1px);}
        #hp-knights-container .hp-knights-overlay-close .material-symbols-outlined{font-size:22px!important;font-variation-settings:'FILL' 0,'wght' 800,'GRAD' 0,'opsz' 24!important;}
        #hp-knights-container .hp-knights-overlay-icon{font-size:30px!important;color:var(--hp-primary-dark);font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 40!important;margin-bottom:8px;}
        #hp-knights-container .hp-knights-overlay-status{font-weight:900;color:#555;margin:0 0 8px;font-size:24px;line-height:1.1;}
        #hp-knights-container .hp-knights-modal h3{margin:0 0 18px;color:var(--hp-primary-dark);font-size:28px;line-height:1.15;}
        #hp-knights-container .hp-knights-overlay-stat-row{display:flex;flex-wrap:nowrap;justify-content:center;gap:0 18px;font-size:14px;font-weight:800;color:#555;margin:12px auto 14px;white-space:nowrap;}
        #hp-knights-container .hp-knights-overlay-stat-row span{display:inline-flex;align-items:center;gap:4px;}
        #hp-knights-container .hp-knights-overlay-stat-row .material-symbols-outlined{font-size:16px;color:var(--hp-primary-dark);font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 40!important;}
        #hp-knights-container .hp-knights-overlay-stat-row strong{color:var(--hp-primary-dark);}
        #hp-knights-container .hp-knights-overlay-mode-summary{display:flex;justify-content:center;gap:10px;flex-wrap:nowrap;margin:12px auto 18px;}
        #hp-knights-container .hp-knights-overlay-mode-pill{display:inline-flex;flex-direction:column;align-items:center;gap:3px;min-width:104px;padding:8px 12px;border-radius:999px;border:1px solid #e5e7eb;background:#f8fafc;color:#555;font-size:14px;line-height:1;font-weight:900;}
        #hp-knights-container .hp-knights-overlay-mode-pill.solved{border-color:rgba(0,165,79,.28);background:rgba(0,165,79,.08);color:#08783f;}
        #hp-knights-container .hp-knights-overlay-mode-pill.revealed{border-color:var(--hp-primary-soft);background:var(--hp-primary-light);color:var(--hp-primary-dark);}
        #hp-knights-container .hp-knights-overlay-mode-pill.in-progress{border-color:rgba(247,148,28,.32);background:rgba(247,148,28,.10);color:#9a5700;}
        #hp-knights-container .hp-knights-modal-actions{margin-top:14px;text-align:center;}
        #hp-knights-container .hp-knights-overlay-message{margin:18px auto 16px;font-size:22px;line-height:1.25;color:#222;font-weight:500;}
        #hp-knights-container .hp-knights-overlay-next-copy{margin:18px auto 16px;display:flex;flex-direction:column;align-items:center;gap:5px;color:#555;font-size:18px;line-height:1.25;font-weight:800;text-align:center;}
        #hp-knights-container .hp-knights-overlay-next-copy strong{font-size:22px;color:#555;font-weight:900;}
        #hp-knights-container .hp-knights-overlay-next-copy span{display:block;}
        #hp-knights-container .hp-knights-modal-buttons{display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px;}
        #hp-knights-container .hp-knights-modal-actions button,#hp-knights-container .hp-knights-modal-actions a{border:2px solid transparent;border-radius:14px;min-height:42px;min-width:220px;padding:10px 22px;font-weight:900;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-family:inherit;font-size:14px;line-height:1.1;}
        @media(max-width:980px) and (min-width:761px){#hp-knights-container .hp-knights-answer-grid{grid-template-columns:repeat(${getConfig().people.length === 5 ? 3 : Math.min(getConfig().people.length,2)},minmax(0,1fr));}#hp-knights-container .hp-knights-photo-wrap{aspect-ratio:4/4.75;}}
        @media(max-width:760px){#hp-knights-container .hp-knights-modal{width:min(720px,100%);padding:22px 16px;}#hp-knights-container .hp-knights-overlay-stat-row{flex-wrap:wrap;gap:6px 12px;}#hp-knights-container .hp-knights-overlay-mode-summary{flex-wrap:wrap;}#hp-knights-container .hp-knights-top{display:block;}#hp-knights-container .hp-knights-mode-switch{max-width:none;margin-bottom:8px;}#hp-knights-container .hp-knights-status{font-size:15px;line-height:1.25;}#hp-knights-container .hp-knights-statements{padding:11px 10px;}#hp-knights-container .hp-knights-message{grid-template-columns:58px auto;max-width:100%;}#hp-knights-container .hp-knights-message-right{grid-template-columns:auto 58px;}#hp-knights-container .hp-knights-message-avatar{width:58px;height:58px;}#hp-knights-container .hp-knights-message-bubble{min-height:58px;}#hp-knights-container .hp-knights-answer-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}#hp-knights-container .hp-knights-answer-grid .hp-knights-person-card:last-child:nth-child(odd){grid-column:1 / -1;width:calc(50% - 4px);justify-self:center;}#hp-knights-container .hp-knights-photo-wrap{aspect-ratio:4/5.15;}#hp-knights-container .hp-knights-actions{grid-template-columns:repeat(2,minmax(0,1fr));}#hp-knights-container .hp-knights-overlay-mode-summary{flex-wrap:wrap;}}
      </style>
      ${hasMultipleModes ? `<div class="hp-knights-top">${renderModeSwitch()}</div>` : ""}
      <div id="hp-knights-completion-status" class="hp-knights-completion-status"></div>
      <div id="hp-knights-status" class="hp-knights-status">Choose Knight or Knave for each person, then press Enter.</div>
      ${renderStatements(Boolean(playMessages))}
      ${renderAnswerControls()}
      <div class="hp-knights-actions">
        <button type="button" class="hp-knights-primary" data-a="check">Enter</button>
        <button type="button" class="hp-knights-secondary ${logicOpen ? "active" : ""}" data-a="toggle-logic">Logic Notation</button>
        <button type="button" class="hp-knights-secondary" data-a="reveal">Reveal Puzzle</button>
        <button type="button" class="hp-knights-secondary" data-a="reset">Start Over</button>
      </div>
      ${renderLogicPanel()}
      <div id="hp-knights-overlay" class="hp-knights-overlay" aria-hidden="true"></div>`;
      renderCompletionStatus();
      if (playMessages) {
        scheduleMessageSounds((cfg.statements || []).length, { force: currentRenderReason === "mode-switch" });
      }
      allowNextMessageSound = false;
      currentRenderReason = "update";
      if (states[currentMode].solved || states[currentMode].revealed) showOverlay(states[currentMode].solved ? "solved" : "revealed");
    }

    function setStatus(message, cls = "") {
      const el = mount.querySelector("#hp-knights-status");
      if (!el) return;
      el.className = `hp-knights-status ${cls}`.trim();
      el.textContent = message;
    }

    function answerPerson(letter, value) {
      const state = states[currentMode];
      if (state.solved || state.revealed) return;
      if (!state.startedAt) state.startedAt = new Date().toISOString();
      state.answers[letter] = value;
      saveState(currentMode, "save");
      renderUI({ playMessages:false });
    }

    function checkSolution() {
      const cfg = getConfig();
      const state = states[currentMode];
      if (state.solved || state.revealed) return;
      const missing = cfg.letters.filter(letter => !["K","N"].includes(String(state.answers[letter] || "").toUpperCase()));
      if (missing.length) return setStatus(`Choose Knight or Knave for ${missing.join(", ")} first.`, "bad");
      const wrong = cfg.letters.filter(letter => String(state.answers[letter] || "").toUpperCase() !== String(cfg.solution[letter]).toUpperCase());
      if (!wrong.length) {
        state.solved = true;
        state.revealed = false;
        state.solvedAt = state.solvedAt || new Date().toISOString();
        state.revealedAt = "";
        state.overlaySeen = false;
        saveState(currentMode, "solved");
        renderUI({ playMessages:false });
        setStatus("Congratulations! You solved this puzzle.", "good");
        showOverlay("solved");
        return;
      }
      state.lastIncorrectAt = new Date().toISOString();
      saveState(currentMode, "check");
      setStatus("Incorrect. Try Again.", "bad");
    }

    function revealPuzzle() {
      const state = states[currentMode];
      if (state.solved || state.revealed) return;
      if (!confirm("Reveal the answer? This will end this level.")) return;
      state.solved = false;
      state.revealed = true;
      state.revealedAt = state.revealedAt || new Date().toISOString();
      state.overlaySeen = false;
      saveState(currentMode, "revealed");
      renderUI({ playMessages:false });
      showOverlay("revealed");
    }

    function resetLevel() {
      const state = states[currentMode];
      const hasProgress = Object.keys(state.answers || {}).length || state.solved || state.revealed;
      if (hasProgress && !confirm("Start this level over? This will clear your current choices for this level.")) return;
      states[currentMode] = defaultState();
      try { localStorage.removeItem(getSaveKey(currentMode)); } catch {}
      emitStateChange(currentMode, "reset");
      renderUI({ playMessages:false });
    }

    function switchMode(mode) {
      if (!PUZZLES[mode]) return;
      currentMode = mode;
      logicOpen = false;
      allowNextMessageSound = true;
      currentRenderReason = "mode-switch";
      unlockMessageAudio();
      renderUI({ playMessages:true });
      emitStateChange(currentMode, "mode-change");
    }

    function showHelp() {}

    function handleClick(event) {
      const target = event.target.closest("[data-a]");
      if (!target) return;
      const action = target.dataset.a;
      if (action === "answer") answerPerson(target.dataset.person, target.dataset.value);
      if (action === "check") checkSolution();
      if (action === "reveal") revealPuzzle();
      if (action === "reset") resetLevel();
      if (action === "toggle-logic") { logicOpen = !logicOpen; renderUI({ playMessages:false }); }
      if (action === "mode") switchMode(target.dataset.mode);
      if (action === "close-overlay") hideOverlay();
      if (action === "share") shareCurrentPuzzle();
      if (action === "request-next" && typeof window.HareKnightsRequestNextPuzzle === "function") window.HareKnightsRequestNextPuzzle(target.dataset.nextKind || "recommended");
    }

    renderUI({ playMessages:true });
    mount.addEventListener("click", handleClick);
    document.addEventListener("pointerdown", unlockMessageAudio, { once:true, passive:true });
    document.addEventListener("keydown", unlockMessageAudio, { once:true });
    container.__hpKnightsPlatformCleanup = () => { mount.removeEventListener("click", handleClick); document.removeEventListener("pointerdown", unlockMessageAudio); document.removeEventListener("keydown", unlockMessageAudio); delete container.__hpKnightsPlatformCleanup; };
  }
};

/* =========================================================
   HARE PUBLISHING PUZZLE PLAYER PROFILES
   Version 1.1

   Local-only household player selector.
   - No login
   - No email
   - No network calls
   - Stores profiles only in this browser
   - Changing the active player applies globally across the puzzle platform
   ========================================================= */

(function () {
  "use strict";

  if (window.HarePuzzlePlayerProfiles?.version) return;

  const VERSION = "1.1";
  const MAX_PROFILES = 4;
  const PROFILE_STORE_KEY = "hp_player_profiles_v1";
  const ACTIVE_PROFILE_KEY = "hp_active_player_profile_v1";
  const DEFAULT_PROFILE_ID = "default";

  const DEFAULT_PROFILE = {
    id: DEFAULT_PROFILE_ID,
    name: "Player 1",
    createdAt: "default"
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function safeJSON(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function readProfiles() {
    const raw = safeJSON(localStorage.getItem(PROFILE_STORE_KEY), null);
    const profiles = Array.isArray(raw) ? raw : [];
    const cleaned = profiles
      .filter(profile => profile && profile.id && profile.name)
      .map(profile => ({
        id: String(profile.id),
        name: String(profile.name).slice(0, 32),
        createdAt: String(profile.createdAt || nowIso())
      }));

    if (!cleaned.some(profile => profile.id === DEFAULT_PROFILE_ID)) {
      cleaned.unshift({ ...DEFAULT_PROFILE });
    }

    return cleaned.slice(0, MAX_PROFILES);
  }

  function writeProfiles(profiles) {
    localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(profiles.slice(0, MAX_PROFILES)));
  }

  function getActiveProfileId() {
    const profiles = readProfiles();
    const stored = localStorage.getItem(ACTIVE_PROFILE_KEY) || DEFAULT_PROFILE_ID;
    return profiles.some(profile => profile.id === stored) ? stored : DEFAULT_PROFILE_ID;
  }

  function getActiveProfile() {
    const profiles = readProfiles();
    const id = getActiveProfileId();
    return profiles.find(profile => profile.id === id) || profiles[0] || { ...DEFAULT_PROFILE };
  }

  function makeProfileId() {
    if (window.crypto?.randomUUID) return `player_${window.crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    return `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function cleanName(name) {
    return String(name || "").trim().replace(/\s+/g, " ").slice(0, 32);
  }

  function emitChange() {
    const detail = {
      activeProfile: getActiveProfile(),
      profiles: readProfiles()
    };

    window.dispatchEvent(new CustomEvent("hare:puzzle-profile-changed", { detail }));
    renderAll();
  }

  function setActiveProfile(profileId) {
    const profiles = readProfiles();
    const id = String(profileId || DEFAULT_PROFILE_ID);
    const next = profiles.some(profile => profile.id === id) ? id : DEFAULT_PROFILE_ID;
    localStorage.setItem(ACTIVE_PROFILE_KEY, next);
    emitChange();
    return getActiveProfile();
  }

  function addProfile(name) {
    const profiles = readProfiles();
    if (profiles.length >= MAX_PROFILES) {
      throw new Error(`You can have up to ${MAX_PROFILES} player profiles in this browser.`);
    }

    const safeName = cleanName(name) || `Player ${profiles.length + 1}`;
    const profile = {
      id: makeProfileId(),
      name: safeName,
      createdAt: nowIso()
    };

    profiles.push(profile);
    writeProfiles(profiles);
    localStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
    emitChange();
    return profile;
  }

  function renameProfile(profileId, name) {
    const safeName = cleanName(name);
    if (!safeName) return getActiveProfile();

    const profiles = readProfiles();
    const nextProfiles = profiles.map(profile => (
      profile.id === profileId ? { ...profile, name: safeName } : profile
    ));

    writeProfiles(nextProfiles);
    emitChange();
    return nextProfiles.find(profile => profile.id === profileId) || getActiveProfile();
  }

  function deleteProfile(profileId) {
    const id = String(profileId || "");
    if (id === DEFAULT_PROFILE_ID) return getActiveProfile();

    const profiles = readProfiles();
    const nextProfiles = profiles.filter(profile => profile.id !== id);
    writeProfiles(nextProfiles);

    if (getActiveProfileId() === id) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, DEFAULT_PROFILE_ID);
    }

    emitChange();
    return getActiveProfile();
  }

  function scopedStorageKey(baseKey) {
    const key = String(baseKey || "");
    const active = getActiveProfile();

    // The default profile deliberately keeps old storage keys unchanged so existing
    // solo-player progress continues to work exactly as it does today.
    if (!active || active.id === DEFAULT_PROFILE_ID) return key;

    return `hp_profile_${active.id}__${key}`;
  }

  function injectStyles() {
    if (document.getElementById("hp-player-profile-styles")) return;

    const style = document.createElement("style");
    style.id = "hp-player-profile-styles";
    style.textContent = `
      .hp-player-profile-widget,
      .hp-player-profile-widget * {
        box-sizing: border-box;
      }

      .hp-player-profile-widget {
        --hp-profile-blue: #107FBB;
        --hp-profile-blue-dark: #0a5f90;
        --hp-profile-green: #00A54F;
        --hp-profile-red: #ED1B24;
        --hp-profile-text: #24323d;
        --hp-profile-border: #d9e9f6;
        --hp-profile-bg: #f7fbff;
        width: 100%;
        max-width: 420px;
        margin: 0 auto 10px;
        font-family: Roboto, Arial, sans-serif;
        color: var(--hp-profile-text);
      }

      .hp-player-profile-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--hp-profile-border);
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 5px 14px rgba(0,0,0,.04);
      }

      .hp-player-profile-copy {
        min-width: 0;
      }

      .hp-player-profile-label {
        margin: 0 0 1px;
        color: #627181;
        font-size: 10px;
        line-height: 1.15;
        font-weight: 900;
        text-transform: uppercase;
      }

      .hp-player-profile-name {
        margin: 0;
        color: var(--hp-profile-text);
        font-size: 15px;
        line-height: 1.2;
        font-weight: 900;
        overflow-wrap: anywhere;
      }

      .hp-player-profile-switch {
        flex: 0 0 auto;
        min-height: 34px;
        padding: 7px 11px;
        border: 2px solid var(--hp-profile-blue);
        border-radius: 11px;
        background: #fff;
        color: var(--hp-profile-blue);
        font: inherit;
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
        transition: background .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease;
      }

      .hp-player-profile-switch:hover,
      .hp-player-profile-switch:focus-visible {
        background: var(--hp-profile-blue);
        color: #fff;
        transform: translateY(-1px);
        box-shadow: 0 7px 16px rgba(16,127,187,.16);
        outline: none;
      }

      .hp-player-profile-modal {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(20,30,40,.46);
      }

      .hp-player-profile-modal.on {
        display: flex;
      }

      .hp-player-profile-card {
        width: min(500px, 100%);
        max-height: min(680px, 88vh);
        overflow-y: auto;
        padding: 22px;
        border-radius: 20px;
        background: #fff;
        box-shadow: 0 22px 70px rgba(0,0,0,.24);
      }

      .hp-player-profile-card h3 {
        margin: 0 0 6px;
        color: var(--hp-profile-text);
        font-size: 24px;
        line-height: 1.15;
        font-weight: 900;
        text-align: center;
      }

      .hp-player-profile-note {
        margin: 0 0 16px;
        color: #607080;
        font-size: 14px;
        line-height: 1.35;
        text-align: center;
      }

      .hp-player-profile-list {
        display: grid;
        gap: 10px;
        margin: 0 0 16px;
      }

      .hp-player-profile-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 8px;
        align-items: center;
        padding: 10px;
        border: 1px solid #e3edf6;
        border-radius: 14px;
        background: #fff;
      }

      .hp-player-profile-row.active {
        border-color: rgba(0,165,79,.45);
        background: #f3fff9;
      }

      .hp-player-profile-select,
      .hp-player-profile-small,
      .hp-player-profile-add,
      .hp-player-profile-close {
        min-height: 38px;
        border-radius: 12px;
        font: inherit;
        font-size: 13px;
        font-weight: 900;
        cursor: pointer;
      }

      .hp-player-profile-select {
        min-width: 0;
        padding: 8px 10px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--hp-profile-text);
        text-align: left;
        overflow-wrap: anywhere;
      }

      .hp-player-profile-row.active .hp-player-profile-select {
        color: #08783f;
      }

      .hp-player-profile-small {
        padding: 8px 10px;
        border: 1px solid #d7e6f2;
        background: #fff;
        color: #425160;
      }

      .hp-player-profile-small.delete {
        color: var(--hp-profile-red);
        border-color: rgba(237,27,36,.28);
      }

      .hp-player-profile-add-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        margin: 10px 0 16px;
      }

      .hp-player-profile-input {
        width: 100%;
        min-height: 42px;
        padding: 10px 12px;
        border: 1px solid #d8e7f4;
        border-radius: 12px;
        font: inherit;
        font-size: 15px;
      }

      .hp-player-profile-add,
      .hp-player-profile-close {
        padding: 10px 14px;
        border: 2px solid var(--hp-profile-blue);
        background: var(--hp-profile-blue);
        color: #fff;
      }

      .hp-player-profile-close {
        width: 100%;
        background: #fff;
        color: var(--hp-profile-blue);
      }

      .hp-player-profile-limit {
        margin: 0 0 16px;
        color: #607080;
        font-size: 13px;
        font-weight: 800;
        text-align: center;
      }

      @media (max-width: 520px) {
        .hp-player-profile-widget {
          max-width: none;
          margin-bottom: 8px;
        }

        .hp-player-profile-bar {
          align-items: center;
          flex-direction: row;
          gap: 8px;
          padding: 7px 8px;
          border-radius: 11px;
        }

        .hp-player-profile-switch {
          width: auto;
          min-width: 116px;
          min-height: 34px;
          padding: 7px 9px;
          font-size: 12px;
        }

        .hp-player-profile-name {
          font-size: 14px;
        }

        .hp-player-profile-label {
          font-size: 9px;
        }

        .hp-player-profile-row {
          grid-template-columns: minmax(0, 1fr);
        }

        .hp-player-profile-small {
          width: 100%;
        }

        .hp-player-profile-add-row {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function openModal(widgetId) {
    injectStyles();
    const modalId = `hp-player-profile-modal-${widgetId}`;
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const profiles = readProfiles();
    const active = getActiveProfile();
    const canAdd = profiles.length < MAX_PROFILES;

    const modal = document.createElement("div");
    modal.className = "hp-player-profile-modal on";
    modal.id = modalId;
    modal.setAttribute("role", "presentation");
    modal.innerHTML = `
      <div class="hp-player-profile-card" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
        <h3 id="${modalId}-title">Who&rsquo;s Playing?</h3>
        <p class="hp-player-profile-note">This only separates puzzle progress in this browser.</p>
        <div class="hp-player-profile-list">
          ${profiles.map(profile => `
            <div class="hp-player-profile-row ${profile.id === active.id ? "active" : ""}" data-hp-profile-row="${escapeHtml(profile.id)}">
              <button class="hp-player-profile-select" type="button" data-hp-profile-select="${escapeHtml(profile.id)}">
                ${escapeHtml(profile.name)}${profile.id === active.id ? " - current" : ""}
              </button>
              <button class="hp-player-profile-small" type="button" data-hp-profile-rename="${escapeHtml(profile.id)}">Rename</button>
              ${profile.id === DEFAULT_PROFILE_ID ? "" : `<button class="hp-player-profile-small delete" type="button" data-hp-profile-delete="${escapeHtml(profile.id)}">Delete</button>`}
            </div>
          `).join("")}
        </div>
        ${canAdd ? `
          <form class="hp-player-profile-add-row" data-hp-profile-add-form>
            <input class="hp-player-profile-input" name="playerName" maxlength="32" placeholder="New player name" autocomplete="off" data-hp-profile-new-name>
            <button class="hp-player-profile-add" type="submit">Add Player</button>
          </form>
        ` : `<p class="hp-player-profile-limit">This browser has the maximum of ${MAX_PROFILES} player profiles.</p>`}
        <button class="hp-player-profile-close" type="button" data-hp-profile-close>Done</button>
      </div>
    `;

    function savePendingNewProfile() {
      const input = modal.querySelector("[data-hp-profile-new-name]");
      const value = cleanName(input?.value || "");
      if (!value) return false;
      addProfile(value);
      return true;
    }

    function close() {
      modal.remove();
    }

    modal.addEventListener("click", event => {
      if (event.target === modal || event.target.matches("[data-hp-profile-close]")) {
        savePendingNewProfile();
        close();
        return;
      }

      const selectButton = event.target.closest("[data-hp-profile-select]");
      if (selectButton) {
        setActiveProfile(selectButton.getAttribute("data-hp-profile-select"));
        close();
        return;
      }

      const renameButton = event.target.closest("[data-hp-profile-rename]");
      if (renameButton) {
        const id = renameButton.getAttribute("data-hp-profile-rename");
        const profile = readProfiles().find(item => item.id === id);
        const nextName = window.prompt("Rename player profile:", profile?.name || "");
        if (nextName) {
          renameProfile(id, nextName);
          close();
          openModal(widgetId);
        }
        return;
      }

      const deleteButton = event.target.closest("[data-hp-profile-delete]");
      if (deleteButton) {
        const id = deleteButton.getAttribute("data-hp-profile-delete");
        const profile = readProfiles().find(item => item.id === id);
        if (window.confirm(`Delete ${profile?.name || "this player"} from this browser?`)) {
          deleteProfile(id);
          close();
          openModal(widgetId);
        }
      }
    });

    modal.addEventListener("submit", event => {
      if (!event.target.matches("[data-hp-profile-add-form]")) return;
      event.preventDefault();
      const input = event.target.elements.playerName;
      addProfile(input.value);
      close();
    });

    document.body.appendChild(modal);
  }

  function renderWidget(host, index) {
    injectStyles();
    const active = getActiveProfile();
    const widgetId = host.dataset.hpPlayerProfileId || `profile-${index + 1}`;
    host.dataset.hpPlayerProfileId = widgetId;
    host.classList.add("hp-player-profile-widget");
    host.innerHTML = `
      <div class="hp-player-profile-bar">
        <div class="hp-player-profile-copy">
          <p class="hp-player-profile-label">Playing as</p>
          <p class="hp-player-profile-name">${escapeHtml(active.name)}</p>
        </div>
        <button class="hp-player-profile-switch" type="button" data-hp-profile-open>Switch Player</button>
      </div>
    `;

    host.querySelector("[data-hp-profile-open]")?.addEventListener("click", () => openModal(widgetId));
  }

  function renderAll() {
    document.querySelectorAll("[data-hp-player-profile]").forEach(renderWidget);
  }

  function init() {
    readProfiles();
    if (!localStorage.getItem(ACTIVE_PROFILE_KEY)) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, DEFAULT_PROFILE_ID);
    }
    renderAll();
  }

  window.HarePuzzlePlayerProfiles = {
    version: VERSION,
    maxProfiles: MAX_PROFILES,
    getProfiles: readProfiles,
    getActiveProfile,
    getActiveProfileId,
    setActiveProfile,
    addProfile,
    renameProfile,
    deleteProfile,
    scopedStorageKey,
    renderAll,
    init
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

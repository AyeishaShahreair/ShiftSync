// availability.js
// -----------------------------------------------------------------------------
// The employee availability page: paint slots green (preferred) or
// red (definite conflict) by clicking or click-and-dragging.
// -----------------------------------------------------------------------------

import { scheduleSettings, SLOT_STATES } from "./config.js";
import { createGrid } from "./grid.js";
import { loadAvailability, saveAvailability } from "./database.js";
import { requireLogin } from "./auth.js";
import { renderNav, renderFooter } from "./layout.js";

// The logged-in user's id. Set when the page starts (see start() at the bottom).
let userId = null;

// ---- Page state ----

// Which color clicking paints with right now: "preferred" or "conflict".
let currentMode = SLOT_STATES.PREFERRED;

// The employee's availability: { "mon-06:00": "preferred", "tue-14:30": "conflict", ... }
// Slots that aren't in here are "free" (gray).
let availability = {};

// While the mouse/finger is held down, every slot it passes over gets this state.
// It's null when nobody is dragging.
let dragState = null;

// True when there are changes that haven't been saved yet.
let hasUnsavedChanges = false;

// ---- Find the elements on the page ----
const gridContainer = document.getElementById("availability-grid");
const modeButtons = document.querySelectorAll("[data-mode]");
const clearButton = document.getElementById("clear-all");
const saveButton = document.getElementById("save");
const statusMessage = document.getElementById("save-status");

// Draw the grid and keep a lookup of slot id -> slot button.
const slots = createGrid(gridContainer, scheduleSettings);

// ---- Helpers ----

// Get a slot's current state ("free" if it isn't stored).
function getState(key) {
  return availability[key] || SLOT_STATES.FREE;
}

// Show a short message under the Save button. `type` picks the color.
function showStatus(text, type = "") {
  statusMessage.textContent = text;
  statusMessage.dataset.type = type;
}

// Remember that something changed, so we can remind the user to save.
function markUnsaved() {
  if (!hasUnsavedChanges) {
    hasUnsavedChanges = true;
    showStatus("You have unsaved changes.", "warning");
  }
}

// Change one slot's state, both in our data and on screen.
function setState(key, state) {
  if (state === SLOT_STATES.FREE) {
    delete availability[key]; // free is the default, so we don't store it
  } else {
    availability[key] = state;
  }

  const slot = slots.get(key);
  slot.dataset.state = state; // CSS uses this attribute to pick the color
  // Screen readers read this out, e.g. "Monday 6:00 AM: preferred"
  slot.setAttribute("aria-label", `${slot.dataset.label}: ${state}`);
}

// Play a quick "pop" animation on a slot (see .slot.pop in the CSS).
function animate(key) {
  const slot = slots.get(key);
  slot.classList.remove("pop");
  void slot.offsetWidth; // forces the browser to restart the animation
  slot.classList.add("pop");
}

// Clicking a slot that already has the current color clears it;
// otherwise it gets painted with the current color.
function stateAfterClick(key) {
  return getState(key) === currentMode ? SLOT_STATES.FREE : currentMode;
}

// Find the slot under a mouse/finger position (or null if there isn't one).
function slotAtPoint(x, y) {
  const element = document.elementFromPoint(x, y);
  return element ? element.closest(".slot") : null;
}

// ---- Click and drag painting ----
// We use "pointer" events, which work for both mouse and touch screens.

gridContainer.addEventListener("pointerdown", (event) => {
  const slot = event.target.closest(".slot");
  if (!slot) return;
  event.preventDefault(); // stop text from being selected while dragging

  // The first slot decides what the whole drag does: paint or erase.
  dragState = stateAfterClick(slot.dataset.key);
  setState(slot.dataset.key, dragState);
  animate(slot.dataset.key);
  markUnsaved();
});

gridContainer.addEventListener("pointermove", (event) => {
  if (dragState === null) return;
  const slot = slotAtPoint(event.clientX, event.clientY);
  if (slot && getState(slot.dataset.key) !== dragState) {
    setState(slot.dataset.key, dragState);
    animate(slot.dataset.key);
    markUnsaved();
  }
});

// Stop painting when the mouse/finger is released anywhere on the page.
function stopDragging() {
  dragState = null;
}
window.addEventListener("pointerup", stopDragging);
window.addEventListener("pointercancel", stopDragging);

// Keyboard users: Tab to a slot and press Enter or Space.
// (A keyboard "click" has event.detail === 0; mouse clicks are already
// handled by pointerdown above, so we skip those here.)
gridContainer.addEventListener("click", (event) => {
  const slot = event.target.closest(".slot");
  if (!slot || event.detail !== 0) return;
  setState(slot.dataset.key, stateAfterClick(slot.dataset.key));
  animate(slot.dataset.key);
  markUnsaved();
});

// ---- Mode toggle (Preferred / Definite conflict) ----

function setMode(mode) {
  currentMode = mode;
  for (const button of modeButtons) {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive);
  }
}

for (const button of modeButtons) {
  button.addEventListener("click", () => setMode(button.dataset.mode));
}

// ---- Clear all ----

clearButton.addEventListener("click", () => {
  if (!confirm("Clear all of your availability?")) return;
  for (const key of slots.keys()) {
    setState(key, SLOT_STATES.FREE);
  }
  markUnsaved();
});

// ---- Save ----

saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;
  showStatus("Saving…");
  try {
    await saveAvailability(userId, availability);
    hasUnsavedChanges = false;
    showStatus("Saved ✓", "success");
  } catch (error) {
    console.error(error);
    showStatus("Couldn't save. Check your connection and try again.", "error");
  } finally {
    saveButton.disabled = false;
  }
});

// Warn before leaving the page if there are unsaved changes.
window.addEventListener("beforeunload", (event) => {
  if (hasUnsavedChanges) event.preventDefault();
});

// ---- Start up ----

// Show the saved slots on the grid (anything not saved stays gray).
function showOnGrid(savedSlots) {
  for (const key of slots.keys()) {
    // Ignore saved slots that no longer exist (e.g. if the hours in config.js changed).
    setState(key, savedSlots[key] || SLOT_STATES.FREE);
  }
}

async function start() {
  renderFooter();
  setMode(SLOT_STATES.PREFERRED);
  showOnGrid({});
  saveButton.disabled = true; // until we know who is logged in

  // Not logged in? requireLogin sends them to the login page.
  const { user, profile } = await requireLogin();
  userId = user.uid;
  renderNav(profile);

  showStatus("Loading your availability…");
  try {
    showOnGrid(await loadAvailability(userId));
    showStatus("");
    saveButton.disabled = false;
  } catch (error) {
    console.error(error);
    showStatus("Couldn't load your saved availability. Try refreshing the page.", "error");
  }
}

start();

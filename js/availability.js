// availability.js
// -----------------------------------------------------------------------------
// The employee availability page: paint slots green (preferred) or
// red (definite conflict) by clicking or click-and-dragging.
// -----------------------------------------------------------------------------

import { scheduleSettings, SLOT_STATES } from "./config.js";
import { createGrid } from "./grid.js";

// ---- Page state ----

// Which color clicking paints with right now: "preferred" or "conflict".
let currentMode = SLOT_STATES.PREFERRED;

// The employee's availability: { "mon-06:00": "preferred", "tue-14:30": "conflict", ... }
// Slots that aren't in here are "free" (gray).
let availability = {};

// While the mouse/finger is held down, every slot it passes over gets this state.
// It's null when nobody is dragging.
let dragState = null;

// ---- Find the elements on the page ----
const gridContainer = document.getElementById("availability-grid");
const modeButtons = document.querySelectorAll("[data-mode]");
const clearButton = document.getElementById("clear-all");

// Draw the grid and keep a lookup of slot id -> slot button.
const slots = createGrid(gridContainer, scheduleSettings);

// ---- Helpers ----

// Get a slot's current state ("free" if it isn't stored).
function getState(key) {
  return availability[key] || SLOT_STATES.FREE;
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
});

gridContainer.addEventListener("pointermove", (event) => {
  if (dragState === null) return;
  const slot = slotAtPoint(event.clientX, event.clientY);
  if (slot && getState(slot.dataset.key) !== dragState) {
    setState(slot.dataset.key, dragState);
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
});

// ---- Start: every slot begins as free (gray) ----
for (const key of slots.keys()) {
  setState(key, SLOT_STATES.FREE);
}
setMode(SLOT_STATES.PREFERRED);

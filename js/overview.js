// overview.js
// -----------------------------------------------------------------------------
// The admin "Team overview" page: everyone's availability overlapped as a heatmap.
// - Each slot shows how many selected people PREFER it (darker green = more people).
// - Slots where anyone has a DEFINITE CONFLICT get a red outline and a ⚠ icon.
// - Hover, tap, or Tab to a slot to see who prefers it, who's free, and who can't.
// -----------------------------------------------------------------------------

import { scheduleSettings, SLOT_STATES } from "./config.js";
import { createGrid } from "./grid.js";
import { loadAllUsers, loadAllAvailability } from "./database.js";
import { requireLogin } from "./auth.js";
import { renderNav } from "./layout.js";

// ---- Page state ----

let people = [];              // everyone: [{ id, name, email, role }, ...] sorted by name
let availabilityById = {};    // { userId: { "mon-09:00": "preferred", ... } }
const selectedIds = new Set(); // ids of people currently ticked in the filter

// ---- Find the elements on the page ----
const gridContainer = document.getElementById("overview-grid");
const filterList = document.getElementById("employee-filter");
const filterCount = document.getElementById("filter-count");
const bestTimesList = document.getElementById("best-times");
const statusMessage = document.getElementById("overview-status");
const details = document.getElementById("slot-details");

const slots = createGrid(gridContainer, scheduleSettings);

// ---- Working out each slot ----

// For one slot, sort the selected people into three groups by their answer.
function groupPeople(key) {
  const groups = { preferred: [], free: [], conflict: [] };
  for (const person of people) {
    if (!selectedIds.has(person.id)) continue;
    const state = availabilityById[person.id]?.[key];
    // Anything that isn't "preferred" or "conflict" counts as free.
    const group = state === SLOT_STATES.PREFERRED || state === SLOT_STATES.CONFLICT ? state : "free";
    groups[group].push(person.name);
  }
  return groups;
}

// How dark the green should be: 0 (nobody) up to 4 (everyone selected prefers it).
function heatLevel(preferredCount) {
  if (preferredCount === 0 || selectedIds.size === 0) return 0;
  return Math.ceil((preferredCount / selectedIds.size) * 4);
}

// ---- Drawing ----

// Recolor every slot based on who is selected.
function drawHeatmap() {
  for (const [key, slot] of slots) {
    const groups = groupPeople(key);
    const count = groups.preferred.length;

    slot.dataset.level = heatLevel(count);
    slot.classList.toggle("has-conflict", groups.conflict.length > 0);
    slot.textContent = count > 0 ? count : "";

    // What a screen reader says for this slot.
    slot.setAttribute(
      "aria-label",
      `${slot.dataset.label}: ${count} prefer, ${groups.free.length} free, ${groups.conflict.length} can't work`
    );
  }
  drawBestTimes();
}

// List the top 3 times with the most people preferring them and nobody in conflict.
function drawBestTimes() {
  const candidates = [];
  for (const [key, slot] of slots) {
    const groups = groupPeople(key);
    if (groups.preferred.length > 0 && groups.conflict.length === 0) {
      candidates.push({ label: slot.dataset.label, count: groups.preferred.length });
    }
  }
  // Most people first. (Ties keep grid order: earlier in the week comes first.)
  candidates.sort((a, b) => b.count - a.count);

  bestTimesList.innerHTML = "";
  if (candidates.length === 0) {
    const text = selectedIds.size === 0
      ? "Select at least one employee below."
      : "No preferred times without conflicts yet.";
    bestTimesList.innerHTML = `<li class="empty">${text}</li>`;
    return;
  }
  for (const { label, count } of candidates.slice(0, 3)) {
    const item = document.createElement("li");
    item.textContent = `${label} · ${count} ${count === 1 ? "person" : "people"}`;
    bestTimesList.appendChild(item);
  }
}

// Build the checkbox list of employees.
function drawFilter() {
  filterList.innerHTML = "";
  for (const person of people) {
    const hasSaved = Object.keys(availabilityById[person.id] || {}).length > 0;

    const item = document.createElement("li");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedIds.has(person.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedIds.add(person.id);
      else selectedIds.delete(person.id);
      updateFilterCount();
      drawHeatmap();
    });

    const name = document.createElement("span");
    name.textContent = person.name; // textContent keeps names from injecting HTML
    label.append(checkbox, name);

    if (!hasSaved) {
      const note = document.createElement("span");
      note.className = "not-saved";
      note.textContent = "hasn't saved yet";
      label.appendChild(note);
    }

    item.appendChild(label);
    filterList.appendChild(item);
  }
  updateFilterCount();
}

function updateFilterCount() {
  filterCount.textContent = `${selectedIds.size} of ${people.length} shown`;
}

function setAllSelected(isSelected) {
  selectedIds.clear();
  if (isSelected) people.forEach((person) => selectedIds.add(person.id));
  drawFilter();
  drawHeatmap();
}

document.getElementById("select-all").addEventListener("click", () => setAllSelected(true));
document.getElementById("select-none").addEventListener("click", () => setAllSelected(false));

// ---- The names popup ----

// One section of the popup, e.g. "Prefer (2): Ana, Ben".
function detailsSection(title, names, className) {
  const section = document.createElement("div");
  section.className = `details-section ${className}`;
  const heading = document.createElement("strong");
  heading.textContent = `${title} (${names.length})`;
  const list = document.createElement("p");
  list.textContent = names.length ? names.join(", ") : "Nobody";
  section.append(heading, list);
  return section;
}

function showDetails(slot) {
  const groups = groupPeople(slot.dataset.key);
  const title = document.createElement("p");
  title.className = "details-title";
  title.textContent = slot.dataset.label;

  details.replaceChildren(
    title,
    detailsSection("Prefer", groups.preferred, "is-preferred"),
    detailsSection("Free if needed", groups.free, "is-free"),
    detailsSection("Can't work", groups.conflict, "is-conflict")
  );
  details.hidden = false;

  // Place the popup next to the slot, but keep it inside the screen.
  const slotBox = slot.getBoundingClientRect();
  const popupBox = details.getBoundingClientRect();
  const margin = 8;
  let left = slotBox.right + margin;
  if (left + popupBox.width > window.innerWidth - margin) {
    left = slotBox.left - popupBox.width - margin; // not enough room on the right
  }
  left = Math.max(margin, left);
  let top = slotBox.top + slotBox.height / 2 - popupBox.height / 2;
  top = Math.min(Math.max(margin, top), window.innerHeight - popupBox.height - margin);
  details.style.left = `${left}px`;
  details.style.top = `${top}px`;
}

function hideDetails() {
  details.hidden = true;
}

// Mouse: show on hover.
gridContainer.addEventListener("pointerover", (event) => {
  const slot = event.target.closest(".slot");
  if (slot && event.pointerType === "mouse") showDetails(slot);
});
gridContainer.addEventListener("pointerleave", (event) => {
  if (event.pointerType === "mouse") hideDetails();
});

// Touch screens and keyboard: show on tap / Enter, and when tabbing to a slot.
gridContainer.addEventListener("click", (event) => {
  const slot = event.target.closest(".slot");
  if (slot) showDetails(slot);
});
gridContainer.addEventListener("focusin", (event) => {
  const slot = event.target.closest(".slot");
  if (slot) showDetails(slot);
});

// Hide when tapping elsewhere, scrolling, or pressing Escape.
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".slot")) hideDetails();
});
window.addEventListener("scroll", hideDetails, { passive: true });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideDetails();
});

// ---- Start up ----

async function start() {
  // Only admins may see this page; everyone else is sent back to their own grid.
  const { profile } = await requireLogin({ adminOnly: true });
  renderNav(profile);

  statusMessage.textContent = "Loading team availability…";
  try {
    const [users, availability] = await Promise.all([loadAllUsers(), loadAllAvailability()]);
    people = users.sort((a, b) => a.name.localeCompare(b.name));
    availabilityById = availability;
    people.forEach((person) => selectedIds.add(person.id)); // everyone shown at first
    drawFilter();
    drawHeatmap();
    statusMessage.textContent = "";
  } catch (error) {
    console.error(error);
    statusMessage.textContent = "Couldn't load the team's availability. Try refreshing the page.";
    statusMessage.dataset.type = "error";
  }
}

start();

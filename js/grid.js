// grid.js
// -----------------------------------------------------------------------------
// Builds the weekly grid (days across the top, times down the side).
// This file only *draws* the grid. What happens when you click a slot is
// decided by the page that uses it (availability.js now, overview.js later).
// -----------------------------------------------------------------------------

// Turn "HH:MM" into the number of minutes since midnight. "06:30" -> 390
function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Turn minutes since midnight back into "HH:MM". 390 -> "06:30"
function toTimeString(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Turn "HH:MM" into a friendly label. "13:30" -> "1:30 PM"
export function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours < 12 ? "AM" : "PM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

// List every slot start time between startTime and endTime.
// e.g. ["06:00", "06:30", "07:00", ... "21:30"]
export function getSlotTimes(settings) {
  const times = [];
  const start = toMinutes(settings.startTime);
  const end = toMinutes(settings.endTime);
  for (let t = start; t < end; t += settings.slotMinutes) {
    times.push(toTimeString(t));
  }
  return times;
}

// Every slot has a unique id made from its day and time, e.g. "mon-06:30".
// This same id is used when saving to the database.
export function slotKey(dayKey, time) {
  return `${dayKey}-${time}`;
}

/**
 * Draw the grid inside `container`.
 * Returns a Map of slot id -> the slot's <button> element, so the page can
 * easily find and recolor any slot later.
 */
export function createGrid(container, settings) {
  const times = getSlotTimes(settings);
  const slotElements = new Map();

  container.innerHTML = "";
  container.classList.add("grid");
  // Tell CSS how many day columns there are (one extra column for times).
  container.style.setProperty("--day-count", settings.days.length);

  // --- Header row: an empty corner cell, then one cell per day ---
  const corner = document.createElement("div");
  corner.className = "grid-corner";
  container.appendChild(corner);

  for (const day of settings.days) {
    const header = document.createElement("div");
    header.className = "grid-day";
    header.innerHTML = `<span class="day-long">${day.label}</span><span class="day-short">${day.short}</span>`;
    container.appendChild(header);
  }

  // --- One row per time slot ---
  for (const time of times) {
    // The time label on the left. Only label the full hours to keep it tidy.
    const label = document.createElement("div");
    label.className = "grid-time";
    if (time.endsWith(":00")) {
      label.textContent = formatTime(time);
    }
    container.appendChild(label);

    // One clickable slot for each day in this row.
    for (const day of settings.days) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "slot";
      slot.dataset.key = slotKey(day.key, time);
      slot.dataset.label = `${day.label} ${formatTime(time)}`;
      if (time.endsWith(":00")) slot.classList.add("on-the-hour");
      container.appendChild(slot);
      slotElements.set(slot.dataset.key, slot);
    }
  }

  return slotElements;
}

// config.js
// -----------------------------------------------------------------------------
// The schedule settings for ShiftSync. Change these values and every grid in
// the app (employee and admin) updates automatically.
// -----------------------------------------------------------------------------

export const scheduleSettings = {
  // Which days appear across the top of the grid, in order.
  // "key" is used when saving data, so don't change a key once people have saved.
  days: [
    { key: "mon", label: "Monday", short: "Mon" },
    { key: "tue", label: "Tuesday", short: "Tue" },
    { key: "wed", label: "Wednesday", short: "Wed" },
    { key: "thu", label: "Thursday", short: "Thu" },
    { key: "fri", label: "Friday", short: "Fri" },
    { key: "sat", label: "Saturday", short: "Sat" },
    { key: "sun", label: "Sunday", short: "Sun" },
  ],

  // First and last time of the day, in 24-hour "HH:MM" format.
  // The last slot ends at endTime (e.g. 22:00 means the last slot is 9:30–10:00 PM).
  startTime: "06:00",
  endTime: "22:00",

  // Length of each slot in minutes.
  slotMinutes: 30,
};

// The possible states of a slot. Gray ("free") is the default, so it is never stored.
export const SLOT_STATES = {
  FREE: "free",
  PREFERRED: "preferred",
  CONFLICT: "conflict",
};

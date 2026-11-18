// database.js
// -----------------------------------------------------------------------------
// Small helper functions for reading and writing Firestore.
// Pages call these instead of talking to Firestore directly, so all the
// database code lives in one easy-to-find place.
//
// How the data is stored:
//   users (collection)
//     └── <userId>          name, email, role ("employee" or "admin"), createdAt
//   availability (collection)
//     └── <userId>          slots: { "mon-09:00": "preferred", "fri-17:00": "conflict", ... }
//                           updatedAt: when it was last saved
// Gray ("free") slots are not stored, because free is the default.
// <userId> is the unique id Firebase Authentication gives each account.
// -----------------------------------------------------------------------------

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

// ---- User profiles ----

// Create the profile for a brand-new account. Everyone starts as an employee;
// an admin is made by changing "role" to "admin" in the Firebase console.
export async function createUserProfile(userId, name, email) {
  const profile = { name, email, role: "employee", createdAt: serverTimestamp() };
  await setDoc(doc(db, "users", userId), profile);
  return profile;
}

// Load a user's profile. Returns null if it doesn't exist.
export async function getUserProfile(userId) {
  const snapshot = await getDoc(doc(db, "users", userId));
  return snapshot.exists() ? snapshot.data() : null;
}

// ---- Availability ----

// Load one person's saved slots. Returns {} if they haven't saved anything yet.
export async function loadAvailability(userId) {
  const snapshot = await getDoc(doc(db, "availability", userId));
  return snapshot.exists() ? snapshot.data().slots || {} : {};
}

// Save one person's slots, replacing whatever was saved before.
export async function saveAvailability(userId, slots) {
  await setDoc(doc(db, "availability", userId), {
    slots,
    updatedAt: serverTimestamp(),
  });
}

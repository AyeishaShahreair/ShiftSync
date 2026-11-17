// database.js
// -----------------------------------------------------------------------------
// Small helper functions for reading and writing availability in Firestore.
// Pages call these instead of talking to Firestore directly, so all the
// database code lives in one easy-to-find place.
//
// How the data is stored:
//   availability (collection)
//     └── <userId> (one document per person)
//           slots:     { "mon-09:00": "preferred", "fri-17:00": "conflict", ... }
//           updatedAt: when it was last saved
// Gray ("free") slots are not stored, because free is the default.
// -----------------------------------------------------------------------------

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

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

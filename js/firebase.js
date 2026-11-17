// firebase.js
// -----------------------------------------------------------------------------
// Connects ShiftSync to your Firebase project.
// Every other file imports `db` (the database) from here, so the connection
// is set up in exactly one place.
//
// It's safe for this config to be public on GitHub: it only says *which*
// project to talk to. What people are allowed to read or write is controlled
// by the security rules in firestore.rules.
// -----------------------------------------------------------------------------

// We load Firebase straight from Google's CDN, so there's nothing to install.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 👉 Paste your own values here (Firebase console → Project settings → Your apps).
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID",
};

// True once the placeholder values above have been replaced with real ones.
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith("PASTE");

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

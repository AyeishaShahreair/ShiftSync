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

// Your Firebase project's config (from Firebase console → Project settings → Your apps).
const firebaseConfig = {
  apiKey: "AIzaSyD9IPh1ZRbKLqKjwXIguRPi8ixkW4rjVoM",
  authDomain: "shiftsync-99427.firebaseapp.com",
  projectId: "shiftsync-99427",
  storageBucket: "shiftsync-99427.firebasestorage.app",
  messagingSenderId: "748917996592",
  appId: "1:748917996592:web:6a676c73f4630e07e981f5",
};

// True once real values are filled in above (false while they still say "PASTE...").
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith("PASTE");

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

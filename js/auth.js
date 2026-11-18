// auth.js
// -----------------------------------------------------------------------------
// Login helpers shared by every page that needs a logged-in user.
//
// Usage at the top of a page's script:
//   const { user, profile } = await requireLogin();                 // any logged-in user
//   const { user, profile } = await requireLogin({ adminOnly: true }); // admins only
// -----------------------------------------------------------------------------

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase.js";
import { getUserProfile, createUserProfile } from "./database.js";

const LOGIN_PAGE = "index.html";
const HOME_PAGE = "availability.html";

// Firebase needs a moment on page load to remember who is logged in.
// This waits for that answer once, then returns the user (or null).
function waitForUser() {
  return new Promise((resolve) => {
    const stopListening = onAuthStateChanged(auth, (user) => {
      stopListening();
      resolve(user);
    });
  });
}

/**
 * Make sure someone is logged in before showing the page.
 * - Not logged in?                 -> sent to the login page
 * - adminOnly and not an admin?    -> sent to their availability page
 * Returns { user, profile } where profile is { name, email, role }.
 */
export async function requireLogin({ adminOnly = false } = {}) {
  const user = await waitForUser();
  if (!user) {
    window.location.replace(LOGIN_PAGE);
    return new Promise(() => {}); // never finishes, because we're leaving the page
  }

  let profile = await getUserProfile(user.uid);

  // Safety net: if sign-up was interrupted before the profile was saved,
  // create it now from the name stored on the login.
  if (!profile) {
    profile = await createUserProfile(user.uid, user.displayName || user.email, user.email);
  }

  if (adminOnly && profile.role !== "admin") {
    window.location.replace(HOME_PAGE);
    return new Promise(() => {});
  }

  // Login confirmed: show the page (it starts hidden, see "checking-login" in the CSS).
  document.body.classList.remove("checking-login");
  return { user, profile };
}

// Log out and go back to the login page.
export async function logOut() {
  await signOut(auth);
  window.location.href = LOGIN_PAGE;
}

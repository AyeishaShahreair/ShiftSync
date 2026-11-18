// login.js
// -----------------------------------------------------------------------------
// The login page: log in, create an account, or reset a forgotten password.
// After logging in (or signing up), people are sent to their availability page.
// -----------------------------------------------------------------------------

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase.js";
import { createUserProfile } from "./database.js";
import { renderFooter } from "./layout.js";

renderFooter();

const HOME_PAGE = "availability.html";

const forms = {
  login: document.getElementById("login-form"),
  signup: document.getElementById("signup-form"),
  reset: document.getElementById("reset-form"),
};
const message = document.getElementById("auth-message");

// While a new account is being set up, don't redirect yet (see below).
let isSigningUp = false;

// ---- Helpers ----

// Go to the availability page (only once, even if two things ask at the same time).
let isLeaving = false;
function goHome() {
  if (isLeaving) return;
  isLeaving = true;
  window.location.href = HOME_PAGE;
}

function showMessage(text, type = "") {
  message.textContent = text;
  message.dataset.type = type;
}

// Show one form and hide the other two.
function showForm(formId) {
  for (const form of Object.values(forms)) {
    form.hidden = form.id !== formId;
  }
  showMessage("");
  // Put the cursor in the first box of the form that's now showing.
  document.getElementById(formId).querySelector("input").focus();
}

// Disable a form's button while we wait for Firebase, so it can't be clicked twice.
function setBusy(form, isBusy) {
  form.querySelector('button[type="submit"]').disabled = isBusy;
}

// Firebase errors come with codes like "auth/wrong-password".
// Turn them into messages a person can understand.
function friendlyError(error) {
  const messages = {
    "auth/invalid-email": "That doesn't look like a valid email address.",
    "auth/missing-password": "Please enter your password.",
    "auth/invalid-credential": "Wrong email or password. Please try again.",
    "auth/wrong-password": "Wrong email or password. Please try again.",
    "auth/user-not-found": "Wrong email or password. Please try again.",
    "auth/email-already-in-use": "An account with this email already exists. Try logging in instead.",
    "auth/weak-password": "Please choose a password with at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
    "auth/network-request-failed": "Can't reach the server. Check your internet connection.",
  };
  return messages[error.code] || "Something went wrong. Please try again.";
}

// ---- Switching between the three forms ----

for (const button of document.querySelectorAll("[data-show]")) {
  button.addEventListener("click", () => showForm(button.dataset.show));
}

// ---- Log in ----

forms.login.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the browser from reloading the page
  const email = forms.login.email.value.trim();
  const password = forms.login.password.value;

  setBusy(forms.login, true);
  showMessage("Logging in…");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    goHome();
  } catch (error) {
    showMessage(friendlyError(error), "error");
    setBusy(forms.login, false);
  }
});

// ---- Sign up ----

forms.signup.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = forms.signup.name.value.trim();
  const email = forms.signup.email.value.trim();
  const password = forms.signup.password.value;

  if (!name) {
    showMessage("Please enter your name.", "error");
    return;
  }

  setBusy(forms.signup, true);
  showMessage("Creating your account…");
  isSigningUp = true;
  try {
    // 1. Create the login (email + password) in Firebase Authentication.
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    // 2. Remember their name on the login itself...
    await updateProfile(user, { displayName: name });
    // 3. ...and create their profile in the database (everyone starts as "employee").
    await createUserProfile(user.uid, name, email);
    goHome();
  } catch (error) {
    console.error(error);
    isSigningUp = false;
    showMessage(friendlyError(error), "error");
    setBusy(forms.signup, false);
  }
});

// ---- Forgot password ----

forms.reset.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = forms.reset.email.value.trim();

  setBusy(forms.reset, true);
  try {
    await sendPasswordResetEmail(auth, email);
    // For privacy, we don't say whether an account exists for this email.
    showMessage("If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).", "success");
  } catch (error) {
    showMessage(friendlyError(error), "error");
  } finally {
    setBusy(forms.reset, false);
  }
});

// ---- Already logged in? Skip this page. ----
// Firebase remembers who is logged in, even after closing the browser.
onAuthStateChanged(auth, (user) => {
  if (user && !isSigningUp) {
    goHome();
  }
});

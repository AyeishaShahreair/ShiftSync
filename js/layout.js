// layout.js
// -----------------------------------------------------------------------------
// The pieces that appear on every page: the top navigation bar (with logo)
// and the footer. Written once here instead of copy-pasted into each HTML file.
// -----------------------------------------------------------------------------

import { logOut } from "./auth.js";

// The ShiftSync logo (two circular "sync" arrows), stored in img/logo.svg.
const LOGO = `<img class="logo-icon" src="img/logo.svg" alt="">`;

// Footer details: edit these to update the footer on every page.
const FOOTER = {
  name: "Ayeisha Shahreair",
  school: "University of Michigan",
  email: "ayeisha.shahreair@gmail.com",
  year: 2026,
  summary:
    "ShiftSync collects your team's weekly availability and shows managers the best times to schedule everyone.",
};

// Turn "Ayeisha Shahreair" into "AS" for the little circle in the nav bar.
function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/**
 * Draw the nav bar into <nav id="top-nav"></nav>.
 * `profile` is the logged-in user's { name, role }.
 * The "Team overview" link only appears for admins.
 */
export function renderNav(profile) {
  const nav = document.getElementById("top-nav");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const links = [{ href: "availability.html", label: "My availability" }];
  if (profile.role === "admin") {
    links.push({ href: "overview.html", label: "Team overview" });
  }

  nav.innerHTML = `
    <div class="nav-inner">
      <a class="nav-logo" href="availability.html" aria-label="ShiftSync home">
        ${LOGO}<span>ShiftSync</span>
      </a>
      <div class="nav-links">
        ${links
          .map((link) => {
            const isCurrent = link.href === currentPage;
            return `<a href="${link.href}" class="nav-link${isCurrent ? " active" : ""}"
                       ${isCurrent ? 'aria-current="page"' : ""}>${link.label}</a>`;
          })
          .join("")}
      </div>
      <div class="nav-user">
        <span class="nav-avatar" aria-hidden="true"></span>
        <span class="nav-name"></span>
        <button type="button" class="button button-secondary nav-logout">Log out</button>
      </div>
    </div>
  `;

  // Set the name with textContent (not innerHTML) so a name can never inject HTML.
  nav.querySelector(".nav-name").textContent = profile.name;
  nav.querySelector(".nav-avatar").textContent = initials(profile.name);
  nav.querySelector(".nav-logout").addEventListener("click", logOut);
}

// Draw the footer into <footer id="site-footer"></footer>.
export function renderFooter() {
  const footer = document.getElementById("site-footer");
  footer.innerHTML = `
    <p class="footer-summary">${FOOTER.summary}</p>
    <p class="footer-credit">
      Designed and built by <strong>${FOOTER.name}</strong> · ${FOOTER.school}
    </p>
    <p>
      <a href="mailto:${FOOTER.email}">${FOOTER.email}</a> · © ${FOOTER.year} ShiftSync
    </p>
  `;
}

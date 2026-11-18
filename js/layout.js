// layout.js
// -----------------------------------------------------------------------------
// The top navigation bar that appears on every logged-in page.
// Written once here instead of copy-pasted into each HTML file.
// -----------------------------------------------------------------------------

import { logOut } from "./auth.js";

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
      <a class="nav-logo" href="availability.html">ShiftSync</a>
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
        <span class="nav-name"></span>
        <button type="button" class="button button-secondary nav-logout">Log out</button>
      </div>
    </div>
  `;

  // Set the name with textContent (not innerHTML) so a name can never inject HTML.
  nav.querySelector(".nav-name").textContent = profile.name;
  nav.querySelector(".nav-logout").addEventListener("click", logOut);
}

// js/admin-common.js
// Shared plumbing for every /admin/*.html page. Requires js/config.js and
// js/adminApi.js loaded first. Exposes window.AdminCommon.
//
// Usage on every /admin/*.html page:
//
//   <script src="../js/config.js"></script>
//   <script src="../js/adminApi.js"></script>
//   <script src="../js/admin-common.js"></script>
//   <script>
//     AdminCommon.requireAdminAuth().then((me) => {
//       if (!me) return; // already redirected to login
//       AdminCommon.renderAdminNav("orders", me.email);
//       initOrdersPage();
//     });
//   </script>

(function () {
  // Works whether called from /admin-login.html (root) or /admin/*.html
  // (one level deep) by checking the current path.
  function loginPath() {
    return location.pathname.includes("/admin/") ? "../admin-login.html" : "admin-login.html";
  }

  function dashboardPath() {
    return location.pathname.includes("/admin/") ? "index.html" : "admin/index.html";
  }

  // Call at the top of every protected admin page. Redirects to the login
  // page and returns null if there's no active admin session; otherwise
  // resolves to { email }.
  async function requireAdminAuth() {
    let me = null;
    try {
      me = await window.AdminApi.fetchMe();
    } catch (err) {
      me = null;
    }
    if (!me) {
      window.location.href = loginPath();
      return null;
    }
    return me;
  }

  // Renders the shared admin top nav into #admin-nav. `active` is one of
  // "dashboard" | "books" | "orders" | "leads", used to highlight the
  // current section.
  function renderAdminNav(active, email) {
    const mount = document.querySelector("#admin-nav");
    if (!mount) return;

    const inSubdir = location.pathname.includes("/admin/");
    const base = inSubdir ? "" : "admin/";

    const links = [
      { key: "dashboard", label: "Dashboard", href: `${base}index.html` },
      { key: "books", label: "Books", href: `${base}books.html` },
      { key: "orders", label: "Orders", href: `${base}orders.html` },
      { key: "leads", label: "Leads", href: `${base}leads.html` },
    ];

    const linksHtml = links
      .map(
        (l) =>
          `<a href="${l.href}" ${l.key === active ? 'aria-current="page"' : ""}>${l.label}</a>`
      )
      .join("");

    mount.innerHTML = `
      <nav class="admin-nav" aria-label="Admin navigation">
        <div class="admin-nav__bar">
          <a href="${base}index.html" class="admin-nav__logo">The Author's Bookshelf — Admin</a>
          <div class="admin-nav__links">${linksHtml}</div>
          <div class="admin-nav__right">
            ${email ? `<span>${email}</span>` : ""}
            <button type="button" class="admin-nav__logout" data-admin-logout>Log Out</button>
          </div>
        </div>
      </nav>
    `;

    mount.querySelector("[data-admin-logout]").addEventListener("click", async () => {
      try {
        await window.AdminApi.logout();
      } catch (err) {
        // ignore — redirect regardless
      }
      window.location.href = loginPath();
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  window.AdminCommon = {
    requireAdminAuth,
    renderAdminNav,
    loginPath,
    dashboardPath,
    escapeHtml,
  };
})();

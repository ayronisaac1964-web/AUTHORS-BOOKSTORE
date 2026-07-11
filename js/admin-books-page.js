// js/admin-books-page.js
// Page logic for admin/books.html. Requires js/config.js, js/currency.js,
// js/adminApi.js, js/admin-common.js loaded first.
//
// "Remove" in this list means deactivate, not a hard delete — the backend
// only exposes reactivate/deactivate on AdminApi (setBookActive), no DELETE
// endpoint. Deactivated books stop showing on the public store but stay in
// admin so orders/downloads tied to them keep working.

function initAdminBooksPage() {
  const mount = document.querySelector("#admin-books-mount");
  const escapeHtml = AdminCommon.escapeHtml;

  async function load() {
    mount.innerHTML = `<p class="state-msg">Loading books…</p>`;
    let books;
    try {
      books = await window.AdminApi.fetchAdminBooks();
    } catch (err) {
      mount.innerHTML = `<p class="state-msg state-msg--error">Couldn't load books. Is the backend running?</p>`;
      return;
    }
    render(books);
  }

  function render(books) {
    if (books.length === 0) {
      mount.innerHTML = `<p class="state-msg">No books yet. <a href="book-new.html">Add your first book</a>.</p>`;
      return;
    }

    const rows = books
      .map((b) => {
        const cover = b.coverImageUrl
          ? `<img class="admin-table__cover" src="${escapeHtml(b.coverImageUrl)}" alt="" />`
          : `<div class="admin-table__cover"></div>`;
        const badge = b.isActive
          ? `<span class="admin-badge admin-badge--active">Active</span>`
          : `<span class="admin-badge admin-badge--inactive">Inactive</span>`;

        return `
          <tr data-book-row="${escapeHtml(String(b.id))}">
            <td>${cover}</td>
            <td>${escapeHtml(b.title)}</td>
            <td>${window.Currency.formatAmount(b.priceUsd, "USD")}</td>
            <td>${window.Currency.formatAmount(b.priceGbp, "GBP")}</td>
            <td>${window.Currency.formatAmount(b.priceNgn, "NGN")}</td>
            <td>${badge}</td>
            <td>
              <div class="admin-table__actions">
                <a class="admin-btn-sm" href="book-edit.html?id=${encodeURIComponent(b.id)}">Edit</a>
                <button type="button" class="admin-btn-sm admin-btn-sm--danger" data-toggle-active="${escapeHtml(String(b.id))}" data-active="${b.isActive}">
                  ${b.isActive ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    mount.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Cover</th>
              <th>Title</th>
              <th>USD</th>
              <th>GBP</th>
              <th>NGN</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    mount.querySelectorAll("[data-toggle-active]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.toggleActive;
        const isActive = btn.dataset.active === "true";
        const label = isActive ? "deactivate" : "reactivate";
        if (!window.confirm(`Are you sure you want to ${label} this book?`)) return;

        btn.disabled = true;
        try {
          await window.AdminApi.setBookActive(id, !isActive);
          load();
        } catch (err) {
          window.alert(err.message || `Failed to ${label} book.`);
          btn.disabled = false;
        }
      });
    });
  }

  load();
}

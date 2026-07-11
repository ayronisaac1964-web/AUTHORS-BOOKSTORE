// js/admin-orders-page.js
// Page logic for admin/orders.html. Requires js/config.js, js/currency.js,
// js/adminApi.js, js/admin-common.js loaded first.

function initAdminOrdersPage() {
  const mount = document.querySelector("#admin-orders-mount");
  const escapeHtml = AdminCommon.escapeHtml;

  const statusEl = document.querySelector("#of-status");
  const fromEl = document.querySelector("#of-from");
  const toEl = document.querySelector("#of-to");
  const sortEl = document.querySelector("#of-sort");

  function currentFilters() {
    return {
      status: statusEl.value || undefined,
      dateFrom: fromEl.value || undefined,
      dateTo: toEl.value || undefined,
      sort: sortEl.value || undefined,
    };
  }

  // Client-side sort as a safety net, in case the backend ignores/handles
  // `sort` differently — keeps the dropdown meaningful either way.
  function sortOrders(orders, sort) {
    const copy = orders.slice();
    switch (sort) {
      case "oldest":
        return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "amount_desc":
        return copy.sort((a, b) => b.totalAmount - a.totalAmount);
      case "amount_asc":
        return copy.sort((a, b) => a.totalAmount - b.totalAmount);
      case "newest":
      default:
        return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  function booksLabel(books) {
    if (!books) return "—";
    if (Array.isArray(books)) {
      return books
        .map((b) => (typeof b === "string" ? b : `${b.title}${b.quantity > 1 ? ` ×${b.quantity}` : ""}`))
        .join(", ");
    }
    return String(books);
  }

  function badgeFor(status) {
    const s = (status || "").toUpperCase();
    if (s === "PAID") return `<span class="admin-badge admin-badge--paid">Paid</span>`;
    if (s === "FAILED") return `<span class="admin-badge admin-badge--failed">Failed</span>`;
    return `<span class="admin-badge admin-badge--pending">${escapeHtml(status || "Pending")}</span>`;
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  async function load() {
    mount.innerHTML = `<p class="state-msg">Loading orders…</p>`;
    let orders;
    try {
      orders = await window.AdminApi.fetchAdminOrders(currentFilters());
    } catch (err) {
      mount.innerHTML = `<p class="state-msg state-msg--error">Couldn't load orders. Is the backend running?</p>`;
      return;
    }
    render(sortOrders(orders, sortEl.value));
  }

  function render(orders) {
    if (orders.length === 0) {
      mount.innerHTML = `<p class="state-msg">No orders match these filters.</p>`;
      return;
    }

    const rows = orders
      .map(
        (o) => `
          <tr>
            <td>${escapeHtml(o.reference)}</td>
            <td>${escapeHtml(o.buyerName || "")}<br /><span style="color:var(--ink-soft);font-size:0.8rem;">${escapeHtml(o.buyerEmail || "")}</span></td>
            <td>${escapeHtml(booksLabel(o.books))}</td>
            <td>${window.Currency.formatAmount(o.totalAmount, o.currency)}</td>
            <td>${badgeFor(o.status)}</td>
            <td>${formatDate(o.createdAt)}</td>
          </tr>
        `
      )
      .join("");

    mount.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Buyer</th>
              <th>Book(s)</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  document.querySelector("[data-apply-filters]").addEventListener("click", load);
  document.querySelector("[data-clear-filters]").addEventListener("click", () => {
    statusEl.value = "";
    fromEl.value = "";
    toEl.value = "";
    sortEl.value = "newest";
    load();
  });
  sortEl.addEventListener("change", load);

  document.querySelector("[data-export-orders]").addEventListener("click", () => {
    window.location.href = window.AdminApi.ordersExportUrl(currentFilters());
  });

  load();
}

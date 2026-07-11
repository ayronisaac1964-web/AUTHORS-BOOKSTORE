// js/admin-leads-page.js
// Page logic for admin/leads.html. Requires js/config.js, js/adminApi.js,
// js/admin-common.js loaded first.

function initAdminLeadsPage() {
  const mount = document.querySelector("#admin-leads-mount");
  const escapeHtml = AdminCommon.escapeHtml;

  const searchEl = document.querySelector("#lf-search");
  const fromEl = document.querySelector("#lf-from");
  const toEl = document.querySelector("#lf-to");

  function currentFilters() {
    return {
      search: searchEl.value.trim() || undefined,
      dateFrom: fromEl.value || undefined,
      dateTo: toEl.value || undefined,
    };
  }

  function badgeFor(status) {
    const s = (status || "").toUpperCase();
    if (s === "PAID" || s === "CONVERTED") return `<span class="admin-badge admin-badge--paid">${escapeHtml(status)}</span>`;
    if (s === "FAILED") return `<span class="admin-badge admin-badge--failed">${escapeHtml(status)}</span>`;
    return `<span class="admin-badge admin-badge--pending">${escapeHtml(status || "No purchase yet")}</span>`;
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function load() {
    mount.innerHTML = `<p class="state-msg">Loading leads…</p>`;
    let leads;
    try {
      leads = await window.AdminApi.fetchAdminLeads(currentFilters());
    } catch (err) {
      mount.innerHTML = `<p class="state-msg state-msg--error">Couldn't load leads. Is the backend running?</p>`;
      return;
    }
    render(leads);
  }

  function render(leads) {
    if (leads.length === 0) {
      mount.innerHTML = `<p class="state-msg">No leads match these filters.</p>`;
      return;
    }

    const rows = leads
      .map(
        (l) => `
          <tr>
            <td>${escapeHtml(l.fullName)}</td>
            <td>${escapeHtml(l.email)}</td>
            <td>${escapeHtml(l.phone || "—")}</td>
            <td>${escapeHtml(l.bookRequested || "—")}</td>
            <td>${formatDate(l.createdAt)}</td>
            <td>${badgeFor(l.paymentStatus)}</td>
          </tr>
        `
      )
      .join("");

    mount.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Book</th>
              <th>Date / Time</th>
              <th>Payment Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  document.querySelector("[data-apply-filters]").addEventListener("click", load);
  document.querySelector("[data-clear-filters]").addEventListener("click", () => {
    searchEl.value = "";
    fromEl.value = "";
    toEl.value = "";
    load();
  });
  searchEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") load();
  });

  document.querySelector("[data-export-leads]").addEventListener("click", () => {
    window.location.href = window.AdminApi.leadsExportUrl(currentFilters());
  });

  load();
}

// js/adminApi.js
// Plain-JS port of frontend/src/lib/adminApi.ts — authenticated admin-panel
// calls. Requires js/config.js loaded first. Exposes everything under
// window.AdminApi.
//
// Every call sends the httpOnly admin_session cookie cross-origin —
// credentials: "include" is required on every request, and the backend's
// CORS must echo an explicit origin with credentials:true. Public calls in
// js/api.js don't need this since they hit unauthenticated routes.

(function () {
  const BACKEND_URL = window.APP_CONFIG.BACKEND_URL;

  async function adminFetch(path, init) {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...init?.headers,
      },
    });
    return res;
  }

  async function login(email, password) {
    const res = await adminFetch("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Login failed");
    return data;
  }

  async function logout() {
    await adminFetch("/api/admin/auth/logout", { method: "POST" });
  }

  // returns { email } or null
  async function fetchMe() {
    const res = await adminFetch("/api/admin/auth/me");
    if (!res.ok) return null;
    return res.json();
  }

  // AdminBook shape: { id, title, description, sampleExcerpt, priceUsd,
  //   priceGbp, priceNgn, isActive, coverImageUrl, hasEbookFile, createdAt }

  async function fetchAdminBooks() {
    const res = await adminFetch("/api/admin/books");
    if (!res.ok) throw new Error("Failed to load books");
    const data = await res.json();
    return data.books;
  }

  async function fetchAdminBook(id) {
    const res = await adminFetch(`/api/admin/books/${id}`);
    if (!res.ok) throw new Error("Failed to load book");
    const data = await res.json();
    return data.book;
  }

  async function createBook(formData) {
    const res = await adminFetch("/api/admin/books", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create book");
    return data.book;
  }

  async function updateBook(id, formData) {
    const res = await adminFetch(`/api/admin/books/${id}`, { method: "PUT", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update book");
    return data.book;
  }

  async function setBookActive(id, active) {
    const res = await adminFetch(
      `/api/admin/books/${id}/${active ? "reactivate" : "deactivate"}`,
      { method: "POST" }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update book");
    return data.book;
  }

  // filters: { status?, dateFrom?, dateTo?, sort? }
  function toQuery(filters) {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  // AdminOrderRow shape: { reference, buyerName, buyerEmail, books, currency,
  //   totalAmount, status, createdAt, paidAt }

  async function fetchAdminOrders(filters) {
    const res = await adminFetch(`/api/admin/orders${toQuery(filters)}`);
    if (!res.ok) throw new Error("Failed to load orders");
    const data = await res.json();
    return data.orders;
  }

  function ordersExportUrl(filters) {
    return `${BACKEND_URL}/api/admin/orders/export${toQuery(filters)}`;
  }

  // AdminLeadRow shape: { fullName, email, phone, bookRequested, source,
  //   paymentStatus, createdAt }
  // filters: { search?, dateFrom?, dateTo? }

  async function fetchAdminLeads(filters) {
    const res = await adminFetch(`/api/admin/leads${toQuery(filters)}`);
    if (!res.ok) throw new Error("Failed to load leads");
    const data = await res.json();
    return data.leads;
  }

  function leadsExportUrl(filters) {
    return `${BACKEND_URL}/api/admin/leads/export${toQuery(filters)}`;
  }

  window.AdminApi = {
    login,
    logout,
    fetchMe,
    fetchAdminBooks,
    fetchAdminBook,
    createBook,
    updateBook,
    setBookActive,
    fetchAdminOrders,
    ordersExportUrl,
    fetchAdminLeads,
    leadsExportUrl,
  };
})();

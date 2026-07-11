// js/api.js
// Plain-JS port of frontend/src/lib/api.ts — public (unauthenticated) backend
// calls. Requires js/config.js loaded first. Exposes everything under
// window.Api so pages can do `Api.fetchBooks()` etc.
//
// Book shape returned by the backend (was the `Book` TS interface):
//   { id, title, description, sampleExcerpt, coverImageUrl,
//     priceUsd, priceGbp, priceNgn }

(function () {
  const BACKEND_URL = window.APP_CONFIG.BACKEND_URL;

  async function fetchBooks() {
    const res = await fetch(`${BACKEND_URL}/api/books`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load books");
    const data = await res.json();
    return data.books;
  }

  async function fetchBook(id) {
    const res = await fetch(`${BACKEND_URL}/api/books/${id}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to load book");
    const data = await res.json();
    return data.book;
  }

  // payload: { fullName, email, phone, bookId?, source: "FREE_CHAPTER" | "CHECKOUT" }
  // returns: { id, emailed?, fallbackExcerpt? }
  async function submitLead(payload) {
    const res = await fetch(`${BACKEND_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to submit form");
    }
    const data = await res.json();
    return {
      id: data.lead.id,
      emailed: data.email?.emailed,
      fallbackExcerpt: data.email?.fallbackExcerpt,
    };
  }

  // --- Checkout / Paystack ---

  // payload: { items: [{bookId, quantity}], currency, buyerEmail, buyerName, leadId? }
  // returns: { reference, authorizationUrl }
  async function startCheckout(payload) {
    const res = await fetch(`${BACKEND_URL}/api/orders/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
    return data;
  }

  // returns OrderView or null on 404
  async function fetchOrder(reference) {
    const res = await fetch(`${BACKEND_URL}/api/orders/${reference}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to load order");
    const data = await res.json();
    return data.order;
  }

  // Fallback path for when the webhook hasn't landed yet by the time the
  // buyer is redirected back from Paystack.
  async function verifyOrder(reference) {
    const res = await fetch(`${BACKEND_URL}/api/orders/${reference}/verify`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Verification failed");
    return data.order;
  }

  // Self-serve "resend confirmation email". No email re-entry needed — the
  // order reference is the credential.
  async function resendConfirmation(reference) {
    const res = await fetch(`${BACKEND_URL}/api/orders/${reference}/resend`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to resend");
    }
  }

  // --- Downloads (Part 3) ---
  // Mirrors the old /download/[token] page's data call. Same REST shape as
  // the rest of this file: GET for verify/info, a separate URL for the
  // actual file bytes so the file itself can be a plain <a href> (no fetch
  // needed, browser handles the download/Content-Disposition natively).
  //
  // returns: { book: { id, title, coverImageUrl }, reference, expiresAt,
  //            downloadsRemaining? } or null on 404/410 (invalid/expired/used up)
  async function fetchDownload(token) {
    const res = await fetch(`${BACKEND_URL}/api/downloads/${token}`, { cache: "no-store" });
    if (res.status === 404 || res.status === 410) return null;
    if (!res.ok) throw new Error("Failed to verify download link");
    const data = await res.json();
    return data;
  }

  // The actual file endpoint — used as an <a href> so the browser streams
  // the download directly rather than JS buffering it in memory.
  function downloadFileUrl(token) {
    return `${BACKEND_URL}/api/downloads/${token}/file`;
  }

  window.Api = {
    fetchBooks,
    fetchBook,
    submitLead,
    startCheckout,
    fetchOrder,
    verifyOrder,
    resendConfirmation,
    fetchDownload,
    downloadFileUrl,
  };
})();

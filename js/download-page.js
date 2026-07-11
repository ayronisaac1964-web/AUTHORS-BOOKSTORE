// js/download-page.js
// Part 3. Page logic for download.html?token=<token> (mirrors the old
// /download/[token] page). Requires js/api.js loaded first.
//
// Uses window.Api.fetchDownload(token) / window.Api.downloadFileUrl(token),
// added to js/api.js in this pass. Assumed response shape:
//   { book: { id, title, coverImageUrl }, reference, expiresAt,
//     downloadsRemaining? }
// or null (404/410) if the token is invalid, expired, or exhausted.
// Confirm this against the real backend route before shipping.

function initDownloadPage() {
  const mount = document.querySelector("#download-mount");

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  function renderInvalid() {
    mount.innerHTML = `
      <p class="state-msg state-msg--error">
        This download link is invalid or has expired. Check your confirmation
        email for a fresh link, or find your order on the
        <a href="order-confirmation.html">order confirmation page</a>.
      </p>
    `;
  }

  function renderError() {
    mount.innerHTML = `
      <p class="state-msg state-msg--error">
        We couldn't verify this download link right now. Please refresh and try again.
      </p>
    `;
  }

  function render(info) {
    const book = info.book || {};
    const expiryNote = info.expiresAt
      ? `<p class="download-card__note">This link expires ${escapeHtml(new Date(info.expiresAt).toLocaleDateString())}.</p>`
      : "";
    const remainingNote =
      typeof info.downloadsRemaining === "number"
        ? `<p class="download-card__note">${info.downloadsRemaining} download${info.downloadsRemaining === 1 ? "" : "s"} remaining.</p>`
        : "";

    mount.innerHTML = `
      <div class="download-card">
        <span class="eyebrow">Your eBook</span>
        <h1>${escapeHtml(book.title || "Your download")}</h1>
        <p>Your file is ready. Click below to download it now.</p>
        <a class="btn btn-primary" href="${window.Api.downloadFileUrl(token)}" data-download-link>Download Now</a>
        ${expiryNote}
        ${remainingNote}
      </div>
    `;
  }

  if (!token) {
    renderInvalid();
    return;
  }

  window.Api.fetchDownload(token)
    .then((info) => {
      if (!info) {
        renderInvalid();
        return;
      }
      render(info);
    })
    .catch(renderError);
}

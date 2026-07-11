// js/order-confirmation-page.js
// Part 3. Page logic for order-confirmation.html?reference=<ref>
// (mirrors the old /order/[reference] page). Requires js/api.js, js/cart.js
// loaded first.
//
// Order shape assumed from js/api.js's fetchOrder/verifyOrder JSDoc plus
// the OrderView referenced there — not independently confirmed against a
// live backend in this pass:
//   { reference, status: "PENDING"|"PAID"|"FAILED", buyerName, buyerEmail,
//     currency, totalAmount, createdAt, paidAt,
//     items: [{ bookId, title, quantity, unitPrice, downloadToken }] }
// If the real field names differ, only the render() function below needs
// updating — fetchOrder/verifyOrder calls themselves don't change.

function initOrderConfirmationPage() {
  const mount = document.querySelector("#order-mount");

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  const params = new URLSearchParams(window.location.search);
  const reference = params.get("reference") || params.get("ref");

  function renderNotFound() {
    mount.innerHTML = `
      <p class="state-msg state-msg--error">
        We couldn't find that order. If you just paid, check your email for a
        confirmation link, or <a href="books.html">browse the books</a>.
      </p>
    `;
  }

  function renderError() {
    mount.innerHTML = `
      <p class="state-msg state-msg--error">
        We couldn't load your order right now. Please refresh, or check your
        email for a confirmation link.
      </p>
    `;
  }

  function render(order) {
    const isPaid = order.status === "PAID";
    const isFailed = order.status === "FAILED";

    if (isPaid) {
      // Order is confirmed — the cart's job is done.
      window.Cart.clearCart();
    }

    const statusBanner = isPaid
      ? `<div class="order-status order-status--paid"><span class="eyebrow">Payment Confirmed</span><h1>Thank you, ${escapeHtml(order.buyerName || "")}!</h1></div>`
      : isFailed
      ? `<div class="order-status order-status--failed"><span class="eyebrow">Payment Failed</span><h1>We couldn't confirm this payment</h1><p>If you were charged, contact us with your order reference below and we'll sort it out.</p></div>`
      : `<div class="order-status order-status--pending"><span class="eyebrow">Payment Pending</span><h1>We're confirming your payment</h1><p>This can take a minute. Refresh this page shortly, or check your email.</p></div>`;

    const items = order.items || [];
    const rows = items
      .map((item) => {
        const downloadBtn =
          isPaid && item.downloadToken
            ? `<a class="btn btn-gold" href="download.html?token=${encodeURIComponent(item.downloadToken)}">Download</a>`
            : isPaid
            ? `<span class="order-item__note">Download link on the way to your email</span>`
            : "";

        return `
          <li class="order-item">
            <span class="order-item__title">${escapeHtml(item.title)} &times; ${item.quantity}</span>
            <span class="order-item__amount">${window.Currency.formatAmount((item.unitPrice || 0) * item.quantity, order.currency)}</span>
            ${downloadBtn}
          </li>
        `;
      })
      .join("");

    mount.innerHTML = `
      ${statusBanner}
      <div class="order-detail">
        <p class="order-detail__ref">Order reference: <strong>${escapeHtml(order.reference)}</strong></p>
        <p class="order-detail__email">Confirmation sent to ${escapeHtml(order.buyerEmail || "")}</p>
        <ul class="order-item-list">${rows}</ul>
        <div class="order-detail__total">
          <span>Total</span>
          <span>${window.Currency.formatAmount(order.totalAmount || 0, order.currency)}</span>
        </div>
        <button type="button" class="btn btn-secondary" data-resend>Resend confirmation email</button>
        <p class="form-error" data-resend-error></p>
      </div>
    `;

    const resendBtn = mount.querySelector("[data-resend]");
    const resendError = mount.querySelector("[data-resend-error]");
    resendBtn.addEventListener("click", async () => {
      resendBtn.disabled = true;
      resendBtn.textContent = "Sending…";
      resendError.textContent = "";
      try {
        await window.Api.resendConfirmation(order.reference);
        resendBtn.textContent = "Sent!";
      } catch (err) {
        resendError.textContent = err.message || "Couldn't resend right now.";
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend confirmation email";
      }
    });
  }

  if (!reference) {
    renderNotFound();
    return;
  }

  window.Api.fetchOrder(reference)
    .then(async (order) => {
      if (!order) {
        renderNotFound();
        return;
      }
      // Fallback path from js/api.js: if the webhook hasn't landed yet,
      // actively verify with Paystack rather than showing a stale PENDING.
      if (order.status === "PENDING") {
        try {
          order = await window.Api.verifyOrder(reference);
        } catch {
          // Verification failed (e.g. Paystack not confirmed yet) — fall
          // back to rendering the PENDING order we already fetched.
        }
      }
      render(order);
    })
    .catch(renderError);
}

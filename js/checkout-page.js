// js/checkout-page.js
// Part 3. Page logic for checkout.html. Requires js/cart.js, js/currency.js,
// js/api.js, js/leadGate.js, js/leadGateModal.js loaded first.
//
// Gate behavior: this codebase has no standalone "/gate" page — the lead
// gate has only ever been a modal (js/leadGateModal.js) triggered in place.
// So "redirect to the gate if not completed" is implemented the same way
// book.html's Buy Now does it: LeadGate.requireGateThen() opens the modal
// right here and the checkout form only renders once it resolves. If a
// real separate gate *page* is wanted instead, swap the requireGateThen
// call below for `window.location.href = "some-gate.html?next=checkout"`.

function initCheckoutPage() {
  const mount = document.querySelector("#checkout-mount");

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  const items = window.Cart.getCart();

  if (items.length === 0) {
    mount.innerHTML = `
      <p class="state-msg">
        Your cart is empty. <a href="books.html">Browse the books</a> before checking out.
      </p>
    `;
    return;
  }

  function renderForm() {
    const contact = window.LeadGate.getCapturedContact() || {};
    const currency = window.Currency.getCurrency();

    const rows = items
      .map((item) => {
        const unit = window.Currency.priceFor(item, currency);
        const lineTotal = unit * item.quantity;
        return `
          <li class="checkout-line">
            <span class="checkout-line__title">${escapeHtml(item.title)} &times; ${item.quantity}</span>
            <span class="checkout-line__amount">${window.Currency.formatAmount(lineTotal, currency)}</span>
          </li>
        `;
      })
      .join("");

    const total = window.Cart.getCartTotal(currency);

    mount.innerHTML = `
      <div class="checkout-layout">
        <div class="checkout-summary">
          <h2>Order Summary</h2>
          <ul class="checkout-line-list">${rows}</ul>
          <div class="checkout-total">
            <span>Total</span>
            <span data-checkout-total>${window.Currency.formatAmount(total, currency)}</span>
          </div>
          <p class="checkout-summary__note">Currency: ${currency} — <a href="cart.html">edit cart</a></p>
        </div>

        <form class="checkout-form" data-checkout-form novalidate>
          <h2>Your Details</h2>
          <div class="form-field">
            <label for="co-name">Full Name</label>
            <input type="text" id="co-name" name="buyerName" autocomplete="name" required value="${escapeHtml(contact.fullName || "")}" />
          </div>
          <div class="form-field">
            <label for="co-email">Email</label>
            <input type="email" id="co-email" name="buyerEmail" autocomplete="email" required value="${escapeHtml(contact.email || "")}" />
          </div>
          <p class="form-error" data-checkout-error></p>
          <button type="submit" class="btn btn-primary" data-checkout-submit>Continue to Payment</button>
          <p class="checkout-form__note">You'll be redirected to Paystack to complete payment securely.</p>
        </form>
      </div>
    `;

    wireForm(contact);

    window.addEventListener("currency:change", () => {
      renderForm();
    });
  }

  function wireForm(contact) {
    const form = mount.querySelector("[data-checkout-form]");
    const errorEl = mount.querySelector("[data-checkout-error]");
    const submitBtn = mount.querySelector("[data-checkout-submit]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";

      const buyerName = form.buyerName.value.trim();
      const buyerEmail = form.buyerEmail.value.trim();

      if (!buyerName || !buyerEmail) {
        errorEl.textContent = "Please fill in your name and email.";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Redirecting to payment…";

      const payload = {
        items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        currency: window.Currency.getCurrency(),
        buyerEmail,
        buyerName,
        leadId: contact.leadId,
      };

      try {
        const result = await window.Api.startCheckout(payload);
        // Paystack Standard (redirect) flow — same as the existing backend
        // checkout endpoint's response shape. Cart is intentionally left
        // intact until order-confirmation.html confirms payment succeeded.
        window.location.href = result.authorizationUrl;
      } catch (err) {
        errorEl.textContent = err.message || "Something went wrong starting checkout. Please try again.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Continue to Payment";
      }
    });
  }

  function proceed() {
    renderForm();
  }

  const wentAhead = window.LeadGate.requireGateThen({ kind: "buy_now" }, proceed);

  if (!wentAhead) {
    mount.innerHTML = `
      <p class="state-msg">Please complete the quick form to continue to checkout.</p>
    `;
  }

  window.addEventListener("leadgate:resume", (e) => {
    if (e.detail.pendingAction && e.detail.pendingAction.kind === "buy_now") {
      proceed();
    }
  });
}

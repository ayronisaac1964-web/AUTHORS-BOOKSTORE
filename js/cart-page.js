// js/cart-page.js
// Part 3. Page logic for cart.html. Requires js/currency.js, js/cart.js
// loaded first. Reads/writes the cart entirely through window.Cart — this
// file owns no cart state of its own, just renders it.

function initCartPage() {
  const mount = document.querySelector("#cart-mount");

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function render() {
    const items = window.Cart.getCart();
    const currency = window.Currency.getCurrency();

    if (items.length === 0) {
      mount.innerHTML = `
        <p class="state-msg">
          Your cart is empty. <a href="books.html">Browse the books</a>.
        </p>
      `;
      return;
    }

    const rows = items
      .map((item) => {
        const unit = window.Currency.priceFor(item, currency);
        const lineTotal = unit * item.quantity;
        const cover = item.coverImageUrl
          ? `<img class="cart-item__cover" src="${escapeHtml(item.coverImageUrl)}" alt="Cover of ${escapeHtml(item.title)}" />`
          : `<div class="cart-item__cover cart-item__cover--placeholder">${escapeHtml(item.title)}</div>`;

        return `
          <li class="cart-item" data-book-id="${escapeHtml(String(item.bookId))}">
            ${cover}
            <div class="cart-item__body">
              <h3 class="cart-item__title">${escapeHtml(item.title)}</h3>
              <p class="cart-item__unit-price">${window.Currency.formatAmount(unit, currency)} each</p>
            </div>
            <div class="cart-item__qty">
              <button type="button" class="qty-btn" data-qty-decrement aria-label="Decrease quantity">&minus;</button>
              <input type="number" min="1" class="qty-input" value="${item.quantity}" data-qty-input aria-label="Quantity for ${escapeHtml(item.title)}" />
              <button type="button" class="qty-btn" data-qty-increment aria-label="Increase quantity">&plus;</button>
            </div>
            <p class="cart-item__line-total">${window.Currency.formatAmount(lineTotal, currency)}</p>
            <button type="button" class="cart-item__remove" data-remove aria-label="Remove ${escapeHtml(item.title)} from cart">Remove</button>
          </li>
        `;
      })
      .join("");

    const total = window.Cart.getCartTotal(currency);

    mount.innerHTML = `
      <ul class="cart-list">${rows}</ul>
      <div class="cart-summary">
        <span class="cart-summary__label">Total</span>
        <span class="cart-summary__total" data-cart-total>${window.Currency.formatAmount(total, currency)}</span>
      </div>
      <div class="cart-actions">
        <a href="books.html" class="btn btn-secondary">Continue Shopping</a>
        <a href="checkout.html" class="btn btn-primary">Proceed to Checkout</a>
      </div>
    `;

    wireRows();
  }

  function wireRows() {
    mount.querySelectorAll("[data-book-id]").forEach((row) => {
      const bookId = row.dataset.bookId;
      const input = row.querySelector("[data-qty-input]");

      function setQty(qty) {
        const clamped = Math.max(1, Math.floor(qty) || 1);
        window.Cart.updateQuantity(bookId, clamped);
      }

      row.querySelector("[data-qty-decrement]").addEventListener("click", () => {
        setQty(Number(input.value) - 1);
      });
      row.querySelector("[data-qty-increment]").addEventListener("click", () => {
        setQty(Number(input.value) + 1);
      });
      input.addEventListener("change", () => setQty(Number(input.value)));

      row.querySelector("[data-remove]").addEventListener("click", () => {
        window.Cart.removeFromCart(bookId);
      });
    });
  }

  window.addEventListener("cart:change", render);
  window.addEventListener("currency:change", render);

  render();
}

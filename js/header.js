// js/header.js
// Plain-JS port of components/Header.tsx. No React — injects the header
// markup into a mount point so every page just needs:
//
//   <div id="site-header"></div>
//   <link rel="stylesheet" href="styles/main.css">
//   <script src="js/config.js"></script>
//   <script src="js/currency.js"></script>
//   <script src="js/cart.js"></script>
//   <script src="js/header.js"></script>
//   <script>renderHeader();</script>
//
// Assumes these page filenames exist site-wide (Parts 2-4 build them):
//   index.html (home, with a #books section), about.html, cart.html
// Adjust the href="" values below if Parts 2-4 land on different filenames.
//
// Requires js/config.js, js/currency.js and js/cart.js loaded first.

function renderHeader(mountSelector) {
  const selector = mountSelector || "#site-header";
  let mount = document.querySelector(selector);
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "site-header";
    document.body.insertBefore(mount, document.body.firstChild);
  }

  const currency = window.Currency.getCurrency();
  const count = window.Cart.getCartCount();

  const currencyButtons = window.APP_CONFIG.CURRENCIES.map(
    (c) => `<button type="button" data-currency="${c}" aria-pressed="${c === currency}">${c}</button>`
  ).join("");

  mount.innerHTML = `
    <header class="site-header">
      <div class="container site-header__bar">
        <a href="index.html" class="display site-header__logo">The Author's Bookshelf</a>
        <nav class="site-header__nav">
          <a href="index.html#books">Books</a>
          <a href="about.html">About</a>
          <div class="currency-switcher" role="group" aria-label="Select currency">
            ${currencyButtons}
          </div>
          <a href="cart.html" class="site-header__cart-link" aria-label="Cart, ${count} item${count === 1 ? "" : "s"}">
            Cart
            <span class="cart-badge" data-cart-count>${count}</span>
          </a>
        </nav>
      </div>
    </header>
  `;

  mount.querySelectorAll(".currency-switcher button").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.Currency.setCurrency(btn.dataset.currency);
    });
  });

  // Keep the pressed state and cart badge in sync if changed elsewhere
  // (another tab, or another script on the same page).
  window.addEventListener("currency:change", (e) => {
    mount.querySelectorAll(".currency-switcher button").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.currency === e.detail.currency));
    });
  });

  window.addEventListener("cart:change", () => {
    const badge = mount.querySelector("[data-cart-count]");
    if (badge) badge.textContent = String(window.Cart.getCartCount());
  });
}

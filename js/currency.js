// js/currency.js
// Plain-JS port of frontend/src/lib/currency.tsx. Requires js/config.js
// loaded first. No React context — the selected currency lives in
// localStorage (the original used a cookie; localStorage is used here since
// there's no server-side rendering left to read a cookie from).
//
// Fire a "currency:change" event on window whenever the currency changes,
// so header.js (and any page) can re-render prices without a full reload.

(function () {
  const STORAGE_KEY = "author_bookstore_currency";
  const { CURRENCIES, CURRENCY_SYMBOLS } = window.APP_CONFIG;

  function getCurrency() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && CURRENCIES.includes(stored)) return stored;
    } catch {
      // storage blocked — fall through to default
    }
    return "USD";
  }

  function setCurrency(c) {
    if (!CURRENCIES.includes(c)) return;
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // storage full/blocked — selection still works for this page load
    }
    window.dispatchEvent(new CustomEvent("currency:change", { detail: { currency: c } }));
  }

  function getSymbol(currency) {
    return CURRENCY_SYMBOLS[currency || getCurrency()];
  }

  // Pick the right fixed price off a book-like record for a currency.
  // book: { priceUsd, priceGbp, priceNgn }
  function priceFor(book, currency) {
    const c = currency || getCurrency();
    if (c === "USD") return book.priceUsd;
    if (c === "GBP") return book.priceGbp;
    return book.priceNgn;
  }

  function formatAmount(amount, currency) {
    const c = currency || getCurrency();
    return `${CURRENCY_SYMBOLS[c]}${amount.toLocaleString(undefined, {
      minimumFractionDigits: c === "NGN" ? 0 : 2,
      maximumFractionDigits: c === "NGN" ? 0 : 2,
    })}`;
  }

  // Convenience one-shot: pick the currency's price off a book AND format it.
  // This is the function named in the Part 1 spec: formatPrice(book, currency)
  function formatPrice(book, currency) {
    const c = currency || getCurrency();
    return formatAmount(priceFor(book, c), c);
  }

  window.Currency = {
    CURRENCIES,
    getCurrency,
    setCurrency,
    getSymbol,
    priceFor,
    formatAmount,
    formatPrice,
  };
})();

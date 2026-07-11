// js/cart.js
// Plain-JS port of frontend/src/lib/cart.tsx. No React state/context — the
// cart lives in localStorage. Requires js/currency.js loaded first (used for
// getCartTotal's per-currency pricing).
//
// Fires a "cart:change" event on window after every mutation, so header.js
// (and any page) can refresh the cart-count badge without a reload.
//
// CartItem shape stored: { bookId, title, coverImageUrl, priceUsd, priceGbp,
//   priceNgn, quantity }

(function () {
  const STORAGE_KEY = "author_bookstore_cart";

  function readItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      // corrupt/blocked storage — start empty rather than throw
      return [];
    }
  }

  function writeItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/blocked — cart still works in-memory for this page load
    }
    window.dispatchEvent(new CustomEvent("cart:change", { detail: { items } }));
  }

  function getCart() {
    return readItems();
  }

  // book: { bookId, title, coverImageUrl, priceUsd, priceGbp, priceNgn }
  // (full record, not just an id — the cart needs title/cover/price to
  // render without a re-fetch per line item)
  function addToCart(book, quantity) {
    const qty = quantity || 1;
    const items = readItems();
    const existing = items.find((i) => i.bookId === book.bookId);
    let next;
    if (existing) {
      next = items.map((i) =>
        i.bookId === book.bookId ? { ...i, quantity: i.quantity + qty } : i
      );
    } else {
      next = [...items, { ...book, quantity: qty }];
    }
    writeItems(next);
    return next;
  }

  function removeFromCart(bookId) {
    const next = readItems().filter((i) => i.bookId !== bookId);
    writeItems(next);
    return next;
  }

  function updateQuantity(bookId, quantity) {
    const items = readItems();
    const next =
      quantity <= 0
        ? items.filter((i) => i.bookId !== bookId)
        : items.map((i) => (i.bookId === bookId ? { ...i, quantity } : i));
    writeItems(next);
    return next;
  }

  function clearCart() {
    writeItems([]);
  }

  function getCartCount() {
    return readItems().reduce((sum, i) => sum + i.quantity, 0);
  }

  // Sum of (per-currency unit price * quantity) across all items, in the
  // given currency (defaults to the currently selected currency).
  function getCartTotal(currency) {
    const c = currency || (window.Currency ? window.Currency.getCurrency() : "USD");
    return readItems().reduce((sum, i) => {
      const unitPrice = window.Currency ? window.Currency.priceFor(i, c) : 0;
      return sum + unitPrice * i.quantity;
    }, 0);
  }

  window.Cart = {
    getCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal,
  };
})();

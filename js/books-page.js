// js/books-page.js
// Part 2. Page logic for books.html. Requires js/api.js, js/currency.js,
// js/cart.js, js/leadGate.js, js/leadGateModal.js loaded first.

function initBooksPage() {
  const grid = document.querySelector("#books-grid");
  let books = [];

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function cardHtml(book) {
    const cover = book.coverImageUrl
      ? `<img class="book-card__cover" src="${escapeHtml(book.coverImageUrl)}" alt="Cover of ${escapeHtml(book.title)}" loading="lazy" />`
      : `<div class="book-card__cover book-card__cover--placeholder">${escapeHtml(book.title)}</div>`;

    return `
      <article class="book-card" data-book-id="${book.id}">
        <a href="book.html?id=${encodeURIComponent(book.id)}">${cover}</a>
        <div class="book-card__body">
          <h3 class="book-card__title">
            <a href="book.html?id=${encodeURIComponent(book.id)}">${escapeHtml(book.title)}</a>
          </h3>
          <p class="book-card__desc">${escapeHtml(truncate(book.description, 110))}</p>
          <p class="book-card__price" data-price>${window.Currency.formatPrice(book)}</p>
          <div class="book-card__actions">
            <button type="button" class="btn btn-secondary" data-free-chapter>Get Free Chapter</button>
            <button type="button" class="btn btn-primary" data-buy-now>Buy Now</button>
          </div>
        </div>
      </article>
    `;
  }

  function truncate(str, max) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max).trim() + "…" : str;
  }

  function render() {
    if (!books.length) {
      grid.innerHTML = `<p class="state-msg">No books are available right now — please check back soon.</p>`;
      return;
    }
    grid.innerHTML = books.map(cardHtml).join("");
    wireCardButtons();
  }

  function refreshPrices() {
    grid.querySelectorAll(".book-card").forEach((card) => {
      const id = card.dataset.bookId;
      const book = books.find((b) => String(b.id) === String(id));
      const priceEl = card.querySelector("[data-price]");
      if (book && priceEl) priceEl.textContent = window.Currency.formatPrice(book);
    });
  }

  function wireCardButtons() {
    grid.querySelectorAll("[data-free-chapter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".book-card").dataset.bookId;
        window.LeadGate.requireGateThen({ kind: "free_chapter", bookId: id }, () => {
          // Lead already captured — nothing further to do, the excerpt is
          // sent as part of the original lead capture flow.
        });
      });
    });

    grid.querySelectorAll("[data-buy-now]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".book-card").dataset.bookId;
        const book = books.find((b) => String(b.id) === String(id));
        window.LeadGate.requireGateThen({ kind: "buy_now", bookId: id }, () => buyNow(book));
      });
    });
  }

  function buyNow(book) {
    if (!book) return;
    window.Cart.addToCart(
      {
        bookId: book.id,
        title: book.title,
        coverImageUrl: book.coverImageUrl,
        priceUsd: book.priceUsd,
        priceGbp: book.priceGbp,
        priceNgn: book.priceNgn,
      },
      1
    );
    // Checkout flow (cart.html / checkout.html) ships in Part 3.
    window.location.href = "cart.html";
  }

  // Resume a gated action once the lead-gate modal reports success.
  window.addEventListener("leadgate:resume", (e) => {
    const action = e.detail.pendingAction;
    if (!action || action.kind !== "buy_now") return;
    const book = books.find((b) => String(b.id) === String(action.bookId));
    buyNow(book);
  });

  window.addEventListener("currency:change", refreshPrices);

  window.Api.fetchBooks()
    .then((data) => {
      books = data || [];
      render();
    })
    .catch(() => {
      grid.innerHTML = `<p class="state-msg state-msg--error">We couldn't load the books right now. Please refresh the page.</p>`;
    });
}

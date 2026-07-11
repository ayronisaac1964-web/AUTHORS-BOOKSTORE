// js/book-page.js
// Part 2. Page logic for book.html?id=<bookId>. Requires js/api.js,
// js/currency.js, js/cart.js, js/leadGate.js, js/leadGateModal.js loaded first.

function initBookPage() {
  const mount = document.querySelector("#book-detail-mount");
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("id");
  let book = null;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function render() {
    const cover = book.coverImageUrl
      ? `<img class="book-detail__cover" src="${escapeHtml(book.coverImageUrl)}" alt="Cover of ${escapeHtml(book.title)}" />`
      : `<div class="book-detail__cover book-card__cover--placeholder" style="aspect-ratio:2/3;display:flex;">${escapeHtml(book.title)}</div>`;

    const excerptHtml = book.sampleExcerpt
      ? `<div class="book-detail__excerpt">${escapeHtml(book.sampleExcerpt)}</div>`
      : "";

    mount.innerHTML = `
      <div class="book-detail">
        ${cover}
        <div>
          <span class="eyebrow">The Author's Bookshelf</span>
          <h1>${escapeHtml(book.title)}</h1>
          <p class="book-detail__price" data-price>${window.Currency.formatPrice(book)}</p>
          <p>${escapeHtml(book.description)}</p>
          ${excerptHtml}
          <div class="book-detail__actions">
            <button type="button" class="btn btn-secondary" data-free-chapter>Get Free Chapter</button>
            <button type="button" class="btn btn-primary" data-add-to-cart>Add to Cart</button>
          </div>
        </div>
      </div>
    `;

    mount.querySelector("[data-free-chapter]").addEventListener("click", () => {
      window.LeadGate.requireGateThen({ kind: "free_chapter", bookId: book.id }, () => {});
    });

    mount.querySelector("[data-add-to-cart]").addEventListener("click", () => {
      window.LeadGate.requireGateThen({ kind: "add_to_cart", bookId: book.id }, addToCart);
    });

    window.addEventListener("currency:change", () => {
      const priceEl = mount.querySelector("[data-price]");
      if (priceEl) priceEl.textContent = window.Currency.formatPrice(book);
    });
  }

  function addToCart() {
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
  }

  window.addEventListener("leadgate:resume", (e) => {
    const action = e.detail.pendingAction;
    if (action && action.kind === "add_to_cart" && book && String(action.bookId) === String(book.id)) {
      addToCart();
    }
  });

  if (!bookId) {
    mount.innerHTML = `<p class="state-msg state-msg--error">No book was specified. <a href="books.html">Browse all books</a>.</p>`;
    return;
  }

  window.Api.fetchBook(bookId)
    .then((data) => {
      if (!data) {
        mount.innerHTML = `<p class="state-msg state-msg--error">We couldn't find that book. <a href="books.html">Browse all books</a>.</p>`;
        return;
      }
      book = data;
      render();
    })
    .catch(() => {
      mount.innerHTML = `<p class="state-msg state-msg--error">We couldn't load this book right now. Please refresh the page.</p>`;
    });
}

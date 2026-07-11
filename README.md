# The Author's Bookshelf — Frontend

Plain HTML/CSS/JS storefront + admin panel. No build step, no framework —
every page is a static `.html` file that pulls in shared `js/*.js` files and
talks to the backend API over `fetch`.

## 1. Just want to look around? Open the files directly

Every `.html` file in this repo can be opened straight from disk — double
click it, or drag it into a browser tab. No server, no build, no `npm
install` needed to see the layout, styling, and page structure:

- `index.html`, `books.html`, `book.html`, `about.html`, `privacy.html` — public pages
- `cart.html`, `checkout.html`, `order-confirmation.html`, `download.html` — cart/checkout flow
- `admin-login.html`, `admin/index.html`, `admin/books.html`, `admin/book-new.html`,
  `admin/book-edit.html`, `admin/orders.html`, `admin/leads.html` — admin panel

Opening files this way is enough to review copy, layout, and CSS. It is
**not** enough to see real content or use any interactive feature — see the
next section.

## 2. What needs the backend running

Every piece of real data or interactive behavior comes from the backend API
(`js/config.js` points at `http://localhost:4000` by default). Without it
running:

- Public pages show empty/loading states — no books load on the home,
  books, or book detail pages.
- The lead-capture form ("Get a Free Chapter"), cart checkout, Paystack
  redirect, order confirmation lookup, and download-link verification all
  fail, since they all call backend endpoints.
- **Every `/admin/*.html` page redirects straight to `admin-login.html`.**
  The admin pages call `AdminApi.fetchMe()` on load to check for a valid
  session cookie; with no backend to answer that call, there's no way to be
  "logged in," so you'll bounce back to the login screen immediately.
- The admin login form itself needs the backend's
  `/api/admin/auth/login` endpoint to authenticate.
- Book create/edit, order listing/filtering/export, and lead
  listing/filtering/export all read and write through the backend.

In short: open the HTML files to review pages, but run the backend to
actually use the site.

## 3. Starting the backend locally

From the backend's project directory:

```bash
npm install
npm run dev
```

This starts the API on `http://localhost:4000` (matching `BACKEND_URL` in
`js/config.js`). If your backend uses a different start command or port,
update `js/config.js` accordingly — it's the single line every page reads
the API base URL from.

Once it's running, just reopen any `.html` file in this repo (or serve the
folder with any static file server, e.g. `npx serve .`) and everything —
books, cart, checkout, downloads, and the full admin panel — talks to it.

## Admin panel notes

- **Auth:** every `/admin/*.html` page calls `AdminCommon.requireAdminAuth()`
  on load (see `js/admin-common.js`), which checks the backend session via
  `AdminApi.fetchMe()` and redirects to `admin-login.html` if there's no
  active session. `admin-login.html` itself checks the reverse — if you're
  already logged in, it skips straight to `admin/index.html`.
- **"Remove" on a book** deactivates it (`AdminApi.setBookActive`), not a
  hard delete — the backend's admin API exposes reactivate/deactivate, not a
  delete endpoint. Deactivated books drop off the public store but stay
  visible in the admin books list, and existing orders/downloads for them
  keep working.
- **Book form field names** (`title`, `description`, `sampleExcerpt`,
  `priceUsd`, `priceGbp`, `priceNgn`, `isActive`, `coverImage`, `ebookFile`)
  follow the `AdminBook` shape documented in `js/adminApi.js`. If the
  backend's multipart field names differ, adjust the `name=""` attributes in
  `js/admin-book-form.js`.
- **Orders/Leads export** buttons link directly to the backend's CSV export
  endpoints (`AdminApi.ordersExportUrl` / `leadsExportUrl`), carrying
  whatever filters are currently applied on the page.

## Project structure

```
index.html, books.html, book.html, about.html, privacy.html   Public pages
cart.html, checkout.html, order-confirmation.html, download.html  Cart/checkout flow
admin-login.html                                               Admin login
admin/index.html, books.html, book-new.html, book-edit.html,
      orders.html, leads.html                                  Admin panel
js/config.js                                                    Backend URL + app config
js/api.js                                                       Public (unauthenticated) API calls
js/adminApi.js                                                  Authenticated admin API calls
js/admin-common.js                                               Admin auth guard + shared nav
js/admin-*-page.js                                               Per-page admin logic
js/header.js, footer.js, currency.js, cart.js, leadGate*.js      Shared site behavior
styles/main.css                                                  Design tokens, buttons, layout
styles/pages.css                                                 Public page-specific styles
styles/admin.css                                                 Admin panel styles
```

## A note on this repo's history

This build already contains only the plain HTML/CSS/JS frontend — there's no
leftover Next.js/React app (`next.config`, `tsconfig`, `src/app/*.tsx`,
`src/components/*.tsx`, etc.) alongside it to clean up. If you're merging
this into a repo that still has an old React version sitting next to it,
delete that parallel copy so only this static frontend and the (untouched)
backend remain.

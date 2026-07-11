// js/config.js
// Plain-JS port of frontend/src/lib/config.ts
// Load this before any other js/*.js file — api.js, adminApi.js, cart.js,
// currency.js and leadGate.js all read window.APP_CONFIG.

window.APP_CONFIG = {
  // Was process.env.NEXT_PUBLIC_API_BASE_URL in Next.js. Static HTML has no
  // build-time env injection, so it's a plain constant — change this one
  // line to point at a different backend.
  BACKEND_URL: "http://localhost:4000",

  // Same flag/behavior as the original: gates "Buy Now"/"Add to Cart" behind
  // the free-chapter lead form. "Get Free Chapter" is always gated regardless
  // of this flag (see js/leadGate.js).
  REQUIRE_LEAD_GATE_FOR_PURCHASE: true,

  CURRENCIES: ["USD", "GBP", "NGN"],

  CURRENCY_SYMBOLS: {
    USD: "$",
    GBP: "£",
    NGN: "₦",
  },
};

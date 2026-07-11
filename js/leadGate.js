// js/leadGate.js
// Plain-JS port of frontend/src/lib/leadGate.tsx. No React context/modal
// component here (that's the actual modal markup, built in Parts 2-4) —
// this file just owns the captured-lead flag/state in localStorage and the
// "should this action be gated?" decision, same as the original.
//
// Requires js/config.js loaded first (for REQUIRE_LEAD_GATE_FOR_PURCHASE).
//
// How a page wires up the actual modal:
//   window.addEventListener("leadgate:open", (e) => {
//     // e.detail.pendingAction = { kind: "free_chapter"|"buy_now"|"add_to_cart", bookId }
//     // show your modal here
//   });
//   ...when the modal's form succeeds:
//   LeadGate.markLeadCaptured({ leadId, fullName, email, phone });
//   // this fires "leadgate:captured" — the page can resume the pending action
//
// pendingAction shape: { kind: "free_chapter" | "buy_now" | "add_to_cart", bookId }
// CapturedContact shape: { leadId, fullName, email, phone }

(function () {
  const STORAGE_KEY = "author_bookstore_lead_captured";
  const CONTACT_STORAGE_KEY = "author_bookstore_lead_contact";
  const { REQUIRE_LEAD_GATE_FOR_PURCHASE } = window.APP_CONFIG;

  function hasCapturedLead() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function getCapturedContact() {
    try {
      const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // contact: { leadId, fullName, email, phone }
  function markLeadCaptured(contact) {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
      localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contact));
    } catch {
      // ignore — captured state still holds in-memory for this page load
    }
    window.dispatchEvent(new CustomEvent("leadgate:captured", { detail: { contact } }));
  }

  function openGate(action) {
    window.dispatchEvent(new CustomEvent("leadgate:open", { detail: { pendingAction: action } }));
  }

  function closeGate() {
    window.dispatchEvent(new CustomEvent("leadgate:close"));
  }

  // Central check used by "Get Free Chapter" and "Buy Now"/"Add to Cart"
  // buttons. Calls proceed() and returns true if the action should go ahead
  // immediately; otherwise opens the gate (via "leadgate:open") and returns
  // false — caller should stop.
  function requireGateThen(action, proceed) {
    // "Get Free Chapter" is always gated — it IS the gate.
    // Buy Now / Add to Cart only gated when the flag is on.
    const needsGate = action.kind === "free_chapter" ? true : REQUIRE_LEAD_GATE_FOR_PURCHASE;

    if (needsGate && !hasCapturedLead()) {
      openGate(action);
      return false;
    }
    proceed();
    return true;
  }

  window.LeadGate = {
    hasCapturedLead,
    getCapturedContact,
    markLeadCaptured,
    openGate,
    closeGate,
    requireGateThen,
  };
})();

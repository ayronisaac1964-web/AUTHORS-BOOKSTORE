// js/leadGateModal.js
// Part 2. Owns the actual modal markup/behavior for the gate that
// js/leadGate.js (Part 1) only tracks state for. Requires js/config.js,
// js/api.js, and js/leadGate.js loaded first.
//
// Wiring: include this script once per page (after leadGate.js) and call
// renderLeadGateModal() once. It listens for "leadgate:open" (fired by
// LeadGate.openGate) and shows itself; on successful submit it calls
// Api.submitLead + LeadGate.markLeadCaptured, then fires "leadgate:resume"
// with { pendingAction, contact } so the calling page can finish the
// action (add to cart, redirect, etc). For a "free_chapter" pendingAction
// the modal also shows the excerpt/confirmation inline, since that IS the
// requested action.

function renderLeadGateModal(mountSelector) {
  const selector = mountSelector || "#lead-gate-modal";
  let mount = document.querySelector(selector);
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "lead-gate-modal";
    document.body.appendChild(mount);
  }

  let pendingAction = null;

  mount.innerHTML = `
    <div class="modal-overlay" data-overlay hidden>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="lead-gate-title">
        <button type="button" class="modal__close" data-close aria-label="Close">&times;</button>
        <div data-modal-body>
          <span class="eyebrow">Just a moment</span>
          <h3 id="lead-gate-title">Get your free chapter</h3>
          <p class="modal__subhead">Tell us where to send it — no spam, ever.</p>
          <form data-lead-form novalidate>
            <div class="form-field">
              <label for="lg-name">Full Name</label>
              <input type="text" id="lg-name" name="fullName" autocomplete="name" required />
            </div>
            <div class="form-field">
              <label for="lg-email">Email</label>
              <input type="email" id="lg-email" name="email" autocomplete="email" required />
            </div>
            <div class="form-field">
              <label for="lg-phone">Phone</label>
              <input type="tel" id="lg-phone" name="phone" autocomplete="tel" required />
            </div>
            <p class="form-error" data-error></p>
            <button type="submit" class="btn btn-primary" data-submit>Continue</button>
          </form>
        </div>
      </div>
    </div>
  `;

  const overlay = mount.querySelector("[data-overlay]");
  const body = mount.querySelector("[data-modal-body]");
  const closeBtn = mount.querySelector("[data-close]");

  function formMarkup(title, subhead) {
    return `
      <span class="eyebrow">Just a moment</span>
      <h3 id="lead-gate-title">${title}</h3>
      <p class="modal__subhead">${subhead}</p>
      <form data-lead-form novalidate>
        <div class="form-field">
          <label for="lg-name">Full Name</label>
          <input type="text" id="lg-name" name="fullName" autocomplete="name" required />
        </div>
        <div class="form-field">
          <label for="lg-email">Email</label>
          <input type="email" id="lg-email" name="email" autocomplete="email" required />
        </div>
        <div class="form-field">
          <label for="lg-phone">Phone</label>
          <input type="tel" id="lg-phone" name="phone" autocomplete="tel" required />
        </div>
        <p class="form-error" data-error></p>
        <button type="submit" class="btn btn-primary" data-submit>Continue</button>
      </form>
    `;
  }

  function showForm() {
    const isFreeChapter = pendingAction?.kind === "free_chapter";
    body.innerHTML = formMarkup(
      isFreeChapter ? "Get your free chapter" : "Almost there",
      isFreeChapter
        ? "Tell us where to send it — no spam, ever."
        : "Leave your details to continue to checkout."
    );
    wireForm();
  }

  function showSuccess(payload) {
    const isFreeChapter = pendingAction?.kind === "free_chapter";
    if (isFreeChapter) {
      const excerptHtml = payload.fallbackExcerpt
        ? `<div class="book-detail__excerpt">${escapeHtml(payload.fallbackExcerpt)}</div>`
        : "";
      body.innerHTML = `
        <div class="modal__success">
          <span class="eyebrow">Thank you</span>
          <h3>${payload.emailed ? "Chapter on its way!" : "Here's your chapter"}</h3>
          <p class="modal__subhead">${
            payload.emailed
              ? "Check your inbox — your free chapter just landed."
              : "We couldn't email it just now, so here it is:"
          }</p>
          ${excerptHtml}
          <button type="button" class="btn btn-secondary" data-close-success>Close</button>
        </div>
      `;
      mount.querySelector("[data-close-success]").addEventListener("click", close);
    } else {
      close();
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function wireForm() {
    const form = mount.querySelector("[data-lead-form]");
    const errorEl = mount.querySelector("[data-error]");
    const submitBtn = mount.querySelector("[data-submit]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";

      const fullName = form.fullName.value.trim();
      const email = form.email.value.trim();
      const phone = form.phone.value.trim();

      if (!fullName || !email || !phone) {
        errorEl.textContent = "Please fill in every field.";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";

      try {
        const result = await window.Api.submitLead({
          fullName,
          email,
          phone,
          bookId: pendingAction?.bookId,
          source: pendingAction?.kind === "free_chapter" ? "FREE_CHAPTER" : "CHECKOUT",
        });

        const contact = { leadId: result.id, fullName, email, phone };
        window.LeadGate.markLeadCaptured(contact);

        showSuccess({ emailed: result.emailed, fallbackExcerpt: result.fallbackExcerpt });

        window.dispatchEvent(
          new CustomEvent("leadgate:resume", { detail: { pendingAction, contact } })
        );
      } catch (err) {
        errorEl.textContent = err.message || "Something went wrong. Please try again.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Continue";
      }
    });
  }

  function open() {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    const firstInput = mount.querySelector("input");
    if (firstInput) firstInput.focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    window.LeadGate.closeGate();
  }

  window.addEventListener("leadgate:open", (e) => {
    pendingAction = e.detail.pendingAction;
    showForm();
    open();
  });

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
}

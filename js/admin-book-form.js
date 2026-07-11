// js/admin-book-form.js
// Shared form logic for admin/book-new.html and admin/book-edit.html.
// Requires js/config.js, js/adminApi.js, js/admin-common.js loaded first.
//
// Field names sent in the FormData (title, description, sampleExcerpt,
// priceUsd, priceGbp, priceNgn, isActive, coverImage, ebookFile) follow the
// AdminBook shape documented at the top of js/adminApi.js. If the backend
// expects different multipart field names, adjust the `name=""` attributes
// on the inputs below and the FormData key used for the two file inputs.

function initAdminBookForm(options) {
  const mount = document.querySelector("#admin-book-form-mount");
  const escapeHtml = AdminCommon.escapeHtml;
  const isEdit = options.mode === "edit";

  async function init() {
    let book = null;
    if (isEdit) {
      try {
        book = await window.AdminApi.fetchAdminBook(options.id);
      } catch (err) {
        mount.innerHTML = `<p class="state-msg state-msg--error">Couldn't load this book. <a href="books.html">Back to books</a>.</p>`;
        return;
      }
    }
    render(book);
  }

  function render(book) {
    const b = book || {
      title: "",
      description: "",
      sampleExcerpt: "",
      priceUsd: "",
      priceGbp: "",
      priceNgn: "",
      isActive: true,
      coverImageUrl: "",
      hasEbookFile: false,
    };

    mount.innerHTML = `
      <form class="admin-form" data-book-form novalidate>
        <div class="form-field">
          <label for="bf-title">Title</label>
          <input type="text" id="bf-title" name="title" required value="${escapeHtml(b.title)}" />
        </div>

        <div class="form-field">
          <label for="bf-description">Description</label>
          <textarea id="bf-description" name="description" required>${escapeHtml(b.description)}</textarea>
        </div>

        <div class="form-field">
          <label for="bf-excerpt">Sample Excerpt <span style="font-weight:400;">(sent as the free chapter)</span></label>
          <textarea id="bf-excerpt" name="sampleExcerpt">${escapeHtml(b.sampleExcerpt || "")}</textarea>
        </div>

        <div class="admin-form-row">
          <div class="form-field">
            <label for="bf-price-usd">Price (USD)</label>
            <input type="number" id="bf-price-usd" name="priceUsd" min="0" step="0.01" required value="${escapeHtml(b.priceUsd)}" />
          </div>
          <div class="form-field">
            <label for="bf-price-gbp">Price (GBP)</label>
            <input type="number" id="bf-price-gbp" name="priceGbp" min="0" step="0.01" required value="${escapeHtml(b.priceGbp)}" />
          </div>
          <div class="form-field">
            <label for="bf-price-ngn">Price (NGN)</label>
            <input type="number" id="bf-price-ngn" name="priceNgn" min="0" step="1" required value="${escapeHtml(b.priceNgn)}" />
          </div>
        </div>

        <div class="form-field">
          <label for="bf-cover">Cover Image</label>
          <input type="file" id="bf-cover" name="coverImage" accept="image/*" />
          ${b.coverImageUrl ? `<p class="admin-form__current-file">Current: <a href="${escapeHtml(b.coverImageUrl)}" target="_blank" rel="noopener">view cover</a></p>` : ""}
          <p class="admin-form-hint">${isEdit ? "Leave blank to keep the current cover." : "JPG or PNG recommended."}</p>
        </div>

        <div class="form-field">
          <label for="bf-ebook">Ebook File</label>
          <input type="file" id="bf-ebook" name="ebookFile" accept=".pdf,.epub,.mobi" />
          ${b.hasEbookFile ? `<p class="admin-form__current-file">An ebook file is already uploaded for this book.</p>` : ""}
          <p class="admin-form-hint">${isEdit ? "Leave blank to keep the current file." : "PDF or EPUB."}</p>
        </div>

        <div class="admin-checkbox-row">
          <input type="checkbox" id="bf-active" name="isActive" ${b.isActive ? "checked" : ""} />
          <label for="bf-active" style="margin:0;">Active (visible on the public store)</label>
        </div>

        <p class="form-error" data-book-form-error></p>

        <div class="admin-form__actions">
          <button type="submit" class="btn btn-primary" data-book-form-submit>${isEdit ? "Save Changes" : "Add Book"}</button>
          <a href="books.html" class="btn btn-secondary">Cancel</a>
        </div>
      </form>
    `;

    wireForm();
  }

  function wireForm() {
    const form = mount.querySelector("[data-book-form]");
    const errorEl = mount.querySelector("[data-book-form-error]");
    const submitBtn = mount.querySelector("[data-book-form-submit]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";

      const formData = new FormData(form);
      // Unchecked checkboxes are omitted from FormData entirely — send an
      // explicit "false" so the backend can tell "off" from "not sent".
      if (!form.querySelector("#bf-active").checked) {
        formData.set("isActive", "false");
      }
      // Don't send empty file inputs — some backends choke on a zero-byte
      // multipart file part when the field is optional.
      ["coverImage", "ebookFile"].forEach((field) => {
        const input = form.querySelector(`[name="${field}"]`);
        if (input && input.files.length === 0) {
          formData.delete(field);
        }
      });

      submitBtn.disabled = true;
      submitBtn.textContent = isEdit ? "Saving…" : "Adding…";
      try {
        if (isEdit) {
          await window.AdminApi.updateBook(options.id, formData);
        } else {
          await window.AdminApi.createBook(formData);
        }
        window.location.href = "books.html";
      } catch (err) {
        errorEl.textContent = err.message || "Something went wrong. Please try again.";
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? "Save Changes" : "Add Book";
      }
    });
  }

  init();
}

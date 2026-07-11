// js/footer.js
// Plain-JS port of components/Footer.tsx. Injects the footer markup into a
// mount point:
//
//   <div id="site-footer"></div>
//   <script src="js/footer.js"></script>
//   <script>renderFooter();</script>
//
// Assumes about.html and privacy.html exist site-wide (Parts 2-4 build them).

function renderFooter(mountSelector) {
  const selector = mountSelector || "#site-footer";
  let mount = document.querySelector(selector);
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "site-footer";
    document.body.appendChild(mount);
  }

  const year = new Date().getFullYear();

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="container site-footer__bar">
        <span>© ${year} The Author's Bookshelf</span>
        <nav class="site-footer__nav">
          <a href="about.html">About</a>
          <a href="privacy.html">Privacy Policy</a>
        </nav>
      </div>
    </footer>
  `;
}

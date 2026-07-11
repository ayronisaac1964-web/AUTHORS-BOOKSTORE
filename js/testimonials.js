// js/testimonials.js
// Part 2. Static (non-fetched) testimonials block, reusable via a mount
// point:
//   <div id="testimonials"></div>
//   <script src="js/testimonials.js"></script>
//   <script>renderTestimonials();</script>

function renderTestimonials(mountSelector) {
  const selector = mountSelector || "#testimonials";
  let mount = document.querySelector(selector);
  if (!mount) return;

  const items = [
    {
      quote:
        "I picked this up expecting a quiet weekend read and finished it in one sitting. The kind of book you press into a friend's hands.",
      author: "Reader review",
    },
    {
      quote:
        "Honest, funny, and unflinching in the right places. It's rare to find a memoir that trusts the reader this much.",
      author: "Reader review",
    },
    {
      quote:
        "Beautifully paced. Every chapter earns the next one — I kept telling myself 'just one more.'",
      author: "Reader review",
    },
  ];

  mount.innerHTML = `
    <section class="testimonials">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow">What readers say</span>
          <h2>Loved by readers</h2>
        </div>
        <div class="testimonial-grid">
          ${items
            .map(
              (t) => `
            <div class="testimonial-card">
              <p class="testimonial-card__quote">"${t.quote}"</p>
              <p class="testimonial-card__author">${t.author}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

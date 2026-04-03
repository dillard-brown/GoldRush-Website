/* ============================================================
   Gold Rush Hauling — nav.js
   Injects shared navigation and footer into every page.
   ============================================================ */

(function () {
  // Detect current page for active link highlighting
  const page = document.body.dataset.page || '';

  // ============================================================
  //  NAV HTML
  // ============================================================
  const navHTML = `
    <nav class="site-nav" id="site-nav">
      <div class="nav-container">
        <a href="/index.html" class="nav-logo">Gold Rush<span> Hauling</span></a>

        <div class="nav-links">
          <div class="nav-dropdown">
            <span>Services ▾</span>
            <div class="dropdown-menu">
              <a href="/aggie.html">🎓 Aggie Move-Out</a>
              <a href="/realtor.html">🏡 Realtor &amp; Estate</a>
              <a href="/rural.html">🌾 Large Property &amp; Rural</a>
            </div>
          </div>
          <a href="/gallery.html" class="${page === 'gallery' ? 'active' : ''}">Past Jobs</a>
          <a href="/about.html"   class="${page === 'about'   ? 'active' : ''}">About</a>
          <a href="/contact.html" class="nav-cta">Book Now</a>
        </div>

        <button class="nav-hamburger" id="nav-hamburger" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <div class="mobile-menu" id="mobile-menu">
      <a href="/index.html">Home</a>
      <a href="/aggie.html">Aggie Move-Out</a>
      <a href="/realtor.html">Realtor &amp; Estate</a>
      <a href="/rural.html">Large Property &amp; Rural</a>
      <div class="mobile-divider"></div>
      <a href="/gallery.html">Past Jobs</a>
      <a href="/about.html">About</a>
      <a href="/contact.html" class="mobile-cta-link">Book Now →</a>
    </div>
  `;

  // ============================================================
  //  FOOTER HTML
  // ============================================================
  const footerHTML = `
    <footer class="site-footer">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="footer-logo">Gold Rush<span> Hauling</span></span>
          <p class="footer-tagline">Yolo &amp; Napa County's Cleanout Specialists. Licensed, insured &amp; local.</p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h4>Services</h4>
            <a href="/aggie.html">Aggie Move-Out</a>
            <a href="/realtor.html">Realtor &amp; Estate</a>
            <a href="/rural.html">Large Property &amp; Rural</a>
            <a href="/gallery.html">Past Jobs</a>
          </div>
          <div class="footer-col">
            <h4>Company</h4>
            <a href="/about.html">About Us</a>
            <a href="/contact.html">Contact</a>
            <a href="/contact.html">Book Now</a>
            <a href="/admin.html">Admin</a>
          </div>
          <div class="footer-col">
            <h4>Contact</h4>
            <span>📞 [PHONE NUMBER]</span>
            <span>📧 [EMAIL ADDRESS]</span>
            <span>Mon–Sat: 7am–7pm</span>
            <span>Sun: 8am–5pm</span>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Gold Rush Hauling. All rights reserved.</span>
        <span>Based in Davis, CA · Serving Yolo &amp; Napa County</span>
      </div>
    </footer>
  `;

  // ============================================================
  //  INJECT INTO PAGE
  // ============================================================
  document.body.insertAdjacentHTML('afterbegin', navHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML);

  // ============================================================
  //  HAMBURGER TOGGLE
  // ============================================================
  const hamburger  = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ============================================================
  //  SCROLL BEHAVIOR — transparent → opaque nav
  // ============================================================
  const nav = document.getElementById('site-nav');

  function updateNav() {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav(); // run once on load

  // ============================================================
  //  FAQ ACCORDION (runs on pages that have .faq-item)
  // ============================================================
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      // Toggle clicked
      if (!isOpen) item.classList.add('open');
    });
  });

})();

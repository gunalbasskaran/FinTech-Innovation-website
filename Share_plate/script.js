/* ============================================
   SharePlate — Main JavaScript (Production)
   Navigation, scroll animations, form
   validation, FAQ accordion, counters
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Mobile Navigation Toggle ── */
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('active');
      navToggle.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close drawer when any link is tapped
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Navbar Scroll Effect ── */
  const navbar = document.querySelector('.navbar');
  let ticking = false;

  function handleNavScroll() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(handleNavScroll); ticking = true; }
  }, { passive: true });
  handleNavScroll();

  /* ── Active Navigation Link ── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a:not(.btn)').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ── Scroll Animations (Intersection Observer) ── */
  const animatedEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .stagger-children');

  if (animatedEls.length) {
    const animObserver = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); animObserver.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    animatedEls.forEach(el => animObserver.observe(el));
  }

  /* ── Animated Counters ── */
  const counters = document.querySelectorAll('[data-counter]');

  if (counters.length) {
    const counterObserver = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); }
      }),
      { threshold: 0.5 }
    );
    counters.forEach(c => counterObserver.observe(c));
  }

  function animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-counter'), 10);
    const suffix   = el.getAttribute('data-suffix') || '';
    const prefix   = el.getAttribute('data-prefix') || '';
    const duration = 2000;
    const step     = target / (duration / 16);
    let current    = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
    }, 16);
  }

  /* ── FAQ Accordion (aria-expanded) ── */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer   = item.querySelector('.faq-answer');
    if (!question || !answer) return;

    // Ensure ARIA IDs
    const id = 'faq-' + Math.random().toString(36).slice(2, 8);
    answer.id = answer.id || id;
    question.setAttribute('aria-controls', answer.id);

    question.addEventListener('click', () => {
      const willOpen = !item.classList.contains('active');

      // Close all
      faqItems.forEach(i => {
        i.classList.remove('active');
        const q = i.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      // Open clicked
      if (willOpen) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    });

    question.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); question.click(); }
    });
  });

  /* ── Form Validation ── */
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();

      let isValid = true;
      const formMsg = contactForm.querySelector('.form-message');

      // Reset
      contactForm.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
      if (formMsg) { formMsg.className = 'form-message'; formMsg.style.display = 'none'; }

      // Name
      const name = contactForm.querySelector('#name');
      if (name && name.value.trim().length < 2) { setFieldError(name, 'Please enter your full name'); isValid = false; }

      // Email
      const email = contactForm.querySelector('#email');
      if (email && !isValidEmail(email.value)) { setFieldError(email, 'Please enter a valid email address'); isValid = false; }

      // Message
      const message = contactForm.querySelector('#message');
      if (message && message.value.trim().length < 10) { setFieldError(message, 'Your message must be at least 10 characters'); isValid = false; }

      if (isValid) {
        if (formMsg) {
          formMsg.className = 'form-message success';
          formMsg.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> Thank you for reaching out! We\'ll get back to you within 24 hours.';
          formMsg.style.display = 'flex';
        }
        contactForm.reset();
        setTimeout(() => { if (formMsg) formMsg.style.display = 'none'; }, 6000);
      } else {
        if (formMsg) {
          formMsg.className = 'form-message error';
          formMsg.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg> Please fix the highlighted fields and try again.';
          formMsg.style.display = 'flex';
        }
        // Focus first error field
        const first = contactForm.querySelector('.form-group.error input, .form-group.error textarea');
        if (first) first.focus();
      }
    });
  }

  function setFieldError(field, msg) {
    const group = field.closest('.form-group');
    if (!group) return;
    group.classList.add('error');
    const errEl = group.querySelector('.error-text');
    if (errEl) errEl.textContent = msg;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ── Community Board Filter (demo) ── */
  const filterForm = document.getElementById('filterForm');

  if (filterForm) {
    filterForm.addEventListener('submit', e => {
      e.preventDefault();
      const cards = document.querySelectorAll('.listing-card');
      cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'all 0.35s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 100);
      });
    });
  }

  /* ── Claim Button Feedback ── */
  document.querySelectorAll('.listing-footer .btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const original = this.textContent;
      this.textContent = 'Claimed!';
      this.disabled = true;
      this.style.background = 'var(--color-primary-light)';
      setTimeout(() => {
        this.textContent = original;
        this.disabled = false;
        this.style.background = '';
      }, 3000);
    });
  });

  /* ── Newsletter Signup ── */
  document.querySelectorAll('.footer-newsletter').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input  = form.querySelector('input');
      const button = form.querySelector('button');

      if (input && button && isValidEmail(input.value)) {
        const original = button.textContent;
        button.textContent = 'Subscribed!';
        button.style.background = 'var(--color-primary-light)';
        input.value = '';
        setTimeout(() => { button.textContent = original; button.style.background = ''; }, 3000);
      } else if (input) {
        input.style.borderColor = 'var(--color-accent)';
        setTimeout(() => { input.style.borderColor = ''; }, 2000);
      }
    });
  });

});

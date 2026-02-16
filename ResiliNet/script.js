/*
 * ResiliNet — Main Script (Production)
 * Handles navigation, scroll animations, counters, validation, FAQ, filters
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Mobile Navigation Toggle ── */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('active');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Sticky Header ── */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Scroll Animations (IntersectionObserver) ── */
  const animatedEls = document.querySelectorAll('.fade-up, .fade-in');
  if (animatedEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    animatedEls.forEach(el => observer.observe(el));
  } else {
    animatedEls.forEach(el => el.classList.add('visible'));
  }

  /* ── Animated Counters ── */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const format = n => n >= 1_000_000 ? (n / 1_000_000).toFixed(0) + 'M' : n >= 1_000 ? n.toLocaleString() : n.toString();
    const ease   = t => 1 - Math.pow(1 - t, 3);
    const run    = el => {
      const target   = +el.dataset.count;
      const duration = 2000;
      const suffix   = el.dataset.suffix || '';
      const start    = performance.now();
      const step = now => {
        const t = Math.min((now - start) / duration, 1);
        el.textContent = format(Math.floor(ease(t) * target)) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cObserver = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          run(entry.target);
          cObserver.unobserve(entry.target);
        }
      }),
      { threshold: 0.3 }
    );
    counters.forEach(el => cObserver.observe(el));
  }

  /* ── Form Validation ── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const showError = (input, msg) => {
      input.classList.add('error');
      const err = input.parentElement.querySelector('.form-error');
      if (err) { err.textContent = msg; err.classList.add('visible'); }
    };
    const clearError = input => {
      input.classList.remove('error');
      const err = input.parentElement.querySelector('.form-error');
      if (err) err.classList.remove('visible');
    };

    contactForm.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(el => {
      el.addEventListener('input', () => clearError(el));
      el.addEventListener('change', () => clearError(el));
    });

    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;

      contactForm.querySelectorAll('[required]').forEach(field => {
        clearError(field);
        const val = field.value.trim();
        if (!val) { showError(field, 'This field is required.'); valid = false; }
        else if (field.type === 'email' && !emailRe.test(val)) {
          showError(field, 'Enter a valid email address.'); valid = false;
        }
      });

      if (valid) {
        const success = contactForm.querySelector('.form-success');
        if (success) success.classList.add('visible');
        contactForm.reset();
        setTimeout(() => { if (success) success.classList.remove('visible'); }, 6000);
      }
    });
  }

  /* ── FAQ Accordion ── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      const wasActive = parent.classList.contains('active');

      parent.closest('.faq-list, .faq-grid, section')
        ?.querySelectorAll('.faq-item.active')
        .forEach(item => {
          item.classList.remove('active');
          item.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        });

      if (!wasActive) {
        parent.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Risk Map Filters ── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const riskCards   = document.querySelectorAll('.risk-card');
  if (filterBtns.length && riskCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        riskCards.forEach(card => {
          const threats = card.dataset.threats || '';
          const match = filter === 'all' || threats.toLowerCase().includes(filter.toLowerCase());
          card.style.display = match ? '' : 'none';
        });
      });
    });
  }

  /* ── Newsletter Form ── */
  const newsForm = document.querySelector('.newsletter-form');
  if (newsForm) {
    newsForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = newsForm.querySelector('input');
      if (input && input.value.trim()) {
        const btn = newsForm.querySelector('button');
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = 'Subscribed ✓';
          btn.disabled = true;
          input.value = '';
          setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
        }
      }
    });
  }

  /* ── Active Nav Link ── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

});

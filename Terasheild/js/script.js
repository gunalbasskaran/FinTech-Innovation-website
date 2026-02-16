/**
 * TerraShield — Main JavaScript
 * Technology Forging Climate-Ready Communities
 * ─────────────────────────────────────────────
 * Features:
 * - Auto-hide navbar on scroll
 * - Mobile menu toggle
 * - Smooth scroll
 * - Intersection Observer reveal animations
 * - Back-to-top button
 * - Scroll progress bar
 * - Animated counters
 * - FAQ accordion
 * - Form validation + success toast
 * - Reduced-motion awareness
 */

(function () {
  'use strict';

  // ── Utility ──────────────────────────────────────────────
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // ── Scroll Progress Bar ──────────────────────────────────
  const scrollProgress = $('.scroll-progress');

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgress) {
      scrollProgress.style.width = progress + '%';
    }
  }

  // ── Navbar Auto-Hide ─────────────────────────────────────
  const navbar = $('.navbar');
  let lastScrollY = 0;
  let ticking = false;

  function handleNavbarScroll() {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 80) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }

    if (currentScrollY > lastScrollY && currentScrollY > 300) {
      navbar.classList.add('navbar--hidden');
    } else {
      navbar.classList.remove('navbar--hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    function () {
      updateScrollProgress();

      if (!ticking) {
        window.requestAnimationFrame(handleNavbarScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  // ── Mobile Menu Toggle ───────────────────────────────────
  const menuToggle = $('.navbar__toggle');
  const mobileMenu = $('.mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      const isOpen = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isOpen);
      mobileMenu.classList.toggle('mobile-menu--open');

      if (!isOpen) {
        // Focus first link when menu opens
        const firstLink = $('a', mobileMenu);
        if (firstLink) firstLink.focus();
      }
    });

    // Close menu on link click
    $$('.mobile-menu__link', mobileMenu).forEach(function (link) {
      link.addEventListener('click', function () {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('mobile-menu--open');
      });
    });

    // Close menu on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('mobile-menu--open')) {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('mobile-menu--open');
        menuToggle.focus();
      }
    });
  }

  // ── Intersection Observer — Reveal Animations ────────────
  if (!prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    $$('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // If reduced motion, show everything immediately
    $$('.reveal').forEach(function (el) {
      el.classList.add('reveal--visible');
    });
  }

  // ── Animated Counters ────────────────────────────────────
  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const isDecimal = el.getAttribute('data-decimal') === 'true';
    const useSeparator = el.getAttribute('data-separator') === 'true';
    const duration = prefersReducedMotion ? 0 : 1800;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      let current = eased * target;

      if (isDecimal) {
        current = current.toFixed(1);
      } else {
        current = Math.floor(current);
      }

      if (useSeparator) {
        current = Number(current).toLocaleString();
      }

      el.textContent = prefix + current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    if (duration === 0) {
      let display = isDecimal ? target.toFixed(1) : target;
      if (useSeparator) display = Number(display).toLocaleString();
      el.textContent = prefix + display + suffix;
    } else {
      requestAnimationFrame(update);
    }
  }

  const counterObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  $$('[data-count]').forEach(function (el) {
    counterObserver.observe(el);
  });

  // ── Back to Top Button ───────────────────────────────────
  const backToTop = $('#back-to-top');

  if (backToTop) {
    window.addEventListener(
      'scroll',
      function () {
        if (window.scrollY > 600) {
          backToTop.classList.add('back-to-top--visible');
        } else {
          backToTop.classList.remove('back-to-top--visible');
        }
      },
      { passive: true }
    );

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // ── FAQ Accordion ────────────────────────────────────────
  $$('.faq__question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      const answerId = this.getAttribute('aria-controls');
      const answer = $('#' + answerId);

      // Close all other FAQ items
      $$('.faq__question').forEach(function (otherBtn) {
        if (otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          const otherAnswerId = otherBtn.getAttribute('aria-controls');
          const otherAnswer = $('#' + otherAnswerId);
          if (otherAnswer) otherAnswer.classList.remove('faq__answer--open');
        }
      });

      // Toggle current
      this.setAttribute('aria-expanded', !isExpanded);
      if (answer) {
        answer.classList.toggle('faq__answer--open');
      }
    });
  });

  // ── Contact Form Validation ──────────────────────────────
  const contactForm = $('#contact-form');

  if (contactForm) {
    const validators = {
      'first-name': function (val) { return val.trim().length >= 1; },
      'last-name': function (val) { return val.trim().length >= 1; },
      email: function (val) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
      },
      interest: function (val) { return val !== ''; },
      message: function (val) { return val.trim().length >= 10; },
    };

    function validateField(field) {
      const id = field.id;
      const errorEl = $('#' + id + '-error');
      const isValid = validators[id] ? validators[id](field.value) : true;

      if (isValid) {
        field.classList.remove('form__input--error');
        if (errorEl) errorEl.style.display = 'none';
      } else {
        field.classList.add('form__input--error');
        if (errorEl) errorEl.style.display = 'block';
      }

      return isValid;
    }

    // Real-time validation on blur
    $$('.form__input, .form__textarea, .form__select', contactForm).forEach(
      function (field) {
        field.addEventListener('blur', function () {
          validateField(this);
        });

        // Remove error on input
        field.addEventListener('input', function () {
          if (this.classList.contains('form__input--error')) {
            validateField(this);
          }
        });

        // Handle select elements which fire 'change' instead of 'input'
        if (field.tagName === 'SELECT') {
          field.addEventListener('change', function () {
            validateField(this);
          });
        }
      }
    );

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const fields = $$('[required]', contactForm);
      let allValid = true;
      let firstInvalid = null;

      fields.forEach(function (field) {
        const isValid = validateField(field);
        if (!isValid && allValid) {
          firstInvalid = field;
          allValid = false;
        }
        if (!isValid) allValid = false;
      });

      if (!allValid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Show loading state
      const submitBtn = $('#submit-btn');
      submitBtn.classList.add('btn--loading');
      submitBtn.disabled = true;

      // Simulate submission (replace with real endpoint)
      setTimeout(function () {
        submitBtn.classList.remove('btn--loading');
        submitBtn.disabled = false;
        contactForm.reset();

        // Remove error states
        $$('.form__input--error', contactForm).forEach(function (el) {
          el.classList.remove('form__input--error');
        });

        // Show success toast
        showToast('Message sent successfully! We\'ll respond within 24 hours.');
      }, 1500);
    });
  }

  // ── Toast Notification ───────────────────────────────────
  const toast = $('#toast');
  const toastMessage = $('#toast-message');
  const toastClose = $('#toast-close');
  let toastTimeout;

  function showToast(message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add('toast--visible');

    // Hide back-to-top temporarily if it overlaps
    if (backToTop) backToTop.style.display = 'none';

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      hideToast();
    }, 5000);
  }

  function hideToast() {
    if (!toast) return;
    toast.classList.remove('toast--visible');
    if (backToTop) {
      setTimeout(function () {
        backToTop.style.display = '';
      }, 400);
    }
  }

  if (toastClose) {
    toastClose.addEventListener('click', hideToast);
  }

  // ── Smooth Scroll for Anchor Links ───────────────────────
  $$('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#!' || href.length < 2) return;

      const target = $(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });

        // Update focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

  // ── Lazy Loading Images (native + fallback) ──────────────
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading — already handled via loading="lazy" attribute
  } else {
    // Fallback for older browsers without native lazy loading
    const lazyImages = $$('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(function (img) {
      imageObserver.observe(img);
    });
  }

  // ── Initial state ────────────────────────────────────────
  updateScrollProgress();
})();

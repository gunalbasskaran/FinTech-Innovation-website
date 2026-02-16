/* ============================================
   NovaPay — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initCounters();
  initFAQ();
  initForms();
  initLazyImages();
});

/* ===== NAVBAR ===== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  const overlay = document.getElementById('navOverlay');

  // Scroll effect (throttled via rAF)
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const closeMenu = () => {
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    menu.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Mobile toggle
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.contains('active') ? closeMenu() : openMenu();
    });

    // Close on link click
    menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on overlay click
    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target) && menu.classList.contains('active')) {
        closeMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('active')) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  // Active link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      if (!link.classList.contains('btn-nav')) {
        link.classList.add('active');
      }
    }
  });
}

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* ===== ANIMATED COUNTERS ===== */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 2200;
    const start = performance.now();

    // Handle zero target (e.g. $0.1%)
    if (target === 0) {
      el.textContent = prefix + '0' + suffix;
      return;
    }

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = prefix + current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = prefix + target.toLocaleString() + suffix;
      }
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(el => observer.observe(el));
}

/* ===== FAQ ACCORDION ===== */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close all
      faqItems.forEach(other => {
        other.classList.remove('active');
        other.querySelector('.faq-answer').style.maxHeight = '0';
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* ===== FORM VALIDATION ===== */
function initForms() {
  // Waitlist form (CTA)
  const waitlistForms = document.querySelectorAll('.cta-form');
  waitlistForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button[type="submit"]');
      const msg = form.closest('section')?.querySelector('.form-message') || form.nextElementSibling;

      if (!input || !isValidEmail(input.value)) {
        input?.classList.add('error');
        input?.focus();
        showMessage(msg, 'Please enter a valid email address.', 'error-msg');
        return;
      }

      // Simulate loading
      input.classList.remove('error');
      if (btn) {
        const originalText = btn.textContent;
        btn.classList.add('loading');
        btn.textContent = '';
        setTimeout(() => {
          btn.classList.remove('loading');
          btn.textContent = originalText;
          input.value = '';
          showMessage(msg, 'You\'re on the list! We\'ll be in touch soon.', 'success');
        }, 800);
      } else {
        input.value = '';
        showMessage(msg, 'You\'re on the list! We\'ll be in touch soon.', 'success');
      }
    });

    // Clear error on typing
    const emailInput = form.querySelector('input[type="email"]');
    if (emailInput) {
      emailInput.addEventListener('input', () => {
        emailInput.classList.remove('error');
      });
    }
  });

  // Contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      // Validate name
      const name = contactForm.querySelector('#name');
      if (name && name.value.trim().length < 2) {
        setFieldError(name, 'Please enter your full name.');
        valid = false;
      } else if (name) {
        clearFieldError(name);
      }

      // Validate email
      const email = contactForm.querySelector('#email');
      if (email && !isValidEmail(email.value)) {
        setFieldError(email, 'Please enter a valid email address.');
        valid = false;
      } else if (email) {
        clearFieldError(email);
      }

      // Validate subject
      const subject = contactForm.querySelector('#subject');
      if (subject && subject.value === '') {
        setFieldError(subject, 'Please select a subject.');
        valid = false;
      } else if (subject) {
        clearFieldError(subject);
      }

      // Validate message
      const message = contactForm.querySelector('#message');
      if (message && message.value.trim().length < 10) {
        setFieldError(message, 'Message must be at least 10 characters.');
        valid = false;
      } else if (message) {
        clearFieldError(message);
      }

      const formMsg = contactForm.querySelector('.form-message');

      if (valid) {
        // Simulate loading
        const btn = contactForm.querySelector('button[type="submit"]');
        if (btn) {
          const originalText = btn.textContent;
          btn.classList.add('loading');
          btn.textContent = '';
          setTimeout(() => {
            btn.classList.remove('loading');
            btn.textContent = originalText;
            contactForm.reset();
            // Clear all success states
            contactForm.querySelectorAll('.success').forEach(f => f.classList.remove('success'));
            showMessage(formMsg, 'Message sent successfully! We\'ll get back to you within 24 hours.', 'success');
          }, 1000);
        }
      } else {
        showMessage(formMsg, 'Please fix the errors above and try again.', 'error-msg');
        // Focus first error field
        const firstError = contactForm.querySelector('.error');
        if (firstError) firstError.focus();
      }
    });

    // Real-time validation on blur
    contactForm.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(field => {
      field.addEventListener('blur', () => {
        if (field.value.trim() !== '') {
          if (field.type === 'email' && !isValidEmail(field.value)) {
            setFieldError(field, 'Please enter a valid email address.');
          } else {
            clearFieldError(field);
            field.classList.add('success');
          }
        }
      });

      field.addEventListener('input', () => {
        if (field.classList.contains('error')) {
          clearFieldError(field);
        }
      });

      // Handle select change
      if (field.tagName === 'SELECT') {
        field.addEventListener('change', () => {
          if (field.value !== '') {
            clearFieldError(field);
            field.classList.add('success');
          }
        });
      }
    });
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function setFieldError(field, message) {
  field.classList.add('error');
  const errorEl = field.parentElement.querySelector('.form-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

function clearFieldError(field) {
  field.classList.remove('error');
  const errorEl = field.parentElement.querySelector('.form-error');
  if (errorEl) {
    errorEl.classList.remove('visible');
  }
}

function showMessage(el, text, type) {
  if (!el) return;
  el.className = 'form-message ' + type;
  el.textContent = text;
  el.style.display = '';

  // Auto-hide after 6 seconds
  clearTimeout(el._hideTimeout);
  el._hideTimeout = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-4px)';
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => {
      el.style.display = 'none';
      el.style.opacity = '';
      el.style.transform = '';
      el.style.transition = '';
    }, 300);
  }, 6000);
}

/* ===== LAZY IMAGE LOADING ===== */
function initLazyImages() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  if (!images.length) return;

  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imgObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(img => imgObserver.observe(img));
  }
}

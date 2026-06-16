/**
 * AGRONOV Global - Main Application Script
 * Clean, modular, optimized.
 */

// ── THEME TOGGLE (runs immediately before DOM load to prevent flash) ──
const html = document.documentElement;
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);

// ── ACCESSIBILITY PREFERENCES (apply early to prevent flash) ──
let a11yPrefs = {};
try {
  a11yPrefs = JSON.parse(localStorage.getItem('a11yPrefs') || '{}') || {};
} catch (e) {
  a11yPrefs = {};
}

function applyA11y(p) {
  html.classList.toggle('a11y-contrast', !!p.contrast);
  html.classList.toggle('a11y-links', !!p.links);
  html.classList.toggle('a11y-motion', !!p.motion);
  const step = p.fontStep || 0;
  html.style.fontSize = step ? (16 + step * 2) + 'px' : '';
}
applyA11y(a11yPrefs);

// ── EVERYTHING ELSE: wait for DOM ──
document.addEventListener('DOMContentLoaded', () => {
  // Config
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySAU1llS-S2WbfSQkovq4GrrIjvZiA1FW-k-FYbLOBFrECPxRb7oyu3mM7YqrVdW4y/exec';
  const RATE_LIMIT_MS = 60000; // 1 minute

  // Best-effort visitor geo data for the IP / City columns in the sheet.
  // Fetched once on load so it's ready by submit time; silently ignored on failure.
  const geoData = { ip: '', city: '' };
  fetch('https://ipapi.co/json/')
    .then(res => (res.ok ? res.json() : null))
    .then(data => {
      if (data) {
        geoData.ip = data.ip || '';
        geoData.city = data.city || '';
      }
    })
    .catch(() => { /* geo is optional — never block the form */ });

  // Cache DOM Elements
  const themeToggle = document.getElementById('themeToggle');
  const navbar = document.getElementById('navbar');
  const contactForm = document.getElementById('contactForm');
  
  // ── Theme Toggle ──
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', currentTheme === 'dark');
    themeToggle.addEventListener('click', () => {
      const isDark = html.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      themeToggle.setAttribute('aria-pressed', !isDark);
    });
  }

  // ── Accessibility Menu ──
  const a11yToggle = document.getElementById('a11yToggle');
  const a11yPanel = document.getElementById('a11yPanel');
  if (a11yToggle && a11yPanel) {
    const FONT_MIN = -1, FONT_MAX = 3;
    const savePrefs = () => localStorage.setItem('a11yPrefs', JSON.stringify(a11yPrefs));

    const syncPanel = () => {
      a11yPanel.querySelectorAll('.a11y-option').forEach(btn => {
        btn.setAttribute('aria-checked', !!a11yPrefs[btn.dataset.a11y]);
      });
      const anyActive = !!(a11yPrefs.contrast || a11yPrefs.links || a11yPrefs.motion || a11yPrefs.fontStep);
      a11yToggle.classList.toggle('active', anyActive);
    };
    syncPanel();

    const openPanel = () => {
      a11yPanel.hidden = false;
      a11yToggle.setAttribute('aria-expanded', 'true');
    };
    const closePanel = () => {
      a11yPanel.hidden = true;
      a11yToggle.setAttribute('aria-expanded', 'false');
    };

    a11yToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      a11yPanel.hidden ? openPanel() : closePanel();
    });

    a11yPanel.addEventListener('click', (e) => e.stopPropagation());

    a11yPanel.querySelectorAll('[data-a11y]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.a11y;
        if (action === 'font-up') {
          a11yPrefs.fontStep = Math.min(FONT_MAX, (a11yPrefs.fontStep || 0) + 1);
        } else if (action === 'font-down') {
          a11yPrefs.fontStep = Math.max(FONT_MIN, (a11yPrefs.fontStep || 0) - 1);
        } else if (action === 'reset') {
          a11yPrefs = {};
        } else {
          a11yPrefs[action] = !a11yPrefs[action];
        }
        applyA11y(a11yPrefs);
        savePrefs();
        syncPanel();
      });
    });

    // Dismiss on outside click or Escape
    document.addEventListener('click', () => { if (!a11yPanel.hidden) closePanel(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !a11yPanel.hidden) {
        closePanel();
        a11yToggle.focus();
      }
    });
  }

  // ── Navbar: glass-on-scroll + auto-hide so it reads like a clean landing page ──
  if (navbar) {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 50);

      // Hide when scrolling down past the hero, reveal when scrolling back up
      if (y > lastY && y > 160) {
        navbar.classList.add('nav-hidden');
        // Collapse the accessibility panel if the bar slides away
        if (a11yPanel && !a11yPanel.hidden) {
          a11yPanel.hidden = true;
          if (a11yToggle) a11yToggle.setAttribute('aria-expanded', 'false');
        }
      } else if (y < lastY) {
        navbar.classList.remove('nav-hidden');
      }
      if (y <= 50) navbar.classList.remove('nav-hidden');

      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ── Smooth Scroll for Anchor Links ──
  const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
  smoothScrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const offset = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - offset;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Focus the target for accessibility
        targetEl.setAttribute('tabindex', '-1');
        targetEl.focus({ preventScroll: true });
        // Remove outline on target
        targetEl.style.outline = 'none';
      }
    });
  });

  // ── Fade-in Elements Observer ──
  const triggerFadeElements = document.querySelectorAll('.partner-card, .contact-info-bar, .hero-eyebrow, .step-item');
  triggerFadeElements.forEach(el => el.classList.add('fade-in-element'));

  if ('IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-visible');
          observer.unobserve(entry.target); // Optimize: stop observing once visible
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    });

    document.querySelectorAll('.fade-in-element').forEach(el => fadeObserver.observe(el));
  } else {
    // Fallback for older browsers
    document.querySelectorAll('.fade-in-element').forEach(el => el.classList.add('fade-in-visible'));
  }

  // ── Form Handling & Validation ──
  if (contactForm) {
    const goalTextarea = document.getElementById('goal');
    const charCount = document.getElementById('charCount');
    const submitBtn = document.getElementById('submitBtn');
    const formFeedback = document.getElementById('form-feedback');

    // Reset feedback container on user input
    contactForm.addEventListener('input', () => {
      if (formFeedback.style.display === 'block') {
        formFeedback.style.display = 'none';
      }
    });

    // Character Counter
    if (goalTextarea && charCount) {
      goalTextarea.addEventListener('input', () => {
        const count = goalTextarea.value.length;
        charCount.textContent = count;
        // visual feedback near limit
        charCount.style.color = count >= 190 ? 'var(--color-error)' : 'var(--text-secondary)';
      });
    }

    // Input Sanitization helper
    const sanitizeInput = (str) => {
      return str.replace(/[&<>'"]/g, 
        tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[tag])
      );
    };

    // Client-side Validation Helper
    const validateField = (input, validatorCallback) => {
      const formGroup = input.closest('.form-group, .form-fieldset');
      if (!formGroup) return true;

      const isValid = validatorCallback(input.value);
      if (!isValid) {
        formGroup.classList.add('has-error');
        input.setAttribute('aria-invalid', 'true');
      } else {
        formGroup.classList.remove('has-error');
        input.setAttribute('aria-invalid', 'false');
      }
      return isValid;
    };

    // Form Submit Handler
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 1. Bot check (Honeypot)
      const honeyPot = contactForm.querySelector('input[name="_honey"]');
      if (honeyPot && honeyPot.value) {
        return; // Silent fail for bots
      }

      // 2. Clear previous errors
      document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
      
      // 3. Validation
      let isValid = true;
      const elements = {
        name: document.getElementById('name'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        brandLink: document.getElementById('brandLink'),
        salesChannels: document.getElementById('salesChannels'),
        productCount: document.getElementById('productCount'),
        distribution: document.getElementById('distribution'),
        goal: document.getElementById('goal')
      };

      // Email valid pattern
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // URL valid pattern (basic)
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

      if (!validateField(elements.name, val => val.trim().length > 1)) isValid = false;
      if (!validateField(elements.email, val => emailRegex.test(val))) isValid = false;
      if (!validateField(elements.phone, val => val.trim().length >= 7)) isValid = false;
      if (!validateField(elements.brandLink, val => urlRegex.test(val))) isValid = false;
      if (!validateField(elements.salesChannels, val => val.trim().length > 1)) isValid = false;
      if (!validateField(elements.productCount, val => parseInt(val) > 0)) isValid = false;
      if (!validateField(elements.distribution, val => val.trim().length > 1)) isValid = false;
      if (!validateField(elements.goal, val => val.trim().length > 5)) isValid = false;

      // Radio validation
      const repSelected = document.querySelector('input[name="manufacturer_rep"]:checked');
      if (!repSelected) {
        const fSet = document.querySelectorAll('input[name="manufacturer_rep"]')[0].closest('.form-fieldset');
        const err = fSet.querySelector('.error-message');
        if (err) err.style.display = 'block';
        isValid = false;
      }
      
      const tmSelected = document.querySelector('input[name="registered_trademark"]:checked');
      if (!tmSelected) {
        const fSet = document.querySelectorAll('input[name="registered_trademark"]')[0].closest('.form-fieldset');
        const err = fSet.querySelector('.error-message');
        if (err) err.style.display = 'block';
        isValid = false;
      }

      // Focus first error if invalid
      if (!isValid) {
        const firstError = document.querySelector('.has-error .form-input, .has-error .form-textarea');
        if (firstError) firstError.focus();
        return;
      }

      // 4. Rate Limiting Check
      const lastSubmit = localStorage.getItem('lastFormSubmit');
      const now = Date.now();
      if (lastSubmit && (now - parseInt(lastSubmit)) < RATE_LIMIT_MS) {
        formFeedback.textContent = "Please wait a moment before submitting another application.";
        formFeedback.style.display = 'block';
        formFeedback.style.color = 'var(--color-error)';
        return;
      }

      // Prepare UI for sending
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      // Prepare Data (Sanitized)
      const formData = Object.keys(elements).reduce((acc, key) => {
        if(elements[key]) acc[elements[key].name] = sanitizeInput(elements[key].value);
        return acc;
      }, {});
      
      formData.manufacturer_rep = repSelected ? sanitizeInput(repSelected.value) : "";
      formData.registered_trademark = tmSelected ? sanitizeInput(tmSelected.value) : "";
      formData.ip = sanitizeInput(geoData.ip || "");
      formData.city = sanitizeInput(geoData.city || "");

      try {
        // Broadcast in background (no-cors means we can't read response, assume success if network works)
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        // Set rate limit token
        localStorage.setItem('lastFormSubmit', now.toString());

        // Redirect to success page
        window.location.href = "contactus.html";
        setTimeout(() => contactForm.reset(), 100);

      } catch (error) {
        // Network error handling
        formFeedback.textContent = "We encountered a network issue. Please check your connection and try again.";
        formFeedback.style.display = 'block';
        formFeedback.style.color = 'var(--color-error)';
      } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    });
  }
});

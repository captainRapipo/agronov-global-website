/**
 * AGRONOV Global - Main Application Script
 * Clean, modular, optimized.
 */

// ── THEME TOGGLE (runs immediately before DOM load to prevent flash) ──
const html = document.documentElement;
// An explicit user choice (localStorage) always wins. Otherwise fall back to the
// page's own default declared via <html data-theme="...">, then to light.
const pageDefaultTheme = html.getAttribute('data-theme') || 'light';
const currentTheme = localStorage.getItem('theme') || pageDefaultTheme;
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
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0JyM-rMfkFvD6OLEPpkGgsFmo8nmobkz2xqSkWZMNJS3YKJSLg41FOCUEh0FwmTrC/exec';
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

  // ── Mobile Nav Toggle ──
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    const closeNav = () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation menu');
    };
    const openNav = () => {
      navLinks.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close navigation menu');
    };

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.contains('open') ? closeNav() : openNav();
    });

    // Close after choosing a destination
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    // Close on outside click / Escape
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') &&
          !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
        closeNav();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
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
  const triggerFadeElements = document.querySelectorAll('.partner-card, .svc-card, .contact-info-bar, .hero-eyebrow, .step-item');
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

  // ── Dashboard Count-Up Animation ──
  const dashboard = document.querySelector('[data-dashboard]');
  if (dashboard) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.documentElement.classList.contains('a11y-motion');

    const formatValue = (val, decimals, prefix, suffix) => {
      const neg = val < 0;
      const num = Math.abs(val).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      return `${neg ? '-' : ''}${prefix}${num}${suffix}`;
    };

    // Matrix-style scramble: digits flicker through random values and lock in
    // left-to-right until the real figure is revealed. A run token lets a brand
    // switch supersede any animation still in flight.
    let runToken = 0;
    const animateCount = (el, delay, token) => {
      const target = parseFloat(el.getAttribute('data-count')) || 0;
      const decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const finalStr = formatValue(target, decimals, prefix, suffix);

      if (reduceMotion) {
        el.textContent = finalStr;
        return;
      }

      const chars = finalStr.split('');
      const digitPositions = [];
      chars.forEach((c, i) => { if (c >= '0' && c <= '9') digitPositions.push(i); });
      const totalDigits = digitPositions.length;
      if (totalDigits === 0) { el.textContent = finalStr; return; }

      const duration = 1050;
      el.classList.add('dash-scrambling');
      let startTime = null;
      let lastFlip = 0;

      const render = (locked) => {
        const out = chars.slice();
        for (let d = locked; d < totalDigits; d++) {
          out[digitPositions[d]] = String((Math.random() * 10) | 0);
        }
        el.textContent = out.join('');
      };

      const step = (ts) => {
        if (token !== runToken) { el.classList.remove('dash-scrambling'); return; }
        if (startTime === null) startTime = ts;
        const elapsed = ts - startTime - delay;
        if (elapsed < 0) { window.requestAnimationFrame(step); return; }
        const progress = Math.min(elapsed / duration, 1);
        const locked = Math.floor(progress * totalDigits);
        if (ts - lastFlip > 45 || progress >= 1) {
          render(locked);
          lastFlip = ts;
        }
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = finalStr;
          el.classList.remove('dash-scrambling');
        }
      };
      window.requestAnimationFrame(step);
    };

    const valEls = dashboard.querySelectorAll('[data-key]');
    const periodEl = dashboard.querySelector('[data-period]');

    const runCounts = () => {
      // Cascade the reveal down the ledger for a decoding feel
      const token = ++runToken;
      dashboard.querySelectorAll('[data-count]').forEach((el, i) => animateCount(el, i * 55, token));
    };

    // ── Per-brand datasets (figures lightly adjusted for confidentiality) ──
    const BRANDS = {
      b1: { period: 'Jul 1 – Sep 30, 2025', values: { sales: 990717.38, units: 1289, refunds: 39, promo: -382.07, advertising: -78480.02, shipping: -146521.54, refundcost: -21798.32, amazonfees: -155232.74, cogs: -378208.68, gross: 210094.01, indirect: 0, net: 210094.01, payout: 733130.87, acos: 7.52, refundpct: 2.67, sellable: 29.83, margin: 20.15, roi: 52.77, subs: 0, sessions: 36235, usp: 3.43 } },
      b2: { period: 'Apr 1 – Jun 30, 2025', values: { sales: 346674.29, units: 4820, refunds: 334, promo: -1851.17, advertising: -1767.38, shipping: -7999.00, refundcost: -10849.81, amazonfees: -144058.19, cogs: -105339.84, gross: 74808.90, indirect: 0, net: 74808.90, payout: 183737.37, acos: 0.48, refundpct: 5.89, sellable: 31.45, margin: 20.50, roi: 67.45, subs: 0, sessions: 22971, usp: 3.85 } },
      b3: { period: 'Jan 1 – Mar 31, 2026', values: { sales: 75658.19, units: 800, refunds: 33, promo: 0, advertising: -9671.38, shipping: 0, refundcost: -1655.47, amazonfees: -15599.81, cogs: -40143.53, gross: 8588.00, indirect: 228.00, net: 8360.00, payout: 47664.64, acos: 12.14, refundpct: 3.37, sellable: 34.96, margin: 10.50, roi: 19.79, subs: 0, sessions: 10678, usp: 6.94 } }
    };

    const loadBrand = (key) => {
      const brand = BRANDS[key];
      if (!brand) return;
      if (periodEl) periodEl.textContent = brand.period;
      valEls.forEach(el => {
        const v = brand.values[el.getAttribute('data-key')];
        if (v === undefined) return;
        el.setAttribute('data-count', v);
        if (!el.classList.contains('accent')) el.classList.toggle('neg', v < 0);
      });
      runCounts();
    };

    dashboard.querySelectorAll('.dash-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('is-active')) return;
        dashboard.querySelectorAll('.dash-tab').forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        loadBrand(tab.getAttribute('data-brand'));
      });
    });

    if ('IntersectionObserver' in window) {
      const countObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runCounts();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });
      countObserver.observe(dashboard);
    } else {
      runCounts();
    }
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

    // ── Multi-step Navigation (2-step progressive form) ──
    const formStep1 = contactForm.querySelector('.form-step[data-step="1"]');
    const formStep2 = contactForm.querySelector('.form-step[data-step="2"]');
    const formNext = document.getElementById('formNext');
    const formBack = document.getElementById('formBack');
    const progressFill = document.getElementById('formProgressFill');
    const progressSteps = contactForm.querySelectorAll('.form-progress-step');

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRe = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

    const setStep = (n) => {
      if (formStep1) formStep1.hidden = n !== 1;
      if (formStep2) formStep2.hidden = n !== 2;
      if (progressFill) progressFill.style.width = n === 2 ? '100%' : '50%';
      progressSteps.forEach(s => {
        s.classList.toggle('is-active', parseInt(s.getAttribute('data-progress'), 10) <= n);
      });
    };

    const stepOf = (el) => {
      const step = el && el.closest ? el.closest('.form-step') : null;
      return step ? parseInt(step.getAttribute('data-step'), 10) : 1;
    };

    if (formStep1 && formStep2) setStep(1);

    if (formNext) {
      formNext.addEventListener('click', () => {
        document.querySelectorAll('.form-step[data-step="1"] .has-error')
          .forEach(el => el.classList.remove('has-error'));
        let ok = true;
        const n = document.getElementById('name');
        const em = document.getElementById('email');
        const bl = document.getElementById('brandLink');
        if (!validateField(n, v => v.trim().length > 1)) ok = false;
        if (!validateField(em, v => emailRe.test(v))) ok = false;
        if (!validateField(bl, v => urlRe.test(v))) ok = false;
        if (!ok) {
          const firstErr = document.querySelector('.form-step[data-step="1"] .has-error .form-input');
          if (firstErr) firstErr.focus();
          return;
        }
        setStep(2);
        const phone = document.getElementById('phone');
        if (phone) phone.focus({ preventScroll: true });
        if (formStep2 && formStep2.scrollIntoView) {
          formStep2.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    if (formBack) {
      formBack.addEventListener('click', () => {
        setStep(1);
        if (formStep1 && formStep1.scrollIntoView) {
          formStep1.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

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

      // Focus first error if invalid — reveal the step it lives on first
      if (!isValid) {
        const firstErrorGroup = document.querySelector('.has-error');
        if (firstErrorGroup) setStep(stepOf(firstErrorGroup));
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

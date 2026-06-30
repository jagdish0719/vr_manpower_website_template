/**
 * VR MANPOWER – Main JavaScript
 * Vanilla JS – No frameworks
 */

(function () {
  'use strict';

  const EMAILJS_PUBLIC_KEY = 'fUhKW-K1Vc-dEymE-';
  const EMAILJS_SERVICE_ID = 'service_4owhuvg';
  const EMAILJS_ADMIN_TEMPLATE = 'template_0kiie57';
  const EMAILJS_AUTOREPLY_TEMPLATE = 'template_riularn';
  const REVIEWS_STORAGE_KEY = 'vrmanpower_reviews';
  const MAX_REVIEWS = 15;
  const BROCHURE_PDF = 'assets/pdf/VR-Manpower-Brochure.pdf';

  let testimonialsSwiper = null;
  let emailjsInitialized = false;

  /* ---- Shared Form Validation ---- */
  const FORM_LIMITS = {
    name: { min: 2, max: 50 },
    company: { min: 2, max: 100 },
    message: { min: 10, max: 500 },
    review: { min: 10, max: 500 }
  };

  function normalizeSpaces(value) {
    return value.trim().replace(/\s{2,}/g, ' ');
  }

  function getFullNameValue(inputEl) {
    if (!inputEl) return '';
    return normalizeSpaces(inputEl.value);
  }

  function filterNameInput(value) {
    return value
      .replace(/[^A-Za-z.'\-\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .slice(0, FORM_LIMITS.name.max);
  }

  function filterCompanyInput(value) {
    return value
      .replace(/[^A-Za-z0-9\s&\-.,]/g, '')
      .replace(/\s{2,}/g, ' ')
      .slice(0, FORM_LIMITS.company.max);
  }

  function filterPhoneInput(value) {
    let digits = value.replace(/\D/g, '');
    if (digits.length > 10) {
      if (digits.startsWith('91') && digits.length >= 12) {
        digits = digits.slice(-10);
      } else {
        digits = digits.slice(0, 10);
      }
    }
    return digits;
  }

  function filterTextInput(value, maxLength) {
    return value.replace(/\s{2,}/g, ' ').slice(0, maxLength);
  }

  function validatePersonName(value, isReview) {
    const normalized = normalizeSpaces(value);
    if (!normalized || normalized.length < FORM_LIMITS.name.min) {
      return isReview ? 'Please enter your name.' : 'Please enter your full name.';
    }
    if (normalized.length > FORM_LIMITS.name.max || !/^[A-Za-z.'\-\s]+$/.test(normalized)) {
      return 'Only letters are allowed.';
    }
    if (!/[A-Za-z]/.test(normalized)) {
      return isReview ? 'Please enter your name.' : 'Please enter your full name.';
    }
    return true;
  }

  function validateCompanyName(value) {
    const normalized = normalizeSpaces(value);
    if (!normalized || normalized.length < FORM_LIMITS.company.min) {
      return 'Please enter your company name.';
    }
    if (normalized.length > FORM_LIMITS.company.max || !/^[A-Za-z0-9\s&\-.,]+$/.test(normalized)) {
      return 'Please enter your company name.';
    }
    if (!/[A-Za-z0-9]/.test(normalized)) {
      return 'Please enter your company name.';
    }
    return true;
  }

  function validateEmailAddress(value) {
    const email = value.trim();
    if (!email) return 'Enter a valid email address.';

    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(email)) return 'Enter a valid email address.';

    const [local, domain] = email.split('@');
    if (!local || !domain || !domain.includes('.')) return 'Enter a valid email address.';

    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) return 'Enter a valid email address.';

    return true;
  }

  function validatePhoneNumber(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 10) return 'Phone number must contain exactly 10 digits.';
    return true;
  }

  function validateRequiredSelect(value, message) {
    return value && value !== '' ? true : message;
  }

  function validateInquiryMessage(value) {
    const normalized = normalizeSpaces(value);
    if (!normalized) return 'Message must contain at least 10 characters.';
    if (normalized.length < FORM_LIMITS.message.min) return 'Message must contain at least 10 characters.';
    if (normalized.length > FORM_LIMITS.message.max) return 'Message must contain at most 500 characters.';
    return true;
  }

  function validateReviewText(value) {
    const normalized = normalizeSpaces(value);
    if (!normalized) return 'Review must contain at least 10 characters.';
    if (normalized.length < FORM_LIMITS.review.min) return 'Review must contain at least 10 characters.';
    if (normalized.length > FORM_LIMITS.review.max) return 'Review must contain at most 500 characters.';
    return true;
  }

  function showFieldError(field, message) {
    field.el.classList.add('error');
    field.error.textContent = message;
    field.el.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(field) {
    field.el.classList.remove('error');
    field.error.textContent = '';
    field.el.removeAttribute('aria-invalid');
  }

  function bindValidatedField(field, options) {
    const { filter, validate, normalizeOnBlur = false } = options;

    const applyFilter = (nextValue) => {
      field.el.value = filter ? filter(nextValue) : nextValue;
    };

    field.el.addEventListener('input', () => {
      applyFilter(field.el.value);
      const result = validate(field.el.value);
      if (result === true) clearFieldError(field);
      else if (field.el.classList.contains('error')) showFieldError(field, result);
    });

    field.el.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text') || '';
      const start = field.el.selectionStart ?? field.el.value.length;
      const end = field.el.selectionEnd ?? field.el.value.length;
      const combined = field.el.value.slice(0, start) + pasted + field.el.value.slice(end);
      applyFilter(combined);
      field.el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    field.el.addEventListener('blur', () => {
      if (normalizeOnBlur) {
        field.el.value = normalizeSpaces(field.el.value);
      }
      const result = validate(field.el.value);
      if (result !== true) showFieldError(field, result);
      else clearFieldError(field);
    });
  }

  function validateFormFields(fields) {
    let isValid = true;
    let firstInvalid = null;

    Object.values(fields).forEach(field => {
      const result = field.validate(field.el.value);
      if (result !== true) {
        showFieldError(field, result);
        isValid = false;
        if (!firstInvalid) firstInvalid = field.el;
      } else {
        clearFieldError(field);
      }
    });

    firstInvalid?.focus();
    return isValid;
  }

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initEmailJS();
    initAOS();
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initCounters();
    initParallax();
    initReviews();
    initFAQ();
    initBrochureModal();
    initInquiryForm();
    initLazyLoading();
    initActiveNavLink();
  }

  function initEmailJS() {
    if (emailjsInitialized || typeof emailjs === 'undefined') return;
    emailjs.init(EMAILJS_PUBLIC_KEY);
    emailjsInitialized = true;
    console.log('✓ EmailJS Initialized');
  }

  function initAOS() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 80,
        disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      });
    }
  }

  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const handleScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  function initMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    const links = document.querySelectorAll('.nav-link');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
      document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });

    links.forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        menu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('active')) {
        toggle.classList.remove('active');
        menu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
              link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );

    sections.forEach(section => observer.observe(section));
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const animateCounter = (el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const duration = 2000;
      const start = performance.now();

      const update = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target;
        }
      };

      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(counter => observer.observe(counter));
  }

  function initParallax() {
    const parallaxLayers = document.querySelectorAll('[data-parallax]');
    if (!parallaxLayers.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          parallaxLayers.forEach(layer => {
            const speed = parseFloat(layer.getAttribute('data-parallax')) || 0.3;
            layer.style.transform = `translateY(${scrollY * speed}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---- Reviews (LocalStorage + Swiper) ---- */
  function getDefaultReviews() {
    return [
      {
        id: 'default-1',
        name: 'Rajesh Kumar',
        review: 'VR Manpower has been our trusted partner for security and housekeeping for over two years. Their staff is professional, well-trained, and always punctual.',
        rating: 5,
        date: '2025-11-12'
      },
      {
        id: 'default-2',
        name: 'Priya Sharma',
        review: 'Quick deployment and excellent support. They understood our warehouse staffing needs and delivered a trained team within 48 hours.',
        rating: 5,
        date: '2025-10-28'
      },
      {
        id: 'default-3',
        name: 'Arun Menon',
        review: 'The facility management team from VR Manpower transformed our office operations. Highly recommend their customized workforce solutions.',
        rating: 5,
        date: '2025-09-15'
      },
      {
        id: 'default-4',
        name: 'Dr. Meera Iyer',
        review: 'Verified staff, 24/7 support, and client-centric approach — VR Manpower checks every box. Our hospital relies on them for housekeeping excellence.',
        rating: 5,
        date: '2025-08-20'
      }
    ];
  }

  function getStoredReviews() {
    try {
      const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveStoredReviews(reviews) {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  }

  function getAllReviews() {
    const stored = getStoredReviews();
    const defaults = getDefaultReviews();
    const combined = [...stored, ...defaults];
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    return combined.slice(0, MAX_REVIEWS);
  }

  function renderStars(rating) {
    const count = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    return Array.from({ length: 5 }, (_, i) =>
      `<i class="fas fa-star${i < count ? '' : ' star-empty'}" aria-hidden="true"></i>`
    ).join('');
  }

  function formatReviewDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  function renderReviews() {
    const wrapper = document.getElementById('reviewsSwiperWrapper');
    if (!wrapper) return;

    const reviews = getAllReviews();

    wrapper.innerHTML = reviews.map(review => `
      <div class="swiper-slide">
        <article class="testimonial-card">
          <div class="testimonial-card__stars" aria-label="${review.rating} out of 5 stars">
            ${renderStars(review.rating)}
          </div>
          <p class="testimonial-card__text">"${escapeHtml(review.review)}"</p>
          <div class="testimonial-card__author">
            <strong>${escapeHtml(review.name)}</strong>
            <span class="testimonial-card__date">${formatReviewDate(review.date)}</span>
          </div>
        </article>
      </div>
    `).join('');

    initTestimonialsSwiper();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function initTestimonialsSwiper() {
    if (typeof Swiper === 'undefined') return;

    if (testimonialsSwiper) {
      testimonialsSwiper.destroy(true, true);
      testimonialsSwiper = null;
    }

    testimonialsSwiper = new Swiper('.testimonials-swiper', {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: getAllReviews().length > 1,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      speed: 700,
      a11y: {
        enabled: true
      }
    });
  }

  function initReviews() {
    renderReviews();
    initReviewForm();
  }

  function initReviewForm() {
    const form = document.getElementById('reviewForm');
    if (!form) return;

    const fields = {
      reviewName: {
        el: document.getElementById('reviewName'),
        error: document.getElementById('reviewNameError'),
        validate: (v) => validatePersonName(v, true)
      },
      reviewRating: {
        el: document.getElementById('reviewRating'),
        error: document.getElementById('reviewRatingError'),
        validate: (v) => validateRequiredSelect(v, 'Please select a rating.')
      },
      reviewText: {
        el: document.getElementById('reviewText'),
        error: document.getElementById('reviewTextError'),
        validate: validateReviewText
      }
    };

    if (fields.reviewName.el) fields.reviewName.el.maxLength = FORM_LIMITS.name.max;
    if (fields.reviewText.el) fields.reviewText.el.maxLength = FORM_LIMITS.review.max;

    bindValidatedField(fields.reviewName, {
      filter: filterNameInput,
      validate: fields.reviewName.validate,
      normalizeOnBlur: true
    });

    bindValidatedField(fields.reviewText, {
      filter: (value) => filterTextInput(value, FORM_LIMITS.review.max),
      validate: validateReviewText,
      normalizeOnBlur: true
    });

    fields.reviewRating.el.addEventListener('change', () => {
      const result = fields.reviewRating.validate(fields.reviewRating.el.value);
      if (result === true) clearFieldError(fields.reviewRating);
      else showFieldError(fields.reviewRating, result);
    });

    fields.reviewRating.el.addEventListener('blur', () => {
      const result = fields.reviewRating.validate(fields.reviewRating.el.value);
      if (result !== true) showFieldError(fields.reviewRating, result);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateFormFields(fields)) return;

      const newReview = {
        id: `user-${Date.now()}`,
        name: normalizeSpaces(fields.reviewName.el.value),
        review: normalizeSpaces(fields.reviewText.el.value),
        rating: parseInt(fields.reviewRating.el.value, 10),
        date: new Date().toISOString().split('T')[0]
      };

      const stored = getStoredReviews();
      stored.unshift(newReview);
      saveStoredReviews(stored.slice(0, MAX_REVIEWS));

      form.reset();
      Object.values(fields).forEach(clearFieldError);
      renderReviews();

      const btn = document.getElementById('reviewSubmitBtn');
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '<span class="btn__text"><i class="fas fa-check" aria-hidden="true"></i> Review Submitted!</span>';
        btn.disabled = true;
        setTimeout(() => {
          btn.innerHTML = original;
          btn.disabled = false;
        }, 2500);
      }
    });
  }

  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq__item');

    faqItems.forEach(item => {
      const question = item.querySelector('.faq__question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        faqItems.forEach(other => {
          other.classList.remove('active');
          other.querySelector('.faq__question')?.setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
          item.classList.add('active');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initBrochureModal() {
    const modal = document.getElementById('brochureModal');
    const backdrop = document.getElementById('brochureModalBackdrop');
    const closeBtn = document.getElementById('brochureModalClose');
    const viewBtns = [document.getElementById('viewBrochureBtn'), document.getElementById('viewBrochureBtn2')];
    const downloadBtn = document.getElementById('downloadBrochureBtn');

    if (!modal) return;

    const openModal = () => {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn?.focus();
    };

    const closeModal = () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    viewBtns.forEach(btn => {
      if (btn) btn.addEventListener('click', openModal);
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    if (downloadBtn) {
      downloadBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
          const response = await fetch(BROCHURE_PDF);
          if (!response.ok) throw new Error('Brochure PDF not found');

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = 'VR-Manpower-Brochure.pdf';
          link.rel = 'noopener';
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(blobUrl);
        } catch (error) {
          console.error('Brochure download failed:', error);
          window.open(BROCHURE_PDF, '_blank', 'noopener,noreferrer');
        }
      });
    }
  }

  /* ---- Inquiry Form with EmailJS ---- */
  function initInquiryForm() {
    const form = document.getElementById('inquiryForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn?.querySelector('.btn__text');
    const btnLoading = submitBtn?.querySelector('.btn__loading');
    const btnSuccess = submitBtn?.querySelector('.btn__success');

    if (!form || !submitBtn) return;

    const fields = {
      fullName: {
        el: document.getElementById('fullName'),
        error: document.getElementById('fullNameError'),
        validate: (v) => validatePersonName(v, false)
      },
      company: {
        el: document.getElementById('company'),
        error: document.getElementById('companyError'),
        validate: validateCompanyName
      },
      email: {
        el: document.getElementById('email'),
        error: document.getElementById('emailError'),
        validate: validateEmailAddress
      },
      phone: {
        el: document.getElementById('phone'),
        error: document.getElementById('phoneError'),
        validate: validatePhoneNumber
      },
      service: {
        el: document.getElementById('service'),
        error: document.getElementById('serviceError'),
        validate: (v) => validateRequiredSelect(v, 'Please select a service.')
      },
      message: {
        el: document.getElementById('message'),
        error: document.getElementById('messageError'),
        validate: validateInquiryMessage
      }
    };

    if (fields.fullName.el) fields.fullName.el.maxLength = FORM_LIMITS.name.max;
    if (fields.company.el) fields.company.el.maxLength = FORM_LIMITS.company.max;
    if (fields.phone.el) {
      fields.phone.el.maxLength = 10;
      fields.phone.el.setAttribute('inputmode', 'numeric');
      fields.phone.el.setAttribute('autocomplete', 'tel-national');
    }
    if (fields.message.el) fields.message.el.maxLength = FORM_LIMITS.message.max;

    bindValidatedField(fields.fullName, {
      filter: filterNameInput,
      validate: fields.fullName.validate,
      normalizeOnBlur: true
    });

    bindValidatedField(fields.company, {
      filter: filterCompanyInput,
      validate: validateCompanyName,
      normalizeOnBlur: true
    });

    bindValidatedField(fields.email, {
      validate: validateEmailAddress
    });

    bindValidatedField(fields.phone, {
      filter: filterPhoneInput,
      validate: validatePhoneNumber
    });

    bindValidatedField(fields.message, {
      filter: (value) => filterTextInput(value, FORM_LIMITS.message.max),
      validate: validateInquiryMessage,
      normalizeOnBlur: true
    });

    fields.service.el.addEventListener('change', () => {
      const result = fields.service.validate(fields.service.el.value);
      if (result === true) clearFieldError(fields.service);
      else showFieldError(fields.service, result);
    });

    fields.service.el.addEventListener('blur', () => {
      const result = fields.service.validate(fields.service.el.value);
      if (result !== true) showFieldError(fields.service, result);
    });

    const setButtonState = (state) => {
      submitBtn.disabled = state === 'loading' || state === 'success';
      submitBtn.classList.toggle('is-loading', state === 'loading');
      submitBtn.classList.toggle('is-success', state === 'success');

      if (btnText) btnText.hidden = state !== 'idle';
      if (btnLoading) btnLoading.hidden = state !== 'loading';
      if (btnSuccess) btnSuccess.hidden = state !== 'success';
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateFormFields(fields)) return;

      if (typeof emailjs === 'undefined') {
        showErrorPopup('Email service is unavailable. Please call us directly.');
        return;
      }

      const fullName = getFullNameValue(fields.fullName.el);
      const company = normalizeSpaces(fields.company.el.value);
      const email = fields.email.el.value.trim();
      const phone = fields.phone.el.value.replace(/\D/g, '');
      const service = fields.service.el.value;
      const message = normalizeSpaces(fields.message.el.value);

      const templateParams = {
        name: fullName,
        fullName: fullName,
        full_name: fullName,
        to_name: fullName,
        from_name: fullName,
        company: company,
        email: email,
        phone: phone,
        service: service,
        message: message
      };

      console.log('Full Name:', fullName);
      console.log('Email Data:', templateParams);

      setButtonState('loading');

      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_ADMIN_TEMPLATE, templateParams);
        console.log('✓ Admin Email Sent');
      } catch (adminError) {
        console.error('✓ EmailJS Error', adminError);
        setButtonState('idle');
        showErrorPopup('Please try again. Your information has been preserved.');
        return;
      }

      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_AUTOREPLY_TEMPLATE, templateParams);
        console.log('✓ Customer Auto Reply Sent');
      } catch (autoReplyError) {
        console.error('✓ EmailJS Error', autoReplyError);
        setButtonState('idle');
        showErrorPopup('Please try again. Your information has been preserved.');
        return;
      }

      setButtonState('success');
      showSuccessPopup();
      form.reset();
      Object.values(fields).forEach(clearFieldError);

      setTimeout(() => {
        setButtonState('idle');
      }, 2500);
    });

    initPopups();
  }

  function initPopups() {
    setupPopup('successPopup', 'successPopupClose', 'successPopupBackdrop');
    setupPopup('errorPopup', 'errorPopupClose', 'errorPopupBackdrop');
  }

  function setupPopup(popupId, closeId, backdropId) {
    const popup = document.getElementById(popupId);
    const closeBtn = document.getElementById(closeId);
    const backdrop = document.getElementById(backdropId);

    if (!popup) return;

    const hide = () => {
      popup.classList.remove('active');
      popup.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    closeBtn?.addEventListener('click', hide);
    backdrop?.addEventListener('click', hide);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('active')) {
        hide();
      }
    });
  }

  function showSuccessPopup() {
    const popup = document.getElementById('successPopup');
    if (!popup) return;
    popup.classList.add('active');
    popup.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('successPopupClose')?.focus();
  }

  function showErrorPopup(message) {
    const popup = document.getElementById('errorPopup');
    const msgEl = document.getElementById('errorPopupMessage');
    if (!popup) return;
    if (msgEl && message) msgEl.textContent = message;
    popup.classList.add('active');
    popup.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('errorPopupClose')?.focus();
  }

  function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        });
      }, { rootMargin: '100px' });

      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }
})();

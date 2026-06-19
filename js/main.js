/**
 * VR MANPOWER – Main JavaScript
 * Vanilla JS – No frameworks
 */

(function () {
  'use strict';

  /* ---- DOM Ready ---- */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initAOS();
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initCounters();
    initParallax();
    initTestimonialsSwiper();
    initFAQ();
    initBrochureModal();
    initInquiryForm();
    initLazyLoading();
    initActiveNavLink();
  }

  /* ---- AOS Animation Library ---- */
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

  /* ---- Navbar Scroll Effect ---- */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /* ---- Mobile Menu ---- */
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

  /* ---- Smooth Scrolling ---- */
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

  /* ---- Active Nav Link on Scroll ---- */
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

  /* ---- Animated Counters ---- */
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

  /* ---- Parallax Effect ---- */
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

  /* ---- Testimonials Swiper ---- */
  function initTestimonialsSwiper() {
    if (typeof Swiper === 'undefined') return;

    new Swiper('.testimonials-swiper', {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      effect: 'slide',
      speed: 700
    });
  }

  /* ---- FAQ Accordion ---- */
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

  /* ---- Brochure Modal ---- */
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
      downloadBtn.addEventListener('click', (e) => {
        const pdfPath = downloadBtn.getAttribute('href');
        fetch(pdfPath, { method: 'HEAD' })
          .then(res => {
            if (!res.ok) {
              e.preventDefault();
              const imgPath = 'assets/images/VR MANPOWER BROCHURE.jpeg';
              const link = document.createElement('a');
              link.href = imgPath;
              link.download = 'VR-MANPOWER-Brochure.jpeg';
              link.click();
            }
          })
          .catch(() => {
            e.preventDefault();
            const imgPath = 'assets/images/VR MANPOWER BROCHURE.jpeg';
            const link = document.createElement('a');
            link.href = imgPath;
            link.download = 'VR-MANPOWER-Brochure.jpeg';
            link.click();
          });
      });
    }
  }

  /* ---- Inquiry Form Validation ---- */
  function initInquiryForm() {
    const form = document.getElementById('inquiryForm');
    const popup = document.getElementById('successPopup');
    const popupClose = document.getElementById('successPopupClose');
    const popupBackdrop = document.getElementById('successPopupBackdrop');

    if (!form) return;

    const fields = {
      name: {
        el: document.getElementById('name'),
        error: document.getElementById('nameError'),
        validate: (v) => v.trim().length >= 2 || 'Please enter your full name'
      },
      company: {
        el: document.getElementById('company'),
        error: document.getElementById('companyError'),
        validate: (v) => v.trim().length >= 2 || 'Please enter your company name'
      },
      email: {
        el: document.getElementById('email'),
        error: document.getElementById('emailError'),
        validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address'
      },
      phone: {
        el: document.getElementById('phone'),
        error: document.getElementById('phoneError'),
        validate: (v) => /^[\d\s+\-()]{10,}$/.test(v.trim()) || 'Please enter a valid phone number'
      },
      service: {
        el: document.getElementById('service'),
        error: document.getElementById('serviceError'),
        validate: (v) => v !== '' || 'Please select a service'
      },
      message: {
        el: document.getElementById('message'),
        error: document.getElementById('messageError'),
        validate: (v) => v.trim().length >= 10 || 'Please enter a message (min 10 characters)'
      }
    };

    const showError = (field, message) => {
      field.el.classList.add('error');
      field.error.textContent = message;
    };

    const clearError = (field) => {
      field.el.classList.remove('error');
      field.error.textContent = '';
    };

    Object.values(fields).forEach(field => {
      field.el.addEventListener('input', () => {
        const result = field.validate(field.el.value);
        if (result === true) clearError(field);
      });

      field.el.addEventListener('blur', () => {
        const result = field.validate(field.el.value);
        if (result !== true) showError(field, result);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      Object.values(fields).forEach(field => {
        const result = field.validate(field.el.value);
        if (result !== true) {
          showError(field, result);
          isValid = false;
        } else {
          clearError(field);
        }
      });

      if (!isValid) {
        const firstError = form.querySelector('.error');
        if (firstError) firstError.focus();
        return;
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const subject = encodeURIComponent(`VR Manpower Inquiry – ${data.service}`);
      const body = encodeURIComponent(
        `Name: ${data.name}\nCompany: ${data.company}\nEmail: ${data.email}\nPhone: ${data.phone}\nService: ${data.service}\n\nMessage:\n${data.message}`
      );

      window.location.href = `mailto:connecttovrmanpower@gmail.com?subject=${subject}&body=${body}`;

      showSuccessPopup();
      form.reset();
    });

    function showSuccessPopup() {
      if (!popup) return;
      popup.classList.add('active');
      popup.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function hideSuccessPopup() {
      if (!popup) return;
      popup.classList.remove('active');
      popup.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (popupClose) popupClose.addEventListener('click', hideSuccessPopup);
    if (popupBackdrop) popupBackdrop.addEventListener('click', hideSuccessPopup);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup?.classList.contains('active')) {
        hideSuccessPopup();
      }
    });
  }

  /* ---- Lazy Loading Enhancement ---- */
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

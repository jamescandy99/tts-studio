/* ===================================================
   AETHER MOTORS — Premium EV Homepage Scripts
   Micro-interactions, animations & mobile menu
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- HEADER SCROLL EFFECT ---------- */
  const header = document.getElementById('header');
  let lastScroll = 0;

  const handleScroll = () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 60) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    lastScroll = currentScroll;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  /* ---------- MOBILE MENU ---------- */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = mobileMenu.querySelectorAll('a');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  /* ---------- MOBILE STICKY CTA ---------- */
  const mobileCta = document.getElementById('mobileCta');

  const handleMobileCtaVisibility = () => {
    if (window.innerWidth <= 768) {
      if (window.scrollY > 400) {
        mobileCta.classList.add('visible');
      } else {
        mobileCta.classList.remove('visible');
      }
    }
  };

  window.addEventListener('scroll', handleMobileCtaVisibility, { passive: true });

  /* ---------- REVEAL ON SCROLL (Intersection Observer) ---------- */
  const revealElements = document.querySelectorAll('.reveal-up');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ---------- FAQ ACCORDION ---------- */
  const faqItems = document.querySelectorAll('.faq__item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq__question');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      faqItems.forEach(i => i.classList.remove('active'));
      faqItems.forEach(i => i.querySelector('.faq__question').setAttribute('aria-expanded', 'false'));

      if (!isActive) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- SMOOTH SCROLL FOR ANCHOR LINKS ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ---------- HERO PARTICLES ---------- */
  const particleContainer = document.getElementById('heroParticles');
  const particleCount = 30;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = 60 + Math.random() * 40 + '%';
    particle.style.animationDuration = 4 + Math.random() * 8 + 's';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.width = 1 + Math.random() * 2 + 'px';
    particle.style.height = particle.style.width;
    particleContainer.appendChild(particle);
  }

  /* ---------- COUNTER ANIMATION FOR TRUST STATS ---------- */
  const animateValue = (el, start, end, duration, suffix = '') => {
    const startTime = performance.now();
    const step = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * eased);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  /* ---------- MODEL CARD TILT EFFECT ---------- */
  const modelCards = document.querySelectorAll('.models__card');

  modelCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      card.style.transform = `translateY(-4px) perspective(1000px) rotateX(${y * -3}deg) rotateY(${x * 3}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ---------- BENEFITS CARD GLOW FOLLOW ---------- */
  const benefitCards = document.querySelectorAll('.benefits__card');

  benefitCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.background = `radial-gradient(circle 200px at ${x}px ${y}px, rgba(0, 229, 204, 0.04), var(--color-bg-card))`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });

  /* ---------- CTA BUTTON RIPPLE EFFECT ---------- */
  document.querySelectorAll('.btn--primary').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple-effect 0.6s ease-out forwards;
        pointer-events: none;
      `;

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple-effect {
      to { transform: scale(2.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

});

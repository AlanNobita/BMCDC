/* ═══════════════════════════════════════════════════════════
   BMSC DEBATE CLUB — JAVASCRIPT
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── NAVBAR SCROLL EFFECT ────────────────────────────── */
  const navbar = document.getElementById('navbar');

  function onScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─── HAMBURGER MENU ──────────────────────────────────── */
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks  = document.getElementById('nav-links');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.style.display === 'flex';
      navLinks.style.display = isOpen ? '' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'fixed';
      navLinks.style.top = '70px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = 'rgba(8,15,34,0.97)';
      navLinks.style.backdropFilter = 'blur(16px)';
      navLinks.style.padding = '24px 32px';
      navLinks.style.gap = '8px';
      navLinks.style.zIndex = '999';
      if (!isOpen) {
        navLinks.querySelectorAll('.nav-link').forEach(l => {
          l.style.color = '#fff';
        });
      } else {
        navLinks.style.display = 'none';
      }
    });
  }

  /* ─── COUNTER ANIMATION ───────────────────────────────── */
  function animateCounter(el, target, duration) {
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.round(easeOut(progress) * target);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  let countersStarted = false;
  const statNums = document.querySelectorAll('.stat-num[data-target]');

  function checkCounters() {
    if (countersStarted) return;
    const hero = document.querySelector('.hero-stats');
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    if (rect.top < window.innerHeight - 50) {
      countersStarted = true;
      statNums.forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target, 1800);
      });
    }
  }
  window.addEventListener('scroll', checkCounters, { passive: true });
  setTimeout(checkCounters, 600); // trigger after hero renders

  /* ─── SCROLL REVEAL ───────────────────────────────────── */
  const revealEls = document.querySelectorAll(
    '.pillar-card, .event-card, .achievement-item, .team-card, .about-text, .about-pillars, .join-inner'
  );

  revealEls.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger sibling cards
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, idx * 90);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  revealEls.forEach(el => observer.observe(el));

  /* ─── SMOOTH ANCHOR SCROLL ────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        // Close mobile menu if open
        if (navLinks && navLinks.style.display === 'flex') {
          navLinks.style.display = 'none';
        }
      }
    });
  });

  /* ─── ACTIVE NAV LINK HIGHLIGHT ──────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    navLinkEls.forEach(link => {
      link.style.fontWeight = link.getAttribute('href') === `#${current}` ? '700' : '';
    });
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });

  /* ─── PILLAR CARD TILT ────────────────────────────────── */
  document.querySelectorAll('.pillar-card, .event-card, .team-card').forEach(card => {
    card.addEventListener('mousemove', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;
      this.style.transform = `translateY(-6px) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });
  });

})();

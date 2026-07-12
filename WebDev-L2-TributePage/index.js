// Gentle reveal-on-scroll for the timeline and admire cards.
// Respects users who prefer reduced motion.

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Radium badge: tap/click to reveal the fact (hover already works via CSS) ---
  const elementCard = document.getElementById('elementCard');
  const elementFact = document.getElementById('elementFact');
  if (elementCard && elementFact) {
    elementCard.addEventListener('click', () => {
      const isVisible = elementFact.classList.toggle('is-visible');
      elementCard.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (!elementCard.contains(e.target)) {
        elementFact.classList.remove('is-visible');
        elementCard.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --- Back to top button ---
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 700);
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // --- Scroll progress bar ---
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      progressBar.style.width = pct + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  // --- Section dot-nav: highlights the section currently in view ---
  const dots = document.querySelectorAll('.dot-nav__dot');
  const sections = Array.from(dots)
    .map(dot => document.getElementById(dot.dataset.section))
    .filter(Boolean);

  if (dots.length && sections.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const dot = document.querySelector(`.dot-nav__dot[data-section="${entry.target.id}"]`);
        if (!dot) return;
        if (entry.isIntersecting) {
          dots.forEach(d => d.classList.remove('is-active'));
          dot.classList.add('is-active');
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(section => sectionObserver.observe(section));
  }

  // --- Gallery lightbox ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const galleryButtons = document.querySelectorAll('.gallery-figure__btn');

  const openLightbox = (src, alt) => {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.hidden = false;
    lightboxClose.focus();
    document.body.style.overflow = 'hidden';
  };
  const closeLightbox = () => {
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';
  };

  galleryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      openLightbox(btn.dataset.full, img ? img.alt : '');
    });
  });
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
  });

  // --- Gentle reveal-on-scroll for cards, timeline items, and photos ---
  const targets = document.querySelectorAll(
    '.admire-item, .timeline-item, .gallery-figure'
  );

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.style.opacity = 1);
    return;
  }

  targets.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(el => observer.observe(el));
});

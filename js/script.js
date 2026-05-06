/* ============================================
   MSA SERVICES - JavaScript principal
   ============================================ */

/* ===========================================================
   PAGE TRANSITIONS — initialisé immédiatement (avant DOMContentLoaded)
   pour gérer correctement l'apparition au chargement.
   =========================================================== */
(function initPageTransitions() {
  const TRANSITION_DURATION = 800;   // durée du slide-in (ms)
  const EXIT_DURATION = 850;         // durée du slide-out (ms)
  const STORAGE_KEY = 'msa-page-transition';

  // Création de l'overlay
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  overlay.setAttribute('data-state', 'hidden');
  overlay.innerHTML = `
    <div class="transition-content">
      <div class="transition-logo">
        <span>M</span><span>S</span><span>A</span>
      </div>
      <div class="transition-tagline">Services</div>
      <div class="transition-bars">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
  `;

  // Création de la barre de progression
  const progress = document.createElement('div');
  progress.className = 'page-progress';

  // Insertion dès que le body est dispo
  function injectElements() {
    if (!document.body) return;
    document.body.appendChild(overlay);
    document.body.appendChild(progress);

    // Si on vient d'une navigation interne, l'overlay est déjà visible : on le sort
    if (sessionStorage.getItem(STORAGE_KEY) === 'pending') {
      sessionStorage.removeItem(STORAGE_KEY);

      // L'overlay commence en position "visible" (sans animation)
      overlay.setAttribute('data-state', 'visible');

      // Démarre l'entrée animée du contenu
      document.body.classList.add('page-entering');

      // Après un court délai, on sort l'overlay vers le haut
      setTimeout(() => {
        overlay.setAttribute('data-state', 'exiting');
      }, 200);

      // On nettoie après l'animation
      setTimeout(() => {
        overlay.setAttribute('data-state', 'hidden');
        document.body.classList.remove('page-entering');
      }, EXIT_DURATION + 250);
    } else {
      // Première visite : on déclenche juste l'entrée animée
      document.body.classList.add('page-entering');
      setTimeout(() => {
        document.body.classList.remove('page-entering');
      }, 1500);
    }
  }

  if (document.body) {
    injectElements();
  } else {
    document.addEventListener('DOMContentLoaded', injectElements);
  }

  // Gestion du clic sur les liens internes
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Ignorer les liens spéciaux
    if (
      href.startsWith('#') ||
      href.startsWith('tel:') ||
      href.startsWith('mailto:') ||
      href.startsWith('javascript:') ||
      link.target === '_blank' ||
      link.hasAttribute('download')
    ) return;

    // Ignorer les URLs externes
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
    } catch (err) { /* lien relatif - on continue */ }

    // On ne fait la transition que sur les pages HTML
    const isPageLink =
      href.endsWith('.html') ||
      href === '/' ||
      (!href.includes('.') && !href.startsWith('?'));

    if (!isPageLink) return;

    // Lancement de la transition de sortie
    e.preventDefault();
    sessionStorage.setItem(STORAGE_KEY, 'pending');
    overlay.setAttribute('data-state', 'visible');
    progress.classList.add('active');

    setTimeout(() => {
      window.location.href = href;
    }, TRANSITION_DURATION);
  });

  // Gestion du retour navigateur (back/forward)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      overlay.setAttribute('data-state', 'hidden');
      progress.classList.remove('active');
      document.body.classList.remove('page-entering');
    }
  });
})();


/* ===========================================================
   FONCTIONS PRINCIPALES (exécutées au DOMContentLoaded)
   =========================================================== */
document.addEventListener('DOMContentLoaded', () => {

  // ===== Navbar scroll =====
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    });
  }

  // ===== Mobile menu =====
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });
    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-times');
        }
      });
    });
  }

  // ===== Counter animation =====
  function animateCounter(el) {
    if (el.dataset.done) return;
    const target = parseInt(el.dataset.count, 10);
    const duration = 2000;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);
      el.textContent = current.toLocaleString('fr-FR');
      if (progress < 1) requestAnimationFrame(tick);
      else { el.textContent = target.toLocaleString('fr-FR'); el.dataset.done = 'true'; }
    }
    requestAnimationFrame(tick);
  }

  // ===== Scroll reveal + counters =====
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        entry.target.querySelectorAll('[data-count]').forEach(animateCounter);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Compteurs hors .reveal (ex : hero)
  document.querySelectorAll('[data-count]').forEach(el => {
    if (!el.closest('.reveal')) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            obs.unobserve(e.target);
          }
        });
      });
      obs.observe(el);
    }
  });

  // ===== FAQ accordion =====
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-question');
    if (q) {
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    }
  });

  // ===== Gallery filters =====
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      galleryItems.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = 'block';
          setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'scale(1)'; }, 50);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.9)';
          setTimeout(() => { item.style.display = 'none'; }, 300);
        }
      });
    });
  });

  // ===== Form submission (demo) =====
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type=submit]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Message envoyé !';
        btn.style.background = 'linear-gradient(135deg, #4ca03e, #3d8a30)';
        contactForm.reset();
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }, 1500);
    });
  }

  // ===== Newsletter (demo) =====
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      alert(`Merci ! ${input.value} a été ajouté à notre newsletter.`);
      input.value = '';
    });
  }

  // ===== Set active nav link =====
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
  });
});

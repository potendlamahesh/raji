/* ════════════════════════════════════════════════════════
   Rajeswari Ramanaboina — Portfolio
   script.js

   Modules:
     1. Navigation (sticky state, mobile drawer, active link)
     2. Scroll progress bar
     3. Scroll reveal (IntersectionObserver)
     4. 3D card tilt (pointer-driven, desktop only)
     5. Hero parallax (portrait tilt + floating badges)
     6. Three.js hero scene
     7. Contact form (mailto handoff — no backend)
     8. Footer year

   NOTE: This file never touches the mouse cursor. There is no
   custom cursor, no cursor-following element, and no CSS
   `cursor` override — the visitor's normal OS arrow is used.
   ════════════════════════════════════════════════════════ */

'use strict';

/* Shared environment flags, read once. */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice        = window.matchMedia('(hover: none)').matches;
const isSmallScreen        = () => window.innerWidth < 900;


/* ────────────────────────────────────────────────────────
   1. NAVIGATION
   ──────────────────────────────────────────────────────── */
const navigation = (() => {
  const header    = document.querySelector('header');
  const burger    = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  const overlay   = document.getElementById('mobileOverlay');
  const navLinks  = document.querySelectorAll('.nav-list a');
  const sections  = document.querySelectorAll('section[id]');

  function openDrawer() {
    mobileNav.classList.add('is-open');
    overlay.classList.add('is-open');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
  }

  function closeDrawer() {
    mobileNav.classList.remove('is-open');
    overlay.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }

  function toggleDrawer() {
    mobileNav.classList.contains('is-open') ? closeDrawer() : openDrawer();
  }

  /* Highlight the nav link for whichever section is in view. */
  function updateActiveLink() {
    const y = window.scrollY + 140;
    let current = '';

    sections.forEach(section => {
      if (y >= section.offsetTop) current = section.id;
    });

    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`);
    });
  }

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
    updateActiveLink();
  }

  function init() {
    burger.addEventListener('click', toggleDrawer);
    overlay.addEventListener('click', closeDrawer);
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

    /* Escape closes the drawer. */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) closeDrawer();
    });

    /* Close the drawer if the viewport grows past the mobile breakpoint. */
    window.addEventListener('resize', () => {
      if (!isSmallScreen()) closeDrawer();
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  return { init };
})();


/* ────────────────────────────────────────────────────────
   2. SCROLL PROGRESS BAR
   ──────────────────────────────────────────────────────── */
const scrollProgress = (() => {
  const bar = document.getElementById('progressBar');
  let ticking = false;

  function render() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = `${Math.min(pct, 100)}%`;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(render);
      ticking = true;
    }
  }

  function init() {
    window.addEventListener('scroll', onScroll, { passive: true });
    render();
  }

  return { init };
})();


/* ────────────────────────────────────────────────────────
   3. SCROLL REVEAL
   Elements with .reveal fade + slide in once, then unobserve.
   ──────────────────────────────────────────────────────── */
const scrollReveal = (() => {
  function init() {
    const items = document.querySelectorAll('.reveal');

    /* No IntersectionObserver, or reduced motion: show everything now. */
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    /* Stagger siblings inside a grid so they cascade rather than pop. */
    items.forEach(el => {
      const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
      const index = siblings.indexOf(el);
      if (index > 0) el.style.transitionDelay = `${Math.min(index * 70, 350)}ms`;
      observer.observe(el);
    });
  }

  return { init };
})();


/* ────────────────────────────────────────────────────────
   4. 3D CARD TILT
   Pointer position maps to a small rotateX/rotateY. Skipped on
   touch devices and when reduced motion is requested.
   ──────────────────────────────────────────────────────── */
const cardTilt = (() => {
  const MAX_TILT = 7;   // degrees
  const LIFT     = 8;   // px

  function attach(card) {
    let frame = null;

    function onMove(e) {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const px   = (e.clientX - rect.left) / rect.width;   // 0 → 1
        const py   = (e.clientY - rect.top)  / rect.height;  // 0 → 1

        const rotateY = (px - 0.5) *  2 * MAX_TILT;
        const rotateX = (py - 0.5) * -2 * MAX_TILT;

        card.style.transform =
          `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-${LIFT}px)`;
        frame = null;
      });
    }

    function onLeave() {
      if (frame) { window.cancelAnimationFrame(frame); frame = null; }
      card.style.transform = '';
    }

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  }

  function init() {
    if (isTouchDevice || prefersReducedMotion) return;
    document.querySelectorAll('.project-card, .skill-panel, .cert-card, .tilt-card')
      .forEach(attach);
  }

  return { init };
})();


/* ────────────────────────────────────────────────────────
   5. HERO PARALLAX
   The credential badges and portrait react to the pointer.
   Badges use CSS custom props so the bob keyframe still runs.
   ──────────────────────────────────────────────────────── */
const heroParallax = (() => {
  function init() {
    if (isTouchDevice || prefersReducedMotion) return;

    const badges = document.querySelectorAll('.float-badge');
    const photo  = document.querySelector('.pf-photo');
    if (!badges.length) return;

    let frame = null;

    window.addEventListener('mousemove', e => {
      if (frame || isSmallScreen()) return;

      frame = window.requestAnimationFrame(() => {
        const dx = (e.clientX / window.innerWidth  - 0.5) * 2;  // -1 → 1
        const dy = (e.clientY / window.innerHeight - 0.5) * 2;

        /* Badges drift at their own depth. The bob animation lives on a
           parent-free element, so we set translate only and let the CSS
           keyframe run on top via a wrapper-free composite. */
        badges.forEach(badge => {
          const depth = parseFloat(badge.dataset.depth) || 0.06;
          badge.style.setProperty('--px', `${(dx * depth * 100).toFixed(1)}px`);
          badge.style.setProperty('--py', `${(dy * depth * 100).toFixed(1)}px`);
        });

        /* The portrait tilts a few degrees toward the pointer. */
        if (photo) {
          photo.style.transform =
            `perspective(1000px) rotateY(${(dx * 4).toFixed(2)}deg) rotateX(${(-dy * 4).toFixed(2)}deg)`;
        }

        frame = null;
      });
    }, { passive: true });
  }

  return { init };
})();


/* ────────────────────────────────────────────────────────
   6. THREE.JS HERO SCENE
   A slowly rotating wireframe icosahedron plus a field of
   drifting particles, in soft pink over the white page.
   Rendering pauses when the hero scrolls out of view.
   ──────────────────────────────────────────────────────── */
const heroScene = (() => {
  const PINK_SOFT   = 0xffbcd2;
  const PINK_MID    = 0xf2649a;
  const PINK_DEEP   = 0xd94a80;

  let renderer, scene, camera;
  let shell, core, particles;
  let animationId = null;
  let isVisible = true;
  let pointer = { x: 0, y: 0 };

  /* Particle count scales down on small screens for performance. */
  function particleCount() {
    if (window.innerWidth < 600)  return 120;
    if (window.innerWidth < 1100) return 220;
    return 340;
  }

  function buildParticles() {
    const count     = particleCount();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 6 + Math.random() * 9;
      const theta  = Math.random() * Math.PI * 2;
      const phi    = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: PINK_MID,
      size: 0.075,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
  }

  function build() {
    const canvas = document.getElementById('heroCanvas');

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,          // keep the white page visible behind the scene
      antialias: window.devicePixelRatio < 2
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 15;

    /* Outer wireframe shell — the main hero object. */
    shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4.4, 1),
      new THREE.MeshBasicMaterial({
        color: PINK_MID,
        wireframe: true,
        transparent: true,
        opacity: 0.30
      })
    );
    scene.add(shell);

    /* Inner solid core — soft, low-opacity fill for depth. */
    core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.6, 0),
      new THREE.MeshBasicMaterial({
        color: PINK_SOFT,
        transparent: true,
        opacity: 0.16
      })
    );
    scene.add(core);

    /* A second, larger wireframe rotating the other way. */
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(7.2, 0.02, 8, 90),
      new THREE.MeshBasicMaterial({
        color: PINK_DEEP,
        transparent: true,
        opacity: 0.20
      })
    );
    halo.rotation.x = Math.PI / 2.6;
    scene.add(halo);
    shell.userData.halo = halo;

    particles = buildParticles();
    scene.add(particles);

    /* Push the whole scene to the right so it sits behind the hero visual. */
    scene.position.x = 4.5;
  }

  function onResize() {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    /* Centre the scene on narrow screens where the hero stacks. */
    scene.position.x = isSmallScreen() ? 0 : 4.5;
  }

  function onPointerMove(e) {
    pointer.x = (e.clientX / window.innerWidth  - 0.5) * 0.6;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 0.6;
  }

  function tick() {
    animationId = window.requestAnimationFrame(tick);
    if (!isVisible) return;

    const t = performance.now() * 0.00013;

    shell.rotation.x = t * 1.6;
    shell.rotation.y = t * 2.2;

    core.rotation.x  = -t * 2.4;
    core.rotation.y  = -t * 1.8;

    shell.userData.halo.rotation.z = t * 3.2;

    particles.rotation.y = t * 1.1;
    particles.rotation.x = t * 0.5;

    /* Camera eases toward the pointer for a gentle parallax. */
    camera.position.x += (pointer.x * 2.2 - camera.position.x) * 0.04;
    camera.position.y += (-pointer.y * 2.2 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  function watchVisibility() {
    const hero = document.querySelector('.hero');
    if (!('IntersectionObserver' in window) || !hero) return;

    /* Stop rendering once the hero is fully scrolled past. */
    new IntersectionObserver(entries => {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0 }).observe(hero);

    /* Also stop when the tab is hidden. */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isVisible = false;
      } else {
        isVisible = true;
      }
    });
  }

  function init() {
    /* Bail out cleanly if Three.js failed to load or WebGL is unavailable. */
    if (typeof THREE === 'undefined') return;
    if (prefersReducedMotion) return;

    try {
      build();
    } catch (err) {
      /* No WebGL — the page still works, just without the 3D layer. */
      console.warn('Hero scene unavailable:', err.message);
      return;
    }

    window.addEventListener('resize', onResize, { passive: true });
    if (!isTouchDevice) {
      window.addEventListener('mousemove', onPointerMove, { passive: true });
    }

    watchVisibility();
    onResize();
    tick();
  }

  return { init };
})();


/* ────────────────────────────────────────────────────────
   7. CONTACT FORM
   There is no backend. Submitting composes a mailto: link and
   hands off to the visitor's own email client. See README for
   how to swap this for Formspree.
   ──────────────────────────────────────────────────────── */
const contactForm = (() => {
  const RECIPIENT = 'rajeswariramanaboina@gmail.com';

  function init() {
    const form   = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();

      const name    = form.name.value.trim();
      const email   = form.email.value.trim();
      const subject = form.subject.value.trim() || 'Portfolio enquiry';
      const message = form.message.value.trim();

      if (!name) {
        status.textContent = 'Please enter your name.';
        form.name.focus();
        return;
      }
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        status.textContent = 'Please enter a valid email address.';
        form.email.focus();
        return;
      }

      const body = [
        'Hi Rajeswari,',
        '',
        `My name is ${name} (${email}).`,
        '',
        message || '(No message provided)',
        '',
        'Best regards,',
        name
      ].join('\n');

      window.location.href =
        `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      status.textContent = 'Opening your email app…';
      window.setTimeout(() => { status.textContent = ''; }, 5000);
    });
  }

  return { init };
})();


/* ────────────────────────────────────────────────────────
   8. FOOTER YEAR
   ──────────────────────────────────────────────────────── */
function setFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}


/* ────────────────────────────────────────────────────────
   BOOT
   ──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  navigation.init();
  scrollProgress.init();
  scrollReveal.init();
  cardTilt.init();
  heroParallax.init();
  heroScene.init();
  contactForm.init();
  setFooterYear();
});

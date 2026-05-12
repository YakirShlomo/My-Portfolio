/* =================================================================
   Yakir Shlomo — Portfolio · interactions
   ================================================================= */
(function () {
    'use strict';

    const root = document.documentElement;
    root.classList.add('js');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;

    /* ---------------------------------------------------------------
       Lenis — smooth scrolling
       --------------------------------------------------------------- */
    let lenis = null;
    if (!prefersReducedMotion && typeof window.Lenis !== 'undefined') {
        lenis = new window.Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.6,
        });
        const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
    }

    function scrollTo(target, offset) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) return;
        const off = offset != null ? offset : 0;
        if (lenis) {
            lenis.scrollTo(el, { offset: off });
        } else {
            const top = el.getBoundingClientRect().top + window.pageYOffset + off;
            window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }
    }

    function lockScroll(lock) {
        if (lenis) { lock ? lenis.stop() : lenis.start(); }
        document.body.style.overflow = lock ? 'hidden' : '';
    }

    /* ---------------------------------------------------------------
       Anchor links
       --------------------------------------------------------------- */
    document.querySelectorAll('[data-scroll-link], a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#' || !href.startsWith('#')) return;
            const target = document.getElementById(href.slice(1));
            if (!target) return;
            e.preventDefault();
            closeMobileNav();
            scrollTo(target, 0);
            history.replaceState(null, '', href);
        });
    });

    /* ---------------------------------------------------------------
       Navbar — scrolled state
       --------------------------------------------------------------- */
    const navbar = document.getElementById('navbar');
    function onScroll() {
        navbar.classList.toggle('is-scrolled', window.scrollY > 24);
        if (!supportsScrollTimeline) updateProgress();
    }
    const supportsScrollTimeline = CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
    window.addEventListener('scroll', onScroll, { passive: true });
    if (lenis) lenis.on('scroll', onScroll);
    onScroll();

    /* ---------------------------------------------------------------
       Scroll progress bar (fallback when CSS scroll-timeline absent)
       --------------------------------------------------------------- */
    function updateProgress() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        root.style.setProperty('--scroll-progress', p.toFixed(4));
    }
    if (!supportsScrollTimeline) updateProgress();

    /* ---------------------------------------------------------------
       Mobile navigation
       --------------------------------------------------------------- */
    const navToggle = document.getElementById('nav-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const navScrim = document.getElementById('nav-scrim');

    function openMobileNav() {
        mobileNav.classList.add('is-open');
        navScrim.classList.add('is-open');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', 'Close menu');
        mobileNav.setAttribute('aria-hidden', 'false');
        lockScroll(true);
    }
    function closeMobileNav() {
        if (!mobileNav.classList.contains('is-open')) return;
        mobileNav.classList.remove('is-open');
        navScrim.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
        mobileNav.setAttribute('aria-hidden', 'true');
        lockScroll(false);
    }
    navToggle.addEventListener('click', () => {
        mobileNav.classList.contains('is-open') ? closeMobileNav() : openMobileNav();
    });
    navScrim.addEventListener('click', closeMobileNav);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileNav(); });

    /* ---------------------------------------------------------------
       Scroll-spy — active nav link
       --------------------------------------------------------------- */
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    function setActiveLink(id) {
        navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + id));
    }
    if ('IntersectionObserver' in window && sections.length) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => { if (entry.isIntersecting) setActiveLink(entry.target.id); });
        }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
        sections.forEach((s) => spy.observe(s));
    }

    /* ---------------------------------------------------------------
       Reveal on scroll
       --------------------------------------------------------------- */
    // assign stagger indices
    document.querySelectorAll('[data-reveal-children]').forEach((container) => {
        Array.from(container.children).forEach((child, i) => child.style.setProperty('--si', i));
    });

    const revealTargets = document.querySelectorAll('[data-reveal], [data-reveal-children]');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
        revealTargets.forEach((t) => revealObserver.observe(t));
    } else {
        revealTargets.forEach((t) => t.classList.add('is-visible'));
    }

    /* ---------------------------------------------------------------
       Hero entrance
       --------------------------------------------------------------- */
    window.addEventListener('load', () => {
        requestAnimationFrame(() => document.body.classList.add('is-loaded'));
    });
    // safety: ensure it fires even if 'load' already passed
    if (document.readyState === 'complete') document.body.classList.add('is-loaded');

    /* ---------------------------------------------------------------
       Magnetic buttons
       --------------------------------------------------------------- */
    if (!prefersReducedMotion && !isTouch) {
        document.querySelectorAll('[data-magnetic]').forEach((el) => {
            const strength = 0.32;
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - (r.left + r.width / 2)) * strength;
                const y = (e.clientY - (r.top + r.height / 2)) * strength;
                el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
            });
            el.addEventListener('pointerleave', () => { el.style.transform = ''; });
            el.addEventListener('pointerdown', () => { el.style.transform += ' scale(0.97)'; });
            el.addEventListener('pointerup', () => { el.style.transform = el.style.transform.replace(' scale(0.97)', ''); });
        });
    }

    /* ---------------------------------------------------------------
       Tilt + spotlight cards
       --------------------------------------------------------------- */
    if (!prefersReducedMotion && !isTouch) {
        document.querySelectorAll('[data-tilt]').forEach((el) => {
            const max = 7; // degrees
            let raf = 0;
            function onMove(e) {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width;
                const py = (e.clientY - r.top) / r.height;
                const rx = (0.5 - py) * max * 2;
                const ry = (px - 0.5) * max * 2;
                cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    el.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
                    el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
                    el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
                });
            }
            el.addEventListener('pointerenter', () => el.classList.add('is-tilting'));
            el.addEventListener('pointermove', onMove);
            el.addEventListener('pointerleave', () => {
                cancelAnimationFrame(raf);
                el.classList.remove('is-tilting');
                el.style.transform = '';
            });
        });
    }

    /* ---------------------------------------------------------------
       Skills filtering
       --------------------------------------------------------------- */
    const chips = Array.from(document.querySelectorAll('.chip'));
    const skillItems = Array.from(document.querySelectorAll('.skill-item'));
    const skillSelect = document.getElementById('skill-category-select');

    function filterSkills(category) {
        skillItems.forEach((item) => {
            const match = category === 'All' || item.getAttribute('data-category') === category;
            if (match) {
                item.style.display = '';
                requestAnimationFrame(() => item.classList.remove('is-hidden'));
            } else {
                item.classList.add('is-hidden');
                setTimeout(() => { if (item.classList.contains('is-hidden')) item.style.display = 'none'; }, 350);
            }
        });
    }
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chips.forEach((c) => c.classList.remove('is-active'));
            chip.classList.add('is-active');
            const cat = chip.getAttribute('data-category');
            if (skillSelect) skillSelect.value = cat;
            filterSkills(cat);
        });
    });
    if (skillSelect) {
        skillSelect.addEventListener('change', (e) => {
            const cat = e.target.value;
            chips.forEach((c) => c.classList.toggle('is-active', c.getAttribute('data-category') === cat));
            filterSkills(cat);
        });
    }

    /* ---------------------------------------------------------------
       Résumé modal
       --------------------------------------------------------------- */
    const RESUME_PDF = 'images/Yakir Nissim Shlomo Resume.pdf';
    const resumeBtn = document.getElementById('resume-button');
    const resumeModal = document.getElementById('resume-modal');
    const resumeClose = document.getElementById('resume-close');
    const resumeObject = document.getElementById('resume-object');
    const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    function openResume() {
        if (isMobileUA) { window.open(RESUME_PDF, '_blank'); return; }
        if (!resumeObject.data) resumeObject.data = RESUME_PDF;
        resumeModal.classList.add('is-open');
        resumeModal.setAttribute('aria-hidden', 'false');
        lockScroll(true);
    }
    function closeResume() {
        if (!resumeModal.classList.contains('is-open')) return;
        resumeModal.classList.remove('is-open');
        resumeModal.setAttribute('aria-hidden', 'true');
        lockScroll(false);
    }
    if (resumeBtn) resumeBtn.addEventListener('click', openResume);
    if (resumeClose) resumeClose.addEventListener('click', closeResume);
    if (resumeModal) resumeModal.addEventListener('click', (e) => { if (e.target === resumeModal) closeResume(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeResume(); });

    /* ---------------------------------------------------------------
       Misc
       --------------------------------------------------------------- */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // make sure background videos actually play (some browsers stall muted autoplay)
    document.querySelectorAll('video[autoplay]').forEach((v) => {
        const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
        tryPlay();
        v.addEventListener('canplay', tryPlay, { once: true });
    });
})();

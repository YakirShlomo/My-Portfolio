/* =================================================================
   Yakir Shlomo — Portfolio · interactions  (v2)
   ================================================================= */
(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.add('js');

    /* Fallback: if anything below throws, never leave content hidden. */
    function revealEverything() {
        try {
            document.querySelectorAll('[data-reveal], [data-reveal-children]').forEach(function (el) {
                el.classList.add('is-visible');
            });
        } catch (e) { /* noop */ }
    }

    try {
        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var isTouch = window.matchMedia('(hover: none)').matches;
        var canIO = 'IntersectionObserver' in window;

        /* ---------------------------------------------------------------
           Reveal on scroll  (set up FIRST so content is never stuck hidden)
           --------------------------------------------------------------- */
        document.querySelectorAll('[data-reveal-children]').forEach(function (container) {
            Array.prototype.forEach.call(container.children, function (child, i) {
                child.style.setProperty('--si', i);
            });
        });

        var revealTargets = document.querySelectorAll('[data-reveal], [data-reveal-children]');
        if (canIO) {
            var revealObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
            revealTargets.forEach(function (t) { revealObserver.observe(t); });
        } else {
            revealTargets.forEach(function (t) { t.classList.add('is-visible'); });
        }

        /* ---------------------------------------------------------------
           Lenis — smooth scrolling (optional / best-effort)
           --------------------------------------------------------------- */
        var lenis = null;
        try {
            if (!prefersReducedMotion && typeof window.Lenis === 'function') {
                lenis = new window.Lenis({
                    duration: 1.1,
                    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
                    smoothWheel: true,
                    touchMultiplier: 1.6
                });
                var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
                requestAnimationFrame(raf);
            }
        } catch (e) { lenis = null; }

        function scrollToEl(el) {
            if (!el) return;
            if (lenis && typeof lenis.scrollTo === 'function') {
                lenis.scrollTo(el, { offset: 0 });
            } else {
                var top = el.getBoundingClientRect().top + (window.pageYOffset || window.scrollY || 0);
                window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            }
        }
        function lockScroll(lock) {
            try { if (lenis) { lock ? lenis.stop() : lenis.start(); } } catch (e) { /* noop */ }
            document.body.style.overflow = lock ? 'hidden' : '';
        }

        /* ---------------------------------------------------------------
           Mobile navigation
           --------------------------------------------------------------- */
        var navToggle = document.getElementById('nav-toggle');
        var mobileNav = document.getElementById('mobile-nav');
        var navScrim = document.getElementById('nav-scrim');

        function openMobileNav() {
            if (!mobileNav) return;
            mobileNav.classList.add('is-open');
            if (navScrim) navScrim.classList.add('is-open');
            if (navToggle) { navToggle.setAttribute('aria-expanded', 'true'); navToggle.setAttribute('aria-label', 'Close menu'); }
            mobileNav.setAttribute('aria-hidden', 'false');
            lockScroll(true);
        }
        function closeMobileNav() {
            if (!mobileNav || !mobileNav.classList.contains('is-open')) return;
            mobileNav.classList.remove('is-open');
            if (navScrim) navScrim.classList.remove('is-open');
            if (navToggle) { navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-label', 'Open menu'); }
            mobileNav.setAttribute('aria-hidden', 'true');
            lockScroll(false);
        }
        if (navToggle) navToggle.addEventListener('click', function () {
            (mobileNav && mobileNav.classList.contains('is-open')) ? closeMobileNav() : openMobileNav();
        });
        if (navScrim) navScrim.addEventListener('click', closeMobileNav);

        /* ---------------------------------------------------------------
           Anchor links
           --------------------------------------------------------------- */
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                var href = a.getAttribute('href');
                if (!href || href === '#') return;
                var target = document.getElementById(href.slice(1));
                if (!target) return;
                e.preventDefault();
                closeMobileNav();
                scrollToEl(target);
                if (history && history.replaceState) history.replaceState(null, '', href);
            });
        });

        /* ---------------------------------------------------------------
           Navbar scrolled state + scroll progress fallback
           --------------------------------------------------------------- */
        var navbar = document.getElementById('navbar');
        var supportsScrollTimeline = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));

        function updateProgress() {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            var sy = window.pageYOffset || window.scrollY || 0;
            var p = max > 0 ? Math.min(1, Math.max(0, sy / max)) : 0;
            root.style.setProperty('--scroll-progress', p.toFixed(4));
        }
        function onScroll() {
            var sy = window.pageYOffset || window.scrollY || 0;
            if (navbar) navbar.classList.toggle('is-scrolled', sy > 24);
            if (!supportsScrollTimeline) updateProgress();
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        if (lenis && typeof lenis.on === 'function') lenis.on('scroll', onScroll);
        onScroll();

        /* ---------------------------------------------------------------
           Scroll-spy — active nav link
           --------------------------------------------------------------- */
        var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
        var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
        if (canIO && sections.length) {
            var spy = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var id = entry.target.id;
                        navLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + id); });
                    }
                });
            }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
            sections.forEach(function (s) { spy.observe(s); });
        }

        /* ---------------------------------------------------------------
           Magnetic buttons
           --------------------------------------------------------------- */
        if (!prefersReducedMotion && !isTouch && window.PointerEvent) {
            document.querySelectorAll('[data-magnetic]').forEach(function (el) {
                var strength = 0.3;
                el.addEventListener('pointermove', function (e) {
                    var r = el.getBoundingClientRect();
                    var x = (e.clientX - (r.left + r.width / 2)) * strength;
                    var y = (e.clientY - (r.top + r.height / 2)) * strength;
                    el.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
                });
                el.addEventListener('pointerleave', function () { el.style.transform = ''; });
                el.addEventListener('pointercancel', function () { el.style.transform = ''; });
            });
        }

        /* ---------------------------------------------------------------
           Tilt + spotlight cards
           --------------------------------------------------------------- */
        if (!prefersReducedMotion && !isTouch && window.PointerEvent) {
            document.querySelectorAll('[data-tilt]').forEach(function (el) {
                var max = 7, rafId = 0;
                function onMove(e) {
                    var r = el.getBoundingClientRect();
                    var px = (e.clientX - r.left) / r.width;
                    var py = (e.clientY - r.top) / r.height;
                    var rx = (0.5 - py) * max * 2;
                    var ry = (px - 0.5) * max * 2;
                    cancelAnimationFrame(rafId);
                    rafId = requestAnimationFrame(function () {
                        el.style.transform = 'perspective(800px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
                        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
                        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
                    });
                }
                el.addEventListener('pointerenter', function () { el.classList.add('is-tilting'); });
                el.addEventListener('pointermove', onMove);
                function reset() { cancelAnimationFrame(rafId); el.classList.remove('is-tilting'); el.style.transform = ''; }
                el.addEventListener('pointerleave', reset);
                el.addEventListener('pointercancel', reset);
            });
        }

        /* ---------------------------------------------------------------
           Skills filtering
           --------------------------------------------------------------- */
        var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
        var skillItems = Array.prototype.slice.call(document.querySelectorAll('.skill-item'));
        var skillSelect = document.getElementById('skill-category-select');

        function filterSkills(category) {
            skillItems.forEach(function (item) {
                var match = category === 'All' || item.getAttribute('data-category') === category;
                if (match) {
                    item.style.display = '';
                    requestAnimationFrame(function () { item.classList.remove('is-hidden'); });
                } else {
                    item.classList.add('is-hidden');
                    setTimeout(function () { if (item.classList.contains('is-hidden')) item.style.display = 'none'; }, 350);
                }
            });
        }
        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                chips.forEach(function (c) { c.classList.remove('is-active'); });
                chip.classList.add('is-active');
                var cat = chip.getAttribute('data-category');
                if (skillSelect) skillSelect.value = cat;
                filterSkills(cat);
            });
        });
        if (skillSelect) skillSelect.addEventListener('change', function (e) {
            var cat = e.target.value;
            chips.forEach(function (c) { c.classList.toggle('is-active', c.getAttribute('data-category') === cat); });
            filterSkills(cat);
        });

        /* ---------------------------------------------------------------
           Résumé modal
           --------------------------------------------------------------- */
        var RESUME_PDF = 'images/Yakir Nissim Shlomo Resume.pdf';
        var resumeBtn = document.getElementById('resume-button');
        var resumeModal = document.getElementById('resume-modal');
        var resumeClose = document.getElementById('resume-close');
        var resumeObject = document.getElementById('resume-object');
        var isMobileUA = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        function openResume() {
            if (isMobileUA) { window.open(RESUME_PDF, '_blank'); return; }
            if (resumeObject && !resumeObject.getAttribute('data')) resumeObject.setAttribute('data', RESUME_PDF);
            if (resumeModal) { resumeModal.classList.add('is-open'); resumeModal.setAttribute('aria-hidden', 'false'); }
            lockScroll(true);
        }
        function closeResume() {
            if (!resumeModal || !resumeModal.classList.contains('is-open')) return;
            resumeModal.classList.remove('is-open');
            resumeModal.setAttribute('aria-hidden', 'true');
            lockScroll(false);
        }
        if (resumeBtn) resumeBtn.addEventListener('click', openResume);
        if (resumeClose) resumeClose.addEventListener('click', closeResume);
        if (resumeModal) resumeModal.addEventListener('click', function (e) { if (e.target === resumeModal) closeResume(); });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) { closeMobileNav(); closeResume(); }
        });

        /* ---------------------------------------------------------------
           Misc
           --------------------------------------------------------------- */
        var yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = String(new Date().getFullYear());

        document.querySelectorAll('video[autoplay]').forEach(function (v) {
            var tryPlay = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
            tryPlay();
            v.addEventListener('canplay', tryPlay, { once: true });
            v.addEventListener('loadeddata', tryPlay, { once: true });
        });

    } catch (err) {
        if (window.console && console.error) console.error('[portfolio] init failed:', err);
        revealEverything();
    }
})();

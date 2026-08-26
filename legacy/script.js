/* =================================================================
   Yakir Shlomo — Portfolio · interactions  (v2)
   ================================================================= */
(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.add('js');

    /* Fallback: if anything below throws, never leave content hidden or the gate locked. */
    function revealEverything() {
        try {
            document.querySelectorAll('[data-reveal], [data-reveal-children]').forEach(function (el) {
                el.classList.add('is-visible');
            });
        } catch (e) { /* noop */ }
        try {
            var gateEl = document.getElementById('gate');
            if (gateEl) { gateEl.classList.add('is-hidden'); gateEl.setAttribute('aria-hidden', 'true'); }
            document.body.style.overflow = '';
        } catch (e) { /* noop */ }
        try { document.dispatchEvent(new CustomEvent('portfolio:unlock')); } catch (e) { /* noop */ }
    }

    /* Belt-and-braces: the <head> inline script already sets this as early as
       possible; repeating it here costs nothing and covers any environment
       where that first script didn't run. */
    try {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
    } catch (e) { /* noop */ }

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
           Entry gate — type /start to unlock. Locks again on every load/
           refresh by design — no persistence across page loads.
           --------------------------------------------------------------- */
        var gate = document.getElementById('gate');
        if (gate) {
            var gateForm = document.getElementById('gate-form');
            var gateInput = document.getElementById('gate-input');
            var gateError = document.getElementById('gate-error');
            var gateFlash = document.getElementById('gate-flash');

            lockScroll(true);
            if (gateInput && !isTouch) setTimeout(function () { gateInput.focus(); }, 400);

            var gateSetError = function (msg) {
                if (gateError) { gateError.textContent = msg; gateError.classList.add('is-visible'); }
                if (gateInput) gateInput.classList.add('is-error');
                if (gateForm) {
                    gateForm.classList.remove('is-shake');
                    void gateForm.offsetWidth; /* restart the shake keyframe */
                    gateForm.classList.add('is-shake');
                }
            };
            var gateClearError = function () {
                if (gateError) gateError.classList.remove('is-visible');
                if (gateInput) gateInput.classList.remove('is-error');
            };
            var gateUnlock = function () {
                gate.classList.add('is-unlocking');
                if (gateFlash) gateFlash.classList.add('is-active');
                lockScroll(false);
                /* the gate is the entry point every load — always land on the
                   Hero the moment it opens, regardless of prior scroll state */
                window.scrollTo(0, 0);
                try { document.dispatchEvent(new CustomEvent('portfolio:unlock')); } catch (e) { /* noop */ }
                setTimeout(function () {
                    gate.classList.add('is-hidden');
                    gate.setAttribute('aria-hidden', 'true');
                }, prefersReducedMotion ? 60 : 560);
            };

            if (gateForm) gateForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var raw = gateInput ? gateInput.value : '';
                var val = raw.trim().toLowerCase();
                if (val === '/start') {
                    gateClearError();
                    gateUnlock();
                } else {
                    gateSetError(raw.trim() ? 'Not quite — try /start' : 'Type /start to continue');
                    if (gateInput) { gateInput.value = ''; gateInput.focus(); }
                    if (gateForm) gateForm.classList.remove('has-value');
                }
            });
            if (gateInput) gateInput.addEventListener('input', function () {
                gateClearError();
                if (gateForm) gateForm.classList.toggle('has-value', gateInput.value.trim().length > 0);
            });

            /* minimal focus trap: only two focusable elements while the gate is up */
            var gateSubmitBtn = gate.querySelector('.gate__submit');
            gate.addEventListener('keydown', function (e) {
                if (e.key !== 'Tab') return;
                if (e.shiftKey && document.activeElement === gateInput) {
                    e.preventDefault();
                    if (gateSubmitBtn) gateSubmitBtn.focus();
                } else if (!e.shiftKey && document.activeElement === gateSubmitBtn) {
                    e.preventDefault();
                    if (gateInput) gateInput.focus();
                }
            });
        } else {
            /* no gate on this page — don't leave gate-dependent effects (Hero
               constellation reveal, role-line scramble) waiting forever */
            try { document.dispatchEvent(new CustomEvent('portfolio:unlock')); } catch (e) { /* noop */ }
        }

        /* ---------------------------------------------------------------
           Hero role-line scramble/decode reveal — plays once, synced to the
           gate unlocking. Skipped entirely under reduced motion: the real
           text is already correct in the DOM, so there's nothing to fix.
           --------------------------------------------------------------- */
        var scrambleEl = document.querySelector('[data-scramble]');
        if (scrambleEl && !prefersReducedMotion) {
            var scrambleFinal = scrambleEl.textContent;
            var SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/_';
            var playScramble = function () {
                var len = scrambleFinal.length;
                var frame = 0;
                var maxFrames = 26 + len * 2;
                var timer = setInterval(function () {
                    var out = '';
                    for (var i = 0; i < len; i++) {
                        var ch = scrambleFinal[i];
                        if (ch === ' ' || ch === '.' || ch === '-') { out += ch; continue; }
                        var lockFrame = 10 + i * 2.1;
                        out += frame >= lockFrame ? ch : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
                    }
                    scrambleEl.textContent = out;
                    frame++;
                    if (frame > maxFrames) {
                        scrambleEl.textContent = scrambleFinal;
                        clearInterval(timer);
                    }
                }, 32);
            };
            document.addEventListener('portfolio:unlock', playScramble, { once: true });
        }

        /* ---------------------------------------------------------------
           Hero name — ambient single-letter glitch. Purely a stylistic
           flicker (chromatic-aberration offset via CSS); the character
           itself never changes, so "Yakir Shlomo" is always legible.
           Starts only after a settle buffer post-unlock, so the name has
           already been read cleanly before the first flicker can occur.
           Skipped entirely under reduced motion.
           --------------------------------------------------------------- */
        var glitchEl = document.querySelector('[data-glitch-text]');
        if (glitchEl && !prefersReducedMotion) {
            var glitchChars = [];
            var sourceText = glitchEl.textContent;
            glitchEl.textContent = '';
            for (var gi = 0; gi < sourceText.length; gi++) {
                var chr = sourceText[gi];
                if (chr === ' ') {
                    glitchEl.appendChild(document.createTextNode(' '));
                } else {
                    var span = document.createElement('span');
                    span.className = 'glitch-char';
                    span.textContent = chr;
                    glitchEl.appendChild(span);
                    glitchChars.push(span);
                }
            }

            var glitchScheduled = false;
            var scheduleGlitch = function () {
                if (glitchScheduled) return;
                glitchScheduled = true;
                var delay = 1800 + Math.random() * 2600;
                setTimeout(function () {
                    glitchScheduled = false;
                    if (document.hidden || !glitchChars.length) { scheduleGlitch(); return; }
                    var target = glitchChars[(Math.random() * glitchChars.length) | 0];
                    target.classList.remove('is-glitching');
                    void target.offsetWidth; /* restart the keyframe */
                    target.classList.add('is-glitching');
                    setTimeout(function () { target.classList.remove('is-glitching'); }, 200);
                    scheduleGlitch();
                }, delay);
            };
            document.addEventListener('portfolio:unlock', function () {
                setTimeout(scheduleGlitch, 1400); /* let the name settle and be read first */
            }, { once: true });
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
            mobileNav.inert = false; /* it's off-screen via transform, not display:none — inert keeps it out of Tab order while closed/off-canvas */
            lockScroll(true);
        }
        function closeMobileNav() {
            if (!mobileNav || !mobileNav.classList.contains('is-open')) return;
            mobileNav.classList.remove('is-open');
            if (navScrim) navScrim.classList.remove('is-open');
            if (navToggle) { navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-label', 'Open menu'); }
            mobileNav.setAttribute('aria-hidden', 'true');
            mobileNav.inert = true;
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

        /* Hero → next-section scroll transition (skipped under reduced motion,
           so --hero-scroll stays at its CSS default of 0 — a calm, static hero). */
        var heroEl = document.getElementById('home');
        var heroHeight = heroEl ? heroEl.offsetHeight : 0;
        function updateHeroScroll() {
            if (!heroEl || prefersReducedMotion) return;
            var sy = window.pageYOffset || window.scrollY || 0;
            var p = heroHeight > 0 ? Math.min(1, Math.max(0, sy / (heroHeight * 0.7))) : 0;
            heroEl.style.setProperty('--hero-scroll', p.toFixed(4));
        }

        function onScroll() {
            var sy = window.pageYOffset || window.scrollY || 0;
            if (navbar) navbar.classList.toggle('is-scrolled', sy > 24);
            if (!supportsScrollTimeline) updateProgress();
            updateHeroScroll();
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        if (lenis && typeof lenis.on === 'function') lenis.on('scroll', onScroll);
        window.addEventListener('resize', function () {
            if (heroEl) heroHeight = heroEl.offsetHeight;
        }, { passive: true });
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
           Resume modal
           --------------------------------------------------------------- */
        var RESUME_PDF = 'images/Yakir Nissim Shlomo Resume.pdf';
        var resumeTriggers = Array.prototype.slice.call(document.querySelectorAll('[data-resume-trigger]'));
        var resumeModal = document.getElementById('resume-modal');
        var resumeClose = document.getElementById('resume-close');
        var resumeObject = document.getElementById('resume-object');
        var resumePanel = resumeModal ? resumeModal.querySelector('.resume-modal__panel') : null;
        var isMobileUA = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        var resumeReturnFocus = null;

        function openResume() {
            if (isMobileUA) { window.open(RESUME_PDF, '_blank'); return; }
            if (resumeObject && !resumeObject.getAttribute('data')) resumeObject.setAttribute('data', RESUME_PDF);
            resumeReturnFocus = document.activeElement;
            if (resumeModal) { resumeModal.classList.add('is-open'); resumeModal.setAttribute('aria-hidden', 'false'); }
            if (resumePanel) setTimeout(function () { resumePanel.focus(); }, 50);
            lockScroll(true);
        }
        function closeResume() {
            if (!resumeModal || !resumeModal.classList.contains('is-open')) return;
            resumeModal.classList.remove('is-open');
            resumeModal.setAttribute('aria-hidden', 'true');
            lockScroll(false);
            if (resumeReturnFocus && typeof resumeReturnFocus.focus === 'function') resumeReturnFocus.focus();
            resumeReturnFocus = null;
        }
        resumeTriggers.forEach(function (btn) { btn.addEventListener('click', openResume); });
        if (resumeClose) resumeClose.addEventListener('click', closeResume);
        if (resumeModal) resumeModal.addEventListener('click', function (e) { if (e.target === resumeModal) closeResume(); });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) { closeMobileNav(); closeResume(); }
        });

        /* ---------------------------------------------------------------
           Private-project page — personalize from query params
           --------------------------------------------------------------- */
        var privateTitleEl = document.getElementById('private-project-title');
        if (privateTitleEl) {
            try {
                var qp = new URLSearchParams(window.location.search);
                var pName = (qp.get('name') || '').trim();
                var pTag = (qp.get('tag') || '').trim();
                var pStack = (qp.get('stack') || '').trim();
                var pNote = (qp.get('note') || '').trim();
                var noteEl = document.getElementById('private-project-note');
                var stackEl = document.getElementById('private-project-stack');
                var eyebrowEl = document.querySelector('.private-hero__eyebrow');

                if (pName) {
                    privateTitleEl.textContent = pName + ' is private';
                    document.title = pName + ' — Private | Yakir Shlomo';
                }
                if (noteEl && pNote) {
                    noteEl.textContent = pNote;
                } else if (noteEl && pName) {
                    noteEl.textContent = 'There’s no public demo for ' + pName + ' right now, so I can’t link out to it here. I’m glad to walk you through the architecture, the decisions behind it, and the code directly — just reach out.';
                }
                if (pTag && eyebrowEl) {
                    var eyebrowText = document.createTextNode(' Private access · ' + pTag);
                    eyebrowEl.innerHTML = '<span class="dot"></span>';
                    eyebrowEl.appendChild(eyebrowText);
                }
                if (pStack && stackEl) {
                    pStack.split(',').forEach(function (tech) {
                        tech = tech.trim();
                        if (!tech) return;
                        var li = document.createElement('li');
                        li.textContent = tech;
                        stackEl.appendChild(li);
                    });
                }
            } catch (e) { /* keep defaults already in the markup */ }
        }

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

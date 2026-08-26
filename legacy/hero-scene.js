/* =================================================================
   Yakir Shlomo — Portfolio · Hero constellation
   A small interactive node graph of the core stack. Idle drift at
   rest; pointer/touch pulls nearby nodes with spring physics, harder
   while pressed (a "drag the fabric" feel with a trailing energy
   ripple); connections and labels brighten on proximity. The whole
   thing fades/settles into formation the moment the entry gate
   unlocks, then eases out slightly as the visitor scrolls past.
   Static single frame under reduced-motion — no seed, no physics.
   ================================================================= */
(function () {
    'use strict';

    try {
        var canvas = document.getElementById('hero-canvas');
        var hero = document.getElementById('home');
        if (!canvas || !hero || !canvas.getContext) return;

        var ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var supportsPointer = 'PointerEvent' in window;

        var TECH = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Supabase', 'PostgreSQL'];

        var accentHex = (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#5fb6c6').trim();
        var accentRgb = hexToRgb(accentHex) || { r: 95, g: 182, b: 198 };
        function hexToRgb(hex) {
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
            if (hex.length !== 6) return null;
            var num = parseInt(hex, 16);
            if (isNaN(num)) return null;
            return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
        }
        function accentA(a) {
            return 'rgba(' + accentRgb.r + ',' + accentRgb.g + ',' + accentRgb.b + ',' + a + ')';
        }
        function rand(min, max) { return min + Math.random() * (max - min); }

        var W = 0, H = 0, DPR = 1;
        var nodes = [];
        var pairs = [];
        var pointer = { x: 0, y: 0, active: false, down: false };
        var pointerEased = { x: 0, y: 0, set: false };
        var lastTrailAt = 0;
        var ripples = [];
        var rafId = null;
        var running = false;
        var revealed = prefersReducedMotion; /* reduced-motion renders fully resolved, no entrance */
        var revealStartTime = 0;

        var PULL_RADIUS = 150;
        var PULL_STRENGTH = 0.055;
        var SPRING = 0.02;
        var DAMPING = 0.9;

        function buildNodes(seedEntrance) {
            var prev = nodes;
            nodes = [];
            var small = W < 700;
            var total = small ? 11 : 17;
            for (var i = 0; i < total; i++) {
                var labeled = i < TECH.length;
                var hx = rand(0.06, 0.95), hy = rand(0.12, 0.92);
                var homeX = hx * W, homeY = hy * H;
                var startAlpha = seedEntrance ? 0 : (prev[i] ? prev[i].alpha : 1);
                nodes.push({
                    hx: hx, hy: hy,
                    x: seedEntrance ? homeX + rand(-42, 42) : homeX,
                    y: seedEntrance ? homeY + rand(-42, 42) : homeY,
                    vx: 0, vy: 0,
                    r: labeled ? rand(2.6, 3.1) : rand(1.2, 2.1),
                    phase: rand(0, Math.PI * 2),
                    driftR: rand(9, 20),
                    driftSpeed: rand(0.5, 1.1),
                    label: labeled ? TECH[i] : null,
                    labelAlpha: 0,
                    glow: 0,
                    alpha: startAlpha,
                    revealDelay: i * 22
                });
            }
            computePairs();
        }

        /* nearest-2-neighbour graph, computed once per layout (not per frame) */
        function computePairs() {
            var seen = Object.create(null);
            pairs = [];
            for (var i = 0; i < nodes.length; i++) {
                var dists = [];
                for (var j = 0; j < nodes.length; j++) {
                    if (i === j) continue;
                    var dx = (nodes[i].hx - nodes[j].hx) * W;
                    var dy = (nodes[i].hy - nodes[j].hy) * H;
                    dists.push({ j: j, d: Math.sqrt(dx * dx + dy * dy) });
                }
                dists.sort(function (a, b) { return a.d - b.d; });
                var k = Math.min(2, dists.length);
                for (var m = 0; m < k; m++) {
                    var a = Math.min(i, dists[m].j), b = Math.max(i, dists[m].j);
                    var key = a + '_' + b;
                    if (!seen[key]) { seen[key] = true; pairs.push([a, b]); }
                }
            }
        }

        function resize() {
            var rect = hero.getBoundingClientRect();
            W = Math.max(1, rect.width);
            H = Math.max(1, rect.height);
            DPR = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(W * DPR);
            canvas.height = Math.round(H * DPR);
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            /* only the very first build seeds the entrance; a later resize
               (address-bar show/hide, window drag) just re-lays-out in place */
            buildNodes(!nodes.length && !prefersReducedMotion);
        }

        function setPointerFromClient(clientX, clientY) {
            var rect = canvas.getBoundingClientRect();
            pointer.x = clientX - rect.left;
            pointer.y = clientY - rect.top;
            pointer.active = true;
        }
        function releasePointer() { pointer.active = false; pointer.down = false; }
        function isContentTarget(e) { return !!(e.target && e.target.closest && e.target.closest('.hero__content')); }

        if (supportsPointer) {
            hero.addEventListener('pointermove', function (e) {
                setPointerFromClient(e.clientX, e.clientY);
                if (pointer.down && !prefersReducedMotion) {
                    var now = performance.now();
                    if (now - lastTrailAt > 90) { spawnRipple(pointer.x, pointer.y, 0.28); lastTrailAt = now; }
                }
            }, { passive: true });
            hero.addEventListener('pointerdown', function (e) {
                if (isContentTarget(e)) return; /* never hijack CTA / eyebrow interaction */
                setPointerFromClient(e.clientX, e.clientY);
                pointer.down = true;
                if (!prefersReducedMotion) spawnRipple(pointer.x, pointer.y, 0.5);
            }, { passive: true });
            hero.addEventListener('pointerup', releasePointer, { passive: true });
            hero.addEventListener('pointercancel', releasePointer, { passive: true });
            hero.addEventListener('pointerleave', releasePointer, { passive: true });
        }

        function spawnRipple(x, y, alpha) {
            ripples.push({ x: x, y: y, r: 0, alpha: alpha });
            if (ripples.length > 6) ripples.shift();
        }

        function drawConnections() {
            var maxD = Math.max(W, H) * 0.36;
            ctx.lineWidth = 1;
            for (var p = 0; p < pairs.length; p++) {
                var a = nodes[pairs[p][0]], b = nodes[pairs[p][1]];
                var pairAlpha = Math.min(a.alpha, b.alpha);
                if (pairAlpha < 0.01) continue;
                var dx = a.x - b.x, dy = a.y - b.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var base = Math.max(0, 1 - dist / maxD) * 0.12;
                var boost = Math.max(a.glow, b.glow) * 0.4;
                ctx.strokeStyle = accentA((base + boost) * pairAlpha);
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }

        function drawNodes(withGlow) {
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                if (n.alpha < 0.01) continue;
                var r = n.r + n.glow * 2.2;
                if (withGlow && n.glow > 0.04) {
                    var grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
                    grad.addColorStop(0, accentA(0.32 * n.glow * n.alpha));
                    grad.addColorStop(1, accentA(0));
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = n.label
                    ? accentA((0.55 + n.glow * 0.45) * n.alpha)
                    : 'rgba(255,255,255,' + ((0.16 + n.glow * 0.3) * n.alpha) + ')';
                ctx.beginPath();
                ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
                ctx.fill();

                if (n.label && n.labelAlpha > 0.015) {
                    ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(242,242,243,' + (n.labelAlpha * 0.9 * n.alpha) + ')';
                    ctx.fillText(n.label, n.x + r + 8, n.y);
                }
            }
        }

        function step(t) {
            if (!running) return;
            ctx.clearRect(0, 0, W, H);

            if (pointer.active) {
                if (!pointerEased.set) { pointerEased.x = pointer.x; pointerEased.y = pointer.y; pointerEased.set = true; }
                pointerEased.x += (pointer.x - pointerEased.x) * 0.14;
                pointerEased.y += (pointer.y - pointerEased.y) * 0.14;
                var glowR = pointer.down ? 230 : 190;
                var glowA = pointer.down ? 0.13 : 0.09;
                var glow = ctx.createRadialGradient(pointerEased.x, pointerEased.y, 0, pointerEased.x, pointerEased.y, glowR);
                glow.addColorStop(0, accentA(glowA));
                glow.addColorStop(1, accentA(0));
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, W, H);
            }

            /* pressing and moving intensifies the field — "grabbing the fabric" */
            var strength = PULL_STRENGTH * (pointer.down ? 1.9 : 1);
            var radius = PULL_RADIUS * (pointer.down ? 1.35 : 1);

            var revealElapsed = revealed ? (t - revealStartTime) : -1;

            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                var driftX = Math.cos(t * 0.00035 * n.driftSpeed + n.phase) * n.driftR;
                var driftY = Math.sin(t * 0.00046 * n.driftSpeed + n.phase * 1.3) * n.driftR;
                var targetX = n.hx * W + driftX;
                var targetY = n.hy * H + driftY;

                var fx = (targetX - n.x) * SPRING;
                var fy = (targetY - n.y) * SPRING;

                if (pointer.active) {
                    var dx = pointer.x - n.x, dy = pointer.y - n.y;
                    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (dist < radius) {
                        var force = (1 - dist / radius) * strength;
                        fx += dx * force;
                        fy += dy * force;
                        n.glow += ((1 - dist / radius) - n.glow) * 0.15;
                    } else {
                        n.glow += (0 - n.glow) * 0.07;
                    }
                } else {
                    n.glow += (0 - n.glow) * 0.07;
                }

                n.vx = (n.vx + fx) * DAMPING;
                n.vy = (n.vy + fy) * DAMPING;
                n.x += n.vx;
                n.y += n.vy;

                if (n.label) {
                    var targetAlpha = n.glow > 0.22 ? 1 : 0;
                    n.labelAlpha += (targetAlpha - n.labelAlpha) * 0.09;
                }

                if (revealElapsed >= 0 && n.alpha < 1) {
                    var localElapsed = revealElapsed - n.revealDelay;
                    if (localElapsed > 0) n.alpha += (1 - n.alpha) * 0.06;
                }
            }

            drawConnections();
            drawNodes(true);

            for (var ri = ripples.length - 1; ri >= 0; ri--) {
                var rp = ripples[ri];
                rp.r += 3;
                rp.alpha -= 0.017;
                if (rp.alpha <= 0) { ripples.splice(ri, 1); continue; }
                ctx.strokeStyle = accentA(rp.alpha);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
                ctx.stroke();
            }

            rafId = requestAnimationFrame(step);
        }

        function start() {
            if (running || prefersReducedMotion || !revealed) return;
            running = true;
            rafId = requestAnimationFrame(step);
        }
        function stop() {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        }

        function drawStaticFrame() {
            ctx.clearRect(0, 0, W, H);
            drawConnections();
            drawNodes(false);
        }

        function reveal() {
            if (revealed) return;
            revealed = true;
            revealStartTime = performance.now();
            start();
        }
        if (prefersReducedMotion) {
            document.addEventListener('portfolio:unlock', function () { /* already fully resolved */ }, { once: true });
        } else {
            document.addEventListener('portfolio:unlock', reveal, { once: true });
        }

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                resize();
                if (prefersReducedMotion) drawStaticFrame();
            }, 150);
        });

        if ('IntersectionObserver' in window && !prefersReducedMotion) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) start(); else stop();
                });
            }, { threshold: 0.05 });
            io.observe(hero);
        }
        document.addEventListener('visibilitychange', function () {
            if (prefersReducedMotion) return;
            if (document.hidden) stop(); else start();
        });

        resize();
        if (prefersReducedMotion) {
            drawStaticFrame();
        }
        /* otherwise: wait for portfolio:unlock to seed the entrance — the
           constellation stays invisible (alpha 0) behind the still-locked
           gate rather than animating in unseen */
    } catch (err) {
        if (window.console && console.error) console.error('[hero-scene] init failed:', err);
    }
})();

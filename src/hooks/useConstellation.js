import { useEffect, useRef } from 'react';

const TECH = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Supabase', 'PostgreSQL'];
const PULL_RADIUS = 150;
const PULL_STRENGTH = 0.055;
const SPRING = 0.026;
const DAMPING = 0.9;

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (hex.length !== 6) return null;
  const num = parseInt(hex, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rand(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Interactive tech-node "constellation" canvas. Idle drift at rest; pointer
 * pulls nearby nodes with spring physics, harder while pressed. Reveals into
 * formation once `unlocked` flips true. Static single frame under reduced
 * motion. Fully torn down on unmount (StrictMode-safe: no leaked listeners,
 * observers, or rAF loops across a mount → cleanup → mount cycle).
 */
export function useConstellation({ canvasRef, heroRef, unlocked, reducedMotion }) {
  const apiRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = heroRef.current;
    if (!canvas || !hero || !canvas.getContext) return undefined;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    const supportsPointer = 'PointerEvent' in window;
    const accentHex = (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#6fc7d6').trim();
    const accentRgb = hexToRgb(accentHex) || { r: 111, g: 199, b: 214 };
    const accentA = (a) => `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${a})`;

    let W = 0;
    let H = 0;
    let DPR = 1;
    let nodes = [];
    let pairs = [];
    const pointer = { x: 0, y: 0, active: false, down: false };
    const pointerEased = { x: 0, y: 0, set: false };
    let lastTrailAt = 0;
    let ripples = [];
    let rafId = null;
    let running = false;
    let revealed = reducedMotion;
    let revealStartTime = 0;

    function buildNodes(seedEntrance) {
      const prev = nodes;
      nodes = [];
      const small = W < 700;
      const total = small ? 11 : 17;
      for (let i = 0; i < total; i++) {
        const labeled = i < TECH.length;
        const hx = rand(0.06, 0.95);
        const hy = rand(0.12, 0.92);
        const homeX = hx * W;
        const homeY = hy * H;
        const startAlpha = seedEntrance ? 0 : prev[i] ? prev[i].alpha : 1;
        nodes.push({
          hx,
          hy,
          x: seedEntrance ? homeX + rand(-42, 42) : homeX,
          y: seedEntrance ? homeY + rand(-42, 42) : homeY,
          vx: 0,
          vy: 0,
          r: labeled ? rand(2.6, 3.1) : rand(1.2, 2.1),
          phase: rand(0, Math.PI * 2),
          driftR: rand(11, 23),
          driftSpeed: rand(0.5, 1.1),
          label: labeled ? TECH[i] : null,
          labelAlpha: 0,
          glow: 0,
          alpha: startAlpha,
          revealDelay: i * 22,
        });
      }
      computePairs();
    }

    function computePairs() {
      const seen = Object.create(null);
      pairs = [];
      for (let i = 0; i < nodes.length; i++) {
        const dists = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = (nodes[i].hx - nodes[j].hx) * W;
          const dy = (nodes[i].hy - nodes[j].hy) * H;
          dists.push({ j, d: Math.sqrt(dx * dx + dy * dy) });
        }
        dists.sort((a, b) => a.d - b.d);
        const k = Math.min(2, dists.length);
        for (let m = 0; m < k; m++) {
          const a = Math.min(i, dists[m].j);
          const b = Math.max(i, dists[m].j);
          const key = `${a}_${b}`;
          if (!seen[key]) {
            seen[key] = true;
            pairs.push([a, b]);
          }
        }
      }
    }

    function resize() {
      const rect = hero.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildNodes(!nodes.length && !reducedMotion);
    }

    function setPointerFromClient(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      pointer.active = true;
    }
    function releasePointer() {
      pointer.active = false;
      pointer.down = false;
    }
    function isContentTarget(e) {
      return !!(e.target && e.target.closest && e.target.closest('.hero__content'));
    }
    function spawnRipple(x, y, alpha) {
      ripples.push({ x, y, r: 0, alpha });
      if (ripples.length > 6) ripples.shift();
    }

    function onPointerMove(e) {
      setPointerFromClient(e.clientX, e.clientY);
      if (pointer.down && !reducedMotion) {
        const now = performance.now();
        if (now - lastTrailAt > 90) {
          spawnRipple(pointer.x, pointer.y, 0.28);
          lastTrailAt = now;
        }
      }
    }
    function onPointerDown(e) {
      if (isContentTarget(e)) return;
      setPointerFromClient(e.clientX, e.clientY);
      pointer.down = true;
      if (!reducedMotion) spawnRipple(pointer.x, pointer.y, 0.5);
    }

    function drawConnections() {
      const maxD = Math.max(W, H) * 0.36;
      ctx.lineWidth = 1;
      for (let p = 0; p < pairs.length; p++) {
        const a = nodes[pairs[p][0]];
        const b = nodes[pairs[p][1]];
        const pairAlpha = Math.min(a.alpha, b.alpha);
        if (pairAlpha < 0.01) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const base = Math.max(0, 1 - dist / maxD) * 0.12;
        const boost = Math.max(a.glow, b.glow) * 0.4;
        ctx.strokeStyle = accentA((base + boost) * pairAlpha);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    function drawNodes(withGlow) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.alpha < 0.01) continue;
        const r = n.r + n.glow * 2.2;
        if (withGlow && n.glow > 0.04) {
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
          grad.addColorStop(0, accentA(0.32 * n.glow * n.alpha));
          grad.addColorStop(1, accentA(0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = n.label
          ? accentA((0.55 + n.glow * 0.45) * n.alpha)
          : `rgba(255,255,255,${(0.16 + n.glow * 0.3) * n.alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        if (n.label && n.labelAlpha > 0.015) {
          ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(242,242,243,${n.labelAlpha * 0.9 * n.alpha})`;
          ctx.fillText(n.label, n.x + r + 8, n.y);
        }
      }
    }

    function step(t) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);

      if (pointer.active) {
        if (!pointerEased.set) {
          pointerEased.x = pointer.x;
          pointerEased.y = pointer.y;
          pointerEased.set = true;
        }
        pointerEased.x += (pointer.x - pointerEased.x) * 0.14;
        pointerEased.y += (pointer.y - pointerEased.y) * 0.14;
        const glowR = pointer.down ? 230 : 190;
        const glowA = pointer.down ? 0.13 : 0.09;
        const glow = ctx.createRadialGradient(pointerEased.x, pointerEased.y, 0, pointerEased.x, pointerEased.y, glowR);
        glow.addColorStop(0, accentA(glowA));
        glow.addColorStop(1, accentA(0));
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      }

      const strength = PULL_STRENGTH * (pointer.down ? 1.9 : 1);
      const radius = PULL_RADIUS * (pointer.down ? 1.35 : 1);
      const revealElapsed = revealed ? t - revealStartTime : -1;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const driftX = Math.cos(t * 0.0005 * n.driftSpeed + n.phase) * n.driftR;
        const driftY = Math.sin(t * 0.00068 * n.driftSpeed + n.phase * 1.3) * n.driftR;
        const targetX = n.hx * W + driftX;
        const targetY = n.hy * H + driftY;

        let fx = (targetX - n.x) * SPRING;
        let fy = (targetY - n.y) * SPRING;

        if (pointer.active) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < radius) {
            const force = (1 - dist / radius) * strength;
            fx += dx * force;
            fy += dy * force;
            n.glow += (1 - dist / radius - n.glow) * 0.15;
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
          const targetAlpha = n.glow > 0.22 ? 1 : 0;
          n.labelAlpha += (targetAlpha - n.labelAlpha) * 0.09;
        }

        if (revealElapsed >= 0 && n.alpha < 1) {
          const localElapsed = revealElapsed - n.revealDelay;
          if (localElapsed > 0) n.alpha += (1 - n.alpha) * 0.06;
        }
      }

      drawConnections();
      drawNodes(true);

      for (let ri = ripples.length - 1; ri >= 0; ri--) {
        const rp = ripples[ri];
        rp.r += 3;
        rp.alpha -= 0.017;
        if (rp.alpha <= 0) {
          ripples.splice(ri, 1);
          continue;
        }
        ctx.strokeStyle = accentA(rp.alpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (running || reducedMotion || !revealed) return;
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
    apiRef.current.reveal = reveal;

    let resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reducedMotion) drawStaticFrame();
      }, 150);
    }
    function onVisibilityChange() {
      if (reducedMotion) return;
      if (document.hidden) stop();
      else start();
    }

    if (supportsPointer) {
      hero.addEventListener('pointermove', onPointerMove, { passive: true });
      hero.addEventListener('pointerdown', onPointerDown, { passive: true });
      hero.addEventListener('pointerup', releasePointer, { passive: true });
      hero.addEventListener('pointercancel', releasePointer, { passive: true });
      hero.addEventListener('pointerleave', releasePointer, { passive: true });
    }
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    let io = null;
    if ('IntersectionObserver' in window && !reducedMotion) {
      io = new IntersectionObserver(
        (entries) => entries.forEach((entry) => (entry.isIntersecting ? start() : stop())),
        { threshold: 0.05 }
      );
      io.observe(hero);
    }

    resize();
    if (reducedMotion) drawStaticFrame();

    return () => {
      stop();
      clearTimeout(resizeTimer);
      if (supportsPointer) {
        hero.removeEventListener('pointermove', onPointerMove);
        hero.removeEventListener('pointerdown', onPointerDown);
        hero.removeEventListener('pointerup', releasePointer);
        hero.removeEventListener('pointercancel', releasePointer);
        hero.removeEventListener('pointerleave', releasePointer);
      }
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      io?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (unlocked) apiRef.current.reveal?.();
  }, [unlocked]);
}

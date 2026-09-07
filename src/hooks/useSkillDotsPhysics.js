import { useEffect } from 'react';

const DOT_RADIUS = 10;
const IDLE_FORCE = 0.01;
const DAMPING = 0.965;
const BOUNCE = 0.8;
const SAFE_ZONE_MARGIN = 12;
const SAFE_ZONE_PUSH = 0.05;
const COLLISION_RESTITUTION = 0.85;
const DRAG_LERP = 0.55;
const NUDGE_STRENGTH = 2.4;
const EDGE_PAD = 8;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Simple hand-rolled physics for the floating Hero skill dots — no library,
 * one requestAnimationFrame loop for all dots. Each dot idly wanders on a
 * slow deterministic sine/cosine drift, bounces off the corner-frame
 * rectangle (not the whole Hero — see computeFrameBounds), is softly
 * repelled out of the live "safe zone" (name/subtitle/meta/CTAs) so it
 * never idles on top of the text, and resolves simple circle-circle
 * collisions with its neighbors. Dragging overrides all of that: the
 * grabbed dot follows the pointer (lerped for a natural feel) and its
 * velocity is derived from the drag motion itself, so releasing it "throws"
 * it at the speed it was moving.
 *
 * Under `prefers-reduced-motion`, the whole rAF loop is skipped — dots sit
 * at their deterministic layout position and only respond to an explicit
 * drag (1:1 with the pointer, no momentum, no bounce, no collisions), so
 * there is no continuous animation, matching the reduced-motion contract.
 */
export function useSkillDotsPhysics({ heroRef, containerRef, dotRefs, dots, reducedMotion }) {
  useEffect(() => {
    const hero = heroRef.current;
    const container = containerRef.current;
    if (!hero || !container) return undefined;

    let W = 0;
    let H = 0;
    let safeZone = { left: 0, top: 0, right: 0, bottom: 0 };
    let frame = { left: 0, top: 0, right: 0, bottom: 0 };
    let rafId = null;
    let running = false;
    // The navbar is fixed and overlaps the Hero's own top edge (the Hero
    // occupies the full viewport height starting at y:0, same as the nav).
    // Keep dots clear of that strip so they never bob behind the logo/links,
    // even if the corner frame's own top inset happens to sit above it.
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
    const topClearance = navH + 16;

    const state = dots.map((d, i) => ({
      id: d.id,
      r: DOT_RADIUS,
      hx: d.hx,
      hy: d.hy,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      targetX: 0,
      targetY: 0,
      phase: i * 1.37 + 0.6,
      dragging: false,
      grabDX: 0,
      grabDY: 0,
      activeTimer: null,
    }));

    /**
     * The physics boundary is never a duplicated set of numbers — it's
     * read directly from the rendered corner-frame marks (positioned by
     * Hero.css's --frame-inset-x/y), so the visual frame and the
     * drag/bounce boundary can never drift apart. Falls back to the full
     * Hero rect if the frame elements aren't present for some reason.
     */
    function computeFrameBounds() {
      const heroRect = hero.getBoundingClientRect();
      const tl = hero.querySelector('.hero__frame--tl');
      const br = hero.querySelector('.hero__frame--br');
      if (!tl || !br) {
        return { left: 0, top: 0, right: W, bottom: H };
      }
      const tlRect = tl.getBoundingClientRect();
      const brRect = br.getBoundingClientRect();
      return {
        left: tlRect.left - heroRect.left,
        top: tlRect.top - heroRect.top,
        right: brRect.right - heroRect.left,
        bottom: brRect.bottom - heroRect.top,
      };
    }

    function computeSafeZone() {
      const heroRect = hero.getBoundingClientRect();
      const floatEl = hero.querySelector('.hero__float');
      const ctaEl = hero.querySelector('.hero__cta');
      const rects = [floatEl, ctaEl].filter(Boolean).map((el) => el.getBoundingClientRect());
      if (!rects.length) {
        return { left: W * 0.5, top: H * 0.5, right: W * 0.5, bottom: H * 0.5 };
      }
      const left = Math.min(...rects.map((r) => r.left));
      const right = Math.max(...rects.map((r) => r.right));
      const top = Math.min(...rects.map((r) => r.top));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      const marginX = Math.max(24, W * 0.03);
      const marginY = Math.max(18, H * 0.03);
      return {
        left: left - heroRect.left - marginX,
        top: top - heroRect.top - marginY,
        right: right - heroRect.left + marginX,
        bottom: bottom - heroRect.top + marginY,
      };
    }

    function writeTransform(s) {
      const el = dotRefs.current[s.id];
      if (el) el.style.transform = `translate3d(${(s.x - s.r).toFixed(1)}px, ${(s.y - s.r).toFixed(1)}px, 0)`;
    }

    let prevFrame = null;

    function frameTopBound() {
      // Whichever sits lower on screen wins: the frame's own top edge, or
      // the navbar clearance — a dot must clear both.
      return Math.max(frame.top + DOT_RADIUS + EDGE_PAD, Math.min(topClearance, frame.bottom - DOT_RADIUS - EDGE_PAD));
    }

    function measure(seedPositions) {
      const rect = hero.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      frame = computeFrameBounds();
      safeZone = computeSafeZone();
      const top = frameTopBound();
      const left = frame.left + DOT_RADIUS + EDGE_PAD;
      const right = frame.right - DOT_RADIUS - EDGE_PAD;
      const bottom = frame.bottom - DOT_RADIUS - EDGE_PAD;

      state.forEach((s) => {
        const seededX = clamp(frame.left + s.hx * (frame.right - frame.left), left, right);
        const seededY = clamp(frame.top + s.hy * (frame.bottom - frame.top), top, bottom);
        if (seedPositions || (s.x === 0 && s.y === 0)) {
          s.x = seededX;
          s.y = seededY;
        } else if (prevFrame) {
          // Rescale relative to the frame rectangle itself (not the whole
          // Hero) — a dot sitting a third of the way across the old frame
          // should land a third of the way across the new one, whatever
          // its size or position, rather than staying pinned to a raw
          // pixel coordinate that may no longer even be inside the frame.
          const relX = (s.x - prevFrame.left) / Math.max(1, prevFrame.right - prevFrame.left);
          const relY = (s.y - prevFrame.top) / Math.max(1, prevFrame.bottom - prevFrame.top);
          s.x = clamp(frame.left + relX * (frame.right - frame.left), left, right);
          s.y = clamp(frame.top + relY * (frame.bottom - frame.top), top, bottom);
        } else {
          s.x = clamp(s.x, left, right);
          s.y = clamp(s.y, top, bottom);
        }
        writeTransform(s);
      });
      prevFrame = frame;
    }

    function applySafeZonePush(s) {
      const cx = clamp(s.x, safeZone.left, safeZone.right);
      const cy = clamp(s.y, safeZone.top, safeZone.bottom);
      const dx = s.x - cx;
      const dy = s.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist >= s.r + SAFE_ZONE_MARGIN) return;
      if (dist < 0.001) {
        // Center is inside the rect itself: escape toward the nearest edge.
        const distLeft = s.x - safeZone.left;
        const distRight = safeZone.right - s.x;
        const distTop = s.y - safeZone.top;
        const distBottom = safeZone.bottom - s.y;
        const nearest = Math.min(distLeft, distRight, distTop, distBottom);
        if (nearest === distLeft) s.vx -= SAFE_ZONE_PUSH * 6;
        else if (nearest === distRight) s.vx += SAFE_ZONE_PUSH * 6;
        else if (nearest === distTop) s.vy -= SAFE_ZONE_PUSH * 6;
        else s.vy += SAFE_ZONE_PUSH * 6;
        return;
      }
      const nx = dx / dist;
      const ny = dy / dist;
      const push = (s.r + SAFE_ZONE_MARGIN - dist) * SAFE_ZONE_PUSH;
      s.vx += nx * push;
      s.vy += ny * push;
    }

    function resolveCollisions() {
      for (let i = 0; i < state.length; i++) {
        for (let j = i + 1; j < state.length; j++) {
          const a = state[i];
          const b = state[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const minDist = a.r + b.r;
          if (dist >= minDist) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          if (!a.dragging && !b.dragging) {
            a.x -= nx * overlap * 0.5;
            a.y -= ny * overlap * 0.5;
            b.x += nx * overlap * 0.5;
            b.y += ny * overlap * 0.5;
          } else if (!a.dragging) {
            a.x -= nx * overlap;
            a.y -= ny * overlap;
          } else if (!b.dragging) {
            b.x += nx * overlap;
            b.y += ny * overlap;
          }
          const relVel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relVel < 0) {
            const impulse = -relVel * COLLISION_RESTITUTION;
            if (!a.dragging) {
              a.vx -= nx * impulse * 0.5;
              a.vy -= ny * impulse * 0.5;
            }
            if (!b.dragging) {
              b.vx += nx * impulse * 0.5;
              b.vy += ny * impulse * 0.5;
            }
          }
        }
      }
    }

    function step(t) {
      if (!running) return;

      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        if (s.dragging) {
          const nx = s.x + (s.targetX - s.x) * DRAG_LERP;
          const ny = s.y + (s.targetY - s.y) * DRAG_LERP;
          s.vx = nx - s.x;
          s.vy = ny - s.y;
          s.x = nx;
          s.y = ny;
          continue;
        }

        const ax = Math.sin(t * 0.00023 + s.phase) * IDLE_FORCE;
        const ay = Math.cos(t * 0.00019 + s.phase * 1.4) * IDLE_FORCE;
        s.vx = (s.vx + ax) * DAMPING;
        s.vy = (s.vy + ay) * DAMPING;
        s.x += s.vx;
        s.y += s.vy;

        const left = frame.left + s.r + EDGE_PAD;
        const right = frame.right - s.r - EDGE_PAD;
        const bottom = frame.bottom - s.r - EDGE_PAD;
        const top = frameTopBound();
        if (s.x < left) {
          s.x = left;
          s.vx = Math.abs(s.vx) * BOUNCE;
        } else if (s.x > right) {
          s.x = right;
          s.vx = -Math.abs(s.vx) * BOUNCE;
        }
        if (s.y < top) {
          s.y = top;
          s.vy = Math.abs(s.vy) * BOUNCE;
        } else if (s.y > bottom) {
          s.y = bottom;
          s.vy = -Math.abs(s.vy) * BOUNCE;
        }

        applySafeZonePush(s);
      }

      resolveCollisions();

      for (let i = 0; i < state.length; i++) writeTransform(state[i]);

      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (running || reducedMotion) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    function findDotEl(target) {
      return target && target.closest ? target.closest('.skill-dot') : null;
    }
    function stateFor(id) {
      return state.find((s) => s.id === id);
    }

    function activate(el, s) {
      el.classList.add('is-active');
      if (s) clearTimeout(s.activeTimer);
    }
    function deactivateSoon(el, s, delay) {
      if (!s) return;
      clearTimeout(s.activeTimer);
      s.activeTimer = setTimeout(() => el.classList.remove('is-active'), delay);
    }

    function onPointerDown(e) {
      const el = findDotEl(e.target);
      if (!el) return;
      const id = el.dataset.dotId;
      const s = stateFor(id);
      if (!s) return;
      el.setPointerCapture?.(e.pointerId);
      const rect = container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      s.dragging = true;
      s.grabDX = px - s.x;
      s.grabDY = py - s.y;
      s.targetX = s.x;
      s.targetY = s.y;
      s.vx = 0;
      s.vy = 0;
      el.classList.add('is-dragging');
      activate(el, s);

      if (reducedMotion) {
        // No physics loop is running — position the dot directly and let
        // it simply stay wherever it's dropped.
        el.style.transform = `translate3d(${(s.x - s.r).toFixed(1)}px, ${(s.y - s.r).toFixed(1)}px, 0)`;
      }
    }

    function onPointerMove(e) {
      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        if (!s.dragging) continue;
        const rect = container.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const tx = clamp(px - s.grabDX, frame.left + s.r + EDGE_PAD, frame.right - s.r - EDGE_PAD);
        const ty = clamp(py - s.grabDY, frameTopBound(), frame.bottom - s.r - EDGE_PAD);
        if (reducedMotion) {
          s.x = tx;
          s.y = ty;
          writeTransform(s);
        } else {
          s.targetX = tx;
          s.targetY = ty;
        }
      }
    }

    function onPointerUp() {
      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        if (!s.dragging) continue;
        s.dragging = false;
        const el = dotRefs.current[s.id];
        el?.classList.remove('is-dragging');
        deactivateSoon(el, s, 900);
      }
    }

    function onKeyDown(e) {
      if (reducedMotion) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = findDotEl(e.target);
      if (!el) return;
      const s = stateFor(el.dataset.dotId);
      if (!s || s.dragging) return;
      e.preventDefault();
      const dx = s.x - (frame.left + frame.right) / 2;
      const dy = s.y - (frame.top + frame.bottom) / 2;
      const d = Math.hypot(dx, dy) || 1;
      s.vx += (dx / d) * NUDGE_STRENGTH;
      s.vy += (dy / d) * NUDGE_STRENGTH;
    }

    let resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => measure(false), 150);
    }

    measure(true);
    container.addEventListener('pointerdown', onPointerDown, { passive: true });
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerup', onPointerUp, { passive: true });
    container.addEventListener('pointercancel', onPointerUp, { passive: true });
    container.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize, { passive: true });

    let io = null;
    if (!reducedMotion) {
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver(
          (entries) => entries.forEach((entry) => (entry.isIntersecting ? start() : stop())),
          { threshold: 0.05 }
        );
        io.observe(hero);
      } else {
        start();
      }
    }

    return () => {
      stop();
      clearTimeout(resizeTimer);
      state.forEach((s) => clearTimeout(s.activeTimer));
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      io?.disconnect();
    };
  }, [heroRef, containerRef, dotRefs, dots, reducedMotion]);
}

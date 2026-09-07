import { useEffect, useRef } from 'react';

const PULL_RADIUS = 150;
const PULL_STRENGTH = 0.055;
const AMBIENT_SPRING = 0.026;
// Much stiffer than the ambient spring — motif vertices snap back to their
// exact shape point quickly, so the </> silhouette never drifts out of
// recognition even while the pointer or the idle drift is nudging it.
const MOTIF_SPRING = 0.09;
const MOTIF_POINTER_FACTOR = 0.18;
const DAMPING = 0.9;
const AMBIENT_COUNT_SMALL = 7;
const AMBIENT_COUNT_LARGE = 11;

// Whole-composition idle motion. Deliberately slow: this is background
// atmosphere, not a focal animation, so periods are measured in seconds.
const DRIFT_AMOUNT_MOTIF = 9;
const PARALLAX_AMOUNT = 14;
const PARALLAX_EASE = 0.035;
const BREATH_MIN = 0.58;
const BREATH_MAX = 1;
const GLYPH_DRIFT = 6;
const GLYPH_BREATH_MIN = 0.5;
const GLYPH_BREATH_MAX = 0.88;

// Sparse secondary programming glyphs. Fixed content + fixed normalized
// zone/position, never Math.random() — same composition on every load.
// Positions are resolved against the live safe zone at draw time (see
// placeInZone), so a glyph simply doesn't render on viewports too narrow
// to fit it cleanly outside the text, rather than crowding or overlapping.
const CODE_GLYPHS_DESKTOP = [
  { text: '{ }', zone: 'left', t1: 0.22, t2: 0.16 },
  { text: '=>', zone: 'top', t1: 0.55, t2: 0.35 },
  { text: '01', zone: 'right', t1: 0.28, t2: 0.18 },
  { text: '&&', zone: 'bottom', t1: 0.42, t2: 0.22 },
  { text: '[ ]', zone: 'left', t1: 0.72, t2: 0.82 },
  { text: 'fn', zone: 'right', t1: 0.68, t2: 0.8 },
];
const CODE_GLYPHS_COMPACT = [
  { text: '{ }', zone: 'top', t1: 0.42, t2: 0.2 },
  { text: '=>', zone: 'top', t1: 0.68, t2: 0.76 },
  { text: '01', zone: 'right', t1: 0.35, t2: 0.4 },
  { text: ';', zone: 'left', t1: 0.3, t2: 0.6 },
];

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
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Large, deterministic "</>" code-motif canvas that frames the Hero content
 * instead of sitting behind it. A live "safe zone" — the bounding box of
 * `.hero__content`, padded — is measured on every resize/reveal; the motif
 * and the secondary programming glyphs are laid out to stay clear of it.
 *
 * Two deterministic layouts, chosen by how much margin the safe zone
 * actually leaves (not a fixed viewport breakpoint):
 * - "Surround" (wide desktop): a big < lives in the left margin, a big >
 *   in the right margin, each sized from its own available gap, spanning
 *   most of the Hero's height. The / can't sit at its usual literal
 *   midpoint any more (that midpoint is the safe zone itself), so it
 *   drops to the open band below the CTA row instead.
 * - "Compact" (everything else — phones, tablets, narrow laptops, where
 *   the side margins are too thin for a surround chevron): the whole </>
 *   packs back into one small mark and sits just below the CTA row,
 *   biased slightly left for a less static composition.
 *
 * Every stroke is drawn as two thin parallel dashed lines (a "double
 * rail") instead of one thicker line, reading as engineered/premium
 * rather than just bolder. The whole motif drifts slowly, breathes in
 * opacity, and eases toward the pointer as a single rigid translation —
 * never per-vertex distortion — so the glyph shape never degrades into
 * noise. A handful of low-opacity secondary glyphs idle sparsely outside
 * the safe zone. Reduced motion renders the same composition as one
 * static frame: zero drift, zero parallax, resting opacity throughout.
 * Fully torn down on unmount (StrictMode-safe).
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
    const rootStyle = getComputedStyle(document.documentElement);
    const accentHex = (rootStyle.getPropertyValue('--accent') || '#6fc7d6').trim();
    const accentRgb = hexToRgb(accentHex) || { r: 111, g: 199, b: 214 };
    const accentA = (a) => `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${a})`;
    const monoFont = (rootStyle.getPropertyValue('--font-mono') || '').trim() || "'JetBrains Mono', ui-monospace, Menlo, monospace";

    let W = 0;
    let H = 0;
    let DPR = 1;
    let motifNodes = [];
    let motifLines = [];
    let motifStrokeOffset = 2.4;
    let ambientNodes = [];
    let glyphNodes = [];
    let glyphFontSize = 14;
    const parallax = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0, active: false, down: false };
    const pointerEased = { x: 0, y: 0, set: false };
    let lastTrailAt = 0;
    let ripples = [];
    let rafId = null;
    let running = false;
    let revealed = reducedMotion;
    let revealStartTime = 0;
    let settleTimer = null;

    /**
     * The exclusion rectangle nothing primary should be drawn through:
     * name, subtitle, meta pills, and CTAs, padded outward so lines don't
     * crowd right up against the text. Deliberately measures `.hero__float`
     * + `.hero__cta` rather than their `.hero__content` wrapper — the
     * wrapper carries its own `padding: 0 var(--gutter)` (up to 64px a
     * side), which is empty whitespace, not text; including it as if it
     * were content nearly doubled the real margin and made the surround
     * layout think there was no room to work with on ordinary desktop
     * widths.
     */
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
      const marginX = Math.max(28, W * 0.035);
      const marginY = Math.max(20, H * 0.03);
      return {
        left: left - heroRect.left - marginX,
        top: top - heroRect.top - marginY,
        right: right - heroRect.left + marginX,
        bottom: bottom - heroRect.top + marginY,
      };
    }

    /**
     * Decides surround vs. compact from how much room is actually left
     * over outside the safe zone — a real measurement, not a guessed
     * viewport-width cutoff — so the layout degrades gracefully on
     * anything from an ultra-wide monitor to a folded laptop window.
     */
    function getLayoutInfo() {
      const safeZone = computeSafeZone();
      const edgeMargin = Math.max(24, W * 0.025);
      const availLeft = safeZone.left - edgeMargin;
      const availRight = W - edgeMargin - safeZone.right;
      const canSurround = Math.min(availLeft, availRight) >= 100 && H >= 480;
      return { safeZone, edgeMargin, availLeft, availRight, canSurround };
    }

    function buildMotif(seedEntrance, layout) {
      const prev = motifNodes;
      const { safeZone, edgeMargin, availLeft, availRight, canSurround } = layout;
      const chevronW = 0.42; // real </> glyph proportion: tall, narrow chevrons
      const gap = 0.3;
      const slashW = 0.3;
      let verts;

      if (canSurround) {
        // Height is driven by the hero's own height, not by chevron width —
        // the chevrons live entirely in the side margins (no x-overlap with
        // the safe zone is possible regardless of how tall they are), so
        // they can stretch to fill most of the Hero vertically. Coupling
        // height to width instead (real-glyph proportions) made the chevron
        // nearly as tall as the content block itself, so its vertices sat
        // only ~15-20px from the text — visually clamping it rather than
        // framing it with real breathing room.
        const leftChevronW = clamp(availLeft * 0.68, 70, 260);
        const rightChevronW = clamp(availRight * 0.68, 70, 260);
        const chevronH = clamp(H * 0.72, 220, H * 0.86);
        const leftChevronH = chevronH;
        const rightChevronH = chevronH;
        const midY = H / 2;
        const leftTipX = edgeMargin + Math.min(22, availLeft * 0.18);
        const leftVertexX = Math.min(leftTipX + leftChevronW, safeZone.left - 18);
        const rightTipX = W - edgeMargin - Math.min(22, availRight * 0.18);
        const rightVertexX = Math.max(rightTipX - rightChevronW, safeZone.right + 18);

        const slashBandTop = safeZone.bottom + 14;
        const slashBandBottom = H - Math.max(48, H * 0.07);
        const slashAvailH = Math.max(0, slashBandBottom - slashBandTop);
        const slashH = clamp(slashAvailH * 0.72, 30, 210);
        const slashTopY = slashBandTop + Math.max(0, slashAvailH - slashH) * 0.25;
        const slashBottomY = slashTopY + slashH;
        const slashWpx = slashH * 0.4;
        const slashCx = W / 2;

        motifStrokeOffset = 3.6;
        verts = [
          { x: leftVertexX, y: midY - leftChevronH / 2 },
          { x: leftTipX, y: midY },
          { x: leftVertexX, y: midY + leftChevronH / 2 },
          { x: slashCx - slashWpx / 2, y: slashBottomY },
          { x: slashCx + slashWpx / 2, y: slashTopY },
          { x: rightVertexX, y: midY - rightChevronH / 2 },
          { x: rightTipX, y: midY },
          { x: rightVertexX, y: midY + rightChevronH / 2 },
        ];
      } else {
        // Compact: the whole glyph packs into one mark below the CTA row,
        // biased left so the composition isn't dead-centered under a
        // dead-centered name.
        const unitAspect = chevronW * 2 + gap * 2 + slashW;
        const availW = W - edgeMargin * 2;
        const bandTop = safeZone.bottom + 16;
        const bottomReserve = Math.max(56, H * 0.075);
        const availH = H - bandTop - bottomReserve;
        const boxH = Math.min(Math.max(0, availH), availW / unitAspect, 168);

        if (boxH < 42) {
          motifNodes = [];
          motifLines = [];
          motifStrokeOffset = 0;
          return;
        }

        const boxW = boxH * unitAspect;
        let left = (W - boxW) / 2 - W * 0.055;
        left = clamp(left, edgeMargin, W - edgeMargin - boxW);
        const top = bandTop;

        const pt = (xFrac, xWidth, xOffset, y) => ({ x: left + xOffset * boxH + xFrac * xWidth * boxH, y });
        const ltOffset = 0;
        const slashOffset = chevronW + gap;
        const rtOffset = chevronW + gap + slashW + gap;

        motifStrokeOffset = 2.3;
        verts = [
          pt(1, chevronW, ltOffset, top),
          pt(0, chevronW, ltOffset, top + boxH / 2),
          pt(1, chevronW, ltOffset, top + boxH),
          pt(0, slashW, slashOffset, top + boxH),
          pt(1, slashW, slashOffset, top),
          pt(0, chevronW, rtOffset, top),
          pt(1, chevronW, rtOffset, top + boxH / 2),
          pt(0, chevronW, rtOffset, top + boxH),
        ];
      }

      motifNodes = verts.map((v, i) => {
        const startAlpha = seedEntrance ? 0 : prev[i] ? prev[i].alpha : 1;
        return {
          hx: v.x / W,
          hy: v.y / H,
          x: seedEntrance ? v.x + rand(-30, 30) : v.x,
          y: seedEntrance ? v.y + rand(-30, 30) : v.y,
          vx: 0,
          vy: 0,
          glow: 0,
          alpha: startAlpha,
          revealDelay: i * 45,
        };
      });

      motifLines = [
        [0, 1],
        [1, 2],
        [3, 4],
        [5, 6],
        [6, 7],
      ];
    }

    function buildAmbient(seedEntrance) {
      const prev = ambientNodes;
      const total = W < 700 ? AMBIENT_COUNT_SMALL : AMBIENT_COUNT_LARGE;
      ambientNodes = [];
      for (let i = 0; i < total; i++) {
        const hx = rand(0.04, 0.96);
        const hy = rand(0.06, 0.94);
        const homeX = hx * W;
        const homeY = hy * H;
        const startAlpha = seedEntrance ? 0 : prev[i] ? prev[i].alpha : 1;
        ambientNodes.push({
          hx,
          hy,
          x: seedEntrance ? homeX + rand(-30, 30) : homeX,
          y: seedEntrance ? homeY + rand(-30, 30) : homeY,
          vx: 0,
          vy: 0,
          r: rand(1, 1.8),
          phase: rand(0, Math.PI * 2),
          driftR: rand(8, 18),
          driftSpeed: rand(0.4, 1),
          glow: 0,
          alpha: startAlpha,
          revealDelay: i * 30,
        });
      }
    }

    /** Resolves one glyph's fixed zone/t1/t2 into a pixel position, or
     * null if that margin band is currently too thin to hold it cleanly. */
    function placeInZone(zone, t1, t2, layout) {
      const { safeZone, edgeMargin } = layout;
      if (zone === 'left') {
        const width = safeZone.left - edgeMargin;
        if (width < 30) return null;
        return { x: edgeMargin + t1 * width, y: (0.08 + t2 * 0.84) * H };
      }
      if (zone === 'right') {
        const width = W - edgeMargin - safeZone.right;
        if (width < 30) return null;
        return { x: safeZone.right + t1 * width, y: (0.08 + t2 * 0.84) * H };
      }
      if (zone === 'top') {
        const height = safeZone.top - edgeMargin * 0.6;
        if (height < 22) return null;
        return { x: (0.06 + t2 * 0.88) * W, y: edgeMargin * 0.6 + t1 * height };
      }
      const height = H - edgeMargin - safeZone.bottom;
      if (height < 22) return null;
      return { x: (0.06 + t2 * 0.88) * W, y: safeZone.bottom + t1 * height };
    }

    function buildGlyphs(seedEntrance, layout) {
      const prev = glyphNodes;
      const source = layout.canSurround ? CODE_GLYPHS_DESKTOP : CODE_GLYPHS_COMPACT;
      const { safeZone } = layout;
      const next = [];
      for (let i = 0; i < source.length; i++) {
        const g = source[i];
        const p = placeInZone(g.zone, g.t1, g.t2, layout);
        if (!p) continue;
        if (p.x > safeZone.left && p.x < safeZone.right && p.y > safeZone.top && p.y < safeZone.bottom) continue;
        const prevNode = prev.find((n) => n.text === g.text);
        const startAlpha = seedEntrance ? 0 : prevNode ? prevNode.alpha : 1;
        next.push({
          text: g.text,
          hx: p.x / W,
          hy: p.y / H,
          phase: i * 1.7 + 0.4,
          alpha: startAlpha,
          revealDelay: 280 + i * 70,
        });
      }
      glyphNodes = next;
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
      const firstBuild = !motifNodes.length;
      const layout = getLayoutInfo();
      glyphFontSize = layout.canSurround ? clamp(W * 0.011, 14, 20) : clamp(W * 0.036, 12, 16);
      buildMotif(firstBuild && !reducedMotion, layout);
      buildAmbient(firstBuild && !reducedMotion);
      buildGlyphs(firstBuild && !reducedMotion, layout);
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

    function drawAmbientNodes() {
      for (let i = 0; i < ambientNodes.length; i++) {
        const n = ambientNodes[i];
        if (n.alpha < 0.01) continue;
        const r = n.r + n.glow * 1.6;
        ctx.fillStyle = `rgba(255,255,255,${(0.13 + n.glow * 0.25) * n.alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawGlyphs(t) {
      if (!glyphNodes.length) return;
      ctx.font = `500 ${glyphFontSize}px ${monoFont}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < glyphNodes.length; i++) {
        const g = glyphNodes[i];
        if (g.alpha < 0.01) continue;
        const driftX = reducedMotion ? 0 : Math.cos(t * 0.00016 + g.phase) * GLYPH_DRIFT;
        const driftY = reducedMotion ? 0 : Math.sin(t * 0.00013 + g.phase * 1.4) * GLYPH_DRIFT * 0.8;
        const breath = reducedMotion
          ? 0.72
          : GLYPH_BREATH_MIN + (GLYPH_BREATH_MAX - GLYPH_BREATH_MIN) * (0.5 + 0.5 * Math.sin(t * 0.00072 + g.phase * 2.1));
        const px = g.hx * W + driftX + parallax.x * 0.5;
        const py = g.hy * H + driftY + parallax.y * 0.5;
        ctx.fillStyle = accentA(breath * 0.48 * g.alpha);
        ctx.fillText(g.text, px, py);
      }
    }

    /** Draws one segment as two thin parallel dashed lines (a "double
     * rail") instead of a single thicker stroke — reads as a deliberate,
     * engineered mark rather than just a bolder line. */
    function drawMotifLines(breath) {
      const offset = motifStrokeOffset;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([5, 6]);
      for (let p = 0; p < motifLines.length; p++) {
        const a = motifNodes[motifLines[p][0]];
        const b = motifNodes[motifLines[p][1]];
        const pairAlpha = Math.min(a.alpha, b.alpha);
        if (pairAlpha < 0.01) continue;
        const boost = Math.max(a.glow, b.glow) * 0.5;
        const alpha = (0.42 + boost) * pairAlpha * breath;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * offset;
        const ny = (dx / len) * offset;
        ctx.strokeStyle = accentA(alpha);
        ctx.beginPath();
        ctx.moveTo(a.x + nx, a.y + ny);
        ctx.lineTo(b.x + nx, b.y + ny);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a.x - nx, a.y - ny);
        ctx.lineTo(b.x - nx, b.y - ny);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    function drawMotifNodes(withGlow, breath) {
      for (let i = 0; i < motifNodes.length; i++) {
        const n = motifNodes[i];
        if (n.alpha < 0.01) continue;
        const r = 2.6 + n.glow * 2;
        const alpha = (0.55 + n.glow * 0.4) * n.alpha * breath;
        if (withGlow && n.glow > 0.04) {
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
          grad.addColorStop(0, accentA(0.3 * n.glow * n.alpha));
          grad.addColorStop(1, accentA(0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = accentA(alpha);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
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

      // Whole-group drift + pointer parallax: a single rigid translation
      // applied to every motif vertex's spring target, so the </> shape
      // itself never distorts — it only glides, as one piece.
      const driftX = Math.sin(t * 0.00011) * DRIFT_AMOUNT_MOTIF;
      const driftY = Math.cos(t * 0.00009 + 1.1) * DRIFT_AMOUNT_MOTIF * 0.7;
      const parallaxTargetX = pointer.active ? clamp((pointer.x - W / 2) / (W / 2), -1, 1) * PARALLAX_AMOUNT : 0;
      const parallaxTargetY = pointer.active ? clamp((pointer.y - H / 2) / (H / 2), -1, 1) * PARALLAX_AMOUNT * 0.6 : 0;
      parallax.x += (parallaxTargetX - parallax.x) * PARALLAX_EASE;
      parallax.y += (parallaxTargetY - parallax.y) * PARALLAX_EASE;
      const breath = BREATH_MIN + (BREATH_MAX - BREATH_MIN) * (0.5 + 0.5 * Math.sin(t * 0.0007));

      for (let i = 0; i < ambientNodes.length; i++) {
        const n = ambientNodes[i];
        const driftAX = Math.cos(t * 0.0005 * n.driftSpeed + n.phase) * n.driftR;
        const driftAY = Math.sin(t * 0.00068 * n.driftSpeed + n.phase * 1.3) * n.driftR;
        const targetX = n.hx * W + driftAX;
        const targetY = n.hy * H + driftAY;
        let fx = (targetX - n.x) * AMBIENT_SPRING;
        let fy = (targetY - n.y) * AMBIENT_SPRING;
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
        if (revealElapsed >= 0 && n.alpha < 1) {
          const localElapsed = revealElapsed - n.revealDelay;
          if (localElapsed > 0) n.alpha += (1 - n.alpha) * 0.06;
        }
      }

      for (let i = 0; i < motifNodes.length; i++) {
        const n = motifNodes[i];
        const targetX = n.hx * W + driftX + parallax.x;
        const targetY = n.hy * H + driftY + parallax.y;
        let fx = (targetX - n.x) * MOTIF_SPRING;
        let fy = (targetY - n.y) * MOTIF_SPRING;
        if (pointer.active) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < radius) {
            // Gentler pull than ambient dots: the shape may brighten near
            // the cursor but must stay recognizable, not distort.
            const force = (1 - dist / radius) * strength * MOTIF_POINTER_FACTOR;
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
        if (revealElapsed >= 0 && n.alpha < 1) {
          const localElapsed = revealElapsed - n.revealDelay;
          if (localElapsed > 0) n.alpha += (1 - n.alpha) * 0.06;
        }
      }

      for (let i = 0; i < glyphNodes.length; i++) {
        const g = glyphNodes[i];
        if (revealElapsed >= 0 && g.alpha < 1) {
          const localElapsed = revealElapsed - g.revealDelay;
          if (localElapsed > 0) g.alpha += (1 - g.alpha) * 0.05;
        }
      }

      drawAmbientNodes();
      drawGlyphs(t);
      drawMotifLines(breath);
      drawMotifNodes(true, breath);

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
      drawAmbientNodes();
      drawGlyphs(0);
      drawMotifLines(0.8);
      drawMotifNodes(false, 0.8);
    }
    function reveal() {
      if (revealed) return;
      revealed = true;
      revealStartTime = performance.now();
      start();
      // Entrance transforms (AnimatedContent/ParticleText) can still be
      // settling when this fires, so the very first safe-zone read may be
      // a little off; one late recompute after they finish corrects it
      // with a smooth spring retarget rather than a visible snap.
      settleTimer = setTimeout(() => {
        const layout = getLayoutInfo();
        buildMotif(false, layout);
        buildGlyphs(false, layout);
      }, 900);
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
      clearTimeout(settleTimer);
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

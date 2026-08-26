import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { useLenis } from '../hooks/useLenis.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

const ScrollContext = createContext(null);

export function ScrollProvider({ children }) {
  const reducedMotion = useReducedMotion();
  const lenisRef = useLenis(!reducedMotion);
  const lockCount = useRef(0);

  const scrollToEl = useCallback(
    (el) => {
      if (!el) return;
      const lenis = lenisRef.current;
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(el, { offset: 0 });
      } else {
        const top = el.getBoundingClientRect().top + (window.pageYOffset || window.scrollY || 0);
        window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    },
    [lenisRef, reducedMotion]
  );

  const lockScroll = useCallback(
    (lock) => {
      lockCount.current = Math.max(0, lockCount.current + (lock ? 1 : -1));
      const shouldLock = lockCount.current > 0;
      try {
        const lenis = lenisRef.current;
        if (lenis) shouldLock ? lenis.stop() : lenis.start();
      } catch {
        /* noop */
      }
      document.body.style.overflow = shouldLock ? 'hidden' : '';
    },
    [lenisRef]
  );

  const value = useMemo(
    () => ({ scrollToEl, lockScroll, reducedMotion }),
    [scrollToEl, lockScroll, reducedMotion]
  );

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}

export function useScroll() {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScroll must be used within ScrollProvider');
  return ctx;
}

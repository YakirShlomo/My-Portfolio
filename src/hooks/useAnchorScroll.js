import { useCallback } from 'react';
import { useScroll } from '../context/ScrollContext.jsx';

/** Same-page hash-anchor scrolling, used only within the Home route tree. */
export function useAnchorScroll() {
  const { scrollToEl } = useScroll();

  return useCallback(
    (id) => (e) => {
      e.preventDefault();
      const target = document.getElementById(id);
      if (!target) return;
      scrollToEl(target);
      if (history.replaceState) history.replaceState(null, '', `#${id}`);
    },
    [scrollToEl]
  );
}

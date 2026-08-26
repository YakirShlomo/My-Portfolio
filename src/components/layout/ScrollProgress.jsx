import { useEffect } from 'react';

const supportsScrollTimeline = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));

export default function ScrollProgress() {
  useEffect(() => {
    if (supportsScrollTimeline) return undefined;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const sy = window.pageYOffset || window.scrollY || 0;
      const p = max > 0 ? Math.min(1, Math.max(0, sy / max)) : 0;
      document.documentElement.style.setProperty('--scroll-progress', p.toFixed(4));
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}

import { useAnchorScroll } from '../../hooks/useAnchorScroll.js';

export default function Footer() {
  const handleAnchor = useAnchorScroll();
  return (
    <footer className="footer">
      <div className="footer__big" aria-hidden="true">
        Yakir Shlomo
      </div>
      <div className="footer__bar">
        <p>&copy; {new Date().getFullYear()} Yakir Shlomo. Built with React &amp; Vite.</p>
        <a href="#home" className="footer__top" onClick={handleAnchor('home')}>
          Back to top
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 13V3M3 7l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </footer>
  );
}

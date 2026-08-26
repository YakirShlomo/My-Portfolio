import { useCallback, useEffect, useState } from 'react';
import { useAnchorScroll } from '../../hooks/useAnchorScroll.js';
import { useScrollSpy, useScrolledState } from '../../hooks/useScrollSpy.js';
import { useScroll } from '../../context/ScrollContext.jsx';
import GooeyNav from '../react-bits/GooeyNav/GooeyNav.jsx';
import MobileNav from './MobileNav.jsx';
import './Navbar.css';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
];
const NAV_IDS = NAV_ITEMS.map((i) => i.id);
const GOOEY_ITEMS = NAV_ITEMS.map((i) => ({ label: i.label, href: `#${i.id}` }));

export default function Navbar() {
  const handleAnchor = useAnchorScroll();
  const scrolled = useScrolledState();
  const activeId = useScrollSpy(NAV_IDS);
  const activeIndex = Math.max(0, NAV_IDS.indexOf(activeId));
  const { lockScroll } = useScroll();
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleMobile() {
    setMobileOpen((open) => {
      lockScroll(!open);
      return !open;
    });
  }
  const closeMobile = useCallback(() => {
    setMobileOpen((open) => {
      if (open) lockScroll(false);
      return false;
    });
  }, [lockScroll]);
  function handleNavClick(id) {
    return (e) => {
      closeMobile();
      handleAnchor(id)(e);
    };
  }

  useEffect(() => {
    if (!mobileOpen) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') closeMobile();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, closeMobile]);

  return (
    <>
      <header className={`navbar${scrolled ? ' is-scrolled' : ''}`}>
        <a href="#home" className="nav-brand" onClick={handleNavClick('home')}>
          <span className="nav-brand__mark">YS</span>
          <span className="nav-brand__text">Yakir&nbsp;Shlomo</span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          <GooeyNav
            items={GOOEY_ITEMS}
            activeIndex={activeIndex}
            animationTime={500}
            particleCount={8}
            particleR={60}
            timeVariance={200}
            onNavigate={(item, index, e) => {
              e.preventDefault();
              handleNavClick(NAV_ITEMS[index].id)(e);
            }}
          />
        </nav>

        <button
          className="nav-toggle"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={toggleMobile}
        >
          <span className={`nav-toggle__bar${mobileOpen ? ' is-open' : ''}`} />
          <span className={`nav-toggle__bar${mobileOpen ? ' is-open' : ''}`} />
        </button>
      </header>

      <MobileNav items={NAV_ITEMS} open={mobileOpen} onNavClick={handleNavClick} onScrimClick={closeMobile} />
    </>
  );
}

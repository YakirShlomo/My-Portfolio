import { useEffect, useRef } from 'react';
import { useGate } from '../../context/GateContext.jsx';
import { useReducedMotion, useIsTouch } from '../../hooks/useReducedMotion.js';
import { useAnchorScroll } from '../../hooks/useAnchorScroll.js';
import DecryptedText from '../../components/react-bits/DecryptedText.jsx';
import ParticleText from '../../components/react-bits/ParticleText/ParticleText.jsx';
import Magnet from '../../components/react-bits/Magnet.jsx';
import AnimatedContent from '../../components/react-bits/AnimatedContent.jsx';
import Icon from '../../components/icons/Icon.jsx';
import HeroSkillDots from './HeroSkillDots.jsx';
import './Hero.css';

const NAME = 'Yakir Shlomo';

export default function Hero() {
  const { unlocked } = useGate();
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouch();
  const handleAnchor = useAnchorScroll();

  const heroRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const hero = heroRef.current;
    if (!hero) return undefined;
    let heroHeight = hero.offsetHeight;
    function update() {
      const sy = window.pageYOffset || window.scrollY || 0;
      const p = heroHeight > 0 ? Math.min(1, Math.max(0, sy / (heroHeight * 0.7))) : 0;
      hero.style.setProperty('--hero-scroll', p.toFixed(4));
    }
    function onResize() {
      heroHeight = hero.offsetHeight;
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', onResize);
    };
  }, [reducedMotion]);

  // Corner-frame parallax: a cheap, purely cosmetic pointer response — the
  // Hero rect is measured once (on mount/resize) rather than on every
  // pointermove, so this never forces a synchronous layout read from a
  // high-frequency event.
  useEffect(() => {
    if (reducedMotion) return undefined;
    const hero = heroRef.current;
    if (!hero) return undefined;
    let rect = hero.getBoundingClientRect();
    function onResize() {
      rect = hero.getBoundingClientRect();
    }
    function onMove(e) {
      const px = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const py = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      hero.style.setProperty('--fpx', px.toFixed(3));
      hero.style.setProperty('--fpy', py.toFixed(3));
    }
    function onLeave() {
      hero.style.setProperty('--fpx', 0);
      hero.style.setProperty('--fpy', 0);
    }
    window.addEventListener('resize', onResize, { passive: true });
    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
    };
  }, [reducedMotion]);

  const magneticDisabled = reducedMotion || isTouch;

  return (
    <section id="home" className="hero" ref={heroRef}>
      <div className="hero__content">
        <div className="hero__float">
          <AnimatedContent distance={24} duration={0.7}>
            <p className="hero__eyebrow">
              <span className="dot" /> Available for work · Israel
            </p>
          </AnimatedContent>

          <h1 className="hero__title">
            <span className="line hero__name">
              {reducedMotion ? (
                <span>{NAME}</span>
              ) : (
                <ParticleText
                  key={unlocked ? 'unlocked' : 'locked'}
                  text={NAME}
                  trigger="mount"
                  color="#f3f3f5"
                  highlightColor="#9adce7"
                  fontFamily="inherit"
                  fontWeight={600}
                  fontSize="clamp(3rem, 11vw, 7.2rem)"
                  particleSize={2}
                  density={2}
                  scatter={140}
                  gatherDuration={1300}
                  stagger={260}
                  pointerRepel={34}
                  repelRadius={100}
                  idleDrift={0.9}
                  glow={false}
                  className="hero__particle-name"
                />
              )}
            </span>
            <span className="line line--accent">
              {reducedMotion ? (
                <span>Software engineer.</span>
              ) : (
                <DecryptedText
                  key={unlocked ? 'unlocked' : 'locked'}
                  text="Software engineer."
                  animateOn={unlocked ? 'view' : 'hover'}
                  sequential
                  revealDirection="start"
                  speed={32}
                  maxIterations={20}
                  characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/_"
                  className="decrypted-char is-revealed"
                  encryptedClassName="decrypted-char is-encrypted"
                />
              )}
            </span>
          </h1>

          <AnimatedContent distance={20} duration={0.7} delay={0.1}>
            <ul className="hero__meta">
              <li>
                <Magnet padding={24} magnetStrength={9} disabled={magneticDisabled} innerClassName="hero__meta-inner">
                  <IconCalendar /> +4 years coding
                </Magnet>
              </li>
              <li>
                <Magnet padding={24} magnetStrength={9} disabled={magneticDisabled} innerClassName="hero__meta-inner">
                  <Icon name="github" size={13} /> 10+ GitHub projects
                </Magnet>
              </li>
            </ul>
          </AnimatedContent>
        </div>

        <AnimatedContent distance={20} duration={0.7} delay={0.2}>
          <div className="hero__cta">
            <Magnet padding={30} magnetStrength={8} disabled={magneticDisabled}>
              <a href="#projects" className="btn btn--primary" onClick={handleAnchor('projects')}>
                <span className="btn__label">View projects</span>
                <span className="btn__icon">
                  <IconArrowDown />
                </span>
              </a>
            </Magnet>
            <Magnet padding={30} magnetStrength={8} disabled={magneticDisabled}>
              <a href="#contact" className="btn btn--ghost" onClick={handleAnchor('contact')}>
                <span className="btn__label">
                  <IconPaperPlane /> Get in touch
                </span>
              </a>
            </Magnet>
          </div>
        </AnimatedContent>
      </div>

      <div className="hero__frames" aria-hidden="true">
        <span className="hero__frame hero__frame--tl">
          <span className="hero__frame__line" />
        </span>
        <span className="hero__frame hero__frame--tr">
          <span className="hero__frame__line" />
        </span>
        <span className="hero__frame hero__frame--bl">
          <span className="hero__frame__line" />
        </span>
        <span className="hero__frame hero__frame--br">
          <span className="hero__frame__line" />
        </span>
      </div>

      <HeroSkillDots heroRef={heroRef} />

      <a href="#about" className="hero__scroll" onClick={handleAnchor('about')} aria-label="Scroll to about">
        <span className="hero__scroll-line">
          <span />
        </span>
        <span className="hero__scroll-text">Scroll</span>
      </a>
    </section>
  );
}

function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 6.5h13M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconArrowDown() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 9l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPaperPlane() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14.5 1.5 1.5 7l4.7 1.8L8 13.5l1.7-3.5 4.8-8.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.2 8.8 14.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

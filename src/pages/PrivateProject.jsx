import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReducedMotion, useIsTouch } from '../hooks/useReducedMotion.js';
import { SOCIAL_LINKS, homeHref } from '../lib/constants.js';
import AnimatedContent from '../components/react-bits/AnimatedContent.jsx';
import Magnet from '../components/react-bits/Magnet.jsx';
import Icon from '../components/icons/Icon.jsx';
import '../components/layout/Navbar.css';
import './PrivateProject.css';

const DEFAULT_NOTE =
  "There's no public demo for this one right now, so I can't link out to it here. I'm glad to walk you through the architecture, the decisions behind it, and the code directly — just reach out.";

const MAX_PARAM_LEN = 300;
const MAX_STACK_ITEMS = 12;

/**
 * Query params are attacker-controlled input (anyone can craft a link).
 * They're only ever rendered as plain JSX text — never dangerouslySetInnerHTML
 * — so React already escapes them against markup injection. This trims,
 * drops control characters and caps length purely to stop absurdly long or
 * malformed values from breaking layout, not to prevent script injection.
 */
function sanitizeParam(value, max = MAX_PARAM_LEN) {
  let clean = '';
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    const isControlChar = code < 32 || code === 127;
    if (!isControlChar) clean += value[i];
  }
  return clean.trim().slice(0, max);
}

export default function PrivateProject() {
  const [params] = useSearchParams();
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouch();
  const magneticDisabled = reducedMotion || isTouch;

  const name = sanitizeParam(params.get('name') || '');
  const tag = sanitizeParam(params.get('tag') || '');
  const stack = sanitizeParam(params.get('stack') || '', 500);
  const note = sanitizeParam(params.get('note') || '', 800);

  const title = name ? `${name} is private` : 'This project is private';
  const noteText = note || (name ? `There’s no public demo for ${name} right now, so I can’t link out to it here. I’m glad to walk you through the architecture, the decisions behind it, and the code directly — just reach out.` : DEFAULT_NOTE);
  const stackList = stack
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_STACK_ITEMS);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = name ? `${name} — Private | Yakir Shlomo` : 'Private project | Yakir Shlomo';

    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    return () => {
      document.title = prevTitle;
      document.head.removeChild(meta);
    };
  }, [name]);

  return (
    <div className="private-page">
      <div className="bg-fx" aria-hidden="true">
        <div className="bg-glow bg-glow--a" />
        <div className="bg-glow bg-glow--b" />
        <div className="bg-grain" />
      </div>

      <header className="navbar">
        <a href={homeHref()} className="nav-brand">
          <span className="nav-brand__mark">YS</span>
          <span className="nav-brand__text">Yakir&nbsp;Shlomo</span>
        </a>
        <a href={homeHref('#projects')} className="btn btn--ghost btn--small">
          <Icon name="external" style={{ transform: 'rotate(225deg)' }} /> All projects
        </a>
      </header>

      <main>
        <section className="private-hero">
          <AnimatedContent distance={16}>
            <div className="private-hero__icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="14" y="28" width="36" height="28" rx="6" stroke="currentColor" strokeWidth="2" />
                <path d="M22 28V20a10 10 0 0 1 20 0v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="32" cy="40" r="3.2" fill="currentColor" />
                <path d="M32 43.2V48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </AnimatedContent>

          <AnimatedContent distance={16} delay={0.05}>
            <p className="private-hero__eyebrow">
              <span className="dot" /> {tag ? `Private access · ${tag}` : 'Private access'}
            </p>
          </AnimatedContent>

          <AnimatedContent distance={16} delay={0.1}>
            <h1 className="private-hero__title">{title}</h1>
          </AnimatedContent>

          <AnimatedContent distance={16} delay={0.15}>
            <p className="private-hero__body">{noteText}</p>
          </AnimatedContent>

          {stackList.length > 0 && (
            <AnimatedContent distance={16} delay={0.2}>
              <ul className="private-hero__stack" aria-label="Technologies used">
                {stackList.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </AnimatedContent>
          )}

          <AnimatedContent distance={16} delay={0.25}>
            <div className="private-hero__cta">
              <Magnet padding={30} magnetStrength={8} disabled={magneticDisabled}>
                <a href={homeHref()} className="btn btn--primary">
                  <span className="btn__label">Back to portfolio</span>
                </a>
              </Magnet>
              <Magnet padding={30} magnetStrength={8} disabled={magneticDisabled}>
                <a href={homeHref('#contact')} className="btn btn--ghost">
                  <span className="btn__label">
                    <Icon name="paperPlane" /> Ask me about it
                  </span>
                </a>
              </Magnet>
            </div>
          </AnimatedContent>
        </section>
      </main>

      <footer className="footer footer--minimal">
        <div className="footer__bar">
          <p>&copy; {new Date().getFullYear()} Yakir Shlomo.</p>
          <div className="private-footer-links">
            <a href={SOCIAL_LINKS.email} aria-label="Email">
              <Icon name="envelope" />
            </a>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Icon name="linkedin" />
            </a>
            <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Icon name="github" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

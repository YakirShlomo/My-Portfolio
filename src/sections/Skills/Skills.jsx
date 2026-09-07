import { useEffect, useMemo, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SKILLS, SKILL_CATEGORIES } from '../../data/projects.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import SplitText from '../../components/react-bits/SplitText.jsx';
import AnimatedContent from '../../components/react-bits/AnimatedContent.jsx';
import './Skills.css';

const GLYPHS = {
  plug: (
    <path d="M6 2v3M10 2v3M4.5 5h7v2.5a3.5 3.5 0 0 1-3.5 3.5v2M8 13v1.5M5.5 10.2A3.5 3.5 0 0 1 4.5 7.5" />
  ),
  aws: <path d="M2 11.5c3.5 1.6 8.5 1.6 12 0M4 6.5l4-2 4 2v3l-4 2-4-2v-3Z" />,
  'user-shield': <path d="M8 8a2.3 2.3 0 1 0 0-4.6A2.3 2.3 0 0 0 8 8Zm0 0c-2.6 0-4.5 1.4-4.5 3.6V13h6M9.5 9.2 13 10.4v2c0 1.6-1.2 2.7-3.5 3.4-2.3-.7-3.5-1.8-3.5-3.4v-.2" />,
  key: <path d="M6 10a3 3 0 1 1 3-3M6 10 2 14M4.2 11.8 5.8 13.4M6.8 10.2 8.6 12" />,
  'shield-halved': <path d="M8 1.5 13 3v5c0 3.5-2.1 5.8-5 6.5V1.5Z" />,
};

export default function Skills() {
  const reducedMotion = useReducedMotion();
  const [category, setCategory] = useState('All');

  const filtered = useMemo(
    () => (category === 'All' ? SKILLS : SKILLS.filter((s) => s.category === category)),
    [category]
  );

  useEffect(() => {
    // Same fix as Projects: filtering remounts the grid (key=category),
    // changing this section's height and staling ScrollTrigger positions
    // for everything further down the page.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [category]);

  return (
    <section id="skills" className="section section--skills">
      <div className="section__head">
        <span className="section__index">02</span>
        {reducedMotion ? (
          <h2 className="section__title">Skills &amp; tools</h2>
        ) : (
          <SplitText text="Skills & tools" tag="h2" className="section__title" splitType="chars" delay={22} />
        )}
      </div>

      <AnimatedContent distance={16}>
        <p className="skills-lead">Grouped the way I actually use them on a project — not an alphabetical tag cloud.</p>
      </AnimatedContent>

      <AnimatedContent distance={16} delay={0.05}>
        <div className="skill-categories">
          {SKILL_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`chip${category === c.id ? ' is-active' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </AnimatedContent>

      <div className="skill-select-mobile">
        <select
          aria-label="Filter skills by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {SKILL_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <AnimatedContent key={category} distance={10} duration={0.5}>
        <div className="skills-grid">
          {filtered.map((skill, i) => (
            <div className="skill-item" key={skill.name} style={{ '--si': i }}>
              {skill.icon ? (
                <img
                  src={`https://cdn.simpleicons.org/${skill.icon}/f2f2f3`}
                  alt={skill.name}
                  className="skill-icon"
                  loading="lazy"
                />
              ) : (
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="skill-icon skill-icon--glyph"
                  aria-hidden="true"
                >
                  {GLYPHS[skill.glyph]}
                </svg>
              )}
              <span>{skill.name}</span>
            </div>
          ))}
        </div>
      </AnimatedContent>
    </section>
  );
}

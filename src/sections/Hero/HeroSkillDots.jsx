import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { useSkillDotsPhysics } from '../../hooks/useSkillDotsPhysics.js';
import './HeroSkillDots.css';

// Fixed, hand-placed normalized positions (not random) so the layout looks
// intentional on first paint — a loose ring following the corner frame
// rather than scattered clutter. hx/hy are fractions of the frame
// rectangle itself (0/0 = frame's top-left corner, 1/1 = bottom-right),
// not of the whole Hero, since the physics loop now confines dots to that
// frame. `compact: true` marks the four kept on narrow viewports, where
// the frame is small — fewer dots rather than a cramped, overlapping set.
//
// Every label here is verified against actual portfolio/CV content, not
// inferred because it "sounds relevant":
// - React, Next.js, Node.js, Supabase: About.jsx FACTS "Stack" line
//   verbatim ("React · Next.js · Node.js · Supabase") — also the four
//   kept for the compact/mobile set for the same reason.
// - TypeScript, MongoDB, GitHub: src/data/projects.js SKILLS array.
// - QA: About.jsx FACTS "Focus" line verbatim ("Full-stack web · QA").
// SQL and "Testing" (previous entries) were dropped — neither appears in
// SKILLS, the About facts, the resume PDF's Skills section, or
// TechMarquee; "QA" is the verbatim term actually used, not "Testing".
const SKILLS = [
  { id: 'react', label: 'React', hx: 0.06, hy: 0.1, compact: true },
  { id: 'nextjs', label: 'Next.js', hx: 0.94, hy: 0.12, compact: true },
  { id: 'nodejs', label: 'Node.js', hx: 0.05, hy: 0.55, compact: true },
  { id: 'supabase', label: 'Supabase', hx: 0.1, hy: 0.9, compact: true },
  { id: 'typescript', label: 'TypeScript', hx: 0.95, hy: 0.52 },
  { id: 'mongodb', label: 'MongoDB', hx: 0.9, hy: 0.88 },
  { id: 'github', label: 'GitHub', hx: 0.5, hy: 0.06 },
  { id: 'qa', label: 'QA', hx: 0.5, hy: 0.94 },
];

const COMPACT_QUERY = '(max-width: 640px)';

function useIsCompact() {
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(COMPACT_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    const onChange = (e) => setCompact(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return compact;
}

export default function HeroSkillDots({ heroRef }) {
  const reducedMotion = useReducedMotion();
  const isCompact = useIsCompact();
  const containerRef = useRef(null);
  const dotRefs = useRef({});

  // Small viewports get the corner-frame area too, but there's little
  // width to spare once the content nearly fills it — fewer, more
  // deliberate dots beat cramming all eight into a thin ring.
  const activeSkills = isCompact ? SKILLS.filter((s) => s.compact) : SKILLS;

  useSkillDotsPhysics({ heroRef, containerRef, dotRefs, dots: activeSkills, reducedMotion });

  return (
    <div className="skill-dots" ref={containerRef}>
      {activeSkills.map((skill, i) => (
        <button
          key={skill.id}
          type="button"
          className="skill-dot"
          data-dot-id={skill.id}
          style={{
            '--pulse-delay': `${((i * 0.53) % 2.6).toFixed(2)}s`,
            '--pulse-duration': `${(2.6 + (i % 3) * 0.35).toFixed(2)}s`,
          }}
          ref={(el) => {
            if (el) dotRefs.current[skill.id] = el;
            else delete dotRefs.current[skill.id];
          }}
          aria-label={`Skill: ${skill.label}`}
        >
          <span className="skill-dot__ring" />
          <span className="skill-dot__core" />
          <span className="skill-dot__label">{skill.label}</span>
        </button>
      ))}
    </div>
  );
}

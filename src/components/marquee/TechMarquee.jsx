import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import LogoLoop from '../react-bits/LogoLoop/LogoLoop.jsx';
import './TechMarquee.css';

const TECHS = [
  { name: 'React', icon: 'react' },
  { name: 'Next.js', icon: 'nextdotjs' },
  { name: 'TypeScript', icon: 'typescript' },
  { name: 'Node.js', icon: 'nodedotjs' },
  { name: 'Supabase', icon: 'supabase' },
  { name: 'PostgreSQL', icon: 'postgresql' },
  { name: 'MongoDB', icon: 'mongodb' },
  { name: 'Tailwind CSS', icon: 'tailwindcss' },
  { name: 'Redis', icon: 'redis' },
];

const LOGOS = TECHS.map((t) => ({
  title: t.name,
  ariaLabel: t.name,
  node: (
    <span className="tech-loop-item">
      <img src={`https://cdn.simpleicons.org/${t.icon}/6fc7d6`} alt="" loading="lazy" />
      <span>{t.name}</span>
    </span>
  ),
}));

export default function TechMarquee() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="marquee" aria-label="Technologies I work with" role="region">
      <LogoLoop
        logos={LOGOS}
        speed={reducedMotion ? 0 : 46}
        direction="left"
        logoHeight={20}
        gap={48}
        fadeOut
        fadeOutColor="#07070a"
        ariaLabel="Technologies I work with"
      />
    </div>
  );
}

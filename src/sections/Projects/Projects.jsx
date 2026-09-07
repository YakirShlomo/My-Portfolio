import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROJECTS, SECONDARY_PROJECTS, PROJECT_CATEGORIES, toPrivateHref } from '../../data/projects.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import SplitText from '../../components/react-bits/SplitText.jsx';
import AnimatedContent from '../../components/react-bits/AnimatedContent.jsx';
import SpotlightCard from '../../components/react-bits/SpotlightCard/SpotlightCard.jsx';
import Icon from '../../components/icons/Icon.jsx';
import './Projects.css';

function ProjectCta({ cta }) {
  if (cta.type === 'external') {
    return (
      <a href={cta.href} className="btn btn--small" target="_blank" rel="noopener noreferrer">
        <Icon name="external" /> Visit site
      </a>
    );
  }
  return (
    <Link to={toPrivateHref(cta)} className="btn btn--small">
      <Icon name="lock" /> Private project
    </Link>
  );
}

function matches(project, category) {
  return category === 'All' || project.categories?.includes(category);
}

export default function Projects() {
  const reducedMotion = useReducedMotion();
  const [category, setCategory] = useState('All');

  const filteredPrimary = useMemo(() => PROJECTS.filter((p) => matches(p, category)), [category]);
  const filteredSecondary = useMemo(
    () => SECONDARY_PROJECTS.filter((p) => matches(p, category)),
    [category]
  );
  const isEmpty = filteredPrimary.length === 0 && filteredSecondary.length === 0;

  useEffect(() => {
    // Every card remounts on filter change (key includes category), which
    // changes .projects-grid's height. Each AnimatedContent card creates its
    // own ScrollTrigger reading the layout at that moment, but sections
    // further down the page (Contact) already have ScrollTrigger instances
    // created once at initial mount, cached against the pre-filter page
    // height. Without a refresh here, a shorter filtered layout leaves those
    // stale — their trigger point can end up beyond the new, shorter
    // scrollable range, so they never fire and stay permanently invisible,
    // blocking the rest of the page. This runs after the new cards' own
    // effects have registered (child effects flush before this one).
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [category]);

  return (
    <section id="projects" className="section section--projects">
      <div className="section__head">
        <span className="section__index">03</span>
        {reducedMotion ? (
          <h2 className="section__title">Projects</h2>
        ) : (
          <SplitText text="Projects" tag="h2" className="section__title" splitType="chars" delay={20} />
        )}
      </div>

      <AnimatedContent distance={16} delay={0.05}>
        <div className="projects-filter" role="group" aria-label="Filter projects by category">
          {PROJECT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`chip${category === c.id ? ' is-active' : ''}`}
              onClick={() => setCategory(c.id)}
              aria-pressed={category === c.id}
            >
              {c.label}
            </button>
          ))}
        </div>
      </AnimatedContent>

      <div className="projects-grid">
        {filteredPrimary.map((p) => (
          <AnimatedContent
            key={`${category}-${p.id}`}
            className={p.featured ? 'projects-grid__featured' : 'projects-grid__item'}
            distance={20}
            duration={0.5}
          >
            <SpotlightCard
              className={`project-card${p.featured ? ' project-card--featured' : ''}`}
              spotlightColor="rgba(111, 199, 214, 0.16)"
            >
              <div className="project-card__cover" aria-hidden="true">
                <span className="project-card__index">{p.index}</span>
                <Icon name={p.icon} size={30} className="project-card__glyph" />
              </div>
              <div className="project-card__body">
                <div className="project-card__meta">
                  <span className="project-card__tag">{p.tag}</span>
                  {p.year && <span className="project-card__year">{p.year}</span>}
                </div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <p className="project-card__highlight">
                  <span className="project-card__highlight-label">Highlight</span>
                  {p.highlight}
                </p>
                <ul className="tech-stack">
                  {p.stack.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <div className="project-card__links">
                  <ProjectCta cta={p.cta} />
                </div>
              </div>
            </SpotlightCard>
          </AnimatedContent>
        ))}
      </div>

      {filteredSecondary.length > 0 && (
        <div className="projects-secondary">
          <AnimatedContent distance={16}>
            <div className="projects-secondary__head">
              <span className="projects-secondary__label">Also worth a look</span>
              <p>Smaller or internal pieces — no public demo, but real work behind each one.</p>
            </div>
          </AnimatedContent>

          {filteredSecondary.map((p) => (
            <AnimatedContent key={`${category}-${p.id}`} distance={16}>
              <SpotlightCard className="project-row" spotlightColor="rgba(111, 199, 214, 0.12)">
                <div className="project-row__cover" aria-hidden="true">
                  <Icon name={p.icon} size={22} />
                </div>
                <div className="project-row__body">
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  {p.stack.length > 0 && (
                    <ul className="tech-stack">
                      {p.stack.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <Link to={toPrivateHref(p.cta)} className="btn btn--small project-row__link">
                  <Icon name="lock" /> Private project
                </Link>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      )}

      {isEmpty && (
        <p className="projects-empty">No projects in this category yet — try another filter.</p>
      )}
    </section>
  );
}

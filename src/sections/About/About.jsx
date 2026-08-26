import { useState } from 'react';
import { useResume } from '../../context/ResumeContext.jsx';
import { useReducedMotion, useIsTouch } from '../../hooks/useReducedMotion.js';
import { asset } from '../../lib/constants.js';
import SplitText from '../../components/react-bits/SplitText.jsx';
import AnimatedContent from '../../components/react-bits/AnimatedContent.jsx';
import TiltedCard from '../../components/react-bits/TiltedCard/TiltedCard.jsx';
import Magnet from '../../components/react-bits/Magnet.jsx';
import Icon from '../../components/icons/Icon.jsx';
import CertificatesModal from '../../components/modals/CertificatesModal.jsx';
import './About.css';

const FACTS = [
  { k: 'Focus', v: 'Full-stack web · QA' },
  { k: 'Studying', v: 'Software Engineering · SCE College' },
  { k: 'Stack', v: 'React · Next.js · Node.js · Supabase' },
  { k: 'Based in', v: 'Israel' },
];

export default function About() {
  const { openResume } = useResume();
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouch();
  const [certsOpen, setCertsOpen] = useState(false);

  return (
    <section id="about" className="section section--about">
      <div className="section__head">
        <span className="section__index">01</span>
        {reducedMotion ? (
          <h2 className="section__title">About me</h2>
        ) : (
          <SplitText text="About me" tag="h2" className="section__title" splitType="chars" delay={28} />
        )}
      </div>

      <div className="about-grid">
        <div className="about-copy">
          <AnimatedContent distance={20}>
            <p className="about-lead">
              I&rsquo;m Yakir Shlomo, a fourth-year software engineering student at SCE College. My fascination with
              computers started early — always wondering how the websites, games and tools I used were actually
              made, then trying to build them myself.
            </p>
          </AnimatedContent>

          <AnimatedContent distance={20} delay={0.05}>
            <div className="about-text">
              <p>
                This site is where I keep the projects I&rsquo;ve shipped so far — a working snapshot of what I care
                about. I&rsquo;m driven by deepening what I know, sharpening how I build, and getting ideas all the
                way to done.
              </p>
              <p>
                The goal: grow into a full-stack developer who builds responsive, efficient web apps, and a game
                developer who designs immersive, engaging experiences — and find the seams where those two worlds
                meet.
              </p>
              <p>
                My approach is simple. Find a field you genuinely like, then push it as far as you can — keep
                developing your skills, your thinking, your range. &ldquo;Knowledge is power.&rdquo;
              </p>
              <p>
                If you&rsquo;re after someone dedicated, creative and serious about the craft — look through the
                projects below, then let&rsquo;s talk.
              </p>
            </div>
          </AnimatedContent>

          <AnimatedContent distance={20} delay={0.1}>
            <ul className="about-facts">
              {FACTS.map((f) => (
                <li key={f.k}>
                  <span className="k">{f.k}</span>
                  <span className="v">{f.v}</span>
                </li>
              ))}
            </ul>
          </AnimatedContent>
        </div>

        <AnimatedContent distance={24} className="about-portrait">
          {isTouch || reducedMotion ? (
            <div className="about-portrait__frame about-portrait__frame--static">
              <img src={asset('assets/portrait.png')} alt="Portrait of Yakir Shlomo" loading="lazy" />
              <span className="about-portrait__glow" aria-hidden="true" />
            </div>
          ) : (
            <div className="about-portrait__frame">
              <TiltedCard
                imageSrc={asset('assets/portrait.png')}
                altText="Portrait of Yakir Shlomo"
                containerHeight="100%"
                containerWidth="100%"
                imageHeight="100%"
                imageWidth="100%"
                scaleOnHover={1.03}
                rotateAmplitude={9}
                showMobileWarning={false}
                showTooltip={false}
              />
              <span className="about-portrait__glow" aria-hidden="true" />
            </div>
          )}
          <Magnet padding={70} magnetStrength={5} disabled={reducedMotion || isTouch}>
            <button className="btn btn--ghost about-portrait__resume" onClick={openResume}>
              <span className="btn__label">
                <Icon name="doc" /> Resume
              </span>
            </button>
          </Magnet>
          <Magnet padding={70} magnetStrength={5} disabled={reducedMotion || isTouch}>
            <button
              className="btn btn--ghost btn--small about-portrait__certs"
              onClick={() => setCertsOpen(true)}
            >
              <span className="btn__label">
                <Icon name="folder" /> Certificates
              </span>
            </button>
          </Magnet>
        </AnimatedContent>
      </div>

      <CertificatesModal isOpen={certsOpen} onClose={() => setCertsOpen(false)} />
    </section>
  );
}

import { GateProvider, useGate } from '../context/GateContext.jsx';
import { ResumeProvider } from '../context/ResumeContext.jsx';
import EntryGate from '../components/gate/EntryGate.jsx';
import ResumeModal from '../components/modals/ResumeModal.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import ScrollProgress from '../components/layout/ScrollProgress.jsx';
import BackgroundFX from '../components/layout/BackgroundFX.jsx';
import TechMarquee from '../components/marquee/TechMarquee.jsx';
import Hero from '../sections/Hero/Hero.jsx';
import About from '../sections/About/About.jsx';
import Skills from '../sections/Skills/Skills.jsx';
import Projects from '../sections/Projects/Projects.jsx';
import Contact from '../sections/Contact/Contact.jsx';

function HomeContent() {
  const { setUnlocked } = useGate();

  return (
    <ResumeProvider>
      <EntryGate onUnlock={() => setUnlocked(true)} />
      <ScrollProgress />
      <BackgroundFX />
      <Navbar />
      <main>
        <Hero />
        <TechMarquee />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>
      <Footer />
      <ResumeModal />
    </ResumeProvider>
  );
}

export default function Home() {
  return (
    <GateProvider>
      <HomeContent />
    </GateProvider>
  );
}

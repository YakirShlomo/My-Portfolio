export function toPrivateHref({ name, tag, stack, note }) {
  const params = new URLSearchParams();
  if (name) params.set('name', name);
  if (tag) params.set('tag', tag);
  if (stack) params.set('stack', stack);
  if (note) params.set('note', note);
  return `/private-project?${params.toString()}`;
}

export const PROJECT_CATEGORIES = [
  { id: 'All', label: 'All' },
  { id: 'Full-stack', label: 'Full-stack' },
  { id: 'Client sites', label: 'Client sites' },
  { id: 'Private/Internal', label: 'Private/Internal' },
  { id: 'Creative', label: 'Creative' },
  { id: 'Mobile/Cloud', label: 'Mobile/Cloud' },
];

export const PROJECTS = [
  {
    id: 'tula-y',
    image: 'images/projects/tula-y.webp',
    index: '01',
    icon: 'layer-group',
    tag: 'Client site · Event design',
    year: null,
    featured: true,
    categories: ['Client sites'],
    title: 'Tula.y',
    description:
      'A Hebrew website for an event-design studio, showcasing wedding styling, bridal bouquets, table arrangements and celebrations in central and southern Israel.',
    highlight:
      'A public home for the Tula event-design brand, bringing its services and visual identity together in one place.',
    stack: [],
    cta: { type: 'external', href: 'https://tula-y.com' },
  },
  {
    id: 'event-inventory',
    image: 'images/projects/event-inventory.webp',
    index: '02',
    icon: 'boxes-stacked',
    tag: 'Full-stack · Automation',
    year: '2026',
    categories: ['Full-stack', 'Private/Internal'],
    title: 'Tula Inventory',
    description:
      'A full-stack system for event businesses to manage inventory, expenses and profit — stock levels update automatically as bookings move, with a Telegram bot for on-the-go control.',
    highlight:
      'Automated inventory sync plus a Telegram bot and iCloud Calendar (CalDAV) integration — real operational tooling, not just a CRUD dashboard.',
    stack: ['React', 'TypeScript', 'Supabase', 'PostgreSQL', 'Telegram Bot API', 'CalDAV'],
    cta: {
      type: 'private',
      name: 'Tula Inventory',
      tag: 'Full-stack · Automation',
      stack: 'React, TypeScript, Supabase, PostgreSQL, Telegram Bot API, CalDAV',
      note: 'This was built for a client’s internal operations, so I can’t host a public demo or share source access here. I’m glad to walk you through the architecture and the decisions behind it directly.',
    },
  },
  {
    id: 'taxfolder',
    image: 'images/projects/taxfolder.webp',
    index: '03',
    icon: 'file-invoice-dollar',
    tag: 'SaaS · Full-stack',
    year: '2026',
    categories: ['Full-stack'],
    title: 'TaxFolder',
    description:
      'A multi-tenant platform for accounting firms to manage clients, monthly financial documents and secure communication — with dedicated roles for Admins, Accountants and Clients.',
    highlight:
      'Three-tier role-based access with real-time chat and secure document handling, built for firms that actually run their business on it.',
    stack: ['Next.js', 'React', 'TypeScript', 'Supabase', 'PostgreSQL', 'Redis'],
    cta: { type: 'external', href: 'https://taxfolder-omega.vercel.app/' },
  },
  {
    id: 'house-helper',
    image: 'images/projects/house-helper.webp',
    index: '04',
    icon: 'house-chimney',
    tag: 'Mobile · Cloud infra',
    year: '2025',
    categories: ['Mobile/Cloud', 'Private/Internal'],
    title: 'House-Helper',
    description:
      'A household management app for families — shared tasks, live shopping lists, bill tracking and durable timers, backed by a production-style cloud architecture rather than a single server.',
    highlight:
      'Event-driven microservices on AWS EKS with Kafka and Temporal for durable workflows — infrastructure most side projects never touch.',
    stack: ['Flutter', 'Go', 'PostgreSQL', 'Kafka', 'Temporal', 'AWS EKS'],
    cta: {
      type: 'private',
      name: 'House-Helper',
      tag: 'Mobile · Cloud infra',
      stack: 'Flutter, Go, PostgreSQL, Kafka, Temporal, AWS EKS',
      note: 'House-Helper is still in active development and hasn’t been deployed publicly yet, so there’s no live demo to share here. I’m glad to walk you through the architecture directly.',
    },
  },
  {
    id: 'snapmywedding',
    image: 'images/projects/snapmywedding.webp',
    index: '05',
    icon: 'images',
    tag: 'Full-stack · Media',
    year: '2025',
    categories: ['Full-stack'],
    title: 'SnapMyWedding',
    description:
      'A shared gallery for weddings and events — guests upload photos and videos straight from their phones, no app required, and everyone leaves with the full set afterward.',
    highlight:
      'Direct-to-S3 upload pipeline with progress tracking, retry on failure and file validation — built to survive dozens of guests uploading at once.',
    stack: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'AWS S3'],
    cta: { type: 'external', href: 'https://snapmywedding.onrender.com/' },
  },
  {
    id: 'travel-with-tal',
    image: 'images/projects/travel-with-tal.webp',
    index: '06',
    icon: 'umbrella-beach',
    tag: 'Client site · Full-stack',
    year: null,
    categories: ['Client sites'],
    title: 'Travel-With-Tal',
    description:
      'A Hebrew, fully RTL marketing and booking site built for an independent travel agent — vacation packages, a client portfolio and direct lead capture, live for a real small business.',
    highlight:
      'Real client work, not a template: a polished, production RTL site for a business owner who now runs her lead flow through it.',
    stack: ['React', 'TypeScript', 'Vite'],
    cta: { type: 'external', href: 'https://travel-with-tal.vercel.app/' },
  },
];

export const SECONDARY_PROJECTS = [
  {
    id: 'tula-build',
    image: 'images/projects/tula-build.webp',
    icon: 'diagram-project',
    categories: ['Private/Internal'],
    title: 'Tula Build',
    description:
      'An internal system in the same "Tula" product line as my event-management work — live in production, access is password-protected for its users.',
    stack: ['React', 'TypeScript'],
    cta: {
      type: 'private',
      name: 'Tula Build',
      tag: 'Internal system · Full-stack',
      stack: 'React, TypeScript',
      note: 'Tula Build is live in production, but it’s password-protected for its users, so there’s no public demo to share here. I’m glad to walk you through it directly.',
    },
  },
  {
    id: 'star-wars-scene',
    image: 'images/projects/star-wars-scene.webp',
    icon: 'clapperboard',
    categories: ['Creative'],
    title: 'Star Wars — cinematic scene',
    description:
      'A real-time recreation of a classic Star Wars moment in Unreal Engine 5, focused on lighting, composition and the small details that carry a visual story.',
    stack: ['Unreal Engine 5', 'Blender'],
    cta: {
      type: 'private',
      name: 'Star Wars — Cinematic Scene',
      tag: 'Unreal Engine 5 · Cinematic',
      stack: 'Unreal Engine 5, Blender',
      note: 'This is an Unreal Engine project file rather than a web app, so there’s nothing to host as a live demo here. I’m glad to share a walkthrough video or the project directly.',
    },
  },
];

export const SKILL_CATEGORIES = [
  { id: 'All', label: 'All' },
  { id: 'Frontend', label: 'Frontend' },
  { id: 'Backend', label: 'Backend & APIs' },
  { id: 'Data', label: 'Data & Cloud' },
  { id: 'Security', label: 'Auth & Security' },
  { id: 'Systems', label: 'Systems & Tools' },
  { id: 'Creative', label: 'Creative range' },
];

export const SKILLS = [
  { name: 'React', category: 'Frontend', icon: 'react' },
  { name: 'Next.js', category: 'Frontend', icon: 'nextdotjs' },
  { name: 'TypeScript', category: 'Frontend', icon: 'typescript' },
  { name: 'JavaScript', category: 'Frontend', icon: 'javascript' },
  { name: 'Tailwind CSS', category: 'Frontend', icon: 'tailwindcss' },
  { name: 'HTML5', category: 'Frontend', icon: 'html5' },
  { name: 'CSS3', category: 'Frontend', icon: 'css' },

  { name: 'Node.js', category: 'Backend', icon: 'nodedotjs' },
  { name: 'Express.js', category: 'Backend', icon: 'express' },
  { name: 'REST APIs', category: 'Backend', glyph: 'plug' },
  { name: 'Edge Functions', category: 'Backend', icon: 'supabase' },

  { name: 'PostgreSQL', category: 'Data', icon: 'postgresql' },
  { name: 'Supabase', category: 'Data', icon: 'supabase' },
  { name: 'MongoDB', category: 'Data', icon: 'mongodb' },
  { name: 'AWS S3', category: 'Data', glyph: 'aws', glyphBrand: true },
  { name: 'Redis', category: 'Data', icon: 'redis' },

  { name: 'Supabase Auth', category: 'Security', glyph: 'user-shield' },
  { name: 'JWT', category: 'Security', icon: 'jsonwebtokens' },
  { name: 'OAuth2', category: 'Security', glyph: 'key' },
  { name: 'Row-Level Security', category: 'Security', glyph: 'shield-halved' },

  { name: 'C++', category: 'Systems', icon: 'cplusplus' },
  { name: 'Git', category: 'Systems', icon: 'git' },
  { name: 'GitHub', category: 'Systems', icon: 'github' },
  { name: 'Linux', category: 'Systems', icon: 'linux' },

  { name: 'Unreal Engine 5', category: 'Creative', icon: 'unrealengine' },
  { name: 'Blender', category: 'Creative', icon: 'blender' },
];

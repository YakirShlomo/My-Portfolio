export const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '');

/**
 * Home URL, always with a trailing slash before the base path — a real
 * anchor href, not a router <Link>. react-router's basename-joining
 * intentionally collapses `to="/"` to the bare basename (no trailing
 * slash: e.g. "/repo-name" instead of "/repo-name/"), which 404s on
 * a hard reload against a static host. Since navigating from the private
 * project page back to Home is already meant to be a fresh load (the
 * entry gate re-arms every load by design), a plain anchor is the
 * correct fix here, not a workaround: it produces the canonical
 * trailing-slash URL and needs no router quirks to reason about.
 */
export const homeHref = (hash = '') => import.meta.env.BASE_URL + hash;

export const EMAIL = 'shlomoyakir00@gmail.com';

export const CONTACT_LINKS = [
  {
    id: 'email',
    label: 'Email',
    value: EMAIL,
    href: `mailto:${EMAIL}`,
    icon: 'envelope',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    value: '+972 52-464-2361',
    href: 'https://wa.me/972524642361',
    icon: 'whatsapp',
    external: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    value: 'in/yakir-shlomo',
    href: 'https://www.linkedin.com/in/yakir-shlomo/',
    icon: 'linkedin',
    external: true,
  },
  {
    id: 'github',
    label: 'GitHub',
    value: '@YakirShlomo',
    href: 'https://github.com/YakirShlomo',
    icon: 'github',
    external: true,
  },
];

export const SOCIAL_LINKS = {
  github: 'https://github.com/YakirShlomo',
  linkedin: 'https://www.linkedin.com/in/yakir-shlomo/',
  email: `mailto:${EMAIL}`,
};

export const RESUME_PDF = asset('assets/resume.pdf');

/**
 * Static first-page preview, used on mobile instead of the native <object>
 * PDF embed (mobile browsers' inline PDF plugins don't reliably fit-to-
 * width and can clip the page). Regenerate this whenever resume.pdf
 * changes — see the "Updating the resume preview image" note in
 * ResumeModal.jsx for the exact command.
 */
export const RESUME_PREVIEW = asset('assets/resume-preview.webp');

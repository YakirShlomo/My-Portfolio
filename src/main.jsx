import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/reset.css';
import './styles/global.css';
import App from './App.jsx';

// Belt-and-braces: the inline <head> script already sets this as early as
// possible; repeating it here costs nothing and covers any environment
// where that first script didn't run.
if ('scrollRestoration' in history) {
  try {
    history.scrollRestoration = 'manual';
  } catch {
    /* noop */
  }
}
window.scrollTo(0, 0);

// Restore the path GitHub Pages' 404.html redirect fallback carried along,
// before the router reads window.location for the first time.
(function restoreRedirectedPath() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (redirect == null) return;
  const base = import.meta.env.BASE_URL;
  const target = base + redirect.replace(/^\//, '');
  history.replaceState(null, '', target);
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

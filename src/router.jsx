import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home.jsx'));
const PrivateProject = lazy(() => import('./pages/PrivateProject.jsx'));

function withSuspense(element) {
  return <Suspense fallback={<div className="route-fallback" />}>{element}</Suspense>;
}

export const router = createBrowserRouter(
  [
    { path: '/', element: withSuspense(<Home />) },
    { path: '/private-project', element: withSuspense(<PrivateProject />) },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' }
);

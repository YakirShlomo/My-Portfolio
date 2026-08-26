import { RouterProvider } from 'react-router-dom';
import { ScrollProvider } from './context/ScrollContext.jsx';
import { router } from './router.jsx';

export default function App() {
  return (
    <ScrollProvider>
      <RouterProvider router={router} />
    </ScrollProvider>
  );
}

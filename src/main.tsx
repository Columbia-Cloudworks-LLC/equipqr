
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App.tsx'
import './index.css'

// Import pages
import AuthPage from './pages/Auth.tsx';
import InvitationPage from './pages/InvitationPage.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/invitation/:token',
    element: <InvitationPage />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);

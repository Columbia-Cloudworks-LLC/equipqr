
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <OrganizationProvider>
            <NotificationsProvider>
              <AppRoutes />
            </NotificationsProvider>
          </OrganizationProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;


import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { QueryClientProvider } from '@/contexts/QueryClient';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import AppRoutes from '@/routes/AppRoutes';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { TeamManagementProvider } from '@/contexts/TeamManagementContext';
import { ReactivationBanner } from '@/components/Auth/ReactivationBanner';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="equipqr-theme">
        <QueryClientProvider>
          <Toaster />
          <AuthProvider>
            <OrganizationProvider>
              <NotificationsProvider>
                <TeamManagementProvider value={{}}>
                  <div className="min-h-screen bg-background">
                    <ReactivationBanner />
                    <AppRoutes />
                  </div>
                </TeamManagementProvider>
              </NotificationsProvider>
            </OrganizationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

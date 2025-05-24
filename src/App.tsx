import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
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
          <Toaster position="top-right" />
          <AuthProvider>
            <OrganizationProvider>
              <NotificationsProvider>
                <TeamManagementProvider>
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

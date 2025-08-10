
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { SimpleOrganizationProvider } from '@/contexts/SimpleOrganizationContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppSidebar from '@/components/layout/AppSidebar';
import TopBar from '@/components/layout/TopBar';
import { useSimpleOrganization } from '@/hooks/useSimpleOrganization';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Equipment from '@/pages/Equipment';
import EquipmentDetails from '@/pages/EquipmentDetails';
import WorkOrders from '@/pages/WorkOrders';
import WorkOrderDetails from '@/pages/WorkOrderDetails';
import Teams from '@/pages/Teams';
import TeamDetails from '@/pages/TeamDetails';
import FleetMap from '@/pages/FleetMap';
import Organization from '@/pages/Organization';
import QRScanner from '@/pages/QRScanner';
import QRRedirect from '@/pages/QRRedirect';
import Billing from '@/pages/Billing';
import Settings from '@/pages/Settings';
import Reports from '@/pages/Reports';
import Support from '@/pages/Support';
import InvitationAccept from '@/pages/InvitationAccept';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import LegalFooter from '@/components/layout/LegalFooter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const BrandedTopBar = () => {
  return <TopBar />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
        <UserProvider>
          <SessionProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/invitation/:token" element={<InvitationAccept />} />
                <Route path="/qr/:equipmentId" element={<QRRedirect />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                
                {/* Protected routes */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <SimpleOrganizationProvider>
                      <TeamProvider>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar />
                          <SidebarInset className="flex-1 min-w-0">
                            <BrandedTopBar />
                            <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto min-w-0">
                              <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/equipment" element={<Equipment />} />
                                <Route path="/equipment/:equipmentId" element={<EquipmentDetails />} />
                                <Route path="/work-orders" element={<WorkOrders />} />
                                <Route path="/work-orders/:workOrderId" element={<WorkOrderDetails />} />
                                <Route path="/teams" element={<Teams />} />
                                <Route path="/teams/:teamId" element={<TeamDetails />} />
                                <Route path="/fleet-map" element={<FleetMap />} />
                                <Route path="/organization" element={<Organization />} />
                                <Route path="/scanner" element={<QRScanner />} />
                      <Route path="/billing" element={<Billing />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/support" element={<Support />} />
                              </Routes>
                            </main>
                            <LegalFooter />
                          </SidebarInset>
                        </div>
                        </SidebarProvider>
                      </TeamProvider>
                    </SimpleOrganizationProvider>
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </SessionProvider>
        </UserProvider>
      </AuthProvider>
      <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { DataMigrationProvider } from '@/components/migration/DataMigrationProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Dashboard from '@/pages/Dashboard';
import Equipment from '@/pages/Equipment';
import EquipmentDetails from '@/pages/EquipmentDetails';
import WorkOrders from '@/pages/WorkOrders';
import Teams from '@/pages/Teams';
import FleetMap from '@/pages/FleetMap';
import Organization from '@/pages/Organization';
import QRScanner from '@/pages/QRScanner';
import Billing from '@/pages/Billing';
import Settings from '@/pages/Settings';
import Reports from '@/pages/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <SessionProvider>
            <DataMigrationProvider>
              <Router>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <main className="flex-1 p-6 lg:p-8 overflow-auto">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/equipment" element={<Equipment />} />
                        <Route path="/equipment/:equipmentId" element={<EquipmentDetails />} />
                        <Route path="/work-orders" element={<WorkOrders />} />
                        <Route path="/teams" element={<Teams />} />
                        <Route path="/fleet-map" element={<FleetMap />} />
                        <Route path="/organization" element={<Organization />} />
                        <Route path="/scanner" element={<QRScanner />} />
                        <Route path="/billing" element={<Billing />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/reports" element={<Reports />} />
                      </Routes>
                    </main>
                  </div>
                </SidebarProvider>
              </Router>
            </DataMigrationProvider>
          </SessionProvider>
        </UserProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;


import { Routes, Route } from 'react-router-dom';
import { AppProviders } from '@/components/providers/AppProviders';
import { TeamProvider } from '@/contexts/TeamContext';
import { SimpleOrganizationProvider } from '@/contexts/SimpleOrganizationProvider'; // Fixed import path
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppSidebar from '@/components/layout/AppSidebar';
import TopBar from '@/components/layout/TopBar';

import { Navigate, useParams } from 'react-router-dom';
import Auth from '@/pages/Auth';
import SmartLanding from '@/components/landing/SmartLanding';
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
import PMTemplates from '@/pages/PMTemplates';
import InvitationAccept from '@/pages/InvitationAccept';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import LegalFooter from '@/components/layout/LegalFooter';


const BrandedTopBar = () => {
  return <TopBar />;
};

// Redirect components for backward compatibility
const RedirectToEquipment = () => {
  const { equipmentId } = useParams();
  return <Navigate to={`/dashboard/equipment/${equipmentId}`} replace />;
};

const RedirectToWorkOrder = () => {
  const { workOrderId } = useParams();
  return <Navigate to={`/dashboard/work-orders/${workOrderId}`} replace />;
};

function App() {
  return (
    <AppProviders>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<SmartLanding />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/support" element={<Support />} />
                <Route path="/invitation/:token" element={<InvitationAccept />} />
                <Route path="/qr/:equipmentId" element={<QRRedirect />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                
                {/* Redirect routes for backward compatibility */}
                <Route path="/equipment/:equipmentId" element={
                  <ProtectedRoute>
                    <SimpleOrganizationProvider>
                      <RedirectToEquipment />
                    </SimpleOrganizationProvider>
                  </ProtectedRoute>
                } />
                <Route path="/work-orders/:workOrderId" element={
                  <ProtectedRoute>
                    <SimpleOrganizationProvider>
                      <RedirectToWorkOrder />
                    </SimpleOrganizationProvider>
                  </ProtectedRoute>
                } />
                
                {/* Protected routes */}
                <Route path="/dashboard/*" element={
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
                                <Route path="/pm-templates" element={<PMTemplates />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/reports" element={<Reports />} />
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
    </AppProviders>
  );
}

export default App;


import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppProviders } from '@/components/providers/AppProviders';
import { TeamProvider } from '@/contexts/TeamContext';
import { SimpleOrganizationProvider } from '@/contexts/SimpleOrganizationProvider'; // Fixed import path
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Critical components loaded eagerly to prevent loading issues for unauthenticated users
import Auth from '@/pages/Auth';
import SmartLanding from '@/components/landing/SmartLanding';
import DebugAuth from '@/pages/DebugAuth';

// Dashboard components can be lazy-loaded since they're only needed after auth
const AppSidebar = lazy(() => import('@/components/layout/AppSidebar'));
const TopBar = lazy(() => import('@/components/layout/TopBar'));
const LegalFooter = lazy(() => import('@/components/layout/LegalFooter'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Equipment = lazy(() => import('@/pages/Equipment'));
const EquipmentDetails = lazy(() => import('@/pages/EquipmentDetails'));
const WorkOrders = lazy(() => import('@/pages/WorkOrders'));
const WorkOrderDetails = lazy(() => import('@/pages/WorkOrderDetails'));
const Teams = lazy(() => import('@/pages/Teams'));
const TeamDetails = lazy(() => import('@/pages/TeamDetails'));
const FleetMap = lazy(() => import('@/pages/FleetMap'));
const Organization = lazy(() => import('@/pages/Organization'));
const QRScanner = lazy(() => import('@/pages/QRScanner'));
const QRRedirect = lazy(() => import('@/pages/QRRedirect'));
const Billing = lazy(() => import('@/pages/Billing'));
const Settings = lazy(() => import('@/pages/Settings'));
const Reports = lazy(() => import('@/pages/Reports'));
const Support = lazy(() => import('@/pages/Support'));
const PMTemplates = lazy(() => import('@/pages/PMTemplates'));
const InvitationAccept = lazy(() => import('@/pages/InvitationAccept'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));


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
        {/* Public routes - no suspense needed, loaded eagerly */}
        <Route path="/" element={<SmartLanding />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/debug-auth" element={<DebugAuth />} />
        
        {/* Other public routes with suspense for lazy loading */}
        <Route path="/support" element={<Suspense fallback={<div>Loading...</div>}><Support /></Suspense>} />
        <Route path="/invitation/:token" element={<Suspense fallback={<div>Loading...</div>}><InvitationAccept /></Suspense>} />
        <Route path="/qr/:equipmentId" element={<Suspense fallback={<div>Loading...</div>}><QRRedirect /></Suspense>} />
        <Route path="/terms-of-service" element={<Suspense fallback={<div>Loading...</div>}><TermsOfService /></Suspense>} />
        <Route path="/privacy-policy" element={<Suspense fallback={<div>Loading...</div>}><PrivacyPolicy /></Suspense>} />

          {/* Redirect routes for backward compatibility */}
          <Route
            path="/equipment/:equipmentId"
            element={
              <ProtectedRoute>
                <SimpleOrganizationProvider>
                  <RedirectToEquipment />
                </SimpleOrganizationProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/work-orders/:workOrderId"
            element={
              <ProtectedRoute>
                <SimpleOrganizationProvider>
                  <RedirectToWorkOrder />
                </SimpleOrganizationProvider>
              </ProtectedRoute>
            }
          />

          {/* Protected routes with suspense for dashboard components */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <SimpleOrganizationProvider>
                  <TeamProvider>
                    <SidebarProvider>
                      <Suspense fallback={
                        <div className="min-h-screen flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading dashboard...</p>
                          </div>
                        </div>
                      }>
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
                      </Suspense>
                    </SidebarProvider>
                  </TeamProvider>
                </SimpleOrganizationProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
    </AppProviders>
  );
}

export default App;

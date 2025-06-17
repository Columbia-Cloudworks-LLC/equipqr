
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { UserProvider } from "@/contexts/UserContext";
import { TeamProvider } from "@/contexts/TeamContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppSidebar from "@/components/layout/AppSidebar";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Equipment from "@/pages/Equipment";
import EquipmentDetails from "@/pages/EquipmentDetails";
import WorkOrders from "@/pages/WorkOrders";
import WorkOrderDetails from "@/pages/WorkOrderDetails";
import Teams from "@/pages/Teams";
import TeamDetails from "@/pages/TeamDetails";
import FleetMap from "@/pages/FleetMap";
import Organization from "@/pages/Organization";
import QRScanner from "@/pages/QRScanner";
import Billing from "@/pages/Billing";
import Settings from "@/pages/Settings";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <UserProvider>
                <SessionProvider>
                  <OrganizationProvider>
                    <TeamProvider>
                      <SettingsProvider>
                        <SidebarProvider>
                          <AppSidebar />
                          <SidebarInset>
                            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                              <SidebarTrigger className="-ml-1" />
                            </header>
                            <div className="flex flex-1 flex-col gap-4 p-4">
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
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </div>
                          </SidebarInset>
                          <Toaster />
                        </SidebarProvider>
                      </SettingsProvider>
                    </TeamProvider>
                  </OrganizationProvider>
                </SessionProvider>
              </UserProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

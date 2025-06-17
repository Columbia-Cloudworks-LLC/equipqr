
import { Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { UserProvider } from "@/contexts/UserContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import AppSidebar from "@/components/layout/AppSidebar";
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
    <UserProvider>
      <OrganizationProvider>
        <SettingsProvider>
          <SidebarProvider>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <main className="flex-1 overflow-auto p-6">
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
              </main>
            </div>
            <Toaster />
          </SidebarProvider>
        </SettingsProvider>
      </OrganizationProvider>
    </UserProvider>
  );
}

export default App;

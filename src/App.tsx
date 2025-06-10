
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import WorkOrders from "./pages/WorkOrders";
import Teams from "./pages/Teams";
import FleetMap from "./pages/FleetMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <main className="flex-1 flex flex-col">
              <div className="border-b px-4 py-2">
                <SidebarTrigger />
              </div>
              <div className="flex-1 p-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/equipment" element={<Equipment />} />
                  <Route path="/work-orders" element={<WorkOrders />} />
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/fleet-map" element={<FleetMap />} />
                  {/* Placeholder routes for future pages */}
                  <Route path="/organization" element={<div>Organization page coming soon...</div>} />
                  <Route path="/scanner" element={<div>QR Scanner page coming soon...</div>} />
                  <Route path="/billing" element={<div>Billing page coming soon...</div>} />
                  <Route path="/settings" element={<div>Settings page coming soon...</div>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

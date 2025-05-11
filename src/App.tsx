import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Pages
import Index from "./pages/Index";
import Equipment from "./pages/Equipment";
import EquipmentDetail from "./pages/EquipmentDetail";
import EquipmentForm from "./pages/EquipmentForm";
import TeamManagement from "./pages/TeamManagement";
import InvitationPage from "./pages/InvitationPage";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Profile from "./pages/Profile";
import MyInvitations from "./pages/MyInvitations";

// Component to handle hash fragments in root URL
const RootRouteHandler = () => {
  useEffect(() => {
    const handleRootRedirect = async () => {
      // Check if we have an access token in the URL hash
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log("Root: Detected auth hash fragment, redirecting to callback handler");
        // Redirect to the callback handler with the hash intact
        window.location.href = `/auth/callback${window.location.hash}`;
        return;
      }
    };

    handleRootRedirect();
  }, []);

  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Public route for invitation acceptance */}
              <Route path="/invitation/:token" element={<InvitationPage />} />
              
              {/* New My Invitations page */}
              <Route
                path="/my-invitations"
                element={
                  <ProtectedRoute>
                    <MyInvitations />
                  </ProtectedRoute>
                }
              />
              
              {/* Special case for equipment scanned via QR code - can be accessed anonymously */}
              <Route path="/equipment/:id" element={<EquipmentDetail />} />
              
              {/* Root route with special handler for auth redirects */}
              <Route
                path="/"
                element={
                  <>
                    <RootRouteHandler />
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  </>
                }
              />
              
              {/* Protected routes */}
              <Route
                path="/equipment"
                element={
                  <ProtectedRoute>
                    <Equipment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipment/:id/qr"
                element={
                  <ProtectedRoute>
                    <EquipmentDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipment/:id/edit"
                element={
                  <ProtectedRoute>
                    <EquipmentForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipment/new"
                element={
                  <ProtectedRoute>
                    <EquipmentForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team"
                element={
                  <ProtectedRoute>
                    <TeamManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              
              {/* Scanner URL - for direct QR scanning */}
              <Route
                path="/scanner"
                element={
                  <ProtectedRoute>
                    <EquipmentDetail />
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

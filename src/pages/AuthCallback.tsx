
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/contexts/NotificationsContext";
import { toast } from "sonner";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [processingAuth, setProcessingAuth] = useState(true);
  const navigate = useNavigate();
  const { refreshNotifications } = useNotifications();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Processing auth callback...");
        setProcessingAuth(true);
        
        // Process the OAuth callback or email confirmation
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error in auth callback:", error);
          setError(error.message);
          return;
        }

        if (!data.session) {
          console.error("No session in auth callback");
          setError("Authentication failed. No session received.");
          return;
        }

        console.log("Auth successful, session established");
        
        // Wait briefly for auth state to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh notifications AFTER successful authentication
        console.log("Refreshing notifications after successful auth");
        try {
          await refreshNotifications();
          console.log("Notifications refreshed successfully");
        } catch (notifError) {
          console.error("Failed to refresh notifications:", notifError);
          // Don't block the auth flow if notifications fail
        }

        // Check if there was an invitation redirect stored
        const invitationPath = sessionStorage.getItem('invitationPath');
        
        if (invitationPath) {
          console.log(`Redirecting to invitation path: ${invitationPath}`);
          // Clear the stored path
          sessionStorage.removeItem('invitationPath');
          
          // Redirect back to the invitation page
          toast.success("Signed in successfully", {
            description: "Now you can accept the invitation"
          });
          navigate(invitationPath);
        } else {
          // Default redirect to home
          console.log("Redirecting to home page");
          toast.success("Signed in successfully");
          navigate("/");
        }
      } catch (err: any) {
        console.error("Unexpected error in auth callback:", err);
        setError(err.message);
      } finally {
        setProcessingAuth(false);
      }
    };

    handleAuthCallback();
  }, [navigate, refreshNotifications]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate("/auth")}
            className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Authenticating...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        {!processingAuth && <p className="mt-4 text-muted-foreground">Refreshing notifications...</p>}
      </div>
    </div>
  );
}

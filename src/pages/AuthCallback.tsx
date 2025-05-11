
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Process the OAuth callback or email confirmation
        const { error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error in auth callback:", error);
          setError(error.message);
          return;
        }

        // Check if there was an invitation redirect stored
        const invitationPath = sessionStorage.getItem('invitationPath');
        
        if (invitationPath) {
          // Clear the stored path
          sessionStorage.removeItem('invitationPath');
          
          // Redirect back to the invitation page
          navigate(invitationPath);
        } else {
          // Default redirect to home
          navigate("/");
        }
      } catch (err: any) {
        console.error("Error in auth callback:", err);
        setError(err.message);
      }
    };

    handleAuthCallback();
  }, [navigate]);

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
      </div>
    </div>
  );
}

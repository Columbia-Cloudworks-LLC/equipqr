
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log("AuthCallback: Processing authentication callback");
        
        // Check for access token in hash fragment (Google auth often returns this way)
        if (location.hash && location.hash.includes('access_token')) {
          console.log("AuthCallback: Found access token in hash fragment");
          
          // Extract the hash without the # character
          const hashParams = new URLSearchParams(
            location.hash.substring(1)
          );
          
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const expiresIn = hashParams.get('expires_in');
          
          if (accessToken) {
            console.log("AuthCallback: Setting session from hash fragment");
            // Set the session using the extracted tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
              expires_in: parseInt(expiresIn || '3600'),
            });
            
            if (error) throw error;
            navigate('/');
            return;
          }
        }
        
        // Standard path for normal redirects 
        console.log("AuthCallback: Using standard getSession flow");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        console.log("AuthCallback: Session retrieved successfully", !!data.session);
        navigate('/');
      } catch (error: any) {
        console.error("AuthCallback Error:", error);
        toast.error(error.message || 'Authentication error');
        navigate('/auth');
      }
    };

    handleOAuthCallback();
  }, [navigate, location]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Completing sign in</h2>
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
}

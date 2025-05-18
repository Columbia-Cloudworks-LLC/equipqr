
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component to handle authentication redirects
 * Redirects logged in users back to the app
 */
export function AuthRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, isLoading } = useAuth();
  
  // Get returnTo path from location state
  const state = location.state as { returnTo?: string; message?: string } | undefined;
  const returnPath = state?.returnTo || '/';
  const message = state?.message;
  
  useEffect(() => {
    // Only proceed after auth state is determined
    if (!isLoading) {
      if (session) {
        // User is authenticated, redirect them
        console.log(`User is authenticated, redirecting to ${returnPath}`);
        
        // Show message if provided
        if (message) {
          toast.success('Authenticated', {
            description: 'You are now signed in'
          });
        }
        
        navigate(returnPath, { replace: true });
      } else if (message) {
        // Show the message for unauthenticated users
        toast.error('Authentication Required', {
          description: message
        });
      }
    }
  }, [session, isLoading, navigate, returnPath, message]);
  
  // Return null since this is just a redirect component
  return null;
}

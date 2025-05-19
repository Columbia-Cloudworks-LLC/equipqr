
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
  const { user, session, isLoading, checkSession } = useAuth();
  
  // Get returnTo path from location state or localStorage
  const state = location.state as { returnTo?: string; message?: string } | undefined;
  const storedReturnPath = localStorage.getItem('authReturnTo');
  const returnPath = state?.returnTo || storedReturnPath || '/';
  const message = state?.message;
  
  useEffect(() => {
    // Helper to handle a successful authentication
    const handleAuthenticated = async () => {
      console.log(`User is authenticated, redirecting to ${returnPath}`);
      
      // Validate session before redirecting
      const isValidSession = await checkSession();
      
      if (!isValidSession) {
        console.error('Session validation failed in AuthRedirect');
        toast.error('Session Error', {
          description: 'There was an issue with your authentication. Please try signing in again.'
        });
        return;
      }
      
      // Clear stored return path
      localStorage.removeItem('authReturnTo');
      
      // Show success message
      toast.success('Authenticated', {
        description: message || 'You are now signed in'
      });
      
      // Include state to indicate coming from auth (useful for equipment form)
      navigate(returnPath, { 
        replace: true,
        state: { fromAuth: true }
      });
    };
    
    // Only proceed after auth state is determined
    if (!isLoading) {
      if (session) {
        // User is authenticated, redirect them
        handleAuthenticated();
      } else if (message) {
        // Show the message for unauthenticated users
        toast.error('Authentication Required', {
          description: message
        });
      }
    }
  }, [session, isLoading, navigate, returnPath, message, checkSession]);
  
  // Return null since this is just a redirect component
  return null;
}

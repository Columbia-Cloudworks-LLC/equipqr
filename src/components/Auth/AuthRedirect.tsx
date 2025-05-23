
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { AuthRecovery } from './AuthRecovery';
import { AuthLoadingState } from './AuthLoadingState';

/**
 * Component to handle authentication redirects
 * Redirects logged in users back to the app
 */
export function AuthRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [showLoading, setShowLoading] = useState(false);
  
  // Get returnTo path from location state or localStorage
  const state = location.state as { 
    returnTo?: string; 
    message?: string;
    isInvitation?: boolean;
  } | undefined;
  
  const storedReturnPath = localStorage.getItem('authReturnTo');
  // Check for invitation path first, as it has priority
  const invitationPath = sessionStorage.getItem('invitationPath');
  const returnPath = invitationPath || state?.returnTo || storedReturnPath || '/';
  const message = state?.message;
  
  // Only proceed with redirect logic when on a non-auth page or explicitly requested
  const shouldPerformRedirect = !location.pathname.includes('/auth') || (state && state.returnTo);
  
  useEffect(() => {
    // Only show loading state after a short delay
    // This prevents flashing for fast auth processes
    const timer = setTimeout(() => {
      if ((isLoading || authStatus !== 'success') && shouldPerformRedirect) {
        setShowLoading(true);
      }
    }, 500); // Increased from 300ms to 500ms to reduce flicker
    
    return () => clearTimeout(timer);
  }, [isLoading, authStatus, shouldPerformRedirect]);
  
  useEffect(() => {
    // Skip redirect logic when on auth pages unless explicitly requested via state
    if (!shouldPerformRedirect) {
      return;
    }

    // Helper to handle a successful authentication
    const handleAuthenticated = async () => {
      console.log(`User is authenticated, redirecting to ${returnPath}`);
      
      // Clear stored return path
      localStorage.removeItem('authReturnTo');
      
      // Brief success state before redirecting
      setAuthStatus('success');
      
      // Force invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      
      // Add a slight delay to show the success state
      setTimeout(() => {
        // Navigate to the return path
        navigate(returnPath, { 
          replace: true,
          state: { 
            fromAuth: true,
            refreshSession: true
          }
        });
      }, 500);
    };
    
    // Only proceed after auth state is determined
    if (!isLoading) {
      if (session) {
        // User is authenticated, redirect
        handleAuthenticated();
      } else if (message) {
        // Show the message for unauthenticated users
      }
    }
  }, [
    session, isLoading, navigate, returnPath, message, 
    queryClient, invitationPath, shouldPerformRedirect, location.pathname
  ]);

  // Handle retry from recovery component
  const handleRetry = async () => {
    setShowRecovery(false);
    setAuthStatus('processing');
    
    // Force refresh auth state by reloading the page
    window.location.href = '/auth';
  };
  
  // If showing recovery UI
  if (showRecovery) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
        <AuthRecovery 
          message={recoveryError || "There was a problem with your authentication."}
          onRetry={handleRetry}
        />
      </div>
    );
  }
  
  // Show the loading state if we're still working
  if (showLoading && shouldPerformRedirect) {
    return (
      <AuthLoadingState 
        status={authStatus}
        message={
          authStatus === 'processing' 
            ? 'Setting up your account and checking invitations...' 
            : 'Sign in successful! Redirecting you now...'
        }
        userEmail={user?.email}
        errorMessage={recoveryError || undefined}
      />
    );
  }
  
  // Return null when not showing UI components
  return null;
}

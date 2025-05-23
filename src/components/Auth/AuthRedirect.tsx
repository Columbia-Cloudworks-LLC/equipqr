
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  const { user, session, isLoading, checkSession } = useAuth();
  const queryClient = useQueryClient();
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [authStatus, setAuthStatus] = useState<'processing' | 'verifying' | 'repairing' | 'success' | 'error'>('processing');
  const [showLoading, setShowLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<string | undefined>();
  
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
      console.log(`User is authenticated, verifying session before redirecting to ${returnPath}`);
      setAuthStatus('verifying');
      setVerificationStep('Testing API access with current session');
      
      try {
        // Use direct session check
        const isValidSession = await checkSession();
        
        if (!isValidSession) {
          console.error('Session API verification failed in AuthRedirect');
          
          // Increment attempt counter
          setVerificationAttempt(prev => prev + 1);
          
          if (verificationAttempt >= 2) {
            // After 2 attempts, show recovery UI
            setRecoveryError('Session could not be verified after multiple attempts');
            setShowRecovery(true);
            setAuthStatus('error');
            return;
          }
          
          setAuthStatus('error');
          return;
        }
        
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
          // Show success message
          toast.success('Authenticated', {
            description: message || 'You are now signed in'
          });
          
          // Navigate to the return path
          navigate(returnPath, { 
            replace: true,
            state: { 
              fromAuth: true,
              refreshSession: true
            }
          });
        }, 1000);
      } catch (error) {
        console.error('Error handling authentication redirect:', error);
        setRecoveryError('Failed to complete sign-in process due to a technical error');
        setShowRecovery(true);
        setAuthStatus('error');
      }
    };
    
    // Only proceed after auth state is determined
    if (!isLoading) {
      if (session) {
        // User is authenticated, verify session before redirecting
        handleAuthenticated();
      } else if (message) {
        // Show the message for unauthenticated users
        toast.error('Authentication Required', {
          description: message
        });
      }
    }
  }, [
    session, isLoading, navigate, returnPath, message, 
    queryClient, invitationPath, verificationAttempt, checkSession,
    shouldPerformRedirect, location.pathname
  ]);

  // Handle retry from recovery component
  const handleRetry = async () => {
    setShowRecovery(false);
    setVerificationAttempt(0);
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
            : authStatus === 'verifying'
              ? 'Verifying your authentication with the server...'
              : authStatus === 'repairing'
                ? 'Repairing authentication tokens...'
                : 'Sign in successful! Redirecting you now...'
        }
        userEmail={user?.email}
        errorMessage={recoveryError || undefined}
        verificationStep={verificationStep}
        verificationAttempt={verificationAttempt + 1}
      />
    );
  }
  
  // Return null when not showing UI components
  return null;
}

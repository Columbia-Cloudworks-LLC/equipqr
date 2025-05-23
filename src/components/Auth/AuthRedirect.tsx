
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
  const { user, session, isLoading, checkSession, repairSession } = useAuth();
  const queryClient = useQueryClient();
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairAttempts, setRepairAttempts] = useState(0);
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
  
  useEffect(() => {
    // Show loading state after a short delay
    // This prevents flashing for fast auth processes
    const timer = setTimeout(() => {
      if (isLoading || isRepairing) {
        setShowLoading(true);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [isLoading, isRepairing]);
  
  useEffect(() => {
    // Helper to handle a successful authentication
    const handleAuthenticated = async () => {
      console.log(`User is authenticated, redirecting to ${returnPath}`);
      setAuthStatus('processing');
      
      try {
        // Show loading state since we're processing post-auth steps
        setShowLoading(true);
        
        // Validate session before redirecting
        const isValidSession = await checkSession();
        
        if (!isValidSession) {
          console.error('Session validation failed in AuthRedirect');
          
          // If we've already attempted repair, show recovery UI
          if (repairAttempts > 0) {
            setRecoveryError('Authentication session could not be validated even after repair attempts');
            setShowRecovery(true);
            setAuthStatus('error');
            return;
          }
          
          // Try to repair session
          setIsRepairing(true);
          setRepairAttempts(prev => prev + 1);
          
          const repaired = await repairSession();
          if (repaired) {
            toast.info('Authentication storage was repaired, checking session again');
            // Re-check session after repair
            const isValidAfterRepair = await checkSession();
            if (!isValidAfterRepair) {
              // Still not valid after repair
              setRecoveryError('Session remains invalid after storage repair');
              setShowRecovery(true);
              setAuthStatus('error');
              return;
            }
          } else {
            // No repairs made
            toast.error('Session Error', {
              description: 'There was an issue with your authentication. Please try signing in again.'
            });
            setShowRecovery(true);
            setAuthStatus('error');
            return;
          }
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
      } finally {
        setIsRepairing(false);
      }
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
  }, [
    session, isLoading, navigate, returnPath, message, 
    checkSession, queryClient, repairAttempts, invitationPath,
    repairSession
  ]);

  // Handle retry from recovery component
  const handleRetry = async () => {
    setShowRecovery(false);
    setRepairAttempts(prev => prev + 1);
    setAuthStatus('processing');
    
    // Force refresh auth state
    await checkSession();
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
  if (showLoading) {
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

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { clearEquipmentCache } from '@/services/equipment/equipmentListService';
import { clearTeamCache } from '@/services/team/retrieval/teamCache';
import { useQueryClient } from '@tanstack/react-query';
import { repairSessionStorage } from '@/utils/storage';
import { AuthRecovery } from './AuthRecovery';

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
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairAttempts, setRepairAttempts] = useState(0);
  
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
    // Helper to handle a successful authentication
    const handleAuthenticated = async () => {
      console.log(`User is authenticated, redirecting to ${returnPath}`);
      
      try {
        // First attempt to repair any storage inconsistencies
        await repairSessionStorage();
        
        // Validate session before redirecting
        const isValidSession = await checkSession();
        
        if (!isValidSession) {
          console.error('Session validation failed in AuthRedirect');
          
          // If we've already attempted repair, show recovery UI
          if (repairAttempts > 0) {
            setRecoveryError('Authentication session could not be validated even after repair attempts');
            setShowRecovery(true);
            return;
          }
          
          // Try to repair storage
          setIsRepairing(true);
          setRepairAttempts(prev => prev + 1);
          
          const repaired = await repairSessionStorage();
          if (repaired) {
            toast.info('Authentication storage was repaired, checking session again');
            // Re-check session after repair
            const isValidAfterRepair = await checkSession();
            if (!isValidAfterRepair) {
              // Still not valid after repair
              setRecoveryError('Session remains invalid after storage repair');
              setShowRecovery(true);
              return;
            }
          } else {
            // No repairs made
            toast.error('Session Error', {
              description: 'There was an issue with your authentication. Please try signing in again.'
            });
            setShowRecovery(true);
            return;
          }
        }
        
        // Clear stored return path
        localStorage.removeItem('authReturnTo');
        
        // Clear invitation path if it exists
        if (invitationPath) {
          console.log('Found invitation path, redirecting to:', invitationPath);
          // Keep the path in storage until redirection completes
        } else {
          // Only clear if we're not going to an invitation
          sessionStorage.removeItem('invitationPath');
        }
        
        // Force clear all caches to ensure fresh data
        clearEquipmentCache();
        clearTeamCache();
        queryClient.invalidateQueries({ queryKey: ['equipment'] });
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        
        console.log('Cleared all caches before redirecting from auth');
        
        // Show success message
        toast.success('Authenticated', {
          description: message || 'You are now signed in'
        });
        
        // Include state to indicate coming from auth (useful for equipment form)
        navigate(returnPath, { 
          replace: true,
          state: { 
            fromAuth: true,
            refreshSession: true // Add flag to indicate session should be refreshed
          }
        });
      } catch (error) {
        console.error('Error handling authentication redirect:', error);
        setRecoveryError('Failed to complete sign-in process due to a technical error');
        setShowRecovery(true);
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
  }, [session, isLoading, navigate, returnPath, message, checkSession, queryClient, repairAttempts, invitationPath]);

  // Handle retry from recovery component
  const handleRetry = async () => {
    setShowRecovery(false);
    setRepairAttempts(prev => prev + 1);
    
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
  
  // Return null since this is just a redirect component
  return null;
}

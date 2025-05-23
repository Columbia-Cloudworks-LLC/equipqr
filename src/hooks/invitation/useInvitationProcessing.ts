
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useInvitationAcceptance } from './useInvitationAcceptance';
import { debounce } from '@/utils/edgeFunctions/retry';

// Create debounced version of the session refresh
const debouncedRefreshSession = debounce(async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data;
}, 1500);

/**
 * Hook for handling invitation processing related logic
 */
export function useInvitationProcessing() {
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [acceptedSuccessfully, setAcceptedSuccessfully] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const [sessionCheckAttempt, setSessionCheckAttempt] = useState(0);
  const [authVerified, setAuthVerified] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { user, checkSession } = useAuth();
  const { acceptInvitation } = useInvitationAcceptance();

  /**
   * Refreshes the auth session to ensure valid tokens for API calls
   */
  const refreshAuthSession = useCallback(async () => {
    try {
      if (isRefreshing) {
        console.log("Auth session refresh already in progress");
        return false;
      }
      
      setIsRefreshing(true);
      console.log("Forcing auth session refresh");
      
      // First, check if we have a valid session
      const isValid = await checkSession();
      if (!isValid) {
        console.error("No valid session found, redirecting to login");
        setIsRefreshing(false);
        return false;
      }
      
      // Then refresh to get a new token using debounced function
      try {
        const { session } = await debouncedRefreshSession();
        
        if (session) {
          console.log("Session refreshed successfully, token:", session.access_token.substring(0, 10) + '...');
          setAuthVerified(true);
          setIsRefreshing(false);
          return true;
        }
      } catch (refreshError: any) {
        if (refreshError.message?.includes('429') || refreshError.status === 429) {
          console.warn('Rate limit detected during session refresh');
          toast.warning("Rate limit detected", {
            description: "Please wait a moment before trying again"
          });
        } else {
          console.error("Error refreshing session:", refreshError);
          toast.error("Authentication error", {
            description: "Could not refresh your session. Please try logging out and in again."
          });
        }
        setIsRefreshing(false);
        return false;
      }
      
      setIsRefreshing(false);
      return false;
    } catch (err) {
      console.error("Error in refreshAuthSession:", err);
      setIsRefreshing(false);
      return false;
    }
  }, [checkSession, isRefreshing]);

  /**
   * Process an invitation token of a specific type
   */
  const processInvitation = useCallback(async (token: string, invitationType: 'team' | 'organization' = 'team') => {
    if (!user) {
      const errorMsg = 'You must be logged in to accept invitations';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      // Refresh the auth session before processing
      const sessionRefreshed = await refreshAuthSession();
      if (!sessionRefreshed) {
        const errorMsg = 'Failed to refresh authentication session';
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      console.log(`Processing ${invitationType} invitation with token: ${token.substring(0, 8)}...`);
      
      // Use the acceptance hook to process the invitation
      const result = await acceptInvitation(token, invitationType);
      
      if (result && result.success) {
        setAcceptedSuccessfully(true);
        console.log('Invitation accepted successfully:', result);
        return result;
      } else {
        console.error('Failed to accept invitation:', result?.error);
        setProcessingError(result?.error || 'Failed to process invitation');
        return result || { success: false, error: 'Unknown error occurred' };
      }
    } catch (error: any) {
      console.error('Error processing invitation:', error);
      setProcessingError(error.message || 'An unexpected error occurred');
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }, [user, refreshAuthSession, acceptInvitation]);

  /**
   * Redirects to auth page with invitation context
   */
  const redirectToAuth = useCallback((invitationPath: string, invitationType: string = 'team') => {
    // Store the current invitation URL in session storage for redirect after auth
    sessionStorage.setItem('invitationPath', invitationPath);
    sessionStorage.setItem('invitationType', invitationType);
    
    navigate("/auth", { 
      state: { 
        returnTo: invitationPath,
        message: "Please sign in or create an account to accept this invitation",
        isInvitation: true,
        invitationType
      }
    });
  }, [navigate]);

  return {
    processingError,
    setProcessingError,
    acceptedSuccessfully,
    setAcceptedSuccessfully,
    waitingForAuth,
    setWaitingForAuth,
    sessionCheckAttempt,
    setSessionCheckAttempt,
    authVerified,
    setAuthVerified,
    refreshAuthSession,
    redirectToAuth,
    processInvitation,
    isRefreshing
  };
}

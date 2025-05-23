
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { InvitationType } from '@/types/invitations';
import { useInvitationAcceptance } from '@/hooks/invitation/useInvitationAcceptance';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useInvitationError } from '@/hooks/invitation/useInvitationError';
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useInvitationHandling(token: string) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshNotifications } = useNotificationsSafe();
  const { refreshOrganizations } = useOrganization();
  const { handleInvitationError } = useInvitationError();
  const [acceptedSuccessfully, setAcceptedSuccessfully] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastAttemptType, setLastAttemptType] = useState<InvitationType | null>(null);

  const { 
    acceptingInvitation, 
    error: acceptError,
    isRateLimited: acceptRateLimited,
    acceptInvitation 
  } = useInvitationAcceptance();

  const handleAcceptInvitation = useCallback(async (token: string, detectedType?: string) => {
    if (!user) {
      toast.error("You must be logged in to accept invitations");
      
      // Save invitation info and redirect to login
      const typeParam = detectedType === 'organization' ? '?type=organization' : '';
      const invitationPath = `/invitation/${token}${typeParam}`;
      
      // Store the invitation path for redirection after login
      sessionStorage.setItem('invitationPath', invitationPath);
      sessionStorage.setItem('invitationType', detectedType || 'team');
      
      navigate("/auth", { 
        state: { 
          returnTo: invitationPath,
          message: "Please sign in or create an account to accept this invitation",
          isInvitation: true,
          invitationType: detectedType
        }
      });
      return;
    }

    try {
      // Reset rate limited state before attempting acceptance
      setLastAttemptType(detectedType as InvitationType);
      
      // Force a session refresh before accepting the invitation
      console.log('Refreshing authentication session before accepting invitation');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        throw new Error("Could not refresh your authentication session. Please try logging out and in again.");
      }
      
      console.log(`Accepting invitation: ${token.substring(0, 8)}... (Type: ${detectedType})`);
      
      // Use the detected type for acceptance
      const result = await acceptInvitation(token, detectedType as InvitationType);
      
      if (result && result.success) {
        console.log("Invitation accepted successfully:", result);
        setAcceptedSuccessfully(true);
        toast.success("Invitation accepted successfully!");
        
        // Explicitly refresh data with retry logic
        let refreshAttempts = 0;
        const maxRefreshAttempts = 3;
        
        const attemptRefresh = async () => {
          try {
            refreshAttempts++;
            console.log(`Refreshing data attempt ${refreshAttempts}/${maxRefreshAttempts}`);
            await Promise.all([
              refreshNotifications(),
              refreshOrganizations()
            ]);
            console.log("Data refreshed successfully after invitation acceptance");
            
            // Navigate to the appropriate page based on invitation type
            if (detectedType === 'organization') {
              navigate('/organization');
            } else {
              navigate('/teams');
            }
          } catch (error) {
            console.error("Error refreshing data:", error);
            if (refreshAttempts < maxRefreshAttempts) {
              console.log(`Retrying refresh in ${refreshAttempts * 1000}ms`);
              setTimeout(attemptRefresh, refreshAttempts * 1000);
            }
          }
        };
        
        // Start the refresh process
        attemptRefresh();
      } else {
        console.error("Invitation acceptance failed:", result);
        setProcessingError(result.error || "Failed to accept invitation. Please try again.");
        
        // Check if this was a rate limit error
        if (result.error?.includes('rate limit') || result.error?.includes('too many requests')) {
          // This will be handled by the parent component
          return { rateLimit: true, error: result.error };
        }
        
        // If this is likely a wrong type error, try the other type
        if (retryCount < 1 && 
            (result.error?.includes('not found') || 
             result.error?.includes('invalid') ||
             result.error?.includes('406'))) {
          
          const alternateType = detectedType === 'team' ? 'organization' : 'team';
          setRetryCount(count => count + 1);
          
          console.log(`Trying alternate invitation type: ${alternateType}`);
          setTimeout(() => {
            acceptInvitation(token, alternateType as InvitationType)
              .then(altResult => {
                if (altResult && altResult.success) {
                  console.log("Invitation accepted successfully with alternate type:", altResult);
                  setAcceptedSuccessfully(true);
                  toast.success("Invitation accepted successfully!");
                  
                  if (alternateType === 'organization') {
                    navigate('/organization');
                  } else {
                    navigate('/teams');
                  }
                }
              })
              .catch(altError => {
                console.error("Alternative acceptance also failed:", altError);
              });
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Error in handleAcceptInvitation:', error);
      handleInvitationError(error);
      setProcessingError(error.message || "An unexpected error occurred");
      
      // Check for rate limiting
      if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
        return { rateLimit: true, error: error.message };
      }
    }
    
    return { success: acceptedSuccessfully };
  }, [user, navigate, acceptInvitation, retryCount, refreshNotifications, refreshOrganizations, acceptedSuccessfully, handleInvitationError]);

  return {
    acceptingInvitation,
    acceptError,
    acceptRateLimited,
    processingError,
    setProcessingError,
    acceptedSuccessfully,
    setAcceptedSuccessfully,
    handleAcceptInvitation,
    lastAttemptType
  };
}

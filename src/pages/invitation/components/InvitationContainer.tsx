import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvitationValidation } from '@/hooks/invitation/useInvitationValidation';
import { useInvitationAcceptance } from '@/hooks/invitation/useInvitationAcceptance';
import { useInvitationProcessing } from '@/hooks/invitation/useInvitationProcessing';
import { useInvitationError } from '@/hooks/invitation/useInvitationError';
import { InvitationStateRenderer } from './InvitationStateRenderer';
import { SessionHandler } from '@/components/Invitation/SessionHandler';
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { InvitationType } from '@/types/invitations';
import { useInvitationState } from './useInvitationState';

interface InvitationContainerProps {
  token: string;
  initialInvitationType: InvitationType;
}

export const InvitationContainer: React.FC<InvitationContainerProps> = ({ 
  token, 
  initialInvitationType 
}) => {
  const navigate = useNavigate();
  const { refreshNotifications } = useNotificationsSafe();
  const { refreshOrganizations } = useOrganization();
  const { handleInvitationError } = useInvitationError();
  
  // Use custom hooks for state management
  const {
    isRateLimited,
    setIsRateLimited,
    retryCount, 
    setRetryCount,
    lastAttemptType, 
    setLastAttemptType
  } = useInvitationState();
  
  // Custom hooks for invitation handling
  const { 
    isValidating, 
    isValid, 
    error, 
    invitation, 
    isAuthLoading, 
    user,
    rateLimited: validationRateLimited,
    invitationType: detectedType
  } = useInvitationValidation(token, initialInvitationType);
  
  const { 
    acceptInvitation, 
    isAccepting, 
    error: acceptError,
    rateLimited: acceptRateLimited 
  } = useInvitationAcceptance();
  
  const {
    processingError, setProcessingError,
    acceptedSuccessfully, setAcceptedSuccessfully,
    waitingForAuth, setWaitingForAuth,
    sessionCheckAttempt, setSessionCheckAttempt,
    authVerified, setAuthVerified,
    refreshAuthSession, redirectToAuth
  } = useInvitationProcessing();

  // Log detected invitation type changes
  useEffect(() => {
    console.log(`InvitationContainer: Detected invitation type is ${detectedType}`);
  }, [detectedType]);
  
  // Handle rate limiting detection
  useEffect(() => {
    if (validationRateLimited || acceptRateLimited) {
      setIsRateLimited(true);
    } else {
      setIsRateLimited(false);
    }
  }, [validationRateLimited, acceptRateLimited, setIsRateLimited]);

  // Session handling for invitation
  useEffect(() => {
    console.log(`Invitation page loaded for token: ${token.substring(0, 8)}... (Type: ${initialInvitationType})`);
    console.log('Invitation status:', {
      isValidating,
      isValid,
      hasError: Boolean(error),
      isAuthLoading,
      isAccepting,
      hasAcceptError: Boolean(acceptError),
      invitation,
      isAuthenticated: !!user,
      isRateLimited,
      detectedType
    });
    
    // When the page loads, check if we need to wait for authentication
    if (!user && !isAuthLoading) {
      console.log("User not authenticated but invitation exists - waiting for authentication");
      setWaitingForAuth(true);
    } else if (user && waitingForAuth) {
      console.log("User now authenticated - can proceed with invitation");
      setWaitingForAuth(false);
      // Force a session refresh when the user becomes authenticated
      refreshAuthSession();
    } else if (user && !authVerified && !isAuthLoading) {
      // If user is logged in but we haven't verified the auth yet
      refreshAuthSession();
    }
  }, [token, initialInvitationType, isValidating, isValid, error, isAuthLoading, 
      isAccepting, acceptError, invitation, user, waitingForAuth, refreshAuthSession, authVerified, detectedType]);

  // Combine errors for display
  useEffect(() => {
    if (acceptError) {
      setProcessingError(acceptError);
    } else if (error) {
      setProcessingError(error);
    } else {
      setProcessingError(null);
    }
  }, [error, acceptError, setProcessingError]);

  // Refresh notifications after successful invitation validation
  useEffect(() => {
    if (isValid && invitation && !isValidating && !isAuthLoading) {
      refreshNotifications();
    }
  }, [isValid, invitation, isValidating, isAuthLoading, refreshNotifications]);
  
  // Refresh data when invitation is successfully accepted
  useEffect(() => {
    if (acceptedSuccessfully) {
      const refreshData = async () => {
        console.log("Invitation accepted, refreshing data...");
        try {
          await refreshNotifications();
          await refreshOrganizations();
        } catch (err) {
          console.error("Error refreshing data after invitation acceptance:", err);
        }
      };
      
      refreshData();
    }
  }, [acceptedSuccessfully, refreshNotifications, refreshOrganizations]);

  // Handle invitation acceptance
  const handleAcceptInvitation = async () => {
    if (!user) {
      toast.error("You must be logged in to accept invitations");
      setWaitingForAuth(true);
      
      // Save invitation info and redirect to login
      const typeParam = detectedType === 'organization' ? '?type=organization' : '';
      const invitationPath = `/invitation/${token}${typeParam}`;
      redirectToAuth(invitationPath, detectedType);
      return;
    }

    try {
      // Reset rate limited state before attempting acceptance
      setIsRateLimited(false);
      setLastAttemptType(detectedType);
      
      // Force a session refresh before accepting the invitation
      const refreshSuccessful = await refreshAuthSession();
      
      if (!refreshSuccessful) {
        throw new Error("Could not refresh your authentication session. Please try logging out and in again.");
      }
      
      console.log(`Accepting invitation: ${token.substring(0, 8)}... (Type: ${detectedType})`);
      
      if (invitation && invitation.email && user.email) {
        console.log(`Current user: ${user.email}, Invitation for: ${invitation.email}`);
      }
      
      // Use the detected type for acceptance
      const result = await acceptInvitation(token, detectedType);
      
      if (result && result.success) {
        handleSuccessfulAcceptance(result);
      } else {
        handleFailedAcceptance(result);
      }
    } catch (error: any) {
      console.error('Error in handleAcceptInvitation:', error);
      handleInvitationError(error);
      setProcessingError(error.message || "An unexpected error occurred");
      
      // Check for rate limiting
      if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
        setIsRateLimited(true);
      }
    }
  };

  const handleSuccessfulAcceptance = (result: any) => {
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
  };

  const handleFailedAcceptance = (result: any) => {
    console.error("Invitation acceptance failed:", result);
    setProcessingError(result.error || "Failed to accept invitation. Please try again.");
    
    // Check if this was a rate limit error
    if (result.error?.includes('rate limit') || result.error?.includes('too many requests')) {
      setIsRateLimited(true);
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
        acceptInvitation(token, alternateType)
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
  };

  // Function to handle manual retry after rate limiting
  const handleRetryAfterRateLimit = () => {
    setIsRateLimited(false);
    // Wait a moment before retrying
    setTimeout(() => {
      if (isValid && invitation) {
        handleAcceptInvitation();
      } else {
        // Refresh the page to start over
        window.location.reload();
      }
    }, 2000);
  };

  return (
    <>
      <SessionHandler
        token={token}
        searchParams={null}
        waitingForAuth={waitingForAuth}
        setWaitingForAuth={setWaitingForAuth}
        sessionCheckAttempt={sessionCheckAttempt}
        setSessionCheckAttempt={setSessionCheckAttempt}
        setAuthVerified={setAuthVerified}
        invitationType={initialInvitationType}
      />
      
      <InvitationStateRenderer
        waitingForAuth={waitingForAuth}
        isRateLimited={isRateLimited}
        isValidating={isValidating}
        isAuthLoading={isAuthLoading}
        processingError={processingError}
        isValid={isValid}
        invitation={invitation}
        token={token}
        detectedType={detectedType}
        onRetry={handleRetryAfterRateLimit}
        onAccept={handleAcceptInvitation}
      />
    </>
  );
};

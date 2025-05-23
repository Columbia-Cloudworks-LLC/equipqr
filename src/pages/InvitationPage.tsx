
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useInvitationValidation } from '../hooks/invitation/useInvitationValidation';
import { useInvitationAcceptance } from '../hooks/invitation/useInvitationAcceptance';
import { useInvitationProcessing } from '../hooks/invitation/useInvitationProcessing';
import { useInvitationError } from '../hooks/invitation/useInvitationError';
import { InvalidInvitation } from '../components/Invitation/InvalidInvitation';
import { InvitationContent } from '../components/Invitation/InvitationContent';
import { InvitationError } from '../components/Invitation/InvitationError';
import { InvitationValidating, RateLimitedState } from '../components/Invitation/InvitationStatus';
import { SessionHandler } from '../components/Invitation/SessionHandler';
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { InvitationType } from '@/types/invitations';

const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const invitationType = typeParam === 'organization' ? 'organization' : 'team';
  const navigate = useNavigate();
  const { refreshNotifications } = useNotificationsSafe();
  const { refreshOrganizations } = useOrganization();
  const { handleInvitationError } = useInvitationError();
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastAttemptType, setLastAttemptType] = useState<InvitationType | null>(null);
  
  // Custom hooks
  const { 
    isValidating, 
    isValid, 
    error, 
    invitation, 
    isAuthLoading, 
    user, 
    rateLimited: validationRateLimited,
    invitationType: detectedType
  } = useInvitationValidation(token || '', invitationType);
  
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
    console.log(`InvitationPage: Detected invitation type is ${detectedType}`);
  }, [detectedType]);
  
  // Handle rate limiting detection
  useEffect(() => {
    // Check from both sources if we're rate limited
    if (validationRateLimited || acceptRateLimited) {
      setIsRateLimited(true);
    } else {
      setIsRateLimited(false);
    }
  }, [validationRateLimited, acceptRateLimited]);

  // Session handling for invitation
  useEffect(() => {
    console.log(`Invitation page loaded for token: ${token?.substring(0, 8)}... (Type: ${invitationType})`);
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
  }, [token, invitationType, isValidating, isValid, error, isAuthLoading, 
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
      if (token) {
        const typeParam = detectedType === 'organization' ? '?type=organization' : '';
        const invitationPath = `/invitation/${token}${typeParam}`;
        redirectToAuth(invitationPath, detectedType);
      }
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
      
      console.log(`Accepting invitation: ${token?.substring(0, 8)}... (Type: ${detectedType})`);
      
      if (invitation && invitation.email && user.email) {
        console.log(`Current user: ${user.email}, Invitation for: ${invitation.email}`);
      }
      
      // Use the detected type for acceptance
      const result = await acceptInvitation(token || '', detectedType);
      
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
            acceptInvitation(token || '', alternateType)
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
        setIsRateLimited(true);
      }
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

  // Render session handler (invisible component that manages session state)
  return (
    <>
      <SessionHandler
        token={token}
        searchParams={searchParams}
        waitingForAuth={waitingForAuth}
        setWaitingForAuth={setWaitingForAuth}
        sessionCheckAttempt={sessionCheckAttempt}
        setSessionCheckAttempt={setSessionCheckAttempt}
        setAuthVerified={setAuthVerified}
        invitationType={invitationType}
      />
      
      {/* Render appropriate UI based on invitation state */}
      {waitingForAuth ? (
        <InvitationError 
          error="Please login to accept this invitation" 
          suggestion="You'll need to sign in or create an account before accepting this invitation."
          isAuthError={true}
          token={token}
          invitationType={detectedType}
        />
      ) : isRateLimited ? (
        <RateLimitedState onRetry={handleRetryAfterRateLimit} />
      ) : isValidating || isAuthLoading ? (
        <InvitationValidating />
      ) : processingError ? (
        <InvitationError error={processingError} />
      ) : !isValid || !invitation ? (
        <InvalidInvitation />
      ) : (
        <InvitationContent 
          invitationType={detectedType}
          invitationDetails={invitation} 
          onAccept={handleAcceptInvitation}
          token={token || ''}
        />
      )}
    </>
  );
};

export default InvitationPage;

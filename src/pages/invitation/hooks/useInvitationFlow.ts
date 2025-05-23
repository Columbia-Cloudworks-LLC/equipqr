
import { useState, useEffect } from 'react';
import { InvitationType } from '@/types/invitations';
import { useInvitationState } from '../components/useInvitationState';
import { useInvitationValidation } from '@/hooks/invitation/useInvitationValidation';
import { useAuthVerification } from './useAuthVerification';
import { useInvitationHandling } from './useInvitationHandling';

export function useInvitationFlow(token: string, initialInvitationType: InvitationType) {
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  // Use custom hooks for state management
  const {
    isRateLimited,
    setIsRateLimited,
    retryCount, 
    setRetryCount,
    lastAttemptType, 
    setLastAttemptType
  } = useInvitationState();
  
  // Authentication verification
  const {
    waitingForAuth,
    setWaitingForAuth,
    authVerified,
    setAuthVerified,
    refreshAuthSession,
    sessionCheckAttempt,
    setSessionCheckAttempt
  } = useAuthVerification();
  
  // Invitation validation
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
  
  // Invitation handling
  const {
    acceptingInvitation,
    acceptError,
    acceptRateLimited,
    acceptedSuccessfully,
    setAcceptedSuccessfully,
    handleAcceptInvitation
  } = useInvitationHandling(token);
  
  // Handle rate limiting detection
  useEffect(() => {
    if (validationRateLimited || acceptRateLimited) {
      setIsRateLimited(true);
    } else {
      setIsRateLimited(false);
    }
  }, [validationRateLimited, acceptRateLimited, setIsRateLimited]);

  // Debug component state
  useEffect(() => {
    console.log('InvitationContainer: Current state', {
      token: token.substring(0, 8) + '...',
      initialType: initialInvitationType,
      detectedType,
      isValidating,
      isValid,
      hasError: !!error || !!processingError,
      error: error || processingError,
      isAuthLoading,
      user: user ? `${user.email} (${user.id.substring(0, 8)}...)` : 'not authenticated',
      waitingForAuth,
      authVerified,
      isRateLimited
    });
  }, [token, initialInvitationType, detectedType, isValidating, isValid, 
      error, processingError, isAuthLoading, user, waitingForAuth, 
      authVerified, isRateLimited]);

  // Log detected invitation type changes
  useEffect(() => {
    console.log(`InvitationContainer: Detected invitation type is ${detectedType}`);
  }, [detectedType]);

  // Session handling for invitation
  useEffect(() => {
    console.log(`Invitation page loaded for token: ${token.substring(0, 8)}... (Type: ${initialInvitationType})`);
    console.log('Invitation status:', {
      isValidating,
      isValid,
      hasError: Boolean(error),
      isAuthLoading,
      isAccepting: acceptingInvitation,
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
      acceptingInvitation, acceptError, invitation, user, waitingForAuth, refreshAuthSession, authVerified, detectedType]);

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

  // Function to handle manual retry after rate limiting
  const handleRetryAfterRateLimit = () => {
    setIsRateLimited(false);
    // Wait a moment before retrying
    setTimeout(() => {
      if (isValid && invitation) {
        handleAcceptInvitation(token, detectedType);
      } else {
        // Refresh the page to start over
        window.location.reload();
      }
    }, 2000);
  };

  const redirectToAuth = (invitationPath: string, invitationType: string = 'team') => {
    // Store the current invitation URL in session storage for redirect after auth
    sessionStorage.setItem('invitationPath', invitationPath);
    sessionStorage.setItem('invitationType', invitationType);
  };

  return {
    // State
    isRateLimited,
    setIsRateLimited,
    retryCount,
    setRetryCount,
    lastAttemptType,
    setLastAttemptType,
    
    // Auth
    waitingForAuth,
    setWaitingForAuth,
    authVerified,
    setAuthVerified,
    refreshAuthSession,
    sessionCheckAttempt,
    setSessionCheckAttempt,
    
    // Validation
    isValidating,
    isValid,
    error,
    invitation,
    isAuthLoading,
    user,
    detectedType,
    
    // Acceptance
    acceptingInvitation,
    acceptError,
    acceptRateLimited,
    processingError,
    setProcessingError,
    acceptedSuccessfully,
    setAcceptedSuccessfully,
    
    // Actions
    handleAcceptInvitation,
    handleRetryAfterRateLimit,
    redirectToAuth
  };
}

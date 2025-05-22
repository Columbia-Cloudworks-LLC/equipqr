
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useInvitationValidation } from '../hooks/useInvitationValidation';
import { useInvitationAcceptance } from '../hooks/useInvitationAcceptance';
import { InvalidInvitation } from '../components/Invitation/InvalidInvitation';
import { InvitationContent } from '../components/Invitation/InvitationContent';
import { InvitationError } from '../components/Invitation/InvitationError';
import { InvitationValidating } from '../components/Invitation/InvitationStatus';
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const invitationType = searchParams.get('type') || 'team';
  const navigate = useNavigate();
  const { refreshNotifications } = useNotificationsSafe();
  const { refreshOrganizations } = useOrganization();
  const { user, isLoading: authLoading, checkSession } = useAuth();
  
  const { isValidating, isValid, error, invitation, isAuthLoading } = useInvitationValidation(token || '');
  const { acceptInvitation, isAccepting, acceptError } = useInvitationAcceptance();
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [acceptedSuccessfully, setAcceptedSuccessfully] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const [sessionCheckAttempt, setSessionCheckAttempt] = useState(0);
  const [authVerified, setAuthVerified] = useState(false);

  // Save invitation details to session storage when not authenticated
  useEffect(() => {
    if (!user && !authLoading && token) {
      // Save the invitation path for redirection after login
      const invitationPath = `/invitation/${token}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      sessionStorage.setItem('invitationPath', invitationPath);
      console.log('Saved invitation path for after login:', invitationPath);
    }
  }, [user, authLoading, token, searchParams]);

  // Improved session refresh function with specific error handling
  const refreshAuthSession = useCallback(async () => {
    try {
      console.log("Forcing auth session refresh");
      
      // First, check if we have a valid session
      const isValid = await checkSession();
      if (!isValid) {
        console.error("No valid session found, redirecting to login");
        // Store the current invitation URL in session storage for redirect after auth
        const invitationPath = `/invitation/${token}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        sessionStorage.setItem('invitationPath', invitationPath);
        
        navigate("/auth", { 
          state: { 
            returnTo: invitationPath,
            message: "Please sign in or create an account to accept this invitation",
            isInvitation: true
          }
        });
        return false;
      }
      
      // Then refresh to get a new token
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Error refreshing session:", error);
        toast.error("Authentication error", {
          description: "Could not refresh your session. Please try logging out and in again."
        });
        return false;
      }
      
      if (data.session) {
        console.log("Session refreshed successfully, token:", data.session.access_token.substring(0, 10) + '...');
        setAuthVerified(true);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Error in refreshAuthSession:", err);
      return false;
    }
  }, [checkSession, navigate, token, searchParams]);

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
      isAuthenticated: !!user
    });
    
    // When the page loads, check if we need to wait for authentication
    if (!user && !authLoading) {
      console.log("User not authenticated but invitation exists - waiting for authentication");
      setWaitingForAuth(true);
    } else if (user && waitingForAuth) {
      console.log("User now authenticated - can proceed with invitation");
      setWaitingForAuth(false);
      // Force a session refresh when the user becomes authenticated
      refreshAuthSession();
    } else if (user && !authVerified && !authLoading) {
      // If user is logged in but we haven't verified the auth yet
      refreshAuthSession();
    }
  }, [token, invitationType, isValidating, isValid, error, isAuthLoading, 
      isAccepting, acceptError, invitation, user, authLoading, waitingForAuth, refreshAuthSession, authVerified]);

  // Check session validity periodically with exponential backoff when waiting for auth
  useEffect(() => {
    if (waitingForAuth && sessionCheckAttempt < 5) {
      const delay = Math.min(2000 * Math.pow(2, sessionCheckAttempt), 16000); // Exponential backoff with 16s max
      console.log(`Scheduling session check attempt ${sessionCheckAttempt + 1} in ${delay}ms`);
      
      const checkSessionTimeout = setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        setSessionCheckAttempt(prev => prev + 1);
        
        if (data.session) {
          console.log('Session detected - can proceed with invitation');
          setWaitingForAuth(false);
          setAuthVerified(true);
        }
      }, delay);
      
      return () => clearTimeout(checkSessionTimeout);
    }
  }, [waitingForAuth, sessionCheckAttempt]);

  // Combine errors for display
  useEffect(() => {
    if (acceptError) {
      setProcessingError(acceptError);
    } else if (error) {
      setProcessingError(error);
    } else {
      setProcessingError(null);
    }
  }, [error, acceptError]);

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

  if (waitingForAuth) {
    return (
      <InvitationError 
        error="Please login to accept this invitation" 
        suggestion="You'll need to sign in or create an account before accepting this invitation."
      />
    );
  }

  if (isValidating || isAuthLoading || authLoading) {
    return <InvitationValidating />;
  }

  if (processingError) {
    return <InvitationError error={processingError} />;
  }

  if (!isValid || !invitation) {
    return <InvalidInvitation />;
  }

  const handleAcceptInvitation = async () => {
    if (!user) {
      toast.error("You must be logged in to accept invitations");
      setWaitingForAuth(true);
      return;
    }

    try {
      // Force a session refresh before accepting the invitation
      const refreshSuccessful = await refreshAuthSession();
      
      if (!refreshSuccessful) {
        throw new Error("Could not refresh your authentication session. Please try logging out and in again.");
      }
      
      console.log(`Accepting invitation: ${token?.substring(0, 8)}... (Type: ${invitationType})`);
      console.log(`Current user: ${user?.email}, Invitation for: ${invitation.email}`);
      
      const result = await acceptInvitation(token || '', invitationType);
      
      if (result && result.success) {
        console.log("Invitation accepted successfully:", result);
        setAcceptedSuccessfully(true);
        toast.success(result.message || "Invitation accepted successfully!");
        
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
            if (invitationType === 'organization') {
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
      }
    } catch (error: any) {
      console.error('Error in handleAcceptInvitation:', error);
      setProcessingError(error.message || "An unexpected error occurred");
    }
  };

  return (
    <InvitationContent 
      invitationType={invitationType === 'organization' ? 'organization' : 'team'}
      invitationDetails={invitation} 
      onAccept={handleAcceptInvitation}
      token={token || ''}
    />
  );
};

export default InvitationPage;

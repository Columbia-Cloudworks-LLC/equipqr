
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useInvitationValidation } from '../hooks/useInvitationValidation';
import { useInvitationAcceptance } from '../hooks/useInvitationAcceptance';
import { InvalidInvitation } from '../components/Invitation/InvalidInvitation';
import { InvitationContent } from '../components/Invitation/InvitationContent';
import { InvitationLoading } from '../components/Invitation/InvitationLoading';
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
  const { refreshNotifications } = useNotificationsSafe();
  const { refreshOrganizations } = useOrganization();
  const { user, isLoading: authLoading } = useAuth();
  
  const { isValidating, isValid, error, invitation, user: inviteeUser, isAuthLoading } = useInvitationValidation(token || '');
  const { acceptInvitation, isAccepting, acceptError } = useInvitationAcceptance();
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [acceptedSuccessfully, setAcceptedSuccessfully] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);

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
    if (!user && !authLoading && invitation) {
      console.log('User not authenticated but invitation exists - waiting for authentication');
      setWaitingForAuth(true);
    } else if (user && waitingForAuth) {
      console.log('User now authenticated - can proceed with invitation');
      setWaitingForAuth(false);
    }
  }, [token, invitationType, isValidating, isValid, error, isAuthLoading, 
      isAccepting, acceptError, invitation, user, authLoading, waitingForAuth]);

  // Check session validity periodically when waiting for auth
  useEffect(() => {
    if (waitingForAuth) {
      const checkSessionInterval = setInterval(async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log('Session now detected - can proceed with invitation');
          setWaitingForAuth(false);
          clearInterval(checkSessionInterval);
        }
      }, 2000);
      
      return () => clearInterval(checkSessionInterval);
    }
  }, [waitingForAuth]);

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
      console.log(`Accepting invitation: ${token?.substring(0, 8)}... (Type: ${invitationType})`);
      console.log(`Current user: ${user?.email}, Invitation for: ${invitation.email}`);
      
      const result = await acceptInvitation(token || '', invitationType);
      
      if (result && result.success) {
        console.log("Invitation accepted successfully:", result);
        setAcceptedSuccessfully(true);
        
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
        setProcessingError("Failed to accept invitation. Please try again.");
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

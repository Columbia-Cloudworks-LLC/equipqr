
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acceptInvitation } from '@/services/team/invitationService';
import { toast } from 'sonner';

export function useInvitationAcceptance(token: string | undefined, user: any) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAcceptInvitation = async () => {
    if (!token) {
      setError('Missing invitation token');
      return;
    }

    if (!user) {
      // Store the invitation route to redirect back after login
      sessionStorage.setItem('invitationPath', window.location.pathname);
      
      toast.info("Please sign in to accept the invitation", {
        description: "You'll be redirected back after signing in"
      });
      
      // Redirect to auth page
      navigate('/auth');
      return;
    }

    try {
      setIsAccepting(true);
      setError(null);
      
      console.log("Accepting invitation with token:", token);
      const result = await acceptInvitation(token);
      console.log("Acceptance result:", result);
      
      toast.success(`Welcome to ${result.teamName || "the team"}!`, {
        description: `You have successfully joined as a ${result.role || "member"}`
      });
      
      // Clear any local dismissed notifications since status has changed
      if (window.localStorage) {
        try {
          const dismissedKey = 'dismissed_notifications';
          window.localStorage.removeItem(dismissedKey);
        } catch (e) {
          console.warn('Could not clear dismissed notifications from localStorage:', e);
        }
      }
      
      // Redirect to team management page
      navigate('/team');
      
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(`Error accepting invitation: ${err.message}`);
      toast.error("Error accepting invitation", {
        description: err.message
      });
    } finally {
      setIsAccepting(false);
    }
  };

  return {
    isAccepting,
    error,
    handleAcceptInvitation,
    navigateHome: () => navigate('/')
  };
}

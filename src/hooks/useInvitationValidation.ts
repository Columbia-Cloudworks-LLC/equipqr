
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useInvitationValidation(token?: string) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No invitation token provided');
        setIsValidating(false);
        return;
      }

      try {
        // Use edge function to validate invitation to avoid RLS recursion
        const { data, error } = await supabase.functions.invoke('validate_invitation', {
          body: { token }
        });
        
        if (error || !data?.valid) {
          console.error('Error validating invitation token:', error || data?.error);
          setError(data?.error || 'This invitation is invalid or has expired.');
          setIsValid(false);
        } else {
          // Determine the invitation type and store it in the invitation object
          const invitationData = data.invitation;
          invitationData.type = invitationData.team_id ? 'team' : 'organization';
          
          setInvitation(invitationData);
          setIsValid(true);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error in validateToken:', err);
        setError(`Failed to validate invitation: ${err.message}`);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    // Only validate if we have a token and auth status is known
    if (token && !isAuthLoading) {
      validateToken();
    }
  }, [token, isAuthLoading]);

  return {
    isValidating,
    isAuthLoading,
    isValid,
    error,
    invitation,
    user
  };
}

export default useInvitationValidation;

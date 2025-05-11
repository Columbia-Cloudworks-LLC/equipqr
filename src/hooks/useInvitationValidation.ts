
import { useState, useEffect } from 'react';
import { validateInvitationToken } from '@/services/team/invitationService';
import { useAuth } from '@/contexts/AuthContext';

export function useInvitationValidation(token: string | undefined) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    async function checkInvitation() {
      if (!token) {
        setError('No invitation token provided');
        setIsValidating(false);
        return;
      }

      try {
        console.log("Validating invitation token:", token);
        const result = await validateInvitationToken(token);
        console.log("Validation result:", result);
        
        setIsValid(result.valid);
        
        if (!result.valid) {
          setError(result.error || 'Invalid invitation');
        } else if (result.invitation) {
          setInvitation(result.invitation);
          
          // Check if the current user's email matches the invitation email
          if (user?.email && result.invitation.email && 
              user.email.toLowerCase() !== result.invitation.email.toLowerCase()) {
            setError(`This invitation was sent to ${result.invitation.email}. 
                      You are currently logged in as ${user.email}. 
                      Please log out and sign in with the correct account.`);
          }
        }
      } catch (err: any) {
        console.error('Error validating invitation:', err);
        setError(`Error validating invitation: ${err.message}`);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    }

    checkInvitation();
  }, [token, user]);

  return {
    isValidating,
    isAuthLoading,
    isValid,
    error,
    invitation,
    user
  };
}

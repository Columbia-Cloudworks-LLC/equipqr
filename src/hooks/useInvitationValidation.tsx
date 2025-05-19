
import { useEffect, useState } from 'react';
import { validateInvitationToken } from '@/services/team/invitation';
import { validateOrganizationInvitation } from '@/services/organization/invitationService';

export function useInvitationValidation(token: string | undefined, invitationType: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);
  
  useEffect(() => {
    const validateToken = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!token) {
          setError('No invitation token provided');
          return;
        }
        
        if (invitationType === 'organization') {
          // Handle organization invitation
          const { valid, invitation, error } = await validateOrganizationInvitation(token);
          
          if (!valid) {
            setError(error || 'Invalid invitation');
          } else {
            setInvitationDetails(invitation);
          }
        } else {
          // Handle team invitation
          const { valid, invitation, error } = await validateInvitationToken(token);
          
          if (!valid) {
            setError(error || 'Invalid invitation');
          } else {
            setInvitationDetails(invitation);
          }
        }
      } catch (error: any) {
        console.error('Error validating invitation:', error);
        setError(error.message || 'An error occurred validating the invitation');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, invitationType]);
  
  return {
    loading,
    error,
    invitationDetails
  };
}

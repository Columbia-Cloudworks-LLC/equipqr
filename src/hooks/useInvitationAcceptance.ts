
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acceptInvitation } from '@/services/team/invitation';
import { acceptOrganizationInvitation } from '@/services/organization/invitationService';
import { toast } from 'sonner';

export function useInvitationAcceptance() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const acceptInvitationHandler = async (token: string, invitationType?: string) => {
    try {
      setProcessing(true);
      setError(null);
      
      if (invitationType === 'organization') {
        // Handle organization invitation
        const response = await acceptOrganizationInvitation(token);
        
        if (response.success) {
          navigate('/settings/organization');
        } else {
          setError(response.error || 'Failed to accept invitation');
        }
      } else {
        // Handle team invitation
        const result = await acceptInvitation(token);
        
        if (result.success) {
          navigate('/team');
        } else {
          setError('Failed to accept invitation');
        }
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'An unexpected error occurred');
      toast.error('Error accepting invitation', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setProcessing(false);
    }
  };
  
  return {
    processing,
    error,
    acceptInvitationHandler,
    setError
  };
}

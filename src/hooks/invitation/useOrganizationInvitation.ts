
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { acceptInvitation, validateInvitationToken } from '@/services/team/invitationService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function useOrganizationInvitation() {
  const [isValidating, setIsValidating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateToken = useCallback(async (token: string) => {
    if (!token) {
      setValidationError('Invalid invitation link. No token provided.');
      return false;
    }

    try {
      setIsValidating(true);
      setValidationError(null);
      
      const details = await validateInvitationToken(token);
      
      if (!details || !details.valid) {
        setValidationError(details?.error || 'This invitation is no longer valid.');
        return false;
      }
      
      setInvitationDetails(details);
      return true;
    } catch (error: any) {
      console.error('Error validating invitation token:', error);
      setValidationError(error.message || 'Failed to validate invitation.');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleAcceptInvitation = useCallback(async (token: string) => {
    if (!token) {
      toast.error('Invalid invitation token');
      return { success: false, error: 'Invalid invitation token' };
    }
    
    try {
      setIsAccepting(true);
      
      // Call without type argument that was causing the error
      const result = await acceptInvitation(token);
      
      if (result.success) {
        toast.success('Invitation accepted!', {
          description: 'You have successfully joined the organization.'
        });
        
        // Refresh the auth session to get updated permissions
        await supabase.auth.refreshSession();
        
        // Navigate to teams page or dashboard
        navigate('/dashboard');
        return result;
      } else {
        throw new Error(result.error || 'Failed to accept invitation');
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation', {
        description: error.message || 'An unexpected error occurred'
      });
      return { success: false, error: error.message || 'Failed to accept invitation' };
    } finally {
      setIsAccepting(false);
    }
  }, [navigate]);

  return {
    isValidating,
    isAccepting,
    invitationDetails,
    validationError,
    validateToken,
    handleAcceptInvitation
  };
}

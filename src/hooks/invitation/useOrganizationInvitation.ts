
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { validateOrganizationInvitation } from '@/services/organization/invitation';
import { acceptOrganizationInvitation } from '@/services/organization/invitation';

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
      
      // Use organization-specific validation
      const details = await validateOrganizationInvitation(token);
      
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
      
      // Use organization-specific acceptance
      const result = await acceptOrganizationInvitation(token);
      
      if (result.success) {
        toast.success('Invitation accepted!', {
          description: 'You have successfully joined the organization.'
        });
        
        // Refresh the auth session to get updated permissions
        await supabase.auth.refreshSession();
        
        // Navigate to dashboard
        navigate('/dashboard');
        return result;
      } else {
        const errorMsg = result.error || 'Failed to accept invitation';
        throw new Error(errorMsg);
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

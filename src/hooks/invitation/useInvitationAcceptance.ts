import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AcceptanceResult } from '@/types/invitations';
import { acceptOrganizationInvitation } from '@/services/organization/invitation';

/**
 * Hook for accepting invitations (team or organization)
 */
export function useInvitationAcceptance() {
  const [acceptingInvitation, setAcceptingInvitation] = useState(false);
  const navigate = useNavigate();

  const acceptInvitation = useCallback(async (
    token: string,
    invitationType: 'team' | 'organization' = 'team'
  ): Promise<AcceptanceResult> => {
    setAcceptingInvitation(true);
    try {
      console.log(`Starting to accept ${invitationType} invitation with token: ${token.substring(0, 8)}...`);
      
      let result: AcceptanceResult;
      
      // Different acceptance handlers based on invitation type
      if (invitationType === 'organization') {
        result = await acceptOrganizationInvitation(token);
      } else {
        // Team invitation acceptance (remains unchanged)
        const acceptService = await import('@/services/team/invitation/acceptInvitation');
        result = await acceptService.default(token);
      }
      
      console.log('Invitation acceptance result:', result);
      
      // Handle successful acceptance
      if (result.success) {
        // Force refresh the auth session to get updated permissions
        await supabase.auth.refreshSession();
        
        // Provide appropriate success message
        const entityType = invitationType === 'organization' ? 'organization' : 'team';
        const entityName = result.organizationName || result.teamName || entityType;
        
        toast.success(`Invitation accepted!`, {
          description: `You've successfully joined ${entityName}`
        });
      }
      
      return result;
    } catch (error: any) {
      console.error('Error in acceptInvitation:', error);
      
      // Check for specific errors and provide better messages
      let errorMessage = error.message || 'Failed to accept invitation';
      
      // Handle database relation errors more gracefully
      if (errorMessage.includes('does not exist')) {
        errorMessage = 'Database error: Could not process invitation. Please contact support.';
      }
      
      toast.error('Error accepting invitation', {
        description: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setAcceptingInvitation(false);
    }
  }, [navigate]);

  return {
    acceptingInvitation,
    acceptInvitation
  };
}

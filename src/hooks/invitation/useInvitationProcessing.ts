
import { useState } from 'react';
import { useSessionValidation } from './useSessionValidation';
import { useOrganizationInvitation } from './useOrganizationInvitation';
import { useTeamInvitation } from './useTeamInvitation';
import { useDuplicateInvitationPrevention } from './useDuplicateInvitationPrevention';
import { useInvitationError } from './useInvitationError';
import { toast } from 'sonner';

/**
 * Combined hook for processing invitations with duplicate prevention
 */
export function useInvitationProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { ensureValidSession, isValidating } = useSessionValidation();
  const orgInvitation = useOrganizationInvitation();
  const teamInvitation = useTeamInvitation();
  const { checkIfProcessing, markAsProcessing, clearProcessing } = useDuplicateInvitationPrevention();
  const { handleInvitationError } = useInvitationError();
  
  const processInvitation = async (token: string, type?: string): Promise<any> => {
    // Prevent duplicate processing of the same invitation
    if (checkIfProcessing(token)) {
      toast.info(`This invitation is already being processed`);
      return null;
    }
    
    try {
      // Mark as processing
      markAsProcessing(token);
      setIsProcessing(true);
      setError(null);
      
      // Verify we have a valid session before proceeding
      const hasSession = await ensureValidSession();
      if (!hasSession) {
        throw new Error('No authenticated session found. Please login and try again.');
      }
      
      // Normalize invitation type to ensure consistent handling
      const invitationType = type === 'organization' ? 'organization' : 'team';
      
      console.log(`Processing ${invitationType} invitation with token: ${token.substring(0, 8)}...`);
      
      // Process the invitation based on type
      if (invitationType === 'organization') {
        return await orgInvitation.acceptInvitation(token);
      } else {
        return await teamInvitation.acceptInvitation(token);
      }
    } catch (error: any) {
      const errorMessage = handleInvitationError(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
      
      // Clear processing state after a delay
      clearProcessing(token);
    }
  };
  
  return {
    processInvitation,
    isProcessing: isProcessing || isValidating || orgInvitation.isProcessing || teamInvitation.isProcessing,
    error: error || orgInvitation.error || teamInvitation.error
  };
}


import { useState } from 'react';
import { useSessionValidation } from './useSessionValidation';
import { useOrganizationInvitation } from './useOrganizationInvitation';
import { useTeamInvitation } from './useTeamInvitation';

// Track invitations being processed to prevent duplicate attempts
const processingInvitations: Record<string, boolean> = {};

/**
 * Combined hook for processing invitations with duplicate prevention
 */
export function useInvitationProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { ensureValidSession, isValidating } = useSessionValidation();
  const orgInvitation = useOrganizationInvitation();
  const teamInvitation = useTeamInvitation();
  
  const processInvitation = async (token: string, type?: string): Promise<any> => {
    // Prevent duplicate processing of the same invitation
    if (processingInvitations[token]) {
      console.log(`Invitation ${token.substring(0, 8)}... is already being processed, skipping`);
      return null;
    }
    
    try {
      // Mark as processing
      processingInvitations[token] = true;
      setIsProcessing(true);
      setError(null);
      
      // Verify we have a valid session before proceeding
      const hasSession = await ensureValidSession();
      if (!hasSession) {
        throw new Error('No authenticated session found. Please login and try again.');
      }
      
      // Normalize invitation type to ensure consistent handling
      const invitationType = type === 'organization' ? 'organization' : 'team';
      
      // Process the invitation based on type
      if (invitationType === 'organization') {
        return await orgInvitation.acceptInvitation(token);
      } else {
        return await teamInvitation.acceptInvitation(token);
      }
    } catch (error: any) {
      console.error('Error processing invitation:', error);
      setError(error.message || 'Failed to process invitation');
      return { success: false, error: error.message || 'Failed to process invitation' };
    } finally {
      setIsProcessing(false);
      
      // Clear processing state after a delay to prevent immediate retries
      setTimeout(() => {
        delete processingInvitations[token];
      }, 5000);
    }
  };
  
  return {
    processInvitation,
    isProcessing: isProcessing || isValidating || orgInvitation.isProcessing || teamInvitation.isProcessing,
    error: error || orgInvitation.error || teamInvitation.error
  };
}

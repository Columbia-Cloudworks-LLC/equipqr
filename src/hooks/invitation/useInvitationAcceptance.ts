
import { useInvitationProcessing } from './useInvitationProcessing';

/**
 * Main hook for accepting invitations (wrapper around more focused hooks)
 * Maintains the same API as the original hook for backward compatibility
 */
export function useInvitationAcceptance() {
  const { processInvitation, isProcessing, error } = useInvitationProcessing();
  
  return {
    acceptInvitation: processInvitation,
    isAccepting: isProcessing,
    acceptError: error
  };
}

export default useInvitationAcceptance;

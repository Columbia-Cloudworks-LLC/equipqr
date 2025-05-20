
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook for handling invitation-specific errors
 */
export function useInvitationError() {
  const handleInvitationError = useCallback((error: any): string => {
    const errorMessage = error.message || 'Failed to process invitation';
    
    // Handle common invitation errors with friendly messages
    if (errorMessage.includes('invalid') || errorMessage.includes('expired')) {
      toast.error('This invitation link is invalid or has expired');
    } else if (errorMessage.includes('session') || errorMessage.includes('login')) {
      toast.error('Please log in to accept this invitation');
    } else if (errorMessage.includes('email mismatch')) {
      toast.error('This invitation was sent to a different email address');
    } else {
      toast.error(errorMessage);
    }
    
    console.error('Invitation processing error:', error);
    return errorMessage;
  }, []);
  
  return {
    handleInvitationError
  };
}

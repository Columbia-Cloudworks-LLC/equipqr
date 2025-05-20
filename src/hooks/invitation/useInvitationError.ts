
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook for handling invitation-specific errors
 */
export function useInvitationError() {
  const handleInvitationError = useCallback((error: any): string => {
    // Extract the most meaningful error message
    let errorMessage = '';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message || 'Failed to process invitation';
    } else if (error && typeof error === 'object') {
      // Handle API error objects that might have message or error properties
      errorMessage = 
        error.message || 
        (error.error && typeof error.error === 'string' ? error.error : '') || 
        JSON.stringify(error);
    } else {
      errorMessage = 'Failed to process invitation';
    }
    
    // Handle common invitation errors with friendly messages
    if (errorMessage.includes('invalid') || errorMessage.includes('expired')) {
      toast.error('This invitation link is invalid or has expired');
    } else if (errorMessage.includes('session') || errorMessage.includes('login')) {
      toast.error('Please log in to accept this invitation');
    } else if (errorMessage.includes('email mismatch')) {
      toast.error('This invitation was sent to a different email address');
    } else if (errorMessage.includes('already a member')) {
      toast.error('You are already a member of this organization or team');
    } else if (errorMessage.includes('not found')) {
      toast.error('The invitation could not be found. It may have been deleted or already accepted');
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

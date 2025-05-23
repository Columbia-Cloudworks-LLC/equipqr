
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseInvitationErrorProps {
  onReset?: () => void;
  maxAttempts?: number;
}

/**
 * Hook for handling invitation-specific errors with retry functionality
 */
export function useInvitationError(props?: UseInvitationErrorProps) {
  const { onReset, maxAttempts = 3 } = props || {};
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryingIn, setRetryingIn] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  // Clear any existing error state and timers
  const clearError = useCallback(() => {
    setErrorMessage(null);
    setIsRetrying(false);
    setRetryingIn(0);
    
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
  }, [retryTimeout]);

  // Handle retry logic
  const scheduleRetry = useCallback(() => {
    if (retryCount >= maxAttempts) {
      setIsRetrying(false);
      return;
    }

    const nextRetryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
    setRetryingIn(nextRetryDelay / 1000);
    setIsRetrying(true);

    const timer = setTimeout(() => {
      setIsRetrying(false);
      if (onReset) {
        onReset();
      }
    }, nextRetryDelay);

    setRetryTimeout(timer);
    setRetryCount(prev => prev + 1);
  }, [retryCount, maxAttempts, onReset]);

  // Process and display an error, optionally initiating a retry
  const handleError = useCallback((error: any, shouldRetry: boolean = false) => {
    const message = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred';
    setErrorMessage(message);
    
    if (shouldRetry) {
      scheduleRetry();
    }
    
    return message;
  }, [scheduleRetry]);

  // Handle invitation-specific errors
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
    errorMessage,
    isRetrying,
    retryingIn,
    handleError,
    clearError,
    handleInvitationError
  };
}

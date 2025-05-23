
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface UseInvitationErrorProps {
  onReset?: () => void;
  initialErrorMessage?: string | null;
}

export function useInvitationError({ 
  onReset, 
  initialErrorMessage = null
}: UseInvitationErrorProps = {}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryingIn, setRetryingIn] = useState(0);
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [retryTimer]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    setIsRetrying(false);
    if (retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }
    setRetryingIn(0);
    setRetryCount(0);
  }, [retryTimer]);

  const handleError = useCallback((error: Error | string, shouldAutoRetry = false) => {
    const errorMsg = typeof error === 'string' ? error : error.message;
    setErrorMessage(errorMsg);
    
    // Show error toast
    toast.error('Error with invitation', {
      description: errorMsg,
      duration: 5000
    });
    
    // Implement auto-retry with increasing delay if requested
    if (shouldAutoRetry && retryCount < 3) {
      const nextRetryCount = retryCount + 1;
      setRetryCount(nextRetryCount);
      
      // Calculate delay with exponential backoff
      const delay = Math.min(2000 * Math.pow(2, nextRetryCount - 1), 10000);
      
      // Set up countdown timer
      setIsRetrying(true);
      setRetryingIn(Math.floor(delay / 1000));
      
      const countdownInterval = setInterval(() => {
        setRetryingIn(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Schedule the retry
      const timer = setTimeout(() => {
        setIsRetrying(false);
        if (onReset) {
          onReset();
        }
        clearInterval(countdownInterval);
      }, delay);
      
      // Store the timer for cleanup
      setRetryTimer(timer);
    }
  }, [retryCount, onReset]);

  // Add the missing handleInvitationError method as an alias to handleError
  const handleInvitationError = handleError;

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    
    if (retryTimer) {
      clearTimeout(retryTimer);
    }
    
    if (onReset) {
      // Small delay to show loading state
      const timer = setTimeout(() => {
        setIsRetrying(false);
        onReset();
      }, 500);
      setRetryTimer(timer);
    } else {
      setIsRetrying(false);
    }
  }, [onReset, retryTimer]);

  return {
    errorMessage,
    isRetrying,
    retryingIn,
    retryCount,
    handleError,
    clearError,
    handleRetry,
    handleInvitationError // Export the alias
  };
}

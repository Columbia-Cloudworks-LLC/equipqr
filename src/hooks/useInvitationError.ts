
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UseInvitationErrorOptions {
  onReset?: () => void;
  maxAttempts?: number;
  redirectOnError?: boolean;
  redirectPath?: string;
}

/**
 * Hook for managing invitation error states and retry logic
 */
export function useInvitationError(options: UseInvitationErrorOptions = {}) {
  const { 
    onReset, 
    maxAttempts = 3,
    redirectOnError = false,
    redirectPath = '/'
  } = options;
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryingIn, setRetryingIn] = useState(0);
  const navigate = useNavigate();
  
  // Clear error state
  const clearError = useCallback(() => {
    setErrorMessage(null);
    setRetryCount(0);
    setRetryingIn(0);
    if (onReset) {
      onReset();
    }
  }, [onReset]);
  
  // Handle an error, with optional retry logic
  const handleError = useCallback((error: Error | string, autoRetry = false) => {
    const message = typeof error === 'string' ? error : error.message;
    setErrorMessage(message);
    
    if (autoRetry && retryCount < maxAttempts) {
      // Exponential backoff for retries
      const delaySeconds = Math.pow(2, retryCount);
      console.log(`Will retry in ${delaySeconds} seconds (attempt ${retryCount + 1}/${maxAttempts})`);
      
      // Show countdown
      setRetryingIn(delaySeconds);
      
      // Start countdown
      const intervalId = setInterval(() => {
        setRetryingIn(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            // Increment retry counter
            setRetryCount(prev => prev + 1);
            // Trigger the reset callback
            if (onReset) {
              onReset();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(intervalId);
    } else if (retryCount >= maxAttempts && redirectOnError) {
      // If we've exceeded max retries and redirectOnError is true
      toast.error("Maximum retry attempts reached");
      navigate(redirectPath);
    }
  }, [retryCount, maxAttempts, onReset, navigate, redirectOnError, redirectPath]);
  
  // Reset retry counter when dependencies change
  useEffect(() => {
    setRetryCount(0);
  }, [options]);
  
  return {
    errorMessage,
    retryCount,
    retryingIn,
    isRetrying: retryingIn > 0,
    hasReachedMaxRetries: retryCount >= maxAttempts,
    handleError,
    clearError,
  };
}

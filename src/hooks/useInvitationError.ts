
import { useState, useCallback, useEffect, useRef } from 'react';

interface InvitationErrorOptions {
  maxAttempts?: number;
  retryIntervalMs?: number;
  onReset?: () => void;
}

/**
 * Custom hook for handling invitation errors with retry functionality
 */
export function useInvitationError(options: InvitationErrorOptions = {}) {
  const { 
    maxAttempts = 3, 
    retryIntervalMs = 5000,
    onReset
  } = options;
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryingIn, setRetryingIn] = useState(0);
  const timerRef = useRef<number | null>(null);
  
  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Handle errors with optional auto-retry
  const handleError = useCallback((error: Error | string, autoRetry = false) => {
    const message = typeof error === 'string' ? error : error.message;
    setErrorMessage(message);
    
    if (autoRetry && attemptCount < maxAttempts) {
      setIsRetrying(true);
      setAttemptCount(prev => prev + 1);
      
      // Set up countdown timer
      let countdown = Math.floor(retryIntervalMs / 1000);
      setRetryingIn(countdown);
      
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
      
      // Update countdown every second
      timerRef.current = window.setInterval(() => {
        countdown -= 1;
        setRetryingIn(countdown);
        
        if (countdown <= 0) {
          clearInterval(timerRef.current!);
          setIsRetrying(false);
          
          // Trigger the reset callback
          if (onReset) {
            onReset();
          }
        }
      }, 1000);
    } else {
      setIsRetrying(false);
    }
  }, [attemptCount, maxAttempts, retryIntervalMs, onReset]);
  
  // Reset error state
  const clearError = useCallback(() => {
    setErrorMessage(null);
    setAttemptCount(0);
    setIsRetrying(false);
    
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  return {
    errorMessage,
    isRetrying,
    retryingIn,
    attemptCount,
    handleError,
    clearError
  };
}

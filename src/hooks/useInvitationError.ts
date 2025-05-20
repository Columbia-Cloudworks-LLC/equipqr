
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseInvitationErrorOptions {
  maxAttempts?: number;
  retryDelay?: number;
  onReset?: () => Promise<void> | void;
}

export function useInvitationError(options: UseInvitationErrorOptions = {}) {
  const { maxAttempts = 3, retryDelay = 3000, onReset } = options;
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryingIn, setRetryingIn] = useState(0);
  const [attempts, setAttempts] = useState(0);
  
  const timerRef = useRef<number | null>(null);
  
  const clearError = useCallback(() => {
    setErrorMessage(null);
    setIsRetrying(false);
    setAttempts(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  const handleError = useCallback((error: string | Error, shouldRetry: boolean = false) => {
    const message = typeof error === 'string' ? error : error.message;
    setErrorMessage(message);
    
    if (shouldRetry && attempts < maxAttempts) {
      setIsRetrying(true);
      setAttempts(prev => prev + 1);
      
      // Set up countdown timer
      const countdownSeconds = Math.round(retryDelay / 1000);
      setRetryingIn(countdownSeconds);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Start countdown for user feedback
      timerRef.current = window.setInterval(() => {
        setRetryingIn(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRetrying(false);
            
            // Try to reset and refresh
            if (onReset) {
              try {
                onReset();
              } catch (e) {
                console.error('Error during reset:', e);
              }
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsRetrying(false);
    }
  }, [attempts, maxAttempts, retryDelay, onReset]);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  return {
    errorMessage,
    isRetrying,
    retryingIn,
    handleError,
    clearError
  };
}

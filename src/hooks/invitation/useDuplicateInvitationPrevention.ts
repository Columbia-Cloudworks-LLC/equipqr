
import { useRef, useCallback } from 'react';

/**
 * Hook that prevents duplicate processing of the same invitation token
 */
export function useDuplicateInvitationPrevention() {
  const processingTokensRef = useRef<Record<string, number>>({});
  
  /**
   * Check if an invitation is currently being processed
   */
  const checkIfProcessing = useCallback((token: string): boolean => {
    if (!token) return false;
    
    const now = Date.now();
    const processingTimestamp = processingTokensRef.current[token];
    
    // If token is not being processed or the processing has expired (5 minutes)
    if (!processingTimestamp || (now - processingTimestamp > 5 * 60 * 1000)) {
      return false;
    }
    
    return true;
  }, []);
  
  /**
   * Mark an invitation as currently being processed
   */
  const markAsProcessing = useCallback((token: string): void => {
    if (!token) return;
    processingTokensRef.current[token] = Date.now();
  }, []);
  
  /**
   * Clear processing state for a token
   */
  const clearProcessing = useCallback((token: string): void => {
    if (!token) return;
    
    // Use timeout to prevent immediate re-processing
    setTimeout(() => {
      delete processingTokensRef.current[token];
    }, 1000);
  }, []);
  
  return {
    checkIfProcessing,
    markAsProcessing,
    clearProcessing
  };
}

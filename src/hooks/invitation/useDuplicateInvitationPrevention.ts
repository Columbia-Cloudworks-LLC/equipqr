
import { useCallback } from 'react';

// Track invitations being processed to prevent duplicate attempts
const processingInvitations: Record<string, number> = {};

/**
 * Hook for preventing duplicate invitation processing
 */
export function useDuplicateInvitationPrevention() {
  const checkIfProcessing = useCallback((token: string): boolean => {
    const now = Date.now();
    const timestamp = processingInvitations[token];
    
    // If we have a timestamp and it's less than 5 seconds old, consider it still processing
    if (timestamp && (now - timestamp < 5000)) {
      return true;
    }
    
    return false;
  }, []);
  
  const markAsProcessing = useCallback((token: string): void => {
    processingInvitations[token] = Date.now();
  }, []);
  
  const clearProcessing = useCallback((token: string): void => {
    // Clear processing state after a delay to prevent immediate retries
    setTimeout(() => {
      delete processingInvitations[token];
    }, 5000);
  }, []);
  
  return {
    checkIfProcessing,
    markAsProcessing,
    clearProcessing
  };
}

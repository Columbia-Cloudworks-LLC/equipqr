
import { useCallback, useRef } from 'react';

// Use a module-level variable to track processing state across hook instances
const processingInvitations: Record<string, number> = {};

/**
 * Hook for preventing duplicate invitation processing
 */
export function useDuplicateInvitationPrevention() {
  // Use a ref to store timeouts so they can be cleared if the component unmounts
  const timeoutsRef = useRef<Record<string, number>>({});
  
  const checkIfProcessing = useCallback((token: string): boolean => {
    if (!token) return false;
    
    const now = Date.now();
    const timestamp = processingInvitations[token];
    
    // If we have a timestamp and it's less than 5 seconds old, consider it still processing
    if (timestamp && (now - timestamp < 5000)) {
      console.log(`Token ${token.substring(0, 8)}... is already being processed`);
      return true;
    }
    
    return false;
  }, []);
  
  const markAsProcessing = useCallback((token: string): void => {
    if (!token) return;
    processingInvitations[token] = Date.now();
    console.log(`Marked token ${token.substring(0, 8)}... as processing`);
  }, []);
  
  const clearProcessing = useCallback((token: string): void => {
    if (!token) return;
    
    // Clear processing state after a delay to prevent immediate retries
    const timeoutId = window.setTimeout(() => {
      delete processingInvitations[token];
      delete timeoutsRef.current[token];
      console.log(`Cleared processing state for token ${token.substring(0, 8)}...`);
    }, 5000);
    
    // Store the timeout ID so it can be cleared if needed
    timeoutsRef.current[token] = timeoutId;
  }, []);
  
  // Clean up any pending timeouts when the component unmounts
  const cleanup = useCallback(() => {
    Object.values(timeoutsRef.current).forEach(timeoutId => {
      window.clearTimeout(timeoutId);
    });
    timeoutsRef.current = {};
  }, []);
  
  return {
    checkIfProcessing,
    markAsProcessing,
    clearProcessing,
    cleanup
  };
}

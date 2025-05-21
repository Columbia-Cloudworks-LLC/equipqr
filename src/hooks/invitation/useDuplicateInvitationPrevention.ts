
import { useState } from 'react';

/**
 * Hook for preventing duplicate invitation processing attempts
 */
export function useDuplicateInvitationPrevention() {
  const [processingInvitations, setProcessingInvitations] = useState<Set<string>>(new Set());
  
  const checkIfProcessing = (token: string): boolean => {
    return processingInvitations.has(token);
  };
  
  const markAsProcessing = (token: string): void => {
    setProcessingInvitations(prev => {
      const newSet = new Set(prev);
      newSet.add(token);
      return newSet;
    });
  };
  
  const clearProcessing = (token: string): void => {
    // Use a timeout to prevent immediate retries
    setTimeout(() => {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(token);
        return newSet;
      });
    }, 2000);
  };
  
  return {
    checkIfProcessing,
    markAsProcessing,
    clearProcessing
  };
}

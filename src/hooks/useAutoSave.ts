import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export const useAutoSave = ({ onSave, delay = 3000, enabled = true }: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const saveRequestRef = useRef<Promise<void>>();
  const queryClient = useQueryClient();

  const triggerAutoSave = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        // Prevent multiple simultaneous saves
        if (saveRequestRef.current) {
          await saveRequestRef.current;
          return;
        }

        saveRequestRef.current = onSave();
        await saveRequestRef.current;
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        saveRequestRef.current = undefined;
      }
    }, delay);
  }, [onSave, delay, enabled]);

  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAutoSave();
    };
  }, [cancelAutoSave]);

  return { triggerAutoSave, cancelAutoSave };
};
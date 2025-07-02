import { useEffect, useRef } from 'react';

export const useMemoryOptimization = () => {
  const cleanupRef = useRef<(() => void)[]>([]);

  const addCleanupTask = (task: () => void) => {
    cleanupRef.current.push(task);
  };

  const clearMemory = () => {
    // Force garbage collection if available (Chrome DevTools)
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc();
      } catch (e) {
        // gc() is not available in production
      }
    }
  };

  useEffect(() => {
    // Cleanup interval to prevent memory accumulation
    const interval = setInterval(() => {
      clearMemory();
    }, 300000); // Every 5 minutes

    return () => {
      clearInterval(interval);
      // Run all cleanup tasks
      cleanupRef.current.forEach(task => {
        try {
          task();
        } catch (error) {
          console.warn('Cleanup task failed:', error);
        }
      });
      cleanupRef.current = [];
    };
  }, []);

  return { addCleanupTask, clearMemory };
};
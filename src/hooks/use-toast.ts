
import { toast as sonnerToast } from 'sonner';
import type { ExternalToast } from 'sonner';
import { useCallback } from 'react';

// Define our custom toast types
export type ToastType = 'default' | 'success' | 'info' | 'warning' | 'destructive';

// Extend the sonner toast options 
export interface ToastOptions extends Omit<ExternalToast, 'type'> {
  title?: string;
  description?: string;
}

// Function to display a toast notification
const showToast = (options: ToastOptions) => {
  const { title, description, ...rest } = options;
  
  if (title && description) {
    sonnerToast(title, {
      description,
      ...rest
    });
  } else if (title) {
    sonnerToast(title, rest);
  }
};

// Convenience methods for different toast types
export const toast = {
  // Main method that accepts all options
  show: showToast,
  
  // Type-specific convenience methods
  default: (title: string, options?: Omit<ToastOptions, 'title'>) => 
    sonnerToast(title, options),
  
  success: (title: string, options?: Omit<ToastOptions, 'title'>) => 
    sonnerToast.success(title, options),
  
  info: (title: string, options?: Omit<ToastOptions, 'title'>) => 
    sonnerToast.info(title, options),
  
  warning: (title: string, options?: Omit<ToastOptions, 'title'>) => 
    sonnerToast.warning(title, options),
  
  error: (title: string, options?: Omit<ToastOptions, 'title'>) => 
    sonnerToast.error(title, options),
  
  // Re-export sonner's native methods
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,
  custom: sonnerToast.custom
};

// Hook for component usage
export const useToast = () => {
  return {
    toast: useCallback(showToast, []),
    ...toast
  };
};

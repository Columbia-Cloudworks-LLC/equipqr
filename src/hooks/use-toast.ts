
import { toast as sonnerToast } from 'sonner';
import type { ExternalToast } from 'sonner';
import { useCallback } from 'react';

// Define our custom toast types
export type ToastType = 'default' | 'success' | 'info' | 'warning' | 'destructive';

// Extend the sonner toast options 
export interface ToastOptions extends Omit<ExternalToast, 'type'> {
  title?: string;
  description?: string;
  // Enable toast grouping by default
  id?: string; // Used for grouping similar toasts
}

// Toast configuration - will be used app-wide
const toastConfig: ExternalToast = {
  duration: 4000,
  closeButton: true,
  position: 'top-right',
  className: 'toast-notification',
};

// Function to display a toast notification
const showToast = (options: ToastOptions) => {
  const { title, description, ...rest } = options;
  
  // Always merge with default config
  const fullConfig = { ...toastConfig, ...rest };
  
  if (title && description) {
    sonnerToast(title, {
      description,
      ...fullConfig
    });
  } else if (title) {
    sonnerToast(title, fullConfig);
  }
};

// Convenience methods for different toast types
export const toast = {
  // Main method that accepts all options
  show: showToast,
  
  // Type-specific convenience methods
  default: (title: string, options?: Omit<ToastOptions, 'title'>) => 
    sonnerToast(title, { ...toastConfig, ...options }),
  
  success: (title: string, options?: Omit<ToastOptions, 'title'>) => 
    sonnerToast.success(title, { ...toastConfig, ...options }),
  
  info: (title: string, options?: Omit<ToastOptions, 'title'>) => 
    sonnerToast.info(title, { ...toastConfig, ...options }),
  
  warning: (title: string, options?: Omit<ToastOptions, 'title'>) => 
    sonnerToast.warning(title, { ...toastConfig, ...options }),
  
  error: (title: string, options?: Omit<ToastOptions, 'title'>) => 
    sonnerToast.error(title, { ...toastConfig, ...options }),
  
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

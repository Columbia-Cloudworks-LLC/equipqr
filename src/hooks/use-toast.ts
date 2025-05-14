
import { toast as sonnerToast } from 'sonner';
import type { ExternalToast } from 'sonner';
import { useCallback } from 'react';

// Define our custom toast types
export type ToastType = 'default' | 'success' | 'info' | 'warning' | 'destructive';

// Extend the sonner toast options with our custom type
export interface ToastOptions extends Omit<ExternalToast, 'type'> {
  title?: string;
  description?: string;
  variant?: ToastType;
}

// Map our variant types to sonner's variant types
const mapVariantToSonnerStyle = (variant?: ToastType): ExternalToast['style'] => {
  switch (variant) {
    case 'destructive':
      return { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' };
    case 'success':
      return { backgroundColor: 'hsl(var(--success))', color: 'hsl(var(--success-foreground))' };
    case 'warning':
      return { backgroundColor: 'hsl(var(--warning))', color: 'hsl(var(--warning-foreground))' };
    case 'info':
      return { backgroundColor: 'hsl(var(--info))', color: 'hsl(var(--info-foreground))' };
    default:
      return undefined;
  }
};

// Function to display a toast notification
const showToast = (options: ToastOptions) => {
  const { title, description, variant, ...rest } = options;
  
  sonnerToast(title || '', {
    description,
    style: mapVariantToSonnerStyle(variant),
    ...rest
  });
};

// Convenience methods for different toast types
export const toast = {
  // Main method that accepts all options
  show: showToast,
  
  // Type-specific convenience methods
  default: (title: string, options?: Omit<ToastOptions, 'title' | 'variant'>) => 
    showToast({ title, variant: 'default', ...options }),
  
  success: (title: string, options?: Omit<ToastOptions, 'title' | 'variant'>) => 
    showToast({ title, variant: 'success', ...options }),
  
  info: (title: string, options?: Omit<ToastOptions, 'title' | 'variant'>) => 
    showToast({ title, variant: 'info', ...options }),
  
  warning: (title: string, options?: Omit<ToastOptions, 'title' | 'variant'>) => 
    showToast({ title, variant: 'warning', ...options }),
  
  error: (title: string, options?: Omit<ToastOptions, 'title' | 'variant'>) => 
    showToast({ title, variant: 'destructive', ...options }),
  
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

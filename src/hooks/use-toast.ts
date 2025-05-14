
import { toast as sonnerToast, ToastT, type ExternalToast } from 'sonner';

type ToastProps = Omit<ExternalToast, 'variant'> & {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
};

export function useToast() {
  return {
    toast: ({ variant, ...props }: ToastProps) => {
      // Implement how variant affects styling
      const toastFn = sonnerToast;
      
      // Adjusting props for the sonner toast library
      if (variant) {
        const className = `toast-${variant}`;
        return toastFn({ ...props, className });
      }
      
      return toastFn(props);
    },
    dismiss: sonnerToast.dismiss,
    error: sonnerToast.error,
    success: sonnerToast.success,
    warning: sonnerToast.warning,
    info: sonnerToast.info,
    custom: sonnerToast.custom,
    message: sonnerToast.message,
    promise: sonnerToast.promise,
  };
}

// Simplified toast function that can be imported directly
export const toast = ({ variant, ...props }: ToastProps) => {
  if (variant) {
    const className = `toast-${variant}`;
    return sonnerToast({ ...props, className });
  }
  return sonnerToast(props);
};

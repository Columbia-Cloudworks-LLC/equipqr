
import { toast as sonnerToast, type ToastT } from 'sonner';

// Define the toast props interface to match sonner's expected shape
export type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
  action?: React.ReactNode;
};

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

// Map our variants to sonner's options
function getToastStyles(variant?: ToastProps['variant']) {
  if (variant === 'destructive') {
    return { style: { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' } };
  } else if (variant === 'success') {
    return { style: { backgroundColor: 'hsl(var(--success))', color: 'hsl(var(--success-foreground))' } };
  }
  return {};
}

export function toast(props: ToastProps) {
  const { title, description, variant, duration, action } = props;
  
  return sonnerToast(title, {
    description,
    duration,
    action,
    ...getToastStyles(variant),
  });
}

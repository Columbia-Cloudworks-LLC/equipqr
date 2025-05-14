
import { toast as sonnerToast, Toast, ToastOptions as SonnerToastOptions } from 'sonner';
import { useCallback } from 'react';

export type ToastType = 'default' | 'success' | 'info' | 'warning' | 'destructive';

export interface ToastOptions extends Omit<SonnerToastOptions, 'type'> {
  type?: ToastType;
}

const mapTypeToVariant = (type?: ToastType): SonnerToastOptions['variant'] => {
  switch (type) {
    case 'destructive':
      return 'destructive';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'info':
      return 'default';
    default:
      return 'default';
  }
};

const createToastWithType = (
  message: string | React.ReactNode,
  options?: ToastOptions
) => {
  const { type, ...restOptions } = options || {};
  sonnerToast(message, {
    ...restOptions,
    variant: mapTypeToVariant(type)
  });
};

export const toast = {
  default: (message: string | React.ReactNode, options?: Omit<ToastOptions, 'type'>) =>
    createToastWithType(message, { ...options, type: 'default' }),
  success: (message: string | React.ReactNode, options?: Omit<ToastOptions, 'type'>) =>
    createToastWithType(message, { ...options, type: 'success' }),
  info: (message: string | React.ReactNode, options?: Omit<ToastOptions, 'type'>) =>
    createToastWithType(message, { ...options, type: 'info' }),
  warning: (message: string | React.ReactNode, options?: Omit<ToastOptions, 'type'>) =>
    createToastWithType(message, { ...options, type: 'warning' }),
  error: (message: string | React.ReactNode, options?: Omit<ToastOptions, 'type'>) =>
    createToastWithType(message, { ...options, type: 'destructive' }),
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,
  custom: sonnerToast.custom,
};

export const useToast = () => {
  const showToast = useCallback(
    (message: string | React.ReactNode, options?: ToastOptions) => {
      createToastWithType(message, options);
    },
    []
  );

  return {
    toast: showToast,
    dismiss: sonnerToast.dismiss,
    promise: sonnerToast.promise,
    custom: sonnerToast.custom,
  };
};

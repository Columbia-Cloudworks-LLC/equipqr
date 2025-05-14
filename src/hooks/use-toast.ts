
import { toast as sonnerToast } from 'sonner';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading' | 'destructive';

type ToastProps = {
  title: string;
  description?: string;
  variant?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function useToast() {
  const toast = ({
    title,
    description,
    variant = 'default',
    duration = 3000,
    action,
  }: ToastProps) => {
    const options: any = {
      duration,
    };

    if (action) {
      options.action = {
        label: action.label,
        onClick: action.onClick,
      };
    }

    switch (variant) {
      case 'success':
        return sonnerToast.success(title, {
          description,
          ...options,
        });
      case 'error':
      case 'destructive':
        return sonnerToast.error(title, {
          description,
          ...options,
        });
      case 'warning':
        return sonnerToast.warning(title, {
          description,
          ...options,
        });
      case 'info':
        return sonnerToast.info(title, {
          description,
          ...options,
        });
      case 'loading':
        return sonnerToast.loading(title, {
          description,
          ...options,
        });
      default:
        return sonnerToast(title, {
          description,
          ...options,
        });
    }
  };

  return { toast };
}

// Re-export toast function for direct imports
export const toast = ({
  title,
  description,
  variant = 'default',
  duration = 3000,
  action,
}: ToastProps) => {
  const options: any = {
    duration,
  };

  if (action) {
    options.action = {
      label: action.label,
      onClick: action.onClick,
    };
  }

  switch (variant) {
    case 'success':
      return sonnerToast.success(title, {
        description,
        ...options,
      });
    case 'error':
    case 'destructive':
      return sonnerToast.error(title, {
        description,
        ...options,
      });
    case 'warning':
      return sonnerToast.warning(title, {
        description,
        ...options,
      });
    case 'info':
      return sonnerToast.info(title, {
        description,
        ...options,
      });
    case 'loading':
      return sonnerToast.loading(title, {
        description,
        ...options,
      });
    default:
      return sonnerToast(title, {
        description,
        ...options,
      });
  }
};

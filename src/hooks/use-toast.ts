
import { toast as sonnerToast, type ToastT } from "sonner";
import * as React from "react";

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
  action?: React.ReactNode;
  onClick?: () => void;
};

const useToast = () => {
  return {};
};

// This is a simple wrapper to use the sonner toast library
// while maintaining compatibility with our existing code
function toast({ title, description, variant }: ToastProps = {}) {
  // Map our internal variant to sonner's options
  const options: any = {
    description
  };
  
  // Set the correct type based on our variant
  if (variant === "destructive") {
    options.style = { backgroundColor: 'hsl(var(--destructive))' };
    options.className = 'destructive';
  }
  
  return sonnerToast(title as string, options);
}

// Re-export the hook for backwards compatibility
export { useToast, toast };

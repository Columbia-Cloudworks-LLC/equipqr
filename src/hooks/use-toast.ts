
import { toast as sonnerToast, type ToastT } from "sonner";
import * as React from "react";

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
};

// Mock array to make the existing toaster component work
// This is needed for compatibility with the existing toaster.tsx
const toastArray: any[] = [];

// This is a simple wrapper to use the sonner toast library
// while maintaining compatibility with our existing code
function toast({ title, description, variant }: ToastProps = {}) {
  // Map our internal variant to sonner's variant
  const sonnerVariant = variant === "destructive" ? "error" : "default";
  
  return sonnerToast(title as string, {
    description,
    // Use properly typed variant for sonner
    variant: sonnerVariant,
  });
}

// Re-export the hook for backwards compatibility
// With a compatible API structure that includes toasts array
function useToast() {
  return {
    toast,
    toasts: toastArray, // Add this to fix the type error
  };
}

// Export the toast function and hook for use in components
export { useToast, toast };

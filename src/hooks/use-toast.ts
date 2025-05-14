
import { toast as sonnerToast, type Toast as SonnerToast } from "sonner";
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
  // Map our internal variant to sonner's type
  const sonnerType = variant === "destructive" ? "error" : "default";
  
  return sonnerToast(title as string, {
    description,
    // Use properly typed properties for sonner
    type: sonnerType,
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

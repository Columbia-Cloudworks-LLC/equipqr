
import { toast as sonnerToast } from "sonner";
import * as React from "react";

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
};

// This is a simple wrapper to use the sonner toast library
// while maintaining compatibility with our existing code
function toast({ title, description, variant }: ToastProps = {}) {
  // Map our internal variant to sonner's variant
  const sonnerVariant = variant === "destructive" ? "error" : "default";
  
  return sonnerToast(title as string, {
    description,
    // Use sonner's variant mapping
    type: sonnerVariant,
  });
}

// Re-export the hook for backwards compatibility
// but it's just using sonner toast under the hood
function useToast() {
  return {
    toast,
  };
}

// Export the toast function and hook for use in components
export { useToast, toast };

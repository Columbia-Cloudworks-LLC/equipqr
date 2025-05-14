
import { toast as sonnerToast } from "sonner";
import { useToast as useShadcnToast } from "@/components/ui/toast";

// Re-export the useToast hook from shadcn/ui
export const useToast = useShadcnToast;

// Export a toast function that uses sonner for simpler API
export const toast = sonnerToast;

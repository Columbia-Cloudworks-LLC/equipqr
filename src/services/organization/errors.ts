
import { toast } from '@/hooks/use-toast';

/**
 * Handle organization-related errors with appropriate toast messages
 */
export function handleOrganizationError(error: any, customMessage?: string): void {
  console.error('Organization service error:', error);
  
  const message = customMessage || 'An error occurred while performing this operation';
  
  toast.error("Error", {
    description: message
  });
}

/**
 * Shows a success toast for organization operations
 */
export function showSuccessToast(message: string): void {
  toast.success("Success", {
    description: message
  });
}

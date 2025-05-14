
import { toast } from '@/hooks/use-toast';

export function handleOrganizationError(error: unknown, customMessage?: string): void {
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred';
    
  console.error(`Organization service error: ${errorMessage}`, error);
  
  toast({
    title: "Error",
    description: customMessage || "An unexpected error occurred. Please try again later",
    variant: "destructive",
  });
}

export function showSuccessToast(message: string): void {
  toast({
    title: "Success",
    description: message,
  });
}

export function showErrorToast(message: string): void {
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
}

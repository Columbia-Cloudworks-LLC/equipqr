
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorAlertProps {
  errorMessage: string;
  isRetrying: boolean;
  retryingIn: number;
  onRetry: () => void;
}

export const ErrorAlert = ({ errorMessage, isRetrying, retryingIn, onRetry }: ErrorAlertProps) => {
  if (!errorMessage) return null;
  
  return (
    <Alert variant="destructive">
      <AlertTitle>Error loading invitations</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        {errorMessage}
        {isRetrying && (
          <div className="text-sm">
            Retrying in {retryingIn} seconds...
          </div>
        )}
        {!isRetrying && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="self-start mt-2"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

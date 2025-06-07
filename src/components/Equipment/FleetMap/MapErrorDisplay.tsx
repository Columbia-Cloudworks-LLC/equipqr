
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ApiConfig } from '@/config/app';

interface MapErrorDisplayProps {
  error: string;
  retryCount: number;
  onRetry: () => void;
}

export function MapErrorDisplay({ error, retryCount, onRetry }: MapErrorDisplayProps) {
  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
      <Alert className="w-full max-w-md mx-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="space-y-3">
          <div>
            <div className="font-medium">Map Loading Error</div>
            <div className="text-sm text-muted-foreground mt-1">{error}</div>
          </div>
          {retryCount < ApiConfig.retryConfig.maxRetries && (
            <Button 
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again (Attempt {retryCount + 1}/{ApiConfig.retryConfig.maxRetries + 1})
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

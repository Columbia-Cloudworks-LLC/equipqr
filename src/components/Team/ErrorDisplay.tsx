
import { AlertCircle, RefreshCw, Wrench } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorDisplayProps {
  error: string | null;
  onRetry: () => void;
  onUpgradeRole?: () => void;
  isViewer?: boolean;
  canDirectlyUpgrade?: boolean;
  isRequestingUpgrade?: boolean;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onUpgradeRole, 
  isViewer = false, 
  canDirectlyUpgrade = false,
  isRequestingUpgrade = false
}: ErrorDisplayProps) {
  // No error to display
  if (!error) return null;

  // Special handling for viewer-only permissions
  if (isViewer && onUpgradeRole) {
    return (
      <Card className="border-amber-300 bg-amber-50 shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            Limited Access
          </CardTitle>
          <CardDescription className="text-amber-700">
            You currently have view-only access to this team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700">
            As a viewer, your actions are limited. You can view team members and settings, 
            but cannot make changes to the team.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant={canDirectlyUpgrade ? "default" : "secondary"} 
            onClick={onUpgradeRole}
            disabled={isRequestingUpgrade}
          >
            <Wrench className="mr-2 h-4 w-4" />
            {isRequestingUpgrade ? "Requesting..." : canDirectlyUpgrade ? 
              "Upgrade to Manager" : "Request Manager Access"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Detect specific error types
  const isConnectionError = error.toLowerCase().includes('network') || 
                          error.toLowerCase().includes('timeout') || 
                          error.toLowerCase().includes('failed to fetch');
  
  const isAuthError = error.toLowerCase().includes('auth') || 
                    error.toLowerCase().includes('permission') || 
                    error.toLowerCase().includes('not authorized');
                    
  const isAccessError = error.toLowerCase().includes('member') || 
                      error.toLowerCase().includes('access');

  // Determine alert variant based on error type
  let variant: "destructive" | "default" = "destructive";
  
  if (isConnectionError) {
    variant = "default";  // Less alarming for connection issues
  }

  return (
    <Alert variant={variant} className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {isConnectionError ? "Connection Issue" : 
          isAuthError ? "Authorization Error" :
          isAccessError ? "Access Error" : "Error"}
      </AlertTitle>
      <AlertDescription className="flex flex-col space-y-4">
        <p>{error}</p>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

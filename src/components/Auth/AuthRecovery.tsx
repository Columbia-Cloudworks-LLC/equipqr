
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AuthRecoveryProps {
  message: string;
  onRetry: () => void;
}

export function AuthRecovery({ message, onRetry }: AuthRecoveryProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleClearStorage = () => {
    // Clear all auth-related storage
    localStorage.removeItem('authReturnTo');
    sessionStorage.removeItem('authRedirectCount');
    sessionStorage.removeItem('invitationPath');
    
    // Clear Supabase storage (not just auth)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Reload the page
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
          Authentication Problem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <div className="text-sm text-muted-foreground">
          <p>
            This could be caused by:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>An expired or invalid authentication token</li>
            <li>Browser storage inconsistencies</li>
            <li>Network connectivity issues</li>
            <li>Recent password changes</li>
          </ul>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-col gap-2 pt-4">
        <Button 
          onClick={handleRetry} 
          className="w-full" 
          disabled={isRetrying}
        >
          {isRetrying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            'Retry Authentication'
          )}
        </Button>
        <div className="flex w-full gap-2">
          <Button 
            onClick={handleClearStorage} 
            variant="outline" 
            className="w-1/2"
          >
            Clear Cache
          </Button>
          <Button 
            onClick={() => window.location.href = '/auth'} 
            variant="outline"
            className="w-1/2"
          >
            Sign In Again
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

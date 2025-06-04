
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SessionReadinessCheckerProps {
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

export function SessionReadinessChecker({ 
  children, 
  fallbackComponent 
}: SessionReadinessCheckerProps) {
  const { user, session, checkSession, repairSession } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const verifySession = async () => {
      if (!user || !session) {
        return; // Not authenticated, nothing to verify
      }

      if (retryCount >= 3) {
        console.error('SessionReadinessChecker: Max retries reached');
        setVerificationFailed(true);
        setIsVerifying(false);
        return;
      }

      setIsVerifying(true);
      setVerificationFailed(false);

      try {
        const isValid = await checkSession();
        
        if (!isValid) {
          console.log('SessionReadinessChecker: Session invalid, attempting repair');
          const repaired = await repairSession();
          
          if (!repaired) {
            setRetryCount(prev => prev + 1);
            // Retry after a delay
            setTimeout(verifySession, 2000 * (retryCount + 1));
            return;
          }
        }
        
        // Session is valid or was successfully repaired
        setIsVerifying(false);
        setRetryCount(0);
      } catch (error) {
        console.error('SessionReadinessChecker: Error during verification:', error);
        setRetryCount(prev => prev + 1);
        setTimeout(verifySession, 2000 * (retryCount + 1));
      }
    };

    verifySession();
  }, [user, session, checkSession, repairSession, retryCount]);

  // Show loading state while verifying
  if (isVerifying && user && session) {
    return fallbackComponent || (
      <div className="flex justify-center items-center min-h-screen bg-muted/20">
        <Card className="w-[350px] shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary my-4" />
            <h2 className="text-lg font-semibold mb-2">Preparing your session</h2>
            <p className="text-center text-muted-foreground text-sm">
              Please wait while we ensure your authentication is ready...
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Attempt {retryCount + 1}/3
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if verification failed
  if (verificationFailed) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-muted/20">
        <Card className="w-[350px] shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-8 w-8 text-destructive my-4" />
            <h2 className="text-lg font-semibold mb-2">Session Error</h2>
            <p className="text-center text-muted-foreground text-sm mb-4">
              There was a problem with your authentication session.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session is ready or user is not authenticated, render children
  return <>{children}</>;
}

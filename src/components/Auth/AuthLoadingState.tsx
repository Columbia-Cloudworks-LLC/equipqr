
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthLoadingStateProps {
  status: 'processing' | 'success' | 'error';
  message?: string;
  userEmail?: string;
  errorMessage?: string;
}

export function AuthLoadingState({ 
  status, 
  message, 
  userEmail, 
  errorMessage 
}: AuthLoadingStateProps) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/30">
      <Card className="w-[350px] shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === 'processing' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary my-4" />
              <h2 className="text-xl font-semibold mb-2">Completing your sign in</h2>
              <p className="text-center text-muted-foreground">
                {message || 'Please wait while we complete your authentication...'}
              </p>
              {userEmail && (
                <p className="text-sm mt-2 font-medium">{userEmail}</p>
              )}
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-primary my-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Successful</h2>
              <p className="text-center text-muted-foreground">
                {message || 'You have successfully signed in.'}
              </p>
              {userEmail && (
                <p className="text-sm mt-2 font-medium">{userEmail}</p>
              )}
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="h-10 w-10 text-destructive my-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
              <p className="text-center text-muted-foreground">
                {errorMessage || 'There was a problem completing your authentication.'}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

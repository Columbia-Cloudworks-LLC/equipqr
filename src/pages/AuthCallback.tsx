
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const { user, isLoading, resetAuthSystem } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [redirectCount, setRedirectCount] = useState(0);

  useEffect(() => {
    console.log("AuthCallback: Starting callback process");
    console.log("AuthCallback: Current URL:", window.location.href);
    console.log("AuthCallback: Auth loading state:", isLoading);
    console.log("AuthCallback: User state:", user ? "Has user" : "No user");
    
    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    const oauthErrorDescription = urlParams.get('error_description');
    
    if (oauthError) {
      console.error("AuthCallback: OAuth error detected:", { oauthError, oauthErrorDescription });
      setError(`OAuth Error: ${oauthErrorDescription || oauthError}`);
      setStatus('error');
      return;
    }

    // Track redirect attempts
    const storedCount = parseInt(sessionStorage.getItem('authRedirectCount') || '0', 10);
    setRedirectCount(storedCount + 1);
    sessionStorage.setItem('authRedirectCount', (storedCount + 1).toString());
    
    // Process authentication state
    if (!isLoading) {
      if (user) {
        console.log("AuthCallback: User authenticated, processing redirect");
        setStatus('success');
        
        // Clear redirect count on success
        sessionStorage.removeItem('authRedirectCount');
        
        // Get redirect destinations
        const invitationPath = sessionStorage.getItem('invitationPath');
        const returnTo = localStorage.getItem("authReturnTo") || '/';
        
        // Redirect after showing success state
        setTimeout(() => {
          if (invitationPath) {
            console.log("AuthCallback: Redirecting to invitation path:", invitationPath);
            sessionStorage.removeItem('invitationPath');
            navigate(invitationPath);
          } else {
            console.log("AuthCallback: Redirecting to return URL:", returnTo);
            localStorage.removeItem("authReturnTo");
            navigate(returnTo);
          }
        }, 1000);
      } else {
        console.log("AuthCallback: No user found after auth");
        
        // Check for too many redirect attempts
        if (redirectCount >= 3) {
          console.error("AuthCallback: Too many redirect attempts");
          setError("Authentication failed after multiple attempts. Please try signing in again.");
          setStatus('error');
        } else {
          // Simple redirect back to auth
          console.log("AuthCallback: Redirecting back to auth page");
          navigate('/auth');
        }
      }
    }
  }, [user, isLoading, navigate, redirectCount]);

  // Reset the auth system
  const handleResetAuth = async () => {
    console.log("AuthCallback: Resetting auth system");
    await resetAuthSystem();
    sessionStorage.removeItem('authRedirectCount');
    navigate('/auth');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/30">
      <Card className="w-[400px] shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === 'processing' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary my-4" />
              <h2 className="text-xl font-semibold mb-2">Completing your sign in</h2>
              <p className="text-center text-muted-foreground">
                Please wait while we process your authentication...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-green-500 my-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Successful</h2>
              <p className="text-center text-muted-foreground">
                You have successfully signed in. Redirecting you now...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="h-10 w-10 text-destructive my-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error || 'There was a problem completing your authentication.'}</AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleResetAuth}
                className="w-full mt-2"
                variant="default"
              >
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

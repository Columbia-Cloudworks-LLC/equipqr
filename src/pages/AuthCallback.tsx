
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

  useEffect(() => {
    console.log("AuthCallback: Current URL:", window.location.href);
    console.log("AuthCallback: Auth loading state:", isLoading);
    console.log("AuthCallback: User state:", user ? "Has user" : "No user");
    
    // Extract any OAuth error from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    const oauthErrorDescription = urlParams.get('error_description');
    
    if (oauthError) {
      console.error("OAuth error detected in URL:", { oauthError, oauthErrorDescription });
      setError(`OAuth Error: ${oauthErrorDescription || oauthError}`);
      setStatus('error');
      return;
    }
    
    // Get any stored invitation path or return URL
    const invitationPath = sessionStorage.getItem('invitationPath');
    const returnTo = localStorage.getItem("authReturnTo") || '/';
    
    // Increment the redirect attempt counter to prevent infinite loops
    const storedCount = sessionStorage.getItem('authRedirectCount') || '0';
    const redirectCount = parseInt(storedCount, 10) + 1;
    sessionStorage.setItem('authRedirectCount', redirectCount.toString());
    
    // Enhanced session handling for Microsoft OAuth
    if (!isLoading) {
      if (user) {
        console.log("User authenticated successfully, proceeding to redirect");
        setStatus('success');
        
        // Reset redirect count on successful login
        sessionStorage.removeItem('authRedirectCount');
        
        // Short delay to show success state, then redirect
        setTimeout(() => {
          if (invitationPath) {
            console.log("Redirecting to stored invitation path:", invitationPath);
            sessionStorage.removeItem('invitationPath');
            navigate(invitationPath);
          } else {
            console.log("Redirecting to return URL:", returnTo);
            localStorage.removeItem("authReturnTo");
            navigate(returnTo);
          }
        }, 1000);
      } else {
        console.log("Authentication failed or no user found");
        
        // Check for specific Microsoft OAuth database errors
        if (window.location.href.includes('error=')) {
          const errorParam = urlParams.get('error_description') || urlParams.get('error');
          if (errorParam && errorParam.includes('database')) {
            setError("There was a database issue during sign-in. This may be due to an existing account with the same email. Please try signing in with your original method or contact support.");
            setStatus('error');
            return;
          }
        }
        
        // If we've redirected too many times, show an error
        if (redirectCount >= 3) {
          setError("Authentication failed after multiple attempts. This may be due to an account linking issue. Please try signing in with your original method or clear your browser cache.");
          setStatus('error');
        } else {
          // Simple redirect back to auth without complex verification
          navigate('/auth');
        }
      }
    }
  }, [user, isLoading, navigate]);

  // Reset the auth system
  const handleResetAuth = () => {
    resetAuthSystem();
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

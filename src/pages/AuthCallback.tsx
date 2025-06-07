
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const { user, isLoading, resetAuthSystem } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [processingAuth, setProcessingAuth] = useState(true);
  const [status, setStatus] = useState<'processing' | 'verifying' | 'success' | 'error'>('processing');
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);

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
    
    const continueToDestination = async () => {
      setStatus('verifying');
      
      try {
        // Get detailed session information for debugging
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(`Session Error: ${sessionError.message}`);
          setStatus('error');
          return;
        }
        
        if (!sessionData?.session) {
          if (verificationAttempts < 3) {
            // Try a few more times with increasing delay
            console.log(`Verification attempt ${verificationAttempts + 1} failed, retrying...`);
            setVerificationAttempts(prev => prev + 1);
            setTimeout(continueToDestination, 1000 * (verificationAttempts + 1));
            return;
          }
          
          // After max attempts, show error with debug info
          setError("Authentication succeeded but we couldn't verify the session. Please try again.");
          setStatus('error');
          return;
        }
        
        // Collect debug information for Microsoft OAuth troubleshooting
        const userObj = sessionData.session.user;
        const debugData = {
          provider: userObj.app_metadata?.provider,
          hasEmail: !!userObj.email,
          emailVerified: userObj.email_verified,
          identityCount: userObj.identities?.length || 0,
          appMetadataKeys: userObj.app_metadata ? Object.keys(userObj.app_metadata) : [],
          userMetadataKeys: userObj.user_metadata ? Object.keys(userObj.user_metadata) : []
        };
        
        setDebugInfo(debugData);
        console.log("Auth callback debug info:", debugData);
        
        // Special handling for Microsoft OAuth without email
        if (debugData.provider === 'azure' && !debugData.hasEmail) {
          console.error("Microsoft OAuth: User authenticated but no email provided");
          setError("Microsoft sign-in completed but your email address was not provided. This may be due to account permissions or configuration issues.");
          setStatus('error');
          
          toast.error("Microsoft Sign-in Issue", {
            description: "Your Microsoft account didn't provide an email address. Please check your account settings or try a different sign-in method.",
            duration: 10000
          });
          return;
        }
        
        // Session is verified and working
        setStatus('success');
        
        // Reset redirect count on successful login
        sessionStorage.removeItem('authRedirectCount');
        
        // Wait a moment to show success state before redirecting
        setTimeout(() => {
          // If we have a stored invitation path, redirect to it
          if (invitationPath) {
            console.log("Redirecting to stored invitation path:", invitationPath);
            sessionStorage.removeItem('invitationPath'); // Clear the stored path
            navigate(invitationPath);
          } else {
            // Otherwise redirect to the return URL
            console.log("Redirecting to return URL:", returnTo);
            localStorage.removeItem("authReturnTo");
            navigate(returnTo);
          }
        }, 1500); // Increased delay to show success state
      } catch (verificationError) {
        console.error("Error verifying session:", verificationError);
        setError("There was a problem verifying your authentication.");
        setStatus('error');
      }
    };
    
    if (!isLoading) {
      if (user) {
        console.log("User authenticated, verifying session...");
        continueToDestination();
      } else {
        console.log("Authentication failed or no user found");
        
        // If we've redirected too many times, show an error
        if (redirectCount >= 3) {
          setError("Authentication failed after multiple attempts. Try clearing your browser cache or using a different browser.");
          setStatus('error');
        } else {
          navigate('/auth');
        }
      }
    }
  }, [user, isLoading, navigate, verificationAttempts]);

  // Reset the auth system
  const handleResetAuth = () => {
    resetAuthSystem();
    // Reload the page to start fresh
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
          
          {status === 'verifying' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary my-4" />
              <h2 className="text-xl font-semibold mb-2">Verifying your session</h2>
              <p className="text-center text-muted-foreground">
                Making sure your authentication is working correctly...
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Attempt {verificationAttempts + 1}/4
              </p>
              {debugInfo && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Provider: {debugInfo.provider || 'unknown'} | 
                    Email: {debugInfo.hasEmail ? 'provided' : 'missing'} |
                    Verified: {debugInfo.emailVerified ? 'yes' : 'no'}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-green-500 my-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Successful</h2>
              <p className="text-center text-muted-foreground">
                You have successfully signed in.
              </p>
              <p className="text-center text-muted-foreground mt-2">
                Redirecting you now...
              </p>
              {debugInfo && debugInfo.provider === 'azure' && (
                <p className="text-xs text-green-600 mt-2">
                  Microsoft OAuth completed successfully
                </p>
              )}
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="h-10 w-10 text-destructive my-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error || 'There was a problem completing your authentication.'}</AlertDescription>
              </Alert>
              
              {debugInfo && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Debug Info:</strong><br />
                    Provider: {debugInfo.provider || 'unknown'}<br />
                    Email: {debugInfo.hasEmail ? 'provided' : 'missing'}<br />
                    Identities: {debugInfo.identityCount}<br />
                    Metadata: {debugInfo.appMetadataKeys.length} app, {debugInfo.userMetadataKeys.length} user
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleResetAuth}
                className="w-full mt-2"
                variant="default"
              >
                Reset Authentication & Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetAuthState } from '@/utils/authInterceptors';

export default function AuthCallback() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [processingAuth, setProcessingAuth] = useState(true);

  useEffect(() => {
    console.log("AuthCallback: Current URL:", window.location.href);
    console.log("AuthCallback: Current hostname:", window.location.hostname);
    
    // Check if we're coming from an invitation
    const invitationPath = sessionStorage.getItem('invitationPath');
    
    // Increment the redirect attempt counter to prevent infinite loops
    const storedCount = sessionStorage.getItem('authRedirectCount') || '0';
    const redirectCount = parseInt(storedCount, 10) + 1;
    sessionStorage.setItem('authRedirectCount', redirectCount.toString());
    
    if (!isLoading) {
      if (user) {
        console.log("User authenticated:", user);
        // Reset redirect count on successful login
        sessionStorage.removeItem('authRedirectCount');
        
        toast.success('Logged in successfully');
        
        // If we have a stored invitation path, redirect to it
        if (invitationPath) {
          console.log("Redirecting to stored invitation path:", invitationPath);
          sessionStorage.removeItem('invitationPath'); // Clear the stored path
          
          // Small delay to ensure auth state is fully propagated
          setTimeout(() => {
            navigate(invitationPath);
          }, 500);
        } else {
          // Check for stored return URL
          const returnTo = localStorage.getItem("authReturnTo") || '/';
          console.log("Redirecting to return URL:", returnTo);
          localStorage.removeItem("authReturnTo");
          
          // Otherwise redirect to the dashboard
          navigate(returnTo);
        }
      } else {
        console.log("Authentication failed or no user found");
        
        // If we've redirected too many times, show an error
        if (redirectCount >= 3) {
          setError("Authentication failed after multiple attempts. Try clearing your browser cache or using a different browser.");
          setProcessingAuth(false);
        } else {
          toast.error('Authentication failed');
          navigate('/auth');
        }
      }
    }
  }, [user, isLoading, navigate]);

  // Reset the auth system
  const handleResetAuth = () => {
    resetAuthState();
    // Reload the page to start fresh
    sessionStorage.removeItem('authRedirectCount');
    navigate('/auth');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/30">
      <Card className="w-[350px] shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-6">
          {error ? (
            <>
              <AlertCircle className="h-10 w-10 text-destructive my-4" />
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <button 
                onClick={handleResetAuth}
                className="w-full mt-2 px-4 py-2 rounded bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
              >
                Reset Authentication & Try Again
              </button>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary my-4" />
              <p className="text-center text-muted-foreground">
                {isLoading ? 'Logging you in...' : 'Redirecting...'}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SignInForm } from "@/components/Auth/SignInForm";
import { SignUpForm } from "@/components/Auth/SignUpForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { resetAuthState } from "@/utils/authInterceptors";
import { setupAuthInterceptors } from "@/utils/authInterceptors";
import { getAuthorizedDomains, isAuthorizedDomain } from "@/utils/authUtils";

export default function Auth() {
  const { user, signInWithGoogle, isLoading, checkSession } = useAuth();
  const [email, setEmail] = useState("");
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Set up global auth interceptors
  useEffect(() => {
    const subscription = setupAuthInterceptors();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Verify current domain is authorized
  useEffect(() => {
    const currentDomain = window.location.hostname;
    if (!isAuthorizedDomain(currentDomain)) {
      console.error("Current domain is not in the authorized list:", currentDomain);
      setAuthError(`Authentication error: Unauthorized domain (${currentDomain})`);
    } else {
      console.log("Current domain is authorized:", currentDomain);
    }
  }, []);

  // Get returnTo URL from state or query params
  const getReturnUrl = () => {
    // First check location state (from programmatic redirects)
    if (location.state?.returnTo) {
      console.log("Found returnTo in location state:", location.state.returnTo);
      return location.state.returnTo;
    }

    // Then check URL query parameters (from QR scans or direct links)
    const params = new URLSearchParams(location.search);
    const returnTo = params.get("returnTo");
    
    if (returnTo) {
      // Verify the URL is relative for security
      if (returnTo.startsWith("/")) {
        console.log("Found returnTo in query params:", returnTo);
        return returnTo;
      }
    }

    // Check localStorage for any saved return URL
    const storedReturnTo = localStorage.getItem("authReturnTo");
    if (storedReturnTo) {
      console.log("Found returnTo in localStorage:", storedReturnTo);
      return storedReturnTo;
    }

    // Default to home
    return "/";
  };

  const returnTo = getReturnUrl();

  // Get redirect count from session storage
  useEffect(() => {
    const storedCount = sessionStorage.getItem('authRedirectCount');
    if (storedCount) {
      const count = parseInt(storedCount, 10);
      setRedirectAttempts(count);
      
      // If we've already redirected too many times, show an error
      if (count >= 3) {
        setAuthError("Login system is experiencing issues. This could be due to missing account data.");
      }
    }
  }, []);

  useEffect(() => {
    // Save the return URL to localStorage to persist through redirects
    if (returnTo && returnTo !== "/") {
      localStorage.setItem("authReturnTo", returnTo);
      console.log("Saved returnTo to localStorage:", returnTo);
    }
  }, [returnTo]);

  // Function to validate the session and redirect if needed
  const validateAndRedirect = async () => {
    if (redirectAttempts >= 3) {
      // Don't try to redirect anymore
      console.log("Too many redirect attempts, not redirecting");
      return;
    }
    
    try {
      // Check if the session is valid
      const isValid = await checkSession();
      
      if (isValid) {
        console.log("User session is valid, navigating to:", returnTo);
        // Clear the stored return URL as we're using it now
        localStorage.removeItem("authReturnTo");
        // Reset redirect count
        sessionStorage.removeItem('authRedirectCount');
        navigate(returnTo, { replace: true });
      } else {
        console.log("No valid session found, showing auth forms");
      }
    } catch (error) {
      console.error("Error validating session:", error);
      setAuthError("Error validating your session. Please try again.");
    }
  };

  // Check session when component mounts
  useEffect(() => {
    validateAndRedirect();
  }, []);

  // Check again when user changes
  useEffect(() => {
    if (user) {
      validateAndRedirect();
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      // Log the current hostname and domains list for debugging
      console.log("Current hostname:", window.location.hostname);
      console.log("Authorized domains:", getAuthorizedDomains());
      
      // Save the return URL in localStorage before redirecting to Google
      if (returnTo && returnTo !== "/") {
        localStorage.setItem("authReturnTo", returnTo);
        console.log("Saved returnTo before Google auth:", returnTo);
      }
      await signInWithGoogle();
    } catch (error) {
      // Error is already handled in the auth context
    }
  };

  // Reset the auth system
  const handleResetAuth = () => {
    resetAuthState();
    // Reload the page to start fresh
    window.location.reload();
  };

  // Don't render a redirect since we're using useEffect to handle redirects
  if (user && !isLoading && !authError) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">EquipQR</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        
        {authError && (
          <div className="px-6 pb-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{authError}</AlertDescription>
              
              <button 
                onClick={handleResetAuth}
                className="w-full mt-2 px-4 py-2 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm"
              >
                Reset Authentication
              </button>
            </Alert>
          </div>
        )}
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <SignInForm 
              email={email} 
              setEmail={setEmail} 
              handleGoogleSignIn={handleGoogleSignIn}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="signup">
            <SignUpForm 
              email={email} 
              setEmail={setEmail}
              handleGoogleSignIn={handleGoogleSignIn}
              isLoading={isLoading} 
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

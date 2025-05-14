
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, checkSession } = useAuth();
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [redirectCount, setRedirectCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect count from session storage to prevent loops
  useEffect(() => {
    const storedCount = sessionStorage.getItem('authRedirectCount');
    if (storedCount) {
      setRedirectCount(parseInt(storedCount, 10));
    }
  }, []);

  useEffect(() => {
    const validateSession = async () => {
      try {
        // If still loading, wait
        if (isLoading) return;
        
        // If no user, session is invalid
        if (!user) {
          console.log("ProtectedRoute: No user found, marking session as invalid");
          setIsSessionValid(false);
          setIsChecking(false);
          return;
        }
        
        // Double-check the session is valid
        const isValid = await checkSession();
        console.log("ProtectedRoute: Session check result:", isValid);
        setIsSessionValid(isValid);
          
        if (!isValid) {
          console.warn("ProtectedRoute: Session exists but is invalid");
        }
      } catch (err) {
        console.error("ProtectedRoute: Error checking session:", err);
        // On error, assume session is invalid for security
        setIsSessionValid(false);
        // Show error to user
        toast.error("Authentication error", {
          description: "There was a problem verifying your session. Please try logging in again."
        });
      } finally {
        setIsChecking(false);
      }
    };
    
    validateSession();
  }, [user, isLoading, checkSession]);

  useEffect(() => {
    if (!isLoading && !isSessionValid && isSessionValid !== null && !isChecking) {
      // Safety check - prevent redirect loops by setting a redirect counter
      const newRedirectCount = redirectCount + 1;
      sessionStorage.setItem('authRedirectCount', newRedirectCount.toString());
      
      // If we've redirected too many times, show an error instead of redirecting again
      if (newRedirectCount >= 3) {
        console.error("ProtectedRoute: Too many redirects detected, breaking the loop");
        toast.error("Authentication error", {
          description: "Login system is having trouble. Please clear your browser cache and try again."
        });
        // Don't redirect - show error page instead
        return;
      }
      
      // When redirecting to login, pass the current path as state
      const currentPath = location.pathname + location.search + location.hash;
      console.log("ProtectedRoute: Redirecting unauthorized user to /auth with returnTo:", currentPath);
      
      // Save to localStorage as well for persistence
      localStorage.setItem("authReturnTo", currentPath);
      
      navigate("/auth", { 
        state: { returnTo: currentPath },
        replace: true
      });
    } else if (isSessionValid) {
      // Reset redirect count when successfully authenticated
      sessionStorage.removeItem('authRedirectCount');
    }
  }, [isSessionValid, isLoading, isChecking, navigate, location, redirectCount]);

  // Show loading state when authenticating
  if (isLoading || isChecking || isSessionValid === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading</h2>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show error page if too many redirects detected
  if (redirectCount >= 3) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-background border rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-destructive">Authentication Error</h2>
          <p className="mb-4">The login system is experiencing issues. This could be due to:</p>
          <ul className="list-disc text-left pl-6 mb-4">
            <li>Browser cache or cookie issues</li>
            <li>Missing user profile data</li>
            <li>Session token issues</li>
          </ul>
          <p className="mb-6">Please try the following:</p>
          <div className="space-y-3">
            <button 
              className="w-full px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                sessionStorage.removeItem('authRedirectCount');
                localStorage.removeItem('authReturnTo');
                navigate('/auth', { replace: true });
              }}
            >
              Clear Data & Go To Login
            </button>
            <button 
              className="w-full px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to auth page if session is invalid
  if (!isSessionValid) {
    // When using Navigate, also pass the current path as state
    const currentPath = location.pathname + location.search + location.hash;
    console.log("ProtectedRoute: Using Navigate to redirect to /auth with returnTo:", currentPath);
    
    // Save to localStorage as well for persistence
    localStorage.setItem("authReturnTo", currentPath);
    
    return <Navigate to="/auth" state={{ returnTo: currentPath }} replace />;
  }

  // If the session is valid, render the protected content
  return <>{children}</>;
}

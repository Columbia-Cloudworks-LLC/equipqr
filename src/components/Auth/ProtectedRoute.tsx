
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, checkSession } = useAuth();
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const validateSession = async () => {
      // If still loading, wait
      if (isLoading) return;
      
      // If no user, session is invalid
      if (!user) {
        console.log("ProtectedRoute: No user found, marking session as invalid");
        setIsSessionValid(false);
        return;
      }
      
      try {
        // Double-check the session is valid
        const isValid = await checkSession();
        console.log("ProtectedRoute: Session check result:", isValid);
        setIsSessionValid(isValid);
          
        if (!isValid) {
          console.warn("ProtectedRoute: Session exists but is invalid");
        }
      } catch (err) {
        // On error, assume session is valid to avoid blocking user
        console.error("ProtectedRoute: Error checking session:", err);
        setIsSessionValid(true); 
      }
    };
    
    validateSession();
  }, [user, isLoading, checkSession]);

  useEffect(() => {
    if (!isLoading && !isSessionValid && isSessionValid !== null) {
      // When redirecting to login, pass the current path as state
      const currentPath = location.pathname + location.search + location.hash;
      console.log("ProtectedRoute: Redirecting unauthorized user to /auth with returnTo:", currentPath);
      
      // Save to localStorage as well for persistence
      localStorage.setItem("authReturnTo", currentPath);
      
      navigate("/auth", { 
        state: { returnTo: currentPath },
        replace: true
      });
    }
  }, [isSessionValid, isLoading, navigate, location]);

  // Show loading state when authenticating
  if (isLoading || isSessionValid === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading</h2>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
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

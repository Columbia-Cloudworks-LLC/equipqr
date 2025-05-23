
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AuthRecovery } from "./AuthRecovery";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, checkSession, resetAuthSystem } = useAuth();
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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
        
        // If we're on a reload (not coming from auth page), check the session
        const isValid = await checkSession();
          
        console.log("ProtectedRoute: Session validation result:", isValid);
        setIsSessionValid(isValid);
      } catch (err) {
        console.error("ProtectedRoute: Error checking session:", err);
        // On error, assume session is invalid for security
        setIsSessionValid(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    validateSession();
  }, [user, isLoading, checkSession]);

  useEffect(() => {
    // Only redirect if explicitly not valid and not still checking
    if (!isLoading && !isSessionValid && isSessionValid !== null && !isChecking) {
      // If we're showing recovery, don't redirect
      if (showRecovery) return;
      
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
  }, [isSessionValid, isLoading, isChecking, navigate, location, showRecovery]);

  // Handle retry from recovery component
  const handleRetry = async () => {
    setShowRecovery(false);
    setIsChecking(true);
    
    // Force refresh the session check
    const isValid = await checkSession();
    if (isValid) {
      setIsSessionValid(true);
    } else {
      // If still not valid, redirect to login
      navigate("/auth", { replace: true });
    }
  };

  // If showing recovery UI
  if (showRecovery) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
        <AuthRecovery 
          message={recoveryError || "There was a problem with your authentication."}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Show loading state when authenticating
  if (isLoading || isChecking || isSessionValid === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Verifying Authentication</h2>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Checking your login status...
          </p>
        </div>
      </div>
    );
  }

  // If the session is valid, render the protected content
  return <>{children}</>;
}

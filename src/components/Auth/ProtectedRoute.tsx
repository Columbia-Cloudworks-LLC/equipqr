
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AuthRecovery } from "./AuthRecovery";
import { completeAuthVerification } from "@/utils/auth/sessionVerification";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, resetAuthSystem } = useAuth();
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [redirectCount, setRedirectCount] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairAttempts, setRepairAttempts] = useState(0);
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
        
        // Check if session is valid using enhanced verification
        console.log("ProtectedRoute: Checking session with API call verification");
        setIsRepairing(true);
        const isValid = await completeAuthVerification(true, false);
        setIsRepairing(false);
        
        console.log("ProtectedRoute: Session verification result:", isValid);
        
        setIsSessionValid(isValid);
          
        if (!isValid) {
          console.warn("ProtectedRoute: Session invalid after API verification");
          
          // If redirect count is high, show recovery instead of redirecting again
          if (redirectCount >= 2) {
            console.error("ProtectedRoute: Multiple redirects detected, showing recovery UI");
            setRecoveryError("Authentication session could not be validated after multiple attempts");
            setShowRecovery(true);
            return;
          }
          
          // If session is invalid but we have a user, attempt full reset
          if (user && !isValid) {
            console.warn("ProtectedRoute: Session invalid with user present, resetting auth system");
            setIsRepairing(true);
            setRepairAttempts(prev => prev + 1);
            
            if (repairAttempts < 2) {
              // Try repairing with our enhanced verification
              const repaired = await completeAuthVerification(true, true);
              
              if (repaired) {
                console.log("ProtectedRoute: Session successfully repaired");
                setIsSessionValid(true);
                setIsChecking(false);
                setIsRepairing(false);
                return;
              }
            }
            
            // If repair failed or too many attempts, reset auth system
            await resetAuthSystem();
            setIsRepairing(false);
          }
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
  }, [user, isLoading, redirectCount, resetAuthSystem, repairAttempts]);

  useEffect(() => {
    if (!isLoading && !isSessionValid && isSessionValid !== null && !isChecking) {
      // If we're showing recovery, don't redirect
      if (showRecovery) return;
      
      // Safety check - prevent redirect loops by setting a redirect counter
      const newRedirectCount = redirectCount + 1;
      sessionStorage.setItem('authRedirectCount', newRedirectCount.toString());
      
      // If we've redirected too many times, show recovery instead of redirecting again
      if (newRedirectCount >= 3) {
        console.error("ProtectedRoute: Too many redirects detected, breaking the loop");
        setRecoveryError("Login system is having trouble after multiple redirect attempts");
        setShowRecovery(true);
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
  }, [isSessionValid, isLoading, isChecking, navigate, location, redirectCount, showRecovery]);

  // Handle retry from recovery component
  const handleRetry = async () => {
    setShowRecovery(false);
    // Reset redirect count
    sessionStorage.removeItem('authRedirectCount');
    setRedirectCount(0);
    setIsChecking(true);
    
    // Force refresh the session check
    const isValid = await completeAuthVerification(true, true);
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
  if (isLoading || isChecking || isRepairing || isSessionValid === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Verifying Authentication</h2>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {isRepairing ? "Repairing session..." : "Checking your login status..."}
          </p>
        </div>
      </div>
    );
  }

  // If the session is valid, render the protected content
  return <>{children}</>;
}

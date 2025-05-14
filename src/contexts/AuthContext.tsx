import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSessionInfo, validateSession } from "@/utils/storageAdapter";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state listener");
    
    try {
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          console.log("AuthProvider: Auth state changed", event);
          
          // Update state synchronously first
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          // Then handle side effects in setTimeout to avoid Supabase internal issues
          setTimeout(() => {
            if (event === 'SIGNED_IN') {
              // Verify user profile exists
              if (currentSession?.user) {
                checkUserProfile(currentSession.user.id).catch(console.error);
              }
              
              toast.success("Signed in successfully", {
                description: "Welcome back!"
              });
            } else if (event === 'SIGNED_OUT') {
              toast.success("Signed out successfully", {
                description: "You have been signed out"
              });
              
              // Clear any leftover session data for safety
              clearStorageData();
            }
          }, 0);
        }
      );

      // THEN check for existing session
      console.log("AuthProvider: Checking for existing session");
      supabase.auth.getSession().then(({ data: { session: existingSession }, error }) => {
        console.log("AuthProvider: Session check complete", !!existingSession);
        
        if (error) {
          console.error("AuthProvider: Session retrieval error", error);
          setInitializationError("There was an error retrieving your session.");
          toast.error("Session error", {
            description: "There was an error retrieving your session. Please sign in again."
          });
          
          // Attempt to clear corrupted session data
          clearStorageData();
        }
        
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        
        // If we have a user, verify the profile exists
        if (existingSession?.user) {
          checkUserProfile(existingSession.user.id).catch(console.error);
        }
        
        setIsLoading(false);
        
        // Log session diagnostics
        getSessionInfo().then(sessionInfo => {
          console.log("AuthProvider: Session diagnostics", sessionInfo);
        }).catch(console.error);
      }).catch(error => {
        console.error("AuthProvider: Unexpected error during initialization", error);
        setInitializationError("Unexpected error during initialization.");
        setIsLoading(false);
      });

      return () => {
        console.log("AuthProvider: Unsubscribing from auth state changes");
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("AuthProvider: Critical error during setup", error);
      setInitializationError("Critical error during authentication setup.");
      setIsLoading(false);
      return () => {};
    }
  }, []);

  // Check if the user profile exists in the user_profiles table
  const checkUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, org_id')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error("AuthProvider: Error checking user profile", error);
        return false;
      }
      
      if (!data || !data.org_id) {
        console.warn("AuthProvider: User profile missing or incomplete for user", userId);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("AuthProvider: Error in checkUserProfile", error);
      return false;
    }
  };

  // Helper function to clear all storage data related to auth
  const clearStorageData = () => {
    console.log("AuthProvider: Clearing all storage data");
    
    // Clear Supabase-specific storage keys
    const projectRef = "oxeheowbfsshpyldlskb";
    const keys = [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token-code-verifier`,
      "supabase.auth.token",
      "supabase-auth-token"
    ];
    
    // Clear from localStorage
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`AuthProvider: Removed ${key} from localStorage`);
      } catch (e) {
        console.error(`AuthProvider: Failed to remove ${key} from localStorage`, e);
      }
    });
    
    // Also clear redirect counter to prevent loops
    sessionStorage.removeItem('authRedirectCount');
    
    // Reset state
    setUser(null);
    setSession(null);
  };

  // Helper function to get the proper auth callback URL based on current domain
  const getRedirectUrl = () => {
    const domain = window.location.origin;
    return `${domain}/auth/callback`;
  };

  /**
   * Verifies if the current session is valid
   * Returns true if session is valid, false otherwise
   */
  const checkSession = async (): Promise<boolean> => {
    try {
      console.log("AuthProvider: Checking session validity");
      
      // First check internal state
      if (session && user) {
        const isValid = await validateSession(session);
        if (isValid) {
          console.log("AuthProvider: Session is valid");
          
          // Check if this user has the expected database entries
          const hasProfile = await checkUserProfile(user.id);
          if (!hasProfile) {
            console.warn("AuthProvider: User profile or org_id missing");
            return false;
          }
          
          return true;
        } else {
          console.warn("AuthProvider: Session validation failed");
        }
      }
      
      // If internal state is invalid, check with Supabase directly
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("AuthProvider: Error checking session", error);
        return false;
      }
      
      const validSession = !!data.session;
      console.log("AuthProvider: Session check result", validSession);
      
      // Update state if needed
      if (validSession && !session) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        // Also verify profile
        if (data.session?.user) {
          const hasProfile = await checkUserProfile(data.session.user.id);
          if (!hasProfile) {
            console.warn("AuthProvider: User profile missing after session check");
            return false;
          }
        }
      }
      
      return validSession;
    } catch (error) {
      console.error("AuthProvider: Session check failed", error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      setIsLoading(true);
      console.log("AuthProvider: Signing up user", email);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;
      
      toast.success("Account created successfully", {
        description: "Please check your email to verify your account"
      });
    } catch (error: any) {
      console.error("AuthProvider: Sign up error", error);
      toast.error("Error signing up", {
        description: error.message || "An error occurred during sign up"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("AuthProvider: Signing in user", email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("AuthProvider: Sign in error", error);
      toast.error("Error signing in", {
        description: error.message || "Invalid email or password"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      console.log("AuthProvider: Signing in with Google");
      const redirectTo = getRedirectUrl();
      console.log("AuthProvider: Using redirect URL:", redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("AuthProvider: Google sign in error", error);
      toast.error("Error signing in with Google", {
        description: error.message || "An error occurred during sign in"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("AuthProvider: Signing out user");
      
      // Check if we have a valid session before attempting to sign out
      const sessionInfo = await getSessionInfo();
      console.log("AuthProvider: Pre-signout session diagnostics", sessionInfo);
      
      // Clear local state first to prevent UI flashing with old data
      clearStorageData();
      
      // Then call Supabase signOut to properly invalidate the session on the server
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("AuthProvider: Sign out error", error);
        
        // For other errors, show the error
        toast.error("Error signing out", {
          description: error.message || "An error occurred during sign out"
        });
        
        throw error;
      }
      
      // Double check that we're actually signed out after a short delay
      setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.warn("AuthProvider: Still have session after signout, forcing cleanup");
          clearStorageData();
        } else {
          console.log("AuthProvider: Successfully signed out and cleared session");
        }
      }, 100);

      toast.success("Signed out", {
        description: "You have been signed out"
      });
      
      // Navigate to auth page after successful logout
      window.location.href = "/auth";
      
    } catch (error: any) {
      console.error("AuthProvider: Sign out error", error);
      toast.error("Error signing out", {
        description: error.message || "An error occurred during sign out"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      console.log("AuthProvider: Resetting password for", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl().replace('/auth/callback', '/auth/reset-password'),
      });

      if (error) throw error;

      toast.success("Password reset email sent", {
        description: "Please check your email for password reset instructions"
      });
    } catch (error: any) {
      console.error("AuthProvider: Password reset error", error);
      toast.error("Error resetting password", {
        description: error.message || "An error occurred"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Display an error UI if we had a critical initialization error
  if (initializationError && !isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6 bg-card border rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-destructive">Authentication Error</h2>
          <p className="mb-6">{initializationError}</p>
          <button 
            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              clearStorageData();
              window.location.href = "/auth";
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

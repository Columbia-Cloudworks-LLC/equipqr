
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SessionManager } from './SessionManager';
import { StorageManager } from './StorageManager';
import { toast } from 'sonner';

// Define authentication event types
export type AuthEventType = 
  | 'SIGNED_IN' 
  | 'SIGNED_OUT' 
  | 'USER_UPDATED' 
  | 'TOKEN_REFRESHED' 
  | 'PASSWORD_RECOVERY'
  | 'ERROR';

// Define event listener type
export type AuthEventListener = (event: AuthEventType, session: Session | null) => void;

// Create singleton instances - now exported
export const sessionManager = new SessionManager();
export const storageManager = new StorageManager();

/**
 * The central authentication service that provides unified
 * authentication functionality across the application
 */
export class AuthService {
  private listeners: AuthEventListener[] = [];
  private sessionSubscription: { unsubscribe: () => void } | null = null;
  private currentUser: User | null = null;
  private currentSession: Session | null = null;
  
  constructor() {
    this.initialize();
  }

  /**
   * Initialize the auth service and set up event listeners
   */
  private async initialize(): Promise<void> {
    console.log('AuthService: Initializing');
    
    // Set up auth state change listener
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthService: Auth state change event:', event);
      
      if (event === 'SIGNED_OUT') {
        this.handleSignOut();
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.handleSignIn(session);
      }
      
      // Update internal state
      this.currentSession = session;
      this.currentUser = session?.user ?? null;
      
      // Notify all listeners
      this.notifyListeners(event as AuthEventType, session);
    });
    
    this.sessionSubscription = data.subscription;
    
    // Initial session check
    const { data: { session } } = await supabase.auth.getSession();
    this.currentSession = session;
    this.currentUser = session?.user ?? null;
  }

  /**
   * Handle sign in event
   */
  private async handleSignIn(session: Session | null): Promise<void> {
    if (session) {
      console.log('AuthService: Handling sign-in');
      await sessionManager.fixSessionAfterSignIn();
    }
  }

  /**
   * Handle sign out event
   */
  private handleSignOut(): Promise<void> {
    console.log('AuthService: Handling sign-out');
    return storageManager.clearAuthData();
  }

  /**
   * Add an event listener
   */
  public addEventListener(listener: AuthEventListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of an auth event
   */
  private notifyListeners(event: AuthEventType, session: Session | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (error) {
        console.error('AuthService: Error in event listener', error);
      }
    });
  }

  /**
   * Get the current authenticated user
   */
  public getUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get the current session
   */
  public getSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Check if there is a valid session
   */
  public async checkSession(): Promise<boolean> {
    return sessionManager.checkSession();
  }

  /**
   * Get detailed session information for debugging
   */
  public async getSessionInfo(): Promise<Record<string, any>> {
    return sessionManager.getSessionInfo();
  }

  /**
   * Attempt session repair
   */
  public async repairSession(): Promise<boolean> {
    return sessionManager.attemptSessionRecovery();
  }

  /**
   * Sign in with email and password
   */
  public async signIn(email: string, password: string): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error("Failed to sign in", {
          description: error.message
        });
        throw error;
      }
      
      if (data.session) {
        toast.success("Successfully signed in");
      }
      
      return data.session;
    } catch (error) {
      console.error('AuthService: Error during sign-in:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google OAuth
   */
  public async signInWithGoogle(): Promise<void> {
    try {
      // Use window location for redirects for consistency
      const siteUrl = window.location.origin;
      const callbackUrl = `${siteUrl}/auth/callback`;
      
      console.log("AuthService: Google sign-in using callback URL:", callbackUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'select_account'
          }
        },
      });

      if (error) {
        console.error('AuthService: Google sign-in error:', error);
        toast.error("Failed to sign in with Google", {
          description: error.message
        });
        throw error;
      }
    } catch (error) {
      console.error('AuthService: Unexpected error during Google sign-in:', error);
      toast.error("An unexpected error occurred");
      throw error;
    }
  }

  /**
   * Create a new user account
   */
  public async signUp(email: string, password: string, userData?: any): Promise<void> {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        console.error('AuthService: Sign-up error:', error);
        toast.error("Failed to create account", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Account created successfully", {
        description: "Please check your email for verification instructions"
      });
    } catch (error) {
      console.error('AuthService: Unexpected error during sign-up:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  public async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('AuthService: Password reset error:', error);
        toast.error("Failed to send password reset email", {
          description: error.message
        });
        throw error;
      }
      
      toast.success("Password reset email sent");
    } catch (error) {
      console.error('AuthService: Unexpected error during password reset:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  public async signOut(): Promise<void> {
    try {
      console.log('AuthService: Starting signOut process');
      
      // First check if we actually have a session
      const hasSession = await this.checkSession();
      console.log('AuthService: Current session before signOut:', hasSession ? 'Valid' : 'No session');
      
      // Clear our own auth state first
      await storageManager.clearAuthData();
      
      // Then attempt Supabase signOut with improved error handling
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (signOutError) {
        console.error('AuthService: Error during supabase.auth.signOut:', signOutError);
      }

      // Double-check session state after logout
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          console.warn('AuthService: Session still exists after signOut, forcing cleanup');
          await supabase.auth.signOut({ scope: 'global' });
        } else {
          console.log('AuthService: Sign-out completed successfully');
        }
      } catch (checkError) {
        console.error('AuthService: Error checking session after signOut:', checkError);
      }
      
    } catch (error) {
      console.error('AuthService: Error during signOut:', error);
      toast.error("There was an issue during sign out, but local tokens have been cleared.");
      throw error;
    }
  }

  /**
   * Clean up resources when the service is no longer needed
   */
  public destroy(): void {
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
      this.sessionSubscription = null;
    }
    this.listeners = [];
  }

  /**
   * Perform a complete auth system reset
   */
  public async resetAuthSystem(): Promise<void> {
    try {
      // First try explicit sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.error('AuthService: Error during explicit signOut in reset:', e);
      }
      
      // Then clear all storage
      await storageManager.clearAuthData();
      
      // Clear auth redirect helpers
      sessionStorage.removeItem('authRedirectCount');
      localStorage.removeItem('authReturnTo');
      
      console.log('AuthService: Auth system reset complete');
    } catch (error) {
      console.error('AuthService: Error during auth system reset:', error);
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

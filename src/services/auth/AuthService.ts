
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from './SessionManager';
import { storageManager } from './StorageManager';
import { authEventManager, AuthEventType, AuthEventListener } from './AuthEvents';
import { authMethods } from './AuthMethods';
import { authSignOut } from './AuthSignOut';

/**
 * The central authentication service that provides unified
 * authentication functionality across the application
 */
export class AuthService {
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
      authEventManager.notifyListeners(event as AuthEventType, session);
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
    return authEventManager.addEventListener(listener);
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
    return authMethods.signIn(email, password);
  }

  /**
   * Sign in with Google OAuth
   */
  public async signInWithGoogle(): Promise<void> {
    return authMethods.signInWithGoogle();
  }

  /**
   * Sign in with Microsoft OAuth
   */
  public async signInWithMicrosoft(): Promise<void> {
    return authMethods.signInWithMicrosoft();
  }

  /**
   * Create a new user account
   */
  public async signUp(email: string, password: string, userData?: any): Promise<void> {
    return authMethods.signUp(email, password, userData);
  }

  /**
   * Send password reset email
   */
  public async resetPassword(email: string): Promise<void> {
    return authMethods.resetPassword(email);
  }

  /**
   * Sign out the current user
   */
  public async signOut(): Promise<void> {
    return authSignOut.signOut();
  }

  /**
   * Perform a complete auth system reset
   */
  public async resetAuthSystem(): Promise<void> {
    return authSignOut.resetAuthSystem();
  }

  /**
   * Clean up resources when the service is no longer needed
   */
  public destroy(): void {
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
      this.sessionSubscription = null;
    }
    authEventManager.clearListeners();
  }
}

// Create singleton instance
export const authService = new AuthService();

// Re-export instances from other files for easy access
export { sessionManager } from './SessionManager';
export { storageManager } from './StorageManager';
export { sessionValidator } from './SessionValidator';
export { sessionRecovery } from './SessionRecovery';
export { sessionUtils } from './SessionUtils';

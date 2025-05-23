
import { supabase } from '@/integrations/supabase/client';
import { storageManager } from './StorageManager';
import { toast } from 'sonner';

/**
 * Handles sign out operations and state cleanup
 */
export class AuthSignOut {
  /**
   * Sign out the current user with enhanced error handling and token cleanup
   */
  public async signOut(): Promise<void> {
    try {
      console.log('AuthSignOut: Starting signOut process');
      
      // Check session validity before attempting logout
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('AuthSignOut: Current session before signOut:', 
        sessionData?.session ? { 
          id: sessionData.session.access_token.substring(0, 8) + '...',
          expires_at: new Date(sessionData.session.expires_at * 1000).toISOString(),
          valid: !!sessionData.session 
        } : 'No session');
      
      // Clear our own auth state first
      await storageManager.clearAuthData();
      
      // IMPROVED: Use a more comprehensive logout approach
      try {
        // First try specific scope
        await supabase.auth.signOut({ scope: 'local' });
        
        // Then try global scope (affects all browser tabs)
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        console.error('AuthSignOut: Error during supabase.auth.signOut:', signOutError);
      }

      // Double-check session state after logout
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          console.warn('AuthSignOut: Session still exists after signOut, forcing cleanup');
        } else {
          console.log('AuthSignOut: Sign-out completed successfully');
          toast.success("Signed out successfully");
        }
      } catch (checkError) {
        console.error('AuthSignOut: Error checking session after signOut:', checkError);
      }
      
    } catch (error) {
      console.error('AuthSignOut: Error during signOut:', error);
      toast.error("There was an issue during sign out, but local tokens have been cleared.");
      throw error;
    }
  }
  
  /**
   * Perform a complete auth system reset
   */
  public async resetAuthSystem(): Promise<void> {
    try {
      console.log('AuthSignOut: Performing complete auth system reset');
      
      // First try explicit sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.error('AuthSignOut: Error during explicit signOut in reset:', e);
      }
      
      // Then clear all storage
      await storageManager.clearAuthData();
      
      // Clear auth redirect helpers
      sessionStorage.removeItem('authRedirectCount');
      localStorage.removeItem('authReturnTo');
      
      console.log('AuthSignOut: Auth system reset complete');
    } catch (error) {
      console.error('AuthSignOut: Error during auth system reset:', error);
    }
  }
}

// Create singleton instance
export const authSignOut = new AuthSignOut();

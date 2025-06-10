
import { supabase } from '@/integrations/supabase/client';
import { storageManager } from './StorageManager';
import { PermissionValidator } from '@/services/security/PermissionValidator';

/**
 * Enhanced sign-out service with security auditing
 */
export class AuthSignOut {
  /**
   * Sign out the current user with security logging
   */
  public async signOut(): Promise<void> {
    try {
      console.log('AuthSignOut: Starting sign-out process');
      
      // Get current user info before signing out for audit logging
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Log security event
      if (userId) {
        await PermissionValidator.logSecurityEvent(
          'user_logout',
          'auth',
          userId,
          {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 100)
          },
          'info'
        );
      }

      // Clear session data from storage
      await storageManager.clearAuthData();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthSignOut: Error during sign-out:', error);
        
        // Log sign-out failure
        if (userId) {
          await PermissionValidator.logSecurityEvent(
            'logout_failure',
            'auth',
            userId,
            {
              error: error.message,
              timestamp: new Date().toISOString()
            },
            'error'
          );
        }
        
        throw error;
      }
      
      console.log('AuthSignOut: Sign-out completed successfully');
    } catch (error) {
      console.error('AuthSignOut: Unexpected error during sign-out:', error);
      throw error;
    }
  }

  /**
   * Perform a complete auth system reset with enhanced security logging
   */
  public async resetAuthSystem(): Promise<void> {
    try {
      console.log('AuthSignOut: Performing complete auth system reset');
      
      // Get current user for audit logging
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Log system reset event
      if (userId) {
        await PermissionValidator.logSecurityEvent(
          'auth_system_reset',
          'auth',
          userId,
          {
            reason: 'Complete auth system reset requested',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 100)
          },
          'warning'
        );
      }

      // Clear all storage
      await storageManager.clearAuthData();
      
      // Clear any session storage
      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn('AuthSignOut: Could not clear session storage:', e);
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Force page reload to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('AuthSignOut: Error during auth system reset:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const authSignOut = new AuthSignOut();

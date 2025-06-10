
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Simplified and robust logout service
 * Handles complete session cleanup with proper error handling
 */
export class LogoutService {
  private static instance: LogoutService | null = null;
  private isLoggingOut = false;

  static getInstance(): LogoutService {
    if (!LogoutService.instance) {
      LogoutService.instance = new LogoutService();
    }
    return LogoutService.instance;
  }

  /**
   * Main logout function with comprehensive cleanup
   */
  async logout(): Promise<void> {
    // Prevent multiple simultaneous logout attempts
    if (this.isLoggingOut) {
      console.log('LogoutService: Logout already in progress');
      return;
    }

    this.isLoggingOut = true;
    console.log('LogoutService: Starting logout process');

    try {
      // Step 1: Attempt server-side logout
      await this.performServerLogout();
      
      // Step 2: Force clear all client-side auth data
      await this.forceCleanupClientAuth();
      
      // Step 3: Clear application state
      this.clearApplicationState();
      
      // Step 4: Redirect to auth page
      this.performRedirect();
      
      console.log('LogoutService: Logout completed successfully');
      toast.success('Logged out successfully');
      
    } catch (error) {
      console.error('LogoutService: Error during logout:', error);
      
      // Even if server logout fails, continue with client cleanup
      await this.forceCleanupClientAuth();
      this.clearApplicationState();
      this.performRedirect();
      
      toast.warning('Logged out (with cleanup)');
    } finally {
      this.isLoggingOut = false;
    }
  }

  /**
   * Attempt to logout from Supabase server
   */
  private async performServerLogout(): Promise<void> {
    console.log('LogoutService: Attempting server logout');
    
    try {
      // Try local scope first
      await supabase.auth.signOut({ scope: 'local' });
      
      // Then try global scope
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('LogoutService: Server logout successful');
    } catch (error) {
      console.warn('LogoutService: Server logout failed:', error);
      // Don't throw - continue with client cleanup
    }
  }

  /**
   * Force cleanup of all client-side authentication data
   */
  private async forceCleanupClientAuth(): Promise<void> {
    console.log('LogoutService: Force cleaning client auth data');
    
    const projectRef = "oxeheowbfsshpyldlskb";
    
    // Clear all known Supabase auth keys
    const authKeys = [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token-code-verifier`,
      `sb-${projectRef}-provider-token`,
      `sb-${projectRef}-session`,
      'supabase.auth.token',
      'supabase.auth.refreshToken'
    ];
    
    // Clear from localStorage
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`LogoutService: Cleared localStorage key: ${key}`);
      } catch (e) {
        console.warn(`LogoutService: Failed to clear localStorage key ${key}:`, e);
      }
    });
    
    // Clear from sessionStorage
    authKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`LogoutService: Failed to clear sessionStorage key ${key}:`, e);
      }
    });
    
    // Clear auth-related cookies
    this.clearAuthCookies();
    
    // Clear IndexedDB auth data
    await this.clearIndexedDBAuth();
  }

  /**
   * Clear authentication cookies
   */
  private clearAuthCookies(): void {
    try {
      const cookies = document.cookie.split(';');
      
      for (const cookie of cookies) {
        const [name] = cookie.split('=').map(c => c.trim());
        if (name && (name.includes('supabase') || name.includes('sb-'))) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          console.log(`LogoutService: Cleared cookie: ${name}`);
        }
      }
    } catch (e) {
      console.warn('LogoutService: Failed to clear cookies:', e);
    }
  }

  /**
   * Clear IndexedDB authentication data
   */
  private async clearIndexedDBAuth(): Promise<void> {
    try {
      const dbName = 'supabase-auth';
      const request = indexedDB.open(dbName);
      
      request.onsuccess = () => {
        const db = request.result;
        try {
          if (db.objectStoreNames.contains('auth-store')) {
            const transaction = db.transaction(['auth-store'], 'readwrite');
            const store = transaction.objectStore('auth-store');
            store.clear();
            console.log('LogoutService: Cleared IndexedDB auth store');
          }
        } catch (e) {
          console.warn('LogoutService: Failed to clear IndexedDB:', e);
        } finally {
          db.close();
        }
      };
      
      request.onerror = () => {
        console.warn('LogoutService: Failed to open IndexedDB for cleanup');
      };
    } catch (e) {
      console.warn('LogoutService: IndexedDB cleanup error:', e);
    }
  }

  /**
   * Clear application-specific state
   */
  private clearApplicationState(): void {
    console.log('LogoutService: Clearing application state');
    
    // Clear auth redirect states
    localStorage.removeItem('authReturnTo');
    sessionStorage.removeItem('authRedirectCount');
    sessionStorage.removeItem('invitationPath');
    
    // Clear any cached user data
    localStorage.removeItem('userProfile');
    localStorage.removeItem('selectedOrganization');
    
    console.log('LogoutService: Application state cleared');
  }

  /**
   * Perform redirect to auth page
   */
  private performRedirect(): void {
    console.log('LogoutService: Redirecting to auth page');
    
    // Use location.href for a clean redirect that clears all state
    window.location.href = '/auth';
  }

  /**
   * Emergency logout - forces immediate cleanup and redirect
   * Use when normal logout fails
   */
  async emergencyLogout(): Promise<void> {
    console.log('LogoutService: Emergency logout initiated');
    
    this.isLoggingOut = true;
    
    try {
      await this.forceCleanupClientAuth();
      this.clearApplicationState();
      
      // Force page reload to clear all memory state
      window.location.href = '/auth?emergency=true';
    } catch (error) {
      console.error('LogoutService: Emergency logout error:', error);
      // Last resort - force page reload
      window.location.reload();
    }
  }

  /**
   * Validate current session state
   */
  async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('LogoutService: Session validation error:', error);
        return false;
      }
      
      const isValid = !!session;
      console.log('LogoutService: Session validation result:', isValid);
      
      return isValid;
    } catch (error) {
      console.error('LogoutService: Session validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const logoutService = LogoutService.getInstance();

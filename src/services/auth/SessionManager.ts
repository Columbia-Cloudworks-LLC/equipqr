
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { storageManager } from './StorageManager';
import { sessionValidator } from './SessionValidator';
import { sessionRecovery } from './SessionRecovery';
import { sessionUtils } from './SessionUtils';
import { debounce } from '@/utils/edgeFunctions/retry';

// Create a debounced token refresh function
const debouncedRefreshToken = debounce(async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data;
}, 1500);

/**
 * SessionManager handles authentication session operations including
 * validation, refresh, and persistence checks
 */
export class SessionManager {
  private lastSessionCheck: number = 0;
  private sessionCheckCooldown: number = 2000; // 2 seconds
  private sessionValid: boolean | null = null;
  
  /**
   * Check if a session exists and is valid
   * @returns Promise<boolean> indicating if there is a valid session
   */
  public async checkSession(): Promise<boolean> {
    try {
      // Implement cooldown to prevent excessive checks
      const now = Date.now();
      if (now - this.lastSessionCheck < this.sessionCheckCooldown) {
        console.log('SessionManager: Session check on cooldown, using cached result');
        return this.sessionValid !== null ? this.sessionValid : false;
      }
      
      this.lastSessionCheck = now;
      console.log('SessionManager: Performing session check');
      
      // Get session from Supabase Auth API
      const { data } = await supabase.auth.getSession();
      
      // If no session from API, check if we need storage repair
      if (!data?.session) {
        console.log('SessionManager: No session from Auth API, checking storage');
        const sessionRepaired = await sessionRecovery.attemptSessionRecovery();
        
        if (sessionRepaired) {
          // Try again with repaired storage
          const { data: retryData } = await supabase.auth.getSession();
          const isValid = !!retryData?.session;
          console.log('SessionManager: After repair, session valid:', isValid);
          this.sessionValid = isValid;
          return isValid;
        }
        
        console.log('SessionManager: No valid session after checks');
        this.sessionValid = false;
        return false;
      }
      
      // Validate the session token
      const isTokenValid = await sessionValidator.validateToken(data.session);
      
      console.log('SessionManager: Session token valid:', isTokenValid);
      this.sessionValid = isTokenValid;
      return isTokenValid;
    } catch (error) {
      console.error('SessionManager: Error checking session:', error);
      return false;
    }
  }

  /**
   * Attempt to repair and recover a broken session (delegates to SessionRecovery)
   * @returns Promise<boolean> indicating if recovery succeeded
   */
  public async attemptSessionRecovery(): Promise<boolean> {
    return sessionRecovery.attemptSessionRecovery();
  }

  /**
   * Validate a session by checking token expiry and other criteria (delegates to SessionValidator)
   * @param session The session to validate
   * @returns Promise<boolean> indicating if the session is valid
   */
  public validateToken(session: Session | null): Promise<boolean> {
    return sessionValidator.validateToken(session);
  }

  /**
   * Get detailed session information for debugging (delegates to SessionUtils)
   */
  public async getSessionInfo(): Promise<Record<string, any>> {
    return sessionUtils.getSessionInfo();
  }

  /**
   * Fix session storage inconsistencies after sign-in
   */
  public async fixSessionAfterSignIn(): Promise<void> {
    console.log('SessionManager: Fixing session storage after sign-in');
    await storageManager.repairStorage();
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

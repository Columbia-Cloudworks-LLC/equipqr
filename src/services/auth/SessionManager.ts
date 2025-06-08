
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { storageManager } from './StorageManager';
import { sessionValidator } from './SessionValidator';
import { sessionRecovery } from './SessionRecovery';
import { sessionUtils } from './SessionUtils';
import { getEnvironmentConfig } from '@/config/environment';
import { debounce } from '@/utils/edgeFunctions/retry';

// Create a debounced token refresh function
const debouncedRefreshToken = debounce(async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data;
}, 1500);

/**
 * Enhanced SessionManager with environment awareness to prevent session mixing
 */
export class SessionManager {
  private lastSessionCheck: number = 0;
  private sessionCheckCooldown: number = 2000; // 2 seconds
  private sessionValid: boolean | null = null;
  private config = getEnvironmentConfig();
  
  /**
   * Check if a session exists and is valid with environment isolation
   */
  public async checkSession(): Promise<boolean> {
    try {
      // Implement cooldown to prevent excessive checks
      const now = Date.now();
      if (now - this.lastSessionCheck < this.sessionCheckCooldown) {
        if (this.config.enableDebugLogs) {
          console.log('SessionManager: Session check on cooldown, using cached result');
        }
        return this.sessionValid !== null ? this.sessionValid : false;
      }
      
      this.lastSessionCheck = now;
      console.log(`SessionManager: Performing session check in ${this.config.environment} environment`);
      
      // Get session from Supabase Auth API
      const { data } = await supabase.auth.getSession();
      
      // If no session from API, check if we need storage repair
      if (!data?.session) {
        console.log('SessionManager: No session from Auth API, checking storage');
        const sessionRepaired = await sessionRecovery.attemptSessionRecovery();
        
        if (sessionRepaired) {
          // Try again with repaired storage
          const { data: retryData } = await supabase.auth.getSession();
          const isValid = !!retryData?.session && await sessionValidator.validateToken(retryData.session);
          console.log(`SessionManager: After repair, session valid: ${isValid} in ${this.config.environment}`);
          this.sessionValid = isValid;
          return isValid;
        }
        
        console.log(`SessionManager: No valid session after checks in ${this.config.environment}`);
        this.sessionValid = false;
        return false;
      }
      
      // Validate the session token
      const isTokenValid = await sessionValidator.validateToken(data.session);
      
      console.log(`SessionManager: Session token valid: ${isTokenValid} in ${this.config.environment}`);
      this.sessionValid = isTokenValid;
      return isTokenValid;
    } catch (error) {
      console.error(`SessionManager: Error checking session in ${this.config.environment}:`, error);
      return false;
    }
  }

  /**
   * Attempt to repair and recover a broken session (delegates to SessionRecovery)
   */
  public async attemptSessionRecovery(): Promise<boolean> {
    return sessionRecovery.attemptSessionRecovery();
  }

  /**
   * Validate a session by checking token expiry and other criteria (delegates to SessionValidator)
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
    console.log(`SessionManager: Fixing session storage after sign-in in ${this.config.environment}`);
    await storageManager.repairStorage();
    
    // Synchronize session to ensure consistency
    await sessionUtils.synchronizeSession();
  }
  
  /**
   * Diagnose session issues for troubleshooting
   */
  public async diagnoseSessionIssues(): Promise<Record<string, any>> {
    return sessionRecovery.diagnoseSessionIssues();
  }
  
  /**
   * Force session synchronization
   */
  public async synchronizeSession(): Promise<boolean> {
    return sessionUtils.synchronizeSession();
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

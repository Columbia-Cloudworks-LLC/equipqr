
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { storageManager } from './StorageManager';
import { debounce, retry } from '@/utils/edgeFunctions/retry';

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
  private refreshTokenCooldown: number = 5000; // 5 seconds
  private lastTokenRefresh: number = 0;
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
        const sessionRepaired = await this.attemptSessionRecovery();
        
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
      const isTokenValid = await this.validateToken(data.session);
      
      console.log('SessionManager: Session token valid:', isTokenValid);
      this.sessionValid = isTokenValid;
      return isTokenValid;
    } catch (error) {
      console.error('SessionManager: Error checking session:', error);
      return false;
    }
  }

  /**
   * Attempt to repair and recover a broken session
   * @returns Promise<boolean> indicating if recovery succeeded
   */
  public async attemptSessionRecovery(): Promise<boolean> {
    console.log('SessionManager: Attempting session recovery');
    
    try {
      // First repair any storage inconsistencies
      const repaired = await storageManager.repairStorage();
      
      if (repaired) {
        console.log('SessionManager: Storage repaired, checking session again');
        
        // After repair, check if session is now valid
        const { data } = await supabase.auth.getSession();
        
        if (data?.session) {
          console.log('SessionManager: Session recovered successfully');
          return true;
        }
      }
      
      console.log('SessionManager: Session recovery failed');
      return false;
    } catch (error) {
      console.error('SessionManager: Error in session recovery:', error);
      return false;
    }
  }

  /**
   * Validate a session by checking token expiry and other criteria
   * @param session The session to validate
   * @returns Promise<boolean> indicating if the session is valid
   */
  public async validateToken(session: Session | null): Promise<boolean> {
    if (!session) return false;
    if (!session.access_token) return false;
    if (!session.refresh_token) return false;
    
    try {
      // Decode the JWT to check expiration
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeRemaining = expiry - now;
      
      // Token is expired
      if (now >= expiry) {
        console.warn(`SessionManager: Token expired ${Math.abs(timeRemaining) / 1000} seconds ago`);
        
        // Check refresh cooldown to avoid rate limiting
        if (now - this.lastTokenRefresh < this.refreshTokenCooldown) {
          console.warn('SessionManager: Token refresh on cooldown');
          return false;
        }
        
        this.lastTokenRefresh = now;
        
        // Try to refresh the token with retry logic and rate limit handling
        try {
          const { session: refreshedSession } = await retry(
            async () => debouncedRefreshToken(),
            2,
            2000,
            (error) => {
              const isRateLimit = error?.message?.includes('429') || error?.status === 429;
              if (isRateLimit) {
                console.warn('SessionManager: Rate limit reached during token refresh');
              }
              return isRateLimit;
            }
          );
          
          if (!refreshedSession) {
            console.error('SessionManager: Failed to refresh expired token');
            return false;
          }
          
          console.log('SessionManager: Token refreshed successfully');
          return true;
        } catch (refreshError) {
          if (refreshError?.message?.includes('429') || refreshError?.status === 429) {
            console.warn('SessionManager: Rate limit during token refresh, backing off');
            // Wait longer before the next attempt
            this.refreshTokenCooldown = Math.min(this.refreshTokenCooldown * 2, 30000);
          }
          
          console.error('SessionManager: Error refreshing token:', refreshError);
          return false;
        }
      }
      
      // Token is still valid
      console.log(`SessionManager: Token valid, expires in ${timeRemaining / 1000} seconds`);
      return true;
    } catch (error) {
      console.error('SessionManager: Error validating token:', error);
      return false;
    }
  }

  /**
   * Get detailed session information for debugging
   */
  public async getSessionInfo(): Promise<Record<string, any>> {
    try {
      const sessionKey = storageManager.getSessionKey();
      const legacySessionKey = storageManager.getLegacySessionKey();
      
      let sessionData = await storageManager.getItem(sessionKey);
      let storageKey = sessionKey;
      
      if (!sessionData) {
        sessionData = await storageManager.getItem(legacySessionKey);
        if (sessionData) {
          storageKey = legacySessionKey;
        }
      }
      
      if (!sessionData) {
        return { 
          status: 'missing', 
          checkedKeys: [sessionKey, legacySessionKey]
        };
      }
      
      try {
        const session = JSON.parse(sessionData);
        const isValid = await this.validateToken(session);
        
        // Check for token in localStorage as well for consistency
        const localStorageToken = localStorage.getItem(storageKey);
        const tokensMatch = localStorageToken === sessionData;
        
        return {
          status: isValid ? 'valid' : 'invalid',
          storageKey: storageKey,
          hasAccessToken: !!session.access_token,
          hasRefreshToken: !!session.refresh_token,
          expiresAt: session.expires_at,
          storageConsistent: tokensMatch,
          accessTokenStart: session.access_token ? `${session.access_token.substring(0, 12)}...` : null
        };
      } catch (error) {
        return { 
          status: 'corrupted',
          error: error instanceof Error ? error.message : String(error),
          rawDataLength: sessionData ? sessionData.length : 0
        };
      }
    } catch (error) {
      return { 
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
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

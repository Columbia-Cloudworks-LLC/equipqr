
import { supabase } from '@/integrations/supabase/client';
import { storageManager } from './StorageManager';

/**
 * Utility functions for session management
 */
export class SessionUtils {
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
        
        // Check for token in localStorage as well for consistency
        const localStorageToken = localStorage.getItem(storageKey);
        const tokensMatch = localStorageToken === sessionData;
        
        return {
          status: session.access_token ? 'valid' : 'invalid',
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
   * Debounced check to avoid hammering the API
   */
  private cooldownCheck(lastCheck: number, cooldownTime: number): boolean {
    const now = Date.now();
    return (now - lastCheck < cooldownTime);
  }
}

// Create singleton instance
export const sessionUtils = new SessionUtils();

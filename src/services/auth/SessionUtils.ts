
import { supabase } from '@/integrations/supabase/client';
import { environmentAwareStorageManager } from './EnvironmentAwareStorageManager';
import { sessionValidator } from './SessionValidator';
import { getEnvironmentConfig } from '@/config/environment';

/**
 * Session utilities with environment awareness
 */
export class SessionUtils {
  private config = getEnvironmentConfig();
  
  /**
   * Get comprehensive session information for debugging
   */
  public async getSessionInfo(): Promise<Record<string, any>> {
    try {
      // Get session from Supabase
      const { data: supabaseData } = await supabase.auth.getSession();
      const supabaseSession = supabaseData?.session;
      
      // Get session expiry info
      const expiryInfo = sessionValidator.getSessionExpiryInfo(supabaseSession);
      
      // Get storage information
      const storageInfo = environmentAwareStorageManager.getEnvironmentInfo();
      
      // Check storage contents
      const sessionKey = environmentAwareStorageManager.getSessionKey();
      const legacyKey = environmentAwareStorageManager.getLegacySessionKey();
      const codeVerifierKey = environmentAwareStorageManager.getCodeVerifierKey();
      
      const storageSession = await environmentAwareStorageManager.getItem(sessionKey);
      const legacySession = await environmentAwareStorageManager.getItem(legacyKey);
      const codeVerifier = await environmentAwareStorageManager.getItem(codeVerifierKey);
      
      // Validate session consistency
      const hasSupabaseSession = !!supabaseSession;
      const hasStorageSession = !!storageSession;
      const sessionConsistent = hasSupabaseSession === hasStorageSession;
      
      let storageSessionValid = false;
      if (storageSession) {
        try {
          const parsedSession = JSON.parse(storageSession);
          storageSessionValid = await sessionValidator.validateToken(parsedSession);
        } catch (e) {
          console.error('SessionUtils: Error parsing storage session:', e);
        }
      }
      
      return {
        environment: this.config.environment,
        timestamp: new Date().toISOString(),
        
        // Session status
        hasSupabaseSession,
        hasStorageSession,
        sessionConsistent,
        storageSessionValid,
        
        // Session details
        supabaseSession: supabaseSession ? {
          userId: supabaseSession.user?.id,
          email: supabaseSession.user?.email,
          expiresAt: supabaseSession.expires_at,
          tokenType: supabaseSession.token_type,
          hasAccessToken: !!supabaseSession.access_token,
          hasRefreshToken: !!supabaseSession.refresh_token,
          accessTokenStart: supabaseSession.access_token?.substring(0, 12) + '...'
        } : null,
        
        // Expiry information
        expiryInfo,
        
        // Storage information
        storageInfo,
        storage: {
          sessionKey,
          legacyKey,
          codeVerifierKey,
          hasStorageSession: !!storageSession,
          hasLegacySession: !!legacySession,
          hasCodeVerifier: !!codeVerifier,
          storageSessionLength: storageSession?.length || 0,
          legacySessionLength: legacySession?.length || 0
        },
        
        // Browser information
        browser: typeof window !== 'undefined' ? {
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          pathname: window.location.pathname,
          userAgent: navigator.userAgent.substring(0, 100) + '...'
        } : null,
        
        // Recommendations
        recommendations: this.generateRecommendations({
          hasSupabaseSession,
          hasStorageSession,
          sessionConsistent,
          storageSessionValid,
          expiryInfo
        })
      };
    } catch (error) {
      console.error('SessionUtils: Error getting session info:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: this.config.environment,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Generate recommendations based on session state
   */
  private generateRecommendations(state: {
    hasSupabaseSession: boolean;
    hasStorageSession: boolean;
    sessionConsistent: boolean;
    storageSessionValid: boolean;
    expiryInfo: any;
  }): string[] {
    const recommendations: string[] = [];
    
    if (!state.hasSupabaseSession && !state.hasStorageSession) {
      recommendations.push('No session found - user needs to sign in');
    } else if (!state.sessionConsistent) {
      recommendations.push('Session inconsistency detected - storage repair needed');
    } else if (state.hasStorageSession && !state.storageSessionValid) {
      recommendations.push('Storage session is invalid - clear and re-authenticate');
    } else if (state.expiryInfo?.needsRefresh) {
      recommendations.push('Session expires soon - refresh recommended');
    } else if (state.hasSupabaseSession && state.hasStorageSession && state.storageSessionValid) {
      recommendations.push('Session state looks healthy');
    }
    
    if (this.config.environment === 'development') {
      recommendations.push('Development environment - ensure no production session mixing');
    }
    
    return recommendations;
  }
  
  /**
   * Force session synchronization between Supabase and storage
   */
  public async synchronizeSession(): Promise<boolean> {
    try {
      console.log('SessionUtils: Synchronizing session');
      
      const { data } = await supabase.auth.getSession();
      const supabaseSession = data?.session;
      
      if (supabaseSession && await sessionValidator.validateToken(supabaseSession)) {
        // Store valid session in environment-aware storage
        const sessionKey = environmentAwareStorageManager.getSessionKey();
        await environmentAwareStorageManager.setItem(sessionKey, JSON.stringify(supabaseSession));
        
        console.log('SessionUtils: Session synchronized successfully');
        return true;
      } else {
        // Clear invalid storage session
        await environmentAwareStorageManager.clearAuthData();
        console.log('SessionUtils: Cleared invalid session data');
        return false;
      }
    } catch (error) {
      console.error('SessionUtils: Error synchronizing session:', error);
      return false;
    }
  }
}

// Create singleton instance
export const sessionUtils = new SessionUtils();

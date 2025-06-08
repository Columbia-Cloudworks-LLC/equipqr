
import { supabase } from '@/integrations/supabase/client';
import { environmentAwareStorageManager } from './EnvironmentAwareStorageManager';
import { sessionValidator } from './SessionValidator';
import { getEnvironmentConfig, cleanCrossEnvironmentSessions } from '@/config/environment';

/**
 * Enhanced session recovery with environment awareness
 */
export class SessionRecovery {
  private config = getEnvironmentConfig();
  
  /**
   * Attempt to recover a broken or missing session
   */
  public async attemptSessionRecovery(): Promise<boolean> {
    try {
      console.log(`SessionRecovery: Attempting recovery in ${this.config.environment} environment`);
      
      // Step 1: Clean any cross-environment sessions first
      cleanCrossEnvironmentSessions();
      
      // Step 2: Try storage repair
      const storageRepaired = await environmentAwareStorageManager.repairStorage();
      if (storageRepaired) {
        console.log('SessionRecovery: Storage repair successful');
        
        // Verify the repaired session
        const { data } = await supabase.auth.getSession();
        if (data?.session && await sessionValidator.validateToken(data.session)) {
          console.log('SessionRecovery: Session successfully recovered from storage repair');
          return true;
        }
      }
      
      // Step 3: Try session refresh
      console.log('SessionRecovery: Attempting session refresh');
      const refreshResult = await this.attemptSessionRefresh();
      if (refreshResult) {
        console.log('SessionRecovery: Session successfully refreshed');
        return true;
      }
      
      // Step 4: Check for valid session in Supabase client
      console.log('SessionRecovery: Checking Supabase client session');
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession?.session && await sessionValidator.validateToken(currentSession.session)) {
        console.log('SessionRecovery: Found valid session in Supabase client');
        
        // Sync to environment-aware storage
        const sessionKey = environmentAwareStorageManager.getSessionKey();
        await environmentAwareStorageManager.setItem(sessionKey, JSON.stringify(currentSession.session));
        return true;
      }
      
      console.log('SessionRecovery: All recovery attempts failed');
      return false;
    } catch (error) {
      console.error('SessionRecovery: Error during session recovery:', error);
      return false;
    }
  }
  
  /**
   * Attempt to refresh the session
   */
  private async attemptSessionRefresh(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('SessionRecovery: Session refresh failed:', error);
        return false;
      }
      
      if (data?.session) {
        console.log('SessionRecovery: Session refreshed successfully');
        
        // Store in environment-aware storage
        const sessionKey = environmentAwareStorageManager.getSessionKey();
        await environmentAwareStorageManager.setItem(sessionKey, JSON.stringify(data.session));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('SessionRecovery: Error during session refresh:', error);
      return false;
    }
  }
  
  /**
   * Diagnose session issues
   */
  public async diagnoseSessionIssues(): Promise<{
    hasSession: boolean;
    isValid: boolean;
    expiryInfo: any;
    storageInfo: any;
    environmentInfo: any;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    
    try {
      // Get current session
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      const hasSession = !!session;
      
      // Validate session
      const isValid = hasSession ? await sessionValidator.validateToken(session) : false;
      
      // Get expiry info
      const expiryInfo = sessionValidator.getSessionExpiryInfo(session);
      
      // Get storage info
      const storageInfo = environmentAwareStorageManager.getEnvironmentInfo();
      
      // Get environment info
      const environmentInfo = {
        current: this.config.environment,
        config: this.config
      };
      
      // Generate recommendations
      if (!hasSession) {
        recommendations.push('No session found - user needs to sign in');
      } else if (!isValid) {
        recommendations.push('Session is invalid or expired - attempt refresh or re-authentication');
      } else if (expiryInfo.needsRefresh) {
        recommendations.push('Session expires soon - consider refreshing');
      }
      
      if (this.config.environment === 'development') {
        recommendations.push('Development environment - check for cross-environment session mixing');
      }
      
      return {
        hasSession,
        isValid,
        expiryInfo,
        storageInfo,
        environmentInfo,
        recommendations
      };
    } catch (error) {
      console.error('SessionRecovery: Error during diagnosis:', error);
      return {
        hasSession: false,
        isValid: false,
        expiryInfo: null,
        storageInfo: null,
        environmentInfo: null,
        recommendations: ['Error during diagnosis - check console for details']
      };
    }
  }
}

// Create singleton instance
export const sessionRecovery = new SessionRecovery();

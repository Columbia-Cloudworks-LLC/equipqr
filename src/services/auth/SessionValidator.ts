
import { Session } from '@supabase/supabase-js';
import { getEnvironmentConfig } from '@/config/environment';

/**
 * Enhanced session validator with environment awareness
 */
export class SessionValidator {
  private config = getEnvironmentConfig();
  
  /**
   * Validate if a session is valid and not expired
   */
  public async validateToken(session: Session | null): Promise<boolean> {
    if (!session) {
      if (this.config.enableDebugLogs) {
        console.log('SessionValidator: No session provided');
      }
      return false;
    }
    
    if (!session.access_token || !session.refresh_token) {
      if (this.config.enableDebugLogs) {
        console.log('SessionValidator: Session missing required tokens');
      }
      return false;
    }
    
    try {
      // Decode and validate the access token
      const payload = this.decodeJWTPayload(session.access_token);
      if (!payload) {
        console.error('SessionValidator: Failed to decode JWT payload');
        return false;
      }
      
      // Check if token is expired
      const expiry = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeRemaining = expiry - now;
      
      if (now >= expiry) {
        console.warn(`SessionValidator: Token expired ${Math.abs(timeRemaining) / 1000} seconds ago in ${this.config.environment}`);
        return false;
      }
      
      // Check if token expires soon (within 5 minutes)
      const fiveMinutes = 5 * 60 * 1000;
      const expiresSoon = timeRemaining < fiveMinutes;
      
      if (this.config.enableDebugLogs) {
        console.log(`SessionValidator: Token valid for ${Math.floor(timeRemaining / 1000)} seconds in ${this.config.environment}${expiresSoon ? ' (expires soon)' : ''}`);
      }
      
      // Validate session structure
      if (!this.validateSessionStructure(session)) {
        console.error('SessionValidator: Session structure validation failed');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('SessionValidator: Error validating session token:', error);
      return false;
    }
  }
  
  /**
   * Decode JWT payload safely
   */
  private decodeJWTPayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('SessionValidator: Invalid JWT format');
        return null;
      }
      
      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('SessionValidator: Error decoding JWT:', error);
      return null;
    }
  }
  
  /**
   * Validate session object structure
   */
  private validateSessionStructure(session: Session): boolean {
    const requiredFields = ['access_token', 'refresh_token', 'user'];
    
    for (const field of requiredFields) {
      if (!(field in session) || !session[field as keyof Session]) {
        console.error(`SessionValidator: Missing required field: ${field}`);
        return false;
      }
    }
    
    // Validate user object
    if (!session.user?.id || !session.user?.email) {
      console.error('SessionValidator: Invalid user object in session');
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if session needs refresh (expires within threshold)
   */
  public shouldRefreshSession(session: Session | null, thresholdMinutes: number = 10): boolean {
    if (!session?.access_token) return false;
    
    try {
      const payload = this.decodeJWTPayload(session.access_token);
      if (!payload) return false;
      
      const expiry = payload.exp * 1000;
      const now = Date.now();
      const threshold = thresholdMinutes * 60 * 1000;
      
      return (expiry - now) < threshold;
    } catch (error) {
      console.error('SessionValidator: Error checking refresh need:', error);
      return false;
    }
  }
  
  /**
   * Get session expiry information
   */
  public getSessionExpiryInfo(session: Session | null): {
    isValid: boolean;
    expiresAt: Date | null;
    minutesRemaining: number;
    needsRefresh: boolean;
  } {
    if (!session?.access_token) {
      return {
        isValid: false,
        expiresAt: null,
        minutesRemaining: 0,
        needsRefresh: false
      };
    }
    
    try {
      const payload = this.decodeJWTPayload(session.access_token);
      if (!payload) {
        return {
          isValid: false,
          expiresAt: null,
          minutesRemaining: 0,
          needsRefresh: false
        };
      }
      
      const expiry = payload.exp * 1000;
      const now = Date.now();
      const minutesRemaining = Math.max(0, Math.floor((expiry - now) / (60 * 1000)));
      const isValid = expiry > now;
      const needsRefresh = this.shouldRefreshSession(session);
      
      return {
        isValid,
        expiresAt: new Date(expiry),
        minutesRemaining,
        needsRefresh
      };
    } catch (error) {
      console.error('SessionValidator: Error getting expiry info:', error);
      return {
        isValid: false,
        expiresAt: null,
        minutesRemaining: 0,
        needsRefresh: false
      };
    }
  }
}

// Create singleton instance
export const sessionValidator = new SessionValidator();

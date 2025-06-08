
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { retry } from '@/utils/edgeFunctions/retry';

/**
 * SessionValidator handles validation of authentication tokens and refresh operations
 */
export class SessionValidator {
  private refreshTokenCooldown: number = 5000; // 5 seconds
  private lastTokenRefresh: number = 0;

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
        console.warn(`SessionValidator: Token expired ${Math.abs(timeRemaining) / 1000} seconds ago`);
        
        // Check refresh cooldown to avoid rate limiting
        if (now - this.lastTokenRefresh < this.refreshTokenCooldown) {
          console.warn('SessionValidator: Token refresh on cooldown');
          return false;
        }
        
        this.lastTokenRefresh = now;
        
        // Try to refresh the token with retry logic
        try {
          const { session: refreshedSession } = await retry(
            async () => this.refreshToken(),
            2,
            2000,
            this.isRateLimitError
          );
          
          if (!refreshedSession) {
            console.error('SessionValidator: Failed to refresh expired token');
            return false;
          }
          
          console.log('SessionValidator: Token refreshed successfully');
          return true;
        } catch (refreshError) {
          if (this.isRateLimitError(refreshError)) {
            console.warn('SessionValidator: Rate limit during token refresh, backing off');
            // Wait longer before the next attempt
            this.refreshTokenCooldown = Math.min(this.refreshTokenCooldown * 2, 30000);
          }
          
          console.error('SessionValidator: Error refreshing token:', refreshError);
          return false;
        }
      }
      
      // Token is still valid
      console.log(`SessionValidator: Token valid, expires in ${timeRemaining / 1000} seconds`);
      return true;
    } catch (error) {
      console.error('SessionValidator: Error validating token:', error);
      return false;
    }
  }

  /**
   * Refresh the authentication token
   * @returns Promise with the refreshed session data
   */
  private async refreshToken() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data;
  }

  /**
   * Check if an error is a rate limit error
   * @param error The error to check
   * @returns boolean indicating if this is a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    return error?.message?.includes('429') || error?.status === 429;
  }
}

// Create singleton instance
export const sessionValidator = new SessionValidator();

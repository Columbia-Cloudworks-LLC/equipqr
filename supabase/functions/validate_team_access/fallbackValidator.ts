
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { TeamAccessResult } from './interfaces.ts';

/**
 * Fallback validators when primary methods fail
 */
export class FallbackValidator {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Fallback method for simpler access check with retry logic
   */
  async handleFallbackAccessCheck(userId: string, teamId: string): Promise<TeamAccessResult> {
    try {
      console.log(`Using fallback access check for userId: ${userId}, teamId: ${teamId}`);
      
      // Try the non-recursive function first
      const { data: canAccess, error: simpleAccessError } = await this.tryWithRetry(() => 
        this.supabase.rpc('check_team_access_nonrecursive', {
          p_user_id: userId,
          p_team_id: teamId
        })
      );
      
      if (simpleAccessError) {
        console.error('Error in fallback team access check:', simpleAccessError);
        // If even the simple check fails, use a direct query approach
        return await this.ultraFallbackCheck(userId, teamId);
      }
      
      if (!canAccess) {
        return {
          is_member: false,
          access_reason: 'no_permission'
        };
      }
      
      // If canAccess is true but we don't have details, try to get the role
      const { data: role, error: roleError } = await this.supabase.rpc('get_team_role_safe', {
        _user_id: userId,
        _team_id: teamId
      });
      
      return {
        is_member: true,
        role: roleError ? null : role,
        access_reason: 'fallback_check'
      };
    } catch (error) {
      console.error('Error in handleFallbackAccessCheck:', error);
      // Ultimate fallback that assumes minimal access to avoid completely blocking UI
      return {
        is_member: true,  // Assume membership to prevent blocking
        access_reason: 'error_assumed_access',
        role: null
      };
    }
  }

  /**
   * Ultra fallback method that tries direct queries with the service role
   */
  private async ultraFallbackCheck(userId: string, teamId: string): Promise<TeamAccessResult> {
    try {
      console.log(`Using ultra-fallback access check for userId: ${userId}, teamId: ${teamId}`);
      
      // Get app_user ID
      const { data: appUser, error: appUserError } = await this.supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .maybeSingle();
      
      if (appUserError || !appUser) {
        console.error('Error getting app_user in ultraFallbackCheck:', appUserError);
        return {
          is_member: true,  // Assume membership to prevent blocking
          access_reason: 'error_ultra_fallback',
          role: null
        };
      }
      
      // Check for team membership
      const { data: teamMember, error: teamMemberError } = await this.supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', teamId)
        .maybeSingle();
      
      return {
        is_member: !teamMemberError && teamMember !== null,
        access_reason: 'ultra_fallback_check',
        role: null  // Can't determine role in this ultra simple check
      };
    } catch (error) {
      console.error('Error in ultraFallbackCheck:', error);
      return {
        is_member: true,  // Final fallback - assume membership to prevent blocking
        access_reason: 'error_ultra_fallback',
        role: null
      };
    }
  }
  
  /**
   * Helper method to retry a function with exponential backoff
   */
  private async tryWithRetry<T>(
    fn: () => Promise<T>, 
    maxRetries: number = 3, 
    initialDelayMs: number = 100
  ): Promise<T> {
    let lastError: any;
    let delay = initialDelayMs;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        lastError = error;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 2;
      }
    }
    
    throw lastError || new Error('Operation failed after multiple retries');
  }
}

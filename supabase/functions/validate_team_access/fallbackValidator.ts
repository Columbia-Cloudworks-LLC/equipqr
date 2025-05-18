
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
   * Fallback method for simpler access check
   */
  async handleFallbackAccessCheck(userId: string, teamId: string): Promise<TeamAccessResult> {
    const { data: canAccess, error: simpleAccessError } = await this.supabase.rpc('check_team_access_nonrecursive', {
      p_user_id: userId,
      p_team_id: teamId
    });
    
    if (simpleAccessError) {
      console.error('Error in fallback team access check:', simpleAccessError);
      throw new Error(simpleAccessError.message);
    }
    
    if (!canAccess) {
      return {
        is_member: false,
        access_reason: 'no_permission'
      };
    }
    
    // If canAccess is true but we don't have details, return minimal success response
    return {
      is_member: true,
      access_reason: 'fallback_check'
    };
  }
}

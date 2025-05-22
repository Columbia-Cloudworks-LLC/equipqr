
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";
import { TeamAccessResult } from './teamValidationTypes';

/**
 * Validate a user's membership in a team using our improved edge function
 * @param teamId The team ID to validate
 * @param userId Optional user ID (defaults to current user)
 * @returns Object with validation results 
 */
export async function validateTeamMembership(teamId: string, userId?: string) {
  try {
    if (!teamId) {
      throw new Error("Team ID is required");
    }
    
    // Get current user if not provided
    if (!userId) {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
    }
    
    console.log(`Validating team membership for user ${userId} in team ${teamId}`);
    
    // Use validate_team_access edge function with timeout
    try {
      const data = await invokeEdgeFunction('validate_team_access', {
        team_id: teamId,
        user_id: userId
      }, 10000) as TeamAccessResult; // 10 second timeout
      
      console.log('Team membership validation result:', data);
      
      return {
        isValid: data?.is_member === true,
        result: data || null
      };
    } catch (error) {
      console.error('Team membership validation error:', error);
      
      // Fallback to direct query if edge function fails
      console.log('Using fallback validation method...');
      const { data: fallbackResult, error: fallbackError } = await supabase.rpc(
        'check_team_access_nonrecursive',
        { p_user_id: userId, p_team_id: teamId }
      );
      
      if (fallbackError) {
        console.error('Fallback validation error:', fallbackError);
        throw new Error(fallbackError.message);
      }
      
      return {
        isValid: fallbackResult === true,
        result: { 
          is_member: fallbackResult === true,
          access_reason: 'fallback_check'
        } as TeamAccessResult
      };
    }
  } catch (error: any) {
    console.error('Error in validateTeamMembership:', error);
    // Return a safe default to prevent breaking the UI
    return {
      isValid: false,
      result: {
        is_member: false,
        access_reason: 'error_validation_failed'
      } as TeamAccessResult,
      error: error.message
    };
  }
}

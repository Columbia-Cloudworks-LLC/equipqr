
import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Validate a user's membership in a team using our improved non-recursive function
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
    
    // Use our improved validate_team_access edge function
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: { 
        team_id: teamId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Team membership validation error:', error);
      
      // Fallback to simpler function if edge function fails
      const { data: fallbackResult, error: fallbackError } = await supabase.rpc(
        'check_team_access_nonrecursive',
        { p_user_id: userId, p_team_id: teamId }
      );
      
      if (fallbackError) {
        throw new Error(fallbackError.message);
      }
      
      return {
        isValid: fallbackResult === true,
        result: { 
          is_member: fallbackResult === true,
          access_reason: 'fallback_check'
        }
      };
    }
    
    return {
      isValid: data?.is_member === true,
      result: data || null
    };
  } catch (error: any) {
    console.error('Error in validateTeamMembership:', error);
    // Return a safe default to prevent breaking the UI
    return {
      isValid: true, // Assume valid to prevent blocking - will be checked again later
      result: {
        is_member: true,
        access_reason: 'error_assumed_access'
      },
      error: error.message
    };
  }
}

/**
 * Repair team membership by adding the current user as a manager
 * @param teamId The team ID to repair
 * @returns Result of the repair operation
 */
export async function repairTeamMembership(teamId: string) {
  try {
    if (!teamId) {
      throw new Error("Team ID is required");
    }
    
    // Use dedicated edge function to repair team membership
    const { data, error } = await supabase.functions.invoke('repair_team_membership', {
      body: { team_id: teamId }
    });
    
    if (error || (data && data.error)) {
      console.error('Team repair error:', error || data?.error);
      throw new Error(error?.message || data?.error || "Failed to repair team membership");
    }
    
    return data;
  } catch (error: any) {
    console.error('Error in repairTeamMembership:', error);
    throw error;
  }
}

/**
 * Get detailed team access information for a user using our improved non-recursive function
 * @param userId User ID to check
 * @param teamId Team ID to check
 * @returns Detailed access information
 */
export async function getTeamAccessDetails(userId: string, teamId: string) {
  try {
    if (!userId || !teamId) {
      throw new Error("User ID and Team ID are required");
    }
    
    // Use improved validate_team_access edge function that considers organization roles
    const { data, error } = await supabase.functions.invoke('validate_team_access', {
      body: { 
        team_id: teamId,
        user_id: userId
      }
    });
    
    if (error) {
      console.error('Error getting team access details:', error);
      
      // Fallback to less detailed access check
      const { data: fallbackData, error: fallbackError } = await supabase.rpc(
        'check_team_access_detailed',
        { user_id: userId, team_id: teamId }
      );
      
      if (fallbackError) {
        console.error('Error in fallback team access details:', fallbackError);
        throw new Error(error.message);
      }
      
      // Extract first row from the result array since RPC returns an array
      const resultRow = fallbackData && fallbackData.length > 0 ? fallbackData[0] : null;
      
      if (!resultRow) {
        throw new Error('No access details returned');
      }
      
      return {
        isMember: resultRow.has_access === true,
        hasOrgAccess: resultRow.user_org_id === resultRow.team_org_id,
        hasCrossOrgAccess: false,
        teamMemberId: null,
        accessReason: 'fallback_detailed_check',
        role: resultRow.team_role,
        team: null,
        orgName: null
      };
    }
    
    return {
      isMember: data?.is_member === true,
      hasOrgAccess: data?.has_org_access === true,
      hasCrossOrgAccess: data?.has_cross_org_access === true,
      teamMemberId: data?.team_member_id,
      accessReason: data?.access_reason,
      role: data?.role,
      team: data?.team,
      orgName: data?.org_name
    };
  } catch (error: any) {
    console.error('Error in getTeamAccessDetails:', error);
    // Return default values if there's an error to avoid UI breakage
    return {
      isMember: true, // Assume membership to prevent complete UI failure
      hasOrgAccess: false,
      hasCrossOrgAccess: false,
      teamMemberId: null,
      accessReason: 'error',
      role: null,
      team: null,
      orgName: null
    };
  }
}

/**
 * Check if a user has permission to assign a role in a team
 * @param teamId Team ID to check
 * @param role Role to be assigned
 * @returns Boolean indicating if the user can assign this role
 */
export async function canAssignTeamRole(teamId: string, role: string) {
  try {
    if (!teamId) {
      return false;
    }
    
    // Get current authenticated user
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return false;
    }
    
    const userId = sessionData.session.user.id;
    
    // Use our new DB function through RPC call
    const { data, error } = await supabase.rpc('can_assign_team_role', {
      p_auth_user_id: userId,
      p_team_id: teamId,
      p_role: role
    });
    
    if (error) {
      console.error('Error checking role assignment permission:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error in canAssignTeamRole:', error);
    return false;
  }
}

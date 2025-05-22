
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a user has access to an organization
 * @param userId Auth user ID
 * @param appUserId App user ID
 * @param orgId Organization ID to check access for
 * @returns Boolean indicating if user has access
 */
export async function checkOrgAccess(userId: string, appUserId: string, orgId: string): Promise<boolean> {
  try {
    // 1. Check direct organization membership via user_roles
    const { data: userRole, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .maybeSingle();
    
    if (userRole) {
      return true;
    }
    
    // 2. Check team memberships in this organization
    const { data: teams, error: teamsError } = await supabase
      .from('team')
      .select('id')
      .eq('org_id', orgId);
    
    if (teamsError || !teams || teams.length === 0) {
      return false;
    }
    
    const teamIds = teams.map(t => t.id);
    
    const { data: teamMemberships, error: membershipError } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', appUserId)
      .in('team_id', teamIds)
      .limit(1);
    
    return !membershipError && teamMemberships && teamMemberships.length > 0;
  } catch (error) {
    console.error('Error checking org access:', error);
    return false;
  }
}

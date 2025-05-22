
import { createAdminClient } from "../adminClient.ts";

/**
 * Check user's role and access within an organization
 */
export async function checkUserOrgAccess(userId: string, orgId: string): Promise<{
  userRole: string | null;
  hasTeams: boolean;
}> {
  try {
    const adminClient = createAdminClient();
    let userRole = null;
    let hasTeams = false;
    
    // Get user's role in the organization
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .maybeSingle();
    
    if (roleError) {
      console.error('Error fetching user role:', roleError);
    } else if (roleData) {
      userRole = roleData.role;
    }
    
    // Check if user has any teams in this organization
    const { data: appUserData } = await adminClient
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (appUserData?.id) {
      const { data: teamMemberships, error: teamError } = await adminClient
        .from('team_member')
        .select('team_id, team:team_id (org_id)')
        .eq('user_id', appUserData.id);
        
      if (!teamError && teamMemberships) {
        hasTeams = teamMemberships.some(tm => tm.team?.org_id === orgId);
      }
    }
    
    return { userRole, hasTeams };
  } catch (error) {
    console.error('Error checking user org access:', error);
    return { userRole: null, hasTeams: false };
  }
}

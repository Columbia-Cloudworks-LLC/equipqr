
import { supabase } from '@/integrations/supabase/client';

interface TeamAccessResult {
  hasAccess: boolean;
  accessReason: string;
  role: string | null;
  userOrgId: string | null;
  teamOrgId: string | null;
  orgName: string | null;
  hasCrossOrgAccess: boolean;
  hasOrgAccess: boolean;
  orgRole: string | null;
  team: any;
}

/**
 * Get detailed team access information for a user
 * This function handles the logic locally to avoid edge function complexity
 */
export async function getTeamAccessDetails(teamId: string, userId: string): Promise<TeamAccessResult> {
  try {
    console.log(`Validating team access for user ${userId} on team ${teamId}`);
    
    // Get user's organization and profile information
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      throw new Error('Could not fetch user profile');
    }

    // Get team information with organization details
    const { data: teamData, error: teamError } = await supabase
      .from('team')
      .select(`
        id,
        name,
        org_id,
        deleted_at,
        organization:org_id (
          id,
          name
        )
      `)
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      console.error('Error fetching team:', teamError);
      throw new Error('Team not found or has been deleted');
    }

    const userOrgId = userProfile.org_id;
    const teamOrgId = teamData.org_id;
    const orgName = teamData.organization?.name || 'Unknown Organization';

    // Check if user belongs to same organization as team
    const hasOrgAccess = userOrgId === teamOrgId;
    const hasCrossOrgAccess = userOrgId !== teamOrgId;

    // Get user's organization role
    let orgRole: string | null = null;
    if (hasOrgAccess) {
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', teamOrgId)
        .single();
      
      orgRole = userRoleData?.role || null;
    }

    // Get app_user ID for team membership check
    const { data: appUserData } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();

    let teamRole: string | null = null;
    let isTeamMember = false;

    if (appUserData) {
      // Check team membership
      const { data: teamMemberData } = await supabase
        .from('team_member')
        .select(`
          id,
          team_roles (
            role
          )
        `)
        .eq('user_id', appUserData.id)
        .eq('team_id', teamId)
        .single();

      if (teamMemberData) {
        isTeamMember = true;
        teamRole = teamMemberData.team_roles?.[0]?.role || null;
      }
    }

    // Determine access and reason
    let hasAccess = false;
    let accessReason = 'none';
    let effectiveRole: string | null = null;

    if (isTeamMember) {
      hasAccess = true;
      accessReason = 'team_member';
      effectiveRole = teamRole;
    } else if (hasOrgAccess && orgRole && ['owner', 'manager', 'admin'].includes(orgRole)) {
      hasAccess = true;
      accessReason = 'org_manager';
      effectiveRole = orgRole;
    } else if (hasOrgAccess) {
      hasAccess = true;
      accessReason = 'same_org';
      effectiveRole = orgRole;
    }

    return {
      hasAccess,
      accessReason,
      role: effectiveRole,
      userOrgId,
      teamOrgId,
      orgName,
      hasCrossOrgAccess,
      hasOrgAccess,
      orgRole,
      team: teamData
    };

  } catch (error) {
    console.error('Error validating team access:', error);
    throw error;
  }
}

/**
 * Simple check if user can access a team
 */
export async function canAccessTeam(teamId: string, userId: string): Promise<boolean> {
  try {
    const accessDetails = await getTeamAccessDetails(teamId, userId);
    return accessDetails.hasAccess;
  } catch (error) {
    console.error('Error checking team access:', error);
    return false;
  }
}

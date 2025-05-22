
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Check if the user has access to the team using our non-recursive function
 */
export async function checkTeamAccess(
  userId: string, 
  teamId: string, 
  supabase?: ReturnType<typeof createClient>
) {
  try {
    // Use provided supabase client or create a new one with admin privileges
    const client = supabase || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get user's organization to check same-org access
    const { data: userProfile, error: userProfileError } = await client
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    if (userProfileError) {
      console.error('Error getting user org ID:', userProfileError);
      return false;
    }
    
    const userOrgId = userProfile?.org_id;
    
    // Get team's organization
    const { data: teamData, error: teamError } = await client
      .from('team')
      .select('org_id')
      .eq('id', teamId)
      .single();
      
    if (teamError) {
      console.error('Error getting team org ID:', teamError);
      return false;
    }
    
    const teamOrgId = teamData?.org_id;
    
    // Same organization access check - faster path
    if (userOrgId === teamOrgId) {
      return true;
    }
    
    // Get app_user ID for team membership check
    const { data: appUser, error: appUserError } = await client
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (appUserError) {
      console.error('Error getting app_user ID:', appUserError);
      return false;
    }
    
    const appUserId = appUser?.id;

    // Check for direct team membership
    const { data: teamMember, error: teamMemberError } = await client
      .from('team_member')
      .select('id')
      .eq('user_id', appUserId)
      .eq('team_id', teamId)
      .maybeSingle();
    
    return !!teamMember;
  } catch (error) {
    console.error('Exception in checkTeamAccess:', error);
    return false;
  }
}

/**
 * Check if a user can perform manager-level operations on a team
 * Uses our optimized get_team_role_safe function
 */
export async function checkTeamManagerAccess(
  userId: string, 
  teamId: string,
  supabase?: ReturnType<typeof createClient>
) {
  try {
    // Use provided supabase client or create a new one with admin privileges
    const client = supabase || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get app_user ID
    const { data: appUser, error: appUserError } = await client
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (appUserError) {
      console.error('Error getting app_user ID:', appUserError);
      return false;
    }
    
    const appUserId = appUser?.id;
    
    // Get team's organization
    const { data: teamData, error: teamError } = await client
      .from('team')
      .select('org_id')
      .eq('id', teamId)
      .single();
      
    if (teamError) {
      console.error('Error getting team org ID:', teamError);
      return false;
    }
    
    const teamOrgId = teamData?.org_id;
    
    // First, check for organization-level manager/owner roles
    const { data: orgRole, error: orgRoleError } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', teamOrgId)
      .maybeSingle();
      
    if (!orgRoleError && orgRole && (orgRole.role === 'owner' || orgRole.role === 'manager')) {
      return true;
    }
    
    // Check for team-level manager/owner roles
    const { data: teamMember, error: teamMemberError } = await client
      .from('team_member')
      .select('id')
      .eq('user_id', appUserId)
      .eq('team_id', teamId)
      .maybeSingle();
      
    if (teamMemberError || !teamMember) {
      return false;
    }
    
    const teamMemberId = teamMember.id;
    
    // Get team role
    const { data: teamRole, error: teamRoleError } = await client
      .from('team_roles')
      .select('role')
      .eq('team_member_id', teamMemberId)
      .maybeSingle();
      
    if (teamRoleError) {
      return false;
    }
    
    // These roles have manager-level access
    const managerRoles = ['manager', 'owner', 'creator', 'admin'];
    return teamRole?.role !== null && managerRoles.includes(teamRole?.role);
  } catch (error) {
    console.error('Exception in checkTeamManagerAccess:', error);
    return false;
  }
}

/**
 * Get detailed access information for a team
 * Uses our validate_team_access edge function
 */
export async function getDetailedTeamAccess(
  userId: string, 
  teamId: string,
  supabase?: ReturnType<typeof createClient>
) {
  try {
    // Use provided supabase client or create a new one with admin privileges
    const client = supabase || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get app_user ID
    const { data: appUser, error: appUserError } = await client
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (appUserError) {
      console.error('Error getting app_user ID:', appUserError);
      return {
        is_member: false,
        has_org_access: false,
        access_reason: 'error_app_user_not_found'
      };
    }
    
    const appUserId = appUser?.id;
    
    // Get user's organization
    const { data: userProfile, error: userProfileError } = await client
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    if (userProfileError) {
      console.error('Error getting user org ID:', userProfileError);
      return {
        is_member: false,
        has_org_access: false,
        access_reason: 'error_user_profile_not_found'
      };
    }
    
    const userOrgId = userProfile?.org_id;
    
    // Get team and its organization
    const { data: teamData, error: teamError } = await client
      .from('team')
      .select('*, org:org_id(id, name)')
      .eq('id', teamId)
      .single();
      
    if (teamError) {
      console.error('Error getting team details:', teamError);
      return {
        is_member: false,
        has_org_access: false,
        access_reason: 'error_team_not_found'
      };
    }
    
    const teamOrgId = teamData?.org_id;
    const teamOrgName = teamData?.org?.name;
    
    // Check if user is a team member
    const { data: teamMember, error: teamMemberError } = await client
      .from('team_member')
      .select('id')
      .eq('user_id', appUserId)
      .eq('team_id', teamId)
      .maybeSingle();
      
    const isTeamMember = !!teamMember;
    const teamMemberId = teamMember?.id;
    
    // Get team role if user is a member
    let teamRole = null;
    if (isTeamMember && teamMemberId) {
      const { data: roleData, error: roleError } = await client
        .from('team_roles')
        .select('role')
        .eq('team_member_id', teamMemberId)
        .maybeSingle();
        
      if (!roleError && roleData) {
        teamRole = roleData.role;
      }
    }
    
    // Get organization role
    const { data: orgRoleData, error: orgRoleError } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', teamOrgId)
      .maybeSingle();
      
    const orgRole = orgRoleData?.role;
    
    // Determine access reason
    let accessReason = 'none';
    if (isTeamMember) {
      accessReason = 'team_member';
    } else if (userOrgId === teamOrgId) {
      if (orgRole === 'owner' || orgRole === 'manager') {
        accessReason = 'org_manager_access';
      } else {
        accessReason = 'same_org';
      }
    }
    
    // Check for organization-level access
    const hasSameOrg = userOrgId === teamOrgId;
    const hasOrgManagerAccess = hasSameOrg && (orgRole === 'owner' || orgRole === 'manager');
    
    // Determine highest role
    let highestRole = teamRole;
    if (orgRole) {
      if (!highestRole) {
        highestRole = orgRole;
      } else {
        // Role priority logic
        const rolePriority = { 'owner': 0, 'manager': 1, 'admin': 2, 'creator': 3, 'technician': 4, 'viewer': 5 };
        const teamRolePriority = rolePriority[teamRole] || 999;
        const orgRolePriority = rolePriority[orgRole] || 999;
        
        // Lower number = higher priority
        if (orgRolePriority < teamRolePriority) {
          highestRole = orgRole;
        }
      }
    }
    
    return {
      is_member: isTeamMember,
      has_access: isTeamMember || hasOrgManagerAccess,
      has_org_access: hasSameOrg,
      team_member_id: teamMemberId,
      role: highestRole,
      org_role: orgRole,
      team_role: teamRole,
      has_cross_org_access: userOrgId !== teamOrgId && isTeamMember,
      access_reason: accessReason,
      team_details: teamData,
      org_name: teamOrgName,
      user_org_id: userOrgId,
      team_org_id: teamOrgId
    };
  } catch (error) {
    console.error('Exception in getDetailedTeamAccess:', error);
    return {
      is_member: false,
      has_org_access: false,
      access_reason: 'error'
    };
  }
}

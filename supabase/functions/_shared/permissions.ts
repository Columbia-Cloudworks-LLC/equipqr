
/**
 * Shared permission checking utilities for edge functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Types for consistent usage across functions
export type AccessResult = {
  hasAccess: boolean;
  reason?: string;
  role?: string;
  details?: any;
};

/**
 * Create a Supabase client with admin privileges
 */
export function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Check if a user has access to a team by checking:
 * 1. Direct team membership
 * 2. Organization access (same org or org-level permissions)
 */
export async function checkTeamAccess(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  teamId: string
): Promise<AccessResult> {
  try {
    // Get user's auth_uid to app_user id mapping
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .maybeSingle();
    
    // Get the team's organization
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('org_id')
      .eq('id', teamId)
      .single();
    
    if (teamError) {
      console.error('Error fetching team details:', teamError);
      return { 
        hasAccess: false, 
        reason: 'team_not_found'
      };
    }
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return { 
        hasAccess: false, 
        reason: 'user_not_found'
      };
    }
    
    // Check if user is a direct team member (using app_user ID)
    let isDirectMember = false;
    let teamRole = null;
    
    if (appUser?.id) {
      // Check team membership
      const { data: teamMember } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', teamId)
        .maybeSingle();
      
      isDirectMember = Boolean(teamMember?.id);
      
      // If direct member, get the role
      if (isDirectMember) {
        const { data: roleData } = await supabase.rpc(
          'get_team_role',
          { _user_id: userId, _team_id: teamId }
        );
        
        teamRole = roleData || 'viewer'; // Default to viewer if no specific role
      }
    }
    
    // Check for organization-level roles
    const { data: orgRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', team.org_id);
    
    // Check if any roles exist and if any are 'owner' role
    const hasOrgAccess = orgRoles && orgRoles.length > 0 && 
      orgRoles.some(r => r.role === 'owner');
    
    // Same organization check
    const isSameOrg = userProfile.org_id === team.org_id;
    
    // User has access if:
    // 1. They're a direct member of the team OR
    // 2. They have an org-level 'owner' role for the team's organization OR
    // 3. They're in the team's organization
    const hasAccess = isDirectMember || hasOrgAccess || isSameOrg;
    
    // Determine the reason for access
    let reason = 'no_access';
    if (isDirectMember) reason = 'team_member';
    else if (hasOrgAccess) reason = 'org_owner';
    else if (isSameOrg) reason = 'same_org';
    
    return {
      hasAccess,
      reason,
      role: isDirectMember ? teamRole : (hasOrgAccess ? 'owner' : (isSameOrg ? 'org_member' : null)),
      details: {
        isDirectMember,
        hasOrgAccess,
        isSameOrg,
        teamOrgId: team.org_id,
        userOrgId: userProfile.org_id
      }
    };
  } catch (error) {
    console.error('Error checking team access:', error);
    return {
      hasAccess: false,
      reason: 'error',
      details: { message: error.message }
    };
  }
}

/**
 * Check if a user has permission to perform role changes in a team
 */
export async function checkRolePermission(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  teamId: string
): Promise<AccessResult> {
  try {
    // Get the team's organization
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('org_id, created_by')
      .eq('id', teamId)
      .single();
    
    if (teamError) {
      console.error('Error fetching team details:', teamError);
      return { 
        hasAccess: false, 
        reason: 'team_not_found'
      };
    }
    
    // Check if the user is the team creator
    if (team.created_by === userId) {
      return { 
        hasAccess: true, 
        reason: 'team_creator',
        role: 'creator'
      };
    }
    
    // Check if the user has an owner or manager role in the organization
    const { data: orgRole } = await supabase.rpc(
      'get_user_role',
      { _user_id: userId, _org_id: team.org_id }
    );
    
    if (orgRole === 'owner') {
      return { 
        hasAccess: true, 
        reason: 'org_owner',
        role: 'owner'
      };
    }
    
    // Check if the user has manager role in the team
    const { data: teamRole } = await supabase.rpc(
      'get_team_role',
      { _user_id: userId, _team_id: teamId }
    );
    
    if (teamRole === 'manager') {
      return { 
        hasAccess: true, 
        reason: 'team_manager',
        role: 'manager'
      };
    }
    
    // User doesn't have permission
    return { 
      hasAccess: false, 
      reason: 'insufficient_permissions'
    };
  } catch (error) {
    console.error('Error checking role permission:', error);
    return { 
      hasAccess: false, 
      reason: 'error',
      details: { message: error.message }
    };
  }
}

/**
 * Check if a user has access to an equipment item
 */
export async function checkEquipmentAccess(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  equipmentId: string
): Promise<AccessResult> {
  try {
    // Get equipment details
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('org_id, team_id')
      .eq('id', equipmentId)
      .is('deleted_at', null)
      .single();
    
    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      return { 
        hasAccess: false, 
        reason: 'equipment_not_found'
      };
    }
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return { 
        hasAccess: false, 
        reason: 'user_not_found'
      };
    }
    
    // Direct organization access
    if (userProfile.org_id === equipment.org_id) {
      return { 
        hasAccess: true,
        reason: 'same_org'
      };
    }
    
    // If equipment belongs to a team, check team membership
    if (equipment.team_id) {
      // Use the team access check function
      const teamAccess = await checkTeamAccess(supabase, userId, equipment.team_id);
      
      if (teamAccess.hasAccess) {
        return {
          hasAccess: true,
          reason: 'team_access',
          role: teamAccess.role,
          details: {
            teamId: equipment.team_id,
            accessReason: teamAccess.reason
          }
        };
      }
    }
    
    // Check if user has org-level access
    const { data: orgRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', equipment.org_id);
      
    if (orgRoles && orgRoles.length > 0) {
      // If user has any role in the equipment's organization, grant access
      return { 
        hasAccess: true,
        reason: 'org_role',
        role: orgRoles[0].role
      };
    }
    
    // No access found
    return { 
      hasAccess: false,
      reason: 'no_access'
    };
  } catch (error) {
    console.error('Error checking equipment access:', error);
    return { 
      hasAccess: false,
      reason: 'error',
      details: { message: error.message }
    };
  }
}

/**
 * Standard CORS headers for all edge functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Create a standard error response with CORS headers
 */
export function createErrorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ 
      error: message,
      success: false
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status 
    }
  );
}

/**
 * Create a standard success response with CORS headers
 */
export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({ 
      ...data,
      success: true
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}

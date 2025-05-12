
// Shared utilities for edge functions

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Create a client with admin privileges to bypass RLS
export async function createAdminClient() {
  // These env vars are automatically available when deployed
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing environment variables for Supabase connection.');
  }
  
  // Import the Supabase client using ES modules
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  
  // Create admin client
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper function to check equipment access permissions
export async function checkEquipmentAccess(supabase, userId, equipmentId) {
  try {
    console.log(`Checking equipment access for user ${userId} on equipment ${equipmentId}`);
    
    // First get the equipment details
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('team_id, org_id')
      .eq('id', equipmentId)
      .single();
    
    if (equipmentError || !equipment) {
      console.error('Error fetching equipment:', equipmentError);
      return { 
        hasAccess: false, 
        reason: 'equipment_not_found' 
      };
    }
    
    console.log('Equipment details:', equipment);
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return { 
        hasAccess: false, 
        reason: 'user_not_found' 
      };
    }
    
    console.log('User profile:', userProfile);
    
    // First check: User is from the same organization as the equipment
    if (userProfile.org_id === equipment.org_id) {
      console.log('Access granted: User is from the same organization as the equipment');
      return { 
        hasAccess: true, 
        reason: 'same_org',
        role: 'member' 
      };
    }
    
    // Second check: If equipment belongs to a team
    if (equipment.team_id) {
      console.log(`Equipment belongs to team ${equipment.team_id}, checking team access`);
      
      // Using RPC to check team access without causing recursion
      const { data: teamAccess, error: teamAccessError } = await supabase.rpc(
        'check_team_access_detailed',
        {
          user_id: userId,
          team_id: equipment.team_id
        }
      );
      
      if (teamAccessError) {
        console.error('Error checking team access:', teamAccessError);
      }
      
      if (teamAccess && teamAccess.length > 0 && teamAccess[0].has_access) {
        console.log('Access granted via team membership check:', teamAccess[0]);
        return {
          hasAccess: true,
          reason: teamAccess[0].access_reason,
          role: teamAccess[0].team_role || 'viewer',
          details: {
            teamId: equipment.team_id,
            teamOrgId: teamAccess[0].team_org_id,
            accessMethod: 'team_access_function'
          }
        };
      }
      
      // Fallback: Check for app_user mapping (legacy method)
      // First get app_user ID for this auth user
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .maybeSingle();
        
      if (appUser?.id) {
        console.log(`Found app_user ID ${appUser.id} for auth user ${userId}`);
        
        // Check team membership with app_user ID
        const { data: teamMember } = await supabase
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .maybeSingle();
          
        if (teamMember?.id) {
          console.log('Access granted: User is a direct team member');
          
          // Get role for this team member
          const { data: teamRole } = await supabase
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id)
            .maybeSingle();
            
          return { 
            hasAccess: true, 
            reason: 'team_member',
            role: teamRole?.role || 'viewer',
            details: {
              teamId: equipment.team_id,
              teamMemberId: teamMember.id,
              accessMethod: 'direct_team_membership'
            }
          };
        }
      }
      
      // Check for cross-organization access via organization_acl
      console.log('Checking cross-organization access');
      const { data: orgAcl } = await supabase
        .from('organization_acl')
        .select('role')
        .eq('subject_id', userId)
        .eq('subject_type', 'user')
        .eq('org_id', equipment.org_id)
        .or('expires_at.gt.now,expires_at.is.null')
        .maybeSingle();
        
      if (orgAcl) {
        console.log('Access granted: User has cross-organization access');
        return { 
          hasAccess: true, 
          reason: 'cross_org_access',
          role: orgAcl.role,
          details: {
            orgId: equipment.org_id,
            accessMethod: 'organization_acl'
          }
        };
      }
    }
    
    // No access granted
    console.log('Access denied: No permission found');
    return { 
      hasAccess: false, 
      reason: 'no_permission' 
    };
  } catch (error) {
    console.error('Error in checkEquipmentAccess:', error);
    return { 
      hasAccess: false, 
      reason: 'error',
      details: { message: error.message }
    };
  }
}

// Helper function to check team access
export async function checkTeamAccess(supabase, userId, teamId) {
  try {
    console.log(`Checking team access for user ${userId} on team ${teamId}`);
    
    // Use the database function that avoids recursion
    const { data: teamAccess, error: teamAccessError } = await supabase.rpc(
      'check_team_access_detailed',
      {
        user_id: userId,
        team_id: teamId
      }
    );
    
    if (teamAccessError) {
      console.error('Error checking team access:', teamAccessError);
      return { 
        hasAccess: false, 
        reason: 'function_error',
        details: { message: teamAccessError.message }
      };
    }
    
    // The function returns an array with one row, so we need to get the first element
    if (teamAccess && teamAccess.length > 0) {
      const accessData = teamAccess[0];
      console.log('Team access check result from function:', accessData);
      
      return {
        hasAccess: accessData.has_access,
        reason: accessData.access_reason,
        role: accessData.team_role,
        details: {
          userOrgId: accessData.user_org_id,
          teamOrgId: accessData.team_org_id,
          isTeamMember: accessData.is_team_member,
          isOrgOwner: accessData.is_org_owner
        }
      };
    }
    
    // If the function call failed or returned empty, fall back to checking cross-org access
    console.log('No result from check_team_access_detailed, checking cross-organization access');
    
    // Get the team's organization using RPC to avoid recursion
    const { data: teamOrgId } = await supabase.rpc('get_team_org', {
      team_id_param: teamId
    });
    
    if (!teamOrgId) {
      return {
        hasAccess: false,
        reason: 'team_not_found'
      };
    }
    
    // Check for cross-organization access
    const { data: orgAcl } = await supabase
      .from('organization_acl')
      .select('role')
      .eq('subject_id', userId)
      .eq('subject_type', 'user')
      .eq('org_id', teamOrgId)
      .or('expires_at.gt.now,expires_at.is.null')
      .maybeSingle();
      
    if (orgAcl) {
      console.log('Access granted: User has cross-organization access');
      return { 
        hasAccess: true, 
        reason: 'cross_org_access',
        role: orgAcl.role,
        details: {
          orgId: teamOrgId
        }
      };
    }
    
    // No access granted
    console.log('Access denied: No permission found');
    return { 
      hasAccess: false, 
      reason: 'no_permission' 
    };
  } catch (error) {
    console.error('Error in checkTeamAccess:', error);
    return { 
      hasAccess: false, 
      reason: 'error',
      details: { message: error.message }
    };
  }
}

// Helper function to check team role permissions
export async function checkRolePermission(supabase, userId, teamId) {
  try {
    // Use our detailed team access function
    const { data: teamAccess, error: teamAccessError } = await supabase.rpc(
      'check_team_access_detailed',
      {
        user_id: userId,
        team_id: teamId
      }
    );
    
    if (teamAccessError) {
      console.error('Error checking team access:', teamAccessError);
      return { 
        hasAccess: false, 
        reason: 'function_error',
        details: { message: teamAccessError.message }
      };
    }
    
    // Process the result
    if (teamAccess && teamAccess.length > 0) {
      const accessData = teamAccess[0];
      
      // Check if user has sufficient role
      if (accessData.has_access) {
        // Managers, admins and owners can change roles
        if (accessData.is_org_owner) {
          return { 
            hasAccess: true, 
            reason: 'org_role',
            role: 'owner'
          };
        }
        
        const managerRoles = ['manager', 'admin', 'owner'];
        if (accessData.team_role && managerRoles.includes(accessData.team_role)) {
          return {
            hasAccess: true,
            reason: 'team_role',
            role: accessData.team_role
          };
        }
      }
    }
    
    // No access granted
    return { 
      hasAccess: false, 
      reason: 'insufficient_permissions' 
    };
  } catch (error) {
    console.error('Error in checkRolePermission:', error);
    return { 
      hasAccess: false, 
      reason: 'error',
      details: { message: error.message }
    };
  }
}

// Helper to return a standard error response
export function createErrorResponse(message, statusCode = 400) {
  return new Response(
    JSON.stringify({ 
      error: message 
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    }
  );
}

// Helper to return a standard success response
export function createSuccessResponse(data, statusCode = 200) {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    }
  );
}

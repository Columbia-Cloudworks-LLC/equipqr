
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
      
      // Check if user is an org owner of the team's organization
      // First get the team's organization
      const { data: team } = await supabase
        .from('team')
        .select('org_id')
        .eq('id', equipment.team_id)
        .single();
        
      if (team) {
        console.log('Team\'s organization:', team.org_id);
        
        // Check if user is an org owner
        const { data: orgRole } = await supabase.rpc('get_user_role', {
          _user_id: userId,
          _org_id: team.org_id
        });
        
        if (orgRole === 'owner') {
          console.log('Access granted: User is an organization owner');
          return { 
            hasAccess: true, 
            reason: 'org_owner',
            role: orgRole,
            details: {
              teamId: equipment.team_id,
              orgId: team.org_id
            }
          };
        }
      }
      
      // Try direct team membership using app_user mapping
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
              teamMemberId: teamMember.id
            }
          };
        } else {
          console.log('User is not a direct team member');
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
            orgId: equipment.org_id
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
    
    // Get the team's organization
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('org_id')
      .eq('id', teamId)
      .single();
      
    if (teamError || !team) {
      console.error('Error fetching team:', teamError);
      return { 
        hasAccess: false, 
        reason: 'team_not_found' 
      };
    }
    
    console.log('Team details:', team);
    
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
    
    // First check: User is from the same organization as the team
    if (userProfile.org_id === team.org_id) {
      console.log('Access granted: User is from the same organization as the team');
      return { 
        hasAccess: true, 
        reason: 'same_org',
        role: 'member',
        details: {
          userOrgId: userProfile.org_id,
          teamOrgId: team.org_id
        }
      };
    }
    
    // Check if user is an org owner
    const { data: orgRole } = await supabase.rpc('get_user_role', {
      _user_id: userId,
      _org_id: team.org_id
    });
    
    if (orgRole === 'owner') {
      console.log('Access granted: User is an organization owner');
      return { 
        hasAccess: true, 
        reason: 'org_owner',
        role: 'owner',
        details: {
          userOrgId: userProfile.org_id,
          teamOrgId: team.org_id
        }
      };
    }
    
    // Check direct team membership using app_user mapping
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
        .eq('team_id', teamId)
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
            teamMemberId: teamMember.id
          }
        };
      }
    }
    
    // Check for cross-organization access
    console.log('Checking cross-organization access');
    const { data: orgAcl } = await supabase
      .from('organization_acl')
      .select('role')
      .eq('subject_id', userId)
      .eq('subject_type', 'user')
      .eq('org_id', team.org_id)
      .or('expires_at.gt.now,expires_at.is.null')
      .maybeSingle();
      
    if (orgAcl) {
      console.log('Access granted: User has cross-organization access');
      return { 
        hasAccess: true, 
        reason: 'cross_org_access',
        role: orgAcl.role,
        details: {
          orgId: team.org_id
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
    // Get team's organization using our safe helper function
    const { data: teamOrgId } = await supabase.rpc('get_team_org', {
      team_id_param: teamId
    });
    
    if (!teamOrgId) {
      console.error('Team not found or has no organization');
      return { 
        hasAccess: false, 
        reason: 'team_not_found' 
      };
    }
    
    // First check: is the user an org owner or admin?
    const { data: orgRole } = await supabase.rpc(
      'get_user_role',
      { _user_id: userId, _org_id: teamOrgId }
    );
    
    if (orgRole === 'owner' || orgRole === 'admin') {
      return { 
        hasAccess: true, 
        reason: 'org_role',
        role: orgRole
      };
    }
    
    // Use our safe helper function to check team role without recursion
    const { data: teamRole } = await supabase.rpc('get_team_role_safe', {
      _user_id: userId,
      _team_id: teamId
    });
    
    if (teamRole === 'manager') {
      return {
        hasAccess: true,
        reason: 'team_role',
        role: 'manager'
      };
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

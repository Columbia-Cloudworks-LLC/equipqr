
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
    
    // First check: User is from the same organization as the equipment
    if (userProfile.org_id === equipment.org_id) {
      return { 
        hasAccess: true, 
        reason: 'same_org',
        role: 'member' 
      };
    }
    
    // Second check: If equipment belongs to a team
    if (equipment.team_id) {
      // Get app_user id from auth user id
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', userId)
        .single();
      
      if (appUser) {
        // Check if user is a member of the team
        const { data: teamMember } = await supabase
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .maybeSingle();
          
        if (teamMember) {
          // Get team member's role
          const { data: teamRole } = await supabase
            .from('team_roles')
            .select('role')
            .eq('team_member_id', teamMember.id)
            .maybeSingle();
          
          return { 
            hasAccess: true, 
            reason: 'team_access',
            role: teamRole?.role || 'member',
            details: {
              teamId: equipment.team_id,
              teamMemberId: teamMember.id
            }
          };
        }
      }
      
      // Check for cross-organization access via organization_acl
      const { data: orgAcl } = await supabase
        .from('organization_acl')
        .select('role')
        .eq('subject_id', userId)
        .eq('subject_type', 'user')
        .eq('org_id', equipment.org_id)
        .or('expires_at.gt.now,expires_at.is.null')
        .maybeSingle();
        
      if (orgAcl) {
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

// Helper function to check team role permissions
export async function checkRolePermission(supabase, userId, teamId) {
  try {
    // Get team's organization
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
    
    // First check: is the user an org owner or admin?
    const { data: orgRole } = await supabase.rpc(
      'get_user_role',
      { _user_id: userId, _org_id: team.org_id }
    );
    
    if (orgRole === 'owner' || orgRole === 'admin') {
      return { 
        hasAccess: true, 
        reason: 'org_role',
        role: orgRole
      };
    }
    
    // Get app_user id from auth user id
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .maybeSingle();
    
    if (!appUser) {
      return {
        hasAccess: false,
        reason: 'user_not_found'
      };
    }
    
    // Check if user is a team member with manager role
    const { data: teamMember } = await supabase
      .from('team_member')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('team_id', teamId)
      .maybeSingle();
    
    if (teamMember) {
      // Get team member's role
      const { data: teamRole } = await supabase
        .from('team_roles')
        .select('role')
        .eq('team_member_id', teamMember.id)
        .maybeSingle();
      
      if (teamRole && teamRole.role === 'manager') {
        return {
          hasAccess: true,
          reason: 'team_role',
          role: 'manager',
          details: {
            teamMemberId: teamMember.id
          }
        };
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

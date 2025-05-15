
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200 
    }
  );
}

function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }, 
      status 
    }
  );
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user_id, equipment_id, team_id, action } = body;
    
    console.log(`Permission check request:`, JSON.stringify(body));
    
    if (!user_id) {
      console.error("Missing user_id parameter");
      return createErrorResponse("Missing required parameter: user_id");
    }

    if (!action) {
      console.error("Missing action parameter");
      return createErrorResponse("Missing action parameter: specify 'create', 'edit', or 'view'");
    }
    
    if (action !== 'create' && !equipment_id) {
      console.error("Missing equipment_id parameter for non-create action");
      return createErrorResponse("Equipment ID is required for edit, delete, and view actions");
    }
    
    // Create Supabase client with service role to bypass RLS
    const adminClient = createAdminClient();

    // Direct DB queries without RPC functions to avoid type issues
    if (action === 'create') {
      // Check if user can create equipment
      let userOrgId, teamOrgId;
      
      // Get user's organization ID
      const { data: userProfile, error: userError } = await adminClient
        .from('user_profiles')
        .select('org_id')
        .eq('id', user_id)
        .single();
      
      if (userError) {
        console.error('Error fetching user profile:', userError);
        return createErrorResponse(`Failed to get user info: ${userError.message}`);
      }
      
      userOrgId = userProfile?.org_id;
      
      // If team is specified, get team's org ID
      if (team_id) {
        const { data: team, error: teamError } = await adminClient
          .from('team')
          .select('org_id')
          .eq('id', team_id)
          .single();
          
        if (teamError) {
          console.error('Error fetching team:', teamError);
          return createErrorResponse(`Failed to get team info: ${teamError.message}`);
        }
        
        teamOrgId = team?.org_id;
        
        // Same org - permission granted
        if (userOrgId === teamOrgId) {
          return createSuccessResponse({
            has_permission: true,
            org_id: teamOrgId,
            reason: 'same_org'
          });
        }
        
        // Check team role - get app_user.id first 
        const { data: appUser } = await adminClient
          .from('app_user')
          .select('id')
          .eq('auth_uid', user_id)
          .single();
          
        if (appUser) {
          // Get team member record
          const { data: teamMember } = await adminClient
            .from('team_member')
            .select('id')
            .eq('user_id', appUser.id)
            .eq('team_id', team_id)
            .single();
            
          if (teamMember) {
            // Get role
            const { data: roleData } = await adminClient
              .from('team_roles')
              .select('role')
              .eq('team_member_id', teamMember.id)
              .single();
              
            if (roleData && ['manager', 'owner', 'admin', 'creator'].includes(roleData.role)) {
              return createSuccessResponse({
                has_permission: true,
                org_id: teamOrgId,
                reason: 'team_role'
              });
            }
          }
        }
        
        return createSuccessResponse({
          has_permission: false,
          reason: 'no_team_permission'
        });
      } else {
        // No team specified, user can create equipment in own org
        return createSuccessResponse({
          has_permission: true,
          org_id: userOrgId,
          reason: 'default_org'
        });
      }
    } else if (action === 'edit' && equipment_id) {
      // Get equipment details
      const { data: equipment, error: equipmentError } = await adminClient
        .from('equipment')
        .select('team_id, org_id')
        .eq('id', equipment_id)
        .single();
        
      if (equipmentError) {
        console.error('Error fetching equipment:', equipmentError);
        return createErrorResponse(`Equipment fetch error: ${equipmentError.message}`);
      }
      
      // Get user profile
      const { data: userProfile, error: profileError } = await adminClient
        .from('user_profiles')
        .select('org_id')
        .eq('id', user_id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return createErrorResponse(`User profile error: ${profileError.message}`);
      }
      
      // Same org allows edit
      if (userProfile?.org_id === equipment?.org_id) {
        // Check org role for stricter permissions
        const { data: userRoles } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user_id)
          .eq('org_id', equipment.org_id)
          .in('role', ['owner', 'manager'])
          .maybeSingle();
          
        if (userRoles) {
          return createSuccessResponse({
            has_permission: true,
            reason: 'org_role',
            role: userRoles.role
          });
        }
      }
      
      // Check team access if equipment belongs to a team
      if (equipment?.team_id) {
        // Get app_user id first
        const { data: appUser } = await adminClient
          .from('app_user')
          .select('id')
          .eq('auth_uid', user_id)
          .single();
          
        if (!appUser) {
          return createSuccessResponse({
            has_permission: false,
            reason: 'user_not_found'
          });
        }
        
        // Check team membership
        const { data: teamMember } = await adminClient
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .single();
          
        if (!teamMember) {
          return createSuccessResponse({
            has_permission: false,
            reason: 'not_team_member'
          });
        }
        
        // Check role allows editing
        const { data: teamRole } = await adminClient
          .from('team_roles')
          .select('role')
          .eq('team_member_id', teamMember.id)
          .single();
          
        const canEdit = teamRole?.role && ['manager', 'owner', 'admin', 'creator'].includes(teamRole.role);
        
        return createSuccessResponse({
          has_permission: canEdit,
          reason: canEdit ? 'team_role' : 'insufficient_role',
          role: teamRole?.role
        });
      }
      
      // Default deny
      return createSuccessResponse({
        has_permission: false,
        reason: 'no_permission'
      });
    } else if (action === 'view' && equipment_id) {
      // Get equipment details
      const { data: equipment, error: equipmentError } = await adminClient
        .from('equipment')
        .select('team_id, org_id')
        .eq('id', equipment_id)
        .single();
        
      if (equipmentError) {
        console.error('Error fetching equipment:', equipmentError);
        return createErrorResponse(`Equipment fetch error: ${equipmentError.message}`);
      }
      
      // Get user profile
      const { data: userProfile } = await adminClient
        .from('user_profiles')
        .select('org_id')
        .eq('id', user_id)
        .single();
      
      // Same org grants view access
      if (userProfile?.org_id === equipment?.org_id) {
        return createSuccessResponse({
          has_permission: true,
          reason: 'same_organization'
        });
      }
      
      // Check team access if equipment belongs to a team
      if (equipment?.team_id) {
        // Get app_user id first
        const { data: appUser } = await adminClient
          .from('app_user')
          .select('id')
          .eq('auth_uid', user_id)
          .single();
          
        if (!appUser) {
          return createSuccessResponse({
            has_permission: false,
            reason: 'user_not_found'
          });
        }
        
        // Check team membership
        const { data: teamMember } = await adminClient
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .single();
          
        if (teamMember) {
          return createSuccessResponse({
            has_permission: true,
            reason: 'team_membership'
          });
        }
      }
      
      // Default deny
      return createSuccessResponse({
        has_permission: false,
        reason: 'no_permission'
      });
    } else {
      return createErrorResponse(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});

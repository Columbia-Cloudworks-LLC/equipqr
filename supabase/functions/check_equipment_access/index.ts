
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inlined CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Inlined success response function
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

// Inlined error response function
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

// Inlined checkEquipmentAccess function
async function checkEquipmentAccess(
  userId: string, 
  equipmentId: string, 
  supabase?: ReturnType<typeof createClient>
) {
  try {
    // Use provided supabase client or create a new one
    const client = supabase || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Use our optimized RPC function
    const { data, error } = await client.rpc(
      'rpc_check_equipment_permission',
      { 
        user_id: userId, 
        action: 'view',
        equipment_id: equipmentId
      }
    );

    if (error) {
      console.error('Error checking equipment access:', error);
      return false;
    }

    return data?.has_permission || false;
  } catch (error) {
    console.error('Exception in checkEquipmentAccess:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { equipment_id, user_id } = await req.json();
    
    if (!equipment_id || !user_id) {
      return createErrorResponse("Missing required parameters: equipment_id and user_id must be provided");
    }

    // Create service role client for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get equipment details first
    const { data: equipment, error: equipmentError } = await adminClient
      .from('equipment')
      .select(`id, org_id, team_id`)
      .eq('id', equipment_id)
      .is('deleted_at', null)
      .single();
    
    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      return createErrorResponse(`Equipment fetch error: ${equipmentError.message}`);
    }
    
    if (!equipment) {
      return createSuccessResponse({
        has_access: false,
        reason: 'not_found'
      });
    }
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return createErrorResponse(`User profile fetch error: ${profileError.message}`);
    }
    
    // Check user's organization role
    const { data: userRoles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .eq('org_id', equipment.org_id)
      .maybeSingle();
    
    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      // Continue checking other access paths
    }
    
    // Same organization gives access
    if (userProfile?.org_id === equipment.org_id) {
      const role = userRoles?.role || 'member';
      const canEdit = role === 'owner' || role === 'manager';
      
      return createSuccessResponse({
        has_access: true,
        reason: 'same_organization',
        role: canEdit ? 'editor' : 'viewer',
        user_org_id: userProfile.org_id,
        equipment_org_id: equipment.org_id
      });
    }
    
    // If not same org but has team_id, check team access
    if (equipment.team_id) {
      // Get the app_user.id that corresponds to the auth.users.id
      const { data: appUser } = await adminClient
        .from('app_user')
        .select('id')
        .eq('auth_uid', user_id)
        .maybeSingle();
        
      if (!appUser) {
        return createSuccessResponse({
          has_access: false,
          reason: 'user_not_found'
        });
      }
      
      // Check if the user is a member of this team
      const { data: teamMember } = await adminClient
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', equipment.team_id)
        .maybeSingle();
        
      if (!teamMember) {
        return createSuccessResponse({
          has_access: false,
          reason: 'not_team_member'
        });
      }
      
      // Get the role
      const { data: teamRole } = await adminClient
        .from('team_roles')
        .select('role')
        .eq('team_member_id', teamMember.id)
        .maybeSingle();
        
      const role = teamRole?.role;
      const canEdit = role && ['manager', 'owner', 'admin', 'creator'].includes(role);
      
      return createSuccessResponse({
        has_access: true,
        reason: 'team_membership',
        role: canEdit ? 'editor' : 'viewer',
        team_role: role
      });
    }
    
    // No access
    return createSuccessResponse({
      has_access: false,
      reason: 'no_permission'
    });
    
  } catch (error) {
    console.error('Unexpected error in check_equipment_access:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});

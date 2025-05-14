
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { checkEquipmentAccess } from '../_shared/equipmentAccess.ts';

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

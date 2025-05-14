
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, equipment_id } = await req.json();
    
    if (!user_id || !equipment_id) {
      return createErrorResponse("Missing required parameters");
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Use service role key to bypass RLS - this avoids recursion issues
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get equipment details
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('team_id, org_id')
      .eq('id', equipment_id)
      .is('deleted_at', null)
      .single();
      
    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      return createErrorResponse("Equipment not found or access error");
    }
    
    // Check org-level permission first - users can edit equipment in their own org
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', user_id)
      .single();
      
    // If user belongs to the equipment's organization, they can edit it
    if (userProfile && userProfile.org_id === equipment.org_id) {
      // Check if they have appropriate role in the organization
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user_id)
        .eq('org_id', equipment.org_id);
        
      if (userRoles && userRoles.length > 0) {
        // Any user with a role in the org can edit equipment in that org
        return createSuccessResponse({
          can_edit: true,
          role: userRoles[0].role,
          reason: 'org_member'
        });
      }
    }
    
    // If equipment is assigned to a team, check team-level permissions
    if (equipment.team_id) {
      // First get the app_user.id for this auth user
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', user_id)
        .single();
        
      if (!appUser) {
        return createSuccessResponse({
          can_edit: false,
          reason: 'user_not_found'
        });
      }
      
      // Get team member record
      const { data: teamMember } = await supabase
        .from('team_member')
        .select('id')
        .eq('user_id', appUser.id)
        .eq('team_id', equipment.team_id)
        .single();
        
      if (!teamMember) {
        return createSuccessResponse({
          can_edit: false,
          reason: 'not_team_member'
        });
      }
      
      // Get role from team_roles table
      const { data: teamRole } = await supabase
        .from('team_roles')
        .select('role')
        .eq('team_member_id', teamMember.id)
        .single();
        
      const role = teamRole?.role;
      
      // These roles can edit equipment
      const canEdit = role && ['owner', 'manager', 'admin', 'creator'].includes(role);
      
      return createSuccessResponse({
        can_edit: canEdit,
        role: role,
        team_id: equipment.team_id,
        reason: 'team_role'
      });
    }
    
    // Default deny access
    return createSuccessResponse({
      can_edit: false,
      reason: 'no_permission'
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(error.message);
  }
});

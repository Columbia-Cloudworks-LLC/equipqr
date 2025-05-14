
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, equipment_id, action } = await req.json();
    
    if (!user_id) {
      return createErrorResponse("Missing required parameter: user_id");
    }

    if (!equipment_id && action !== 'create') {
      return createErrorResponse("Missing required parameter: equipment_id");
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // For creation permission check
    if (action === 'create') {
      // Check if the user can create equipment based on org permissions
      const { data: userProfile } = await adminClient
        .from('user_profiles')
        .select('org_id')
        .eq('id', user_id)
        .maybeSingle();
      
      if (!userProfile?.org_id) {
        return createSuccessResponse({
          has_permission: false,
          reason: 'no_organization'
        });
      }
      
      // Check user's role in the organization
      const { data: userRoles } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user_id)
        .eq('org_id', userProfile.org_id)
        .maybeSingle();
        
      // Only owners and managers can create equipment
      if (userRoles?.role === 'owner' || userRoles?.role === 'manager') {
        return createSuccessResponse({
          has_permission: true,
          role: userRoles.role,
          org_id: userProfile.org_id,
          reason: 'org_role'
        });
      }
      
      return createSuccessResponse({
        has_permission: false,
        reason: 'insufficient_org_permissions'
      });
    }
    
    // For edit/view permission check
    if (action === 'edit' || action === 'view') {
      // Get equipment details
      const { data: equipment, error: equipmentError } = await adminClient
        .from('equipment')
        .select('team_id, org_id')
        .eq('id', equipment_id)
        .is('deleted_at', null)
        .single();
        
      if (equipmentError) {
        return createErrorResponse("Equipment not found or already deleted");
      }
      
      // Get user's org ID
      const { data: userProfile } = await adminClient
        .from('user_profiles')
        .select('org_id')
        .eq('id', user_id)
        .single();
      
      // Check if user belongs to the equipment's org
      if (userProfile.org_id === equipment.org_id) {
        if (action === 'view') {
          // Any org member can view org equipment
          return createSuccessResponse({
            has_permission: true,
            reason: 'same_organization'
          });
        }
        
        // For edit, check org role
        const { data: userRoles } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user_id)
          .eq('org_id', equipment.org_id)
          .maybeSingle();
          
        if (userRoles?.role === 'owner' || userRoles?.role === 'manager') {
          return createSuccessResponse({
            has_permission: true,
            role: userRoles.role,
            reason: 'org_role'
          });
        }
      }
      
      // If equipment is assigned to a team
      if (equipment.team_id) {
        // First get the app_user.id that corresponds to the auth user ID
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
        
        // Check if user is a team member
        const { data: teamMember } = await adminClient
          .from('team_member')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('team_id', equipment.team_id)
          .maybeSingle();
          
        if (!teamMember) {
          return createSuccessResponse({
            has_permission: false,
            reason: 'not_team_member'
          });
        }
        
        // Get role from team_roles table
        const { data: teamRole } = await adminClient
          .from('team_roles')
          .select('role')
          .eq('team_member_id', teamMember.id)
          .single();
          
        // For edit permission on team equipment
        if (action === 'edit') {
          const canEdit = teamRole?.role && ['manager', 'owner', 'admin', 'creator'].includes(teamRole.role);
          return createSuccessResponse({
            has_permission: canEdit,
            role: teamRole?.role,
            reason: teamRole ? 'team_role' : 'insufficient_permission'
          });
        }
        
        // For view permission, any team member can view
        return createSuccessResponse({
          has_permission: true,
          role: teamRole?.role,
          reason: 'team_member'
        });
      }
      
      // Default: no permission
      return createSuccessResponse({
        has_permission: false,
        reason: 'no_permission'
      });
    }
    
    return createErrorResponse("Invalid action specified");
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Unexpected error: ${error.message}`);
  }
});
